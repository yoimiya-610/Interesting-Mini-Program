(function(root){
  'use strict';
  const PASSAGES=[
    {id:'station',name:['慢车站台','The slow-train platform'],words:[['清晨','At dawn'],['，',','],['车站','the station'],['把','holds'],['最后','the last'],['一盏','small'],['灯','light'],['留给','for'],['赶路的人','a traveler'],['。','.'],['风','Wind'],['翻过','turns over'],['空白','blank'],['的','paper'],['车票','tickets'],['，',','],['远处','far away'],['一列','a'],['慢车','slow train'],['穿过','passes through'],['雾','mist'],['。','.'],['我','I'],['把','put'],['没有说完','unfinished'],['的话','words'],['折进','inside'],['口袋','a pocket'],['，',','],['等','waiting for'],['下一次','the next'],['相逢','meeting'],['。','.']],sample:[2,3,6,7,8,10,19,20,22,23,24,25,26,27],breaks:[8,20]},
    {id:'rain',name:['雨天的窗','A window in the rain'],words:[['午后','In the afternoon'],['，',','],['雨','rain'],['敲着','taps'],['窗沿','the windowsill'],['。','.'],['一杯','A cup of'],['热茶','warm tea'],['在','on'],['桌上','the table'],['慢慢','slowly'],['变凉','cools'],['，',','],['旧书','an old book'],['替','holds'],['远方','distant places'],['保管','inside'],['一片','a'],['树叶','leaf'],['。','.'],['城市','The city'],['暂时','briefly'],['放下','sets down'],['匆忙','its hurry'],['，',','],['我们','we'],['听见','hear'],['时间','time'],['从','through'],['指间','our fingers'],['轻轻','quietly'],['流过','flowing'],['。','.']],sample:[2,3,4,13,14,15,18,25,26,27,30,31],breaks:[4,18]},
    {id:'shore',name:['海边的书架','The seaside bookshelf'],words:[['傍晚','At dusk'],['，',','],['海','the sea'],['把','folds'],['蓝色','blue'],['折成','into'],['一封','a'],['长信','long letter'],['。','.'],['书架','A bookshelf'],['靠着','rests against'],['窗','the window'],['，',','],['每一本','each'],['旧书','old book'],['都','still'],['记得','remembers'],['一双','a pair of'],['手','hands'],['。','.'],['潮水','The tide'],['带走','carries away'],['脚印','footprints'],['，',','],['留下','leaving'],['一小块','a small patch of'],['安静','quiet'],['，',','],['让','so'],['明天','tomorrow'],['有地方','has room'],['开始','to begin'],['。','.']],sample:[2,3,4,5,6,7,9,16,18,20,21,22,24,26],breaks:[7,18,22]}
  ].map(p=>Object.freeze({...p,words:Object.freeze(p.words.map(w=>Object.freeze(w))),sample:Object.freeze(p.sample),breaks:Object.freeze(p.breaks),name:Object.freeze(p.name)}));
  const selectable=text=>/[\p{L}\p{N}]/u.test(text);
  function tokenize(text){
    if(typeof text!=='string'||!text.trim()||Array.from(text).length>1200)throw new RangeError('Source must contain 1–1200 characters');
    const words=text.match(/\p{Script=Han}|[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*|[^\p{L}\p{N}]/gu)||[];
    if(words.filter(selectable).length>180)throw new RangeError('Source must contain at most 180 selectable words or Chinese characters');
    if(!words.some(selectable))throw new RangeError('Source needs at least one word');return words;
  }
  function wordsFor(source,custom,language='zh'){if(source==='custom')return tokenize(custom);const passage=PASSAGES.find(p=>p.id===source);if(!passage)throw new RangeError('Unknown passage');return passage.words.map(pair=>pair[language==='en'?1:0]);}
  function normalize(draft,words){
    const selected=[...new Set(Array.isArray(draft?.selected)?draft.selected:[])].filter(i=>Number.isInteger(i)&&i>=0&&i<words.length&&selectable(words[i])).sort((a,b)=>a-b);
    const breaks=[...new Set(Array.isArray(draft?.breaks)?draft.breaks:[])].filter(i=>selected.includes(i)).sort((a,b)=>a-b);
    return {title:typeof draft?.title==='string'?Array.from(draft.title).slice(0,60).join(''):'',selected,breaks};
  }
  function join(words,language){if(language==='auto')return words.reduce((out,word)=>out+(out&&!(/\p{Script=Han}$/u.test(out)&&/^\p{Script=Han}/u.test(word))?' ':'')+word,'');return language==='en'?words.join(' ').replace(/\s+([,.;:!?])/g,'$1'):words.join('');}
  function poem(words,draft,language='zh'){
    const data=normalize(draft,words),lines=[],line=[];
    for(const index of data.selected){line.push(words[index]);if(data.breaks.includes(index)){lines.push(join(line,language));line.length=0;}}
    if(line.length)lines.push(join(line,language));return lines;
  }
  function original(words,language){return language==='en'?words.join(' ').replace(/\s+([,.;:!?])/g,'$1'):words.join('');}
  function restore(raw){
    if(!raw||raw.version!==1||typeof raw!=='object'||Array.isArray(raw))return null;
    let custom='';try{if(raw.custom){tokenize(raw.custom);custom=raw.custom;}}catch{}
    const sources=[...PASSAGES.map(p=>p.id),...(custom?['custom']:[])],source=sources.includes(raw.source)?raw.source:PASSAGES[0].id,drafts={};
    for(const id of sources)drafts[id]=normalize(raw.drafts?.[id],wordsFor(id,custom));
    return {source,custom,drafts,cover:raw.cover===true};
  }
  function wrap(lines,width=42){
    const result=[];for(const line of lines){let out='',cost=0;for(const ch of line){const n=/[\u3400-\u9fff]|\p{Extended_Pictographic}/u.test(ch)?2:/[WM@]/.test(ch)?1.7:1;if(cost+n>width){result.push(out);out='';cost=0;}out+=ch;cost+=n;}result.push(out);}return result;
  }
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  function svg(title,lines,source,language='zh'){
    const body=wrap(lines),heading=wrap([title|| (language==='en'?'Untitled poem':'未命名的诗')],32),height=Math.max(560,260+heading.length*40+body.length*36);
    return '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="'+height+'" viewBox="0 0 720 '+height+'"><title>'+escape(title||'007 · Erasure Poems')+'</title><rect width="720" height="'+height+'" fill="#f6f0e4"/><path d="M 54 54 H 666" stroke="#a53d30" stroke-width="3"/><text x="54" y="88" font-family="Arial, SimHei, sans-serif" font-size="16" fill="#a53d30">007 / ERASURE POEMS</text><g font-family="Times New Roman, SimSun, serif" fill="#24221f">'+heading.map((line,i)=>'<text x="54" y="'+(146+i*40)+'" font-size="30">'+escape(line)+'</text>').join('')+body.map((line,i)=>'<text xml:space="preserve" x="54" y="'+(190+heading.length*40+i*36)+'" font-size="24">'+escape(line)+'</text>').join('')+'</g><text x="54" y="'+(height-40)+'" font-family="Arial, SimHei, sans-serif" font-size="14" fill="#6b625a">'+escape((language==='en'?'Source: ':'底稿：')+Array.from(source).slice(0,60).join(''))+'</text></svg>';
  }
  root.ErasurePoems=Object.freeze({PASSAGES,selectable,tokenize,wordsFor,normalize,poem,original,restore,wrap,svg});
})(globalThis);
