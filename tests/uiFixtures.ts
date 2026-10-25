import { vi } from "vitest";
import { useEditorStore, EditorState } from "../src/store/editorStore";
import { editor, level, packs } from "./fixtures";
import { LevelData } from "../src/store/types";
export function resetUI(data: LevelData = level()) {
  const fresh = editor().store.getState();
  const state = Object.fromEntries(
    Object.entries(fresh).filter(([, v]) => typeof v !== "function"),
  ) as Partial<EditorState>;
  useEditorStore.setState(state);
  localStorage.clear();
  useEditorStore.getState().initialize(packs(data));
  return useEditorStore;
}
export function graphics() {
  const methods = {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    drawImage: vi.fn(),
    rotate: vi.fn(),
    fillText: vi.fn(),
    setLineDash: vi.fn(),
    setTransform: vi.fn(),
  };
  const partial: Partial<CanvasRenderingContext2D> = {
    ...methods,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    globalAlpha: 1,
    font: "",
    textAlign: "left",
    textBaseline: "middle",
  };
  return { ctx: partial as CanvasRenderingContext2D, ...methods };
}
