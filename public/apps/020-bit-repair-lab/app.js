'use strict';
(() => {
  const C = BitRepair;
  const $ = id => document.getElementById(id);
  const P = pair => pair[ProgramLanguage.language === 'en' ? 1 : 0];
  const key = 'imp-020-bit-repair-lab-v1';
  const labels = {
    eyebrow: ['八个纠错实验', 'EIGHT ERROR-CORRECTION EXPERIMENTS'],
    headline: ['报文能修好吗？', 'Can the packet be repaired?'],
    intro: ['翻转接收端的比特，观察分组校验怎样指向某一位。并排比较 7 位和 8 位接收端，看看接收端的报告与实际恢复是否一致。', 'Flip bits at the receiver and trace which position the group checks point to. Compare the 7-bit and 8-bit receivers side by side and see whether their reports match what was actually recovered.'],
    start: ['选择实验 ↓', 'Choose an experiment ↓'],
    guide: ['了解汉明码 ↓', 'Read about Hamming codes ↓'],
    stage: ['01 / 实验起点', '01 / STARTING EXPERIMENT'],
    experiment: ['实验', 'Experiment'],
    answer: ['查看起始示例的解释', 'Explain the starting example'],
    sendStep: ['02 / 发送与翻转', '02 / SEND AND FLIP'],
    packet: ['报文工作区', 'Packet workbench'],
    payload: ['发送端四个数据位', 'Four payload bits at the sender'],
    wire: ['逐位模拟传输错误', 'Flip a received bit'],
    wireHint: ['每格显示发送 → 接收值。D 是数据位，P 是分组校验位，P★ 是仅在扩展码中出现的总校验位。按回车或空格翻转，按左右方向键移动。', 'Each tile shows sent → received. D marks data, P marks a group check, and P★ marks the extended word’s overall check. Use Enter or Space to flip and arrow keys to move.'],
    clean: ['清除翻转', 'Clear all flips'],
    reset: ['恢复示例比特', 'Reset example bits'],
    inspect: ['校验追踪', 'Check trace'],
    parityGroup: ['高亮覆盖位置', 'Highlight checked positions'],
    xorHint: ['⊕ 表示异或。把一组比特连起来做异或，1 的个数为奇数时结果是 1，为偶数时结果是 0。', '⊕ means XOR. Across a group of bits it gives 1 for an odd number of ones and 0 for an even number.'],
    decodeStep: ['03 / 接收端决定', '03 / RECEIVER DECISIONS'],
    decode: ['两种接收端', 'Two receivers'],
    truthHint: ['接收端只看收到的比特。原数据对照是实验额外提供的结果。', 'The receivers use the received bits. The original-payload comparison is supplied by the lab.'],
    sweepStep: ['04 / 全部位置组合', '04 / ALL FLIP PATTERNS'],
    sweep: ['错误穷举表', 'Fault sweep'],
    sweepMode: ['统计哪种报文', 'Word to sweep'],
    sweepHint: ['固定当前载荷，遍历该报文的所有翻转组合。每行按翻转位数汇总。从某一类中加载一组，回到报文逐位检查。', 'For the current payload, enumerate every flip pattern in the selected word. Each row groups patterns by the number of flips. Load one pattern from a result category to inspect it bit by bit.'],
    weight: ['翻转位数', 'Flips'],
    patterns: ['组合', 'Patterns'],
    right: ['数据一致', 'Match'],
    held: ['拦截', 'Held'],
    wrong: ['数据错误', 'Wrong'],
    sampleOutcome: ['原数据对照', 'Comparison outcome'],
    sample: ['加载一组翻转', 'Load a flip pattern'],
    notes: ['笔记与导出', 'Notes and exports'],
    note: ['实验笔记（最多 1,000 字符）', 'Experiment notes (up to 1,000 characters)'],
    storageHint: ['每个实验的载荷、翻转和笔记保存在当前浏览器。TXT 记录当前实验的结果。JSON 备份全部八个实验，导入上限 128 KB。导入后可找回旧数据，直到修改实验内容或刷新。', 'Each experiment saves its payload, flips, and notes in this browser. TXT records the current trial. JSON backs up all eight experiments, with a 128 KB import limit. Recover previous work after import until you edit an experiment or reload.'],
    export: ['导出实验 TXT', 'Export trial TXT'],
    backup: ['备份全部 JSON', 'Back up all as JSON'],
    import: ['导入完整备份', 'Import full backup'],
    recover: ['找回导入前的数据', 'Recover work from before import'],
  };
  const outcomes = {
    right: ['交付数据与原数据一致', 'Delivered payload matches'],
    held: ['已拦截，未交付数据', 'Held without delivery'],
    wrong: ['交付数据与原数据不同', 'Delivered payload differs'],
  };
  const formats = {7: ['7 位汉明码', '7-bit Hamming'], 8: ['8 位扩展汉明码', '8-bit extended Hamming']};
  const checked = position => position === 8 ? P(['总校验位', 'Overall check bit'])
    : C.data.includes(position) ? P(['数据位', 'Data bit']) : P(['分组校验位', 'Group check bit']);
  const word = bits => bits.join('');
  const node = (tag, text, className) => {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  };
  const button = action => {
    const el = node('button');
    el.type = 'button';
    el.onclick = action;
    return el;
  };

  let state = C.fresh();
  let storageOK = true;
  let notice = null;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const restored = C.restore(JSON.parse(raw));
      if (restored) state = restored;
      else notice = ['可以导入有效备份来恢复实验。', 'Import a valid backup to recover experiments.'];
    }
  } catch {
    storageOK = false;
  }
  const run = () => state.runs[state.active];
  let revision = 0;
  let request = 0;
  let composing = false;
  let recovery = null;
  let sweepKey = '';
  let sweepRows = [];

  const payloadButtons = Array.from({length: 4}, (_, i) => button(() => change(() => { run().payload ^= 1 << (3 - i); })));
  const wireButtons = Array.from({length: 8}, (_, i) => {
    const el = button(() => change(() => { run().mask ^= 1 << i; }));
    el.className = 'bit';
    el.dataset.position = i + 1;
    el.append(node('small', '#' + (i + 1)), node('small'), node('strong'));
    return el;
  });
  $('payload').append(...payloadButtons);
  $('wire').append(...wireButtons);
  for (const [id, buttons] of [['payload', payloadButtons], ['wire', wireButtons]]) {
    $(id).addEventListener('keydown', event => {
      const index = buttons.indexOf(event.target);
      if (index < 0 || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const next = index + (event.key === 'ArrowLeft' ? -1 : 1);
      buttons[next]?.focus();
    });
  }

  function showStorage() {
    $('storage').textContent = storageOK ? P(['已在本浏览器保存。', 'Saved in this browser.'])
      : P(['浏览器存储不可用。可以下载备份。', 'Browser storage is unavailable. You can still download a backup.']);
  }
  function save(keepRecovery = false) {
    revision++;
    if (!keepRecovery) recovery = null;
    notice = null;
    $('notice').textContent = '';
    $('recover').hidden = !recovery;
    try {
      localStorage.setItem(key, JSON.stringify(state));
      storageOK = true;
    } catch {
      storageOK = false;
    }
    showStorage();
  }
  function change(action) {
    action();
    save();
    render();
  }

  function options(id, pairs, fallback) {
    const select = $(id);
    const previous = select.value || String(fallback);
    select.replaceChildren(...Object.entries(pairs).map(([value, pair]) => {
      const option = node('option', P(pair));
      option.value = value;
      return option;
    }));
    select.value = Object.hasOwn(pairs, previous) ? previous : fallback;
  }

  function localize() {
    for (const el of document.querySelectorAll('[data-i]')) el.textContent = P(labels[el.dataset.i]);
    options('case', Object.fromEntries(C.cases.map(item => [item.id, item.name])), state.active);
    options('group', {1: ['第 1 组', 'Group 1'], 2: ['第 2 组', 'Group 2'], 4: ['第 4 组', 'Group 4'], 8: ['总校验', 'Overall check']}, 1);
    options('length', formats, 8);
    options('outcome', outcomes, 'right');
  }

  function decision(result) {
    if (result.held) return P(['拦截报文：分组校验失败，但总校验为偶。', 'Hold the word: nonzero syndrome and even overall parity.']);
    if (result.flip) return P(['按单错规则翻转第 ', 'Single-error rule flips position ']) + result.flip + P([' 位。', '.']);
    return P(['校验通过，直接交付。', 'Checks pass. Deliver unchanged.']);
  }
  function formatResult(result, length) {
    const overall = result.overall === null ? ''
      : P([' · 总校验：', ' · Overall: ']) + (result.overall ? P(['奇', 'odd']) : P(['偶', 'even']));
    const none = P(['无', 'none']);
    const output = result.word ? word(result.word) : none;
    const payload = result.payload === null ? none : word(C.bits(result.payload));
    return [
      P(formats[length]),
      P(['接收 ', 'Received ']) + word(result.received),
      P(['症状值 ', 'Syndrome ']) + result.syndrome + overall,
      decision(result),
      P(['输出报文 ', 'Output word ']) + output,
      P(['交付数据 ', 'Delivered payload ']) + payload,
      P(outcomes[result.outcome]),
    ];
  }

  function renderSweep(payload) {
    const length = Number($('length').value);
    const signature = payload + ':' + length;
    if (signature !== sweepKey) {
      sweepKey = signature;
      sweepRows = C.sweep(payload, length);
    }
    const previous = Number($('weight').value);
    if ($('weight').options.length !== sweepRows.length) {
      $('weight').replaceChildren(...sweepRows.map(row => node('option', String(row.weight))));
      $('weight').value = String(Math.min(previous, length));
    }
    $('sweepRows').replaceChildren(...sweepRows.map(row => {
      const tr = node('tr');
      tr.dataset.weight = row.weight;
      const heading = node('th', String(row.weight));
      heading.scope = 'row';
      tr.append(heading, ...['total', 'right', 'held', 'wrong'].map(field => node('td', String(row[field]))));
      return tr;
    }));
    renderSample();
  }
  function renderSample() {
    const row = sweepRows[Number($('weight').value)];
    const count = row[$('outcome').value];
    $('loadSample').disabled = count === 0;
    $('sampleStatus').textContent = count
      ? P(['该类组合数：', 'Patterns in this category: ']) + count
      : P(['这个翻转数没有该类结果。', 'No patterns at this flip count have that outcome.']);
  }

  function render() {
    const {payload, mask} = run();
    const experiment = C.caseFor(state.active);
    $('case').value = state.active;
    $('caseTitle').textContent = P(experiment.name);
    $('task').textContent = P(experiment.task);
    $('explanation').textContent = P(experiment.answer);
    const short = C.trial(payload, mask, 7);
    const long = C.trial(payload, mask, 8);
    const group = long.checks.find(check => check.id === Number($('group').value));
    C.bits(payload).forEach((bit, i) => {
      const el = payloadButtons[i];
      el.textContent = bit;
      el.setAttribute('aria-pressed', String(bit === 1));
      el.setAttribute('aria-label', P(['数据位 ', 'Payload bit ']) + (i + 1) + ' · ' + bit);
    });
    wireButtons.forEach((el, i) => {
      const position = i + 1;
      const sent = long.sent[i], received = long.received[i];
      el.children[1].textContent = position === 8 ? 'P★' : C.data.includes(position) ? 'D' : 'P';
      el.children[2].textContent = sent + '→' + received;
      el.dataset.group = String(group.positions.includes(position));
      el.setAttribute('aria-pressed', String(sent !== received));
      el.setAttribute('aria-label', P(['位置 ', 'Position ']) + position + ' · ' + checked(position) +
        P([' · 发送 ', ' · Sent ']) + sent + P([' · 接收 ', ' · received ']) + received);
    });
    const flips = wireButtons.flatMap((_, i) => mask & (1 << i) ? [i + 1] : []);
    $('faults').textContent = P(['已翻转位置：', 'Flipped positions: ']) + (flips.length ? flips.join(', ') : P(['无', 'none']));
    $('clean').disabled = mask === 0;
    const term = group.positions.map(position => long.received[position - 1]).join(' ⊕ ');
    $('equation').textContent = P(['接收位异或：', 'XOR of received bits: ']) + term + ' = ' + group.odd +
      (group.odd ? P(['（奇数，失败）', ' (odd, fails)']) : P(['（偶数，通过）', ' (even, passes)']));
    $('syndrome').textContent = P(['失败分组之和：', 'Sum of failed groups: ']) +
      (long.checks.slice(0, 3).filter(check => check.odd).map(check => check.id).join(' + ') || '0') + ' → ' + long.syndrome;
    $('results').replaceChildren(...[short, long].map((result, i) => {
      const article = node('article');
      article.dataset.length = i + 7;
      const [title, received, checks, action, output, delivered, outcome] = formatResult(result, i + 7);
      article.append(node('h3', title), node('p', received, 'word'), node('p', checks), node('p', action),
        node('p', output, 'word'), node('p', delivered, 'word'), node('p', outcome, result.outcome));
      return article;
    }));
    renderSweep(payload);
    $('notice').textContent = notice ? P(notice) : '';
  }

  function showExperiment() {
    $('note').value = run().note;
    $('answer').open = false;
    render();
  }
  $('case').onchange = () => { state.active = $('case').value; save(true); showExperiment(); };
  $('group').onchange = render;
  $('length').onchange = render;
  $('weight').onchange = renderSample;
  $('outcome').onchange = renderSample;
  $('clean').onclick = () => change(() => { run().mask = 0; });
  $('reset').onclick = () => change(() => {
    const {payload, faults} = C.caseFor(state.active);
    Object.assign(run(), {payload, mask: C.maskFor(faults)});
  });
  $('loadSample').onclick = () => {
    const mask = sweepRows[Number($('weight').value)].samples[$('outcome').value];
    change(() => { run().mask = mask; });
    (wireButtons.find((_, i) => mask & (1 << i)) || wireButtons[0]).focus();
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
    const {payload, mask, note} = run();
    const rows = [P(['020 · 比特修复台', '020 · Bit Repair Lab']), P(C.caseFor(state.active).name),
      P(['原始载荷 ', 'Original payload ']) + word(C.bits(payload)), $('faults').textContent, ''];
    for (const length of [7, 8]) rows.push(...formatResult(C.trial(payload, mask, length), length), '');
    rows.push(note);
    download('bit-repair-' + state.active + '.txt', rows.join('\n'), 'text/plain;charset=utf-8');
  };
  $('backup').onclick = () => download('bit-repair.json', JSON.stringify(state), 'application/json');
  $('import').onclick = () => $('file').click();
  $('file').onchange = async () => {
    const file = $('file').files[0];
    $('file').value = '';
    if (!file) return;
    const number = ++request;
    const start = revision;
    let restored = null;
    try {
      if (file.size <= C.maxBackup) restored = C.restore(JSON.parse(await file.text()));
    } catch {
      restored = null;
    }
    if (number !== request) return;
    if (!restored) {
      notice = ['请选择 128 KB 以内的完整备份。当前数据已保留。', 'Choose a complete backup within 128 KB. Your work was kept.'];
    } else if (composing || start !== revision) {
      notice = ['读取时发生编辑或切换。当前数据已保留。', 'Editing or navigation occurred during the read. Your work was kept.'];
    } else {
      recovery = state;
      state = restored;
      save(true);
      showExperiment();
      notice = ['已导入八个实验。', 'All eight experiments were imported.'];
    }
    $('notice').textContent = P(notice);
  };
  $('recover').onclick = () => {
    if (!recovery || composing) return;
    state = recovery;
    save();
    notice = ['已找回导入前的数据。', 'Pre-import work was recovered.'];
    showExperiment();
    $('import').focus();
  };
  window.addEventListener('programlanguagechange', () => { localize(); render(); showStorage(); });
  localize();
  showExperiment();
  showStorage();
})();
