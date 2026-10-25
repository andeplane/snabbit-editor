import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "../store/editorStore";
import { validateLevel, parseStoryData } from "../core/serialization";
import { downloadJSON } from "../core/repository";
import { LevelData, LevelPackData } from "../store/types";
export function ImportExportDialog() {
  const s = useEditorStore(),
    mode = s.showDialog,
    ref = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(""),
    [error, setError] = useState(""),
    [packs, setPacks] = useState<Record<string, LevelPackData> | null>(null),
    [pack, setPack] = useState(""),
    [level, setLevel] = useState(""),
    [copied, setCopied] = useState(false);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const target = ref.current;
    target?.querySelector<HTMLElement>("button,input,textarea")?.focus();
    function trap(e: KeyboardEvent) {
      if (e.key !== "Tab" || !target) return;
      const els = [
        ...target.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input:not(:disabled),textarea,select,a[href]",
        ),
      ];
      if (!els.length) return;
      const first = els[0],
        last = els.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", trap);
    return () => {
      window.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, []);
  const close = () => s.set({ showDialog: null });
  function parse(value: string) {
    setText(value);
    setError("");
    setPacks(null);
    try {
      const d = JSON.parse(value);
      if (!d.grid) {
        const p = parseStoryData(value);
        setPacks(p);
        const first = Object.keys(p)[0];
        setPack(first);
        setLevel(p[first].levels[0]?._id ?? "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  async function file(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      parse(await f.text());
    } catch (err) {
      setError(String(err));
    }
  }
  function open() {
    try {
      let data: LevelData;
      if (packs) {
        const l = packs[pack]?.levels.find((l) => l._id === level);
        if (!l) throw new Error("Choose a level.");
        data = l;
        s.set({ library: packs });
      } else data = validateLevel(JSON.parse(text));
      s.loadLevel(data, packs ? pack : "drafts", false);
      s.set({
        showDialog: null,
        notice: "Opened JSON. Your changes will be saved as a local draft.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  const exported = JSON.stringify(s.exportToJSON(), null, 2);
  return (
    <div
      className="dialog-overlay"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        ref={ref}
      >
        <div className="dialog-header">
          <div>
            <span className="eyebrow">SNABBIT WORKSHOP</span>
            <h2 id="dialog-title">
              {mode === "help"
                ? "Make room for a good idea."
                : mode === "import"
                  ? "Open level JSON"
                  : "Take your level with you."}
            </h2>
          </div>
          <button aria-label="Close dialog" onClick={close}>
            ✕
          </button>
        </div>
        <div className="dialog-body">
          {mode === "help" ? (
            <>
              <p>
                Choose a game level on the left. Paint, test, and repeat. Every
                edit is recoverable with undo; drafts save automatically in this
                browser.
              </p>
              <div className="shortcut-table">
                {[
                  ["1 → 1–7", "Choose a tool"],
                  ["2 → 1–9", "Choose a block; 9 opens fields & switches"],
                  [
                    "B / E / L / U / G / M / I",
                    "Brush / erase / line / rectangle / fill / select / pick",
                  ],
                  ["Right drag / Alt-click", "Temporary erase / pick material"],
                  ["Shift + rectangle", "Draw a filled rectangle"],
                  [
                    "Space + drag / wheel",
                    "Pan / scroll; Shift-wheel scrolls sideways",
                  ],
                  [
                    "⌘ + wheel / + / −",
                    "Zoom around the pointer / zoom in / out",
                  ],
                  ["Home / End", "Jump to start / top of level"],
                  ["⌘Z / ⌘⇧Z", "Undo / redo a whole gesture"],
                  [
                    "⌘C / ⌘V / ⌘X",
                    "Copy / paste at hovered cell / cut selection",
                  ],
                  [
                    "⌘A / Delete",
                    "Select all / erase selected cells and their timers",
                  ],
                  ["T / F / P", "Arrival view / best route / playtest"],
                  ["← / →", "Steer during playtest"],
                  [
                    "Space / ↑ / R / Esc",
                    "Pause / single step / restart / return to editing",
                  ],
                  ["⌘S / ?", "Save repository JSON / this guide"],
                ].map(([key, label]) => (
                  <div key={key}>
                    <kbd>{key}</kbd>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <p className="hint">
                Arrival view assumes uninterrupted movement. For switch levels,
                the route overlay supplies each row’s switch state; without a
                route, switches start off. Live time and playtest show changes
                as they happen.
              </p>
            </>
          ) : mode === "import" ? (
            <>
              <p className="hint">
                Open one level or a complete story JSON. Game levels from this
                checkout already appear in the library.
              </p>
              <input
                autoFocus
                type="file"
                aria-label="JSON file"
                accept=".json,.txt,application/json"
                onChange={file}
              />
              <textarea
                aria-label="Level JSON"
                placeholder="Or paste JSON here…"
                rows={9}
                value={text}
                onChange={(e) => parse(e.target.value)}
              />
              {packs && (
                <div className="field-pairs">
                  <label className="field">
                    <span>Pack</span>
                    <select
                      value={pack}
                      onChange={(e) => {
                        setPack(e.target.value);
                        setLevel(packs[e.target.value].levels[0]?._id ?? "");
                      }}
                    >
                      {Object.entries(packs).map(([id, p]) => (
                        <option key={id} value={id}>
                          {p.name} ({p.levels.length})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Level</span>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                    >
                      {packs[pack]?.levels.map((l) => (
                        <option key={l._id} value={l._id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
              {error && (
                <p className="error-box" role="alert">
                  {error}
                </p>
              )}
              <div className="inline-actions">
                <button onClick={close}>Cancel</button>
                <button
                  className="primary"
                  disabled={!text.trim() || !!error}
                  onClick={open}
                >
                  Open {packs ? "selected level" : "level"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="hint">
                Single-level JSON is ready for the game’s level format. Complete
                story export includes the original packs, edits, and new levels
                in Pack 4.
              </p>
              <div className="export-options">
                <button
                  className="primary"
                  onClick={() =>
                    downloadJSON(
                      s.exportToJSON(),
                      `${s.levelId}-${s.name.replace(/[^a-z0-9]/gi, "-")}.json`,
                    )
                  }
                >
                  Download level JSON
                </button>
                <button
                  onClick={() =>
                    downloadJSON(s.exportCollection(), "storyData.txt")
                  }
                >
                  Download all packs
                </button>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(exported);
                      setCopied(true);
                    } catch {
                      setError("Clipboard unavailable. Download JSON instead.");
                    }
                  }}
                >
                  {copied ? "Copied ✓" : "Copy level JSON"}
                </button>
              </div>
              {error && <p className="error-box">{error}</p>}
              <pre className="json-output">{exported}</pre>
              <p className="hint">
                “Save to repo” writes paid storyData.txt and its gzip, and backs
                up the previous JSON. Downloads also work in standalone builds.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
