import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function runtime(slug,...scripts){const context=vm.createContext({});for(const script of scripts)vm.runInContext(read('public/apps/'+slug+'/'+script),context);return context;}
const han=/[\u3400-\u9fff]/;

test('Story Fold has eight complete bilingual genres and draw-through decks',()=>{
 const {StoryContent,ProgramEnglish}=runtime('002-story-fold','english.js','content.js');
 assert.equal(Object.keys(StoryContent.pools).length,8);
 for(const[tone,columns]of Object.entries(StoryContent.pools)){
  assert.equal(columns.length,4);assert(ProgramEnglish[StoryContent.names[tone]]);
  columns.forEach((cards,index)=>{
   assert.equal(cards.length,12);assert.equal(new Set(cards).size,12);
   for(const card of cards){assert(ProgramEnglish[card],card);assert(!han.test(ProgramEnglish[card]));}
   const draw=StoryContent.createDraws(()=>.37);let current;
   for(let round=0;round<3;round++){const seen=new Set();for(let i=0;i<12;i++){const next=draw(tone,index,current);assert.notEqual(next,current);assert(!seen.has(next));seen.add(next);current=next;}}
   const first=StoryContent.createDraws(()=>.61),seen=new Set([cards[0]]);current=cards[0];for(let i=0;i<11;i++){current=first(tone,index,current);assert(!seen.has(current));seen.add(current);}assert.equal(seen.size,12);
  });
 }
});

test('Ten poem sources provide distinct full passages, valid paired words, and saved drafts',()=>{
 const {ErasurePoems:p}=runtime('007-erasure-poems','core.js');assert.equal(p.PASSAGES.length,10);
 const signatures=new Set();for(const source of p.PASSAGES){const zh=p.wordsFor(source.id,'','zh'),en=p.wordsFor(source.id,'','en');assert.equal(zh.length,en.length);assert(zh.filter(p.selectable).length>=25);assert(en.every(word=>word&&!han.test(word)));assert(!han.test(source.name[1]));signatures.add(zh.join(''));const draft=p.normalize({selected:source.sample,breaks:source.breaks},zh);assert.equal(draft.selected.length,source.sample.length);assert(p.poem(en,draft,'en').every(line=>line.trim()));const restored=p.restore({version:1,source:source.id,drafts:{[source.id]:{...draft,title:'My own title'}}});assert.equal(restored.source,source.id);assert.equal(restored.drafts[source.id].title,'My own title');}assert.equal(signatures.size,10);
});

test('Eight day plans and eight packing templates contain meaningful editable content',()=>{
 const html=read('public/apps/004-time-bento/index.html'),declaration=html.match(/const recipes=([^\n]+);/)[1],recipes=vm.runInNewContext('('+declaration+')');assert.equal(Object.keys(recipes).length,8);
 const {TimeBento:time}=runtime('004-time-bento','core.js');const totals=[];for(const[key,rows]of Object.entries(recipes)){assert(rows.length>=8&&rows.length<=time.MAX_ITEMS);assert.equal(new Set(rows.map(r=>r[0])).size,rows.length);const tasks=rows.map(([name,minutes],i)=>({id:key+'-'+i,name,minutes,done:false}));assert(tasks.every(time.validTask));const result=time.analyze(tasks);assert(result.total<=1440);assert(result.total>=840);totals.push(result.total);assert(html.includes('data-preset="'+key+'"'));}assert(new Set(totals).size>=5);
 const {PackPick:pack}=runtime('008-pack-pick','core.js');assert.equal(Object.keys(pack.TEMPLATES).length,8);for(const key of Object.keys(pack.TEMPLATES)){const zh=pack.template(key),en=pack.template(key,'en');assert(zh.length>=8&&zh.length<=pack.MAX_ITEMS);assert(zh.every(pack.validItem));assert(en.every(item=>!han.test(item.name)));const mandatory=zh.filter(i=>i.required);assert(mandatory.length>=2);const limits={grams:mandatory.reduce((s,i)=>s+i.grams*i.quantity,0),ml:mandatory.reduce((s,i)=>s+i.ml*i.quantity,0)};const result=pack.suggest(zh,limits);assert(result.possible);assert(result.selected.length<zh.length);assert(mandatory.every(i=>result.selected.includes(i.id)));assert(read('public/apps/008-pack-pick/index.html').includes('data-template="'+key+'"'));}
});

test('Eight particle fields have distinct finite forces and stable center behavior',()=>{
 const {OrbitFields:f}=runtime('001-orbit-garden','core.js');assert.equal(f.FIELDS.length,8);const signatures=new Set();
 for(const[id]of f.FIELDS){const values=[];for(const point of [{x:50,y:70},{x:230,y:220},{x:400,y:300},{x:399.999,y:300.001}]){const force=f.force(id,point,{x:400,y:300},800,600,2);assert(Number.isFinite(force.x)&&Number.isFinite(force.y));assert(Math.hypot(force.x,force.y)<=1.1);values.push(force.x.toFixed(5),force.y.toFixed(5));}signatures.add(values.join(','));}
 assert.equal(signatures.size,8);assert(f.force('attract',{x:300,y:300},{x:400,y:300},800,600).x>0);assert(f.force('repel',{x:300,y:300},{x:400,y:300},800,600).x<0);assert(f.force('ring',{x:390,y:300},{x:400,y:300},800,600).x<0);assert(f.force('ring',{x:50,y:300},{x:400,y:300},800,600).x>0);
 assert.throws(()=>f.force('invalid',{x:0,y:0},{x:0,y:0},800,600),{name:'RangeError'});
});

