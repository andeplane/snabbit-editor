import { readFileSync, writeFileSync } from 'node:fs';
import { importLevel,validateLevel } from '../../../src/core/serialization';
import { startRun,advanceRun,nextCell,type Board,type RunState,type Direction } from '../../../src/core/simulation';
import { solve } from '../../../src/core/solver';
import type { LevelData } from '../../../src/store/types';
const dir=new URL('.',import.meta.url);
const level:LevelData=validateLevel(JSON.parse(readFileSync(new URL('level.json',dir),'utf8')) as unknown);
const board:Board=importLevel(level);
// A resource puzzle admits damage. Search is deliberately bounded; proof below is exhaustive reachability.
const scored=solve(board,{allowDamage:true,maxStates:160000});
function search(b:Board, requireThree=true, initial?:RunState, cacheGoal=false) {
 const stack:RunState[]=[initial??startRun(b)]; const seen=new Set<string>();let expanded=0,maxRow=0;const ends:RunState[]=[];
 while(stack.length){const s=stack.pop()!;const key=JSON.stringify([s.status,s.row,s.col,s.direction,s.lives,s.growing,s.colliding,s.switchMask,s.stars,s.touched]);if(seen.has(key))continue;seen.add(key);expanded++;maxRow=Math.max(maxRow,s.row);
  if(cacheGoal&&s.row>=39&&s.lives>=4)return {expanded,maxRow,winner:s,exhausted:false};
  if(s.status==='finished'){ends.push(s);if(!cacheGoal&&(!requireThree||s.stars===3))return {expanded,maxRow,winner:s,exhausted:false};continue;}
  if(s.status==='dead'||s.row>b.height)continue;
  for(const d of [1,-1] as Direction[])stack.push(advanceRun(b,s,d));
 }
 return {expanded,maxRow,winner:null,exhausted:true};
}
const win=search(board);
if(!win.winner)throw Error('No three-star winning replay');
const withoutNow:Board={...board,grid:board.grid.map((ch,i)=>i===10*board.width+7?'0':ch)};
const noCredit=search(withoutNow,false);
// Force an actual choice of the right-hand lever, then explore every future control.
const prefix=searchTo(board,10,12);
function searchTo(b:Board,row:number,col:number):RunState{
 let frontier:RunState[]=[startRun(b)];const seen=new Set<string>();
 while(frontier.length){const s=frontier.pop()!;if(s.row===row&&s.col===col&&s.lives===3)return s;
  if(s.status!=='running'||s.row>=row)continue;const k=JSON.stringify([s.row,s.col,s.lives,s.colliding,s.touched]);if(seen.has(k))continue;seen.add(k);
  for(const d of [1,-1] as Direction[])frontier.push(advanceRun(b,s,d));
 }throw Error('Lever unreachable');
}
const wrongChoice=search(board,true,prefix);
const loaned=search(board,false,{...prefix,lives:4},true);
if(!loaned.winner)throw Error('Future cache is not truly reachable with one borrowed life');
const route=win.winner.trail;
let replay=startRun(board);const events:unknown[]=[];
for(const point of route.slice(1)) {const before=replay;replay=advanceRun(board,replay,point.direction);
 if(before.lives!==replay.lives||before.switchMask!==replay.switchMask||before.stars!==replay.stars||before.growing!==replay.growing)events.push({row:replay.row,col:replay.col,time:replay.time,lives:replay.lives,stars:replay.stars,growing:replay.growing,switchMask:replay.switchMask,crashes:replay.crashes});}
// trail ends before finish processing because advanceRun's finish return occurs before append.
if(replay.status==='running')replay=advanceRun(board,replay,replay.direction);
const report={id:level._id,winning:{status:replay.status,stars:replay.stars,lives:replay.lives,score:replay.score,time:replay.time,crashes:replay.crashes,turns:replay.turns,switchMask:replay.switchMask,events,route},withoutImmediateHeart:{expanded:noCredit.expanded,maxRow:noCredit.maxRow,exhausted:noCredit.exhausted,winner:!!noCredit.winner},futureCreditCounterfactual:{initialLivesAtLever:4,cacheReached:!!loaned.winner,route:loaned.winner?.trail,switchMask:loaned.winner?.switchMask,livesAfterCache:loaned.winner?.lives,arrivesRow:loaned.winner?.row},wrongLeverChoice:{prefixLives:prefix.lives,expanded:wrongChoice.expanded,maxRow:wrongChoice.maxRow,exhausted:wrongChoice.exhausted,winner:!!wrongChoice.winner},scoredSearch:{...scored,path:scored.path.length},proof:'All controls and collision exits explored using imported shared core; static timers and no gems make omitted score/time irrelevant to reachability.'};
writeFileSync(new URL('validation.json',dir),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,winning:{...report.winning,route:route.length}}));
if(replay.status!=='finished'||replay.stars!==3||noCredit.winner||!noCredit.exhausted||wrongChoice.winner||!wrongChoice.exhausted)process.exitCode=1;
