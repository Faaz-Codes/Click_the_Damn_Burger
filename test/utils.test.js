import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rng, rngPick, rngWeighted, rngInt, Emitter, Pool, makeStore } from './bundle.mjs';

// A localStorage stand-in. `data` is exposed so a test can inspect what was
// actually written, and `breakSet` flips it into the state a full quota or a
// private-mode browser produces: reading still works, writing throws.
function fakeStorage() {
  const data = new Map();
  const storage = {
    data,
    breakSet: false,
    getItem(k) { return data.has(k) ? data.get(k) : null; },
    setItem(k, v) {
      if (storage.breakSet) throw new Error('QuotaExceededError');
      data.set(k, String(v));
    },
    removeItem(k) { data.delete(k); }
  };
  return storage;
}

// A random source with no state of its own, so a test can say exactly where on
// [0, 1) the draw lands.
function stub(value) {
  return () => value;
}

test('seeded rng is deterministic', () => {
  const a = rng(12345); const b = rng(12345);
  for (let i = 0; i < 100; i++) assert.equal(a(), b());
});

test('a seeded rng stays inside [0, 1)', () => {
  const r = rng(7);
  for (let i = 0; i < 1000; i++) {
    const v = r();
    assert.ok(v >= 0 && v < 1, `${v} is outside [0, 1)`);
  }
});

test('different seeds give different streams', () => {
  const a = rng(1); const b = rng(2);
  const same = Array.from({ length: 20 }, () => a() === b()).filter(Boolean).length;
  assert.ok(same < 2, 'two seeded streams should not coincide');
});

test('an unseeded rng draws from Math.random', () => {
  const a = rng(); const b = rng();
  for (let i = 0; i < 50; i++) {
    const v = a();
    assert.ok(v >= 0 && v < 1, `${v} is outside [0, 1)`);
  }
  const differs = Array.from({ length: 20 }, () => a() !== b()).some(Boolean);
  assert.ok(differs, 'two unseeded generators should not replay one stream');
});

test('rngPick reads the source once per pick', () => {
  const items = ['a', 'b', 'c'];
  assert.equal(rngPick(items, stub(0)), 'a');
  assert.equal(rngPick(items, stub(0.5)), 'b');
  assert.equal(rngPick(items, stub(0.999999)), 'c');
});

test('rngPick covers the whole array over many draws', () => {
  const items = ['a', 'b', 'c', 'd'];
  const r = rng(99);
  const seen = new Set(Array.from({ length: 400 }, () => rngPick(items, r)));
  assert.equal(seen.size, items.length, 'every item should be reachable');
});

test('rngWeighted respects weights and needs not sum to 1', () => {
  const r = rng(7);
  const table = [{ weight: 0, name: 'never' }, { weight: 10, name: 'always' }];
  for (let i = 0; i < 200; i++) assert.equal(rngWeighted(table, r).name, 'always');
});

test('rngWeighted normalises the weights before drawing', () => {
  // 3:1 weights over a total of 4: a roll of 0.75 is exactly on the boundary
  // and belongs to the tail quarter of the range. An implementation that used
  // the weights as if they already summed to 1 would answer differently.
  const table = [{ name: 'head', weight: 3 }, { name: 'tail', weight: 1 }];
  assert.equal(rngWeighted(table, stub(0)).name, 'head');
  assert.equal(rngWeighted(table, stub(0.74)).name, 'head');
  assert.equal(rngWeighted(table, stub(0.75)).name, 'tail');
  assert.equal(rngWeighted(table, stub(0.999999)).name, 'tail');
});

test('rngWeighted has nothing to return when every weight is zero', () => {
  assert.equal(rngWeighted([{ weight: 0, name: 'never' }], stub(0.5)), undefined);
  assert.equal(rngWeighted([], stub(0.5)), undefined);
});

