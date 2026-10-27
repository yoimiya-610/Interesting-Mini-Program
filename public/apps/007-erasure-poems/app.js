'use strict';
(() => {
  const $=id=>document.getElementById(id),{PASSAGES,selectable,tokenize,wordsFor,normalize,poem,original,restore,svg}=ErasurePoems,KEY='erasure-poems-007-v1';
  let state={source:PASSAGES[0].id,custom:'',drafts:{},cover:false},history=[],focusIndex=0,storageOk=true;
  const language=()=>ProgramLanguage.language,words=()=>wordsFor(state.source,state.custom,language()),writingLanguage=()=>state.source==='custom'?'auto':language();
  const draft=()=>state.drafts[state.source]||(state.drafts[state.source]=normalize({},words()));
  const sourceName=()=>state.source==='custom'?ProgramLanguage.t('自己的底稿'):PASSAGES.find(p=>p.id===state.source).name[language()==='en'?1:0];
  const lines=()=>poem(words(),draft(),writingLanguage());
  function message(text){$('notice').textContent=text;}
  function persist(){try{localStorage.setItem(KEY,JSON.stringify({version:1,...state}));storageOk=true;}catch{storageOk=false;}$('storage').textContent=storageOk?'草稿已留在本机；重要作品请导出。撤销历史不跨刷新。':'本机保存不可用；仍可创作，请导出作品留存。';}
  function remember(){history.push(JSON.parse(JSON.stringify(state)));if(history.length>30)history.shift();}
  function change(action,text){remember();action();render();persist();message(text);}
  function node(tag,cls,text){const element=document.createElement(tag);if(cls)element.className=cls;if(text!==undefined)element.textContent=text;return element;}
  function renderPoem(){
    const data=draft(),current=words(),result=lines();$('previewTitle').textContent=data.title;$('poem').textContent=result.join('\n');$('empty').hidden=result.length>0;$('breakWords').replaceChildren();
    for(const index of data.selected){const button=node('button','break-word',current[index]+(data.breaks.includes(index)?' ↵':''));button.id='break-'+index;button.dataset.userContent='';button.setAttribute('aria-pressed',String(data.breaks.includes(index)));button.setAttribute('aria-label',ProgramLanguage.t('在此词后换行：')+current[index]);button.onclick=()=>{change(()=>{const breaks=draft().breaks;draft().breaks=breaks.includes(index)?breaks.filter(i=>i!==index):[...breaks,index];},'换行已调整，词语顺序保持不变。');$('break-'+index).focus();};$('breakWords').append(button);}
    $('exportText').disabled=$('exportSvg').disabled=result.length===0;$('selectionStats').textContent=data.selected.length+' / '+current.filter(selectable).length+ProgramLanguage.t(' 个词 · ')+result.length+ProgramLanguage.t(' 行');
  }
  function renderSource(){
    const current=words(),data=draft(),list=$('sourceWords');list.replaceChildren();list.classList.toggle('covered',state.cover);
    const indices=current.flatMap((word,i)=>selectable(word)?[i]:[]);if(!indices.includes(focusIndex))focusIndex=indices[0];
    current.forEach((word,index)=>{
      if(!selectable(word)){const punctuation=node('span','punctuation',word);punctuation.dataset.userContent='';punctuation.setAttribute('aria-hidden','true');list.append(punctuation);return;}
      const button=node('button','word',word);button.id='word-'+index;button.dataset.userContent='';button.tabIndex=index===focusIndex?0:-1;button.setAttribute('aria-label',ProgramLanguage.t('选择词语：')+word);button.setAttribute('aria-pressed',String(data.selected.includes(index)));
      button.onclick=()=>{focusIndex=index;change(()=>{const selected=draft().selected;draft().selected=selected.includes(index)?selected.filter(i=>i!==index):[...selected,index].sort((a,b)=>a-b);draft().breaks=draft().breaks.filter(i=>draft().selected.includes(i));},'选词已更新；可以在右侧安排换行。');$('word-'+index).focus();};
      button.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;event.preventDefault();const position=indices.indexOf(index),next=event.key==='Home'?0:event.key==='End'?indices.length-1:Math.max(0,Math.min(indices.length-1,position+(['ArrowLeft','ArrowUp'].includes(event.key)?-1:1)));focusIndex=indices[next];button.tabIndex=-1;const target=$('word-'+focusIndex);target.tabIndex=0;target.focus();};list.append(button);if(language()==='en'&&state.source!=='custom')list.append(document.createTextNode(' '));
    });
    $('sourceCredit').textContent=sourceName();$('cover').textContent=state.cover?'显示全部词语':'遮住未选词';$('cover').setAttribute('aria-pressed',String(state.cover));
  }
  function render(){
    if(state.custom&&!$('customOption')){const option=node('option','','自己的底稿');option.id='customOption';option.value='custom';$('source').append(option);}if(!state.custom)$('customOption')?.remove();
    $('source').value=state.source;$('poemTitle').value=draft().title;$('demo').disabled=state.source==='custom';$('clear').disabled=!draft().selected.length;$('undo').disabled=!history.length;renderSource();renderPoem();
  }
  PASSAGES.forEach(p=>{const option=node('option','',p.name[0]);option.value=p.id;$('source').append(option);});
  $('source').onchange=event=>change(()=>{state.source=event.target.value;focusIndex=0;},'已切换底稿；每份底稿的选词与标题分别保留。');
  $('demo').onclick=()=>{const passage=PASSAGES.find(p=>p.id===state.source);if(!passage)return;change(()=>{draft().selected=[...passage.sample];draft().breaks=[...passage.breaks];},'示例已展开。可以继续选词，写出自己的版本。');};
  $('cover').onclick=()=>change(()=>{state.cover=!state.cover;},'阅读方式已切换，选词与换行保留。');
  $('clear').onclick=()=>change(()=>{draft().selected=[];draft().breaks=[];},'选词已清空，标题保留；可以撤销。');
  $('undo').onclick=()=>{if(!history.length)return;const previous=history.pop();for(const id of Object.keys(state.drafts))if(id!=='custom'||state.custom===previous.custom){previous.drafts[id]||=normalize({},wordsFor(id,previous.custom));previous.drafts[id].title=state.drafts[id].title;}state=previous;$('customText').value=state.custom;render();persist();message('已撤销上一步；标题输入不在撤销历史中。');};
  $('poemTitle').oninput=()=>{draft().title=Array.from($('poemTitle').value).slice(0,60).join('');$('poemTitle').value=draft().title;renderPoem();persist();};
  $('applyCustom').onclick=()=>{const text=$('customText').value;try{tokenize(text);}catch{message('底稿未载入：请输入 1–1200 字符，且不超过 180 个可选词或汉字，至少包含一个词。');return;}if(text===state.custom){change(()=>{state.source='custom';},'已回到自己的底稿，选词保留。');return;}change(()=>{state.custom=text;state.source='custom';state.drafts.custom=normalize({},tokenize(text));focusIndex=0;},'自己的底稿已载入，内容按原文保留；替换前的底稿可以撤销。');};
  function download(text,type,name){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('exportText').onclick=()=>{if(!lines().length)return;const title=draft().title||ProgramLanguage.t('未命名的诗'),text=title+'\n\n'+lines().join('\n')+'\n\n— 007 · '+ProgramLanguage.t('留白诗笺')+' —\n'+ProgramLanguage.t('底稿：')+sourceName()+'\n\n'+(state.source==='custom'?state.custom:original(words(),language()))+'\n';download('\uFEFF'+text,'text/plain;charset=utf-8','007-erasure-poem.txt');message('TXT 已导出，包含诗与底稿。');};
  $('exportSvg').onclick=()=>{if(!lines().length)return;download(svg(draft().title,lines(),sourceName(),language()),'image/svg+xml;charset=utf-8','007-erasure-poem.svg');message('诗笺 SVG 已导出，可以离线打开或分享。');};
  window.addEventListener('programlanguagechange',()=>{render();persist();});
  try{const raw=localStorage.getItem(KEY);if(raw){const recovered=restore(JSON.parse(raw));if(!recovered)throw new Error('Invalid state');state=recovered;$('customText').value=state.custom;message('欢迎回来，已恢复底稿、选词、换行和标题。');}}catch{storageOk=false;message('无法读取旧草稿；可以继续创作，重要作品请导出。');}
  render();if(!storageOk)$('storage').textContent='本机保存不可用；仍可创作，请导出作品留存。';
})();
