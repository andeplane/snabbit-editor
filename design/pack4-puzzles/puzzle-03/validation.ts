import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {importLevel} from '../../../src/core/serialization';
import {advanceRun,startRun,obstacleHP,type Board,type Direction,type RunState} from '../../../src/core/simulation';
import {computeDelay,stateForBlock} from '../../../src/core/timer';
import type {LevelData} from '../../../src/store/types';
const base=new URL('.',import.meta.url);
const level:LevelData=JSON.parse(fs.readFileSync(new URL('level.json',base),'utf8')) as LevelData;
const board=importLevel(level), gateIndex=35*board.width+8;
const waypointIndices=[8*18+9,14*18+10,17*18+9,23*18+9,29*18+8,35*18+8,39*18+8,51*18+4,57*18+4];
interface Node{state:RunState;directions:Direction[];waypoint:number}
function search(b:Board,requiredWaypoints:number[],maxCrashes:number,maxStates=200000){
 const queue:Node[]=[{state:startRun(b),directions:[],waypoint:0}];let head=0;const seen=new Set<string>();let bestStars=0;
 while(head<queue.length){
  if(head>=maxStates)return {status:'limited' as const,expanded:head,bestStars};
  const n=queue[head++];bestStars=Math.max(bestStars,n.state.stars);
  if(n.state.status==='finished'){
   if(n.state.stars===3&&n.waypoint===requiredWaypoints.length)return {status:'won' as const,expanded:head,bestStars,node:n};
   continue;
  }
  // Full state hash, excluding only trail: no alternate collision/timer model.
  const {trail,...stable}=n.state;const key=JSON.stringify([stable,n.waypoint]);if(seen.has(key))continue;seen.add(key);
  for(const d of [-1,1] as const){
   // Intended replay holds direction during impact; this avoids relying on
   // native queued-turn damage edge cases. Counterfactual allows both.
   if(requiredWaypoints.length&&n.state.colliding&&d!==n.state.direction)continue;
   const s=advanceRun(b,n.state,d,false);
   if(s.status==='dead'||s.crashes>maxCrashes||s.time>640||s.row>b.height)continue;
   let wp=n.waypoint;
   if(wp<requiredWaypoints.length&&s.row*b.width+s.col===requiredWaypoints[wp])wp++;
   if(wp<requiredWaypoints.length&&s.row>Math.floor(requiredWaypoints[wp]/b.width))continue;
   queue.push({state:s,directions:[...n.directions,d],waypoint:wp});
  }
 }
 return {status:'exhausted' as const,expanded:head,bestStars};
}
const win=search(board,waypointIndices,3);
if(win.status!=='won')throw Error('Authored three-star path missing: '+JSON.stringify(win));
let replay=startRun(board);const events:unknown[]=[];
for(const direction of win.node.directions){const before=replay;replay=advanceRun(board,replay,direction);if(before.lives!==replay.lives||before.stars!==replay.stars||before.colliding!==replay.colliding||replay.row*18+replay.col===gateIndex)events.push({from:{row:before.row,col:before.col,time:before.time,lives:before.lives},to:{row:replay.row,col:replay.col,time:replay.time,lives:replay.lives,stars:replay.stars,crashes:replay.crashes,colliding:replay.colliding}})}
// Exhaust every shared-core route with at most the two introductory hits:
// the empty branch cannot buy any extra elapsed time while moving upward.
const noExtraHit=search(board,[],2);
// Same geometry with the optional dirt removed: omit precisely the duplicate
// post-impact tock at row 28, then show that touching the later gate ON freezes it.
const cleanBoard:Board={...board,grid:[...board.grid]};cleanBoard.grid[29*18+8]='0';
let clean=startRun(cleanBoard),original=startRun(board),skipNext=false;
let frozenGateProof:unknown=null;
for(const d of win.node.directions){
 const before=original;original=advanceRun(board,original,d,false);
 if(skipNext){skipNext=false;continue;}
 clean=advanceRun(cleanBoard,clean,d,false);
 if(before.row===28&&original.row===28&&original.colliding)skipNext=true;
 if(clean.row===34&&clean.colliding){
  const first={row:clean.row,time:clean.time,colliding:clean.colliding,touched:{...clean.touched}};
  const next=advanceRun(cleanBoard,clean,d,false);
  frozenGateProof={firstContact:first,laterLiveTimerHp:obstacleHP(cleanBoard,35,8,next.time),retry:{row:next.row,time:next.time,colliding:next.colliding,touched:next.touched}};
  break;
 }
}
const noHeartBoard:Board={...board,grid:[...board.grid]};noHeartBoard.grid[8*18+9]='0';
let noHeart=startRun(noHeartBoard);for(const d of win.node.directions)noHeart=advanceRun(noHeartBoard,noHeart,d,false);

const timer=board.timers.get(gateIndex)!;
const phases=[0,8,16,24,32].map(extra=>({extraTicks:extra,arrival:35*8+extra,state:stateForBlock(timer,computeDelay(35,8,timer),35*8+extra).state,hp:obstacleHP(board,35,8,35*8+extra)}));
const summary=(s:RunState)=>({status:s.status,row:s.row,col:s.col,lives:s.lives,stars:s.stars,time:s.time,crashes:s.crashes,score:s.score,turns:s.turns});
const report={levelId:level._id,levelSha256:createHash('sha256').update(fs.readFileSync(new URL('level.json',base))).digest('hex'),winning:{searchStatus:win.status,expanded:win.expanded,summary:summary(replay),directions:win.node.directions,events,switchEvents:[],trail:replay.trail},noHeartAuthoredReplay:summary(noHeart),frozenGateProof,counterfactual:{description:'No hit beyond the two introductory dirt costs; all controls otherwise permitted, including turns during collision.',...noExtraHit},phases};
fs.writeFileSync(new URL('validation.json',base),JSON.stringify(report,null,2)+'\n');
if(replay.status!=='finished'||replay.stars!==3||replay.crashes!==3)throw Error('Replay failed');
if(frozenGateProof===null||noHeart.status!=='dead')throw Error('Counterfactual replay missing');
if(noExtraHit.status!=='exhausted')throw Error('No-extra-hit proof failed or limited');
console.log(JSON.stringify({winning:summary(replay),winningExpanded:win.expanded,counterfactual:noExtraHit,phases},null,2));
