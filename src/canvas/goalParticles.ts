import type { DrawContext } from "./DrawContext";
/** goalBlockFx.plist: one particle per four 60 Hz frames, 0.8±0.3s
 * lifetime, ±18×6 position, size 2±4 → 6±4, warm #ffda70, normal alpha.
 * Stable seeds keep layout/arrival previews still; live/test uses moving time.
 */
export interface GoalParticle {
  x: number;
  y: number;
  size: number;
  alpha: number;
}
const random = (seed: number) => {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
};
export function goalParticles(
  seconds: number,
  row: number,
  col: number,
): GoalParticle[] {
  const time = seconds + 4,
    latest = Math.floor(time * 15),
    particles: GoalParticle[] = [];
  for (let n = latest - 17; n <= latest; n++) {
    const seed = n + row * 4099 + col * 131,
      age = time - n / 15,
      life = 0.5 + 0.6 * random(seed + 1);
    if (age < 0 || age >= life) continue;
    const p = age / life,
      start = Math.max(0, 2 + (random(seed + 2) * 2 - 1) * 4),
      end = 6 + (random(seed + 3) * 2 - 1) * 4;
    particles.push({
      x: (random(seed + 4) * 2 - 1) * 18,
      y: (random(seed + 5) * 2 - 1) * 6 + (random(seed + 6) * 2 - 1) * 15 * age,
      size: start + (end - start) * p,
      alpha:
        Math.min(1, Math.max(0, 0.771 + (random(seed + 7) * 2 - 1) * 0.5)) *
        (1 - p),
    });
  }
  return particles;
}
export function drawGoal(
  ctx: DrawContext,
  seconds: number,
  row: number,
  col: number,
) {
  ctx.fillStyle = "#ffda70";
  for (const p of goalParticles(seconds, row, col)) {
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0, p.size / 2), 0, Math.PI * 2);
    ctx.fill();
  }
}
