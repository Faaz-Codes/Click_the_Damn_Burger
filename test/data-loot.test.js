import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DATA } from './bundle.mjs';

test('7 chest tiers with escalating rarity', () => {
  assert.equal(DATA.chests.length, 7);
  assert.deepEqual(DATA.chests.map(c => c.rarity),
    ['common','uncommon','rare','epic','legendary','mythic','secret']);
  assert.deepEqual(DATA.chests.map(c => c.name),
    ['Grease Bin','Napkin Bundle','Sauce Packet Case','Supply Crate',
     'Franchise Vault','Anomaly Crate','[REDACTED]']);
});

test('no chest table awards out-of-scope systems', () => {
  for (const t of DATA.chestTables) {
    for (const r of t.entries) {
      assert.ok(['currency','booster','buff','upgrade'].includes(r.kind),
        `illegal reward kind "${r.kind}" — pets/cards/cosmetics are out of scope`);
    }
  }
});

test('every chest tier has a non-empty table with positive weights', () => {
  assert.equal(DATA.chestTables.length, 7);
  for (const t of DATA.chestTables) {
    assert.ok(t.entries.length > 0, `tier ${t.tier} empty`);
    for (const e of t.entries) assert.ok(e.weight > 0, `non-positive weight in tier ${t.tier}`);
  }
});

test('13 boosters, each with a duration and effect', () => {
  assert.equal(DATA.boosters.length, 13);
  for (const b of DATA.boosters) {
    assert.ok(b.durationMs > 0, `${b.id} missing duration`);
    assert.ok(b.effect && b.effect.type, `${b.id} missing effect`);
  }
  assert.ok(DATA.boosters.some(b => b.id === 'burger-time'), 'Burger Time must exist');
});

test('Burger Time makes every click a crit', () => {
  const bt = DATA.boosters.find(b => b.id === 'burger-time');
  assert.equal(bt.effect.type, 'forceCrit');
  assert.equal(bt.effect.value, true);
});

test('30-day calendar with the 7 streak milestones', () => {
  assert.equal(DATA.dailyCalendar.length, 30);
  for (const d of DATA.dailyCalendar) assert.ok(d.rewards.length > 0, `day ${d.day} empty`);
  assert.deepEqual(DATA.streakMilestones.map(m => m.day), [3,7,14,30,50,100,365]);
});

test('Day 30 grants the permanent Golden Burger', () => {
  const d30 = DATA.dailyCalendar.find(d => d.day === 30);
  assert.ok(d30, 'day 30 must exist');
  assert.deepEqual(d30.rewards.map(r => r.id), ['golden-burger']);
});

test('pity config is armed with both guarantees', () => {
  assert.ok(DATA.chestPity.epicAfter > 0);
  assert.ok(DATA.chestPity.legendaryAfter > DATA.chestPity.epicAfter,
    'legendary guarantee must be further out than epic');
});
