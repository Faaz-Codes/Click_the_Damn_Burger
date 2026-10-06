// Plan 2 · Task 5: Chests, pity, opening rewards. Opening a chest rolls one
// entry from that tier's weighted table, then applies the pity floors: a string
// of low outcomes builds up noEpic / noLegendary, and once the counter hits the
// spec threshold the next roll is guaranteed to be a higher-tier reward. This
// module grants the reward onto the appropriate slice of state (currencies,
// booster inventory, owned upgrades, or records a buff) and updates pity.

const RARITY_ORDER = ['common','uncommon','rare','epic','legendary','mythic','secret'];

function rarityRank(r) { const i = RARITY_ORDER.indexOf(r); return i < 0 ? 0 : i; }

// A reward counts as "high" if it is not a plain currency drop. Buffs exist to
// be something-ness; upgrades always are. Boosters count as high by their rarity.
function isHighReward(entry) {
  if (entry.kind === 'upgrade' || entry.kind === 'buff') return true;
  if (entry.kind === 'booster') {
    const b = DATA.boosters.find(x => x.id === entry.id);
    return b ? rarityRank(b.rarity) >= 2 /* rare+ */ : false;
  }
  return false;
}

function isLegendaryHigh(entry) {
  if (entry.kind === 'upgrade') return true;
  if (entry.kind === 'booster') {
    const b = DATA.boosters.find(x => x.id === entry.id);
    return b ? rarityRank(b.rarity) >= 4 /* legendary+ */ : false;
  }
  return false;
}

function tableFor(tier) {
  return DATA.chestTables.find(t => t.tier === tier);
}

function weightedPick(entries, rand) {
  let total = 0;
  for (const e of entries) total += e.weight;
  if (total <= 0) return entries[entries.length - 1];
  let r = rand() * total;
  for (const e of entries) {
    r -= e.weight;
    if (r < 0) return e;
  }
  return entries[entries.length - 1];
}

function grantReward(state, entry) {
  if (entry.kind === 'currency') {
    const cur = state.run.currencies[entry.id];
    if (cur) state.run.currencies[entry.id] = BigNum.add(cur, BigNum.fromNumber(entry.amount));
  } else if (entry.kind === 'booster') {
    state.meta.boosterInventory[entry.id] = (state.meta.boosterInventory[entry.id] || 0) + entry.amount;
  } else if (entry.kind === 'upgrade') {
    state.run.upgrades[entry.id] = true;
  } else if (entry.kind === 'buff') {
    state.meta.lastBuffs = state.meta.lastBuffs || [];
    state.meta.lastBuffs.push(entry.id);
  }
  return entry;
}

function openChest(state, tier, rand = Math.random) {
  const table = tableFor(tier);
  if (!table) return { ok: false, reason: `unknown chest tier ${tier}` };

  const cfg = DATA.chestPity;
  const run = state.meta.chestPity;

  let entry;
  if (run.noLegendary >= cfg.legendaryAfter) {
    const pool = table.entries.filter(isLegendaryHigh);
    entry = pool.length > 0 ? weightedPick(pool, rand) : weightedPick(table.entries, rand);
  } else if (run.noEpic >= cfg.epicAfter) {
    const pool = table.entries.filter(isHighReward);
    entry = pool.length > 0 ? weightedPick(pool, rand) : weightedPick(table.entries, rand);
  } else {
    entry = weightedPick(table.entries, rand);
  }

  const wasHigh = isHighReward(entry);
  const wasLegendary = isLegendaryHigh(entry);
  run.noEpic = wasHigh ? 0 : run.noEpic + 1;
  run.noLegendary = wasLegendary ? 0 : run.noLegendary + 1;

  grantReward(state, entry);
  return { ok: true, tier, reward: entry, pity: { noEpic: run.noEpic, noLegendary: run.noLegendary } };
}
