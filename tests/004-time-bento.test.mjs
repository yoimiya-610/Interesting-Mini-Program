import test from 'node:test';
import assert from 'node:assert/strict';
await import('../public/apps/004-time-bento/core.js');
const {analyze,duration,restore,layout}=globalThis.TimeBento;
const item=(id,minutes,done=false)=>({id,name:'事项'+id,minutes,done});
test('时间守恒、超额保留，完成不释放容量',()=>{
  const tasks=[item('a',480,true),item('b',420),item('c',90)];assert.deepEqual(analyze(tasks),{total:990,done:480,remaining:450,doneCount:1,count:3});assert.equal(analyze(tasks.map(t=>({...t,done:true}))).remaining,450);assert.equal(analyze([item('a',1440),item('b',120)]).remaining,-120);assert.equal(analyze([]).remaining,1440);
  assert.equal(duration(0),'0分');assert.equal(duration(30),'30分');assert.equal(duration(60),'1小时');assert.equal(duration(90),'1小时30分');assert.equal(duration(1440),'24小时');assert.equal(duration(-120),'−2小时');
});
test('恢复保留有效项，过滤重复、非法记录和超出数量的项',()=>{
  const data={version:1,tasks:[item('a',60),null,item('a',90),{...item('b',30),name:'  事项a  '},item('bad',0),item('c',1441),{...item('done',40),done:'yes'},item('valid',1)]};const result=restore(data);assert.equal(result.dropped,6);assert.deepEqual(result.tasks,[item('a',60),item('valid',1)]);assert.deepEqual(restore({version:1,tasks:[]}),{tasks:[],dropped:0});assert.equal(restore({version:2,tasks:[]}),null);assert.equal(restore(null),null);
  const full=restore({version:1,tasks:Array.from({length:15},(_,i)=>item('id'+i,5))});assert.equal(full.tasks.length,12);assert.equal(full.dropped,3);
});
test('餐盒图块完整覆盖，面积按权重、相互不重叠且不越界',()=>{
  for(const weights of [[1],[1,1],[480,420,90,60,30,30,330],[1,1,1,1437],Array(12).fill(1440)])for(const [w,h] of [[730,420],[302,294]]){
    const boxes=layout(weights,w,h),sum=weights.reduce((a,b)=>a+b,0);assert.equal(boxes.length,weights.length);assert(Math.abs(boxes.reduce((s,b)=>s+b.width*b.height,0)-w*h)<1e-6);
    boxes.forEach((b,i)=>{assert.equal(b.index,i);assert(b.x>=-1e-9&&b.y>=-1e-9&&b.x+b.width<=w+1e-8&&b.y+b.height<=h+1e-8);assert(Math.abs(b.width*b.height/(w*h)-weights[i]/sum)<1e-10);for(let j=i+1;j<boxes.length;j++){const c=boxes[j],overlapX=Math.min(b.x+b.width,c.x+c.width)-Math.max(b.x,c.x),overlapY=Math.min(b.y+b.height,c.y+c.height)-Math.max(b.y,c.y);assert(overlapX<1e-8||overlapY<1e-8);}});
  }
});
test('无效时长、非法布局和大于12项输入被拒绝',()=>{
  for(const minutes of [0,-1,1.5,1441,NaN,Infinity])assert.throws(()=>analyze([item('a',minutes)]),RangeError);
  assert.throws(()=>analyze(Array.from({length:13},(_,i)=>item('id'+i,5))),RangeError);assert.throws(()=>duration(NaN),RangeError);
  for(const weights of [[0],[-1],[NaN],[Infinity]])assert.throws(()=>layout(weights,100,100),RangeError);assert.throws(()=>layout([1],0,100),RangeError);assert.deepEqual(layout([],100,100),[]);
});
