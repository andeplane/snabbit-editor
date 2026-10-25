import { readFileSync, writeFileSync } from 'node:fs';
import { importLevel } from '../../../src/core/serialization';
import { advanceRun, startRun } from '../../../src/core/simulation';
import { solve } from '../../../src/core/solver';
import type { LevelData } from '../../../src/store/types';
const path = new URL('./level.json', import.meta.url);
const level: LevelData = JSON.parse(readFileSync(path, 'utf8')) as LevelData;
const board = importLevel(level);
const solution = solve(board, { allowDamage: false, maxStates: 350000 });
let run = startRun(board);
for (const step of solution.path.slice(1)) {
  run = advanceRun(board, run, step.direction);
  if (run.row !== step.row || run.col !== step.col || run.switchMask !== step.switchMask) throw new Error('Replay diverged');
}
if (solution.status !== 'optimal' || run.status !== 'finished' || run.stars !== 3 || run.crashes !== 0 || run.switchMask !== 3) throw new Error('Expected zero-damage three-star two-switch run');
const ablations = ['A','B'].map(group => {
  const copy: LevelData = structuredClone(level);
  const cells = [...copy.grid.data];
  for(const [idx, channel] of Object.entries(copy.switches?.data ?? {})) if(channel===group) cells[+idx]='0';
  copy.grid.data=cells.join('');
  copy.switches={data:Object.fromEntries(Object.entries(copy.switches?.data ?? {}).filter(([,channel])=>channel!==group))};
  const result=solve(importLevel(copy),{allowDamage:false,maxStates:350000});
  if(result.stars===3) throw new Error(`Switch ${group} has no meaningful reward effect`);
  return { disabledSwitch: group, ...result, path: undefined };
});
const report={ level:level._id, name:level.name, width:board.width,height:board.height, start:{row:0,col:9,direction:1}, solver:solution, replay:{status:run.status,stars:run.stars,gems:run.gems,crashes:run.crashes,switchMask:run.switchMask,lives:run.lives}, switchAblations:ablations, notes:['Imports real strict typed core importLevel/advanceRun/solve.','Each lever opens the two local predecessor cells of a star; skipping it leaves a finish route but loses that star.','No timers, speed modifiers, full-width obstacle walls, gem rails, or cross-map finish bar.','Pure shared-core evidence only; root owns native device/render/build validation.']};
writeFileSync(new URL('./validation.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,solver:{...solution,path:`${solution.path.length} entries`}},null,2));
