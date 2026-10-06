// Offline earnings. Closed-form, no tick simulation. Given the production rate
// frozen at save time, integrate it over the absence window. The one subtlety:
// boosters that expired while the player was away must only count for the share
// of the window they were actually active. This is integrated by collecting the
// boundary points (window start/end plus each booster's clipped start/end),
// sorting them, and summing dt*multiplier across each sub-interval.

function multOf(boost) {
  if (boost && boost.effect && typeof boost.effect.value === 'number') return boost.effect.value;
  const m = /^x([\d.]+)/.exec(typeof (boost && boost.id) === 'string' ? boost.id : '');
  if (m) {
    const v = Number(m[1]);
    if (Number.isFinite(v) && v > 0) return v;
  }
  return 1;
}

function computeOffline(state, nowMs, productionPerSec) {
  const last = state && state.timestamps && typeof state.timestamps.lastSeen === 'number'
    ? state.timestamps.lastSeen : 0;
  const elapsedMs = Math.max(0, nowMs - last);
  const maxMs = CONFIG.OFFLINE.maxHours * 3600 * 1000;
  const capped = elapsedMs > maxMs;
  const windowMs = Math.min(elapsedMs, maxMs);

  const t0 = last;
  const t1 = last + windowMs;

  const boosts = state && state.run && Array.isArray(state.run.activeBoosters)
    ? state.run.activeBoosters : [];

  const pts = new Set([t0, t1]);
  for (const b of boosts) {
    const s0 = Math.max(b.startedAt, t0);
    const s1 = Math.min(b.expiresAt, t1);
    if (s1 > s0) { pts.add(s0); pts.add(s1); }
  }
  const sorted = [...pts].sort((a, b) => a - b);

  let activeWeightedMs = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (b <= a) continue;
    let prodMult = 1;
    for (const boost of boosts) {
      if (boost.startedAt <= a && boost.expiresAt > a) prodMult *= multOf(boost);
    }
    activeWeightedMs += (b - a) * prodMult;
  }

  const rate = typeof productionPerSec === 'function' ? productionPerSec() : productionPerSec;
  const prodVal = rate && typeof rate.m === 'number' && typeof rate.e === 'number'
    ? rate.m * Math.pow(10, rate.e) : 0;
  const total = prodVal * (activeWeightedMs / 1000) * CONFIG.OFFLINE.efficiency;

  return {
    elapsedMs: windowMs,
    capped,
    cappedMs: windowMs,
    gains: { grease: BigNum.fromNumber(total) },
  };
}
