import { it, expect, vi } from "vitest";
import {
  createLeverAnimator,
  motionFrame,
  LEVER_FRAMES,
} from "../src/core/leverAnimation";
it("plays four distinct in-between frames over200ms, then remains settled", () => {
  let now = 0;
  const animator = createLeverAnimator(() => now);
  expect(animator.frames(0)[0]).toBe(0);
  expect(animator.frames(1)[0]).toBe(0);
  const actual: string[] = [];
  for (now = 40; now <= 200; now += 40)
    actual.push(LEVER_FRAMES[animator.frames(1)[0]]);
  expect(actual).toEqual([
    "switch-transition-1",
    "switch-transition-2",
    "switch-transition-3",
    "switch-transition-4",
    "switch-on",
  ]);
  now = 1000;
  expect(animator.frames(1)[0]).toBe(5);
});
it("reverses from the current displayed frame when a channel is retoggled quickly", () => {
  let now = 0;
  const a = createLeverAnimator(() => now);
  a.frames(1);
  now = 80;
  expect(a.frames(1)[0]).toBe(2);
  expect(a.frames(0)[0]).toBe(2);
  now = 120;
  expect(a.frames(0)[0]).toBe(1);
  now = 160;
  expect(a.frames(0)[0]).toBe(0);
});
it("handles independent channels, reverse playback, restart reset and paused step inspection", () => {
  let now = 0;
  const a = createLeverAnimator(() => now);
  a.reset(129);
  expect(a.frames(129)).toEqual([5, 0, 0, 0, 0, 0, 0, 5]);
  a.frames(128);
  now = 40;
  expect(a.frames(128)[0]).toBe(4);
  expect(a.frames(128)[7]).toBe(5);
  a.reset();
  expect(a.frames(0)).toEqual(Array(8).fill(0));
  expect(a.frames(3, false).slice(0, 2)).toEqual([5, 5]);
  expect(a.frames(0, false)).toEqual(Array(8).fill(0));
  expect(motionFrame({ from: 0, target: 5, startedAt: 100 }, 50)).toBe(0);
});
it("accepts the default browser clock without changing game state", () => {
  vi.spyOn(performance, "now").mockReturnValue(0);
  const a = createLeverAnimator();
  expect(a.frames(0)[0]).toBe(0);
});
