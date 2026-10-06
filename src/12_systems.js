// Plan 2 · Task 2: Systems — thin production entry points around the Sel
// math so higher systems (progression, chests, dailies, actions) and Plan 4
// can call a stable name without reaching into Sel internals.
//
// computeGrease is the per-second Grease right now (the core income number).
// computeRate is that same quantity exposed for rate-display panels.
// Both are pure reads and must not mutate state.

function computeGrease(s) {
  return Sel.greasePerSec(s);
}

function computeRate(s) {
  return Sel.greasePerSec(s);
}
