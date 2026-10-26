import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importLevel } from '../../../src/core/serialization';
import { solve } from '../../../src/core/solver';
import { startRun, advanceRun } from '../../../src/core/simulation';
import type { LevelData } from '../../../src/store/types';

const dir=path.dirname(fileURLToPath(import.meta.url));
const level=JSON.parse(fs.readFileSync(path.join(dir,'level.json'),'utf8')) as LevelData;
const board=importLevel(level);
const result=solve(board,{allowDamage:false,maxStates:350_000});
let replay=startRun(board);
for(const point of result.path.slice(1)) replay=advanceRun(board,replay,point.direction);
const blockedChannels=Object.entries(level.switches!.data).map(([index,channel])=>{
 const disabled=structuredClone(level);
 disabled.grid.data=disabled.grid.data.slice(0,+index)+'0'+disabled.grid.data.slice(+index+1);
 delete disabled.switches!.data[index];
 const test=solve(importLevel(disabled),{allowDamage:false,maxStates:350_000});
 return {channel,status:test.status,expanded:test.expanded,score:test.score};
});
const report={id:level._id,name:level.name,width:board.width,height:board.height,
 result,replay:{status:replay.status,stars:replay.stars,crashes:replay.crashes,
 lives:replay.lives,gems:replay.gems,diamonds:replay.diamonds,switchMask:replay.switchMask},
 blockedChannels,
 valid:result.status==='optimal'&&replay.status==='finished'&&replay.stars===3&&
 replay.crashes===0&&replay.switchMask===31&&blockedChannels.every(x=>x.status==='unreachable')};
fs.writeFileSync(path.join(dir,'validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,result:{...result,path:`${result.path.length} points`}},null,2));
if(!report.valid) process.exitCode=1;
