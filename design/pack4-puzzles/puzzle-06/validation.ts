import {readFileSync,writeFileSync} from 'node:fs';
import {importLevel,validateLevel} from '../../../src/core/serialization';
import {advanceRun,startRun,type Board,type Direction} from '../../../src/core/simulation';
import type {LevelData} from '../../../src/store/types';
const folder=new URL('.',import.meta.url);
const level=validateLevel(JSON.parse(readFileSync(new URL('level.json',folder),'utf8')) as LevelData);
const board=importLevel(level);
const route=JSON.parse(readFileSync(new URL('authored-route.json',folder),'utf8')) as {row:number,col:number,direction:Direction}[];
function replay(b:Board,disabled=false,poorPocket=false){
 let s=startRun(b);const events:Record<string,unknown>[]=[];let decisions=0;
 while(s.status==='running'&&decisions<180){
  const target=route[s.row+1]??{direction:s.direction};
  const before=s;
  const direction=poorPocket&&s.row>=5&&s.row<=12?(s.row<=8?1:-1):target.direction;
  s=advanceRun(b,s,direction);
  if(disabled&&s.gems>before.gems&&before.combo===11)s={...s,growing:false};
  if(s.gems!==before.gems||s.stars!==before.stars||s.lives!==before.lives||s.colliding||s.status!=='running')events.push({decision:decisions,row:s.row,col:s.col,time:s.time,lives:s.lives,gems:s.gems,combo:s.combo,growing:s.growing,colliding:s.colliding,status:s.status});
  decisions++;
 }
 return {status:s.status,lives:s.lives,stars:s.stars,diamonds:s.diamonds,score:s.score,time:s.time,gems:s.gems,crashes:s.crashes,turns:s.turns,switchMask:s.switchMask,events,path:s.trail};
}
// Full decision-graph counterfactual using the actual imported advanceRun.
// Only the earned-growth consequence is disabled, at the step where it occurs.
// Untimed board: absolute time and path do not affect future transitions.
function exhaustive(disableCombo:boolean,b:Board=board){
 const todo=[startRun(b)];const seen=new Set<string>();let expanded=0,maxStars=0,finished=0,objective=0;
 while(todo.length){
  const s=todo.pop()!;
  const key=[s.status,s.row,s.col,s.direction,s.lives,s.colliding?1:0,s.growing?1:0,s.combo,s.gemAge,s.stars,s.diamonds,JSON.stringify(s.touched)].join('/');
  if(seen.has(key))continue;seen.add(key);expanded++;maxStars=Math.max(maxStars,s.stars);
  if(s.status==='dead')continue;
  if(s.status==='finished'){finished++;if(s.stars===3&&s.diamonds===1)objective++;continue;}
  if(s.row>=b.height)continue;
  for(const d of [-1,1] as Direction[]){
   let n=advanceRun(b,s,d,false);
   if(disableCombo&&n.gems>s.gems&&s.combo===11)n={...n,growing:false};
   if(n.status!=='dead')todo.push(n);
  }
 }
 return {exhaustive:true,expanded,maxStars,finished,objective};
}
const win=replay(board),removed=replay(board,true),wrongChoice=replay(board,false,true);
const counterfactual=exhaustive(true);
const missingCluster=board.grid.slice();for(let r=14;r<=17;r++)missingCluster[r*board.width+route[r].col]='0';
const clusterProof=exhaustive(false,{...board,grid:missingCluster});
const report={levelId:level._id,board:{width:board.width,height:board.height,blueGems:board.grid.filter(x=>x==='4').length,looseHearts:board.grid.filter(x=>x==='6').length},winningReplay:win,comboDisabledReplay:removed,poorerFirstPocketReplay:wrongChoice,comboDisabledCounterfactual:counterfactual,middleClusterRemoved:clusterProof,nativeAcceptance:{status:'requires-root-collision-drain-fix',reason:'At speed2 queued turns can alternate dirt→metal→cleared dirt and reduce a nominal life toll to approximately 0.2 per dirt. Imported core proves full-tock decisions, not frame-level queued-turn survival.'}};
writeFileSync(new URL('validation.json',folder),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,winningReplay:{...win,path:win.path.length},comboDisabledReplay:{...removed,path:removed.path.length}}));
if(win.status!=='finished'||win.stars!==3||win.diamonds!==1||win.gems!==12||win.lives!==1||removed.status!=='dead'||wrongChoice.status!=='dead'||wrongChoice.gems!==10||counterfactual.objective||clusterProof.objective)process.exitCode=1;
