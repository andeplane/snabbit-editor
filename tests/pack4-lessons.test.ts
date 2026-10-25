import { describe,it,expect } from "vitest";
import { createLesson, lessons, routeFor } from "../scripts/pack4-levels";
import { importLevel,validateLevel } from "../src/core/serialization";
import { advanceRun,startRun } from "../src/core/simulation";
import { solve } from "../src/core/solver";

describe("Pack4 introductory progression",()=>{
  for(const lesson of lessons) {
    it(`${lesson.name}: readable gem route earns3stars with no damage`,()=>{
      const level=validateLevel(createLesson(lesson)),board=importLevel(level),route=routeFor(lesson);
      let state=startRun(board),touches=0;
      while(state.status==="running"&&state.time<2000) {
        const previous=state;
        state=advanceRun(board,state,route[Math.min(state.row+1,route.length-1)].direction);
        if(state.switchMask!==previous.switchMask)touches++;
      }
      expect(state).toMatchObject({status:"finished",crashes:0,stars:3,turns:lesson.turns.filter(r=>r<=state.row).length});
      expect(touches).toBe(lesson.switches.length);
      expect(state.lives).toBeGreaterThanOrEqual(3);
      expect(board.grid.filter(c=>c==="=")).toHaveLength(lesson.switches.length);
    });
    it(`${lesson.name}: A* proves a damage-free3star solution and every lever matters`,()=>{
      const board=importLevel(createLesson(lesson));
      const result=solve(board,{allowDamage:false,maxStates:350000});
      expect(result.status).toBe("optimal");
      expect(result.stars).toBe(3);
      expect(result.crashes).toBe(0);
      let state=startRun(board);
      for(const point of result.path.slice(1))state=advanceRun(board,state,point.direction);
      expect(state).toMatchObject({status:"finished",stars:3,crashes:0});
      expect(state.score).toBeCloseTo(result.score,8);
      for(const sw of lesson.switches) {
        const index=sw.row*board.width+routeFor(lesson)[sw.row].col;
        const grid=[...board.grid];grid[index]="4";
        const missing=solve({...board,grid},{allowDamage:false,maxStates:350000});
        expect(missing.status,`switch ${sw.channel} at row${sw.row} must unlock the route`).toBe("unreachable");
      }
    });
  }
});
