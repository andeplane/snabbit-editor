import { describe,it,expect } from "vitest";
import {readFileSync} from "node:fs";
import {parseStoryData,validateLevel,importLevel} from "../src/core/serialization";
import {startRun,advanceRun} from "../src/core/simulation";
import {solve} from "../src/core/solver";
import {storyFile} from "./gameResources";
const packs=parseStoryData(readFileSync(storyFile(),"utf8"));
const ids=["4002","4003","4004","4005","4006"];
const counts=[1,2,2,5,2];
const scores=[1330,1510,1490,3885,3485];
describe("ImageGen-first Pack4 redesign",()=>{
  for(const [index,id] of ids.entries()) {
    const level=packs["40"].levels.find(x=>x._id===id)!;
    it(`${level.name}: ships its authored concept translation unchanged`,()=>{
      const source:unknown=JSON.parse(readFileSync(`design/pack4-redesign/level-${index+1}/level.json`,"utf8"));
      expect(level).toEqual(validateLevel(source));
      const board=importLevel(level);
      expect(board.grid.filter(c=>c==="=")).toHaveLength(counts[index]);
      expect(board.grid.filter(c=>c==="8")).toHaveLength(3);
      expect(readFileSync(`design/pack4-redesign/level-${index+1}/concept.png`).subarray(0,8)).toEqual(Buffer.from([137,80,78,71,13,10,26,10]));
    });
    it(`${level.name}: proves and replays an optimal3star zero-damage route using its levers`,()=>{
      const board=importLevel(level),result=solve(board,{allowDamage:false});
      expect(result.status).toBe("optimal");
      expect(result.score).toBeCloseTo(scores[index],6);
      let state=startRun(board),touches=0;
      for(const point of result.path.slice(1)) {
        const previous=state;
        state=advanceRun(board,state,point.direction);
        if(previous.switchMask!==state.switchMask)touches++;
      }
      expect(state).toMatchObject({status:"finished",stars:3,crashes:0});
      expect(state.score).toBeCloseTo(result.score,6);
      expect(touches).toBe(counts[index]);
    });
  }
  it("retains the native diagnostic last, and gives lesson3 timer-switch combinations",()=>{
    expect(packs["40"].levels.map(x=>x._id)).toEqual([...ids,"4001"]);
    const b=importLevel(packs["40"].levels[2]);
    expect(b.timers.size).toBeGreaterThan(0);
    expect([...b.gates.keys()].some(index=>b.timers.has(index))).toBe(true);
  });
});
