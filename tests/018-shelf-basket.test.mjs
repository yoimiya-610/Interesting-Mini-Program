import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const context = vm.createContext({});
for (const file of ['content.js', 'core.js']) {
  vm.runInContext(readFileSync(new URL('../public/apps/018-shelf-basket/' + file, import.meta.url), 'utf8'), context);
}
const {CASES, MAX_BACKUP_BYTES, fresh, inspect, makeCase, plan, parseFixed, restore,
  compareUnitPrice, roundedUnitCents} = context.ShelfBasket;
const plain = value => JSON.parse(JSON.stringify(value));
const signature = basket => basket ? [basket.cost, basket.quantity, basket.packs] : null;

test('Eight complete bilingual cases cover distinct shopping decisions', () => {
  const expected = {
    oats: [[1350, 1000, 1], [1360, 900, 2]],
    beans: [[1700, 1000, 2], [1700, 1000, 2]],
    juice: [[1580, 1500, 3], [1580, 1500, 3]],
    soap: [[1500, 1200, 2], [1500, 1200, 2]],
    envelopes: 'quantityGap',
    clips: 'budgetGap',
    tea: [[1080, 27, 3], [1080, 27, 3]],
    clay: 'shortStock',
  };
  const pair = value => value.length === 2 && /[\u3400-\u9fff]/.test(value[0]) &&
    value[1].trim() && !/[\u3400-\u9fff]/.test(value[1]);
  assert.deepEqual(Object.keys(fresh().cases), Object.keys(expected));
  assert.equal(new Set(CASES.map(item => item.task[1])).size, 8);
  for (const item of CASES) {
    assert([item.name, item.brief, item.task].every(pair), item.id);
    assert.equal(item.offers.length, 4);
    assert(item.offers.every(offer => pair(offer[0])));
    const draft = makeCase(item);
    const model = inspect(item, draft);
    assert.deepEqual(plain(model.errors), {});
    const actual = plan(model);
    assert.deepEqual(actual.reason || [signature(actual.cheapest), signature(actual.closest)], expected[item.id]);
    if (item.id === 'oats') {
      assert.equal([...model.offers].sort(compareUnitPrice)[0].id, 2);
    }
    if (item.id === 'beans') assert.equal(actual.single, null);
    if (item.id === 'tea') assert(model.offers.every(offer => compareUnitPrice(offer, model.offers[0]) === 0));
    if (item.id === 'clay') {
      assert.equal(actual.available, 1750);
      draft.offers[3].stock = '1';
      assert(plan(inspect(item, draft)).cheapest);
    }
  }
});

test('Inputs preserve cents and base units, and rate ranking distinguishes rounded ties', () => {
  assert.equal(parseFixed(' 0.125 ', 3, 30000), 125);
  assert.equal(parseFixed('30', 3, 30000), 30000);
  assert.equal(parseFixed('9.9', 2, 999999), 990);
  assert.equal(parseFixed('0', 2, 999999), 0);
  for (const input of ['', '0x10', '1e3', '-1', '0.001', '1,00', '10000', '1'.repeat(21)]) {
    assert.equal(parseFixed(input, 2, 999999), null, input);
  }
  const a = {price: 200, quantity: 1000}, b = {price: 201, quantity: 1000};
  assert.equal(roundedUnitCents(a, 100), roundedUnitCents(b, 100));
  assert(compareUnitPrice(a, b) < 0);
  const draft = makeCase(CASES[0]);
  draft.target = '29999';
  draft.surplus = '2';
  draft.offers[0].stock = '13';
  assert.deepEqual(plain(inspect(CASES[0], draft).errors), {surplus: 'surplus', 'stock-0': 'stock'});
});

