import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const context = vm.createContext({});
for (const file of ['content.js', 'core.js']) vm.runInContext(readFileSync(new URL('../public/apps/022-story-cut-desk/' + file, import.meta.url), 'utf8'), context);
const C = context.StoryCut;
const plain = value => JSON.parse(JSON.stringify(value));
const paired = pair => Array.isArray(pair) && pair.length === 2 && pair[0].trim() && pair[1].trim() && !/[\u3400-\u9fff]/.test(pair[1]);

test('Eight complete authored bilingual stories have 64 distinct passages and specific cue pairs', () => {
  assert.equal(C.cases.length, 8);
  const texts = new Set();
  for (const source of C.cases) {
    assert(paired(source.name) && paired(source.premise));
    assert.equal(source.prompts.length, 2); assert(source.prompts.every(paired));
    assert(C.validOrder(source.suggested));
    assert.notDeepEqual(plain(source.suggested), C.chronological());
    assert.equal(source.events.length, 8); assert.equal(source.threads.length, 3);
    for (const event of source.events) {
      assert(paired(event.title) && paired(event.text));
      assert(event.text[0].length >= 40 && event.text[1].split(/\s+/).length >= 24);
      assert(!texts.has(event.text[0])); texts.add(event.text[0]);
    }
    for (const t of source.threads) {
      assert(paired(t.label)); assert(Number.isInteger(t.clue) && Number.isInteger(t.answer));
      assert(t.clue >= 0 && t.clue < 8 && t.answer >= 0 && t.answer < 8 && t.clue !== t.answer);
    }
    assert(C.analyze(source, source.suggested).threads.some(t => t.cue < t.answer));
  }
  assert.equal(texts.size, 64);
});

test('All 40,320 telling orders match an independent pair and prefix oracle', () => {
  const source = C.cases[0]; let checked = 0;
  function permute(prefix, rest) {
    if (rest.length) {
      for (const n of rest) permute([...prefix, n], rest.filter(v => v !== n));
      return;
    }
    const cursor = checked % 9;
    const actual = C.analyze(source, prefix, cursor);
    let inversions = 0;
    for (let a = 0; a < 8; a++) for (let b = a + 1; b < 8; b++) if (prefix.indexOf(a) > prefix.indexOf(b)) inversions++;
    assert.equal(actual.inversions, inversions);
    const open = [];
    for (let count = 0; count <= 8; count++) {
      const reached = new Set(prefix.slice(0, count));
      open.push(source.threads.filter(t => reached.has(t.clue) && !reached.has(t.answer)).length);
    }
    assert.deepEqual(plain(actual.openByStep), open); assert.equal(actual.peak, Math.max(...open));
    actual.threads.forEach((t, i) => {
      const cue = prefix.indexOf(source.threads[i].clue) + 1;
      const answer = prefix.indexOf(source.threads[i].answer) + 1;
      assert.equal(t.cue, cue); assert.equal(t.answer, answer);
      assert.equal(t.between, Math.max(0, answer - cue - 1));
      const expected = cue > cursor && answer > cursor ? 'unread'
        : cue <= cursor && answer > cursor ? 'waiting'
        : answer <= cursor && cue > cursor ? 'answer-first'
        : cue < answer ? 'resolved' : 'given';
      assert.equal(t.state, expected);
    });
    checked++;
  }
  permute([], [0, 1, 2, 3, 4, 5, 6, 7]); assert.equal(checked, 40320);
});

test('Moves preserve chronology markers and checkpoint comparisons include literal rewrites', () => {
  const cut = C.blankCut(), original = plain(cut);
  cut.order = C.move(cut.order, 4, 0);
  assert.deepEqual(plain(cut.order), [4, 0, 1, 2, 3, 5, 6, 7]);
  assert.deepEqual(plain(C.move(cut.order, 4, 4)), original.order);
  cut.texts[4] = ''; cut.note = 'My 中文 note';
  const diff = C.differences(cut, original);
  assert.equal(diff[4].before, 5); assert.equal(diff[4].after, 1); assert(diff[4].textChanged);
  assert.equal(C.textFor(C.cases[0], cut, 4, 'en'), '');
  assert.equal(C.textFor(C.cases[0], cut, 4, 'zh'), '');
  assert.equal(C.textFor(C.cases[0], cut, 0, 'en'), C.cases[0].events[0].text[1]);
  assert.throws(() => C.move([0, 0, 1, 2, 3, 4, 5, 6], 0, 4), {name: 'RangeError'});
});

test('Full capacity backups fit their byte limit and malformed imports reject atomically', () => {
  const data = C.fresh();
  for (const source of C.cases) {
    const entry = data.entries[source.id];
    entry.cut.texts = Array(8).fill('\ud800'.repeat(1200)); entry.cut.note = '\ud800'.repeat(1000);
    entry.cut.order = [...source.suggested]; entry.checkpoint = C.copy(entry.cut); entry.cursor = 8; entry.selected = 7;
  }
  const text = JSON.stringify(data); assert(Buffer.byteLength(text) < C.maxBackup);
  assert.deepEqual(plain(C.restore(JSON.parse(text))), plain(data));
  for (const corrupt of [
    raw => { raw.entries.clock.cut.order[0] = raw.entries.clock.cut.order[1]; },
    raw => { raw.entries.clock.cut.texts[0] += 'x'; },
    raw => { raw.entries.clock.checkpoint.note += 'x'; },
    raw => { raw.entries.clock.selected = 8; },
    raw => { raw.entries.clock.cursor = '8'; },
    raw => { delete raw.entries.clock.checkpoint; },
    raw => { raw.active = 'other'; },
  ]) {
    const raw = JSON.parse(text); corrupt(raw);
    assert.equal(C.restore(raw), null);
    assert.equal(JSON.stringify(data), text);
  }
});
