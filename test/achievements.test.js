import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAchievements, unlockedAchievements, unlockedCount, isUnlocked, newState, BigNum, DATA } from './bundle.mjs';

const clout = (s) => BigNum.toNumber(s.meta.clout);

test('a flipped check unlocks the achievement and pays its clout once', () => {
  const s = newState(0);
  s.settings.crt = false; // keep the default-on "self-aware-crt" out of this test
  s.meta.stats.clicks = 1;
  const newly = evaluateAchievements(s);
  const ids = newly.map(a => a.id);
  assert.ok(ids.includes('first-contact'), 'first-contact (1 click) must unlock');
  assert.equal(isUnlocked(s, 'first-contact'), true);
  const firstContact = DATA.achievements.find(a => a.id === 'first-contact');
  assert.ok(Math.abs(clout(s) - firstContact.clout) < 1e-9, `paid ${firstContact.clout} clout, got ${clout(s)}`);
});

test('a second evaluation pays nothing and unlocks nothing new', () => {
  const s = newState(0);
  s.meta.stats.clicks = 1;
  evaluateAchievements(s);
  const cloutBefore = clout(s);
  const newly = evaluateAchievements(s);
  assert.equal(newly.length, 0, 'no achievement may be granted twice');
  assert.equal(clout(s), cloutBefore, 'clout must not increase on re-evaluation');
});

test('hidden achievements unlock and pay, but stay out of the visible list', () => {
  const s = newState(0);
  s.meta.stats.potatoClicked = 1; // triggers the hidden "Don't Click The Potato"
  const newly = evaluateAchievements(s);
  assert.ok(newly.some(a => a.id === 'dont-click-the-potato'), 'hidden achievement must unlock');
  assert.equal(isUnlocked(s, 'dont-click-the-potato'), true);
  const visible = unlockedAchievements(s).map(a => a.id);
  assert.ok(!visible.includes('dont-click-the-potato'), 'hidden achievements are not listed');
  // but they still count toward the tracker total
  assert.ok(unlockedCount(s) >= 1);
});

test('several achievements unlock in one pass and each pays once', () => {
  const s = newState(0);
  s.meta.stats.clicks = 12; // first-contact (1) and ten-down (10)
  const newly = evaluateAchievements(s);
  const ids = newly.map(a => a.id);
  assert.ok(ids.includes('first-contact'));
  assert.ok(ids.includes('ten-down'));
  const expected = DATA.achievements.filter(a => ids.includes(a.id)).reduce((sum, a) => sum + a.clout, 0);
  assert.ok(Math.abs(clout(s) - expected) < 1e-9, `expected ${expected} clout, got ${clout(s)}`);
});

test('a check that throws is treated as not-yet-met, never as a crash', () => {
  const s = newState(0);
  // No setup: every check must run without throwing even against a bare state.
  let threw = false;
  try { evaluateAchievements(s); } catch { threw = true; }
  assert.equal(threw, false, 'evaluation must be total over a fresh state');
});
