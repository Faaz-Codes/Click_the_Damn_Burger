// Plan 2 · Task 8: The actions barrel. Everything a player can do
// that mutates state funnels through here: the click itself, the
// three buy paths, chests, dailies, boosters, and save I/O. The
// per-frame housekeeping (booster expiry, level progression,
// achievement evaluation, playtime) lives in tick().

// ---- The click ------------------------------------------------------------

// click(state, now, rand) -> { gain, tier, combo }. One tap of the
// food. Click power comes from Sel (it already folds in the
// production link, click multipliers and the combo tier). A crit
// roll then scales the gain; the crit tier's base multiplier is
// raised further by any critMult upgrades.
function click(state, now = Date.now(), rand = Math.random) {
  const combo = state.run.combo;
  if (combo.lastClickAt && (now - combo.lastClickAt) <= CONFIG.COMBO.decayMs) {
    combo.count += 1;
  } else {
    combo.count = 1;
  }
  combo.lastClickAt = now;
  if (combo.count > state.meta.stats.comboMax) state.meta.stats.comboMax = combo.count;

  const power = Sel.clickPower(state);
  const critFactor = Sel.effects(state).critMult;
  const c = CONFIG.CRIT;
  const roll = rand();

  let tier = 'normal';
  let tierMult = 1;
  if (Sel.effects(state).forceCrit) {
    tier = 'critical';
    tierMult = c.multCritical * critFactor;
  } else if (roll < c.jackpot) {
    tier = 'jackpot';
    tierMult = c.multJackpot * critFactor;
  } else if (roll < c.jackpot + c.mega) {
    tier = 'mega';
    tierMult = c.multMega * critFactor;
  } else if (roll < c.jackpot + c.mega + c.critical) {
    tier = 'critical';
    tierMult = c.multCritical * critFactor;
  }

  const gain = BigNum.mul(power, { m: tierMult, e: 0 });
  state.run.currencies.grease = BigNum.add(state.run.currencies.grease, gain);
  state.run.lifetimeGreaseThisRun = BigNum.add(state.run.lifetimeGreaseThisRun, gain);

  state.meta.stats.clicks += 1;
  if (tier === 'critical') state.meta.stats.crits += 1;
  if (tier === 'mega') state.meta.stats.megas += 1;
  if (tier === 'jackpot') state.meta.stats.jackpots += 1;

  return { gain, tier, combo: combo.count };
}

// ---- Boosters -------------------------------------------------------------

// Drop every booster whose expiry has passed. Called from tick() so
// the selectors (which are pure) only ever see live boosters.
function expireBoosters(state, now = Date.now()) {
  const live = (state.run.activeBoosters || []).filter(
    b => b.expiresAt === undefined || b.expiresAt > now
  );
  const removed = (state.run.activeBoosters || []).length - live.length;
  state.run.activeBoosters = live;
  return removed;
}

// useBooster(state, id, now) -> { ok, id?, reason?, refreshed? }.
// Moves one unit from the inventory into the active set (or refreshes
// an already-active booster's timer). Respect the max-active cap.
function useBooster(state, id, now = Date.now()) {
  const def = DATA.boosters.find(b => b.id === id);
  if (!def) return { ok: false, reason: `unknown booster "${id}"` };
  const inv = state.meta.boosterInventory[id] || 0;
  if (inv <= 0) return { ok: false, reason: 'not in inventory' };
  const existing = (state.run.activeBoosters || []).find(b => b.id === id);
  if (existing) {
    existing.startedAt = now;
    existing.expiresAt = now + def.durationMs;
    return { ok: true, id, refreshed: true };
  }
  const activeCount = (state.run.activeBoosters || []).length;
  if (activeCount >= CONFIG.BOOSTER.maxActive) {
    return { ok: false, reason: `booster limit reached (${CONFIG.BOOSTER.maxActive})` };
  }
  state.meta.boosterInventory[id] = inv - 1;
  state.run.activeBoosters.push({ id, startedAt: now, expiresAt: now + def.durationMs });
  state.meta.stats.boostersActivated = (state.meta.stats.boostersActivated || 0) + 1;
  return { ok: true, id };
}

// ---- The frame tick -------------------------------------------------------

// tick(state, now): per-frame housekeeping. Accumulates playtime,
// expires boosters, advances the food level, and evaluates
// achievements. Safe to call every frame.
function tick(state, now = Date.now()) {
  const prev = (typeof state.timestamps.lastSeen === 'number') ? state.timestamps.lastSeen : now;
  if (now > prev) state.meta.stats.playtimeMs += now - prev;
  state.timestamps.lastSeen = now;
  expireBoosters(state, now);
  tickProgression(state);
  evaluateAchievements(state);
  return state;
}

// ---- The barrel -----------------------------------------------------------

const Actions = {
  click,
  buyUpgrade: (s, id) => buy.buyUpgrade(s, id),
  buyEmployee: (s, id, n) => buy.buyEmployee(s, id, n),
  buyAutomation: (s, id, n) => buy.buyAutomation(s, id, n),
  openChest: (s, tier, rand) => openChest(s, tier, rand),
  claimDaily: (s, now, todayKey) => claimDaily(s, now, todayKey),
  useBooster,
  expireBoosters,
  tick,
  importSave,
  exportSave,
  saveGame,
  loadGame,
  resetSave: () => newState(),
};
