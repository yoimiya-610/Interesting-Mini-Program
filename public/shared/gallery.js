'use strict';
(() => {
  const KEY='imp-gallery-language-v1',cards=[...document.querySelectorAll('.card')],search=document.getElementById('search');
  let language='zh',category='全部';
  const valid=value=>value==='zh'||value==='en';
  function filter(){
    const term=search.value.trim().toLowerCase();let count=0;
    for(const card of cards){const show=(category==='全部'||card.dataset.category===category)&&card.dataset.search.includes(term);card.hidden=!show;if(show)count++;}
    document.getElementById('resultCount').textContent=language==='zh'?count+' 个小程序':count+' '+(count===1?'program':'programs');
    document.getElementById('empty').classList.toggle('on',count===0);
    document.getElementById('coming').hidden=Boolean(term)||category!=='全部';
  }
  function renderLanguage(){
    document.documentElement.lang=language==='zh'?'zh-CN':'en';
    document.querySelectorAll('[data-zh][data-en]').forEach(node=>node.textContent=node.getAttribute('data-'+language));
    for(const attribute of ['aria-label','placeholder','content'])document.querySelectorAll('[data-zh-'+attribute+']').forEach(node=>node.setAttribute(attribute,node.getAttribute('data-'+language+'-'+attribute)));
    document.querySelectorAll('[data-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===language)));
    document.getElementById('programLanguage').hidden=language!=='en';
    for(const card of cards){const url=new URL(card.href,location.href);url.searchParams.set('lang',language);card.href=url.href;}
    for(const card of cards){if(language==='en')card.setAttribute('aria-describedby','programLanguage');else card.removeAttribute('aria-describedby');}
    filter();
  }
  function selectLanguage(next){
    if(!valid(next))return;language=next;renderLanguage();
    try{localStorage.setItem(KEY,language);document.getElementById('languageNotice').hidden=true;}
    catch{document.getElementById('languageNotice').hidden=false;}
    try{const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState(null,'',url.href);}catch{/* File URLs may restrict history updates. */}
  }
  let saved;try{saved=localStorage.getItem(KEY);}catch{/* Switching remains available without storage. */}
  const requested=new URLSearchParams(location.search).get('lang');
  language=valid(requested)?requested:valid(saved)?saved:'zh';
  document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>selectLanguage(button.dataset.language)));
  search.addEventListener('input',filter);
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    category=button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(other=>{const selected=other===button;other.classList.toggle('active',selected);other.setAttribute('aria-pressed',String(selected));});
    filter();
  }));
  renderLanguage();
})();
