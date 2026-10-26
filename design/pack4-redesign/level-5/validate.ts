import { readFileSync, writeFileSync } from 'node:fs';
import { importLevel } from '../../../src/core/serialization';
import { solve } from '../../../src/core/solver';
import { startRun, advanceRun } from '../../../src/core/simulation';
import type { LevelData } from '../../../src/store/types';
const dir = '/Users/anderhaf/repos/snabbit-editor/design/pack4-redesign/level-5';
const level = JSON.parse(readFileSync(`${dir}/level.json`, 'utf8')) as LevelData;
const board = importLevel(level);
const result = solve(board, {allowDamage:false,maxStates:150000});
let run = startRun(board);
for (const point of result.path.slice(1)) {
 run = advanceRun(board,run,point.direction);
 if (run.row !== point.row || run.col !== point.col || run.colliding) throw new Error('Replay mismatch or collision');
}
if(result.stars!==3 || run.stars!==3 || run.crashes || run.status!=='finished') throw new Error('No clean three-star finish');
const withoutA={...board,switches:new Map([...board.switches!].filter(([,channel])=>channel!=='A'))};
// A missing link would default to A, so remove the physical switch too for dependency checks.
withoutA.grid=[...board.grid]; withoutA.grid[13*16+7]='0';
const withoutB={...board,grid:[...board.grid]};withoutB.grid[37*16+7]='0';
const aOff=solve(withoutA,{allowDamage:false,maxStates:150000});
const bOff=solve(withoutB,{allowDamage:false,maxStates:150000});
const countPossibleStars=(candidate: typeof board) => {
 const priority={...candidate,grid:candidate.grid.map(ch=>ch==='8'?'9':ch==='9'?'0':ch)};
 const found=solve(priority,{allowDamage:false,maxStates:150000});
 return {count:found.path.filter(point=>candidate.grid[point.row*16+point.col]==='8').length,status:found.status};
};
const optionalBoard={...board,grid:[...board.grid]};optionalBoard.grid[51*16+14]='0';
const optional=solve(optionalBoard,{allowDamage:false,maxStates:150000});
const summary={status:result.status,expanded:result.expanded,score:result.score,turns:result.turns,stars:result.stars,crashes:run.crashes,finalStatus:run.status,diamonds:run.diamonds,gemCount:run.gems,finishRow:run.row,withoutA:{stars:aOff.stars,status:aOff.status,maxStars:countPossibleStars(withoutA)},withoutB:{stars:bOff.stars,status:bOff.status,maxStars:countPossibleStars(withoutB)},withoutDiamond:{stars:optional.stars,turns:optional.turns,status:optional.status},switchVisits:result.path.filter(p=>board.grid[p.row*16+p.col]==='=').map(p=>({row:p.row,col:p.col,channel:board.switches!.get(p.row*16+p.col)})),path:result.path};
writeFileSync(`${dir}/validation.json`,JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({...summary,path:undefined},null,2));
