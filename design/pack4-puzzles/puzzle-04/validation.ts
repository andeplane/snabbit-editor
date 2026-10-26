import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importLevel } from '../../../src/core/serialization';
import { solve } from '../../../src/core/solver';
import { startRun, advanceRun, obstacleHP } from '../../../src/core/simulation';
import { computeDelay, stateForBlock } from '../../../src/core/timer';
import type { Board, RunState, Direction } from '../../../src/core/simulation';
import type { LevelData } from '../../../src/store/types';

const dir=path.dirname(fileURLToPath(import.meta.url));
const level=JSON.parse(fs.readFileSync(path.join(dir,'level.json'),'utf8')) as LevelData;
const board:Board=importLevel(level);
type Event={row:number;col:number;time:number;before:number;after:number};
function events(board:Board,route:Direction[]){
 let state=startRun(board);const switches:Event[]=[];const steps=[state];
 for(const direction of route){
  const old=state;state=advanceRun(board,state,direction);
  if(old.switchMask!==state.switchMask) switches.push({row:old.row,col:old.col,
   time:state.time,before:old.switchMask,after:state.switchMask});
  steps.push(state);if(state.status!=='running')break;
 }
 return {state,steps,switches};
}
function routeTo(state:RunState,row:number,col:number):Direction[]{
 const failed=new Set<string>();
 function visit(s:RunState):Direction[]|null{
  if(s.row===row)return s.col===col?[]:null;
  if(s.row>row||s.status!=='running'||s.colliding)return null;
  const key=[s.row,s.col,s.direction,s.switchMask].join('/');if(failed.has(key))return null;
  for(const d of [s.direction,-s.direction] as Direction[]){
   const n=advanceRun(board,s,d);if(n.colliding)continue;
   const tail=visit(n);if(tail)return[d,...tail];
  }
  failed.add(key);return null;
 }
 const route=visit(state);if(!route)throw new Error(`Unreachable authored waypoint ${row},${col}`);return route;
}
// Establish the authored winning route before asking the score solver.
const waypoints:[[number,number],...[number,number][]]=[[8,10],[12,12],[24,9],
 [31,8],[38,7],[42,5],[48,7],[56,9],[62,8]];
let intended=startRun(board);const directions:Direction[]=[];
for(const [r,c] of waypoints){for(const d of routeTo(intended,r,c)){
 directions.push(d);intended=advanceRun(board,intended,d);
}}
directions.push(intended.direction);intended=advanceRun(board,intended,intended.direction);
const authored=events(board,directions);
const winningSummary={status:intended.status,stars:intended.stars,lives:intended.lives,
 score:intended.score,time:intended.time,crashes:intended.crashes,diamonds:intended.diamonds,
 gems:intended.gems,switchMask:intended.switchMask,switchEvents:authored.switches};
const rhythm=[24,48].map(row=>{
 const point=authored.steps.find(s=>s.row===row)!;
 const idx=row*board.width+point.col,timer=board.timers.get(idx)!;
 const phase=stateForBlock(timer,computeDelay(row,point.col,timer),point.time);
 return {row,col:point.col,time:point.time,intrinsicState:phase.state,
  phase:phase.progress,mask:point.switchMask,
  effectiveHP:obstacleHP(board,row,point.col,point.time,point.switchMask),
  wrongMaskHP:obstacleHP(board,row,point.col,point.time,point.switchMask^1),
  remainingTicksToPhaseChange:(1-phase.progress)*(phase.state?timer.toggleAfter:timer.toggleBackAfter)};
});
function removeSwitch(index:number){
 const copy=structuredClone(level);copy.grid.data=copy.grid.data.slice(0,index)+'0'+copy.grid.data.slice(index+1);
 delete copy.switches!.data[String(index)];return copy;
}
const noFirst=removeSwitch(12*16+12),noReset=removeSwitch(38*16+7);
const staticGates=structuredClone(level);staticGates.timers={data:{}};
const counterfactuals=[['skip first inversion',noFirst],['keep inversion / skip reset',noReset],
 ['replace rhythm with permanent ON gates',staticGates]].map(([name,input])=>{
 const b=importLevel(input as LevelData);
 const replay=events(b,directions);
 const clean=solve(b,{allowDamage:false,maxStates:100_000});
 return {name,winningDirectionsReplay:{status:replay.state.status,row:replay.state.row,
  time:replay.state.time,lives:replay.state.lives,stars:replay.state.stars,
  crashes:replay.state.crashes,switchEvents:replay.switches},
  zeroDamageSearch:{status:clean.status,expanded:clean.expanded,stars:clean.stars}};
});
const staticNoReset=structuredClone(noReset);staticNoReset.timers={data:{}};
const permanentUnlockControl=events(importLevel(staticNoReset),directions);
const optimum=solve(board,{allowDamage:false,maxStates:100_000});
// Full survival searches on missing toggles test whether damage can buy a phase.
const survivalChecks=[['skip first inversion',noFirst],['skip reset',noReset]].map(([name,input])=>{
 const search=solve(importLevel(input as LevelData),{allowDamage:true,maxStates:100_000});
 return {name,status:search.status,expanded:search.expanded,stars:search.stars,
  crashes:search.crashes,score:search.score};
});
const report={id:level._id,name:level.name,width:board.width,height:board.height,
 authoredRoute:{waypoints,directions,path:authored.steps.map(s=>({row:s.row,col:s.col,
  direction:s.direction,time:s.time,switchMask:s.switchMask}))},winningSummary,rhythm,
 optimum:{...optimum,path:undefined},counterfactuals,survivalChecks,
 permanentUnlockControl:{status:permanentUnlockControl.state.status,stars:permanentUnlockControl.state.stars,
 crashes:permanentUnlockControl.state.crashes,mask:permanentUnlockControl.state.switchMask},
 valid:intended.status==='finished'&&intended.stars===3&&intended.crashes===0&&
 authored.switches.length===2&&rhythm[0].intrinsicState&&!rhythm[1].intrinsicState&&
 rhythm[0].mask===1&&rhythm[1].mask===0&&rhythm.every(g=>g.effectiveHP===0&&g.wrongMaskHP===200)&&
 counterfactuals.slice(0,2).every(c=>c.zeroDamageSearch.status==='unreachable')&&
 counterfactuals[2].zeroDamageSearch.status==='optimal'&&
 permanentUnlockControl.state.status==='finished'&&permanentUnlockControl.state.stars===3&&
 survivalChecks.every(c=>c.status==='unreachable')};
fs.writeFileSync(path.join(dir,'render-state.json'),JSON.stringify({clock:64,switchMask:0,
 visibleGates:Object.fromEntries([...board.gates!.keys()].map(index=>[index,obstacleHP(board,
 Math.floor(index/board.width),index%board.width,64,0)>0]))},null,2)+'\n');
fs.writeFileSync(path.join(dir,'validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,authoredRoute:{...report.authoredRoute,path:'saved',directions:'saved'}},null,2));
if(!report.valid)process.exitCode=1;
