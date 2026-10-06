import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newState, exportSave, importSave, checksum, migrate, saveGame, loadGame, SAVE_VERSION } from './bundle.mjs';

test('export/import round-trips exactly', () => {
  const s = newState(1000);
  s.run.foodLevel = 17;
  s.run.currencies.grease = { m: 4.2, e: 24 };
  s.meta.clout = { m: 88, e: 0 };
  const out = importSave(exportSave(s));
  assert.equal(out.ok, true, out.errors.join('; '));
  assert.equal(out.state.run.foodLevel, 17);
  assert.deepEqual(out.state.run.currencies.grease, { m: 4.2, e: 24 });
  assert.deepEqual(out.state.meta.clout, { m: 88, e: 0 });
});

test('import rejects a tampered payload', () => {
  const s = newState(1000);
  const blob = exportSave(s);
  const obj = JSON.parse(Buffer.from(blob, 'base64').toString('utf8'));
  obj.d.run.foodLevel = 50;
  const tampered = Buffer.from(JSON.stringify(obj)).toString('base64');
  const out = importSave(tampered);
  assert.equal(out.ok, false);
  assert.ok(out.errors.join(' ').match(/checksum/i), 'should name the checksum');
});

test('import rejects malformed input without throwing', () => {
  for (const bad of ['', 'not-base64!!', 'e30', Buffer.from('{}').toString('base64'), 'null']) {
    const out = importSave(bad);
    assert.equal(out.ok, false, `should reject: ${bad}`);
    assert.ok(Array.isArray(out.errors));
  }
});

test('import reports a preview for confirmation', () => {
  const s = newState(1000); s.run.foodLevel = 23;
  const out = importSave(exportSave(s));
  assert.equal(out.preview.level, 23);
});

test('checksum is stable and content-sensitive', () => {
  assert.equal(checksum('abc'), checksum('abc'));
  assert.notEqual(checksum('abc'), checksum('abd'));
});

test('migration chain upgrades an older save', () => {
  const out = migrate({ saveVersion: 0, run: { foodLevel: 5 }, meta: {}, settings: {}, timestamps: {} });
  assert.equal(out.ok, true, out.error);
  assert.equal(out.state.saveVersion, SAVE_VERSION);
});

test('migration refuses a save from the future rather than guessing', () => {
  const out = migrate({ saveVersion: SAVE_VERSION + 5, run: {} });
  assert.equal(out.ok, false);
  assert.match(out.error, /newer|future/i);
});

test('validator rejects wrong types and out-of-range values', () => {
  const s = newState(1000);
  s.run.foodLevel = 'banana';
  s.run.currencies.grease = { m: 1, e: -99999 };
  const out = importSave(exportSave(s));
  assert.equal(out.ok, false);
});

test('saveGame then loadGame round-trips through a store', () => {
  const mem = new Map();
  const store = { getItem: k => (mem.has(k) ? mem.get(k) : null),
                  setItem: (k, v) => mem.set(k, v), removeItem: k => mem.delete(k) };
  const s = newState(1000);
  s.run.foodLevel = 31;
  s.run.currencies.grease = { m: 9.87, e: 13 };
  assert.equal(saveGame(s, store), true);
  const back = loadGame(store);
  assert.equal(back.run.foodLevel, 31);
  assert.deepEqual(back.run.currencies.grease, { m: 9.87, e: 13 });
});

test('loadGame falls back to the backup slot when main is corrupt', () => {
  const mem = new Map();
  const store = { getItem: k => (mem.has(k) ? mem.get(k) : null),
                  setItem: (k, v) => mem.set(k, v), removeItem: k => mem.delete(k) };
  const good = newState(1000); good.run.foodLevel = 12;
  saveGame(good, store, 'backup');
  store.setItem('snackonomics.save.main', '{"v":1,"t":0,"c":"deadbeef","d":{corrupt');
  const back = loadGame(store);
  assert.equal(back.run.foodLevel, 12, 'should recover from backup, not crash');
});

test('loadGame on an entirely empty store yields a fresh state', () => {
  const mem = new Map();
  const store = { getItem: k => (mem.has(k) ? mem.get(k) : null),
                  setItem: (k, v) => mem.set(k, v), removeItem: k => mem.delete(k) };
  const s = loadGame(store);
  assert.equal(s.run.foodLevel, 1);
});
