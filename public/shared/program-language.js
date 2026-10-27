'use strict';
/* Local dictionaries translate presentation only. Program state and user writing
   keep their original values, so changing language never restarts an activity. */
(() => {
  const KEY='imp-gallery-language-v1',valid=v=>v==='zh'||v==='en';
  let saved;try{saved=localStorage.getItem(KEY);}catch{}
  const requested=new URLSearchParams(location.search).get('lang');
  let language=valid(requested)?requested:valid(saved)?saved:'zh',observer;
  const texts=new WeakMap(),attributes=new WeakMap(),users=new Map(),userTokens=new Map(),localLinks=new Map();let nextUser=0;
  const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const dictionary=Object.assign({
    '← 小程序索引':'← All programs','← 返回小程序索引':'← All programs',
    '语言已切换，但无法保存偏好。':'Language switched, but your preference could not be saved.'
  },globalThis.ProgramEnglish||{});
  const pattern=new RegExp(Object.keys(dictionary).sort((a,b)=>b.length-a.length).map(escape).join('|'),'g');
  function user(value){value=String(value);if(userTokens.has(value))return userTokens.get(value);const token='\uE000'+nextUser+++'\uE001';users.set(token,value);userTokens.set(value,token);return token;}
  function translate(value,lang=language){
    let source=String(value),result=source;
    if(lang==='en'&&/[\u3400-\u9fff]/.test(source)){
      const story=source.match(/^(.+)来到(.+)，想要(.+)。偏偏这时，(.+)……$/);
      if(story)result=translate(story[1],lang)+' arrives at '+translate(story[2],lang)+', hoping to '+translate(story[3],lang)+'. But '+translate(story[4],lang)+'…';
      else result=source.replace(pattern,match=>dictionary[match]);
      result=result.replace(/，/g,', ').replace(/。/g,'. ').replace(/；/g,'; ').replace(/：/g,': ').replace(/、/g,', ').replace(/「|」/g,'"').replace(/（/g,' (').replace(/）/g,')').replace(/！/g,'! ').replace(/？/g,'? ');
    }
    return result.replace(/\uE000\d+\uE001/g,token=>users.get(token)??token);
  }
  function binding(node,key,current,write,map){
    let state=map.get(node);if(!state){state={};map.set(node,state);}
    const previous=state[key],source=previous&&previous.rendered===current?previous.source:current;
    const rendered=translate(source);state[key]={source,rendered};if(current!==rendered)write(rendered);
  }
  function visit(root){
    if(root.nodeType===3){if(!root.parentElement?.closest('script,style,[data-user-content],.program-language'))binding(root,'text',root.nodeValue,value=>root.nodeValue=value,texts);return;}
    if(root.nodeType!==1||root.matches('script,style,[data-user-content],.program-language'))return;
    for(const name of ['aria-label','placeholder','title','content'])if(root.hasAttribute(name))binding(root,name,root.getAttribute(name),value=>root.setAttribute(name,value),attributes);
    for(const child of root.childNodes)visit(child);
  }
  function links(){for(const a of document.querySelectorAll('a[href]')){
    const raw=localLinks.get(a)||a.getAttribute('href');if(!localLinks.has(a)&&!/^(?:\.\.\/)*index\.html(?:[?#]|$)/.test(raw)&&!/^apps\//.test(raw))continue;
    localLinks.set(a,raw);const url=new URL(raw,location.href);url.searchParams.set('lang',language);a.setAttribute('href',url.href);
  }}
  function refresh(){
    observer?.disconnect();visit(document.head);visit(document.body);document.documentElement.lang=language==='en'?'en':'zh-CN';
    for(const button of document.querySelectorAll('[data-program-language]'))button.setAttribute('aria-pressed',String(button.dataset.programLanguage===language));
    links();observer?.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','title','content']});
  }
  function select(next){
    if(!valid(next))return;language=next;refresh();
    const notice=document.getElementById('programLanguageNotice');
    try{localStorage.setItem(KEY,language);notice.hidden=true;}catch{notice.hidden=false;notice.textContent=translate('语言已切换，但无法保存偏好。');}
    try{const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState(null,'',url.href);}catch{}
    window.dispatchEvent(new Event('programlanguagechange'));
  }
  globalThis.ProgramLanguage=Object.freeze({t:translate,user,get language(){return language;},refresh});
  document.addEventListener('DOMContentLoaded',()=>{
    const bar=document.createElement('div');bar.className='program-language';bar.setAttribute('role','group');bar.setAttribute('aria-label','页面语言 / Page language');
    for(const [lang,label] of [['zh','中文'],['en','English']]){const button=document.createElement('button');button.type='button';button.dataset.programLanguage=lang;button.lang=lang==='zh'?'zh-CN':'en';button.textContent=label;button.onclick=()=>select(lang);bar.append(button);}
    const notice=document.createElement('span');notice.id='programLanguageNotice';notice.hidden=true;notice.setAttribute('role','status');bar.append(notice);
    document.querySelector('header').after(bar);
    observer=new MutationObserver(records=>{
      observer.disconnect();for(const record of records){if(record.type==='childList')for(const node of record.addedNodes)visit(node);else visit(record.target);}observe();
    });
    function observe(){observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','title','content']});}
    refresh();
  });
})();
