import { readFileSync, writeFileSync } from 'node:fs';
import { importLevel } from '../../../src/core/serialization';
import { startRun, advanceRun, type Direction } from '../../../src/core/simulation';
import { solve } from '../../../src/core/solver';
const folder = new URL('.', import.meta.url);
const level = JSON.parse(readFileSync(new URL('level.json',folder),'utf8'));
const board = importLevel(level);
const result = solve(board,{allowDamage:false,maxStates:350000});
let replay = startRun(board);
for(const p of result.path.slice(1)) replay = advanceRun(board,replay,p.direction as Direction);
const disabledBoard = {...board,switches:new Map([...board.switches].map(([i])=>[i,'B']))};
const noLever = solve(disabledBoard,{allowDamage:false,maxStates:350000});
const report = { levelId:level._id, width:board.width,height:board.height,
  result,replay:{status:replay.status,stars:replay.stars,crashes:replay.crashes,
    gems:replay.gems,turns:replay.turns,lives:replay.lives,switchMask:replay.switchMask},
  gateDisabled:{status:noLever.status,stars:noLever.stars,score:noLever.score},
  switch: {row:18,col:11,channel:'A'},gate:{row:32,cols:[8,9,10],channel:'A'},
};
writeFileSync(new URL('validation.json',folder),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,result:{...result,path:result.path.length}}));
if(result.status!=='optimal'||result.stars!==3||result.crashes!==0||replay.status!=='finished'||replay.stars!==3||!replay.switchMask) process.exitCode=1;
