export const LEVER_FRAMES = [
  "switch-off",
  "switch-transition-1",
  "switch-transition-2",
  "switch-transition-3",
  "switch-transition-4",
  "switch-on",
] as const;
export const LEVER_FRAME_MS = 40;
export interface LeverMotion {
  from: number;
  target: number;
  startedAt: number;
}
export function motionFrame(motion: LeverMotion, now: number): number {
  const direction = Math.sign(motion.target - motion.from);
  const distance = Math.min(
    Math.abs(motion.target - motion.from),
    Math.floor(Math.max(0, now - motion.startedAt) / LEVER_FRAME_MS),
  );
  return motion.from + direction * distance;
}
function settled(active: boolean, now: number): LeverMotion {
  const frame = active ? 5 : 0;
  return { from: frame, target: frame, startedAt: now };
}
/** Clock is injected; presentation never changes the logical channel mask. */
export function createLeverAnimator(
  clock: () => number = () => performance.now(),
) {
  let motions = Array.from({ length: 8 }, () => settled(false, clock()));
  return {
    reset(mask = 0) {
      const now = clock();
      motions = motions.map((_, channel) =>
        settled(!!(mask & (1 << channel)), now),
      );
    },
    frames(mask: number, animate = true): number[] {
      const now = clock();
      motions = motions.map((previous, channel) => {
        const active = !!(mask & (1 << channel)),
          target = active ? 5 : 0;
        if (!animate) return settled(active, now);
        if (target === previous.target) return previous;
        return { from: motionFrame(previous, now), target, startedAt: now };
      });
      return motions.map((motion) => motionFrame(motion, now));
    },
  };
}
