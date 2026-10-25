/** Decision-boundary port of Run.m. Time is measured in eighths of a tock. */
import { BlockChar, TimerParams, FPT } from "../store/types";
import { computeDelay, stateForBlock } from "./timer";
export interface Board {
  width: number;
  height: number;
  grid: BlockChar[];
  timers: Map<number, TimerParams>;
  switches?: Map<number, string>;
  gates?: Map<number, string>;
}
export type Direction = -1 | 1;
export interface StepPoint {
  row: number;
  col: number;
  direction: Direction;
  time: number;
  switchMask?: number;
}
export interface RunState extends StepPoint {
  status: "running" | "finished" | "dead";
  score: number;
  lives: number;
  speed: number;
  baseSpeed: number;
  multiplier: number;
  turns: number;
  stars: number;
  diamonds: number;
  gems: number;
  combo: number;
  gemAge: number;
  switchMask: number;
  growing: boolean;
  colliding: boolean;
  crashes: number;
  // Only the two possible cells in the next row can still be revisited.
  touched: Record<number, number>;
  trail: StepPoint[];
}
export const wrap = (col: number, width: number) =>
  ((col % width) + width) % width;
export const isObstacle = (c: BlockChar) => c === "1" || c === "2" || c === "3";
export function nextCell(
  row: number,
  col: number,
  direction: Direction,
  width: number,
) {
  return {
    row: row + 1,
    col: wrap(
      col + (row % 2 ? (direction > 0 ? 1 : 0) : direction < 0 ? -1 : 0),
      width,
    ),
  };
}
export function startRun(board: Board): RunState {
  const p: StepPoint = {
    row: 0,
    col: wrap(9, board.width),
    direction: 1,
    time: 0,
  };
  return {
    ...p,
    status: "running",
    score: 0,
    lives: 3,
    speed: 2,
    baseSpeed: 2,
    multiplier: 0,
    turns: 0,
    stars: 0,
    diamonds: 0,
    gems: 0,
    combo: 0,
    gemAge: 120,
    switchMask: 0,
    growing: false,
    colliding: false,
    crashes: 0,
    touched: {},
    trail: [p],
  };
}
export function obstacleHP(
  board: Board,
  row: number,
  col: number,
  time: number,
  switchMask = 0,
): number {
  const idx = row * board.width + col;
  const char = board.grid[idx];
  if (!isObstacle(char)) return 0;
  const timer = board.timers.get(idx);
  const on =
    !timer ||
    timer.toggleAfter <= 0 ||
    stateForBlock(timer, computeDelay(row, col, timer), time).state;
  const group = board.gates?.get(idx),
    flipped = group
      ? !!(switchMask & (1 << (group.charCodeAt(0) - 65)))
      : false;
  if (on === flipped) return 0;
  return char === "1" ? 200 : char === "2" ? 2 : 1;
}
export function advanceRun(
  board: Board,
  previous: RunState,
  direction: Direction,
  keepTrail = true,
): RunState {
  if (previous.status !== "running") return previous;
  const s: RunState = {
    ...previous,
    touched: { ...previous.touched },
    time: previous.time + 8,
  };
  if (direction !== s.direction) {
    s.direction = direction;
    s.turns++;
    s.multiplier *= 0.5;
  }
  s.gemAge = Math.min(120, s.gemAge + FPT[s.speed]);
  if (s.gemAge >= 120) s.combo = 0;
  if (s.colliding) {
    s.lives--;
    s.crashes++;
  }
  if (s.growing) s.lives++;
  s.growing = false;
  if (s.lives < 0.3) {
    s.status = "dead";
    return s;
  }
  // overBlock is skipped while colliding. Pickups happen when leaving the cell.
  if (!s.colliding) {
    const char =
      s.row === board.height + 40
        ? "7"
        : board.grid[s.row * board.width + s.col];
    if (char === "=") {
      const group = board.switches?.get(s.row * board.width + s.col) ?? "A";
      s.switchMask ^= 1 << (group.charCodeAt(0) - 65);
    }
    if (char === "4") {
      s.gems++;
      s.combo++;
      s.gemAge = 0;
      if (s.combo === 12) {
        s.combo = 0;
        s.growing = true;
      }
    }
    if (char === "8") {
      s.score += 300;
      s.stars = Math.min(3, s.stars + 1);
    }
    if (char === "9") {
      s.score += 2000;
      s.diamonds++;
    }
    if (char === "6") s.growing = true;
    if (char === ":") s.baseSpeed = Math.min(9, s.baseSpeed + 1);
    if (char === ";") s.baseSpeed = Math.max(1, s.baseSpeed - 1);
    if (char === "7") {
      s.status = "finished";
      return s;
    }
  }
  const target = nextCell(s.row, s.col, direction, board.width);
  // Track.m supplies an automatic finish 40 rows beyond story data.
  const idx = target.row * board.width + target.col;
  let hp =
    s.touched[idx] ??
    obstacleHP(board, target.row, target.col, s.time, s.switchMask);
  if (s.speed === 9 && hp < 10) hp = 0;
  s.colliding = hp > 0;
  if (s.colliding) s.touched[idx] = hp - 1;
  else {
    s.row = target.row;
    s.col = target.col;
    s.score += s.multiplier * 10;
    s.multiplier = 0.15 * s.speed + 0.7;
    s.touched = {};
  }
  s.speed = s.baseSpeed;
  if (keepTrail)
    s.trail = [
      ...previous.trail,
      {
        row: s.row,
        col: s.col,
        direction: s.direction,
        time: s.time,
        switchMask: s.switchMask,
      },
    ];
  return s;
}
