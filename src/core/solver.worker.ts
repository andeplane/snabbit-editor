import { solve } from "./solver";
import type { SolverMessage, SolverRequest } from "./useRouteFinder";
export function handleSolverRequest(
  request: SolverRequest,
  post: (message: SolverMessage) => void,
  search: typeof solve = solve,
) {
  try {
    const result = search(request.board, request.options, (expanded, score) =>
      post({ type: "progress", expanded, score }),
    );
    post({ type: "result", result });
  } catch (error) {
    post({ type: "error", error: String(error) });
  }
}
self.onmessage = (event: MessageEvent<SolverRequest>) =>
  handleSolverRequest(event.data, (message) => self.postMessage(message));
