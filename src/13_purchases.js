// Plan 2 · Task 3: Purchase actions. The only place the economy mutates the
// catalogue slices of state: { upgrades, employees, automation } and the
// currency that pays for them. Everything else reads what these write through
// Sel. Each buy returns { ok, changed? , reason? } and never throws — a failed
// affordability check is a normal result, not an exception.

function newBig(m, e) { return { m, e }; }

function automationTotalCost(s, id, count) {
  const a = DATA.automationById.get(id);
  if (!a) return null;
  let total = newBig(0, 0);
  const owned = (s.run.automation[id] || 0);
  for (let i = 0; i < count; i++) {
    const unit = BigNum.fromNumber(a.cost.amount);
    let p = BigNum.fromNumber(1);
    for (let g = 0; g < owned + i; g++) p = BigNum.mul(p, newBig(a.growth || 1, 0));
    total = BigNum.add(total, BigNum.mul(unit, p));
  }
  return { currency: a.cost.currency, amount: total };
}

const buy = {
  buyUpgrade(s, id) {
    const u = DATA.upgradeById.get(id);
    if (!u) return { ok: false, reason: `unknown upgrade "${id}"` };
    if (s.run.upgrades[id]) return { ok: false, reason: 'already owned' };
    if (u.levelReq && s.run.foodLevel < u.levelReq) return { ok: false, reason: `requires food level ${u.levelReq}, currently ${s.run.foodLevel}` };
    const missing = (u.requires || []).filter(r => !s.run.upgrades[r]);
    if (missing.length > 0) return { ok: false, reason: `missing prerequisites: ${missing.join(', ')}` };
    const cost = Sel.costOf(s, 'upgrade', id, 0);
    if (!Sel.canAfford(s, cost)) return { ok: false, reason: `not enough ${cost.currency}` };
    s.run.currencies[cost.currency] = BigNum.sub(s.run.currencies[cost.currency], cost.amount);
    s.run.upgrades[id] = true;
    return { ok: true, changed: { upgrade: id } };
  },

  buyEmployee(s, id, n = 1) {
    const e = DATA.employeeById.get(id);
    if (!e) return { ok: false, reason: `unknown employee "${id}"` };
    const unit = BigNum.fromNumber(e.cost.amount);
    let total = BigNum.fromNumber(0);
    for (let i = 0; i < n; i++) total = BigNum.add(total, unit);
    // (Employees are a fixed hire price; milestones ride the employee count.)
    if (!Sel.canAfford(s, { currency: e.cost.currency, amount: total })) return { ok: false, reason: `not enough ${e.cost.currency}` };
    s.run.currencies[e.cost.currency] = BigNum.sub(s.run.currencies[e.cost.currency], total);
    s.run.employees[id] = (s.run.employees[id] || 0) + n;
    return { ok: true, changed: { employee: id, n } };
  },

  buyAutomation(s, id, n = 1) {
    const a = DATA.automationById.get(id);
    if (!a) return { ok: false, reason: `unknown automation "${id}"` };
    const total = automationTotalCost(s, id, n);
    if (!Sel.canAfford(s, { currency: total.currency, amount: total.amount })) {
      return { ok: false, reason: `not enough ${total.currency}` };
    }
    s.run.currencies[total.currency] = BigNum.sub(s.run.currencies[total.currency], total.amount);
    s.run.automation[id] = (s.run.automation[id] || 0) + n;
    return { ok: true, changed: { automation: id, n } };
  },
};
