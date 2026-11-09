'use strict';
(() => {
  const width = 14;
  const height = 10;
  const size = width * height;
  const ambient = 20;
  const maxSteps = 1200;
  const maxBackup = 512000;
  const cases = globalThis.HeatExperiments;
  const edges = ['sealed', 'ambient', 'wrap'];
  const rates = [10, 20];
  const conductance = {standard: 1, slow: 0.2, blocked: 0};
  const index = (x, y) => y * width + x;
  const copy = value => JSON.parse(JSON.stringify(value));
  const caseFor = id => cases.find(template => template.id === id);

  function initial(template) {
    const temp = Array(size).fill(ambient);
    const material = Array(size).fill('standard');
    for (const [rectangles, field] of [[template.heat, temp], [template.material, material]]) {
      for (const [x, y, w, h, value] of rectangles) {
        for (let row = y; row < y + h; row++) {
          for (let column = x; column < x + w; column++) field[index(column, row)] = value;
        }
      }
    }
    return {temp, material, edge: template.edge, rate: template.rate, steps: 0};
  }

  function fresh() {
    return {version: 1, selected: cases[0].id, runs: Object.fromEntries(cases.map(template => [
      template.id, {board: initial(template), snapshot: null, probe: index(...template.probe), note: ''},
    ]))};
  }

  function advance(board, requested) {
    const steps = Math.max(0, Math.min(requested, maxSteps - board.steps));
    const ratio = board.rate / 100;
    const links = [];
    const rim = [];
    const factors = board.material.map(name => conductance[name]);
    function connect(from, to) {
      const a = factors[from], b = factors[to];
      if (a && b) links.push([from, to, ratio * 2 * a * b / (a + b)]);
    }
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const here = index(x, y);
        if (x + 1 < width) connect(here, here + 1);
        else if (board.edge === 'wrap') connect(here, index(0, y));
        if (y + 1 < height) connect(here, here + width);
        else if (board.edge === 'wrap') connect(here, index(x, 0));
        if (board.edge === 'ambient') {
          const exposed = Number(x === 0 || x === width - 1) + Number(y === 0 || y === height - 1);
          if (exposed && factors[here]) rim.push([here, exposed * ratio * factors[here]]);
        }
      }
    }
    let temp = board.temp;
    for (let step = 0; step < steps; step++) {
      const next = temp.slice();
      // Every interface exchanges equal and opposite heat using the old frame.
      for (const [from, to, weight] of links) {
        const transfer = weight * (temp[from] - temp[to]);
        next[from] -= transfer;
        next[to] += transfer;
      }
      for (const [here, weight] of rim) next[here] += weight * (ambient - temp[here]);
      // The exact update stays in range. Subnormal transfers can round past zero.
      for (let i = 0; i < size; i++) {
        if (next[i] < 0) next[i] = 0;
        else if (next[i] > 100) next[i] = 100;
      }
      temp = next;
    }
    return {...board, temp, steps: board.steps + steps};
  }

  function metrics(temp) {
    const low = Math.min(...temp);
    const high = Math.max(...temp);
    return {low, high, mean: temp.reduce((sum, value) => sum + value, 0) / size, span: high - low};
  }

  function validBoard(board) {
    return board && edges.includes(board.edge) && rates.includes(board.rate) &&
      Number.isInteger(board.steps) && board.steps >= 0 && board.steps <= maxSteps &&
      Array.isArray(board.temp) && board.temp.length === size &&
      board.temp.every(value => Number.isFinite(value) && value >= 0 && value <= 100) &&
      Array.isArray(board.material) && board.material.length === size &&
      board.material.every(value => typeof value === 'string' && Object.hasOwn(conductance, value));
  }

  function cleanBoard(board) {
    return {temp: [...board.temp], material: [...board.material], edge: board.edge, rate: board.rate, steps: board.steps};
  }

  function restore(raw) {
    if (raw?.version !== 1 || !caseFor(raw.selected) || !raw.runs ||
        Object.keys(raw.runs).length !== cases.length) return null;
    const runs = {};
    for (const template of cases) {
      const run = raw.runs[template.id];
      if (!run || !validBoard(run.board) || (run.snapshot !== null && !validBoard(run.snapshot)) ||
          typeof run.note !== 'string' || [...run.note].length > 1000 ||
          !Number.isInteger(run.probe) || run.probe < 0 || run.probe >= size) return null;
      runs[template.id] = {
        board: cleanBoard(run.board), snapshot: run.snapshot === null ? null : cleanBoard(run.snapshot),
        note: run.note, probe: run.probe,
      };
    }
    return {version: 1, selected: raw.selected, runs};
  }

  globalThis.HeatMosaic = {width, height, size, ambient, maxSteps, maxBackup, cases, edges, rates,
    index, copy, caseFor, initial, fresh, advance, metrics, restore};
})();
