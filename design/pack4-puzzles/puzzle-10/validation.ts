import {readFileSync,writeFileSync} from 'node:fs';
import {importLevel,validateLevel} from '../../../src/core/serialization';
import {startRun,advanceRun,type Board,type RunState,type Direction} from '../../../src/core/simulation';
import {solve} from '../../../src/core/solver';
import type {LevelData,BlockChar} from '../../../src/store/types';
const here=new URL('.',import.meta.url);
const level=validateLevel(JSON.parse(readFileSync(new URL('level.json',here),'utf8')) as LevelData);
const board:Board=importLevel(level);
const authored=JSON.parse(readFileSync(new URL('routes.json',here),'utf8')) as {shortcut:string;safe:string;dirt:[number,number][]};
function replay(b:Board,dirs:string){
 let s=startRun(b);const states:RunState[]=[s];
 for(const letter of dirs){
  const d:Direction=letter==='R'?1:-1;
  const r=s.row;
  // Hold intended steering throughout every full collision, then continue upward.
  let attempts=0;
  do{s=advanceRun(b,s,d,false);states.push(s);if(++attempts>205)throw Error('collision replay overflow');}while(s.row===r&&s.status==='running');
  if(s.status!=='running')break;
 }
 if(s.status==='running'){s=advanceRun(b,s,s.direction,false);states.push(s);}
 return {final:summary(s),path:states.map(p=>({row:p.row,col:p.col,direction:p.direction,time:p.time,score:p.score,lives:p.lives,stars:p.stars,crashes:p.crashes,turns:p.turns,growing:p.growing,colliding:p.colliding})),switchEvents:[]};
}
function summary(s:RunState){return {status:s.status,stars:s.stars,lives:s.lives,score:s.score,time:s.time,crashes:s.crashes,turns:s.turns,gems:s.gems,diamonds:s.diamonds};}
function mutate(b:Board,from:BlockChar,to:BlockChar):Board{return {...b,grid:b.grid.map(c=>c===from?to:c)};}
const shortcut=replay(board,authored.shortcut),safe=replay(board,authored.safe);
const removedHeart=mutate(board,'6','0');
const noHeartShortcut=replay(removedHeart,authored.shortcut);
const noHeartSafe=replay(removedHeart,authored.safe);
const safeOnly=mutate(board,'3','1');
const safeBest=solve(safeOnly,{allowDamage:false,maxStates:100000});
const best=solve(board,{allowDamage:true,maxStates:250000});
const noHeartBest=solve(removedHeart,{allowDamage:true,maxStates:250000});
const replaySearch=(b:Board,r:ReturnType<typeof solve>)=>{let s=startRun(b);for(const p of r.path.slice(1))s=advanceRun(b,s,p.direction,false);return summary(s);};
const report={id:level._id,name:level.name,nativeFormat:true,width:board.width,height:board.height,winningReplay:shortcut,safeReplay:safe,solver:best,solverReplay:replaySearch(board,best),counterfactual:{heartRemovedShortcut:noHeartShortcut,heartRemovedSafe:noHeartSafe,heartRemovedBest:noHeartBest,heartRemovedBestReplay:replaySearch(removedHeart,noHeartBest),shortcutBlockedBest:safeBest,shortcutBlockedReplay:replaySearch(safeOnly,safeBest)},proof:{highScoreObjective:1175,highScoreAvailable:best.score>=1175,highScoreUnavailableWithoutHeart:noHeartBest.score<1175,scoreAdvantage:shortcut.final.score-safe.final.score,sameStars:shortcut.final.stars===3&&safe.final.stars===3,healthBeforeFirstDirt:shortcut.path.find(s=>s.colliding)?.lives,heartRewardDelay:'Pickup occurs leaving row3, growth credited one decision later; funded lives available at row5 before first dirt row12.',nativeScope:'Shared typed core with full collision damage. Root owns native authored-heart and queued-turn parity fixes.'}};
writeFileSync(new URL('validation.json',here),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({shortcut:shortcut.final,safe:safe.final,noHeartShortcut:noHeartShortcut.final,best:{...best,path:best.path.length},noHeartBest:{...noHeartBest,path:noHeartBest.path.length},safeBest:{...safeBest,path:safeBest.path.length}}));
if(shortcut.final.status!=='finished'||shortcut.final.stars!==3||safe.final.status!=='finished'||safe.final.stars!==3||shortcut.final.score<=safe.final.score||noHeartShortcut.final.status!=='dead'||best.status!=='optimal'||noHeartBest.status!=='optimal'||safeBest.status!=='optimal'||best.stars!==3||best.score<=noHeartBest.score)process.exitCode=1;
