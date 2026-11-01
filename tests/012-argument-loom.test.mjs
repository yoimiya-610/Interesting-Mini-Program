import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/apps/012-argument-loom/content.js';
import '../public/apps/012-argument-loom/core.js';
const C=globalThis.ArgumentLoom,cp=C.copy;

test('Eight complete original bilingual cases have forty-eight cards and thirty-two specific probes',()=>{
 assert.equal(C.CASES.length,8);const questions=new Set(),cards=new Set();
 for(const c of C.CASES){assert(C.validDoc(C.newDoc(c.id)));assert.equal(c.probes.length,4);assert(Object.isFrozen(c.cards));
  for(const pair of [c.name,c.context,c.alternative,...Object.values(c.cards),...c.probes.map(p=>p.text)]){assert(pair[0].trim());assert(pair[1].trim());assert(!/[\u3400-\u9fff]/.test(pair[1]));}
  for(const pair of Object.values(c.cards)){assert(pair[0].length>=20);assert(pair[1].length>=70);cards.add(pair[1]);}
  for(const p of c.probes){questions.add(p.text[1]);assert.equal(new Set(p.roles).size,2);assert(p.roles.every(C.getRole));}
 }assert.equal(cards.size,48);assert.equal(questions.size,32);assert.equal(C.analyze(C.newDoc('own')).filled.length,0);
});
test('Custom text remains literal in both languages; cloning and exact comparison do not grade claims',()=>{
 const a=C.newDoc('library'),original=cp(a),words='自己的 <reason> & words\n🧵';const b=C.edited(a,'warrant',words);
 assert.deepEqual(a,original);assert.equal(C.display(b,'warrant','zh'),words);assert.equal(C.display(b,'warrant','en'),words);
 for(const lang of ['en','zh'])assert.deepEqual(C.compare(a,b,lang).filter(r=>!r.same).map(r=>r.role),['warrant']);
 const blank=C.edited(b,'qualifier','');assert.equal(C.analyze(blank).filled.length,5);assert.equal(C.edited(b,'claim','x'.repeat(801)),null);
 assert(C.edited(b,'claim','🧵'.repeat(800)));assert.equal(C.edited(b,'unknown','text'),null);
 assert.deepEqual(Object.keys(C.analyze(b)),['filled','empty','characters']);
});
test('Strict atomic restoration rejects malformed records and removes unrelated fields',()=>{
 const s=C.fresh();s.docs.library.notes='原文';s.docs.library.answers=['one','two','three','four'];s.slots=[{id:'s1',doc:cp(s.docs.library)}];s.comparison='s1';
 assert.deepEqual(C.restore(s),s);
 for(const mutate of [s=>s.version=2,s=>s.source='missing',s=>s.role='unknown',s=>delete s.docs.library,s=>s.docs.library.source='labels',s=>s.docs.library.cards.claim.text=['one'],s=>s.docs.library.cards.claim.custom=1,s=>s.docs.library.cards.claim={custom:true,text:['a','b']},s=>s.docs.library.notes='x'.repeat(1501),s=>s.docs.library.answers.push('fifth'),s=>s.docs.library.probe=4,s=>s.docs.library.cards.extra={},s=>s.slots.push(cp(s.slots[0])),s=>s.comparison='missing',s=>s.docs.unknown=C.newDoc('own')]){const bad=cp(s);mutate(bad);assert.equal(C.restore(bad),null);}
 const extra=cp(s);extra.remote='discard';extra.docs.library.secret='discard';extra.slots[0].secret='discard';assert.deepEqual(C.restore(extra),s);
});
test('Maximum seventeen full documents round trip below the disclosed one-megabyte import limit',()=>{
 const s=C.fresh();for(const id of [...C.CASES.map(c=>c.id),'own']){let d=C.newDoc(id);for(const r of C.ROLES)d=C.edited(d,r.id,'🧵'.repeat(800));d.title='🧵'.repeat(80);d.notes='🧵'.repeat(1500);d.answers=Array(4).fill('🧵'.repeat(600));s.docs[id]=d;}
 s.slots=Array.from({length:8},(_,i)=>({id:'s'+i,doc:cp(s.docs.own)}));s.comparison='s7';const raw=JSON.stringify(s);assert(Buffer.byteLength(raw)<1000000);assert.deepEqual(C.restore(JSON.parse(raw)),s);
});
test('TXT keeps all role text, all four authored questions and every original response',()=>{
 let d=C.newDoc('library');for(const r of C.ROLES)d=C.edited(d,r.id,'Original '+r.id+' <&>');d.title='Title 原文';d.notes='Notes 原文';d.answers=['Answer 1','Answer 2','Answer 3','Answer 4'];
 for(const lang of ['zh','en']){const txt=C.txt(d,lang);for(const r of C.ROLES){assert(txt.includes(C.pair(r.name,lang)));assert(txt.includes('Original '+r.id+' <&>'));}for(let i=0;i<4;i++){assert(txt.includes(C.pair(C.getCase('library').probes[i].text,lang)));assert(txt.includes(d.answers[i]));}assert(txt.includes(d.title));assert(txt.includes(d.notes));}
});
