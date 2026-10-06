# Task 6 Report: Data — the four upgrade trees (104 upgrades)

## Implementation Summary

Implemented Task 6 per the brief. Created `src/02_data_upgrades.js` that:
- Extends existing `DATA` via `Object.assign(DATA, {...})` without redeclaring `DATA` (critical constraint)
- Implements `genUpgradeEffect(tree, index, total)` per spec §7.2 with thirds split:
  - Early (`index < floor(total/3)`): `value = 0.05 + 0.055 * index`; types: Fry→`prodMult`, Drink→`fizzRate`, Chicken→`chestLuck`, Food→`prodMult` (Food uses fixed percentages per test)
  - Mid: `value = 2^(1 + i)` where `i` is index within mid third; types: Fry→`critChance`, Drink→`boosterDuration`, Chicken→`chickenRate`
  - Late: `value = 10^(3 + 2 * i)` where `i` is index within late third; types: Fry→`critMult`, Drink→`fizzRate`, Chicken→`spiceGain`
- Generates all 104 upgrades across four trees:
  - Food (25): names and effect values exactly as specified; finale `The Food Has Become Sentient` at index 24, value 10^9 (1_000_000_000). Sequential requires. Rarities assigned by progression.
  - Fry (27): all names verbatim; finale `Infinite Crispy`. Uses `genUpgradeEffect` for effects. Sequential requires. Currency `fry`.
  - Drink (26): all names verbatim; finale `The Ocean Is Now Soda`. Uses generator. Sequential requires. Currency `fizz`.
  - Chicken (26): all names verbatim; finale `The Chicken Has Achieved Consciousness`. Uses generator. Sequential requires. Currency `chicken`.
- Builds `upgradeById` as a Map from all upgrades
- Assigns each upgrade: `id`, `name`, `desc`, `tree`, `tier`, `cost:{currency,amount}`, `effect:{type,value}`, `requires:string[]`, `levelReq`, `rarity`, `flavorText`
- Currency constraints respected: cost currencies use `grease`, `fry`, `fizz`, `chicken`, `spice` (no clout/crimes). All costs > 0. `levelReq` integers 1-50. Effect types come from the enum specified in Task 9.

Also modified `build.js` to append a minimal generated-upgrades summary to `docs/generated-upgrades.md` at build time (as required by brief). `src/exports.json` unchanged in content expectations; we didn't add exports (no need - DATA/genUpgradeEffect exposed on DATA). The test imports from bundle which includes all source.

## TDD Evidence

**RED (before implementation):**
- Created `test/data-upgrades.test.js` with the 7 tests from brief
- Ran build + tests: all 7 upgrade tests failed. Key failures: `Cannot read properties of undefined (reading 'filter')` on `DATA.upgrades` (undefined), and `DATA.genUpgradeEffect is not a function`.

**GREEN (after implementation):**
- Implemented `src/02_data_upgrades.js` to satisfy all requirements
- Ran build + tests: all 7 upgrade tests pass. Full test suite (85 tests total) passes.

Test results for upgrade-specific tests (from node --test output):
```
✔ tree sizes match the spec exactly (0.4332ms)
✔ Food tree percentages match the original spec verbatim (0.4144ms)
✔ Food tree names match the original spec verbatim (0.0721ms)
✔ tree finale story beats are present (0.0677ms)
✔ the generator is deterministic and escalating (0.1078ms)
✔ every upgrade has complete, well-formed data (0.1636ms)
✔ requires point only at real upgrade ids (0.5071ms)
```

Full suite: 85/85 pass (duration ~4s).

## Files Changed

- Created: `src/02_data_upgrades.js` (360+ lines of upgrade data + generator)
- Created: `test/data-upgrades.test.js` (TDD test file)
- Modified: `build.js` (added generated-upgrades.md summary write)
- Modified: `src/exports.json` (no content changes required; already contains `"DATA"` and others)

## Self-Review Findings

**Completeness:** ✓
- Exactly 25/27/26/26 upgrades. Total 104.
- All Food names verbatim; finale names exact: `Infinite Crispy`, `The Ocean Is Now Soda`, `The Chicken Has Achieved Consciousness`, `The Food Has Become Sentient`.
- All fields present on every upgrade. Generator deterministic (tested a==b). Requires-chain sequential within each tree; every requires id exists (tested). 
- Effect types all from allowed enum set implied by generator mapping (and tested structure).

**Quality:** ✓
- Descriptions are functional and clear (jokes never obscure function). Flavor text added with appropriate absurd/corporate-satire tone. 
- Costs are > 0 with valid currencies. levelReq 1-50. Rarities assigned consistently.

**Discipline:** ✓
- Only allowed files touched (new data file, new test, build tweak). Did not modify existing source files (00_config, 01_data_core, 05_bignum, 06_utils). Did not redeclare DATA - extended via Object.assign. Build concatenates lexicographically; 02_data_upgrades.js runs after 01_data_core.js as intended.
- No scratch files at repo root.

**Testing:** ✓
- RED → GREEN verified. Full suite green after implementation. Tests would fail if regressions occur (size checks, exact name/value checks, requires validation, generator properties).
- Manual sanity checks: early < mid < late in scale by generator logic; thirds split correctly for each total.

## Concerns

None. Implementation is straightforward data + small generator per spec. File size of `src/02_data_upgrades.js` is under ~450 lines (reasonable). No blockers.