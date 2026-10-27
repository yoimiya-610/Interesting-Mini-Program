import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const programs=JSON.parse(await readFile(new URL('../programs.json',import.meta.url),'utf8'));
const pages=[{id:'index',path:'/'},...programs.map(p=>({id:p.id,path:'/apps/'+p.id+'-'+p.slug+'/index.html'}))];

for(const entry of pages)test(entry.id+' 字体、可读字号和放大后的控件布局',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(entry.path);
  if(entry.id==='005'){await page.locator('#challengeMode').click();await page.locator('#puzzle').selectOption('stock-conditional');}
  if(entry.id==='006')await page.locator('#level').selectOption('linked-finale');
  await expect(page.locator('body')).toHaveCSS('font-size','18px');
  const report=await page.evaluate(()=>{
    const visible=n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return s.visibility!=='hidden'&&s.display!=='none'&&r.width>0&&r.height>0;};
    const textParents=new Set(),walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){const n=walker.currentNode.parentElement;if(walker.currentNode.textContent.trim()&&n&&!['SCRIPT','STYLE','OPTION'].includes(n.tagName)&&visible(n))textParents.add(n);}
    const small=[...textParents].filter(n=>parseFloat(getComputedStyle(n).fontSize)<14).map(n=>({tag:n.tagName,text:n.textContent.trim().slice(0,45),size:getComputedStyle(n).fontSize}));
    const controls=[...document.querySelectorAll('button,input:not([type=range]):not([type=checkbox]),select,textarea')].filter(visible);
    const undersized=controls.filter(n=>parseFloat(getComputedStyle(n).fontSize)<16).map(n=>n.id||n.textContent.slice(0,30));
    const clipped=controls.filter(n=>n.tagName==='BUTTON'&&!n.classList.contains('cell')&&n.scrollHeight>n.clientHeight+2).map(n=>({id:n.id,text:n.textContent.slice(0,30),scroll:n.scrollHeight,height:n.clientHeight}));
    return {small,undersized,clipped,overflow:document.documentElement.scrollWidth>innerWidth,bodyFont:getComputedStyle(document.body).fontFamily,titleFont:getComputedStyle(document.querySelector('h1')).fontFamily};
  });
  expect.soft(report.small,'visible text sizes').toEqual([]);expect.soft(report.undersized,'control text sizes').toEqual([]);expect.soft(report.clipped,'button text clipping').toEqual([]);expect.soft(report.overflow,'horizontal page overflow').toBe(false);expect(report.bodyFont).toContain('Arial');expect(report.bodyFont).toContain('SimHei');expect(report.titleFont).toContain('Times New Roman');expect(errors).toEqual([]);
  await page.screenshot({path:testInfo.outputPath(entry.id+'-typography.png'),fullPage:true,animations:'disabled'});
});

test('断网文件模式也加载统一字号与字体',async({page,context})=>{
  await context.setOffline(true);await page.goto(new URL('../public/index.html',import.meta.url).href);await expect(page.locator('body')).toHaveCSS('font-size','18px');await page.getByRole('link',{name:'006 折光小径',exact:true}).click();await expect(page.locator('body')).toHaveCSS('font-family',/Arial.*SimHei/);await expect(page.locator('#level')).toHaveCSS('font-size','16px');await page.locator('#mirror-A').click();await expect(page.locator('#status')).toHaveClass(/success/);
});
