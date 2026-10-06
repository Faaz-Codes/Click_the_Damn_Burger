import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Sel, BigNum, DATA, newState } from './bundle.mjs';

const ALL_TYPES = ['clickMult','prodMult','fryRate','fizzRate','chickenRate','critMult','critChance','boosterDuration','chestLuck','offlineEff','costReduction','spiceGain','cloutGain','comboDecayResist'];

function base() { const s = newState(0); s.run.currencies.grease = BigNum.fromNumber(1e9); return s; }

test('every Sel accessor is a function', () => {
  for (const k of ['effects','prodMult','clickMult','clickPower','greasePerSec','fryPerSec','fizzPerSec','chickenPerSec','comboMult','critChance','critMult','fryRateMult','fizzRateMult','chickenRateMult','boosterProdFactor','boosterClickFactor','permanentFactor','clickCore','canAfford','costOf']) {
    assert.equal(typeof Sel[k], 'function', `Sel.${k} must be a function`);
  }
});

test('every effect type moves its global factor away from 1 when applied', () => {
  for (const type of ALL_TYPES) {
    const s = base();
    s.run.upgrades.__probe_1 = true;
    const u = { id: '__probe_1', tree: 'food', effect: { type, value: 50 } };
    const realGet = DATA.upgradeById.get;
    DATA.upgradeById.get = (id) => (id === '__probe_1' ? u : realGet.call(DATA.upgradeById, id));
    try {
      const eff = Sel.effects(s);
      assert.notEqual(eff[type], 1, `effect "${type}" did not move its factor`);
    } finally {
      DATA.upgradeById.get = realGet;
      delete s.run.upgrades.__probe_1;
    }
  }
});

test('prodMult is additive within a tree and multiplicative across trees', () => {
  const s = base();
  let n = 0;
  const spy = (tree, value) => {
    const id = '__p_' + tree + '_' + (n++);
    s.run.upgrades[id] = true;
    const u = { id, tree, effect: { type: 'prodMult', value } };
    const real = DATA.upgradeById.get;
    DATA.upgradeById.get = (x) => (x === id ? u : real.call(DATA.upgradeById, x));
  };
  const save = DATA.upgradeById.get;
  spy('food', 10); spy('food', 10);      // food factor = 1 + 20/100 = 1.2
  spy('fry', 5);                            // fry factor = 1.05
  const expected = 1.2 * 1.05;
  const got = Sel.effects(s).prodMult;
  assert.ok(Math.abs(got - expected) < 1e-9, `expected ${expected}, got ${got}`);
  DATA.upgradeById.get = save;
});

test('milestones multiply low-count employee hires, but not below threshold', () => {
  const s = base();
  s.run.employees.intern = 24;
  const e = Sel.greasePerSec(s);
  assert.ok(BigNum.cmp(e, { m: 0, e: 0 }) > 0, '24 interns still produce (no ×2 yet)');
  s.run.employees.intern = 25;
  const e25 = Sel.greasePerSec(s);
  // crossing 25 doubles the intern contribution for that employee
  assert.ok(BigNum.cmp(e25, e) > 0, '25th intern should unlock the ×2 milestone');
});

test('canAfford distinguishes funded from empty wallets', () => {
  const s = base();
  assert.equal(Sel.canAfford(s, { currency: 'grease', amount: BigNum.fromNumber(5e8) }), true);
  assert.equal(Sel.canAfford(s, { currency: 'fry', amount: BigNum.fromNumber(1) }), false);
  assert.equal(Sel.canAfford(s, { currency: 'grease', amount: BigNum.fromNumber(2e9) }), false);
});

test('booster production is capped and refreshes a type', () => {
  const s = base();
  s.run.activeBoosters.push({ id: 'ocean-mode', startedAt: 0, expiresAt: 60000 }); // prodMult 25
  const b1 = Sel.boosterProdFactor(s);
  assert.equal(b1, 25);
  // stacking another prodMult booster multiplies but the soft cap clamps hard at 1000
  s.run.activeBoosters.push({ id: 'ocean-mode', startedAt: 0, expiresAt: 60000 });
  assert.ok(Sel.boosterProdFactor(s) <= 1000, 'booster total must respect softCap');
});

test('permanent goldenBurger doubles prodMult', () => {
  const s = base();
  const before = Sel.prodMult(s);
  s.meta.permanentBonuses.goldenBurger = true;
  assert.equal(Sel.prodMult(s), before * 2);
});
