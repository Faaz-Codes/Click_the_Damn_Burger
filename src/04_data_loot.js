// Loot data (Task 8a) - boosters, chests, pity, dailies - extend DATA from 01_data_core.js
//
// Reward `kind` values used across chestTables, dailyCalendar and streakMilestones:
//   currency  -> adds to a DATA.currencies balance
//   booster   -> a DATA.boosters inventory item
//   buff      -> a DATA.buffs entry (temporary buff)
//   upgrade   -> a DATA.upgrades entry
//   permanent -> writes to meta.permanentBonuses (the Golden Burger's +100%
//                global production that survives prestige) - it is NOT a
//                currency balance and must never be added to one. A later
//                systems layer consumes permanent rewards.
Object.assign(DATA, {
  // 13 boosters
  boosters: [
    {
      id: 'grease-spray',
      name: 'Grease Spray',
      rarity: 'common',
      durationMs: 60000,
      effect: { type: 'prodMult', value: 2 },
      desc: 'Doubles production for 60 seconds.',
      flavorText: 'Slippery profits ahead.'
    },
    {
      id: 'warm-hands',
      name: 'Warm Hands',
      rarity: 'common',
      durationMs: 45000,
      effect: { type: 'clickMult', value: 2 },
      desc: 'Doubles clicks for 45 seconds.',
      flavorText: 'Gloves are for rookies.'
    },
    {
      id: 'butter-fingers',
      name: 'Butter Fingers',
      rarity: 'uncommon',
      durationMs: 60000,
      effect: { type: 'critChance', value: 0.3 },
      desc: 'Increases crit chance by 30% for 60 seconds.',
      flavorText: 'Oops. That helped.'
    },
    {
      id: 'burger-time',
      name: 'Burger Time',
      rarity: 'rare',
      durationMs: 20000,
      effect: { type: 'forceCrit', value: true },
      desc: 'Every click is a crit for 20 seconds.',
      flavorText: 'Time to get serious.'
    },
    {
      id: 'double-time',
      name: 'Double Time',
      rarity: 'uncommon',
      durationMs: 90000,
      effect: { type: 'comboDecayResist', value: 1 },
      desc: 'Resists combo decay for 90 seconds.',
      flavorText: 'Shift just got longer.'
    },
    {
      id: 'fry-daddy',
      name: 'Fry Daddy',
      rarity: 'uncommon',
      durationMs: 120000,
      effect: { type: 'fryRate', value: 5 },
      desc: 'Boosts fry production 5x for 2 minutes.',
      flavorText: 'Oil\'s hot. Time to fry.'
    },
    {
      id: 'fizz-frenzy',
      name: 'Fizz Frenzy',
      rarity: 'uncommon',
      durationMs: 120000,
      effect: { type: 'fizzRate', value: 5 },
      desc: 'Boosts fizz production 5x for 2 minutes.',
      flavorText: 'Carbonation unleashed.'
    },
    {
      id: 'nugget-storm',
      name: 'Nugget Storm',
      rarity: 'rare',
      durationMs: 180000,
      effect: { type: 'chestLuck', value: 3 },
      desc: 'Greatly increases chest luck for 3 minutes.',
      flavorText: 'A golden hail of nuggets.'
    },
    {
      id: 'cluck-famous',
      name: 'Cluck Famous',
      rarity: 'uncommon',
      durationMs: 120000,
      effect: { type: 'chickenRate', value: 5 },
      desc: 'Boosts chicken production 5x for 2 minutes.',
      flavorText: 'Suddenly everyone knows your chicken.'
    },
    {
      id: 'spicy-time',
      name: 'Spicy Time',
      rarity: 'rare',
      durationMs: 30000,
      effect: { type: 'prodMult', value: 10 },
      desc: 'Massive production boost for 30 seconds, but your fingers feel the burn.',
      flavorText: 'Too spicy to slow down.'
    },
    {
      id: 'ocean-mode',
      name: 'Ocean Mode',
      rarity: 'epic',
      durationMs: 60000,
      effect: { type: 'prodMult', value: 25 },
      desc: 'Surges production 25x for 60 seconds.',
      flavorText: 'Go with the flow.'
    },
    {
      id: 'the-accountant-is-away',
      name: 'The Accountant Is Away',
      rarity: 'legendary',
      durationMs: 10000,
      effect: { type: 'prodMult', value: 100 },
      desc: 'When the accountant leaves, profits skyrocket 100x for 10 seconds.',
      flavorText: 'Free money. Quick.'
    },
    {
      id: 'eukaryotic',
      name: 'Eukaryotic',
      rarity: 'mythic',
      durationMs: 21600000,
      effect: { type: 'offlineEff', value: 2 },
      desc: 'Doubles offline efficiency for 6 hours.',
      flavorText: 'Cellular optimization at its finest.'
    }
  ],

  // 7 chest tiers
  chests: [
    { tier: 1, id: 'grease-bin', name: 'Grease Bin', rarity: 'common', sprite: 'chest_grease_bin' },
    { tier: 2, id: 'napkin-bundle', name: 'Napkin Bundle', rarity: 'uncommon', sprite: 'chest_napkin_bundle' },
    { tier: 3, id: 'sauce-packet-case', name: 'Sauce Packet Case', rarity: 'rare', sprite: 'chest_sauce_packet' },
    { tier: 4, id: 'supply-crate', name: 'Supply Crate', rarity: 'epic', sprite: 'chest_supply_crate' },
    { tier: 5, id: 'franchise-vault', name: 'Franchise Vault', rarity: 'legendary', sprite: 'chest_franchise_vault' },
    { tier: 6, id: 'anomaly-crate', name: 'Anomaly Crate', rarity: 'mythic', sprite: 'chest_anomaly_crate' },
    { tier: 7, id: 'redacted', name: '[REDACTED]', rarity: 'secret', sprite: 'chest_redacted' }
  ],

  // chest tables per tier
  chestTables: [
    {
      tier: 1,
      entries: [
        { weight: 70, kind: 'currency', id: 'grease', amount: 100 },
        { weight: 30, kind: 'booster', id: 'grease-spray', amount: 1 }
      ]
    },
    {
      tier: 2,
      entries: [
        { weight: 60, kind: 'currency', id: 'grease', amount: 500 },
        { weight: 25, kind: 'booster', id: 'warm-hands', amount: 1 },
        { weight: 15, kind: 'booster', id: 'butter-fingers', amount: 1 }
      ]
    },
    {
      tier: 3,
      entries: [
        { weight: 50, kind: 'currency', id: 'fry', amount: 250 },
        { weight: 30, kind: 'booster', id: 'burger-time', amount: 1 },
        { weight: 20, kind: 'booster', id: 'double-time', amount: 1 }
      ]
    },
    {
      tier: 4,
      entries: [
        { weight: 40, kind: 'currency', id: 'fizz', amount: 500 },
        { weight: 35, kind: 'booster', id: 'fry-daddy', amount: 1 },
        { weight: 25, kind: 'booster', id: 'fizz-frenzy', amount: 1 }
      ]
    },
    {
      tier: 5,
      entries: [
        { weight: 40, kind: 'currency', id: 'chicken', amount: 750 },
        { weight: 30, kind: 'booster', id: 'nugget-storm', amount: 1 },
        { weight: 20, kind: 'booster', id: 'cluck-famous', amount: 1 },
        { weight: 10, kind: 'buff', id: 'crit-chance-small', amount: 1 }
      ]
    },
    {
      tier: 6,
      entries: [
        { weight: 30, kind: 'currency', id: 'spice', amount: 1000 },
        { weight: 25, kind: 'booster', id: 'spicy-time', amount: 1 },
        { weight: 20, kind: 'booster', id: 'ocean-mode', amount: 1 },
        { weight: 15, kind: 'buff', id: 'prod-mult-medium', amount: 1 },
        { weight: 10, kind: 'upgrade', id: 'food_10', amount: 1 }
      ]
    },
    {
      tier: 7,
      entries: [
        { weight: 25, kind: 'currency', id: 'clout', amount: 5000 },
        { weight: 20, kind: 'booster', id: 'the-accountant-is-away', amount: 1 },
        { weight: 20, kind: 'booster', id: 'eukaryotic', amount: 1 },
        { weight: 15, kind: 'buff', id: 'prod-mult-large', amount: 1 },
        { weight: 10, kind: 'upgrade', id: 'fry_15', amount: 1 },
        { weight: 10, kind: 'buff', id: 'click-mult-large', amount: 1 }
      ]
    }
  ],

  // temporary buffs awarded via kind:'buff' chest/calendar/milestone rewards.
  // A kind:'buff' reward resolves into one of these; a missing id would break the chest.
  buffs: [
    { id: 'crit-chance-small', name: 'Lucky Crits', desc: 'Adds +15% crit chance for 5 minutes.', effect: { type: 'critChance', value: 0.15 }, durationMs: 300000 },
    { id: 'prod-mult-medium', name: 'Greased Up', desc: 'Doubles production for 10 minutes.', effect: { type: 'prodMult', value: 2 }, durationMs: 600000 },
    { id: 'prod-mult-large', name: 'Short Circuit', desc: 'Triples production for 10 minutes.', effect: { type: 'prodMult', value: 3 }, durationMs: 600000 },
    { id: 'click-mult-large', name: 'Turbo Hands', desc: 'Triples click power for 5 minutes.', effect: { type: 'clickMult', value: 3 }, durationMs: 300000 }
  ],

  // pity
  chestPity: {
    epicAfter: 10,
    legendaryAfter: 40,
    softener: 0.02
  },

  // daily calendar - 30 days
  dailyCalendar: [
    { day: 1, rewards: [{ kind: 'currency', id: 'grease', amount: 100 }] },
    { day: 2, rewards: [{ kind: 'currency', id: 'fry', amount: 50 }] },
    { day: 3, rewards: [{ kind: 'booster', id: 'grease-spray', amount: 1 }] },
    { day: 4, rewards: [{ kind: 'currency', id: 'fizz', amount: 50 }] },
    { day: 5, rewards: [{ kind: 'currency', id: 'chicken', amount: 25 }] },
    { day: 6, rewards: [{ kind: 'booster', id: 'warm-hands', amount: 1 }] },
    { day: 7, rewards: [{ kind: 'currency', id: 'grease', amount: 500 }] },
    { day: 8, rewards: [{ kind: 'booster', id: 'butter-fingers', amount: 1 }] },
    { day: 9, rewards: [{ kind: 'currency', id: 'fry', amount: 150 }] },
    { day: 10, rewards: [{ kind: 'currency', id: 'fizz', amount: 150 }] },
    { day: 11, rewards: [{ kind: 'booster', id: 'double-time', amount: 1 }] },
    { day: 12, rewards: [{ kind: 'currency', id: 'chicken', amount: 150 }] },
    { day: 13, rewards: [{ kind: 'currency', id: 'spice', amount: 50 }] },
    { day: 14, rewards: [{ kind: 'booster', id: 'fry-daddy', amount: 1 }] },
    { day: 15, rewards: [{ kind: 'currency', id: 'grease', amount: 2000 }] },
    { day: 16, rewards: [{ kind: 'booster', id: 'fizz-frenzy', amount: 1 }] },
    { day: 17, rewards: [{ kind: 'currency', id: 'fry', amount: 500 }] },
    { day: 18, rewards: [{ kind: 'currency', id: 'fizz', amount: 500 }] },
    { day: 19, rewards: [{ kind: 'booster', id: 'cluck-famous', amount: 1 }] },
    { day: 20, rewards: [{ kind: 'currency', id: 'chicken', amount: 500 }] },
    { day: 21, rewards: [{ kind: 'currency', id: 'spice', amount: 200 }] },
    { day: 22, rewards: [{ kind: 'booster', id: 'burger-time', amount: 1 }] },
    { day: 23, rewards: [{ kind: 'booster', id: 'nugget-storm', amount: 1 }] },
    { day: 24, rewards: [{ kind: 'currency', id: 'grease', amount: 10000 }] },
    { day: 25, rewards: [{ kind: 'booster', id: 'spicy-time', amount: 1 }] },
    { day: 26, rewards: [{ kind: 'booster', id: 'ocean-mode', amount: 1 }] },
    { day: 27, rewards: [{ kind: 'currency', id: 'clout', amount: 100 }] },
    { day: 28, rewards: [{ kind: 'currency', id: 'spice', amount: 500 }] },
    { day: 29, rewards: [{ kind: 'booster', id: 'the-accountant-is-away', amount: 1 }] },
    { day: 30, rewards: [{ kind: 'permanent', id: 'golden-burger', amount: 1 }] }
  ],

  // streak milestones - 7 entries
  streakMilestones: [
    { day: 3, rewards: [{ kind: 'currency', id: 'grease', amount: 250 }], label: 'Getting Started' },
    { day: 7, rewards: [{ kind: 'booster', id: 'warm-hands', amount: 1 }], label: 'One Week Streak' },
    { day: 14, rewards: [{ kind: 'booster', id: 'double-time', amount: 1 }], label: 'Two Week Streak' },
    { day: 30, rewards: [{ kind: 'permanent', id: 'golden-burger', amount: 1 }], label: 'One Month Streak' },
    { day: 50, rewards: [{ kind: 'booster', id: 'ocean-mode', amount: 1 }], label: 'Fifty Day Streak' },
    { day: 100, rewards: [{ kind: 'booster', id: 'the-accountant-is-away', amount: 1 }], label: 'Hundred Day Streak' },
    { day: 365, rewards: [{ kind: 'booster', id: 'eukaryotic', amount: 1 }], label: 'Year Streak' }
  ]
});

