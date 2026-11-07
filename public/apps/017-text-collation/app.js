'use strict';
(() => {
 const C=TextCollation,$=id=>document.getElementById(id),KEY='imp-017-text-collation-v1',lang=()=>ProgramLanguage.language,P=p=>C.pair(p,lang());
 const labels={hero:['不同的字，留下不同的线索。','Different words leave different clues.'],intro:['八组原创短文，每组三份传本、六处取舍。比较细节，再编订自己的读法；不是让机器替你找一个“正确原文”。','Eight original cases, each with three witnesses and six editorial choices. Compare the details, then make your own reading. The machine does not determine a “correct original”.'],start:['开始比对 ↓','Start comparing ↓'],readEdition:['阅读编订稿 ↓','Read your edition ↓'],background:['先认识校勘 ↓','Learn about collation ↓'],chooseCase:['选择案例（每案独立保存）','Choose a case (saved separately)'],base:['高亮基准','Highlight baseline'],mode:['比较方式','Comparison mode'],exact:['逐字精确比较','Exact characters'],spacing:['忽略空白','Ignore spacing'],light:['忽略空白与标点','Ignore spacing and punctuation'],normalization:['比较方式只改变高亮与差异统计，不改写来源、编订稿或导出原文。修改基准也不改变你的选择。','Comparison mode changes highlights and counts only, never source text, your edition or exports. Changing the baseline does not change your choices.'],locations:['六处位置','Six locations'],previous:['← 上一处','← Previous'],next:['下一处 →','Next →'],editing:['以下三份文字可直接改写，每处限 400 字符。改写会作为自己的文字逐字保留；切换语言只切换未改写的内置读法。空读法可以表示省略，请在理由里说明。','Edit the three readings directly, up to 400 characters each. Edits remain your literal words; language changes affect only untouched built-ins. An empty reading may represent omission; explain it in your reason.'],legendRemove:['删除线：相对基准移出 −','Strike-through: removed from baseline −'],legendAdd:['实下划线：相对基准新增 +','Solid underline: added relative to baseline +'],legendIgnore:['点下划线：本次忽略的字符','Dotted underline: ignored in this comparison'],diffLimits:['新增、移出都是相对关系，不是对抄写历史的判断。重复文字可能有多种对齐方式；本台逐字符选择一种，不识别词义或移文，也不评分哪一稿更好。','Additions and removals are relative, not claims about copying history. Repeated text can have multiple alignments. This character comparator chooses one; it does not detect meaning/transposition or rank literary quality.'],customHeading:['编订本处','Edit this location'],customLabel:['自己的读法（400 字符；单独保留，采用后才进入编订稿）','Your reading (400 characters; kept separately and used only when selected)'],chooseCustom:['采用自己的读法','Choose your reading'],reason:['本处取舍理由（200 字符）','Reason for this choice (200 characters)'],undo:['↶ 撤销','↶ Undo'],redo:['↷ 重做','↷ Redo'],restoreSources:['还原本案三份内置来源','Restore this case’s built-in sources'],edition:['01 / 六处合读','01 / Read the six locations together'],back:['回到比对 ↑','Back to comparison ↑'],editionHint:['保留六处边界，避免把拼接稿冒充某一真实传本。检查代词、时间与语气是否相容；没有理由不等于选择错误，空白也不自动补齐。','Locations remain separate so a composite cannot masquerade as one witness. Check pronouns, timing and tone together. Missing reasons do not imply wrong choices; blanks are not filled automatically.'],apparatus:['编订与来源记录','Decisions and sources'],notebook:['02 / 本案笔记与对照','02 / Notes and comparison'],title:['自己的标题（80 字符）','Your title (80 characters)'],notes:['本案总笔记（1000 字符）','Case notes (1000 characters)'],saveCheckpoint:['保存／覆盖本案对照快照','Save / replace case checkpoint'],loadCheckpoint:['取回本案对照快照','Retrieve case checkpoint'],checkpointLimits:['每案一份完整快照，包含三份改写来源、六处选择、自订读法、理由、标题和笔记。覆盖与取回都可撤销；刷新后仍保存快照。比较显示采用读法及来源、理由的变化，不自动合并。','One full checkpoint per case holds edited sources, choices, custom readings, reasons, title and notes. Replacement and retrieval are undoable; checkpoints survive reload. Comparison shows changes in readings, sources and reasons, without automatic merging.'],takeaway:['03 / 带走编订记录','03 / Take your edition with you'],exportText:['↓ 本案 TXT','↓ Case TXT'],exportCsv:['↓ 本案 CSV 校勘表','↓ Case CSV apparatus'],exportJson:['↓ 全部八案 JSON','↓ All eight cases as JSON'],importFile:['导入完整 JSON 备份','Import full JSON backup'],exportLimits:['TXT 与 CSV 采用当前语言的内置文本，保留自改原文；两者不是恢复备份。CSV 对可能被表格当作公式的文本加保护性单引号。JSON 保存全部八案与快照、选择及查看位置，保留原文，导入上限 3 MB。无效文件或读取期间有修改时不覆盖，成功导入可撤销。','TXT and CSV use current-language built-ins while preserving literal edits; neither is a restorable backup. CSV prefixes formula-like text with a protective apostrophe. JSON preserves all eight cases, checkpoints, choices and view positions; import limit 3 MB. Invalid files or changes during reading prevent replacement. A successful import is undoable.'],saveLimits:['内容自动保存在本浏览器，不跨设备同步；清除浏览器数据会丢失记录，请导出备份。当前打开最多撤销三十次内容操作，输入按一次焦点编辑分组；撤销可能回到对应案例。刷新清空撤销历史，保留八案与快照。','Content saves in this browser without device sync. Clearing browser data removes it; export backups. This visit supports thirty content undo operations, grouping input within one focus session; undo may return to the relevant case. Reload clears undo history but keeps cases and checkpoints.']};
 let state=C.fresh(),revision=0,history=[],future=[],activeInput=null,storageOK=true,notice=null;
 try{const raw=localStorage.getItem(KEY);if(raw){const loaded=C.restore(JSON.parse(raw));if(loaded)state=loaded;else notice=['已有保存数据无法读取，尚未覆盖；可导入有效备份。','The previous saved data could not be read and has not been overwritten. Import a valid backup.'];}}catch{storageOK=false;}
 const source=()=>C.caseFor(state.selected),entry=()=>state.entries[state.selected],model=()=>entry().model,unit=()=>entry().unit;
 const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}}
 function remember(){history.push(C.copy(state));if(history.length>30)history.shift();future=[];}
 function changed(){revision++;save();}
 function transaction(fn){remember();fn();activeInput=null;notice=null;changed();render();}
 function navigate(fn){fn();activeInput=null;revision++;save();render();}
 function renderParts(el,parts){el.replaceChildren(...parts.map(part=>node('span',part.text,part.kind)));}
 function opened(root){const set=new Set(root._case===state.selected?[...root.querySelectorAll('details[open]')].map(d=>d.dataset.location):[]);root._case=state.selected;return set;}
 for(let w=0;w<3;w++){
  const card=node('section',undefined,'witness');card.id='witness-'+w;card.setAttribute('aria-labelledby','witness-title-'+w);
  card.innerHTML='<h3 id="witness-title-'+w+'"></h3><p class="profile" id="profile-'+w+'"></p><label id="reading-label-'+w+'" for="reading-'+w+'"></label><textarea id="reading-'+w+'" rows="5" maxlength="800"></textarea><p class="hint" id="reading-kind-'+w+'"></p><p class="diff-label" id="diff-label-a-'+w+'"></p><div id="diff-a-'+w+'" class="diff"></div><p class="diff-label" id="diff-label-b-'+w+'"></p><div id="diff-b-'+w+'" class="diff"></div><button id="adopt-'+w+'"></button><button id="restore-'+w+'"></button>';
  $('witnesses').append(card);$('adopt-'+w).onclick=()=>{if(model().choices[unit()]===w)return;transaction(()=>model().choices[unit()]=w);};$('restore-'+w).onclick=()=>transaction(()=>model().readings[unit()][w]=null);
 }
 for(let i=0;i<6;i++){const button=node('button',String(i+1).padStart(2,'0'));button.type='button';button.dataset.unit=i;button.onclick=()=>navigate(()=>entry().unit=i);$('locations').append(button);}
 function fillFields(){const c=source(),m=model(),u=unit();for(let w=0;w<3;w++)$('reading-'+w).value=C.reading(c,m,u,w,lang());$('custom').value=m.customs[u];$('reason').value=m.reasons[u];$('title').value=m.title;$('notes').value=m.notes;}
 function render(){
  for(const el of document.querySelectorAll('[data-text]'))el.textContent=P(labels[el.dataset.text]);const c=source(),u=unit();$('caseName').textContent=P(c.name);$('caseFocus').textContent=P(c.focus);$('caseContext').textContent=P(c.context);
  $('case').replaceChildren(...C.CASES.map(c=>{const option=node('option',P(c.name));option.value=c.id;option.selected=c.id===state.selected;return option;}));$('base').value=String(state.view.base);$('mode').value=state.view.mode;
  $('locations').setAttribute('aria-label',P(['选择比对位置','Select comparison location']));for(const button of $('locations').children){const i=Number(button.dataset.unit);button.setAttribute('aria-pressed',String(i===u));button.setAttribute('aria-label',P(['位置','Location'])+' '+(i+1));}
  $('unitTitle').textContent=P(['位置','Location'])+' '+(u+1)+' / 6';$('question').textContent=P(c.units[u].question);$('previous').disabled=u===0;$('next').disabled=u===5;
  for(let w=0;w<3;w++){const letter=String.fromCharCode(65+w);$('witness-title-'+w).textContent=P(['传本 ','Witness '])+letter;$('profile-'+w).textContent=P(c.profiles[w]);$('reading-label-'+w).textContent=P(['本处文字（400 字符）','Reading at this location (400 characters)']);$('adopt-'+w).textContent=P(['采用 ','Choose '])+letter+P([' 本处读法',' at this location']);$('restore-'+w).textContent=P(['还原本处内置读法','Restore built-in reading here']);}
  fillFields();renderComputed();
 }
 function renderComputed(){
  const c=source(),m=model(),u=unit(),base=C.reading(c,m,u,state.view.base,lang()),s=C.summary(c,m,lang(),state.view);
  $('stats').replaceChildren(...[[P(['异文位置','Variant locations']),s.variants+' / 6'],[P(['未写理由','Without reasons']),s.unreasoned+' / 6'],[P(['空读法','Empty chosen readings']),s.empty],[P(['自改来源','Edited source readings']),s.overrides]].map(([label,value])=>node('span',label+': '+value)));
  for(let w=0;w<3;w++){const r=C.diff(base,C.reading(c,m,u,w,lang()),state.view.mode),isBase=w===state.view.base,letter=String.fromCharCode(65+w);$('witness-'+w).classList.toggle('chosen',m.choices[u]===w);$('adopt-'+w).setAttribute('aria-pressed',String(m.choices[u]===w));$('restore-'+w).disabled=m.readings[u][w]===null;$('reading-kind-'+w).textContent=P(m.readings[u][w]===null?['内置双语读法','Built-in bilingual reading']:['自己的改写，切换语言不改写','Your literal edit; language changes preserve it']);$('diff-label-a-'+w).hidden=isBase;$('diff-a-'+w).hidden=isBase;$('diff-label-a-'+w).textContent=P(['基准本处：移出 −','Baseline here: removed −'])+r.removed;renderParts($('diff-a-'+w),r.a);$('diff-label-b-'+w).textContent=isBase?P(['基准原文（并非优先采用）','Baseline text (not a preferred reading)']):P(['传本 ','Witness '])+letter+P(['：新增 +',': added +'])+r.added;renderParts($('diff-b-'+w),r.b);}
  const chosen=m.choices[u]==='custom'?P(['自己的读法','Your reading']):P(['传本 ','Witness '])+String.fromCharCode(65+m.choices[u]);$('choiceStatus').textContent=P(['本处采用：','Chosen here: '])+chosen+(m.reasons[u].trim()?'':P(['；尚未填写理由。','; no reason entered yet.']));$('chooseCustom').setAttribute('aria-pressed',String(m.choices[u]==='custom'));
  $('editionText').replaceChildren(...Array.from({length:6},(_,i)=>{const p=node('p');p.append(node('span','['+(i+1)+']','loc-number'),document.createTextNode(C.output(c,m,i,lang())||P(['〔空读法〕','[Empty reading]'])));return p;}));
  const apparatusOpen=opened($('apparatus'));$('apparatus').replaceChildren(...Array.from({length:6},(_,i)=>{const section=node('section',undefined,'apparatus-row'),choice=m.choices[i]==='custom'?P(['自订','Custom']):String.fromCharCode(65+m.choices[i]),details=node('details');details.dataset.location=i;details.open=apparatusOpen.has(String(i));section.append(node('p','['+(i+1)+'] '+P(['采用：','Chosen: '])+choice),node('p',P(['理由：','Reason: '])+(m.reasons[i]||P(['尚未填写','Not entered']))));details.append(node('summary',P(['展开三份来源及自订原文','Show all sources and the custom reading'])));for(let w=0;w<3;w++)details.append(node('p',String.fromCharCode(65+w)+': '+C.reading(c,m,i,w,lang()),'source-line'));details.append(node('p',P(['自订：','Custom: '])+m.customs[i],'source-line'));section.append(details);return section;}));
  $('undo').disabled=!history.length;$('redo').disabled=!future.length;$('restoreSources').disabled=m.readings.every(row=>row.every(r=>r===null));$('loadCheckpoint').disabled=!entry().checkpoint;renderCheckpoint();$('storage').textContent=P(storageOK?['已自动保存在本浏览器。','Saved automatically in this browser.']:['无法保存到本浏览器，请在关闭前导出 JSON 备份。','Browser saving is unavailable. Export JSON before closing.']);$('notice').textContent=notice?P(notice):'';
 }
 function renderCheckpoint(){const saved=entry().checkpoint,c=source(),m=model();if(!saved){$('checkpoint').replaceChildren(node('p',P(['本案尚无对照快照。','No checkpoint for this case yet.'])));return;}const items=C.differences(c,m,saved,lang()),changes=items.filter(d=>d.before!==d.after||d.choiceChanged||d.reasonChanged||d.customChanged||d.sourcesChanged),root=$('checkpoint'),checkpointOpen=opened(root);root.replaceChildren(node('p',P(['不同的位置：','Changed locations: '])+changes.length+' / 6'),node('p',P(['快照标题：','Checkpoint title: '])+saved.title),node('p',P(['快照总笔记：','Checkpoint notes: '])+saved.notes));if(saved.title!==m.title||saved.notes!==m.notes)root.append(node('p',P(['当前标题或总笔记也与快照不同。','The current title or case notes also differ.'])));
  for(const d of changes){const details=node('details',undefined,'checkpoint-row'),i=d.unit,choiceName=choice=>choice==='custom'?P(['自订','Custom']):String.fromCharCode(65+choice);details.dataset.location=i;details.open=checkpointOpen.has(String(i));details.append(node('summary',P(['位置 ','Location '])+(i+1)),node('p',P(['快照来源：','Checkpoint source: '])+choiceName(saved.choices[i])),node('p',P(['当前来源：','Current source: '])+choiceName(m.choices[i])),node('p',P(['快照采用：','Checkpoint reading: '])+d.before),node('p',P(['当前采用：','Current reading: '])+d.after),node('p',P(['快照理由：','Checkpoint reason: '])+saved.reasons[i]),node('p',P(['当前理由：','Current reason: '])+m.reasons[i]));if(d.customChanged)details.append(node('p',P(['快照自订：','Checkpoint custom: '])+saved.customs[i]),node('p',P(['当前自订：','Current custom: '])+m.customs[i]));if(d.sourcesChanged)for(let w=0;w<3;w++)if(saved.readings[i][w]!==m.readings[i][w])details.append(node('p',String.fromCharCode(65+w)+' '+P(['快照：','checkpoint: '])+C.reading(c,saved,i,w,lang())),node('p',String.fromCharCode(65+w)+' '+P(['当前：','current: '])+C.reading(c,m,i,w,lang())));root.append(details);}
 }
 let composingInput = null;
 function bindInput(id, max, write) {
  const field = $(id);
  field.onfocus = () => { activeInput = null; };
  function input(event) {
   if (event.isComposing) return;
   if (activeInput !== id) {
    remember();
    activeInput = id;
   }
   const value = [...field.value].slice(0, max).join('');
   notice = value !== field.value ? ['已到本字段的字符上限。', 'This field has reached its character limit.'] : null;
   if (field.value !== value) field.value = value;
   write(value);
   changed();
   renderComputed();
  }
  field.oninput = input;
  field.addEventListener('compositionstart', () => {
   composingInput = field;
   revision++;
  });
  field.addEventListener('compositionend', event => {
   if (composingInput === field) composingInput = null;
   input(event);
  });
 }
 for(let w=0;w<3;w++)bindInput('reading-'+w,400,value=>model().readings[unit()][w]=value);bindInput('custom',400,value=>model().customs[unit()]=value);bindInput('reason',200,value=>model().reasons[unit()]=value);bindInput('title',80,value=>model().title=value);bindInput('notes',1000,value=>model().notes=value);
 $('case').onchange=()=>navigate(()=>state.selected=$('case').value);$('base').onchange=()=>navigate(()=>state.view.base=Number($('base').value));$('mode').onchange=()=>navigate(()=>state.view.mode=$('mode').value);$('previous').onclick=()=>navigate(()=>entry().unit--);$('next').onclick=()=>navigate(()=>entry().unit++);$('chooseCustom').onclick=()=>{if(model().choices[unit()]==='custom')return;transaction(()=>model().choices[unit()]='custom');};
 $('restoreSources').onclick=()=>transaction(()=>model().readings=Array.from({length:6},()=>[null,null,null]));$('saveCheckpoint').onclick=()=>transaction(()=>entry().checkpoint=C.copy(model()));$('loadCheckpoint').onclick=()=>{if(!entry().checkpoint)return;transaction(()=>entry().model=C.copy(entry().checkpoint));};
 $('undo').onclick=()=>{if(!history.length)return;future.push(C.copy(state));state=history.pop();activeInput=null;notice=null;changed();render();};$('redo').onclick=()=>{if(!future.length)return;history.push(C.copy(state));state=future.pop();activeInput=null;notice=null;changed();render();};
 function download(text,type,name){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 $('exportText').onclick=()=>download(C.text(source(),model(),lang()),'text/plain;charset=utf-8','017-'+state.selected+'.txt');$('exportCsv').onclick=()=>download(C.csv(source(),model(),lang()),'text/csv;charset=utf-8','017-'+state.selected+'.csv');$('exportJson').onclick=()=>download(JSON.stringify(state,null,2),'application/json','017-text-collation-backup.json');
 const importFile = $('importFile');
 importFile.onchange = async () => {
  const file = importFile.files[0];
  if (!file) return;
  const started = revision;
  let restored;
  try {
   if (file.size > C.MAX_IMPORT_BYTES) throw Error();
   const text = await file.text();
   if (revision !== started || composingInput) {
    notice = ['读取期间有编辑、输入法组字或页面切换，已保留当前内容。', 'Your current work was kept because editing, text composition, or navigation occurred while reading, so nothing was replaced.'];
    importFile.value = '';
    renderComputed();
    return;
   }
   restored = C.restore(JSON.parse(text));
   if (!restored) throw Error();
  } catch {
   notice = ['文件无效或超过 3 MB，未覆盖任何内容。', 'Invalid file or file over 3 MB; nothing was replaced.'];
   importFile.value = '';
   renderComputed();
   return;
  }
  remember();
  state = restored;
  activeInput = null;
  changed();
  notice = ['全部八案已导入，可撤销本次导入。', 'All eight cases imported. You can undo this import.'];
  importFile.value = '';
  render();
 };
 window.addEventListener('programlanguagechange',()=>{activeInput=null;render();});render();
})();
