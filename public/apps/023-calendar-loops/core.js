'use strict';
(() => {
  const cases = globalThis.CalendarLoopCases;
  const copy = value => JSON.parse(JSON.stringify(value));
  const caseFor = id => cases.find(item => item.id === id);
  const dayMs = 86400000;
  const serial = iso => Date.parse(iso + 'T00:00:00Z') / dayMs;
  const isoDay = value => new Date(value * dayMs).toISOString().slice(0, 10);
  const addDays = (iso, count) => isoDay(serial(iso) + count);
  const weekday = iso => (new Date(iso + 'T00:00:00Z').getUTCDay() + 6) % 7;
  const monthNumber = iso => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1;
  const monthDays = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();
  function validDate(iso) {
    if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso) || iso < '1900-01-01' || iso > '2100-12-31') return false;
    const time = serial(iso);
    return Number.isFinite(time) && isoDay(time) === iso;
  }
  const validMonth = month => typeof month === 'string' && /^\d{4}-\d{2}$/.test(month) && validDate(month + '-01');
  const integer = (text, min, max) => typeof text === 'string' && /^\d+$/.test(text) && Number(text) >= min && Number(text) <= max ? Number(text) : null;
  function compile(task) {
    const errors = [];
    if (!validDate(task.start)) errors.push('start');
    if (task.end && (!validDate(task.end) || task.end < task.start)) errors.push('end');
    const every = integer(task.every, 1, task.kind === 'days' ? 60 : 12);
    const minutes = integer(task.minutes, 0, 240);
    const date = integer(task.day, 1, 31);
    if (every === null) errors.push('every');
    if (minutes === null) errors.push('minutes');
    if (task.kind === 'weeks' && !task.days.length) errors.push('days');
    if (task.kind === 'months' && date === null) errors.push('day');
    return {valid: errors.length === 0, errors, ...task, every, minutes, date};
  }
  function due(rule, iso) {
    if (!rule.valid || !rule.enabled || !validDate(iso) || iso < rule.start || rule.end && iso > rule.end) return false;
    if (rule.kind === 'days') return (serial(iso) - serial(rule.start)) % rule.every === 0;
    if (rule.kind === 'weeks') {
      const monday = serial(rule.start) - weekday(rule.start);
      return Math.floor((serial(iso) - monday) / 7) % rule.every === 0 && rule.days.includes(weekday(iso));
    }
    const delta = monthNumber(iso) - monthNumber(rule.start);
    const last = monthDays(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)));
    const date = rule.policy === 'last' ? Math.min(rule.date, last) : rule.date;
    return delta % rule.every === 0 && Number(iso.slice(8)) === date;
  }
  function grid(month) {
    if (!validMonth(month)) throw new RangeError('Invalid month');
    const first = month + '-01';
    const monday = addDays(first, -weekday(first));
    return Array.from({length: 42}, (_, i) => addDays(monday, i));
  }
  function blank(source, today) {
    return {capacity: '90', note: '', records: {}, tasks: source.tasks.map(task => ({
      name: null, enabled: true, start: today, end: '', kind: task.kind, every: String(task.every),
      days: task.days ? [...task.days] : [0], day: String(task.day || 1), policy: task.policy || 'skip', minutes: String(task.minutes),
    }))};
  }
  function fresh(today) {
    if (!validDate(today)) throw new RangeError('Invalid starting date');
    return {version: 1, active: cases[0].id, entries: Object.fromEntries(cases.map(source => [source.id, {
      model: blank(source, today), checkpoint: null, task: 0, month: today.slice(0, 7), day: today,
    }]))};
  }
  function windowItems(model, month) {
    const dates = grid(month), first = dates[0], last = dates.at(-1);
    const rules = model.tasks.map(compile);
    const items = [];
    for (const date of dates) {
      if (!validDate(date)) continue;
      rules.forEach((rule, task) => {
        const id = task + '@' + date;
        if (due(rule, date) && !Object.hasOwn(model.records, id)) items.push({id, task, date, origin: date, state: 'planned', minutes: rule.minutes, saved: false, retained: false});
      });
    }
    for (const [id, record] of Object.entries(model.records)) {
      if (record.target < first || record.target > last) continue;
      const task = Number(id[0]), origin = id.slice(2);
      items.push({id, task, origin, date: record.target, state: record.state,
        minutes: integer(model.tasks[task].minutes, 0, 240), saved: true, retained: !due(rules[task], origin)});
    }
    items.sort((a, b) => a.date.localeCompare(b.date) || a.task - b.task || a.origin.localeCompare(b.origin));
    return {dates, items, rules, invalid: rules.map((rule, task) => ({task, errors: rule.errors})).filter(({task, errors}) => model.tasks[task].enabled && errors.length)};
  }
  function daySummary(items, capacity) {
    const active = items.filter(item => item.state !== 'skip');
    const known = active.filter(item => item.minutes !== null);
    return {count: active.length, total: known.reduce((sum, item) => sum + item.minutes, 0),
      unknown: active.length - known.length, done: active.filter(item => item.state === 'done').length,
      remaining: known.filter(item => item.state === 'planned').reduce((sum, item) => sum + item.minutes, 0),
      over: capacity !== null && known.reduce((sum, item) => sum + item.minutes, 0) > capacity};
  }
  function comparison(model, kept, month) {
    const current = windowItems(model, month), previous = windowItems(kept, month);
    const before = new Map(previous.items.map(item => [item.id, item])), after = new Map(current.items.map(item => [item.id, item]));
    const changed = [];
    for (const id of new Set([...before.keys(), ...after.keys()])) {
      const a = before.get(id), b = after.get(id);
      if (!a || !b || a.date !== b.date || a.state !== b.state || a.minutes !== b.minutes || a.retained !== b.retained) changed.push({id, before: a || null, after: b || null});
    }
    return {changed, ruleRows: model.tasks.filter((task, i) => JSON.stringify(task) !== JSON.stringify(kept.tasks[i])).length,
      noteChanged: model.note !== kept.note, capacityChanged: model.capacity !== kept.capacity};
  }
  function mark(model, id, target, state) {
    if (!/^[0-7]@\d{4}-\d{2}-\d{2}$/.test(id) || !validDate(id.slice(2)) || !validDate(target) || !['planned', 'done', 'skip'].includes(state)) throw new RangeError('Invalid dated mark');
    if (!Object.hasOwn(model.records, id) && Object.keys(model.records).length >= 1024) return false;
    model.records[id] = {target, state}; return true;
  }
  const text = (value, max) => typeof value === 'string' && [...value].length <= max;
  function validTask(task) {
    if (!task || !(task.name === null || text(task.name, 80)) || typeof task.enabled !== 'boolean' ||
        !text(task.start, 10) || !text(task.end, 10) || !['days', 'weeks', 'months'].includes(task.kind) ||
        !text(task.every, 3) || !text(task.minutes, 3) || !text(task.day, 2) || !['skip', 'last'].includes(task.policy) ||
        !Array.isArray(task.days) || task.days.length > 7 || new Set(task.days).size !== task.days.length ||
        !task.days.every(n => Number.isInteger(n) && n >= 0 && n <= 6)) return null;
    return {name: task.name, enabled: task.enabled, start: task.start, end: task.end, kind: task.kind,
      every: task.every, minutes: task.minutes, day: task.day, policy: task.policy, days: [...task.days]};
  }
  function validModel(model) {
    if (!model || !text(model.capacity, 4) || !text(model.note, 1000) || !Array.isArray(model.tasks) ||
        model.tasks.length !== 8 || !model.records || typeof model.records !== 'object' || Array.isArray(model.records) || Object.keys(model.records).length > 1024) return null;
    const tasks = model.tasks.map(validTask);
    if (tasks.some(task => !task)) return null;
    const records = {};
    for (const [id, record] of Object.entries(model.records)) {
      if (!/^[0-7]@\d{4}-\d{2}-\d{2}$/.test(id) || !validDate(id.slice(2)) || !record ||
          !validDate(record.target) || !['planned', 'done', 'skip'].includes(record.state)) return null;
      records[id] = {target: record.target, state: record.state};
    }
    return {capacity: model.capacity, note: model.note, tasks, records};
  }
  function restore(raw) {
    if (raw?.version !== 1 || !caseFor(raw.active) || !raw.entries || Object.keys(raw.entries).length !== cases.length) return null;
    const entries = {};
    for (const source of cases) {
      const entry = raw.entries[source.id], model = validModel(entry?.model);
      const checkpoint = entry?.checkpoint === null ? null : validModel(entry?.checkpoint);
      if (!model || (entry.checkpoint !== null && !checkpoint) || !Number.isInteger(entry.task) || entry.task < 0 || entry.task > 7 ||
          !validMonth(entry.month) || !validDate(entry.day) || entry.day.slice(0, 7) !== entry.month) return null;
      entries[source.id] = {model, checkpoint, task: entry.task, month: entry.month, day: entry.day};
    }
    return {version: 1, active: raw.active, entries};
  }
  const taskName = (source, model, task, language) => model.tasks[task].name ?? source.tasks[task].name[language === 'en' ? 1 : 0];
  const csvCell = value => '"' + (/^\s*[=+\-@]/u.test(String(value)) ? "'" + value : String(value)).replaceAll('"', '""') + '"';
  function csv(source, model, month, language) {
    const english = language === 'en';
    const rows = [english ? ['Date', 'Task', 'State', 'Original date', 'Minutes', 'Retained dated mark'] : ['日期', '事项', '状态', '原日期', '分钟', '保留的日期记录']];
    const states = english ? {planned: 'Planned', done: 'Done', skip: 'Skipped'} : {planned: '待做', done: '完成', skip: '跳过'};
    for (const item of windowItems(model, month).items) rows.push([item.date, taskName(source, model, item.task, language), states[item.state], item.origin,
      item.minutes === null ? (english ? 'Unknown' : '待填') : item.minutes, item.retained ? (english ? 'Yes' : '是') : '']);
    return rows.map(row => row.map(csvCell).join(',')).join('\r\n');
  }
  globalThis.CalendarLoops = {cases, caseFor, copy, serial, isoDay, addDays, weekday, monthNumber, monthDays, validDate, validMonth,
    integer, compile, due, grid, blank, fresh, windowItems, daySummary, comparison, mark, validModel, restore, taskName, csv, maxBackup: 3000000};
})();
