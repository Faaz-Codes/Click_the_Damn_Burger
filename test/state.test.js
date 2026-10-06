import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newState, DATA } from './bundle.mjs';

test('fresh state matches the spec shape exactly', () => {
  const s = newState(1000);
  assert.equal(s.saveVersion, 1);
  assert.equal(s.run.foodLevel, 1);
  assert.equal(s.run.upgrades && typeof s.run.upgrades, 'object');
  assert.ok(s.meta.permanentBonuses, 'permanentBonuses must exist for prestige');
  assert.equal(s.meta.permanentBonuses.goldenBurger, false);
  assert.ok(s.meta.chestPity && s.meta.daily && s.meta.streak && s.meta.seen);
  assert.ok(s.settings && s.timestamps.created === 1000);
});

test('all 5 run currencies start at zero and are BigNum-shaped', () => {
  const s = newState(1000);
  for (const c of ['grease','fry','fizz','chicken','spice']) {
    assert.deepEqual(s.run.currencies[c], { m: 0, e: 0 }, `${c} must start at zero`);
  }
});

test('newState returns independent objects', () => {
  const a = newState(1), b = newState(2);
  a.run.upgrades.foo = true;
  assert.equal(b.run.upgrades.foo, undefined, 'states must not share references');
});
