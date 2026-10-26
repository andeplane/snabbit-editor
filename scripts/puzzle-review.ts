import { createEditorStore } from "../src/store/editorStore";
import { renderGrid } from "../src/canvas/HexGridRenderer";
import { preloadSprites } from "../src/canvas/sprites";
import { startRun, advanceRun, type Direction, type RunState } from "../src/core/simulation";
import { createLeverAnimator } from "../src/core/leverAnimation";
import type { LevelData } from "../src/store/types";

interface Puzzle { number: number; id: string; name: string; directions: Direction[] }
const descriptions = [
  "Three linked switches. Work out which combination leaves the final door open.",
  "Borrow a passage, then restore the state before the next gate.",
  "A deliberate brown-block collision buys the beat needed for a timed crossing.",
  "The same timed walls need opposite switch states at different arrival times.",
  "Prepare two channels before an unavoidable lever changes the answer.",
  "Keep the blue-gem combo alive to earn the heart that pays for the brown wall.",
  "A tempting refund changes the route. Keep enough health for the final toll.",
  "Choose one of three levers. Each choice closes access to the later choices.",
  "Health beyond the wall cannot pay for the wall. Collect the heart in advance.",
  "Spend a heart on the direct brown shortcut, or take the safer route with more turns.",
];
function element<T extends HTMLElement>(selector: string): T {
  const result = document.querySelector<T>(selector);
  if (!result) throw new Error(`Missing review control: ${selector}`);
  return result;
}
const store = createEditorStore({
  storage: { read: () => null, write: () => {} }, newId: () => "review",
  schedule: () => 0, cancel: () => {},
});
const canvas = element<HTMLCanvasElement>("canvas");
const ctx = canvas.getContext("2d")!;
const range = element<HTMLInputElement>("#step");
const play = element<HTMLButtonElement>("#play");
const animator = createLeverAnimator();
let frames: RunState[] = [], index = 0, playing = false, lastStep = 0, request = 0;
function pause() { playing = false; play.textContent = "Play solution"; }
function showStep(value: number) {
  index = Math.min(frames.length - 1, Math.max(0, value));
  range.value = String(index);
  const run = frames[index];
  element<HTMLOutputElement>("#stats").textContent =
    `${index}/${frames.length - 1} · ♥ ${Math.round(run.lives * 10) / 10} · ★ ${run.stars}/3 · ◆ ${run.gems} gems · ${run.score} points${run.status === "finished" ? " · Complete" : ""}`;
}
async function select(puzzle: Puzzle) {
  const token = ++request;
  pause();
  const folder = `${import.meta.env.BASE_URL}puzzle-review/puzzle-${String(puzzle.number).padStart(2, "0")}`;
  const [level, notes] = await Promise.all([
    fetch(`${folder}/level.json`).then(r => r.json() as Promise<LevelData>),
    fetch(`${folder}/design-notes.md`).then(r => r.text()),
  ]);
  if (token !== request) return;
  store.getState().loadLevel(level, "40", false);
  const board = store.getState();
  frames = [startRun(board)];
  for (const direction of puzzle.directions) frames.push(advanceRun(board, frames[frames.length - 1], direction));
  if (frames[frames.length - 1].status !== "finished") throw new Error(`${puzzle.name}: replay failed`);
  element("#name").textContent = `${String(puzzle.number).padStart(2, "0")} · ${puzzle.name}`;
  element("#description").textContent = descriptions[puzzle.number - 1];
  const concept = element<HTMLImageElement>("#concept");
  concept.src = `${folder}/concept.png`; concept.alt = `ImageGen concept for ${puzzle.name}`;
  element("#notes").textContent = notes;
  document.querySelectorAll<HTMLButtonElement>("nav button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === puzzle.id)));
  range.max = String(frames.length - 1);
  animator.reset(); showStep(0);
  element("#status").textContent = "Verified winning route. Scrub to inspect switches, timed walls, health and gem combos. Review controls do not change saved editor drafts.";
}
function draw(now: number) {
  if (frames.length) {
    if (playing && now - lastStep >= 200) {
      lastStep = now;
      if (index < frames.length - 1) showStep(index + 1); else pause();
    }
    const state = store.getState();
    const zoom = Math.min((canvas.width - 36) / (state.width * 32 + 32), (canvas.height - 64) / (state.height * 16 + 64));
    renderGrid(ctx, { ...state, zoom, scrollX: 0, scrollY: -(canvas.height / zoom - state.height * 16 - 32) / 2,
      showGrid: false, timingView: "live", route: null, selection: [], hoverIndex: null,
      test: index === 0 ? null : frames[index], playbackTime: 0,
    }, canvas.width, canvas.height, [], now, 1, undefined, animator.frames(frames[index].switchMask));
  }
  requestAnimationFrame(draw);
}
range.addEventListener("input", () => { pause(); showStep(Number(range.value)); animator.reset(frames[index].switchMask); });
play.addEventListener("click", () => { if (playing) pause(); else { if (index === frames.length - 1) showStep(0); playing = true; lastStep = performance.now(); play.textContent = "Pause"; } });
element("#reset").addEventListener("click", () => { pause(); animator.reset(); showStep(0); });
async function boot() {
  const [manifest, missing] = await Promise.all([
    fetch(`${import.meta.env.BASE_URL}puzzle-review/manifest.json`).then(r => r.json() as Promise<{ puzzles: Puzzle[] }>), preloadSprites(),
  ]);
  if (missing.length) throw new Error(`Missing game sprites: ${missing.join(", ")}`);
  for (const puzzle of manifest.puzzles) {
    const button = document.createElement("button"); button.textContent = String(puzzle.number).padStart(2, "0");
    button.dataset.id = puzzle.id; button.title = puzzle.name;
    button.addEventListener("click", () => void select(puzzle).catch(fail)); element("nav").append(button);
  }
  await select(manifest.puzzles[0]); requestAnimationFrame(draw);
}
function fail(error: unknown) { element("#status").className = "error"; element("#status").textContent = String(error); }
void boot().catch(fail);
