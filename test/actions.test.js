import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Actions, click, useBooster, expireBoosters, tick, Sel, newState, BigNum, DATA, CONFIG } from './bundle.mjs';

const grease = (s) => BigNum.toNumber(s.run.currencies.grease);

test('a bare click awards exactly the base click power', () => {
  const s = newState(0);
  const r = click(s, 1000);
  assert.ok(Math.abs(grease(s) - 1) < 1e-9, `bare click gives 1 grease, got ${grease(s)}`);
  assert.equal(r.tier, 'normal');
  assert.equal(r.combo, 1);
  assert.equal(s.meta.stats.clicks, 1);
});

test('combo grows inside the decay window and resets outside it', () => {
  const s = newState(0);
  click(s, 1000);
  click(s, 1500); // +500ms, inside the 1500ms window
  assert.equal(s.run.combo.count, 2);
  click(s, 2000); // +500ms again
  assert.equal(s.run.combo.count, 3);
  assert.equal(s.meta.stats.comboMax, 3);
  click(s, 4000); // +2000ms, past the window -> combo resets
  assert.equal(s.run.combo.count, 1);
});

test('a forced jackpot roll scales the gain by the jackpot multiplier', () => {
  const s = newState(0);
  const r = click(s, 1000, () => 0); // roll 0 < jackpot threshold
  assert.equal(r.tier, 'jackpot');
  assert.ok(Math.abs(grease(s) - CONFIG.CRIT.multJackpot) < 1e-6, `jackpot pays x${CONFIG.CRIT.multJackpot}`);
  assert.equal(s.meta.stats.jackpots, 1);
});

test('a forced normal roll pays the base gain', () => {
  const s = newState(0);
  const r = click(s, 1000, () => 0.9); // past every crit threshold
  assert.equal(r.tier, 'normal');
  assert.ok(Math.abs(grease(s) - 1) < 1e-9);
});

test('a forceCrit booster makes every click a crit', () => {
  const s = newState(0);
  s.meta.boosterInventory['burger-time'] = 1;
  const use = useBooster(s, 'burger-time', 0);
  assert.equal(use.ok, true);
  const r = click(s, 1000, () => 0.9); // high roll, but forceCrit overrides
  assert.equal(r.tier, 'critical');
  assert.ok(Math.abs(grease(s) - CONFIG.CRIT.multCritical) < 1e-6);
  assert.equal(s.meta.stats.crits, 1);
});

test('useBooster moves a unit from inventory to the active set', () => {
  const s = newState(0);
  s.meta.boosterInventory['warm-hands'] = 2;
  const r = useBooster(s, 'warm-hands', 0);
  assert.equal(r.ok, true);
  assert.equal(s.meta.boosterInventory['warm-hands'], 1);
  assert.equal(s.run.activeBoosters.length, 1);
  assert.equal(s.run.activeBoosters[0].id, 'warm-hands');
  assert.equal(s.meta.stats.boostersActivated, 1);
  // re-using refreshes the timer instead of stacking
  const r2 = useBooster(s, 'warm-hands', 1000);
  assert.equal(r2.ok, true);
  assert.equal(r2.refreshed, true);
  assert.equal(s.run.activeBoosters.length, 1, 'refreshing must not add a second entry');
});

test('useBooster refuses when the inventory is empty or the cap is hit', () => {
  const s = newState(0);
  assert.equal(useBooster(s, 'warm-hands', 0).ok, false); // not in inventory
  const four = ['grease-spray', 'warm-hands', 'butter-fingers', 'burger-time'];
  for (const id of four) {
    s.meta.boosterInventory[id] = 1;
    assert.equal(useBooster(s, id, 0).ok, true);
  }
  s.meta.boosterInventory['double-time'] = 1;
  const fifth = useBooster(s, 'double-time', 0);
  assert.equal(fifth.ok, false);
  assert.match(fifth.reason, /limit/);
});

test('expireBoosters drops expired entries and restores the multiplier', () => {
  const s = newState(0);
  s.meta.boosterInventory['warm-hands'] = 1;
  useBooster(s, 'warm-hands', 1000); // expires at 1000 + 45000
  assert.ok(Sel.boosterClickFactor(s) > 1, 'active booster raises click mult');
  tick(s, 46000); // past the expiry
  assert.equal(s.run.activeBoosters.length, 0);
  assert.equal(Sel.boosterClickFactor(s), 1, 'expired booster no longer counts');
});

test('tick accumulates playtime, advances the level and evaluates achievements', () => {
  const s = newState(0);
  tick(s, 5000);
  tick(s, 8000);
  assert.equal(s.meta.stats.playtimeMs, 8000);
  s.run.lifetimeGreaseThisRun = BigNum.fromNumber(200);
  s.meta.stats.clicks = 1;
  tick(s, 9000);
  assert.equal(s.run.foodLevel, 2, 'crossing the first threshold levels up');
  assert.equal(s.meta.achievements['first-contact'], true, 'tick evaluates achievements');
});

test('the Actions barrel exposes every mutator', () => {
  for (const k of ['click', 'buyUpgrade', 'buyEmployee', 'buyAutomation', 'openChest', 'claimDaily', 'useBooster', 'expireBoosters', 'tick', 'importSave', 'exportSave', 'saveGame', 'loadGame', 'resetSave']) {
    assert.equal(typeof Actions[k], 'function', `Actions.${k} must be a function`);
  }
  assert.equal(typeof Actions.resetSave(), 'object');
});
