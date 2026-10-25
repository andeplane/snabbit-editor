import {
  Board,
  RunState,
  Direction,
  startRun,
  advanceRun,
  nextCell,
} from "./simulation";
export interface SearchOptions {
  allowDamage: boolean;
  maxStates?: number;
}
export interface SearchResult {
  status: "optimal" | "limited" | "unreachable";
  expanded: number;
  score: number;
  turns: number;
  stars: number;
  crashes: number;
  path: {
    row: number;
    col: number;
    direction: Direction;
    time: number;
    switchMask?: number;
  }[];
}
interface Node {
  state: RunState;
  bound: number;
  parent: Node | null;
}
// Max-heap: A* on negative score, using an optimistic remaining-reward heuristic.
class Heap {
  items: Node[] = [];
  push(n: Node) {
    const a = this.items;
    a.push(n);
    let i = a.length - 1;
    while (i) {
      const p = (i - 1) >> 1;
      if (a[p].bound >= n.bound) break;
      a[i] = a[p];
      i = p;
    }
    a[i] = n;
  }
  pop(): Node {
    const a = this.items;
    const top = a[0],
      end = a.pop()!;
    if (a.length) {
      let i = 0;
      while (i * 2 + 1 < a.length) {
        let j = i * 2 + 1;
        if (j + 1 < a.length && a[j + 1].bound > a[j].bound) j++;
        if (a[j].bound <= end.bound) break;
        a[i] = a[j];
        i = j;
      }
      a[i] = end;
    }
    return top;
  }
}
function key(s: RunState, allowDamage: boolean) {
  if (!allowDamage)
    return [
      s.row,
      s.col,
      s.direction,
      s.speed,
      s.baseSpeed,
      s.multiplier,
      s.switchMask,
    ].join("/");
  // Stars/gems counters don't change score or transitions (combo does).
  return [
    s.row,
    s.col,
    s.direction,
    s.speed,
    s.baseSpeed,
    s.multiplier,
    s.lives,
    s.switchMask,
    s.growing ? 1 : 0,
    s.colliding ? 1 : 0,
    s.combo,
    s.combo ? s.gemAge : 120,
    allowDamage ? s.time : 0,
    Object.entries(s.touched)
      .map((x) => x.join(":"))
      .join(","),
  ].join("/");
}
export function solve(
  board: Board,
  options: SearchOptions,
  progress?: (expanded: number, score: number | null) => void,
): SearchResult {
  // For each position, maximum future collectible reward on a geometrically
  // reachable route. Ignore obstacles and turn penalties; allow max speed.
  // This is an upper bound, so pruning cannot remove a better solution.
  const boundRows = board.height + 1;
  const optimistic = new Float64Array((boundRows + 1) * board.width);
  for (let r = boundRows - 1; r >= 0; r--)
    for (let c = 0; c < board.width; c++) {
      const ch = board.grid[r * board.width + c];
      const reward = ch === "9" ? 2000 : ch === "8" ? 300 : 0;
      if (ch === "7" || r === boundRows - 1) {
        optimistic[r * board.width + c] = reward;
        continue;
      }
      const l = nextCell(r, c, -1, board.width),
        rt = nextCell(r, c, 1, board.width);
      optimistic[r * board.width + c] =
        reward +
        20.5 +
        Math.max(
          optimistic[l.row * board.width + l.col],
          optimistic[rt.row * board.width + rt.col],
        );
    }
  const upper = (s: RunState) =>
    s.score + optimistic[s.row * board.width + s.col];
  const start = startRun(board);
  const heap = new Heap();
  heap.push({ state: start, bound: upper(start), parent: null });
  const seen = new Map<string, number>([[key(start, options.allowDamage), 0]]);
  let expanded = 0,
    best: Node | null = null;
  const limit = options.maxStates ?? 350_000;
  while (heap.items.length && expanded < limit) {
    const n = heap.pop(),
      s = n.state;
    if (best && n.bound <= best.state.score + 1e-8) break;
    if ((seen.get(key(s, options.allowDamage)) ?? -Infinity) > s.score + 1e-8)
      continue;
    expanded++;
    for (const d of [s.direction, -s.direction] as Direction[]) {
      const next = advanceRun(board, s, d, false);
      if (
        next.status === "dead" ||
        (!options.allowDamage && next.colliding) ||
        next.row > board.height
      )
        continue;
      const child: Node = {
        state: next,
        bound: next.status === "finished" ? next.score : upper(next),
        parent: n,
      };
      if (next.status === "finished") {
        if (!best || next.score > best.state.score + 1e-8) best = child;
        continue;
      }
      if (best && child.bound <= best.state.score + 1e-8) continue;
      const k = key(next, options.allowDamage);
      if ((seen.get(k) ?? -Infinity) >= next.score - 1e-8) continue;
      seen.set(k, next.score);
      heap.push(child);
    }
    if (expanded % 5000 === 0) progress?.(expanded, best?.state.score ?? null);
  }
  const limited =
    expanded >= limit &&
    heap.items.length > 0 &&
    (!best || heap.items[0].bound > best.state.score + 1e-8);
  const path = [];
  for (let n = best; n; n = n.parent)
    path.push({
      row: n.state.row,
      col: n.state.col,
      direction: n.state.direction,
      time: n.state.time,
      switchMask: n.state.switchMask,
    });
  path.reverse();
  return {
    status: limited ? "limited" : best ? "optimal" : "unreachable",
    expanded,
    score: best?.state.score ?? 0,
    turns: best?.state.turns ?? 0,
    stars: best?.state.stars ?? 0,
    crashes: best?.state.crashes ?? 0,
    path,
  };
}
