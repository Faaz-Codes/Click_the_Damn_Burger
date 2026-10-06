// Cross-table data validator. Runs over the DATA tables and returns a list of
// human-readable problems; an empty list means the data is valid. build.js calls
// this and fails the build on any non-empty result, so a typo in a data file is
// caught at build time rather than shipping as a permanently greyed-out button.
//
// Designed to document the spec contract:
//   - every id is unique within its table
//   - every effect.type is one the systems layer knows how to apply
//   - every cost has a positive amount and a real currency
//   - every levelReq is reachable (1..50)
//   - every food's locationId maps to a real location that covers it
//   - every reward kind is one of the five the game actually grants
//   - every booster / buff / upgrade / currency reward id resolves to a real entry
//   - the requires graph never loops
//
// The last two are where data typos turn into broken rewards: a dangling id
// means a chest pays out nothing, and a requires cycle would lock an upgrade.

const EFFECT_TYPES = new Set(['clickMult', 'prodMult', 'critChance', 'critMult', 'fryRate', 'fizzRate', 'chickenRate', 'boosterDuration', 'chestLuck', 'offlineEff', 'costReduction', 'spiceGain', 'cloutGain', 'comboDecayResist', 'forceCrit']);
const REWARD_KINDS = new Set(['currency', 'booster', 'buff', 'upgrade', 'permanent']);

function pushUnique(errors, items, tableName, keyer) {
  const seen = new Set();
  for (const item of items) {
    const id = keyer(item);
    if (id === undefined || id === null) continue;
    if (seen.has(id)) errors.push(`${tableName}: duplicate id "${id}"`);
    seen.add(id);
  }
}

