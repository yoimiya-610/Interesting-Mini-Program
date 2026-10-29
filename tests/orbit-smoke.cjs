const fs=require('fs'),vm=require('vm'),assert=require('assert');
const elements=new Map(),store=new Map();
const context=new Proxy({}, {get:()=>()=>{}});
function el(id){if(!elements.has(id))elements.set(id,{id,textContent:'',hidden:false,dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},focus(){},click(){this.onclick?.()},append(){},getContext(){return context},getBoundingClientRect(){return{width:800,height:600,left:0,top:0}},setPointerCapture(){},toBlob(fn){fn({})}});return elements.get(id)}
const buttons=[0,1,2].map(i=>{const b=el('palette'+i);b.dataset.palette=String(i);return b});
const sandbox={console,assert,document:{getElementById:el,querySelectorAll:()=>buttons,addEventListener(){},createElement:()=>el('export')},window:{addEventListener(){}},devicePixelRatio:1,matchMedia:()=>({matches:false}),localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},ResizeObserver:class{constructor(cb){this.cb=cb}observe(){this.cb()}},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},URL:{createObjectURL:()=>'',revokeObjectURL(){}}};
// This physics smoke test uses Chinese presentation; browser tests exercise the real language runtime.
sandbox.ProgramLanguage={t:value=>value};
const html=fs.readFileSync('public/apps/001-orbit-garden/index.html','utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
vm.runInNewContext(fs.readFileSync('public/apps/001-orbit-garden/core.js','utf8')+'\n'+script+`
assert.equal(particles.length,360);
setMode('challenge');start();assert(running);assert.equal(remaining,45);
for(let i=0;i<6;i++)capture({x:target.x,y:target.y,cool:0});
assert.equal(score,1);assert.equal($('count').textContent,1);
tick(1000);const before=remaining;setPaused(true);tick(6000);assert.equal(remaining,before);
setPaused(false);tick(7000);assert(remaining<before);
for(let n=8000;n<55000;n+=1000)tick(n);
assert(!running);assert.equal(remaining,0);assert.equal(best,score);assert.equal(localStorage.getItem('orbit-garden-best'),String(score));
start();assert.equal(score,0);assert.equal(remaining,45);assert(running);
for(let i=0;i<500;i++){pointer.down=true;pointer.x=target.x;pointer.y=target.y;paint(.016)}
assert(particles.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
setMode('free');assert(!running);assert.equal(target,null);assert.equal($('count').textContent,360);
document.querySelectorAll()[1].onclick();assert.equal(palette,1);
$('save').onclick();console.log('PASS: scoring, 45-second timer, pause, records, restart, attraction stability, modes, palette, PNG export');
`,sandbox);
