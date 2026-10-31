import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
await import('../public/apps/011-measure-quest/core.js');const C=globalThis.MeasureQuest;
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/011-measure-quest.json',import.meta.url),'utf8'));
// Independent transition construction and full state-graph enumeration.
function oracle(l){
 const n=l.caps.length,start=l.start.join(','),queue=[[...l.start]],nodes=new Map([[start,{distance:0,ways:1,path:[]}]]),edges=new Map();
 for(let at=0;at<queue.length;at++){const s=queue[at],k=s.join(','),node=nodes.get(k),next=[];
  for(let i=0;i<n;i++){
   if(l.tap&&s[i]!==l.caps[i]){const a=[...s];a[i]=l.caps[i];next.push(['f'+i,a]);}
   if(l.tap&&s[i]!==0){const a=[...s];a[i]=0;next.push(['e'+i,a]);}
   for(let j=0;j<n;j++){if(i===j||l.links&&!l.links.some(e=>e.includes(i)&&e.includes(j)))continue;
    const a=[...s];while(a[i]>0&&a[j]<l.caps[j]){a[i]--;a[j]++;}if(a[i]!==s[i])next.push(['p'+i+j,a]);
   }
  }
  edges.set(k,next);for(const [action,s]of next){const id=s.join(',');if(!nodes.has(id)){nodes.set(id,{distance:node.distance+1,ways:node.ways,path:[...node.path,action]});queue.push(s);}else if(nodes.get(id).distance===node.distance+1)nodes.get(id).ways+=node.ways;}
 }return {nodes,edges,goal:nodes.get(l.goal.join(','))};
}
test('Sixteen complete bilingual puzzles have independently verified minimum solutions and distinct goals',()=>{
 const expected=[2,4,6,8,7,8,9,11,9,10,10,11,12,12,13,14],signatures=new Set();
 assert.equal(C.LEVELS.length,16);for(const [i,l]of C.LEVELS.entries()){assert(l.name.every(Boolean));assert(l.idea.every(Boolean));assert(!/[\u3400-\u9fff]/.test(l.name[1]+l.idea[1]));const o=oracle(l),result=C.solve(l),fixture=fixtures[i];assert.equal(fixture.id,l.id);assert.equal(fixture.reachable,o.nodes.size);assert.equal(fixture.optimalRoutes,o.goal.ways);assert.equal(fixture.minimum,expected[i]);assert(C.replay(l,fixture.solution).won);assert.equal(o.goal.distance,expected[i]);assert.equal(l.par,expected[i]);assert.equal(result.path.length,o.goal.distance);assert(C.replay(l,result.path).won);assert(C.replay(l,o.goal.path).won);signatures.add(JSON.stringify([l.caps,l.goal,l.tap,l.links]));}assert.equal(signatures.size,16);
});
test('Every reachable transition matches unit-by-unit pouring; water and capacity constraints hold',()=>{
 for(const l of C.LEVELS){const o=oracle(l),reverse=new Map([...o.nodes.keys()].map(k=>[k,[]]));for(const [key,edges]of o.edges){const s=key.split(',').map(Number),before=[...s],actions=new Map(edges);assert.deepEqual(new Set(C.actions(l,s)),new Set(actions.keys()));for(const [action,next]of edges){assert.deepEqual(C.step(l,s,action),next);assert.deepEqual(s,before);assert(next.every((v,i)=>Number.isInteger(v)&&v>=0&&v<=l.caps[i]));if(!l.tap)assert.equal(next.reduce((a,b)=>a+b),l.start.reduce((a,b)=>a+b));reverse.get(next.join(',')).push(key);}}
  const seen=new Set([l.goal.join(',')]),queue=[l.goal.join(',')];for(let i=0;i<queue.length;i++)for(const k of reverse.get(queue[i]))if(!seen.has(k)){seen.add(k);queue.push(k);}assert.equal(seen.size,o.nodes.size,l.id+' must have no unreachable dead end');
 }
});
test('Later pipe puzzles need 10–14 moves and genuinely constrain shortcuts',()=>{
 const evidence=[];for(const l of C.LEVELS.slice(10)){const restricted=oracle(l),free=oracle({...l,links:null});assert(restricted.goal.distance>=10);assert(restricted.goal.distance>free.goal.distance);evidence.push([l.id,restricted.goal.distance,free.goal.distance,restricted.goal.ways]);
  for(const [key]of restricted.nodes){const route=C.solve(l,key.split(',').map(Number));assert(route,l.id+' '+key);let s=key.split(',').map(Number);for(const a of route.path)s=C.step(l,s,a);assert.deepEqual(s,l.goal);}
 }assert.equal(evidence.at(-1)[1],14);console.log('Late-stage [id, minimum, unrestricted minimum, optimal routes]: '+JSON.stringify(evidence));
});
test('Illegal/no-op actions, malformed attempts and unsupported backups are rejected atomically',()=>{
 const tap=C.LEVELS[0],closed=C.LEVELS[4],pipe=C.LEVELS[10];assert.equal(C.step(tap,[0,0],'p01'),null);assert.equal(C.step(tap,[3,0],'f0'),null);assert.equal(C.step(tap,[0,0],'p00'),null);assert.equal(C.step(closed,closed.start,'f0'),null);assert.equal(C.step(closed,[1,0,0],'p01'),null);assert.equal(C.step(pipe,[3,8,0,0],'p12'),null);assert.equal(C.step(tap,[0.5,0],'e0'),null);
 const state=C.fresh();state.note='查看下一步建议 <my> & notes';state.drafts.first={path:['f1'],redo:['p10'],assisted:true};state.records.first={clean:['f1','p10']};const restored=C.restore(state);assert.equal(restored.note,state.note);assert.equal(restored.drafts.first.assisted,true);assert.deepEqual(restored.drafts.first.redo,['p10']);assert.deepEqual(C.replay(tap,restored.records.first.clean).state,[3,2]);
 for(const mutate of [s=>s.version=2,s=>s.level='missing',s=>s.records.first.clean=['f0'],s=>s.records.first.clean.push('e0'),s=>s.drafts.first.path=['p12'],s=>s.drafts.first.redo=['f0','p10'],s=>s.drafts.first.assisted=1,s=>s.note='x'.repeat(2001),s=>s.records.first.bad=[]]){const bad=C.copy(state);mutate(bad);assert.equal(C.restore(bad),null);}
 const loop=Array.from({length:100},()=>['f0','e0']).flat();assert(C.replay(tap,loop));assert.equal(C.replay(tap,[...loop,'f0']),null);
});
test('Maximum-size legal records remain below the import limit and preserve notes and assistance',()=>{
 const s=C.fresh();s.note='🧭'.repeat(2000);for(const l of C.LEVELS){const answer=oracle(l).goal.path,loop=l.tap?['f0','e0']:['p01','p10'],prefix=Array.from({length:Math.floor((200-answer.length)/2)},()=>loop).flat(),path=[...prefix,...answer];assert(C.replay(l,path)?.won,l.id);s.drafts[l.id]={path,redo:[],assisted:true};s.records[l.id]={clean:path,helped:path};}
 const json=JSON.stringify(s);assert(Buffer.byteLength(json)<150000);const out=C.restore(JSON.parse(json));assert(out);assert.equal(out.note,s.note);assert.equal(Object.keys(out.records).length,16);assert(Object.values(out.drafts).every(d=>d.assisted));
});
test('Classic two-vessel divisibility experiment has the advertised scope and validates inputs',()=>{
 assert.deepEqual(C.classic(3,5,4),{divisor:1,possible:true});assert.deepEqual(C.classic(4,6,3),{divisor:2,possible:false});assert.deepEqual(C.classic(4,6,8),{divisor:2,possible:false});assert.deepEqual(C.classic(4,6,2),{divisor:2,possible:true});for(const args of [[0,5,4],[3,13,4],[3,5,1.5],[3,5,0]])assert.equal(C.classic(...args),null);
});
