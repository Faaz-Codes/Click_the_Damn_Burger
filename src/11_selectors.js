// Plan 2 · Task 1: Selectors. Pure, read-only views of state used by every
// later system (systems, progression, chests, daily, achievements, purchases,
// the balance simulator) and by the Plan 4 UI. No selector mutates state.
//
// Effect-value convention (documented, single source of truth):
//   An upgrade/employee effect value `v` on a MULTIPLIER type (prodMult,
//   clickMult, fryRate, fizzRate, chickenRate, critMult) reads as a fractional
//   bonus in percent within one effect "category" (an upgrade tree, the whole
//   employee pool, or the active-booster set). Within a category they ADD in
//   percent, then the per-category factors MULTIPLY, so:
//        factor = product over category of ( 1 + sum_v / 100 )
//   An ADDITIVE stat type (critChance, boosterDuration, chestLuck, offlineEff,
//   costReduction, spiceGain, cloutGain, comboDecayResist) reads as a percent
//   bonus on its scalar base:
//        factor = 1 + sum_v / 100            (a single product, not per-category)
//
// Boosters in the active set act as a separate category but their values are
// treated as direct multipliers on production/clicking (×2 == ×2), see
// Sel.boosterProdFactor / Sel.boosterClickFactor. Their total is soft-capped
// by CONFIG.BOOSTER.softCap.

const MULT_TYPES = new Set(['prodMult','clickMult','fryRate','fizzRate','chickenRate','critMult']);
const ADD_TYPES = new Set(['critChance','boosterDuration','chestLuck','offlineEff','costReduction','spiceGain','cloutGain','comboDecayResist']);

// Collect every owned effect contribution by effect type, split by additive
// category for multiplier types.
function gather(s) {
  const perCategory = {}; // type -> { category -> sum }
  const additive = {};    // type -> totalFraction (sum of value)
  const foldType = { has: false };
  for (const id of Object.keys(s.run.upgrades || {})) {
    const u = DATA.upgradeById.get(id);
    if (!u || !u.effect) continue;
    if (MULT_TYPES.has(u.effect.type)) {
      perCategory[u.effect.type] = perCategory[u.effect.type] || {};
      perCategory[u.effect.type][u.tree] = (perCategory[u.effect.type][u.tree] || 0) + u.effect.value;
    } else if (ADD_TYPES.has(u.effect.type)) {
      additive[u.effect.type] = (additive[u.effect.type] || 0) + u.effect.value;
    }
  }
  for (const id of Object.keys(s.run.employees || {})) {
    const emp = DATA.employeeById.get(id);
    const count = s.run.employees[id] || 0;
    if (!emp || !emp.effect || count <= 0) continue;
    // An employee's effect is a flat bonus for owning that
    // type, applied once. The per-count scaling lives in the
    // milestone track (CONFIG.MILESTONES.employee), which
    // already multiplies that worker's flat rate at 25/50/
    // 100/200 owned. Stacking the effect per hire would let
    // a few thousand workers multiply the entire economy
    // without bound, which collapses the pacing curve.
    if (MULT_TYPES.has(emp.effect.type)) {
      perCategory[emp.effect.type] = perCategory[emp.effect.type] || {};
      perCategory[emp.effect.type].employee = (perCategory[emp.effect.type].employee || 0) + emp.effect.value;
    } else if (ADD_TYPES.has(emp.effect.type)) {
      additive[emp.effect.type] = (additive[emp.effect.type] || 0) + emp.effect.value;
    }
  }
  return { perCategory, additive };
}

function factorOfType(perCategory, type) {
  const byCat = perCategory[type];
  if (!byCat) return 1;
  let product = 1;
  for (const cat of Object.keys(byCat)) {
    product *= (1 + byCat[cat] / 100);
  }
  return product;
}

function additiveFactor(additive, type) {
  return 1 + (additive[type] || 0) / 100;
}

function activeBoosters(s) {
  // A booster counts only until its expiry. The runtime prunes on each
  // tick (see expireBoosters); this filter is the defensive backstop so
  // a stale entry can never inflate production between ticks.
  const now = (s.timestamps && s.timestamps.lastSeen) || 0;
  return (s.run.activeBoosters || []).filter(b => b.expiresAt === undefined || b.expiresAt > now);
}

function boosterOfType(s, type) {
  let product = 1;
  for (const b of activeBoosters(s)) {
    const def = DATA.boosters.find(x => x.id === b.id);
    if (!def || !def.effect || def.effect.type !== type) continue;
    const v = typeof def.effect.value === 'number' ? def.effect.value : 1;
    product *= v;
  }
  if (product > CONFIG.BOOSTER.softCap) product = CONFIG.BOOSTER.softCap;
  return product;
}

function employeeMilestoneFactor(count) {
  let m = 1;
  const tiers = CONFIG.MILESTONES.employee;
  for (const threshold of [25, 50, 100, 200]) {
    if (count >= threshold && tiers[threshold]) m *= tiers[threshold];
  }
  return m;
}

function comboMultiplier(s) {
  const count = (s.run.combo && s.run.combo.count) || 0;
  let v = 1;
  for (const t of CONFIG.COMBO.tiers) if (count >= t.at) v = t.v;
  return v;
}