// ---- Task 8b: achievements (115) and quips (40+) ----
//
// Achievement `check(state)` functions are non-throwing readers of the spec §4
// state shape. Plan 2's systems layer maintains the stats counters these read;
// where a currency or ownership value is a BigNum, the comparison uses BigNum.
function sstat(s, name, dflt) {
  try { const v = s && s.meta && s.meta.stats ? s.meta.stats[name] : undefined; return typeof v === 'number' ? v : dflt; } catch { return dflt; }
}
function lifeGE(s, m, e) { try { return BigNum.cmp(s.run.lifetimeGreaseThisRun, { m, e }) >= 0; } catch { return false; } }
function rateGE(s, m, e) { try { return BigNum.cmp(s.meta.stats.greasePerSec, { m, e }) >= 0; } catch { return false; } }
function ccyGE(s, id, m, e) { try { return BigNum.cmp(s.run.currencies[id], { m, e }) >= 0; } catch { return false; } }
function cloutGE(s, n) { try { return BigNum.cmp(s.meta.clout, { m: n, e: 0 }) >= 0; } catch { return false; } }
function countIn(map, s) { try { return Object.values(s.run[map] || {}).reduce((a, b) => a + b, 0); } catch { return 0; } }
function maxIn(map, s) { try { return Object.values(s.run[map] || {}).reduce((m, v) => Math.max(m, v), 0); } catch { return 0; } }
function hasIn(map, s, id) { try { return (s.run[map][id] || 0) > 0; } catch { return false; } }
function level(s, n) { try { return s.run.foodLevel >= n; } catch { return false; } }
function metaVal(s, path) { try { const p = path.split('.'); let v = s; for (const k of p) v = v == null ? undefined : v[k]; return v; } catch { return undefined; } }

