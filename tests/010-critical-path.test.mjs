import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const ctx=vm.createContext({});vm.runInContext(readFileSync(new URL('../public/apps/010-critical-path/core.js',import.meta.url),'utf8'),ctx);
const C=ctx.CriticalPath,plain=x=>JSON.parse(JSON.stringify(x));
// Independent exhaustive source-to-terminal paths; no topological pass or CPM recurrence.
function oracle(tasks){
 const map=new Map(tasks.map(t=>[t.id,t])),successors=id=>tasks.filter(t=>t.deps.includes(id));
 const paths=[];function walk(path,total){const last=path.at(-1),next=successors(last);if(!next.length){paths.push({path,total});return;}for(const t of next)walk([...path,t.id],total+t.duration);}
 for(const t of tasks.filter(t=>!t.deps.length))walk([t.id],t.duration);
 const finish=Math.max(...paths.map(p=>p.total));const critical=paths.filter(p=>p.total===finish);
 const rows={};for(const t of tasks){const through=paths.filter(p=>p.path.includes(t.id));
  const prefix=p=>p.path.slice(0,p.path.indexOf(t.id)).reduce((s,id)=>s+map.get(id).duration,0);
  const suffix=p=>p.path.slice(p.path.indexOf(t.id)+1).reduce((s,id)=>s+map.get(id).duration,0);
  const es=Math.max(...through.map(prefix)),lf=finish-Math.max(...through.map(suffix));rows[t.id]={es,ef:es+t.duration,lf,ls:lf-t.duration,float:lf-t.duration-es};
 }return {finish,paths:critical.length,rows};
}
function verify(tasks){const a=C.analyze(tasks),o=oracle(tasks);assert(!a.error);assert.equal(a.finish,o.finish);assert.equal(a.paths,o.paths);
 for(const t of tasks){for(const k of ['es','ef','ls','lf','float'])assert.equal(a.rows[t.id][k],o.rows[t.id][k],t.id+' '+k);const r=a.rows[t.id];assert(r.free>=0&&r.free<=r.float);for(const d of t.deps)assert(a.rows[d].lf<=r.ls);}
}
test('Eight complete bilingual networks contain 79 distinct task descriptions and varied branching',()=>{
 assert.equal(C.TEMPLATES.length,8);assert.equal(C.TEMPLATES.reduce((s,t)=>s+t.tasks.length,0),79);const graphShapes=new Set();
 for(const t of C.TEMPLATES){assert(t.tasks.length>=8);assert(t.name.every(Boolean));assert(t.prompt.every(Boolean));assert(!/[\u3400-\u9fff]/.test(t.name[1]+t.prompt[1]));assert.equal(new Set(t.tasks.map(t=>t.name)).size,t.tasks.length);assert(t.tasks.every(t=>t.en&&!/[\u3400-\u9fff]/.test(t.en)));verify(t.tasks);graphShapes.add(JSON.stringify(t.tasks.map(t=>t.deps)));const p=C.template(t.key);p.tasks[0].duration=99;assert.notEqual(C.template(t.key).tasks[0].duration,99);}
 assert.equal(graphShapes.size,8);
});
test('Independent enumeration agrees on 200 deterministic DAGs including shuffled task ordering',()=>{
 let seed=14377;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};
 for(let z=0;z<200;z++){const n=2+Math.floor(rnd()*9),tasks=[];for(let i=0;i<n;i++)tasks.push({id:'T'+(i+1),name:'Task '+i,en:null,duration:1+Math.floor(rnd()*12),deps:tasks.filter(()=>rnd()<.3).map(t=>t.id)});verify(tasks.reverse());}
});
test('Float thresholds, disconnected terminals, tied paths and changing bottlenecks are correct',()=>{
 const tasks=plain(C.template('exhibit').tasks);assert.equal(C.analyze(tasks).finish,15);assert.equal(C.analyze(tasks).rows.T3.float,5);
 for(const [d,expected]of [[4,15],[8,15],[9,16],[10,17]]){tasks.find(t=>t.id==='T3').duration=d;const a=C.analyze(tasks);assert.equal(a.finish,expected);assert.equal(a.paths,d===8?2:1);}
 const tied=[{id:'T1',name:'A',en:null,duration:3,deps:[]},{id:'T2',name:'B',en:null,duration:3,deps:[]}];assert.equal(C.analyze(tied).paths,2);tied[0].duration=2;assert.equal(C.analyze(tied).finish,3);assert.equal(C.analyze(tied).rows.T1.free,1);verify(tied);
 for(const t of C.TEMPLATES)for(const original of t.tasks){const tasks=plain(t.tasks),r=C.analyze(tasks).rows[original.id];if(original.duration+r.float+1>99)continue;tasks.find(t=>t.id===original.id).duration+=r.float;assert.equal(C.analyze(tasks).finish,C.analyze(t.tasks).finish);tasks.find(t=>t.id===original.id).duration++;assert.equal(C.analyze(tasks).finish,C.analyze(t.tasks).finish+1);}
});
test('Malformed graphs and backups are rejected atomically; titles and custom bilingual-looking names survive',()=>{
 const p=plain(C.template('exhibit')),data={version:1,current:p,slots:[{id:'sfirst',project:p}],baseline:'sfirst'};p.title='<My> & 项目';p.tasks[0].name='Choose a theme';p.tasks[0].en=null;
 assert.equal(C.restore(data).current.tasks[0].name,'Choose a theme');assert.equal(C.restore(data).current.tasks[0].en,null);assert.equal(C.restore(data).current.title,p.title);
 for(const mutation of [x=>x.version=2,x=>x.current.tasks[0].duration=1.5,x=>x.current.tasks[0].deps=['T8'],x=>x.current.tasks[0].deps=['T99'],x=>x.current.tasks[0].deps=['T2','T2'],x=>x.current.tasks[0].deps=['T1'],x=>x.current.tasks[0].en=4,x=>x.current.tasks[0].id='__proto__',x=>x.current.tasks=[],x=>x.slots.push(x.slots[0]),x=>x.baseline='missing',x=>x.current.tasks[0].duration=100]){const bad=plain(data);mutation(bad);assert.equal(C.restore(bad),null);}
 const extended=plain(data);extended.current.tasks[0].extra='discard';assert(!('extra'in C.restore(extended).current.tasks[0]));
});
test('CSV exposes real early/late and float data; SVG escapes custom content and renders the calculated schedule',()=>{
 const p=plain(C.template('exhibit'));p.title='<Mine> & "project"';p.tasks[0].name='a,"b"';p.tasks[0].en=null;const svg=C.svg(p);assert(svg.includes('&lt;Mine&gt; &amp; &quot;project&quot;'));assert(!svg.includes('<Mine>'));assert.equal((svg.match(/<rect /g)||[]).length,9);const csv=C.csv(p);assert(csv.includes('"a,""b"""'));assert(csv.includes('"T3","Confirm venue","3","T1","2","5","7","10","5","0","false"'));
});
test('SVG keeps complete built-in and custom labels, wraps titles and preserves whole graphemes',()=>{
 const p=plain(C.template('sensor'));p.title='完整项目标题'.repeat(10)+' <&> 🧭';p.tasks[0].name='项目任务'.repeat(14)+' 👩‍🔬 end';p.tasks[0].en=null;
 const escaped=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 for(const width of [760,1000])for(const lang of ['zh','en']){const svg=C.svg(p,lang,width),visible=svg.replace(/<[^>]*>/g,'');assert(visible.includes(escaped(p.title)));for(const t of p.tasks)assert(visible.includes(escaped(t.id+' '+C.name(t,lang))));assert(svg.includes('👩‍🔬'));assert(!svg.includes('👩</tspan>'));assert.equal((svg.match(/data-role="task-duration"/g)||[]).length,p.tasks.length);assert(svg.includes('text-anchor="end"'));}
 for(const t of C.TEMPLATES){const p=C.template(t.key),visible=C.svg(p).replace(/<[^>]*>/g,'');for(const task of p.tasks)assert(visible.includes(task.id+' '+task.en));}
});
