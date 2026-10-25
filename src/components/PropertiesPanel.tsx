import { useState, useEffect } from "react";
import { useEditorStore } from "../store/editorStore";
import { TimerEditor } from "./TimerEditor";
import { BLOCK_MAP } from "../store/types";
import { BlockIcon } from "./Palette";
import { isObstacle } from "../core/simulation";
export function PropertiesPanel({ findRoute }: { findRoute: () => void }) {
  const s = useEditorStore(),
    idx = s.selectedIndex,
    r = idx !== null ? Math.floor(idx / s.width) : 0,
    c = idx !== null ? idx % s.width : 0;
  const char = idx !== null ? s.grid[idx] : null,
    def = char ? BLOCK_MAP.get(char) : null;
  const indices = s.selection.length ? s.selection : idx !== null ? [idx] : [];
  const [w, setW] = useState(s.width),
    [h, setH] = useState(s.height),
    [name, setName] = useState(s.name),
    [credits, setCredits] = useState(s.credits);
  useEffect(() => {
    setW(s.width);
    setH(s.height);
    setName(s.name);
    setCredits(s.credits);
  }, [s.width, s.height, s.name, s.credits]);
  return (
    <aside className="properties-panel">
      <section className="panel-section">
        <div className="section-heading">
          <span>ROUTE LAB</span>
          <span>A*</span>
        </div>
        <p className="hint">
          Maximize game score, including turn penalties, stars and diamonds.
        </p>
        <label className="check-field">
          <input
            type="checkbox"
            checked={s.allowDamage}
            disabled={!!s.test}
            onChange={(e) =>
              s.set({ allowDamage: e.target.checked, route: null })
            }
          />
          Allow damage and use hearts
        </label>
        <button
          className={s.searchRunning ? "" : "primary wide"}
          onClick={findRoute}
          disabled={!!s.test}
        >
          {s.searchRunning ? "Cancel search" : "Find best route"} <kbd>F</kbd>
        </button>
        {s.searchRunning && (
          <p className="search-progress" role="status">
            <span className="spinner" />
            {s.searchExpanded.toLocaleString()} states explored
          </p>
        )}
        {s.route && (
          <div className="route-result">
            <span className="eyebrow">
              {s.route.status === "optimal"
                ? "OPTIMAL ROUTE"
                : s.route.status === "limited"
                  ? "SEARCH LIMIT REACHED"
                  : "NO ROUTE"}
            </span>
            {s.route.path.length > 0 && (
              <>
                <strong>
                  {Math.floor(s.route.score).toLocaleString()}{" "}
                  <small>points</small>
                </strong>
                <span>
                  {s.route.turns} turns · {s.route.stars}/3 stars ·{" "}
                  {s.route.crashes} crashes
                </span>
                <button onClick={() => s.startTest(true)}>
                  Watch route <span>↗</span>
                </button>
                <button onClick={() => s.set({ route: null })}>
                  Hide route
                </button>
              </>
            )}
          </div>
        )}
        <p className="hint">
          {s.allowDamage
            ? "Search includes collisions and life pickups."
            : "Search proves the best collision-free route."}{" "}
          Larger searches can stop at a state limit.
        </p>
      </section>
      <section className="panel-section">
        <div className="section-heading">
          <span>
            {indices.length > 1
              ? `${indices.length} CELLS SELECTED`
              : "CELL INSPECTOR"}
          </span>
          {idx !== null && (
            <span>
              {r} : {c}
            </span>
          )}
        </div>
        {idx !== null && char && def ? (
          <>
            <div className="inspected-block">
              <BlockIcon type={char} />
              <strong>{def.name}</strong>
              <code>#{idx}</code>
            </div>
            <div className="inline-actions">
              <button onClick={s.copy} disabled={!!s.test}>
                Copy <kbd>⌘C</kbd>
              </button>
              <button onClick={s.deleteSelection} disabled={!!s.test}>
                Delete <kbd>⌫</kbd>
              </button>
            </div>
            {(char === "=" || isObstacle(char)) && (
              <label className="field">
                <span>{char === "=" ? "Switch channel" : "Gate channel"}</span>
                <select
                  value={
                    (char === "=" ? s.switches : s.gates).get(idx) ??
                    (char === "=" ? "A" : "")
                  }
                  disabled={!!s.test}
                  onChange={(e) =>
                    s.setChannel(indices, e.target.value || null)
                  }
                >
                  {char !== "=" && <option value="">Ordinary block</option>}
                  {"ABCDEFGH".split("").map((g) => (
                    <option key={g} value={g}>
                      Channel {g}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {char !== "0" && char !== "=" && (
              <fieldset disabled={!!s.test}>
                <TimerEditor
                  index={idx}
                  row={r}
                  col={c}
                  count={indices.length}
                  timer={s.timers.get(idx) ?? null}
                  onSave={(params) => s.setTimer(indices, params)}
                  onRemove={() => s.setTimer(indices, null)}
                />
              </fieldset>
            )}
          </>
        ) : (
          <p className="empty">
            Select a cell to inspect timing.
            <br />
            Use <kbd>M</kbd> and drag to edit a group.
          </p>
        )}
      </section>
      <section className="panel-section">
        <div className="section-heading">
          <span>LEVEL DETAILS</span>
          <span>{s.levelId.slice(0, 8)}</span>
        </div>
        <label className="field">
          <span>Name</span>
          <input
            aria-label="Level name"
            value={name}
            disabled={!!s.test}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name !== s.name) s.metadata({ name });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
          />
        </label>
        <label className="field">
          <span>Credits</span>
          <input
            value={credits}
            disabled={!!s.test}
            onChange={(e) => setCredits(e.target.value)}
            onBlur={() => {
              if (credits !== s.credits) s.metadata({ credits });
            }}
          />
        </label>
        <div className="field-pairs">
          <label className="field">
            <span>Columns</span>
            <input
              type="number"
              min={4}
              max={64}
              value={w}
              disabled={!!s.test}
              onChange={(e) => setW(+e.target.value)}
            />
          </label>
          <label className="field">
            <span>Rows</span>
            <input
              type="number"
              min={4}
              max={Math.floor(160000 / s.width)}
              value={h}
              disabled={!!s.test}
              onChange={(e) => setH(+e.target.value)}
            />
          </label>
        </div>
        <div className="inline-actions">
          <button
            onClick={() => s.resize(w, h)}
            disabled={
              !!s.test ||
              !Number.isInteger(w) ||
              !Number.isInteger(h) ||
              w < 4 ||
              w > 64 ||
              h < 4 ||
              w * h > 160000 ||
              (w === s.width && h === s.height)
            }
          >
            Resize
          </button>
          <button
            onClick={() => s.resize(s.width, s.height + 20)}
            disabled={!!s.test}
          >
            ＋20 rows
          </button>
        </div>
        <p className="hint">
          Resizing preserves the lower-left area. Undo restores cropped cells.
        </p>
        <div className="validation">
          <span className={s.grid.includes("7") ? "ok" : "warning"}>
            {s.grid.includes("7")
              ? "✓ Finish line present"
              : "! Place a finish line"}
          </span>
          <span>
            {s.timers.size} timed · {s.gates.size} gates
          </span>
        </div>
        <button
          className="text-button"
          disabled={
            !!s.test ||
            !Object.values(s.library).some((p) =>
              p.levels.some((l) => l._id === s.levelId),
            )
          }
          onClick={s.resetToOriginal}
        >
          Restore bundled original <small>(undoable)</small>
        </button>
      </section>
    </aside>
  );
}
