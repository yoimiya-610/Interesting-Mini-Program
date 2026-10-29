'use strict';
(() => {
  const W=WaveWorkshop,$=id=>document.getElementById(id),KEY='wave-workshop-009-v1';
  const t=(zh,en)=>ProgramLanguage.language==='en'?en:zh,pair=p=>p[ProgramLanguage.language==='en'?1:0];
  let state={version:1,current:W.preset('sine'),slots:[],reference:null},history=[],message=['先选择起点，再试着改变一条波。','Choose a starting point, then change one component.'],storageFailed=false,source=null,audio=null,audioRun=0;
  const buttons=['listen','save','exportWav','exportSvg','exportCsv','exportJson'];
  function notify(zh,en){message=[zh,en];$('notice').textContent=pair(message);}
  function invalid(){return Boolean(document.querySelector('[aria-invalid="true"]'));}
  function actions(){const bad=invalid();buttons.forEach(id=>$(id).disabled=bad);$('listen').disabled=bad||Boolean(source)||!W.metrics(state.current).active;$('save').disabled=bad||state.slots.length>=W.MAX_SLOTS;$('undo').disabled=!history.length;$('stop').disabled=!source;}
  function storageText(){$('storage').textContent=storageFailed?t('本机保存不可用，请用 JSON 留存；仍可继续实验。','Local saving is unavailable. Keep a JSON backup; you can still experiment.'):t('参数与八份方案仅在当前浏览器保存；撤销历史不跨刷新。','Settings and up to eight versions stay in this browser. Undo history does not survive reloads.');}
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));storageFailed=false;}catch{storageFailed=true;}storageText();}
  function stopAudio(){audioRun++;if(source){source.onended=null;try{source.stop();}catch{}source=null;}actions();}
  function commit(next,zh,en,preserveLabel=true,sync=true){stopAudio();history.push({before:W.copy(state),preserveLabel,afterLabel:next.current.label});if(history.length>30)history.shift();state=W.copy(next);render(sync);persist();notify(zh,en);}
  function displayName(config,index){return config.label||pair(W.PRESETS.find(p=>p.id===config.preset).name)+(index===undefined?'':' · '+(index+1));}
  function make(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
  for(let n=1;n<=W.COUNT;n++){
    const row=make('div',undefined,'partial');row.id='partial-'+n;
    const channel=make('div',undefined,'channel');channel.append(make('span',String(n)),make('small','', 'frequency'));row.append(channel);
    for(const [key,id,min,max,step]of [['amp','amplitude',0,1,.001],['phase','phase',-180,180,1]]){
      const label=make('label'),span=make('span');span.id=key+'Label-'+n;
      const input=make('input');input.id=id+'-'+n;input.type='number';input.min=min;input.max=max;input.step=step;input.oninput=input.onchange=readDraft;label.htmlFor=input.id;label.append(span,input);
      if(key==='amp'){const meter=make('div',undefined,'spectrum');meter.setAttribute('aria-hidden','true');meter.append(make('span'));label.append(meter);}row.append(label);
    }
    const controls=make('div',undefined,'controls'),label=make('label',undefined,'check'),check=make('input');check.type='checkbox';check.id='on-'+n;check.onchange=readDraft;label.htmlFor=check.id;label.append(check,make('span'));const solo=make('button');solo.id='solo-'+n;solo.onclick=()=>{if(invalid()){invalidMessage();return;}const next=W.copy(state);next.current.rows.forEach((r,i)=>r.on=i===n-1);next.current.cutoff=Math.max(n,next.current.cutoff);commit(next,'已独奏这一条路，可撤销恢复混合。','Soloing this component. Undo restores the previous mix.');};controls.append(label,solo);row.append(controls);$('rows').append(row);
  }
  function invalidMessage(){notify('参数未应用：请修正标红的输入；图与统计仍使用上一份有效参数。修正后才能保存、试听或导出。','Settings not applied. Correct the marked inputs; the plot and statistics still use the last valid settings. Fix them before saving, listening, or exporting.');actions();}
  function readDraft(){
    const c=W.copy(state.current);let bad=false;
    const number=(id,min,max,integer=false)=>{const el=$(id),v=Number(el.value),valid=el.value.trim()!==''&&Number.isFinite(v)&&v>=min&&v<=max&&(!integer||Number.isInteger(v));el.setAttribute('aria-invalid',String(!valid));if(!valid)bad=true;return v;};
    c.frequency=number('frequency',40,600,true);c.cutoff=number('cutoff',1,16,true);c.cycles=Number($('cycles').value);c.showParts=$('showParts').checked;
    c.rows.forEach((r,i)=>{r.amplitude=number('amplitude-'+(i+1),0,1);r.phase=number('phase-'+(i+1),-180,180,true);r.on=$('on-'+(i+1)).checked;});
    if(bad||!W.valid(c)){stopAudio();invalidMessage();return;}
    if(JSON.stringify(c)===JSON.stringify(state.current)){actions();return;}const next=W.copy(state);next.current=c;commit(next,'波形已更新。图与统计使用未衰减的相对振幅。','Wave updated. Plot and statistics use unattenuated relative amplitudes.',true,false);
  }
  ['frequency','cutoff','cycles','showParts'].forEach(id=>$(id).onchange=readDraft);
  ['frequency','cutoff'].forEach(id=>$(id).oninput=readDraft);
  $('label').oninput=()=>{state.current.label=Array.from($('label').value).slice(0,60).join('');persist();draw();};
  function draw(){const ref=state.slots.find(s=>s.id===state.reference)?.config;$('plot').innerHTML=W.svg(state.current,ref,ProgramLanguage.language,Math.min(1600,Math.max(240,Math.floor($('plot').clientWidth))));}
  function render(sync=true){
    const c=state.current,preset=W.PRESETS.find(p=>p.id===c.preset),a=W.amplitudes(c),m=W.metrics(c),ref=state.slots.find(s=>s.id===state.reference)?.config;
    document.title='009 · '+t('波形工坊','Wave Workshop');
    $('presets').replaceChildren();for(const p of W.PRESETS){const button=make('button',pair(p.name));button.dataset.preset=p.id;button.setAttribute('aria-pressed',String(p.id===c.preset));button.onclick=()=>{const next=W.copy(state),label=next.current.label;next.current=W.preset(p.id);next.current.label=label;commit(next,'起点已载入，标题和已存方案保留；可以撤销。','Starting point loaded. Your title and saved versions are kept; you can undo.');};$('presets').append(button);}
    $('experiment').replaceChildren(make('p',pair(preset.lead)),make('p',pair(preset.task)));
    if(sync){$('label').value=c.label;$('frequency').value=c.frequency;$('cutoff').value=c.cutoff;$('cycles').value=c.cycles;$('showParts').checked=c.showParts;document.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));}
    for(let n=1;n<=W.COUNT;n++){
      const r=c.rows[n-1],row=$('partial-'+n);if(sync){$('amplitude-'+n).value=r.amplitude;$('phase-'+n).value=r.phase;$('on-'+n).checked=r.on;}
      $('ampLabel-'+n).textContent=t('振幅','Amplitude');$('phaseLabel-'+n).textContent=t('相位 / °','Phase / °');
      row.querySelector('.frequency').textContent=n*c.frequency+' Hz';row.querySelector('.check span').textContent=t('参与','Mix');
      $('on-'+n).setAttribute('aria-label',t('第 '+n+' 路参与','Mix harmonic '+n));$('amplitude-'+n).setAttribute('aria-label',t('第 '+n+' 路振幅','Amplitude '+n));$('phase-'+n).setAttribute('aria-label',t('第 '+n+' 路相位','Phase '+n));$('solo-'+n).textContent=t('独奏','Solo');$('solo-'+n).setAttribute('aria-label',t('独奏第 '+n+' 路','Solo harmonic '+n));
      row.classList.toggle('muted',!a[n-1]);row.querySelector('.spectrum span').style.width=(a[n-1]*100)+'%';
    }
    draw();$('rmsLabel').textContent=t('精确 RMS','Exact RMS');$('peakLabel').textContent=t('估计峰值','Estimated peak');$('activeLabel').textContent=t('有效分量','Active components');$('highestLabel').textContent=t('最高有效频率','Highest active frequency');
    $('rms').textContent=m.rms.toFixed(3);$('peak').textContent=m.peak.toFixed(3);$('active').textContent=m.active+' / 16';$('highest').textContent=m.highest+' Hz';
    $('comparison').textContent=ref?t('形状差异 RMS：','Shape-difference RMS: ')+W.shapeDistance(c,ref).toFixed(3)+t('。按基准周期对齐，未进行音高匹配。',' · Aligned by base cycle, not by pitch.'):t('保存一份方案后可叠加参考；频谱条显示每路的有效振幅，不包含相位。','Save a version to overlay a reference. Each spectrum bar shows its effective amplitude, without phase.');
    $('slotCount').textContent=state.slots.length+' / 8';$('reference').replaceChildren();const none=make('option',t('不叠加','No overlay'));none.value='';$('reference').append(none);
    $('slots').replaceChildren();state.slots.forEach((slot,i)=>{
      const label=displayName(slot.config,i),option=make('option',label);option.value=slot.id;$('reference').append(option);
      const row=make('article',undefined,'slot');row.append(make('strong',label),make('p',slot.config.frequency+' Hz · '+W.metrics(slot.config).active+t(' 路分量',' components')+' · RMS '+W.metrics(slot.config).rms.toFixed(3)));
      const actions=make('div',undefined,'actions'),load=make('button',t('载入','Load')),remove=make('button',t('移除','Remove'));load.dataset.load=slot.id;remove.dataset.remove=slot.id;load.setAttribute('aria-label',t('载入：','Load: ')+label);remove.setAttribute('aria-label',t('移除：','Remove: ')+label);
      load.onclick=()=>{const next=W.copy(state);next.current=W.copy(slot.config);commit(next,'方案已载入，可以撤销；其他已存方案不受影响。','Version loaded. You can undo; other saved versions are kept.',false);};remove.onclick=()=>{const next=W.copy(state);next.slots=next.slots.filter(s=>s.id!==slot.id);if(next.reference===slot.id)next.reference=null;commit(next,'已移除方案，可以撤销。','Version removed. You can undo.');};actions.append(load,remove);row.append(actions);$('slots').append(row);
    });$('reference').value=state.reference||'';$('notice').textContent=pair(message);storageText();actions();
  }
  $('save').onclick=()=>{if(invalid()||state.slots.length>=W.MAX_SLOTS)return;const next=W.copy(state);next.slots.push({id:'s'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),config:W.copy(state.current)});commit(next,'已保存当前方案；可从参考菜单叠加，或稍后载入。','Version saved. Choose it as an overlay or load it later.');};
  $('reference').onchange=()=>{if(invalid()){$('reference').value=state.reference||'';invalidMessage();return;}const next=W.copy(state);next.reference=$('reference').value||null;commit(next,'参考已更新；虚线与当前波形共用纵轴。','Reference updated. Dashed and current curves share one vertical scale.');};
  $('undo').onclick=()=>{if(!history.length)return;stopAudio();const entry=history.pop(),next=entry.before;if(entry.preserveLabel||state.current.label!==entry.afterLabel)next.current.label=state.current.label;state=next;render();persist();notify('已撤销上一步。','Previous step undone.');};
  for(const [id,update]of [['zero',c=>c.rows.forEach(r=>r.amplitude=0)],['phases',c=>c.rows.forEach(r=>r.phase=0)],['restoreMix',c=>c.rows.forEach(r=>r.on=true)]])$(id).onclick=()=>{if(invalid()){invalidMessage();return;}const next=W.copy(state);update(next.current);commit(next,'分量设置已更新，可以撤销。','Component settings updated. You can undo.');};
  $('listen').onclick=async()=>{
    if(invalid())return;stopAudio();const run=audioRun,c=W.copy(state.current);
    try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Unavailable');audio??=new Audio();await audio.resume();if(run!==audioRun)return;const samples=W.pcm(c),buffer=audio.createBuffer(1,samples.length,24000);buffer.getChannelData(0).set(samples);const playing=audio.createBufferSource();playing.buffer=buffer;playing.connect(audio.destination);source=playing;playing.onended=()=>{if(source===playing){source=null;actions();}};playing.start();actions();notify('正在试听 2 秒；可随时停止，修改参数也会停止。','Playing for 2 seconds. Stop any time; editing settings also stops playback.');}catch{notify('当前浏览器无法试听；仍可导出 WAV，用本机播放器收听。','Playback is unavailable in this browser. Export WAV to listen in a local player.');source=null;actions();}
  };$('stop').onclick=()=>{stopAudio();notify('试听已停止。','Playback stopped.');};
  function download(data,type,name){const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),a=make('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('文件已导出。','File exported.');}
  $('exportWav').onclick=()=>{if(!invalid())download(W.wav(state.current),'audio/wav','009-wave-workshop.wav');};
  $('exportSvg').onclick=()=>{if(!invalid())download(W.svg(state.current,state.slots.find(s=>s.id===state.reference)?.config,ProgramLanguage.language),'image/svg+xml;charset=utf-8','009-wave-workshop.svg');};
  $('exportCsv').onclick=()=>{if(invalid())return;const values=W.sample(state.current,512,1),lines=['base_frequency_hz,'+state.current.frequency,'base_cycle,seconds,relative_amplitude',...Array.from(values,(y,i)=>[i/512,i/512/state.current.frequency,y].join(','))];download(lines.join('\n'),'text/csv;charset=utf-8','009-wave-workshop.csv');};
  $('exportJson').onclick=()=>{if(!invalid())download(JSON.stringify(state,null,2),'application/json;charset=utf-8','009-wave-workshop.json');};
  $('importFile').onchange=async event=>{const file=event.target.files?.[0];if(!file)return;try{if(file.size>150000)throw new Error('Too large');const next=W.restore(JSON.parse((await file.text()).replace(/^\uFEFF/,'')));if(!next)throw new Error('Invalid');commit(next,'备份已导入，之前的参数与方案可以撤销恢复。','Backup imported. Undo can restore the previous settings and versions.',false);}catch{notify('未导入：请使用不超过 150 KB 的完整本程序 JSON 备份。当前内容未改变。','Not imported. Use a complete Wave Workshop JSON backup no larger than 150 KB. Current work is unchanged.');}event.target.value='';};
  window.addEventListener('programlanguagechange',()=>render(false));window.addEventListener('pagehide',stopAudio);
  try{const raw=localStorage.getItem(KEY);if(raw){const loaded=W.restore(JSON.parse(raw));if(!loaded)throw new Error('Invalid');state=loaded;message=['已恢复参数、方案与参考；撤销历史从本次打开开始。','Settings, saved versions, and reference restored. Undo starts with this visit.'];}}catch{storageFailed=true;message=['旧记录无法读取，尚未覆盖；当前使用起点，新操作会保存有效内容。请先备份重要记录。','The old record could not be read and has not been overwritten. A starting point is shown; new actions save valid settings. Back up important records first.'];}
  render();if(window.ResizeObserver)new ResizeObserver(draw).observe($('plot'));
})();
