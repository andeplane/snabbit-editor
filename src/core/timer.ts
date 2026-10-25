// Toggle/timer block state calculation.
// Ported directly from:
//   Classes/GameConfig.h stateForBlock() (lines 583-618)
//   Classes/Track.m delay computation (lines 178-192)
//
// IMPORTANT: In Track.m line 181:
//   sumDelay = realC * array[4] + row * array[3]
// So array[3] (TimerParams.rowDelay) is multiplied by row,
//    array[4] (TimerParams.colDelay) is multiplied by realC (hex-adjusted col).

import { TimerParams } from "../store/types";

export interface BlockState {
  state: boolean; // true = visible/ON
  period: number; // which cycle number
  progress: number; // 0-1 through current state
}

// Compute the final delay for a block at (row, col).
// Replicates Track.m lines 178-192.
export function computeDelay(
  row: number,
  col: number,
  timer: TimerParams,
): number {
  const realC = col * 2 + (row % 2);
  const totalPeriod = timer.toggleAfter + timer.toggleBackAfter;
  if (totalPeriod <= 0) return 0;

  let sumDelay = realC * timer.colDelay + row * timer.rowDelay;

  const willHitAtRow = 8 * row;
  if (sumDelay > willHitAtRow) {
    sumDelay -=
      Math.ceil((sumDelay - willHitAtRow) / totalPeriod) * totalPeriod;
  }
  sumDelay -= totalPeriod;

  // Native block.delay is a signed short, including for very tall custom levels.
  return ((timer.ownDelay + sumDelay) << 16) >> 16;
}

// Compute block state at a given game time.
// Replicates GameConfig.h stateForBlock().
export function stateForBlock(
  timer: TimerParams,
  delay: number,
  time: number,
): BlockState {
  const t = time - delay;
  const period = timer.toggleAfter + timer.toggleBackAfter;

  if (timer.toggleAfter <= 0 || timer.toggleBackAfter <= 0 || t < 0) {
    return { state: timer.startState === 1, period: 0, progress: 0 };
  }

  const periodNr = Math.floor(t / period);
  const timeIntoPeriod = t % period;
  const isInStartState = timeIntoPeriod < timer.toggleAfter;

  const state = isInStartState
    ? timer.startState === 1
    : timer.startState !== 1;
  const stateDuration = isInStartState
    ? timer.toggleAfter
    : timer.toggleBackAfter;
  const timeIntoState = isInStartState
    ? timeIntoPeriod
    : timeIntoPeriod - timer.toggleAfter;
  const progress = timeIntoState / stateDuration;

  return { state, period: periodNr, progress };
}

// Convenience: state when snake arrives at the block's row.
// Snake arrives at row N at game time = N * 8.
export function stateAtArrival(
  row: number,
  col: number,
  timer: TimerParams,
): BlockState {
  const delay = computeDelay(row, col, timer);
  const arrivalTime = row * 8;
  return stateForBlock(timer, delay, arrivalTime);
}
