'use strict';
(() => {
  const cases = globalThis.SpringCases, copy = x => JSON.parse(JSON.stringify(x)), h = 1 / 240, maxTicks = 14400;
  const caseFor = id => cases.find(c => c.id === id);
  function numeric(s, lo, hi) {
    if (typeof s !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(s)) return null;
    const value = Number(s);
    if (!Number.isFinite(value) || value < lo || value > hi || value === 0 && /[1-9]/.test(s.split(/[eE]/)[0])) return null;
    return value;
  }
  const blank = s => ({m: s.m.map(String), k: s.k.map(String), q: s.q.map(String), v: s.v.map(String), left: s.left, right: s.right, damping: String(s.damping)});
  function compile(model) {
    const n = model.m.length, errors = [];
    const field = (array, key, lo, hi) => array.map((s, i) => { const value = numeric(s, lo, hi); if (value === null) errors.push(key + i); return value; });
    const m = field(model.m, 'm', 0.25, 4), q = field(model.q, 'q', -1, 1), v = field(model.v, 'v', -2, 2);
    const k = model.k.map((s, i) => {
      if (i === 0 && model.left === 'free' || i === n && model.right === 'free') return 0;
      const value = numeric(s, 0.25, 16); if (value === null) errors.push('k' + i); return value;
    });
    const damping = numeric(model.damping, 0, 1); if (damping === null) errors.push('damping');
    return {n, m, k, q, v, damping, errors, valid: !errors.length, systemValid: !errors.some(e => e[0] === 'm' || e[0] === 'k')};
  }
  function matrix(s) {
    return Array.from({length: s.n}, (_, i) => Array.from({length: s.n}, (_, j) => i === j ? (s.k[i] + s.k[i + 1]) / s.m[i] :
      j === i + 1 ? -s.k[j] / Math.sqrt(s.m[i] * s.m[j]) : i === j + 1 ? -s.k[i] / Math.sqrt(s.m[i] * s.m[j]) : 0));
  }
  function modes(s) {
    if (!s.systemValid) return [];
    const a = matrix(s), n = s.n, vectors = Array.from({length: n}, (_, i) => Array.from({length: n}, (_, j) => +(i === j)));
    for (let iteration = 0; iteration < n * n * 80; iteration++) {
      let p = 0, q = 0, largest = 0;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.abs(a[i][j]) > largest) { largest = Math.abs(a[i][j]); p = i; q = j; }
      if (largest < 1e-12) break;
      const angle = 0.5 * Math.atan2(2 * a[p][q], a[q][q] - a[p][p]), c = Math.cos(angle), z = Math.sin(angle);
      const pp = a[p][p], qq = a[q][q], pq = a[p][q];
      a[p][p] = c * c * pp - 2 * z * c * pq + z * z * qq;
      a[q][q] = z * z * pp + 2 * z * c * pq + c * c * qq; a[p][q] = a[q][p] = 0;
      for (let i = 0; i < n; i++) {
        if (i !== p && i !== q) { const ip = a[i][p], iq = a[i][q]; a[i][p] = a[p][i] = c * ip - z * iq; a[i][q] = a[q][i] = z * ip + c * iq; }
        const ip = vectors[i][p], iq = vectors[i][q]; vectors[i][p] = c * ip - z * iq; vectors[i][q] = z * ip + c * iq;
      }
    }
    return Array.from({length: n}, (_, j) => {
      const lambda = Math.abs(a[j][j]) < 1e-10 ? 0 : a[j][j], u = vectors.map((row, i) => row[j] / Math.sqrt(s.m[i]));
      const peak = Math.max(...u.map(Math.abs)), first = u.find(x => Math.abs(x) > 1e-8), sign = first < 0 ? -1 : 1;
      return {lambda, frequency: Math.sqrt(lambda) / (2 * Math.PI), u: u.map(x => x * sign), shape: u.map(x => x / peak * sign)};
    }).sort((a, b) => a.lambda - b.lambda);
  }
  function energy(s, q, v) {
    const kinetic = q.map((_, i) => 0.5 * s.m[i] * v[i] ** 2), local = [...kinetic];
    let potential = 0.5 * s.k[0] * q[0] ** 2 + 0.5 * s.k[s.n] * q.at(-1) ** 2;
    local[0] += 0.5 * s.k[0] * q[0] ** 2; local[s.n - 1] += 0.5 * s.k[s.n] * q.at(-1) ** 2;
    for (let i = 1; i < s.n; i++) { const e = 0.5 * s.k[i] * (q[i] - q[i - 1]) ** 2; potential += e; local[i - 1] += e / 2; local[i] += e / 2; }
    const kineticTotal = kinetic.reduce((a, b) => a + b, 0);
    return {kinetic: kineticTotal, potential, total: kineticTotal + potential, local,
      left: local.slice(0, Math.ceil(s.n / 2)).reduce((a, b) => a + b, 0), right: local.slice(Math.ceil(s.n / 2)).reduce((a, b) => a + b, 0),
      center: q.reduce((a, b, i) => a + s.m[i] * b, 0) / s.m.reduce((a, b) => a + b, 0), momentum: v.reduce((a, b, i) => a + s.m[i] * b, 0)};
  }
  function initial(s) { if (!s.valid) return null; return {q: [...s.q], v: [...s.v], ticks: 0, dissipated: 0, initialEnergy: energy(s, s.q, s.v).total}; }
  function acceleration(s, q) { return q.map((x, i) => (s.k[i] * ((i ? q[i - 1] : 0) - x) + s.k[i + 1] * ((i + 1 < s.n ? q[i + 1] : 0) - x)) / s.m[i]); }
  function advance(s, state, count) {
    if (!s.valid || !Number.isInteger(count) || count < 0) throw new RangeError('Invalid integration request');
    const r = {...state, q: [...state.q], v: [...state.v]}, decay = Math.exp(-s.damping * h / 2);
    const damp = () => { for (let i = 0; i < s.n; i++) { const old = r.v[i]; r.v[i] *= decay; r.dissipated += 0.5 * s.m[i] * (old ** 2 - r.v[i] ** 2); } };
    for (let step = 0; step < count && r.ticks < maxTicks; step++) {
      damp(); const a = acceleration(s, r.q);
      for (let i = 0; i < s.n; i++) { r.v[i] += h * a[i] / 2; r.q[i] += h * r.v[i]; }
      const b = acceleration(s, r.q); for (let i = 0; i < s.n; i++) r.v[i] += h * b[i] / 2;
      damp(); r.ticks++;
    }
    return r;
  }
  function modalEnergy(s, state, list) {
    return list.map(mode => { const q = mode.u.reduce((a, u, i) => a + s.m[i] * u * state.q[i], 0), v = mode.u.reduce((a, u, i) => a + s.m[i] * u * state.v[i], 0); return 0.5 * (v * v + mode.lambda * q * q); });
  }
  function excite(model, mode, amplitude, kind) {
    if (!mode || amplitude === null) return null;
    const result = copy(model), q = model.q.map(s => numeric(s, -1, 1));
    if (kind === 'add' && q.some(x => x === null)) return null;
    const terms = mode.shape.map(x => amplitude * x);
    if (terms.some((x, i) => x === 0 && amplitude !== 0 && mode.shape[i] !== 0)) return null;
    const values = terms.map((x, i) => x + (kind === 'add' ? q[i] : 0));
    if (values.some(x => Math.abs(x) > (kind === 'velocity' ? 2 : 1) + 1e-10)) return null;
    const printed = values.map(x => {
      for (let precision = 10; precision >= 1; precision--) {
        const text = Number(x.toPrecision(precision)).toString();
        if (text.length <= 12 && numeric(text, -2, 2) !== null && (x === 0 || Number(text) !== 0)) return text;
      }
      return null;
    });
    if (printed.some(x => x === null) || kind === 'add' && amplitude !== 0 && printed.every((x, i) => Number(x) === q[i])) return null;
    if (kind === 'velocity') { result.q = values.map(() => '0'); result.v = printed; }
    else { result.q = printed; if (kind !== 'add') result.v = values.map(() => '0'); }
    return result;
  }
  function fresh() { return {version: 1, active: cases[0].id, entries: Object.fromEntries(cases.map(s => [s.id, {model: blank(s), note: '', checkpoint: null, selected: 0, mode: 0, amplitude: '0.6'}]))}; }
  const text = (s, limit) => typeof s === 'string' && [...s].length <= limit;
  function validModel(m, n) {
    if (!m || !['fixed', 'free'].includes(m.left) || !['fixed', 'free'].includes(m.right) || !text(m.damping, 12)) return null;
    for (const [key, size] of [['m', n], ['k', n + 1], ['q', n], ['v', n]]) if (!Array.isArray(m[key]) || m[key].length !== size || !m[key].every(s => text(s, 12))) return null;
    return {m: [...m.m], k: [...m.k], q: [...m.q], v: [...m.v], left: m.left, right: m.right, damping: m.damping};
  }
  function restore(raw) {
    if (raw?.version !== 1 || !caseFor(raw.active) || !raw.entries || Object.keys(raw.entries).length !== cases.length) return null;
    const entries = {};
    for (const source of cases) {
      const e = raw.entries[source.id], n = source.m.length, model = validModel(e?.model, n);
      if (!model || !text(e.note, 1000) || !Number.isInteger(e.selected) || e.selected < 0 || e.selected >= n || !Number.isInteger(e.mode) || e.mode < 0 || e.mode >= n || !text(e.amplitude, 12)) return null;
      let checkpoint = null;
      if (e.checkpoint !== null) { const kept = validModel(e.checkpoint?.model, n); if (!kept || !text(e.checkpoint.note, 1000)) return null; checkpoint = {model: kept, note: e.checkpoint.note}; }
      entries[source.id] = {model, note: e.note, checkpoint, selected: e.selected, mode: e.mode, amplitude: e.amplitude};
    }
    return {version: 1, active: raw.active, entries};
  }
  const csvCell = v => '"' + (typeof v === 'string' && /^\s*[=+\-@]/u.test(v) ? "'" + v : String(v)).replaceAll('"', '""') + '"';
  function csv(history, n) {
    const rows = [['time_s', ...Array.from({length: n}, (_, i) => 'q_M' + (i + 1) + '_m'), ...Array.from({length: n}, (_, i) => 'v_M' + (i + 1) + '_m_per_s'), 'mechanical_J', 'dissipated_J', 'balance_error_J', ...Array.from({length: n}, (_, i) => 'reference_q_M' + (i + 1) + '_m')]];
    for (const point of history) rows.push([point.ticks * h, ...point.q, ...point.v, point.energy, point.dissipated, point.energy + point.dissipated - point.initialEnergy, ...(point.reference || Array(n).fill(''))]);
    return rows.map(row => row.map(csvCell).join(',')).join('\r\n');
  }
  globalThis.SpringEnsemble = {cases, caseFor, copy, h, maxTicks, numeric, blank, compile, matrix, modes, energy, initial, acceleration, advance, modalEnergy, excite, fresh, validModel, restore, csv, maxBackup: 256000};
})();
