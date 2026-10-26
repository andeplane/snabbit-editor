import { readFileSync, writeFileSync } from 'node:fs';
import { importLevel, validateLevel } from '../../../src/core/serialization';
import { advanceRun, nextCell, obstacleHP, startRun, type Direction, type RunState, type StepPoint } from '../../../src/core/simulation';
import type { LevelData } from '../../../src/store/types';
const folder = new URL('.', import.meta.url);
const level = validateLevel(JSON.parse(readFileSync(new URL('level.json', folder), 'utf8')) as LevelData);
const board = importLevel(level);
const routes = JSON.parse(readFileSync(new URL('authored-routes.json', folder), 'utf8')) as Record<string, number[]>;
const switches = [{ row: 8, col: 7 }, { row: 14, col: 10 }, { row: 22, col: 7 }];
const index = (row: number, col: number) => row * board.width + col;
const switchNumber = (s: RunState) => switches.findIndex(p => p.row === s.row && p.col === s.col);
interface Event { row: number; col: number; time: number; lives: number; mask: number; stars: number; growing: boolean; collision: boolean; kind: string }
interface Replay { status: RunState['status']; lives: number; stars: number; score: number; time: number; crashes: number; turns: number; gems: number; diamonds: number; events: Event[]; path: StepPoint[] }
function replay(name: string): { report: Replay; picked: RunState[] } {
  let s = startRun(board); const events: Event[] = [], picked: RunState[] = [];
  for (let step = 0; step < 250 && s.status === 'running'; step++) {
    const targetCol = routes[name][s.row + 1];
    const direction = targetCol === undefined ? s.direction : ([-1, 1] as Direction[]).find(d => nextCell(s.row, s.col, d, board.width).col === targetCol);
    if (direction === undefined) throw new Error(`${name}: no native step from ${s.row},${s.col} to ${s.row + 1},${targetCol}`);
    const before = s; s = advanceRun(board, s, direction);
    if (s.switchMask !== before.switchMask) picked.push(s);
    if (s.switchMask !== before.switchMask || s.lives !== before.lives || s.stars !== before.stars || s.colliding || s.status !== 'running') events.push({ row: s.row, col: s.col, time: s.time, lives: s.lives, mask: s.switchMask, stars: s.stars, growing: s.growing, collision: s.colliding, kind: s.status !== 'running' ? s.status : s.switchMask !== before.switchMask ? `lever-${switchNumber(before) + 1}` : s.colliding ? 'impact' : s.lives !== before.lives ? 'health' : 'star' });
  }
  return { report: { status: s.status, lives: s.lives, stars: s.stars, score: s.score, time: s.time, crashes: s.crashes, turns: s.turns, gems: s.gems, diamonds: s.diamonds, events, path: s.trail }, picked };
}
const intended = replay('best-middle');
// Establish the authored winning route before running any all-path exploration.
if (intended.report.status !== 'finished' || intended.report.stars !== 3 || intended.report.lives !== 1 || intended.report.crashes !== 5) throw new Error('Authored middle-bay route failed: ' + JSON.stringify(intended.report));
const first = replay('first-poor'), third = replay('third-diamond'), none = replay('no-choice');
if (first.report.status !== 'dead' || third.report.status !== 'dead' || none.report.status !== 'dead') throw new Error('An authored bad commitment unexpectedly survived.');
interface Reach { reachable: boolean; expanded: number; path: StepPoint[] }
// Exact shared-core reachability, including damage and health. Only time/score
// are folded: no speed fields exist and every gate phase stays constant through
// the entire finite level+automatic-finish horizon (under 1,000 time units).
function key(s: RunState, chosen: number): string {
  return [chosen, s.status, s.row, s.col, s.direction, s.lives, s.switchMask, s.colliding, s.growing, s.combo, s.gemAge, s.stars, s.diamonds, JSON.stringify(s.touched)].join('/');
}
function reach(start: RunState, target: number, forbidOtherUnchosen: boolean): Reach {
  const todo = [start], seen = new Set<string>(); let expanded = 0;
  while (todo.length) {
    const s = todo.pop()!, k = key(s, 0); if (seen.has(k)) continue; seen.add(k); expanded++;
    if (s.status !== 'running') continue;
    const current = switchNumber(s);
    if (current === target) return { reachable: true, expanded, path: s.trail };
    if (forbidOtherUnchosen && current >= 0) continue;
    if (s.row >= board.height + 40) continue;
    for (const d of [-1, 1] as Direction[]) { const n = advanceRun(board, s, d); if (n.status !== 'dead') todo.push(n); }
  }
  return { reachable: false, expanded, path: [] };
}
const initiallyReachable = switches.map((_, i) => reach(startRun(board), i, true));
const afterFirst = first.picked[0], afterMiddle = intended.picked[0];
const commitmentProof = [
  { from: 1, to: 2, blocked: reach(afterFirst, 1, true), channelNotFlipped: reach({ ...afterFirst, switchMask: 0 }, 1, true) },
  { from: 1, to: 3, blocked: reach(afterFirst, 2, true), channelNotFlipped: reach({ ...afterFirst, switchMask: 0 }, 2, true) },
  { from: 2, to: 3, blocked: reach(afterMiddle, 2, true), channelNotFlipped: reach({ ...afterMiddle, switchMask: 0 }, 2, true) },
];
interface SearchProof { exhaustive: boolean; expanded: number; maxPicked: number; maximumLivesBeforeToll: number[]; objectivesByFirstChoice: number[]; finishByFirstChoice: number[]; escapedWithoutFinish: number; timerMaximum: number }
function exhaustive(): SearchProof {
  const todo: { state: RunState; chosen: number; first: number }[] = [{ state: startRun(board), chosen: 0, first: 0 }];
  const seen = new Set<string>(); let expanded = 0, maxPicked = 0, escapedWithoutFinish = 0, timerMaximum = 0;
  const maximumLivesBeforeToll = [0, 0, 0, 0], objectivesByFirstChoice = [0, 0, 0, 0], finishByFirstChoice = [0, 0, 0, 0];
  while (todo.length) {
    const item = todo.pop()!, s = item.state, k = key(s, item.chosen); if (seen.has(k)) continue; seen.add(k); expanded++;
    if (expanded > 250000) throw new Error('Exact proof exceeded its local budget; root must run the full search remotely.');
    timerMaximum = Math.max(timerMaximum, s.time); maxPicked = Math.max(maxPicked, item.chosen.toString(2).replace(/0/g, '').length);
    if (s.row <= 28 && !s.colliding) maximumLivesBeforeToll[item.first] = Math.max(maximumLivesBeforeToll[item.first], s.lives);
    if (s.status === 'dead') continue;
    if (s.status === 'finished') { finishByFirstChoice[item.first]++; if (s.stars === 3) objectivesByFirstChoice[item.first]++; continue; }
    if (s.row > board.height + 40) { escapedWithoutFinish++; continue; }
    for (const d of [-1, 1] as Direction[]) {
      const n = advanceRun(board, s, d, false); const chosenHere = n.switchMask !== s.switchMask ? switchNumber(s) : -1;
      todo.push({ state: n, chosen: chosenHere >= 0 ? item.chosen | (1 << chosenHere) : item.chosen, first: item.first || (chosenHere + 1) });
    }
  }
  return { exhaustive: true, expanded, maxPicked, maximumLivesBeforeToll, objectivesByFirstChoice, finishByFirstChoice, escapedWithoutFinish, timerMaximum };
}
const allPaths = exhaustive();
const renderStates = { initial: Object.fromEntries([...board.gates.keys()].map(i => [i, obstacleHP(board, Math.floor(i/board.width), i%board.width, Math.floor(i/board.width)*8, 0)>0])), selected: Object.fromEntries([...board.gates.keys()].map(i => [i, obstacleHP(board, Math.floor(i/board.width), i%board.width, Math.floor(i/board.width)*8, 1)>0])) };
const report = { renderStates, levelId: level._id, board: { width: board.width, height: board.height, totalGems: board.grid.filter(c => c === '4').length, totalHearts: board.grid.filter(c => c === '6').length, mouths: [index(5, 7), index(12, 9), index(20, 8)], levers: switches }, winningReplay: intended.report, firstChoiceReplay: first.report, thirdChoiceReplay: third.report, noChoiceReplay: none.report, initiallyReachable, commitmentProof, allPaths, nativeAcceptance: { authoredHearts: 'requires root preserve authored story hearts instead of survival RNG', collisionDrain: 'requires root full-tock collision parity; native queued-turn partial-drain exploit is not accepted evidence' } };
writeFileSync(new URL('validation.json', folder), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ winning: { ...intended.report, path: intended.report.path.length }, initiallyReachable: initiallyReachable.map(r => ({ reachable: r.reachable, expanded: r.expanded })), commitmentProof: commitmentProof.map(r => ({ from: r.from, to: r.to, inaccessibleAfterPick: !r.blocked.reachable, counterfactualReachable: r.channelNotFlipped.reachable })), allPaths }, null, 2));
if (initiallyReachable.some(r => !r.reachable) || commitmentProof.some(r => r.blocked.reachable || !r.channelNotFlipped.reachable) || allPaths.maxPicked !== 1 || allPaths.objectivesByFirstChoice[0] || allPaths.objectivesByFirstChoice[1] || !allPaths.objectivesByFirstChoice[2] || allPaths.objectivesByFirstChoice[3] || allPaths.escapedWithoutFinish) process.exitCode = 1;
