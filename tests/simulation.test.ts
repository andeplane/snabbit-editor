import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { storyFile } from "./gameResources";
import {
  advanceRun,
  Board,
  Direction,
  isObstacle,
  nextCell,
  obstacleHP,
  RunState,
  startRun,
  wrap,
} from "../src/core/simulation";
import { computeDelay, stateAtArrival, stateForBlock } from "../src/core/timer";
import { BlockChar, TimerParams } from "../src/store/types";
import { importLevel, parseStoryData } from "../src/core/serialization";

function board(width = 4, height = 8): Board {
  return {
    width,
    height,
    grid: Array<BlockChar>(width * height).fill("0"),
    timers: new Map(),
    switches: new Map(),
    gates: new Map(),
  };
}
function put(b: Board, row: number, col: number, type: BlockChar): Board {
  b.grid[row * b.width + col] = type;
  return b;
}
function timer(patch: Partial<TimerParams> = {}): TimerParams {
  return {
    startState: 1,
    toggleAfter: 16,
    toggleBackAfter: 16,
    rowDelay: 0,
    colDelay: 0,
    ownDelay: 0,
    ...patch,
  };
}
function step(
  b: Board,
  s: RunState,
  direction: Direction = s.direction,
): RunState {
  return advanceRun(b, s, direction);
}
function onStart(type: BlockChar): Board {
  return put(board(), 0, 1, type);
}

describe("hex movement and independent run state", () => {
  it.each([
    [0, 1, 1, 1],
    [0, 1, -1, 0],
    [1, 1, 1, 2],
    [1, 1, -1, 1],
    [0, 0, -1, 3],
    [1, 3, 1, 0],
  ] as const)(
    "moves from row %i col %i heading %i to col %i",
    (row, col, direction, result) => {
      expect(nextCell(row, col, direction, 4)).toEqual({
        row: row + 1,
        col: result,
      });
    },
  );
  it("wraps positive and negative columns, including repeated wraps", () => {
    expect([wrap(-9, 4), wrap(-4, 4), wrap(4, 4), wrap(11, 4)]).toEqual([
      3, 0, 0, 3,
    ]);
  });
  it("starts at native row 0 / column 9, wrapped for narrow custom levels", () => {
    expect(startRun(board())).toMatchObject({
      row: 0,
      col: 1,
      direction: 1,
      time: 0,
      score: 0,
      speed: 2,
      lives: 3,
      multiplier: 0,
      switchMask: 0,
    });
    expect(startRun(board(16))).toMatchObject({ col: 9 });
  });
  it("does not mutate a previous run or share mutable state with a retry/ghost", () => {
    const b = onStart("="),
      original = startRun(b),
      ghost = startRun(b);
    const next = step(b, original);
    expect(next.switchMask).toBe(1);
    expect(original.switchMask).toBe(0);
    expect(ghost.switchMask).toBe(0);
    expect(next.trail).toHaveLength(2);
    expect(original.trail).toHaveLength(1);
    expect(next.touched).not.toBe(original.touched);
  });
  it.each(["finished", "dead"] as const)(
    "keeps a %s run completely unchanged",
    (status) => {
      const b = board(),
        stopped: RunState = { ...startRun(b), status };
      expect(step(b, stopped, -1)).toBe(stopped);
    },
  );
  it("can advance the search without allocating a trail", () => {
    const b = board(),
      start = startRun(b),
      next = advanceRun(b, start, 1, false);
    expect(next.row).toBe(1);
    expect(next.trail).toBe(start.trail);
  });
});

