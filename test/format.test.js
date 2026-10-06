import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fmt, CONFIG, BigNum } from './bundle.mjs';

test('formats below 1000 as plain integers', () => {
  assert.equal(fmt.num(BigNum.fromNumber(0)), '0');
  assert.equal(fmt.num(BigNum.fromNumber(7)), '7');
  assert.equal(fmt.num(BigNum.fromNumber(999)), '999');
});

test('uses 2-3 significant decimals with suffixes', () => {
  assert.equal(fmt.num(BigNum.fromString('1.54e4')), '15.4K');
  assert.equal(fmt.num(BigNum.fromString('2.80e6')), '2.80M');
  assert.equal(fmt.num(BigNum.fromString('1e9')), '1.00B');
});

test('every suffix boundary renders correctly', () => {
  for (let i = 1; i < CONFIG.SUFFIXES.length; i++) {
    const s = CONFIG.SUFFIXES[i];
    assert.equal(fmt.num(BigNum.fromString(`1e${i * 3}`)), `1.00${s}`,
      `boundary 1e${i * 3} should render as 1.00${s}`);
  }
});

test('scientific notation renders exponents', () => {
  fmt.setNotation('scientific');
  assert.match(fmt.num(BigNum.fromString('1.234e18')), /^1\.234e\+?18$/);
  fmt.setNotation('standard');
});

test('engineering notation uses exponents divisible by three', () => {
  fmt.setNotation('engineering');
  assert.match(fmt.num(BigNum.fromString('1.234e20')), /e\+?21$/);
  fmt.setNotation('standard');
});

test('CONFIG.SUFFIXES covers to 1e303', () => {
  assert.equal(CONFIG.SUFFIXES.length, 101);
  assert.equal(CONFIG.SUFFIXES[0], '');
  assert.equal(CONFIG.SUFFIXES[1], 'K');
  assert.equal(CONFIG.SUFFIXES[2], 'M');
});

test('formatting surface exists and is callable', () => {
  assert.equal(typeof CONFIG.SUFFIXES, 'object');
  assert.equal(typeof fmt.num, 'function');
  assert.equal(typeof fmt.setNotation, 'function');
  assert.equal(typeof fmt.notation, 'string');
});

test('CONFIG defines every key the design requires', () => {
  const keys = [
    'PALETTE', 'TEXT_SCALE', 'LOCATIONS', 'MAX_FLASHES_PER_SEC', 'CONFIRM_THRESHOLD',
    'NOTATION_JOKES', 'SUFFIXES', 'THRESHOLD_BASE', 'THRESHOLD_GROWTH', 'CLICK_BASE',
    'LINK_RATE', 'LINK2', 'MILESTONES', 'CRIT', 'COMBO', 'BOOSTER', 'OFFLINE',
    'AUTOSAVE_MS', 'CRIT_CHANCE_BASE'
  ];
  for (const key of keys) {
    assert.notEqual(CONFIG[key], undefined, `CONFIG.${key} must be defined`);
  }
  assert.deepEqual(CONFIG.TEXT_SCALE, [100, 125, 150]);
  assert.equal(CONFIG.LOCATIONS, 10);
});

test('CONFIG pins the balance numbers from the design spec', () => {
  assert.equal(CONFIG.THRESHOLD_BASE, 150);
  assert.equal(CONFIG.THRESHOLD_GROWTH, 3.1);
  assert.equal(CONFIG.CLICK_BASE, 1);
  assert.equal(CONFIG.LINK_RATE, 0.02);
  assert.equal(CONFIG.LINK2, 0.0004);
  assert.equal(CONFIG.MILESTONES.employee[25], 2);
  assert.equal(CONFIG.MILESTONES.automation[200], 2);
  assert.equal(CONFIG.CRIT.normal, 0.9479);
  assert.equal(CONFIG.CRIT.critical, 0.05);
  assert.equal(CONFIG.CRIT.mega, 0.002);
  assert.equal(CONFIG.CRIT.jackpot, 0.0001);
  assert.equal(CONFIG.CRIT.multCritical, 10);
  assert.equal(CONFIG.CRIT.multMega, 100);
  assert.equal(CONFIG.CRIT.multJackpot, 10000);
  assert.equal(CONFIG.COMBO.decayMs, 1500);
  assert.deepEqual(CONFIG.COMBO.tiers, [
    { at: 10, v: 1.10 }, { at: 25, v: 1.25 }, { at: 50, v: 1.50 },
    { at: 100, v: 2 }, { at: 500, v: 10 }, { at: 1000, v: 100 }
  ]);
  assert.deepEqual(CONFIG.BOOSTER, { maxActive: 4, softCap: 1000 });
  assert.deepEqual(CONFIG.OFFLINE, { maxHours: 8, efficiency: 0.5 });
  assert.equal(CONFIG.AUTOSAVE_MS, 15000);
  assert.equal(CONFIG.CRIT_CHANCE_BASE, 0.05);
  assert.equal(CONFIG.MAX_FLASHES_PER_SEC, 3);
  assert.equal(CONFIG.CONFIRM_THRESHOLD, 1e12);
  assert.deepEqual(CONFIG.NOTATION_JOKES, [
    { at: 1e60, text: 'YOUR CALCULATOR HAS GIVEN UP' },
    { at: 1e100, text: 'SCIENTIFIC NOTATION ENABLED' },
    { at: 1e200, text: 'NUMBERS ARE NO LONGER MEANINGFUL' }
  ]);
});

test('CONFIG.PALETTE holds exactly the twelve permitted colours', () => {
  assert.deepEqual(CONFIG.PALETTE, {
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
  });
});

test('every suffix is distinct, so no two tiers read alike', () => {
  const seen = new Set(CONFIG.SUFFIXES);
  assert.equal(seen.size, CONFIG.SUFFIXES.length);
  for (const s of CONFIG.SUFFIXES.slice(1)) {
    assert.ok(s.length > 0, 'no suffix beyond index 0 may be empty');
  }
});

test('rounding up to a tier boundary does not leak a mantissa of 10 or 1000', () => {
  // 9,999 must not print as 10.00K: the 1-decimal tier takes over.
  assert.equal(fmt.num(BigNum.fromString('9.999e3')), '10.0K');
  // 999,999 must not print as 1000K: the value belongs to the next tier.
  assert.equal(fmt.num(BigNum.fromString('9.99999e5')), '1.00M');
});

test('the top suffix renders its own decade', () => {
  assert.equal(fmt.num(BigNum.fromString('9.99e302')), `999${CONFIG.SUFFIXES[100]}`);
});

test('beyond the last suffix standard notation falls back to scientific', () => {
  assert.match(fmt.num(BigNum.fromString('1e303')), /^1\.000e303$/);
});

test('an explicit decimals override is honoured', () => {
  assert.equal(fmt.num(BigNum.fromString('1.54e4'), { decimals: 2 }), '15.40K');
  assert.equal(fmt.num(BigNum.fromString('2.8e6'), { decimals: 0 }), '3M');
});