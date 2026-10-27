import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const programs=JSON.parse(await readFile(new URL('../programs.json',import.meta.url),'utf8'));
const total=programs.length,games=programs.filter(p=>p.category==='游戏').length;
const key='imp-gallery-language-v1';
const english=page=>page.getByRole('button',{name:'English',exact:true});
const chinese=page=>page.getByRole('button',{name:'中文',exact:true});

test('首页完整切换介绍、全部卡片、分类与无障碍语言',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.locator('html')).toHaveAttribute('lang','zh-CN');await english(page).click();await expect(page.locator('html')).toHaveAttribute('lang','en');await expect(page).toHaveTitle('Interesting Mini Program · Small things to try');await expect(english(page)).toHaveAttribute('aria-pressed','true');await expect(chinese(page)).toHaveAttribute('aria-pressed','false');await expect(page.getByRole('heading',{level:1})).toHaveText('Every day,something new.');
  for(const name of programs.map(p=>p.id+' '+p.en.title))await expect(page.getByRole('link',{name,exact:true})).toBeVisible();await expect(page.getByRole('searchbox',{name:'Search programs'})).toHaveAttribute('placeholder','Search number, name, idea…');await expect(page.getByRole('group',{name:'Filter by category'})).toBeVisible();await expect(page.locator('#resultCount')).toHaveText(total+' programs');await expect(page.locator('#programLanguage')).toBeVisible();await expect(page.locator('.note')).toContainText('Thanks for stopping by');expect(await page.locator('main').innerText()).not.toMatch(/[\u3400-\u9fff]/);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();expect(errors).toEqual([]);
  await page.screenshot({path:testInfo.outputPath('home-en-typography.png'),fullPage:true,animations:'disabled'});await chinese(page).click();await expect(page.locator('#programLanguage')).toBeHidden();await expect(page.locator('html')).toHaveAttribute('lang','zh-CN');await expect(page.getByRole('link',{name:'006 折光小径',exact:true})).toBeVisible();
});

test('跨语言搜索与筛选在切换时保留，计数和空结果同步翻译',async({page})=>{
  await page.goto('/?lang=en');await page.getByRole('button',{name:'Games',exact:true}).click();await expect(page.locator('#resultCount')).toHaveText(games+' programs');await page.locator('#search').fill('Light Path');await expect(page.locator('#resultCount')).toHaveText('1 program');await expect(page.getByRole('link',{name:'006 Light Path',exact:true})).toBeVisible();await chinese(page).click();await expect(page.getByRole('button',{name:'游戏',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.locator('#search')).toHaveValue('Light Path');await expect(page.locator('#resultCount')).toHaveText('1 个小程序');await english(page).click();await page.getByRole('button',{name:'Engineering',exact:true}).click();await page.locator('#search').fill('逻辑');await expect(page.getByRole('link',{name:'005 Logic Patch',exact:true})).toBeVisible();await page.locator('#search').fill('no-such-program');await expect(page.locator('#empty')).toContainText('No programs match');await expect(page.locator('#resultCount')).toHaveText('0 programs');await chinese(page).click();await expect(page.locator('#empty')).toContainText('没有匹配');await page.locator('#search').fill('');await page.getByRole('button',{name:'全部',exact:true}).click();await expect(page.locator('#resultCount')).toHaveText(total+' 个小程序');
});

test('记住语言偏好，中文程序返回后恢复英文主页',async({page})=>{
  await page.goto('/');await english(page).click();expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe('en');await page.goto('/');await expect(page.locator('html')).toHaveAttribute('lang','en');await page.reload();await expect(page.getByRole('link',{name:'001 Orbit Garden',exact:true})).toBeVisible();await page.getByRole('link',{name:'001 Orbit Garden',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('lang','zh-CN');await expect(page).toHaveTitle(/^001/);await page.getByRole('link',{name:'← 返回小程序索引',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('lang','en');await expect(english(page)).toHaveAttribute('aria-pressed','true');
});

test('键盘切换与语言直达链接保留其他参数和页面锚点',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('imp-gallery-language-v1','zh'));await page.goto('/?lang=en&ref=share#collection');await expect(page.locator('html')).toHaveAttribute('lang','en');await chinese(page).press('Space');await expect(page.locator('html')).toHaveAttribute('lang','zh-CN');await english(page).press('Enter');await expect(page.locator('html')).toHaveAttribute('lang','en');const url=new URL(page.url());expect(url.searchParams.get('lang')).toBe('en');expect(url.searchParams.get('ref')).toBe('share');expect(url.hash).toBe('#collection');
});

test('存储不可用时仍可切换、搜索和刷新，提示不假报保存成功',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{Storage.prototype.getItem=function(){throw new DOMException('Blocked','SecurityError');};Storage.prototype.setItem=function(){throw new DOMException('Blocked','SecurityError');};});await page.goto('/');await english(page).click();await expect(page.locator('#languageNotice')).toContainText('could not be saved');await page.locator('#search').fill('writing');await expect(page.getByRole('link',{name:'002 Story Fold',exact:true})).toBeVisible();await page.reload();await expect(page.locator('html')).toHaveAttribute('lang','en');await chinese(page).click();await expect(page.locator('#languageNotice')).toContainText('无法保存语言偏好');expect(errors).toEqual([]);
});

test('未知语言偏好与参数安全回退到中文',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('imp-gallery-language-v1','fr'));await page.goto('/?lang=invalid');await expect(page.locator('html')).toHaveAttribute('lang','zh-CN');await expect(page.getByRole('link',{name:'003 概率落雨',exact:true})).toBeVisible();await english(page).click();await expect(page.getByRole('link',{name:'003 Probability Rain',exact:true})).toBeVisible();
});

test('断网 file:// 可切换英文并往返中文程序',async({page,context})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await context.setOffline(true);await page.goto(new URL('../public/index.html',import.meta.url).href);await english(page).click();await expect(page.locator('html')).toHaveAttribute('lang','en');await page.locator('#search').fill('006');await page.getByRole('link',{name:'006 Light Path',exact:true}).click();await expect(page).toHaveTitle(/^006/);await page.getByRole('link',{name:'← 小程序索引',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('lang','en');await expect(page.getByRole('link',{name:'006 Light Path',exact:true})).toBeVisible();expect(errors).toEqual([]);
});
