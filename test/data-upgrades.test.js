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

test('Food tree percentages match the original spec verbatim', () => {
  const food = DATA.upgrades.filter(u => u.tree === 'food');
  const expected = [5,10,15,25,30,40,50,75,100,150,250,400,600,1000,2500,
    5000,10000,25000,50000,100000,500000,1000000,10000000,100000000,1000000000];
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