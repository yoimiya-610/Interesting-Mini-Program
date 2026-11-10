import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const context = vm.createContext({});
for (const file of ['content.js', 'core.js']) {
  vm.runInContext(readFileSync(new URL('../public/apps/021-die-tracks/' + file, import.meta.url), 'utf8'), context);
}
const C = context.DieTracks;
const start = [[0, 0, 1], [0, -1, 0], [-1, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, -1]];
const delta = {N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0]};
const rotate = {
  N: ([x, y, z]) => [x, -z, y], E: ([x, y, z]) => [z, y, -x],
  S: ([x, y, z]) => [x, z, -y], W: ([x, y, z]) => [-z, y, x],
};
const opposite = {N: 'S', E: 'W', S: 'N', W: 'E'};
const face = (orientation, axis, sign) => 1 + orientation.findIndex(vector => vector[axis] === sign);

// The oracle represents each numbered face by a normal vector in three dimensions.
function solve(maze, {ignoreGates = false, ignoreTop = false} = {}) {
  const queue = [{pos: maze.start, orientation: start, path: ''}];
  const seen = new Set();
  for (let i = 0; i < queue.length; i++) {
    const {pos, orientation, path} = queue[i];
    if (pos === maze.goal && (ignoreTop || maze.top === null || face(orientation, 2, 1) === maze.top)) return path;
    for (const [dir, [dx, dy]] of Object.entries(delta)) {
      const x = pos % maze.width + dx, y = Math.floor(pos / maze.width) + dy;
      const next = y * maze.width + x;
      const tile = maze.map[y]?.[x];
      if (!tile || tile === '#') continue;
      const turned = orientation.map(rotate[dir]);
      if (!ignoreGates && /[1-6]/.test(tile) && face(turned, 2, -1) !== Number(tile)) continue;
      const key = next + ':' + turned.flat().join(',');
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({pos: next, orientation: turned, path: path + dir});
    }
  }
  return null;
}

test('Every roll agrees with a 3D rotation for all 24 orientations', () => {
  const queue = [{faces: C.initial(C.levels[0]).faces, vectors: start}];
  const seen = new Set();
  for (const {faces, vectors} of queue) {
    if (seen.has(faces.join(''))) continue;
    seen.add(faces.join(''));
    assert.deepEqual(Array.from(faces), [
      face(vectors, 2, 1), face(vectors, 2, -1), face(vectors, 1, -1),
      face(vectors, 1, 1), face(vectors, 0, -1), face(vectors, 0, 1),
    ]);
    for (const direction of Object.keys(delta)) {
      const rolled = C.roll(faces, direction);
      assert.deepEqual(C.roll(rolled, opposite[direction]), faces);
      queue.push({faces: rolled, vectors: vectors.map(rotate[direction])});
    }
  }
  assert.equal(seen.size, 24);
});

test('Sixteen distinct mazes are solvable with independently verified minima', () => {
  assert.equal(C.levels.length, 16);
  assert.equal(new Set(C.levels.map(level => level.cells)).size, 16);
  for (const [i, maze] of C.levels.entries()) {
    assert.equal(maze.id, String(i + 1).padStart(2, '0'));
    assert.equal(maze.cells.match(/S/g).length, 1);
    assert.equal(maze.cells.match(/G/g).length, 1);
    assert(maze.map.every(row => row.length === maze.width && /^[.#SG1-6]+$/.test(row)));
    assert.match(maze.clue[0], /[\u3400-\u9fff]/);
    assert(maze.clue[1].trim() && !/[\u3400-\u9fff]/.test(maze.clue[1]));
    const route = solve(maze);
    assert.equal(route?.length, maze.minimum, maze.id);
    assert.equal(C.shortest(maze)?.length, maze.minimum, maze.id);
    assert(C.won(maze, C.replay(maze, route)));
    if (i >= 8) {
      const open = solve(maze, {ignoreGates: true});
      const geometric = solve(maze, {ignoreGates: true, ignoreTop: true});
      assert(maze.minimum >= 16 && maze.minimum - open.length >= 4 && maze.minimum - geometric.length >= 8);
      const visited = new Set([maze.start]);
      const used = new Set();
      let repeats = 0;
      let state = C.initial(maze);
      for (const direction of route) {
        state = C.move(maze, state, direction).state;
        if (visited.has(state.pos)) repeats++;
        visited.add(state.pos);
        if (/[1-6]/.test(maze.cells[state.pos])) used.add(state.pos);
      }
      assert(used.size >= 2 && repeats >= 2);
    }
  }
});

test('Tiles check the landing bottom and an incorrect goal top allows a later finish', () => {
  const gate = C.makeLevel({map: ['S3G'], top: null});
  assert.deepEqual({...C.move(gate, C.initial(gate), 'E')}, {reason: 'floor', need: 3, bottom: 4});
  const maze = C.levelFor('04');
  assert.equal(C.replay(maze, 'E').pos, maze.goal);
  assert.equal(C.won(maze, C.replay(maze, 'E')), false);
  assert(C.won(maze, C.replay(maze, 'ESENW')));
  assert.equal(C.replay(maze, 'ESENWE'), null);
});

test('Complete backups replay routes and reject malformed attempts without losing notes', () => {
  const original = C.fresh();
  for (const maze of C.levels) {
    const path = solve(maze);
    const first = path[0];
    original.runs[maze.id] = {path: (first + opposite[first]).repeat(179), redo: first + opposite[first],
      assisted: true, best: path, guided: path, note: '\ud800'.repeat(1000)};
  }
  const text = JSON.stringify(original);
  assert(Buffer.byteLength(text) < C.maxBackup);
  assert.deepEqual(JSON.parse(JSON.stringify(C.restore(JSON.parse(text)))), JSON.parse(text));
  for (const corrupt of [
    raw => { raw.runs['01'].path = 'W'; },
    raw => { raw.runs['01'].best = 'E'; },
    raw => { raw.runs['01'].redo = 'EWEW'; },
    raw => { raw.runs['01'].note += 'x'; },
    raw => { raw.active = 'unknown'; },
  ]) {
    const raw = JSON.parse(text);
    corrupt(raw);
    assert.equal(C.restore(raw), null);
  }
});
