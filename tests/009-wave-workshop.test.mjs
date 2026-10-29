import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const c=vm.createContext({});vm.runInContext(readFileSync(new URL('../public/apps/009-wave-workshop/core.js',import.meta.url),'utf8'),c);const W=c.WaveWorkshop;
const close=(a,b,tol=1e-10)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);

test('Eight complete starting experiments have distinct signals and paired exploration material',()=>{
  assert.equal(W.PRESETS.length,8);const names=new Set(),signals=new Set(),expected=[1,8,16,8,5,16,4,16];
  W.PRESETS.forEach((p,i)=>{for(const pair of [p.name,p.lead,p.task]){assert.equal(pair.length,2);assert(pair.every(s=>s.length>3));assert(!/[\u3400-\u9fff]/.test(pair[1]));}names.add(p.id);const config=W.preset(p.id);assert(W.valid(config));assert.equal(config.rows.length,16);assert.equal(W.metrics(config).active,expected[i]);signals.add(Array.from(W.sample(config,64,1)).map(v=>v.toFixed(6)).join(','));});
  assert.equal(names.size,8);assert.equal(signals.size,8);assert.throws(()=>W.preset('unknown'),{name:'RangeError'});
});

test('Sine samples, cutoff, mute, and phase obey independent known values without mutating settings',()=>{
  const c=W.preset('sine');close(W.value(c,0),0);close(W.value(c,.25),1);close(W.metrics(c).rms,Math.SQRT1_2);close(W.metrics(c).peak,1);
  c.rows[0].phase=90;close(W.value(c,0),1);close(W.metrics(c).rms,Math.SQRT1_2);c.frequency=600;close(W.value(c,0),1);
  const s=W.preset('square'),before=JSON.stringify(s);s.cutoff=1;close(W.metrics(s).rms,Math.SQRT1_2);s.cutoff=16;assert.equal(JSON.stringify(s),before);s.rows[0].on=false;close(W.amplitudes(s)[0],0);assert.equal(s.rows[0].amplitude,1);assert.equal(W.metrics(s).highest,3300);
  assert.throws(()=>W.sample(s,3),{name:'RangeError'});
});

test('Analytical RMS and phase-sensitive shape difference match independent quadrature',()=>{
  let seed=938;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};
  for(let trial=0;trial<20;trial++){
    const a=W.preset('saw'),b=W.preset('triangle');for(const wave of [a,b])wave.rows.forEach(r=>{r.amplitude=rand();r.phase=Math.floor(rand()*361)-180;r.on=rand()>.2;});
    let square=0,diff=0;for(let j=0;j<2048;j++){const x=j/2048;const evaluate=config=>config.rows.reduce((sum,r,i)=>sum+(r.on?r.amplitude:0)*Math.sin(2*Math.PI*(i+1)*x+r.phase*Math.PI/180),0),av=evaluate(a),bv=evaluate(b);square+=av*av;diff+=(av-bv)**2;}
    close(W.metrics(a).rms,Math.sqrt(square/2048));close(W.shapeDistance(a,b),Math.sqrt(diff/2048));close(W.shapeDistance(a,a),0);close(W.shapeDistance(a,b),W.shapeDistance(b,a));
  }
  const saw=W.preset('saw'),phase=W.preset('phase');close(W.metrics(saw).rms,W.metrics(phase).rms);assert(W.shapeDistance(saw,phase)>.5);assert(W.metrics(phase).peak>W.metrics(saw).peak);
});

test('Backups preserve every coefficient, title, slot and reference; bad data is rejected as a whole',()=>{
  const current=W.preset('saw');current.label='相位归零 <my> & wave';const raw={version:1,current,slots:[{id:'s-one',config:W.preset('phase')}],reference:'s-one'},out=W.restore(raw);assert(out);assert.equal(JSON.stringify(out),JSON.stringify(raw));out.current.rows[0].amplitude=.1;assert.equal(raw.current.rows[0].amplitude,1);
  for(const mutation of [r=>r.version=2,r=>r.current.rows.pop(),r=>r.current.frequency=601,r=>r.current.frequency=NaN,r=>r.current.rows[0].amplitude=-1,r=>r.current.rows[1].phase=1.5,r=>r.current.showParts='true',r=>r.current.label='a'.repeat(61),r=>r.slots.push(r.slots[0]),r=>r.reference='missing']){const bad=W.copy(raw);mutation(bad);assert.equal(W.restore(bad),null);}
  const eight={...raw,slots:Array.from({length:8},(_,i)=>({id:'s-'+i,config:current})),reference:'s-0'};assert(W.restore(eight));eight.slots.push({id:'s-9',config:current});assert.equal(W.restore(eight),null);
});

test('SVG is self-contained, escaped, and overlays both curves on one scale',()=>{
  const c=W.preset('pulse');c.label='<script>alert(1)</script> & "hello"';const text=W.svg(c,W.preset('sine'),'en');assert(text.includes('&lt;script&gt;'));assert(!text.includes('<script>'));assert(text.includes('stroke-dasharray'));assert(!/https?:\/\//.test(text.replace('http://www.w3.org/2000/svg','')));assert(text.includes('Base cycles'));assert(!text.includes('NaN'));assert(text.includes('8.64'));
});

test('WAV and playback samples are bounded, fade at both ends, and reject aliased configurations',()=>{
  for(const key of ['sine','pulse','missing','phase']){const c=W.preset(key);c.frequency=600;const samples=W.pcm(c);assert.equal(samples.length,48000);assert(samples[0]===0&&samples.at(-1)===0);assert(samples.every(v=>Number.isFinite(v)&&Math.abs(v)<=.180001));const wav=W.wav(c),view=new DataView(wav);assert.equal(wav.byteLength,96044);assert.equal(String.fromCharCode(...new Uint8Array(wav,0,4)),'RIFF');assert.equal(view.getUint32(24,true),24000);assert.equal(view.getUint16(22,true),1);assert.equal(view.getUint16(34,true),16);assert.equal(view.getUint32(40,true),96000);}
  const silent=W.preset('sine');silent.rows.forEach(r=>r.amplitude=0);assert(W.pcm(silent).every(v=>v===0));const high=W.preset('pulse');high.frequency=600;assert.throws(()=>W.pcm(high,8000),{name:'RangeError'});assert.throws(()=>W.pcm(silent,24000,6),{name:'RangeError'});
});
