import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {oracle} from './016-crate-oracle.mjs';
const context=vm.createContext({});for(const name of ['content.js','core.js'])vm.runInContext(fs.readFileSync(new URL('../public/apps/016-crate-courier/'+name,import.meta.url),'utf8'),context);const C=context.CrateCourier;
test('Twenty original bilingual boards have independently verified minimum-push solutions',()=>{
 assert.equal(C.LEVELS.length,20);assert.equal(new Set(C.LEVELS.map(l=>l.map.join('\n'))).size,20);
 for(const l of C.LEVELS){for(const p of [l.name,l.focus,l.chapter])assert(p[0]&&p[1]&&!/[\u3400-\u9fff]/.test(p[1]));const exact=oracle(l.map),r=C.solve(l);assert.equal(exact.status,'solved',l.id);assert.equal(exact.pushes,l.minPush,l.id);assert.equal(r.pushes,exact.pushes,l.id);assert(C.won(l,C.replay(l,r.log)),l.id);}
});
test('Late challenge is dependency ordering, not only distance: seven of eight require goal evacuation',()=>{
 let evacuation=0;for(const l of C.LEVELS.slice(12)){assert(l.boxes.length>=3);assert(l.minPush>=12);const frozen=oracle(l.map,{freezeGoals:true});assert.notEqual(frozen.status,'limit',l.id);if(frozen.status==='unsolvable')evacuation++;}assert.equal(evacuation,7);
 const l=C.getLevel('18'),branches=C.pushes(l,C.initial(l)).filter(m=>l.reachMask[m.to]&&C.matching(l,m.state.boxes));let traps=0;for(const m of branches){const map=C.ascii(l,m.state).split('\n');if(oracle(map).status==='unsolvable')traps++;}assert(traps>=1,'A non-corner, individually goal-reachable push can still deadlock the shared approach');
});
test('Push rules, immutable moves, undoing a push with trailing walks, and path revalidation',()=>{
 const b=C.parse(['#######','#     #','# @$ .#','#     #','#######']),s=C.initial(b),p=C.step(b,s,'R');assert.equal(s.pushes,0);assert.equal(p.pushes,1);assert.equal(C.step(b,p,'U').pushes,1);const u=C.undoPush(b,'RU');assert.equal(u.log,'');assert.equal(u.removed,'RU');assert.equal(C.step(b,s,'?'),null);
 const stuck=C.parse(['#######','#     #','# @$$.#','#    .#','#######']);assert.equal(C.step(stuck,C.initial(stuck),'R'),null);assert.equal(C.replay(b,'X'),null);assert(C.staticDead(b,{p:s.p,boxes:[8]}).length);
 const it=C.search(C.getLevel('20'),undefined,{limit:2});let r;do{r=it.next();}while(!r.done);assert.equal(r.value.status,'limit');
});
test('Restorable records, sticky assistance, all twenty notebooks and worst-case backups fit 1 MB',()=>{
 const state=C.fresh();for(const l of C.LEVELS){const e=state.entries[l.id],solved=C.solve(l);e.log=solved.log;e.assisted=true;assert(C.record(l,e));assert.equal(e.best.clean,null);assert.equal(e.best.assisted,e.log);e.title='\u0000'.repeat(80);e.notes='\ud800'.repeat(1000);e.best.clean=solved.log;
  // Fill a legal walk loop before winning, so capacity does not depend on a short solution.
  let at=C.initial(l),prefix='',d;for(let i=0;i<solved.log.length;i++){d=C.ORDER.find(d=>{const s=C.step(l,at,d);return s&&s.pushes===at.pushes;});if(d)break;prefix+=solved.log[i];at=C.step(l,at,solved.log[i]);}assert(d,l.id);const back={U:'D',D:'U',L:'R',R:'L'}[d],cycle=d+back,n=Math.floor((C.MAX_LOG-solved.log.length)/2);e.best.clean=prefix+cycle.repeat(n)+solved.log.slice(prefix.length);e.best.assisted=e.best.clean;e.log=prefix+cycle.repeat(Math.floor((10000-prefix.length)/2));e.redo='';
 }assert(C.restore(state));assert(Buffer.byteLength(JSON.stringify(state,null,2))<C.MAX_IMPORT_BYTES);const good=JSON.stringify(state),invalid=JSON.parse(good);invalid.entries['01'].best.clean+='R';assert.equal(C.restore(invalid),null);assert.equal(JSON.stringify(state),good);invalid.entries['01'].best.clean=null;invalid.entries['01'].log='X';assert.equal(C.restore(invalid),null);
});
