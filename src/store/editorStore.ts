import { create } from "zustand";
import {
  BlockChar,
  TimerParams,
  Tool,
  TimingView,
  Menu,
  LevelData,
  LevelPackData,
} from "./types";
import { importLevel, exportLevel } from "../core/serialization";
import { startRun, advanceRun, Direction, RunState } from "../core/simulation";
import type { SearchResult } from "../core/solver";
export interface DocumentState {
  width: number;
  height: number;
  grid: BlockChar[];
  timers: Map<number, TimerParams>;
  switches: Map<number, string>;
  gates: Map<number, string>;
  name: string;
  credits: string;
  levelId: string;
  published: number;
  source: LevelData | null;
}
interface ClipboardCell {
  r: number;
  c: number;
  type: BlockChar;
  timer?: TimerParams;
  switchGroup?: string;
  gateGroup?: string;
}
export interface EditorState extends DocumentState {
  repoHash: string | null;
  saving: boolean;
  panHeld: boolean;
  library: Record<string, LevelPackData>;
  drafts: Record<string, LevelData>;
  libraryReady: boolean;
  libraryError: string;
  activePack: string;
  filter: string;
  storageError: string;
  notice: string;
  activeTool: Tool;
  activeBlockType: BlockChar;
  menu: Menu;
  selectedIndex: number | null;
  selection: number[];
  hoverIndex: number | null;
  clipboard: ClipboardCell[];
  scrollY: number;
  scrollX: number;
  zoom: number;
  showGrid: boolean;
  timingView: TimingView;
  playbackTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  undoStack: DocumentState[];
  redoStack: DocumentState[];
  gesture: DocumentState | null;
  revision: number;
  savedRevision: number;
  test: RunState | null;
  testPlaying: boolean;
  testDirection: Direction;
  testAutopilot: boolean;
  editView: { scrollX: number; scrollY: number; timingView: TimingView } | null;
  route: SearchResult | null;
  searchRunning: boolean;
  searchExpanded: number;
  allowDamage: boolean;
  showDialog: "import" | "export" | "help" | null;
  initialize: (library: Record<string, LevelPackData>) => void;
  set: (patch: Partial<EditorState>) => void;
  loadLevel: (data: LevelData, pack?: string, useDraft?: boolean) => void;
  newLevel: () => void;
  beginGesture: () => void;
  endGesture: () => void;
  cancelGesture: () => void;
  paintStroke: (indices: number[], type: BlockChar) => void;
  setTimer: (indices: number[], params: TimerParams | null) => void;
  setChannel: (indices: number[], group: string | null) => void;
  metadata: (patch: Partial<Pick<DocumentState, "name" | "credits">>) => void;
  resize: (width: number, height: number) => void;
  undo: () => void;
  redo: () => void;
  copy: () => void;
  paste: () => void;
  deleteSelection: () => void;
  startTest: (autopilot?: boolean) => void;
  stepTest: () => void;
  exitTest: () => void;
  exportToJSON: () => LevelData;
  exportCollection: () => Record<string, LevelPackData>;
  saveDraft: () => void;
  resetToOriginal: () => void;
}
const STORAGE = "snabbit-workshop-v1";
function blank(newId: () => string): DocumentState {
  return {
    width: 16,
    height: 60,
    grid: new Array(960).fill("0") as BlockChar[],
    timers: new Map(),
    switches: new Map(),
    gates: new Map(),
    name: "Untitled level",
    credits: "",
    levelId: newId(),
    published: 0,
    source: null,
  };
}
function document(s: DocumentState): DocumentState {
  return {
    width: s.width,
    height: s.height,
    grid: s.grid,
    timers: s.timers,
    switches: s.switches,
    gates: s.gates,
    name: s.name,
    credits: s.credits,
    levelId: s.levelId,
    published: s.published,
    source: s.source,
  };
}
function fromLevel(d: LevelData): DocumentState {
  return {
    ...importLevel(d),
    name: d.name,
    credits: d.credits ?? "",
    levelId: d._id,
    published: d.published ?? 0,
    source: d,
  };
}
function history(s: EditorState): Partial<EditorState> {
  return {
    undoStack: [...s.undoStack.slice(-79), document(s)],
    redoStack: [],
    revision: s.revision + 1,
    route: null,
  };
}
function edit(s: EditorState): Partial<EditorState> {
  return s.gesture ? { revision: s.revision + 1, route: null } : history(s);
}
export interface EditorDependencies {
  storage: { read: () => string | null; write: (value: string) => void };
  newId: () => string;
  schedule: (fn: () => void, ms: number) => unknown;
  cancel: (handle: unknown) => void;
}
export const browserDependencies: EditorDependencies = {
  storage: {
    read: () => localStorage.getItem(STORAGE),
    write: (value) => localStorage.setItem(STORAGE, value),
  },
  newId: () => crypto.randomUUID(),
  schedule: (fn, ms) => setTimeout(fn, ms),
  cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};
