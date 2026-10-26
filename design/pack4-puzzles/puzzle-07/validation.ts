import {readFileSync,writeFileSync} from 'node:fs';
import {importLevel,validateLevel} from '../../../src/core/serialization';
import {advanceRun,startRun,obstacleHP} from '../../../src/core/simulation';
import type {Board,RunState} from '../../../src/core/simulation';
import type {LevelData} from '../../../src/store/types';
const level=validateLevel(JSON.parse(readFileSync(new URL('./level.json',import.meta.url),'utf8')) as LevelData);
const board=importLevel(level);
const assert=(value:unknown,message:string):void=>{if(!value)throw new Error(message)};
function key(s:RunState):string{return [s.row,s.col,s.direction,s.lives,s.switchMask,s.colliding,s.growing,s.stars,s.combo,s.gemAge,JSON.stringify(s.touched)].join('/')}
function segment(b:Board,start:RunState,row:number,col:number,maxCrashes:number):RunState{
 const queue=[start];const seen=new Set<string>();let found:RunState|undefined;
 for(let i=0;i<queue.length;i++){
  const s=queue[i];if(s.row===row&&s.col===col&&!s.colliding){if(!found||s.crashes<found.crashes||(s.crashes===found.crashes&&s.turns<found.turns))found=s;continue;}
  if(s.row>=row||s.status!=='running')continue;
  for(const d of [-1,1] as const){const n=advanceRun(b,s,d);if(n.status==='dead'||n.crashes>maxCrashes)continue;const k=key(n);if(!seen.has(k)){seen.add(k);queue.push(n)}}
 }
 if(!found)throw new Error(`Waypoint ${row},${col} unreachable (cap ${maxCrashes})`);return found;
}
const waypoints:[[number,number],number][]=[[[6,9],0],[[12,9],0],[[17,8],0],[[19,8],1],[[22,9],1],[[27,8],1],[[31,10],1],[[34,10],2],[[36,10],2],[[40,10],2]];
let intended=startRun(board);for(const [[r,c],cap]of waypoints)intended=segment(board,intended,r,c,cap);intended=advanceRun(board,intended,intended.direction);
assert(intended.status==='finished'&&intended.stars===3&&intended.lives===1&&intended.crashes===2&&intended.switchMask===1,'Authored 3-star replay failed');
let replay=startRun(board);const events:{row:number;col:number;time:number;from:number;to:number}[]=[];const hits:{row:number;col:number;time:number;lives:number}[]=[];
for(const p of intended.trail.slice(1)){const prev=replay;replay=advanceRun(board,replay,p.direction);assert(replay.row===p.row&&replay.col===p.col&&replay.time===p.time,'Replay diverged');if(prev.switchMask!==replay.switchMask)events.push({row:prev.row,col:prev.col,time:replay.time,from:prev.switchMask,to:replay.switchMask});if(prev.crashes!==replay.crashes)hits.push({row:replay.row,col:replay.col,time:replay.time,lives:replay.lives})}
// Finish collection is one final transition at the finish cell.
if(replay.status!=='finished')replay=advanceRun(board,replay,replay.direction);
assert(replay.status==='finished'&&replay.stars===3,'Winning replay finish failed');
// Real choice counterfactual: take the heart THROUGH the second A lever.
let refund=startRun(board);for(const[r,c]of [[6,9],[12,9],[17,10],[18,11],[19,11],[21,11]])refund=segment(board,refund,r,c,0);
assert(refund.switchMask===0&&refund.lives===4,'Refund branch did not grant heart and erase A');
interface Reachability {expanded:number;maxStars:number;finished:number;maxFinishedStars:number;reachedUpperReward:boolean}
function exhaust(b:Board,start:RunState):Reachability{
 const queue=[start];const seen=new Set<string>([key(start)]);let maxStars=start.stars,finished=0,maxFinishedStars=0,reachedUpperReward=false;
 for(let i=0;i<queue.length;i++){
  const s=queue[i];maxStars=Math.max(maxStars,s.stars);if(s.row>=31&&s.col===10)reachedUpperReward=true;
  if(s.status==='finished'){finished++;maxFinishedStars=Math.max(maxFinishedStars,s.stars);continue;}
  if(s.row>b.height||s.status==='dead')continue;
  for(const d of [-1,1] as const){const n=advanceRun(b,s,d,false);if(n.status==='dead')continue;const k=key(n);if(!seen.has(k)){seen.add(k);queue.push(n)}}
  if(queue.length>300000)throw new Error('Exhaustive proof exceeded explicit small-check limit');
 }
 return {expanded:queue.length,maxStars,finished,maxFinishedStars,reachedUpperReward};
}
const wrongChoice=exhaust(board,refund);assert(wrongChoice.maxStars===2&&wrongChoice.reachedUpperReward&&wrongChoice.finished===0,'Refund must reach second star but lose final toll');
// Removing the cost of the bad bypass rescues the wrong choice: cost matters.
const freeBypass:Board={...board,grid:[...board.grid]};for(let r=25;r<=27;r++)freeBypass.grid[r*board.width+12]='0';
let rescued=refund;for(const [r,c]of [[24,12],[28,12],[31,10],[34,10],[36,10],[40,10]])rescued=segment(freeBypass,rescued,r,c,1);rescued=advanceRun(freeBypass,rescued,rescued.direction);
assert(rescued.status==='finished'&&rescued.stars===3&&rescued.lives===3,'Free bypass did not rescue refund');
// The heart really pays all three bypass hits, but cannot pay the visible final toll.
let broke=refund;for(const[r,c]of [[24,12],[28,12],[31,10],[32,10]])broke=segment(board,broke,r,c,3);
assert(broke.lives===1&&broke.crashes===3&&broke.stars===2,'Refund bypass receipt failed');
let fatal=advanceRun(board,broke,-1);fatal=advanceRun(board,fatal,-1);assert(fatal.status==='dead','Final common toll did not defeat refund');
const noFinalToll:Board={...board,grid:[...board.grid]};for(let c=0;c<board.width;c++)if(noFinalToll.grid[33*board.width+c]==='3')noFinalToll.grid[33*board.width+c]='0';
let futureRescue=broke;for(const[r,c]of [[34,10],[36,10],[40,10]])futureRescue=segment(noFinalToll,futureRescue,r,c,3);futureRescue=advanceRun(noFinalToll,futureRescue,futureRescue.direction);assert(futureRescue.status==='finished'&&futureRescue.stars===3&&futureRescue.lives===1,'Removing future toll must rescue refund');
// Keeping the second lever inert also rescues the heart branch: toggling matters.
const inert:Board={...board,grid:[...board.grid],switches:new Map(board.switches)};inert.grid[18*board.width+11]='0';inert.switches?.delete(18*board.width+11);
let inertRun=startRun(inert);for(const[r,c]of [[6,9],[12,9],[17,10],[19,11],[22,11],[27,9],[31,10],[34,10],[36,10],[40,10]])inertRun=segment(inert,inertRun,r,c,1);inertRun=advanceRun(inert,inertRun,inertRun.direction);
assert(inertRun.status==='finished'&&inertRun.stars===3&&inertRun.lives===3,'Inert refund lever did not rescue heart branch');
// Compact bypass geometry: each brown successor alternative is metal.
for(let r=25;r<=27;r++){assert(board.grid[r*board.width+12]==='3','Sleeve brown missing');for(const c of [11,13])assert(obstacleHP(board,r,c,r*8,0)===200,'Sleeve alternate target is not metal');}
const snapshot=(s:RunState)=>({status:s.status,stars:s.stars,lives:s.lives,score:s.score,time:s.time,crashes:s.crashes,turns:s.turns,switchMask:s.switchMask});
const report={id:level._id,name:level.name,strictTypedCore:true,winning:{...snapshot(intended),waypoints,switchEvents:events,hitEvents:hits,path:intended.trail},replay:snapshot(replay),counterfactuals:{takeRefund:{afterHeart:snapshot(refund),...wrongChoice},afterThreeBypassHits:snapshot(broke),finalTollDeath:snapshot(fatal),removeFinalToll:snapshot(futureRescue),removeBypassCost:snapshot(rescued),removeSecondToggle:snapshot(inertRun)},stateTruth:[0,1].map(mask=>({mask,firstGate:obstacleHP(board,10,9,80,mask),valuableGate:obstacleHP(board,26,8,208,mask)})),budget:{skipHeart:{start:3,lowerDirt:1,finalDirt:1,finish:1},takeHeart:{start:3,heart:1,bypassDirtCells:3,finalDirt:1,maxBeforeBypass:4},gems:4,comboUnavailable:true},nativeCaution:'Typed shared-core decision-boundary proof assumes one full life per confirmed collision. Native collision-drain correction is being integrated by root; native acceptance remains pending. The complete fork-to-final-toll chamber spans rows18-33 with only three bypass dirt cells.',scope:'No copied simulation; all transitions use src/core/simulation.ts. No global optimal-score claim; exhaustive reachability applies to wrong branch only.'};
writeFileSync(new URL('./validation.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,winning:{...report.winning,path:'saved'}},null,2));
