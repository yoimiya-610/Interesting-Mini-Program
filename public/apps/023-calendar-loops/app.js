'use strict';
(() => {
  const C = CalendarLoops, $ = id => document.getElementById(id);
  const P = pair => pair[ProgramLanguage.language === 'en' ? 1 : 0];
  const labels = {
    eyebrow: ['八份计划 · 六十四个起点', 'EIGHT PLANS · SIXTY-FOUR STARTING POINTS'],
    headline: ['把重复的事，安排得刚刚好', 'Make room for the things that return'],
    intro: ['从一条“每隔几天”开始，看事项怎样铺进日历。为某一次改期、完成或跳过，再比较两种安排，找到自己的节奏。', 'Start with “every few days” and watch a rule fill the calendar. Move, complete, or skip a single occurrence, then compare arrangements to find your own rhythm.'],
    begin: ['打开日历 ↓', 'Open the calendar ↓'], guide: ['规则为什么这样展开？ ↓', 'How do the rules unfold? ↓'],
    plan: ['选择一份计划', 'Choose a plan'], exercises: ['本计划的两项练习', 'Two exercises for this plan'],
    samples: ['八份示例各有八个事项。所有规则和耗时都可编辑；示例是规划起点，不是必须遵守的周期。', 'Each example has eight tasks. Edit every rule and duration; these examples are planning starting points, not prescribed schedules.'],
    undo: ['撤销', 'Undo'], redo: ['重做', 'Redo'], calendar: ['01 / 六周日历', '01 / SIX-WEEK CALENDAR'],
    previous: ['← 上月', '← Prev'], next: ['下月 →', 'Next →'], month: ['查看月份', 'View month'],
    calendarHint: ['点击日期查看事项。聚焦日期后用方向键移动（↑↓ 一周），Home/End 到本周首尾。格内显示待做与完成的总分钟；跳过的不计入。橙色表示超过额度，? 表示含未知耗时。', 'Select a date to see its occurrences. Arrow keys move between dates (↑↓ one week); Home/End reach the week’s edges. Cells total planned and completed minutes, excluding skips. Orange means over allowance; ? includes unknown durations.'],
    records: ['查找已保存的日期记录', 'Find a saved dated mark'],
    recordsHint: ['导航包含本计划全部记录，能找回移到其他月份的事项。修改或停用规则不会删除日期记录；每份计划最多 1024 条。', 'The navigator includes every mark in this plan, including moves to other months. Editing or disabling a rule keeps dated marks. Each plan allows 1,024 marks.'],
    rules: ['02 / 编辑重复规则', '02 / EDIT A REPEAT RULE'], task: ['选择事项', 'Choose a task'], enabled: ['展开这条规则', 'Generate this rule'],
    name: ['事项名称（最多 80 字符）', 'Task name (up to 80 characters)'], defaultName: ['恢复示例名称', 'Use the example name'],
    start: ['开始日期（含当天）', 'Start date (inclusive)'], end: ['结束日期（可留空，含当天）', 'End date (optional, inclusive)'],
    kind: ['重复方式', 'Repeat by'], every: ['每隔（天 1–60；周/月 1–12）', 'Every (days 1–60; weeks/months 1–12)'],
    minutes: ['每次分钟数（0–240）', 'Minutes per occurrence (0–240)'], weekdays: ['在这些星期几发生', 'On these weekdays'],
    date: ['每月几日（1–31）', 'Day of month (1–31)'], missing: ['该月没有这个日期时', 'When that date is missing'],
    ruleHint: ['日期格式 YYYY-MM-DD，范围 1900–2100。按天从开始日计算；按周从开始日所在周的周一计算；按月从开始月计算。规则输入未完成时原样保留，补全前不展开新事项。', 'Use YYYY-MM-DD within 1900–2100. Day intervals start at the start date; week intervals at the Monday of that week; month intervals at the start month. Incomplete rule inputs stay exactly as typed and generate no new occurrences until valid.'],
    capacity: ['每天参考额度（0–1440 分钟）', 'Daily allowance (0–1440 minutes)'],
    capacityHint: ['同一计划每天使用相同额度。已完成仍占当天总量，剩余分钟另计。未知耗时不会当作零。', 'One allowance applies to every day in this plan. Completed work stays in the total; remaining minutes are separate. Unknown durations are not treated as zero.'],
    comparison: ['03 / 留一份安排，再比较', '03 / KEEP AN ARRANGEMENT AND COMPARE'],
    compareHint: ['每份计划保存一份完整对照；两版都在当前六周窗口比较。包括规则、日期记录、额度与备注。撤销保留本次访问的最近 30 次编辑，换计划或刷新即清空。', 'Keep one full comparison per plan. Both versions are compared within the same visible six-week window, including rules, dated marks, allowance, and notes. Undo keeps 30 edits in this plan visit and clears on plan change or reload.'],
    checkpoint: ['保存或替换对照版', 'Keep or replace comparison'], restoreCheckpoint: ['取回对照版', 'Retrieve comparison'],
    note: ['计划备注（最多 1000 字符）', 'Plan notes (up to 1,000 characters)'],
    saveHint: ['八份计划分别保存在本浏览器；每份最多 1024 条日期记录、一份对照。JSON 备份全部计划，导入上限 3 MB。可找回导入前的数据，直到编辑或刷新。', 'All eight plans save separately in this browser, with up to 1,024 dated marks and one comparison each. JSON backs up everything; imports allow 3 MB. Recover pre-import work until an edit or reload.'],
    text: ['导出窗口 TXT', 'Export window TXT'], csv: ['导出窗口 CSV', 'Export window CSV'], backup: ['备份全部 JSON', 'Back up all JSON'], import: ['导入完整备份', 'Import full backup'], recover: ['找回导入前的数据', 'Recover pre-import work'],
    exportHint: ['TXT / CSV 只包含当前六周窗口及备注，不是完整备份；CSV 对公式前缀作文本处理。清理浏览器、换设备或换地址前请下载 JSON。没有提醒通知或云同步。', 'TXT / CSV contain only this six-week window and notes, not a full backup. CSV formula prefixes are escaped as text. Download JSON before clearing the browser, changing device, or changing address. There are no notifications or cloud sync.'],
    footer: ['日历回环 · 只在日期上做计划，不替你规定生活。', 'Calendar Loops · Plan dates at your own pace.'],
  };
  const errors = {
    start: ['开始日期需为有效公历日期。', 'Enter a valid Gregorian start date.'],
    end: ['结束日期需有效，且不早于开始日期。', 'End date must be valid and on or after start.'],
    every: ['间隔需为范围内整数。', 'Interval must be a whole number in range.'],
    minutes: ['分钟数需为 0–240 整数。', 'Minutes must be a whole number from 0 to 240.'],
    days: ['至少选一个星期几。', 'Choose at least one weekday.'], day: ['月内日期需为 1–31 整数。', 'Day of month must be an integer from 1 to 31.'],
  };
  const kinds = {days: ['按天', 'Days'], weeks: ['按周', 'Weeks'], months: ['按月', 'Months']};
  const policies = {skip: ['跳过缺日月份', 'Skip months without that date'], last: ['移到该月末日', 'Use that month’s last day']};
  const states = {planned: ['待做', 'Planned'], done: ['完成', 'Done'], skip: ['跳过', 'Skipped']};
  const weekdays = [['一', 'Mon'], ['二', 'Tue'], ['三', 'Wed'], ['四', 'Thu'], ['五', 'Fri'], ['六', 'Sat'], ['日', 'Sun']];
  const node = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
  const now = new Date(), localDate = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  const today = C.validDate(localDate) ? localDate : '2026-01-01';
  const key = 'imp-023-calendar-loops-v1';
  let data = C.fresh(today), storageOK = true, feedback = null, storedInvalid = false;
  try { const raw = localStorage.getItem(key); if (raw) { const restored = C.restore(JSON.parse(raw)); if (restored) data = restored; else storedInvalid = true; } }
  catch { storageOK = false; }
  const entry = () => data.entries[data.active], source = () => C.caseFor(data.active), model = () => entry().model;
  let undo = [], redo = [], group = null, composing = false, revision = 0, request = 0, recovery = null;
  const snapshot = () => C.copy({model: model(), checkpoint: entry().checkpoint});
  function remember() { undo.push(snapshot()); if (undo.length > 30) undo.shift(); redo = []; }
  function save(keepRecovery = false) {
    revision++; if (!keepRecovery) recovery = null;
    try { localStorage.setItem(key, JSON.stringify(data)); storageOK = true; storedInvalid = false; } catch { storageOK = false; }
    renderStorage();
  }
  function renderStorage() {
    $('storage').textContent = storedInvalid ? P(['保存的数据不完整，尚未覆盖。可导入有效备份。', 'Stored data is incomplete and has not been overwritten. You can import a valid backup.']) : storageOK ? P(['已保存在本浏览器。', 'Saved in this browser.']) : P(['浏览器存储不可用，请下载 JSON 备份。', 'Browser storage is unavailable. Download a JSON backup.']);
    $('recover').hidden = !recovery;
  }
  function change(action, message) { remember(); group = null; action(); feedback = message || ['已更新安排。', 'Arrangement updated.']; save(); render(); }
  function option(select, value, text) { const o = node('option', text); o.value = value; select.append(o); }
  const name = i => C.taskName(source(), model(), i, ProgramLanguage.language) || P(['未命名事项', 'Unnamed task']);
  function summaryText(items) {
    const s = C.daySummary(items, C.integer(model().capacity, 0, 1440));
    return P([`${s.count} 项 · ${s.total} 分钟${s.unknown ? ` + ${s.unknown} 项耗时待填` : ''} · 完成 ${s.done} · 剩余已知 ${s.remaining} 分钟${s.over ? ' · 超过额度' : ''}`,
      `${s.count} tasks · ${s.total} min${s.unknown ? ` + ${s.unknown} unknown durations` : ''} · ${s.done} done · ${s.remaining} known min remaining${s.over ? ' · Over allowance' : ''}`]);
  }
  function renderEditor() {
    const task = model().tasks[entry().task];
    $('task').replaceChildren(); model().tasks.forEach((t, i) => option($('task'), i, (i + 1) + ' · ' + name(i))); $('task').value = entry().task;
    $('purpose').textContent = P(source().tasks[entry().task].why);
    if (!composing) { $('name').value = name(entry().task); $('note').value = model().note; }
    $('enabled').checked = task.enabled;
    for (const id of ['start', 'end', 'every', 'minutes']) $(id).value = task[id];
    $('date').value = task.day; $('capacity').value = model().capacity;
    $('kind').replaceChildren(); for (const [value, pair] of Object.entries(kinds)) option($('kind'), value, P(pair)); $('kind').value = task.kind;
    $('policy').replaceChildren(); for (const [value, pair] of Object.entries(policies)) option($('policy'), value, P(pair)); $('policy').value = task.policy;
    $('weekdays').replaceChildren(); weekdays.forEach((pair, i) => { const l = node('label'), box = node('input'); box.type = 'checkbox'; box.id = 'weekday' + i; box.value = i; box.checked = task.days.includes(i); box.onchange = () => change(() => { task.days = box.checked ? [...task.days, i].sort() : task.days.filter(n => n !== i); }); l.append(box, node('span', P(pair))); $('weekdays').append(l); });
    renderRuleStatus();
  }
  function renderRuleStatus() {
    const task = model().tasks[entry().task], rule = C.compile(task);
    $('weekField').hidden = task.kind !== 'weeks'; $('monthField').hidden = task.kind !== 'months';
    $('ruleStatus').textContent = !task.enabled ? P(['规则已停用；已有日期记录仍保留。', 'Rule disabled; saved dated marks remain.']) : rule.valid ? P(['规则有效。开始前与结束后的日期不生成事项。', 'Rule valid. Dates before start and after end generate no occurrences.']) : rule.errors.map(id => P(errors[id])).join(' ');
    for (const id of ['start', 'end', 'every', 'minutes', 'date']) $(id).setAttribute('aria-invalid', String(rule.errors.includes(id === 'date' ? 'day' : id)));
    $('capacity').setAttribute('aria-invalid', String(C.integer(model().capacity, 0, 1440) === null));
  }
  function selectDay(day, focus = false) {
    if (!C.validDate(day)) return;
    entry().day = day; entry().month = day.slice(0, 7); group = null; save(true); renderCalendar();
    if (focus) $('calendar').querySelector(`[data-date="${day}"]`)?.focus();
  }
  function renderCalendar() {
    const e = entry(), view = C.windowItems(model(), e.month), capacity = C.integer(model().capacity, 0, 1440);
    $('month').value = e.month; $('previous').disabled = e.month === '1900-01'; $('next').disabled = e.month === '2100-12';
    $('weekLabels').replaceChildren(...weekdays.map(pair => node('span', P(pair))));
    $('calendar').replaceChildren();
    for (const date of view.dates) {
      const items = view.items.filter(item => item.date === date), s = C.daySummary(items, capacity), button = node('button');
      button.dataset.date = date; button.disabled = !C.validDate(date); button.tabIndex = date === e.day ? 0 : -1;
      button.setAttribute('aria-pressed', String(date === e.day)); button.setAttribute('aria-label', date + ' · ' + summaryText(items));
      button.className = (date.slice(0, 7) !== e.month ? 'outside ' : '') + (s.over ? 'over' : s.count ? 'busy' : '');
      button.append(node('span', String(Number(date.slice(8))), 'date-number'), node('span', s.count ? s.total + (s.unknown ? '?' : '') + P([' 分', 'm']) : '—'), node('span', items.length ? P([items.length + ' 次', items.length + '×']) : ''));
      button.onclick = () => selectDay(date, true);
      button.onkeydown = event => { const n = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -C.weekday(date), End: 6 - C.weekday(date)}[event.key]; if (n !== undefined) { event.preventDefault(); selectDay(C.addDays(date, n), true); } };
      $('calendar').append(button);
    }
    const invalid = view.invalid.map(item => name(item.task));
    $('monthSummary').textContent = view.dates[0] + ' → ' + view.dates.at(-1) + ' · ' + P([view.items.length + ' 次（含跳过）', view.items.length + ' occurrences (including skips)']) + (invalid.length ? P([' · 规则待补全：', ' · Incomplete rules: ']) + invalid.join(', ') : '') + (capacity === null ? P([' · 每天额度需为 0–1440 整数。', ' · Allowance must be an integer from 0 to 1440.']) : '');
    $('agendaTitle').textContent = e.day + P([' / 当天事项', ' / OCCURRENCES']);
    const daily = view.items.filter(item => item.date === e.day);
    $('daySummary').textContent = summaryText(daily); $('agenda').replaceChildren();
    if (!daily.length) $('agenda').append(node('p', P(['这一天没有事项。选择其他日期，或编辑重复规则。', 'No occurrences on this date. Choose another date or edit a repeat rule.'])));
    for (const item of daily) renderItem(item);
    $('records').replaceChildren(); option($('records'), '', P(['选择记录并跳到目标日期…', 'Choose a mark and jump to its date…']));
    Object.entries(model().records).sort((a, b) => a[1].target.localeCompare(b[1].target) || a[0].localeCompare(b[0])).forEach(([id, r]) => option($('records'), id, r.target + ' · ' + name(Number(id[0])) + ' · ' + P(states[r.state]) + ' · ' + id.slice(2) + ' → ' + r.target));
    renderComparison();
  }
  function renderItem(item) {
    const row = node('article', undefined, 'agenda-item ' + item.state); row.dataset.id = item.id;
    row.append(node('h4', name(item.task)), node('p', P(states[item.state]) + ' · ' + (item.minutes === null ? P(['耗时待填', 'Duration unknown']) : item.minutes + P([' 分钟', ' min'])) + ' · ' + P(['原日期 ', 'Original ']) + item.origin));
    if (item.retained) row.append(node('p', P(['保留记录：原日期已不符合当前规则，仍按这次记录显示。', 'Retained mark: the original date no longer matches the current rule. This dated mark stays visible.']), 'retained'));
    const actions = node('div', undefined, 'actions');
    for (const [state, pair] of [['done', ['完成 / 取消完成', 'Done / undo done']], ['skip', ['跳过 / 取消跳过', 'Skip / undo skip']]]) {
      const b = node('button', P(pair)); b.dataset.action = state; b.setAttribute('aria-pressed', String(item.state === state));
      b.onclick = () => updateMark(item, item.date, item.state === state ? 'planned' : state); actions.append(b);
    }
    if (item.saved) { const b = node('button', P(['重置这次记录', 'Reset this mark'])); b.dataset.action = 'reset'; b.onclick = () => change(() => { delete model().records[item.id]; }, ['已移除日期记录，将使用当前重复规则。', 'Dated mark removed; the current repeat rule now applies.']); actions.append(b); }
    row.append(actions);
    const move = node('div', undefined, 'move-row'), l = node('label'), input = node('input'), b = node('button', P(['改期这一次', 'Move this occurrence']));
    input.type = 'text'; input.maxLength = 10; input.placeholder = 'YYYY-MM-DD'; input.value = item.date; input.dataset.move = item.id;
    l.append(node('span', P(['目标日期', 'Target date'])), input); b.dataset.action = 'move'; b.onclick = () => updateMark(item, input.value, item.state);
    move.append(l, b); row.append(move); $('agenda').append(row);
  }
  function updateMark(item, target, state) {
    if (!C.validDate(target)) { feedback = ['目标日期需为 1900–2100 年的有效日期。', 'Target must be a valid date within 1900–2100.']; renderFeedback(); return; }
    if (!Object.hasOwn(model().records, item.id) && Object.keys(model().records).length >= 1024) { feedback = ['日期记录已达 1024 条。请先备份，再重置不需要的记录。', 'The 1,024-mark limit is reached. Back up your work, then reset unneeded marks.']; renderFeedback(); return; }
    change(() => { C.mark(model(), item.id, target, state); entry().day = target; entry().month = target.slice(0, 7); }, ['这一次已更新；其他重复日期不变。', 'This occurrence was updated; other repeat dates stay the same.']);
  }
  const itemText = (item, m) => !item ? P(['窗口内无此项', 'Absent from this window']) : C.taskName(source(), m, item.task, ProgramLanguage.language) + ' · ' + item.date + ' · ' + P(states[item.state]) + ' · ' + (item.minutes === null ? P(['耗时待填', 'Unknown duration']) : item.minutes + P([' 分钟', ' min'])) + (item.retained ? P([' · 保留记录', ' · Retained mark']) : '');
  function ruleText(task, i, m) {
    const timing = task.kind === 'weeks' ? task.days.map(n => P(weekdays[n])).join(', ') : task.kind === 'months' ? task.day + ' · ' + P(policies[task.policy]) : '';
    return (C.taskName(source(), m, i, ProgramLanguage.language) || P(['未命名事项', 'Unnamed task'])) + ' · ' +
      P(task.enabled ? ['启用', 'Enabled'] : ['停用', 'Disabled']) + ' · ' + P(kinds[task.kind]) + ' / ' + task.every + ' · ' + timing + ' · ' +
      task.start + ' → ' + (task.end || P(['无结束日期', 'No end date'])) + ' · ' + task.minutes + P([' 分钟', ' min']);
  }
  function renderComparison() {
    const box = $('comparison'), kept = entry().checkpoint; box.replaceChildren(); $('restoreCheckpoint').disabled = !kept;
    if (!kept) { box.append(node('p', P(['还没有保存对照。先留一份，再编辑规则或改期。', 'No comparison kept yet. Keep one, then edit a rule or move an occurrence.']))); return; }
    const diff = C.comparison(model(), kept, entry().month);
    box.append(node('p', P([`${diff.ruleRows} 条规则已改变 · ${diff.changed.length} 个窗口事项有变化`, `${diff.ruleRows} changed rules · ${diff.changed.length} changed window occurrences`])));
    if (diff.ruleRows) {
      const details = node('details'), list = node('ol'); details.append(node('summary', P(['查看改变的规则（对照 → 当前）', 'Changed rules (kept → current)'])));
      model().tasks.forEach((task, i) => { if (JSON.stringify(task) !== JSON.stringify(kept.tasks[i])) list.append(node('li', ruleText(kept.tasks[i], i, kept) + ' → ' + ruleText(task, i, model()))); });
      details.append(list); box.append(details);
    }
    if (diff.capacityChanged) box.append(node('p', P(['每天额度（对照 → 当前）：', 'Daily allowance (kept → current): ']) + kept.capacity + ' → ' + model().capacity));
    if (diff.noteChanged) box.append(node('p', P(['备注（对照 → 当前）：', 'Notes (kept → current): ']) + kept.note + ' → ' + model().note));
    const list = node('ol');
    for (const d of diff.changed) list.append(node('li', d.id + ' · ' + itemText(d.before, kept) + ' → ' + itemText(d.after, model())));
    box.append(list);
  }
  function renderFeedback() { $('status').textContent = feedback ? P(feedback) : ''; }
  function render() {
    const active = document.activeElement, focusedId = active?.id;
    const agendaId = active?.closest('.agenda-item')?.dataset.id, action = active?.dataset.action;
    document.querySelectorAll('[data-i]').forEach(el => { el.textContent = P(labels[el.dataset.i]); });
    $('plan').replaceChildren(); C.cases.forEach(s => option($('plan'), s.id, P(s.name))); $('plan').value = data.active;
    $('planTitle').textContent = P(source().name); $('lead').textContent = P(source().lead);
    $('prompts').replaceChildren(...source().prompts.map(pair => node('li', P(pair))));
    $('undo').disabled = !undo.length; $('redo').disabled = !redo.length;
    renderEditor(); renderCalendar(); renderFeedback(); renderStorage();
    if (focusedId) $(focusedId)?.focus({preventScroll: true});
    else if (agendaId && action) $('agenda').querySelector(`[data-id="${agendaId}"] [data-action="${action}"]`)?.focus({preventScroll: true});
  }
  function bindText(id, getter, setter, max) {
    const el = $(id);
    el.addEventListener('focus', () => { group = null; });
    el.addEventListener('blur', () => { group = null; });
    const input = () => {
      if (composing) return;
      let value = el.value; if (max) { value = [...value].slice(0, max).join(''); if (el.value !== value) el.value = value; }
      if (getter() === value) return;
      if (group !== id) { remember(); group = id; } setter(value); feedback = null; save();
      $('undo').disabled = !undo.length; $('redo').disabled = !redo.length;
      renderRuleStatus(); renderCalendar(); renderFeedback();
      if (id === 'name') { const option = $('task').options[entry().task]; option.textContent = (entry().task + 1) + ' · ' + name(entry().task); }
    };
    el.addEventListener('input', input);
    if (id === 'name' || id === 'note') {
      el.addEventListener('compositionstart', () => { composing = true; revision++; });
      el.addEventListener('compositionend', () => { composing = false; input(); });
    }
  }
  for (const id of ['start', 'end', 'every', 'minutes']) bindText(id, () => model().tasks[entry().task][id], v => { model().tasks[entry().task][id] = v; });
  bindText('date', () => model().tasks[entry().task].day, v => { model().tasks[entry().task].day = v; });
  bindText('name', () => model().tasks[entry().task].name, v => { model().tasks[entry().task].name = v; }, 80);
  bindText('capacity', () => model().capacity, v => { model().capacity = v; });
  bindText('note', () => model().note, v => { model().note = v; }, 1000);
  $('enabled').onchange = () => change(() => { model().tasks[entry().task].enabled = $('enabled').checked; });
  for (const id of ['kind', 'policy']) $(id).onchange = () => change(() => { model().tasks[entry().task][id] = $(id).value; });
  $('defaultName').onclick = () => change(() => { model().tasks[entry().task].name = null; });
  $('task').onchange = () => { entry().task = Number($('task').value); group = null; save(true); renderEditor(); };
  $('plan').onchange = () => { data.active = $('plan').value; undo = []; redo = []; group = null; feedback = null; save(true); render(); };
  $('records').onchange = () => { const r = model().records[$('records').value]; if (r) selectDay(r.target); };
  $('month').onchange = () => { if (C.validMonth($('month').value)) selectDay($('month').value + '-01'); else $('month').value = entry().month; };
  function moveMonth(delta) { const n = C.monthNumber(entry().month + '-01') + delta, month = Math.floor(n / 12) + '-' + String(n % 12 + 1).padStart(2, '0'); if (C.validMonth(month)) selectDay(month + '-01'); }
  $('previous').onclick = () => moveMonth(-1); $('next').onclick = () => moveMonth(1);
  $('checkpoint').onclick = () => change(() => { entry().checkpoint = C.copy(model()); }, ['已保存完整对照版。', 'Full comparison kept.']);
  $('restoreCheckpoint').onclick = () => { if (entry().checkpoint) change(() => { entry().model = C.copy(entry().checkpoint); }, ['已取回对照；可以撤销。', 'Comparison retrieved; Undo is available.']); };
  function history(from, to) { if (!from.length) return; to.push(snapshot()); const previous = from.pop(); entry().model = previous.model; entry().checkpoint = previous.checkpoint; group = null; feedback = ['已恢复一次编辑。', 'An edit has been restored.']; save(); render(); }
  $('undo').onclick = () => history(undo, redo); $('redo').onclick = () => history(redo, undo);
  function download(name, text, type) { const url = URL.createObjectURL(new Blob([text], {type})), a = node('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); feedback = ['已下载文件。', 'File downloaded.']; renderFeedback(); }
  $('backup').onclick = () => download('023-calendar-loops.json', JSON.stringify(data, null, 2), 'application/json');
  $('csv').onclick = () => { const text = C.csv(source(), model(), entry().month, ProgramLanguage.language); const note = model().note.replaceAll('"', '""'); const guarded = /^\s*[=+\-@]/u.test(note) ? "'" + note : note; download('023-' + data.active + '-' + entry().month + '.csv', '\uFEFF' + text + '\r\n"' + P(['计划备注', 'Plan notes']) + '","' + guarded + '"', 'text/csv;charset=utf-8'); };
  $('text').onclick = () => { const view = C.windowItems(model(), entry().month); const lines = ['023 · ' + P(['日历回环', 'Calendar Loops']), P(source().name), view.dates[0] + ' → ' + view.dates.at(-1), P(['每天额度：', 'Daily allowance: ']) + model().capacity, ''];
    view.items.forEach(item => lines.push(itemText(item, model()) + ' · ' + P(['原日期 ', 'Original ']) + item.origin)); lines.push('', P(['计划备注：', 'Plan notes: ']), model().note, '', P(['未完成规则不生成新事项。完整保存请使用 JSON。', 'Incomplete rules generate no new occurrences. Use JSON for a full backup.'])); download('023-' + data.active + '-' + entry().month + '.txt', lines.join('\n'), 'text/plain;charset=utf-8'); };
  $('import').onclick = () => { $('file').value = ''; $('file').click(); };
  $('file').onchange = async () => {
    const file = $('file').files[0]; if (!file) return;
    const ticket = ++request, started = revision;
    try {
      if (file.size > C.maxBackup) throw new Error('size');
      const raw = await file.text();
      if (ticket !== request || started !== revision || composing) { feedback = ['读取期间有新操作，本次导入已取消。', 'Work changed while reading; this import was cancelled.']; renderFeedback(); return; }
      const restored = C.restore(JSON.parse(raw)); if (!restored) throw new Error('shape');
      recovery = C.copy(data); data = restored; undo = []; redo = []; group = null;
      feedback = ['已导入全部计划。编辑或刷新前可找回导入前数据。', 'All plans imported. Recover pre-import work before an edit or reload.']; save(true); render();
    } catch {
      if (ticket !== request) return;
      feedback = ['文件无效或超过 3 MB；原数据未改动。', 'File invalid or over 3 MB; existing data is unchanged.']; renderFeedback();
    }
  };
  $('recover').onclick = () => { if (!recovery) return; data = recovery; recovery = null; undo = []; redo = []; group = null; feedback = ['已找回导入前的全部计划。', 'All pre-import plans recovered.']; save(true); render(); };
  window.addEventListener('programlanguagechange', render);
  render();
})();
