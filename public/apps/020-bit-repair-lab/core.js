'use strict';
(() => {
  const cases = globalThis.BitRepairCases;
  const data = [3, 5, 6, 7];
  const groups = [
    {id: 1, positions: [1, 3, 5, 7]},
    {id: 2, positions: [2, 3, 6, 7]},
    {id: 4, positions: [4, 5, 6, 7]},
    {id: 8, positions: [1, 2, 3, 4, 5, 6, 7, 8]},
  ];
  const maxBackup = 128000;
  const bits = payload => data.map((_, i) => (payload >> (3 - i)) & 1);
  const parity = (word, positions) => positions.reduce((value, position) => value ^ word[position - 1], 0);
  const maskFor = positions => positions.reduce((mask, position) => mask | (1 << (position - 1)), 0);
  const caseFor = id => cases.find(item => item.id === id);

  function encode(payload) {
    const word = Array(8).fill(0);
    bits(payload).forEach((bit, i) => { word[data[i] - 1] = bit; });
    for (const group of groups) word[group.id - 1] = parity(word, group.positions);
    return word;
  }

  function decode(received) {
    const extended = received.length === 8;
    const checks = groups.slice(0, extended ? 4 : 3).map(group => ({
      ...group, odd: parity(received, group.positions),
    }));
    const syndrome = checks.slice(0, 3).reduce((sum, group) => sum + group.id * group.odd, 0);
    const overall = extended ? checks[3].odd : null;
    const held = extended && syndrome !== 0 && overall === 0;
    const flip = held ? 0 : syndrome || (overall ? 8 : 0);
    const word = held ? null : received.map((bit, i) => bit ^ Number(i + 1 === flip));
    const payload = word ? data.reduce((value, position) => (value << 1) | word[position - 1], 0) : null;
    return {checks, syndrome, overall, flip, word, payload, held};
  }

  function trial(payload, mask, length) {
    const sent = encode(payload).slice(0, length);
    const received = sent.map((bit, i) => bit ^ ((mask >> i) & 1));
    const result = decode(received);
    return {...result, sent, received, outcome: result.held ? 'held' : result.payload === payload ? 'right' : 'wrong'};
  }

  function sweep(payload, length) {
    const rows = Array.from({length: length + 1}, (_, weight) => ({
      weight, total: 0, right: 0, held: 0, wrong: 0, samples: {},
    }));
    for (let mask = 0; mask < 1 << length; mask++) {
      let weight = 0;
      for (let remaining = mask; remaining; remaining &= remaining - 1) weight++;
      const row = rows[weight];
      const {outcome} = trial(payload, mask, length);
      row.total++;
      row[outcome]++;
      row.samples[outcome] ??= mask;
    }
    return rows;
  }

  function fresh() {
    return {version: 1, active: cases[0].id, runs: Object.fromEntries(cases.map(item => [
      item.id, {payload: item.payload, mask: maskFor(item.faults), note: ''},
    ]))};
  }

  function restore(value) {
    if (value?.version !== 1 || !caseFor(value.active) || !value.runs ||
        Object.keys(value.runs).length !== cases.length) return null;
    const runs = {};
    for (const {id} of cases) {
      const run = value.runs[id];
      if (!run || !Number.isInteger(run.payload) || run.payload < 0 || run.payload > 15 ||
          !Number.isInteger(run.mask) || run.mask < 0 || run.mask > 255 ||
          typeof run.note !== 'string' || [...run.note].length > 1000) return null;
      runs[id] = {payload: run.payload, mask: run.mask, note: run.note};
    }
    return {version: 1, active: value.active, runs};
  }

  globalThis.BitRepair = {cases, caseFor, data, groups, maxBackup, bits, maskFor, encode, decode, trial, sweep, fresh, restore};
})();
