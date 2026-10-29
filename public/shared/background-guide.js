'use strict';
(() => {
  const data=globalThis.ProgramBackground;
  if(!data||document.getElementById('programBackground'))return;
  const target=document.querySelector(data.target);
  if(!target)throw new Error('Background guide placement is unavailable');
  const bindings=[],node=(tag,cls)=>{const el=document.createElement(tag);if(cls)el.className=cls;return el;};
  function copy(tag,pair,cls){const el=node(tag,cls);bindings.push([el,pair]);return el;}
  const root=node('section','background-guide');root.id='programBackground';root.dataset.userContent='';root.setAttribute('role','complementary');root.setAttribute('aria-labelledby','backgroundHeading');root.style.setProperty('--guide-accent',data.accent);
  const heading=copy('h3',data.title);heading.id='backgroundHeading';root.append(heading,copy('p',data.lead,'background-lead'));
  const detail=node('details');detail.id='backgroundDetails';detail.append(copy('summary',['背景、方法与例子','Background, method, and examples']));
  const content=node('div','background-content');
  data.sections.forEach((section,index)=>{
    const part=node('section','background-section'),title=copy('h4',section.title);title.id='backgroundPart'+index;part.setAttribute('aria-labelledby',title.id);part.append(title);
    for(const paragraph of section.paragraphs)part.append(copy('p',paragraph));
    if(section.sources?.length){const references=node('p','background-sources');references.append(copy('span',['参考：','Sources: ']));section.sources.forEach((source,i)=>{if(i)references.append(document.createTextNode(' · '));const link=node('a');link.textContent=source.label;link.href=source.href;link.target='_blank';link.rel='noopener noreferrer';references.append(link);});part.append(references);}
    content.append(part);
  });
  detail.append(content);root.append(detail);
  function render(){const index=ProgramLanguage.language==='en'?1:0;for(const [el,pair]of bindings)el.textContent=pair[index];}
  render();target[data.position==='prepend'?'prepend':'append'](root);
  window.addEventListener('programlanguagechange',render);
})();
