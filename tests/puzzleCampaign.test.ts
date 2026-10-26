import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {importLevel,parseStoryData,validateLevel} from '../src/core/serialization';
import {advanceRun,startRun,type Board,type Direction,type RunState,type StepPoint} from '../src/core/simulation';
import {solve} from '../src/core/solver';
import {storyFile} from './gameResources';
interface PuzzleFixture {number:number;id:string;name:string;allowDamage:boolean;directions:Direction[];expected:Partial<RunState>}
const manifest=JSON.parse(readFileSync('design/pack4-puzzles/manifest.json','utf8')) as {puzzles:PuzzleFixture[]};
const packs=parseStoryData(readFileSync(storyFile(),'utf8'));
function fixture(number:number):PuzzleFixture{return manifest.puzzles[number-1];}
function board(number:number):Board {return importLevel(packs['40'].levels.find(level=>level._id===fixture(number).id)!);}
function replay(number:number,b=board(number),disableCombo=false):RunState {
 let state=startRun(b);
 for(const direction of fixture(number).directions){
  const before=state;state=advanceRun(b,state,direction);
  if(disableCombo&&before.combo===11&&state.gems>before.gems)state={...state,growing:false};
 }
 return state;
}
function reachableCell(b:Board,start:RunState,target:number):boolean {
 const pending=[start],seen=new Set<string>();
 while(pending.length){
  const state=pending.pop()!;
  if(state.status!=='running'||state.row>b.height+40)continue;
  if(state.row*b.width+state.col===target)return true;
  const key=[state.row,state.col,state.direction,state.time,state.lives,state.switchMask,state.combo,state.gemAge,state.growing,state.colliding,JSON.stringify(state.touched)].join('/');
  if(seen.has(key))continue;seen.add(key);
  for(const direction of [-1,1] as const)pending.push(advanceRun(b,state,direction,false));
 }
 return false;
}
describe('ten authored puzzle mechanics',()=>{
 for(const f of manifest.puzzles){
  it(`${f.name}: native bundle matches its ImageGen-first authored JSON`,()=>{
   const authored=validateLevel(JSON.parse(readFileSync(`design/pack4-puzzles/puzzle-${String(f.number).padStart(2,'0')}/level.json`,'utf8')) as unknown);
   expect(packs['40'].levels.find(level=>level._id===f.id)).toEqual(authored);
   expect(readFileSync(`design/pack4-puzzles/puzzle-${String(f.number).padStart(2,'0')}/concept.png`).subarray(0,8)).toEqual(Buffer.from([137,80,78,71,13,10,26,10]));
  });
  it(`${f.name}: intended solution finishes with three stars and the verified resource budget`,()=>{
   const state=replay(f.number);expect(state).toMatchObject(f.expected);expect(state.status).toBe('finished');expect(state.stars).toBe(3);expect(state.lives).toBeGreaterThan(0);
  });
 }
 it('requires the optional middle parity toggle, not simply reaching its location',()=>{
  const b=board(1),switches=new Map(b.switches),indices=[...switches.keys()].sort((a,b)=>a-b);
  switches.set(indices[1],'H');
  expect(solve({...b,switches},{allowDamage:false}).status).toBe('unreachable');
 });
 it('uses twelve blue gems to earn health before the dirt toll; disabling the earned heart kills the route',()=>{
  const b=board(6);expect(b.grid.filter(char=>char==='6')).toHaveLength(0);
  expect(replay(6)).toMatchObject({gems:12,crashes:3,lives:1,status:'finished',stars:3});
  expect(replay(6,b,true).status).toBe('dead');
 });
 it('makes a lever selection actually close access to later alternatives',()=>{
  const b=board(8),indices=[...b.switches!.keys()].sort((a,b)=>a-b),start=startRun(b);
  expect(indices).toHaveLength(3);
  for(const index of indices)expect(reachableCell(b,start,index)).toBe(true);
  let selected=start;
  for(const direction of fixture(8).directions){const before=selected;selected=advanceRun(b,selected,direction);if(selected.switchMask!==before.switchMask)break;}
  expect(selected.switchMask).toBe(1);
  expect(reachableCell(b,selected,indices[2])).toBe(false);
  expect(reachableCell(b,{...selected,switchMask:0},indices[2])).toBe(true);
 });
 it('requires the second timed toggle even though keeping the first state looks like an unlock',()=>{
  const b=board(4),switches=new Map(b.switches),last=[...switches.keys()].sort((a,b)=>a-b).at(-1)!;
  switches.set(last,'H');expect(replay(4,{...b,switches}).status).toBe('dead');
 });
 it('makes the dirt shortcut profitable only with its heart, while retaining a safe lower-score route',()=>{
  const b=board(10),withoutHeart={...b,grid:b.grid.map(char=>char==='6'?'0':char)};
  expect(replay(10,withoutHeart).status).toBe('dead');
  const report=JSON.parse(readFileSync('design/pack4-puzzles/puzzle-10/validation.json','utf8')) as {safeReplay:{path:StepPoint[];final:{score:number}}};
  let safe=startRun(withoutHeart);
  for(const point of report.safeReplay.path.slice(1))safe=advanceRun(withoutHeart,safe,point.direction);
  expect(safe.status).toBe('finished');expect(safe.stars).toBe(3);expect(safe.crashes).toBe(0);expect(safe.score).toBeLessThan(replay(10).score);
 });
});
