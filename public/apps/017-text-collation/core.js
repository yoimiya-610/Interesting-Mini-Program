'use strict';
(() => {
 const MAX_READING=400,MAX_IMPORT_BYTES=3000000,copy=x=>JSON.parse(JSON.stringify(x));
 const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
 const CASES=freeze(globalThis.CollationCases),caseFor=id=>CASES.find(c=>c.id===id),pair=(p,lang)=>p[lang==='en'?1:0];
 const validText=(v,n)=>typeof v==='string'&&[...v].length<=n;
 function blank(){return {readings:Array.from({length:6},()=>[null,null,null]),choices:Array(6).fill(0),customs:Array(6).fill(''),reasons:Array(6).fill(''),title:'',notes:''};}
 const fresh=()=>({version:1,selected:CASES[0].id,entries:Object.fromEntries(CASES.map(c=>[c.id,{model:blank(),checkpoint:null,unit:0}])),view:{base:0,mode:'exact'}});
 function reading(source,model,unit,witness,lang){return model.readings[unit][witness]??pair(source.units[unit].readings[witness],lang);}
 function output(source,model,unit,lang){const choice=model.choices[unit];return choice==='custom'?model.customs[unit]:reading(source,model,unit,choice,lang);}
 function ignore(c,mode){return mode!=='exact'&&/\s/u.test(c)||mode==='light'&&/\p{P}/u.test(c);}
 function tokens(text,mode){return [...text].map((c,index)=>({c,index})).filter(t=>!ignore(t.c,mode));}
 function diff(a,b,mode='exact'){
  if(!validText(a,MAX_READING)||!validText(b,MAX_READING)||!['exact','spacing','light'].includes(mode))throw new RangeError('Comparison limit');
  const aa=[...a],bb=[...b],x=tokens(a,mode),y=tokens(b,mode),columns=y.length+1,dp=new Uint16Array((x.length+1)*columns);
  for(let i=x.length-1;i>=0;i--)for(let j=y.length-1;j>=0;j--)dp[i*columns+j]=x[i].c===y[j].c?dp[(i+1)*columns+j+1]+1:Math.max(dp[(i+1)*columns+j],dp[i*columns+j+1]);
  const am=aa.map(c=>ignore(c,mode)?'ignored':'removed'),bm=bb.map(c=>ignore(c,mode)?'ignored':'added');let i=0,j=0,equal=0;
  while(i<x.length&&j<y.length){if(x[i].c===y[j].c){am[x[i++].index]='same';bm[y[j++].index]='same';equal++;}else if(dp[(i+1)*columns+j]>=dp[i*columns+j+1])i++;else j++;}
  const group=(chars,marks)=>chars.reduce((out,c,k)=>{const last=out[out.length-1];if(last?.kind===marks[k])last.text+=c;else out.push({kind:marks[k],text:c});return out;},[]);
  return {a:group(aa,am),b:group(bb,bm),removed:x.length-equal,added:y.length-equal,equal,ignoredA:aa.length-x.length,ignoredB:bb.length-y.length,same:equal===x.length&&equal===y.length};
 }
 function summary(source,model,lang,view){let variants=0,unreasoned=0,empty=0,overrides=0;for(let u=0;u<6;u++){const base=reading(source,model,u,view.base,lang);if([0,1,2].some(w=>!diff(base,reading(source,model,u,w,lang),view.mode).same))variants++;if(!model.reasons[u].trim())unreasoned++;if(!output(source,model,u,lang).trim())empty++;overrides+=model.readings[u].filter(r=>r!==null).length;}return {variants,unreasoned,empty,overrides};}
 function validateModel(m){if(!m||!Array.isArray(m.readings)||m.readings.length!==6||!Array.isArray(m.choices)||m.choices.length!==6||!Array.isArray(m.customs)||m.customs.length!==6||!Array.isArray(m.reasons)||m.reasons.length!==6||!validText(m.title,80)||!validText(m.notes,1000))return null;for(let u=0;u<6;u++){if(!Array.isArray(m.readings[u])||m.readings[u].length!==3||!m.readings[u].every(r=>r===null||validText(r,MAX_READING))||![0,1,2,'custom'].includes(m.choices[u])||!validText(m.customs[u],MAX_READING)||!validText(m.reasons[u],200))return null;}return {readings:m.readings.map(r=>[...r]),choices:[...m.choices],customs:[...m.customs],reasons:[...m.reasons],title:m.title,notes:m.notes};}
 function restore(raw){if(!raw||raw.version!==1||!caseFor(raw.selected)||!raw.entries||Object.keys(raw.entries).length!==CASES.length||!raw.view||![0,1,2].includes(raw.view.base)||!['exact','spacing','light'].includes(raw.view.mode))return null;const entries={};for(const c of CASES){const e=raw.entries[c.id],model=validateModel(e?.model);if(!model||!Number.isInteger(e.unit)||e.unit<0||e.unit>=6)return null;const checkpoint=e.checkpoint===null?null:validateModel(e.checkpoint);if(e.checkpoint!==null&&!checkpoint)return null;entries[c.id]={model,checkpoint,unit:e.unit};}return {version:1,selected:raw.selected,entries,view:{base:raw.view.base,mode:raw.view.mode}};}
 function differences(source,current,saved,lang){return Array.from({length:6},(_,u)=>({unit:u,before:output(source,saved,u,lang),after:output(source,current,u,lang),choiceChanged:saved.choices[u]!==current.choices[u],reasonChanged:saved.reasons[u]!==current.reasons[u],customChanged:saved.customs[u]!==current.customs[u],sourcesChanged:JSON.stringify(saved.readings[u])!==JSON.stringify(current.readings[u])}));}
 const guard=v=>/^[\s]*[=+\-@]/u.test(String(v))?"'"+v:String(v),csvCell=v=>'"'+guard(v).replace(/"/g,'""')+'"';
 function csv(source, model, lang) {
  const headings = lang === 'en'
   ? ['Unit', 'Chosen reading', 'Source', 'Reason', 'Witness A', 'Witness B', 'Witness C']
   : ['位置', '采用读法', '来源', '理由', '传本 A', '传本 B', '传本 C'];
  const rows = [headings];
  for (let unit = 0; unit < 6; unit++) {
   const choice = model.choices[unit];
   const label = choice === 'custom' ? pair(['自订', 'Custom'], lang) : String.fromCharCode(65 + choice);
   const witnesses = [0, 1, 2].map(witness => reading(source, model, unit, witness, lang));
   rows.push([String(unit + 1), output(source, model, unit, lang), label, model.reasons[unit], ...witnesses]);
  }
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
 }
 function text(source,model,lang){const lines=['017 · '+pair(['校勘书房','Text Collation Desk'],lang),pair(source.name,lang),model.title,model.notes,'',pair(['编订读法（保留六处边界）','Edited reading (six locations retained)'],lang)];for(let u=0;u<6;u++)lines.push('['+(u+1)+'] '+output(source,model,u,lang));lines.push('',pair(['校勘记录','Apparatus'],lang));for(let u=0;u<6;u++){const selected=model.choices[u];lines.push('['+(u+1)+'] '+pair(['采用：','Chosen: '],lang)+(selected==='custom'?pair(['自订','Custom'],lang):String.fromCharCode(65+selected)),pair(['理由：','Reason: '],lang)+model.reasons[u]);for(let w=0;w<3;w++)lines.push(String.fromCharCode(65+w)+': '+reading(source,model,u,w,lang));}return lines.join('\n');}
 globalThis.TextCollation=Object.freeze({CASES,caseFor,pair,blank,fresh,copy,reading,output,diff,summary,restore,validateModel,differences,csv,text,MAX_READING,MAX_IMPORT_BYTES});
})();
