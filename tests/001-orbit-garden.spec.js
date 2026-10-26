import {test,expect} from '@playwright/test';
test('双击 HTML 的离线索引与程序可以往返直达',async({page})=>{
  await page.goto(new URL('../public/index.html',import.meta.url).href);
  await page.getByRole('link',{name:/001.*引力花园/}).click();
  await expect(page).toHaveTitle(/^001/);expect(page.url()).toMatch(/\/001-orbit-garden\/index\.html$/);
  await page.getByRole('link',{name:'← 返回小程序索引'}).click();
  await expect(page).toHaveTitle(/Interesting Mini Program/);
});
test('编号索引可以搜索并打开 001，手机无横向溢出',async({page})=>{
  await page.goto('/');await page.getByPlaceholder('搜编号、名称或灵感…').fill('001');
  await page.getByRole('link',{name:/001.*引力花园/}).click();await expect(page).toHaveTitle(/^001/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
test('暂停、配色、捕星计时、重开和 PNG 留影',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/apps/001-orbit-garden/');
  await page.locator('#pause').click();await expect(page.locator('#pauseLabel')).toBeVisible();
  await page.getByRole('button',{name:'晚霞配色'}).click();await expect(page.locator('#paletteName')).toHaveText('晚霞');
  await page.locator('#pause').click();await expect(page.locator('#pauseLabel')).toBeHidden();
  const download=page.waitForEvent('download');await page.locator('#save').click();expect((await download).suggestedFilename()).toMatch(/\.png$/);
  await page.locator('#challenge').click();await page.clock.install();await page.locator('#start').click();
  await page.clock.runFor(1200);await page.locator('#pause').click();
  const before=await page.locator('#time').textContent();
  await page.clock.runFor(2500);await expect(page.locator('#time')).toHaveText(before);
  await page.locator('#pause').click();await page.clock.fastForward(45000);await expect(page.locator('#result')).toBeVisible();
  await page.locator('#again').click();await expect(page.locator('#result')).toBeHidden();
  await page.locator('#reset').click();await expect(page.locator('#count')).toHaveText('0');
  expect(errors).toEqual([]);
});
