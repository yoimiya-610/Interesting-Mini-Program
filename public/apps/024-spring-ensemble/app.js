'use strict';
(() => {
  const C = SpringEnsemble, $ = id => document.getElementById(id), P = pair => pair[ProgramLanguage.language === 'en' ? 1 : 0];
  const labels = {
    eyebrow: ['八个实验 · 一串集体节奏', 'EIGHT EXPERIMENTS · COLLECTIVE RHYTHMS'],
    headline: ['推一颗，听懂整队的节奏', 'Move one mass, discover a collective rhythm'],
    intro: ['质量块通过弹簧互相影响。改质量、改刚度、试模态，再把两种配置放在同一个时刻比较：能量去了哪里，形状为什么会改变？', 'Masses influence each other through springs. Change mass or stiffness, excite modes, and compare configurations at the same elapsed time. Where does energy go, and why does the pattern change?'],
    begin: ['开始实验 ↓', 'Open the workbench ↓'], guide: ['认识耦合与模态 ↓', 'Read about coupling and modes ↓'],
    case: ['选择实验', 'Choose an experiment'], exercises: ['本实验的两项探索', 'Two explorations for this experiment'],
    step: ['推进 0.1 秒', 'Advance 0.1 s'], ten: ['推进 10 秒', 'Advance 10 s'], restart: ['从初始条件重开', 'Restart from initial conditions'], undo: ['撤销配置编辑', 'Undo edit'], redo: ['重做配置编辑', 'Redo edit'],
    motion: ['01 / 看一串点怎样运动', '01 / WATCH THE CHAIN'],
    diagramHint: ['横向是质量块编号，竖向是位移（m），并非真实二维弹簧几何。竖轴会自动缩放；当前为蓝色实线，对照为铜色虚线。', 'Horizontal position is site index; vertical position is displacement (m), not literal spring geometry. The vertical scale adjusts. Blue solid is current; copper dashed is reference.'],
    keys: ['点击圆点或下方按钮选择质量块。聚焦按钮后 ← → / Home / End 选择；Alt + ↑ / ↓ 把初始位移调大/小 0.05 m，越界时拒绝操作。', 'Select a circle or a site button. On a site button, ← → / Home / End select; Alt + ↑ / ↓ adjusts initial displacement by 0.05 m. Out-of-range changes are refused.'],
    ledgerHint: ['内部弹簧势能各半分到相邻质量块；奇数个点时左半多一颗。平衡误差 = 机械能 + 耗散 − 初始能量。这里没有外部驱动。', 'Internal spring potential is shared equally between neighbors; the left half has one more site in odd chains. Balance error = mechanical + dissipated − initial energy. There is no external drive.'],
    editor: ['02 / 编辑初始条件', '02 / EDIT INITIAL CONDITIONS'], selected: ['当前质量块', 'Selected mass'],
    mass: ['质量 m（0.25–4 kg）', 'Mass m (0.25–4 kg)'], damping: ['阻尼率 γ（0–1 s⁻¹）', 'Damping rate γ (0–1 s⁻¹)'],
    q: ['初始位移（−1 至 1 m）', 'Initial displacement (−1 to 1 m)'], v: ['初始速度（−2 至 2 m/s）', 'Initial velocity (−2 to 2 m/s)'],
    left: ['左端边界', 'Left boundary'], right: ['右端边界', 'Right boundary'],
    springHint: ['S0 与 SN 连接端点和墙；内部 S1…S(N−1) 连接相邻点。自由端的端部刚度不参与计算，但保留你的原始输入。', 'S0 and SN connect the ends to walls; internal S1…S(N−1) connect neighbors. A free end ignores its end stiffness while retaining your raw input.'],
    draftHint: ['物理参数编辑会暂停并重开当前轨迹。未完成的数值输入原样保存，补全后才运行；笔记和语言切换不重开轨迹。', 'Physical edits pause and restart this trace. Unfinished numeric inputs save literally and must be completed before running. Notes and language changes keep the trace.'],
    modes: ['03 / 选一种集体节奏', '03 / CHOOSE A COLLECTIVE MODE'],
    modeHint: ['频率是无阻尼固有频率。形状把最大绝对幅度定为 1，供激发时缩放；表内能量按质量归一的模态投影计算。零频率表示自由平移。', 'Frequencies are undamped natural frequencies. Shapes have a largest absolute amplitude of 1 for excitation. Mode energies use mass-normalized projections. Zero frequency represents free translation.'],
    mode: ['选择模态', 'Select a mode'], amplitude: ['激发幅度（0–1；位移 m / 速度 m/s）', 'Excitation amplitude (0–1; m or m/s)'],
    displace: ['用位移激发', 'Excite displacement'], velocity: ['用速度激发', 'Excite velocity'], add: ['叠加位移模态', 'Add displacement mode'],
    trace: ['04 / 追踪同一个点', '04 / FOLLOW ONE SITE'], traceHint: ['跟踪选中的质量块。横轴是经过时间（秒），竖轴是位移（m）；换点不改初始条件。轨迹每 0.05 秒留样，最多 60 秒。', 'Track the selected site. Horizontal is elapsed seconds; vertical is displacement (m). Selecting a site keeps initial conditions. Samples are 0.05 s apart, up to 60 s.'],
    legend: ['实线：当前配置 · 虚线：保存的对照', 'Solid: current configuration · Dashed: kept comparison'],
    energyTrace: ['能量图（J）：蓝色实线为当前机械能，灰线为机械能加耗散，铜色虚线为对照机械能。', 'Energy (J): blue is current mechanical energy; gray is mechanical plus dissipated; copper dashed is reference mechanical energy.'],
    compare: ['05 / 留一份配置，再比较', '05 / KEEP A CONFIGURATION AND COMPARE'],
    compareHint: ['每案可留一份完整初始配置与笔记。对照会从 t=0 计算到当前经过时间；不是把不同时刻的截图放在一起。撤销保留本次实验访问的 30 次配置编辑，物理配置恢复后重开轨迹。', 'Keep one full initial configuration and note per case. Reference motion is computed from t=0 to the current elapsed time. Undo keeps 30 edits in this case visit; restoring physical settings restarts the trace.'],
    checkpoint: ['保存或替换对照', 'Keep or replace comparison'], restoreCheckpoint: ['取回对照配置', 'Retrieve comparison'],
    note: ['实验笔记（最多 1000 字符）', 'Experiment notes (up to 1,000 characters)'],
    saveHint: ['八份配置、对照和笔记保存在本浏览器。运行轨迹只留在本次访问，刷新即清空；换实验会暂停并保留本次轨迹。JSON 只备份配置与笔记（导入上限 256 kB），TXT 保存当前状态，CSV 保存当前轨迹。导入后可恢复原配置与轨迹，直到编辑、运行或刷新。', 'All eight configurations, comparisons and notes save in this browser. Traces last for this visit and clear on reload; changing cases pauses and keeps their traces. JSON backs up configurations and notes only (256 kB import limit). TXT exports the current state; CSV exports this trace. Recover pre-import configurations and traces until an edit, run, or reload.'],
    text: ['导出状态 TXT', 'Export state TXT'], csv: ['导出轨迹 CSV', 'Export trace CSV'], backup: ['备份配置 JSON', 'Back up configurations JSON'], import: ['导入完整配置', 'Import configurations'], recover: ['恢复导入前的数据', 'Recover pre-import work'],
    footer: ['弹簧合奏 · 看见理想模型的集体运动。', 'Spring Ensemble · Explore collective motion in an ideal model.'],
  };
  const node = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
  const svgNode = (tag, attributes, text) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attributes)) e.setAttribute(k, v); if (text !== undefined) e.textContent = text; return e; };
  const f = value => Math.abs(value) < 1e-10 ? '0' : Number(value.toPrecision(5)).toString();
  const key = 'imp-024-spring-ensemble-v1';
  let data = C.fresh(), storedOK = true, invalidStored = false, feedback = null;
  try { const text = localStorage.getItem(key); if (text) { const restored = C.restore(JSON.parse(text)); if (restored) data = restored; else invalidStored = true; } } catch { storedOK = false; }
  const entry = () => data.entries[data.active], source = () => C.caseFor(data.active);
  let runs = new Map(), modeCache = new Map(), undo = [], redo = [], group = null, playing = false, composing = false, revision = 0, request = 0, recovery = null;
  function save(keepRecovery = false) { revision++; if (!keepRecovery) recovery = null; try { localStorage.setItem(key, JSON.stringify(data)); storedOK = true; invalidStored = false; } catch { storedOK = false; } renderStorage(); }
  function renderStorage() { $('storage').textContent = invalidStored ? P(['旧数据不完整，尚未覆盖。可导入有效备份。', 'Stored data is incomplete and has not been overwritten. You can import a valid backup.']) : storedOK ? P(['配置已保存在本浏览器；轨迹尚未写入备份。', 'Configurations saved in this browser; traces are not in the backup.']) : P(['浏览器存储不可用，请下载配置与轨迹。', 'Browser storage is unavailable. Download configurations and traces.']); $('recover').hidden = !recovery; }
  function modesFor(model) { const s = C.compile(model), hash = JSON.stringify([model.m, model.k, model.left, model.right]); if (!modeCache.has(hash)) { if (modeCache.size > 50) modeCache.clear(); modeCache.set(hash, C.modes(s)); } return modeCache.get(hash); }
  function point(r) { return {...r.state, q: [...r.state.q], v: [...r.state.v], energy: C.energy(r.system, r.state.q, r.state.v).total, reference: r.refState ? [...r.refState.q] : null, referenceEnergy: r.refState ? C.energy(r.refSystem, r.refState.q, r.refState.v).total : null}; }
  function alignReference(r) {
    const kept = entry().checkpoint; r.refSystem = kept ? C.compile(kept.model) : null; r.refState = r.refSystem?.valid ? C.initial(r.refSystem) : null;
    if (r.refState) {
      for (const p of r.history) { r.refState = C.advance(r.refSystem, r.refState, p.ticks - r.refState.ticks); p.reference = [...r.refState.q]; p.referenceEnergy = C.energy(r.refSystem, r.refState.q, r.refState.v).total; }
      r.refState = C.advance(r.refSystem, r.refState, r.state.ticks - r.refState.ticks);
    } else for (const p of r.history) { p.reference = null; p.referenceEnergy = null; }
  }
  function run() {
    if (runs.has(data.active)) return runs.get(data.active);
    const system = C.compile(entry().model); if (!system.valid) return null;
    const r = {system, state: C.initial(system), history: [], refState: null, refSystem: null};
    r.history.push(point(r)); alignReference(r); runs.set(data.active, r); return r;
  }
  function resetRun() { playing = false; runs.delete(data.active); run(); }
  function remember() { undo.push(C.copy(entry())); if (undo.length > 30) undo.shift(); redo = []; }
  function afterChange(before) {
    if (JSON.stringify(before.model) !== JSON.stringify(entry().model)) resetRun();
    else if (JSON.stringify(before.checkpoint) !== JSON.stringify(entry().checkpoint)) { const r = run(); if (r) alignReference(r); }
    save();
  }
  function change(action, message) { const before = C.copy(entry()); remember(); group = null; action(); feedback = message || ['已更新配置；物理参数改变后从初始条件重开。', 'Configuration updated; physical edits restart from initial conditions.']; afterChange(before); render(); }
  function advance(count) {
    const r = run(); if (!r) return;
    const finish = Math.min(C.maxTicks, r.state.ticks + count);
    while (r.state.ticks < finish) {
      const n = Math.min(finish - r.state.ticks, 12 - r.state.ticks % 12);
      r.state = C.advance(r.system, r.state, n); if (r.refState) r.refState = C.advance(r.refSystem, r.refState, n);
      if (r.state.ticks % 12 === 0) r.history.push(point(r));
    }
    revision++; recovery = null;
    if (r.state.ticks === C.maxTicks) { playing = false; feedback = ['已到 60 秒。可导出轨迹或重开。', 'Reached 60 seconds. Export the trace or restart.']; }
  }
  function chooseSite(selected, focus) {
    if (selected < 0 || selected >= source().m.length) return;
    entry().selected = selected; group = null; save(true); renderEditor(); renderDynamics(); if (focus) $('site' + selected)?.focus();
  }
  function option(select, value, text) { const o = node('option', text); o.value = value; select.append(o); }
  function renderEditor() {
    const e = entry(), m = e.model, i = e.selected;
    $('selected').replaceChildren(); m.m.forEach((_, j) => option($('selected'), j, 'M' + (j + 1))); $('selected').value = i;
    for (const [id, values] of Object.entries({mass: m.m, q: m.q, v: m.v})) $(id).value = values[i];
    $('springLeft').value = m.k[i]; $('springRight').value = m.k[i + 1]; $('damping').value = m.damping; $('amplitude').value = e.amplitude;
    $('springLeftLabel').textContent = 'S' + i + P([' 刚度（0.25–16 N/m）', ' stiffness (0.25–16 N/m)']);
    $('springRightLabel').textContent = 'S' + (i + 1) + P([' 刚度（0.25–16 N/m）', ' stiffness (0.25–16 N/m)']);
    $('springLeft').disabled = i === 0 && m.left === 'free'; $('springRight').disabled = i === m.m.length - 1 && m.right === 'free';
    for (const side of ['left', 'right']) { $(side).replaceChildren(); option($(side), 'fixed', P(['接墙', 'Attached to wall'])); option($(side), 'free', P(['自由端', 'Free end'])); $(side).value = m[side]; }
    if (!composing) $('note').value = e.note;
    $('sites').replaceChildren(); m.m.forEach((_, j) => { const b = node('button', 'M' + (j + 1)); b.id = 'site' + j; b.setAttribute('aria-pressed', String(i === j)); b.tabIndex = i === j ? 0 : -1; b.onclick = () => chooseSite(j, true);
      b.onkeydown = event => {
        if (event.altKey && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
          event.preventDefault(); const q = C.numeric(entry().model.q[j], -1, 1), value = q === null ? null : Math.round((q + (event.key === 'ArrowUp' ? 0.05 : -0.05)) * 1e5) / 1e5;
          if (value === null || Math.abs(value) > 1) { feedback = ['初始位移需有效且不超出 −1 至 1 m。', 'Initial displacement must be valid and within −1 to 1 m.']; renderFeedback(); return; }
          change(() => { entry().model.q[j] = String(value); }); return;
        }
        const next = {ArrowLeft: j - 1, ArrowRight: j + 1, Home: 0, End: m.m.length - 1}[event.key]; if (next !== undefined) { event.preventDefault(); chooseSite(next, true); }
      }; $('sites').append(b); });
    renderModeSelector();
  }
  function renderModeSelector() { const list = modesFor(entry().model); $('mode').replaceChildren(); for (let i = 0; i < source().m.length; i++) option($('mode'), i, P(['模态 ', 'Mode ']) + (i + 1) + (list[i] ? ' · ' + f(list[i].frequency) + ' Hz' : ' · —')); $('mode').value = entry().mode; }
  function renderErrors() {
    const s = C.compile(entry().model), i = entry().selected, names = {m: P(['质量 M', 'Mass M']), k: P(['刚度 S', 'Stiffness S']), q: P(['初始位移 M', 'Initial displacement M']), v: P(['初始速度 M', 'Initial velocity M'])};
    $('errors').textContent = s.errors.length ? P(['待补全：', 'Complete these inputs: ']) + s.errors.map(e => e === 'damping' ? P(labels.damping) : names[e[0]] + (Number(e.slice(1)) + (e[0] === 'k' ? 0 : 1))).join(', ') : '';
    for (const [id, token] of [['mass', 'm' + i], ['q', 'q' + i], ['v', 'v' + i], ['springLeft', 'k' + i], ['springRight', 'k' + (i + 1)], ['damping', 'damping']]) $(id).setAttribute('aria-invalid', String(s.errors.includes(token)));
    const bad = C.numeric(entry().amplitude, 0, 1) === null; $('amplitude').setAttribute('aria-invalid', String(bad)); if (bad) $('errors').textContent += P([' 激发幅度需为 0–1。', ' Excitation amplitude must be from 0 to 1.']);
    for (const id of ['displace', 'velocity', 'add']) $(id).disabled = bad || !s.systemValid || id === 'add' && s.q.some(q => q === null);
  }
  function setupSVG(svg, title) { const width = Math.max(280, svg.clientWidth || 600); svg.setAttribute('viewBox', '0 0 ' + width + ' 240'); svg.setAttribute('aria-label', title); svg.replaceChildren(); return width; }
  function drawChain(r) {
    const svg = $('chain'), w = setupSVG(svg, P(['当前与对照的位移图。数值同时列在下方表格。', 'Current and reference displacement diagram; values also appear in the table below.']));
    if (!r) { svg.append(svgNode('text', {x: 18, y: 120}, P(['补全输入后显示运动。', 'Complete inputs to display motion.']))); return; }
    const n = r.system.n, q = r.state.q, ref = r.refState?.q, scale = Math.max(0.2, ...q.map(Math.abs), ...(ref || []).map(Math.abs));
    const x = i => 38 + (w - 76) * (i + 1) / (n + 1), y = v => 120 - v / scale * 84;
    svg.append(svgNode('line', {x1: 30, x2: w - 15, y1: 120, y2: 120, stroke: '#bbc9d5'}));
    svg.append(svgNode('text', {x: 4, y: 25}, f(scale) + ' m'), svgNode('text', {x: 4, y: 220}, f(-scale)));
    const line = (values, cls, model) => { const pts = values.map((v, i) => [x(i), y(v)]); if (model.left === 'fixed') pts.unshift([30, 120]); if (model.right === 'fixed') pts.push([w - 16, 120]); svg.append(svgNode('polyline', {points: pts.map(p => p.join(',')).join(' '), class: cls})); };
    if (ref) line(ref, 'reference', entry().checkpoint.model); line(q, 'current', entry().model);
    q.forEach((v, i) => { const dot = svgNode('circle', {cx: x(i), cy: y(v), r: 7 + Math.sqrt(r.system.m[i]) * 2, fill: i === entry().selected ? '#a56c28' : '#315d86', stroke: '#fffdf7', 'stroke-width': 2}); dot.onclick = () => chooseSite(i, true); svg.append(dot, svgNode('text', {x: x(i), y: 235, 'text-anchor': 'middle'}, 'M' + (i + 1))); });
  }
  function drawPlot(id, history, accessor, reference, title, nonnegative, extra) {
    const svg = $(id), w = setupSVG(svg, title); if (!history.length) return;
    const all = history.flatMap(p => [accessor(p), reference(p), extra ? extra(p) : null]).filter(v => v !== null), peak = Math.max(0.1, ...all.map(Math.abs));
    const maxT = Math.max(1, history.at(-1).ticks * C.h), x = ticks => 55 + (w - 70) * (ticks * C.h / maxT), y = v => nonnegative ? 206 - v / peak * 175 : 120 - v / peak * 83;
    svg.append(svgNode('line', {x1: 55, x2: w - 15, y1: y(0), y2: y(0), stroke: '#b8c7d4'}));
    for (const value of nonnegative ? [0, peak] : [-peak, 0, peak]) svg.append(svgNode('text', {x: 3, y: y(value) + 5}, f(value)));
    svg.append(svgNode('text', {x: 55, y: 234}, '0 s'), svgNode('text', {x: w - 15, y: 234, 'text-anchor': 'end'}, f(maxT) + ' s'));
    for (const [fn, cls, stroke] of [[accessor, 'current', null], [reference, 'reference', null], ...(extra ? [[extra, '', '#74828f']] : [])]) {
      const points = history.filter(p => fn(p) !== null).map(p => x(p.ticks) + ',' + y(fn(p))).join(' '); if (points) svg.append(svgNode('polyline', {points, class: cls, fill: 'none', ...(stroke ? {stroke, 'stroke-width': 1.5} : {})}));
    }
  }
  function renderDynamics() {
    const r = run(), list = modesFor(entry().model), energies = r ? C.modalEnergy(r.system, r.state, list) : [], e = r ? C.energy(r.system, r.state.q, r.state.v) : null;
    $('play').textContent = P(playing ? ['暂停', 'Pause'] : ['运行 / 继续', 'Run / resume']); $('play').setAttribute('aria-pressed', String(playing));
    for (const id of ['play', 'step', 'ten']) $(id).disabled = !r || r.state.ticks >= C.maxTicks;
    $('csv').disabled = !r; $('clock').textContent = P(['经过时间：', 'Elapsed time: ']) + f(r ? r.state.ticks * C.h : 0) + ' / 60 s';
    $('ledger').textContent = e ? P([`动能 ${f(e.kinetic)} J · 势能 ${f(e.potential)} J\n机械能 ${f(e.total)} J · 耗散 ${f(r.state.dissipated)} J\n平衡误差 ${f(e.total + r.state.dissipated - r.state.initialEnergy)} J\n左半 ${f(e.left)} J · 右半 ${f(e.right)} J\n质心位移 ${f(e.center)} m · 总动量 ${f(e.momentum)} kg·m/s`,
      `Kinetic ${f(e.kinetic)} J · Potential ${f(e.potential)} J\nMechanical ${f(e.total)} J · Dissipated ${f(r.state.dissipated)} J\nBalance error ${f(e.total + r.state.dissipated - r.state.initialEnergy)} J\nLeft half ${f(e.left)} J · Right half ${f(e.right)} J\nCenter displacement ${f(e.center)} m · Momentum ${f(e.momentum)} kg·m/s`]) : P(['输入尚未完成，没有可计算的运动。', 'Inputs are incomplete; motion cannot yet be calculated.']);
    const mode = list[entry().mode]; $('modeShape').textContent = mode ? P(['所选模态相对形状：', 'Selected relative shape: ']) + mode.shape.map((v, i) => 'M' + (i + 1) + ': ' + f(v)).join(' · ') : P(['质量与刚度补全后可求模态。', 'Complete mass and stiffness to solve modes.']);
    $('modeBody').replaceChildren(); list.forEach((m, i) => { const tr = node('tr'); tr.setAttribute('aria-selected', String(i === entry().mode)); for (const text of [i + 1, f(m.frequency), m.frequency === 0 ? '∞' : f(1 / m.frequency), r ? f(energies[i]) : '—']) tr.append(node('td', text)); $('modeBody').append(tr); });
    $('stateBody').replaceChildren(); for (let i = 0; i < source().m.length; i++) { const tr = node('tr'); for (const text of ['M' + (i + 1), r ? f(r.state.q[i]) : '—', r ? f(r.state.v[i]) : '—', r?.refState ? f(r.refState.q[i]) : '—', r?.refState ? f(r.state.q[i] - r.refState.q[i]) : '—']) tr.append(node('td', text)); $('stateBody').append(tr); }
    const history = r ? historyForExport(r) : []; drawChain(r);
    drawPlot('trace', history, p => p.q[entry().selected], p => p.reference ? p.reference[entry().selected] : null, P(['所选质量块的位移轨迹', 'Displacement trace of the selected mass']), false);
    drawPlot('energyTrace', history, p => p.energy, p => p.referenceEnergy, P(['机械能、耗散和对照能量', 'Mechanical energy, dissipation, and reference energy']), true, p => p.energy + p.dissipated);
    renderFeedback(); renderStorage();
  }
  function historyForExport(r) { return r.history.at(-1).ticks === r.state.ticks ? r.history : [...r.history, point(r)]; }
  function renderComparison() {
    const kept = entry().checkpoint; $('restoreCheckpoint').disabled = !kept;
    if (!kept) { $('comparison').textContent = P(['还没有对照配置。先留一份，再改一项参数。', 'No comparison kept yet. Keep one, then change a parameter.']); return; }
    const changes = [], m = entry().model;
    const fields = {m: ['质量 M', 'Mass M'], k: ['刚度 S', 'Stiffness S'], q: ['初始位移 M', 'Initial displacement M'], v: ['初始速度 M', 'Initial velocity M']};
    for (const key of ['m', 'k', 'q', 'v']) m[key].forEach((v, i) => { if (v !== kept.model[key][i]) changes.push(P(fields[key]) + (i + (key === 'k' ? 0 : 1)) + ': ' + kept.model[key][i] + ' → ' + v); });
    for (const key of ['left', 'right', 'damping']) if (m[key] !== kept.model[key]) {
      const value = text => key === 'damping' ? text : P(text === 'fixed' ? ['接墙', 'Attached to wall'] : ['自由端', 'Free end']);
      changes.push(P(labels[key]) + ': ' + value(kept.model[key]) + ' → ' + value(m[key]));
    }
    if (entry().note !== kept.note) changes.push(P(['笔记（对照 → 当前）：', 'Notes (kept → current): ']) + kept.note + ' → ' + entry().note);
    $('comparison').textContent = (C.compile(kept.model).valid ? P(['对照会与当前运行对齐到相同经过时间。', 'Reference is aligned to the current elapsed time.']) : P(['对照输入未完成，仍保留原稿，但不能计算曲线。', 'Reference inputs are incomplete. Its draft is kept, but its curve cannot be calculated.'])) + '\n' + (changes.join('\n') || P(['配置与笔记尚无差别。', 'No configuration or note differences yet.']));
  }
  function renderFeedback() { $('status').textContent = feedback ? P(feedback) : ''; }
  function headerRow(id, labels) { const row = node('tr'); labels.forEach(pair => row.append(node('th', P(pair)))); $(id).replaceChildren(row); }
  function render() {
    const focused = document.activeElement?.id;
    document.querySelectorAll('[data-i]').forEach(e => { e.textContent = P(labels[e.dataset.i]); });
    $('case').replaceChildren(); C.cases.forEach(s => option($('case'), s.id, P(s.name))); $('case').value = data.active; $('caseTitle').textContent = P(source().name); $('lead').textContent = P(source().lead); $('prompts').replaceChildren(...source().prompts.map(pair => node('li', P(pair))));
    headerRow('modeHead', [['模态', 'Mode'], ['频率 Hz', 'Frequency Hz'], ['周期 s', 'Period s'], ['当前能量 J', 'Current energy J']]);
    headerRow('stateHead', [['点', 'Site'], ['当前 q / m', 'Current q / m'], ['当前 v / m/s', 'Current v / m/s'], ['对照 q / m', 'Reference q / m'], ['位移差 / m', 'Difference / m']]);
    $('undo').disabled = !undo.length; $('redo').disabled = !redo.length;
    renderEditor(); renderErrors(); renderComparison(); renderDynamics(); if (focused) $(focused)?.focus({preventScroll: true});
  }
  function bind(id, getter, setter, max) {
    const el = $(id); el.addEventListener('focus', () => { group = null; }); el.addEventListener('blur', () => { group = null; });
    const input = () => {
      if (composing) return; let value = el.value; if (max) { value = [...value].slice(0, max).join(''); el.value = value; } if (getter() === value) return;
      const before = C.copy(entry()); if (group !== id) { remember(); group = id; } setter(value); afterChange(before);
      feedback = id === 'note' || id === 'amplitude' ? null : ['物理参数已改变，运行从初始条件重开。', 'Physical settings changed; the run restarts from initial conditions.'];
      $('undo').disabled = !undo.length; $('redo').disabled = !redo.length; renderModeSelector(); renderErrors(); renderComparison(); renderDynamics();
    }; el.addEventListener('input', input);
    if (id === 'note') { el.addEventListener('compositionstart', () => { composing = true; revision++; }); el.addEventListener('compositionend', () => { composing = false; input(); }); }
  }
  for (const [id, key] of [['mass', 'm'], ['q', 'q'], ['v', 'v']]) bind(id, () => entry().model[key][entry().selected], v => { entry().model[key][entry().selected] = v; });
  for (const [id, offset] of [['springLeft', 0], ['springRight', 1]]) bind(id, () => entry().model.k[entry().selected + offset], v => { entry().model.k[entry().selected + offset] = v; });
  bind('damping', () => entry().model.damping, v => { entry().model.damping = v; }); bind('note', () => entry().note, v => { entry().note = v; }, 1000); bind('amplitude', () => entry().amplitude, v => { entry().amplitude = v; });
  for (const side of ['left', 'right']) $(side).onchange = () => change(() => { entry().model[side] = $(side).value; });
  $('selected').onchange = () => chooseSite(Number($('selected').value)); $('mode').onchange = () => { entry().mode = Number($('mode').value); group = null; save(true); renderDynamics(); };
  $('case').onchange = () => { playing = false; data.active = $('case').value; undo = []; redo = []; group = null; feedback = null; save(true); render(); };
  for (const [id, kind] of [['displace', 'displace'], ['velocity', 'velocity'], ['add', 'add']]) $(id).onclick = () => {
    const model = C.excite(entry().model, modesFor(entry().model)[entry().mode], C.numeric(entry().amplitude, 0, 1), kind);
    if (!model) { feedback = ['叠加后的位移超出范围，或输入未完成；原稿未改动。', 'The addition exceeds the displacement range, or inputs are incomplete; your draft is unchanged.']; renderFeedback(); return; }
    change(() => { entry().model = model; });
  };
  $('play').onclick = () => { if (!run()) return; playing = !playing; revision++; recovery = null; feedback = playing ? ['正在运行；可暂停后查看精确数值。', 'Running. Pause to inspect exact values.'] : ['已暂停。', 'Paused.']; lastFrame = null; renderDynamics(); };
  for (const [id, ticks] of [['step', 24], ['ten', 2400]]) $(id).onclick = () => { playing = false; advance(ticks); feedback = ['已推进。轨迹可导出 CSV。', 'Advanced. Export the trace as CSV.']; renderDynamics(); };
  $('restart').onclick = () => { resetRun(); revision++; recovery = null; feedback = ['已按当前初始条件重开。', 'Restarted from the current initial conditions.']; renderDynamics(); };
  $('checkpoint').onclick = () => change(() => { entry().checkpoint = {model: C.copy(entry().model), note: entry().note}; }, ['对照已保存，并与当前时刻对齐。', 'Comparison kept and aligned to the current time.']);
  $('restoreCheckpoint').onclick = () => { if (entry().checkpoint) change(() => { entry().model = C.copy(entry().checkpoint.model); entry().note = entry().checkpoint.note; }, ['已取回对照配置；可以撤销。', 'Comparison retrieved; Undo is available.']); };
  function history(from, to) { if (!from.length) return; const before = C.copy(entry()); to.push(before); data.entries[data.active] = from.pop(); group = null; afterChange(before); feedback = ['已恢复配置编辑。', 'Configuration edit restored.']; render(); }
  $('undo').onclick = () => history(undo, redo); $('redo').onclick = () => history(redo, undo);
  function download(filename, text, type) { const url = URL.createObjectURL(new Blob([text], {type})), a = node('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); feedback = ['已下载文件。', 'File downloaded.']; renderFeedback(); }
  $('backup').onclick = () => download('024-spring-ensemble.json', JSON.stringify(data, null, 2), 'application/json');
  $('csv').onclick = () => { const r = run(); if (r) { playing = false; download('024-' + data.active + '-trace.csv', C.csv(historyForExport(r), r.system.n), 'text/csv;charset=utf-8'); renderDynamics(); } };
  $('text').onclick = () => { const r = run(), lines = ['024 · ' + P(['弹簧合奏', 'Spring Ensemble']), P(source().name), P(['初始配置：', 'Initial configuration: ']), JSON.stringify(entry().model, null, 2), '', $('clock').textContent, $('ledger').textContent, '', P(['当前位移 / 速度：', 'Current displacement / velocity: '])];
    if (r) r.state.q.forEach((q, i) => lines.push('M' + (i + 1) + ': ' + q + ' m / ' + r.state.v[i] + ' m/s'));
    lines.push('', P(['无阻尼固有频率 Hz：', 'Undamped natural frequencies Hz: ']), modesFor(entry().model).map(m => m.frequency).join(', '), '', P(['笔记：', 'Notes: ']), entry().note); download('024-' + data.active + '.txt', lines.join('\n'), 'text/plain;charset=utf-8'); };
  $('import').onclick = () => { playing = false; $('file').value = ''; $('file').click(); renderDynamics(); };
  $('file').onchange = async () => {
    const file = $('file').files[0]; if (!file) return; playing = false; const ticket = ++request, started = revision;
    try {
      if (file.size > C.maxBackup) throw new Error('size'); const text = await file.text();
      if (ticket !== request || started !== revision || composing) { feedback = ['读取期间有新操作，本次导入已取消。', 'Work changed while reading; this import was cancelled.']; renderFeedback(); return; }
      const restored = C.restore(JSON.parse(text)); if (!restored) throw new Error('shape');
      recovery = {data: C.copy(data), runs}; data = restored; runs = new Map(); undo = []; redo = []; group = null; feedback = ['配置已导入。编辑或运行前可恢复导入前的数据。', 'Configurations imported. Recover pre-import work before an edit or run.']; save(true); render();
    } catch { if (ticket === request) { feedback = ['文件无效或超过 256 kB，原数据未改动。', 'File invalid or over 256 kB; existing data is unchanged.']; renderFeedback(); } }
  };
  $('recover').onclick = () => { if (!recovery) return; playing = false; data = recovery.data; runs = recovery.runs; recovery = null; undo = []; redo = []; group = null; feedback = ['已恢复导入前的配置与本次轨迹。', 'Pre-import configurations and visit traces recovered.']; save(true); render(); };
  let lastFrame = null, accumulator = 0, lastPaint = 0;
  function frame(time) {
    if (playing) { if (lastFrame !== null) accumulator += Math.min((time - lastFrame) / 1000, 1 / 15); const ticks = Math.floor(accumulator / C.h); if (ticks) { accumulator -= ticks * C.h; advance(ticks); } if (time - lastPaint >= 32) { renderDynamics(); lastPaint = time; } }
    else accumulator = 0;
    lastFrame = time; requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) { playing = false; lastFrame = null; renderDynamics(); } });
  window.addEventListener('programlanguagechange', render); window.addEventListener('resize', () => renderDynamics());
  render(); requestAnimationFrame(frame);
})();