describe("native timer timing and phase", () => {
  it("uses rowDelay at array index 3 and real hex column delay at index 4", () => {
    expect(
      computeDelay(3, 2, timer({ rowDelay: 40, colDelay: 3, ownDelay: 7 })),
    ).toBe(-18);
    expect(computeDelay(4, 1, timer({ rowDelay: 2, colDelay: 1 }))).toBe(-22);
  });
  it("normalizes negative phases and allows an individual delay after row arrival", () => {
    expect(computeDelay(2, 1, timer({ rowDelay: -8, colDelay: -4 }))).toBe(-56);
    const t = timer({ ownDelay: 200 });
    expect(stateAtArrival(2, 1, t)).toEqual({
      state: true,
      period: 0,
      progress: 0,
    });
  });
  it("avoids looping when the period is invalid", () => {
    expect(
      computeDelay(
        20,
        10,
        timer({ toggleAfter: 0, toggleBackAfter: 0, rowDelay: 100 }),
      ),
    ).toBe(0);
  });
  it("evaluates exact ON/OFF boundaries and period numbers", () => {
    const t = timer();
    expect(stateForBlock(t, 0, 0)).toEqual({
      state: true,
      period: 0,
      progress: 0,
    });
    expect(stateForBlock(t, 0, 8)).toEqual({
      state: true,
      period: 0,
      progress: 0.5,
    });
    expect(stateForBlock(t, 0, 16)).toEqual({
      state: false,
      period: 0,
      progress: 0,
    });
    expect(stateForBlock(t, 0, 24)).toEqual({
      state: false,
      period: 0,
      progress: 0.5,
    });
    expect(stateForBlock(t, 0, 32)).toEqual({
      state: true,
      period: 1,
      progress: 0,
    });
  });
  it("can start hidden and swaps into its opposite state", () => {
    const t = timer({ startState: 0 });
    expect(stateForBlock(t, 0, 8).state).toBe(false);
    expect(stateForBlock(t, 0, 16).state).toBe(true);
    expect(stateForBlock(t, 10, 0)).toEqual({
      state: false,
      period: 0,
      progress: 0,
    });
  });
  it.each([{ toggleAfter: 0 }, { toggleBackAfter: 0 }, { toggleAfter: -1 }])(
    "treats an invalid duration as a static initial state",
    (patch) => {
      expect(stateForBlock(timer(patch), 0, 100)).toEqual({
        state: true,
        period: 0,
        progress: 0,
      });
    },
  );
  it("freezes each block at its own uninterrupted collision time", () => {
    const t = timer({ rowDelay: 8, startState: 0 });
    for (const row of [0, 1, 5, 19])
      expect(stateAtArrival(row, 2, t).state).toBe(false);
    expect(stateForBlock(t, computeDelay(5, 2, t), 56).state).toBe(true);
  });
});

describe("obstacle collision and XOR gate algebra", () => {
  it.each([
    ["1", 200],
    ["2", 2],
    ["3", 1],
    ["0", 0],
    ["4", 0],
    ["=", 0],
  ] as const)("assigns %s its actual HP %i", (char, hp) => {
    const b = put(board(), 1, 1, char);
    expect(isObstacle(char)).toBe(hp > 0);
    expect(obstacleHP(b, 1, 1, 8)).toBe(hp);
  });
  it("checks timer state at collision time, including untimed obstacle defaults", () => {
    const b = put(board(), 1, 1, "2");
    b.timers.set(5, timer());
    expect(obstacleHP(b, 1, 1, 8)).toBe(2);
    expect(obstacleHP(b, 1, 1, 16)).toBe(0);
    b.timers.set(5, timer({ toggleAfter: 0 }));
    expect(obstacleHP(b, 1, 1, 8)).toBe(2);
  });
  it("opens untimed gates and inverts both timed states independently per channel", () => {
    const b = put(board(), 1, 1, "1");
    b.gates?.set(5, "A");
    expect(obstacleHP(b, 1, 1, 8, 0)).toBe(200);
    expect(obstacleHP(b, 1, 1, 8, 1)).toBe(0);
    expect(obstacleHP(b, 1, 1, 8, 2)).toBe(200);
    b.timers.set(5, timer());
    expect(obstacleHP(b, 1, 1, 8, 1)).toBe(0);
    expect(obstacleHP(b, 1, 1, 16, 1)).toBe(200);
    b.gates?.set(5, "H");
    expect(obstacleHP(b, 1, 1, 8, 128)).toBe(0);
  });
  it("locks a first-touch timed collision until destroyed, even after the timer changes", () => {
    const b = put(board(), 1, 1, "2");
    b.timers.set(5, timer());
    const first = step(b, startRun(b));
    expect(first).toMatchObject({
      row: 0,
      colliding: true,
      lives: 3,
      time: 8,
      touched: { 5: 1 },
    });
    const second = step(b, first);
    expect(second).toMatchObject({
      row: 0,
      colliding: true,
      lives: 2,
      time: 16,
      touched: { 5: 0 },
    });
    const third = step(b, second);
    expect(third).toMatchObject({
      row: 1,
      colliding: false,
      lives: 1,
      crashes: 2,
      touched: {},
    });
  });
  it("allows turning away from a collision and clears next-row damage after moving", () => {
    const b = put(board(), 1, 1, "1");
    const hit = step(b, startRun(b)),
      escaped = step(b, hit, -1);
    expect(escaped).toMatchObject({
      row: 1,
      col: 0,
      lives: 2,
      crashes: 1,
      colliding: false,
      touched: {},
      turns: 1,
    });
  });
  it("dies after losing its third life and cannot keep moving after death", () => {
    const b = put(board(), 1, 1, "1");
    let s = startRun(b);
    for (let i = 0; i < 4; i++) s = step(b, s);
    expect(s).toMatchObject({
      status: "dead",
      row: 0,
      lives: 0,
      crashes: 3,
      time: 32,
    });
    expect(step(b, s)).toBe(s);
  });
  it("breaks dirt and rock without damage at speed 9 while metal still blocks", () => {
    for (const char of ["2", "3"] as const) {
      const b = put(board(), 1, 1, char),
        s = { ...startRun(b), speed: 9, baseSpeed: 9 };
      expect(step(b, s)).toMatchObject({ row: 1, colliding: false, lives: 3 });
    }
    const b = put(board(), 1, 1, "1");
    expect(step(b, { ...startRun(b), speed: 9, baseSpeed: 9 }).colliding).toBe(
      true,
    );
  });
});

