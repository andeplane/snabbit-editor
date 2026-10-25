import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { storyFile } from "./gameResources";
import { solve } from "../src/core/solver";
import {
  startRun,
  advanceRun,
  Board,
  Direction,
  RunState,
} from "../src/core/simulation";
import { importLevel, parseStoryData } from "../src/core/serialization";
import { cells, level } from "./fixtures";
function exhaustive(board: Board, damage = false): number {
  let best = -Infinity;
  const queue: RunState[] = [startRun(board)];
  while (queue.length) {
    const s = queue.pop()!;
    if (s.status === "finished") {
      best = Math.max(best, s.score);
      continue;
    }
    if (s.status === "dead" || s.time > 8 * (board.height + 8)) continue;
    for (const dir of [-1, 1] as Direction[]) {
      const next = advanceRun(board, s, dir, false);
      if (damage || !next.colliding) queue.push(next);
    }
  }
  return best;
}
describe("scoring-aware A*", () => {
  it("matches exhaustive enumeration on varied small boards, including wrapping, speed, turns, rewards and switches", () => {
    for (let seed = 1; seed <= 18; seed++) {
      let d = level(5),
        rand = seed;
      const g = [...d.grid.data];
      for (let i = 4; i < 16; i++) {
        rand = (rand * 1664525 + 1013904223) >>> 0;
        g[i] = ["0", "0", "1", "4", "8", "9", ":", ";"][rand % 8];
      }
      for (let i = 16; i < 20; i++) g[i] = "7";
      d = { ...d, grid: { data: g.join("") } };
      const board = importLevel(d),
        result = solve(board, { allowDamage: false });
      expect(result.path.length ? result.score : -Infinity).toBeCloseTo(
        exhaustive(board),
        7,
      );
    }
  });
  it("matches exhaustive damage search and returns the scored replay", () => {
    const d = cells(level(4), {
        5: "3",
        4: "1",
        10: "8",
        11: "9",
        12: "7",
        13: "7",
        14: "7",
        15: "7",
      }),
      board = importLevel(d);
    const result = solve(board, { allowDamage: true });
    expect(result.status).toBe("optimal");
    expect(result.score).toBeCloseTo(exhaustive(board, true), 7);
    let state = startRun(board);
    for (const step of result.path.slice(1))
      state = advanceRun(board, state, step.direction);
    expect(state.status).toBe("finished");
    expect(state.score).toBe(result.score);
    expect(state.turns).toBe(result.turns);
    expect(state.stars).toBe(result.stars);
    expect(state.crashes).toBe(result.crashes);
  });
  it("reports unreachable, missing finish, and search limits honestly", () => {
    const blocked = importLevel(
      cells(level(4), {
        4: "1",
        5: "1",
        6: "1",
        7: "1",
        12: "7",
        13: "7",
        14: "7",
        15: "7",
      }),
    );
    expect(solve(blocked, { allowDamage: false }).status).toBe("unreachable");
    expect(solve(blocked, { allowDamage: true }).status).toBe("unreachable");
    expect(solve(blocked, { allowDamage: false, maxStates: 1 }).status).toBe(
      "unreachable",
    );
    const open = importLevel(
      cells(level(4), { 12: "7", 13: "7", 14: "7", 15: "7" }),
    );
    expect(solve(open, { allowDamage: false, maxStates: 1 }).status).toBe(
      "limited",
    );
    expect(solve(importLevel(level(4)), { allowDamage: false }).status).toBe(
      "unreachable",
    );
  });
  it("finds and replays the Pack 4 switch fixture with the native score", () => {
    const packs = parseStoryData(readFileSync(storyFile(), "utf8"));
    const board = importLevel(packs["40"].levels[0]);
    const result = solve(board, { allowDamage: false });
    expect(result.status).toBe("optimal");
    expect(result.score).toBeGreaterThanOrEqual(1610);
    let s = startRun(board);
    for (const p of result.path.slice(1)) s = advanceRun(board, s, p.direction);
    expect(s.status).toBe("finished");
    expect(s.score).toBe(result.score);
    expect(s.crashes).toBe(0);
  });
  it("emits progress on a large branching search and keeps any incumbent under a state limit", () => {
    const board = importLevel(cells(level(400, 16), { 6399: "7" }));
    let updates = 0;
    const result = solve(
      board,
      { allowDamage: true, maxStates: 6000 },
      () => updates++,
    );
    expect(updates).toBeGreaterThan(0);
    expect(result.expanded).toBeLessThanOrEqual(6000);
  });
  it("analyzes every shipped level and independently replays every returned route", () => {
    const library = parseStoryData(readFileSync(storyFile(), "utf8"));
    let analyzed = 0,
      solved = 0;
    for (const pack of Object.values(library))
      for (const data of pack.levels) {
        const board = importLevel(data),
          result = solve(board, { allowDamage: false });
        expect(result.status, `${pack.name}: ${data.name}`).not.toBe("limited");
        if (result.path.length) {
          let run = startRun(board);
          for (const point of result.path.slice(1)) {
            run = advanceRun(board, run, point.direction);
            expect(run.colliding).toBe(false);
          }
          expect(run.status).toBe("finished");
          expect(run.score).toBeCloseTo(result.score, 7);
          solved++;
        }
        analyzed++;
      }
    expect(analyzed).toBeGreaterThanOrEqual(91);
    expect(solved).toBeGreaterThan(60);
  });
});
