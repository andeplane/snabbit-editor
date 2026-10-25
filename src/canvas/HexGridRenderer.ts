import { CELL_H, TOP_OFFSET, gridToPixel, canvasOriginX } from "../core/hex";
import { stateAtArrival, stateForBlock, computeDelay } from "../core/timer";
import * as defaultSprites from "./sprites";
import type { RenderAssets } from "./sprites";
import type { DrawContext } from "./DrawContext";
import { drawGoal } from "./goalParticles";
import { isObstacle, nextCell } from "../core/simulation";
import type { EditorState } from "../store/editorStore";
function diamond(ctx: DrawContext, x: number, y: number, radius = 16) {
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.lineTo(x + radius, y);
  ctx.lineTo(x, y + radius);
  ctx.lineTo(x - radius, y);
  ctx.closePath();
}
export function renderGrid(
  ctx: DrawContext,
  s: EditorState,
  cw: number,
  ch: number,
  preview: number[] = [],
  clock = 0,
  progress = 1,
  assets: RenderAssets = defaultSprites,
  leverFrames?: readonly number[],
) {
  const { scrollY, zoom, width, height, grid, timers } = s;
  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = "#101720";
  ctx.fillRect(0, 0, cw, ch);
  const origin = canvasOriginX(width, cw, zoom, s.scrollX);
  ctx.save();
  ctx.scale(zoom, zoom);
  ctx.translate(origin, -scrollY);
  const first = Math.max(
    0,
    Math.floor(height - (scrollY + ch / zoom - TOP_OFFSET) / CELL_H) - 3,
  );
  const last = Math.min(
    height - 1,
    Math.ceil(height - (scrollY - TOP_OFFSET) / CELL_H) + 3,
  );
  const selected = new Set(s.selection),
    ghost = new Set(preview);
  const time = s.test
    ? Math.max(0, s.test.time - 8 + progress * 8)
    : s.playbackTime;
  for (let r = first; r <= last; r++) {
    const p = gridToPixel(0, r, height);
    if (r % 5 === 0) {
      ctx.fillStyle = "#657789";
      ctx.font = `${10 / zoom}px system-ui`;
      ctx.textAlign = "right";
      ctx.fillText(String(r), -25, p.y + 3 / zoom);
    }
    for (let c = 0; c < width; c++) {
      const idx = r * width + c,
        block = grid[idx],
        { x, y } = gridToPixel(c, r, height);
      if (s.showGrid && !s.test) {
        diamond(ctx, x, y);
        ctx.strokeStyle = "#22303d";
        ctx.lineWidth = 0.6 / zoom;
        ctx.stroke();
      }
      const timer = timers.get(idx);
      let on = true,
        scale = 1;
      let phaseRemaining: number | null = null;
      if (
        timer &&
        timer.toggleAfter > 0 &&
        (s.timingView !== "layout" || s.test)
      ) {
        const bs =
          s.timingView === "arrival" && !s.test
            ? stateAtArrival(r, c, timer)
            : stateForBlock(timer, computeDelay(r, c, timer), time);
        on = bs.state;
        phaseRemaining =
          (bs.state === (timer.startState === 1)
            ? timer.toggleAfter
            : timer.toggleBackAfter) *
          (1 - bs.progress);
      }
      const group = s.gates.get(idx);
      const routeMask = s.route?.path.find((p) => p.row === r)?.switchMask ?? 0;
      const mask =
        s.test?.switchMask ?? (s.timingView === "arrival" ? routeMask : 0);
      if (group && mask & (1 << (group.charCodeAt(0) - 65))) on = !on;
      scale = on ? 1 : 0.4;
      // A switch changes the state, while the timer's remaining phase keeps
      // running. Warning scales must follow that effective state after XOR.
      if ((s.timingView === "live" || s.test) && phaseRemaining !== null)
        scale = on
          ? phaseRemaining <= 1
            ? 0.4
            : 1
          : phaseRemaining <= 4
            ? 1
            : 0.4;
      // Collectibles disappear after collection. Switches and fields stay visible.
      const consumed =
        s.test &&
        ["4", "6", "8", "9"].includes(block) &&
        r < s.test.row &&
        s.test.trail.some((p) => p.row === r && p.col === c);
      if (block !== "0" && block !== "5" && !consumed) {
        ctx.save();
        ctx.translate(x, y);
        ctx.globalAlpha = on ? 1 : 0.36;
        ctx.scale(scale, scale);
        if (block === "7") {
          drawGoal(ctx, s.test || s.isPlaying ? clock / 1000 : 0, r, c);
        } else if (block === "=") {
          const channel = s.switches.get(idx) ?? "A";
          const active = !!(mask & (1 << (channel.charCodeAt(0) - 65)));
          const lever = leverFrames
            ? assets.getSpriteForBlock(
                "=",
                r,
                c,
                active,
                leverFrames[channel.charCodeAt(0) - 65],
              )
            : assets.getSpriteForBlock("=", r, c, active);
          if (lever) {
            // Generated source sprites stay high-resolution; the board footprint
            // remains exactly one 32px cell in either state.
            ctx.drawImage(lever, -16, -16, 32, 32);
          } else {
            ctx.strokeStyle = active ? "#b8e85a" : "#f69a45";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 1, 7, -Math.PI * 0.32, Math.PI * 1.32);
            ctx.stroke();
          }
        } else {
          const sprite = assets.getSpriteForBlock(block, r, c);
          if (sprite) {
            if (s.test || s.isPlaying) {
              if (["6", "8", "9"].includes(block))
                ctx.scale(
                  1 + 0.06 * Math.sin(clock / 220 + r),
                  1 + 0.06 * Math.sin(clock / 220 + r),
                );
              if (block === "4")
                ctx.translate(0, Math.sin(clock / 180 + r + c) * 1.1);
            }
            if (["1", "2", "3", "4"].includes(block) && (r * 7 + c * 3) % 2)
              ctx.scale(-1, 1);
            if (block === ":" || block === ";") {
              const v = block === ":" ? 1 : -1;
              const left = nextCell(r, c, -1, width),
                right = nextCell(r, c, 1, width);
              const lr = v > 0 ? left.row : r - 1,
                lc = v > 0 ? left.col : r % 2 ? c : c - 1;
              const rr = v > 0 ? right.row : r - 1,
                rc = v > 0 ? right.col : r % 2 ? c + 1 : c;
              if (isObstacle(grid[lr * width + ((lc + width) % width)]))
                ctx.rotate(Math.PI / 4);
              else if (isObstacle(grid[rr * width + ((rc + width) % width)]))
                ctx.rotate(-Math.PI / 4);
            }
            ctx.drawImage(
              sprite,
              -sprite.width / 4,
              -sprite.height / 4,
              sprite.width / 2,
              sprite.height / 2,
            );
          }
        }
        ctx.restore();
      }
      if (group) {
        diamond(ctx, x, y, 15);
        ctx.strokeStyle = "#58dbd3";
        ctx.lineWidth = 1 / zoom;
        ctx.stroke();
        ctx.fillStyle = "#9fe9de";
        ctx.font = `${8 / zoom}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText(group, x, y + 11 / zoom);
      }
      if (block === "=") {
        ctx.fillStyle = "#d8dfdf";
        ctx.font = `${8 / zoom}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText(s.switches.get(idx) ?? "A", x, y + 13 / zoom);
      }
      if (timer && !s.test) {
        ctx.fillStyle = on ? "#e6bf69" : "#6f7d90";
        ctx.beginPath();
        ctx.arc(x + 10, y - 10, 2 / Math.sqrt(zoom), 0, Math.PI * 2);
        ctx.fill();
      }
      if (selected.has(idx) || ghost.has(idx)) {
        diamond(ctx, x, y, 15);
        ctx.fillStyle = ghost.has(idx) ? "#b1f1bd55" : "#84b5ff30";
        ctx.fill();
        ctx.strokeStyle = "#a9c8ff";
        ctx.lineWidth = 1 / zoom;
        ctx.stroke();
      }
      if (idx === s.hoverIndex && !s.test) {
        diamond(ctx, x, y);
        ctx.strokeStyle = "#ffffffbb";
        ctx.lineWidth = 1.5 / zoom;
        ctx.stroke();
      }
    }
  }
  // Route overlay, split at horizontal wraps rather than drawing across the board.
  if (s.route?.path.length) {
    ctx.strokeStyle = "#82e6c5";
    ctx.lineWidth = 2 / zoom;
    ctx.globalAlpha = s.test ? 0.65 : 0.95;
    ctx.setLineDash([4 / zoom, 3 / zoom]);
    for (let i = 1; i < s.route.path.length; i++) {
      const a = s.route.path[i - 1],
        b = s.route.path[i];
      if (Math.abs(a.col - b.col) > 1) continue;
      const p = gridToPixel(a.col, a.row, height),
        q = gridToPixel(b.col, b.row, height);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
  const start = gridToPixel(9 % width, 0, height);
  if (!s.test) {
    ctx.fillStyle = "#93b5a6";
    ctx.font = `${11 / zoom}px system-ui`;
    ctx.textAlign = "center";
    ctx.fillText("START ↗", start.x, start.y + 28 / zoom);
  }
  if (s.test) renderSnake(ctx, s, clock, progress, assets);
  ctx.restore();
}
function renderSnake(
  ctx: DrawContext,
  s: EditorState,
  clock: number,
  progress: number,
  assets: RenderAssets,
) {
  const run = s.test!;
  const trail = run.trail.filter(
    (p, i, a) => i === 0 || p.row !== a[i - 1].row,
  );
  const at = (distance: number) => {
    const headRow =
      run.row > 0 && !run.colliding ? run.row - 1 + progress : run.row;
    const row = headRow - distance,
      lo = Math.floor(row),
      t = row - lo;
    const a = trail.find((p) => p.row === lo),
      b = trail.find((p) => p.row === lo + 1) ?? a;
    if (!a || !b) return null;
    const p = gridToPixel(a.col, a.row, s.height),
      q = gridToPixel(b.col, b.row, s.height);
    let dx = q.x - p.x;
    const span = s.width * 32;
    if (dx > span / 2) dx -= span;
    if (dx < -span / 2) dx += span;
    return {
      x: p.x + dx * t,
      y: p.y + (q.y - p.y) * t,
      direction: b.direction,
    };
  };
  for (let i = Math.ceil(Math.min(run.lives, 9) * 4); i >= 1; i--) {
    const p = at(i / 4);
    if (!p) continue;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.direction * Math.PI) / 4 + Math.sin(clock / 130 + i) * 0.035);
    assets.drawImage(
      ctx,
      i === Math.ceil(Math.min(run.lives, 9) * 4)
        ? "snabbit-tail"
        : i % 2
          ? "snabbit-body-dark-00"
          : "snabbit-body-light-00",
      0,
      0,
      0.33,
    );
    ctx.restore();
  }
  const p = at(0) ?? gridToPixel(run.col, run.row, s.height);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate((run.direction * Math.PI) / 4);
  assets.drawImage(ctx, "snabbit-jaw", 0, 2, 0.33);
  assets.drawImage(ctx, "snabbit-head-bg", 0, 0, 0.33);
  assets.drawImage(ctx, "snabbit-iris", -5, 1.65, 0.33);
  assets.drawImage(ctx, "snabbit-iris", 5, 1.65, 0.33);
  const eating = s.grid[run.row * s.width + run.col] === "4";
  assets.drawImage(
    ctx,
    eating
      ? `snabbit-head-chew-0${Math.floor(clock / 90) % 3}`
      : "snabbit-head",
    0,
    0,
    0.33,
  );
  if (run.status === "dead" || Math.floor(clock / 130) % 35 === 0) {
    assets.drawImage(ctx, "snabbit-eyelid-10", -5, 1.65, 0.33);
    assets.drawImage(ctx, "snabbit-eyelid-10", 5, 1.65, 0.33);
  }
  ctx.restore();
}
