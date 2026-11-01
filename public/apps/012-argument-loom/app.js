'use strict';
(() => {
  const C=ArgumentLoom,$=id=>document.getElementById(id),KEY='argument-loom-012-v1',history=[];
  const lang=()=>ProgramLanguage.language,b=(zh,en)=>lang()==='en'?en:zh,pair=p=>C.pair(p,lang());
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  let state=C.fresh(),dirty=false,storageOK=true,notice=null,editingEpoch=0,revision=0;
  try{const raw=localStorage.getItem(KEY);if(raw){const restored=C.restore(JSON.parse(raw));if(restored)state=restored;else notice=['本机记录无法读取，原数据未被覆盖。','Local records could not be read and have not been overwritten.'];}}catch{storageOK=false;}
  const doc=()=>state.docs[state.source],name=d=>d.title||pair(C.getCase(d.source).name),roleName=id=>pair(C.getRole(id).name);
  function checkpoint(){history.push(C.copy(state));if(history.length>30)history.shift();}
  function persist(){revision++;try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}renderStorage();controls();}
  function say(zh,en){notice=[zh,en];$('notice').textContent=b(zh,en);}
  function guard(){if(!dirty)return true;say('卡片编辑尚未应用，请先应用或取消。','Unapplied card edit: apply or cancel it first.');return false;}
  function change(fn){checkpoint();fn();editingEpoch++;dirty=false;persist();render(true);}
  function renderStorage(){$('storage').textContent=storageOK?b('草稿与版本保存在本浏览器，不跨设备同步。','Drafts and versions stay in this browser and do not sync across devices.'):b('本机保存不可用；仍可编辑并导出备份。','Local saving is unavailable; editing and backup exports still work.');}
  function controls(){
    $('undo').disabled=dirty||!history.length;$('save').disabled=dirty||state.slots.length>=8;
    for(const id of ['exportTxt','exportJson','importFile','comparison','resetDoc','resetCard'])$(id).disabled=dirty;
    $('draftStatus').textContent=dirty?b('有未应用的文字。切换语言会保留，刷新不会。','Unapplied writing is kept through language changes, but not through reloads.'):b('当前显示已应用的卡片；自己的改写会保留原文。','This is the committed card. Your rewrites keep their original text.');
  }
  function summary(){const a=C.analyze(doc(),lang());$('documentTitle').textContent=name(doc());$('filled').textContent=b('有文字的卡片：','Cards containing writing: ')+a.filled.length+' / 6';$('characters').textContent=b('卡片文字共 ','Card characters: ')+a.characters+(lang()==='en'?'':' 字符');}
  function sourceButtons(){
    $('cases').replaceChildren(...C.CASES.map((c,i)=>{const button=el('button',String(i+1).padStart(2,'0')+' / '+pair(c.name));button.dataset.case=c.id;button.setAttribute('aria-pressed',String(state.source===c.id));button.onclick=()=>selectSource(c.id);return button;}));$('own').setAttribute('aria-pressed',String(state.source==='own'));
  }
  function selectSource(id){if(!guard())return;if(!state.docs[id])state.docs[id]=C.newDoc(id);state.source=id;editingEpoch++;persist();render(true);const button=id==='own'?$('own'):document.querySelector('[data-case="'+id+'"]');button?.focus({preventScroll:true});}
  function selectRole(id){if(!C.getRole(id))return;if(id===state.role&&dirty){$('editText').focus();return;}if(!guard()){$('roleSelect').value=state.role;return;}state.role=id;persist();renderCards();renderEditor(true);$('editText').focus({preventScroll:true});}
  function renderCards(){
    const colors=['#a65a42','#517984','#b17e31','#738265','#8b6b8b','#846c57'];
    $('cards').replaceChildren(...C.ROLES.map((r,i)=>{const card=el('article',undefined,'argument-card'+(r.id===state.role?' active':''));card.dataset.card=r.id;card.style.setProperty('--card-color',colors[i]);
      const head=el('div',undefined,'card-head'),heading=el('h3',pair(r.name));heading.id='card-heading-'+r.id;head.append(heading,el('span',doc().cards[r.id].custom?b('自己的原文','Your original text'):b('双语底稿','Bilingual sample'),'badge'));
      const text=el('p',C.display(doc(),r.id,lang())||b('（留白）','(Blank)'),'card-text');text.tabIndex=0;text.setAttribute('role','region');text.setAttribute('aria-labelledby',heading.id);
      const button=el('button',b('编辑：','Edit: ')+pair(r.name));button.dataset.edit=r.id;button.onclick=()=>selectRole(r.id);card.append(head,text,el('p',pair(r.hint),'hint'),button);return card;
    }));
  }
  function renderEditor(reset){
    $('roleSelect').replaceChildren(...C.ROLES.map(r=>{const o=el('option',pair(r.name));o.value=r.id;return o;}));$('roleSelect').value=state.role;$('roleHint').textContent=pair(C.getRole(state.role).hint);
    if(reset||!dirty){const value=C.display(doc(),state.role,lang());if($('editText').value!==value)$('editText').value=value;dirty=false;}controls();
  }
  function renderProbe(){
    const c=C.getCase(state.source),index=doc().probe;
    $('probeSelect').replaceChildren(...c.probes.map((p,i)=>{const o=el('option',String(i+1)+' / '+pair(p.text));o.value=String(i);return o;}));$('probeSelect').value=String(index);
    $('probeQuestion').textContent=pair(c.probes[index].text);$('probeRoles').replaceChildren(...c.probes[index].roles.map(id=>{const button=el('button',b('重读：','Revisit: ')+roleName(id));button.dataset.probeRole=id;button.onclick=()=>selectRole(id);return button;}));
    if($('answer').value!==doc().answers[index])$('answer').value=doc().answers[index];$('alternative').textContent=pair(c.alternative);
  }
  function renderSlots(){
    $('slots').replaceChildren(...state.slots.map((slot,i)=>{const card=el('article',undefined,'slot');card.append(el('strong',slot.doc.title||b('版本 ','Version ')+(i+1)+' · '+pair(C.getCase(slot.doc.source).name)),el('p',b('有文字的卡片 ','Cards with writing ')+C.analyze(slot.doc,lang()).filled.length+' / 6'));
      const actions=el('div',undefined,'actions'),load=el('button',b('载入','Load')),remove=el('button',b('移除','Remove'));load.dataset.load=slot.id;remove.dataset.remove=slot.id;
      load.onclick=()=>{if(!guard())return;change(()=>{state.source=slot.doc.source;state.docs[state.source]=C.copy(slot.doc);});say('已载入版本，可撤销整体替换。','Version loaded; undo can reverse the replacement.');$('documentTitle').focus({preventScroll:true});};
      remove.onclick=()=>{if(!guard())return;change(()=>{state.slots=state.slots.filter(s=>s.id!==slot.id);if(state.comparison===slot.id)state.comparison=null;});say('版本已移除，可撤销。','Version removed; you can undo.');};actions.append(load,remove);card.append(actions);return card;}));$('slotCount').textContent=state.slots.length+' / 8';
  }
  function renderComparison(){
    const opened=new Set([...$('comparisons').querySelectorAll('details[open]')].map(n=>n.dataset.compare));
    $('comparison').replaceChildren();const none=el('option',b('暂不对照','No comparison'));none.value='';$('comparison').append(none);
    state.slots.forEach((s,i)=>{const o=el('option',s.doc.title||b('版本 ','Version ')+(i+1)+' · '+pair(C.getCase(s.doc.source).name));o.value=s.id;$('comparison').append(o);});$('comparison').value=state.comparison||'';
    const reference=state.slots.find(s=>s.id===state.comparison);$('comparisons').replaceChildren();if(!reference){$('comparisonSummary').textContent=b('保存一份版本，再选择它与当前卡片对照。','Save a version, then select it to compare with the current cards.');return;}
    const rows=C.compare(doc(),reference.doc,lang());$('comparisonSummary').textContent=b('文字有变化的卡片：','Cards with different wording: ')+rows.filter(r=>!r.same).length+' / 6';
    for(const row of rows){const detail=el('details');detail.dataset.compare=row.role;detail.open=opened.has(row.role);detail.append(el('summary',roleName(row.role)+' · '+(row.same?b('文字相同','Same wording'):b('文字不同','Different wording'))));const pairBox=el('div',undefined,'comparison-pair');
      for(const [title,text]of [[b('当前已应用','Current, committed'),row.left],[b('保存版本','Saved version'),row.right]]){const col=el('div');col.append(el('h4',title));const p=el('p',text||b('（留白）','(Blank)'));p.tabIndex=0;col.append(p);pairBox.append(col);}detail.append(pairBox);$('comparisons').append(detail);
    }
  }
  function render(resetEditor=true){
    sourceButtons();summary();$('context').textContent=pair(C.getCase(state.source).context);renderCards();renderEditor(resetEditor);renderProbe();renderSlots();renderComparison();
    if($('title').value!==doc().title)$('title').value=doc().title;if($('notes').value!==doc().notes)$('notes').value=doc().notes;renderStorage();controls();$('notice').textContent=notice?b(...notice):'';
  }
  $('own').onclick=()=>selectSource('own');$('roleSelect').onchange=()=>selectRole($('roleSelect').value);$('editText').oninput=()=>{dirty=true;controls();};
  $('editorForm').onsubmit=event=>{event.preventDefault();const next=C.edited(doc(),state.role,$('editText').value);if(!next){say('卡片文字超过 800 字符，未应用。','Card text exceeds 800 characters; not applied.');return;}change(()=>{state.docs[state.source]=next;});say('改写已应用；切换语言会保留原文。','Rewrite applied; language changes keep your original words.');};
  $('cancel').onclick=()=>{dirty=false;renderEditor(true);say('未应用的编辑已取消。','Unapplied card editing canceled.');};
  $('resetCard').onclick=()=>{if(!guard())return;change(()=>{doc().cards[state.role]={text:C.copy(C.getCase(state.source).cards[state.role]),custom:state.source==='own'};});say('已恢复单张底稿，可撤销。','Card sample restored; you can undo.');};
  $('resetDoc').onclick=()=>{if(!guard())return;change(()=>{state.docs[state.source]=C.newDoc(state.source);});say('这份底稿已重置；其他草稿和版本保留，可撤销。','This draft was reset; others and saved versions were kept. You can undo.');};
  $('undo').onclick=()=>{if(!guard()||!history.length)return;state=history.pop();editingEpoch++;persist();render(true);say('已撤销最近一次修改。','Most recent change undone.');};
  $('probeSelect').onchange=()=>{doc().probe=Number($('probeSelect').value);editingEpoch++;persist();renderProbe();};
  for(const [id,set]of [['title',value=>doc().title=value],['notes',value=>doc().notes=value],['answer',value=>doc().answers[doc().probe]=value]]){
    const input=$(id);let group=null;input.onfocus=()=>{group=null;};input.onblur=()=>{group=null;};input.oninput=()=>{if(group!==editingEpoch){checkpoint();group=editingEpoch;}set(input.value);persist();summary();};
  }
  $('save').onclick=()=>{if(!guard()||state.slots.length>=8)return;change(()=>{let id;do{id='s'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);}while(state.slots.some(s=>s.id===id));state.slots.push({id,doc:C.copy(doc())});});say('已保存独立版本。','Independent version saved.');};
  $('comparison').onchange=()=>{if(!guard()){$('comparison').value=state.comparison||'';return;}state.comparison=$('comparison').value||null;persist();renderComparison();};
  function download(file,text,type){if(!guard())return;const url=URL.createObjectURL(new Blob([text],{type})),link=el('a');link.href=url;link.download=file;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);say('文件已准备下载。','File prepared for download.');}
  $('exportTxt').onclick=()=>download('012-argument-loom.txt',C.txt(doc(),lang()),'text/plain;charset=utf-8');$('exportJson').onclick=()=>download('012-argument-loom.json',JSON.stringify(state),'application/json');
  $('importFile').onchange=async()=>{const file=$('importFile').files[0];$('importFile').value='';if(!file||!guard())return;const expected=revision;try{if(file.size>1000000)throw new Error();const raw=await file.text();if(revision!==expected||dirty){say('读取文件期间内容已改变，未导入。请保留当前编辑后再试。','Work changed while reading the file; not imported. Keep the current edits and try again.');return;}const data=C.restore(JSON.parse(raw));if(!data)throw new Error();change(()=>{state=data;});say('完整备份已导入，可撤销整体替换。','Full backup imported; undo can reverse replacement.');}catch{say('未导入：无效备份或超过 1 MB，原文字与版本保留。','Not imported: invalid backup or over 1 MB. Existing writing and versions were kept.');}};
  window.addEventListener('programlanguagechange',()=>render(false));render();
})();
