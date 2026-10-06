// Plan 2 · Task 9: Balance simulator.
//
// A greedy "cheapest-payback-first, spend-all" bot plays the
// game headlessly: it clicks at a fixed active-play rate,
// collects the resulting Grease (idle production plus its own
// taps), and buys the affordable purchase with the shortest
// payback -- cost divided by the marginal Grease/sec it adds
// -- in bulk, then re-evaluates. It records when each food
// level is reached; checkPacing compares that curve against
// the design §6.3 active-play table. This is the module that
// retires the economy risk: the numbers are tuned until the
// curve lands inside the table's tolerance, and the test
// fails loudly if it drifts.
//
// Performance: the per-second rates are computed once per
// purchase pass (not once per candidate), purchases are made
// in bulk, and the tick widens as the game slows (1s for the
// first ten minutes where the pacing is tight, up to 60s in
// the multi-hour endgame where a second of resolution buys
// nothing).

const SIM = {
  clickRate: 5,            // active-play clicks per second
  maxSeconds: 20 * 3600,   // 20h hard cap
};

// §6.3 active-play pacing table, in seconds. `tol` is the
// [lower, upper] multiplier around the target that still counts
// as on-pace; level 50 is the 8-10h window, so it gets a
// tighter band.
//
// `soft` marks a row the simulator is known to miss. The
// "first upgrade" (10s, on a ~10-Grease starter) and "first
// automation" (2min) targets both imply ~1 click/sec of early
// clicking, yet "level 2" (30s, 150 Grease) needs ~5 clicks/
// sec -- no constant click rate satisfies both, so the level
// curve (the spec's "real constraint", which the simulator
// does hit at 5 clicks/sec) is prioritised and these two are
// reported as explicit mismatches rather than failed, exactly
// as §6.3 instructs ("the mismatch is reported explicitly
// rather than silently shipped").
const PACING = [
  { label: 'first upgrade',    get: (h) => h.firstUpgradeAt,    at: 10,   tol: [0.5, 2], soft: true },
  { label: 'level 2',          get: (h) => h.levelAt[2],        at: 30,   tol: [0.5, 2] },
  { label: 'first automation', get: (h) => h.firstAutomationAt, at: 120,  tol: [0.5, 2], soft: true },
  { label: 'level 5',          get: (h) => h.levelAt[5],        at: 240,  tol: [0.5, 2] },
  { label: 'level 10',         get: (h) => h.levelAt[10],       at: 720,  tol: [0.5, 2] },
  { label: 'level 25',         get: (h) => h.levelAt[25],       at: 5400, tol: [0.5, 2] },
  { label: 'level 50',         get: (h) => h.levelAt[50],       at: 32400,tol: [0.8, 1.25] },
];

function toNum(bn) { return BigNum.toNumber(bn); }

// Adaptive tick: fine early, coarse late.
function tickSize(t) {
  if (t < 600) return 1;     // first 10 minutes: 1s
  if (t < 3600) return 5;    // first hour: 5s
  return 60;                 // endgame: 1 minute
}

function milestoneFactor(count) {
  let m = 1;
  const tiers = CONFIG.MILESTONES.employee;
  for (const t of [25, 50, 100, 200]) if (count >= t && tiers[t]) m *= tiers[t];
  return m;
}

// The marginal Grease/sec a candidate adds, as a plain
// number. `rates` carries the once-per-pass figures.
//
// Every marginal is the TRUE grease/sec gained:
//   - a machine (automation or employee) produces
//     rate * clickCore * prodMult -- its flat rate, run
//     through the click core and the production multiplier;
//   - a prodMult upgrade amplifies the *base* production
//     (the part prodMult already multiplies), so its
//     marginal is base * v, NOT gps * v -- using gps
//     would overstate the gain by a factor of prodMult and
//     make late upgrades look millions of times better than
//     they are;
//   - a clickMult upgrade raises click income, whose gain
//     scales as v / clickMult (the click multiplier is an
//     additive category, so one more unit divides into it).
function marginalRate(rates, kind, def, ownedCount) {
  if (kind === 'employee') {
    return def.rate * milestoneFactor(ownedCount + 1) * rates.prodMult;
  }
  if (kind === 'automation') {
    return def.rate * rates.core * rates.prodMult;
  }
  const v = def.effect.value / 100;
  switch (def.effect.type) {
    case 'prodMult': return Math.max(rates.base * v, 1e-9);
    case 'clickMult':
      return Math.max(rates.clickRate * rates.clickPow * v / Math.max(rates.clickMult, 1e-9), 1e-9);
    case 'critMult':
    case 'critChance':
      return Math.max(rates.clickRate * rates.clickPow * v * 0.15 / Math.max(rates.clickMult, 1e-9), 1e-9);
    default: return 1e-9; // secondary-currency effects: negligible grease payback
  }
}

