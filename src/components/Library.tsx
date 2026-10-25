import { useEditorStore } from "../store/editorStore";
import { Palette } from "./Palette";
export function Library() {
  const s = useEditorStore();
  const known = new Set(
    Object.values(s.library).flatMap((p) => p.levels.map((l) => l._id)),
  );
  const drafts = Object.values(s.drafts).filter((l) => !known.has(l._id));
  const levels =
    s.activePack === "drafts"
      ? drafts
      : (s.library[s.activePack]?.levels ?? []);
  const filtered = levels.filter((l) =>
    `${l.name} ${l._id}`.toLowerCase().includes(s.filter.toLowerCase()),
  );
  return (
    <aside className="library">
      <div className="library-header">
        <div className="section-heading">
          <span>LEVEL LIBRARY</span>
          <span>
            {Object.values(s.library).reduce((a, p) => a + p.levels.length, 0)}
          </span>
        </div>
        <select
          aria-label="Level pack"
          value={s.activePack}
          onChange={(e) => s.set({ activePack: e.target.value })}
          disabled={!!s.test}
        >
          {Object.entries(s.library).map(([id, p], i) => (
            <option key={id} value={id}>
              {i + 1}. {p.name}
            </option>
          ))}
          <option value="drafts">New levels ({drafts.length})</option>
        </select>
        <input
          type="search"
          aria-label="Search levels"
          placeholder="Find a level…"
          value={s.filter}
          onChange={(e) => s.set({ filter: e.target.value })}
        />
      </div>
      <div className="level-list" aria-label="Levels">
        {!s.libraryReady && <p className="empty">Loading game levels…</p>}
        {s.libraryReady && !filtered.length && (
          <p className="empty">
            {s.filter
              ? "No matching levels."
              : "Create a level to start this pack."}
          </p>
        )}
        {filtered.map((l) => (
          <button
            className={`level-row ${l._id === s.levelId ? "active" : ""}`}
            key={l._id}
            onClick={() => s.loadLevel(l, s.activePack)}
            disabled={!!s.test}
          >
            <span className="level-number">
              {String(levels.indexOf(l) + 1).padStart(2, "0")}
            </span>
            <span>
              <strong>{s.drafts[l._id]?.name ?? l.name}</strong>
              <small>
                {l.width} columns · {Math.ceil(l.grid.data.length / l.width)}{" "}
                rows
              </small>
            </span>
            {s.drafts[l._id] && (
              <span className="draft-dot" title="Local draft" />
            )}
          </button>
        ))}
      </div>
      <button
        className="new-level"
        onClick={() => s.newLevel()}
        disabled={!!s.test}
      >
        ＋ New level
      </button>
      <Palette />
    </aside>
  );
}
