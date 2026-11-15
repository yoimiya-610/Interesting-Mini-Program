'use strict';
(() => {
  const cases = globalThis.CircuitCases, copy = value => JSON.parse(JSON.stringify(value));
  function numeric(text, min, max) {
    if (typeof text !== 'string' || text.length > 16 || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) return null;
    const v = Number(text); return Number.isFinite(v) && v >= min && v <= max && !(v === 0 && /[1-9]/.test(text.split(/[eE]/)[0])) ? v : null;
  }
  const source = id => cases.find(c => c.id === id);
  const blank = c => ({voltage: c.voltage, edges: copy(c.edges)});
  const entry = c => ({model: blank(c), selected: 0, probe: c.nodes.at(-1), lo: '10', hi: '10000', note: '', checkpoint: null});
  const fresh = () => ({version: 1, active: cases[0].id, entries: Object.fromEntries(cases.map(c => [c.id, entry(c)]))});
  function validModel(model, c) {
    return model && typeof model.voltage === 'string' && model.voltage.length <= 16 && Array.isArray(model.edges) && model.edges.length === c.edges.length && model.edges.every(e => e && c.nodes.includes(e.a) && c.nodes.includes(e.b) && typeof e.r === 'string' && e.r.length <= 16 && typeof e.rating === 'string' && e.rating.length <= 16 && typeof e.on === 'boolean');
  }
  function restore(value) {
    if (!value || value.version !== 1 || !source(value.active) || !value.entries || Object.keys(value.entries).length !== cases.length) return null;
    const out = fresh(); out.active = value.active;
    for (const c of cases) {
      const e = value.entries[c.id]; if (!e || !validModel(e.model, c) || !Number.isInteger(e.selected) || e.selected < 0 || e.selected >= c.edges.length || !c.nodes.includes(e.probe) || !['lo','hi'].every(k => typeof e[k] === 'string' && e[k].length <= 16) || typeof e.note !== 'string' || e.note.length > 1000 || !(e.checkpoint === null || e.checkpoint && validModel(e.checkpoint.model, c) && typeof e.checkpoint.note === 'string' && e.checkpoint.note.length <= 1000)) return null;
      out.entries[c.id] = copy(e);
    }
    return out;
  }
  function compile(model, c) {
    const errors = [], voltage = numeric(model.voltage, 0, 24);
    if (voltage === null) errors.push('source');
    const edges = model.edges.map((e, j) => { const r = numeric(e.r,10,10000), rating = numeric(e.rating,0.001,100); if (e.on && (r === null || rating === null || e.a === e.b)) errors.push('R' + (j + 1)); return {...e, r, rating}; });
    return {valid: !errors.length, errors, voltage, edges, nodes: c.nodes};
  }
  function linear(a, b) {
    const n = b.length, m = a.map((row, i) => [...row, b[i]]);
    for (let j = 0; j < n; j++) {
      let pivot = j; for (let i = j + 1; i < n; i++) if (Math.abs(m[i][j]) > Math.abs(m[pivot][j])) pivot = i;
      if (Math.abs(m[pivot][j]) < 1e-15) throw new Error('Singular anchored network');
      [m[pivot], m[j]] = [m[j], m[pivot]]; const scale = m[j][j]; for (let k = j; k <= n; k++) m[j][k] /= scale;
      for (let i = 0; i < n; i++) if (i !== j) { const factor = m[i][j]; for (let k = j; k <= n; k++) m[i][k] -= factor * m[j][k]; }
    }
    return m.map(row => row[n]);
  }
  function solve(model, c) {
    const system = compile(model,c); if (!system.valid) return system;
    const {nodes,edges,voltage} = system, adjacent = Object.fromEntries(nodes.map(n => [n,[]]));
    for (const e of edges) if (e.on) { adjacent[e.a].push(e.b); adjacent[e.b].push(e.a); }
    const anchored = new Set(['P','G']), queue = ['P','G']; for (let j = 0; j < queue.length; j++) for (const n of adjacent[queue[j]]) if (!anchored.has(n)) { anchored.add(n); queue.push(n); }
    const unknown = nodes.filter(n => anchored.has(n) && n !== 'P' && n !== 'G'), index = new Map(unknown.map((n,i) => [n,i]));
    const a = unknown.map(() => unknown.map(() => 0)), b = unknown.map(() => 0);
    for (const e of edges) if (e.on) for (const [n,other] of [[e.a,e.b],[e.b,e.a]]) if (index.has(n)) { const i = index.get(n); a[i][i] += 1/e.r; if (index.has(other)) a[i][index.get(other)] -= 1/e.r; else if (other === 'P') b[i] += 1/e.r; }
    const x = linear(a,b), unit = Object.fromEntries(nodes.map(n => [n,n === 'P' ? 1 : n === 'G' ? 0 : index.has(n) ? x[index.get(n)] : null]));
    const potentials = Object.fromEntries(nodes.map(n => [n,unit[n] === null ? null : unit[n]*voltage]));
    const results = edges.map(e => { const drop = unit[e.a] !== null && unit[e.b] !== null ? (unit[e.a]-unit[e.b])*voltage : e.on ? 0 : null, current = e.on ? drop/e.r : 0, power = e.on ? drop*current : 0; return {...e, drop, current, power, overload: e.on && power > e.rating*(1+1e-10)}; });
    let conductance = 0; for (const e of edges) if (e.on && (e.a === 'P' || e.b === 'P')) conductance += (1-unit[e.a === 'P' ? e.b : e.a])/e.r;
    if (Math.abs(conductance) < 1e-14) conductance = 0;
    const current = voltage*conductance, power = voltage*current;
    const kcl = Object.fromEntries(nodes.map(n => [n,results.reduce((s,e) => s+(e.a === n ? e.current : 0)-(e.b === n ? e.current : 0),0)]));
    const equations = unknown.map((n,i) => ({node:n, terms: edges.flatMap((e,j) => e.on && (e.a === n || e.b === n) ? [{branch:j, other:e.a === n ? e.b : e.a, r:e.r, current:(potentials[n]-potentials[e.a === n ? e.b : e.a])/e.r}] : []), residual:kcl[n]}));
    return {...system, potentials, results, current, power, equivalent: conductance ? 1/conductance : null, floating:nodes.filter(n => !anchored.has(n)), kcl, equations, balance: power-results.reduce((s,e) => s+e.power,0)};
  }
  function sweep(e,c) {
    const lo = numeric(e.lo,10,10000), hi = numeric(e.hi,10,10000);
    if (lo === null || hi === null || lo >= hi || !compile(e.model,c).valid) return null;
    return Array.from({length:21},(_,i) => { const r = i === 0 ? lo : i === 20 ? hi : lo*Math.pow(hi/lo,i/20), model = copy(e.model); model.edges[e.selected].r = String(Number(r.toPrecision(12))); const s = solve(model,c); return {r:Number(model.edges[e.selected].r), voltage:s.potentials[e.probe], current:s.current, branchCurrent:s.results[e.selected].current, power:s.results[e.selected].power, overloaded:s.results.filter(r => r.overload).length}; });
  }
  const quote = value => '"'+String(value??'').replaceAll('"','""')+'"';
  const csv = rows => rows.map(row => row.map(quote).join(',')).join('\r\n');
  globalThis.CircuitAtlas = {cases,copy,numeric,source,blank,fresh,restore,compile,solve,sweep,csv};
})();
