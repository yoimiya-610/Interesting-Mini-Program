'use strict';
(() => {
  const C=MeasureQuest,$=id=>document.getElementById(id),KEY='measure-quest-011-v1';
  const lang=()=>ProgramLanguage.language,b=(zh,en)=>lang()==='en'?en:zh,pair=p=>p[lang()==='en'?1:0];
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;},letter=i=>String.fromCharCode(65+i);
  let state=C.fresh(),source=0,hint=null,lastImport=null,notice=null,storageOK=true,labResult=null;
  try{const raw=localStorage.getItem(KEY);if(raw){const data=C.restore(JSON.parse(raw));if(data)state=data;else notice=['本机记录无效，未覆盖原数据。请先保留备份。','Local records are invalid and were not overwritten. Keep a backup first.'];}}catch{storageOK=false;}
  const current=()=>C.level(state.level),draft=()=>state.drafts[state.level]||(state.drafts[state.level]=C.draft());
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}renderStorage();}
  function touch(){lastImport=null;save();$('undoImport').disabled=true;}
  function say(zh,en){notice=[zh,en];$('notice').textContent=b(zh,en);}
  function renderStorage(){$('storage').textContent=storageOK?b('本机保存可用：步骤、成绩与笔记保存在此浏览器。','Local saving is available: moves, records, and notes stay in this browser.'):b('本机保存不可用；仍可闯关并导出完整备份。','Local saving is unavailable; puzzles and full backup exports still work.');}
  function actionText(action,language=lang()){
    const words=(zh,en)=>language==='en'?en:zh;
    if(action[0]==='f')return words('装满 ','Fill ')+letter(+action[1]);
    if(action[0]==='e')return words('倒空 ','Empty ')+letter(+action[1]);
    return words('从 ','Pour ')+letter(+action[1])+words(' 倒入 ',' → ')+letter(+action[2]);
  }
  function record(){const d=draft(),l=current();if(!C.replay(l,d.path).won)return;const kind=d.assisted?'helped':'clean',r=state.records[l.id]||(state.records[l.id]={});if(!r[kind]||d.path.length<r[kind].length)r[kind]=[...d.path];}
  function move(action){
    const d=draft(),l=current(),before=C.replay(l,d.path);if(before.won)return;
    if(d.path.length>=C.MAX_MOVES){say('已达 200 步，请撤销或重开本关。','200-move limit reached. Undo or restart this puzzle.');return;}
    const next=C.step(l,before.state,action);if(!next){say('此操作不改变水量，或不符合本关管路。','That move changes no amount or is not allowed by this puzzle’s pipes.');return;}
    d.path.push(action);d.redo=[];hint=null;record();touch();render();say(actionText(action,'zh')+'。',actionText(action,'en')+'.');
  }
  function selectLevel(id){if(!C.level(id))return;state.level=id;source=0;hint=null;notice=null;touch();render();}
  function undo(){const d=draft();if(!d.path.length)return;d.redo.push(d.path.pop());hint=null;touch();render();say('已撤销一步；既有成绩保留。','One move undone; earned records are kept.');}
  function redo(){const d=draft();if(!d.redo.length)return;d.path.push(d.redo.pop());hint=null;record();touch();render();say('已重做一步。','One move redone.');}
  function renderLevels(){
    $('level').replaceChildren(...C.LEVELS.map(l=>{const o=el('option',String(l.number).padStart(2,'0')+' / '+pair(l.name));o.value=l.id;return o;}));$('level').value=state.level;
  }
  function renderJugs(l,s){
    $('jugs').replaceChildren(...l.caps.map((cap,i)=>{
      const card=el('section',undefined,'jug-card'+(source===i?' selected':''));card.dataset.jug=String(i);card.append(el('h4',letter(i)));
      const jar=el('div',undefined,'jar');jar.setAttribute('aria-hidden','true');const water=el('div',undefined,'water');water.style.height=s[i]/cap*100+'%';const mark=el('div',undefined,'target-line');mark.style.bottom=Math.min(98,l.goal[i]/cap*100)+'%';jar.append(water,mark);
      const value=el('span',s[i]+' / '+cap,'volume');value.id='volume-'+i;
      card.append(jar,value,el('small',b('目标 ','Target ')+l.goal[i]+(s[i]===l.goal[i]?b(' · 已匹配',' · matched'):'')));
      const select=el('button',source===i?b('来源 ','Source ')+letter(i):b('选择 ','Select ')+letter(i));select.dataset.source=String(i);select.setAttribute('aria-pressed',String(source===i));select.onclick=()=>{source=i;renderJugs(l,s);renderControls(l,s);document.querySelector('[data-source="'+i+'"]').focus();};card.append(select);return card;
    }));
  }
  function renderControls(l,s){
    const d=draft(),ended=C.won(l,s),limited=d.path.length>=C.MAX_MOVES;
    $('selection').textContent=b('当前来源：','Current source: ')+letter(source)+' · '+s[source]+' / '+l.caps[source];
    $('pourButtons').replaceChildren(...l.caps.map((_,j)=>{const button=el('button',b('倒入 ','Pour into ')+letter(j));button.dataset.pour=String(j);button.disabled=ended||limited||!C.step(l,s,'p'+source+j);button.onclick=()=>move('p'+source+j);if(!C.connected(l,source,j))button.title=source===j?b('不能倒向自己','Cannot pour into itself'):b('这两个容器没有管路连接','These vessels have no pipe connection');return button;}));
    $('tapControls').hidden=!l.tap;$('fill').disabled=ended||limited||!C.step(l,s,'f'+source);$('empty').disabled=ended||limited||!C.step(l,s,'e'+source);
    $('undo').disabled=!d.path.length;$('redo').disabled=!d.redo.length;$('next').disabled=l.number===C.LEVELS.length;
    $('hintButton').disabled=ended||limited;$('applyHint').disabled=ended||limited||!hint?.path.length;$('undoImport').disabled=!lastImport;
  }
  function renderRecords(){
    let completed=0,gold=0;
    $('records').replaceChildren(...C.LEVELS.map(l=>{const r=state.records[l.id]||{},clean=r.clean?.length,helped=r.helped?.length;if(clean||helped)completed++;if(clean===l.par)gold++;
      const card=el('article',undefined,'record'+(clean===l.par?' gold':''));card.append(el('strong',String(l.number).padStart(2,'0')+' · '+pair(l.name)),el('span',clean===l.par?b('◆ 最短独立','◆ Independent optimum'):clean?b('● 独立完成','● Independent finish'):helped?b('◇ 辅助完成','◇ Assisted finish'):b('尚未完成','Not completed'),'tag'));
      card.append(el('p',b('独立 / 辅助：','Independent / assisted: ')+(clean||'—')+' / '+(helped||'—')));const load=el('button',b('进入','Open'));load.dataset.openLevel=l.id;load.onclick=()=>{selectLevel(l.id);$('level').focus();$('level').scrollIntoView({block:'center'});};card.append(load);return card;}));
    $('recordCount').textContent=completed+' / 16'+b(' 已完成 · 金标 ',' completed · Gold ')+gold;
  }
  function renderLab(){
    if(!labResult){$('labResult').textContent=b('修改数值后点击检查。此试验不会移动主工作台的水。','Change the values, then check. This experiment does not move water on the main table.');return;}
    const {a,c,target,result}=labResult;if(!result){$('labResult').textContent=b('请输入 1–12 的整数。','Enter whole numbers from 1 to 12.');return;}
    $('labResult').textContent='gcd('+a+', '+c+') = '+result.divisor+'. '+b('目标 ','Target ')+target+(result.possible?b(' 在这些假设下可达。',' is reachable under these assumptions.'):b(' 在这些假设下不可达。',' is unreachable under these assumptions.'));
  }
  function render(){
    const focusedPour=document.activeElement?.dataset.pour;
    const l=current(),d=draft(),run=C.replay(l,d.path),s=run.state;source=Math.min(source,s.length-1);renderLevels();
    $('chapter').textContent=l.number<=4?b('入门 / 水源与余量','START / TAP & REMAINDERS'):l.number<=8?b('进阶 / 水量守恒','BUILD / CONSERVATION'):l.number<=10?b('组合 / 四个目标','COMBINE / FOUR TARGETS'):b('挑战 / 管路与规划','CHALLENGE / PIPES & PLANNING');
    $('levelName').textContent=String(l.number).padStart(2,'0')+' · '+pair(l.name);$('mode').textContent=l.tap?b('水源关：可装满、倒空或互倒。','Tap puzzle: fill, empty, or pour between vessels.'):b('闭合关：总量固定为 ','Closed puzzle: a fixed total of ')+l.start.reduce((s,n)=>s+n,0)+b(' 份；不能补水或排水。',' units; no filling or draining.');$('idea').textContent=pair(l.idea);
    $('goal').textContent=b('每一个目标都要满足：','Meet every target: ')+l.goal.map((n,i)=>letter(i)+' = '+n).join(' · ');
    $('pipes').replaceChildren(el('strong',l.links?b('仅限这些双向管路：','Only these two-way pipes: '):b('任意两容器均可互倒。','Every pair of vessels can pour both ways.')));
    if(l.links)$('pipes').append(document.createTextNode(l.links.map(([a,c])=>letter(a)+' ↔ '+letter(c)).join(' · ')));
    for(const [id,words]of Object.entries({movesLabel:['本次步数','Moves this attempt'],parLabel:['最短步数','Shortest solution'],bestLabel:['独立最好','Independent best']}))$(id).textContent=b(...words);
    $('moves').textContent=d.path.length;$('par').textContent=l.par;$('best').textContent=state.records[l.id]?.clean?.length||'—';
    renderJugs(l,s);renderControls(l,s);renderRecords();
    $('status').className='status'+(run.won?' win':'');$('status').textContent=run.won?b('全部目标满足！','Every target is met! ')+d.path.length+b(' 步 · ',' moves · ')+(d.assisted?b('辅助完成','Assisted finish'):d.path.length===l.par?b('最短独立完成 ◆','Independent optimum ◆'):b('独立完成','Independent finish')):b('已匹配 ','Matched ')+s.filter((n,i)=>n===l.goal[i]).length+' / '+s.length+b(' 个目标。匹配数量不一定逐步增加。',' targets. The count need not increase after every move.');
    $('attemptKind').textContent=d.assisted?b('本次：辅助尝试。重开可重新独立挑战。','This attempt is assisted. Restart to try independently.'):b('本次：独立尝试，尚未查看提示。','This attempt is independent; no hint requested.');
    $('hintText').textContent=hint?(hint.path.length?actionText(hint.path[0])+b('。从当前状态最少还需 ','. From here, a shortest route takes ')+hint.path.length+b(' 步。',' moves.'):b('已经到达目标。','Already at the target.')):b('建议默认隐藏，随时可以自己探索。','Hints start hidden. Explore in your own way.');
    $('history').replaceChildren(...d.path.map((a,i)=>el('li',actionText(a)+' → ['+run.states[i+1].join(', ')+']')));
    if($('note').value!==state.note)$('note').value=state.note;renderStorage();renderLab();$('notice').textContent=notice?b(...notice):'';
    if(focusedPour!==undefined){const button=document.querySelector('[data-pour="'+focusedPour+'"]');(button&&!button.disabled?button:$('undo')).focus({preventScroll:true});}
  }
  $('level').onchange=()=>selectLevel($('level').value);$('fill').onclick=()=>move('f'+source);$('empty').onclick=()=>move('e'+source);$('undo').onclick=undo;$('redo').onclick=redo;
  $('reset').onclick=()=>{state.drafts[state.level]=C.draft();hint=null;source=0;touch();render();say('已重开本关，成绩与其他关卡保留。','Puzzle restarted; records and other attempts are kept.');};
  $('next').onclick=()=>{const next=C.LEVELS[current().number];if(next)selectLevel(next.id);};
  $('hintButton').onclick=()=>{const d=draft();hint=C.solve(current(),C.replay(current(),d.path).state);d.assisted=true;touch();render();if(!hint)say('当前状态无法到达目标。可撤销或重开。','The goal is unreachable from here. Undo or restart.');};
  $('applyHint').onclick=()=>{if(hint?.path.length)move(hint.path[0]);};
  $('note').oninput=()=>{state.note=$('note').value;touch();};
  for(const id of ['labA','labB','labTarget'])$(id).oninput=()=>{labResult=null;renderLab();};
  $('labCheck').onclick=()=>{const a=Number($('labA').value),c=Number($('labB').value),target=Number($('labTarget').value);labResult={a,c,target,result:C.classic(a,c,target)};renderLab();};
  document.addEventListener('keydown',event=>{if(event.ctrlKey||event.altKey||event.metaKey||event.target.closest('input,textarea,select,[contenteditable]'))return;const k=event.key.toLowerCase();if(/^[1-4]$/.test(k)&&+k<=current().caps.length){event.preventDefault();source=+k-1;const l=current(),s=C.replay(l,draft().path).state;renderJugs(l,s);renderControls(l,s);}else if(k==='u'){event.preventDefault();undo();}else if(k==='y'){event.preventDefault();redo();}});
  function download(file,text,type){const url=URL.createObjectURL(new Blob([text],{type})),a=el('a');a.href=url;a.download=file;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);say('已准备下载文件。','File prepared for download.');}
  $('exportJson').onclick=()=>download('011-measure-quest.json',JSON.stringify(state),'application/json');
  $('exportTxt').onclick=()=>{const l=current(),d=draft(),run=C.replay(l,d.path);const text=['011 · '+b('瓶中分寸','Measure Quest'),String(l.number).padStart(2,'0')+' · '+pair(l.name),b('容量：','Capacities: ')+l.caps.join(', '),b('起点：','Start: ')+l.start.join(', '),b('目标：','Goal: ')+l.goal.join(', '),b('当前：','Current: ')+run.state.join(', '),b('步数：','Moves: ')+d.path.length+' / '+l.par,d.assisted?b('辅助尝试','Assisted attempt'):b('独立尝试','Independent attempt'),'',...d.path.map((a,i)=>(i+1)+'. '+actionText(a)+' → ['+run.states[i+1].join(', ')+']'),'',b('自己的笔记：','Your notes: '),state.note].join('\n');download('011-'+l.id+'-log.txt',text,'text/plain;charset=utf-8');};
  $('importFile').onchange=async()=>{const file=$('importFile').files[0];$('importFile').value='';if(!file)return;try{if(file.size>150000)throw new Error();const next=C.restore(JSON.parse(await file.text()));if(!next)throw new Error();lastImport=C.copy(state);state=next;source=0;hint=null;save();render();say('备份已导入；继续操作前可以撤销导入。','Backup imported; undo the import before further activity.');}catch{say('未导入：文件无效、步骤无法验证或超过 150 KB。原记录保留。','Not imported: invalid, unverifiable moves, or over 150 KB. Existing records were kept.');}};
  $('undoImport').onclick=()=>{if(!lastImport)return;state=lastImport;lastImport=null;source=0;hint=null;save();render();say('已恢复导入前的全部记录。','All records from before the import were restored.');};
  window.addEventListener('programlanguagechange',render);render();
})();