// The affordable purchase with the shortest payback, or null.
// `rates` is computed once here and shared by every candidate.
function nextPurchase(state, clickRate) {
  const rates = {
    clickRate,
    clickPow: toNum(Sel.clickPower(state)),
    gps: toNum(Sel.greasePerSec(state)),
    core: toNum(Sel.clickCore(state)),
    // Sel.clickMult / Sel.prodMult are plain-number
    // factors, not BigNums -- do not run them through
    // toNum (which expects {m,e}); doing so yields NaN
    // and silently drops every candidate from the race.
    prodMult: Sel.prodMult(state),
    clickMult: Sel.clickMult(state),
  };
  // The base production a prodMult upgrade amplifies:
  // gps with the current multiplier factored back out.
  rates.base = rates.prodMult > 0 ? rates.gps / rates.prodMult : rates.gps;
  let best = null;
  const consider = (kind, def, ownedCount, unitCost, growth) => {
    const cost = BigNum.fromNumber(unitCost);
    if (!Sel.canAfford(state, { currency: def.cost.currency, amount: cost })) return;
    const marginal = marginalRate(rates, kind, def, ownedCount);
    if (!(marginal > 0)) return;
    const payback = unitCost / marginal;
    if (!best || payback < best.payback) {
      best = { kind, id: def.id, currency: def.cost.currency, unitCost, growth: growth || 1, owned: ownedCount, payback };
    }
  };
  for (const u of DATA.upgrades) {
    if (state.run.upgrades[u.id]) continue;
    if (u.levelReq && state.run.foodLevel < u.levelReq) continue;
    if ((u.requires || []).some(r => !state.run.upgrades[r])) continue;
    consider('upgrade', u, 0, u.cost.amount, 1);
  }
  for (const e of DATA.employees) {
    const owned = state.run.employees[e.id] || 0;
    consider('employee', e, owned, e.cost.amount * Math.pow(e.growth || 1, owned), e.growth || 1);
  }
  for (const a of DATA.automation) {
    const owned = state.run.automation[a.id] || 0;
    consider('automation', a, owned, a.cost.amount * Math.pow(a.growth || 1, owned), a.growth || 1);
  }
  return best;
}

// How many automation units a budget buys starting at `owned`,
// given the per-unit cost grows by `growth` each purchase:
//   base * growth^owned * (growth^n - 1) / (growth - 1) <= budget
function maxAutomation(base, growth, owned, budget) {
  const unit0 = base * Math.pow(growth, owned);
  if (unit0 > budget) return 0;
  if (growth <= 1) return Math.floor(budget / unit0);
  const ratio = (budget / unit0) * (growth - 1) + 1;
  const n = Math.floor(Math.log(ratio) / Math.log(growth));
  return Math.max(1, n);
}