function validateTables(data) {
  const D = data || (typeof DATA !== 'undefined' ? DATA : null);
  if (!D) return ['DATA is not defined'];
  const errors = [];

  // --- unique ids everywhere ---
  pushUnique(errors, D.currencies, 'currencies', c => c.id);
  pushUnique(errors, D.foodLevels, 'foodLevels', f => f.id);
  pushUnique(errors, D.locations, 'locations', l => l.id);
  pushUnique(errors, D.upgrades, 'upgrades', u => u.id);
  pushUnique(errors, D.employees, 'employees', e => e.id);
  pushUnique(errors, D.automation, 'automation', a => a.id);
  pushUnique(errors, D.boosters, 'boosters', b => b.id);
  pushUnique(errors, D.chests, 'chests', c => c.id);
  pushUnique(errors, D.buffs, 'buffs', b => b.id);
  pushUnique(errors, D.achievements, 'achievements', a => a.id);

  // --- upgrade fields + graph ---
  const upgradeIds = new Set(D.upgrades.map(u => u.id));
  for (const u of D.upgrades) {
    if (typeof u.name !== 'string' || !u.name) errors.push(`upgrade ${u.id}: missing name`);
    if (typeof u.desc !== 'string' || !u.desc) errors.push(`upgrade ${u.id}: missing desc`);
    if (!u.cost || !(u.cost.amount > 0)) errors.push(`upgrade ${u.id}: non-positive or missing cost.amount (${u.cost && u.cost.amount})`);
    const cur = u.cost && u.cost.currency;
    if (!D.currencies.some(c => c.id === cur)) errors.push(`upgrade ${u.id}: unknown cost.currency "${cur}"`);
    if (!u.effect || !EFFECT_TYPES.has(u.effect.type)) errors.push(`upgrade ${u.id}: unknown effect.type "${u.effect && u.effect.type}"`);
    if (typeof u.effect.value !== 'number') errors.push(`upgrade ${u.id}: effect.value is not a number`);
    if (!Number.isInteger(u.levelReq) || u.levelReq < 1 || u.levelReq > 50) errors.push(`upgrade ${u.id}: levelReq ${u.levelReq} out of 1..50`);
    if (u.requires) {
      for (const r of u.requires) {
        if (!upgradeIds.has(r)) errors.push(`upgrade ${u.id}: requires unknown upgrade "${r}"`);
      }
    }
  }

  // requires cycle detection over the upgrade graph (bounded, no hang)
  const onStack = new Set();
  const done = new Set();
  function visit(id, path) {
    if (done.has(id)) return;
    if (onStack.has(id)) {
      errors.push(`upgrade requires cycle detected: ${path.concat([id]).join(' -> ')}`);
      return;
    }
    onStack.add(id);
    const u = D.upgrades.find(x => x.id === id);
    if (u && Array.isArray(u.requires)) {
      for (const r of u.requires) visit(r, path.concat([id]));
    }
    onStack.delete(id);
    done.add(id);
  }
  for (const u of D.upgrades) visit(u.id, []);

  // --- food levels: location mapping + order ---
  const locationIds = new Set(D.locations.map(l => l.id));
  D.foodLevels.forEach((f, i) => {
    if (f.id === undefined) errors.push(`foodLevels[${i}]: missing id`);
    if (!locationIds.has(f.locationId)) errors.push(`foodLevels[${i}] "${f.name}": unknown locationId "${f.locationId}"`);
    else {
      const loc = D.locations.find(l => l.id === f.locationId);
      if (i + 1 < loc.levelFrom || i + 1 > loc.levelTo) errors.push(`foodLevels[${i}] "${f.name}" not covered by location "${loc.id}" (${loc.levelFrom}-${loc.levelTo})`);
    }
    if (typeof f.threshold !== 'number' || !(f.threshold > 0)) errors.push(`foodLevels[${i}] "${f.name}": bad threshold`);
  });

  // --- locations tile 1..50 ---
  let covered = 0;
  for (const l of D.locations) {
    if (typeof l.levelFrom !== 'number' || typeof l.levelTo !== 'number') { errors.push(`location "${l.id}": bad level range`); continue; }
    covered += (l.levelTo - l.levelFrom + 1);
  }
  if (covered !== 50) errors.push(`locations cover ${covered} levels, need 50`);

  // --- boosters ---
  for (const b of D.boosters) {
    if (typeof b.effect?.type !== 'string' || !EFFECT_TYPES.has(b.effect.type)) errors.push(`booster ${b.id}: unknown effect.type "${b.effect && b.effect.type}"`);
    if (!(b.durationMs > 0)) errors.push(`booster ${b.id}: non-positive durationMs`);
  }

  // --- chests + tables + pity ---
  const boosterIds = new Set(D.boosters.map(b => b.id));
  const currencyIds = new Set(D.currencies.map(c => c.id));
  const buffIds = new Set(D.buffs.map(b => b.id));
  const upgradeIdSet = new Set(D.upgrades.map(u => u.id));
  for (const t of D.chestTables) {
    if (!Array.isArray(t.entries) || t.entries.length === 0) errors.push(`chestTable tier ${t.tier}: empty entries`);
    for (const e of t.entries) {
      if (!(e.weight > 0)) errors.push(`chestTable tier ${t.tier}: non-positive weight for "${e.id}"`);
      if (!REWARD_KINDS.has(e.kind)) errors.push(`chestTable tier ${t.tier}: illegal reward kind "${e.kind}"`);
      if (e.kind !== 'permanent') {
        if (e.kind === 'currency' && !currencyIds.has(e.id)) errors.push(`chestTable tier ${t.tier}: unknown currency "${e.id}"`);
        if (e.kind === 'booster' && !boosterIds.has(e.id)) errors.push(`chestTable tier ${t.tier}: unknown booster "${e.id}"`);
        if (e.kind === 'buff' && !buffIds.has(e.id)) errors.push(`chestTable tier ${t.tier}: unknown buff "${e.id}"`);
        if (e.kind === 'upgrade' && !upgradeIdSet.has(e.id)) errors.push(`chestTable tier ${t.tier}: unknown upgrade "${e.id}"`);
      }
    }
  }
  if (!(D.chestPity.epicAfter > 0)) errors.push('chestPity.epicAfter must be > 0');
  if (!(D.chestPity.legendaryAfter > D.chestPity.epicAfter)) errors.push('chestPity.legendaryAfter must exceed epicAfter');

  // --- buffs ---
  for (const b of D.buffs) {
    if (typeof b.effect?.type !== 'string' || !EFFECT_TYPES.has(b.effect.type)) errors.push(`buff ${b.id}: unknown effect.type "${b.effect && b.effect.type}"`);
    if (!(b.durationMs > 0)) errors.push(`buff ${b.id}: non-positive durationMs`);
    if (typeof b.desc !== 'string' || !b.desc) errors.push(`buff ${b.id}: missing desc`);
  }

  // --- dailies + milestones reference only real reward ids ---
  for (const d of D.dailyCalendar) {
    if (!Array.isArray(d.rewards) || d.rewards.length === 0) errors.push(`dailyCalendar day ${d.day}: empty rewards`);
    for (const r of d.rewards) {
      if (!REWARD_KINDS.has(r.kind)) errors.push(`dailyCalendar day ${d.day}: illegal kind "${r.kind}"`);
      else if (r.kind === 'currency' && !currencyIds.has(r.id)) errors.push(`dailyCalendar day ${d.day}: unknown currency "${r.id}"`);
      else if (r.kind === 'booster' && !boosterIds.has(r.id)) errors.push(`dailyCalendar day ${d.day}: unknown booster "${r.id}"`);
      else if (r.kind === 'buff' && !buffIds.has(r.id)) errors.push(`dailyCalendar day ${d.day}: unknown buff "${r.id}"`);
      else if (r.kind === 'upgrade' && !upgradeIdSet.has(r.id)) errors.push(`dailyCalendar day ${d.day}: unknown upgrade "${r.id}"`);
    }
  }
  const mileDays = D.streakMilestones.map(m => m.day);
  if (JSON.stringify(mileDays) !== JSON.stringify([3, 7, 14, 30, 50, 100, 365])) errors.push(`streakMilestones days != [3,7,14,30,50,100,365], got ${JSON.stringify(mileDays)}`);

  // --- achievements ---
  const currencyIdSet = currencyIds;
  for (const a of D.achievements) {
    if (typeof a.check !== 'function') errors.push(`achievement ${a.id}: missing check()`);
    if (!(a.clout > 0)) errors.push(`achievement ${a.id}: non-positive clout`);
    if (a.requires && a.requires.currency && !currencyIdSet.has(a.requires.currency)) errors.push(`achievement ${a.id}: requires unknown currency "${a.requires.currency}"`);
  }

  return errors;
}
