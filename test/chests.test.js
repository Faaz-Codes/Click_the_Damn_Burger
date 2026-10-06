import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openChest, DATA, newState, BigNum } from './bundle.mjs';

function eligibleIdsForHigh(tier) {
  const t = DATA.chestTables.find(x => x.tier === tier);
  return t.entries.filter(e => e.kind === 'upgrade' || e.kind === 'buff' || e.kind === 'booster').map(e => e.id);
}

const rand = () => 0.5; // does not matter for the pity-forced branches

test('openChest on a valid tier returns that tier and grants the currency', () => {
  const s = newState(0);
  const before = BigNum.toNumber(s.run.currencies.grease);
  const r = openChest(s, 1, () => 0); // rand=0 -> always picks first weighted entry (weight 70 = currency grease)
  assert.equal(r.ok, true);
  assert.equal(r.tier, 1);
  assert.ok(r.reward && typeof r.reward.id === 'string');
  assert.equal(r.reward.kind, 'currency');
  assert.equal(r.reward.id, 'grease');
  const after = BigNum.toNumber(s.run.currencies.grease);
  assert.ok(Math.abs(after - (before + r.reward.amount)) < 1e-9);
});

test('pity forces a high-tier reward once noEpic hits the threshold', () => {
  const s = newState(0);
  s.meta.chestPity.noEpic = DATA.chestPity.epicAfter;
  const r = openChest(s, 3, rand);
  assert.equal(r.ok, true);
  assert.notEqual(r.reward.kind, 'currency', 'high-rarity pity must not pay out plain currency');
  assert.equal(s.meta.chestPity.noEpic, 0, 'pity counter should reset after a high roll');
});

test('pity forces a legendary-or-higher reward once noLegendary hits the threshold', () => {
  const s = newState(0);
  s.meta.chestPity.noLegendary = DATA.chestPity.legendaryAfter;
  const r = openChest(s, 6, rand);
  assert.equal(r.ok, true);
  assert.notEqual(r.reward.kind, 'currency', 'legendary pity must not Pay out plain currency');
  assert.equal(s.meta.chestPity.noLegendary, 0);
});

test('a normal roll of low value does NOT trigger the pity floor', () => {
  const s = newState(0);
  s.meta.chestPity.noEpic = DATA.chestPity.epicAfter - 1;
  const r = openChest(s, 1, () => 0); // first entry is plain grease currency
  assert.equal(r.reward.kind, 'currency');
  assert.equal(s.meta.chestPity.noEpic, DATA.chestPity.epicAfter, 'non-high roll keeps the counter high');
});
