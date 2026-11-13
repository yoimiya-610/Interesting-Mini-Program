import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const route = '/apps/023-calendar-loops/index.html?lang=en';
const key = 'imp-023-calendar-loops-v1';
async function setup(page) {
  await page.goto(route);
  await page.evaluate(key => localStorage.setItem(key, JSON.stringify(CalendarLoops.fresh('2028-01-31'))), key);
  await page.reload();
}
async function task(page, i) { await page.locator('#task').selectOption(String(i)); }
async function day(page, iso) {
  await page.locator('#month').fill(iso.slice(0, 7)); await page.locator('#month').dispatchEvent('change');
  await page.locator(`[data-date="${iso}"]`).click();
}
const row = (page, id) => page.locator(`.agenda-item[data-id="${id}"]`);
async function downloaded(page, id) { const waiting = page.waitForEvent('download'); await page.locator('#' + id).click(); const download = await waiting; return readFile(await download.path(), 'utf8'); }
const payload = value => ({name: 'plans.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value))});

test('023 all eight plans have distinct complete task purposes, exercises, and editable calendars', async ({page}, info) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message)); await setup(page);
  const ids = await page.locator('#plan option').evaluateAll(o => o.map(e => e.value)); expect(ids).toHaveLength(8);
  const purposes = new Set();
  for (const id of ids) {
    await page.locator('#plan').selectOption(id); await expect(page.locator('#task option')).toHaveCount(8);
    expect(await page.locator('#prompts li').count()).toBe(2); expect((await page.locator('#lead').innerText()).length).toBeGreaterThan(50);
    for (let i = 0; i < 8; i++) { await task(page, i); purposes.add(await page.locator('#purpose').innerText()); }
    expect(await page.locator('main').innerText()).not.toMatch(/[\u3400-\u9fff]/u);
  }
  expect(purposes.size).toBe(64); await day(page, '2028-02-28');
  await page.locator('[data-program-language="zh"]').click(); await expect(page.locator('#calendar')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({path: info.outputPath('023-used-calendar-zh.png'), fullPage: true}); expect(errors).toEqual([]);
});
test('023 month-end skip versus clamp handles leap day and returns to day 31', async ({page}) => {
  await setup(page); await task(page, 6); await day(page, '2028-02-29');
  await expect(row(page, '6@2028-02-29')).toHaveCount(0); await page.locator('#policy').selectOption('last');
  await expect(row(page, '6@2028-02-29')).toBeVisible(); await day(page, '2028-03-31');
  await expect(row(page, '6@2028-03-31')).toBeVisible(); await day(page, '2028-03-29'); await expect(row(page, '6@2028-03-29')).toHaveCount(0);
  await page.locator('#start').fill('2100-01-31'); await day(page, '2100-02-28'); await expect(row(page, '6@2100-02-28')).toBeVisible();
});
test('023 an individual move survives disabling its rule, remains discoverable, and can be reset', async ({page}, info) => {
  await setup(page); const id = '0@2028-01-31'; await row(page, id).locator('[data-move]').fill('2028-03-10'); await row(page, id).locator('[data-action=move]').click();
  await expect(page.locator('#month')).toHaveValue('2028-03'); await expect(row(page, id)).toBeVisible(); await row(page, id).locator('[data-action=done]').click();
  await page.locator('#enabled').uncheck(); await expect(row(page, id).locator('.retained')).toBeVisible();
  await page.locator('#every').fill(''); await expect(row(page, id).locator('[data-action=done]')).toHaveAttribute('aria-pressed', 'true');
  await day(page, '2029-06-01'); await page.locator('#records').selectOption(id); await expect(page.locator('#agendaTitle')).toContainText('2028-03-10');
  await page.screenshot({path: info.outputPath('023-retained-move-en.png'), fullPage: true}); await page.reload();
  await expect(row(page, id).locator('.retained')).toBeVisible(); await expect(page.locator('#every')).toHaveValue('');
  await row(page, id).locator('[data-action=reset]').click(); await expect(row(page, id)).toHaveCount(0); await expect(page.locator('#records option')).toHaveCount(1);
  await page.locator('#undo').click(); await expect(row(page, id).locator('.retained')).toBeVisible();
});
test('023 completion counts toward daily load, skips do not, and invalid estimates stay unknown', async ({page}) => {
  await setup(page); const id = '0@2028-01-31';
  await page.locator('#capacity').fill('0'); const before = await page.locator('#daySummary').innerText(); expect(before).toContain('Over allowance');
  await row(page, id).locator('[data-action=done]').click(); await expect(page.locator('#daySummary')).toContainText('1 done');
  await row(page, id).locator('[data-action=skip]').click(); await expect(page.locator('#daySummary')).toContainText('0 done');
  await page.locator('#minutes').fill(''); await expect(row(page, id)).toContainText('Duration unknown');
  await row(page, id).locator('[data-action=skip]').click(); await expect(page.locator('#daySummary')).toContainText('1 unknown durations');
  await expect(page.locator('[data-date="2028-01-31"]')).toContainText('?'); await expect(page.locator('#minutes')).toHaveAttribute('aria-invalid', 'true');
});
test('023 literal incomplete inputs, names, notes, weekday drafts, and IME text survive language and reload', async ({page}) => {
  await setup(page); await page.locator('#name').fill('My 自己的任务'); await page.locator('#note').fill('计划\nKeep this.'); await page.locator('#start').fill('2028-02-'); await page.locator('#every').fill('1e2');
  await page.locator('#kind').selectOption('weeks');
  for (const value of await page.locator('#weekdays input:checked').evaluateAll(nodes => nodes.map(n => n.value))) await page.locator('#weekday' + value).uncheck();
  await expect(page.locator('#weekday0')).toBeFocused();
  await page.locator('[data-program-language="zh"]').click(); await page.locator('[data-program-language="en"]').click();
  await expect(page.locator('#start')).toHaveValue('2028-02-'); await expect(page.locator('#every')).toHaveValue('1e2'); await expect(page.locator('#name')).toHaveValue('My 自己的任务');
  await page.reload(); await expect(page.locator('#note')).toHaveValue('计划\nKeep this.'); await expect(page.locator('#weekdays input:checked')).toHaveCount(0);
  await page.locator('#name').dispatchEvent('compositionstart'); await page.locator('#name').fill('输入中'); await page.locator('[data-program-language="zh"]').click();
  await expect(page.locator('#name')).toHaveValue('输入中'); await page.locator('#name').dispatchEvent('compositionend');
  await page.locator('[data-program-language="en"]').click(); await page.reload(); await expect(page.locator('#name')).toHaveValue('输入中');
});
test('023 comparison contains real dated changes, notes and allowance, and retrieval is undoable', async ({page}) => {
  await setup(page); await page.locator('#checkpoint').click(); await page.locator('#note').fill('Changed note'); await page.locator('#capacity').fill('60');
  await row(page, '0@2028-01-31').locator('[data-action=done]').click();
  await expect(page.locator('#comparison')).toContainText('Changed note'); await expect(page.locator('#comparison')).toContainText('90 → 60');
  await expect(page.locator('#comparison')).toContainText('Planned'); await expect(page.locator('#comparison')).toContainText('Done');
  await page.locator('#restoreCheckpoint').click(); await expect(page.locator('#note')).toHaveValue(''); await expect(page.locator('#capacity')).toHaveValue('90');
  await expect(row(page, '0@2028-01-31').locator('[data-action=done]')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#undo').click(); await expect(page.locator('#note')).toHaveValue('Changed note'); await expect(row(page, '0@2028-01-31').locator('[data-action=done]')).toHaveAttribute('aria-pressed', 'true');
});
test('023 keyboard navigation crosses months and refuses range overflow without changing the editor', async ({page}) => {
  await setup(page); await page.locator('[data-date="2028-01-31"]').focus(); await page.keyboard.press('ArrowRight'); await expect(page.locator('#month')).toHaveValue('2028-02');
  await expect(page.locator('[data-date="2028-02-01"]')).toBeFocused(); await page.keyboard.press('Space'); await expect(page.locator('[data-date="2028-02-01"]')).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.locator('[data-date="2028-02-01"]')).toBeFocused();
  await page.keyboard.press('ArrowDown'); await expect(page.locator('#agendaTitle')).toContainText('2028-02-08');
  await day(page, '1900-01-01'); await page.locator('[data-date="1900-01-01"]').press('ArrowLeft'); await expect(page.locator('#agendaTitle')).toContainText('1900-01-01'); await expect(page.locator('#previous')).toBeDisabled();
  await page.locator('#name').fill('Boundary note'); await expect(page.locator('#task')).toHaveValue('0');
  await day(page, '2100-12-31'); await page.locator('[data-date="2100-12-31"]').press('ArrowRight'); await expect(page.locator('#agendaTitle')).toContainText('2100-12-31'); await expect(page.locator('#next')).toBeDisabled();
  await page.reload(); await expect(page.locator('#name')).toHaveValue('Boundary note'); await expect(page.locator('#month')).toHaveValue('2100-12');
});
test('023 record capacity blocks new marks without deleting existing marks', async ({page}) => {
  await setup(page);
  await page.evaluate(key => {
    const d = CalendarLoops.fresh('2028-01-31'), m = d.entries.desk.model;
    for (let i = 0; i < 1024; i++) CalendarLoops.mark(m, (i % 8) + '@' + CalendarLoops.addDays('2040-01-01', i), '2028-02-01', 'done');
    localStorage.setItem(key, JSON.stringify(d));
  }, key); await page.reload();
  await row(page, '0@2028-01-31').locator('[data-action=done]').click(); await expect(page.locator('#status')).toContainText('1,024-mark limit');
  await expect(row(page, '0@2028-01-31').locator('[data-action=done]')).toHaveAttribute('aria-pressed', 'false');
  expect(await page.locator('#records option').count()).toBe(1025);
  const all = JSON.parse(await downloaded(page, 'backup')); expect(Object.keys(all.entries.desk.model.records)).toHaveLength(1024);
});
test('023 full backups import atomically, recover prior plans, and preserve independent case records', async ({page}) => {
  await setup(page); const original = JSON.parse(await downloaded(page, 'backup'));
  await page.locator('#note').fill('New work'); await page.locator('#plan').selectOption('photos'); await page.locator('#name').fill('A literal title');
  await page.locator('#file').setInputFiles(payload(original)); await expect(page.locator('#recover')).toBeVisible(); await expect(page.locator('#plan')).toHaveValue('desk');
  await page.locator('#plan').selectOption('home'); await page.locator('#recover').click(); await expect(page.locator('#plan')).toHaveValue('photos'); await expect(page.locator('#name')).toHaveValue('A literal title');
  await page.locator('#plan').selectOption('desk'); await expect(page.locator('#note')).toHaveValue('New work');
  const invalid = structuredClone(original); invalid.entries.home.checkpoint = {}; await page.locator('#file').setInputFiles(payload(invalid)); await expect(page.locator('#status')).toContainText('File invalid'); await expect(page.locator('#note')).toHaveValue('New work');
  await page.locator('#file').setInputFiles(payload(original)); await page.locator('#note').fill('Fresh edit'); await expect(page.locator('#recover')).toBeHidden();
});
test('023 asynchronous imports cannot overwrite newer typing or an active composition', async ({page}) => {
  await setup(page); const data = JSON.parse(await downloaded(page, 'backup'));
  await page.evaluate(() => { File.prototype.text = function () { return new Promise(resolve => { globalThis.finishImport = resolve; }); }; });
  await page.locator('#file').setInputFiles(payload(data)); await page.locator('#note').fill('Typed while loading');
  await page.evaluate(text => globalThis.finishImport(text), JSON.stringify(data)); await expect(page.locator('#status')).toContainText('cancelled'); await expect(page.locator('#note')).toHaveValue('Typed while loading');
  await page.locator('#file').setInputFiles(payload(data)); await page.locator('#name').dispatchEvent('compositionstart'); await page.locator('#name').fill('组合中');
  await page.evaluate(text => globalThis.finishImport(text), JSON.stringify(data)); await expect(page.locator('#status')).toContainText('cancelled');
  await page.locator('#name').dispatchEvent('compositionend'); await expect(page.locator('#name')).toHaveValue('组合中');
});
test('023 text, CSV and JSON exports contain literal data, exception origins, and full saved plans', async ({page}) => {
  await setup(page); await page.locator('#name').fill('=SUM(1,2) 中文'); await page.locator('#note').fill('@note\n第二行');
  await row(page, '0@2028-01-31').locator('[data-action=done]').click();
  const txt = await downloaded(page, 'text'); expect(txt).toContain('Calendar Loops'); expect(txt).toContain('Done'); expect(txt).toContain('Original 2028-01-31'); expect(txt).toContain('@note\n第二行');
  const csv = await downloaded(page, 'csv'); expect(csv).toContain('"\'=SUM(1,2) 中文"'); expect(csv).toContain('"\'@note\n第二行"');
  await page.locator('#checkpoint').click(); const all = JSON.parse(await downloaded(page, 'backup')); expect(Object.keys(all.entries)).toHaveLength(8); expect(all.entries.desk.checkpoint.records['0@2028-01-31'].state).toBe('done');
});
test('023 disabled storage and offline file mode still allow editing, bilingual guides and downloads', async ({page, context}) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('disabled'); }; Storage.prototype.setItem = () => { throw new Error('disabled'); }; });
  await context.setOffline(true); await page.goto(new URL('../public/apps/023-calendar-loops/index.html?lang=en', import.meta.url).href);
  await page.locator('#note').fill('Offline note'); await expect(page.locator('#storage')).toContainText('unavailable');
  await page.locator('#programBackground summary').click(); await expect(page.locator('#programBackground')).toContainText('Gregorian');
  await page.locator('[data-program-language="zh"]').click(); await page.locator('[data-program-language="en"]').click(); await expect(page.locator('#note')).toHaveValue('Offline note');
  const json = JSON.parse(await downloaded(page, 'backup')); expect(json.entries.desk.model.note).toBe('Offline note'); expect(errors).toEqual([]);
});
