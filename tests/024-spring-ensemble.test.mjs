import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context = vm.createContext({});
for (const file of ['content.js', 'core.js']) vm.runInContext(readFileSync(new URL('../public/apps/024-spring-ensemble/' + file, import.meta.url), 'utf8'), context);
const C = context.SpringEnsemble, plain = x => JSON.parse(JSON.stringify(x));
const near = (a, b, tolerance = 1e-8) => assert(Math.abs(a - b) <= tolerance, `${a} differs from ${b}`);
const pair = p => p.length === 2 && p[0].trim() && p[1].trim() && !/[\u3400-\u9fff]/.test(p[1]);
function uniform(n, boundary = 'fixed', mass = 1, spring = 4) { return {m: Array(n).fill(String(mass)), k: Array(n + 1).fill(String(spring)), q: Array(n).fill('0'), v: Array(n).fill('0'), left: boundary, right: boundary, damping: '0'}; }

test('Eight substantive bilingual experiments have 46 sites, 54 spring inputs and sixteen specific explorations', () => {
  assert.equal(C.cases.length, 8); const ids = new Set(); let sites = 0, springs = 0;
  for (const source of C.cases) { ids.add(source.id); assert(pair(source.name) && pair(source.lead)); assert.equal(source.prompts.length, 2); assert(source.prompts.every(pair)); assert(source.m.length >= 1 && source.m.length <= 8); sites += source.m.length; springs += source.k.length; assert(C.compile(C.blank(source)).valid); }
  assert.equal(ids.size, 8); assert.equal(sites, 46); assert.equal(springs, 54);
});
test('Single-mass frequencies follow the two-spring closed form and the square-root mass law', () => {
  const model = uniform(1); near(C.modes(C.compile(model))[0].frequency, Math.sqrt(8) / (2 * Math.PI));
  model.m[0] = '4'; near(C.modes(C.compile(model))[0].frequency, Math.sqrt(8) / (4 * Math.PI));
  model.left = 'free'; near(C.modes(C.compile(model))[0].frequency, 1 / (2 * Math.PI));
  model.right = 'free'; near(C.modes(C.compile(model))[0].frequency, 0);
});
test('All uniform fixed chains match independent sine eigenvalues and shapes', () => {
  for (let n = 1; n <= 8; n++) for (const [m, k] of [[1, 4], [0.25, 16], [4, 0.25]]) {
    const list = C.modes(C.compile(uniform(n, 'fixed', m, k)));
    list.forEach((mode, j) => {
      const omega = 2 * Math.sqrt(k / m) * Math.sin((j + 1) * Math.PI / (2 * (n + 1))); near(mode.lambda, omega ** 2, 1e-9);
      const raw = Array.from({length: n}, (_, i) => Math.sin((i + 1) * (j + 1) * Math.PI / (n + 1))), peak = Math.max(...raw.map(Math.abs));
      raw.forEach((v, i) => near(mode.shape[i], v / peak, 1e-8));
    });
  }
});
test('Free chains have a translation mode and match independent free-end frequencies', () => {
  for (let n = 2; n <= 8; n++) {
    const list = C.modes(C.compile(uniform(n, 'free')));
    list.forEach((mode, j) => near(mode.lambda, 16 * Math.sin(j * Math.PI / (2 * n)) ** 2, 1e-9));
    for (const value of list[0].shape) near(value, 1);
  }
});
test('Nonuniform mode vectors satisfy physical force equations and mass orthonormality', () => {
  for (const source of C.cases) {
    const s = C.compile(C.blank(source)), list = C.modes(s);
    for (const a of list) {
      const force = C.acceleration(s, a.u); force.forEach((v, i) => near(v, -a.lambda * a.u[i], 1e-8));
      for (const b of list) near(a.u.reduce((sum, v, i) => sum + s.m[i] * v * b.u[i], 0), a === b ? 1 : 0, 1e-8);
    }
  }
});
test('Restoring forces agree with finite differences of independently assembled spring energy', () => {
  const potential = (s, q) => {
    let e = 0; for (let i = 0; i <= q.length; i++) { const left = i ? q[i - 1] : 0, right = i < q.length ? q[i] : 0; e += s.k[i] * (right - left) ** 2 / 2; } return e;
  };
  for (const source of C.cases) {
    const s = C.compile(C.blank(source)), q = s.q.map((_, i) => Math.sin(i + 0.4) * 0.7), a = C.acceleration(s, q);
    q.forEach((_, i) => { const lo = [...q], hi = [...q]; lo[i] -= 1e-5; hi[i] += 1e-5; near(a[i], -(potential(s, hi) - potential(s, lo)) / (2e-5 * s.m[i]), 1e-8); });
  }
});
test('Mode-energy projections sum to mechanical energy including free translation', () => {
  for (const source of C.cases) {
    const s = C.compile(C.blank(source)), state = C.advance(s, C.initial(s), 713), modes = C.modes(s);
    near(C.modalEnergy(s, state, modes).reduce((a, b) => a + b, 0), C.energy(s, state.q, state.v).total, 1e-8);
  }
});
test('Velocity Verlet agrees with a single analytic oscillator over a full minute', () => {
  const m = uniform(1, 'fixed', 1, 2); m.q = ['0.7']; m.v = ['0.3']; const s = C.compile(m), state = C.advance(s, C.initial(s), C.maxTicks), t = C.maxTicks * C.h;
  near(state.q[0], 0.7 * Math.cos(2 * t) + 0.15 * Math.sin(2 * t), 0.0005);
  near(state.v[0], -1.4 * Math.sin(2 * t) + 0.3 * Math.cos(2 * t), 0.001);
});
test('The two-mass exchange matches its independent symmetric/antisymmetric analytic solution', () => {
  const s = C.compile(C.blank(C.caseFor('pair'))), state = C.advance(s, C.initial(s), 840), t = 3.5;
  near(state.q[0], 0.4 * Math.cos(t) + 0.4 * Math.cos(Math.sqrt(5) * t), 0.00003);
  near(state.q[1], 0.4 * Math.cos(t) - 0.4 * Math.cos(Math.sqrt(5) * t), 0.00003);
});
test('Undamped energy stays bounded even at the stiffest allowed settings', () => {
  const m = uniform(8, 'fixed', 0.25, 16); m.q = Array.from({length: 8}, (_, i) => i % 2 ? '-1' : '1'); const s = C.compile(m); let state = C.initial(s), largest = 0;
  for (let i = 0; i < 1200; i++) { state = C.advance(s, state, 12); largest = Math.max(largest, Math.abs(C.energy(s, state.q, state.v).total / state.initialEnergy - 1)); }
  assert(largest < 0.0012); near(state.dissipated, 0);
});
test('Damped motion follows its analytic single-site solution and accounts separately for dissipation', () => {
  const m = uniform(1, 'fixed', 1, 2); m.q = ['0.7']; m.damping = '0.35'; const s = C.compile(m), t = 7, w = Math.sqrt(4 - 0.35 ** 2 / 4), state = C.advance(s, C.initial(s), 1680);
  const expected = Math.exp(-0.175 * t) * (0.7 * Math.cos(w * t) + 0.175 * 0.7 / w * Math.sin(w * t)); near(state.q[0], expected, 0.00003);
  const e = C.energy(s, state.q, state.v).total; assert(state.dissipated > 0); near(e + state.dissipated, state.initialEnergy, 0.00003);
});
test('A free uniformly moving chain preserves momentum and has zero spring energy', () => {
  const s = C.compile(C.blank(C.caseFor('free'))), state = C.advance(s, C.initial(s), C.maxTicks), e = C.energy(s, state.q, state.v);
  state.q.forEach(q => near(q, 9, 1e-9)); near(e.potential, 0); near(e.momentum, 0.9); near(e.center, 9, 1e-9);
});
test('Local site energy partitions sum to the ledger total for odd, even and single chains', () => {
  for (const source of C.cases) { const s = C.compile(C.blank(source)), state = C.advance(s, C.initial(s), 165), e = C.energy(s, state.q, state.v); near(e.local.reduce((a, b) => a + b), e.total); near(e.left + e.right, e.total); }
});
test('Excitation isolates a mode, preserves drafts on failed additions, and can repair invalid initial values', () => {
  const m = C.blank(C.caseFor('heavy')), mode = C.modes(C.compile(m))[3]; m.q[0] = '';
  const fixed = C.excite(m, mode, 0.6, 'displace'); assert(C.compile(fixed).valid);
  const s = C.compile(fixed), energies = C.modalEnergy(s, C.initial(s), C.modes(s)); assert(energies[3] > 0); assert(energies.filter((_, i) => i !== 3).every(e => e < 1e-7));
  const before = JSON.stringify(fixed); assert.equal(C.excite(fixed, mode, 0.6, 'add'), null); assert.equal(JSON.stringify(fixed), before);
  const velocity = C.excite(m, mode, 0.6, 'velocity'); assert(velocity.q.every(q => q === '0')); assert(C.compile(velocity).valid);
});
test('Raw numeric drafts stay literal; free-end unused inputs do not block a valid run', () => {
  const m = C.blank(C.caseFor('free')); m.k[0] = ''; assert(C.compile(m).valid); m.left = 'fixed'; assert(!C.compile(m).valid);
  for (const value of ['', '1e0', '0x1', ' 1 ', '1.2.3', 'NaN']) assert.equal(C.numeric(value, 0, 4), null);
  for (const value of ['.5', '-0.25', '1.']) assert.notEqual(C.numeric(value, -1, 4), null);
});
test('Full worst-case configuration backups fit 256 kB and malformed imports reject atomically', () => {
  const data = C.fresh();
  for (const e of Object.values(data.entries)) { e.note = '\u0000'.repeat(1000); for (const key of ['m', 'k', 'q', 'v']) e.model[key] = e.model[key].map(() => '\u0000'.repeat(12)); e.model.damping = '1e-'; e.amplitude = ''; e.checkpoint = {model: C.copy(e.model), note: e.note}; }
  const serialized = JSON.stringify(data, null, 2); assert(Buffer.byteLength(serialized) < C.maxBackup); assert.deepEqual(plain(C.restore(JSON.parse(serialized))), plain(data));
  for (const mutate of [r => { r.entries.pair.model.m.pop(); }, r => { r.entries.one.model.v[0] = 0; }, r => { r.entries.free.selected = 6; }, r => { r.entries.damped.checkpoint.note = 'x'.repeat(1001); }, r => { r.version = 2; }]) { const r = C.copy(data); mutate(r); assert.equal(C.restore(r), null); }
});
test('Run limits stop exactly at 60 seconds without mutating the prior state; CSV retains numeric signs', () => {
  const s = C.compile(C.blank(C.cases[0])), original = C.initial(s), before = JSON.stringify(original), state = C.advance(s, original, 100000); assert.equal(state.ticks, C.maxTicks); assert.equal(JSON.stringify(original), before); assert.throws(() => C.advance(s, original, -1));
  const csv = C.csv([{ticks: 0, q: [-0.2], v: [-1], energy: 1, initialEnergy: 1, dissipated: 0, reference: null}], 1); assert(csv.includes('"-0.2","-1"')); assert(csv.includes('"reference_q_M1_m"')); assert(!csv.includes("'-0.2"));
});
