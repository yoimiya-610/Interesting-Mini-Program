'use strict';
(() => {
  const C = StoryCut;
  const $ = id => document.getElementById(id);
  const P = pair => pair[ProgramLanguage.language === 'en' ? 1 : 0];
  const key = 'imp-022-story-cut-v1';
  const labels = {
    eyebrow: ['八篇故事 · 两条时间线', 'EIGHT STORIES · TWO ORDERS'],
    headline: ['先讲哪一段，故事就从哪里开始', 'Choose where the telling begins'],
    intro: ['事情发生的顺序不变，讲述却可以从中间开始。移动段落、改写衔接，再逐段阅读，看看线索何时有了答案。', 'Events keep their chronology, but a telling can begin in the middle. Move passages, rewrite transitions, and read step by step to see when cues find their explanations.'],
    start: ['开始剪辑 ↓', 'Start a cut ↓'], guide: ['了解叙事时间 ↓', 'Read about narrative time ↓'],
    case: ['选择故事', 'Choose a story'], exercise: ['本篇的两项练习', 'Two exercises for this story'],
    chronology: ['按发生顺序排列', 'Use chronological order'], suggested: ['试用本篇编排', 'Try the authored cut'],
    undo: ['撤销', 'Undo'], redo: ['重做', 'Redo'],
    sequence: ['01 / 讲述顺序', '01 / TELLING ORDER'],
    sequenceHint: ['T1–T8 表示固定的发生先后。右侧选择框表示讲述位置。可选中一段后用上移、下移，也可聚焦该段按钮后按 Alt + ↑ / ↓。', 'T1–T8 mark the fixed event chronology. The select boxes set telling positions. Select a passage and use Move earlier/later, or focus its button and press Alt + ↑ / ↓.'],
    editor: ['02 / 选择一段，改写衔接', '02 / REWRITE A TRANSITION'],
    up: ['上移一段', 'Move earlier'], down: ['下移一段', 'Move later'], original: ['查看原文', 'Read the original'],
    rewrite: ['本段叙述（最多 1,200 字符）', 'Passage wording (up to 1,200 characters)'],
    rewriteHint: ['第一次编辑后，本段以你的原文保存，切换语言也不改写。保留原文的段落随界面语言切换。可写清“此前”“第二天”等路标。', 'Once edited, a passage keeps your literal wording across languages. Unedited passages follow the interface language. Add time cues such as “earlier” or “the next day.”'],
    useOriginal: ['恢复本段原文', 'Use the original passage'],
    reader: ['03 / 逐段试读', '03 / READ THE CUT'],
    readerHint: ['预览只显示已读段落。下方是作者的标记分析；读者的真实理解和情绪需由你判断。', 'The preview shows only passages reached so far. The analysis uses author markers. Judge actual understanding and emotion for yourself.'],
    cursor: ['已读段数', 'Passages reached'], previous: ['回看一段', 'One fewer'], next: ['再读一段', 'One more'],
    analysis: ['04 / 时间与线索', '04 / TIME AND CUES'],
    analysisHint: ['图中横向是讲述位置，纵向 T1–T8 是发生先后。向较早事件回移不一定就是严格意义上的倒叙，还要看整篇的叙事基准。', 'The horizontal axis is telling position; T1–T8 on the vertical axis give event chronology. A move to an earlier event alone does not establish a formal flashback; the narrative’s reference frame matters.'],
    chartHint: ['T 编号是先后名次，不表示时长或等距时间。下方提供相同路线的文字形式。', 'T numbers are ranks, not durations or equal time intervals. The same route appears in text below.'],
    threads: ['三组线索—解释', 'Three cue–explanation pairs'],
    threadHint: ['标记固定连在原事件上；不会自动分析改写。如果改写删去了线索或提前透露答案，请自行调整解读。未决数量和逆序对都不是文学质量评分。', 'Markers stay attached to the original events and do not analyze rewrites. If you remove a cue or disclose an answer early in your wording, adjust your interpretation. Open-pair and inversion counts do not score literary quality.'],
    compare: ['05 / 留一个版本，再比较', '05 / KEEP A VERSION AND COMPARE'],
    compareHint: ['每篇可留一份对照，包含全部顺序、改写和笔记。比较同时展示两版的实际文字。撤销/重做保留本次访问的 30 次操作；离开本篇或刷新后清空。', 'Keep one comparison per story, including its order, rewrites, and note. Compare the actual wording in both cuts. Undo/redo keeps 30 operations during this visit and clears on story navigation or reload.'],
    checkpoint: ['保存或替换对照版', 'Keep or replace comparison'], restoreCheckpoint: ['取回对照版', 'Retrieve comparison'],
    note: ['本篇笔记（最多 1,000 字符）', 'Story notes (up to 1,000 characters)'],
    saveHint: ['八篇各自保存在当前浏览器。TXT 导出当前编排，JSON 备份全部故事与对照，导入上限 1.5 MB。导入后可找回原数据，直到编辑或刷新。', 'All eight stories save separately in this browser. TXT exports this cut; JSON backs up all stories and comparisons. Imports accept up to 1.5 MB. Recover pre-import work until an edit or reload.'],
    text: ['导出编排 TXT', 'Export cut TXT'], backup: ['备份全部 JSON', 'Back up all JSON'], import: ['导入完整备份', 'Import full backup'],
    recover: ['找回导入前的数据', 'Recover pre-import work'],
  };
  const states = {
    unread: ['两处均未读到', 'Neither marker reached'], waiting: ['线索已读，解释尚未读到', 'Cue reached, explanation still ahead'],
    'answer-first': ['先读到解释，线索尚未读到', 'Explanation reached before the cue'],
    resolved: ['先有线索，后读到解释', 'Cue followed by its explanation'], given: ['解释在前，随后读到线索', 'Explanation preceded its cue'],
  };
  const node = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  let data = C.fresh(), storageOK = true, notice = null, feedback = null;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const restored = C.restore(JSON.parse(stored));
      if (restored) data = restored;
      else notice = ['保存的数据不完整，可导入有效备份。', 'Stored data is incomplete. You can import a valid backup.'];
    }
  } catch { storageOK = false; }
  const source = () => C.caseFor(data.active);
  const entry = () => data.entries[data.active];
  let undoStack = [], redoStack = [], editGroup = null, composing = false;
  let revision = 0, request = 0, recovery = null;

  function showStorage() {
    $('storage').textContent = storageOK ? P(['已保存在本浏览器。', 'Saved in this browser.'])
      : P(['浏览器存储不可用。仍可下载备份。', 'Browser storage is unavailable. You can still download a backup.']);
  }
  function save(keepRecovery = false) {
    revision++;
    if (!keepRecovery) recovery = null;
    notice = null;
    try { localStorage.setItem(key, JSON.stringify(data)); storageOK = true; }
    catch { storageOK = false; }
    showStorage();
    $('notice').textContent = '';
    $('recover').hidden = !recovery;
  }
  function remember() {
    undoStack.push(C.copy(entry()));
    if (undoStack.length > 30) undoStack.shift();
    redoStack = [];
  }
  function change(action, message) {
    remember(); editGroup = null;
    action(); feedback = message || ['已更新编排。', 'Cut updated.']; save(); render();
  }
  function localize() {
    for (const element of document.querySelectorAll('[data-i]')) element.textContent = P(labels[element.dataset.i]);
    $('case').replaceChildren(...C.cases.map((item, i) => {
      const option = node('option', (i + 1) + ' · ' + P(item.name)); option.value = item.id; return option;
    }));
    $('chartTitle').textContent = P(['讲述位置与事件发生先后', 'Event chronology by telling position']);
  }
  function sequence() {
    const current = entry();
    $('sequence').replaceChildren(...current.cut.order.map((event, position) => {
      const row = node('li'); row.dataset.selected = String(current.selected === event);
      const button = node('button', (position + 1) + ' / T' + (event + 1) + ' · ' + P(source().events[event].title));
      button.className = 'event-button'; button.id = 'event-' + event;
      button.setAttribute('aria-pressed', String(current.selected === event));
      button.onclick = () => { current.selected = event; editGroup = null; save(true); render(); $('event-' + event).focus(); };
      button.onkeydown = e => {
        if (!e.altKey || !['ArrowUp', 'ArrowDown'].includes(e.key)) return;
        e.preventDefault(); current.selected = event;
        shift(e.key === 'ArrowUp' ? -1 : 1, 'event-' + event);
      };
      const select = node('select'); select.id = 'position-' + event;
      select.setAttribute('aria-label', 'T' + (event + 1) + P([' 的讲述位置', ' telling position']));
      for (let i = 0; i < 8; i++) { const option = node('option', String(i + 1)); option.value = String(i); select.append(option); }
      select.value = String(position);
      select.onchange = () => {
        change(() => { current.cut.order = C.move(current.cut.order, event, Number(select.value)); current.selected = event; });
        $('position-' + event).focus();
      };
      row.append(button, select); return row;
    }));
  }
  function editor(refreshFields) {
    const current = entry(), event = current.selected;
    $('eventTitle').textContent = 'T' + (event + 1) + ' · ' + P(source().events[event].title);
    $('original').textContent = P(source().events[event].text);
    if (refreshFields && !composing) {
      $('draft').value = C.textFor(source(), current.cut, event, ProgramLanguage.language);
      $('note').value = current.cut.note;
    }
  }
  function preview() {
    const current = entry(); $('cursor').value = String(current.cursor);
    $('readCount').textContent = current.cursor + ' / 8';
    $('previous').disabled = current.cursor === 0; $('next').disabled = current.cursor === 8;
    $('preview').replaceChildren(...current.cut.order.slice(0, current.cursor).map(event => {
      const row = node('li'); row.append(node('strong', P(source().events[event].title)), node('p', C.textFor(source(), current.cut, event, ProgramLanguage.language))); return row;
    }));
  }
  function analysis() {
    const result = C.analyze(source(), entry().cut.order, entry().cursor);
    $('metrics').replaceChildren(...[
      P(['向较早事件 ', 'Earlier transitions ']) + result.backward,
      P(['逆序对 ', 'Inverted pairs ']) + result.inversions,
      P(['最多未决标记 ', 'Peak open pairs ']) + result.peak,
    ].map(text => node('span', text)));
    const points = entry().cut.order.map((event, i) => [52 + i * 48, 25 + event * 25]);
    const svg = (tag, attributes, text) => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
      if (text !== undefined) element.textContent = text;
      return element;
    };
    const grid = [];
    for (let i = 0; i < 8; i++) {
      grid.push(svg('line', {x1: 44, x2: 394, y1: 25 + i * 25, y2: 25 + i * 25, stroke: '#e0d7da'}));
      grid.push(svg('text', {x: 4, y: 31 + i * 25}, 'T' + (i + 1)));
      grid.push(svg('text', {x: 48 + i * 48, y: 230}, String(i + 1)));
    }
    grid.push(svg('polyline', {points: points.map(p => p.join(',')).join(' '), fill: 'none', stroke: '#61415d', 'stroke-width': 3}));
    points.forEach(([cx, cy], i) => grid.push(svg('circle', {cx, cy, r: 6, fill: i < entry().cursor ? '#a85d25' : '#fffdfa', stroke: '#61415d', 'stroke-width': 2})));
    $('plot').replaceChildren(...grid);
    const text = entry().cut.order.map(event => 'T' + (event + 1)).join(' → ');
    $('transitionText').textContent = text;
    $('chartDescription').textContent = text;
    $('threads').replaceChildren(...result.threads.map(thread => {
      const row = node('li');
      row.append(node('strong', P(thread.label)), node('p', P(states[thread.state])));
      row.append(node('p', P(['线索位置 ', 'Cue position ']) + thread.cue + P([' · 解释位置 ', ' · Explanation position ']) + thread.answer, 'hint'));
      if (thread.cue < thread.answer) row.append(node('p', P(['中间相隔 ', 'Passages between ']) + thread.between, 'hint'));
      return row;
    }));
  }
  function comparison() {
    const current = entry();
    $('restoreCheckpoint').disabled = current.checkpoint === null;
    if (!current.checkpoint) {
      $('comparison').replaceChildren(node('p', P(['尚未保存对照版。', 'No comparison kept yet.']))); return;
    }
    const rows = C.differences(current.cut, current.checkpoint);
    const changes = rows.filter(row => row.before !== row.after || row.textChanged);
    const items = [node('p', P(['顺序或文字有变化的事件：', 'Events with order or wording changes: ']) + changes.length + ' / 8')];
    for (const row of rows) {
      const section = node('section', undefined, 'comparison-row');
      for (const [cut, position, label] of [[current.checkpoint, row.before, ['对照', 'Kept']], [current.cut, row.after, ['当前', 'Current']]]) {
        const column = node('div');
        column.append(node('h4', P(label) + ' ' + position + ' / T' + (row.event + 1) + ' · ' + P(source().events[row.event].title)),
          node('p', C.textFor(source(), cut, row.event, ProgramLanguage.language), 'comparison-reading'));
        section.append(column);
      }
      items.push(section);
    }
    items.push(node('p', P(['对照笔记：', 'Kept note: ']) + current.checkpoint.note, 'comparison-reading'));
    items.push(node('p', P(['当前笔记：', 'Current note: ']) + current.cut.note, 'comparison-reading'));
    $('comparison').replaceChildren(...items);
  }
  function render(refreshEditor = true) {
    $('case').value = data.active; $('caseTitle').textContent = P(source().name); $('premise').textContent = P(source().premise);
    $('prompts').replaceChildren(...source().prompts.map(pair => node('li', P(pair))));
    sequence(); editor(refreshEditor); preview(); analysis(); comparison();
    $('undo').disabled = !undoStack.length; $('redo').disabled = !redoStack.length;
    const position = entry().cut.order.indexOf(entry().selected);
    $('up').disabled = position === 0; $('down').disabled = position === 7;
    $('useOriginal').disabled = entry().cut.texts[entry().selected] === null;
    $('notice').textContent = notice ? P(notice) : '';
    $('status').textContent = feedback ? P(feedback) : '';
  }
  function shift(delta, focus) {
    const current = entry(), position = current.cut.order.indexOf(current.selected), destination = position + delta;
    if (destination < 0 || destination > 7) return;
    change(() => { current.cut.order = C.move(current.cut.order, current.selected, destination); });
    if (focus) $(focus).focus();
  }
  $('up').onclick = () => shift(-1); $('down').onclick = () => shift(1);
  $('chronology').onclick = () => change(() => { entry().cut.order = C.chronological(); entry().selected = 0; });
  $('suggested').onclick = () => change(() => { entry().cut.order = [...source().suggested]; entry().selected = entry().cut.order[0]; });
  function history(from, to) {
    if (!from.length) return;
    to.push(C.copy(entry())); data.entries[data.active] = from.pop(); editGroup = null;
    feedback = ['已取回上一步版本。', 'Previous step restored.']; save(); render();
  }
  $('undo').onclick = () => history(undoStack, redoStack); $('redo').onclick = () => history(redoStack, undoStack);
  $('case').onchange = () => {
    data.active = $('case').value; undoStack = []; redoStack = []; editGroup = null;
    feedback = null; save(true); render();
  };
  function readTo(value) { entry().cursor = value; save(true); preview(); analysis(); }
  $('cursor').oninput = () => readTo(Number($('cursor').value));
  $('previous').onclick = () => readTo(entry().cursor - 1); $('next').onclick = () => readTo(entry().cursor + 1);
  function write(field) {
    const current = entry(), limit = field === 'draft' ? 1200 : 1000;
    const text = [...$(field).value].slice(0, limit).join('');
    if ($(field).value !== text) $(field).value = text;
    const group = data.active + ':' + field + ':' + current.selected;
    const old = field === 'draft' ? current.cut.texts[current.selected] : current.cut.note;
    if (old === text) return;
    if (editGroup !== group) { remember(); editGroup = group; }
    if (field === 'draft') current.cut.texts[current.selected] = text;
    else current.cut.note = text;
    save(); render(false);
  }
  for (const field of ['draft', 'note']) {
    $(field).onfocus = () => { editGroup = null; };
    $(field).addEventListener('compositionstart', () => { composing = true; revision++; });
    $(field).addEventListener('compositionend', () => { composing = false; write(field); });
    $(field).oninput = event => { if (!event.isComposing) write(field); };
  }
  $('useOriginal').onclick = () => change(() => { entry().cut.texts[entry().selected] = null; });
  $('checkpoint').onclick = () => change(() => { entry().checkpoint = C.copy(entry().cut); }, ['已保存完整对照版。', 'Complete comparison kept.']);
  $('restoreCheckpoint').onclick = () => change(() => { entry().cut = C.copy(entry().checkpoint); });
  function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], {type})); const link = node('a'); link.href = url; link.download = name; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $('text').onclick = () => {
    const current = entry(), result = C.analyze(source(), current.cut.order, 8);
    const lines = [P(['022 · 叙时剪辑台', '022 · Story Cut Desk']), P(source().name), $('transitionText').textContent, '',
      ...current.cut.order.flatMap((event, i) => [(i + 1) + ' / T' + (event + 1) + ' · ' + P(source().events[event].title), C.textFor(source(), current.cut, event, ProgramLanguage.language), '']),
      P(labels.threads), ...result.threads.map(t => P(t.label) + ' · ' + P(['线索 ', 'Cue ']) + t.cue + ' / ' + P(['解释 ', 'Explanation ']) + t.answer),
      '', P(labels.note), current.cut.note];
    download('story-cut-' + data.active + '.txt', lines.join('\n'), 'text/plain;charset=utf-8');
  };
  $('backup').onclick = () => download('story-cuts.json', JSON.stringify(data), 'application/json');
  $('import').onclick = () => $('file').click();
  $('file').onchange = async () => {
    const file = $('file').files[0]; $('file').value = ''; if (!file) return;
    const number = ++request, start = revision; let restored = null;
    try { if (file.size <= C.maxBackup) restored = C.restore(JSON.parse(await file.text())); } catch { restored = null; }
    if (number !== request) return;
    if (!restored) notice = ['请选择 1.5 MB 以内的完整备份。当前数据已保留。', 'Choose a complete backup within 1.5 MB. Your work was kept.'];
    else if (composing || start !== revision) notice = ['读取期间发生编辑或导航。当前数据已保留。', 'Editing or navigation occurred during the read. Your work was kept.'];
    else {
      recovery = data; data = restored; undoStack = []; redoStack = []; editGroup = null;
      save(true); render(); notice = ['八篇故事与对照版已导入。', 'All eight stories and comparisons were imported.'];
    }
    $('notice').textContent = P(notice);
  };
  $('recover').onclick = () => {
    if (!recovery || composing) return;
    data = recovery; undoStack = []; redoStack = []; editGroup = null;
    save(); render(); notice = ['已找回导入前的数据。', 'Pre-import work recovered.']; $('notice').textContent = P(notice);
  };
  window.addEventListener('programlanguagechange', () => { localize(); render(!composing); showStorage(); });
  localize(); render(); showStorage();
})();