function enumerate({offers, target, surplus, budget}) {
  const all = [];
  function visit(counts, quantity, cost) {
    if (counts.length === offers.length) {
      if (quantity >= target && quantity <= target + surplus) {
        all.push({counts, quantity, cost, packs: counts.reduce((sum, count) => sum + count, 0)});
      }
      return;
    }
    const offer = offers[counts.length];
    for (let count = 0; count <= offer.stock; count++) {
      visit([...counts, count], quantity + count * offer.quantity, cost + count * offer.price);
    }
  }
  visit([], 0, 0);
  const byCost = (a, b) => a.cost - b.cost || a.quantity - b.quantity || a.packs - b.packs;
  all.sort(byCost);
  const feasible = all.filter(basket => budget === null || basket.cost <= budget);
  const efficient = feasible.filter(basket => !feasible.some(other =>
    other.quantity <= basket.quantity && other.cost <= basket.cost &&
    (other.quantity < basket.quantity || other.cost < basket.cost)));
  const frontier = [...new Map(efficient.reverse().map(basket => [basket.quantity, basket])).values()]
    .sort((a, b) => a.quantity - b.quantity);
  return {all, feasible, frontier, single: feasible.find(basket => basket.counts.filter(Boolean).length === 1)};
}

test('The optimizer agrees with independent enumeration of 320 bounded shelves', () => {
  let seed = 937;
  const random = max => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return (seed >>> 8) % max;
  };
  for (let iteration = 0; iteration < 320; iteration++) {
    const model = {
      target: 1 + random(25), surplus: random(16), budget: iteration % 4 ? random(20) : null,
      offers: Array.from({length: 1 + random(5)}, () => ({
        stock: random(4), quantity: 1 + random(12), price: random(10),
      })),
    };
    const actual = plan(model);
    const {all, feasible, frontier, single} = enumerate(model);
    if (!feasible.length) {
      const available = model.offers.reduce((sum, row) => sum + row.stock * row.quantity, 0);
      assert.equal(actual.reason, available < model.target ? 'shortStock' : all.length ? 'budgetGap' : 'quantityGap');
      if (all.length) assert.equal(actual.minimumCost, all[0].cost);
      continue;
    }
    assert.deepEqual(signature(actual.cheapest), signature(feasible[0]));
    assert.deepEqual(signature(actual.closest), signature(frontier[0]));
    assert.deepEqual(signature(actual.single), signature(single));
    assert.equal(actual.frontierCount, frontier.length);
    assert.deepEqual(Array.from(actual.alternatives, signature), frontier.slice(0, 12).map(signature));
    for (const basket of [actual.cheapest, actual.closest, ...actual.alternatives, actual.single].filter(Boolean)) {
      assert(feasible.some(other => other.counts.join() === basket.counts.join()), 'backtracked basket must be feasible');
      assert.deepEqual(signature(basket), signature(feasible.find(other => other.counts.join() === basket.counts.join())));
    }
  }
});

test('Full-size backups preserve incomplete inputs and reject malformed cases atomically', () => {
  const original = fresh();
  for (const draft of Object.values(original.cases)) {
    draft.note = '\ud800'.repeat(1000);
    draft.offers = Array.from({length: 8}, (_, id) => ({
      id, unit: draft.offers[0].unit, name: '\u0000'.repeat(60),
      quantity: '\ud800'.repeat(20), price: '\u0000'.repeat(20), stock: 'unfinished', count: 12,
    }));
    draft.budget = '\ud800'.repeat(20);
  }
  const text = JSON.stringify(original, null, 2);
  assert(Buffer.byteLength(text) < MAX_BACKUP_BYTES);
  assert.deepEqual(plain(restore(JSON.parse(text))), JSON.parse(text));
  for (const corrupt of [
    value => { value.cases.oats.offers[0].count = 13; },
    value => { value.cases.oats.offers[0].unit = 'each'; },
    value => { value.cases.oats.offers[0].id = 1; },
    value => { delete value.cases.tea; },
  ]) {
    const invalid = JSON.parse(text);
    corrupt(invalid);
    assert.equal(restore(invalid), null);
  }
});
