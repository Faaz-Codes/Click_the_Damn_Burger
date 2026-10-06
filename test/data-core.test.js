import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DATA, BigNum, CONFIG } from './bundle.mjs';

test('there are exactly 50 food levels in order', () => {
  assert.equal(DATA.foodLevels.length, 50);
  assert.equal(DATA.foodLevels[0].name, 'Sad Egg');
  assert.equal(DATA.foodLevels[4].name, 'Burger');
  assert.equal(DATA.foodLevels[49].name, 'THE OMNIFOOD');
});

test('every food level carries its spec building name', () => {
  const expected = {
    'Sad Egg': 'Egg Cart',
    'Fries': 'Fry Station',
    'Soda': 'Drink Machine',
    'Chicken': 'Chicken Counter',
    'Mystery Food': 'Food Research Lab',
    'THE OMNIFOOD': 'THE END™'
  };
  for (const [food, building] of Object.entries(expected)) {
    const lvl = DATA.foodLevels.find(f => f.name === food);
    assert.ok(lvl, `missing food level ${food}`);
    assert.equal(lvl.buildingName, building);
  }
});

test('threshold formula matches the spec anchor values', () => {
  const at = n => DATA.thresholdFor(n);
  assert.equal(at(1).e, 2);                    // 150
  assert.ok(Math.abs(at(2).m - 4.65) < 0.01);  // ~465
  assert.ok(at(10).e >= 6 && at(10).e <= 7);  // ~4.0e6
  assert.ok(at(50).e >= 26 && at(50).e <= 27); // ~1.8e26
});

test('thresholds strictly increase', () => {
  for (let n = 2; n <= 50; n++) {
    assert.equal(
      BigNum.cmp(DATA.thresholdFor(n), DATA.thresholdFor(n - 1)),
      1,
      `threshold ${n} must exceed ${n - 1}`
    );
  }
});

test('10 locations tile levels 1-50 with no gaps or overlaps', () => {
  assert.equal(DATA.locations.length, 10);
  assert.equal(DATA.locations[0].levelFrom, 1);
  assert.equal(DATA.locations[9].levelTo, 50);
  for (let i = 1; i < DATA.locations.length; i++) {
    assert.equal(DATA.locations[i].levelFrom, DATA.locations[i - 1].levelTo + 1);
  }
});

test('every food maps to a real location', () => {
  const ids = new Set(DATA.locations.map(l => l.id));
  for (const f of DATA.foodLevels) {
    assert.ok(ids.has(f.locationId), `bad locationId on ${f.name}`);
  }
});

test('all 7 currencies have at least one earn and one spend', () => {
  assert.equal(DATA.currencies.length, 7);
  for (const c of DATA.currencies) {
    assert.ok(c.earns.length > 0, `${c.id} has no earn source`);
    assert.ok(c.spends.length > 0, `${c.id} has no spend sink`);
  }
});

test('secondary currencies unlock at their spec levels', () => {
  const by = id => DATA.currencies.find(c => c.id === id);
  assert.equal(by('grease').unlockLevel, 1);
  assert.equal(by('fry').unlockLevel, 6);
  assert.equal(by('fizz').unlockLevel, 7);
  assert.equal(by('chicken').unlockLevel, 8);
});
