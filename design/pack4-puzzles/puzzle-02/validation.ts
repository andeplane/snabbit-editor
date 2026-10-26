import {readFileSync,writeFileSync} from 'node:fs';
import {importLevel} from '../../../src/core/serialization';
import {advanceRun,startRun,obstacleHP} from '../../../src/core/simulation';
import {solve} from '../../../src/core/solver';
import type {Board,RunState} from '../../../src/core/simulation';
import type {LevelData} from '../../../src/store/types';
const level=JSON.parse(readFileSync(new URL('./level.json',import.meta.url),'utf8')) as LevelData;
const board=importLevel(level);
function segment(board:Board,start:RunState,row:number,col:number):RunState {
 let queue=[start];
 while(queue.length&&queue[0].row<row){
  const next:RunState[]=[];const seen=new Set<string>();
  for(const s of queue)for(const d of [-1,1] as const){const n=advanceRun(board,s,d);if(n.colliding||n.status!=='running')continue;const k=[n.row,n.col,n.switchMask,n.stars].join('/');if(!seen.has(k)){seen.add(k);next.push(n)}}
  queue=next;
 }
 const found=queue.find(s=>s.row===row&&s.col===col);
 if(!found)throw new Error(`Authored waypoint ${row},${col} unreachable`);
 return found;
}
// Establish and replay authored geometry first, independently of score search.
const waypoints=[[8,8],[15,9],[17,8],[18,8],[24,5],[30,8],[34,7],[41,8]];
let intended=startRun(board);
for(const [row,col] of waypoints)intended=segment(board,intended,row,col);
intended=advanceRun(board,intended,intended.direction);
if(intended.status!=='finished'||intended.stars!==3||intended.crashes!==0||intended.switchMask!==0)throw new Error('Winning authored replay failed');
const solution=solve(board,{allowDamage:false,maxStates:350000});
let replay=startRun(board);const events=[];
for(const p of solution.path.slice(1)){const before=replay;replay=advanceRun(board,replay,p.direction);if(replay.row!==p.row||replay.col!==p.col||replay.switchMask!==p.switchMask)throw new Error('Solver replay diverged');if(before.switchMask!==replay.switchMask)events.push({row:before.row,col:before.col,time:replay.time,from:before.switchMask,to:replay.switchMask});}
if(solution.status!=='optimal'||replay.status!=='finished'||replay.stars!==3||replay.crashes!==0)throw new Error('Solver proof failed');
// Restrict to the authored fork prefix and make the wrong RIGHT commitment.
let fork=startRun(board);for(const [r,c]of [[8,8],[15,9],[17,8]])fork=segment(board,fork,r,c);
const wrong=advanceRun(board,fork,1);
if(wrong.row!==18||wrong.col!==9||wrong.switchMask!==1)throw new Error('Wrong branch fixture failed');
// Exhaust every collision-free continuation using the real transition function.
// This tracks stars in the key because solve maximizes score rather than stars.
let frontier=[wrong];let expanded=0,maxStars=wrong.stars;let reachableReset=false;let bestFinished:RunState|undefined;
while(frontier.length){const next:RunState[]=[];const seen=new Set<string>();for(const s of frontier){expanded++;if(s.row===24&&s.col===5)reachableReset=true;for(const d of [-1,1] as const){const n=advanceRun(board,s,d,false);if(n.colliding||n.status==='dead'||n.row>board.height)continue;maxStars=Math.max(maxStars,n.stars);if(n.status==='finished'){if(!bestFinished||n.stars>bestFinished.stars)bestFinished=n;continue;}const k=[n.row,n.col,n.switchMask,n.stars,n.growing,n.lives].join('/');if(!seen.has(k)){seen.add(k);next.push(n);}}}frontier=next;}
if(reachableReset||maxStars===3||!bestFinished)throw new Error('Right branch did not lose reset/third star while retaining finish');
const noReset=structuredClone(level);const cells=[...noReset.grid.data];cells[24*16+5]='0';noReset.grid.data=cells.join('');noReset.switches={data:{[8*16+8]:'A'}};const noResetResult=solve(importLevel(noReset),{allowDamage:false,maxStates:350000});
if(noResetResult.status!=='optimal'||noResetResult.stars!==2)throw new Error('Reset counterfactual failed');
const noEarly=structuredClone(level);const earlyCells=[...noEarly.grid.data];earlyCells[8*16+8]='0';noEarly.grid.data=earlyCells.join('');noEarly.switches={data:{[24*16+5]:'A'}};const noEarlyResult=solve(importLevel(noEarly),{allowDamage:false,maxStates:350000});
if(noEarlyResult.status!=='optimal'||noEarlyResult.stars===3)throw new Error('Early toggle counterfactual failed');
const stateTruth=[0,1].map(mask=>({mask,nearHP:obstacleHP(board,14,9,14*8,mask),farHP:obstacleHP(board,33,6,33*8,mask)}));
if(stateTruth[0].nearHP!==200||stateTruth[0].farHP!==0||stateTruth[1].nearHP!==0||stateTruth[1].farHP!==200)throw new Error('Opposite state gate truth failed');
const report={id:level._id,width:board.width,height:board.height,strictTypecheck:'passed',authored:{waypoints,status:intended.status,stars:intended.stars,lives:intended.lives,score:intended.score,time:intended.time,crashes:intended.crashes,path:intended.trail},solver:solution,replay:{status:replay.status,stars:replay.stars,lives:replay.lives,score:replay.score,time:replay.time,crashes:replay.crashes,switchEvents:events},counterfactuals:{wrongBranch:{commitment:{row:wrong.row,col:wrong.col,mask:wrong.switchMask},expanded,reachableReset,maxStars,finishStars:bestFinished.stars},removeReset:{...noResetResult,path:undefined},removeEarlyToggle:{...noEarlyResult,path:undefined}},stateTruth,damageProof:'Both blocking crossings are metal HP200. The only resource is one heart: maximum health 4, no 12-gem combo exists (3 gems total). Damage cannot rescue an incorrect switch state or reach the reset behind the chosen branch. Wrong-branch failure is geometrical: six remaining upward steps can move at most three columns left, from c9 to c6; reset is c5 at r24.',scope:'Real shared core imports; no copied simulation. Native integration and heavy full-suite validation remain root work.'};
writeFileSync(new URL('./validation.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,authored:{...report.authored,path:'saved'},solver:{...solution,path:'saved'}},null,2));
