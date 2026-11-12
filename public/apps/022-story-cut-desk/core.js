'use strict';
(() => {
  const cases = globalThis.StoryCutCases;
  const caseFor = id => cases.find(item => item.id === id);
  const copy = value => JSON.parse(JSON.stringify(value));
  const chronological = () => Array.from({length: 8}, (_, i) => i);
  const blankCut = () => ({order: chronological(), texts: Array(8).fill(null), note: ''});
  const fresh = () => ({version: 1, active: cases[0].id, entries: Object.fromEntries(cases.map(item => [
    item.id, {cut: blankCut(), checkpoint: null, cursor: 0, selected: 0},
  ]))});
  const validText = (value, limit) => typeof value === 'string' && [...value].length <= limit;
  const validOrder = order => Array.isArray(order) && order.length === 8 &&
    new Set(order).size === 8 && order.every(n => Number.isInteger(n) && n >= 0 && n < 8);
  function validCut(cut) {
    if (!cut || !validOrder(cut.order) || !Array.isArray(cut.texts) || cut.texts.length !== 8 ||
        !cut.texts.every(text => text === null || validText(text, 1200)) || !validText(cut.note, 1000)) return null;
    return {order: [...cut.order], texts: [...cut.texts], note: cut.note};
  }
  function restore(raw) {
    if (raw?.version !== 1 || !caseFor(raw.active) || !raw.entries || Object.keys(raw.entries).length !== cases.length) return null;
    const entries = {};
    for (const item of cases) {
      const entry = raw.entries[item.id];
      const cut = validCut(entry?.cut);
      const checkpoint = entry?.checkpoint === null ? null : validCut(entry?.checkpoint);
      if (!cut || (entry.checkpoint !== null && !checkpoint) || !Number.isInteger(entry.cursor) ||
          entry.cursor < 0 || entry.cursor > 8 || !Number.isInteger(entry.selected) || entry.selected < 0 || entry.selected > 7) return null;
      entries[item.id] = {cut, checkpoint, cursor: entry.cursor, selected: entry.selected};
    }
    return {version: 1, active: raw.active, entries};
  }
  function move(order, event, destination) {
    if (!validOrder(order) || !Number.isInteger(event) || !order.includes(event) ||
        !Number.isInteger(destination) || destination < 0 || destination > 7) throw new RangeError('Invalid cut');
    const result = order.filter(value => value !== event);
    result.splice(destination, 0, event);
    return result;
  }
  const textFor = (source, cut, event, language) => cut.texts[event] ?? source.events[event].text[language === 'en' ? 1 : 0];
  function analyze(source, order, cursor = 8) {
    if (!validOrder(order) || !Number.isInteger(cursor) || cursor < 0 || cursor > 8) throw new RangeError('Invalid reading position');
    const positions = chronological().map(event => order.indexOf(event) + 1);
    const transitions = order.slice(1).map((event, i) => ({from: order[i], to: event, delta: event - order[i]}));
    let inversions = 0;
    for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) if (order[i] > order[j]) inversions++;
    const threads = source.threads.map(thread => {
      const cue = positions[thread.clue], answer = positions[thread.answer];
      let state = 'unread';
      if (cue <= cursor && answer > cursor) state = 'waiting';
      else if (answer <= cursor && cue > cursor) state = 'answer-first';
      else if (cue <= cursor && answer <= cursor) state = cue < answer ? 'resolved' : 'given';
      return {...thread, cue, answer, state, between: Math.max(0, answer - cue - 1)};
    });
    const openByStep = Array.from({length: 9}, (_, step) => threads.filter(t => t.cue <= step && t.answer > step).length);
    return {positions, transitions, inversions, threads, openByStep,
      backward: transitions.filter(t => t.delta < 0).length,
      skips: transitions.filter(t => Math.abs(t.delta) > 1).length,
      peak: Math.max(...openByStep)};
  }
  function differences(current, saved) {
    return chronological().map(event => ({event, before: saved.order.indexOf(event) + 1,
      after: current.order.indexOf(event) + 1, textChanged: saved.texts[event] !== current.texts[event]}));
  }
  globalThis.StoryCut = {cases, caseFor, copy, chronological, blankCut, fresh, restore, validCut, validOrder,
    move, textFor, analyze, differences, maxBackup: 1500000};
})();
