import { it, expect } from "vitest";
import { editor, level, packs } from "./fixtures";
import { computeDelay } from "../src/core/timer";
it("new levels extend Pack 4 without replacing its diagnostic or metadata", () => {
  const { store } = editor();
  store.getState().initialize({
    ...packs(),
    40: {
      _type: "levelpack",
      _id: "40",
      name: "A Little Push",
      treasures: "[]",
      customPackData: "keep",
      levels: [level(8, 4, "4001")],
    },
  });
  store.getState().newLevel();
  const exported = store.getState().exportCollection()["40"];
  expect(exported.levels.map((l) => l._id)).toEqual([
    "4001",
    store.getState().levelId,
  ]);
  expect(exported.customPackData).toBe("keep");
  const empty = editor();
  empty.store.getState().newLevel();
  expect(empty.store.getState().exportCollection()["40"]).toMatchObject({
    _type: "levelpack",
    _id: "40",
    _ns: "levelpack",
    treasures: "[]",
  });
});
it("normalizes extreme legal timer phases in constant time and matches the native signed-short delay", () => {
  const timer = {
    startState: 1 as const,
    toggleAfter: 1,
    toggleBackAfter: 1,
    rowDelay: 32767,
    colDelay: 32767,
    ownDelay: 32767,
  };
  // The row + real-column phase sum is even, so it normalizes to 8*row.
  const raw = 8 * 39999 - 2 + 32767;
  expect(computeDelay(39999, 63, timer)).toBe((raw << 16) >> 16);
});