test('rngInt stays inside [min, max)', () => {
  assert.equal(rngInt(0, 10, stub(0)), 0);
  assert.equal(rngInt(0, 10, stub(0.999999)), 9);
  assert.equal(rngInt(5, 5, stub(0.5)), 5);
  const r = rng(31337);
  for (let i = 0; i < 500; i++) {
    const v = rngInt(3, 7, r);
    assert.ok(v >= 3 && v < 7, `${v} is outside [3, 7)`);
    assert.ok(Number.isInteger(v), `${v} is not a whole number`);
  }
});

test('Emitter unsubscribes cleanly', () => {
  const e = new Emitter(); let n = 0;
  const off = e.on('x', () => n++);
  e.emit('x'); e.emit('x'); off(); e.emit('x');
  assert.equal(n, 2);
});

test('Emitter off removes one listener and tolerates an unknown one', () => {
  const e = new Emitter(); const seen = [];
  const a = () => seen.push('a'); const b = () => seen.push('b');
  e.on('x', a); e.on('x', b);
  e.off('x', a);
  e.emit('x');
  assert.deepEqual(seen, ['b']);
  // Never added, and already removed: neither may throw.
  assert.doesNotThrow(() => e.off('x', a));
  assert.doesNotThrow(() => e.off('nothing-here', () => {}));
  assert.doesNotThrow(() => e.emit('nothing-here'));
});

test('Emitter delivers the payload to every listener', () => {
  const e = new Emitter(); const seen = [];
  e.on('x', (p) => seen.push(p));
  e.on('x', (p) => seen.push(p * 2));
  e.emit('x', 21);
  assert.deepEqual(seen, [21, 42]);
});

test('an unsubscriber is safe to call twice', () => {
  const e = new Emitter(); let n = 0;
  const off = e.on('x', () => n++);
  off(); off();
  e.emit('x');
  assert.equal(n, 0);
});

test('Pool recycles items without unbounded growth', () => {
  let made = 0;
  const p = new Pool(() => ({ i: made++ }), 4);
  const a = p.get(); p.release(a);
  for (let i = 0; i < 100; i++) p.get();
  assert.equal(made, 4);
});

test('Pool hands out items made by its factory, and returns them on release', () => {
  let made = 0;
  const p = new Pool(() => ({ i: made++ }), 2);
  assert.equal(made, 2);
  const a = p.get();
  assert.deepEqual(a, { i: 1 });
  const drained = p.get();
  assert.deepEqual(drained, { i: 0 });
  // Drained: the third get must recycle one of the two already-made items
  // rather than build a third.
  const recycled = p.get();
  assert.ok([a.i, drained.i].includes(recycled.i), 'a drained pool must reuse an item');
  p.release(a);
  assert.equal(p.get(), a, 'a released item should come straight back');
});

test('makeStore survives a throwing storage', () => {
  const hostile = { getItem(){throw new Error('denied')}, setItem(){throw new Error('quota')}, removeItem(){throw new Error()} };
  const s = makeStore(hostile);
  assert.equal(s.persistent, false);
  assert.doesNotThrow(() => s.set('k', 'v'));
  assert.equal(s.get('k'), 'v');
  assert.doesNotThrow(() => s.remove('k'));
  assert.equal(s.get('k'), null);
});

test('makeStore round-trips through a working storage', () => {
  const mem = fakeStorage();
  const s = makeStore(mem);
  assert.equal(s.persistent, true);
  s.set('k', 'v');
  assert.equal(s.get('k'), 'v');
  assert.equal(s.get('absent'), null);
  s.remove('k');
  assert.equal(s.get('k'), null);
  // The write probe leaves nothing behind.
  assert.deepEqual([...mem.data.keys()], []);
});

test('makeStore drops to memory when a write starts failing', () => {
  const mem = fakeStorage();
  const s = makeStore(mem);
  s.set('k', 'v');
  mem.breakSet = true;
  assert.doesNotThrow(() => s.set('k', 'v2'));
  assert.equal(s.persistent, false);
  assert.equal(s.get('k'), 'v2', 'the value must survive in memory');
});

test('makeStore falls back when there is no storage at all', () => {
  const s = makeStore(null);
  assert.equal(s.persistent, false);
  s.set('k', 'v');
  assert.equal(s.get('k'), 'v');
});