import test from 'node:test';
import assert from 'node:assert/strict';
await import('../public/apps/006-light-path/core.js');
const {LEVELS,trace,turn,judge,restore,svg}=globalThis.LightPath;
const solutions=[['/'],['/','/'],['/','/','\\'],['\\','\\','/','\\'],['/','\\','\\','/','\\','/'],['/','\\','\\','\\','/','\\','\\'],['\\','\\','/','\\','\\','\\'],['/','\\','/','\\','/','\\','/','\\'],['/','/','\\','/','\\','/','\\','/','\\','/']];
test('九关初始状态均未完成，已知光路经过全部星光后抵达终点',()=>{
  LEVELS.forEach((level,i)=>{assert.equal(trace(level,level.mirrors.map(m=>m.initial)).won,false);const result=trace(level,solutions[i]);assert.equal(result.status,'win',level.name);assert.equal(result.collected.length,level.stars.length);assert.deepEqual(result.path.at(-1),level.goal);});
  const alternate=[...solutions[4]];alternate[5]='\\';assert.equal(trace(LEVELS[4],alternate).won,true,'未经过的镜片不应影响通关');
});

test('联动关全状态独立 BFS 验证：最少 3、5、7 步，后两关无替代光路捷径',()=>{
  const minimums=[],winningCounts=[];for(const level of LEVELS.slice(6)){
    const n=1<<level.mirrors.length,orient=mask=>level.mirrors.map((_,i)=>mask>>i&1?'\\':'/'),stateOf=a=>a.reduce((s,c,i)=>s|(c==='\\'?1<<i:0),0),wins=Array.from({length:n},(_,i)=>i).filter(i=>trace(level,orient(i)).won),initial=stateOf(level.mirrors.map(m=>m.initial)),dist=Array(n).fill(-1),queue=[initial];dist[initial]=0;const masks=level.links.map((links,i)=>[i,...links].reduce((mask,j)=>mask^(1<<j),0));
    for(let q=0;q<queue.length;q++){const state=queue[q];for(const mask of masks){const next=state^mask;if(dist[next]===-1){dist[next]=dist[state]+1;queue.push(next);}}}
    const minimum=Math.min(...wins.filter(i=>dist[i]>=0).map(i=>dist[i]));minimums.push(minimum);winningCounts.push(wins.length);assert.equal(minimum,level.budget);assert.equal(queue.length,level.id==='linked-intro'?32:n);assert(wins.every(mask=>!judge(level,orient(mask),minimum+2).won));
    for(let i=0;i<level.mirrors.length;i++){const before=level.mirrors.map(m=>m.initial),after=turn(level,before,i);assert.equal(stateOf(after),initial^masks[i]);assert.deepEqual(turn(level,after,i),before,'同一按钮两次应还原所有联动镜片');assert.deepEqual(before,level.mirrors.map(m=>m.initial),'旋转不得修改输入数组');}
  }assert.deepEqual(minimums,[3,5,7]);assert.deepEqual(winningCounts,[4,1,1]);
});

test('联动数据、操作目标和保存恢复边界，导出标明超额未完成',()=>{
  const level=LEVELS[8];assert.throws(()=>turn(level,solutions[8],10),RangeError);assert.throws(()=>trace({...level,links:level.links.map(()=>[99])},solutions[8]),RangeError);assert.throws(()=>trace({...level,budget:0},solutions[8]),RangeError);assert.throws(()=>judge(level,solutions[8],-1),RangeError);assert.equal(judge(level,solutions[8],7).won,true);assert.equal(judge(level,solutions[8],9).status,'overbudget');assert(svg(level,solutions[8],9).includes('未完成'));
  const data=restore({version:1,level:'linked-finale',orientations:solutions[8],moves:7,records:{'first-turn':1,'crossing':4,'linked-finale':99}});assert.deepEqual(data.records,{'first-turn':1,'crossing':4});assert.equal(data.level,'linked-finale');assert.equal(judge(level,data.orientations,data.moves).won,true);
});
test('墙、出界、缺少星光与闭环正确终止；交叉空格不被误判为回环',()=>{
  const base={id:'test',name:'测试',size:4,start:{x:0,y:1,dir:'E'},goal:{x:3,y:1},mirrors:[],stars:[{x:0,y:0}],walls:[]};assert.equal(trace(base,[]).status,'missing');assert.equal(trace({...base,walls:[{x:2,y:1}]},[]).status,'wall');assert.equal(trace({...base,goal:{x:3,y:3}},[]).status,'exit');
  const loop={id:'loop',name:'回环',size:5,start:{x:2,y:1,dir:'E'},goal:{x:4,y:4},stars:[{x:2,y:3}],walls:[],mirrors:[{id:'A',x:3,y:1,initial:'\\'},{id:'B',x:3,y:3,initial:'/'},{id:'C',x:1,y:3,initial:'\\'},{id:'D',x:1,y:1,initial:'/'}]};const result=trace(loop,loop.mirrors.map(m=>m.initial));assert.equal(result.status,'loop');assert(result.path.length<loop.size*loop.size*4+2);assert.equal(result.won,false);
  const crossing=trace(LEVELS[5],solutions[5]);assert.equal(crossing.won,true);assert(new Set(crossing.path.map(p=>p.x+','+p.y)).size<crossing.path.length);
});
test('非法镜片与重叠棋格拒绝处理，坏当前状态不丢有效纪录',()=>{
  assert.throws(()=>trace(LEVELS[0],['x']),RangeError);assert.throws(()=>trace(LEVELS[0],[]),RangeError);assert.throws(()=>trace({...LEVELS[0],walls:[{...LEVELS[0].start}]},['/']),RangeError);
  const data=restore({version:1,level:'starlight',orientations:['BAD'],moves:-1,records:{'first-turn':1,'two-corners':2,bad:0,starlight:-2}});assert.equal(data.repaired,true);assert.equal(data.moves,0);assert.deepEqual(data.orientations,LEVELS[2].mirrors.map(m=>m.initial));assert.deepEqual(data.records,{'first-turn':1,'two-corners':2});assert.equal(restore({version:2}),null);
  const badMoves=restore({version:1,level:'first-turn',orientations:['/'],moves:NaN,records:{}});assert.equal(trace(LEVELS[0],badMoves.orientations).won,false);
});
test('导出的 SVG 含完整光路与标题，且不嵌入脚本或外部资源',()=>{
  const output=svg(LEVELS[0],['/']);assert(output.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));assert(output.includes('006 · 折光小径'));assert(output.includes('<polyline points="'));assert(!/<script|href=|onload=/i.test(output));
  const escaped=svg({...LEVELS[0],name:'<script> & "test"'},['/']);assert(escaped.includes('&lt;script&gt;'));assert(!escaped.includes('<script>'));
});
