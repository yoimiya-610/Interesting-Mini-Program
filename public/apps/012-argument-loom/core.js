'use strict';
(() => {
  const MAX_CARD=800,MAX_NOTES=1500,MAX_ANSWER=600,MAX_SLOTS=8;
  const copy=x=>JSON.parse(JSON.stringify(x)),size=s=>[...s].length;
  const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
  const ROLES=freeze([
    {id:'claim',name:['主张','Claim'],hint:['希望读者接受什么？写清对象与建议。','What should a reader accept? Name the subject and proposal.']},
    {id:'grounds',name:['依据','Grounds'],hint:['你凭哪些观察或资料提出主张？区分记录与推测。','Which observations or sources support the claim? Separate records from guesses.']},
    {id:'warrant',name:['推理桥梁','Warrant'],hint:['为什么这些依据能走向这个主张？把隐藏的假设写出来。','Why do these grounds lead to this claim? Make the connecting assumption explicit.']},
    {id:'backing',name:['桥梁支撑','Backing'],hint:['凭什么接受这条桥梁？补充原则、背景或可核查来源。','Why accept the bridge? Add a principle, context, or a checkable source.']},
    {id:'qualifier',name:['限定范围','Qualifier'],hint:['主张有多强，适用于谁、何时、哪些条件？','How strong is the claim, and to whom, when, and under which conditions does it apply?']},
    {id:'rebuttal',name:['例外与回应','Rebuttal / reservations'],hint:['什么情形会削弱主张？认真保留例外与其他合理看法。','What could defeat the claim? Consider exceptions and other reasonable views.']}
  ]);
  const CASES=freeze(ArgumentContent.map(([id,name,context,fields,alternative,probes])=>({id,name,context,alternative,cards:Object.fromEntries(ROLES.map((r,i)=>[r.id,fields[i]])),probes:probes.map(([text,roles])=>({text,roles}))})));
  const OWN=freeze({id:'own',name:['自己的论证','Your own argument'],context:['选一个可讨论的问题，从任何一张卡开始。自己的文字不会被自动翻译。','Choose a discussable question and start with any card. Your own writing is never automatically translated.'],alternative:['尝试认真写出一种与你不同、但可以被理解的看法。','Try writing a different view that you can represent fairly.'],cards:Object.fromEntries(ROLES.map(r=>[r.id,['','']])),probes:[
    {text:['若最重要的依据不成立，你会修改哪张卡？','If the most important evidence fails, which card would you revise?'],roles:['grounds','claim']},
    {text:['这条桥梁依赖什么尚未说明的假设？','What unstated assumption does the bridge need?'],roles:['warrant','backing']},
    {text:['换一个群体或时间范围，主张还成立吗？','Would the claim hold for another group or time period?'],roles:['qualifier','claim']},
    {text:['什么结果会让你改变看法，而不仅是增加文字？','What finding would change your view, rather than merely add words?'],roles:['rebuttal','grounds']}
  ]});
  const getCase=id=>id==='own'?OWN:CASES.find(c=>c.id===id),getRole=id=>ROLES.find(r=>r.id===id),pair=(p,lang)=>p[lang==='en'?1:0];
  function newDoc(source){const c=getCase(source);if(!c)return null;return {source,title:'',cards:Object.fromEntries(ROLES.map(r=>[r.id,{text:copy(c.cards[r.id]),custom:source==='own'}])),notes:'',probe:0,answers:['','','','']};}
  function fresh(){return {version:1,source:CASES[0].id,role:'claim',docs:{[CASES[0].id]:newDoc(CASES[0].id)},slots:[],comparison:null};}
  function display(doc,role,lang='zh'){return pair(doc.cards[role].text,lang);}
  function edited(doc,role,value){if(!getRole(role)||typeof value!=='string'||size(value)>MAX_CARD)return null;const next=copy(doc);next.cards[role]={text:[value,value],custom:true};return next;}
  function analyze(doc,lang='zh'){const filled=ROLES.filter(r=>display(doc,r.id,lang).trim()).map(r=>r.id);return {filled,empty:ROLES.filter(r=>!filled.includes(r.id)).map(r=>r.id),characters:ROLES.reduce((n,r)=>n+size(display(doc,r.id,lang)),0)};}
  function compare(doc,reference,lang='zh'){return ROLES.map(r=>({role:r.id,left:display(doc,r.id,lang),right:display(reference,r.id,lang),same:display(doc,r.id,lang)===display(reference,r.id,lang)}));}
  const text=(s,max)=>typeof s==='string'&&size(s)<=max;
  function validDoc(d){
    return !!d&&!!getCase(d.source)&&text(d.title,80)&&text(d.notes,MAX_NOTES)&&Number.isInteger(d.probe)&&d.probe>=0&&d.probe<4&&Array.isArray(d.answers)&&d.answers.length===4&&d.answers.every(a=>text(a,MAX_ANSWER))&&d.cards&&typeof d.cards==='object'&&!Array.isArray(d.cards)&&Object.keys(d.cards).length===6&&ROLES.every(r=>{const c=d.cards[r.id];return c&&typeof c.custom==='boolean'&&Array.isArray(c.text)&&c.text.length===2&&c.text.every(t=>text(t,MAX_CARD))&&(!c.custom||c.text[0]===c.text[1]);});
  }
  function cleanDoc(d){return {source:d.source,title:d.title,cards:Object.fromEntries(ROLES.map(r=>[r.id,{text:[...d.cards[r.id].text],custom:d.cards[r.id].custom}])),notes:d.notes,probe:d.probe,answers:[...d.answers]};}
  function restore(data){
    if(!data||data.version!==1||!getCase(data.source)||!getRole(data.role)||!data.docs||typeof data.docs!=='object'||Array.isArray(data.docs)||Object.keys(data.docs).length>9||!Array.isArray(data.slots)||data.slots.length>MAX_SLOTS)return null;
    const docs={};for(const [id,d]of Object.entries(data.docs)){if(!getCase(id)||d?.source!==id||!validDoc(d))return null;docs[id]=cleanDoc(d);}if(!docs[data.source])return null;
    const ids=new Set(),slots=[];for(const s of data.slots){if(!s||typeof s.id!=='string'||!/^s[\w-]{1,64}$/.test(s.id)||ids.has(s.id)||!validDoc(s.doc))return null;ids.add(s.id);slots.push({id:s.id,doc:cleanDoc(s.doc)});}
    if(data.comparison!==null&&!ids.has(data.comparison))return null;return {version:1,source:data.source,role:data.role,docs,slots,comparison:data.comparison};
  }
  function txt(doc,lang='zh'){
    const c=getCase(doc.source),en=lang==='en';return ['012 · '+(en?'Argument Loom':'论证织台'),doc.title||pair(c.name,lang),en?'Practice scenarios are fictional. Real arguments need verified sources.':'练习情境为虚构材料；真实论证需要核查来源。','',...ROLES.flatMap(r=>[pair(r.name,lang),display(doc,r.id,lang),'']),en?'Pressure questions and your responses':'追问与自己的回应',...c.probes.flatMap((p,i)=>[String(i+1)+'. '+pair(p.text,lang),doc.answers[i],'']),en?'Your notes':'自己的笔记',doc.notes].join('\n');
  }
  globalThis.ArgumentLoom=Object.freeze({MAX_CARD,MAX_NOTES,MAX_ANSWER,MAX_SLOTS,ROLES,CASES,copy,pair,getCase,getRole,newDoc,fresh,display,edited,analyze,compare,validDoc,restore,txt});
})();
