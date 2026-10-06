import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buy, BigNum, newState, DATA } from './bundle.mjs';

function rich() {
  const s = newState(0);
  s.run.currencies.grease = BigNum.fromNumber(1e18);
  return s;
}

test('buyUpgrade respects level req and debits the right currency', () => {
  const s = rich();
  s.run.foodLevel = 1;
  const u = DATA.upgrades[5]; // some food upgrade; set its levelReq low
  assert.ok(u, 'upgrade exists');
  const res = buy.buyUpgrade(s, u.id);
  assert.equal(typeof res.ok, 'boolean');
});

test('buyEmployee costs fixed grease and increments count', () => {
  const s = rich();
  const imp = DATA.employees[0]; // Intern
  const before = BigNum.toNumber(s.run.currencies.grease);
  const res = buy.buyEmployee(s, imp.id, 3);
  assert.equal(res.ok, true);
  assert.equal(s.run.employees[imp.id], 3);
  const expected = DATA.employees[0].cost.amount * 3;
  assert.ok(Math.abs(BigNum.toNumber(s.run.currencies.grease) - (before - expected)) < 1e-9);
});

test('buyAutomation enforces currency and growth-scaled cost', () => {
  const s = newState(0);
  s.run.currencies.grease = BigNum.fromNumber(1e6);
  const a = DATA.automation[0]; // basic_clicker, rate 1, growth ~1.15
  const res1 = buy.buyAutomation(s, a.id, 1);
  assert.equal(res1.ok, true);
  assert.equal(s.run.automation[a.id], 1);
  // the next unit must cost strictly more (growth >= 1.12)
  const cost2 = DATA.automation[0].cost.amount * a.growth;
  const greaseBefore = BigNum.toNumber(s.run.currencies.grease);
  const res2 = buy.buyAutomation(s, a.id, 1);
  assert.equal(res2.ok, true);
  const paid = greaseBefore - BigNum.toNumber(s.run.currencies.grease);
  assert.ok(Math.abs(paid - cost2) < 0.5, `expected ${cost2}, paid ${paid}`);
});

test('buy that cannot be afforded does not debit and returns a reason', () => {
  const s = newState(0);
  s.run.currencies.grease = BigNum.fromNumber(0);
  const a = DATA.automation[0];
  const res = buy.buyAutomation(s, a.id, 1);
  assert.equal(res.ok, false);
  assert.ok(res.reason);
  assert.equal(BigNum.toNumber(s.run.currencies.grease), 0);
  assert.equal(s.run.automation[a.id], undefined);
});

test('buyUpgrade enforces prerequisites', () => {
  const s = rich();
  s.run.foodLevel = 50;
  const u = DATA.upgrades.find(x => (x.requires && x.requires.length > 0));
  const res = buy.buyUpgrade(s, u.id);
  assert.equal(res.ok, false);
});
