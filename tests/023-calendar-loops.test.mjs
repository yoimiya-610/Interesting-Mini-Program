import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context = vm.createContext({});
for (const file of ['content.js', 'core.js']) vm.runInContext(readFileSync(new URL('../public/apps/023-calendar-loops/' + file, import.meta.url), 'utf8'), context);
const C = context.CalendarLoops, plain = v => JSON.parse(JSON.stringify(v));
const fresh = () => C.fresh('2028-01-31');
const model = () => fresh().entries.desk.model;
const rule = extra => C.compile({...model().tasks[0], ...extra});
const pair = p => p.length === 2 && p[0].trim() && p[1].trim() && !/[\u3400-\u9fff]/u.test(p[1]);
const leap = y => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
const days = (y, m) => [31, leap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
// Independent ordinal arithmetic: no Date, parse, or application recurrence functions.
const ordinal = iso => { const [y, m, d] = iso.split('-').map(Number); let n = 0; for (let k = 1900; k < y; k++) n += leap(k) ? 366 : 365; for (let k = 1; k < m; k++) n += days(y, k); return n + d - 1; };
const oracle = (t, iso) => {
  if (!t.enabled || iso < t.start || t.end && iso > t.end) return false;
  const delta = ordinal(iso) - ordinal(t.start), every = Number(t.every), [y, m, d] = iso.split('-').map(Number);
  if (t.kind === 'days') return delta % every === 0;
  if (t.kind === 'weeks') return Math.floor((delta + ordinal(t.start) % 7) / 7) % every === 0 && t.days.includes(ordinal(iso) % 7);
  const [sy, sm] = t.start.split('-').map(Number), wanted = Number(t.day);
  return ((y - sy) * 12 + m - sm) % every === 0 && d === (t.policy === 'last' ? Math.min(wanted, days(y, m)) : wanted);
};

test('Eight distinct bilingual plans provide 64 purposeful tasks and sixteen executable exercises', () => {
  assert.equal(C.cases.length, 8); const names = new Set();
  for (const s of C.cases) {
    assert(pair(s.name) && pair(s.lead)); assert.equal(s.prompts.length, 2); assert(s.prompts.every(pair)); assert.equal(s.tasks.length, 8);
    for (const t of s.tasks) { assert(pair(t.name) && pair(t.why)); assert(t.why[0].length >= 12); names.add(t.name[0]); }
    const m = C.blank(s, '2028-01-01'); assert(m.tasks.every(t => C.compile(t).valid)); assert(C.windowItems(m, '2028-01').items.length > 20);
  }
  assert.equal(names.size, 64);
});
test('Gregorian validity uses century exceptions and rejects normalized or out-of-range inputs', () => {
  for (const iso of ['2000-02-29', '2028-02-29', '1900-01-01', '2100-12-31']) assert(C.validDate(iso));
  for (const iso of ['1900-02-29', '2100-02-29', '2028-02-30', '2028-13-01', '1899-12-31', '2101-01-01', '2028-2-01', '']) assert(!C.validDate(iso));
  assert.equal(C.addDays('2000-02-28', 1), '2000-02-29'); assert.equal(C.addDays('2100-02-28', 1), '2100-03-01');
});
test('Every legal month has exactly 42 consecutive Monday-first cells through both range edges', () => {
  for (let y = 1900; y <= 2100; y++) for (let m = 1; m <= 12; m++) {
    const month = y + '-' + String(m).padStart(2, '0'), grid = C.grid(month);
    assert.equal(grid.length, 42); assert.equal(C.weekday(grid[0]), 0); assert(grid.includes(month + '-01'));
    for (let n = 1; n < 42; n++) assert.equal(C.serial(grid[n]) - C.serial(grid[n - 1]), 1);
  }
  assert.throws(() => C.grid('2028-13'));
});
test('Day, Monday-anchored week, and month rules match an independent Gregorian ordinal oracle', () => {
  for (const start of ['1900-01-31', '1999-12-31', '2000-02-29', '2028-01-31', '2099-12-31']) {
    const base = model().tasks[0];
    const candidates = [
      {...base, start, kind: 'days', every: '17'},
      {...base, start, kind: 'weeks', every: '3', days: [0, 2, 6]},
      {...base, start, kind: 'months', every: '2', day: '31', policy: 'skip'},
      {...base, start, kind: 'months', every: '1', day: '31', policy: 'last'},
    ];
    for (const t of candidates) for (let n = 0; n < 390; n++) {
      const iso = C.addDays(start, n); if (C.validDate(iso)) assert.equal(C.due(C.compile(t), iso), oracle(t, iso), start + '/' + t.kind + '/' + iso);
    }
  }
});
test('Weekly intervals start at Monday but exclude chosen weekdays before the start date', () => {
  const r = rule({kind: 'weeks', start: '2028-02-02', every: '2', days: [0, 2, 6]});
  for (const iso of ['2028-02-02', '2028-02-06', '2028-02-14', '2028-02-16']) assert(C.due(r, iso));
  for (const iso of ['2028-01-31', '2028-02-07', '2028-02-13', '2028-02-15']) assert(!C.due(r, iso));
});
test('Month-end policies skip missing dates or clamp without drifting in subsequent months', () => {
  const t = {kind: 'months', every: '1', day: '31'};
  assert(!C.due(rule({...t, policy: 'skip'}), '2028-02-29'));
  assert(C.due(rule({...t, policy: 'last'}), '2028-02-29'));
  assert(C.due(rule({...t, policy: 'last'}), '2028-03-31'));
  assert(!C.due(rule({...t, policy: 'last'}), '2028-03-29'));
  assert(C.due(rule({...t, policy: 'last', start: '2100-01-31'}), '2100-02-28'));
});
test('End is inclusive; intervals, weekday sets, and raw incomplete inputs have explicit validity', () => {
  const r = rule({every: '1', end: '2028-02-01'}); assert(C.due(r, '2028-02-01')); assert(!C.due(r, '2028-02-02'));
  for (const extra of [{every: ''}, {every: '1e2'}, {every: '1.5'}, {every: '61'}, {minutes: ''}, {start: '2028-02-30'}, {end: '2027-01-01'}, {kind: 'weeks', days: []}, {kind: 'months', day: '0'}]) {
    const r = rule(extra); assert(!r.valid); assert(!C.due(r, '2028-01-31'));
  }
  assert(C.compile({...model().tasks[0], minutes: '0'}).valid);
});
test('Moves suppress only their original occurrence and never coalesce two equal target dates', () => {
  const m = model(); m.tasks.forEach(t => { t.enabled = false; }); m.tasks[0].enabled = true; m.tasks[0].every = '1';
  C.mark(m, '0@2028-01-31', '2028-02-05', 'done'); C.mark(m, '0@2028-02-01', '2028-02-05', 'planned');
  const items = C.windowItems(m, '2028-02').items;
  assert(!items.some(i => i.date === '2028-01-31' || i.date === '2028-02-01'));
  assert.equal(items.filter(i => i.date === '2028-02-05').length, 3); assert.equal(new Set(items.map(i => i.id)).size, items.length);
  C.mark(m, '0@2028-01-31', '2030-01-01', 'done'); assert(!C.windowItems(m, '2028-02').items.some(i => i.id === '0@2028-01-31'));
});
test('Rule edits, disabling, and invalid drafts preserve dated records with a retained flag', () => {
  for (const extra of [{enabled: false}, {every: ''}, {start: '2029-01-01'}, {kind: 'months', day: '20'}]) {
    const m = model(); C.mark(m, '0@2028-01-31', '2028-02-03', 'done'); Object.assign(m.tasks[0], extra);
    const i = C.windowItems(m, '2028-02').items.find(i => i.id === '0@2028-01-31'); assert(i.retained); assert.equal(i.state, 'done');
    assert(C.validModel(m));
  }
});
test('Capacity includes completed work, excludes skipped work, and keeps unknown durations separate', () => {
  const s = C.daySummary([{state: 'planned', minutes: 40}, {state: 'done', minutes: 30}, {state: 'skip', minutes: 200}, {state: 'planned', minutes: null}], 60);
  assert.deepEqual(plain(s), {count: 3, total: 70, unknown: 1, done: 1, remaining: 40, over: true});
  assert(!C.daySummary([{state: 'planned', minutes: null}], null).over);
});
test('Checkpoint comparison uses the same visible range and exposes raw-rule, note, and allowance changes', () => {
  const m = model(), kept = C.copy(m); C.mark(m, '0@2028-01-31', '2028-02-03', 'done'); m.tasks[1].name = 'My task'; m.note = 'note'; m.capacity = '';
  const diff = C.comparison(m, kept, '2028-02'); assert(diff.changed.some(d => d.id === '0@2028-01-31')); assert.equal(diff.ruleRows, 1); assert(diff.noteChanged && diff.capacityChanged);
  assert.equal(C.comparison(m, kept, '2030-01').changed.length, 0);
});
test('Complete backups round trip all plans, checkpoints, raw drafts, names, notes and selected views', () => {
  const raw = fresh();
  for (const e of Object.values(raw.entries)) { e.model.tasks[0].name = '写作 Δ'; e.model.tasks[0].every = '1e2'; e.model.tasks[1].days = []; e.model.tasks[0].start = '2028-02-'; e.model.note = 'a\n中文'; e.model.capacity = ''; C.mark(e.model, '0@2028-01-31', '2028-03-01', 'skip'); e.checkpoint = C.copy(e.model); }
  assert.deepEqual(plain(C.restore(JSON.parse(JSON.stringify(raw)))), plain(raw));
});
test('Malformed backups reject atomically, including bad checkpoint, mark, view and task structures', () => {
  const data = fresh(); for (const mutate of [r => { r.version = 2; }, r => { delete r.entries.desk; }, r => { r.entries.desk.model.tasks.pop(); }, r => { r.entries.desk.checkpoint = {}; }, r => { r.entries.desk.model.records['0@2028-02-30'] = {target: '2028-03-01', state: 'done'}; }, r => { r.entries.desk.model.note = 'x'.repeat(1001); }, r => { r.entries.desk.month = '2028-02'; }, r => { r.entries.desk.model.tasks[1].days = [1, 1]; }]) {
    const before = JSON.stringify(data), broken = C.copy(data); mutate(broken); assert.equal(C.restore(broken), null); assert.equal(JSON.stringify(data), before);
  }
});
test('The full documented record and text capacity fits in a formatted 3 MB backup', () => {
  const data = fresh();
  for (const e of Object.values(data.entries)) {
    e.model.note = '𓀀'.repeat(1000); e.model.tasks.forEach(t => { t.name = '𓀀'.repeat(80); });
    for (let i = 0; i < 1024; i++) assert(C.mark(e.model, (i % 8) + '@' + C.addDays('2028-01-01', i), '2031-01-01', 'done'));
    assert(!C.mark(e.model, '0@2040-01-01', '2040-01-02', 'planned'));
    assert(C.mark(e.model, '0@2028-01-01', '2040-01-02', 'planned')); e.checkpoint = C.copy(e.model);
  }
  const serialized = JSON.stringify(data, null, 2); assert(Buffer.byteLength(serialized) < C.maxBackup); assert(C.restore(JSON.parse(serialized)));
});
test('CSV preserves Unicode, independent moved occurrences, and quotes formula-like user names', () => {
  const m = model(); m.tasks[0].name = '=SUM(1,2)\n文'; C.mark(m, '0@2028-01-31', '2028-02-02', 'done');
  const csv = C.csv(C.cases[0], m, '2028-02', 'en'); assert(csv.includes('"\'=SUM(1,2)\n文"')); assert(csv.includes('"2028-01-31"')); assert(csv.includes('"Done"')); assert(csv.startsWith('"Date","Task","State"'));
});
