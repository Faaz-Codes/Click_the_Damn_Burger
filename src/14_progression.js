// Plan 2 · Task 4: Food-level progression. Lifetime Grease (run.lifetimeGreaseThisRun)
// decides the current food level. The food definitions carry a required lifetime to
// advance past them; crossing it advances s.run.foodLevel (capped at 50). Once the
// player is at THE OMNIFOOD, surplus lifetime past its threshold rolls into Omni
// Ascensions instead of ending the game.

function lifeVal(s) {
  const bn = s.run.lifetimeGreaseThisRun;
  if (!bn || typeof bn.m !== 'number') return 0;
  return BigNum.toNumber(bn);
}

function currentFood(s) {
  return DATA.foodLevels[Math.max(0, Math.min(s.run.foodLevel - 1, DATA.foodLevels.length - 1))];
}

// Returns true if the food level advanced on this call. Level ups are the
// moment the scene re-paints; the caller is responsible for that, and for
// granting any chest owed by a level-up milestone.
function tickProgression(s) {
  let advanced = false;
  const life = lifeVal(s);
  while (s.run.foodLevel < DATA.foodLevels.length) {
    const toBeat = DATA.foodLevels[s.run.foodLevel - 1];
    if (life >= toBeat.threshold) {
      s.run.foodLevel += 1;
      advanced = true;
    } else break;
  }
  if (s.run.foodLevel >= DATA.foodLevels.length) {
    const dok = DATA.foodLevels[DATA.foodLevels.length - 1].threshold;
    const oc = Math.max(0, Math.floor((life - dok) / dok) + 1);
    s.meta.stats.omniAscensions = Math.max(s.meta.stats.omniAscensions || 0, oc);
  }
  return advanced;
}

