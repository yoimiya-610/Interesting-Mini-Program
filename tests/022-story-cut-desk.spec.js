import {test, expect} from '@playwright/test';
const route = '/apps/022-story-cut-desk/index.html?lang=en';
const key = 'imp-022-story-cut-v1';
const stored = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const file = data => ({name: 'cuts.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data))});
async function download(page, id) {
  const waiting = page.waitForEvent('download'); await page.locator('#' + id).press('Enter');
  const chunks = [];
  for await (const chunk of await (await waiting).createReadStream()) chunks.push(chunk);
  return Buffer.concat(chunks).toString();
}

test('022 every authored cut is editable and its reader reveals actual passages step by step', async ({page}) => {
  await page.goto(route);
  const ids = await page.locator('#case option').evaluateAll(options => options.map(o => o.value));
  expect(ids).toHaveLength(8);
  for (const id of ids) {
    await page.locator('#case').selectOption(id); await page.locator('#suggested').press('Enter');
    await expect(page.locator('#sequence li')).toHaveCount(8);
    await expect(page.locator('#threads li')).toHaveCount(3);
    await expect(page.locator('#preview li')).toHaveCount(0);
    await page.locator('#next').press('Enter');
    await expect(page.locator('#preview li')).toHaveCount(1);
    const first = await page.locator('#preview p').first().innerText(); expect(first.length).toBeGreaterThan(80);
    await page.locator('#cursor').fill('8');
    await expect(page.locator('#preview li')).toHaveCount(8);
    await expect(page.locator('#next')).toBeDisabled();
    expect(await page.locator('#preview').innerText()).not.toMatch(/[\u3400-\u9fff]/);
  }
});

test('022 positions, keyboard moves and reader markers distinguish cues before and after answers', async ({page}) => {
  await page.goto(route);
  await page.locator('#suggested').press('Enter');
  await expect(page.locator('#metricHint')).toContainText('such as T5 before T2');
  await expect(page.locator('#transitionText')).toHaveText('T5 → T7 → T2 → T3 → T6 → T4 → T1 → T8');
  await page.locator('#next').press('Enter');
  await expect(page.locator('#threads li').nth(0)).toContainText('Cue reached, explanation still ahead');
  await page.locator('#cursor').fill('3');
  await expect(page.locator('#threads li').nth(0)).toContainText('Cue followed by its explanation');
  await expect(page.locator('#threads li').nth(0)).toContainText('Passages between 1');
  await page.locator('#event-4').press('Alt+ArrowDown');
  await expect(page.locator('#event-4')).toBeFocused();
  await expect(page.locator('#transitionText')).toHaveText('T7 → T5 → T2 → T3 → T6 → T4 → T1 → T8');
  await page.locator('#undo').press('Enter'); await page.locator('#redo').press('Enter');
  await page.locator('#position-1').selectOption('0');
  await expect(page.locator('#threads li').nth(0)).toContainText('Explanation preceded its cue');
  await page.locator('[data-program-language=zh]').press('Enter');
  await expect(page.locator('#status')).toHaveText('已更新编排。');
  await page.locator('[data-program-language=en]').press('Enter');
  await expect(page.locator('#status')).toHaveText('Cut updated.');
});

test('022 literal writing, focus-grouped undo and full comparisons survive language and reload', async ({page}, info) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(route); await page.locator('#suggested').press('Enter');
  await page.locator('#event-4').press('Enter');
  await page.locator('#draft').fill('Three hours earlier / 三小时前 <keep>');
  await page.locator('#draft').press('End'); await page.locator('#draft').pressSequentially('!');
  await page.locator('#note').fill('My note / 原笔记');
  await page.locator('#checkpoint').press('Enter');
  const kept = await stored(page);
  await page.locator('#draft').fill('A revised opening / 改写');
  await expect(page.locator('#comparison')).toContainText('Three hours earlier / 三小时前 <keep>!');
  await expect(page.locator('#comparison')).toContainText('A revised opening / 改写');
  await page.locator('#undo').press('Enter');
  await expect(page.locator('#draft')).toHaveValue('Three hours earlier / 三小时前 <keep>!');
  await page.locator('#redo').press('Enter');
  await page.locator('[data-program-language=zh]').press('Enter');
  await expect(page.locator('#draft')).toHaveValue('A revised opening / 改写');
  await expect(page.locator('#note')).toHaveValue('My note / 原笔记');
  await page.locator('#restoreCheckpoint').press('Enter');
  expect((await stored(page)).entries.clock.cut).toEqual(kept.entries.clock.cut);
  await page.locator('#cursor').fill('3');
  await page.locator('#preview').scrollIntoViewIfNeeded();
  await page.screenshot({path: info.outputPath('022-active-cut.png')});
  await page.reload();
  await expect(page.locator('#draft')).toHaveValue('Three hours earlier / 三小时前 <keep>!');
  await expect(page.locator('#undo')).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('022 complete backups and exports preserve every case and offer pre-import recovery', async ({page}) => {
  await page.goto(route); await page.locator('#draft').fill('Original literal / 保留');
  await page.locator('#note').fill('Note <&>'); await page.locator('#checkpoint').press('Enter');
  const original = await stored(page);
  const backup = JSON.parse(await download(page, 'backup')); expect(backup).toEqual(original);
  expect(await download(page, 'text')).toContain('Original literal / 保留');
  const full = await page.evaluate(() => StoryCut.fresh());
  for (const entry of Object.values(full.entries)) {
    entry.cut.texts = Array(8).fill('\ud800'.repeat(1200)); entry.cut.note = '\ud800'.repeat(1000);
    entry.checkpoint = structuredClone(entry.cut);
  }
  expect(file(full).buffer.byteLength).toBeLessThan(1500000);
  await page.locator('#file').setInputFiles(file(full));
  await expect(page.locator('#notice')).toContainText('All eight stories and comparisons were imported');
  expect(JSON.parse(await download(page, 'backup'))).toEqual(full);
  await page.locator('#case').selectOption('repair'); await page.locator('#cursor').fill('4');
  await page.locator('#recover').press('Enter'); expect(await stored(page)).toEqual(original);
  const invalid = structuredClone(original); invalid.entries.clock.cut.order[0] = 7;
  await page.locator('#file').setInputFiles(file(invalid));
  await expect(page.locator('#notice')).toContainText('Your work was kept'); expect(await stored(page)).toEqual(original);
});

test('022 delayed imports cannot replace active composition or later edits', async ({page, context}) => {
  await page.goto(route); await page.locator('#draft').fill('Saved literal');
  await page.evaluate(() => {
    const read = File.prototype.text;
    File.prototype.text = function () { return new Promise(resolve => { window.finishRead = async () => resolve(await read.call(this)); }); };
  });
  const backup = file(await page.evaluate(() => StoryCut.fresh()));
  await page.locator('#file').setInputFiles(backup); await page.locator('#draft').focus();
  const cdp = await context.newCDPSession(page), text = '输入中的文字';
  await cdp.send('Input.imeSetComposition', {text, selectionStart: text.length, selectionEnd: text.length, replacementStart: 0, replacementEnd: 13});
  await page.evaluate(() => window.finishRead());
  await expect(page.locator('#notice')).toContainText('Your work was kept');
  await expect(page.locator('#draft')).toHaveValue(text);
  await cdp.send('Input.insertText', {text}); expect((await stored(page)).entries.clock.cut.texts[0]).toBe(text);
});

test('022 offline file mode keeps editing, contextual reading and exports with storage blocked', async ({page, context}) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw Error('blocked'); }; });
  await context.setOffline(true);
  await page.goto(new URL('../public/apps/022-story-cut-desk/index.html?lang=en', import.meta.url).href);
  await page.locator('#case').selectOption('tape'); await page.locator('#suggested').press('Enter');
  await page.locator('#draft').fill('Offline transition'); await page.locator('#cursor').fill('8');
  await expect(page.locator('#preview')).toContainText('Offline transition');
  await expect(page.locator('#storage')).toContainText('storage is unavailable');
  await page.locator('#programBackground summary').press('Enter');
  await expect(page.locator('#programBackground')).toContainText('Gérard Genette');
  expect(await download(page, 'text')).toContain('Offline transition');
});
