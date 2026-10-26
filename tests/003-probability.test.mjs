import test from 'node:test';
import assert from 'node:assert/strict';
await import('../public/apps/003-probability-rain/math.js');
const {distribution,samplePath,summarize}=globalThis.ProbabilityRain;
test('已知二项分布与确定性边界',()=>{
  assert.deepEqual(distribution(2,.25),[.5625,.375,.0625]);
  assert.deepEqual(distribution(8,.5),[1,8,28,56,70,56,28,8,1].map(v=>v/256));
  assert.deepEqual(distribution(4,0),[1,0,0,0,0]);assert.deepEqual(distribution(4,1),[0,0,0,0,1]);
  assert.equal(samplePath(12,0,()=>0).rights,0);assert.equal(samplePath(12,1,()=>.999999).rights,12);
});
test('概率质量归一化、镜像对称、理论均值和方差',()=>{
  for(const n of [4,8,12,30])for(const p of [0,.01,.25,.5,.7,.99,1]){
    const values=distribution(n,p),mirror=distribution(n,1-p);assert(Math.abs(values.reduce((a,b)=>a+b,0)-1)<1e-12);
    assert(values.every((v,k)=>Math.abs(v-mirror[n-k])<1e-12));
    const mean=values.reduce((s,v,k)=>s+v*k,0),variance=values.reduce((s,v,k)=>s+v*(k-mean)**2,0);
    assert(Math.abs(mean-n*p)<1e-10);assert(Math.abs(variance-n*p*(1-p))<1e-10);
  }
});
test('路径方向对应落槽，固定种子采样守恒且均值合理',()=>{
  let seed=37;const rng=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;},counts=Array(9).fill(0);
  for(let i=0;i<10000;i++){const ball=samplePath(8,.7,rng);assert.equal(ball.steps.length,8);assert.equal(ball.steps.filter(Boolean).length,ball.rights);counts[ball.rights]++;}
  const summary=summarize(counts);assert.equal(summary.total,10000);assert(Math.abs(summary.mean-5.6)<.06);
});
test('空样本不假报均值，实际统计与非法输入边界',()=>{
  assert.deepEqual(summarize([0,0]),{total:0,mean:null,standardDeviation:null});assert.deepEqual(summarize([1,2,1]),{total:4,mean:1,standardDeviation:Math.sqrt(.5)});
  for(const args of [[0,.5],[3.5,.5],[31,.5],[8,-.1],[8,1.1],[8,NaN]])assert.throws(()=>distribution(...args),RangeError);
  assert.throws(()=>samplePath(8,.5,()=>1),RangeError);assert.throws(()=>samplePath(8,.5,()=>NaN),RangeError);
  for(const counts of [[],[1],[-1,2],[.5,1],[NaN,0],[Number.MAX_SAFE_INTEGER,1]])assert.throws(()=>summarize(counts),RangeError);
});
