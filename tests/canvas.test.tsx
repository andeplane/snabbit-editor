import { beforeEach, describe, it, expect, vi } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import { Canvas, CanvasPorts, browserCanvas } from "../src/components/Canvas";
import { useEditorStore } from "../src/store/editorStore";
import { gridToPixel, canvasOriginX } from "../src/core/hex";
import { startRun } from "../src/core/simulation";
import { cells, level } from "./fixtures";
import { resetUI, graphics } from "./uiFixtures";
const s = () => useEditorStore.getState();
beforeEach(() => {
  resetUI();
  const context = graphics();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    context.ctx,
  );
  vi.spyOn(HTMLCanvasElement.prototype, "clientWidth", "get").mockReturnValue(
    600,
  );
  vi.spyOn(HTMLCanvasElement.prototype, "clientHeight", "get").mockReturnValue(
    400,
  );
  vi.spyOn(
    HTMLCanvasElement.prototype,
    "getBoundingClientRect",
  ).mockReturnValue(new DOMRect(0, 0, 600, 400));
  Object.defineProperty(HTMLCanvasElement.prototype, "setPointerCapture", {
    configurable: true,
    value: vi.fn(),
  });
  class PointerDouble extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
    }
  }
  vi.stubGlobal("PointerEvent", PointerDouble);
});
function clock() {
  let callback: FrameRequestCallback = () => {};
  const stop = vi.fn(),
    cancel = vi.fn(),
    observe = vi.fn<CanvasPorts["observeSize"]>((_c, fn) => {
      fn();
      return stop;
    });
  let id = 0;
  const ports: CanvasPorts = {
    requestFrame: (fn) => {
      callback = fn;
      return ++id;
    },
    cancelFrame: cancel,
    pixelRatio: () => 2,
    observeSize: observe,
  };
  return {
    ports,
    stop,
    cancel,
    frame: (ms: number) => act(() => callback(ms)),
  };
}
function point(idx: number) {
  const state = s(),
    p = gridToPixel(
      idx % state.width,
      Math.floor(idx / state.width),
      state.height,
    );
  return {
    clientX:
      (p.x + canvasOriginX(state.width, 600, state.zoom, state.scrollX)) *
      state.zoom,
    clientY: (p.y - state.scrollY) * state.zoom,
  };
}
function down(idx: number, extra: PointerEventInit = {}) {
  fireEvent.pointerDown(screen.getByLabelText("Level canvas"), {
    ...point(idx),
    button: 0,
    buttons: 1,
    pointerId: 1,
    ...extra,
  });
}
function move(idx: number, extra: PointerEventInit = {}) {
  fireEvent.pointerMove(screen.getByLabelText("Level canvas"), {
    ...point(idx),
    buttons: 1,
    pointerId: 1,
    ...extra,
  });
}
function up() {
  fireEvent.pointerUp(screen.getByLabelText("Level canvas"), { pointerId: 1 });
}
describe("canvas editing gestures", () => {
  it("paints continuous strokes as one undo and erases with right-drag", () => {
    const t = clock();
    render(<Canvas ports={t.ports} />);
    down(0);
    move(7);
    up();
    expect(s().undoStack).toHaveLength(1);
    expect(s().grid.filter((c) => c === "1").length).toBeGreaterThan(2);
    act(() => s().undo());
    expect(s().grid.every((c) => c === "0")).toBe(true);
    act(() => s().paintStroke([0, 1], "8"));
    down(0, { button: 2, buttons: 2 });
    move(1, { buttons: 2 });
    up();
    expect(s().grid[0]).toBe("0");
    expect(s().grid[1]).toBe("0");
  });
  it("draws line and outline/filled rectangle with preview, then selects a group", () => {
    const t = clock();
    render(<Canvas ports={t.ports} />);
    act(() => s().set({ activeTool: "line" }));
    down(0);
    move(15);
    t.frame(1);
    expect(s().grid.every((c) => c === "0")).toBe(true);
    up();
    expect(s().grid[0]).toBe("1");
    act(() => {
      s().undo();
      s().set({ activeTool: "rectangle" });
    });
    down(0);
    move(15);
    up();
    expect(s().grid[5]).toBe("0");
    expect(s().grid[3]).toBe("1");
    act(() => s().undo());
    down(0);
    move(15, { shiftKey: true });
    up();
    expect(
      s()
        .grid.slice(0, 16)
        .every((c) => c === "1"),
    ).toBe(true);
    act(() => s().set({ activeTool: "select" }));
    down(0);
    move(5);
    up();
    expect(s().selection).toEqual([0, 1, 4, 5]);
  });
  it("flood fills hex-connected cells without leaking across barriers and samples materials", () => {
    resetUI(
      cells(level(), {
        1: "2",
        5: "2",
        9: "2",
        13: "2",
        17: "2",
        21: "2",
        25: "2",
        29: "2",
      }),
    );
    const t = clock();
    render(<Canvas ports={t.ports} />);
    act(() => s().set({ activeTool: "fill", activeBlockType: "4" }));
    down(0);
    expect(s().grid[0]).toBe("4");
    expect(s().grid[2]).toBe("0");
    act(() => s().set({ activeTool: "pick" }));
    down(1);
    expect(s().activeBlockType).toBe("2");
    expect(s().activeTool).toBe("paint");
    down(0, { altKey: true });
    expect(s().activeBlockType).toBe("4");
  });
  it("cancels a gesture on Escape/pointer cancellation and commits when pointer capture ends", () => {
    const t = clock();
    render(<Canvas ports={t.ports} />);
    down(0);
    move(1);
    fireEvent.pointerCancel(screen.getByLabelText("Level canvas"));
    expect(s().grid[0]).toBe("0");
    down(0);
    act(() => s().cancelGesture());
    move(1);
    up();
    expect(s().grid[1]).toBe("0");
    down(0);
    fireEvent.lostPointerCapture(screen.getByLabelText("Level canvas"));
    expect(s().undoStack.length).toBeGreaterThan(0);
    fireEvent.lostPointerCapture(screen.getByLabelText("Level canvas"));
  });
  it("handles hover, out-of-bounds input, pan and pointer leaving without edits", () => {
    const t = clock();
    render(<Canvas ports={t.ports} />);
    move(1);
    expect(s().hoverIndex).toBe(1);
    fireEvent.pointerLeave(screen.getByLabelText("Level canvas"));
    expect(s().hoverIndex).toBeNull();
    fireEvent.pointerDown(screen.getByLabelText("Level canvas"), {
      button: 0,
      clientX: -9999,
      clientY: -9999,
    });
    fireEvent.pointerDown(screen.getByLabelText("Level canvas"), { button: 4 });
    expect(s().undoStack).toHaveLength(0);
    const old = s().scrollY;
    down(0, { button: 1 });
    move(1);
    expect(s().scrollX).not.toBe(0);
    up();
    act(() => s().set({ panHeld: true }));
    down(0);
    fireEvent.pointerMove(screen.getByLabelText("Level canvas"), {
      clientX: 150,
      clientY: 100,
      buttons: 1,
    });
    up();
    expect(s().scrollY).not.toBe(old);
    act(() => s().set({ panHeld: false }));
    down(0);
    fireEvent.pointerLeave(screen.getByLabelText("Level canvas"));
    up();
    fireEvent.contextMenu(screen.getByLabelText("Level canvas"));
  });
  it("zooms around the pointer, scrolls both axes, and leaves playtests immutable", () => {
    const t = clock();
    render(<Canvas ports={t.ports} />);
    const canvas = screen.getByLabelText("Level canvas"),
      zoom = s().zoom;
    fireEvent.wheel(canvas, {
      clientX: 200,
      clientY: 200,
      deltaY: -30,
      ctrlKey: true,
    });
    expect(s().zoom).toBeGreaterThan(zoom);
    fireEvent.wheel(canvas, {
      clientX: 200,
      clientY: 200,
      deltaY: 40,
      metaKey: true,
    });
    const y = s().scrollY;
    fireEvent.wheel(canvas, { deltaY: 30, deltaX: 10 });
    expect(s().scrollY).toBeGreaterThan(y);
    fireEvent.wheel(canvas, { deltaY: 20, shiftKey: true });
    act(() => s().startTest());
    const before = s().zoom;
    fireEvent.wheel(canvas, { deltaY: 50, ctrlKey: true });
    down(0);
    expect(s().zoom).toBe(before);
    expect(s().undoStack).toHaveLength(0);
  });
});
describe("injected animation clock and playtest states", () => {
  it("animates live timing, advances at native speed, pauses and finishes without changing the level", () => {
    resetUI(cells(level(), { 10: "7" }));
    const t = clock(),
      view = render(<Canvas ports={t.ports} />);
    act(() => s().set({ isPlaying: true, timingView: "live" }));
    t.frame(100);
    t.frame(140);
    expect(s().playbackTime).toBeGreaterThan(0);
    act(() => s().startTest());
    t.frame(200);
    for (let ms = 280; ms < 1200; ms += 80) t.frame(ms);
    expect(s().test?.status).toBe("finished");
    expect(screen.getByRole("status").textContent).toContain("LEVEL COMPLETE");
    fireEvent.click(screen.getByRole("button", { name: /Try again/ }));
    expect(s().test?.row).toBe(0);
    act(() => s().set({ testPlaying: false }));
    t.frame(1300);
    expect(screen.getByRole("status").textContent).toContain("PAUSED");
    view.unmount();
    expect(t.cancel).toHaveBeenCalled();
    expect(t.stop).toHaveBeenCalled();
  });
  it("renders failure, limits catchup work and follows the run while colliding", () => {
    const t = clock();
    render(<Canvas ports={t.ports} />);
    act(() => {
      s().startTest();
      s().set({
        test: { ...startRun(s()), status: "dead", lives: 0, score: 200 },
        testPlaying: false,
      });
    });
    expect(screen.getByRole("status").textContent).toContain("OUT OF LIVES");
    act(() =>
      s().set({
        test: { ...startRun(s()), speed: 9, baseSpeed: 9 },
        testPlaying: true,
      }),
    );
    t.frame(1);
    t.frame(81);
    expect(s().test!.row).toBeLessThanOrEqual(5);
    act(() =>
      s().set({
        test: { ...startRun(s()), colliding: true },
        testPlaying: true,
      }),
    );
    t.frame(161);
    expect(s().test?.colliding).toBe(true);
  });
  it("browser animation ports delegate resize, frame request/cancel and pixel density", () => {
    const frame = vi.fn(() => 123),
      cancel = vi.fn(),
      observe = vi.fn(),
      disconnect = vi.fn();
    vi.stubGlobal("requestAnimationFrame", frame);
    vi.stubGlobal("cancelAnimationFrame", cancel);
    class ResizeDouble {
      observe = observe;
      disconnect = disconnect;
    }
    vi.stubGlobal("ResizeObserver", ResizeDouble);
    expect(browserCanvas.requestFrame(() => {})).toBe(123);
    browserCanvas.cancelFrame(123);
    expect(cancel).toHaveBeenCalledWith(123);
    expect(browserCanvas.pixelRatio()).toBeGreaterThan(0);
    const canvas = document.createElement("canvas"),
      stop = browserCanvas.observeSize(canvas, () => {});
    expect(observe).toHaveBeenCalledWith(canvas);
    stop();
    expect(disconnect).toHaveBeenCalled();
  });
});