describe("switch activation and run lifecycle", () => {
  it("activates before trying the next gate in the same tock", () => {
    const b = put(onStart("="), 1, 1, "1");
    b.gates?.set(5, "A");
    const s = step(b, startRun(b));
    expect(s).toMatchObject({
      switchMask: 1,
      row: 1,
      lives: 3,
      colliding: false,
    });
    expect(s.trail[1]).toMatchObject({ switchMask: 1, time: 8 });
  });
  it("honors explicit channels and a second press toggles the channel back", () => {
    const b = put(onStart("="), 1, 1, "=");
    b.switches?.set(1, "H");
    b.switches?.set(5, "H");
    const first = step(b, startRun(b));
    expect(first.switchMask).toBe(128);
    expect(step(b, first).switchMask).toBe(0);
    expect(startRun(b).switchMask).toBe(0);
  });
  it("does not repeatedly activate the current switch while stuck against an obstacle", () => {
    const b = put(onStart("="), 1, 1, "1");
    const first = step(b, startRun(b));
    expect(first).toMatchObject({ colliding: true, switchMask: 1 });
    expect(step(b, first).switchMask).toBe(1);
  });
  it("uses A by default even when the optional switches map is absent", () => {
    const b = onStart("=");
    delete b.switches;
    delete b.gates;
    expect(step(b, startRun(b)).switchMask).toBe(1);
  });
});

