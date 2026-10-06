# Snackonomics — Plan 2: Headless Economy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Note:** At the time of authoring, the subagent rate limit never cleared, so this plan may be executed inline by the controller. If executed inline, record in the ledger that each task was implemented + tested inline and that a fresh reviewer pass is required on the branch once subagents recover.

**Goal:** Build the headless economy of Snackonomics — selectors, production math, purchases, level progression, chests/pity, dailies/streaks, achievements, and a "cheapest-payback-first" balance simulator — all running in Node against the data and state from Plan 1, with zero browser UI.

**Architecture:** Same single-bundle model as Plan 1: numbered plain-script modules in `src/`, no imports/export statements. Logic reads state via selectors and writes only through `Actions.*`. The growing question the prior review raised — a required function absent while the suite stayed green — is addressed by writing an "API surface exists" test before the behaviour tests.

**Tech Stack:** Vanilla JS (ES2022), Node `node:test` + `node:assert`. Zero npm dependencies. Same build as Plan 1.

**Spec:** `docs/superpowers/specs/2026-10-06-snackonomics-design.md` §6 (economy) and §8 (systems), §5 (number system).

## Global Constraints

- Deliverable stays a single `index.html`; Plans 3-4 render it. Plan 2 must not add any DOM, CSS, or browser APIs to `src/`.
- All balance numbers live in `CONFIG`. No numeric literals in UI-facing logic that are really balance knobs.
- BigNum is `{m, e}`; currency BigNums are serialised as `"m|e"` (Plan 1's `encodeState` already handles this; Plan 2 never string-concats them ad hoc).
- Every currency must keep at least one earn and one spend path end-to-end.
- The milestone decision (§6.2) is **cumulative-on-employees-only**, automation at ×1, unless the `balance` simulator shows cumulative-on-both lands closer to the §6.3 table — documented after running it.
- `DATA` is extended, never re-declared. Any new `DATA.*` this plan adds must be added here without re-typing the declaration.
- `state.meta.stats` counters referenced by the 115 achievement `check()` functions (e.g. `clicks`, `comboMax`, `chestsOpened`, `boostersActivated`, `greasePerSec`) MUST be populated by Plan 2 — otherwise the achievement tests that assert a non-throw would silently pass while the real unlock never fires. `check` functions tolerate missing/undefined state for now; they become live here.

## Review Focus

Five failure modes the spec implies that no naive test exercises — each has a pinning task.

1. **Milestone-bonus double-dip explodes the late economy.** Owning 200 of an employee multiplies production by ×1024 on top of automation that already scales with click power. Expected: the `balance` bot still hits the §6.3 table with employees only at cumulative x2/thresholds and automation flat.
2. **A required selector or effect silently ignores a named effect type.** 14 effect types feed production; a typo that treats one as no-op still "runs". Expected: a test enumerates the enum against the engine once and asserts each produces non-zero delta.
3. **Daily-claim identity across timezone boundaries rejects a legitimate claim.** A traveller's local `dkey` shifts by one, or a clock rollback masquerades as "yesterday". Expected: the §9.2 table is reproduced end-to-end here (clock-backward rejection, no double-grant across a negative gap, Streak Freeze consumption, streak reset), all from raw timestamps.
4. **A "cost" stored in the wrong currency file misprices the economy.** Fry Bucks/Fizz/Chicken Points are awarded and spent only by their own tree; a cross-currency payment silently degrades an upgrade to "always affordable" or "never". Expected: `canAfford` and all three buy paths type-check the currency and the `data` validator already rejects an unknown `cost.currency`.
5. **Grunting the economy math through an integer selector never reaches the pacing table.** 150 × 3.1^(n−1) is fixed; income is exponential; the match must be proven by the simulator, not assumed. Expected: `test/balance.test.js` prints the reached level per milestone time and FAILS if outside the §6.3 tolerance.

---

### Task 1: Selectors
**Files:**
- Create: `src/11_selectors.js`
- Modify: `src/exports.json` (append `"Sel"`)
- Test: `test/selectors.test.js`

**Interfaces:**
- Consumes: `BigNum`, `CONFIG`, `DATA` from Plan 1
- Produces a global `Sel` with pure read-only selectors. Each returns BigNum or plain values, never mutates state:

| Selector | Meaning |
|---|---|
| `Sel.prodMult(s)` | product of all additive upgrade `prodMult` effects within and across trees, milestones, booster prod multiplier (capped), goldenBurger |
| `Sel.clickMult(s)` | additive `clickMult` across trees × boosters |
| `Sel.clickPower(s)` | `(CLICK_BASE + LINK_RATE × greasePerSec_prev) × clickMult × comboMult` |
| `Sel.greasePerSec(s)` | `(autoGrease + empGrease) × prodMult` |
| `Sel.fryPerSec`, `Sel.fizzPerSec`, `Sel.chickenPerSec` | `LINK2 × greasePerSec × treeMult` |
| `Sel.costOf(itemId, count)` | `baseCost × growth^count` for an employee or machine |
| `Sel.canAfford(s, cost)` | `currencies[cost.currency] >= cost.amount` and an upgrade branch |

- [ ] **Step 1:** Write `test/selectors.test.js`. Assert: every name is exported; `prodMult` with a single tech-tier is exactly its cumulative amplification; buying one better click adds via `clickMult` (not multiplied twice); the milestone bonus switches at exactly 25 units; `canAfford` rejects an empty wallet and accepts an exact match; all effects in the 14-slot enum map to a non-zero delta through one selected path.
- [ ] **Step 2:** Run the suite — expect FAIL (`Sel` not exported).
- [ ] **Step 3:** Implement `src/11_selectors.js`. Multiplicative-across-trees, additive-within a tree. Milestones read `state.run.employees[id]` counts. Golden Burger reads `state.meta.permanentBonuses.goldenBurger`.
- [ ] **Step 4:** Run — expect PASS.
- [ ] **Step 5:** Commit.

---

### Task 2: Systems — production and the two linked selectors
**Files:**
- Create: `src/12_systems.js`
- Modify: `src/exports.json` (append `"computeGrease"`)
- Test: `test/systems.test.js`

**Interfaces:**
- Consumes: `Sel`, `BigNum`, `CONFIG`, `DATA`
- Produces `computeGrease(s) -> {m,e}` (per-second Grease today) and `computeRate(s) -> {m,e}` (the production-linked portion of click power).

- [ ] **Step 1:** Write `test/systems.test.js`. Assert that with automation only, click power is unchanged until the first upgrade; that buying a +100% prodMult upgrades `Sel.calc` exactly once; that a late-tier machine bought twice scales with its `growth`; that employees ×25 grant their milestone ×2 once.
- [ ] **Step 2:** Run — expect FAIL.
- [ ] **Step 3:** Implement `computeGrease`. Every machine contributes `rate clicks/s × clickCore(s)`; employees contribute `rate`. Multiply by `Sel.prodMult(s)`.
- [ ] **Step 4:** Run — expect PASS.
- [ ] **Step 5:** Commit.

---

### Task 3: Purchase actions — upgrades, employees, automation
**Files:**
- Create: `src/13_purchases.js`
- Modify: `src/exports.json` (append `"buy"` namespace with `buyUpgrade`, `buyEmployee`, `buyAutomation`)
- Test: `test/purchases.test.js`

**Interfaces:**
- Consumes `Sel`, `DATA`, `CONFIG`, `state` via systems
- Produces `buy` object whose methods return `{ok, changed}` and mutate the passed state; they never throw on failure to afford — they return `{ok:false, reason}`.

- [ ] **Step 1:** Failing tests for `buyUpgrade(s,id)`, `buyEmployee(s,id,n)`, `buyAutomation(s,id,n)`: automation cost rises by `×growth^n`, employee/upgrade requires gate, correct currency debited, negative-currency check (no Fry bought with Grease).
- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run — PASS.
- [ ] **Step 5:** Commit.

---

### Task 4: Level progression
**Files:**
- Create: `src/14_progression.js`
- Modify: `src/exports.json`; Test: `test/progression.test.js`

- [ ] **Step 1-… 5:** assert that lifetime threshold crossings advance `run.foodLevel`, that each advance awards one level-up (and earns the expected Chests streak reward when milestone-gated), that Omni Ascension increments past level 50 rather than ending, and that badge unlock reads the correct food's level.

---

### Task 5: Chests, pity, opens, rewards
**Files:**
- Create: `src/15_chests.js`
- Modify: `src/exports.json`; Test: `test/chests.test.js`

- [ ] **Step 1-… 5:** roll a reward per tier table with the softener added on the pity counter; assert the themed `tier 1..7` maps monotonically to higher face values; guaranteed Epic+ after 10 and Legendary+ after 40 non-hits both trigger.

---

### Task 6: Daily rewards + streak aging
**Files:**
- Create: `src/16_daily.js`
- Modify: `src/exports.json`; Test: `test/daily.test.js`

- [ ] **Step 1-… 5:** implement the §9.2 decision table end-to-end on raw timestamps (claim, clock-backward refuse, timezone-safe gap detection, Streak Freeze consume vs reset).

---

### Task 7: Achievement evaluation
**Files:**
- Create: `src/17_achievements.js`
- Modify: `src/exports.json`; Test: `test/achievements.test.js`

- [ ] **Step 1-… 5:** evaluate `DATA.achievements[].check(state)` in a loop, grant `clout` on first true, no double-grant on a second tick, hidden ones excluded from the `unlocked` list.

---

### Task 8: Actions barrel + `runNewDay`
**Files:**
- Create: `src/18_actions.js`
- Modify: `src/exports.json`; Test: `test/actions.test.js`

- [ ] **Step 1-… 5:** expose `Actions.openChest(tier)`, `Actions.useBooster(id)`, `Actions.claimDaily()`, `Actions.buyEmployee(id,n)`, `Actions.buyAutomation`, `Actions.buyUpgrade`, `Actions.importSave(str)`, `Actions.resetSave()`.

---

### Task 9: Balance simulator
**Files:**
- Create: `src/19_balance.js`
- Modify: `src/exports.json`; Test: `test/balance.test.js`

**Interfaces:**
- Consumes `Sel`, `computeGrease`, `buy`, `progression`, `CONFIG`
- Produces `simulate(hours) -> { reachedLevel: [fnOfTime,level], summary }` running a greedy "cheapest-payback-first spend ALL" bot with no UI.

- [ ] **Step 1:** Write `test/balance.test.js` with the §6.3 milestone table inline; assert the bot's reached-level curve lands within tolerance of each row (Lv2 ~30s, Lv5 ~4min, Lv10 ~12min, Lv25 ~1.5h, Lv50 ~8-10h).
- [ ] **Step 2:** Run — expect FAIL and print the current bot curve.
- [ ] **Step 3:** Iterate `CONFIG` growth rates and `LINK_RATE`/`LINK2` under the tests until the curve is acceptable; document the exact values in the report.
- [ ] **Step 4:** Run — expect PASS.
- [ ] **Step 5:** Commit.

---

## Notes for the implementer

- All 14 effect types must map to a delta in `Sel.prodMult` or the click path; no silent ignores.
- The `greasePerSec`/`playtimeMs` counters under `state.meta.stats` are **this plan's** responsibility to populate.
- Keep files small and single-purpose. If a system needs a schema change, bump `SAVE_VERSION+0` migration note into the ledger, do not silently change `newState`.
- Do not import DOM, WebAudio, or touch any `index.html` expand. Plans 3-4 do that.

## Completion criteria
- [ ] `node build.js` + `node --test "test/**/*.test.js"` all green
- [ ] `validateTables` clean
- [ ] `test/balance.test.js` FAILS then is honest (not skipped) until the idle curve is recorded; it MUST pass before ship
