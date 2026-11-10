'use strict';
(() => {
  const C = DieTracks;
  const $ = id => document.getElementById(id);
  const P = pair => pair[ProgramLanguage.language === 'en' ? 1 : 0];
  const key = 'imp-021-die-tracks-v1';
  const labels = {
    eyebrow: ['十六座朝向迷宫', 'SIXTEEN ORIENTATION MAZES'],
    headline: ['先翻一面，再走一步', 'Every roll changes the route'],
    intro: ['把骰子沿棱滚到相邻格。数字地砖检查底面，终点可能要求特定顶面。有时最短路线必须先回到原格，换个朝向再走。', 'Roll the die over an edge onto a neighbouring square. Numbered tiles check the bottom face, and a goal may require a particular top face. A shortest route can revisit a square to change orientation.'],
    start: ['选择地图 ↓', 'Choose a board ↓'],
    guide: ['了解滚动谜题 ↓', 'Read about rolling puzzles ↓'],
    route: ['01 / 规划路线', '01 / PLAN A ROUTE'],
    level: ['迷宫', 'Maze'],
    boardHint: ['聚焦地图后，用方向键或 W/A/S/D 滚动。U 撤销，Y 重做。也可以用下方按钮。', 'Focus the board and use arrows or W/A/S/D to roll. U undoes a roll and Y redoes it. The buttons below also work.'],
    legend: ['S 起点 · G 终点 · # 墙 · 数字为进入时所需的底面。文本图用方括号标记当前位置。', 'S start · G goal · # wall · Numbers require a matching bottom on entry. Brackets mark the current square on the text map.'],
    undo: ['撤销一步', 'Undo roll'],
    redo: ['重做一步', 'Redo roll'],
    reset: ['重开本关', 'Restart maze'],
    hint: ['提示下一步', 'Hint for next roll'],
    next: ['下一关', 'Next maze'],
    faces: ['骰子朝向', 'Die orientation'],
    recordHint: ['最少滚动数已验证。无提示纪录和用提示纪录分别计算。提示影响本次尝试，重开后恢复无提示模式。', 'The minimum roll count is verified. Unassisted and hinted runs have separate records. A hint marks this attempt until you restart.'],
    textMap: ['查看文本地图', 'Read the text map'],
    notes: ['笔记与导出', 'Notes and exports'],
    note: ['本关笔记（最多 1,000 字符）', 'Maze notes (up to 1,000 characters)'],
    storageHint: ['各关的路线、纪录和笔记保存在当前浏览器。单次尝试最多 360 步。TXT 导出本关路线；JSON 备份全部十六关，导入上限 192 KB。导入后可找回旧数据，直到修改关卡或刷新。', 'Each maze saves routes, records, and notes in this browser. An attempt can contain up to 360 rolls. TXT exports routes for this maze. JSON backs up all sixteen mazes, with a 192 KB limit. Recover previous work after import until you edit a maze or reload.'],
    export: ['导出路线 TXT', 'Export routes TXT'],
    backup: ['备份全部 JSON', 'Back up all as JSON'],
    import: ['导入完整备份', 'Import full backup'],
    recover: ['找回导入前的数据', 'Recover work from before import'],
  };
  const arrows = {N: '↑', E: '→', S: '↓', W: '←'};
  const names = {N: ['向北', 'North'], E: ['向东', 'East'], S: ['向南', 'South'], W: ['向西', 'West']};
  const faces = [
    ['top', ['顶面', 'Top']], ['bottom', ['底面', 'Bottom']],
    ['north', ['北面', 'North']], ['south', ['南面', 'South']],
    ['west', ['西面', 'West']], ['east', ['东面', 'East']],
  ];
  const node = (tag, value) => {
    const element = document.createElement(tag);
    if (value !== undefined) element.textContent = value;
    return element;
  };
  const heading = level => level.id + ' · ' + P(level.name);
  const tileName = tile => ({
    '.': P(['空地', 'Open floor']), S: P(['起点', 'Start']), G: P(['终点', 'Goal']), '#': P(['墙', 'Wall']),
  })[tile] || P(['底面要求 ', 'Bottom required ']) + tile;

  let data = C.fresh();
  let storageOK = true;
  let notice = null;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const restored = C.restore(JSON.parse(raw));
      if (restored) data = restored;
      else notice = ['可以导入有效备份来恢复数据。', 'Import a valid backup to recover your work.'];
    }
  } catch {
    storageOK = false;
  }
  const level = () => C.levelFor(data.active);
  const run = () => data.runs[data.active];
  let feedback = null;
  let hint = null;
  let revision = 0;
  let request = 0;
  let recovery = null;
  let composing = false;

  const controls = Object.fromEntries(Object.keys(C.directions).map(direction => {
    const button = node('button');
    button.type = 'button';
    button.dataset.roll = direction;
    button.onclick = () => advance(direction);
    $('controls').append(button);
    return [direction, button];
  }));

  function showStorage() {
    $('storage').textContent = storageOK ? P(['已在本浏览器保存。', 'Saved in this browser.'])
      : P(['浏览器存储不可用。仍可下载备份。', 'Browser storage is unavailable. You can still download a backup.']);
  }

  function save(keepRecovery = false) {
    revision++;
    if (!keepRecovery) recovery = null;
    notice = null;
    $('notice').textContent = '';
    $('recover').hidden = !recovery;
    try {
      localStorage.setItem(key, JSON.stringify(data));
      storageOK = true;
    } catch {
      storageOK = false;
    }
    showStorage();
  }

  function localize() {
    for (const element of document.querySelectorAll('[data-i]')) element.textContent = P(labels[element.dataset.i]);
    $('level').replaceChildren(...C.levels.map(item => {
      const option = node('option', heading(item));
      option.value = item.id;
      return option;
    }));
    for (const [direction, button] of Object.entries(controls)) {
      button.textContent = arrows[direction] + ' ' + P(names[direction]);
    }
  }

  function renderBoard(maze, state) {
    const board = $('board');
    board.style.setProperty('--columns', maze.width);
    board.style.setProperty('--board-width', (maze.width * 67 + 10) + 'px');
    const x = state.pos % maze.width + 1, y = Math.floor(state.pos / maze.width) + 1;
    board.setAttribute('aria-label', P(['当前位置：第 ', 'Position: column ']) + x + P([' 列，第 ', ', row ']) + y +
      P([' 行 · 顶面 ', ' · Top ']) + state.faces[0] + P([' · 底面 ', ' · Bottom ']) + state.faces[1] +
      ' · ' + tileName(maze.cells[state.pos]));
    const cells = [...maze.cells].map((tile, index) => {
      const element = node('div', tile === '#' || tile === '.' ? '' : tile);
      element.className = 'tile';
      element.dataset.kind = tile;
      element.dataset.gate = String(/[1-6]/.test(tile));
      element.title = tileName(tile);
      if (index === state.pos) {
        const die = node('span', state.faces[0]);
        die.className = 'die';
        element.append(die);
      }
      return element;
    });
    board.replaceChildren(...cells);
    $('textMap').textContent = maze.map.map((row, y) => [...row].map((tile, x) =>
      state.pos === y * maze.width + x ? '[' + tile + ']' : tile).join(' ')).join('\n');
  }

  function status(maze, state, finished) {
    if (finished) return P(['已完成迷宫。', 'Maze complete.']);
    if (hint) return P(['下一步：', 'Next roll: ']) + P(names[hint[0]]) +
      P(['。从这里最少还需 ', '. Minimum remaining: ']) + hint.length + P([' 步。', ' rolls.']);
    if (feedback?.reason === 'wall') return P(['这一步被墙或地图边缘挡住。', 'A wall or the board edge blocks that roll.']);
    if (feedback?.reason === 'floor') return P(['地砖需要底面 ', 'Tile needs bottom ']) + feedback.need +
      P(['。这一步会把 ', '. That roll would put ']) + feedback.bottom + P([' 翻到底面。', ' underneath.']);
    if (feedback?.reason === 'limit') return P(['已达 360 步。请撤销或重开。', 'Reached 360 rolls. Undo or restart.']);
    if (feedback?.reason === 'no-route') return P(['这一路线无法在剩余步数内完成。请撤销或重开。', 'No finish is available within the remaining rolls. Undo or restart.']);
    if (state.pos === maze.goal) return P(['已到终点格，顶面需要 ', 'At the goal. The top needs to be ']) + maze.top +
      P(['。离开后可再回来。', '. You can leave and return.']);
    return P(['可继续滚动。', 'Ready for the next roll.']);
  }

  function recordLines(maze, current) {
    const empty = P(['尚无', 'none yet']);
    return [
      P(['当前步数 ', 'Current rolls ']) + current.path.length + P([' · 最少 ', ' · Minimum ']) + maze.minimum,
      P(['无提示纪录 ', 'Unassisted best ']) + (current.best?.length ?? empty),
      P(['用提示纪录 ', 'Hinted best ']) + (current.guided?.length ?? empty),
      current.assisted ? P(['本次使用过提示', 'Hinted attempt']) : P(['本次尚未用提示', 'Unassisted attempt']),
    ];
  }

  function render() {
    const maze = level(), current = run(), state = C.replay(maze, current.path);
    const finished = C.won(maze, state);
    $('level').value = maze.id;
    $('levelTitle').textContent = heading(maze);
    $('clue').textContent = P(maze.clue);
    $('goal').textContent = maze.top === null ? P(['目标：滚到 G。', 'Goal: roll onto G.'])
      : P(['目标：滚到 G，并让 ', 'Goal: roll onto G with ']) + maze.top + P([' 朝上。', ' on top.']);
    renderBoard(maze, state);
    $('faces').replaceChildren(...faces.map(([id, label], index) => {
      const el = node('div');
      el.dataset.face = id;
      el.append(node('dt', P(label)), node('dd', state.faces[index]));
      return el;
    }));
    $('status').textContent = status(maze, state, finished);
    $('status').dataset.won = String(finished);
    $('record').replaceChildren(...recordLines(maze, current).map(line => node('div', line)));
    $('undo').disabled = !current.path;
    $('redo').disabled = !current.redo;
    $('next').disabled = !finished || C.levels.at(-1) === maze;
    $('hint').disabled = finished || current.path.length === C.maxRolls;
    for (const button of Object.values(controls)) button.disabled = finished;
    $('notice').textContent = notice ? P(notice) : '';
  }

  function clearFeedback() { feedback = null; hint = null; }

  function record(state) {
    if (!C.won(level(), state)) return;
    const current = run();
    const bucket = current.assisted ? 'guided' : 'best';
    if (current[bucket] === null || current.path.length < current[bucket].length) current[bucket] = current.path;
  }

  function advance(direction) {
    const current = run();
    const state = C.replay(level(), current.path);
    if (C.won(level(), state)) return;
    clearFeedback();
    if (current.path.length === C.maxRolls) feedback = {reason: 'limit'};
    else {
      const result = C.move(level(), state, direction);
      if (!result.state) feedback = result;
      else {
        current.path += direction;
        current.redo = '';
        record(result.state);
        save();
      }
    }
    render();
  }

  function undo() {
    const current = run();
    if (!current.path) return;
    current.redo = current.path.slice(-1) + current.redo;
    current.path = current.path.slice(0, -1);
    clearFeedback();
    save();
    render();
  }
  function redo() {
    const current = run();
    if (!current.redo) return;
    current.path += current.redo[0];
    current.redo = current.redo.slice(1);
    record(C.replay(level(), current.path));
    clearFeedback();
    save();
    render();
  }
  function selectLevel(id) {
    data.active = id;
    save(true);
    showLevel();
  }
  function showLevel() {
    $('note').value = run().note;
    clearFeedback();
    render();
  }

  $('board').addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const direction = {ArrowUp: 'N', ArrowDown: 'S', ArrowLeft: 'W', ArrowRight: 'E', w: 'N', a: 'W', s: 'S', d: 'E'}[event.key];
    if (direction) { event.preventDefault(); advance(direction); }
    else if (event.key === 'u') { event.preventDefault(); undo(); }
    else if (event.key === 'y') { event.preventDefault(); redo(); }
  });
  $('level').onchange = () => selectLevel($('level').value);
  $('next').onclick = () => {
    selectLevel(C.levels[C.levels.indexOf(level()) + 1].id);
    $('board').focus();
  };
  $('undo').onclick = undo;
  $('redo').onclick = redo;
  $('reset').onclick = () => {
    Object.assign(run(), {path: '', redo: '', assisted: false});
    clearFeedback();
    save();
    render();
  };
  $('hint').onclick = () => {
    clearFeedback();
    const path = C.shortest(level(), C.replay(level(), run().path));
    if (!path || path.length + run().path.length > C.maxRolls) feedback = {reason: 'no-route'};
    else {
      hint = path;
      run().assisted = true;
      save();
    }
    render();
  };

  function saveNote() {
    const clipped = [...$('note').value].slice(0, 1000).join('');
    if ($('note').value !== clipped) $('note').value = clipped;
    if (run().note === clipped) return;
    run().note = clipped;
    save();
  }
  $('note').addEventListener('compositionstart', () => { composing = true; revision++; });
  $('note').addEventListener('compositionend', () => { composing = false; saveNote(); });
  $('note').addEventListener('input', event => { if (!event.isComposing) saveNote(); });

  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], {type}));
    const link = node('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $('text').onclick = () => {
    const current = run();
    const route = path => path ? [...path].map(direction => arrows[direction]).join(' ') : '—';
    const lines = [P(['021 · 骰轨迷宫', '021 · Die Tracks']), heading(level()), $('goal').textContent,
      ...recordLines(level(), current), P(['当前路线 ', 'Current route ']) + route(current.path),
      P(['无提示最佳路线 ', 'Best unassisted route ']) + route(current.best),
      P(['用提示最佳路线 ', 'Best hinted route ']) + route(current.guided), '', current.note];
    download('die-tracks-' + level().id + '.txt', lines.join('\n'), 'text/plain;charset=utf-8');
  };
  $('backup').onclick = () => download('die-tracks.json', JSON.stringify(data), 'application/json');
  $('import').onclick = () => $('file').click();
  $('file').onchange = async () => {
    const file = $('file').files[0];
    $('file').value = '';
    if (!file) return;
    const number = ++request, start = revision;
    let restored = null;
    try {
      if (file.size <= C.maxBackup) restored = C.restore(JSON.parse(await file.text()));
    } catch {
      restored = null;
    }
    if (number !== request) return;
    if (!restored) {
      notice = ['请选择 192 KB 以内的完整备份。当前数据已保留。', 'Choose a complete backup within 192 KB. Your work was kept.'];
    } else if (composing || start !== revision) {
      notice = ['读取时发生编辑或切换。当前数据已保留。', 'Editing or navigation occurred during the read. Your work was kept.'];
    } else {
      recovery = data;
      data = restored;
      save(true);
      showLevel();
      notice = ['已导入十六关。', 'All sixteen mazes were imported.'];
    }
    $('notice').textContent = P(notice);
  };
  $('recover').onclick = () => {
    if (!recovery || composing) return;
    data = recovery;
    save();
    notice = ['已找回导入前的数据。', 'Pre-import work was recovered.'];
    showLevel();
    $('import').focus();
  };
  window.addEventListener('programlanguagechange', () => { localize(); render(); showStorage(); });
  localize();
  showLevel();
  showStorage();
})();
