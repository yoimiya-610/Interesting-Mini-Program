import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const route = '/apps/024-spring-ensemble/index.html?lang=en';
const key = 'imp-024-spring-ensemble-v1';
const payload = data => ({name: 'experiments.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data))});
async function download(page, id) { const pending = page.waitForEvent('download'); await page.locator('#' + id).click(); return readFile(await (await pending).path(), 'utf8'); }
async function time(page) { return Number((await page.locator('#clock').innerText()).match(/([\d.]+) \/ 60/)[1]); }
async function column(page, i) { return (await page.locator('#stateBody tr').first().locator('td').nth(i).innerText()); }

test('024 all eight complete experiments can run, keep same-time references and preserve literal notes', async ({page}, info) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message)); await page.goto(route);
  const ids = await page.locator('#case option').evaluateAll(nodes => nodes.map(n => n.value)); expect(ids).toHaveLength(8);
  for (const id of ids) {
    await page.locator('#case').selectOption(id); await expect(page.locator('#prompts li')).toHaveCount(2);
    expect((await page.locator('#lead').innerText()).length).toBeGreaterThan(70); expect(await page.locator('main').innerText()).not.toMatch(/[\u3400-\u9fff]/u);
    await page.locator('#note').fill('My ' + id + ' 笔记'); await page.locator('#step').click(); expect(await time(page)).toBeCloseTo(0.1);
    await page.locator('#checkpoint').click(); expect(Number(await column(page, 4))).toBe(0);
    await page.locator('#mass').fill('2'); expect(await time(page)).toBe(0); await page.locator('#ten').click(); expect(await time(page)).toBe(10);
    await expect(page.locator('#comparison')).toContainText('Mass M1:'); await expect(page.locator('#stateBody tr').first().locator('td').nth(3)).not.toHaveText('—');
  }
  await page.locator('#programBackground summary').click(); await expect(page.locator('#programBackground')).toContainText('Rayleigh');
  await page.locator('[data-program-language="zh"]').click(); expect(await time(page)).toBe(10); await expect(page.locator('#note')).toHaveValue('My damped 笔记');
  await page.locator('#motionTitle').scrollIntoViewIfNeeded(); await page.screenshot({path: info.outputPath('024-used-chain-zh.png')});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy(); expect(errors).toEqual([]);
});
test('024 single-site frequency and same-time comparison agree with analytic motion', async ({page}) => {
  await page.goto(route); await expect(page.locator('#modeBody tr').first().locator('td').nth(1)).toHaveText('0.31831');
  await page.locator('#checkpoint').click(); await page.locator('#mass').fill('4'); await expect(page.locator('#modeBody tr').first().locator('td').nth(1)).toHaveText('0.15915');
  await page.locator('#ten').click(); expect(Number(await column(page, 1))).toBeCloseTo(0.7 * Math.cos(10), 4); expect(Number(await column(page, 3))).toBeCloseTo(0.7 * Math.cos(20), 3);
  const rows = (await download(page, 'csv')).split('\r\n'); expect(rows).toHaveLength(202); expect(rows[0]).toContain('reference_q_M1_m');
  const last = rows.at(-1).split(',').map(s => Number(s.replaceAll('"', ''))); expect(last[0]).toBe(10); expect(last.at(-1)).toBeCloseTo(0.7 * Math.cos(20), 3);
});
test('024 modal excitation and bounded addition make two distinct active modes', async ({page}) => {
  await page.goto(route); await page.locator('#case').selectOption('collective'); await page.locator('#displace').click();
  let energies = await page.locator('#modeBody tr').evaluateAll(rows => rows.map(r => Number(r.cells[3].textContent))); expect(energies.filter(e => e > 1e-6)).toHaveLength(1);
  await page.locator('#mode').selectOption('7'); await page.locator('#amplitude').fill('0.2'); await page.locator('#add').click();
  energies = await page.locator('#modeBody tr').evaluateAll(rows => rows.map(r => Number(r.cells[3].textContent))); expect(energies.filter(e => e > 1e-6)).toHaveLength(2);
  const before = JSON.parse(await download(page, 'backup')).entries.collective.model.q;
  await page.locator('#amplitude').fill('1'); await page.locator('#add').click(); await expect(page.locator('#status')).toContainText('exceeds');
  expect(JSON.parse(await download(page, 'backup')).entries.collective.model.q).toEqual(before);
  await page.locator('#velocity').click(); await expect(page.locator('#q')).toHaveValue('0'); await page.locator('#step').click(); expect(await time(page)).toBeCloseTo(0.1);
});
test('024 free translation and disabled end springs preserve unused raw drafts', async ({page}) => {
  await page.goto(route); await page.locator('#case').selectOption('free'); await expect(page.locator('#springLeft')).toBeDisabled();
  await expect(page.locator('#modeBody tr').first().locator('td').nth(1)).toHaveText('0'); await page.locator('#ten').click();
  expect(Number(await column(page, 1))).toBeCloseTo(1.5, 5); await expect(page.locator('#ledger')).toContainText('Potential 0 J');
  await page.locator('#left').selectOption('fixed'); await page.locator('#springLeft').fill(''); await expect(page.locator('#play')).toBeDisabled();
  await page.locator('#left').selectOption('free'); await expect(page.locator('#springLeft')).toHaveValue(''); await expect(page.locator('#play')).toBeEnabled();
  await page.locator('[data-program-language="zh"]').click(); await page.reload(); await expect(page.locator('#springLeft')).toHaveValue(''); await expect(page.locator('#springLeft')).toBeDisabled();
});
test('024 damping, loss and reference energy remain distinct in the ledger and CSV', async ({page}) => {
  await page.goto(route); await page.locator('#case').selectOption('damped'); await page.locator('#checkpoint').click(); await page.locator('#damping').fill('0'); await page.locator('#ten').click();
  await expect(page.locator('#ledger')).toContainText('Dissipated 0 J');
  const rows = (await download(page, 'csv')).split('\r\n'), columns = rows[0].split(',').map(s => s.replaceAll('"', ''));
  const last = rows.at(-1).split(',').map(s => Number(s.replaceAll('"', ''))); expect(Math.abs(last[columns.indexOf('balance_error_J')])).toBeLessThan(0.0001);
  await page.locator('#restoreCheckpoint').click(); await page.locator('#ten').click(); await expect(page.locator('#ledger')).not.toContainText('Dissipated 0 J');
  await page.locator('#undo').click(); await expect(page.locator('#damping')).toHaveValue('0'); expect(await time(page)).toBe(0);
});
test('024 numeric drafts and empty notes remain literal across languages, selection and reload', async ({page}) => {
  await page.goto(route); await page.locator('#case').selectOption('heavy'); await page.locator('#selected').selectOption('3');
  await page.locator('#mass').fill(''); await page.locator('#q').fill('0.123456789'); await page.locator('#damping').fill('1e-'); await page.locator('#amplitude').fill('');
  await page.locator('#note').fill('我的记录\nKeep it.'); await page.locator('[data-program-language="zh"]').click(); await page.locator('[data-program-language="en"]').click();
  await expect(page.locator('#mass')).toHaveValue(''); await expect(page.locator('#q')).toHaveValue('0.123456789'); await expect(page.locator('#damping')).toHaveValue('1e-');
  await expect(page.locator('#play')).toBeDisabled(); await page.reload(); await expect(page.locator('#selected')).toHaveValue('3'); await expect(page.locator('#amplitude')).toHaveValue(''); await expect(page.locator('#note')).toHaveValue('我的记录\nKeep it.');
  await page.locator('#note').fill(''); await page.locator('[data-program-language="zh"]').click(); await page.reload(); await expect(page.locator('#note')).toHaveValue('');
});
test('024 keyboard site boundaries refuse invalid edits without changing the selected mass', async ({page}) => {
  await page.goto(route); await page.locator('#site0').press('ArrowRight'); await expect(page.locator('#selected')).toHaveValue('0');
  await page.locator('#q').fill('1'); await page.locator('#site0').press('Alt+ArrowUp'); await expect(page.locator('#q')).toHaveValue('1'); await expect(page.locator('#selected')).toHaveValue('0');
  await page.locator('#site0').press('Alt+ArrowDown'); await expect(page.locator('#q')).toHaveValue('0.95');
  await page.locator('#case').selectOption('heavy'); await page.locator('#site0').press('End'); await expect(page.locator('#selected')).toHaveValue('6'); await expect(page.locator('#site6')).toBeFocused();
  await page.locator('#site6').press('ArrowRight'); await page.locator('#mass').fill('2.5'); const backup = JSON.parse(await download(page, 'backup')); expect(backup.entries.heavy.model.m[6]).toBe('2.5'); expect(backup.entries.heavy.model.m[0]).toBe('1');
  await page.locator('#undo').click(); await expect(page.locator('#mass')).toHaveValue('1');
});
test('024 animation, language and notes preserve elapsed time and visit traces pause across case changes', async ({page}) => {
  await page.clock.install(); await page.goto(route); await page.locator('#play').click(); await page.clock.runFor(1100); await page.locator('#play').click();
  const elapsed = await time(page); expect(elapsed).toBeGreaterThan(0.9); expect(elapsed).toBeLessThan(1.2);
  await page.locator('#note').fill('Runtime note'); await page.locator('[data-program-language="zh"]').click(); await page.locator('[data-program-language="en"]').click(); expect(await time(page)).toBe(elapsed);
  await page.locator('#case').selectOption('pair'); await page.locator('#step').click(); await page.locator('#case').selectOption('one'); expect(await time(page)).toBe(elapsed);
  await page.locator('#checkpoint').click(); expect(Number(await column(page, 4))).toBe(0); await page.reload(); expect(await time(page)).toBe(0); await expect(page.locator('#note')).toHaveValue('Runtime note');
});
test('024 configuration import is atomic and recovery restores pre-import visit traces', async ({page}) => {
  await page.goto(route); const original = JSON.parse(await download(page, 'backup')); await page.locator('#step').click(); await page.locator('#note').fill('Before import');
  await page.locator('#file').setInputFiles(payload(original)); await expect(page.locator('#recover')).toBeVisible(); expect(await time(page)).toBe(0);
  await page.locator('#case').selectOption('pair'); await page.locator('#recover').click(); await expect(page.locator('#case')).toHaveValue('one'); expect(await time(page)).toBeCloseTo(0.1); await expect(page.locator('#note')).toHaveValue('Before import');
  const invalid = structuredClone(original); invalid.entries.pair.model.k.pop(); await page.locator('#file').setInputFiles(payload(invalid)); await expect(page.locator('#status')).toContainText('File invalid'); expect(await time(page)).toBeCloseTo(0.1);
  await page.locator('#file').setInputFiles(payload(original)); await page.locator('#step').click(); await expect(page.locator('#recover')).toBeHidden();
});
test('024 stale file reads and active text composition cannot overwrite newer work', async ({page}) => {
  await page.goto(route); const data = JSON.parse(await download(page, 'backup'));
  await page.evaluate(() => { File.prototype.text = function () { return new Promise(resolve => { globalThis.finishImport = resolve; }); }; });
  await page.locator('#file').setInputFiles(payload(data)); await page.locator('#step').click(); await page.evaluate(text => globalThis.finishImport(text), JSON.stringify(data)); await expect(page.locator('#status')).toContainText('cancelled'); expect(await time(page)).toBeCloseTo(0.1);
  await page.locator('#file').setInputFiles(payload(data)); await page.locator('#note').dispatchEvent('compositionstart'); await page.locator('#note').fill('组合中的笔记');
  await page.locator('[data-program-language="zh"]').click(); await expect(page.locator('#note')).toHaveValue('组合中的笔记');
  await page.evaluate(text => globalThis.finishImport(text), JSON.stringify(data)); await expect(page.locator('#status')).toContainText('取消'); await page.locator('#note').dispatchEvent('compositionend'); await page.reload(); await expect(page.locator('#note')).toHaveValue('组合中的笔记');
});
test('024 maximum run, samples and TXT/JSON exports state their different preservation scope', async ({page}) => {
  await page.goto(route); await page.locator('#note').fill('Literal 自己的笔记');
  for (let i = 0; i < 6; i++) await page.locator('#ten').click(); expect(await time(page)).toBe(60); await expect(page.locator('#play')).toBeDisabled();
  const csv = await download(page, 'csv'); expect(csv.split('\r\n')).toHaveLength(1202); const text = await download(page, 'text'); expect(text).toContain('Literal 自己的笔记'); expect(text).toContain('60 / 60 s');
  const data = JSON.parse(await download(page, 'backup')); expect(Object.keys(data.entries)).toHaveLength(8); expect(data.entries.one.note).toBe('Literal 自己的笔记'); expect(data.entries.one).not.toHaveProperty('history');
  await page.locator('#restart').click(); expect(await time(page)).toBe(0); await expect(page.locator('#play')).toBeEnabled();
});
test('024 offline file use and blocked storage keep physics, bilingual guide and configuration exports available', async ({page, context}) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message)); await page.addInitScript(() => { Storage.prototype.getItem = () => { throw Error('blocked'); }; Storage.prototype.setItem = () => { throw Error('blocked'); }; });
  await context.setOffline(true); await page.goto(new URL('../public/apps/024-spring-ensemble/index.html?lang=en', import.meta.url).href); await page.locator('#step').click(); expect(await time(page)).toBeCloseTo(0.1);
  await page.locator('#note').fill('Offline 记录'); await expect(page.locator('#storage')).toContainText('unavailable'); await page.locator('#programBackground summary').click(); await expect(page.locator('#programBackground')).toContainText('Rayleigh');
  await page.locator('[data-program-language="zh"]').click(); await page.locator('[data-program-language="en"]').click(); expect(await time(page)).toBeCloseTo(0.1); expect(JSON.parse(await download(page, 'backup')).entries.one.note).toBe('Offline 记录'); expect(errors).toEqual([]);
});
test('024 320px charts preserve actual 14px labels after resizing a used eight-site experiment', async ({page}) => {
  await page.goto(route); await page.locator('#case').selectOption('collective'); await page.locator('#ten').click();
  await page.setViewportSize({width: 320, height: 812});
  await expect.poll(async () => page.locator('svg text').evaluateAll(nodes => Math.min(...nodes.map(n => parseFloat(getComputedStyle(n).fontSize) * n.getScreenCTM().a)))).toBeGreaterThanOrEqual(14 - 1e-6);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  expect(await time(page)).toBe(10); await page.locator('#site0').press('End'); await expect(page.locator('#selected')).toHaveValue('7');
});
