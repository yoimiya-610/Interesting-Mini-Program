'use strict';
(() => {
  const C=CriticalPath,$=id=>document.getElementById(id),KEY='critical-path-010-v1';
  const b=(zh,en)=>ProgramLanguage.language==='en'?en:zh,lang=()=>ProgramLanguage.language;
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  const label=t=>C.name(t,lang()),hist=[];
  let state={version:1,current:C.template('exhibit'),slots:[],baseline:null},selected='T1',dirty=false,nameDirty=false,preview=null,templateKey='exhibit',notice=null,storageOK=true;
  try{const raw=localStorage.getItem(KEY);if(raw){const parsed=C.restore(JSON.parse(raw));if(parsed){state=parsed;templateKey=null;}else notice=['本机记录无法读取；未覆盖原记录。请先导出当前内容。','Local records could not be read and have not been overwritten. Export your work first.'];}}catch{storageOK=false;}
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}storage();}
  function storage(){$('storage').textContent=storageOK?b('已应用内容保存在本浏览器；版本不跨设备。','Committed work is saved in this browser; versions do not sync across devices.'):b('本机保存不可用；仍可操作并导出备份。','Local saving is unavailable; you can still work and export backups.');}
  function say(zh,en){notice=[zh,en];$('notice').textContent=b(zh,en);}
  function guard(){if(!dirty)return true;say('编辑尚未应用，请先应用或取消。','Unapplied edit: apply or cancel it first.');return false;}
  function checkpoint(){hist.push(C.copy(state));if(hist.length>30)hist.shift();}
  function commit(change){checkpoint();change();preview=null;persist();render();}
  function controls(){
    $('undo').disabled=!hist.length||dirty;$('add').disabled=dirty||state.current.tasks.length>=24;
    for(const id of ['save','preview','exportSvg','exportCsv','exportJson','importFile','baseline'])$(id).disabled=dirty;
    $('save').disabled=dirty||state.slots.length>=8;$('adopt').disabled=dirty||!preview;
    $('draftNote').textContent=dirty?b('有未应用的编辑。切换语言会保留它，刷新不会。','Unapplied edit. Language changes keep it; reloading does not.'):b('此处显示已应用任务。修改后点击应用。','This is the committed task. Apply after editing.');
  }
  function depsRender(checked){
    const root=$('dependencies');root.replaceChildren();
    for(const t of state.current.tasks){if(t.id===selected)continue;const l=el('label'),box=el('input');box.type='checkbox';box.value=t.id;box.checked=checked.includes(t.id);box.onchange=markDirty;l.append(box,el('span',t.id+' · '+label(t)));root.append(l);}
  }
  function fillEditor(){
    const t=state.current.tasks.find(t=>t.id===selected);dirty=false;nameDirty=false;
    $('taskName').value=t?label(t):'';$('duration').value=t?t.duration:1;
    $('taskName').removeAttribute('aria-invalid');$('duration').removeAttribute('aria-invalid');
    depsRender(t?.deps||[]);editorHeading();controls();
  }
  function editorHeading(){
    $('editorHeading').textContent=selected?b('编辑 ','Edit ')+selected:b('新任务','New task');
    const dependent=state.current.tasks.some(t=>t.deps.includes(selected));
    $('remove').disabled=!selected||dependent||state.current.tasks.length<=1;
  }
  function markDirty(){dirty=true;preview=null;controls();}
  function pick(id){if(!guard())return;selected=id;fillEditor();renderTasks();}
  function renderTemplates(){
    $('templates').replaceChildren(...C.TEMPLATES.map((t,i)=>{const btn=el('button');btn.dataset.template=t.key;btn.setAttribute('aria-pressed',String(t.key===templateKey));btn.append(el('strong',String(i+1).padStart(2,'0')+' / '+t.name[lang()==='en'?1:0]),el('small',t.tasks.length+b(' 项任务',' tasks')));btn.onclick=()=>{if(!guard())return;commit(()=>{state.current=C.template(t.key);templateKey=t.key;selected='T1';});say('已载入底稿，可撤销。','Starting point loaded; you can undo.');};return btn;}));
    const t=C.TEMPLATES.find(t=>t.key===templateKey);$('prompt').textContent=t?t.prompt[lang()==='en'?1:0]:b('自己的网络：从左侧修改任务，用试算检查一处变化怎样影响全局。','Your network: edit tasks and preview how a single change affects the whole project.');
  }
  function renderTimeline(a){
    const root=$('timeline');root.replaceChildren();const latest=$('late').checked;
    const scale=el('div',undefined,'time-scale');scale.append(el('span','0'),el('span',a.finish+b(' 时间单位',' units')));root.append(scale);
    for(const t of state.current.tasks){const r=a.rows[t.id],btn=el('button',undefined,'time-row');btn.dataset.timeline=t.id;const start=latest?r.ls:r.es;
      const title=el('span',t.id+' · '+label(t),'time-label');title.append(el('small',(r.critical?b('关键','Critical'):b('总时差 ','Float ')+r.float)+' / '+start+' → '+(start+t.duration)));
      const track=el('span',undefined,'track'),bar=el('span',undefined,'bar'+(r.critical?' critical':''));bar.style.left=start/a.finish*100+'%';bar.style.width=t.duration/a.finish*100+'%';track.append(bar);
      if(r.float){const f=el('span',undefined,'float');f.style.left=(latest?r.es:r.ef)/a.finish*100+'%';f.style.width=r.float/a.finish*100+'%';track.append(f);}
      btn.append(title,track);btn.onclick=()=>{pick(t.id);$('taskForm').scrollIntoView({block:'center'});};root.append(btn);
    }
    $('chains').textContent=b('关键衔接（前项结束 = 后项开始）：','Critical connections (finish = next start): ')+(a.criticalEdges.map(e=>e.join(' → ')).join(' · ')||b('独立任务','Independent tasks'));
  }
  function renderTasks(){
    const a=C.analyze(state.current.tasks);
    $('taskList').replaceChildren(...state.current.tasks.map(t=>{const r=a.rows[t.id],btn=el('button',undefined,'task-choose');btn.dataset.task=t.id;btn.setAttribute('aria-pressed',String(selected===t.id));
      btn.append(el('b',t.id),el('span',label(t)),el('b',t.duration),el('small',b('前置 ','After ')+(t.deps.join(', ')||'—')+' · '+b('早 ','Early ')+r.es+'–'+r.ef+' · '+b('晚 ','Late ')+r.ls+'–'+r.lf+' · '+b('总 / 自由时差 ','Total / free float ')+r.float+' / '+r.free));btn.onclick=()=>pick(t.id);return btn;}));
  }
  function renderPreview(a,preserveDraft=false){
    const old=$('whatTask').value;$('whatTask').replaceChildren(...state.current.tasks.map(t=>{const o=el('option',t.id+' · '+label(t));o.value=t.id;return o;}));
    if(state.current.tasks.some(t=>t.id===old))$('whatTask').value=old;
    if(!preview&&!preserveDraft)$('whatDuration').value=state.current.tasks.find(t=>t.id===$('whatTask').value).duration;
    $('whatResult').textContent=preview?b('工期 ','Finish ')+a.finish+' → '+preview.finish+' ('+(preview.finish-a.finish>0?'+':'')+(preview.finish-a.finish)+b(' 单位)',' units)'):b('先计算，再决定是否采用。','Calculate before deciding whether to adopt.');
    $('sensitivity').replaceChildren(...state.current.tasks.map(t=>{let delta=null;if(t.duration>1){const tasks=C.copy(state.current.tasks);tasks.find(x=>x.id===t.id).duration--;delta=C.analyze(tasks).finish-a.finish;}const p=el('p');p.append(el('span',t.id+' · '+label(t)),el('b',delta===null?'—':String(delta)));return p;}));
  }
  function renderSlots(a){
    const old=state.baseline;$('baseline').replaceChildren();const none=el('option',b('不对照','No comparison'));none.value='';$('baseline').append(none);
    $('slots').replaceChildren(...state.slots.map((s,i)=>{const m=C.analyze(s.project.tasks),title=s.project.title||b('版本 ','Version ')+(i+1),o=el('option',title);o.value=s.id;$('baseline').append(o);
      const article=el('article');article.append(el('strong',title),el('p',b('工期 ','Finish ')+m.finish+' · '+s.project.tasks.length+b(' 项',' tasks')));
      const actions=el('div',undefined,'actions'),load=el('button',b('载入','Load')),remove=el('button',b('移除','Remove'));load.dataset.load=s.id;remove.dataset.remove=s.id;
      load.onclick=()=>{if(!guard())return;commit(()=>{state.current=C.copy(s.project);selected=state.current.tasks[0].id;templateKey=null;});say('已载入保存版本。','Saved version loaded.');};
      remove.onclick=()=>{if(!guard())return;commit(()=>{state.slots=state.slots.filter(x=>x.id!==s.id);if(state.baseline===s.id)state.baseline=null;});say('已移除版本，可撤销。','Version removed; you can undo.');};actions.append(load,remove);article.append(actions);return article;}));
    $('baseline').value=old||'';$('slotCount').textContent=state.slots.length+' / 8';
    const reference=state.slots.find(s=>s.id===old);if(reference){const r=C.analyze(reference.project.tasks);$('comparison').textContent=b('当前 / 对照：工期 ','Current / comparison: finish ')+a.finish+' / '+r.finish+b('；工时总和 ','; task-duration sum ')+a.work+' / '+r.work+b('。差值不代表内容相同，请结合网络判断。','. A difference does not imply the networks contain equivalent work.');}else $('comparison').textContent=b('保存一份，再试不同的依赖和工时。','Save a version, then try other dependencies and durations.');
  }
  function render(resetEditor=true){
    const a=C.analyze(state.current.tasks);renderTemplates();
    for(const [id,pair]of Object.entries({finishLabel:['最短工期','Minimum duration'],workLabel:['工时总和','Task-duration sum'],criticalLabel:['关键任务','Critical tasks'],pathsLabel:['关键路径数','Critical paths']}))$(id).textContent=b(...pair);
    $('finish').textContent=a.finish;$('work').textContent=a.work;$('criticalCount').textContent=Object.values(a.rows).filter(r=>r.critical).length+' / '+state.current.tasks.length;$('pathCount').textContent=a.paths;
    renderTimeline(a);renderTasks();renderPreview(a,!resetEditor);renderSlots(a);
    if(resetEditor){$('title').value=state.current.title;if(!state.current.tasks.some(t=>t.id===selected))selected=state.current.tasks[0].id;fillEditor();}
    else {const checked=[...$('dependencies').querySelectorAll('input:checked')].map(n=>n.value);depsRender(checked);if(!nameDirty){const t=state.current.tasks.find(t=>t.id===selected);if(t)$('taskName').value=label(t);}editorHeading();}
    controls();storage();$('notice').textContent=notice?b(...notice):'';
  }
  $('taskName').oninput=()=>{nameDirty=true;markDirty();};$('duration').oninput=markDirty;
  $('taskForm').onsubmit=e=>{
    e.preventDefault();const name=$('taskName').value.trim(),duration=Number($('duration').value),old=state.current.tasks.find(t=>t.id===selected);
    const validName=!!name&&[...name].length<=80,validDuration=Number.isInteger(duration)&&duration>=1&&duration<=99;
    $('taskName').setAttribute('aria-invalid',String(!validName));$('duration').setAttribute('aria-invalid',String(!validDuration));
    if(!validName||!validDuration){say('名称不能为空，工时须为 1–99 的整数。','Enter a name and a whole-number duration from 1 to 99.');return;}
    let n=1;while(state.current.tasks.some(t=>t.id==='T'+n))n++;
    const task={id:selected||'T'+n,name:old&&!nameDirty?old.name:name,en:old&&!nameDirty?old.en:null,duration,deps:[...$('dependencies').querySelectorAll('input:checked')].map(x=>x.value)};
    const tasks=C.copy(state.current.tasks);if(old)tasks[tasks.findIndex(t=>t.id===selected)]=task;else tasks.push(task);
    const result=C.analyze(tasks);if(result.error){say('依赖形成循环，未应用。请取消至少一条回路连接。','Dependency cycle: not applied. Remove at least one connection in the loop.');return;}
    dirty=false;commit(()=>{state.current.tasks=tasks;selected=task.id;templateKey=null;});say('任务已应用，网络已重新计算。','Task applied; the network has been recalculated.');
  };
  $('cancel').onclick=()=>{selected=state.current.tasks.some(t=>t.id===selected)?selected:state.current.tasks[0].id;fillEditor();renderTasks();say('已取消未应用的编辑。','Unapplied edits canceled.');};
  $('add').onclick=()=>{if(!guard())return;selected=null;fillEditor();renderTasks();$('taskName').focus();};
  $('remove').onclick=()=>{if(!guard())return;if(state.current.tasks.length<=1||state.current.tasks.some(t=>t.deps.includes(selected)))return;commit(()=>{state.current.tasks=state.current.tasks.filter(t=>t.id!==selected);selected=state.current.tasks[0].id;templateKey=null;});say('任务已删除，可撤销。','Task deleted; you can undo.');};
  $('undo').onclick=()=>{if(!guard()||!hist.length)return;state=hist.pop();templateKey=null;selected=state.current.tasks[0].id;preview=null;persist();render();say('已撤销一步。','One step undone.');};
  $('late').onchange=()=>renderTimeline(C.analyze(state.current.tasks));
  $('whatTask').onchange=()=>{preview=null;$('whatDuration').value=state.current.tasks.find(t=>t.id===$('whatTask').value).duration;$('whatResult').textContent=b('任务已改变，请重新计算。','Task changed; calculate again.');$('adopt').disabled=true;};
  $('whatDuration').oninput=()=>{preview=null;$('adopt').disabled=true;$('whatResult').textContent=b('参数已改变，请重新计算。','Value changed; calculate again.');};
  $('preview').onclick=()=>{if(!guard())return;const d=Number($('whatDuration').value);if(!Number.isInteger(d)||d<1||d>99){say('试算工时须为 1–99 的整数。','Preview duration must be a whole number from 1 to 99.');return;}
    const tasks=C.copy(state.current.tasks),id=$('whatTask').value;tasks.find(t=>t.id===id).duration=d;preview={id,duration:d,finish:C.analyze(tasks).finish};renderPreview(C.analyze(state.current.tasks));controls();};
  $('adopt').onclick=()=>{if(!guard()||!preview)return;const p=preview;commit(()=>{state.current.tasks.find(t=>t.id===p.id).duration=p.duration;templateKey=null;});say('已采用试算，可撤销。','Preview adopted; you can undo.');};
  $('title').oninput=()=>{state.current.title=$('title').value;persist();};
  $('save').onclick=()=>{if(!guard()||state.slots.length>=8)return;commit(()=>{state.slots.push({id:'s'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),project:C.copy(state.current)});});say('版本已保存。','Version saved.');};
  $('baseline').onchange=()=>{if(!guard())return;state.baseline=$('baseline').value||null;persist();renderSlots(C.analyze(state.current.tasks));};
  function download(name,content,type){if(!guard())return;const url=URL.createObjectURL(new Blob([content],{type})),a=el('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);say('文件已准备下载。','File prepared for download.');}
  $('exportSvg').onclick=()=>download('010-critical-path.svg',C.svg(state.current,lang()),'image/svg+xml');
  $('exportCsv').onclick=()=>download('010-critical-path.csv',C.csv(state.current,lang()),'text/csv;charset=utf-8');
  $('exportJson').onclick=()=>download('010-critical-path.json',JSON.stringify(state,null,2),'application/json');
  $('importFile').onchange=async()=>{const file=$('importFile').files[0];$('importFile').value='';if(!file||!guard())return;
    try{if(file.size>150000)throw new Error();const next=C.restore(JSON.parse(await file.text()));if(!next)throw new Error();commit(()=>{state=next;selected=state.current.tasks[0].id;templateKey=null;});say('备份已导入，可撤销整体替换。','Backup imported; undo can reverse the replacement.');}catch{say('未导入：备份无效、含循环或超过 150 KB。原内容保留。','Not imported: invalid, cyclic, or over 150 KB. Existing work was kept.');}
  };
  window.addEventListener('programlanguagechange',()=>render(false));render();
})();
