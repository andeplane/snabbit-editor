import { vi } from "vitest";
import { BlockChar, LevelData, LevelPackData } from "../src/store/types";
import {
  createEditorStore,
  EditorDependencies,
} from "../src/store/editorStore";
export function level(rows = 8, width = 4, id = "test"): LevelData {
  return {
    _type: "level",
    _id: id,
    _ns: "level",
    name: "Test level",
    credits: "Designer",
    published: 1,
    width,
    grid: { data: "0".repeat(rows * width) },
    timers: { data: {} },
    customMetadata: { keep: true },
  };
}
export function cells(
  data: LevelData,
  entries: Record<number, BlockChar>,
): LevelData {
  const grid = [...data.grid.data];
  for (const [i, c] of Object.entries(entries)) grid[+i] = c;
  return { ...data, grid: { data: grid.join("") } };
}
export function packs(
  data: LevelData = level(),
): Record<string, LevelPackData> {
  return {
    "10": {
      _type: "levelpack",
      name: "Test pack",
      levels: [data],
      customPackData: true,
    },
  };
}
export function editor(initial: string | null = null) {
  let storage = initial,
    seq = 0;
  const scheduled = new Map<number, () => void>();
  const deps: EditorDependencies = {
    storage: {
      read: vi.fn(() => storage),
      write: vi.fn((s: string) => {
        storage = s;
      }),
    },
    newId: () => `draft-${++seq}`,
    schedule: vi.fn((fn) => {
      const id = ++seq;
      scheduled.set(id, fn);
      return id;
    }),
    cancel: vi.fn((handle) => {
      scheduled.delete(Number(handle));
    }),
  };
  const store = createEditorStore(deps);
  return {
    store,
    deps,
    flush: () => {
      for (const fn of scheduled.values()) fn();
      scheduled.clear();
    },
    read: () => storage,
  };
}
