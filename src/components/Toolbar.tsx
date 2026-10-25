import { appURL } from "../core/paths";
import { useEditorStore } from "../store/editorStore";
import { saveRepository } from "../core/repository";
export function Toolbar() {
  const s = useEditorStore();
  return (
    <>
      <header className="topbar">
        <div className="brand">
          <img
            className="brand-mark"
            src={appURL("assets/snabbit-icon.png")}
            alt="Snabbit"
          />
          <span>
            snabbit<span className="brand-sub">workshop</span>
          </span>
        </div>
        <div className="document-title">
          <strong>{s.name}</strong>
          <span>
            {s.storageError
              ? "Draft storage unavailable"
              : s.revision !== s.savedRevision
                ? "Saving draft…"
                : "Drafts saved locally"}
          </span>
        </div>
        <div className="top-actions">
          <button
            onClick={() => s.set({ showDialog: "import" })}
            disabled={!!s.test}
          >
            Open JSON
          </button>
          <button onClick={() => s.set({ showDialog: "export" })}>
            Export…
          </button>
          <button
            className="primary"
            onClick={() => void saveRepository()}
            disabled={!s.repoHash || s.saving || !!s.test}
            title={
              s.repoHash
                ? "Save paid story JSON + gzip in this repository (⌘S)"
                : "Repository saving is available with npm run dev"
            }
          >
            {s.saving ? "Saving…" : "Save to repo"} <kbd>⌘S</kbd>
          </button>
          <button
            className="icon-button"
            aria-label="Keyboard shortcuts"
            onClick={() => s.set({ showDialog: "help" })}
          >
            ?
          </button>
        </div>
      </header>
      <div className="workspace-bar">
        <div className="history-buttons">
          <button
            aria-label="Undo"
            title="Undo (⌘Z)"
            disabled={!s.undoStack.length || !!s.test}
            onClick={s.undo}
          >
            ↶
          </button>
          <button
            aria-label="Redo"
            title="Redo (⌘⇧Z)"
            disabled={!s.redoStack.length || !!s.test}
            onClick={s.redo}
          >
            ↷
          </button>
        </div>
        <div className="timing-tabs" role="group" aria-label="Timing view">
          {(["layout", "arrival", "live"] as const).map((v) => (
            <button
              key={v}
              aria-pressed={s.timingView === v}
              className={s.timingView === v ? "active" : ""}
              onClick={() => s.set({ timingView: v, isPlaying: false })}
              disabled={!!s.test}
            >
              {v === "layout"
                ? "Layout"
                : v === "arrival"
                  ? "At arrival"
                  : "Live time"}
              {v === "arrival" && <kbd>T</kbd>}
            </button>
          ))}
        </div>
        {s.timingView === "live" && !s.test ? (
          <div className="timeline">
            <button
              aria-label={s.isPlaying ? "Pause timers" : "Animate timers"}
              onClick={() => s.set({ isPlaying: !s.isPlaying })}
            >
              {s.isPlaying ? "Ⅱ" : "▶"}
            </button>
            <input
              aria-label="Timeline"
              type="range"
              min={0}
              max={Math.max(s.height * 8, Math.ceil(s.playbackTime))}
              step={1}
              value={s.playbackTime}
              onChange={(e) =>
                s.set({ playbackTime: +e.target.value, isPlaying: false })
              }
            />
            <span>{Math.floor(s.playbackTime)} ticks</span>
          </div>
        ) : (
          <span className="view-explanation">
            {s.test
              ? "Test uses the live game clock"
              : s.timingView === "arrival"
                ? "Each row frozen at its arrival time"
                : "All blocks, without timing"}
          </span>
        )}
        <div className="canvas-actions">
          <button
            aria-label="Toggle grid"
            aria-pressed={s.showGrid}
            onClick={() => s.set({ showGrid: !s.showGrid })}
          >
            Grid
          </button>
          <button
            aria-label="Zoom out"
            onClick={() => s.set({ zoom: Math.max(0.25, s.zoom / 1.2) })}
          >
            −
          </button>
          <span>{Math.round(s.zoom * 100)}%</span>
          <button
            aria-label="Zoom in"
            onClick={() => s.set({ zoom: Math.min(5, s.zoom * 1.2) })}
          >
            ＋
          </button>
          {s.test ? (
            <>
              <button onClick={() => s.set({ testPlaying: !s.testPlaying })}>
                {s.testPlaying ? "Pause" : "Resume"}
              </button>
              <button className="primary" onClick={s.exitTest}>
                Back to edit <kbd>Esc</kbd>
              </button>
            </>
          ) : (
            <button className="primary" onClick={() => s.startTest()}>
              ▶ Playtest <kbd>P</kbd>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
