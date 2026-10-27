import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const programs=JSON.parse(await readFile(new URL('../programs.json',import.meta.url),'utf8'));
const path=p=>'/apps/'+p.id+'-'+p.slug+'/index.html';
const switchTo=(page,lang)=>page.locator('[data-program-language="'+lang+'"]');
async function englishUI(page){
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  expect(await page.locator('main').innerText()).not.toMatch(/[\u3400-\u9fff\uE000-\uE001]/);
  const labels=await page.locator('main [aria-label],main [placeholder],main [title]').evaluateAll(nodes=>nodes.flatMap(n=>['aria-label','placeholder','title'].map(a=>n.getAttribute(a)||'')));
  expect(labels.join('\n')).not.toMatch(/[\u3400-\u9fff\uE000-\uE001]/);
}
for(const p of programs)test(p.id+' 英文界面、无障碍标签、键盘切换与响应式布局',async({page},info)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(path(p)+'?lang=en');await englishUI(page);await expect(page).toHaveTitle(p.id+' · '+p.en.title);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  const clipped=await page.locator('button:not(.cell)').evaluateAll(nodes=>nodes.filter(n=>n.getBoundingClientRect().width&&n.scrollHeight>n.clientHeight+2).map(n=>n.textContent));expect(clipped).toEqual([]);
  await page.screenshot({path:info.outputPath(p.id+'-en-typography.png'),fullPage:true,animations:'disabled'});
  await switchTo(page,'zh').press('Space');await expect(page.locator('html')).toHaveAttribute('lang','zh-CN');await expect(page.locator('main')).toContainText(p.subtitle.replace(/[，。]/g,'').slice(0,2));
  await switchTo(page,'en').press('Enter');await englishUI(page);expect(errors).toEqual([]);
});

test('001 切换语言保留挑战计时、暂停和引力设置',async({page})=>{
  await page.clock.install();await page.goto(path(programs[0])+'?lang=en');await page.locator('#challenge').click();await page.locator('#start').click();await page.clock.runFor(1700);await page.locator('#pause').click();const time=await page.locator('#time').textContent();await switchTo(page,'zh').click();await expect(page.locator('#pause')).toHaveAttribute('aria-pressed','true');await page.clock.runFor(2000);await expect(page.locator('#time')).toHaveText(time);await switchTo(page,'en').click();await expect(page.locator('#pause')).toContainText('Resume');await expect(page.locator('#start')).toContainText('Restart');await englishUI(page);
});

test('002 全部气质可抽英文卡，锁卡与草稿文字在语言切换及导出后保留',async({page})=>{
  await page.goto(path(programs[1])+'?lang=en');
  for(const tone of ['gentle','mystery','wonder']){await page.locator('[data-tone="'+tone+'"]').click();await page.locator('#shuffle').click();await englishUI(page);}
  await page.locator('[data-lock="0"]').click();const card=await page.locator('#card0').textContent();await page.locator('#shuffle').click();await expect(page.locator('#card0')).toHaveText(card);
  const title='锁定',body='睡眠。This is my own story.\n中文正文不翻译。';await page.locator('#title').fill(title);await page.locator('#body').fill(body);await page.locator('#save').click();await expect(page.locator('.draft-load')).toHaveText(title);await switchTo(page,'zh').click();await switchTo(page,'en').click();await expect(page.locator('#body')).toHaveValue(body);await expect(page.locator('.draft-load')).toHaveText(title);await expect(page.locator('.draft-load')).toHaveAttribute('aria-label','Load draft: '+title);
  const waiting=page.waitForEvent('download');await page.locator('#export').click();const download=await waiting,text=await readFile(await download.path(),'utf8');expect(text).toContain(title+'\n\n'+body);expect(text).toContain('002 · Story Fold');expect(text).toContain('Story mood:');expect(text).not.toMatch(/[\uE000-\uE001]/);await page.reload();await expect(page.locator('#body')).toHaveValue(body);await expect(page.locator('[data-lock="0"]')).toHaveAttribute('aria-pressed','true');
});

test('003 英文反馈、确定性实验和语言切换保持样本，CSV 数据完整',async({page})=>{
  await page.goto(path(programs[2])+'?lang=en');await page.locator('#instant').check();await page.locator('#probability').press('Home');await page.locator('#run100').click();await expect(page.locator('#total')).toHaveText('100');await expect(page.locator('#mean')).toHaveText('0.00');await expect(page.locator('#notice')).toContainText('Batch complete');await switchTo(page,'zh').click();await switchTo(page,'en').click();await expect(page.locator('#total')).toHaveText('100');await page.locator('#dataDetails summary').click();await englishUI(page);const waiting=page.waitForEvent('download');await page.locator('#export').click();const text=await readFile(await(await waiting).path(),'utf8');expect(text).toContain('observed_count');expect(text).toContain('0,100,1.00000000,1.00000000');
});

