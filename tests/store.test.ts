import { describe, it, expect, vi } from "vitest";
import { browserDependencies } from "../src/store/editorStore";
import { level, cells, packs, editor } from "./fixtures";
const timer = {
  startState: 1 as const,
  toggleAfter: 8,
  toggleBackAfter: 8,
  rowDelay: 0,
  colDelay: 0,
  ownDelay: 0,
};
describe("document editing with injected storage and clock", () => {
  it("groups a stroke, removes timer/channel metadata on erase, and restores everything on undo/redo", () => {
    const { store, flush, read } = editor();
    store.getState().initialize(packs(cells(level(), { 1: "1", 2: "=" })));
    store.getState().setTimer([1], timer);
    store.getState().setChannel([1, 2], "B");
    store.getState().set({ undoStack: [] });
    store.getState().beginGesture();
    store.getState().beginGesture();
    store.getState().paintStroke([1, 2, -1, 999, 1], "0");
    expect(store.getState().undoStack).toHaveLength(0);
    store.getState().endGesture();
    expect(store.getState().undoStack).toHaveLength(1);
    expect(store.getState().timers.size).toBe(0);
    expect(store.getState().switches.size).toBe(0);
    expect(store.getState().gates.size).toBe(0);
    store.getState().undo();
    expect(store.getState().grid.slice(1, 3)).toEqual(["1", "="]);
    expect(store.getState().timers.get(1)).toEqual(timer);
    expect(store.getState().switches.get(2)).toBe("B");
    store.getState().redo();
    expect(store.getState().grid.slice(1, 3)).toEqual(["0", "0"]);
    flush();
    expect(read()).toContain("test");
    expect(store.getState().savedRevision).toBe(store.getState().revision);
  });
  it("cancels gestures, ignores identical strokes, caps history, clears redo after an edit", () => {
    const { store } = editor();
    const s = () => store.getState();
    s().beginGesture();
    s().paintStroke([0], "1");
    s().cancelGesture();
    expect(s().grid[0]).toBe("0");
    s().cancelGesture();
    s().beginGesture();
    s().paintStroke([0], "0");
    s().endGesture();
    s().endGesture();
    expect(s().undoStack).toHaveLength(0);
    for (let i = 0; i < 100; i++) s().paintStroke([0], i % 2 ? "1" : "2");
    expect(s().undoStack).toHaveLength(80);
    s().undo();
    expect(s().redoStack.length).toBe(1);
    s().paintStroke([1], "4");
    expect(s().redoStack).toHaveLength(0);
    s().set({ undoStack: [], redoStack: [] });
    s().undo();
    s().redo();
  });
  it("copies and pastes rectangular content including timers/channels, clips at edges and has one undo", () => {
    const { store } = editor();
    const s = () => store.getState();
    s().loadLevel(cells(level(), { 0: "1", 1: "=", 4: "4" }), undefined, false);
    s().setTimer([0], timer);
    s().setChannel([0, 1], "C");
    s().set({ selection: [0, 1, 4], selectedIndex: 0 });
    s().copy();
    s().set({ hoverIndex: 6 });
    s().paste();
    expect(s().grid[6]).toBe("1");
    expect(s().grid[7]).toBe("=");
    expect(s().grid[10]).toBe("4");
    expect(s().gates.get(6)).toBe("C");
    expect(s().switches.get(7)).toBe("C");
    expect(s().timers.get(6)).toEqual(timer);
    s().undo();
    expect(s().grid[6]).toBe("0");
    s().redo();
    expect(s().grid[6]).toBe("1");
    s().set({ hoverIndex: 31 });
    s().paste();
    expect(s().selection).toEqual([31]);
    s().deleteSelection();
    expect(s().grid[31]).toBe("0");
    s().set({ selection: [], selectedIndex: 0, hoverIndex: null });
    s().copy();
    s().paste();
    s().deleteSelection();
    s().set({ selection: [], selectedIndex: null, clipboard: [] });
    s().copy();
    s().paste();
    s().deleteSelection();
  });
  it("pastes untimed cells over timed/gated/switch cells and supports default anchor", () => {
    const { store } = editor();
    const s = () => store.getState();
    s().loadLevel(cells(level(), { 0: "1", 1: "=" }), undefined, false);
    s().setTimer([0], timer);
    s().setChannel([0, 1], "A");
    s().set({
      clipboard: [
        { r: 0, c: 0, type: "0" },
        { r: 0, c: 1, type: "0" },
      ],
      selectedIndex: null,
      hoverIndex: null,
    });
    s().paste();
    expect(s().timers.size).toBe(0);
    expect(s().gates.size).toBe(0);
    expect(s().switches.size).toBe(0);
  });
  it("resizes/remaps and undoes cropped data; invalid or no-op sizes do nothing", () => {
    const { store } = editor();
    const s = () => store.getState();
    s().loadLevel(cells(level(), { 5: "1", 6: "=" }), undefined, false);
    s().setTimer([5], timer);
    s().setChannel([5, 6], "H");
    const original = s().grid;
    s().resize(6, 10);
    expect(s().grid[7]).toBe("1");
    expect(s().timers.get(7)).toEqual(timer);
    expect(s().gates.get(7)).toBe("H");
    expect(s().switches.get(8)).toBe("H");
    s().undo();
    expect(s().grid).toBe(original);
    s().resize(4, 4);
    expect(s().height).toBe(4);
    s().undo();
    for (const size of [
      [3, 8],
      [65, 8],
      [4, 3],
      [4.2, 8],
      [4, 8.1],
      [64, 10000],
      [4, 8],
    ])
      s().resize(size[0], size[1]);
    expect(s().grid).toBe(original);
  });
  it("only adds timers to nonempty valid cells, and removes only existing timers", () => {
    const { store } = editor();
    const s = () => store.getState();
    s().loadLevel(cells(level(), { 1: "1" }), undefined, false);
    const rev = s().revision;
    s().setTimer([-1, 99, 0], timer);
    expect(s().revision).toBe(rev);
    s().setTimer([1], null);
    expect(s().revision).toBe(rev);
    s().setTimer([1], timer);
    s().setTimer([1], null);
    expect(s().timers.size).toBe(0);
    s().setChannel([0], "A");
    s().setChannel([1], "I");
    s().setChannel([1], null);
    s().paintStroke([1], "=");
    s().setChannel([1], "D");
    s().setChannel([1], null);
    expect(s().switches.size).toBe(0);
  });
  it("persists before level changes and restores drafts; imports are undoable and take precedence", () => {
    const { store, flush } = editor();
    const s = () => store.getState();
    const a = level(),
      b = level(8, 4, "second");
    s().initialize(packs(a));
    s().metadata({ name: "Draft name" });
    s().loadLevel(b, "drafts");
    expect(s().drafts.test.name).toBe("Draft name");
    s().loadLevel(a, "10");
    expect(s().name).toBe("Draft name");
    s().metadata({ credits: "Author" });
    s().loadLevel({ ...a, name: "Import" }, "10", false);
    expect(s().name).toBe("Import");
    s().undo();
    expect(s().credits).toBe("Author");
    s().newLevel();
    expect(s().name).toBe("Untitled level");
    expect(s().drafts[s().levelId]).toBeDefined();
    flush();
    const collection = s().exportCollection();
    expect(collection["40"].name).toBe("A Little Push");
    expect(collection["10"].levels[0].name).toBe("Draft name");
  });
  it("recovers storage selection, optional pack, fallback IDs, broken entries, and reports read/write failures", () => {
    const valid = level();
    const initial = JSON.stringify({
      drafts: {
        test: { ...valid, name: "Recovered" },
        bad: { ...valid, width: 0 },
      },
      levelId: "test",
      activePack: "drafts",
    });
    const { store } = editor(initial);
    store.getState().initialize(packs());
    expect(store.getState().name).toBe("Recovered");
    expect(store.getState().storageError).toMatch(/invalid draft/);
    for (const raw of [
      "{",
      JSON.stringify({ levelId: "missing" }),
      JSON.stringify({ levelId: "test" }),
    ]) {
      const e = editor(raw);
      e.store.getState().initialize(packs());
      expect(e.store.getState().levelId).toBe("test");
    }
    const fail = editor();
    fail.deps.storage.read = () => {
      throw new Error("denied");
    };
    fail.store.getState().initialize({});
    expect(fail.store.getState().storageError).toMatch(/recovery failed/);
    fail.deps.storage.write = () => {
      throw new Error("full");
    };
    fail.store.getState().saveDraft();
    expect(fail.store.getState().storageError).toMatch(/storage is full/);
    fail.store.getState().loadLevel(valid);
    expect(fail.store.getState().levelId).toBe("test");
  });
  it("preserves optional metadata and makes reset-to-original undoable", () => {
    const { store } = editor();
    const s = () => store.getState();
    const data = { ...level(), credits: undefined, published: undefined };
    s().initialize(packs(data));
    expect(s().credits).toBe("");
    s().metadata({ name: "Edited" });
    s().resetToOriginal();
    expect(s().name).toBe("Test level");
    s().undo();
    expect(s().name).toBe("Edited");
    s().newLevel();
    s().resetToOriginal();
    expect(s().name).toBe("Untitled level");
  });
  it("playtest does not mutate documents; pause, route replay, completion, restart and exit preserve editing view", () => {
    const { store } = editor();
    const s = () => store.getState();
    s().loadLevel(cells(level(), { 1: "7" }));
    s().set({ scrollX: 12, scrollY: 34, timingView: "arrival" });
    s().startTest();
    const grid = s().grid;
    s().set({ testPlaying: false });
    s().stepTest();
    expect(s().test?.status).toBe("finished");
    s().stepTest();
    expect(s().grid).toBe(grid);
    s().startTest();
    expect(s().test?.score).toBe(0);
    s().exitTest();
    expect(s()).toMatchObject({
      scrollX: 12,
      scrollY: 34,
      timingView: "arrival",
      test: null,
    });
    s().exitTest();
    s().stepTest();
    s().startTest(true);
    expect(s().testPlaying).toBe(false);
    s().exitTest();
    s().set({
      route: {
        status: "optimal",
        expanded: 1,
        score: 0,
        turns: 0,
        stars: 0,
        crashes: 0,
        path: [
          { row: 0, col: 1, direction: 1, time: 0 },
          { row: 1, col: 1, direction: -1, time: 8 },
        ],
      },
    });
    s().startTest(true);
    s().stepTest();
    expect(s().test?.direction).toBe(-1);
    s().exitTest();
  });
  it("blocks document changes during a playtest", () => {
    const { store } = editor();
    const s = () => store.getState();
    s().loadLevel(cells(level(), { 1: "1" }));
    s().startTest();
    const original = s().grid,
      rev = s().revision;
    s().beginGesture();
    s().paintStroke([0], "4");
    s().setTimer([1], timer);
    s().setChannel([1], "A");
    s().metadata({ name: "NO" });
    s().resize(9, 9);
    s().undo();
    s().redo();
    s().paste();
    expect(s().grid).toBe(original);
    expect(s().revision).toBe(rev);
    s().exitTest();
  });
  it("browser dependency adapters round-trip local storage, IDs and scheduled cancellation", () => {
    vi.useFakeTimers();
    browserDependencies.storage.write("test");
    expect(browserDependencies.storage.read()).toBe("test");
    expect(browserDependencies.newId()).toMatch(/-/);
    const fn = vi.fn();
    const handle = browserDependencies.schedule(fn, 5);
    browserDependencies.cancel(handle);
    vi.runAllTimers();
    expect(fn).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
