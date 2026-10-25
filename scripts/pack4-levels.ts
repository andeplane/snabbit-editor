import type { BlockChar, LevelData } from "../src/store/types";
import { nextCell, type Direction } from "../src/core/simulation";

export interface Lesson {
  id: string;
  name: string;
  concept: string;
  rows: number;
  turns: readonly number[];
  switches: readonly { row: number; channel: string }[];
  gates: readonly { row: number; channel: string; timed?: boolean; inverted?: boolean }[];
  dense?: boolean;
}
export const lessons: readonly Lesson[] = [
  { id: "4002", name: "One Small Push", concept: "Follow the gems. One orange lever opens the wall ahead. No steering needed.", rows: 40, turns: [], switches: [{row:8,channel:"A"}], gates:[{row:18,channel:"A"}] },
  { id: "4003", name: "It Takes Two", concept: "Two levers, two doors. Follow the broad zigzag and open each door in order.", rows: 64, turns: [12,32,52], switches:[{row:8,channel:"A"},{row:34,channel:"B"}], gates:[{row:22,channel:"A"},{row:46,channel:"B"}] },
  { id: "4004", name: "In Rhythm", concept: "Moving walls keep their rhythm. A lever reverses the rhythm: watch the open passage at arrival.", rows: 76, turns:[12,32,52], switches:[{row:8,channel:"A"},{row:40,channel:"B"}], gates:[{row:20,channel:"A",timed:true},{row:30,channel:"A",timed:true},{row:52,channel:"B",timed:true},{row:62,channel:"B",timed:true}] },
  { id:"4005",name:"Follow the Levers",concept:"Six levers mark a path through the walls. Follow the gems and touch every lever.",rows:108,turns:[12,32,52,72,92],switches:[{row:8,channel:"A"},{row:24,channel:"B"},{row:40,channel:"C"},{row:56,channel:"D"},{row:72,channel:"E"},{row:88,channel:"F"}],gates:[{row:16,channel:"A"},{row:32,channel:"B"},{row:48,channel:"C"},{row:64,channel:"D"},{row:80,channel:"E"},{row:96,channel:"F"}],dense:true },
  { id:"4006",name:"The Switchback Garden",concept:"A final easy remix: use each lever twice, close one route and open the next, with a gentle timed finale.",rows:100,turns:[12,32,52,72,92],switches:[{row:8,channel:"A"},{row:30,channel:"A"},{row:52,channel:"B"},{row:74,channel:"B"}],gates:[{row:18,channel:"A"},{row:40,channel:"A",inverted:true},{row:62,channel:"B",timed:true},{row:84,channel:"B",timed:true,inverted:true}],dense:true },
];
export function routeFor(lesson: Lesson) {
  const route: {row:number;col:number;direction:Direction}[]=[{row:0,col:9,direction:1}];
  let direction:Direction=1;
  for(let row=1;row<lesson.rows;row++) {
    if(lesson.turns.includes(row))direction=direction===1?-1:1;
    const previous=route[row-1];
    route.push({...nextCell(previous.row,previous.col,direction,16),direction});
  }
  return route;
}
export function createLesson(lesson:Lesson):LevelData {
  const width=16,route=routeFor(lesson),grid:BlockChar[]=Array(width*lesson.rows).fill("0");
  const switches:Record<string,string>={},gates:Record<string,string>={},timers:Record<string,string>={};
  const put=(row:number,col:number,char:BlockChar)=>{grid[row*width+((col+width)%width)]=char;};
  // Faceted rock edges outline a generous channel; later lessons add alternating
  // walls and pockets. Every decoration stays clear of the authored route.
  for(let row=3;row<lesson.rows-5;row++) {
    const col=route[row].col;
    if(lesson.dense || row%4===0) {
      put(row,col-3,"2");put(row,col+3,"2");
      if(lesson.dense && row%2===0) {put(row,col-4,"1");put(row,col+4,"1");}
    }
    put(row,col,"4");
  }
  // Slow the first encounter without adding another player action.
  put(1,route[1].col,";");
  for(const sw of lesson.switches) {
    const col=route[sw.row].col;
    // A one-cell opening makes the lever an unmistakable destination.
    for(let c=0;c<width;c++)put(sw.row,c,"1");
    put(sw.row,col,"=");switches[String(sw.row*width+col)]=sw.channel;
  }
  for(const gate of lesson.gates) {
    for(let col=0;col<width;col++) {
      const index=String(gate.row*width+col);
      put(gate.row,col,"1");gates[index]=gate.channel;
      if(gate.timed)timers[index]=JSON.stringify([gate.inverted?0:1,32,32,8,0,0]);
      else if(gate.inverted)timers[index]=JSON.stringify([0,32767,32767,0,0,0]);
    }
  }
  const occupied=new Set([...lesson.switches,...lesson.gates].map(x=>x.row));
  const stars:number[]=[];
  for(const fraction of [.28,.57,.85]) {
    let row=Math.floor((lesson.rows-5)*fraction);
    while(occupied.has(row)||stars.includes(row))row++;
    stars.push(row);put(row,route[row].col,"8");
  }
  const finish=lesson.rows-4;
  for(let col=0;col<width;col++)put(finish,col,"7");
  return {_id:lesson.id,_type:"level",_ns:"level",name:lesson.name,width,creator:"local",credits:"Snabbit Workshop",published:1,grid:{data:grid.join("")},timers:{data:timers},switches:{data:switches},gates:{data:gates},lesson:{concept:lesson.concept,authoredTurns:lesson.turns,starRows:stars}};
}
