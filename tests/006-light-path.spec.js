import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const path='/apps/006-light-path/index.html';
const key='light-path-006-v1';
const solutions=[['first-turn',['A']],['two-corners',['A']],['starlight',['A','B']],['return-route',['B','C']],['long-way',['A','C','E']],['crossing',['A','B','D','F']]];
async function rotate(page,ids){for(const id of ids)await page.locator('#mirror-'+id).click();}

test('006 编号入口、键盘旋转与手机布局',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.getByPlaceholder('搜编号、名称或灵感…').fill('006');await page.getByRole('link',{name:'006 折光小径',exact:true}).click();await expect(page).toHaveTitle(/^006/);await expect(page.locator('#board .cell')).toHaveCount(49);await expect(page.locator('#status')).not.toHaveClass(/success/);await page.getByRole('button',{name:'旋转镜片 A',exact:true}).press('Space');await expect(page.locator('#status')).toHaveClass(/success/);await expect(page.locator('#goal')).toHaveClass(/won/);await expect(page.locator('#moves')).toHaveText('1');await expect(page.locator('#stars')).toHaveText('2');await expect(page.locator('#best')).toHaveText('1');await expect(page.locator('#completed')).toHaveText('1 / 6');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();expect(errors).toEqual([]);
});

test('撤销、重置和刷新恢复当前光路，保留完成纪录',async({page})=>{
  await page.goto(path);await rotate(page,['A']);await page.locator('#undo').click();await expect(page.locator('#moves')).toHaveText('0');await expect(page.locator('#status')).not.toHaveClass(/success/);await expect(page.locator('#best')).toHaveText('1');await expect(page.locator('#completed')).toHaveText('1 / 6');await rotate(page,['A']);await page.reload();await expect(page.locator('#status')).toHaveClass(/success/);await expect(page.locator('#moves')).toHaveText('1');await expect(page.locator('#undo')).toBeDisabled();await page.locator('#reset').click();await expect(page.locator('#moves')).toHaveText('0');await expect(page.locator('#status')).not.toHaveClass(/success/);await expect(page.locator('#completed')).toHaveText('1 / 6');await expect(page.locator('#best')).toHaveText('1');
});

test('六关均可完成，干扰镜片不限制答案，最佳纪录取更少旋转',async({page})=>{
  await page.goto(path);
  for(let i=0;i<solutions.length;i++){const[id,turns]=solutions[i];await page.locator('#level').selectOption(id);await expect(page.locator('#status')).not.toHaveClass(/success/);if(id==='long-way')await rotate(page,['F']);await rotate(page,turns);await expect(page.locator('#status')).toHaveClass(/success/);await expect(page.locator('#completed')).toHaveText((i+1)+' / 6');if(id==='long-way'){await expect(page.locator('#best')).toHaveText('4');await page.locator('#reset').click();await rotate(page,turns);await expect(page.locator('#best')).toHaveText('3');}}
  await page.locator('#next').click();await expect(page.locator('#level')).toHaveValue('first-turn');await expect(page.locator('#completed')).toHaveText('6 / 6');await expect(page.locator('#status')).not.toHaveClass(/success/);
});

test('SVG 导出包含关卡、镜片与当前完整光路',async({page})=>{
  await page.goto(path);await rotate(page,['A']);const waiting=page.waitForEvent('download');await page.locator('#export').click();const file=await waiting;expect(file.suggestedFilename()).toBe('006-first-turn.svg');const text=await readFile(await file.path(),'utf8');expect(text).toContain('一束晨光');expect(text).toContain('<polyline');expect(text).toContain('350,50');expect(text).not.toMatch(/<script|href=|onload=/i);
});

test('坏数据可继续使用，保留有效纪录，存储失败仍可通关导出',async({page})=>{
  await page.addInitScript(()=>{if(localStorage.getItem('light-path-006-v1')===null)localStorage.setItem('light-path-006-v1','{broken');});await page.goto(path);await expect(page.locator('#notice')).toContainText('无法读取');await page.evaluate(k=>localStorage.setItem(k,JSON.stringify({version:1,level:'starlight',orientations:['BAD'],moves:-1,records:{'first-turn':1,unknown:4}})),key);await page.reload();await expect(page.locator('#level')).toHaveValue('starlight');await expect(page.locator('#moves')).toHaveText('0');await expect(page.locator('#completed')).toHaveText('1 / 6');await expect(page.locator('#notice')).toContainText('修复');await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError');};});await rotate(page,['A','B']);await expect(page.locator('#status')).toHaveClass(/success/);await expect(page.locator('#completed')).toHaveText('2 / 6');await expect(page.locator('#storage')).toContainText('本机保存不可用');await expect(page.locator('#notice')).toContainText('本机保存不可用');const waiting=page.waitForEvent('download');await page.locator('#export').click();expect((await waiting).suggestedFilename()).toBe('006-starlight.svg');
});

test('断网 file:// 加载镜片核心并可通关、返回索引',async({page,context})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await context.setOffline(true);await page.goto(new URL('../public/index.html',import.meta.url).href);await page.getByRole('link',{name:'006 折光小径',exact:true}).click();await expect(page).toHaveTitle(/^006/);await page.locator('#reset').click();await rotate(page,['A']);await expect(page.locator('#status')).toHaveClass(/success/);await expect(page.locator('#stars')).toHaveText('2');await page.getByRole('link',{name:'← 小程序索引',exact:true}).click();await expect(page).toHaveTitle(/Interesting Mini Program/);expect(errors).toEqual([]);
});
