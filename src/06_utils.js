// Utilities: seeded randomness, calendar-day arithmetic, a storage shim that
// cannot take the game down, and two small containers. Nothing here reads
// CONFIG or BigNum; these are the primitives everything else is built on.

/* Randomness -------------------------------------------------------------- */

// mulberry32's odd increment, and 2**32, which maps the 32-bit state into [0, 1).
const RNG_MIX = 0x6D2B79F5;
const RNG_SCALE = 4294967296;

// rng(seed?) -> () => number in [0, 1). A seeded generator replays the same
// stream forever, which is what lets a daily roll be reasoned about and tested;
// with no seed it draws its starting state from Math.random. The state is forced
// to 32 bits (the `| 0`) so it cannot drift into float territory and lose the
// low-order bits a draw depends on.
function rng(seed) {
  let state = seed === undefined ? (Math.random() * RNG_SCALE) >>> 0 : seed | 0;
  return function () {
    state = (state + RNG_MIX) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / RNG_SCALE;
  };
}

// rngPick(arr, r) -> a uniformly chosen item. The source is passed in so a
// caller can draw from a seeded stream.
function rngPick(arr, r) {
  return arr[Math.floor(r() * arr.length)];
}

// rngWeighted(entries, r) -> the chosen entry, by relative weight. The weights
// are not probabilities and need not sum to 1: they are normalised against their
// own total here, so 3:1 and 0.75:0.25 behave alike. A zero weight is
// unreachable -- the walk steps over it -- and a table with no weight at all has
// nothing to return, reported as undefined rather than as a zero-weight entry.
function rngWeighted(entries, r) {
  let total = 0;
  for (const e of entries) if (e.weight > 0) total += e.weight;
  if (total <= 0) return undefined;
  let roll = r() * total;
  let walked = 0;
  let last = null;
  for (const e of entries) {
    if (!(e.weight > 0)) continue;
    last = e;
    walked += e.weight;
    if (roll < walked) return e;
  }
  return last; // only reachable if the source returned exactly 1
}

// rngInt(minInclusive, maxExclusive, r) -> a whole number in [min, max).
function rngInt(minInclusive, maxExclusive, r) {
  return minInclusive + Math.floor(r() * (maxExclusive - minInclusive));
}

/* Dates ------------------------------------------------------------------- */

const MS_PER_DAY = 86400000;
const DKEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad2(n) {
  return n < 10 ? '0' + n : String(n);
}

