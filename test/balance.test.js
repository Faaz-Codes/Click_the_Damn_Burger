import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulate, checkPacing, pacingReport, PACING } from './bundle.mjs';

// The balance simulator's whole point: the greedy
// spend-all bot must land the §6.3 level curve. The
// two early-milestone rows are `soft` (reported, not
// asserted) -- see the PACING table for why.
test('the level curve lands inside the §6.3 pacing table', () => {
  const { hist } = simulate();
  const { rows, pass } = checkPacing(hist);
  assert.ok(pass, `pacing off-target:\n${pacingReport(hist)}`);
  // Hard rows must each be reached, never/undefined not allowed.
  for (const r of rows) {
    if (r.soft) continue;
    assert.ok(r.reached != null, `${r.label} never reached`);
  }
});

test('level 50 sits in the 8-10h window', () => {
  const { hist } = simulate();
  const lv50 = hist.levelAt[50];
  const target = PACING.find(p => p.label === 'level 50');
  assert.ok(lv50 != null && lv50 >= target.at * target.tol[0] && lv50 <= target.at * target.tol[1],
    `Lv50=${lv50} outside ${target.at * target.tol[0]}-${target.at * target.tol[1]}s`);
});
