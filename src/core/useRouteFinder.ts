import { useCallback, useEffect, useRef } from "react";
import { useEditorStore } from "../store/editorStore";
import { SearchResult, SearchOptions } from "./solver";
import { Board } from "./simulation";
export interface SolverRequest {
  board: Board;
  options: SearchOptions;
}
export type SolverMessage =
  | { type: "progress"; expanded: number; score: number | null }
  | { type: "result"; result: SearchResult }
  | { type: "error"; error: string };
export interface SolverPort {
  send: (request: SolverRequest) => void;
  stop: () => void;
  listen: (
    message: (data: SolverMessage) => void,
    error: (message: string) => void,
  ) => void;
}
export function browserSolverWorker(): SolverPort {
  const worker = new Worker(new URL("./solver.worker.ts", import.meta.url), {
    type: "module",
  });
  return {
    send: (data) => worker.postMessage(data),
    stop: () => worker.terminate(),
    listen: (message, error) => {
      worker.onmessage = (e: MessageEvent<SolverMessage>) => message(e.data);
      worker.onerror = (e) => error(e.message);
    },
  };
}
export function useRouteFinder(
  factory: () => SolverPort = browserSolverWorker,
) {
  const worker = useRef<SolverPort | null>(null),
    revision = useEditorStore((s) => s.revision),
    id = useEditorStore((s) => s.levelId),
    damage = useEditorStore((s) => s.allowDamage);
  const cancel = useCallback(() => {
    worker.current?.stop();
    worker.current = null;
    useEditorStore.getState().set({ searchRunning: false });
  }, []);
  useEffect(() => {
    cancel();
  }, [cancel, revision, id, damage]);
  useEffect(() => () => worker.current?.stop(), []);
  const find = useCallback(() => {
    const s = useEditorStore.getState();
    if (s.searchRunning) {
      cancel();
      s.set({ notice: "Route search cancelled." });
      return;
    }
    if (!s.grid.includes("7")) {
      s.set({ notice: "Place a finish line before searching for a route." });
      return;
    }
    const w = factory();
    worker.current = w;
    s.set({ searchRunning: true, searchExpanded: 0, route: null, notice: "" });
    const fail = (message: string) => {
      if (worker.current !== w) return;
      s.set({ searchRunning: false, notice: `Search failed: ${message}` });
      w.stop();
      worker.current = null;
    };
    w.listen((data) => {
      if (worker.current !== w) return;
      if (data.type === "progress") s.set({ searchExpanded: data.expanded });
      if (data.type === "result") {
        const result = data.result;
        s.set({
          route: result,
          searchRunning: false,
          searchExpanded: result.expanded,
          notice:
            result.status === "optimal"
              ? `Best ${s.allowDamage ? "" : "collision-free "}route proved: ${Math.floor(result.score).toLocaleString()} points.`
              : result.status === "limited"
                ? "Search limit reached. Any displayed route is the best found so far; optimality is unproved."
                : "No route to a finish under these rules. Try allowing damage or adjusting the level.",
        });
        w.stop();
        worker.current = null;
      }
      if (data.type === "error") fail(data.error);
    }, fail);
    w.send({
      board: {
        width: s.width,
        height: s.height,
        grid: s.grid,
        timers: s.timers,
        switches: s.switches,
        gates: s.gates,
      },
      options: { allowDamage: s.allowDamage },
    });
  }, [cancel, factory]);
  return find;
}
