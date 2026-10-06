import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tickProgression, currentFood, BigNum, newState, DATA } from './bundle.mjs';

test('lifetime crossing the first threshold advances to level 2', () => {
  const s = newState(0);
  s.run.lifetimeGreaseThisRun = BigNum.fromNumber(200);
  const adv = tickProgression(s);
  assert.equal(adv, true);
  assert.equal(s.run.foodLevel, 2);
  assert.equal(currentFood(s).name, DATA.foodLevels[1].name);
});

test('level does not advance below threshold', () => {
  const s = newState(0);
  s.run.lifetimeGreaseThisRun = BigNum.fromNumber(100);
  const adv = tickProgression(s);
  assert.equal(adv, false);
  assert.equal(s.run.foodLevel, 1);
});

test('at level 50, extra lifetime rolls into Omni Ascension', () => {
  const s = newState(0);
  const last = DATA.foodLevels[49];
  s.run.foodLevel = 50;
  s.run.lifetimeGreaseThisRun = BigNum.fromNumber(last.threshold * 3 + 1);
  const adv = tickProgression(s);
  assert.equal(s.run.foodLevel, 50);
  assert.ok((s.meta.stats.omniAscensions || 0) >= 1, `expected omni >= 1, got ${s.meta.stats.omniAscensions}`);
});
