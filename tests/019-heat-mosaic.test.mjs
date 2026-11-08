import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const context = vm.createContext({});
for (const file of ['content.js', 'core.js']) {
  vm.runInContext(readFileSync(new URL('../public/apps/019-heat-mosaic/' + file, import.meta.url), 'utf8'), context);
}
const C = context.HeatMosaic;
const approx = (actual, expected) => assert(Math.abs(actual - expected) < 1e-10, actual + ' differs from ' + expected);
const frame = id => C.initial(C.caseFor(id));
const at = (board, x, y) => board.temp[C.index(x, y)];

test('Eight bilingual experiments have distinct authored plates and tasks', () => {
  assert.equal(C.cases.length, 8);
  assert.equal(new Set(C.cases.map(item => item.task[1])).size, 8);
  assert.equal(new Set(C.cases.map(item => JSON.stringify(C.initial(item)))).size, 8);
  assert.equal(new Set(C.cases.map(item => item.edge)).size, 3);
  for (const item of C.cases) {
    for (const pair of [item.name, item.task]) {
      assert.match(pair[0], /[\u3400-\u9fff]/);
      assert(pair[1].trim() && !/[\u3400-\u9fff]/.test(pair[1]));
    }
    for (const [x, y, w, h] of [...item.heat, ...item.material]) {
      assert(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= C.width && y + h <= C.height, item.id);
    }
  }
});

test('One step matches hand calculations for hot spots, seams and three edge conditions', () => {
  const spark = C.advance(frame('spark'), 1);
  for (const [x, y] of [[6, 4], [6, 3], [7, 4], [6, 5], [5, 4]]) approx(at(spark, x, y), 36);
  approx(at(spark, 7, 5), 20);
  const seam = C.advance(frame('seam'), 1);
  assert.deepEqual([5, 6, 7, 8].map(x => at(seam, x, 4)), [80, 64, 16, 0]);
  const rim = frame('rim');
  const cooled = C.advance(rim, 1);
  assert.deepEqual([[0, 0], [0, 4], [4, 4]].map(([x, y]) => at(cooled, x, y)), [56, 68, 80]);
  const sealed = C.advance({...rim, edge: 'sealed'}, 1);
  assert(sealed.temp.every(value => value === 80));
  const wrapped = frame('wrap');
  approx(at(C.advance(wrapped, 1), 13, 4), 36);
  approx(at(C.advance({...wrapped, edge: 'sealed'}, 1), 13, 4), 20);
});

test('Closing the gap separates the halves, while slow material reduces seam flow', () => {
  const gate = frame('gate');
  const open = C.advance(gate, 12);
  const closedMaterial = Array.from(gate.material);
  for (const y of [4, 5]) closedMaterial[C.index(7, y)] = 'blocked';
  const closed = C.advance({...gate, material: closedMaterial}, 12);
  assert(at(open, 8, 4) > at(closed, 8, 4) + 2);
  approx(at(closed, 7, 4), 20);
  const blanket = frame('blanket');
  const first = C.advance(blanket, 1);
  const normal = C.advance({...blanket, material: Array(C.size).fill('standard')}, 1);
  approx(at(first, 6, 4), 24);
  approx(at(normal, 6, 4), 32);
});

function referenceStep(board) {
  const factor = {standard: 1, slow: 0.2, blocked: 0};
  return Array.from(board.temp, (start, i) => {
    const x = i % C.width, y = Math.floor(i / C.width);
    const self = factor[board.material[i]];
    if (!self) return start;
    let result = start;
    for (let [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      const outside = nx < 0 || ny < 0 || nx === C.width || ny === C.height;
      if (outside && board.edge !== 'wrap') {
        if (board.edge === 'ambient') result += (20 - start) * self * board.rate / 100;
        continue;
      }
      nx = (nx + C.width) % C.width;
      ny = (ny + C.height) % C.height;
      const neighbor = ny * C.width + nx;
      const other = factor[board.material[neighbor]];
      if (other) result += (board.temp[neighbor] - start) * 2 * board.rate / (100 * (1 / self + 1 / other));
    }
    return result;
  });
}

test('Independent per-cell updates agree through 48 mixed runs and stay bounded', () => {
  let seed = 427;
  function pick(n) {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return (seed >>> 8) % n;
  }
  for (let i = 0; i < 48; i++) {
    const board = {
      temp: Array.from({length: C.size}, () => pick(101)),
      material: Array.from({length: C.size}, () => ['standard', 'slow', 'blocked'][pick(3)]),
      edge: C.edges[i % 3], rate: C.rates[i % 2], steps: 0,
    };
    const snapshot = JSON.stringify(board);
    let reference = board;
    for (let step = 0; step < 60; step++) reference = {...reference, temp: referenceStep(reference)};
    const actual = C.advance(board, 60);
    actual.temp.forEach((value, cell) => {
      approx(value, reference.temp[cell]);
      assert(value >= 0 && value <= 100);
      if (board.material[cell] === 'blocked') assert.equal(value, board.temp[cell]);
    });
    if (board.edge !== 'ambient') approx(C.metrics(actual.temp).mean, C.metrics(board.temp).mean);
    assert.equal(JSON.stringify(board), snapshot);
  }
  const capped = C.advance({...frame('spark'), steps: C.maxSteps - 1}, 12);
  assert.equal(capped.steps, C.maxSteps);
  approx(at(capped, 6, 4), 36);
});

test('Complete backup capacity preserves all boards, snapshots and literal notes', () => {
  const state = C.fresh();
  for (const run of Object.values(state.runs)) {
    run.board.temp.fill(1.2345678901234567e-299);
    run.board.material.fill('standard');
    run.note = '\ud800'.repeat(1000);
    run.snapshot = C.copy(run.board);
  }
  const serialized = JSON.stringify(state);
  assert(Buffer.byteLength(serialized) < C.maxBackup);
  assert.deepEqual(JSON.parse(JSON.stringify(C.restore(JSON.parse(serialized)))), JSON.parse(serialized));
  for (const corrupt of [
    raw => { raw.runs.spark.board.temp[0] = 101; },
    raw => { raw.runs.spark.board.material[0] = ['standard']; },
    raw => { raw.runs.spark.snapshot.edge = 'unrecognized'; },
    raw => { raw.runs.spark.probe = C.size; },
    raw => { delete raw.runs.spark; },
  ]) {
    const raw = JSON.parse(serialized);
    corrupt(raw);
    assert.equal(C.restore(raw), null);
  }
});
