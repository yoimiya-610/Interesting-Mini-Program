import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const context = vm.createContext({});
for (const path of ['content.js', 'core.js']) {
  vm.runInContext(readFileSync(new URL('../public/apps/020-bit-repair-lab/' + path, import.meta.url), 'utf8'), context);
}
const C = context.BitRepair;
const plain = value => JSON.parse(JSON.stringify(value));

function referenceWord(payload) {
  const [a, b, c, d] = payload.toString(2).padStart(4, '0').split('').map(Number);
  const seven = [a ^ b ^ d, a ^ c ^ d, a, b ^ c ^ d, b, c, d];
  return [...seven, seven.reduce((sum, bit) => sum + bit, 0) % 2];
}

test('Eight authored experiments cover distinct decoder and outcome combinations', () => {
  const expected = [
    [0, 0, 0, 'right', 'right'], [3, 3, 3, 'right', 'right'],
    [4, 4, 4, 'right', 'right'], [0, 0, 8, 'right', 'right'],
    [6, 6, 0, 'wrong', 'held'], [7, 7, 0, 'right', 'held'],
    [0, 0, 8, 'wrong', 'wrong'], [0, 0, 0, 'wrong', 'wrong'],
  ];
  assert.equal(C.cases.length, 8);
  assert.equal(new Set(C.cases.map(item => item.task[1])).size, 8);
  C.cases.forEach((item, i) => {
    for (const pair of [item.name, item.task, item.answer]) {
      assert.match(pair[0], /[\u3400-\u9fff]/);
      assert(pair[1].trim() && !/[\u3400-\u9fff]/.test(pair[1]));
    }
    const mask = C.maskFor(item.faults);
    const a = C.trial(item.payload, mask, 7);
    const b = C.trial(item.payload, mask, 8);
    assert.deepEqual([b.syndrome, a.flip, b.flip, a.outcome, b.outcome], expected[i], item.id);
  });
});

test('All 6,144 trials agree with a nearest-codeword oracle and guarantee checks', () => {
  for (const length of [7, 8]) {
    const codebook = Array.from({length: 16}, (_, value) => referenceWord(value).slice(0, length));
    const distance = (a, b) => a.reduce((sum, value, i) => sum + Number(value !== b[i]), 0);
    let minimum = length;
    for (const [i, word] of codebook.entries()) {
      assert.deepEqual(Array.from(C.encode(i)).slice(0, length), word);
      for (const other of codebook.slice(i + 1)) minimum = Math.min(minimum, distance(word, other));
      for (let mask = 0; mask < 2 ** length; mask++) {
        const received = word.map((bit, j) => bit ^ ((mask >> j) & 1));
        const candidates = codebook.flatMap((codeword, payload) => distance(codeword, received) <= 1 ? [payload] : []);
        assert(candidates.length <= 1);
        const actual = C.trial(i, mask, length);
        assert.equal(actual.payload, candidates[0] ?? null);
        assert.deepEqual(Array.from(actual.received), received);
        const faults = distance(received, word);
        if (faults <= 1) assert.equal(actual.outcome, 'right');
        if (length === 8 && faults === 2) assert.equal(actual.outcome, 'held');
        if (actual.word) assert.deepEqual(Array.from(actual.word), codebook[actual.payload]);
      }
    }
    assert.equal(minimum, length === 7 ? 3 : 4);
  }
});

test('Sweeps count all positions and their examples round-trip to the declared categories', () => {
  const expected = {
    7: [[1, 1, 0, 0], [7, 7, 0, 0], [21, 0, 0, 21], [35, 0, 0, 35], [35, 0, 0, 35], [21, 0, 0, 21], [7, 0, 0, 7], [1, 0, 0, 1]],
    8: [[1, 1, 0, 0], [8, 8, 0, 0], [28, 0, 28, 0], [56, 0, 0, 56], [70, 0, 56, 14],
      [56, 0, 0, 56], [28, 0, 28, 0], [8, 0, 0, 8], [1, 0, 0, 1]],
  };
  for (const length of [7, 8]) {
    for (const payload of [0, 9, 15]) {
      const rows = C.sweep(payload, length);
      assert.deepEqual(Array.from(rows, row => [row.total, row.right, row.held, row.wrong]), expected[length]);
      assert.equal(rows.reduce((sum, row) => sum + row.total, 0), 2 ** length);
      for (const row of rows) {
        for (const [name, mask] of Object.entries(row.samples)) {
          assert.equal(mask.toString(2).replaceAll('0', '').length, row.weight);
          assert.equal(C.trial(payload, mask, length).outcome, name);
        }
      }
    }
  }
});

test('Backups preserve complete experiments and reject malformed fields', () => {
  const original = C.fresh();
  for (const entry of Object.values(original.runs)) entry.note = '\ud800'.repeat(1000);
  const text = JSON.stringify(original);
  assert(Buffer.byteLength(text) < C.maxBackup);
  assert.deepEqual(plain(C.restore(JSON.parse(text))), JSON.parse(text));
  for (const change of [
    value => { value.runs.clean.payload = 16; },
    value => { value.runs.clean.mask = 256; },
    value => { value.runs.clean.note += 'a'; },
    value => { delete value.runs.clean; },
    value => { value.active = 'other'; },
  ]) {
    const value = JSON.parse(text);
    change(value);
    assert.equal(C.restore(value), null);
  }
});
