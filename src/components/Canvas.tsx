import { useRef, useEffect, useState } from "react";
import { useEditorStore } from "../store/editorStore";
import { renderGrid } from "../canvas/HexGridRenderer";
import {
  pixelToGrid,
  canvasOriginX,
  lineCells,
  rectangleCells,
  gridToPixel,
} from "../core/hex";
import { BlockChar } from "../store/types";
import { FPT } from "../store/types";
function flood(
  start: number,
  grid: BlockChar[],
  width: number,
  height: number,
) {
  const original = grid[start],
    visited = new Set<number>([start]),
    queue = [start];
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q],
      r = Math.floor(i / width),
      c = i % width;
    for (const [nr, nc] of [
      [r, c - 1],
      [r, c + 1],
      [r - 1, c - (r % 2 ? 0 : 1)],
      [r - 1, c + (r % 2 ? 1 : 0)],
      [r + 1, c - (r % 2 ? 0 : 1)],
      [r + 1, c + (r % 2 ? 1 : 0)],
    ]) {
      const n = nr * width + nc;
      if (
        nr >= 0 &&
        nr < height &&
        nc >= 0 &&
        nc < width &&
        !visited.has(n) &&
        grid[n] === original
      ) {
        visited.add(n);
        queue.push(n);
      }
    }
  }
  return queue;
}
export interface CanvasPorts {
  requestFrame: (fn: FrameRequestCallback) => number;
  cancelFrame: (id: number) => void;
  pixelRatio: () => number;
  observeSize: (canvas: HTMLCanvasElement, fn: () => void) => () => void;
}
export const browserCanvas: CanvasPorts = {
  requestFrame: (fn) => requestAnimationFrame(fn),
  cancelFrame: (id) => cancelAnimationFrame(id),
  pixelRatio: () => window.devicePixelRatio || 1,
  observeSize: (canvas, fn) => {
    const observer = new ResizeObserver(fn);
    observer.observe(canvas);
    return () => observer.disconnect();
  },
};
export function Canvas({ ports = browserCanvas }: { ports?: CanvasPorts }) {
  const ref = useRef<HTMLCanvasElement>(null),
    drag = useRef<{
      start: number;
      last: number;
      type: BlockChar;
      pan: boolean;
      x: number;
      y: number;
      sx: number;
      sy: number;
    } | null>(null);
  const preview = useRef<number[]>([]),
    [cursor, setCursor] = useState("crosshair");
  const test = useEditorStore((s) => s.test),
    playing = useEditorStore((s) => s.testPlaying);
  useEffect(() => {
    const canvas = ref.current!,
      ctx = canvas.getContext("2d")!;
    const resize = () => {
      const dpr = ports.pixelRatio();
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
    };
    const stopObserving = ports.observeSize(canvas, resize);
    resize();
    let raf = 0,
      last = 0,
      acc = 0;
    function frame(ts: number) {
      const s = useEditorStore.getState(),
        dt = last ? Math.min(ts - last, 80) : 0;
      last = ts;
      if (s.test && s.testPlaying && s.test.status === "running") {
        acc += dt;
        let steps = 0;
        while (
          acc >= (FPT[useEditorStore.getState().test!.speed] * 1000) / 60 &&
          steps++ < 5
        ) {
          acc -= (FPT[useEditorStore.getState().test!.speed] * 1000) / 60;
          useEditorStore.getState().stepTest();
          if (useEditorStore.getState().test!.status !== "running") {
            acc = 0;
            break;
          }
        }
      } else {
        acc = 0;
        if (s.isPlaying && !s.test)
          s.set({
            playbackTime:
              s.playbackTime + (dt * 8) / ((FPT[s.playbackSpeed] * 1000) / 60),
          });
      }
      const current = useEditorStore.getState();
      const fraction =
        current.testPlaying && current.test
          ? Math.min(1, acc / ((FPT[current.test.speed] * 1000) / 60))
          : 1;
      if (current.test) {
        const p = gridToPixel(
          current.test.col,
          current.test.row,
          current.height,
        );
        const desiredY =
          p.y +
          (!current.test.colliding && current.test.row > 0
            ? (1 - fraction) * 16
            : 0) -
          (canvas.clientHeight / current.zoom) * 0.68;
        const origin = canvasOriginX(
          current.width,
          canvas.clientWidth,
          current.zoom,
          0,
        );
        const sx = origin + p.x - canvas.clientWidth / current.zoom / 2;
        current.set({ scrollY: desiredY, scrollX: sx });
      }
      const dpr = ports.pixelRatio();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderGrid(
        ctx,
        useEditorStore.getState(),
        canvas.clientWidth,
        canvas.clientHeight,
        preview.current,
        ts,
        fraction,
      );
      raf = ports.requestFrame(frame);
    }
    raf = ports.requestFrame(frame);
    return () => {
      stopObserving();
      ports.cancelFrame(raf);
    };
  }, [ports]);
  const levelId = useEditorStore((s) => s.levelId),
    width = useEditorStore((s) => s.width);
  useEffect(() => {
    const canvas = ref.current!,
      s = useEditorStore.getState();
    const zoom = Math.min(
      1.5,
      Math.max(0.25, (canvas.clientWidth - 55) / (s.width * 32)),
    );
    s.set({
      zoom,
      scrollX: 0,
      scrollY: s.height * 16 + 16 - (canvas.clientHeight / zoom) * 0.68,
    });
  }, [levelId, width]);
  useEffect(() => {
    const canvas = ref.current!;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = useEditorStore.getState();
      if (s.test) return;
      if (e.ctrlKey || e.metaKey) {
        const rect = canvas.getBoundingClientRect(),
          mx = e.clientX - rect.left,
          my = e.clientY - rect.top;
        const oldOrigin = canvasOriginX(
          s.width,
          canvas.clientWidth,
          s.zoom,
          s.scrollX,
        );
        const wx = mx / s.zoom - oldOrigin,
          wy = my / s.zoom + s.scrollY;
        const zoom = Math.max(
          0.25,
          Math.min(5, s.zoom * Math.exp(-e.deltaY * 0.003)),
        );
        s.set({
          zoom,
          scrollY: wy - my / zoom,
          scrollX:
            canvasOriginX(s.width, canvas.clientWidth, zoom, 0) +
            wx -
            mx / zoom,
        });
      } else
        s.set({
          scrollY: s.scrollY + e.deltaY / s.zoom,
          scrollX: s.scrollX + (e.shiftKey ? e.deltaY : e.deltaX) / s.zoom,
        });
    };
    canvas.addEventListener("wheel", wheel, { passive: false });
    return () => canvas.removeEventListener("wheel", wheel);
  }, []);
  useEffect(() => {
    if (!useEditorStore.getState().gesture) {
      preview.current = [];
      if (drag.current && !drag.current.pan) drag.current = null;
    }
  }, [useEditorStore((s) => s.gesture)]);
  const pos = (e: React.PointerEvent) => {
    const s = useEditorStore.getState(),
      canvas = ref.current!,
      rect = canvas.getBoundingClientRect();
    return pixelToGrid(
      (e.clientX - rect.left) / s.zoom -
        canvasOriginX(s.width, canvas.clientWidth, s.zoom, s.scrollX),
      (e.clientY - rect.top) / s.zoom + s.scrollY,
      s.width,
      s.height,
      s.height,
    );
  };
  const index = (e: React.PointerEvent) => {
    const p = pos(e);
    return p ? p.row * useEditorStore.getState().width + p.col : null;
  };
  function update(e: React.PointerEvent, idx: number) {
    const s = useEditorStore.getState(),
      d = drag.current;
    if (!d || d.pan) return;
    if (s.activeTool === "paint" || s.activeTool === "erase" || e.buttons === 2)
      s.paintStroke(lineCells(d.last, idx, s.width, s.height), d.type);
    if (s.activeTool === "line")
      preview.current = lineCells(d.start, idx, s.width, s.height);
    if (s.activeTool === "rectangle")
      preview.current = rectangleCells(d.start, idx, s.width, e.shiftKey);
    if (s.activeTool === "select") {
      const selection = rectangleCells(d.start, idx, s.width);
      s.set({ selection, selectedIndex: d.start });
    }
    d.last = idx;
  }
  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    const s = useEditorStore.getState();
    if (s.test || ![0, 1, 2].includes(e.button)) return;
    ref.current!.focus();
    ref.current!.setPointerCapture(e.pointerId);
    if (s.panHeld || e.button === 1) {
      drag.current = {
        start: 0,
        last: 0,
        type: "0",
        pan: true,
        x: e.clientX,
        y: e.clientY,
        sx: s.scrollX,
        sy: s.scrollY,
      };
      setCursor("grabbing");
      return;
    }
    const idx = index(e);
    if (idx === null) return;
    s.set({ selectedIndex: idx, hoverIndex: idx, menu: null });
    if (s.activeTool === "pick" || e.altKey) {
      s.set({ activeBlockType: s.grid[idx], activeTool: "paint" });
      return;
    }
    s.beginGesture();
    const type =
      e.button === 2 || s.activeTool === "erase" ? "0" : s.activeBlockType;
    drag.current = {
      start: idx,
      last: idx,
      type,
      pan: false,
      x: e.clientX,
      y: e.clientY,
      sx: s.scrollX,
      sy: s.scrollY,
    };
    if (s.activeTool === "fill") {
      s.paintStroke(flood(idx, s.grid, s.width, s.height), type);
      finish();
      return;
    }
    update(e, idx);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    const s = useEditorStore.getState(),
      d = drag.current;
    if (d?.pan) {
      s.set({
        scrollX: d.sx - (e.clientX - d.x) / s.zoom,
        scrollY: d.sy - (e.clientY - d.y) / s.zoom,
      });
      return;
    }
    const idx = index(e);
    s.set({ hoverIndex: idx });
    if (idx !== null && d) update(e, idx);
  }
  function finish() {
    const s = useEditorStore.getState();
    if (
      s.gesture &&
      preview.current.length &&
      ["line", "rectangle"].includes(s.activeTool)
    )
      s.paintStroke(preview.current, drag.current?.type ?? s.activeBlockType);
    s.endGesture();
    drag.current = null;
    preview.current = [];
    setCursor("crosshair");
  }
  return (
    <div className="canvas-shell">
      <canvas
        aria-label="Level canvas"
        data-testid="level-canvas"
        ref={ref}
        tabIndex={0}
        style={{ cursor: test ? "default" : cursor }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={() => {
          useEditorStore.getState().cancelGesture();
          drag.current = null;
          preview.current = [];
        }}
        onLostPointerCapture={() => {
          if (drag.current) finish();
        }}
        onPointerLeave={() => {
          if (!drag.current)
            useEditorStore.getState().set({ hoverIndex: null });
        }}
        onContextMenu={(e) => e.preventDefault()}
      />
      {test && (
        <div className="test-hud" role="status">
          <span className="eyebrow">
            {test.status === "finished"
              ? "LEVEL COMPLETE"
              : test.status === "dead"
                ? "OUT OF LIVES"
                : playing
                  ? "PLAYTEST"
                  : "PAUSED"}
          </span>
          <strong>
            {Math.floor(test.score).toLocaleString()} <small>points</small>
          </strong>
          <span>
            {"♥".repeat(Math.max(0, Math.min(12, Math.ceil(test.lives))))} ·{" "}
            {test.stars}/3 stars · {test.turns} turns
          </span>
          <span className="muted">
            ← → steer · Space pause · ↑ step · R restart · Esc edit
          </span>
          {test.status !== "running" && (
            <button onClick={() => useEditorStore.getState().startTest()}>
              Try again <kbd>R</kbd>
            </button>
          )}
        </div>
      )}
      {!test && (
        <div className="canvas-corner">
          UPWARD TRAVEL ↑ <span>Edges wrap ↔</span>
        </div>
      )}
    </div>
  );
}