Object.assign(DATA, {
  achievements: [
    // ---- Clicking (14) ----
    { id: 'first-contact', name: 'First Contact', desc: 'Click the food once', category: 'clicking', clout: 1, hidden: false, check: (s) => sstat(s, 'clicks', 0) >= 1 },
    { id: 'ten-down', name: 'Ten Down', desc: '10 total clicks', category: 'clicking', clout: 1, hidden: false, check: (s) => sstat(s, 'clicks', 0) >= 10 },
    { id: 'carpal-tunnel-award', name: 'Carpal Tunnel Award', desc: '100 total clicks', category: 'clicking', clout: 2, hidden: false, check: (s) => sstat(s, 'clicks', 0) >= 100 },
    { id: 'speed-demon', name: 'Speed Demon', desc: '100 clicks in under 10 seconds', category: 'clicking', clout: 3, hidden: false, check: (s) => sstat(s, 'best10sClicks', 0) >= 100 },
    { id: 'critical-believer', name: 'Critical Believer', desc: '10 critical hits', category: 'clicking', clout: 2, hidden: false, check: (s) => sstat(s, 'crits', 0) >= 10 },
    { id: 'big-game-hunter', name: 'Big Game Hunter', desc: 'Land a MEGA crit', category: 'clicking', clout: 5, hidden: false, check: (s) => sstat(s, 'megas', 0) >= 1 },
    { id: 'chosen-one', name: 'Chosen One', desc: 'Trigger "THE [FOOD] HAS CHOSEN YOU"', category: 'clicking', clout: 10, hidden: false, check: (s) => sstat(s, 'jackpots', 0) >= 1 },
    { id: 'double-digits', name: 'Double Digits', desc: 'Reach a 10 combo', category: 'clicking', clout: 1, hidden: false, check: (s) => sstat(s, 'comboMax', 0) >= 10 },
    { id: 'twenty-five-below', name: 'Twenty-Five Below', desc: 'Reach a 25 combo', category: 'clicking', clout: 2, hidden: false, check: (s) => sstat(s, 'comboMax', 0) >= 25 },
    { id: 'hundred-club', name: 'Hundred Club', desc: 'Reach a 100 combo', category: 'clicking', clout: 4, hidden: false, check: (s) => sstat(s, 'comboMax', 0) >= 100 },
    { id: 'thousand-yard-combo', name: 'Thousand Yard Combo', desc: 'Reach a 1000 combo', category: 'clicking', clout: 10, hidden: false, check: (s) => sstat(s, 'comboMax', 0) >= 1000 },
    { id: 'self-aware', name: 'Self-Aware', desc: 'See "COMBO DESTROYED" 10 times', category: 'clicking', clout: 2, hidden: false, check: (s) => sstat(s, 'comboDestroyed', 0) >= 10 },
    { id: 'pacifist-protocol', name: 'Pacifist Protocol', desc: 'Reach level 10 without clicking once', category: 'clicking', clout: 8, hidden: false, check: (s) => level(s, 10) && sstat(s, 'clicks', 0) === 0 },
    { id: 'peak-human', name: 'Peak Human', desc: 'Reach combo x100', category: 'clicking', clout: 10, hidden: false, check: (s) => sstat(s, 'comboMax', 0) >= 100 },

    // ---- Production (10) ----
    { id: 'grease-earnings', name: 'Grease Earnings', desc: 'Earn 1,000 lifetime Grease', category: 'production', clout: 1, hidden: false, check: (s) => lifeGE(s, 1, 3) },
    { id: 'grease-eternity', name: 'Grease Eternity', desc: 'Earn 1e6 lifetime Grease', category: 'production', clout: 1, hidden: false, check: (s) => lifeGE(s, 1, 6) },
    { id: 'grease-overachiever', name: 'Grease Overachiever', desc: 'Earn 1e12 lifetime Grease', category: 'production', clout: 2, hidden: false, check: (s) => lifeGE(s, 1, 12) },
    { id: 'grease-incarnate', name: 'Grease Incarnate', desc: 'Earn 1e30 lifetime Grease', category: 'production', clout: 5, hidden: false, check: (s) => lifeGE(s, 1, 30) },
    { id: 'greased-lightning', name: 'Greased Lightning', desc: '1,000 Grease/sec', category: 'production', clout: 1, hidden: false, check: (s) => rateGE(s, 1, 3) },
    { id: 'industrialist', name: 'Industrialist', desc: '1e6 Grease/sec', category: 'production', clout: 2, hidden: false, check: (s) => rateGE(s, 1, 6) },
    { id: 'compound-interest', name: 'Compound Interest', desc: '1e12 Grease/sec', category: 'production', clout: 4, hidden: false, check: (s) => rateGE(s, 1, 12) },
    { id: 'overachiever', name: 'Overachiever', desc: 'Own 200 of a single machine', category: 'production', clout: 5, hidden: false, check: (s) => maxIn('automation', s) >= 200 },
    { id: 'wheels-on-the-cart', name: 'Wheels on the Cart', desc: 'First automation purchase', category: 'production', clout: 1, hidden: false, check: (s) => countIn('automation', s) >= 1 },
    { id: 'idling-away', name: 'Idling Away', desc: '1 hour of playtime', category: 'production', clout: 2, hidden: false, check: (s) => sstat(s, 'playtimeMs', 0) >= 3600000 },

    // ---- Food Levels (14) ----
    { id: 'eggselent-beginning', name: 'Eggselent Beginning', desc: 'Reach Level 2', category: 'levels', clout: 1, hidden: false, check: (s) => level(s, 2) },
    { id: 'toast-enthusiasm', name: 'Toast Enthusiasm', desc: 'Level 3', category: 'levels', clout: 1, hidden: false, check: (s) => level(s, 3) },
    { id: 'sandwich-syndrome', name: 'Sandwich Syndrome', desc: 'Level 4', category: 'levels', clout: 1, hidden: false, check: (s) => level(s, 4) },
    { id: 'hot-dog-handler', name: 'Hot Dog Handler', desc: 'Level 5', category: 'levels', clout: 1, hidden: false, check: (s) => level(s, 5) },
    { id: 'burger-acumen', name: 'Burger Acumen', desc: 'Level 6', category: 'levels', clout: 1, hidden: false, check: (s) => level(s, 6) },
    { id: 'fully-loaded', name: 'Fully Loaded', desc: 'Level 10', category: 'levels', clout: 2, hidden: false, check: (s) => level(s, 10) },
    { id: 'fry-cook', name: 'Fry Cook', desc: 'Level 11', category: 'levels', clout: 2, hidden: false, check: (s) => level(s, 11) },
    { id: 'restaurant-owner', name: 'Restaurant Owner', desc: 'Level 16', category: 'levels', clout: 2, hidden: false, check: (s) => level(s, 16) },
    { id: 'franchise-mogul', name: 'Franchise Mogul', desc: 'Level 21', category: 'levels', clout: 3, hidden: false, check: (s) => level(s, 21) },
    { id: 'industrial-food-magnate', name: 'Industrial Food Magnate', desc: 'Level 26', category: 'levels', clout: 3, hidden: false, check: (s) => level(s, 26) },
    { id: 'galactic-middle-management', name: 'Galactic Middle Management', desc: 'Level 36', category: 'levels', clout: 4, hidden: false, check: (s) => level(s, 36) },
    { id: 'reality-brick', name: 'Reality Brick', desc: 'Level 41', category: 'levels', clout: 5, hidden: false, check: (s) => level(s, 41) },
    { id: 'the-end', name: 'The End™', desc: 'Level 50', category: 'levels', clout: 10, hidden: false, check: (s) => level(s, 50) },
    { id: 'its-not-over', name: "It's Not Over", desc: 'Omni Ascension x1', category: 'levels', clout: 10, hidden: false, check: (s) => sstat(s, 'omniAscensions', 0) >= 1 },

    // ---- Currency (13) ----
    { id: 'first-payday', name: 'First Payday', desc: '100 Fry Bucks', category: 'currency', clout: 1, hidden: false, check: (s) => ccyGE(s, 'fry', 1, 2) },
    { id: 'fry-cookbook', name: 'Fry Cookbook', desc: '1e6 Fry Bucks', category: 'currency', clout: 2, hidden: false, check: (s) => ccyGE(s, 'fry', 1, 6) },
    { id: 'caught-with-my-fizz-down', name: 'Caught With My Fizz Down', desc: 'Unlock Fizz', category: 'currency', clout: 1, hidden: false, check: (s) => sstat(s, 'fizzUnlocked', 0) >= 1 },
    { id: 'ocean-problem', name: 'Ocean Problem', desc: 'Buy "The Ocean Is Now Soda"', category: 'currency', clout: 5, hidden: false, check: (s) => sstat(s, 'oceanSodaBought', 0) >= 1 },
    { id: 'certified-chicken-professional', name: 'Certified Chicken Professional', desc: 'Unlock Chicken Points', category: 'currency', clout: 1, hidden: false, check: (s) => sstat(s, 'chickenUnlocked', 0) >= 1 },
    { id: 'spicy-business', name: 'Spicy Business', desc: '1 Spice', category: 'currency', clout: 2, hidden: false, check: (s) => ccyGE(s, 'spice', 1, 0) },
    { id: 'empty-the-spice-cabinet', name: 'Empty The Spice Cabinet', desc: '1,000 Spice', category: 'currency', clout: 4, hidden: false, check: (s) => ccyGE(s, 'spice', 1, 3) },
    { id: 'influence-none', name: 'Influence: None', desc: '10 Clout', category: 'currency', clout: 1, hidden: false, check: (s) => cloutGE(s, 10) },
    { id: 'pyramid-scheme', name: 'Pyramid Scheme', desc: '100 Clout', category: 'currency', clout: 2, hidden: false, check: (s) => cloutGE(s, 100) },
    { id: 'corporate-ladder-climb', name: 'Corporate Ladder Climb', desc: '500 Clout', category: 'currency', clout: 3, hidden: false, check: (s) => cloutGE(s, 500) },
    { id: 'first-crime', name: 'First Crime', desc: '1 Food Crime', category: 'currency', clout: 10, hidden: false, check: (s) => ccyGE(s, 'crimes', 1, 0) },
    { id: 'organised-cuisine', name: 'Organised Cuisine', desc: '25 Food Crimes', category: 'currency', clout: 15, hidden: false, check: (s) => ccyGE(s, 'crimes', 2.5, 1) },
    { id: 'the-forbidden-menu', name: 'The Forbidden Menu', desc: 'Buy a Forbidden Menu upgrade', category: 'currency', clout: 20, hidden: false, check: (s) => sstat(s, 'forbiddenMenuBought', 0) >= 1 },

    // ---- Employees (12) ----
    { id: 'hireling', name: 'Hireling', desc: 'Hire 1 employee', category: 'employees', clout: 1, hidden: false, check: (s) => countIn('employees', s) >= 1 },
    { id: 'staffing-crisis', name: 'Staffing Crisis', desc: '10 employees', category: 'employees', clout: 1, hidden: false, check: (s) => countIn('employees', s) >= 10 },
    { id: 'whole-crew', name: 'Whole Crew', desc: '25 employees', category: 'employees', clout: 2, hidden: false, check: (s) => countIn('employees', s) >= 25 },
    { id: 'double-staffed', name: 'Double Staffed', desc: '50 employees', category: 'employees', clout: 3, hidden: false, check: (s) => countIn('employees', s) >= 50 },
    { id: 'menace-to-kitchen-uniforms', name: 'Menace to Kitchen Uniforms', desc: '100 employees', category: 'employees', clout: 4, hidden: false, check: (s) => countIn('employees', s) >= 100 },
    { id: 'running-out-of-employees', name: 'Running out of Employees', desc: '200 employees', category: 'employees', clout: 6, hidden: false, check: (s) => countIn('employees', s) >= 200 },
    { id: 'chefs-kiss', name: "Chef's Kiss", desc: 'Hire a Tier 3 employee', category: 'employees', clout: 2, hidden: false, check: (s) => sstat(s, 'tier3EmployeesHired', 0) >= 1 },
    { id: 'corporate-archetype', name: 'Corporate Archetype', desc: 'Hire Corporate Executive', category: 'employees', clout: 3, hidden: false, check: (s) => hasIn('employees', s, 'corporate_executive') },
    { id: 'burger-wizard', name: 'Burger Wizard', desc: 'Hire Burger Wizard', category: 'employees', clout: 5, hidden: false, check: (s) => hasIn('employees', s, 'burger_wizard') },
    { id: 'consulting-fees', name: 'Consulting Fees', desc: 'Hire Alien Consultant', category: 'employees', clout: 5, hidden: false, check: (s) => hasIn('employees', s, 'alien_consultant') },
    { id: 'the-champ', name: 'The Champ', desc: "Hire World's Greatest Chef", category: 'employees', clout: 8, hidden: false, check: (s) => hasIn('employees', s, 'worlds_greatest_chef') },
    { id: 'omnichef', name: 'OMNICHEF', desc: 'Hire The Omnichef', category: 'employees', clout: 20, hidden: false, check: (s) => hasIn('employees', s, 'the_omnichef') },

    // ---- Automation (10) ----
    { id: 'click-fixer', name: 'Click Fixer', desc: 'Buy Basic Clicker', category: 'automation', clout: 1, hidden: false, check: (s) => hasIn('automation', s, 'basic_clicker') },
    { id: 'robotic-workforce', name: 'Robotic Workforce', desc: '10 machines', category: 'automation', clout: 1, hidden: false, check: (s) => countIn('automation', s) >= 10 },
    { id: 'fully-automated', name: 'Fully Automated', desc: '100 machines', category: 'automation', clout: 3, hidden: false, check: (s) => countIn('automation', s) >= 100 },
    { id: 'skynet-but-food', name: 'Skynet, But Food', desc: 'Buy Robot Cook', category: 'automation', clout: 2, hidden: false, check: (s) => hasIn('automation', s, 'robot_cook') },
    { id: 'the-factory', name: 'The Factory', desc: 'Buy Food Factory', category: 'automation', clout: 3, hidden: false, check: (s) => hasIn('automation', s, 'food_factory') },
    { id: 'industrial-food-complex', name: 'Industrial Food Complex', desc: 'Buy Food Megafactory', category: 'automation', clout: 3, hidden: false, check: (s) => hasIn('automation', s, 'food_megafactory') },
    { id: 'city-planner', name: 'City Planner', desc: 'Buy Automated Food City', category: 'automation', clout: 4, hidden: false, check: (s) => hasIn('automation', s, 'automated_food_city') },
    { id: 'interplanetary-logistics', name: 'Interplanetary Logistics', desc: 'Buy Interplanetary Supply Chain', category: 'automation', clout: 5, hidden: false, check: (s) => hasIn('automation', s, 'interplanetary_supply_chain') },
    { id: 'galactic-scm', name: 'Galactic SCM', desc: 'Buy Galactic Food Network', category: 'automation', clout: 8, hidden: false, check: (s) => hasIn('automation', s, 'galactic_food_network') },
    { id: 'omniversal', name: 'Omniversal', desc: 'Buy Omniversal Kitchen', category: 'automation', clout: 20, hidden: false, check: (s) => hasIn('automation', s, 'omniversal_kitchen') },

    // ---- Chests (9) ----
    { id: 'unboxing', name: 'Unboxing', desc: 'Open 1 chest', category: 'chests', clout: 1, hidden: false, check: (s) => sstat(s, 'chestsOpened', 0) >= 1 },
    { id: 'chest-enthusiast', name: 'Chest Enthusiast', desc: '10 chests', category: 'chests', clout: 2, hidden: false, check: (s) => sstat(s, 'chestsOpened', 0) >= 10 },
    { id: 'dumpster-divers', name: 'Dumpster Divers', desc: '50 chests', category: 'chests', clout: 3, hidden: false, check: (s) => sstat(s, 'chestsOpened', 0) >= 50 },
    { id: 'professional-looter', name: 'Professional Looter', desc: '100 chests', category: 'chests', clout: 4, hidden: false, check: (s) => sstat(s, 'chestsOpened', 0) >= 100 },
    { id: 'pity-party', name: 'Pity Party', desc: 'Hit an Epic+ pity guarantee', category: 'chests', clout: 5, hidden: false, check: (s) => sstat(s, 'pityEpics', 0) >= 1 },
    { id: 'jackpot-fever', name: 'Jackpot Fever', desc: 'Open a Legendary', category: 'chests', clout: 10, hidden: false, check: (s) => sstat(s, 'chestsLegendary', 0) >= 1 },
    { id: 'the-good-stuff', name: 'THE GOOD STUFF', desc: 'Open a Mythic chest', category: 'chests', clout: 15, hidden: false, check: (s) => sstat(s, 'chestsMythic', 0) >= 1 },
    { id: 'forbidden-fruit', name: 'Forbidden Fruit', desc: 'Open a Secret chest', category: 'chests', clout: 25, hidden: false, check: (s) => sstat(s, 'chestsSecret', 0) >= 1 },
    { id: 'keymaster', name: 'Keymaster', desc: 'Buy a chest with Chicken Points', category: 'chests', clout: 2, hidden: false, check: (s) => sstat(s, 'chestsBoughtWithChicken', 0) >= 1 },

    // ---- Boosters (6) ----
    { id: 'adrenaline', name: 'Adrenaline', desc: 'Use your first booster', category: 'boosters', clout: 1, hidden: false, check: (s) => sstat(s, 'boostersActivated', 0) >= 1 },
    { id: 'chemically-enhanced', name: 'Chemically Enhanced', desc: 'Activate 10 boosters', category: 'boosters', clout: 2, hidden: false, check: (s) => sstat(s, 'boostersActivated', 0) >= 10 },
    { id: 'burger-time', name: 'Burger Time', desc: 'Activate Burger Time', category: 'boosters', clout: 5, hidden: false, check: (s) => sstat(s, 'burgerTimeActivated', 0) >= 1 },
    { id: 'cumulative', name: 'Cumulative', desc: 'Have 3 boosters active at once', category: 'boosters', clout: 3, hidden: false, check: (s) => ((s.run && s.run.activeBoosters) || []).length >= 3 },
    { id: 'buzzworthy', name: 'Buzzworthy', desc: 'Reach x100 combo while a combo booster is active', category: 'boosters', clout: 5, hidden: false, check: (s) => sstat(s, 'buzzworthyAt', 0) >= 100 },
    { id: 'just-add-water', name: 'Just Add Water', desc: 'Have a booster active for 30 cumulative minutes', category: 'boosters', clout: 4, hidden: false, check: (s) => sstat(s, 'boosterActiveMs', 0) >= 1800000 },

    // ---- Streaks (9) ----
    { id: 'regular', name: 'Regular', desc: '3-day streak', category: 'streaks', clout: 1, hidden: false, check: (s) => (metaVal(s, 'meta.streak.count') || 0) >= 3 },
    { id: 'week-notice', name: 'Week Notice', desc: '7-day streak', category: 'streaks', clout: 2, hidden: false, check: (s) => (metaVal(s, 'meta.streak.count') || 0) >= 7 },
    { id: 'fortnight-chef', name: 'Fortnight Chef', desc: '14-day streak', category: 'streaks', clout: 3, hidden: false, check: (s) => (metaVal(s, 'meta.streak.count') || 0) >= 14 },
    { id: 'golden-touch', name: 'Golden Touch', desc: '30-day streak (Golden Burger)', category: 'streaks', clout: 10, hidden: false, check: (s) => (metaVal(s, 'meta.streak.count') || 0) >= 30 },
    { id: 'half-century-of-consistency', name: 'Half Century of Consistency', desc: '50-day streak', category: 'streaks', clout: 8, hidden: false, check: (s) => (metaVal(s, 'meta.streak.count') || 0) >= 50 },
    { id: 'century-club', name: 'Century Club', desc: '100-day streak', category: 'streaks', clout: 12, hidden: false, check: (s) => (metaVal(s, 'meta.streak.count') || 0) >= 100 },
    { id: 'year-of-food', name: 'Year of Food', desc: '365-day streak', category: 'streaks', clout: 25, hidden: false, check: (s) => (metaVal(s, 'meta.streak.count') || 0) >= 365 },
    { id: 'frostbite', name: 'Frostbite', desc: 'Use a Streak Freeze', category: 'streaks', clout: 5, hidden: false, check: (s) => sstat(s, 'streakFreezesUsed', 0) >= 1 },
    { id: 'perfect-week', name: 'Perfect Week', desc: '7 claims with no missed day', category: 'streaks', clout: 4, hidden: false, check: (s) => sstat(s, 'perfectWeeks', 0) >= 1 },

    // ---- Absurd (8) ----
    { id: 'regret-button', name: 'Regret Button', desc: 'Reset a save', category: 'absurd', clout: 3, hidden: false, check: (s) => sstat(s, 'resets', 0) >= 1 },
    { id: 'speedrun-any', name: 'Speedrun ANY%', desc: 'Reach level 50 in under 3 hours', category: 'absurd', clout: 20, hidden: false, check: (s) => level(s, 50) && sstat(s, 'speedrunMs', Infinity) < 10800000 },
    { id: 'whale', name: 'Whale', desc: 'Spend 1e12 Grease in one purchase', category: 'absurd', clout: 8, hidden: false, check: (s) => sstat(s, 'biggestPurchaseE12', 0) >= 1 },
    { id: 'found-footage', name: 'Found Footage', desc: 'Import a save', category: 'absurd', clout: 5, hidden: false, check: (s) => sstat(s, 'imports', 0) >= 1 },
    { id: 'self-aware-crt', name: 'Self Aware', desc: 'Enable the CRT filter', category: 'absurd', clout: 1, hidden: false, check: (s) => metaVal(s, 'settings.crt') === true },
    { id: 'loud-and-proud', name: 'Loud and Proud', desc: 'Max the music volume', category: 'absurd', clout: 2, hidden: false, check: (s) => metaVal(s, 'settings.musicVol') === 100 },
    { id: 'chaos-theory', name: 'Chaos Theory', desc: 'Activate Spicy Time', category: 'absurd', clout: 3, hidden: false, check: (s) => sstat(s, 'spicyTimeActivated', 0) >= 1 },
    { id: 'its-not-even-food', name: "It's Not Even Food", desc: 'Reach level 50 and click the Omnifood 50 times', category: 'absurd', clout: 15, hidden: false, check: (s) => level(s, 50) && sstat(s, 'omnifoodClicks', 0) >= 50 },

    // ---- Secrets (10) ----
    { id: 'dont-click-the-potato', name: "Don't Click The Potato", desc: '???', category: 'secret', clout: 15, hidden: true, check: (s) => sstat(s, 'potatoClicked', 0) >= 1 },
    { id: 'there-is-no-spoon', name: 'There Is No Spoon', desc: '???', category: 'secret', clout: 10, hidden: true, check: (s) => sstat(s, 'counterClicks', 0) >= 25 },
    { id: 'behind-the-menu', name: 'Behind the Menu', desc: '???', category: 'secret', clout: 10, hidden: true, check: (s) => sstat(s, 'doorFound', 0) >= 1 },
    { id: 'the-fifth-wall', name: 'The Fifth Wall', desc: '???', category: 'secret', clout: 15, hidden: true, check: (s) => sstat(s, 'endBannerOmnifoodClicks', 0) >= 1 },
    { id: 'founded-it', name: 'Founded It', desc: '???', category: 'secret', clout: 20, hidden: true, check: (s) => maxIn('automation', s) >= 1000 },
    { id: 'meeting-room', name: 'Meeting Room', desc: '???', category: 'secret', clout: 15, hidden: true, check: (s) => sstat(s, 'chestTiersOpenedThisSession', 0) >= 7 },
    { id: 'the-accountant-69', name: 'The Accountant', desc: '???', category: 'secret', clout: 5, hidden: true, check: (s) => { try { const c = s.meta.clout; return c && c.m === 6.9 && c.e === 1; } catch { return false; } } },
    { id: 'off-the-books', name: 'Off The Books', desc: '???', category: 'secret', clout: 20, hidden: true, check: (s) => sstat(s, 'crimesWithoutCrit', 0) >= 1 },
    { id: 'closed-sign', name: 'Closed Sign', desc: '???', category: 'secret', clout: 10, hidden: true, check: (s) => sstat(s, 'boostersExpiredIdle', 0) >= 1 },
    { id: 'sound-design-award', name: 'Sound Design Award', desc: '???', category: 'secret', clout: 10, hidden: true, check: (s) => metaVal(s, 'settings.crt') === true && metaVal(s, 'settings.reducedMotion') === true && sstat(s, 'jackpotsWithCrtAndReducedMotion', 0) >= 1 }
  ],

  quips: [
    { text: 'Please stop.', tag: 'early' },
    { text: 'This seems economically irresponsible.', tag: 'early' },
    { text: 'The accountant is concerned.', tag: 'early' },
    { text: 'Please consider touching grass.', tag: 'early' },
    { text: 'I am unpaid and overcooked.', tag: 'early' },
    { text: 'Egg-cellent start, I guess.', tag: 'early' },
    { text: 'Toast would like to press charges.', tag: 'early' },
    { text: 'I have a family.', tag: 'early' },
    { text: 'The quarterly targets are aggressive.', tag: 'mid' },
    { text: 'We are a lifestyle brand now.', tag: 'mid' },
    { text: 'Have you tried synergy glaze?', tag: 'mid' },
    { text: 'My fries are unionised.', tag: 'mid' },
    { text: 'Fizz is up 400% this quarter.', tag: 'mid' },
    { text: 'The chicken does not approve.', tag: 'mid' },
    { text: 'We ran out of ethics again.', tag: 'mid' },
    { text: 'Shareholders want a quinoa IPO.', tag: 'mid' },
    { text: 'The secret sauce is legally aloe.', tag: 'mid' },
    { text: 'Every click is a labour practice.', tag: 'mid' },
    { text: 'Please blink twice if being held by a cornucopia.', tag: 'late' },
    { text: 'Our meat is a war crime with a loyalty programme.', tag: 'late' },
    { text: 'The pixels are edible. Mostly.', tag: 'late' },
    { text: 'I dream in the colours of a bad HOV lane.', tag: 'late' },
    { text: 'We have achieved flavour singularity.', tag: 'late' },
    { text: 'The taco stand has tenure now.', tag: 'late' },
    { text: 'Our antitrust regulator is a burrito.', tag: 'late' },
    { text: 'This level of grease should require a permit.', tag: 'late' },
    { text: 'COMBO DESTROYED. Weak.', tag: 'comboBreak' },
    { text: 'You had ONE combo bar.', tag: 'comboBreak' },
    { text: 'The grease gods demand better.', tag: 'comboBreak' },
    { text: 'Click harder, apparently.', tag: 'comboBreak' },
    { text: 'My grandmother could maintain that combo.', tag: 'comboBreak' },
    { text: 'The pause button respects you.', tag: 'idle' },
    { text: 'Still here? Go outside.', tag: 'idle' },
    { text: 'This idle survey has been outstanding for some time.', tag: 'idle' },
    { text: 'You are paying rent on a snack.', tag: 'idle' },
    { text: 'Tick tock, but for slower.', tag: 'idle' },
    { text: 'The grease hourglass is empty.', tag: 'idle' },
    { text: 'Produced consciousness. Still clicking? Impressive.', tag: 'highLevel' },
    { text: 'The Omnifood remembers every click.', tag: 'highLevel' },
    { text: 'We are the food now.', tag: 'highLevel' },
    { text: 'Reality is just an aggressive franchise agreement.', tag: 'highLevel' },
    { text: 'The kitchen has achieved orbit.', tag: 'highLevel' },
    { text: 'Your returns on investment are... eschatological.', tag: 'highLevel' }
  ]
});
