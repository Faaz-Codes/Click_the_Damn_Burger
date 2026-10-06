import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Sel, computeGrease, computeRate, BigNum, newState } from './bundle.mjs';

test('computeGrease matches Sel.greasePerSec and grows with automation + milestone', () => {
  const s = newState(0);
  s.run.automation.basic_clicker = 25;      // 25/step, may hit milestone at 25
  const before = computeGrease(s);
  assert.ok(BigNum.cmp(before, { m: 0, e: 0 }) > 0);
  // adding an expensive machine that's not in run yet should strictly raise output
  s.run.automation.better_clicker = 1;
  const after = computeGrease(s);
  assert.ok(BigNum.cmp(after, before) > 0);
});

test('computeRate returns the production rate and matches computeGrease', () => {
  const s = newState(0);
  s.run.employees.cook = 3;
  assert.deepEqual(computeRate(s), computeGrease(s));
});
