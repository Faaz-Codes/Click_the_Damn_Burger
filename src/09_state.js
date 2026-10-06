// State schema, save/load, export/import, migration. The single owner of the
// canonical shape of `state`. Nothing else in the codebase constructs or
// mutates a state object except a systems layer calling one of these helpers
// (the Effect producers land in Plan 2; they write through Actions, not here).
//
// Design intent from the spec §4 / §9:
//   - `run` is the per-run slice (reset on prestige); `meta` is the persistent
//     slice and must never be reset by a run reset.
//   - BigNum values are serialised as `"m|e"` compact strings so exact
//   values survive base64 without float drift.
//   - A save is { v, t, c, d }: version, timestamp, FNV-1a checksum over d,
//   and the encoded state payload. Corruption is detected and rejected verbatim.

const SAVE_VERSION = 1;
const KEY_PREFIX = 'snackonomics.save.';

// FNV-1a 32-bit, hex. Stable given the same string, sensitive to any change.
function checksum(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return ('00000000' + h.toString(16)).slice(-8);
}

function deepMerge(base) {
  for (let i = 1; i < arguments.length; i++) {
    const extra = arguments[i];
    if (!extra || typeof extra !== 'object') continue;
    for (const k of Object.keys(extra)) {
      const v = extra[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
        base[k] = deepMerge(base[k], v);
      } else {
        base[k] = v;
      }
    }
  }
  return base;
}

// BigNum -> "m|e", and back. BigNums are the only values that serialise with a
// `|` separator; every other field is plain JSON-compatible data.
function encodeState(v) {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const keys = Object.keys(v);
    if (keys.length === 2 && typeof v.m === 'number' && typeof v.e === 'number') {
      return v.m + '|' + v.e;
    }
    const out = {};
    for (const k of keys) out[k] = encodeState(v[k]);
    return out;
  }
  if (Array.isArray(v)) return v.map(encodeState);
  return v;
}

function decodeState(v) {
  if (typeof v === 'string' && v.indexOf('|') !== -1) {
    const idx = v.indexOf('|');
    const m = Number(v.slice(0, idx));
    const e = Number(v.slice(idx + 1));
    if (Number.isFinite(m) && Number.isInteger(e)) return { m, e };
    return v;
  }
  if (Array.isArray(v)) return v.map(decodeState);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v)) out[k] = decodeState(v[k]);
    return out;
  }
  return v;
}

function toBase64(json) {
  if (typeof Buffer !== 'undefined') return Buffer.from(json, 'utf8').toString('base64');
  return btoa(unescape(encodeURIComponent(json)));
}
function fromBase64(b64) {
  if (typeof Buffer !== 'undefined') return Buffer.from(b64, 'base64').toString('utf8');
  return decodeURIComponent(escape(atob(b64)));
}

function newState(now = Date.now()) {
  return {
    saveVersion: SAVE_VERSION,
    run: {
      foodLevel: 1,
      lifetimeGreaseThisRun: { m: 0, e: 0 },
      currencies: {
        grease: { m: 0, e: 0 },
        fry: { m: 0, e: 0 },
        fizz: { m: 0, e: 0 },
        chicken: { m: 0, e: 0 },
        spice: { m: 0, e: 0 },
      },
      upgrades: {},
      employees: {},
      automation: {},
      activeBoosters: [],
      combo: { count: 0, lastClickAt: 0 },
      runStartedAt: now,
    },
    meta: {
      prestigeLevel: 0,
      culinaryCredits: 0,
      prestigeUpgrades: {},
      achievements: {},
      chestPity: { noEpic: 0, noLegendary: 0 },
      daily: { lastClaimDate: null, streakCount: 0 },
      streak: { count: 0, best: 0 },
      boosterInventory: {},
      permanentBonuses: { goldenBurger: false },
      stats: {
        clicks: 0, crits: 0, megas: 0, jackpots: 0,
        comboMax: 0, comboDestroyed: 0, chestsOpened: 0,
        boostersActivated: 0, playtimeMs: 0,
        greasePerSec: { m: 0, e: 0 },
      },
      clout: { m: 0, e: 0 },
      cloutSpent: { m: 0, e: 0 },
      unlockedTabs: [],
      seen: {},
    },
    settings: {
      sound: true,
      music: true,
      soundVol: 80,
      musicVol: 60,
      reducedMotion: false,
      crt: true,
      notation: 'standard',
      textScale: 100,
      confirmThreshold: 1e12,
      autosaveIndicator: true,
    },
    timestamps: { lastSeen: now, created: now },
  };
}

const MIGRATIONS = {
  // 0 -> 1: fill the shape with the current canonical one, then keep every
  // field from the raw save. The example stub below.
  0: function zeroToOne(raw) {
    return deepMerge(newState(Date.now()), raw, { saveVersion: SAVE_VERSION });
  },
};

