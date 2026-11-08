import {test, expect} from '@playwright/test';

const route = '/apps/018-shelf-basket/index.html?lang=en';
const state = page => page.evaluate(() => JSON.parse(localStorage.getItem('imp-018-shelf-basket-v1')));
const file = value => ({name: 'shelf-basket.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value))});
const plan = (page, title) => page.locator('#plans .plan').filter({has: page.getByText(title, {exact: true})});

async function downloadText(page, selector) {
  const pending = page.waitForEvent('download');
  await page.locator(selector).click();
  const stream = await (await pending).createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString();
}

test('018 separates lowest unit price, lowest checkout cost, and least surplus', async ({page}, info) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(route);
  await expect(page.locator('#rates li').first()).toContainText('Value bag · ¥1.27 per 100 g');
  const cheapest = plan(page, 'Lowest checkout cost');
  const closest = plan(page, 'Least surplus');
  await expect(cheapest).toContainText('¥13.50 · 1000 g · Surplus 100 g');
  await expect(closest).toContainText('¥13.60 · 900 g · Surplus 0 g');
  await cheapest.getByRole('button', {name: 'Use this basket'}).press('Enter');
  await expect(page.locator('#basket')).toBeFocused();
  await expect(page.locator('#count-3')).toHaveText('1');
  await page.locator('#basis').selectOption('1000');
  await expect(page.locator('#rates li').first()).toContainText('¥12.67 per kg');
  await expect(page.locator('#basket .tally')).toHaveText('¥13.50 · 1000 g');
  await closest.getByRole('button', {name: 'Use this basket'}).click();
  await page.locator('#stock-1').fill('1');
  await expect(page.locator('#basket')).toContainText('At least one offer exceeds its stock');
  await expect(page.locator('#count-1')).toHaveText('2');
  await page.locator('#undo').click();
  await expect(page.locator('#stock-1')).toHaveValue('2');
  await expect(page.locator('#basket')).toContainText('Fits all limits');
  await page.locator('#redo').click();
  await page.locator('#minus-1').press('Enter');
  await expect(page.locator('#basket')).toContainText('Still needed: 450 g');
  await page.locator('#undo').click();
  await page.locator('#undo').click();
  await page.locator('#programBackground summary').press('Enter');
  await expect(page.locator('#programBackground')).toContainText('NIST');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path: info.outputPath('018-edited-typography.png'), fullPage: true});
  expect(errors).toEqual([]);
});

test('018 offers intermediate cost and surplus choices for a custom shelf', async ({page}) => {
  await page.goto(route);
  await page.locator('#target').fill('9');
  await page.locator('#surplus').fill('3');
  for (const [index, quantity, price] of [[0, '9', '4'], [1, '10', '3'], [2, '11', '2'], [3, '0.012', '1']]) {
    await page.locator('#quantity-' + index).fill(quantity);
    await page.locator('#price-' + index).fill(price);
  }
  await page.getByText('More cost and surplus trade-offs', {exact: true}).press('Enter');
  await expect(plan(page, 'Trade-off 1')).toContainText('¥3.00 · 10 g · Surplus 1 g');
  await expect(plan(page, 'Trade-off 2')).toContainText('¥2.00 · 11 g · Surplus 2 g');
  await plan(page, 'Trade-off 2').getByRole('button').press('Enter');
  await expect(page.locator('#basket .tally')).toHaveText('¥2.00 · 11 g');
});

