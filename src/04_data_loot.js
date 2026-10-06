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
      desc: 'Doubles click power and resists combo decay for 90 seconds.',
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
