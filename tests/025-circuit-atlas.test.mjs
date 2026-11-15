import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context=vm.createContext({});for(const name of ['content','core'])vm.runInContext(readFileSync(new URL('../public/apps/025-circuit-atlas/'+name+'.js',import.meta.url),'utf8'),context);
const C=context.CircuitAtlas,plain=x=>JSON.parse(JSON.stringify(x)),near=(x,y,eps=1e-9)=>assert(Math.abs(x-y)<eps,`${x} != ${y}`),model=id=>C.blank(C.source(id));
test('Eight authored topologies contain 38 branches, 16 investigations and complete bilingual material',()=>{
 assert.equal(C.cases.length,8);assert.equal(new Set(C.cases.map(c=>c.id)).size,8);assert.equal(C.cases.reduce((n,c)=>n+c.edges.length,0),38);assert.equal(C.cases.reduce((n,c)=>n+c.prompts.length,0),16);
 for(const c of C.cases){assert(c.nodes.includes('P')&&c.nodes.includes('G'));assert(c.name.every(s=>s.length>=3));for(const p of [c.lead,...c.prompts])assert(p.length===2&&p.every(s=>s.length>35)&&!/[\u3400-\u9fff]/.test(p[1]));assert(C.solve(C.blank(c),c).valid);}
});
test('Analytic series, parallel and loaded divider results include powers and zero-voltage equivalent resistance',()=>{
 let s=C.solve(model('series'),C.source('series'));near(s.current,.06);near(s.potentials.A,6);near(s.results[0].power,.36);assert(s.results[0].overload);near(s.equivalent,200);
 const m=model('series');m.voltage='6';s=C.solve(m,C.source('series'));near(s.results[0].power,.09);m.voltage='0';s=C.solve(m,C.source('series'));near(s.current,0);near(s.equivalent,200);
 s=C.solve(model('parallel'),C.source('parallel'));[.09,.045,.0225].forEach((v,i)=>near(s.results[i].current,v));near(s.current,.1575);
 const d=model('loaded');s=C.solve(d,C.source('loaded'));near(s.potentials.A,5);near(s.results[2].drop,5);assert.equal(s.results[2].current,0);d.edges[2].on=true;s=C.solve(d,C.source('loaded'));near(s.potentials.A,10/3);near(s.equivalent,1500);
});
test('Balanced and unbalanced bridges preserve current directions and endpoint reversal',()=>{
 const m=model('bridge'),c=C.source('bridge');let s=C.solve(m,c);near(s.results[4].current,0);m.edges[1].r='2200';s=C.solve(m,c);assert(s.results[4].current>0);const before=s.results[4].current;[m.edges[4].a,m.edges[4].b]=[m.edges[4].b,m.edges[4].a];s=C.solve(m,c);near(s.results[4].current,-before);near(s.power,s.results.reduce((n,r)=>n+r.power,0));
});
test('Floating islands, one-terminal anchoring and returns have distinct interpretations',()=>{
 const m=model('floating'),c=C.source('floating');let s=C.solve(m,c);assert.deepEqual(plain(s.floating),['B','C','D']);assert.equal(s.potentials.B,null);for(const r of s.results.slice(2,5)){near(r.current,0);near(r.drop,0);}
 m.edges[5].on=true;s=C.solve(m,c);assert.equal(s.floating.length,0);for(const node of ['B','C','D'])near(s.potentials[node],4);for(const r of s.results.slice(2,5))near(r.current,0);
 m.edges[6].on=true;s=C.solve(m,c);assert(s.potentials.B>s.potentials.C);assert(s.potentials.A<4);assert(s.results[2].current>0);
});
test('Opening every branch leaves fixed terminals, undetermined isolated nodes and infinite equivalent resistance',()=>{
 for(const c of C.cases){const m=C.blank(c);m.edges.forEach(r=>r.on=false);const s=C.solve(m,c);assert(s.valid);assert.equal(s.equivalent,null);assert.equal(s.current,0);assert.equal(s.power,0);near(s.potentials.P,Number(m.voltage));near(s.potentials.G,0);for(const node of c.nodes.slice(2))assert.equal(s.potentials[node],null);}
});
// Independent integer-resistance oracle: exact rational Cramer's-rule determinants.
const gcd=(a,b)=>b?gcd(b,a%b):a,rat=(n,d=1n)=>{if(d<0n){n=-n;d=-d;}const g=gcd(n<0n?-n:n,d);return [n/g,d/g];},add=(a,b)=>rat(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),mul=(a,b)=>rat(a[0]*b[0],a[1]*b[1]),neg=a=>[-a[0],a[1]];
function det(a){if(!a.length)return [1n,1n];if(a.length===1)return a[0][0];return a[0].reduce((sum,v,j)=>add(sum,mul(j%2?neg(v):v,det(a.slice(1).map(row=>row.filter((_,k)=>k!==j))))),[0n,1n]);}
function oracle(m,c){const reach=new Set(['P','G']);let changed=true;while(changed){changed=false;for(const e of m.edges)if(e.on&&(reach.has(e.a)||reach.has(e.b))){for(const node of [e.a,e.b])if(!reach.has(node)){reach.add(node);changed=true;}}}const unknown=c.nodes.filter(n=>!['P','G'].includes(n)&&reach.has(n)),a=unknown.map(()=>unknown.map(()=>[0n,1n])),b=unknown.map(()=>[0n,1n]);
 for(let i=0;i<unknown.length;i++)for(const e of m.edges)if(e.on&&(e.a===unknown[i]||e.b===unknown[i])){const other=e.a===unknown[i]?e.b:e.a,g=rat(1n,BigInt(e.r));a[i][i]=add(a[i][i],g);const j=unknown.indexOf(other);if(j>=0)a[i][j]=add(a[i][j],neg(g));else if(other==='P')b[i]=add(b[i],g);}
 const denominator=det(a),v={P:1,G:0};for(let j=0;j<unknown.length;j++){const numerator=det(a.map((row,i)=>row.map((x,k)=>k===j?b[i]:x)));v[unknown[j]]=Number(numerator[0]*denominator[1])/Number(numerator[1]*denominator[0]);}return {reach,v};}
