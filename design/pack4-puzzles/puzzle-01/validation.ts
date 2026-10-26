import {readFileSync,writeFileSync} from 'node:fs';
import {importLevel} from '../../../src/core/serialization';
import {startRun,advanceRun,obstacleHP,type Board,type RunState,type Direction} from '../../../src/core/simulation';
import {solve} from '../../../src/core/solver';
import type {LevelData} from '../../../src/store/types';

const O=new URL('.',import.meta.url);
const level=JSON.parse(readFileSync(new URL('level.json',O),'utf8')) as LevelData;
const board:Board=importLevel(level);
const switchCells=[10*16+9,24*16+5,38*16+9];
const authoredWaypoints=[[10,9],[15,8],[24,5],[38,9],[41,9],[48,9],[50,9]];
interface Node {state:RunState;stage:number;parent:Node|null;}
// Reachability enumeration only: all movement/collision/toggle transitions are
// performed by the real shared advanceRun. No copied mechanics.
function explore(b:Board,forbidden:Set<number>=new Set(),waypoints:number[][]=[]){
 const q:Node[]=[{state:startRun(b),stage:0,parent:null}];
 const seen=new Set<string>(); let cursor=0;
 while(cursor<q.length){
  const n=q[cursor++],s=n.state;
  if(s.status==='finished'&&n.stage===waypoints.length){
   const path:RunState[]=[];for(let p:Node|null=n;p;p=p.parent)path.push(p.state);
   return {status:'reachable',expanded:cursor,states:q.length,path:path.reverse()};
  }
  for(const direction of [-1,1] as Direction[]){
   const t=advanceRun(b,s,direction,false);
   if(t.status==='dead'||t.colliding||t.row>b.height||forbidden.has(t.row*b.width+t.col))continue;
   let stage=n.stage;
   if(stage<waypoints.length&&t.row===waypoints[stage][0]&&t.col===waypoints[stage][1])stage++;
   if(stage<waypoints.length&&t.row>waypoints[stage][0])continue;
   const k=[t.row,t.col,t.direction,t.switchMask,stage,t.status].join('/');
   if(seen.has(k))continue;seen.add(k);q.push({state:t,stage,parent:n});
  }
 }
 return {status:'unreachable',expanded:cursor,states:q.length,path:[] as RunState[]};
}
const intended=explore(board,new Set(),authoredWaypoints);
const result=solve(board,{allowDamage:false,maxStates:350000});
const winning:RunState[]=[startRun(board)];
for(const p of result.path.slice(1)) winning.push(advanceRun(board,winning.at(-1)!,p.direction,false));
const end=winning.at(-1);
const events=winning.flatMap((s,i)=>i&&s.switchMask!==winning[i-1].switchMask?[{
  leavingRow:winning[i-1].row,leavingCol:winning[i-1].col,
  arrivalRow:s.row,time:s.time,before:winning[i-1].switchMask,after:s.switchMask,
  finalDoorOpen:obstacleHP(board,44,8,s.time,s.switchMask)===0,
}]:[]);
const omitMiddle=explore(board,new Set([switchCells[1]]));
const omitFirst=explore(board,new Set([switchCells[0]]));
const omitLast=explore(board,new Set([switchCells[2]]));
const removedMiddle:Board={...board,grid:[...board.grid]};removedMiddle.grid[switchCells[1]]='0';
const counterfactual=explore(removedMiddle);
let wrongReplay=startRun(removedMiddle);
let wrongCollision:{row:number;col:number;time:number;lives:number;switchMask:number;gateHP:number}|null=null;
for(const p of result.path.slice(1)){
 wrongReplay=advanceRun(removedMiddle,wrongReplay,p.direction,false);
 if(wrongReplay.colliding){wrongCollision={row:wrongReplay.row,col:wrongReplay.col,time:wrongReplay.time,lives:wrongReplay.lives,switchMask:wrongReplay.switchMask,gateHP:obstacleHP(removedMiddle,44,9,wrongReplay.time,wrongReplay.switchMask)};break;}
}
const noGate:Board={...board,gates:new Map()};noGate.grid=[...board.grid];
for(const i of board.gates?.keys()??[])noGate.grid[i]='0';
const middleSkipWithoutDoor=explore(noGate,new Set([switchCells[1]]));
const compact=(r:ReturnType<typeof explore>)=>({status:r.status,expanded:r.expanded,states:r.states});
const final=end?{status:end.status,stars:end.stars,lives:end.lives,score:end.score,time:end.time,crashes:end.crashes,turns:end.turns,gems:end.gems,switchMask:end.switchMask}:null;
const report={id:level._id,name:level.name,width:board.width,height:board.height,
 authoredRoute:{waypoints:authoredWaypoints,...compact(intended),constructionReplayFinal:intended.path.at(-1)?{status:intended.path.at(-1)!.status,stars:intended.path.at(-1)!.stars,crashes:intended.path.at(-1)!.crashes}:null,final,switchEvents:events,
  path:winning.map(s=>({row:s.row,col:s.col,direction:s.direction,time:s.time,stars:s.stars,lives:s.lives,score:s.score,crashes:s.crashes,switchMask:s.switchMask}))},
 solver:result,
 proof:{skipMiddle:compact(omitMiddle),skipFirst:compact(omitFirst),skipLast:compact(omitLast),
  removeMiddleToggle:compact(counterfactual),wrongReplayFirstCollision:wrongCollision,skipMiddleWithDoorRemoved:compact(middleSkipWithoutDoor),
  parity:'0 → first 1 → middle 0 → last 1 opens door; skip middle gives 0 → 1 → 0 closed',
  scope:'Complete no-damage reachability enumeration to explicit native finish; static metal boundaries also prohibit survivable damage bypass (200 HP, 3 lives).'},
};
writeFileSync(new URL('validation.json',O),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({final,events,solver:{...result,path:result.path.length},proof:report.proof}));
if(!end||end.status!=='finished'||end.stars!==3||end.crashes!==0||events.length!==3||result.status!=='optimal'||result.stars!==3||[omitMiddle,omitFirst,omitLast,counterfactual].some(r=>r.status!=='unreachable')||middleSkipWithoutDoor.status!=='reachable')process.exitCode=1;
