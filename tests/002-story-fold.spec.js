import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const path='/apps/002-story-fold/index.html';
test('002 索引、卡片锁定、气质切换和手机布局',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.getByPlaceholder('搜编号、名称或灵感…').fill('002');
  await page.getByRole('link',{name:'002 故事折叠机'}).click();await expect(page).toHaveTitle(/^002/);
  const character=await page.locator('#card0').textContent(),place=await page.locator('#card1').textContent();
  await page.getByRole('button',{name:'锁定人物卡',exact:true}).click();
  await page.locator('#shuffle').click();await expect(page.locator('#card0')).toHaveText(character);
  await expect(page.locator('#card1')).not.toHaveText(place);
  await page.getByRole('button',{name:'悬疑冒险',exact:true}).click();
  await expect(page.locator('#card0')).toHaveText(character);await expect(page.locator('[data-tone="mystery"]')).toHaveAttribute('aria-pressed','true');
  for(const label of ['锁定场景卡','锁定目标卡','锁定转折卡'])await page.getByRole('button',{name:label,exact:true}).click();
  const prompt=await page.locator('#prompt').textContent();await page.locator('#shuffle').click();
  await expect(page.locator('#notice')).toContainText('四张卡都已锁定');await expect(page.locator('#prompt')).toHaveText(prompt);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();expect(errors).toEqual([]);
});
test('当前内容刷新恢复、快照载入与删除可撤销、TXT 含完整正文',async({page})=>{
  await page.goto(path);await page.locator('#save').click();await expect(page.locator('#notice')).toContainText('先写一句话');
  await page.getByLabel('故事标题',{exact:true}).fill('凌晨的书店');
  await page.getByLabel('故事正文',{exact:true}).fill('旧书里夹着一封信。\n收信人是明天的我。');
  await page.getByRole('button',{name:'锁定人物卡',exact:true}).click();const character=await page.locator('#card0').textContent();
  await page.reload();await expect(page.locator('#title')).toHaveValue('凌晨的书店');await expect(page.locator('#body')).toHaveValue('旧书里夹着一封信。\n收信人是明天的我。');await expect(page.locator('#card0')).toHaveText(character);await expect(page.locator('[data-lock="0"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('#save').click();await expect(page.locator('#draftCount')).toHaveText('1');
  await page.locator('#save').click();await expect(page.locator('#draftCount')).toHaveText('1');await expect(page.locator('#notice')).toContainText('已经保存过');
  await page.locator('#body').fill('这是载入前的新内容。');await page.getByRole('button',{name:'载入草稿：凌晨的书店',exact:true}).click();await expect(page.locator('#body')).toHaveValue('旧书里夹着一封信。\n收信人是明天的我。');
  await page.getByRole('button',{name:'撤销载入',exact:true}).click();await expect(page.locator('#body')).toHaveValue('这是载入前的新内容。');
  await page.getByRole('button',{name:'删除草稿：凌晨的书店',exact:true}).click();await expect(page.locator('#draftCount')).toHaveText('0');await page.getByRole('button',{name:'撤销删除',exact:true}).click();await expect(page.locator('#draftCount')).toHaveText('1');
  const waiting=page.waitForEvent('download');await page.locator('#export').click();const file=await waiting;expect(file.suggestedFilename()).toBe('002-凌晨的书店.txt');
  const text=await readFile(await file.path(),'utf8');expect(text).toContain('这是载入前的新内容。');expect(text).toContain('人物：'+character);expect(text).toContain('002 · 故事折叠机');
});
test('三分钟计时可暂停、到时保留正文、重置不清空',async({page})=>{
  await page.clock.install();await page.goto(path);await page.locator('#body').fill('计时结束后，故事还可以继续。');
  await page.locator('#timerToggle').click();await page.clock.runFor(1500);await expect(page.locator('#clock')).not.toHaveText('03:00');
  await page.locator('#timerToggle').click();const paused=await page.locator('#clock').textContent();await page.clock.fastForward(60000);await expect(page.locator('#clock')).toHaveText(paused);
  await page.locator('#timerToggle').click();await page.clock.fastForward(180000);await expect(page.locator('#clock')).toHaveText('00:00');await expect(page.locator('#notice')).toContainText('三分钟到了');await expect(page.locator('#body')).toHaveValue('计时结束后，故事还可以继续。');
  await page.locator('#timerReset').click();await expect(page.locator('#clock')).toHaveText('03:00');await expect(page.locator('#body')).toHaveValue('计时结束后，故事还可以继续。');
});
test('纯离线文件导航和灵感交互不需要网络',async({page,context})=>{
  await context.setOffline(true);await page.goto(new URL('../public/index.html',import.meta.url).href);await page.getByRole('link',{name:'002 故事折叠机',exact:true}).click();await expect(page).toHaveTitle(/^002/);
  const old=await page.locator('#card2').textContent();await page.locator('#shuffle').click();await expect(page.locator('#card2')).not.toHaveText(old);
  await page.getByRole('link',{name:'← 小程序索引',exact:true}).click();await expect(page).toHaveTitle(/Interesting Mini Program/);
});
test('损坏的存储可恢复使用，存储失败不会假报保存成功',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('story-fold-002-current-v1','{broken');
    localStorage.setItem('story-fold-002-shelf-v1',JSON.stringify([{tone:'gentle',cards:['人物','场景','目标','转折'],locks:[false,false,false,false],title:'独立保存的故事',body:'当前草稿损坏时，这篇仍应保留。',remaining:180000,id:'safe-snapshot',savedAt:Date.now()}]));
  });await page.goto(path);await expect(page.locator('#notice')).toContainText('无法读取');await expect(page.locator('#draftCount')).toHaveText('1');await expect(page.getByRole('button',{name:'载入草稿：独立保存的故事',exact:true})).toBeVisible();await page.locator('#body').fill('仍然可以开始新的故事。');
  await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError');};});
  await page.locator('#save').click();await expect(page.locator('#notice')).toContainText('本机存储不可用');await expect(page.locator('#draftCount')).toHaveText('1');await expect(page.locator('#body')).toHaveValue('仍然可以开始新的故事。');
});
test('故事集写满不会覆盖已有快照，非法日期数据不会导致页面崩溃',async({page})=>{
  await page.addInitScript(()=>{
    const draft={tone:'gentle',cards:['人物','场景','目标','转折'],locks:[false,false,false,false],title:'已有故事',body:'保留这篇。',remaining:180000};
    const shelf=Array.from({length:12},(_,i)=>({...draft,id:String(i),title:'已有故事'+i,savedAt:Date.now()-i*1000}));
    shelf.unshift({...draft,id:'bad-date',savedAt:Number.MAX_VALUE});
    localStorage.setItem('story-fold-002-shelf-v1',JSON.stringify(shelf));
  });
  await page.goto(path);await expect(page.locator('#draftCount')).toHaveText('12');await page.locator('#body').fill('新的故事不能覆盖旧作。');await page.locator('#save').click();await expect(page.locator('#notice')).toContainText('已满 12 篇');await expect(page.locator('#draftCount')).toHaveText('12');await expect(page.getByRole('button',{name:'载入草稿：已有故事0',exact:true})).toBeVisible();
});
