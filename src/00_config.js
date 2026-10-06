// The single source of every balance number, layout constant and colour in the
// game. Nothing outside this file may hard-code a cost, a rate or a hex value.
//
// SUFFIXES is the one part that is built rather than typed: short scale needs 101
// entries to reach 1e300 and a hand-typed list cannot be proofread. Entry i
// covers the decade 10^(3i); index 0 is the empty suffix for plain numbers.
const CONFIG = {
  // Design doc section 10.2. These 12 are the only colours the game may use.
  PALETTE: {
    ink: '#14101f',
    panel: '#241b3a',
    'panel-hi': '#33264f',
    grease: '#ffc83d',
    ketchup: '#e8433a',
    mustard: '#f5a623',
    lettuce: '#5ed36b',
    soda: '#3fc1ff',
    cream: '#fff4d6',
    mute: '#9d8fc0',
    gold: '#ffe27a',
    purple: '#b266ff'
  },

  TEXT_SCALE: [100, 125, 150],
  LOCATIONS: 10,
  MAX_FLASHES_PER_SEC: 3,
  CONFIRM_THRESHOLD: 1e12,
  NOTATION_JOKES: [
    { at: 1e60, text: 'YOUR CALCULATOR HAS GIVEN UP' },
    { at: 1e100, text: 'SCIENTIFIC NOTATION ENABLED' },
    { at: 1e200, text: 'NUMBERS ARE NO LONGER MEANINGFUL' }
  ],

  THRESHOLD_BASE: 150,
  THRESHOLD_GROWTH: 3.1,
  CLICK_BASE: 1,
  LINK_RATE: 0.02, // share of greasePerSec added to click power
  LINK2: 0.0004, // share of greasePerSec feeding each secondary currency
  MILESTONES: {
    employee: { 25: 2, 50: 2, 100: 2, 200: 2 },
    automation: { 25: 2, 50: 2, 100: 2, 200: 2 }
  },
  CRIT: {
    normal: 0.9479,
    critical: 0.05,
    mega: 0.002,
    jackpot: 0.0001,
    multCritical: 10,
    multMega: 100,
    multJackpot: 10000
  },
  COMBO: {
    decayMs: 1500,
    tiers: [
      { at: 10, v: 1.10 },
      { at: 25, v: 1.25 },
      { at: 50, v: 1.50 },
      { at: 100, v: 2 },
      { at: 500, v: 10 },
      { at: 1000, v: 100 }
    ]
  },
  BOOSTER: { maxActive: 4, softCap: 1000 },
  OFFLINE: { maxHours: 8, efficiency: 0.5 },
  AUTOSAVE_MS: 15000,
  CRIT_CHANCE_BASE: 0.05,

  SUFFIXES: (function () {
    // The familiar names for the first ten decades, then the Conway-Guy scheme:
    // a unit prefix (UDTQaQiSxSpOcNo) in front of the -illion group it belongs to
    // (Dc 1e33, Vg 1e63, Tg 1e93, ...). Ten units per group, ten groups total.
    const COMMON = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];
    const UNITS = ['', 'U', 'D', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];
    const GROUPS = ['', 'Dc', 'Vg', 'Tg', 'Qag', 'Qig', 'Sxg', 'Spg', 'Ocg', 'Nog'];
    const suffixes = [''];
    for (let tier = 1; tier <= 100; tier++) {
      if (tier < COMMON.length) {
        suffixes.push(COMMON[tier]);
      } else {
        const group = Math.floor((tier - 1) / UNITS.length); // 1 = decillions
        const unit = (tier - 1) % UNITS.length;
        suffixes.push(UNITS[unit] + GROUPS[group]);
      }
    }
    return suffixes;
  })()
};