export function createEditorStore(
  deps: EditorDependencies = browserDependencies,
) {
  function saved(
    drafts: Record<string, LevelData>,
    levelId: string,
    activePack: string,
  ) {
    deps.storage.write(JSON.stringify({ drafts, levelId, activePack }));
  }
  const store = create<EditorState>((set, get) => ({
    ...blank(deps.newId),
    repoHash: null,
    saving: false,
    panHeld: false,
    library: {},
    drafts: {},
    libraryReady: false,
    libraryError: "",
    activePack: "10",
    filter: "",
    storageError: "",
    notice: "",
    activeTool: "paint",
    activeBlockType: "1",
    menu: null,
    selectedIndex: null,
    selection: [],
    hoverIndex: null,
    clipboard: [],
    scrollY: 0,
    scrollX: 0,
    zoom: 1.4,
    showGrid: true,
    timingView: "arrival",
    playbackTime: 0,
    isPlaying: false,
    playbackSpeed: 2,
    undoStack: [],
    redoStack: [],
    gesture: null,
    revision: 0,
    savedRevision: 0,
    test: null,
    testPlaying: false,
    testDirection: 1,
    testAutopilot: false,
    editView: null,
    route: null,
    searchRunning: false,
    searchExpanded: 0,
    allowDamage: false,
    showDialog: null,
    set: (patch) => set(patch),
    initialize: (library) => {
      let drafts: Record<string, LevelData> = {},
        levelId = "",
        activePack = "10",
        storageError = "";
      try {
        const raw = deps.storage.read();
        if (raw) {
          const data = JSON.parse(raw);
          drafts = data.drafts ?? {};
          levelId = data.levelId;
          activePack = data.activePack ?? "10";
        }
      } catch {
        storageError =
          "Draft recovery failed. Export regularly; browser storage may be unavailable.";
      }
      // Validate drafts before allowing a corrupt entry to break startup.
      for (const [id, draft] of Object.entries(drafts)) {
        try {
          importLevel(draft);
        } catch {
          delete drafts[id];
          storageError = "An invalid draft was skipped during recovery.";
        }
      }
      const first = Object.values(library)[0]?.levels[0];
      const initial =
        drafts[levelId] ??
        Object.values(library)
          .flatMap((p) => p.levels)
          .find((l) => l._id === levelId) ??
        first;
      set({
        library,
        drafts,
        libraryReady: true,
        libraryError: "",
        activePack,
        storageError,
      });
      if (initial) {
        set({
          ...fromLevel(initial),
          scrollY: Math.max(
            0,
            Math.ceil(initial.grid.data.length / initial.width) * 16 - 270,
          ),
        });
      }
    },
    saveDraft: () => {
      const s = get();
      const drafts = { ...s.drafts, [s.levelId]: exportLevel(s) };
      try {
        saved(drafts, s.levelId, s.activePack);
        set({ drafts, savedRevision: s.revision, storageError: "" });
      } catch {
        set({
          drafts,
          storageError:
            "Browser storage is full or unavailable. Download an export to keep your work.",
        });
      }
    },
    loadLevel: (data, pack, useDraft = true) => {
      const parsed = fromLevel(data); // Validate before touching current work.
      const s = get();
      if (s.revision !== s.savedRevision) s.saveDraft();
      const draft = useDraft ? get().drafts[data._id] : undefined;
      set({
        ...(draft ? fromLevel(draft) : parsed),
        activePack: pack ?? s.activePack,
        revision: useDraft ? 0 : 1,
        savedRevision: 0,
        undoStack: useDraft ? [] : [document(s)],
        redoStack: [],
        gesture: null,
        selection: [],
        selectedIndex: null,
        route: null,
        test: null,
        testPlaying: false,
        isPlaying: false,
        playbackTime: 0,
        scrollX: 0,
        scrollY: Math.max(
          0,
          (draft
            ? Math.ceil(draft.grid.data.length / draft.width)
            : parsed.height) *
            16 -
            270,
        ),
        notice: "",
      });
      try {
        saved(get().drafts, data._id, get().activePack);
      } catch {
        /* next autosave reports it */
      }
    },
    newLevel: () => {
      const s = get();
      if (s.revision !== s.savedRevision) s.saveDraft();
      const d = blank(deps.newId);
      set({
        ...d,
        activePack: "drafts",
        revision: 1,
        savedRevision: 0,
        undoStack: [],
        redoStack: [],
        gesture: null,
        selection: [],
        selectedIndex: null,
        route: null,
        test: null,
        testPlaying: false,
        isPlaying: false,
        playbackTime: 0,
        scrollX: 0,
        scrollY: d.height * 16 - 270,
        notice: "New level. Place a finish line to define the goal.",
      });
      get().saveDraft();
    },
    beginGesture: () => {
      if (!get().test && !get().gesture) set({ gesture: document(get()) });
    },
    endGesture: () => {
      const s = get();
      if (!s.gesture) return;
      const changed =
        s.grid !== s.gesture.grid || s.timers !== s.gesture.timers;
      set({
        undoStack: changed
          ? [...s.undoStack.slice(-79), s.gesture]
          : s.undoStack,
        redoStack: changed ? [] : s.redoStack,
        gesture: null,
      });
    },
    cancelGesture: () => {
      const s = get();
      if (s.gesture)
        set({ ...s.gesture, gesture: null, revision: s.revision + 1 });
    },
    paintStroke: (indices, type) => {
      const s = get();
      if (s.test) return;
      const grid = [...s.grid],
        timers = new Map(s.timers),
        switches = new Map(s.switches),
        gates = new Map(s.gates);
      let changed = false;
      for (const idx of new Set(indices)) {
        if (
          idx < 0 ||
          idx >= grid.length ||
          (grid[idx] === type && (type !== "0" || !timers.has(idx)))
        )
          continue;
        grid[idx] = type;
        if (type === "0" || type === "=") timers.delete(idx);
        if (type !== "=") switches.delete(idx);
        if (!"123".includes(type)) gates.delete(idx);
        changed = true;
      }
      if (changed) set({ grid, timers, switches, gates, ...edit(s) });
    },
    setTimer: (indices, params) => {
      const s = get();
      if (s.test) return;
      const timers = new Map(s.timers);
      let changed = false;
      for (const idx of indices)
        if (idx >= 0 && idx < s.grid.length && s.grid[idx] !== "0") {
          if (params) {
            timers.set(idx, { ...params });
            changed = true;
          } else {
            changed = timers.delete(idx) || changed;
          }
        }
      if (changed) set({ timers, ...history(s) });
    },
    setChannel: (indices, group) => {
      const s = get();
      if (s.test || (group && !/^[A-H]$/.test(group))) return;
      const switches = new Map(s.switches),
        gates = new Map(s.gates);
      for (const idx of indices) {
        const map =
          s.grid[idx] === "="
            ? switches
            : "123".includes(s.grid[idx])
              ? gates
              : null;
        if (map) {
          if (group) map.set(idx, group);
          else map.delete(idx);
        }
      }
      set({ switches, gates, ...history(s) });
    },
    metadata: (patch) => {
      const s = get();
      if (!s.test) set({ ...patch, ...history(s) });
    },
    resize: (width, height) => {
      const s = get();
      if (
        s.test ||
        !Number.isInteger(width) ||
        !Number.isInteger(height) ||
        width < 4 ||
        width > 64 ||
        height < 4 ||
        width * height > 160000 ||
        (width === s.width && height === s.height)
      )
        return;
      const grid = new Array(width * height).fill("0") as BlockChar[],
        timers = new Map<number, TimerParams>(),
        switches = new Map<number, string>(),
        gates = new Map<number, string>();
      for (let r = 0; r < Math.min(height, s.height); r++)
        for (let c = 0; c < Math.min(width, s.width); c++) {
          const old = r * s.width + c,
            idx = r * width + c;
          grid[idx] = s.grid[old];
          const t = s.timers.get(old);
          if (t) timers.set(idx, t);
          const sw = s.switches.get(old),
            g = s.gates.get(old);
          if (sw) switches.set(idx, sw);
          if (g) gates.set(idx, g);
        }
      set({
        grid,
        timers,
        switches,
        gates,
        width,
        height,
        selection: [],
        selectedIndex: null,
        ...history(s),
      });
    },
    undo: () => {
      const s = get();
      if (s.test || !s.undoStack.length) return;
      const prev = s.undoStack.at(-1)!;
      set({
        ...prev,
        undoStack: s.undoStack.slice(0, -1),
        redoStack: [...s.redoStack, document(s)],
        selection: [],
        selectedIndex: null,
        revision: s.revision + 1,
        route: null,
      });
    },
    redo: () => {
      const s = get();
      if (s.test || !s.redoStack.length) return;
      const next = s.redoStack.at(-1)!;
      set({
        ...next,
        redoStack: s.redoStack.slice(0, -1),
        undoStack: [...s.undoStack, document(s)],
        selection: [],
        selectedIndex: null,
        revision: s.revision + 1,
        route: null,
      });
    },
    copy: () => {
      const s = get(),
        indices = s.selection.length
          ? s.selection
          : s.selectedIndex !== null
            ? [s.selectedIndex]
            : [];
      if (!indices.length) return;
      const minR = indices.reduce(
          (a, i) => Math.min(a, Math.floor(i / s.width)),
          Infinity,
        ),
        minC = indices.reduce((a, i) => Math.min(a, i % s.width), Infinity);
      set({
        clipboard: indices.map((i) => ({
          r: Math.floor(i / s.width) - minR,
          c: (i % s.width) - minC,
          type: s.grid[i],
          timer: s.timers.get(i),
          switchGroup: s.switches.get(i),
          gateGroup: s.gates.get(i),
        })),
        notice: `Copied ${indices.length} cells. Hover a destination and paste.`,
      });
    },
    paste: () => {
      const s = get();
      if (s.test || !s.clipboard.length) return;
      const anchor = s.hoverIndex ?? s.selectedIndex ?? 0;
      const r = Math.floor(anchor / s.width),
        c = anchor % s.width,
        grid = [...s.grid],
        timers = new Map(s.timers),
        switches = new Map(s.switches),
        gates = new Map(s.gates),
        selection: number[] = [];
      for (const cell of s.clipboard)
        if (r + cell.r < s.height && c + cell.c < s.width) {
          const i = (r + cell.r) * s.width + c + cell.c;
          grid[i] = cell.type;
          if (cell.timer) timers.set(i, { ...cell.timer });
          else timers.delete(i);
          if (cell.switchGroup) switches.set(i, cell.switchGroup);
          else switches.delete(i);
          if (cell.gateGroup) gates.set(i, cell.gateGroup);
          else gates.delete(i);
          selection.push(i);
        }
      set({
        grid,
        timers,
        switches,
        gates,
        selection,
        selectedIndex: anchor,
        ...history(s),
        notice: `Pasted ${selection.length} cells.`,
      });
    },
    deleteSelection: () => {
      const s = get();
      s.paintStroke(
        s.selection.length
          ? s.selection
          : s.selectedIndex !== null
            ? [s.selectedIndex]
            : [],
        "0",
      );
    },
    startTest: (autopilot = false) => {
      const s = get();
      s.endGesture();
      set({
        test: startRun(s),
        testDirection: 1,
        testPlaying: !autopilot || !!s.route?.path.length,
        testAutopilot: autopilot,
        editView: s.editView ?? {
          scrollX: s.scrollX,
          scrollY: s.scrollY,
          timingView: s.timingView,
        },
        isPlaying: false,
        menu: null,
      });
    },
    stepTest: () => {
      const s = get();
      if (!s.test || s.test.status !== "running") return;
      const pathStep = s.testAutopilot
        ? s.route?.path.find((p) => p.time === s.test!.time + 8)
        : null;
      const test = advanceRun(
        s,
        s.test,
        pathStep?.direction ?? s.testDirection,
      );
      set({
        test,
        testPlaying: test.status === "running" && s.testPlaying,
        playbackTime: test.time,
      });
    },
    exitTest: () => {
      const s = get();
      set({
        test: null,
        testPlaying: false,
        testAutopilot: false,
        playbackTime: 0,
        ...(s.editView ?? {}),
        editView: null,
      });
    },
    exportToJSON: () => exportLevel(get()),
    exportCollection: () => {
      const s = get(),
        allDrafts = { ...s.drafts, [s.levelId]: exportLevel(s) },
        known = new Set(
          Object.values(s.library).flatMap((p) => p.levels.map((l) => l._id)),
        );
      const packs = Object.fromEntries(
        Object.entries(s.library).map(([id, p]) => [
          id,
          { ...p, levels: p.levels.map((l) => allDrafts[l._id] ?? l) },
        ]),
      );
      const extra = Object.values(allDrafts).filter((l) => !known.has(l._id));
      if (extra.length)
        packs["40"] = {
          ...(packs["40"] ?? {
            _type: "levelpack",
            _id: "40",
            _ns: "levelpack",
            treasures: "[]",
            name: "A Little Push",
            sortKey: "F4",
            menuSprite: "story-4.png",
            unlocked: true,
          }),
          levels: [...(packs["40"]?.levels ?? []), ...extra],
        };
      return packs;
    },
    resetToOriginal: () => {
      const s = get(),
        original = Object.values(s.library)
          .flatMap((p) => p.levels)
          .find((l) => l._id === s.levelId);
      if (!original) return;
      const drafts = { ...s.drafts };
      delete drafts[s.levelId];
      set({
        ...fromLevel(original),
        drafts,
        ...history(s),
        notice: "Restored the bundled original. Undo is available.",
      });
    },
  }));
  let saveTimer: unknown;
  store.subscribe((s, prev) => {
    if (s.revision !== prev.revision && s.libraryReady) {
      deps.cancel(saveTimer);
      if (s.revision !== s.savedRevision)
        saveTimer = deps.schedule(() => store.getState().saveDraft(), 400);
    }
  });

  return store;
}
export const useEditorStore = createEditorStore();
export type EditorStore = ReturnType<typeof createEditorStore>;
