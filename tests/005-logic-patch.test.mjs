import test from 'node:test';
import assert from 'node:assert/strict';
await import('../public/apps/005-logic-patch/core.js');
const {NAMES,PUZZLES,DEFAULT,gate,evaluate,truthTable,compare,inventory,assess,restore}=globalThis.LogicPatch;
const masks={AND:'0001',OR:'0111',XOR:'0110',NAND:'1110',NOR:'1000',XNOR:'1001'},oracle=(type,a,b)=>Number(masks[type][2*a+b]);
test('六种双输入门的完整真值表与非法输入',()=>{
  for(const name of NAMES)assert.equal([gate(name,0,0),gate(name,0,1),gate(name,1,0),gate(name,1,1)].join(''),masks[name]);
  for(const args of [['NOT',0,0],['AND',true,0],['OR','1',0],['XOR',2,0],['NOR',0,NaN]])assert.throws(()=>gate(...args),RangeError);
});
test('穷举 216 种三门电路，全部 16 行输入与独立查表结果一致',()=>{
  let combinations=0;for(const a of NAMES)for(const b of NAMES)for(const c of NAMES){const types=[a,b,c],table=truthTable(types);assert.equal(table.length,16);const inputs=new Set();for(const row of table){const [A,B,C,D]=row.bits,g1=oracle(a,A,B),g2=oracle(b,C,D);assert.deepEqual(evaluate(types,row.bits),{g1,g2,y:oracle(c,g1,g2)});assert.equal(row.y,oracle(c,g1,g2));inputs.add(row.bits.join(''));}assert.equal(inputs.size,16);combinations++;}assert.equal(combinations,216);
});
test('六张任务的规则正确，等价接法通过，不只检查当前输入',()=>{
  const predicates={'all-on':b=>Number(b.every(Boolean)),'any-on':b=>Number(b.some(Boolean)),'same-pairs':b=>Number(b[0]===b[1]&&b[2]===b[3]),'odd-parity':b=>b.reduce((a,c)=>a+c,0)%2,'not-all':b=>Number(!b.every(Boolean)),'all-off':b=>Number(b.every(v=>v===0))},signatures=new Set();
  for(const puzzle of PUZZLES.slice(0,6)){const table=truthTable(puzzle.gates);assert(table.every(row=>row.y===predicates[puzzle.id](row.bits)));assert.equal(compare(puzzle.gates,puzzle.gates).matches,16);signatures.add(table.map(row=>row.y).join(''));}assert.equal(signatures.size,6);
  assert.equal(compare(['NAND','NAND','NOR'],['AND','AND','AND']).matches,16);assert.equal(evaluate(DEFAULT,[0,0,0,0]).y,evaluate(['AND','AND','AND'],[0,0,0,0]).y);assert(compare(DEFAULT,['AND','AND','AND']).mismatches.length>0);
});

test('库存挑战独立校验条件，穷举所有电路确认可解且拒绝超库存捷径',()=>{
  const predicates=[b=>Number(b[0]===b[1]&&b[2]===b[3]),b=>Number(Boolean(b[0]&&b[1])===Boolean(b[2]||b[3])),b=>Number(b[0]!==b[1]?!(b[2]||b[3]):Boolean(b[2]||b[3]))];
  const counts=[];for(const [i,puzzle] of PUZZLES.slice(6).entries()){
    assert(truthTable(puzzle.gates).every(row=>row.y===predicates[i](row.bits)));assert.equal(assess(puzzle.gates,puzzle).matches,16);assert.equal(assess(puzzle.gates,puzzle).passed,false,'直接照搬目标门应违反库存');
    let solutions=0;for(const a of NAMES)for(const b of NAMES)for(const c of NAMES){const types=[a,b,c],functional=truthTable(types).every(row=>row.y===predicates[i](row.bits)),withinStock=NAMES.every(name=>types.filter(t=>t===name).length<=(puzzle.stock[name]||0));assert.equal(assess(types,puzzle).passed,functional&&withinStock);if(functional&&withinStock)solutions++;}counts.push(solutions);
  }assert.deepEqual(counts,[1,1,2]);assert.equal(inventory(['XOR','XOR','NOR'],PUZZLES[6]).valid,true);assert.equal(inventory(['XNOR','XNOR','AND'],PUZZLES[6]).valid,false);assert.equal(assess(DEFAULT,PUZZLES[8]).passed,false);assert.throws(()=>inventory(['BAD'],PUZZLES[6]),RangeError);
});

test('维护后原六张任务记录与新增任务的电路均能恢复',()=>{
  const saved=restore({version:1,gates:['XOR','NOR','XNOR'],bits:[1,0,0,0],mode:'challenge',puzzle:'stock-conditional',completed:PUZZLES.slice(0,6).map(p=>p.id)});assert.equal(saved.repaired,false);assert.equal(saved.completed.length,6);assert.equal(assess(saved.gates,PUZZLES[8]).passed,true);
});
test('恢复保留有效进度并修复坏电路，不接受未知模型与非二进制输入',()=>{
  const recovered=restore({version:1,gates:['BAD'],bits:[0,0,0,0],mode:'challenge',puzzle:'all-on',completed:['all-on','all-on','missing','all-off']});assert.deepEqual(recovered.gates,[...DEFAULT]);assert.deepEqual(recovered.completed,['all-on','all-off']);assert.equal(recovered.repaired,true);
  assert.equal(restore({version:2}),null);assert.equal(restore(null),null);assert.throws(()=>evaluate(DEFAULT,[0,1,2,0]),RangeError);assert.throws(()=>evaluate(DEFAULT,[0,1,0]),RangeError);assert.throws(()=>truthTable(['AND']),RangeError);
  const good=restore({version:1,gates:[...DEFAULT],bits:[1,0,1,1],mode:'explore',puzzle:'all-on',completed:[]});assert.equal(good.repaired,false);assert.deepEqual(good.bits,[1,0,1,1]);
});
