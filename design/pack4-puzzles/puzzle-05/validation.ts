import {readFileSync,writeFileSync} from 'node:fs';
import {importLevel} from '../../../src/core/serialization';
import {startRun,advanceRun,obstacleHP,type Board,type RunState,type Direction} from '../../../src/core/simulation';
import {solve} from '../../../src/core/solver';
import type {LevelData} from '../../../src/store/types';
const O=new URL('.',import.meta.url);
const level=JSON.parse(readFileSync(new URL('level.json',O),'utf8')) as LevelData;
const board:Board=importLevel(level);
interface Node {state:RunState;parent:Node|null;}
interface ExploreOptions {preparedMask?:number;allowDamage?:boolean;maxStates?:number;}
// Search orchestration only: all game transitions, timing, pickups, damage and
// toggles are delegated to the actual shared core, never copied here.
function explore(b:Board,options:ExploreOptions={}) {
 const q:Node[]=[{state:startRun(b),parent:null}];const seen=new Set<string>();let cursor=0;
 while(cursor<q.length && cursor<(options.maxStates??150000)){
  const n=q[cursor++],s=n.state;
  if(s.status==='finished'){
   if(s.stars!==3)continue;
   const path:RunState[]=[];for(let p:Node|null=n;p;p=p.parent)path.push(p.state);
   return {status:'reachable',expanded:cursor,states:q.length,path:path.reverse()};
  }
  for(const d of [-1,1] as Direction[]){
   const t=advanceRun(b,s,d,false);
   if(t.status==='dead'||(!options.allowDamage&&t.colliding)||t.row>b.height)continue;
   if(t.row===26 && options.preparedMask!==undefined && t.switchMask!==options.preparedMask)continue;
   const k=[t.row,t.col,t.direction,t.switchMask,t.stars,t.lives,t.time,t.colliding,JSON.stringify(t.touched)].join('/');
   if(seen.has(k))continue;seen.add(k);q.push({state:t,parent:n});
  }
 }
 return {status:cursor<q.length?'limited':'unreachable',expanded:cursor,states:q.length,path:[] as RunState[]};
}
const intended=explore(board,{preparedMask:3});
const result=solve(board,{allowDamage:false,maxStates:150000});
const replay:RunState[]=[startRun(board)];
for(const p of result.path.slice(1)){
 const s=advanceRun(board,replay.at(-1)!,p.direction,false);replay.push(s);
 if(s.row!==p.row||s.col!==p.col||s.colliding)throw new Error('Replay mismatch or damage');
}
const end=replay.at(-1)!;
const events=replay.flatMap((s,i)=>i&&s.switchMask!==replay[i-1].switchMask?[{row:replay[i-1].row,col:replay[i-1].col,channel:board.switches?.get(replay[i-1].row*16+replay[i-1].col),time:s.time,before:replay[i-1].switchMask,after:s.switchMask,finalAOpen:obstacleHP(board,30,8,s.time,s.switchMask)===0,finalBOpen:obstacleHP(board,33,9,s.time,s.switchMask)===0}]:[]);
const compact=(r:ReturnType<typeof explore>)=>({status:r.status,expanded:r.expanded,states:r.states});
const states=[0,1,2,3].map(mask=>({preparedMask:mask,A:!!(mask&1),B:!!(mask&2),afterForcedAMask:mask^1,finalAOpen:obstacleHP(board,30,8,240,mask^1)===0,finalBOpen:obstacleHP(board,33,9,264,mask^1)===0,...compact(explore(board,{preparedMask:mask,allowDamage:true,maxStates:150000}))}));
const withoutForced:Board={...board,grid:[...board.grid]};withoutForced.grid[27*16+8]='0';
const skipRequiredReset=explore(withoutForced,{preparedMask:3,allowDamage:true});
const wrongPreparationSucceedsWhenResetRemoved=explore(withoutForced,{preparedMask:2});
const withoutExitChecks:Board={...board,grid:[...board.grid],gates:new Map(),timers:new Map()};
for(const i of board.gates?.keys()??[])withoutExitChecks.grid[i]='0';
const allWrongStatesWithChecksRemoved=[0,1,2].map(mask=>({preparedMask:mask,...compact(explore(withoutExitChecks,{preparedMask:mask}))}));
const final={status:end.status,stars:end.stars,lives:end.lives,score:end.score,time:end.time,crashes:end.crashes,turns:end.turns,switchMask:end.switchMask};
const report={id:level._id,name:level.name,width:board.width,height:board.height,final,switchEvents:events,solver:result,authoredRoute:{preparedMask:3,...compact(intended),final:intended.path.at(-1)?{status:intended.path.at(-1)!.status,stars:intended.path.at(-1)!.stars,lives:intended.path.at(-1)!.lives}:null},proof:{preparedStates:states,skipRequiredReset:compact(skipRequiredReset),wrongPreparationSucceedsWhenResetRemoved:compact(wrongPreparationSucceedsWhenResetRemoved),allWrongStatesWithChecksRemoved,scope:'Complete shared-core reachability to a three-star authored finish; wrong states permit damage, preserve native freezing gate collisions, and search until death/exhaustion or height. No timers change state in the playable time window.'},winningReplay:replay.map(s=>({row:s.row,col:s.col,direction:s.direction,time:s.time,lives:s.lives,score:s.score,stars:s.stars,crashes:s.crashes,switchMask:s.switchMask}))};
writeFileSync(new URL('validation.json',O),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,solver:{...result,path:result.path.length},winningReplay:undefined},null,2));
if(end.status!=='finished'||end.stars!==3||end.crashes!==0||events.length!==3||events[0].after!==1||events[1].after!==3||events[2].after!==2||states.some(s=>s.status!==(s.preparedMask===3?'reachable':'unreachable'))||skipRequiredReset.status!=='unreachable'||wrongPreparationSucceedsWhenResetRemoved.status!=='reachable'||allWrongStatesWithChecksRemoved.some(s=>s.status!=='reachable'))process.exitCode=1;
