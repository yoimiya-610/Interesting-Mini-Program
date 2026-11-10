import {test, expect} from '@playwright/test';

const route = '/apps/021-die-tracks/index.html?lang=en';
const key = 'imp-021-die-tracks-v1';
const keys = {N: 'ArrowUp', E: 'ArrowRight', S: 'ArrowDown', W: 'ArrowLeft'};
const stored = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const file = data => ({name: 'die-tracks.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data))});

async function follow(page, route) {
  await page.locator('#board').focus();
  for (const direction of route) await page.keyboard.press(keys[direction]);
}

async function downloadText(page, selector) {
  const pending = page.waitForEvent('download');
  await page.locator(selector).press('Enter');
  const stream = await (await pending).createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString();
}

test('021 the board responds to keyboard and touch and reports wrong top faces', async ({page}) => {
  await page.goto(route);
  await expect(page.locator('#level option')).toHaveCount(16);
  await expect(page.locator('#board')).toHaveAttribute('aria-label', /column 1, row 1.*Top 1.*Bottom 6/);
  await page.locator('#board').press('ArrowLeft');
  await expect(page.locator('#status')).toContainText('edge blocks');
  await page.locator('[data-roll=E]').click();
  await expect(page.locator('[data-face=bottom] dd')).toHaveText('4');
  await page.locator('#board').press('d');
  await expect(page.locator('#status')).toHaveText('Maze complete.');
  await expect(page.locator('#record')).toContainText('Unassisted best 2');
  await page.locator('#next').press('Enter');
  await expect(page.locator('#level')).toHaveValue('02');
  await expect(page.locator('#board')).toBeFocused();
  await page.locator('#level').selectOption('03');
  await follow(page, 'E');
  await expect(page.locator('#board')).toHaveAttribute('aria-label', /Bottom 4.*Bottom required 4/);
  await follow(page, 'EE');
  await expect(page.locator('#status')).toHaveText('Maze complete.');
  await page.locator('#level').selectOption('04');
  await follow(page, 'E');
  await expect(page.locator('#status')).toContainText('The top needs to be 2');
  await follow(page, 'SENW');
  await expect(page.locator('#status')).toHaveText('Maze complete.');
  await expect(page.locator('#record')).toContainText('Unassisted best 5');
});

test('021 numbered gates block invalid landings and hints record a distinct attempt', async ({page}) => {
  await page.goto(route);
  await page.locator('#level').selectOption('08');
  await page.locator('[data-roll=E]').press('Enter');
  await expect(page.locator('#status')).toHaveText('Tile needs bottom 3. That roll would put 4 underneath.');
  await expect(page.locator('#record')).toContainText('Current rolls 0 · Minimum 14');
  await page.locator('#hint').press('Enter');
  await expect(page.locator('#status')).toContainText('Next roll: North');
  await expect(page.locator('#record')).toContainText('Hinted attempt');
  await follow(page, 'NWSWSWWSENNEEN');
  await expect(page.locator('#status')).toHaveText('Maze complete.');
  await expect(page.locator('#record')).toContainText('Hinted best 14');
  await expect(page.locator('#record')).toContainText('Unassisted best none yet');
  await page.locator('#board').press('u');
  await expect(page.locator('#status')).not.toHaveText('Maze complete.');
  await page.locator('#board').press('y');
  await expect(page.locator('#status')).toHaveText('Maze complete.');
  await page.locator('#reset').press('Enter');
  await expect(page.locator('#record')).toContainText('Unassisted attempt');
  await expect(page.locator('#record')).toContainText('Hinted best 14');
});

test('021 the late maze can be solved without hints and preserved across language and reload', async ({page}, info) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(route);
  await page.locator('#level').selectOption('16');
  const path = 'NNEEENWNNWWSENWWSESSSSWNENEEEN';
  await follow(page, path.slice(0, 12));
  await page.locator('#programBackground summary').press('Enter');
  await expect(page.locator('#programBackground')).toContainText('Martin Gardner');
  await page.locator('#note').fill('Return with top 4 / 回到末角');
  await page.locator('[data-program-language=zh]').press('Enter');
  await expect(page.locator('#levelTitle')).toContainText('回到末角');
  await expect(page.locator('#note')).toHaveValue('Return with top 4 / 回到末角');
  await expect(page.locator('#record')).toContainText('当前步数 12 · 最少 30');
  await page.locator('#board').scrollIntoViewIfNeeded();
  await page.screenshot({path: info.outputPath('021-late-typography.png'), fullPage: true});
  await page.reload();
  await follow(page, path.slice(12));
  await expect(page.locator('#status')).toHaveText('已完成迷宫。');
  await expect(page.locator('[data-face=top] dd')).toHaveText('4');
  await expect(page.locator('#record')).toContainText('无提示纪录 30');
  expect((await stored(page)).runs['16'].best).toBe(path);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('021 routes and notes round-trip with malformed import rejection and recovery', async ({page}) => {
  await page.goto(route);
  await follow(page, 'EE');
  await page.locator('#undo').press('Enter');
  await page.locator('#note').fill('Original start / 起点');
  const prior = await stored(page);
  const backup = JSON.parse(await downloadText(page, '#backup'));
  expect(backup).toEqual(prior);
  expect(await downloadText(page, '#text')).toContain('Best unassisted route → →');
  backup.runs['01'].path = 'W';
  await page.locator('#file').setInputFiles(file(backup));
  await expect(page.locator('#notice')).toContainText('Your work was kept');
  expect(await stored(page)).toEqual(prior);
  const pending = page.waitForEvent('filechooser');
  await page.locator('#import').press('Enter');
  await (await pending).setFiles(file(await page.evaluate(() => DieTracks.fresh())));
  await expect(page.locator('#notice')).toContainText('All sixteen mazes were imported');
  await page.locator('#level').selectOption('04');
  await page.locator('#recover').press('Enter');
  await expect(page.locator('#note')).toHaveValue('Original start / 起点');
  expect(await stored(page)).toEqual(prior);
  await page.locator('#redo').press('Enter');
  await expect(page.locator('#status')).toHaveText('Maze complete.');
});

test('021 backup reads protect active composition and the maze works as an offline file', async ({page, context}) => {
  await page.goto(route);
  await page.locator('#note').fill('Saved note');
  const backup = file(await page.evaluate(() => DieTracks.fresh()));
  await page.evaluate(() => {
    const read = File.prototype.text;
    File.prototype.text = function () {
      return new Promise(resolve => { window.finishRead = async () => resolve(await read.call(this)); });
    };
  });
  await page.locator('#file').setInputFiles(backup);
  await page.locator('#note').focus();
  const cdp = await context.newCDPSession(page);
  const text = '保留输入中的笔记';
  await cdp.send('Input.imeSetComposition', {text, selectionStart: text.length, selectionEnd: text.length, replacementStart: 0, replacementEnd: 10});
  await expect(page.locator('#note')).toHaveValue(text);
  await page.evaluate(() => window.finishRead());
  await expect(page.locator('#notice')).toContainText('Your work was kept');
  expect((await stored(page)).runs['01'].note).toBe('Saved note');
  await cdp.send('Input.insertText', {text});
  expect((await stored(page)).runs['01'].note).toBe(text);
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw Error('blocked'); }; });
  await context.setOffline(true);
  await page.goto(new URL('../public/apps/021-die-tracks/index.html?lang=en', import.meta.url).href);
  await follow(page, 'EE');
  await expect(page.locator('#status')).toHaveText('Maze complete.');
  await expect(page.locator('#storage')).toContainText('storage is unavailable');
  await page.locator('#programBackground summary').press('Enter');
  await expect(page.locator('#programBackground')).toContainText('quarter turn');
  await page.getByText('Read the text map', {exact: true}).press('Enter');
  await expect(page.locator('#textMap')).toContainText('[G]');
  expect(await downloadText(page, '#text')).toContain('Best unassisted route → →');
});
