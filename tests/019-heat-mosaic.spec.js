import {test, expect} from '@playwright/test';

const route = '/apps/019-heat-mosaic/index.html?lang=en';
const key = 'imp-019-heat-mosaic-v1';
const tile = (page, x, y) => page.locator('#board .cell').nth(y * 14 + x);
const temperature = page => page.locator('#probe strong');
const save = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const file = value => ({name: 'heat-mosaic.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value))});

async function downloadText(page, id) {
  const pending = page.waitForEvent('download');
  await page.locator(id).press('Enter');
  const stream = await (await pending).createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString();
}

test('019 the probe confirms analytical steps, conserved mean and the three edge conditions', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(route);
  await expect(page.locator('#case option')).toHaveCount(8);
  await expect(page.locator('#board .cell')).toHaveCount(140);
  await expect(temperature(page)).toHaveText('100.00');
  const mean = page.locator('#metrics div').filter({hasText: 'Board mean'}).locator('dd');
  await expect(mean).toHaveText('20.57');
  await page.locator('#single').press('Enter');
  await expect(temperature(page)).toHaveText('36.00');
  await tile(page, 6, 4).press('ArrowRight');
  await expect(tile(page, 7, 4)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(temperature(page)).toHaveText('36.00');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await expect(temperature(page)).toHaveText('20.00');
  await expect(mean).toHaveText('20.57');
  await page.locator('#case').selectOption('rim');
  await page.locator('#single').press('Enter');
  await expect(temperature(page)).toHaveText('56.00');
  await tile(page, 0, 4).click();
  await expect(temperature(page)).toHaveText('68.00');
  await tile(page, 4, 4).click();
  await expect(temperature(page)).toHaveText('80.00');
  await expect(mean).toHaveText('75.89');
  await page.locator('#case').selectOption('wrap');
  await page.locator('#single').press('Enter');
  await expect(temperature(page)).toHaveText('36.00');
  await page.locator('#reset').press('Enter');
  await page.locator('#edge').selectOption('sealed');
  await page.locator('#single').press('Enter');
  await expect(temperature(page)).toHaveText('20.00');
  expect(errors).toEqual([]);
});

test('019 rectangle brushes, preserved reference runs and probe differences support controlled comparisons', async ({page}, info) => {
  await page.goto(route);
  await page.locator('#case').selectOption('blanket');
  await page.locator('#twelve').press('Enter');
  await page.locator('#capture').press('Enter');
  await page.locator('#reset').press('Enter');
  await expect(page.locator('#comparison')).toContainText('Snapshot at step 12');
  await page.locator('#brush').selectOption('standard');
  await page.locator('#rectangle').check();
  await tile(page, 6, 0).press('Enter');
  await expect(page.locator('#brushHint')).toContainText('First corner set');
  await page.keyboard.press('Escape');
  await expect(page.locator('#brushHint')).not.toContainText('First corner set');
  await tile(page, 6, 0).click();
  await tile(page, 7, 9).click();
  await expect(page.locator('[data-material=slow]')).toHaveCount(0);
  await page.locator('#undo').press('Enter');
  await expect(page.locator('[data-material=slow]')).toHaveCount(20);
  await page.locator('#redo').press('Enter');
  await page.locator('#brush').selectOption('probe');
  await tile(page, 7, 4).click();
  await page.locator('#twelve').press('Enter');
  await page.locator('#view').selectOption('difference');
  const current = await save(page);
  const index = 4 * 14 + 7;
  const run = current.runs.blanket;
  expect(run.board.steps).toBe(run.snapshot.steps);
  expect(run.board.temp[index]).toBeGreaterThan(run.snapshot.temp[index]);
  const delta = '+' + (run.board.temp[index] - run.snapshot.temp[index]).toFixed(2);
  await expect(page.locator('#probe')).toContainText('Change from snapshot ' + delta);
  await page.locator('#note').fill('Controlled run / 同步比较');
  await page.locator('[data-program-language=zh]').press('Enter');
  await expect(page.locator('#probe')).toContainText('与快照温差 ' + delta);
  await expect(page.locator('#note')).toHaveValue('Controlled run / 同步比较');
  await page.locator('#programBackground summary').press('Enter');
  await expect(page.locator('#programBackground')).toContainText('调和平均值');
  await page.locator('#board').scrollIntoViewIfNeeded();
  await page.screenshot({path: info.outputPath('019-difference-typography.png'), fullPage: true});
  await page.locator('#recall').press('Enter');
  await expect(page.locator('#probe')).toContainText('与快照温差 0.00');
  await page.reload();
  await expect(page.locator('#note')).toHaveValue('Controlled run / 同步比较');
  await expect(page.locator('#comparison')).toContainText('快照步数 12');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('019 continuous steps pause, undo together, and stay independent for every experiment', async ({page}) => {
  await page.goto(route);
  await page.locator('#play').press('Enter');
  await expect(page.locator('#play')).toHaveText('Pause');
  await expect(page.locator('#stepCount')).not.toHaveText('Step 0 / 1200');
  await page.locator('#play').press('Enter');
  const paused = await page.locator('#stepCount').textContent();
  await page.locator('#undo').press('Enter');
  await expect(page.locator('#stepCount')).toHaveText('Step 0 / 1200');
  await page.locator('#redo').press('Enter');
  await expect(page.locator('#stepCount')).toHaveText(paused);
  for (const id of ['seam', 'blanket', 'gate', 'rim', 'wrap', 'ring', 'bridge']) {
    await page.locator('#case').selectOption(id);
    await expect(page.locator('#stepCount')).toHaveText('Step 0 / 1200');
    await expect(page.locator('#undo')).toBeDisabled();
    await page.locator('#single').press('Enter');
    await expect(page.locator('#stepCount')).toHaveText('Step 1 / 1200');
  }
  await page.locator('#case').selectOption('spark');
  await expect(page.locator('#stepCount')).toHaveText(paused);
  await page.locator('#zoom').check();
  expect(await page.locator('#board').evaluate(element => element.offsetWidth)).toBeGreaterThanOrEqual(630);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('019 cell CSV and JSON backups preserve snapshots, reject malformed data and protect composition', async ({page, context}) => {
  await page.goto(route);
  await page.locator('#case').selectOption('wrap');
  await page.locator('#capture').press('Enter');
  await page.locator('#single').press('Enter');
  await page.locator('#note').fill('Saved note');
  const original = JSON.parse(await downloadText(page, '#backup'));
  expect(original).toEqual(await save(page));
  const csv = (await downloadText(page, '#csv')).split('\n');
  expect(csv).toHaveLength(141);
  expect(csv[1 + 4 * 14 + 13]).toBe('14,5,1,wrap,20,standard,36.00,0,20.00,16.00');
  await page.locator('#file').setInputFiles(file({version: 1}));
  await expect(page.locator('#notice')).toContainText('Your work was kept');
  expect(await save(page)).toEqual(original);
  await page.evaluate(() => {
    const read = File.prototype.text;
    File.prototype.text = function () {
      return new Promise(resolve => { window.finishRead = async () => resolve(await read.call(this)); });
    };
  });
  const backup = file(await page.evaluate(() => HeatMosaic.fresh()));
  const picker = page.waitForEvent('filechooser');
  await page.locator('#import').press('Enter');
  await (await picker).setFiles(backup);
  await page.locator('#note').focus();
  const cdp = await context.newCDPSession(page);
  const draft = '保留正在组字的笔记';
  await cdp.send('Input.imeSetComposition', {
    text: draft, selectionStart: draft.length, selectionEnd: draft.length, replacementStart: 0, replacementEnd: 10,
  });
  await expect(page.locator('#note')).toHaveValue(draft);
  await page.evaluate(() => window.finishRead());
  await expect(page.locator('#notice')).toContainText('Your work was kept');
  expect(await save(page)).toEqual(original);
  await cdp.send('Input.insertText', {text: draft});
  expect((await save(page)).runs.wrap.note).toBe(draft);
  await page.locator('#file').setInputFiles(file(original));
  await page.evaluate(() => window.finishRead());
  await expect(page.locator('#notice')).toContainText('All eight experiments were imported');
  expect(await save(page)).toEqual(original);
});

test('019 runs offline with blocked storage and still offers downloads and the guide', async ({page, context}) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw Error('blocked'); }; });
  await context.setOffline(true);
  await page.goto(new URL('../public/apps/019-heat-mosaic/index.html?lang=en', import.meta.url).href);
  await page.locator('#brush').selectOption('100');
  await tile(page, 7, 4).press('Enter');
  await expect(temperature(page)).toHaveText('100.00');
  await page.locator('#single').press('Enter');
  await expect(temperature(page)).toHaveText('52.00');
  await expect(page.locator('#storage')).toContainText('storage is unavailable');
  await page.locator('#note').fill('Offline measurement');
  expect(JSON.parse(await downloadText(page, '#backup')).runs.spark.note).toBe('Offline measurement');
  await page.locator('#programBackground summary').press('Enter');
  await expect(page.locator('#programBackground')).toContainText('1822');
});

test('019 recovery restores all pre-import experiments and expires on a new edit', async ({page}) => {
  await page.goto(route);
  await page.locator('#note').fill('Original hot spot / 初始热斑');
  await page.locator('#case').selectOption('wrap');
  await page.locator('#twelve').press('Enter');
  await page.locator('#capture').press('Enter');
  await page.locator('#note').fill('Across the edge / 跨边');
  const before = await save(page);
  const backup = file(await page.evaluate(() => HeatMosaic.fresh()));
  await page.locator('#file').setInputFiles(backup);
  const recover = page.locator('#recoverImport');
  await expect(recover).toHaveText('Recover work from before import');
  await expect(recover).toBeVisible();
  await page.locator('#case').selectOption('bridge');
  await tile(page, 9, 4).press('Enter');
  await page.locator('[data-program-language=zh]').press('Enter');
  await expect(recover).toHaveText('找回导入前的数据');
  await recover.press('Enter');
  await expect(page.locator('#import')).toBeFocused();
  await expect(page.locator('#note')).toHaveValue('Across the edge / 跨边');
  expect(await save(page)).toEqual(before);
  await expect(recover).toBeHidden();

  await page.locator('#file').setInputFiles(backup);
  await expect(recover).toBeVisible();
  await page.locator('#note').fill('New work after import');
  await expect(recover).toBeHidden();
  expect((await save(page)).runs.spark.note).toBe('New work after import');
});
