import { BLOCK_DEFS, BlockChar, Tool } from "../store/types";
import { useEditorStore } from "../store/editorStore";
import { BLOCK_SPRITES, spriteURL } from "../canvas/sprites";
export const TOOLS: { tool: Tool; label: string; key: string; icon: string }[] =
  [
    { tool: "paint", label: "Brush", key: "B", icon: "╱" },
    { tool: "erase", label: "Eraser", key: "E", icon: "▱" },
    { tool: "line", label: "Line", key: "L", icon: "↗" },
    { tool: "rectangle", label: "Rectangle", key: "U", icon: "□" },
    { tool: "fill", label: "Fill", key: "G", icon: "▨" },
    { tool: "select", label: "Selection", key: "M", icon: "⬚" },
    { tool: "pick", label: "Eyedropper", key: "I", icon: "⌖" },
  ];
export const PRIMARY_BLOCKS: BlockChar[] = [
  "1",
  "2",
  "3",
  "4",
  "6",
  "8",
  "9",
  "7",
];
export const FIELD_BLOCKS: BlockChar[] = [":", ";", "<", "="];
export function BlockIcon({ type }: { type: BlockChar }) {
  if (type === "7")
    return (
      <span className="block-preview goal-icon" aria-hidden="true">
        ⁙
      </span>
    );
  const sprite = BLOCK_SPRITES[type]?.[0];
  return sprite ? (
    <img className="block-preview" src={spriteURL(sprite)} alt="" />
  ) : (
    <span className="block-preview glyph">{type === "=" ? "⏻" : "·"}</span>
  );
}
export function Palette() {
  const s = useEditorStore();
  const choose = (c: BlockChar) =>
    s.set({ activeBlockType: c, activeTool: "paint", menu: null });
  const blocks = s.menu === "fields" ? FIELD_BLOCKS : PRIMARY_BLOCKS;
  return (
    <section className="palette" aria-label="Painting tools">
      <div className="section-heading">
        <span>BUILD</span>
        <span>
          <kbd>1</kbd> tools · <kbd>2</kbd> blocks
        </span>
      </div>
      <div className="tool-grid">
        {TOOLS.map((t) => (
          <button
            key={t.tool}
            aria-label={t.label}
            aria-pressed={s.activeTool === t.tool}
            className={s.activeTool === t.tool ? "active" : ""}
            title={`${t.label} (${t.key})`}
            onClick={() => s.set({ activeTool: t.tool, menu: null })}
            disabled={!!s.test}
          >
            <span>{t.icon}</span>
            <kbd>{t.key}</kbd>
          </button>
        ))}
      </div>
      <div className="swatch-grid">
        {BLOCK_DEFS.filter((d) => !["0", "5"].includes(d.char)).map((d) => (
          <button
            key={d.char}
            aria-label={`Paint ${d.name}`}
            aria-pressed={
              s.activeBlockType === d.char && s.activeTool === "paint"
            }
            title={d.name}
            className={
              s.activeBlockType === d.char && s.activeTool === "paint"
                ? "active"
                : ""
            }
            onClick={() => choose(d.char)}
            disabled={!!s.test}
          >
            <BlockIcon type={d.char} />
          </button>
        ))}
      </div>
      <div className="active-material">
        <BlockIcon type={s.activeBlockType} />
        <div>
          <strong>
            {BLOCK_DEFS.find((d) => d.char === s.activeBlockType)?.name}
          </strong>
          <small>
            {TOOLS.find((t) => t.tool === s.activeTool)?.label} · right-click
            erases
          </small>
        </div>
      </div>
      {s.menu && (
        <div className="key-menu" role="menu" aria-label={`${s.menu} menu`}>
          <div className="section-heading">
            <span>
              {s.menu === "tools"
                ? "1 / TOOLS"
                : s.menu === "fields"
                  ? "2 / 9 / FIELDS"
                  : "2 / BLOCKS"}
            </span>
            <button onClick={() => s.set({ menu: null })}>Esc</button>
          </div>
          {s.menu === "tools" ? (
            TOOLS.map((t, i) => (
              <button
                role="menuitem"
                key={t.tool}
                onClick={() => s.set({ activeTool: t.tool, menu: null })}
              >
                <kbd>{i + 1}</kbd>
                {t.label}
                <span>{t.key}</span>
              </button>
            ))
          ) : (
            <>
              {blocks.map((c, i) => (
                <button role="menuitem" key={c} onClick={() => choose(c)}>
                  <kbd>{i + 1}</kbd>
                  <BlockIcon type={c} />
                  {BLOCK_DEFS.find((d) => d.char === c)?.name}
                </button>
              ))}
              {s.menu === "blocks" && (
                <button
                  role="menuitem"
                  onClick={() => s.set({ menu: "fields" })}
                >
                  <kbd>9</kbd>Fields & switches <span>→</span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
