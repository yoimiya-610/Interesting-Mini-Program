'use strict';
(() => {
  const C = HeatMosaic;
  const $ = id => document.getElementById(id);
  const P = pair => pair[ProgramLanguage.language === 'en' ? 1 : 0];
  const key = 'imp-019-heat-mosaic-v1';
  const labels = {
    kicker: ['八个传热实验', 'EIGHT HEAT EXPERIMENTS'],
    headline: ['热从哪儿走？', 'Where does the heat go?'],
    intro: ['在热板上画冷热、换材料，看看热斑如何散开、隔墙如何改变热流。用同一步数的快照做对照。', 'Paint hot and cold tiles, change materials, and watch heat spread or detour around a wall. Compare two experiments at the same step count.'],
    choose: ['选择实验 ↓', 'Choose an experiment ↓'],
    guide: ['了解导热 ↓', 'Read the conduction guide ↓'],
    start: ['01 / 实验条件', '01 / EXPERIMENT SETTINGS'],
    case: ['实验', 'Experiment'],
    edge: ['边缘条件', 'Edge condition'],
    rate: ['交换速度', 'Exchange rate'],
    brush: ['探针与画笔', 'Probe and brushes'],
    view: ['显示', 'View'],
    rectangle: ['矩形画笔', 'Rectangle brush'],
    zoom: ['大格模式', 'Large tiles'],
    plate: ['02 / 面内导热', '02 / CONDUCTION IN THE PLANE'],
    plateTitle: ['十四列 × 十行热板', '14 × 10 thermal plate'],
    boardHint: ['方向键在格子间移动，回车或空格应用探针或画笔，Esc 取消矩形起点。每个格子的读数也可用键盘或读屏查看。', 'Use arrow keys to move between tiles, Enter or Space to apply the probe or brush, and Esc to cancel a rectangle. Every tile has a readable temperature label.'],
    single: ['走一步', 'Step once'],
    twelve: ['走十二步', 'Advance 12 steps'],
    reset: ['重置热板', 'Reset board'],
    undo: ['撤销实验操作', 'Undo experiment change'],
    redo: ['重做实验操作', 'Redo experiment change'],
    measure: ['03 / 读数与对照', '03 / READINGS AND COMPARISON'],
    measureTitle: ['温度探针', 'Temperature probe'],
    snapshot: ['对照快照', 'Comparison snapshot'],
    snapshotHint: ['每案存一张。重置热板会保留快照。再跑到同一步数，就能用差值图比较。', 'Save one frame per experiment. Resetting the board keeps the snapshot. Run to the same step to compare with the difference view.'],
    capture: ['保存当前快照', 'Save current snapshot'],
    recall: ['载入快照到热板', 'Restore snapshot to board'],
    clear: ['移除快照', 'Remove snapshot'],
    dataTitle: ['记录与导出', 'Notes and exports'],
    note: ['实验笔记（最多 1,000 字符）', 'Experiment notes (up to 1,000 characters)'],
    dataHint: ['八个实验各自保存在当前浏览器。每案支持 12 次热板或快照操作的撤销，切换实验或刷新会清空撤销历史。CSV 记录当前实验的逐格读数；JSON 备份全部实验、快照和笔记，导入上限 512 KB。', 'The eight experiments save separately in this browser. Undo up to 12 board or snapshot changes until you switch experiments or reload. CSV records cell readings for the current experiment. JSON backs up all experiments, snapshots, and notes, with a 512 KB import limit.'],
    csv: ['下载逐格 CSV', 'Download cell CSV'],
    backup: ['备份全部 JSON', 'Back up all as JSON'],
    import: ['导入完整备份', 'Import full backup'],
  };
  const edges = {
    sealed: ['绝热边缘', 'Sealed edge'],
    ambient: ['外界温度恒定为 20', 'Fixed reservoir at 20'],
    wrap: ['对边环绕', 'Wrap opposite edges'],
  };
  const materials = {
    standard: ['普通材料', 'Standard material'], slow: ['慢导热材料', 'Slow material'], blocked: ['隔断', 'Blocked tile'],
  };
  const brushes = {
    probe: ['只测量', 'Probe only'],
    100: ['画热格 · 100', 'Paint hot · 100'],
    60: ['画暖格 · 60', 'Paint warm · 60'],
    20: ['画常温格 · 20', 'Paint ambient · 20'],
    0: ['画冷格 · 0', 'Paint cold · 0'],
    ...materials,
  };
  const views = {
    heat: ['温度图', 'Temperature map'], material: ['材料图', 'Material map'], difference: ['差值图', 'Difference map'],
  };
  const materialColors = {standard: '#91b5b4', slow: '#d1ab65', blocked: '#839096'};
  const cool = [40, 83, 154], mid = [247, 228, 161], hot = [180, 40, 42], neutral = [239, 245, 241];
  const ramp = (a, b, fraction) => 'rgb(' + a.map((value, i) => Math.round(value + (b[i] - value) * fraction)).join(',') + ')';
  const heatColor = value => value <= 50 ? ramp(cool, mid, value / 50) : ramp(mid, hot, (value - 50) / 50);
  const differenceColor = value => ramp(neutral, value < 0 ? cool : hot, Math.min(1, Math.abs(value) / 20));
  const fixed = value => value.toFixed(2);
  const signed = value => Math.abs(value) < 0.005 ? '0.00' : (value > 0 ? '+' : '') + fixed(value);
  const node = (tag, text, className) => {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  };
  const coordinate = index => P(['第 ', 'Column ']) + (index % C.width + 1) + P([' 列，第 ', ', row ']) +
    (Math.floor(index / C.width) + 1) + P([' 行', '']);

  let state = C.fresh();
  let storageOK = true;
  let notice = null;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const saved = C.restore(JSON.parse(raw));
      if (saved) state = saved;
      else notice = ['可以从有效的 JSON 备份恢复实验。', 'You can recover experiments from a valid JSON backup.'];
    }
  } catch {
    storageOK = false;
  }
  const run = () => state.runs[state.selected];
  const board = () => run().board;
  let cursor = run().probe;
  let anchor = null;
  let brush = 'probe';
  let view = 'heat';
  let timer = null;
  let revision = 0;
  let importNumber = 0;
  let composing = false;
  const past = [];
  const future = [];

  const tiles = Array.from({length: C.size}, (_, index) => {
    const button = node('button', undefined, 'cell');
    button.type = 'button';
    button.addEventListener('click', () => selectTile(index));
    return button;
  });
  $('board').append(...tiles);

  function writeStorage() {
    try {
      localStorage.setItem(key, JSON.stringify(state));
      storageOK = true;
    } catch {
      storageOK = false;
    }
    showStorage();
  }

  function showStorage() {
    $('storage').textContent = storageOK ? P(['已在本浏览器保存。', 'Saved in this browser.'])
      : P(['浏览器存储不可用。请下载 JSON 备份。', 'Browser storage is unavailable. Download a JSON backup.']);
  }

  function edited() {
    revision++;
    notice = null;
    $('notice').textContent = '';
    writeStorage();
  }

  function frame() {
    return C.copy({board: board(), snapshot: run().snapshot});
  }

  function remember() {
    past.push(frame());
    if (past.length > 12) past.shift();
    future.length = 0;
  }

  function stop() {
    if (timer === null) return;
    clearInterval(timer);
    timer = null;
    writeStorage();
  }

  function change(action) {
    stop();
    remember();
    action();
    anchor = null;
    edited();
    render();
  }

  function traverse(from, to) {
    stop();
    if (!from.length) return;
    to.push(frame());
    Object.assign(run(), from.pop());
    anchor = null;
    edited();
    render();
  }

  function step(count) {
    if (board().steps === C.maxSteps) return;
    change(() => { run().board = C.advance(board(), count); });
  }

  function play() {
    if (timer !== null) {
      stop();
      render();
      return;
    }
    if (board().steps === C.maxSteps) return;
    remember();
    anchor = null;
    edited();
    timer = setInterval(() => {
      run().board = C.advance(board(), 1);
      revision++;
      if (board().steps === C.maxSteps) stop();
      else if (board().steps % 12 === 0) writeStorage();
      render();
    }, 125);
    render();
  }

  function selectTile(index) {
    cursor = index;
    run().probe = index;
    if (brush === 'probe') {
      edited();
      render();
      return;
    }
    stop();
    if ($('rectangle').checked && anchor === null) {
      anchor = index;
      edited();
      render();
      return;
    }
    const start = anchor ?? index;
    change(() => {
      const x0 = Math.min(start % C.width, index % C.width);
      const x1 = Math.max(start % C.width, index % C.width);
      const y0 = Math.min(Math.floor(start / C.width), Math.floor(index / C.width));
      const y1 = Math.max(Math.floor(start / C.width), Math.floor(index / C.width));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const tile = C.index(x, y);
          if (Object.hasOwn(materials, brush)) board().material[tile] = brush;
          else board().temp[tile] = Number(brush);
        }
      }
    });
  }

  $('board').addEventListener('keydown', event => {
    const x = cursor % C.width, y = Math.floor(cursor / C.width);
    const next = {ArrowLeft: [x - 1, y], ArrowRight: [x + 1, y], ArrowUp: [x, y - 1], ArrowDown: [x, y + 1]};
    if (event.key === 'Escape') {
      anchor = null;
      render();
      return;
    }
    if (!Object.hasOwn(next, event.key)) return;
    event.preventDefault();
    const [column, row] = next[event.key];
    if (column < 0 || column >= C.width || row < 0 || row >= C.height) return;
    cursor = C.index(column, row);
    render();
    tiles[cursor].focus();
  });

  function options(id, pairs, selected) {
    $(id).replaceChildren(...Object.entries(pairs).map(([value, pair]) => {
      const option = node('option', P(pair));
      option.value = value;
      return option;
    }));
    $(id).value = selected;
  }

  function localize() {
    for (const el of document.querySelectorAll('[data-i]')) el.textContent = P(labels[el.dataset.i]);
    options('case', Object.fromEntries(C.cases.map(template => [template.id, template.name])), state.selected);
    options('edge', edges, board().edge);
    options('rate', {10: ['慢档 · 10%', 'Slow · 10%'], 20: ['快档 · 20%', 'Fast · 20%']}, board().rate);
    options('brush', brushes, brush);
    options('view', views, view);
  }

  function legend() {
    const keys = {
      heat: [['0', heatColor(0)], ['50', heatColor(50)], ['100', heatColor(100)]],
      material: Object.entries(materials).map(([name, pair]) => [P(pair), materialColors[name]]),
      difference: [['−20', differenceColor(-20)], ['0', differenceColor(0)], ['+20', differenceColor(20)]],
    };
    $('legend').replaceChildren(...keys[view].map(([text, color]) => {
      const item = node('span', undefined, 'key');
      const swatch = node('span', undefined, 'swatch');
      swatch.style.backgroundColor = color;
      swatch.setAttribute('aria-hidden', 'true');
      item.append(swatch, node('span', text));
      return item;
    }));
  }

  function render() {
    const experiment = C.caseFor(state.selected);
    const {temp, material, steps} = board();
    const {probe, snapshot} = run();
    if (!snapshot && view === 'difference') view = 'heat';
    $('case').value = state.selected;
    $('edge').value = board().edge;
    $('rate').value = board().rate;
    $('view').value = view;
    $('view').querySelector('[value=difference]').disabled = !snapshot;
    $('rectangle').disabled = brush === 'probe';
    $('caseTitle').textContent = P(experiment.name);
    $('task').textContent = P(experiment.task);
    $('stepCount').textContent = P(['步数 ', 'Step ']) + steps + ' / ' + C.maxSteps;
    $('brushHint').textContent = anchor !== null
      ? P(['已选起点。选对角格填充矩形。', 'First corner set. Choose the opposite corner to fill the rectangle.'])
      : P(['用探针读数，或选画笔涂一格。开启矩形后依次选两个对角格。', 'Read a tile with the probe or paint it with a brush. In rectangle mode, choose two opposite corners.']);
    $('play').textContent = timer === null ? P(['连续运行', 'Run continuously']) : P(['暂停', 'Pause']);
    $('play').disabled = $('single').disabled = $('twelve').disabled = steps === C.maxSteps;
    $('undo').disabled = past.length === 0;
    $('redo').disabled = future.length === 0;
    $('recall').disabled = $('clear').disabled = !snapshot;
    $('boardFrame').classList.toggle('large', $('zoom').checked);
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      tile.tabIndex = i === cursor ? 0 : -1;
      tile.dataset.material = material[i];
      tile.dataset.probe = String(i === probe);
      tile.dataset.anchor = String(i === anchor);
      const label = coordinate(i) + ' · ' + fixed(temp[i]) + ' · ' + P(materials[material[i]]);
      tile.title = label;
      tile.setAttribute('aria-label', label);
      const color = view === 'material' ? materialColors[material[i]]
        : view === 'difference' ? differenceColor(temp[i] - snapshot.temp[i]) : heatColor(temp[i]);
      tile.style.setProperty('--tile', color);
    }
    legend();
    $('probe').setAttribute('aria-live', timer === null ? 'polite' : 'off');
    $('probe').replaceChildren(node('p', coordinate(probe)), node('strong', fixed(temp[probe])), node('p', P(materials[material[probe]])));
    if (snapshot) {
      $('probe').append(node('p', P(['与快照温差 ', 'Change from snapshot ']) + signed(temp[probe] - snapshot.temp[probe])));
    }
    const metrics = C.metrics(temp);
    $('metrics').replaceChildren(...[
      [['最低', 'Minimum'], metrics.low], [['最高', 'Maximum'], metrics.high],
      [['全板平均', 'Board mean'], metrics.mean], [['最高减最低', 'Temperature span'], metrics.span],
    ].map(([label, value]) => {
      const item = node('div');
      item.append(node('dt', P(label)), node('dd', fixed(value)));
      return item;
    }));
    $('comparison').textContent = snapshot
      ? P(['快照步数 ', 'Snapshot at step ']) + snapshot.steps + ' · ' + P(edges[snapshot.edge]) +
        ' · ' + snapshot.rate + '% · ' + P(['平均温差 ', 'Mean change ']) + signed(metrics.mean - C.metrics(snapshot.temp).mean)
      : P(['当前实验还没有快照。', 'This experiment has no snapshot yet.']);
    $('notice').textContent = notice ? P(notice) : '';
  }

  function showRun() {
    cursor = run().probe;
    anchor = null;
    $('note').value = run().note;
    past.length = 0;
    future.length = 0;
    render();
  }

  $('case').onchange = () => {
    stop();
    state.selected = $('case').value;
    edited();
    showRun();
  };
  $('edge').onchange = () => change(() => { board().edge = $('edge').value; });
  $('rate').onchange = () => change(() => { board().rate = Number($('rate').value); });
  $('brush').onchange = () => { brush = $('brush').value; anchor = null; render(); };
  $('view').onchange = () => { view = $('view').value; render(); };
  $('rectangle').onchange = () => { anchor = null; render(); };
  $('zoom').onchange = render;
  $('single').onclick = () => step(1);
  $('twelve').onclick = () => step(12);
  $('play').onclick = play;
  $('reset').onclick = () => change(() => { run().board = C.initial(C.caseFor(state.selected)); });
  $('undo').onclick = () => traverse(past, future);
  $('redo').onclick = () => traverse(future, past);
  $('capture').onclick = () => change(() => { run().snapshot = C.copy(board()); });
  $('recall').onclick = () => change(() => { run().board = C.copy(run().snapshot); });
  $('clear').onclick = () => change(() => { run().snapshot = null; });

  function saveNote() {
    const clipped = [...$('note').value].slice(0, 1000).join('');
    if ($('note').value !== clipped) $('note').value = clipped;
    run().note = clipped;
    edited();
  }
  $('note').addEventListener('compositionstart', () => { composing = true; revision++; });
  $('note').addEventListener('compositionend', () => { composing = false; saveNote(); });
  $('note').addEventListener('input', event => { if (!event.isComposing) saveNote(); });

  function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], {type}));
    const link = node('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $('csv').onclick = () => {
    const {temp, material, edge, rate, steps} = board();
    const snapshot = run().snapshot;
    const rows = temp.map((value, i) => [
      i % C.width + 1, Math.floor(i / C.width) + 1, steps, edge, rate, material[i], fixed(value),
      snapshot?.steps ?? '', snapshot ? fixed(snapshot.temp[i]) : '', snapshot ? fixed(value - snapshot.temp[i]) : '',
    ].join(','));
    download('heat-mosaic-' + state.selected + '.csv',
      ['column,row,step,edge,rate_percent,material,temperature,snapshot_step,snapshot_temperature,difference', ...rows].join('\n'), 'text/csv;charset=utf-8');
  };
  $('backup').onclick = () => download('heat-mosaic.json', JSON.stringify(state), 'application/json');
  $('import').onclick = () => { stop(); render(); $('file').click(); };
  $('file').onchange = async () => {
    const file = $('file').files[0];
    $('file').value = '';
    if (!file) return;
    stop();
    render();
    const number = ++importNumber;
    const start = revision;
    let restored = null;
    try {
      if (file.size <= C.maxBackup) restored = C.restore(JSON.parse(await file.text()));
    } catch {
      restored = null;
    }
    if (number !== importNumber) return;
    if (!restored) {
      notice = ['请选择 512 KB 以内的完整备份。当前数据已保留。', 'Choose a complete backup within 512 KB. Your work was kept.'];
    } else if (composing || start !== revision) {
      notice = ['读取时发生编辑或切换。当前数据已保留。', 'Editing or navigation occurred during the read. Your work was kept.'];
    } else {
      state = restored;
      edited();
      showRun();
      notice = ['已导入全部八个实验。', 'All eight experiments were imported.'];
    }
    render();
  };
  window.addEventListener('pagehide', () => { if (timer !== null) writeStorage(); });
  window.addEventListener('programlanguagechange', () => { localize(); render(); showStorage(); });
  localize();
  showRun();
  showStorage();
})();