function simulate(opts = {}) {
  const clickRate = opts.clickRate != null ? opts.clickRate : SIM.clickRate;
  const maxSeconds = opts.maxSeconds != null ? opts.maxSeconds : SIM.maxSeconds;

  const state = newState(0);
  const hist = {
    seconds: 0, firstUpgradeAt: null, firstAutomationAt: null,
    firstEmployeeAt: null, levelAt: { 1: 0 }, purchases: 0, units: 0,
  };

  let t = 0;
  while (t < maxSeconds && state.run.foodLevel < 50) {
    const dt = tickSize(t);
    // income over this tick: idle production plus the player's taps.
    // The bot clicks at a steady rate but does NOT sustain a
    // combo: combo is a burst mechanic that decays in 1.5s, so
    // no real player holds a high tier across a multi-hour run.
    // Modelled this way the active-play column lands at the
    // design's ~1.6x idle ratio rather than 60x.
    const idle = Sel.greasePerSec(state);
    const clickPow = Sel.clickPower(state);
    const income = BigNum.add(
      BigNum.mul(idle, { m: dt, e: 0 }),
      BigNum.mul(clickPow, { m: clickRate * dt, e: 0 })
    );
    state.run.currencies.grease = BigNum.add(state.run.currencies.grease, income);
    state.run.lifetimeGreaseThisRun = BigNum.add(state.run.lifetimeGreaseThisRun, income);
    state.meta.stats.greasePerSec = idle;

    const prevLevel = state.run.foodLevel;
    tickProgression(state);
    // Record every level crossed this tick, even when a
    // single tick jumps several levels at once.
    for (let lv = prevLevel + 1; lv <= state.run.foodLevel; lv++) {
      if (hist.levelAt[lv] === undefined) hist.levelAt[lv] = t;
    }

    // spend everything, cheapest payback first, in bulk
    let guard = 0;
    while (guard++ < 200) {
      const pick = nextPurchase(state, clickRate);
      if (!pick) break;
      const budget = toNum(state.run.currencies[pick.currency]);
      let n = 1;
      let totalCost = pick.unitCost;
      if (pick.kind === 'employee' || pick.kind === 'automation') {
        // bulk-buy the geometric series: base * growth^owned *
        // (growth^n - 1) / (growth - 1) <= budget
        const base = pick.unitCost / Math.pow(pick.growth, pick.owned);
        n = maxAutomation(base, pick.growth, pick.owned, budget);
        if (n < 1) n = 1;
        totalCost = pick.unitCost * (Math.pow(pick.growth, n) - 1) / (pick.growth - 1);
      }
      const costBn = BigNum.fromNumber(totalCost);
      if (!Sel.canAfford(state, { currency: pick.currency, amount: costBn })) {
        // bulk estimate overshot (float rounding): fall back to one
        n = 1;
        totalCost = pick.kind === 'automation' ? pick.unitCost : pick.unitCost;
        if (!Sel.canAfford(state, { currency: pick.currency, amount: BigNum.fromNumber(totalCost) })) break;
      }
      state.run.currencies[pick.currency] = BigNum.sub(state.run.currencies[pick.currency], BigNum.fromNumber(totalCost));
      if (pick.kind === 'upgrade') {
        state.run.upgrades[pick.id] = true;
        if (hist.firstUpgradeAt === null) hist.firstUpgradeAt = t;
      } else if (pick.kind === 'employee') {
        state.run.employees[pick.id] = (state.run.employees[pick.id] || 0) + n;
        if (hist.firstEmployeeAt === null) hist.firstEmployeeAt = t;
      } else {
        state.run.automation[pick.id] = (state.run.automation[pick.id] || 0) + n;
        if (hist.firstAutomationAt === null) hist.firstAutomationAt = t;
      }
      hist.purchases += 1;
      hist.units += n;
    }

    if (opts.onTick) opts.onTick(t, state, hist);

    t += dt;
  }
  hist.seconds = t;
  return { state, hist };
}

// Compare a run's curve against the §6.3 table.
function checkPacing(hist) {
  const rows = PACING.map(row => {
    const reached = row.get(hist);
    const pass = reached != null &&
      reached >= row.at * row.tol[0] &&
      reached <= row.at * row.tol[1];
    return { label: row.label, target: row.at, reached, pass, soft: !!row.soft };
  });
  // Soft rows are reported mismatches (see the PACING
  // comment): they are shown but do not fail the run.
  return { rows, pass: rows.every(r => r.pass || r.soft) };
}

function fmtTime(sec) {
  if (sec == null) return '—';
  if (sec < 60) return `${Math.round(sec)}s`;
  if (sec < 3600) return `${(sec / 60).toFixed(1)}m`;
  return `${(sec / 3600).toFixed(2)}h`;
}

// A printable table for the console / the failing test message.
function pacingReport(hist) {
  const { rows, pass } = checkPacing(hist);
  const lines = rows.map(r => {
    const got = r.reached == null ? 'never' : fmtTime(r.reached);
    const tag = r.pass ? 'ok' : (r.soft ? 'off (reported)' : 'OFF');
    return `${r.label.padEnd(18)} target ${fmtTime(r.target).padStart(8)}   reached ${got.padStart(8)}   ${tag}`;
  });
  lines.push(pass ? 'PACING: PASS' : 'PACING: FAIL');
  return lines.join('\n');
}
