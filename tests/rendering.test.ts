import { describe, expect, it, vi } from "vitest";
import type { DrawContext } from "../src/canvas/DrawContext";
import { renderGrid } from "../src/canvas/HexGridRenderer";
import {
  createSpriteLibrary,
  spriteURL,
  type RenderAssets,
} from "../src/canvas/sprites";
import { drawGoal, goalParticles } from "../src/canvas/goalParticles";
import {
  canvasOriginX,
  gridToPixel,
  lineCells,
  pixelToGrid,
  rectangleCells,
  rowToWorldY,
} from "../src/core/hex";
import { advanceRun, startRun, type RunState } from "../src/core/simulation";
import type { EditorState } from "../src/store/editorStore";
import type { BlockChar, TimerParams } from "../src/store/types";
import { cells, editor, level, packs } from "./fixtures";

type PaintState = Pick<
  DrawContext,
  | "fillStyle"
  | "strokeStyle"
  | "globalAlpha"
  | "lineWidth"
  | "font"
  | "textAlign"
>;
interface RecordedImage {
  args: unknown[];
  alpha: number;
}
function drawing() {
  const images: RecordedImage[] = [],
    fills: { paint: DrawContext["fillStyle"]; alpha: number }[] = [],
    stack: PaintState[] = [];
  const drawImage = vi.fn<DrawContext["drawImage"]>((...args: unknown[]) => {
    images.push({ args, alpha: ctx.globalAlpha });
  });
  const scale = vi.fn<DrawContext["scale"]>(),
    translate = vi.fn<DrawContext["translate"]>(),
    rotate = vi.fn<DrawContext["rotate"]>();
  const arc = vi.fn<DrawContext["arc"]>(),
    fillText = vi.fn<DrawContext["fillText"]>(),
    setLineDash = vi.fn<DrawContext["setLineDash"]>();
  const ctx: DrawContext = {
    fillStyle: "#000",
    strokeStyle: "#000",
    globalAlpha: 1,
    lineWidth: 1,
    font: "10px sans-serif",
    textAlign: "start",
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn<DrawContext["fill"]>(() => {
      fills.push({ paint: ctx.fillStyle, alpha: ctx.globalAlpha });
    }),
    drawImage,
    scale,
    translate,
    rotate,
    arc,
    fillText,
    setLineDash,
    save: vi.fn(() => {
      stack.push({
        fillStyle: ctx.fillStyle,
        strokeStyle: ctx.strokeStyle,
        globalAlpha: ctx.globalAlpha,
        lineWidth: ctx.lineWidth,
        font: ctx.font,
        textAlign: ctx.textAlign,
      });
    }),
    restore: vi.fn(() => {
      const previous = stack.pop();
      if (previous) Object.assign(ctx, previous);
    }),
  };
  return {
    ctx,
    images,
    fills,
    drawImage,
    scale,
    translate,
    rotate,
    arc,
    fillText,
    setLineDash,
  };
}
function assets(missing = false, size = 64) {
  const image = document.createElement("img");
  image.width = size;
  image.height = size;
  return {
    image,
    getSpriteForBlock: vi.fn<RenderAssets["getSpriteForBlock"]>(() =>
      missing ? null : image,
    ),
    drawImage: vi.fn<RenderAssets["drawImage"]>(),
  };
}
function state(
  entries: Record<number, BlockChar> = {},
  patch: Partial<EditorState> = {},
): EditorState {
  const { store } = editor();
  store.getState().initialize(packs(cells(level(8, 4), entries)));
  store.getState().set({ scrollX: 0, scrollY: 0, zoom: 1, ...patch });
  return store.getState();
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
function route(switchMask = 0): NonNullable<EditorState["route"]> {
  return {
    status: "optimal",
    score: 10,
    stars: 0,
    turns: 0,
    crashes: 0,
    expanded: 4,
    path: [
      { row: 0, col: 1, direction: 1, time: 0, switchMask },
      { row: 1, col: 1, direction: 1, time: 8, switchMask },
      { row: 2, col: 3, direction: 1, time: 16, switchMask },
    ],
  };
}

describe("hex canvas coordinate contract", () => {
  it("keeps row zero at the bottom and staggers odd rows by one B_SIZE", () => {
    expect(gridToPixel(2, 0, 10)).toEqual({ x: 64, y: 176 });
    expect(gridToPixel(2, 1, 10)).toEqual({ x: 80, y: 160 });
    expect(rowToWorldY(1, 10)).toBe(160);
    expect(canvasOriginX(4, 400, 2, 10)).toBe(42);
  });
  it("round-trips every cell center and rejects positions outside all four boundaries", () => {
    for (let row = 0; row < 8; row++)
      for (let col = 0; col < 4; col++) {
        const p = gridToPixel(col, row, 8);
        expect(pixelToGrid(p.x, p.y, 4, 8, 8)).toEqual({ row, col });
      }
    for (const [x, y] of [
      [0, -100],
      [0, 1000],
      [-100, 144],
      [1000, 144],
    ])
      expect(pixelToGrid(x, y, 4, 8, 8)).toBeNull();
  });
  it("supports filled and outline rectangles in both drag directions", () => {
    expect(rectangleCells(0, 10, 4)).toEqual([0, 1, 2, 4, 5, 6, 8, 9, 10]);
    expect(rectangleCells(10, 0, 4, false)).toEqual([0, 1, 2, 4, 6, 8, 9, 10]);
    expect(rectangleCells(5, 5, 4, false)).toEqual([5]);
  });
  it("rasterizes uninterrupted lines including a click and clipped endpoints", () => {
    expect(lineCells(5, 5, 4, 8)).toEqual([5]);
    const result = lineCells(0, 10, 4, 8);
    expect(result[0]).toBe(0);
    expect(result.at(-1)).toBe(10);
    expect(new Set(result).size).toBe(result.length);
    const clipped = lineCells(-9, 10, 4, 8);
    expect(clipped.every((i) => i >= 0 && i < 32)).toBe(true);
  });
});

describe("original sprite image loading through an injected image port", () => {
  function loader(fail: (url: string) => boolean = () => false) {
    const requested: string[] = [],
      created: HTMLImageElement[] = [];
    const factory = vi.fn(() => {
      const img = document.createElement("img");
      img.width = 156;
      img.height = 124;
      let src = "";
      Object.defineProperty(img, "src", {
        get: () => src,
        set: (url: string) => {
          src = url;
          requested.push(url);
          queueMicrotask(() => {
            if (fail(url)) img.onerror?.call(img, new Event("error"));
            else img.onload?.call(img, new Event("load"));
          });
        },
      });
      created.push(img);
      return img;
    });
    return {
      factory,
      requested,
      created,
      library: createSpriteLibrary(factory),
    };
  }
  it("routes actual Snabbit art separately from world art", () => {
    expect(spriteURL("snabbit-head")).toBe("/assets/snabbit/snabbit-head.png");
    expect(spriteURL("metal00")).toBe("/assets/world/metal00.png");
  });
  it("deduplicates concurrent requests and returns a loaded image synchronously", async () => {
    const l = loader();
    expect(l.library.getSprite("star")).toBeNull();
    expect(l.library.getSprite("star")).toBeNull();
    expect(l.factory).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    expect(l.library.getSprite("star")).toBe(l.created[0]);
    expect(l.requested).toEqual(["/assets/world/star.png"]);
  });
  it("uses the browser Image factory by default and the renderer default asset adapter", () => {
    const image = document.createElement("img");
    const imageFactory = vi.fn(function () {
      return image;
    });
    vi.stubGlobal("Image", imageFactory);
    const library = createSpriteLibrary();
    expect(library.getSprite("default-factory-smoke")).toBeNull();
    expect(imageFactory).toHaveBeenCalledOnce();
    const d = drawing();
    renderGrid(d.ctx, state({ 0: "1" }), 640, 400);
    expect(imageFactory.mock.calls.length).toBeGreaterThan(1);
    expect(d.images).toHaveLength(0);
  });
  it("reports missing files without unhandled image rejections, and caches preload requests", async () => {
    const l = loader((url) => url.endsWith("/life.png"));
    const missing = await l.library.preloadSprites();
    expect(missing).toEqual(["life"]);
    const count = l.factory.mock.calls.length;
    await l.library.preloadSprites();
    expect(l.factory).toHaveBeenCalledTimes(count);
    expect(l.library.getSprite("life")).toBeNull();
    expect(l.library.getSpriteForBlock("0", 0, 0)).toBeNull();
    expect(l.library.getSpriteForBlock("1", 0, 0)).not.toBeNull();
    expect(l.library.getSpriteForBlock("1", 0, 1)).not.toBe(
      l.library.getSpriteForBlock("1", 0, 0),
    );
  });
  it("draws HD source images at half resolution without distorting their aspect ratio", async () => {
    const l = loader(),
      d = drawing();
    l.library.getSprite("snabbit-head");
    await Promise.resolve();
    l.library.drawImage(d.ctx, "snabbit-head", 10, 20);
    expect(d.drawImage).toHaveBeenLastCalledWith(
      l.created[0],
      -29,
      -11,
      78,
      62,
    );
    l.library.drawImage(d.ctx, "snabbit-head", 0, 0, 0.33);
    expect(d.drawImage).toHaveBeenLastCalledWith(
      l.created[0],
      -12.870000000000001,
      -10.23,
      25.740000000000002,
      20.46,
    );
    l.library.drawImage(d.ctx, "not-yet-loaded", 0, 0);
    expect(d.drawImage).toHaveBeenCalledTimes(2);
    await Promise.resolve();
  });
});

describe("native warm-gold finish particles", () => {
  it("is stable when frozen, animates over time, and stays within native size/alpha bounds", () => {
    const frozen = goalParticles(0, 10, 2);
    expect(goalParticles(0, 10, 2)).toEqual(frozen);
    expect(goalParticles(0.25, 10, 2)).not.toEqual(frozen);
    expect(goalParticles(0, 10, 3)).not.toEqual(frozen);
    expect(frozen.length).toBeGreaterThan(0);
    for (const p of frozen) {
      expect(p.x).toBeGreaterThanOrEqual(-18);
      expect(p.x).toBeLessThanOrEqual(18);
      expect(p.size).toBeGreaterThanOrEqual(0);
      expect(p.size).toBeLessThanOrEqual(10);
      expect(p.alpha).toBeGreaterThanOrEqual(0);
      expect(p.alpha).toBeLessThanOrEqual(1);
    }
  });
  it("draws warm gold particle dots rather than a solid tile or a green glow", () => {
    const d = drawing();
    drawGoal(d.ctx, 0, 4, 2);
    expect(d.arc).toHaveBeenCalled();
    expect(d.fills.every((fill) => fill.paint === "#ffda70")).toBe(true);
    expect(d.images).toHaveLength(0);
  });
});

describe("canvas timing, graphics and route contracts", () => {
  it("draws the original image upright at its source proportions and restores canvas state", () => {
    const d = drawing(),
      a = assets(false, 156);
    renderGrid(d.ctx, state({ 0: "<" }), 640, 400, [], 0, 1, a);
    expect(d.drawImage).toHaveBeenCalledWith(a.image, -39, -39, 78, 78);
    expect(d.ctx.globalAlpha).toBe(1);
    expect(d.fillText.mock.calls.some((call) => call[0] === "START ↗")).toBe(
      true,
    );
  });
  it("shows empty and legacy-unused cells without substituting invented sprites", () => {
    const d = drawing(),
      a = assets();
    renderGrid(d.ctx, state({ 0: "5" }), 640, 400, [], 0, 1, a);
    expect(d.images).toHaveLength(0);
  });
  it("keeps layout unchanged while arrival evaluates each block at its own row time", () => {
    const timers = new Map([[5, timer({ startState: 0 })]]);
    const layout = drawing(),
      arrival = drawing(),
      a = assets();
    renderGrid(
      layout.ctx,
      state({ 5: "1" }, { timers, timingView: "layout" }),
      640,
      400,
      [],
      0,
      1,
      a,
    );
    renderGrid(
      arrival.ctx,
      state({ 5: "1" }, { timers, timingView: "arrival" }),
      640,
      400,
      [],
      0,
      1,
      a,
    );
    expect(layout.images[0].alpha).toBe(1);
    expect(arrival.images[0].alpha).toBe(0.36);
    expect(arrival.scale).toHaveBeenCalledWith(0.4, 0.4);
  });
  it.each([
    [1, 1, 1],
    [20, 0.4, 0.36],
    [29, 1, 0.36],
    [31, 1, 0.36],
  ] as const)(
    "shows live time %i with scale %f and alpha %f",
    (time, scale, alpha) => {
      const d = drawing(),
        a = assets();
      renderGrid(
        d.ctx,
        state(
          { 5: "1" },
          {
            timers: new Map([[5, timer()]]),
            timingView: "live",
            playbackTime: time,
          },
        ),
        640,
        400,
        [],
        0,
        1,
        a,
      );
      expect(d.images[0].alpha).toBe(alpha);
      expect(d.scale).toHaveBeenCalledWith(scale, scale);
    },
  );
  it("shrinks a solid timer in its final ON tick as the native warning does", () => {
    const d = drawing();
    renderGrid(
      d.ctx,
      state(
        { 5: "1" },
        {
          timers: new Map([[5, timer()]]),
          timingView: "live",
          playbackTime: 15,
        },
      ),
      640,
      400,
      [],
      0,
      1,
      assets(),
    );
    expect(d.images[0].alpha).toBe(1);
    expect(d.scale).toHaveBeenCalledWith(0.4, 0.4);
  });
  it("shows lever sprites with default or explicit channels, including a missing source image", () => {
    const a = assets(),
      normal = drawing(),
      fallback = drawing();
    renderGrid(normal.ctx, state({ 1: "=" }), 640, 400, [], 0, 1, a);
    expect(a.getSpriteForBlock).toHaveBeenCalledWith("=", 0, 1, false);
    expect(normal.drawImage).toHaveBeenCalledWith(a.image, -16, -16, 32, 32);
    expect(normal.fillText.mock.calls.some((call) => call[0] === "A")).toBe(
      true,
    );
    renderGrid(
      fallback.ctx,
      state({ 1: "=" }, { switches: new Map([[1, "H"]]) }),
      640,
      400,
      [],
      0,
      1,
      assets(true),
    );
    expect(fallback.fillText.mock.calls.some((call) => call[0] === "H")).toBe(
      true,
    );
    expect(fallback.images).toHaveLength(0);
  });
  it("uses route-specific switch state in arrival view and current run state in playtest", () => {
    const gates = new Map([[5, "H"]]),
      preview = drawing(),
      live = drawing(),
      test = drawing(),
      a = assets();
    const s = state({ 5: "1" }, { gates, route: route(128) });
    renderGrid(preview.ctx, s, 640, 400, [], 0, 1, a);
    expect(preview.images[0].alpha).toBe(0.36);
    renderGrid(live.ctx, { ...s, timingView: "live" }, 640, 400, [], 0, 1, a);
    expect(live.images[0].alpha).toBe(1);
    renderGrid(
      test.ctx,
      { ...s, test: { ...startRun(s), switchMask: 128 } },
      640,
      400,
      [],
      100,
      1,
      a,
    );
    expect(test.images[0].alpha).toBe(0.36);
  });
  it("a switch turns a timed OFF gate solid without changing its warning phase", () => {
    const gates = new Map([[5, "A"]]),
      timers = new Map([[5, timer({ startState: 0 })]]);
    const s = state(
      { 5: "1" },
      { gates, timers, timingView: "arrival", route: route(1) },
    );
    const solid = drawing();
    renderGrid(solid.ctx, s, 640, 400, [], 0, 1, assets());
    expect(solid.images[0].alpha).toBe(1);
    const run = { ...startRun(s), time: 16, switchMask: 1 };
    const warning = drawing();
    renderGrid(
      warning.ctx,
      { ...s, test: run },
      640,
      400,
      [],
      0,
      0.875,
      assets(),
    );
    expect(warning.images[0].alpha).toBe(1);
    expect(warning.scale).toHaveBeenCalledWith(0.4, 0.4);
  });
  it("orients focus fields on even rows and leaves open fields upright", () => {
    const left = drawing(),
      right = drawing(),
      open = drawing();
    renderGrid(
      left.ctx,
      state({ 9: ";", 4: "1" }),
      640,
      400,
      [],
      0,
      1,
      assets(),
    );
    renderGrid(
      right.ctx,
      state({ 9: ";", 5: "1" }),
      640,
      400,
      [],
      0,
      1,
      assets(),
    );
    renderGrid(open.ctx, state({ 9: ";" }), 640, 400, [], 0, 1, assets());
    expect(left.rotate).toHaveBeenCalledWith(Math.PI / 4);
    expect(right.rotate).toHaveBeenCalledWith(-Math.PI / 4);
    expect(open.rotate).not.toHaveBeenCalled();
  });
  it("draws selection, shape preview and hover even on empty cells", () => {
    const d = drawing();
    renderGrid(
      d.ctx,
      state(
        {},
        { selectedIndex: 0, selection: [0], hoverIndex: 1, showGrid: false },
      ),
      640,
      400,
      [2],
      0,
      1,
      assets(),
    );
    expect(d.fills.some((fill) => fill.paint === "#84b5ff30")).toBe(true);
    expect(d.fills.some((fill) => fill.paint === "#b1f1bd55")).toBe(true);
  });
  it("splits the best-route overlay at horizontal wraps", () => {
    const d = drawing();
    renderGrid(
      d.ctx,
      state({}, { route: route() }),
      640,
      400,
      [],
      0,
      1,
      assets(),
    );
    expect(d.setLineDash).toHaveBeenCalledWith([4, 3]);
    expect(d.setLineDash).toHaveBeenLastCalledWith([]);
  });
  it.each([":", ";"] as const)(
    "rotates %s fields according to neighbouring obstacles on either side",
    (char) => {
      const leftIndex = char === ":" ? 9 : 1,
        rightIndex = char === ":" ? 10 : 2;
      const base = state({ 5: char, [leftIndex]: "1" }),
        left = drawing(),
        right = drawing();
      renderGrid(left.ctx, base, 640, 400, [], 0, 1, assets());
      const opposite = state({ 5: char, [rightIndex]: "1" });
      renderGrid(right.ctx, opposite, 640, 400, [], 0, 1, assets());
      expect(left.rotate).toHaveBeenCalledWith(Math.PI / 4);
      expect(right.rotate).toHaveBeenCalledWith(-Math.PI / 4);
    },
  );
  it("animates collectibles while live playback runs and leaves frozen previews still", () => {
    const entries: Record<number, BlockChar> = {
        0: "4",
        1: "6",
        2: "8",
        3: "9",
      },
      live = drawing(),
      frozen = drawing();
    renderGrid(
      live.ctx,
      state(entries, { isPlaying: true }),
      640,
      400,
      [],
      100,
      1,
      assets(),
    );
    renderGrid(frozen.ctx, state(entries), 640, 400, [], 100, 1, assets());
    expect(live.scale.mock.calls.length).toBeGreaterThan(
      frozen.scale.mock.calls.length,
    );
    expect(live.translate.mock.calls.length).toBeGreaterThan(
      frozen.translate.mock.calls.length,
    );
  });
  it("uses moving goal particles only while live playback or playtest is active", () => {
    const frozen0 = drawing(),
      frozen1 = drawing(),
      live = drawing();
    renderGrid(frozen0.ctx, state({ 1: "7" }), 640, 400, [], 0, 1, assets());
    renderGrid(frozen1.ctx, state({ 1: "7" }), 640, 400, [], 500, 1, assets());
    renderGrid(
      live.ctx,
      state({ 1: "7" }, { isPlaying: true }),
      640,
      400,
      [],
      500,
      1,
      assets(),
    );
    expect(frozen0.arc.mock.calls).toEqual(frozen1.arc.mock.calls);
    expect(live.arc.mock.calls).not.toEqual(frozen1.arc.mock.calls);
  });
  it("consumes only visited cells behind the snake and renders original head/eyes/body", () => {
    const s = state({ 1: "4", 4: "9" }),
      a = assets(),
      d = drawing();
    let run = startRun(s);
    for (let i = 0; i < 4; i++) run = advanceRun(s, run, 1);
    renderGrid(d.ctx, { ...s, test: run }, 640, 400, [], 1000, 0.5, a);
    expect(d.images).toHaveLength(1);
    const names = a.drawImage.mock.calls.map((call) => call[1]);
    expect(names).toContain("snabbit-head");
    expect(names).toContain("snabbit-iris");
    expect(names).toContain("snabbit-body-dark-00");
    expect(names).toContain("snabbit-body-light-00");
    expect(d.fillText.mock.calls.some((call) => call[0] === "START ↗")).toBe(
      false,
    );
  });
  it("animates chewing and closed eyelids using original frames", () => {
    const s = state({ 1: "4" }),
      a = assets(),
      d = drawing();
    renderGrid(
      d.ctx,
      { ...s, test: { ...startRun(s), status: "dead" } },
      640,
      400,
      [],
      200,
      1,
      a,
    );
    expect(a.drawImage.mock.calls.map((call) => call[1])).toContain(
      "snabbit-head-chew-02",
    );
    expect(
      a.drawImage.mock.calls.filter((call) => call[1] === "snabbit-eyelid-10"),
    ).toHaveLength(2);
  });
  it("interpolates a leftward wrap and falls back to the cell when a search state has no current trail sample", () => {
    const s = state(),
      d = drawing(),
      a = assets();
    const wrapped: RunState = {
      ...startRun(s),
      row: 3,
      col: 3,
      lives: 2,
      trail: [
        { row: 0, col: 0, direction: -1, time: 0 },
        { row: 1, col: 0, direction: -1, time: 8 },
        { row: 2, col: 3, direction: -1, time: 16 },
        { row: 3, col: 3, direction: -1, time: 24 },
      ],
    };
    renderGrid(d.ctx, { ...s, test: wrapped }, 640, 400, [], 1000, 1, a);
    expect(d.translate.mock.calls.some((call) => call[0] < 16)).toBe(true);
    const noTrail = advanceRun(s, startRun(s), 1, false),
      fallback = drawing();
    renderGrid(fallback.ctx, { ...s, test: noTrail }, 640, 400, [], 1000, 1, a);
    const p = gridToPixel(noTrail.col, noTrail.row, s.height);
    expect(fallback.translate).toHaveBeenCalledWith(p.x, p.y);
  });
  it("draws a colliding or wrapped snake without a line across the whole board", () => {
    const s = state(),
      a = assets(),
      d = drawing();
    const run: RunState = {
      ...startRun(s),
      row: 3,
      col: 0,
      colliding: true,
      lives: 1,
      trail: [
        { row: 0, col: 3, direction: 1, time: 0 },
        { row: 1, col: 3, direction: 1, time: 8 },
        { row: 2, col: 0, direction: 1, time: 16 },
        { row: 3, col: 0, direction: 1, time: 24 },
      ],
    };
    renderGrid(d.ctx, { ...s, test: run }, 640, 400, [], 1000, 0.5, a);
    expect(a.drawImage.mock.calls.map((call) => call[1])).toContain(
      "snabbit-tail",
    );
    expect(
      d.translate.mock.calls.every(
        (call) => Number.isFinite(call[0]) && Number.isFinite(call[1]),
      ),
    ).toBe(true);
  });
});