test('Exact rational independent oracle checks every source and each single-branch opening at varied resistances',()=>{
 let count=0;for(const c of C.cases)for(let disabled=-1;disabled<c.edges.length;disabled++){const m=C.blank(c);m.edges.forEach((r,j)=>{r.r=String([10,47,100,330,1000,4700,10000][(j+disabled+8)%7]);r.on=j!==disabled;});const expected=oracle(m,c),s=C.solve(m,c);assert(s.valid);for(const node of c.nodes){if(expected.reach.has(node))near(s.potentials[node],expected.v[node]*Number(m.voltage),1e-8);else assert.equal(s.potentials[node],null);}for(const node of c.nodes.slice(2))near(s.kcl[node],0);near(s.balance,0,1e-8);count++;}assert.equal(count,46);
});
test('Logarithmic sweep is endpoint-complete, immutable and handles disabled branches and floating probes',()=>{
 const c=C.source('shared'),e=C.fresh().entries.shared,before=JSON.stringify(e),points=C.sweep(e,c);assert.equal(points.length,21);near(points[0].r,10);near(points[20].r,10000);assert(points.some((p,i)=>i&&p.power>points[0].power));assert.equal(JSON.stringify(e),before);
 e.model.edges[0].on=false;for(const p of C.sweep(e,c))near(p.power,0);e.lo='10000';assert.equal(C.sweep(e,c),null);
 const floating=C.fresh().entries.floating;floating.probe='B';for(const p of C.sweep(floating,C.source('floating')))assert.equal(p.voltage,null);
});
test('Literal drafts, scientific notation and self connections are validated without overwriting input',()=>{
 for(const text of ['','1e','1e-999','0x10',' 10','NaN','1e999'])assert.equal(C.numeric(text,0,10000),null);assert.equal(C.numeric('1e3',10,10000),1000);assert.equal(C.numeric('+0',0,24),0);
 const c=C.source('loaded'),m=model('loaded');m.edges[2].r='unfinished';assert(C.solve(m,c).valid);m.edges[2].on=true;assert(!C.solve(m,c).valid);assert.equal(m.edges[2].r,'unfinished');m.edges[2].r='100';m.edges[2].a=m.edges[2].b;assert(!C.solve(m,c).valid);m.edges[2].on=false;assert(C.solve(m,c).valid);
});
test('Complete backups preserve all drafts and notes; malformed data rejects atomically within the file allowance',()=>{
 const data=C.fresh();data.active='mesh';for(const c of C.cases){const e=data.entries[c.id];e.note='\u0000'.repeat(1000);e.model.voltage='-'.repeat(16);for(const r of e.model.edges){r.r='-'.repeat(16);r.rating='-'.repeat(16);}e.checkpoint={model:C.copy(e.model),note:e.note};}const text=JSON.stringify(data);assert(Buffer.byteLength(text)<256000);assert.deepEqual(plain(C.restore(JSON.parse(text))),plain(data));
 for(const mutate of [d=>delete d.entries.series,d=>d.entries.mesh.model.edges.pop(),d=>d.entries.series.note+='x',d=>d.entries.loaded.model.edges[0].a='unknown',d=>d.entries.series.selected=-1,d=>d.entries.parallel.checkpoint.model.voltage='x'.repeat(17)]){const bad=C.copy(data);mutate(bad);assert.equal(C.restore(bad),null);}assert(C.restore(data));
});
test('CSV escapes user-like strings and emits explicit blank fields for undetermined potentials',()=>{
 assert.equal(C.csv([['a,b','say "yes"',null]]),'"a,b","say ""yes""",""');
});
