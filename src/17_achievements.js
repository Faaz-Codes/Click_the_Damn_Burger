// Plan 2 · Task 7: Achievement evaluation. Each achievement carries a
// `check(state)` predicate written against the stats counters the
// systems layer maintains. The evaluator walks all of them, unlocks
// any whose check flips true, pays its clout once, and never pays
// twice. Hidden achievements unlock and pay like any other -- they
// are merely withheld from the visible list the UI renders.

function evaluateAchievements(state) {
  const newly = [];
  for (const a of DATA.achievements) {
    if (state.meta.achievements[a.id]) continue; // already unlocked, never re-paid
    let ok = false;
    try { ok = a.check(state) === true; } catch { ok = false; }
    if (ok) {
      state.meta.achievements[a.id] = true;
      newly.push(a);
      if (a.clout) state.meta.clout = BigNum.add(state.meta.clout, BigNum.fromNumber(a.clout));
    }
  }
  return newly;
}

// The achievements the UI may show: unlocked and not hidden.
function unlockedAchievements(state) {
  return DATA.achievements.filter(a => state.meta.achievements[a.id] && !a.hidden);
}

// The full unlocked count, hidden included (the "x / 115" tracker).
function unlockedCount(state) {
  let n = 0;
  for (const a of DATA.achievements) if (state.meta.achievements[a.id]) n += 1;
  return n;
}

function isUnlocked(state, id) {
  return state.meta.achievements[id] === true;
}
