import {
  BlockChar,
  BLOCK_MAP,
  LevelData,
  LevelPackData,
  TimerParams,
  timerFromArray,
  timerToArray,
} from "../store/types";
import type { DocumentState } from "../store/editorStore";
export function validateLevel(input: unknown): LevelData {
  if (!input || typeof input !== "object")
    throw new Error("Choose a level JSON object.");
  const d = input as LevelData;
  if (!Number.isInteger(d.width) || d.width < 4 || d.width > 64)
    throw new Error("Width must be a whole number from 4 to 64.");
  if (!d.grid || typeof d.grid.data !== "string" || !d.grid.data.length)
    throw new Error("The level needs a nonempty grid.data string.");
  if (d.grid.data.length > 160000)
    throw new Error("The level is too large (maximum 160,000 cells).");
  for (const ch of d.grid.data)
    if (!BLOCK_MAP.has(ch as BlockChar))
      throw new Error(`Unknown block character: ${ch}`);
  const timers = d.timers?.data ?? {};
  if (!timers || typeof timers !== "object" || Array.isArray(timers))
    throw new Error("timers.data must be an object.");
  for (const [key, value] of Object.entries(timers)) {
    if (!/^-?\d+$/.test(key) || +key >= d.grid.data.length)
      throw new Error(`Timer ${key} is outside the grid.`);
    const a =
      typeof value === "string" ? (JSON.parse(value) as unknown) : value;
    if (!Array.isArray(a) || a.length !== 6 || !a.every(Number.isInteger))
      throw new Error(`Timer ${key} needs six whole numbers.`);
    if (
      (a[0] !== 0 && a[0] !== 1) ||
      a[1] < 1 ||
      a[2] < 1 ||
      a[1] > 32767 ||
      a[2] > 32767 ||
      a.slice(3).some((n) => Math.abs(n) > 32767)
    )
      throw new Error(
        `Timer ${key}: use state 0/1, positive durations, and signed 16-bit delays.`,
      );
  }
  for (const kind of ["switches", "gates"] as const) {
    for (const [key, group] of Object.entries(d[kind]?.data ?? {})) {
      if (
        !/^\d+$/.test(key) ||
        +key >= d.grid.data.length ||
        !/^[A-H]$/.test(group) ||
        (kind === "switches"
          ? d.grid.data[+key] !== "="
          : !"123".includes(d.grid.data[+key]))
      )
        throw new Error(
          `Invalid ${kind} link at ${key}. Use channels A–H and compatible blocks.`,
        );
    }
  }
  return {
    ...d,
    _type: d._type ?? "level",
    _ns: d._ns ?? "level",
    _id: String(d._id ?? crypto.randomUUID()),
    name: d.name || "Untitled level",
    credits: d.credits ?? "",
    timers: { ...d.timers, data: timers },
  };
}
export function parseStoryData(json: string): Record<string, LevelPackData> {
  const data = JSON.parse(json) as Record<string, LevelPackData>;
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error("Expected packs keyed by their pack ID.");
  const packs = Object.entries(data);
  if (!packs.length || packs.some(([, p]) => !p || !Array.isArray(p.levels)))
    throw new Error("Each pack needs a levels array.");
  return Object.fromEntries(
    packs.map(([id, p]) => [id, { ...p, levels: p.levels.map(validateLevel) }]),
  );
}
export function importLevel(input: LevelData) {
  const data = validateLevel(input),
    width = data.width;
  const height = Math.ceil(data.grid.data.length / width);
  const grid = [...data.grid.data.padEnd(width * height, "0")] as BlockChar[];
  const timers = new Map<number, TimerParams>();
  for (const [key, value] of Object.entries(data.timers.data)) {
    const a =
      typeof value === "string"
        ? (JSON.parse(value) as number[])
        : (value as unknown as number[]);
    if (+key >= 0) timers.set(+key, timerFromArray(a));
  }
  const switches = new Map(
    Object.entries(data.switches?.data ?? {}).map(([i, g]) => [+i, g]),
  );
  const gates = new Map(
    Object.entries(data.gates?.data ?? {}).map(([i, g]) => [+i, g]),
  );
  return { grid, timers, width, height, switches, gates };
}
export function exportLevel(s: DocumentState): LevelData {
  const data: Record<string, string> = Object.fromEntries(
    Object.entries(s.source?.timers?.data ?? {}).filter(([key]) => +key < 0),
  );
  for (const [idx, params] of s.timers)
    data[String(idx)] = JSON.stringify(timerToArray(params));
  // Preserve unedited partial final rows and all unknown game metadata.
  const fullGrid = s.grid.join("");
  const sourceGrid = s.source?.grid?.data;
  const grid =
    sourceGrid &&
    s.source?.width === s.width &&
    sourceGrid.length < fullGrid.length &&
    fullGrid
      .slice(sourceGrid.length)
      .split("")
      .every((ch) => ch === "0") &&
    Math.ceil(sourceGrid.length / s.width) === s.height
      ? fullGrid.slice(0, sourceGrid.length)
      : fullGrid;
  return {
    ...s.source,
    _type: s.source?._type ?? "level",
    _id: s.levelId,
    _ns: "level",
    name: s.name,
    width: s.width,
    credits: s.credits,
    published: s.published,
    ...(s.switches.size
      ? {
          switches: {
            ...s.source?.switches,
            data: Object.fromEntries(s.switches),
          },
        }
      : s.source?.switches
        ? { switches: { data: {} } }
        : {}),
    ...(s.gates.size
      ? { gates: { ...s.source?.gates, data: Object.fromEntries(s.gates) } }
      : s.source?.gates
        ? { gates: { data: {} } }
        : {}),
    grid: { ...s.source?.grid, data: grid },
    timers: { ...s.source?.timers, data },
  };
}
