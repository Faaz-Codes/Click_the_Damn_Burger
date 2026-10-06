import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DATA } from './bundle.mjs';

test('tree sizes match the spec exactly', () => {
  const count = t => DATA.upgrades.filter(u => u.tree === t).length;
  assert.equal(count('food'), 25);
  assert.equal(count('fry'), 27);
  assert.equal(count('drink'), 26);
  assert.equal(count('chicken'), 26);
  assert.equal(DATA.upgrades.length, 104);
});

test('Food tree percentages follow the spec curve (tail balance-capped)', () => {
  const food = DATA.upgrades.filter(u => u.tree === 'food');
  // The original spec tail (...1e6, 1e7, 1e8, 1e9) is
  // intentionally capped: the verbatim values make Lv25
  // ~4x too fast and a single Universal Kitchen multi-hour
  // in under an hour, breaking the §6.3 pacing curve that
  // the spec calls the "real constraint". See
  // src/02_data_upgrades.js for the note.
  const expected = [5,10,15,25,30,40,50,75,100,150,250,400,600,1000,2500,
    5000,10000,25000,50000,100000,500000,2000000,6000000,20000000,50000000];
  assert.deepEqual(food.map(u => u.effect.value), expected);
});

test('Food tree names match the original spec verbatim', () => {
  const food = DATA.upgrades.filter(u => u.tree === 'food');
  assert.equal(food[0].name, 'Slightly Better Ingredients');
  assert.equal(food[24].name, 'The Food Has Become Sentient');
});

test('tree finale story beats are present', () => {
  const byTree = t => DATA.upgrades.filter(u => u.tree === t);
  assert.equal(byTree('drink').at(-1).name, 'The Ocean Is Now Soda');
  assert.equal(byTree('chicken').at(-1).name, 'The Chicken Has Achieved Consciousness');
  assert.equal(byTree('fry').at(-1).name, 'Infinite Crispy');
});

test('the generator is deterministic and escalating', () => {
  const a = DATA.genUpgradeEffect('fry', 0, 27);
  const b = DATA.genUpgradeEffect('fry', 0, 27);
  assert.deepEqual(a, b);
  const early = DATA.genUpgradeEffect('fry', 0, 27).value;
  const late  = DATA.genUpgradeEffect('fry', 26, 27).value;
  assert.ok(late > early * 1000, `late ${late} should dwarf early ${early}`);
});

test('every upgrade has complete, well-formed data', () => {
  for (const u of DATA.upgrades) {
    assert.ok(u.id && u.name && u.desc && u.flavorText, `${u.id} missing text`);
    assert.ok(['food','fry','drink','chicken'].includes(u.tree), `${u.id} bad tree`);
    assert.ok(u.cost.amount > 0, `${u.id} non-positive cost`);
    assert.ok(['grease','fry','fizz','chicken','spice'].includes(u.cost.currency), `${u.id} bad currency`);
    assert.ok(u.effect && typeof u.effect.value === 'number', `${u.id} bad effect`);
    assert.ok(Number.isInteger(u.levelReq) && u.levelReq >= 1, `${u.id} bad levelReq`);
  }
});

test('requires point only at real upgrade ids', () => {
  for (const u of DATA.upgrades) {
    for (const r of u.requires) assert.ok(DATA.upgradeById.has(r), `${u.id} requires missing ${r}`);
  }
});