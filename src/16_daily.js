// Plan 2 · Task 6: Daily rewards and streak aging.
//
// A claim is keyed on the player's own calendar day (dkey, local time).
// The decision table, driven by the signed gap between the last claimed
// day and today:
//
//   last === null            -> first ever claim, streak becomes 1
//   last === today           -> refuse (no double-grant)
//   gap <= 0                 -> refuse (clock moved backward / a timezone
//                               hop landed the player back on a past day)
//   gap === 1                -> consecutive: streak + 1
//   gap > 1, freeze held     -> consume a Streak Freeze, streak + 1
//   gap > 1, no freeze       -> streak resets to 1
//
// The todayKey parameter is a seam for tests: production passes nothing
// and reads dkey(now); tests pass an explicit 'YYYY-MM-DD' so the logic
// is deterministic on any machine timezone.

function applyReward(state, r) {
  if (r.kind === 'currency') {
    if (r.id === 'clout') {
      // Clout is a meta currency, not a run currency.
      state.meta.clout = BigNum.add(state.meta.clout, BigNum.fromNumber(r.amount));
    } else {
      const cur = state.run.currencies[r.id] || { m: 0, e: 0 };
      state.run.currencies[r.id] = BigNum.add(cur, BigNum.fromNumber(r.amount));
    }
  } else if (r.kind === 'booster') {
    state.meta.boosterInventory[r.id] = (state.meta.boosterInventory[r.id] || 0) + r.amount;
  } else if (r.kind === 'permanent') {
    if (r.id === 'golden-burger') state.meta.permanentBonuses.goldenBurger = true;
  }
  return r;
}

function grantDaily(state, today, streak, meta) {
  // The calendar runs 30 days; past that the last entry repeats, and its
  // permanent reward is idempotent (already granted).
  const day = Math.min(Math.max(streak, 1), DATA.dailyCalendar.length);
  const entry = DATA.dailyCalendar[day - 1];
  const granted = entry ? entry.rewards.map(r => applyReward(state, r)) : [];

  // Streak milestones fire once per exact streak value, ever.
  let milestoneGranted = null;
  const milestone = DATA.streakMilestones.find(m => m.day === streak);
  if (milestone && !state.meta.streakMilestonesClaimed[milestone.day]) {
    state.meta.streakMilestonesClaimed[milestone.day] = true;
    milestoneGranted = milestone.rewards.map(r => applyReward(state, r));
  }

  state.meta.daily.lastClaimDate = today;
  state.meta.daily.streakCount = streak;
  state.meta.streak.count = streak;
  if (streak > state.meta.streak.best) state.meta.streak.best = streak;
  return { ok: true, streak, granted, milestoneGranted, ...meta };
}

function claimDaily(state, now = Date.now(), todayKey) {
  const today = todayKey || dkey(now);
  const last = state.meta.daily.lastClaimDate;

  if (last === null) return grantDaily(state, today, 1, { first: true });
  if (last === today) {
    return { ok: false, reason: 'already-claimed', streak: state.meta.daily.streakCount };
  }

  const gap = daysBetween(last, today);
  if (!Number.isFinite(gap)) return { ok: false, reason: 'bad-date', streak: state.meta.daily.streakCount };
  if (gap <= 0) {
    // The clock rolled back, or a timezone hop put the player back on a
    // day they already claimed. Never re-grant.
    return { ok: false, reason: 'clock-backward', streak: state.meta.daily.streakCount };
  }
  if (gap === 1) {
    return grantDaily(state, today, state.meta.daily.streakCount + 1, { consecutive: true });
  }

  // gap > 1: the player missed days. A Streak Freeze bridges exactly one
  // missed day, keeping the streak alive; without one it resets.
  if ((state.meta.streakFreezes || 0) > 0) {
    state.meta.streakFreezes -= 1;
    state.meta.stats.streakFreezesUsed = (state.meta.stats.streakFreezesUsed || 0) + 1;
    return grantDaily(state, today, state.meta.daily.streakCount + 1, { usedFreeze: true });
  }
  return grantDaily(state, today, 1, { reset: true });
}

// Read-only view for the UI: is there a claim waiting, and why not?
function dailyStatus(state, now = Date.now(), todayKey) {
  const today = todayKey || dkey(now);
  const last = state.meta.daily.lastClaimDate;
  if (last === null) return { claimable: true, streak: state.meta.daily.streakCount };
  if (last === today) return { claimable: false, reason: 'already-claimed', streak: state.meta.daily.streakCount };
  const gap = daysBetween(last, today);
  if (!Number.isFinite(gap) || gap <= 0) {
    return { claimable: false, reason: 'clock-backward', streak: state.meta.daily.streakCount };
  }
  if (gap === 1) return { claimable: true, streak: state.meta.daily.streakCount + 1 };
  return { claimable: true, streak: 1, reason: (state.meta.streakFreezes || 0) > 0 ? 'freeze-available' : 'streak-will-reset' };
}
