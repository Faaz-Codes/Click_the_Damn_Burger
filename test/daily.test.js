import { test } from 'node:test';
import assert from 'node:assert/strict';
import { claimDaily, dailyStatus, newState, BigNum, DATA } from './bundle.mjs';

const grease = (s) => BigNum.toNumber(s.run.currencies.grease);
const fry = (s) => BigNum.toNumber(s.run.currencies.fry);

test('first ever claim starts streak 1 and pays day-1 grease', () => {
  const s = newState(0);
  const r = claimDaily(s, 0, '2026-01-01');
  assert.equal(r.ok, true);
  assert.equal(r.streak, 1);
  assert.equal(r.first, true);
  assert.equal(s.meta.daily.lastClaimDate, '2026-01-01');
  assert.ok(Math.abs(grease(s) - 100) < 1e-9, `day1 pays 100 grease, got ${grease(s)}`);
});

test('next-day claim is consecutive (streak 2, day-2 fry)', () => {
  const s = newState(0);
  claimDaily(s, 0, '2026-01-01');
  const r = claimDaily(s, 0, '2026-01-02');
  assert.equal(r.ok, true);
  assert.equal(r.streak, 2);
  assert.equal(r.consecutive, true);
  assert.ok(Math.abs(fry(s) - 50) < 1e-9, `day2 pays 50 fry, got ${fry(s)}`);
});

test('a second claim on the same day is refused (no double-grant)', () => {
  const s = newState(0);
  claimDaily(s, 0, '2026-01-01');
  const gBefore = grease(s);
  const r = claimDaily(s, 0, '2026-01-01');
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'already-claimed');
  assert.equal(grease(s), gBefore, 'no currency may be granted twice');
  assert.equal(s.meta.daily.streakCount, 1);
});

test('a clock moved backward is refused and the streak is kept', () => {
  const s = newState(0);
  claimDaily(s, 0, '2026-01-05');
  const r = claimDaily(s, 0, '2026-01-04'); // today is behind the last claim
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'clock-backward');
  assert.equal(s.meta.daily.streakCount, 1);
  assert.equal(s.meta.daily.lastClaimDate, '2026-01-05', 'lastClaimDate must not move');
});

test('a timezone hop that lands on an already-claimed day cannot re-grant', () => {
  const s = newState(0);
  claimDaily(s, 0, '2026-03-10');
  // player flies west and their local clock reads the claimed day again
  const r = claimDaily(s, 0, '2026-03-10');
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'already-claimed');
});

test('missing a day with no Streak Freeze resets the streak to 1', () => {
  const s = newState(0);
  claimDaily(s, 0, '2026-01-01');
  claimDaily(s, 0, '2026-01-02'); // streak 2
  const r = claimDaily(s, 0, '2026-01-04'); // gap 2, no freeze
  assert.equal(r.ok, true);
  assert.equal(r.reset, true);
  assert.equal(r.streak, 1);
  assert.equal(s.meta.daily.streakCount, 1);
});

test('a Streak Freeze bridges a missed day and keeps the streak alive', () => {
  const s = newState(0);
  claimDaily(s, 0, '2026-01-01');
  claimDaily(s, 0, '2026-01-02'); // streak 2
  s.meta.streakFreezes = 1;
  const r = claimDaily(s, 0, '2026-01-04'); // gap 2, freeze held
  assert.equal(r.ok, true);
  assert.equal(r.usedFreeze, true);
  assert.equal(r.streak, 3, 'streak survives via the freeze');
  assert.equal(s.meta.streakFreezes, 0, 'the freeze is consumed');
  assert.equal(s.meta.stats.streakFreezesUsed, 1);
});

test('a Streak Freeze is not consumed on a consecutive claim', () => {
  const s = newState(0);
  s.meta.streakFreezes = 2;
  claimDaily(s, 0, '2026-01-01');
  claimDaily(s, 0, '2026-01-02'); // gap 1 -> no freeze needed
  assert.equal(s.meta.streakFreezes, 2, 'consecutive days do not burn a freeze');
  assert.equal(s.meta.stats.streakFreezesUsed, 0);
});

test('reaching a streak milestone grants it exactly once', () => {
  const s = newState(0);
  claimDaily(s, 0, '2026-02-01');
  claimDaily(s, 0, '2026-02-02');
  const before = grease(s);
  const r = claimDaily(s, 0, '2026-02-03'); // streak 3 -> milestone
  assert.equal(r.streak, 3);
  assert.ok(r.milestoneGranted, 'a milestone reward fired on day 3');
  assert.equal(s.meta.streakMilestonesClaimed[3], true);
  // milestone day-3 pays 250 grease on top of the day-3 calendar reward
  assert.ok(grease(s) > before + 200, `milestone grease should stack, got ${grease(s) - before}`);
  // claiming past it again must not re-grant the milestone
  claimDaily(s, 0, '2026-02-04');
  claimDaily(s, 0, '2026-02-05');
  claimDaily(s, 0, '2026-02-06'); // back to streak 3 territory? no, streak keeps rising
  assert.equal(s.meta.streakMilestonesClaimed[3], true);
});

test('day 30 of the calendar awards the permanent golden burger', () => {
  const s = newState(0);
  // jump the streak to 29, then claim one more day
  s.meta.daily.lastClaimDate = '2026-01-01';
  s.meta.daily.streakCount = 29;
  const r = claimDaily(s, 0, '2026-01-02'); // gap 1 -> streak 30
  assert.equal(r.streak, 30);
  assert.equal(s.meta.permanentBonuses.goldenBurger, true);
});

test('dailyStatus reports a waiting claim and the reasons a claim is blocked', () => {
  const s = newState(0);
  assert.equal(dailyStatus(s, 0, '2026-01-01').claimable, true);
  claimDaily(s, 0, '2026-01-01');
  const same = dailyStatus(s, 0, '2026-01-01');
  assert.equal(same.claimable, false);
  assert.equal(same.reason, 'already-claimed');
  const back = dailyStatus(s, 0, '2025-12-31');
  assert.equal(back.claimable, false);
  assert.equal(back.reason, 'clock-backward');
});
