import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { storyFile } from "./gameResources";
import {
  importLevel,
  exportLevel,
  parseStoryData,
  validateLevel,
} from "../src/core/serialization";
import { timerFromArray, timerToArray, LevelData } from "../src/store/types";
import { level, cells, packs, editor } from "./fixtures";
const raw = readFileSync(storyFile(), "utf8");
describe("metadata-preserving game JSON", () => {
  it("round trips every bundled paid level without modifying grid or timer data", () => {
    const library = parseStoryData(raw);
    let count = 0;
    for (const p of Object.values(library))
      for (const l of p.levels) {
        const { store } = editor();
        store.getState().loadLevel(l, undefined, false);
        const exported = store.getState().exportToJSON();
        expect(exported.grid).toEqual(l.grid);
        expect(exported.timers).toEqual(l.timers);
        expect(exported._id).toBe(l._id);
        expect(exported.creator).toEqual(l.creator);
        expect(exported.switches).toEqual(l.switches);
        expect(exported.gates).toEqual(l.gates);
        count++;
      }
    expect(count).toBeGreaterThanOrEqual(91);
  });
  it("pads incomplete rows for editing, preserves raw length until extended", () => {
    const { store } = editor();
    const l = level();
    l.grid.data = "12340";
    store.getState().loadLevel(l, undefined, false);
    expect(store.getState().height).toBe(2);
    expect(store.getState().grid).toHaveLength(8);
    expect(store.getState().exportToJSON().grid.data).toBe("12340");
    store.getState().paintStroke([7], "8");
    expect(store.getState().exportToJSON().grid.data).toBe("12340008");
  });
  it("keeps arbitrary level and pack fields and handles optional fields", () => {
    const l = level();
    expect(
      validateLevel({
        ...l,
        _id: undefined,
        _type: undefined,
        _ns: undefined,
        name: "",
        credits: undefined,
        timers: undefined,
      }),
    ).toMatchObject({
      _type: "level",
      _ns: "level",
      name: "Untitled level",
      credits: "",
      timers: { data: {} },
    });
    const { store } = editor();
    store.getState().initialize(packs(l));
    store.getState().metadata({ name: "New" });
    expect(store.getState().exportCollection()["10"]).toMatchObject({
      customPackData: true,
      levels: [{ name: "New", customMetadata: { keep: true } }],
    });
  });
  it("handles explicit array timer values and removes edited timer maps", () => {
    const l = cells(level(), { 2: "1" });
    const data = { ...l, timers: { data: { "2": [0, 8, 16, -4, 2, 3] } } };
    const b = importLevel(data as unknown as LevelData);
    expect(b.timers.get(2)).toEqual({
      startState: 0,
      toggleAfter: 8,
      toggleBackAfter: 16,
      rowDelay: -4,
      colDelay: 2,
      ownDelay: 3,
    });
    expect(timerToArray(timerFromArray([1, 2, 3, 4, 5, 6]))).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
    const { store } = editor();
    store
      .getState()
      .loadLevel(
        { ...l, switches: { data: {} }, gates: { data: {} } },
        undefined,
        false,
      );
    expect(store.getState().exportToJSON()).toMatchObject({
      switches: { data: {} },
      gates: { data: {} },
    });
  });
  it.each([
    null,
    [],
    5,
    "bad",
    {},
    { ...level(), width: 3 },
    { ...level(), width: 65 },
    { ...level(), width: 4.5 },
    { ...level(), grid: { data: "" } },
    { ...level(), grid: { data: "x" } },
    { ...level(), grid: { data: "0".repeat(160001) } },
    { ...level(), timers: { data: [] } },
    { ...level(), timers: { data: { "99": "[1,8,8,0,0,0]" } } },
    { ...level(), timers: { data: { x: "[1,8,8,0,0,0]" } } },
    { ...level(), timers: { data: { "1": "[1,8]" } } },
    { ...level(), timers: { data: { "1": "[2,8,8,0,0,0]" } } },
    { ...level(), timers: { data: { "1": "[1,0,8,0,0,0]" } } },
    { ...level(), timers: { data: { "1": "[1,8,0,0,0,0]" } } },
    { ...level(), timers: { data: { "1": "[1,40000,8,0,0,0]" } } },
    { ...level(), timers: { data: { "1": "[1,8,40000,0,0,0]" } } },
    { ...level(), timers: { data: { "1": "[1,8,8,40000,0,0]" } } },
    { ...level(), timers: { data: { "1": "[1,8,8,0.5,0,0]" } } },
    { ...level(), switches: { data: { "0": "I" } } },
    { ...level(), switches: { data: { "0": "A" } } },
    { ...level(), gates: { data: { "0": "A" } } },
    { ...level(), gates: { data: { "88": "A" } } },
  ])(
    "rejects invalid input before mutating the current document (%#)",
    (input) => {
      expect(() => validateLevel(input)).toThrow();
    },
  );
  it.each(["null", "[]", "{}", '{"10":{}}', '{"10":{"levels":[null]}}'])(
    "rejects malformed pack collections %s",
    (input) => expect(() => parseStoryData(input)).toThrow(),
  );
  it("exports a blank level with default type and no source metadata", () => {
    const { store } = editor();
    expect(exportLevel(store.getState())).toMatchObject({
      _type: "level",
      _id: "draft-1",
      grid: { data: "0".repeat(960) },
      timers: { data: {} },
    });
  });
});
