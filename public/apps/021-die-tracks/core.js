'use strict';
(() => {
  // Faces are ordered top, bottom, north, south, west, east.
  const startFaces = [1, 6, 2, 5, 3, 4];
  const directions = {
    N: {dx: 0, dy: -1, permutation: [3, 2, 0, 1, 4, 5]},
    E: {dx: 1, dy: 0, permutation: [4, 5, 2, 3, 1, 0]},
    S: {dx: 0, dy: 1, permutation: [2, 3, 1, 0, 4, 5]},
    W: {dx: -1, dy: 0, permutation: [5, 4, 2, 3, 0, 1]},
  };
  const maxRolls = 360;
  const maxBackup = 192000;

  function makeLevel(item) {
    const {map} = item;
    const cells = map.join('');
    return {...item, width: map[0].length, height: map.length, cells, start: cells.indexOf('S'), goal: cells.indexOf('G')};
  }
  const levels = globalThis.DieTrackLevels.map(makeLevel);
  const levelFor = id => levels.find(level => level.id === id);
  const initial = level => ({pos: level.start, faces: startFaces.slice()});
  const roll = (faces, direction) => directions[direction].permutation.map(i => faces[i]);
  const won = (level, state) => state.pos === level.goal && (level.top === null || state.faces[0] === level.top);

  function move(level, state, direction) {
    const {dx, dy} = directions[direction];
    const x = state.pos % level.width + dx;
    const y = Math.floor(state.pos / level.width) + dy;
    if (x < 0 || x >= level.width || y < 0 || y >= level.height) return {reason: 'wall'};
    const pos = y * level.width + x;
    const cell = level.cells[pos];
    if (cell === '#') return {reason: 'wall'};
    const faces = roll(state.faces, direction);
    if (cell >= '1' && cell <= '6' && faces[1] !== Number(cell)) {
      return {reason: 'floor', need: Number(cell), bottom: faces[1]};
    }
    return {state: {pos, faces}};
  }

  function replay(level, path) {
    if (typeof path !== 'string' || path.length > maxRolls || /[^NESW]/.test(path)) return null;
    let state = initial(level);
    for (const direction of path) {
      if (won(level, state)) return null;
      const next = move(level, state, direction);
      if (!next.state) return null;
      state = next.state;
    }
    return state;
  }

  function shortest(level, from = initial(level)) {
    const key = state => state.pos + ':' + state.faces.join('');
    const queue = [{state: from, path: ''}];
    const seen = new Set([key(from)]);
    for (let i = 0; i < queue.length; i++) {
      const {state, path} = queue[i];
      if (won(level, state)) return path;
      for (const direction of Object.keys(directions)) {
        const next = move(level, state, direction).state;
        if (!next || seen.has(key(next))) continue;
        seen.add(key(next));
        queue.push({state: next, path: path + direction});
      }
    }
    return null;
  }

  function fresh() {
    return {version: 1, active: levels[0].id, runs: Object.fromEntries(levels.map(({id}) => [
      id, {path: '', redo: '', assisted: false, best: null, guided: null, note: ''},
    ]))};
  }

  function validRecord(level, path) {
    if (path === null) return true;
    const state = replay(level, path);
    return state && won(level, state);
  }

  function restore(raw) {
    if (raw?.version !== 1 || !levelFor(raw.active) || !raw.runs ||
        Object.keys(raw.runs).length !== levels.length) return null;
    const runs = {};
    for (const level of levels) {
      const run = raw.runs[level.id];
      if (!run || typeof run.path !== 'string' || typeof run.redo !== 'string' ||
          !replay(level, run.path + run.redo) || typeof run.assisted !== 'boolean' ||
          !validRecord(level, run.best) || !validRecord(level, run.guided) ||
          typeof run.note !== 'string' || [...run.note].length > 1000) return null;
      runs[level.id] = {
        path: run.path, redo: run.redo, assisted: run.assisted, best: run.best, guided: run.guided, note: run.note,
      };
    }
    return {version: 1, active: raw.active, runs};
  }

  globalThis.DieTracks = {levels, levelFor, directions, makeLevel, initial, maxRolls, maxBackup, roll, won, move, replay, shortest, fresh, restore};
})();
