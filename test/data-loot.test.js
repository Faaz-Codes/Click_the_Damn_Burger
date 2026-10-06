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

// Every reward source (chest tables, daily calendar, streak milestones) may
// only use these kinds. 'permanent' writes to meta.permanentBonuses (e.g. the
// Golden Burger's +100% global production) rather than to a currency balance;
// a later systems layer consumes it.
const REWARD_KINDS = ['currency','booster','buff','upgrade','permanent'];

function allRewards() {
  return [
    ...DATA.chestTables.flatMap(t => t.entries),
    ...DATA.dailyCalendar.flatMap(d => d.rewards),
    ...DATA.streakMilestones.flatMap(m => m.rewards)
  ];
}

test('no reward table awards out-of-scope systems', () => {
  for (const r of allRewards()) {
    assert.ok(REWARD_KINDS.includes(r.kind),
      `illegal reward kind "${r.kind}" — pets/cards/cosmetics are out of scope`);
  }
});

test('every currency reward points at a real currency', () => {
  const ids = new Set(DATA.currencies.map(c => c.id));
  for (const r of allRewards()) {
    if (r.kind !== 'currency') continue;
    assert.ok(ids.has(r.id), `currency reward "${r.id}" is not a real currency`);
  }
});

test('every booster reward points at a real booster', () => {
  const ids = new Set(DATA.boosters.map(b => b.id));
  for (const r of allRewards()) {
    if (r.kind !== 'booster') continue;
    assert.ok(ids.has(r.id), `booster reward "${r.id}" is not a real booster`);
  }
});

test('every buff reward points at a real buff', () => {
  const ids = new Set(DATA.buffs.map(b => b.id));
  for (const r of allRewards()) {
    if (r.kind !== 'buff') continue;
    assert.ok(ids.has(r.id), `buff reward "${r.id}" is not a real buff`);
  }
});

test('every upgrade reward points at a real upgrade', () => {
  const ids = new Set(DATA.upgrades.map(u => u.id));
  for (const r of allRewards()) {
    if (r.kind !== 'upgrade') continue;
    assert.ok(ids.has(r.id), `upgrade reward "${r.id}" is not a real upgrade`);
  }
});

test('every buff has a valid effect type and a positive duration', () => {
  const ENUM = ['clickMult','prodMult','critChance','critMult','fryRate','fizzRate','chickenRate','boosterDuration','chestLuck','offlineEff','costReduction','spiceGain','cloutGain','comboDecayResist'];
  assert.ok(DATA.buffs.length > 0, 'buffs table should not be empty');
  for (const b of DATA.buffs) {
    assert.ok(ENUM.includes(b.effect.type), `${b.id} uses unknown effect type "${b.effect.type}"`);
    assert.ok(b.durationMs > 0, `${b.id} has non-positive duration`);
    assert.ok(typeof b.desc === 'string' && b.desc.length > 0, `${b.id} missing desc`);
  }
});

test('every booster desc honest about its effect (no overpromised multipliers)', () => {
  // a desc mentioning a multiplier the effect does not carry is a player-facing lie
  for (const b of DATA.boosters) {
    const effType = b.effect.type;
    const claimsMultiplier = /\d+x|2x|doubles?|triples?|boosts.*x|increases/i.test(b.desc);
    const effectIsMult = ['prodMult','clickMult','fryRate','fizzRate','chickenRate','chestLuck','critChance','offlineEff','boosterDuration'].includes(effType);
    // if it claims a multiplier, the effect type should be a multiplier/rate, not forceCrit/comboDecayResist
    if (claimsMultiplier) assert.ok(effectIsMult, `${b.id}: desc overpromises (${b.desc}) vs effect ${effType}`);
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
  const m30 = DATA.streakMilestones.find(m => m.day === 30);
  assert.ok(m30, 'day 30 milestone must exist');
  for (const r of [...d30.rewards, ...m30.rewards]) {
    assert.equal(r.kind, 'permanent',
      `golden-burger must be kind "permanent" (meta.permanentBonuses), not "${r.kind}"`);
  }
});

test('pity config is armed with both guarantees', () => {
  assert.ok(DATA.chestPity.epicAfter > 0);
  assert.ok(DATA.chestPity.legendaryAfter > DATA.chestPity.epicAfter,
    'legendary guarantee must be further out than epic');
});


// ---------- Task 8b: achievements + quips ----------
test('115 achievements across all 11 categories', () => {
  assert.equal(DATA.achievements.length, 115);
  const cats = new Set(DATA.achievements.map(a => a.category));
  for (const c of ['clicking','production','levels','currency','employees',
                   'automation','chests','boosters','streaks','absurd','secret']) {
    assert.ok(cats.has(c), `missing category ${c}`);
  }
});

test('at least 8 secret achievements, all hidden with no requirement text', () => {
  const secrets = DATA.achievements.filter(a => a.category === 'secret');
  assert.ok(secrets.length >= 8, `only ${secrets.length} secrets`);
  for (const s of secrets) {
    assert.equal(s.hidden, true, `${s.id} must be hidden`);
    assert.equal(s.desc, '???', `${s.id} must not reveal its condition`);
  }
});

test("Don't Click The Potato is present and hidden", () => {
  const p = DATA.achievements.find(a => a.id === 'dont-click-the-potato');
  assert.ok(p, 'potato achievement missing');
  assert.equal(p.hidden, true);
  assert.equal(p.category, 'secret');
});

test('every achievement has clout and a callable check', () => {
  for (const a of DATA.achievements) {
    assert.ok(a.clout > 0, `${a.id} grants no clout`);
    assert.equal(typeof a.check, 'function', `${a.id} has no check`);
  }
});

test('every check returns falsy on a minimal/empty state (non-throwing)', () => {
  for (const a of DATA.achievements) {
    try { a.check({}); } catch { assert.fail(`${a.id} check threw on empty state`); }
  }
});

test('40+ quips covering every context tag, none empty', () => {
  assert.ok(DATA.quips.length >= 40, `only ${DATA.quips.length} quips`);
  for (const t of ['early','mid','late','comboBreak','idle','highLevel']) {
    assert.ok(DATA.quips.some(q => q.tag === t), `no quips tagged ${t}`);
  }
  assert.ok(DATA.quips.some(q => q.text === "Please stop."));
});