test('Eight probability experiments include both boundaries and comparisons use proportions',()=>{
 const {RainExperiments:e}=runtime('003-probability-rain','math.js','experiments.js');assert.equal(e.EXPERIMENTS.length,8);assert.equal(new Set(e.EXPERIMENTS.map(p=>p[3]+'/'+p[4])).size,8);
 for(const[,name,en,n,p,goal,english]of e.EXPERIMENTS){assert(name&&goal&&en&&english&&!han.test(en+english));assert(n>=4&&n<=12&&p>=0&&p<=1);const counts=Array(n+1).fill(0);counts[Math.round(n*p)]=100;const snap=e.snapshot(n,p,counts);assert.equal(snap.total,100);assert(snap.distance>=0&&snap.distance<=1);assert.equal(snap.theoreticalMean,n*p);assert.equal(snap.mean,Math.round(n*p));}
 const counts=[25,50,25];assert.equal(e.snapshot(2,.5,counts).distance,0);assert.equal(e.snapshot(2,.5,counts.map(n=>n*10)).distance,0);assert.equal(e.snapshot(2,0,[10,0,0]).standardDeviation,0);assert.equal(e.snapshot(2,1,[0,0,10]).distance,0);assert.throws(()=>e.snapshot(2,.5,[0,0,0]),{name:'RangeError'});assert.throws(()=>e.snapshot(2,.5,[1,2]),{name:'RangeError'});
});

test('Seven new logic tasks have distinct predicates and exactly one inventory-valid solution',()=>{
 const {LogicPatch:l}=runtime('005-logic-patch','core.js');assert.equal(l.PUZZLES.length,16);
 const predicates=[b=>(b[0]!==b[1])&&(b[2]!==b[3]),b=>Boolean(b[0]&&b[1])!==Boolean(b[2]&&b[3]),b=>Boolean(b[0]||b[1])&&Boolean(b[2]||b[3]),b=>Boolean(b[0]&&b[1])&&Boolean(b[2]||b[3]),b=>(b[0]!==b[1])||Boolean(b[2]&&b[3]),b=>(b[0]===b[1])&&Boolean(b[2]||b[3]),b=>Boolean(b[0]&&b[1])===(b[2]!==b[3])];
 const original=new Set(l.PUZZLES.slice(0,9).map(p=>l.truthTable(p.gates).map(r=>r.y).join('')));
 l.PUZZLES.slice(9).forEach((p,i)=>{const signature=l.truthTable(p.gates).map(r=>r.y).join('');assert(!original.has(signature));original.add(signature);assert(l.truthTable(p.gates).every(row=>row.y===Number(predicates[i](row.bits))));assert(!l.assess(p.gates,p).passed);let count=0;for(const a of l.NAMES)for(const b of l.NAMES)for(const c of l.NAMES)if(l.assess([a,b,c],p).passed)count++;assert.equal(count,1,p.id);});
});

test('New mirror paths each have one solution and require 6–10 moves by independent BFS',()=>{
 const {LightPath:l}=runtime('006-light-path','core.js');assert.equal(l.LEVELS.length,16);const minimums=[],geometries=new Set();
 for(const level of l.LEVELS.slice(9)){
  const n=1<<level.mirrors.length,orient=mask=>level.mirrors.map((_,i)=>mask>>i&1?'\\':'/'),initial=level.mirrors.reduce((s,m,i)=>s|(m.initial==='\\'?1<<i:0),0),winning=[];
  for(let mask=0;mask<n;mask++)if(l.trace(level,orient(mask)).won)winning.push(mask);assert.equal(winning.length,1,level.id);
  const masks=level.links.map((links,i)=>[i,...links].reduce((mask,j)=>mask^(1<<j),0)),dist=Array(n).fill(-1),queue=[initial];dist[initial]=0;
  for(let at=0;at<queue.length;at++)for(const mask of masks){const next=queue[at]^mask;if(dist[next]===-1){dist[next]=dist[queue[at]]+1;queue.push(next);}}
  assert.equal(queue.length,n);const minimum=dist[winning[0]];minimums.push(minimum);assert.equal(minimum,level.budget);assert(minimum>=6);assert(!l.judge(level,orient(winning[0]),minimum+1).won);assert(l.judge(level,orient(winning[0]),minimum).won);assert(!l.trace(level,orient(initial)).won);
  geometries.add(JSON.stringify([level.start,level.goal,level.mirrors.map(m=>[m.x,m.y]),level.stars]));
 }assert.deepEqual(minimums,[6,7,8,8,9,9,10]);assert.equal(geometries.size,7);
});
