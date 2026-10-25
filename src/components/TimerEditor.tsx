import { useState, useEffect } from "react";
import { TimerParams } from "../store/types";
import { stateAtArrival } from "../core/timer";
interface Props {
  index: number;
  row: number;
  col: number;
  count: number;
  timer: TimerParams | null;
  onSave: (params: TimerParams) => void;
  onRemove: () => void;
}
const DEFAULT: TimerParams = {
  startState: 1,
  toggleAfter: 32,
  toggleBackAfter: 32,
  rowDelay: 0,
  colDelay: 0,
  ownDelay: 0,
};
export function TimerEditor({
  index,
  row,
  col,
  count,
  timer,
  onSave,
  onRemove,
}: Props) {
  const [params, setParams] = useState(timer ?? DEFAULT);
  useEffect(() => {
    setParams(timer ?? DEFAULT);
  }, [index, timer]);
  const preview = stateAtArrival(row, col, params);
  const fields: [string, keyof TimerParams, string][] = [
    [
      "First duration",
      "toggleAfter",
      "Time in the initial state, in game ticks.",
    ],
    ["Second duration", "toggleBackAfter", "Time in the opposite state."],
    ["Row phase", "rowDelay", "Phase per row."],
    ["Column phase", "colDelay", "Phase per hex-adjusted column."],
    ["Individual phase", "ownDelay", "Extra delay for each selected block."],
  ];
  const valid =
    Object.values(params).every(Number.isInteger) &&
    params.toggleAfter > 0 &&
    params.toggleBackAfter > 0 &&
    Math.max(params.toggleAfter, params.toggleBackAfter) <= 32767 &&
    [params.rowDelay, params.colDelay, params.ownDelay].every(
      (n) => Math.abs(n) <= 32767,
    );
  return (
    <div className="timer-editor">
      <label className="field">
        <span>Initial state</span>
        <select
          value={params.startState}
          onChange={(e) =>
            setParams({ ...params, startState: +e.target.value as 0 | 1 })
          }
        >
          <option value={1}>Solid → hidden → solid</option>
          <option value={0}>Hidden → solid → hidden</option>
        </select>
      </label>
      <div className="field-pairs">
        {fields.map(([label, key, title]) => (
          <label className="field" key={key} title={title}>
            <span>{label}</span>
            <input
              type="number"
              aria-label={label}
              value={params[key]}
              min={key.includes("After") ? 1 : -32767}
              max={32767}
              onChange={(e) => setParams({ ...params, [key]: +e.target.value })}
            />
          </label>
        ))}
      </div>
      <div className="timer-preview">
        <span>
          At row {row}: <strong>{preview.state ? "solid" : "passable"}</strong>
        </span>
        <span>{params.toggleAfter + params.toggleBackAfter} tick cycle</span>
      </div>
      {!valid && (
        <p className="error-text" role="alert">
          Use positive whole durations and whole phases from −32767 to 32767.
        </p>
      )}
      <div className="inline-actions">
        <button
          className="primary"
          disabled={!valid}
          onClick={() => onSave(params)}
        >
          {timer ? "Apply timer" : "Add timer"}
          {count > 1 ? ` to ${count}` : ""}
        </button>
        {timer && <button onClick={onRemove}>Remove timer</button>}
      </div>
      <p className="hint">
        First/second durations follow the initial state. Applied to every
        selected nonempty cell.
      </p>
    </div>
  );
}