// dkey(ts?) -> 'YYYY-MM-DD' for the player's own calendar day. The local getters
// are the point: a player in UTC+14 opening the game at 09:00 is on their local
// date, not on yesterday's UTC one, and it is their local date that decides
// whether the daily reward is theirs to collect. Fields are zero-padded because
// this string is both a storage key and a parseDateKey argument, and
// '2026-1-6' is not the same key as '2026-01-06'.
function dkey(ts) {
  const date = ts === undefined ? new Date() : new Date(ts);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

// parseDateKey(key) -> { y, m, d }, the month numbered the way the key is
// written: 1 is January, matching the day beside it and the ISO key it came
// from. Anything that is not a padded 'YYYY-MM-DD' key parses to null rather
// than to a date nobody wrote -- a save file can be corrupt, and the callers
// here are the boot path.
function parseDateKey(key) {
  const parts = DKEY_PATTERN.exec(key);
  if (!parts) return null;
  return { y: Number(parts[1]), m: Number(parts[2]), d: Number(parts[3]) };
}

// daysBetween(aKey, bKey) -> the signed number of calendar days from a to b.
// Both keys are anchored to UTC midnight before subtracting, and that is the
// entire implementation: anchored in UTC, the delta is a whole number of
// MS_PER_DAY blocks whatever the local zone did in between. The obvious reading
// -- build the same two dates at local midnight and divide -- measures a 23h
// or 25h day across a DST transition and answers 1.958 or 2.041, dropping a day
// from a streak the player already earned.
function daysBetween(aKey, bKey) {
  const a = parseDateKey(aKey);
  const b = parseDateKey(bKey);
  if (!a || !b) return NaN;
  return (utcMidnight(b) - utcMidnight(a)) / MS_PER_DAY;
}

function utcMidnight({ y, m, d }) {
  return Date.UTC(y, m - 1, d);
}

/* Storage ----------------------------------------------------------------- */

const STORE_PROBE_KEY = '__snackonomics_probe__';

// makeStore(storage?) -> { get, set, remove, persistent }. Saving must never be
// the reason the game does not start, so nothing here throws: a storage that
// refuses (private browsing, a full quota, an embedded frame with no
// localStorage) costs the player their progress between visits, never their
// session. `persistent` is read, not called: it says whether values are
// reaching real storage right now, and it is raised only after a probe write.
function makeStore(storage = globalThis.localStorage) {
  const memory = new Map();
  const store = {
    persistent: false,

    get(key) {
      if (store.persistent) {
        try {
          return storage.getItem(key);
        } catch (err) {
          store.persistent = false; // the quota ran out or access was revoked
        }
      }
      return memory.has(key) ? memory.get(key) : null;
    },

    // Values are stored as the strings localStorage takes; the caller serialises.
    set(key, value) {
      if (store.persistent) {
        try {
          storage.setItem(key, value);
          return;
        } catch (err) {
          store.persistent = false;
        }
      }
      memory.set(key, value);
    },

    remove(key) {
      memory.delete(key);
      if (store.persistent) {
        try {
          storage.removeItem(key);
        } catch (err) {
          store.persistent = false;
        }
      }
    }
  };

  // Feature detection cannot tell here: an unusable storage has the methods and
  // throws from them, so the only test is a write. The probe key is reserved,
  // and is removed again immediately, leaving no trace when it succeeds.
  try {
    if (storage) {
      storage.setItem(STORE_PROBE_KEY, '1');
      storage.removeItem(STORE_PROBE_KEY);
      store.persistent = true;
    }
  } catch (err) {
    store.persistent = false;
  }
  return store;
}

/* Events ------------------------------------------------------------------ */

class Emitter {
  constructor() {
    this.handlers = new Map();
  }

  // on(evt, fn) -> offFn. The returned function is the ergonomic way to
  // unsubscribe, and it is idempotent: a component that tears down twice does
  // not have to know whether it already did.
  on(evt, fn) {
    if (!this.handlers.has(evt)) this.handlers.set(evt, []);
    this.handlers.get(evt).push(fn);
    let subscribed = true;
    return () => {
      if (!subscribed) return;
      subscribed = false;
      this.off(evt, fn);
    };
  }

  // Removing a listener that was never added is not an error: the caller wants
  // it gone, and it is.
  off(evt, fn) {
    const listeners = this.handlers.get(evt);
    if (!listeners) return;
    const at = listeners.indexOf(fn);
    if (at >= 0) listeners.splice(at, 1);
  }

  emit(evt, payload) {
    const listeners = this.handlers.get(evt);
    if (!listeners) return;
    // Copied first, because a handler is allowed to unsubscribe itself or a
    // sibling while this loop is running.
    for (const fn of listeners.slice()) fn(payload);
  }
}

/* Objects ----------------------------------------------------------------- */

// A fixed-size bag of pre-built objects: Pool(factory, size) runs the factory
// exactly `size` times, at construction, and never again. `get` on a drained
// pool recycles an object that is already checked out instead of building one
// more, so a runaway loop of get() calls cannot grow the heap -- the caller may
// then be handed something it already holds, which is the right trade for
// effects the game would rather reuse than allocate.
class Pool {
  constructor(factory, size) {
    this.items = [];
    this.free = [];
    this.cursor = 0;
    for (let i = 0; i < size; i++) {
      const item = factory();
      this.items.push(item);
      this.free.push(item);
    }
  }

  get() {
    if (this.free.length > 0) return this.free.pop();
    const item = this.items[this.cursor];
    this.cursor = this.cursor + 1 >= this.items.length ? 0 : this.cursor + 1;
    return item; // a pool of size 0 has nothing to give and says so
  }

  release(item) {
    if (this.free.indexOf(item) >= 0) return; // already out, handing it back twice
    this.free.push(item);
  }
}