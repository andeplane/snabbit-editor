import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {validateLevel} from '../src/core/serialization';
for(let number=1;number<=10;number++){
 const folder=`design/pack4-puzzles/puzzle-${String(number).padStart(2,'0')}`;
 const level=validateLevel(JSON.parse(readFileSync(`${folder}/level.json`,'utf8')) as unknown);
 execFileSync(process.execPath,['--import','tsx',`${folder}/validation.ts`],{encoding:'utf8',maxBuffer:8*1024*1024,stdio:['ignore','pipe','pipe']});
 console.log(`${level._id} ${level.name}: intended route and counterfactuals PASS`);
}