test('018 unit prices stay useful while shopping constraints or an offer are unfinished', async ({page}) => {
  await page.goto(route);
  await page.locator('#target').fill('');
  await page.locator('#stock-2').fill('unfinished');
  await expect(page.locator('#target')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#rates li')).toHaveCount(4);
  await expect(page.locator('#rates li').first()).toContainText('Value bag');
  await page.locator('#price-2').fill('');
  await expect(page.locator('#rates li')).toHaveCount(3);
  await expect(page.locator('#rates li').first()).toContainText('Family bag');
  await expect(page.locator('#rateNotice')).toContainText('valid pack quantity and price');
  await page.locator('[data-program-language=zh]').press('Enter');
  await expect(page.locator('#rateNotice')).toContainText('每包数量和价格有效');
  await expect(page.locator('#stock-2')).toHaveValue('unfinished');
  await page.locator('#price-2').fill('7.60');
  await expect(page.locator('#rates li')).toHaveCount(4);
  await expect(page.locator('#rateNotice')).toBeEmpty();
});

test('018 basket receipts preserve warnings and successful fits in both languages', async ({page}) => {
  await page.goto(route);
  await plan(page, 'Least surplus').getByRole('button').press('Enter');
  await page.locator('#stock-1').fill('1');
  await page.locator('#budget').fill('13.00');
  await page.locator('#target').fill('1000');
  const english = await downloadText(page, '#exportText');
  expect(english).toContain('At least one offer exceeds its stock');
  expect(english).toContain('Still needed: 100 g');
  expect(english).toContain('Over budget by ¥0.60');
  await page.locator('[data-program-language=zh]').press('Enter');
  const chinese = await downloadText(page, '#exportText');
  expect(chinese).toContain('有规格超过库存');
  expect(chinese).toContain('还差 100 g');
  expect(chinese).toContain('超出预算 ¥0.60');
  await page.locator('#resetCase').press('Enter');
  await page.locator('[data-program-language=en]').press('Enter');
  await plan(page, 'Lowest checkout cost').getByRole('button').press('Enter');
  expect(await downloadText(page, '#exportText')).toContain('Fits all limits with surplus 100 g');
});

test('018 all eight cases can be explored and each infeasible shelf suggests a different adjustment', async ({page}) => {
  await page.goto(route);
  const choose = id => page.locator('#case').selectOption(id);
  await expect(page.locator('#case option')).toHaveCount(8);
  await choose('beans');
  await expect(page.locator('#plans')).toContainText('The current limits require more than one offer');
  await expect(page.locator('#plans')).toContainText('Small loose bag × 1 · Large loose bag × 1');
  await choose('juice');
  await expect(page.locator('#plans')).toContainText('¥15.80 · 1500 mL');
  await choose('soap');
  await page.locator('#surplus').fill('0');
  await expect(page.locator('#plans')).toContainText('¥15.00 · 1200 mL');
  await choose('envelopes');
  await expect(page.locator('#plans')).toContainText('No whole-pack basket fits the quantity window');
  await page.locator('#surplus').fill('3');
  await expect(page.locator('#plans')).toContainText('40 items · Surplus 3 items');
  await choose('clips');
  await expect(page.locator('#plans')).toContainText('¥8.00, above the budget');
  await page.locator('#budget').fill('8.00');
  await expect(page.locator('#plans')).toContainText('¥8.00 · 28 items');
  await choose('tea');
  await expect(page.locator('#rates li').filter({hasText: 'Tied lowest rate'})).toHaveCount(3);
  await choose('clay');
  await expect(page.locator('#plans')).toContainText('1750 g, below your need');
  await expect(page.locator('#rates li').first()).toContainText('Sold out');
  await page.locator('#stock-3').fill('1');
  await expect(page.locator('#plans')).toContainText('2200 g');
  await choose('soap');
  await expect(page.locator('#surplus')).toHaveValue('0');
  await choose('oats');
  await expect(page.locator('#stock-3')).toHaveValue('1');
});

test('018 literal drafts survive language changes, reload, and full backup round-trip', async ({page}) => {
  await page.goto(route);
  await page.locator('#addOffer').press('Enter');
  await expect(page.locator('#name-4')).toBeFocused();
  await page.locator('#name-4').fill('Sample 样品');
  await page.locator('#plus-4').press('Enter');
  await page.locator('#note').fill('Keep my list.\n保留手写名称。');
  await page.locator('#quantity-4').fill('incomplete');
  await expect(page.locator('#quantity-4')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#exportText')).toBeDisabled();
  const original = await state(page);
  expect(JSON.parse(await downloadText(page, '#exportJson'))).toEqual(original);
  await page.locator('[data-program-language=zh]').press('Enter');
  await expect(page.locator('#name-4')).toHaveValue('Sample 样品');
  await page.reload();
  await expect(page.locator('#quantity-4')).toHaveValue('incomplete');
  await page.locator('[data-program-language=en]').press('Enter');
  await page.locator('#importFile').setInputFiles(file({version: 1}));
  await expect(page.locator('#notice')).toContainText('Your work was kept');
  expect(await state(page)).toEqual(original);
  await page.locator('#quantity-4').fill('1');
  const receipt = await downloadText(page, '#exportText');
  expect(receipt).toContain('Sample 样品 × 1');
  expect(receipt).toContain('Keep my list.\n保留手写名称。');
  await page.locator('#resetCase').click();
  await expect(page.locator('#name-4')).toHaveCount(0);
  const pendingPicker = page.waitForEvent('filechooser');
  await page.getByRole('button', {name: 'Import full backup'}).press('Enter');
  await (await pendingPicker).setFiles(file(original));
  await expect(page.locator('#notice')).toContainText('All eight cases imported');
  await expect(page.locator('#quantity-4')).toHaveValue('incomplete');
  await page.locator('#undo').click();
  await expect(page.locator('#name-4')).toHaveCount(0);
});

test('018 delayed backup reads preserve active Chinese text composition', async ({page, context}) => {
  await page.goto(route);
  await page.locator('#case').selectOption('tea');
  await page.locator('#note').fill('Saved note');
  const backup = file(await page.evaluate(() => ShelfBasket.fresh()));
  await page.evaluate(() => {
    const read = File.prototype.text;
    File.prototype.text = function () {
      return new Promise(resolve => { window.finishRead = async () => resolve(await read.call(this)); });
    };
  });
  await page.locator('#importFile').setInputFiles(backup);
  await page.locator('#note').focus();
  const cdp = await context.newCDPSession(page);
  const draft = '保留正在组字的笔记';
  await cdp.send('Input.imeSetComposition', {
    text: draft, selectionStart: draft.length, selectionEnd: draft.length, replacementStart: 0, replacementEnd: 10,
  });
  await expect(page.locator('#note')).toHaveValue(draft);
  await page.evaluate(() => window.finishRead());
  await expect(page.locator('#notice')).toContainText('Your work was kept');
  expect((await state(page)).cases.tea.note).toBe('Saved note');
  await cdp.send('Input.insertText', {text: draft});
  expect((await state(page)).cases.tea.note).toBe(draft);
  await page.locator('#importFile').setInputFiles(backup);
  await page.evaluate(() => window.finishRead());
  await expect(page.locator('#notice')).toContainText('All eight cases imported');
  await page.locator('#undo').click();
  await expect(page.locator('#case')).toHaveValue('tea');
  await expect(page.locator('#note')).toHaveValue(draft);
});

test('018 local file activity and exports work offline with blocked browser storage', async ({page, context}) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw Error('blocked'); }; });
  await context.setOffline(true);
  await page.goto(new URL('../public/apps/018-shelf-basket/index.html?lang=en', import.meta.url).href);
  await page.locator('#case').selectOption('beans');
  await plan(page, 'Lowest cost and least surplus').getByRole('button').press('Enter');
  await expect(page.locator('#basket .tally')).toHaveText('¥17.00 · 1000 g');
  await expect(page.locator('#storage')).toContainText('storage is unavailable');
  await page.locator('#note').fill('Offline plan');
  expect(await downloadText(page, '#exportText')).toContain('Offline plan');
  expect(JSON.parse(await downloadText(page, '#exportJson')).cases.beans.note).toBe('Offline plan');
  await page.locator('#programBackground summary').press('Enter');
  await expect(page.locator('#programBackground')).toContainText('NIST');
});
