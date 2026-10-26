import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { importLevel } from '../../../src/core/serialization';
import { solve } from '../../../src/core/solver';
import { startRun, advanceRun, obstacleHP, type Direction } from '../../../src/core/simulation';
import { computeDelay, stateForBlock } from '../../../src/core/timer';
const here = new URL('.', import.meta.url);
const level = JSON.parse(fs.readFileSync(new URL('level.json',here),'utf8'));
const board = importLevel(level);
const result = solve(board,{allowDamage:false,maxStates:300000});
let state=startRun(board);
const eventLog: unknown[]=[];
for (const point of result.path.slice(1)) {
 const before=state;
 state=advanceRun(board,state,point.direction as Direction);
 if(state.switchMask!==before.switchMask || state.stars!==before.stars)eventLog.push({row:before.row,col:before.col,time:before.time,stars:state.stars,maskBefore:before.switchMask,maskAfter:state.switchMask});
 if(state.row!==point.row || state.col!==point.col || state.time!==point.time)throw Error('Replay diverged');
}
// Solver path includes the departure tick at finish; replay above checks it.
const gateCrossings = result.path.filter(p=>board.gates.has(p.row*board.width+p.col)).map(p=>({...p,channel:board.gates.get(p.row*board.width+p.col),effectiveHP:obstacleHP(board,p.row,p.col,p.time,p.switchMask)}));
const gateArrivals=[...board.gates].map(([idx,channel])=>{
 const row=Math.floor(idx/board.width),col=idx%board.width,timer=board.timers.get(idx)!;
 return {row,col,channel,timerStateAtNativeArrival:stateForBlock(timer,computeDelay(row,col,timer),8*row).state,closedWithoutSwitch:obstacleHP(board,row,col,row*8,0)>0,openWithSwitch:obstacleHP(board,row,col,row*8,1<<(channel.charCodeAt(0)-65))===0};
});
const digest=(path:URL)=>createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const sourceHashes=Object.fromEntries(['level.json','../../../src/core/serialization.ts','../../../src/core/simulation.ts','../../../src/core/solver.ts','../../../src/core/timer.ts'].map(p=>[p,digest(new URL(p,here))]));
const report={sourceHashes,id:level._id,name:level.name,dimensions:[board.width,board.height],conceptSource:'concept.png (unchanged built-in image generation output)',referenceLevels:['168','205','138','214','141','163','236','238','240'],result:{...result,path:undefined},replay:{status:state.status,stars:state.stars,crashes:state.crashes,lives:state.lives,score:state.score,time:state.time,turns:state.turns},events:eventLog,gateArrivals,gateCrossings,counts:{obstacles:board.grid.filter(x=>'123'.includes(x)).length,timers:board.timers.size,switches:board.switches.size,gates:board.gates.size,gems:board.grid.filter(x=>x==='4').length},path:result.path};
fs.writeFileSync(new URL('validation-report.json',here),JSON.stringify(report,null,2)+'\n');
if(gateCrossings.length!==4)throw Error('Proof must traverse all four switch-linked timing cells');
if(state.status!=='finished'||state.stars!==3||state.crashes!==0)throw Error('Required zero-damage three-star route missing');
console.log(JSON.stringify({...report,path:undefined},null,2));