const Sel = {
  // The full 14-slot effect map. Multiplier types are composite factors
  // (multiplicative across categories, additive within); additive types are a
  // single percent-of-base bonus factor.
  effects(s) {
    const { perCategory, additive } = gather(s);
    const out = {};
    for (const t of MULT_TYPES) out[t] = factorOfType(perCategory, t);
    for (const t of ADD_TYPES) out[t] = additiveFactor(additive, t);
    out.forceCrit = activeBoosters(s).some(b => {
      const d = DATA.boosters.find(x => x.id === b.id);
      return d && d.effect && d.effect.type === 'forceCrit';
    });
    return out;
  },

  boosterProdFactor(s) { return boosterOfType(s, 'prodMult'); },
  boosterClickFactor(s) { return boosterOfType(s, 'clickMult'); },

  permanentFactor(s) {
    return s.meta && s.meta.permanentBonuses && s.meta.permanentBonuses.goldenBurger ? 2 : 1;
  },

  prodMult(s) {
    const eff = Sel.effects(s);
    return eff.prodMult * Sel.boosterProdFactor(s) * Sel.permanentFactor(s);
  },
  clickMult(s) {
    return Sel.effects(s).clickMult * Sel.boosterClickFactor(s);
  },
  comboMult(s) { return comboMultiplier(s); },

  // Effective crit inputs (used by the click action)
  critChance(s) { return CONFIG.CRIT_CHANCE_BASE * Sel.effects(s).critChance; },
  critMult(s)   { return Sel.effects(s).critMult * CONFIG.CRIT.multCritical; },

  // Production tree contributions (per-category for Fry/Fizz/Chicken)
  fryRateMult(s)    { return Sel.effects(s).fryRate; },
  fizzRateMult(s)   { return Sel.effects(s).fizzRate; },
  chickenRateMult(s){ return Sel.effects(s).chickenRate; },

  // Task 2 production math lives below. clickCore is bootstrapped first so
  // automation multiplies it without a circular dependency on greasePerSec.
};

function big(n) { return { m: n, e: 0 }; }

function _mul(a, b) {
  return BigNum.mul(a, b);
}

// Auto-click grease: automation rate is clicks/sec; each click yields clickCore.
function autoGrease(s, clickCoreBn) {
  let total = big(0);
  for (const id of Object.keys(s.run.automation || {})) {
    const a = DATA.automationById.get(id);
    const count = s.run.automation[id] || 0;
    if (!a || count <= 0) continue;
    total = BigNum.add(total, BigNum.mul(big(a.rate * count), clickCoreBn));
  }
  return total;
}

// Employee grease: flat rate per worker, scaled by how many thresholds that
// worker crosses. Multiplier employees' effects are already in Sel.effects.
function empGrease(s) {
  let total = big(0);
  for (const id of Object.keys(s.run.employees || {})) {
    const e = DATA.employeeById.get(id);
    const count = s.run.employees[id] || 0;
    if (!e || count <= 0) continue;
    total = BigNum.add(total, BigNum.mul(big(e.rate * count), big(employeeMilestoneFactor(count))));
  }
  return total;
}

Sel.clickCore = function (s) {
  // Click power stripped of the production link, so automation interacts with
  // it without a circular dependency (spec §6).
  return BigNum.mul(big(CONFIG.CLICK_BASE), big(Sel.clickMult(s)));
};

Sel.greasePerSec = function (s) {
  const clickCore = Sel.clickCore(s);
  const autos = autoGrease(s, clickCore);
  const emps = empGrease(s);
  const base = BigNum.add(autos, emps);
  return BigNum.mul(base, big(Sel.prodMult(s)));
};

Sel.clickPower = function (s) {
  // Per-tap gain (before crits). Scales with production so clicking stays
  // relevant late (spec §6, §5.5).
  const linked = BigNum.mul(big(CONFIG.LINK_RATE), Sel.greasePerSec(s));
  const base = BigNum.add(big(CONFIG.CLICK_BASE), linked);
  return BigNum.mul(base, BigNum.mul(big(Sel.clickMult(s)), big(Sel.comboMult(s))));
};

Sel.fryPerSec    = function (s) { return BigNum.mul(Sel.greasePerSec(s), big(CONFIG.LINK2 * Sel.fryRateMult(s))); };
Sel.fizzPerSec   = function (s) { return BigNum.mul(Sel.greasePerSec(s), big(CONFIG.LINK2 * Sel.fizzRateMult(s))); };
Sel.chickenPerSec= function (s) { return BigNum.mul(Sel.greasePerSec(s), big(CONFIG.LINK2 * Sel.chickenRateMult(s))); };

Sel.costOf = function (s, kind, id, count) {
  // The cost of the next `count` units of a repeatable purchase
  // (employee or automation), starting from `count` already
  // owned: baseCost * growth^count. Upgrades are a one-time
  // fixed price.
  let item;
  if (kind === 'employee') item = DATA.employeeById.get(id);
  else if (kind === 'automation') item = DATA.automationById.get(id);
  else if (kind === 'upgrade') item = DATA.upgradeById.get(id);
  if (!item) return null;
  if (kind === 'employee' || kind === 'automation') {
    const growth = item.growth || 1;
    let cost = BigNum.fromNumber(item.cost.amount);
    for (let i = 0; i < count; i++) cost = BigNum.mul(cost, big(growth));
    return { currency: item.cost.currency, amount: cost };
  }
  return { currency: item.cost.currency, amount: BigNum.fromNumber(item.cost.amount) };
};

Sel.canAfford = function (s, cost) {
  if (!cost) return false;
  const bal = s.run.currencies[cost.currency];
  if (!bal) return false;
  return BigNum.cmp(bal, cost.amount) >= 0;
};