function migrate(raw) {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'save is not an object' };
  if (typeof raw.saveVersion !== 'number') raw = { ...raw, saveVersion: 0 };
  if (raw.saveVersion > SAVE_VERSION) {
    return { ok: false, error: `save is from a newer version (${raw.saveVersion}) and cannot be loaded` };
  }
  let s = raw;
  while (s.saveVersion < SAVE_VERSION) {
    const step = MIGRATIONS[s.saveVersion];
    if (typeof step !== 'function') return { ok: false, error: `no migration registered from version ${s.saveVersion}` };
    s = step(s);
  }
  return { ok: true, state: s };
}

// Structural validation of a decoded save. Clamps/rejects out-of-range numbers
// and malformed shapes. Returns a list of human-readable errors; empty = valid.
function validateSaveBlob(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object') return ['save is not an object'];
  if (!raw.run || typeof raw.run !== 'object') {
    errors.push('missing run object');
  } else {
    const fl = raw.run.foodLevel;
    if (!Number.isInteger(fl) || fl < 1 || fl > 50) errors.push(`foodLevel must be an integer in 1..50 (got ${JSON.stringify(fl)})`);
    if (!raw.run.currencies || typeof raw.run.currencies !== 'object') {
      errors.push('missing run.currencies');
    } else {
      for (const k of ['grease', 'fry', 'fizz', 'chicken', 'spice']) {
        const c = raw.run.currencies[k];
        if (!c || typeof c.m !== 'number' || !Number.isFinite(c.m) || typeof c.e !== 'number' || !Number.isInteger(c.e) || c.e < -1000 || c.e > 1000) {
          errors.push(`currency "${k}" has an invalid BigNum value ${JSON.stringify(c)}`);
        }
      }
    }
    if (!Array.isArray(raw.run.activeBoosters)) errors.push('run.activeBoosters must be an array');
  }
  if (!raw.meta || typeof raw.meta !== 'object') {
    errors.push('missing meta object');
  } else {
    if (!raw.meta.permanentBonuses || typeof raw.meta.permanentBonuses !== 'object') errors.push('missing meta.permanentBonuses');
  }
  if (!raw.settings || typeof raw.settings !== 'object') errors.push('missing settings');
  if (!raw.timestamps || typeof raw.timestamps !== 'object') errors.push('missing timestamps');
  return errors;
}

function exportSave(state) {
  const d = encodeState(state);
  const dJson = JSON.stringify(d);
  const c = checksum(dJson);
  return toBase64(JSON.stringify({ v: SAVE_VERSION, t: Date.now(), c, d }));
}

function importSave(str) {
  const fail = (errors) => ({ ok: false, errors });
  let obj;
  try {
    obj = JSON.parse(fromBase64(str));
  } catch {
    return fail(['save is not valid base64-encoded JSON']);
  }
  try {
    if (!obj || typeof obj !== 'object' || obj.d === undefined || typeof obj.d !== 'object') {
      return fail(['malformed save: missing data section "d"']);
    }
    if (typeof obj.v !== 'number') return fail(['missing or invalid saveVersion']);
    if (obj.v > SAVE_VERSION) return fail([`saveVersion ${obj.v} is newer than supported ${SAVE_VERSION}`]);

    const dJson = JSON.stringify(obj.d);
    if (checksum(dJson) !== obj.c) return fail(['checksum mismatch — save appears corrupted']);

    const decoded = decodeState(obj.d);
    const vErr = validateSaveBlob(decoded);
    if (vErr.length > 0) return fail(vErr);

    const mig = migrate(decoded);
    if (!mig.ok) return fail([mig.error]);

    const st = mig.state;
    return {
      ok: true,
      state: st,
      errors: [],
      preview: {
        level: st.run.foodLevel,
        lifetimeGrease: st.run.lifetimeGreaseThisRun,
      },
    };
  } catch (err) {
    return fail([String((err && err.message) || err)]);
  }
}

function keyFor(slot) { return KEY_PREFIX + slot; }

function saveGame(state, store, slot = 'main') {
  try {
    store.setItem(keyFor(slot), exportSave(state));
    return true;
  } catch {
    return false;
  }
}

function loadGame(store, slot = 'main') {
  const fallback = slot === 'main' ? 'backup' : 'main';
  try {
    const raw = store.getItem(keyFor(slot));
    if (raw != null) {
      const out = importSave(raw);
      if (out.ok) return out.state;
    }
    const bak = store.getItem(keyFor(fallback));
    if (bak != null) {
      const out2 = importSave(bak);
      if (out2.ok) return out2.state;
    }
  } catch { /* ignore */ }
  return newState();
}
