import { beforeEach, describe, it, expect, vi } from "vitest";
import { act, renderHook, fireEvent } from "@testing-library/react";
import { useShortcuts } from "../src/core/useShortcuts";
import {
  useRouteFinder,
  SolverPort,
  SolverMessage,
  browserSolverWorker,
} from "../src/core/useRouteFinder";
import { handleSolverRequest } from "../src/core/solver.worker";
import { useEditorStore } from "../src/store/editorStore";
import { SearchResult, solve } from "../src/core/solver";
import { cells, level } from "./fixtures";
import { resetUI } from "./uiFixtures";
import * as repository from "../src/core/repository";
const s = () => useEditorStore.getState();
const key = (key: string, extra: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(window, { key, ...extra });
beforeEach(() => {
  resetUI();
});
describe("keyboard workflow", () => {
  it("navigates hierarchical number menus and cancels without changing tools", () => {
    renderHook(() => useShortcuts(vi.fn()));
    key("1");
    expect(s().menu).toBe("tools");
    key("2");
    expect(s().activeTool).toBe("erase");
    expect(s().menu).toBeNull();
    key("2");
    key("9");
    expect(s().menu).toBe("fields");
    key("4");
    expect(s().activeBlockType).toBe("=");
    key("2");
    key("1");
    expect(s().activeBlockType).toBe("1");
    key("1");
    key("9");
    expect(s().menu).toBe("tools");
    key("Escape");
    expect(s().menu).toBeNull();
    key("1");
    key("Escape");
    key("2");
    key("Escape");
    key("2");
    key("9");
    key("9");
    key("Escape");
  });
  it("selects named tools, toggles arrival, starts solver/test, and ignores repeats and input-owned keys", () => {
    const find = vi.fn();
    renderHook(() => useShortcuts(find));
    for (const [k, t] of [
      ["b", "paint"],
      ["e", "erase"],
      ["l", "line"],
      ["u", "rectangle"],
      ["g", "fill"],
      ["m", "select"],
      ["i", "pick"],
    ]) {
      key(k);
      expect(s().activeTool).toBe(t);
    }
    key("t");
    expect(s().timingView).toBe("live");
    key("3");
    expect(s().timingView).toBe("arrival");
    key("4");
    key("f");
    expect(find).toHaveBeenCalledTimes(2);
    key("x", { repeat: true });
    const input = document.createElement("input");
    document.body.append(input);
    fireEvent.keyDown(input, { key: "p" });
    expect(s().test).toBeNull();
    input.remove();
    key("p");
    expect(s().test).not.toBeNull();
    key("Escape");
    key("5");
    key("Escape");
    key("Enter");
    key("Escape");
  });
  it("handles undo/redo, copy/cut/paste, selection erase, view keys and temporary pan", () => {
    renderHook(() => useShortcuts(vi.fn()));
    act(() => s().paintStroke([0], "1"));
    key("z", { metaKey: true });
    expect(s().grid[0]).toBe("0");
    key("z", { ctrlKey: true, shiftKey: true });
    expect(s().grid[0]).toBe("1");
    key("z", { ctrlKey: true });
    key("y", { ctrlKey: true });
    expect(s().grid[0]).toBe("1");
    act(() => s().set({ selectedIndex: 0 }));
    key("c", { metaKey: true });
    act(() => s().set({ hoverIndex: 1 }));
    key("v", { metaKey: true });
    expect(s().grid[1]).toBe("1");
    key("x", { metaKey: true });
    expect(s().grid[1]).toBe("0");
    key("a", { metaKey: true });
    expect(s().selection).toHaveLength(32);
    key("Delete");
    expect(s().grid.every((c) => c === "0")).toBe(true);
    key("Backspace");
    key("q", { metaKey: true });
    const zoom = s().zoom;
    key("+");
    expect(s().zoom).toBeGreaterThan(zoom);
    key("-");
    key("0");
    expect(s().zoom).toBe(1.25);
    key("Home");
    expect(s().scrollY).toBe(s().height * 16 - 270);
    key("End");
    expect(s().scrollY).toBe(-40);
    key(" ");
    expect(s().panHeld).toBe(true);
    fireEvent.keyUp(window, { code: "Space" });
    expect(s().panHeld).toBe(false);
    key(" ");
    fireEvent.blur(window);
    expect(s().panHeld).toBe(false);
    key("?");
    expect(s().showDialog).toBe("help");
    key("Escape");
    expect(s().showDialog).toBeNull();
  });
  it("cancels a gesture or clears selection; text fields and dialogs own typing and shortcuts", () => {
    const save = vi.spyOn(repository, "saveRepository").mockResolvedValue();
    renderHook(() => useShortcuts(vi.fn()));
    act(() => {
      s().beginGesture();
      s().paintStroke([0], "1");
    });
    key("Escape");
    expect(s().grid[0]).toBe("0");
    act(() => s().set({ selection: [0], selectedIndex: 0 }));
    key("Escape");
    expect(s().selection).toEqual([]);
    key("s", { metaKey: true });
    expect(save).toHaveBeenCalledTimes(1);
    act(() => s().set({ showDialog: "import" }));
    key("s", { metaKey: true });
    key("b");
    expect(save).toHaveBeenCalledTimes(1);
    key("Escape");
    expect(s().showDialog).toBeNull();
  });
  it("steers in playtest, pauses/steps/restarts/returns, and ignores key repeats", () => {
    renderHook(() => useShortcuts(vi.fn()));
    key("p");
    key("ArrowLeft");
    expect(s().testDirection).toBe(-1);
    key("ArrowRight");
    expect(s().testDirection).toBe(1);
    key(" ", { repeat: true });
    expect(s().testPlaying).toBe(true);
    key(" ");
    expect(s().testPlaying).toBe(false);
    key("ArrowUp");
    expect(s().test?.row).toBe(1);
    key("ArrowDown");
    expect(s().test?.row).toBe(2);
    key("r");
    expect(s().test?.row).toBe(0);
    key("z", { metaKey: true });
    key("Escape");
    expect(s().test).toBeNull();
  });
});
class SearchDouble implements SolverPort {
  send = vi.fn<SolverPort["send"]>();
  stop = vi.fn();
  message: ((data: SolverMessage) => void) | null = null;
  error: ((message: string) => void) | null = null;
  listen(
    message: (data: SolverMessage) => void,
    error: (message: string) => void,
  ) {
    this.message = message;
    this.error = error;
  }
  emit(data: SolverMessage) {
    this.message?.(data);
  }
}
const result: SearchResult = {
  status: "optimal",
  score: 700,
  turns: 2,
  stars: 2,
  crashes: 0,
  expanded: 55,
  path: [],
};
describe("injected route worker lifecycle", () => {
  it("requires a finish line; sends typed rules, reports progress/results and rejects stale cancelled work", () => {
    const workers: SearchDouble[] = [],
      factory = () => {
        const w = new SearchDouble();
        workers.push(w);
        return w;
      };
    const { result: hook } = renderHook(() => useRouteFinder(factory));
    act(() => hook.current());
    expect(s().notice).toMatch(/finish/);
    act(() => s().paintStroke([31], "7"));
    act(() => hook.current());
    const w = workers[0];
    expect(w.send).toHaveBeenCalledWith(
      expect.objectContaining({ options: { allowDamage: false } }),
    );
    act(() => w.emit({ type: "progress", expanded: 20, score: null }));
    expect(s().searchExpanded).toBe(20);
    act(() => hook.current());
    expect(w.stop).toHaveBeenCalled();
    act(() => w.emit({ type: "result", result }));
    expect(s().route).toBeNull();
    act(() => hook.current());
    act(() => workers[1].emit({ type: "result", result }));
    expect(s().notice).toContain("collision-free");
    expect(s().route).toEqual(result);
  });
  it("cancels on edits/level changes/policy changes and handles error messages and worker failures", () => {
    resetUI(cells(level(), { 31: "7" }));
    const workers: SearchDouble[] = [],
      factory = () => {
        const w = new SearchDouble();
        workers.push(w);
        return w;
      };
    const hook = renderHook(() => useRouteFinder(factory));
    act(() => hook.result.current());
    act(() => s().paintStroke([0], "1"));
    expect(workers[0].stop).toHaveBeenCalled();
    act(() => workers[0].error?.("stale"));
    expect(s().notice).not.toContain("stale");
    act(() => hook.result.current());
    act(() => workers[1].emit({ type: "error", error: "bad input" }));
    expect(s().notice).toContain("bad input");
    act(() => hook.result.current());
    act(() => workers[2].error?.("crashed"));
    expect(s().notice).toContain("crashed");
    act(() => hook.result.current());
    act(() => s().set({ allowDamage: true }));
    expect(workers[3].stop).toHaveBeenCalled();
    act(() => hook.result.current());
    act(() =>
      workers[4].emit({
        type: "result",
        result: { ...result, status: "limited" },
      }),
    );
    expect(s().notice).toContain("unproved");
    act(() => hook.result.current());
    act(() =>
      workers[5].emit({
        type: "result",
        result: { ...result, status: "unreachable" },
      }),
    );
    expect(s().notice).toContain("No route");
    act(() => hook.result.current());
    act(() => workers[6].emit({ type: "result", result }));
    expect(s().notice).not.toContain("collision-free");
    act(() => hook.result.current());
    hook.unmount();
    expect(workers[7].stop).toHaveBeenCalled();
  });
  it("native worker adapter posts typed requests, events and termination", () => {
    let created: WorkerDouble | null = null;
    class WorkerDouble {
      onmessage: ((e: MessageEvent<SolverMessage>) => void) | null = null;
      onerror: ((e: { message: string }) => void) | null = null;
      postMessage = vi.fn();
      terminate = vi.fn();
      constructor() {
        created = this;
      }
    }
    vi.stubGlobal("Worker", WorkerDouble);
    const port = browserSolverWorker(),
      message = vi.fn(),
      error = vi.fn();
    port.listen(message, error);
    const w = created as unknown as WorkerDouble;
    w.onmessage?.(
      new MessageEvent("message", {
        data: { type: "progress", expanded: 1, score: null },
      }),
    );
    w.onerror?.({ message: "oops" });
    port.send({ board: s(), options: { allowDamage: false } });
    port.stop();
    expect(message).toHaveBeenCalledWith({
      type: "progress",
      expanded: 1,
      score: null,
    });
    expect(error).toHaveBeenCalledWith("oops");
    expect(w.postMessage).toHaveBeenCalled();
    expect(w.terminate).toHaveBeenCalled();
  });
  it("worker entry returns results/progress and serializes thrown errors", () => {
    const post = vi.fn<(data: SolverMessage) => void>();
    const request = { board: s(), options: { allowDamage: false } };
    handleSolverRequest(request, post, (_board, _options, progress) => {
      progress?.(10, 20);
      return result;
    });
    expect(post).toHaveBeenCalledWith({
      type: "progress",
      expanded: 10,
      score: 20,
    });
    expect(post).toHaveBeenCalledWith({ type: "result", result });
    const fail: typeof solve = () => {
      throw new Error("failed");
    };
    handleSolverRequest(request, post, fail);
    expect(post).toHaveBeenCalledWith({
      type: "error",
      error: "Error: failed",
    });
    handleSolverRequest(request, post);
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({ type: "result" }),
    );
    const workerPost = vi
      .spyOn(self, "postMessage")
      .mockImplementation(() => {});
    self.onmessage?.call(self, new MessageEvent("message", { data: request }));
    expect(workerPost).toHaveBeenCalled();
  });
});
