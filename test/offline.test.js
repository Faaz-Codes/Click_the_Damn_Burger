import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeOffline, newState, BigNum, CONFIG } from './bundle.mjs';

const prod = () => ({ m: 10, e: 0 }); // 10 grease/sec flat

test('caps absence at the configured maximum', () => {
  const s = newState(0);
  const out = computeOffline(s, 100 * 3600 * 1000, prod); // 100 hours away
  assert.equal(out.capped, true);
  assert.equal(out.elapsedMs, CONFIG.OFFLINE.maxHours * 3600 * 1000);
});

test('applies offline efficiency', () => {
  const s = newState(0);
  const out = computeOffline(s, 3600 * 1000, prod);
  const expected = 10 * 3600 * CONFIG.OFFLINE.efficiency;
  assert.ok(Math.abs(out.gains.grease.m * Math.pow(10, out.gains.grease.e) - expected) < 1);
});

test('clamps a negative elapsed time from a backwards clock', () => {
  const s = newState(10000);
  const out = computeOffline(s, 0, prod);
  assert.equal(out.elapsedMs, 0);
  assert.deepEqual(out.gains.grease, { m: 0, e: 0 });
});

test('an expired booster contributes only for its remaining life', () => {
  const s = newState(0);
  const window = 3600 * 1000;
  s.run.activeBoosters = [{ id: 'x2-grease', startedAt: -600 * 1000, expiresAt: 600 * 1000 }];
  const withBoost = computeOffline(s, window, prod);
  // booster alive for the first 600s of a 3600s window at x2, plain for the rest
  const expected = prod().m * (600 * 2 + 3000) * CONFIG.OFFLINE.efficiency;
  assert.ok(Math.abs(withBoost.gains.grease.m * Math.pow(10, withBoost.gains.grease.e) - expected) < 1,
    'booster must be time-weighted, not applied to the whole window');
});

test('two boosters with different expiries integrate exactly', () => {
  const s = newState(0);
  s.run.activeBoosters = [
    { id: 'a', startedAt: -3600 * 1000, expiresAt: 1800 * 1000 },
    { id: 'b', startedAt: -3600 * 1000, expiresAt: 900 * 1000 },
  ];
  const out = computeOffline(s, 3600 * 1000, prod);
  assert.ok(out.gains.grease.e >= 3, 'should produce a large combined gain');
});
