import { useEffect } from "react";
import { Toolbar } from "./components/Toolbar";
import { Library } from "./components/Library";
import { Canvas } from "./components/Canvas";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { ImportExportDialog } from "./components/ImportExportDialog";
import { useEditorStore } from "./store/editorStore";
import { loadRepository } from "./core/repository";
import { useRouteFinder } from "./core/useRouteFinder";
import { useShortcuts } from "./core/useShortcuts";
import "./App.css";
let loading = false;
export function App() {
  const s = useEditorStore(),
    find = useRouteFinder();
  useShortcuts(find);
  useEffect(() => {
    if (!loading) {
      loading = true;
      void loadRepository();
    }
    const leave = (e: BeforeUnloadEvent) => {
      const state = useEditorStore.getState();
      state.endGesture();
      if (state.revision !== state.savedRevision) state.saveDraft();
      if (useEditorStore.getState().storageError) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, []);
  const idx = s.hoverIndex ?? s.selectedIndex;
  return (
    <div className="app">
      <Toolbar />
      {(s.libraryError || s.storageError || s.notice) && (
        <div
          className={
            s.libraryError ||
            s.storageError ||
            s.notice.startsWith("Save failed")
              ? "notice error"
              : "notice"
          }
          role="status"
        >
          <span>
            {s.libraryError
              ? `Couldn’t load levels: ${s.libraryError}`
              : s.storageError || s.notice}
          </span>
          {s.libraryError && (
            <button onClick={() => void loadRepository()}>
              Retry loading levels
            </button>
          )}
          {!s.libraryError && !s.storageError && (
            <button
              aria-label="Dismiss notification"
              onClick={() => s.set({ notice: "" })}
            >
              ✕
            </button>
          )}
        </div>
      )}
      <main className="editor-body">
        <Library />
        <Canvas />
        <PropertiesPanel findRoute={find} />
      </main>
      <footer className="statusbar">
        <span>
          <span className="status-light" />
          {s.test
            ? "PLAYTEST"
            : s.timingView === "arrival"
              ? "ARRIVAL VIEW"
              : s.timingView === "live"
                ? "LIVE TIME"
                : "LAYOUT"}
        </span>
        <span>
          {idx !== null
            ? `Row ${Math.floor(idx / s.width)} · Col ${idx % s.width}`
            : "Hover a cell to inspect coordinates"}
        </span>
        <span>
          {s.width} × {s.height}
        </span>
        <span className="status-help">
          Space-drag pan · ⌘-scroll zoom ·{" "}
          <button onClick={() => s.set({ showDialog: "help" })}>
            ? Shortcuts
          </button>
        </span>
      </footer>
      {s.showDialog && <ImportExportDialog key={s.showDialog} />}
    </div>
  );
}