test('004 内置事项可译，用户同名事项保持原文，撤销与英文导出仍可用',async({page})=>{
  await page.goto(path(programs[3])+'?lang=en');await expect(page.locator('.task-name')).toContainText(['Sleep']);await page.locator('#clear').click();await page.locator('#newName').fill('睡眠');await page.locator('#newMinutes').fill('90');await page.locator('#addForm button').click();await expect(page.locator('.task-name')).toHaveText('睡眠');await expect(page.locator('#notice')).toContainText('睡眠');await expect(page.getByRole('checkbox',{name:'Complete: 睡眠',exact:true})).toBeVisible();await page.locator('.task-row input[type=checkbox]').check();await switchTo(page,'zh').click();await switchTo(page,'en').click();await expect(page.locator('.task-name')).toHaveText('睡眠');await expect(page.locator('.task-row input[type=checkbox]')).toBeChecked();await expect(page.locator('#total')).toContainText('1 h 30 min');
  const waiting=page.waitForEvent('download');await page.locator('#export').click();const text=await readFile(await(await waiting).path(),'utf8');expect(text).toContain('004 · Time Bento');expect(text).toContain('[x] 睡眠');expect(text).toContain('90 minutes');expect(text).not.toMatch(/[\uE000-\uE001]/);await page.reload();await expect(page.locator('.task-name')).toHaveText('睡眠');await expect(page.locator('.task-row input[type=checkbox]')).toBeChecked();await page.locator('#clear').click();await page.locator('#undo').click();await expect(page.locator('.task-name')).toHaveText('睡眠');
});

test('005 英文库存挑战、限制判定、真值表与导出保持完整',async({page})=>{
  await page.goto(path(programs[4])+'?lang=en');await page.locator('#challengeMode').click();await page.locator('#puzzle').selectOption('stock-same');await page.locator('#g1').selectOption('XNOR');await page.locator('#g2').selectOption('XNOR');await page.locator('#g3').selectOption('AND');await page.locator('#verify').click();await expect(page.locator('#notice')).toContainText('inventory is exceeded');await expect(page.locator('#completedCount')).toHaveText('0/9');await page.locator('#g1').selectOption('XOR');await page.locator('#g2').selectOption('XOR');await page.locator('#g3').selectOption('NOR');await page.locator('#verify').click();await expect(page.locator('#completedCount')).toHaveText('1/9');await switchTo(page,'zh').click();await switchTo(page,'en').click();await expect(page.locator('#puzzle')).toHaveValue('stock-same');await expect(page.locator('#g3')).toHaveValue('NOR');await page.locator('#truthDetails summary').click();await page.locator('#hintToggle').click();await englishUI(page);
  for(const option of await page.locator('#puzzle option').all())expect(await option.textContent()).not.toMatch(/[\u3400-\u9fff]/);
  const waiting=page.waitForEvent('download');await page.locator('#export').click();const text=await readFile(await(await waiting).path(),'utf8');expect(text).toContain('Equality without AND');expect(text).toContain('Gate inventory:');expect(text).not.toMatch(/[\u3400-\u9fff]/);
});

test('006 英文联动终关保留操作状态，七步通关并导出英文 SVG',async({page})=>{
  await page.goto(path(programs[5])+'?lang=en');await page.locator('#level').selectOption('linked-finale');for(const id of ['I','H','G'])await page.locator('#mirror-'+id).click();await expect(page.locator('#moves')).toHaveText('3');await switchTo(page,'zh').click();await switchTo(page,'en').click();await expect(page.locator('#moves')).toHaveText('3');for(const id of ['F','D','C','B'])await page.locator('#mirror-'+id).click();await expect(page.locator('#status')).toHaveClass(/success/);await expect(page.locator('#moves')).toHaveText('7');await englishUI(page);
  const waiting=page.waitForEvent('download');await page.locator('#export').click();const text=await readFile(await(await waiting).path(),'utf8');expect(text).toContain('Light Path');expect(text).toContain('Echo finale');expect(text).toContain('7 moves');expect(text).not.toMatch(/[\u3400-\u9fff]/);await page.reload();await expect(page.locator('#level')).toHaveValue('linked-finale');await expect(page.locator('#best')).toHaveText('7');
});

test('各程序在存储禁用时仍能切换，显式链接跨页保留语言',async({page})=>{
  await page.addInitScript(()=>{Storage.prototype.getItem=function(){throw new DOMException('Blocked','SecurityError');};Storage.prototype.setItem=function(){throw new DOMException('Blocked','SecurityError');};});
  for(const p of programs){await page.goto(path(p)+'?lang=en');await englishUI(page);await switchTo(page,'zh').click();await switchTo(page,'en').click();await expect(page.locator('#programLanguageNotice')).toContainText('could not be saved');await page.getByRole('link',{name:'← All programs',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('lang','en');await page.getByRole('link',{name:p.id+' '+p.en.title,exact:true}).click();await expect(page.locator('html')).toHaveAttribute('lang','en');}
});

test('六个英文程序在断网 file:// 下均可打开并切换',async({page,context})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await context.setOffline(true);
  for(const p of programs){await page.goto(new URL('../public'+path(p)+'?lang=en',import.meta.url).href);await englishUI(page);await switchTo(page,'zh').click();await switchTo(page,'en').click();await expect(page.locator('html')).toHaveAttribute('lang','en');}expect(errors).toEqual([]);
});