describe("native scoring, pickups and life timing", () => {
  it("starts with zero multiplier, halves it on a turn and resets it after movement", () => {
    const b = board(),
      first = step(b, startRun(b)),
      second = step(b, first, -1),
      third = step(b, second, -1);
    expect(first).toMatchObject({ score: 0, multiplier: 1, turns: 0 });
    expect(second).toMatchObject({ score: 5, multiplier: 1, turns: 1 });
    expect(third).toMatchObject({ score: 15, turns: 1 });
    expect(step(b, startRun(b), -1)).toMatchObject({ score: 0, turns: 1 });
  });
  it("awards every star, but caps the displayed star count at three", () => {
    const b = onStart("8");
    expect(step(b, { ...startRun(b), stars: 3 })).toMatchObject({
      score: 300,
      stars: 3,
    });
  });
  it("awards 2,000 for a diamond", () => {
    const b = onStart("9");
    expect(step(b, startRun(b))).toMatchObject({ score: 2000, diamonds: 1 });
  });
  it("applies speed changes after movement and scores using the preceding speed multiplier", () => {
    const b = onStart(":"),
      first = step(b, startRun(b)),
      second = step(b, first),
      third = step(b, second);
    expect(first).toMatchObject({
      score: 0,
      speed: 3,
      baseSpeed: 3,
      multiplier: 1,
    });
    expect(second.score).toBe(10);
    expect(second.multiplier).toBeCloseTo(1.15);
    expect(third.score).toBeCloseTo(21.5);
    expect(step(b, { ...startRun(b), speed: 9, baseSpeed: 9 }).speed).toBe(9);
  });
  it("slows down and clamps at speed 1", () => {
    const b = onStart(";");
    expect(step(b, startRun(b))).toMatchObject({ speed: 1, baseSpeed: 1 });
    expect(step(b, { ...startRun(b), speed: 1, baseSpeed: 1 }).speed).toBe(1);
  });
  it("gems build a combo without score and the twelfth gem schedules a life", () => {
    const b = onStart("4"),
      s = step(b, { ...startRun(b), combo: 11, gemAge: 0 });
    expect(s).toMatchObject({
      score: 0,
      gems: 1,
      combo: 0,
      gemAge: 0,
      growing: true,
      lives: 3,
    });
    expect(step(b, s)).toMatchObject({ lives: 4, growing: false });
  });
  it("expires the combo at 120 native frames before collecting another gem", () => {
    const b = onStart("4");
    const s = step(b, {
      ...startRun(b),
      speed: 9,
      baseSpeed: 9,
      combo: 11,
      gemAge: 119,
    });
    expect(s).toMatchObject({ combo: 1, gemAge: 0, growing: false });
    const blank = board();
    expect(
      step(blank, { ...startRun(blank), combo: 4, gemAge: 115 }),
    ).toMatchObject({ combo: 0, gemAge: 120 });
  });
  it("a heart schedules growth for the next tock, including during a collision", () => {
    const b = onStart("6"),
      first = step(b, startRun(b));
    expect(first).toMatchObject({ growing: true, lives: 3 });
    expect(step(b, first)).toMatchObject({ lives: 4, growing: false });
    put(b, 1, 1, "1");
    const blocked = step(b, startRun(b));
    expect(step(b, blocked)).toMatchObject({
      lives: 3,
      growing: false,
      crashes: 1,
    });
  });
  it("finishes on leaving the goal and stops before awarding another movement score", () => {
    const b = onStart("7"),
      s = step(b, { ...startRun(b), score: 123, multiplier: 2 });
    expect(s).toMatchObject({
      status: "finished",
      row: 0,
      time: 8,
      score: 123,
    });
    expect(s.trail).toHaveLength(1);
  });
  it("uses Track.m automatic finish exactly 40 rows beyond level data", () => {
    const b = board(4, 4);
    let s = startRun(b);
    for (let i = 0; i < 44; i++) s = step(b, s);
    expect(s).toMatchObject({
      row: 44,
      status: "running",
      time: 352,
      score: 430,
    });
    expect(step(b, s)).toMatchObject({
      row: 44,
      status: "finished",
      time: 360,
      score: 430,
    });
  });
});

describe("shipped native Pack 4 fixture", () => {
  it("reproduces the independently checked native straight-right trace and score", () => {
    const packs = parseStoryData(readFileSync(storyFile(), "utf8"));
    const level = packs["40"].levels.find(level => level._id === "4001")!,
      b = importLevel(level);
    let s = startRun(b);
    const switches: { row: number; time: number; mask: number }[] = [];
    while (s.status === "running" && s.time < 1000) {
      const previous = s;
      s = step(b, s);
      if (s.switchMask !== previous.switchMask)
        switches.push({ row: previous.row, time: s.time, mask: s.switchMask });
    }
    expect(switches).toEqual([
      { row: 8, time: 72, mask: 1 },
      { row: 26, time: 216, mask: 0 },
      { row: 50, time: 408, mask: 1 },
    ]);
    expect(s).toMatchObject({
      status: "finished",
      row: 72,
      time: 584,
      score: 1610,
      gems: 62,
      stars: 3,
      lives: 8,
      turns: 0,
      crashes: 0,
      switchMask: 1,
    });
  });
});
