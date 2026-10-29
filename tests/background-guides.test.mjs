import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const programs=JSON.parse(read('programs.json'));
const pair=value=>Array.isArray(value)&&value.length===2&&value.every(s=>typeof s==='string'&&s.trim())&&!/[\u3400-\u9fff]/.test(value[1]);

test('Every app ships a local contextual guide; shared guides have complete paired content and references',()=>{
 for(const p of programs){const base='public/apps/'+p.id+'-'+p.slug+'/',html=read(base+'index.html');
  if(html.includes('data-background-guide')){assert(html.includes('primer.js'));assert(html.includes('primer.css'));assert(html.includes('https://www.cs.cornell.edu/'));continue;}
  assert(html.includes('src="background.js"'),p.id+' needs a background guide');assert(html.includes('../../shared/background-guide.js'));assert(html.includes('../../shared/background-guide.css'));
  const context=vm.createContext({});vm.runInContext(read(base+'background.js'),context);const data=context.ProgramBackground;assert(pair(data.title));assert(pair(data.lead));assert(data.target);assert(['append','prepend'].includes(data.position));assert(/^#[0-9a-f]{6}$/i.test(data.accent));assert(data.sections.length>=3);
  const sections=new Set(),sources=new Set();for(const section of data.sections){assert(pair(section.title));sections.add(section.title[0]);assert(section.paragraphs.length);for(const paragraph of section.paragraphs)assert(pair(paragraph),p.id+' contains an incomplete translation');for(const source of section.sources||[]){assert(source.label.trim());assert.equal(new URL(source.href).protocol,'https:');sources.add(source.href);}}assert.equal(sections.size,data.sections.length);assert(sources.size>0,p.id+' needs source attribution');
 }
});

test('Probability guide distinguishes sample size, discrete counts, continuous density, and exact model',()=>{
 const context=vm.createContext({});vm.runInContext(read('public/apps/003-probability-rain/background.js'),context);const text=JSON.stringify(context.ProgramBackground);
 for(const phrase of ['binomial','continuous normal','probability density','exact binomial','de Moivre','1733','does not make every distribution normal'])assert(text.includes(phrase),phrase);
});

test('Writing guides identify related practices without assigning the complete app to one inventor',()=>{
 for(const slug of ['002-story-fold','007-erasure-poems']){const context=vm.createContext({});vm.runInContext(read('public/apps/'+slug+'/background.js'),context);const text=JSON.stringify(context.ProgramBackground);if(slug.startsWith('002')){assert(text.includes('not an exact reproduction'));assert(text.includes('not its sole inventor'));assert(text.includes('Ken Macrorie'));}else{assert(text.includes('not proof that he invented all erasure writing'));assert(text.includes('1966'));}}
});
