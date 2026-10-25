// Block type characters matching the game's ASCII grid format
export type BlockChar =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | ":"
  | ";"
  | "<"
  | "=";

export interface BlockDef {
  char: BlockChar;
  name: string;
  label: string; // short label for UI
  color: string; // fill color for canvas
  textColor: string; // label text color
  isCrash: boolean;
  isEatable: boolean;
}

export const BLOCK_DEFS: BlockDef[] = [
  {
    char: "=",
    name: "Switch",
    label: "⏻",
    color: "#dbaa46",
    textColor: "#fff",
    isCrash: false,
    isEatable: false,
  },
  {
    char: "0",
    name: "Empty",
    label: "·",
    color: "#1a1a2e",
    textColor: "#444",
    isCrash: false,
    isEatable: false,
  },
  {
    char: "1",
    name: "Metal",
    label: "M",
    color: "#607080",
    textColor: "#cde",
    isCrash: true,
    isEatable: false,
  },
  {
    char: "2",
    name: "Rock",
    label: "R",
    color: "#8b6f47",
    textColor: "#ffd",
    isCrash: true,
    isEatable: false,
  },
  {
    char: "3",
    name: "Dirt",
    label: "D",
    color: "#a0784a",
    textColor: "#ffe",
    isCrash: true,
    isEatable: false,
  },
  {
    char: "4",
    name: "Gem",
    label: "G",
    color: "#2255cc",
    textColor: "#aef",
    isCrash: false,
    isEatable: true,
  },
  {
    char: "5",
    name: "Unused",
    label: "?",
    color: "#333",
    textColor: "#666",
    isCrash: false,
    isEatable: false,
  },
  {
    char: "6",
    name: "Life",
    label: "♥",
    color: "#cc2244",
    textColor: "#fcc",
    isCrash: false,
    isEatable: true,
  },
  {
    char: "7",
    name: "Finish",
    label: "F",
    color: "#22cc44",
    textColor: "#cfc",
    isCrash: false,
    isEatable: false,
  },
  {
    char: "8",
    name: "Star",
    label: "★",
    color: "#ccaa00",
    textColor: "#ffd",
    isCrash: false,
    isEatable: true,
  },
  {
    char: "9",
    name: "Diamond",
    label: "◆",
    color: "#00cccc",
    textColor: "#cff",
    isCrash: false,
    isEatable: true,
  },
  {
    char: ":",
    name: "Turbo",
    label: "▶",
    color: "#ff6600",
    textColor: "#fff",
    isCrash: false,
    isEatable: false,
  },
  {
    char: ";",
    name: "Focus",
    label: "◀",
    color: "#6600ff",
    textColor: "#ccf",
    isCrash: false,
    isEatable: false,
  },
  {
    char: "<",
    name: "Mesh",
    label: "#",
    color: "#334455",
    textColor: "#789",
    isCrash: false,
    isEatable: false,
  },
];

export const BLOCK_MAP = new Map<BlockChar, BlockDef>(
  BLOCK_DEFS.map((d) => [d.char, d]),
);

// Timer parameters — 6-element array stored in JSON as string
// NOTE: In Track.m line 181, array[3] is used with row and array[4] with col.
// We label them by their actual behavior in the game code.
export interface TimerParams {
  startState: 0 | 1; // index 0: initial state (0=hidden, 1=visible)
  toggleAfter: number; // index 1: ticks in first state
  toggleBackAfter: number; // index 2: ticks in second state
  rowDelay: number; // index 3: multiplied by row in Track.m
  colDelay: number; // index 4: multiplied by realC (hex-adjusted col) in Track.m
  ownDelay: number; // index 5: per-block offset
}

export function timerToArray(t: TimerParams): number[] {
  return [
    t.startState,
    t.toggleAfter,
    t.toggleBackAfter,
    t.rowDelay,
    t.colDelay,
    t.ownDelay,
  ];
}

export function timerFromArray(a: number[]): TimerParams {
  return {
    startState: (a[0] ? 1 : 0) as 0 | 1,
    toggleAfter: a[1],
    toggleBackAfter: a[2],
    rowDelay: a[3],
    colDelay: a[4],
    ownDelay: a[5],
  };
}

// Level data matching the game's JSON schema
export interface LevelData {
  [key: string]: unknown;
  _type: "level" | "custom";
  _id: string;
  _ns: "level";
  name: string;
  width: number;
  credits?: string;
  creator?: string;
  published?: number;
  switches?: { data: Record<string, string> };
  gates?: { data: Record<string, string> };
  grid: { data: string };
  timers: { data: Record<string, string> };
}

// LevelPack (storyData.txt top-level entry)
export interface LevelPackData {
  [key: string]: unknown;
  _type: "levelpack";
  name?: string;
  sortKey?: string;
  starsToUnlock?: number;
  unlocked?: boolean;
  menuSprite?: string;
  levels: LevelData[];
}

export type Tool =
  | "paint"
  | "erase"
  | "line"
  | "rectangle"
  | "fill"
  | "select"
  | "pick";

// Frames per tock for each speed 1-9
export const FPT: Record<number, number> = {
  1: 14,
  2: 10,
  3: 7,
  4: 6,
  5: 5,
  6: 4,
  7: 3,
  8: 2,
  9: 1,
};

export type TimingView = "layout" | "arrival" | "live";
export type Menu = "tools" | "blocks" | "fields" | null;
