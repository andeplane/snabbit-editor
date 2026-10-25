import { useEffect } from "react";
import { useEditorStore } from "../store/editorStore";
import { PRIMARY_BLOCKS, FIELD_BLOCKS, TOOLS } from "../components/Palette";
import { saveRepository } from "./repository";
export function useShortcuts(findRoute: () => void) {
  useEffect(() => {
    function down(e: KeyboardEvent) {
      const s = useEditorStore.getState(),
        key = e.key.toLowerCase(),
        mod = e.metaKey || e.ctrlKey;
      const editing =
        e.target instanceof HTMLElement &&
        !!e.target.closest('input,textarea,select,[contenteditable="true"]');
      if (mod && key === "s") {
        e.preventDefault();
        if (!s.showDialog) void saveRepository();
        return;
      }
      if (s.showDialog) {
        if (key === "escape") {
          e.preventDefault();
          s.set({ showDialog: null });
        }
        return;
      }
      if (editing) return;
      if (key === "escape") {
        e.preventDefault();
        if (s.test) s.exitTest();
        else if (s.menu) s.set({ menu: null });
        else if (s.gesture) s.cancelGesture();
        else s.set({ selection: [], selectedIndex: null });
        return;
      }
      if (s.test) {
        if (e.repeat && ["arrowleft", "arrowright", "r", " "].includes(key))
          return;
        if (key === "arrowleft" || key === "arrowright") {
          e.preventDefault();
          s.set({
            testDirection: key === "arrowleft" ? -1 : 1,
            testAutopilot: false,
          });
        }
        if (key === " ") {
          e.preventDefault();
          s.set({ testPlaying: !s.testPlaying });
        }
        if (key === "arrowup" || key === "arrowdown") {
          e.preventDefault();
          s.set({ testPlaying: false });
          s.stepTest();
        }
        if (key === "r") {
          e.preventDefault();
          s.startTest();
        }
        return;
      }
      if (mod) {
        if (key === "z") {
          e.preventDefault();
          s.endGesture();
          if (e.shiftKey) s.redo();
          else s.undo();
        }
        if (key === "y") {
          e.preventDefault();
          s.redo();
        }
        if (key === "c") {
          e.preventDefault();
          s.copy();
        }
        if (key === "v") {
          e.preventDefault();
          s.paste();
        }
        if (key === "x") {
          e.preventDefault();
          s.copy();
          s.deleteSelection();
        }
        if (key === "a") {
          e.preventDefault();
          s.set({ selection: s.grid.map((_, i) => i), selectedIndex: 0 });
        }
        return;
      }
      if (e.repeat && key !== " ") return;
      if (s.menu && /^[1-9]$/.test(key)) {
        e.preventDefault();
        const n = +key - 1;
        if (s.menu === "tools" && TOOLS[n])
          s.set({ activeTool: TOOLS[n].tool, menu: null });
        else if (s.menu === "blocks" && n === 8) s.set({ menu: "fields" });
        else {
          const chars = s.menu === "fields" ? FIELD_BLOCKS : PRIMARY_BLOCKS;
          if (chars[n])
            s.set({
              activeBlockType: chars[n],
              activeTool: "paint",
              menu: null,
            });
        }
        return;
      }
      const tool = TOOLS.find((t) => t.key.toLowerCase() === key);
      if (tool) {
        e.preventDefault();
        s.set({ activeTool: tool.tool, menu: null });
        return;
      }
      if (key === "1") {
        e.preventDefault();
        s.set({ menu: "tools" });
      }
      if (key === "2") {
        e.preventDefault();
        s.set({ menu: "blocks" });
      }
      if (key === "3" || key === "t") {
        e.preventDefault();
        s.set({ timingView: s.timingView === "arrival" ? "live" : "arrival" });
      }
      if (key === "4" || key === "f") {
        e.preventDefault();
        findRoute();
      }
      if (key === "5" || key === "p" || key === "enter") {
        e.preventDefault();
        s.startTest();
      }
      if (key === " ") {
        e.preventDefault();
        s.set({ panHeld: true });
      }
      if (key === "delete" || key === "backspace") {
        e.preventDefault();
        s.deleteSelection();
      }
      if (key === "+" || key === "=")
        s.set({ zoom: Math.min(5, s.zoom * 1.2) });
      if (key === "-") s.set({ zoom: Math.max(0.25, s.zoom / 1.2) });
      if (key === "0") s.set({ zoom: 1.25, scrollX: 0 });
      if (key === "home") {
        e.preventDefault();
        s.set({ scrollY: s.height * 16 - 270 });
      }
      if (key === "end") {
        e.preventDefault();
        s.set({ scrollY: -40 });
      }
      if (key === "?") s.set({ showDialog: "help" });
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") useEditorStore.getState().set({ panHeld: false });
    };
    const blur = () =>
      useEditorStore.getState().set({ panHeld: false, menu: null });
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [findRoute]);
}
