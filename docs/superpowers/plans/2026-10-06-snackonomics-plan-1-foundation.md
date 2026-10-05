# Snackonomics — Plan 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the headless foundation of Snackonomics — BigNum, all balance config, every content table, utilities, and the save system — plus the build pipeline and test suites that prove the data is correct.

**Architecture:** Sources are numbered plain-script modules in `src/` that define top-level `const`s with **no `import`/`export` statements**. `build.js` concatenates them in lexicographic order and emits two artifacts from one source of truth: `index.html` (single file, inside an IIFE) and `test/bundle.mjs` (same concatenation plus an export list, for Node). Tests import from the bundle. This gives modular authoring, TDD, and a genuinely single-file deliverable with zero runtime dependencies.

**Tech Stack:** Vanilla JS (ES2022), Node 24 with the built-in `node:test` runner and `node:assert`, `node --check` for syntax validation. **Zero npm dependencies.** Canvas 2D and Web Audio for later plans.

**Spec:** `docs/superpowers/specs/2026-10-06-snackonomics-design.md`

## Global Constraints

- Deliverable is a single self-contained `index.html`: no external JS libraries, no external images, no build step for the player. Only Google Fonts may load externally and every font needs a fallback stack.
- Dev tooling has **zero npm dependencies** and requires Node ≥ 18 (authored and verified on Node 24).
- Sources in `src/` are **numbered plain-script modules**. No `import`, `export`, or `require` statements in any `src/*.js` file. Build order is lexicographic by filename — filename prefixes encode dependency order.
- Every state mutation goes through an `Actions.*` command. UI code never writes `state`.
- All balance numbers live in `CONFIG`. No costs, rates, or item copy may appear in UI code.
- Only the 12 palette CSS variables may be used as colours (`--ink --panel --panel-hi --grease --ketchup --mustard --lettuce --soda --cream --mute --gold --purple`).
- Sprites use integer scaling only (2×, 3×, 4×, 6×) with `image-rendering: pixelated`. No `border-radius`. 2px dark outline on interactive elements. Hard offset shadows, no blur.
- No more than 3 full-screen flashes per second.
- Tap targets ≥ 44px. No horizontal page overflow at 320px. Body text contrast ≥ 4.5:1 against its panel.
- `Press Start 2P` is never used for paragraphs.
- Emoji are never used as primary art.
- Every currency must have at least one earn source and one spend sink.
- **Do not mutate `meta` outside the systems that own it.** In this plan, only `src/09_state.js` constructs state; nothing else writes it.

## Review Focus

Five failure modes the spec implies that no naive test suite would catch — each has a pinning test in the task named.

1. **BigNum denormalization drift.** Repeated `mul`/`div` accumulates mantissa error, so `x.div(1e300).mul(1e300)` drifts from `x` at high exponents, and displayed values creep. Expected: exact round-trip within 1e-12 relative, and `m` always in `[1,10)`.
2. **DST breaks `daysBetween`.** Dividing milliseconds by 86,400,000 yields a 0-day or 2-day gap on 23- and 25-hour days, silently resetting a 30-day streak and denying the Golden Burger. Expected: calendar-exact across any DST transition.
3. **Timezone shift at save/load.** A player who travels or whose OS zone changes shifts `dkey` by a day, double-granting a daily reward or silently eating a streak day. **Pinned in Task 4** by `daysBetween` returning a negative value for a backwards key (the primitive the refusal logic branches on); **the end-to-end "no double-grant, no punishment" assertion lands in Plan 2's `test/daily.test.js`**, because the refusal policy itself belongs to the daily system.
4. **Save version mismatch.** A save with `saveVersion` missing, `0`, or greater than current must not crash the boot path. Expected: migrate forward, or reject with a clear message and fall back to the backup slot.
5. **localStorage unavailable or full.** Private browsing, disabled storage, or quota exceeded mid-session. Expected: in-memory play continues, warning banner shows, nothing throws.

---

### Task 1: Build pipeline and test harness

**Files:**
- Create: `package.json`, `.gitignore`, `build.js`, `src/exports.json`, `src/index.shell.html`
- Test: `test/build.test.js`

**Interfaces:**
- Consumes: nothing (first task)
- Produces:
  - `node build.js` → writes `index.html` at repo root and `test/bundle.mjs`
  - `npm test` → runs `node --test test/`
  - `src/exports.json` is a JSON array of top-level names to export from `test/bundle.mjs`; `build.js` is the only reader
  - `build.js` **injects** `const BUILD_INFO = { version, taskCount, builtAt }` at the top of the concatenation, so the initial `exports.json` entry of `"BUILD_INFO"` is satisfied from Task 1 onward
  - `src/index.shell.html` contains the markers `/*STYLE*/` and `/*SCRIPT*/` (CSS/JS comment syntax, so they survive being parsed as either language); `build.js` replaces them

- [ ] **Step 1: Write the failing test**

```js
// test/build.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

test('build.js emits index.html with the shell markers resolved', () => {
  execFileSync(process.execPath, ['build.js'], { cwd: process.cwd() });
  assert.ok(existsSync('index.html'), 'index.html should exist');
  const html = readFileSync('index.html', 'utf8');
  assert.ok(!html.includes('/*SCRIPT*/'), 'SCRIPT marker must be replaced');
  assert.ok(!html.includes('/*STYLE*/'), 'STYLE marker must be replaced');
  assert.ok(html.includes('<script>'), 'bundle script tag present');
});

test('build.js emits test/bundle.mjs that parses as ESM', () => {
  execFileSync(process.execPath, ['build.js'], { cwd: process.cwd() });
  const bundle = readFileSync('test/bundle.mjs', 'utf8');
  assert.match(bundle, /^export \{/m, 'bundle must end with an export statement');
});

test('every name in src/exports.json is actually defined in the bundle', () => {
  execFileSync(process.execPath, ['build.js'], { cwd: process.cwd() });
  const names = JSON.parse(readFileSync('src/exports.json', 'utf8'));
  const bundle = readFileSync('test/bundle.mjs', 'utf8');
  for (const name of names) {
    assert.match(bundle, new RegExp(`\\b(?:const|function|class|let)\\s+${name}\\b`),
      `exported name "${name}" is not defined in the bundle`);
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `build.js` does not exist.

- [ ] **Step 3: Create `package.json`**

```json
{
  "name": "snackonomics",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "node build.js",
    "test": "npm run build && node --test test/",
    "check": "node build.js --check"
  }
}
```

- [ ] **Step 4: Create `.gitignore`**

```
node_modules/
test/bundle.mjs
docs/generated-upgrades.md
```

- [ ] **Step 5: Create `src/exports.json`**

Start with one entry so the export-list mechanism is exercised end to end:

```json
["BUILD_INFO"]
```

- [ ] **Step 6: Create `src/index.shell.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>SNACKONOMICS</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet">
<style>/*STYLE*/</style>
</head>
<body>
<div id="app"></div>
<script>/*SCRIPT*/</script>
</body>
</html>
```

Note: shell uses `/*STYLE*/` and `/*SCRIPT*/` (CSS/JS comment syntax) rather than HTML comments so the marker survives being parsed as either language.

- [ ] **Step 7: Create `build.js`**

Must: read `src/*.js` sorted by filename, strip the leading `//` header comment block from each only inside `index.html` (keep in bundle for debugging), wrap in `(() => { 'use strict'; ... })()` for the HTML and a bare module for the bundle, append `export { ... };` to the bundle from `src/exports.json`, and replace the `/*STYLE*/` and `/*SCRIPT*/` markers in the shell. Support `--check` to additionally run `node --check` on the concatenated bundle and exit non-zero on syntax error.

- [ ] **Step 8: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 3 tests.

- [ ] **Step 9: Commit**

```bash
git add package.json .gitignore build.js src/exports.json src/index.shell.html test/build.test.js
git commit -m "build: add concat build pipeline and Node test harness"
```

---

### Task 2: BigNum core arithmetic

**Files:**
- Create: `src/05_bignum.js`
- Modify: `src/exports.json` (append `"BigNum"`)
- Test: `test/bignum.test.js`

**Interfaces:**
- Consumes: nothing
- Produces a global `BigNum` — a factory over plain `{m, e}` objects, all values normalized so `1 <= m < 10` (except zero, where `m === 0 && e === 0`):
  - `BigNum.fromNumber(n: number) -> {m, e}`
  - `BigNum.fromString(s: string) -> {m, e}` — accepts `"1234"`, `"1.5e18"`, `"1.234e18"`
  - `BigNum.toNumber(a) -> number`
  - `BigNum.add(a, b) -> {m, e}`
  - `BigNum.sub(a, b) -> {m, e}`
  - `BigNum.mul(a, b) -> {m, e}`
  - `BigNum.div(a, b) -> {m, e}`
  - `BigNum.pow(a, n: number) -> {m, e}`
  - `BigNum.cmp(a, b) -> -1 | 0 | 1`
  - `BigNum.floor(a) -> {m, e}`
  - `BigNum.sqrt(a) -> {m, e}`
  - `BigNum.log10(a) -> number`
  - `BigNum.isZero(a) -> boolean`
  - `BigNum.norm(m: number, e: number) -> {m, e}` — exported for tests and for the offline integrator

All arithmetic functions are pure and never mutate their arguments.

- [ ] **Step 1: Write the failing test**

```js
// test/bignum.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BigNum } from './bundle.mjs';

test('normalizes mantissa into [1,10)', () => {
  assert.deepEqual(BigNum.fromNumber(1234), { m: 1.234, e: 3 });
  assert.deepEqual(BigNum.fromNumber(0.5), { m: 5, e: -1 });
  assert.deepEqual(BigNum.fromNumber(0), { m: 0, e: 0 });
});

test('adds beyond native float precision', () => {
  const a = BigNum.fromNumber(1e300);
  const b = BigNum.fromNumber(1e300);
  const sum = BigNum.add(a, b);
  assert.deepEqual(sum, { m: 2, e: 300 });
});

test('mul then div is an exact round-trip at high exponent', () => {
  const x = BigNum.fromString('1.234567e250');
  const rt = BigNum.div(BigNum.mul(x, BigNum.fromString('9.876e120')), BigNum.fromString('9.876e120'));
  const relErr = Math.abs(rt.m - x.m) / x.m;
  assert.ok(relErr < 1e-12, `relative error ${relErr} should be < 1e-12`);
  assert.equal(rt.e, x.e);
});

test('mantissa stays normalized across long mul chains', () => {
  let v = BigNum.fromNumber(1.234);
  for (let i = 0; i < 5000; i++) v = BigNum.mul(v, BigNum.fromNumber(1.0001));
  assert.ok(v.m >= 1 && v.m < 10, `mantissa ${v.m} out of range`);
});

test('cmp orders across exponents', () => {
  assert.equal(BigNum.cmp(BigNum.fromString('9e5'), BigNum.fromString('1e6')), -1);
  assert.equal(BigNum.cmp(BigNum.fromString('1e6'), BigNum.fromString('1e6')), 0);
  assert.equal(BigNum.cmp(BigNum.fromString('2e6'), BigNum.fromString('1e6')), 1);
});

test('sqrt and log10 are correct', () => {
  assert.ok(Math.abs(BigNum.sqrt(BigNum.fromNumber(1e6)).m - 1) < 1e-12);
  assert.equal(BigNum.sqrt(BigNum.fromNumber(1e6)).e, 3);
  assert.ok(Math.abs(BigNum.log10(BigNum.fromNumber(1e42)) - 42) < 1e-9);
});

test('div by zero yields Infinity sentinel rather than NaN', () => {
  const r = BigNum.div(BigNum.fromNumber(1), BigNum.fromNumber(0));
  assert.equal(r.e, Number.POSITIVE_INFINITY);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `BigNum` is not exported from the bundle.

- [ ] **Step 3: Implement `src/05_bignum.js`**

Implement `norm(m, e)` first: while `m >= 10` divide by 10 and `e++`; while `m < 1 && m > 0` multiply by 10 and `e--`; zero short-circuits to `{m:0,e:0}`.

Implement `add`/`sub` by aligning exponents (shift the smaller `m` by the exponent difference) and correcting with a renormalize afterwards. `mul` is `norm(a.m * b.m, a.e + b.e)`. `div` is `norm(a.m / b.m, a.e - b.e)`. `sqrt` is `norm(Math.sqrt(a.m), a.e / 2)` — note the exponent is fractional, so normalize after. `log10` is `Math.log10(a.m) + a.e`. `pow` splits `x^y = 10^(y * log10(x))` and re-derives via `norm`.

Division by zero returns `{m: 1, e: Infinity}` — a deliberate sentinel so arithmetic never produces `NaN` and the UI can detect it.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — BigNum tests green.

- [ ] **Step 5: Commit**

```bash
git add src/05_bignum.js src/exports.json test/bignum.test.js
git commit -m "feat(bignum): mantissa/exponent arithmetic with exact round-trips"
```

---

### Task 3: CONFIG and number formatting

**Files:**
- Create: `src/00_config.js`
- Modify: `src/05_bignum.js` (append formatting), `src/exports.json` (append `"fmt"`)
- Test: `test/format.test.js`

**Interfaces:**
- Consumes: `BigNum` from Task 2
- Produces:
  - global `CONFIG` — the single source of every balance number (spec §6, §7, §8, §10.2)
  - global `fmt` with:
    - `fmt.num(a: {m,e}, opts?: {decimals?: number}) -> string`
    - `fmt.notation: 'standard' | 'scientific' | 'engineering'`
    - `fmt.setNotation(mode: string) -> void`
  - `CONFIG.SUFFIXES` is an array of short-scale names, index 1 = `"K"`, index 2 = `"M"`, index 3 = `"B"`, index 4 = `"T"`, index 5 = `"Qa"`, continuing to cover 1e303 (101 entries)

- [ ] **Step 1: Write the failing test**

```js
// test/format.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fmt, CONFIG, BigNum } from './bundle.mjs';

test('formats below 1000 as plain integers', () => {
  assert.equal(fmt.num(BigNum.fromNumber(0)), '0');
  assert.equal(fmt.num(BigNum.fromNumber(7)), '7');
  assert.equal(fmt.num(BigNum.fromNumber(999)), '999');
});

test('uses 2-3 significant decimals with suffixes', () => {
  assert.equal(fmt.num(BigNum.fromString('1.54e4')), '15.4K');
  assert.equal(fmt.num(BigNum.fromString('2.80e6')), '2.80M');
  assert.equal(fmt.num(BigNum.fromString('1e9')), '1.00B');
});

test('every suffix boundary renders correctly', () => {
  for (let i = 1; i < CONFIG.SUFFIXES.length; i++) {
    const s = CONFIG.SUFFIXES[i];
    assert.equal(fmt.num(BigNum.fromString(`1e${i * 3}`)), `1.00${s}`,
      `boundary 1e${i * 3} should render as 1.00${s}`);
  }
});

test('scientific notation renders exponents', () => {
  fmt.setNotation('scientific');
  assert.match(fmt.num(BigNum.fromString('1.234e18')), /^1\.234e\+?18$/);
  fmt.setNotation('standard');
});

test('engineering notation uses exponents divisible by three', () => {
  fmt.setNotation('engineering');
  assert.match(fmt.num(BigNum.fromString('1.234e20')), /e\+?21$/);
  fmt.setNotation('standard');
});

test('CONFIG.SUFFIXES covers to 1e303', () => {
  assert.equal(CONFIG.SUFFIXES.length, 101);
  assert.equal(CONFIG.SUFFIXES[0], '');
  assert.equal(CONFIG.SUFFIXES[1], 'K');
  assert.equal(CONFIG.SUFFIXES[2], 'M');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `fmt` is not exported.

- [ ] **Step 3: Implement `src/00_config.js`**

`00_config.js` must be a single `const CONFIG = { ... }` containing at minimum, with these exact values:

```js
THRESHOLD_BASE: 150,
THRESHOLD_GROWTH: 3.1,
CLICK_BASE: 1,
LINK_RATE: 0.02,          // share of greasePerSec added to click power
LINK2: 0.0004,           // share of greasePerSec feeding each secondary currency
MILESTONES: { employee: {25:2,50:2,100:2,200:2}, automation: {25:2,50:2,100:2,200:2} },
CRIT: { normal: 0.9479, critical: 0.05, mega: 0.002, jackpot: 0.0001,
        multCritical: 10, multMega: 100, multJackpot: 10000 },
COMBO: { decayMs: 1500, tiers: [ {at:10,v:1.10},{at:25,v:1.25},{at:50,v:1.50},
        {at:100,v:2},{at:500,v:10},{at:1000,v:100} ] },
BOOSTER: { maxActive: 4, softCap: 1000 },
OFFLINE: { maxHours: 8, efficiency: 0.5 },
AUTOSAVE_MS: 15000,
CRIT_CHANCE_BASE: 0.05,
MAX_FLASHES_PER_SEC: 3,
CONFIRM_THRESHOLD: 1e12,
NOTATION_JOKES: [ {at:1e60,text:'YOUR CALCULATOR HAS GIVEN UP'},
                  {at:1e100,text:'SCIENTIFIC NOTATION ENABLED'},
                  {at:1e200,text:'NUMBERS ARE NO LONGER MEANINGFUL'} ],
SUFFIXES: [ /* 101 entries, generated */ ]
```

Plus the 12 palette values, `TEXT_SCALE: [100,125,150]`, and `LOCATIONS: 10`.

- [ ] **Step 4: Append formatting to `src/05_bignum.js`**

`fmt.num` selects by mode. Standard: below 1000 renders the integer (or one decimal for 0-999 values under 10); otherwise find `tier = floor(log10 / 3)`, divide mantissa by `1000^(tier-1)` conceptually and render with 2-3 significant decimals plus `SUFFIXES[tier]`.

Standard decimals rule, pinned exactly: values `>= 100` show 0 decimals, `>= 10` show 1, otherwise 2 — so `15.4K` and `2.80M` both come out right.

Scientific: `mantissa + "e" + exponent`. Engineering: exponent rounded up to the next multiple of 3, mantissa rescaled to match.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — formatting tests green.

- [ ] **Step 6: Commit**

```bash
git add src/00_config.js src/05_bignum.js src/exports.json test/format.test.js
git commit -m "feat(config): balance constants and BigNum formatting in three notations"
```

---

### Task 4: Utilities — RNG, dates, storage, pools, pubsub

**Files:**
- Create: `src/06_utils.js`
- Modify: `src/exports.json` (append `"rng"`, `"dkey"`, `"daysBetween"`, `"parseDateKey"`, `"makeStore"`, `"Emitter"`)
- Test: `test/utils.test.js`, `test/dates.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `rng(seed?: number) -> () => number` — mulberry32. Seeded runs are deterministic; omitted seed uses `Math.random`.
  - `rngPick(arr, r) -> item` — uniform pick
  - `rngWeighted(entries: [{weight, ...}], r) -> entry` — weights need not sum to 1
  - `rngInt(minInclusive, maxExclusive, r) -> number`
  - `dkey(ts?: number) -> 'YYYY-MM-DD'` — from **local** date parts
  - `parseDateKey(key: string) -> {y, m, d}`
  - `daysBetween(aKey: string, bKey: string) -> number` — signed calendar-day difference, DST-safe
  - `makeStore(storage = globalThis.localStorage) -> { get, set, remove }` — never throws; falls back to an in-memory Map and reports `store.persistent === false`
  - `Emitter` class: `on(evt, fn) -> offFn`, `off(evt, fn)`, `emit(evt, payload)`
  - `Pool` class: `Pool(factory, size)`, `.get() -> item`, `.release(item)`

- [ ] **Step 1: Write the failing tests**

```js
// test/utils.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rng, rngWeighted, Emitter, Pool, makeStore } from './bundle.mjs';

test('seeded rng is deterministic', () => {
  const a = rng(12345); const b = rng(12345);
  for (let i = 0; i < 100; i++) assert.equal(a(), b());
});

test('rngWeighted respects weights and needs not sum to 1', () => {
  const r = rng(7);
  const table = [{ weight: 0, name: 'never' }, { weight: 10, name: 'always' }];
  for (let i = 0; i < 200; i++) assert.equal(rngWeighted(table, r).name, 'always');
});

test('Emitter unsubscribes cleanly', () => {
  const e = new Emitter(); let n = 0;
  const off = e.on('x', () => n++);
  e.emit('x'); e.emit('x'); off(); e.emit('x');
  assert.equal(n, 2);
});

test('Pool recycles items without unbounded growth', () => {
  let made = 0;
  const p = new Pool(() => ({ i: made++ }), 4);
  const a = p.get(); p.release(a);
  for (let i = 0; i < 100; i++) p.get();
  assert.equal(made, 4);
});

test('makeStore survives a throwing storage', () => {
  const hostile = { getItem(){throw new Error('denied')}, setItem(){throw new Error('quota')}, removeItem(){throw new Error()} };
  const s = makeStore(hostile);
  assert.equal(s.persistent, false);
  assert.doesNotThrow(() => s.set('k', 'v'));
  assert.equal(s.get('k'), 'v');
});
```

```js
// test/dates.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dkey, parseDateKey, daysBetween } from './bundle.mjs';

test('dkey uses local calendar parts', () => {
  assert.equal(dkey(new Date(2026, 9, 6, 23, 59).getTime()), '2026-10-06');
  assert.equal(dkey(new Date(2026, 0, 1, 0, 0).getTime()), '2026-01-01');
});

test('daysBetween counts calendar days, not 24h blocks', () => {
  assert.equal(daysBetween('2026-10-06', '2026-10-07'), 1);
  assert.equal(daysBetween('2026-10-06', '2026-10-06'), 0);
  assert.equal(daysBetween('2026-10-07', '2026-10-06'), -1);
});

test('daysBetween is exact across a DST transition', () => {
  // US spring-forward 2026-03-08 and fall-back 2026-11-01 are 23h and 25h days
  assert.equal(daysBetween('2026-03-07', '2026-03-09'), 2);
  assert.equal(daysBetween('2026-10-31', '2026-11-02'), 2);
});

test('daysBetween is exact across a year boundary', () => {
  assert.equal(daysBetween('2025-12-31', '2026-01-01'), 1);
  assert.equal(daysBetween('2024-02-28', '2024-03-01'), 2); // leap year
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — exports missing.

- [ ] **Step 3: Implement `src/06_utils.js`**

`daysBetween` must normalize both keys to UTC midnight before subtracting, then divide the difference by 86,400,000. Naive millisecond arithmetic is exactly the DST bug these tests exist to catch — do not use elapsed-time division.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/06_utils.js src/exports.json test/utils.test.js test/dates.test.js
git commit -m "feat(utils): seeded rng, DST-safe date helpers, resilient store, pool, emitter"
```

---

### Task 5: Data — currencies, food levels, locations

**Files:**
- Create: `src/01_data_core.js`
- Modify: `src/exports.json` (append `"DATA"`)
- Test: `test/data-core.test.js`

**Interfaces:**
- Consumes: `CONFIG`, `BigNum` from Tasks 2-3
- Produces a global `DATA` object accumulating across Tasks 5-8 with these keys:
  - `DATA.currencies` — 7 entries: `{ id, name, symbol, unlockLevel, earns: string[], spends: string[], palette }` where `id` ∈ `grease, fry, fizz, chicken, spice, clout, crimes`
  - `DATA.foodLevels` — exactly 50 entries: `{ id, name, buildingName, sprite, locationId, threshold, unlocks: string[], quips: string[], accent }`
  - `DATA.locations` — 10 entries: `{ id, name, levelFrom, levelTo, palette, signJoke, ambient: string[] }`
- `DATA.thresholdFor(n: number) -> {m, e}` — `150 * 3.1^(n-1)` via `BigNum.pow`

- [ ] **Step 1: Write the failing test**

```js
// test/data-core.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DATA, BigNum, CONFIG } from './bundle.mjs';

test('there are exactly 50 food levels in order', () => {
  assert.equal(DATA.foodLevels.length, 50);
  assert.equal(DATA.foodLevels[0].name, 'Sad Egg');
  assert.equal(DATA.foodLevels[4].name, 'Burger');
  assert.equal(DATA.foodLevels[49].name, 'THE OMNIFOOD');
});

test('every food level carries its spec building name', () => {
  const expected = { 'Sad Egg':'Egg Cart', 'Fries':'Fry Station', 'Soda':'Drink Machine',
    'Chicken':'Chicken Counter', 'Mystery Food':'Food Research Lab',
    'THE OMNIFOOD':'THE END™' };
  for (const [food, building] of Object.entries(expected)) {
    const lvl = DATA.foodLevels.find(f => f.name === food);
    assert.ok(lvl, `missing food level ${food}`);
    assert.equal(lvl.buildingName, building);
  }
});

test('threshold formula matches the spec anchor values', () => {
  const at = n => DATA.thresholdFor(n);
  assert.equal(at(1).e, 2);                    // 150
  assert.ok(Math.abs(at(2).m - 4.65) < 0.01);  // ~465
  assert.ok(at(10).e >= 6 && at(10).e <= 7);    // ~4.0e6
  assert.ok(at(50).e >= 26 && at(50).e <= 27);  // ~1.8e26
});

test('thresholds strictly increase', () => {
  for (let n = 2; n <= 50; n++) {
    assert.equal(BigNum.cmp(DATA.thresholdFor(n), DATA.thresholdFor(n - 1)), 1,
      `threshold ${n} must exceed ${n - 1}`);
  }
});

test('10 locations tile levels 1-50 with no gaps or overlaps', () => {
  assert.equal(DATA.locations.length, 10);
  assert.equal(DATA.locations[0].levelFrom, 1);
  assert.equal(DATA.locations[9].levelTo, 50);
  for (let i = 1; i < DATA.locations.length; i++) {
    assert.equal(DATA.locations[i].levelFrom, DATA.locations[i-1].levelTo + 1);
  }
});

test('every food maps to a real location', () => {
  const ids = new Set(DATA.locations.map(l => l.id));
  for (const f of DATA.foodLevels) assert.ok(ids.has(f.locationId), `bad locationId on ${f.name}`);
});

test('all 7 currencies have at least one earn and one spend', () => {
  assert.equal(DATA.currencies.length, 7);
  for (const c of DATA.currencies) {
    assert.ok(c.earns.length > 0, `${c.id} has no earn source`);
    assert.ok(c.spends.length > 0, `${c.id} has no spend sink`);
  }
});

test('secondary currencies unlock at their spec levels', () => {
  const by = id => DATA.currencies.find(c => c.id === id);
  assert.equal(by('grease').unlockLevel, 1);
  assert.equal(by('fry').unlockLevel, 6);
  assert.equal(by('fizz').unlockLevel, 7);
  assert.equal(by('chicken').unlockLevel, 8);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `DATA` is not exported.

- [ ] **Step 3: Implement `src/01_data_core.js`**

Transcribe all 50 foods with exact names and building names from spec §7.1 of the design doc. Set `sprite` ids from the hand-authored set; levels 25-50 use procedural variation but still get a distinct `sprite` id and an `accent` palette. Populate `quips` per the 40-quip budget in Task 8.

`DATA.thresholdFor(n)` computes `BigNum.pow(BigNum.fromNumber(CONFIG.THRESHOLD_GROWTH), n - 1)` then multiplies by `CONFIG.THRESHOLD_BASE`.

Write the 10 locations from spec §7.9 including their scene notes and `signJoke` strings.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/01_data_core.js src/exports.json test/data-core.test.js
git commit -m "feat(data): 50 food levels, 10 locations, 7 currencies, threshold formula"
```

---

### Task 6: Data — the four upgrade trees

**Files:**
- Create: `src/02_data_upgrades.js`
- Modify: `src/exports.json` (append nothing new; `DATA.upgrades` extends the existing `DATA`)
- Test: `test/data-upgrades.test.js`

**Interfaces:**
- Consumes: `DATA`, `CONFIG` from Tasks 3, 5
- Produces:
  - `DATA.upgrades` — flat array of 104 entries: `{ id, name, desc, tree, tier, cost:{currency,amount}, effect:{type,value}, requires:string[], levelReq, rarity, flavorText }` where `tree` ∈ `food, fry, drink, chicken`
  - `DATA.upgradeById: Map<string, entry>`
  - `genUpgradeEffect(tree, index, total) -> {type, value}` — the deterministic generator from spec §7.2

- [ ] **Step 1: Write the failing test**

```js
// test/data-upgrades.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DATA } from './bundle.mjs';

test('tree sizes match the spec exactly', () => {
  const count = t => DATA.upgrades.filter(u => u.tree === t).length;
  assert.equal(count('food'), 25);
  assert.equal(count('fry'), 27);
  assert.equal(count('drink'), 26);
  assert.equal(count('chicken'), 26);
  assert.equal(DATA.upgrades.length, 104);
});

test('Food tree percentages match the original spec verbatim', () => {
  const food = DATA.upgrades.filter(u => u.tree === 'food');
  const expected = [5,10,15,25,30,40,50,75,100,150,250,400,600,1000,2500,
    5000,10000,25000,50000,100000,500000,1000000,10000000,100000000,1000000000];
  assert.deepEqual(food.map(u => u.effect.value), expected);
});

test('Food tree names match the original spec verbatim', () => {
  const food = DATA.upgrades.filter(u => u.tree === 'food');
  assert.equal(food[0].name, 'Slightly Better Ingredients');
  assert.equal(food[24].name, 'The Food Has Become Sentient');
});

test('tree finale story beats are present', () => {
  const byTree = t => DATA.upgrades.filter(u => u.tree === t);
  assert.equal(byTree('drink').at(-1).name, 'The Ocean Is Now Soda');
  assert.equal(byTree('chicken').at(-1).name, 'The Chicken Has Achieved Consciousness');
  assert.equal(byTree('fry').at(-1).name, 'Infinite Crispy');
});

test('the generator is deterministic and escalating', () => {
  const a = DATA.genUpgradeEffect('fry', 0, 27);
  const b = DATA.genUpgradeEffect('fry', 0, 27);
  assert.deepEqual(a, b);
  const early = DATA.genUpgradeEffect('fry', 0, 27).value;
  const late  = DATA.genUpgradeEffect('fry', 26, 27).value;
  assert.ok(late > early * 1000, `late ${late} should dwarf early ${early}`);
});

test('every upgrade has complete, well-formed data', () => {
  for (const u of DATA.upgrades) {
    assert.ok(u.id && u.name && u.desc && u.flavorText, `${u.id} missing text`);
    assert.ok(['food','fry','drink','chicken'].includes(u.tree), `${u.id} bad tree`);
    assert.ok(u.cost.amount > 0, `${u.id} non-positive cost`);
    assert.ok(['grease','fry','fizz','chicken','spice'].includes(u.cost.currency), `${u.id} bad currency`);
    assert.ok(u.effect && typeof u.effect.value === 'number', `${u.id} bad effect`);
    assert.ok(Number.isInteger(u.levelReq) && u.levelReq >= 1, `${u.id} bad levelReq`);
  }
});

test('requires point only at real upgrade ids', () => {
  for (const u of DATA.upgrades) {
    for (const r of u.requires) assert.ok(DATA.upgradeById.has(r), `${u.id} requires missing ${r}`);
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `DATA.upgrades` undefined.

- [ ] **Step 3: Implement `src/02_data_upgrades.js`**

Transcribe all 104 names verbatim from the original spec §2-§5 (Fry 27, Drink 26, Chicken 26 are name-only from the source). Food tree percentages come from the spec exactly as pinned in the test.

Implement `genUpgradeEffect(tree, index, total)` per spec §7.2: split into thirds; early `value = 0.05 + 0.055 * i`, mid `value = 2 ** (1 + i)`, late `value = 10 ** (3 + 2 * i)`; map thirds to theme effect types — Fry early `prodMult` / mid `critChance` / late `critMult`; Drink early `fizzRate` / mid `boosterDuration` / late `fizzRate`; Chicken early `chestLuck` / mid `chickenRate` / late `spiceGain`.

Chains `requires` sequentially within a tree so the tree graph is walkable from the first upgrade.

Write the generated table to `docs/generated-upgrades.md` at build time (append to `build.js`) so it can be reviewed and hand-overridden.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/02_data_upgrades.js src/exports.json test/data-upgrades.test.js build.js
git commit -m "feat(data): 104 upgrades across four trees with deterministic effect generator"
```

---

### Task 7: Data — employees and automation

**Files:**
- Create: `src/03_data_people.js`
- Modify: `src/exports.json`
- Test: `test/data-people.test.js`

**Interfaces:**
- Consumes: `DATA`, `CONFIG` from Tasks 3, 5
- Produces:
  - `DATA.employees` — 30 entries: `{ id, name, tier, portrait, cost:{currency,amount}, rate, effect, desc, flavorText }`, tiers 1-6 of five each
  - `DATA.automation` — 21 entries: `{ id, name, group, rate, cost:{currency,amount}, icon, desc, flavorText }`, `group` ∈ `early, mid, late`
  - `DATA.employeeById`, `DATA.automationById` as Maps

- [ ] **Step 1: Write the failing test**

```js
// test/data-people.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DATA } from './bundle.mjs';

test('30 employees in 6 tiers of exactly 5', () => {
  assert.equal(DATA.employees.length, 30);
  for (let t = 1; t <= 6; t++) {
    assert.equal(DATA.employees.filter(e => e.tier === t).length, 5, `tier ${t}`);
  }
});

test('employee names match the original spec verbatim', () => {
  const names = DATA.employees.map(e => e.name);
  assert.equal(names[0], 'Intern');
  assert.equal(names[4], 'Cook');
  assert.equal(names[5], 'Chef');
  assert.equal(names[20], 'Burger Wizard');
  assert.equal(names.at(-1), 'The Omnichef');
  assert.ok(names.includes('Food Intelligence'));
  assert.ok(names.includes("World's Greatest Chef"));
});

test('21 automation machines with the spec rates exactly', () => {
  assert.equal(DATA.automation.length, 21);
  const by = n => DATA.automation.find(a => a.name === n);
  assert.equal(by('Basic Clicker').rate, 1);
  assert.equal(by('Food Conveyor').rate, 100);
  assert.equal(by('Robot Cook').rate, 1e3);
  assert.equal(by('Automated Restaurant').rate, 1e5);
  assert.equal(by('Galactic Food Network').rate, 1e12);
  assert.equal(by('Universal Food Production').rate, 1e15);
});

test('automation rates increase monotonically', () => {
  for (let i = 1; i < DATA.automation.length; i++) {
    assert.ok(DATA.automation[i].rate > DATA.automation[i-1].rate,
      `${DATA.automation[i].name} rate must exceed ${DATA.automation[i-1].name}`);
  }
});

test('Omniversal Kitchen is the finite stand-in for infinity', () => {
  const omni = DATA.automation.find(a => a.name === 'Omniversal Kitchen');
  assert.ok(Number.isFinite(omni.rate), 'rate must be finite even though the label says infinity');
  assert.ok(omni.rate >= 1e30, 'rate should be astronomically large');
  assert.equal(omni.displayName, '∞');
});

test('automation group sizes are 6/6/9', () => {
  const g = k => DATA.automation.filter(a => a.group === k).length;
  assert.equal(g('early'), 6); assert.equal(g('mid'), 6); assert.equal(g('late'), 9);
});

test('cost growth factors sit in the spec 1.12-1.18 band', () => {
  for (const a of DATA.automation) {
    assert.ok(a.growth >= 1.12 && a.growth <= 1.18, `${a.id} growth ${a.growth} out of band`);
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `DATA.employees` undefined.

- [ ] **Step 3: Implement `src/03_data_people.js`**

Transcribe all 30 employee names and all 21 automation names with rates from spec §7.3 and §7.4. `Universal Food Production` is `1Qa/sec` = 1e15. `Omniversal Kitchen` gets `rate: 1e30` with `displayName: '∞'` so arithmetic never sees infinity.

Employee `rate` and `cost` follow spec §6 `cost(n) = baseCost * growth^n`, with tier-scaled baseCost so later tiers cost ~10-14x more while producing ~8-12x more. Assign each employee a themed `effect` from the Task 3 enum.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/03_data_people.js src/exports.json test/data-people.test.js
git commit -m "feat(data): 30 employees in 6 tiers and 21 automation machines at spec rates"
```

---

### Task 8: Data — boosters, chests, dailies, achievements, quips

**Files:**
- Create: `src/04_data_loot.js`
- Modify: `src/exports.json`
- Test: `test/data-loot.test.js`

**Interfaces:**
- Consumes: `DATA`, `CONFIG` from Tasks 3, 5
- Produces:
  - `DATA.boosters` — 13 entries per spec §7.6: `{ id, name, rarity, durationMs, effect, desc, flavorText }`
  - `DATA.chests` — 7 entries: `{ tier, id, name, rarity, sprite }`
  - `DATA.chestTables` — per-tier weighted reward tables; each entry `{ weight, kind, id, amount }` where `kind` ∈ `currency, booster, buff, upgrade`
  - `DATA.chestPity` — `{ epicAfter: N, legendaryAfter: M, softener: 0.02 }`
  - `DATA.dailyCalendar` — 30 entries: `{ day, rewards: [...], milestone?: number }`
  - `DATA.streakMilestones` — 7 entries keyed 3/7/14/30/50/100/365
  - `DATA.achievements` — 115 entries: `{ id, name, desc, category, clout, hidden, check(state) -> boolean }`
  - `DATA.quips` — 40+ entries: `{ text, tag }`, `tag` ∈ `early, mid, late, comboBreak, idle, highLevel`

- [ ] **Step 1: Write the failing test**

```js
// test/data-loot.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DATA } from './bundle.mjs';

test('7 chest tiers with escalating rarity', () => {
  assert.equal(DATA.chests.length, 7);
  assert.deepEqual(DATA.chests.map(c => c.rarity),
    ['common','uncommon','rare','epic','legendary','mythic','secret']);
  assert.deepEqual(DATA.chests.map(c => c.name),
    ['Grease Bin','Napkin Bundle','Sauce Packet Case','Supply Crate',
     'Franchise Vault','Anomaly Crate','[REDACTED]']);
});

test('no chest table awards out-of-scope systems', () => {
  for (const t of DATA.chestTables) {
    for (const r of t.entries) {
      assert.ok(['currency','booster','buff','upgrade'].includes(r.kind),
        `illegal reward kind "${r.kind}" — pets/cards/cosmetics are out of scope`);
    }
  }
});

test('every chest tier has a non-empty table with positive weights', () => {
  assert.equal(DATA.chestTables.length, 7);
  for (const t of DATA.chestTables) {
    assert.ok(t.entries.length > 0, `tier ${t.tier} empty`);
    for (const e of t.entries) assert.ok(e.weight > 0, `non-positive weight in tier ${t.tier}`);
  }
});

test('13 boosters, each with a duration and effect', () => {
  assert.equal(DATA.boosters.length, 13);
  for (const b of DATA.boosters) {
    assert.ok(b.durationMs > 0, `${b.id} missing duration`);
    assert.ok(b.effect && b.effect.type, `${b.id} missing effect`);
  }
  assert.ok(DATA.boosters.some(b => b.id === 'burger-time'), 'Burger Time must exist');
});

test('Burger Time makes every click a crit', () => {
  const bt = DATA.boosters.find(b => b.id === 'burger-time');
  assert.equal(bt.effect.type, 'forceCrit');
  assert.equal(bt.effect.value, true);
});

test('30-day calendar with the 7 streak milestones', () => {
  assert.equal(DATA.dailyCalendar.length, 30);
  for (const d of DATA.dailyCalendar) assert.ok(d.rewards.length > 0, `day ${d.day} empty`);
  assert.deepEqual(DATA.streakMilestones.map(m => m.day), [3,7,14,30,50,100,365]);
});

test('Day 30 grants the permanent Golden Burger', () => {
  const d30 = DATA.dailyCalendar.find(d => d.day === 30);
  assert.ok(d30, 'day 30 must exist');
  assert.deepEqual(d30.rewards.map(r => r.id), ['golden-burger']);
});

test('115 achievements across all 11 categories', () => {
  assert.equal(DATA.achievements.length, 115);
  const cats = new Set(DATA.achievements.map(a => a.category));
  for (const c of ['clicking','production','levels','currency','employees',
                   'automation','chests','boosters','streaks','absurd','secret']) {
    assert.ok(cats.has(c), `missing category ${c}`);
  }
});

test('at least 8 secret achievements, all hidden with no requirement text', () => {
  const secrets = DATA.achievements.filter(a => a.category === 'secret');
  assert.ok(secrets.length >= 8, `only ${secrets.length} secrets`);
  for (const s of secrets) {
    assert.equal(s.hidden, true, `${s.id} must be hidden`);
    assert.equal(s.desc, '???', `${s.id} must not reveal its condition`);
  }
});

test("Don't Click The Potato is present and hidden", () => {
  const p = DATA.achievements.find(a => a.id === 'dont-click-the-potato');
  assert.ok(p, 'potato achievement missing');
  assert.equal(p.hidden, true);
  assert.equal(p.category, 'secret');
});

test('every achievement has clout and a callable check', () => {
  for (const a of DATA.achievements) {
    assert.ok(a.clout > 0, `${a.id} grants no clout`);
    assert.equal(typeof a.check, 'function', `${a.id} has no check`);
  }
});

test('40+ quips covering every context tag, none empty', () => {
  assert.ok(DATA.quips.length >= 40, `only ${DATA.quips.length} quips`);
  for (const t of ['early','mid','late','comboBreak','idle','highLevel']) {
    assert.ok(DATA.quips.some(q => q.tag === t), `no quips tagged ${t}`);
  }
  assert.ok(DATA.quips.some(q => q.text === "Please stop."));
});

test('pity config is armed with both guarantees', () => {
  assert.ok(DATA.chestPity.epicAfter > 0);
  assert.ok(DATA.chestPity.legendaryAfter > DATA.chestPity.epicAfter,
    'legendary guarantee must be further out than epic');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `DATA.boosters` undefined.

- [ ] **Step 3: Implement `src/04_data_loot.js`**

Transcribe the 13 boosters, 7 chest tiers, 30-day calendar, and all 115 achievements from spec §7.6-§7.10 verbatim. Achievement `check(state)` functions read only from the state shape in spec §4.

Per approved decision §17.3, chest tables must contain **no** `pet`, `card`, or `cosmetic` reward kinds. The test pins this.

Place the hidden potato sprite reference on a location background so `dont-click-the-potato` can be detected by a click test against the potato's hit region.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/04_data_loot.js src/exports.json test/data-loot.test.js
git commit -m "feat(data): boosters, 7 chest tiers with pity, dailies, 115 achievements, quips"
```

---

### Task 9: Cross-table data validator

**Files:**
- Create: `src/07_validate.js`
- Modify: `src/exports.json` (append `"validateData"`)
- Test: `test/data-validate.test.js`

**Interfaces:**
- Consumes: all `DATA` tables from Tasks 5-8
- Produces `validateData(data = DATA) -> string[]` returning human-readable error strings; **empty array means valid**. `build.js` calls it and fails the build on any non-empty result.

- [ ] **Step 1: Write the failing test**

```js
// test/data-validate.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateData, DATA } from './bundle.mjs';

test('the shipped data passes validation', () => {
  const errors = validateData(DATA);
  assert.deepEqual(errors, [], `data errors:\n${errors.join('\n')}`);
});

test('detects duplicate ids', () => {
  const bad = structuredClone(DATA.achievements);
  bad.push({ ...bad[0] });
  const errs = validateData({ ...DATA, achievements: bad });
  assert.ok(errs.some(e => /duplicate id/i.test(e)), 'should flag duplicate achievement id');
});

test('detects a dangling requires reference', () => {
  const bad = DATA.upgrades.map(u => ({ ...u }));
  bad[0] = { ...bad[0], requires: ['does-not-exist'] };
  const errs = validateData({ ...DATA, upgrades: bad });
  assert.ok(errs.some(e => /does-not-exist/.test(e)), 'should flag dangling requires');
});

test('detects an unknown effect type', () => {
  const bad = DATA.upgrades.map(u => ({ ...u }));
  bad[0] = { ...bad[0], effect: { type: 'teleport', value: 1 } };
  const errs = validateData({ ...DATA, upgrades: bad });
  assert.ok(errs.some(e => /teleport/.test(e)), 'should flag unknown effect type');
});

test('detects non-positive costs and unreachable levelReq', () => {
  const bad = DATA.upgrades.map(u => ({ ...u }));
  bad[0] = { ...bad[0], cost: { currency: 'grease', amount: 0 } };
  bad[1] = { ...bad[1], levelReq: 999 };
  const errs = validateData({ ...DATA, upgrades: bad });
  assert.ok(errs.some(e => /amount 0|non-positive/.test(e)));
  assert.ok(errs.some(e => /levelReq 999/.test(e)));
});

test('detects an achievement referencing a nonexistent currency', () => {
  const bad = DATA.achievements.slice();
  bad[0] = { ...bad[0], requires: { currency: 'ghostbucks' } };
  const errs = validateData({ ...DATA, achievements: bad });
  assert.ok(errs.some(e => /ghostbucks/.test(e)));
});

test('detects an upgrade requirement loop', () => {
  const bad = DATA.upgrades.map(u => ({ ...u }));
  const a = bad.find(u => u.tree === 'food');
  a.requires = [bad.find(u => u.tree === 'food' && u.id !== a.id).id];
  const errs = validateData({ ...DATA, upgrades: bad });
  assert.ok(errs.length >= 0); // cycle detection is best-effort; must not hang or throw
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `validateData` not exported.

- [ ] **Step 3: Implement `src/07_validate.js`**

Check, in order: unique ids within every table; every `requires` id exists; every `effect.type` ∈ the Task 3 enum; every `cost.amount > 0`; every `cost.currency` ∈ `DATA.currencies`; every `levelReq` within 1-50; every `foodLevels[].locationId` valid; every `locationId` covered by its level range; every `chestTables[].entries[].kind` legal; every `requires.currency` referencing a real currency; and a bounded cycle check over the `requires` graph using a visited set (must terminate on cycles rather than hang).

- [ ] **Step 4: Wire validation into `build.js`**

After concatenation, run the bundle in a Node context and call `validateData()`; if it returns errors, print them and `process.exit(1)`. Add `npm run validate`.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — and `npm run validate` reporting `0 errors`.

- [ ] **Step 6: Commit**

```bash
git add src/07_validate.js src/exports.json test/data-validate.test.js build.js
git commit -m "feat(validate): cross-table data validator that fails the build on typos"
```

---

### Task 10: State, save, migrate, export, import

**Files:**
- Create: `src/09_state.js`
- Modify: `src/exports.json` (append `"newState"`, `"saveGame"`, `"loadGame"`, `"exportSave"`, `"importSave"`, `"checksum"`, `"MIGRATIONS"`, `"SAVE_VERSION"`)
- Test: `test/state.test.js`, `test/save.test.js`

**Interfaces:**
- Consumes: `BigNum`, `CONFIG`, `DATA`, `makeStore` from Tasks 2-5, 4, 9
- Produces:
  - `SAVE_VERSION = 1`
  - `newState(now = Date.now()) -> state` — exact shape from spec §4
  - `checksum(str: string) -> string` — FNV-1a hex
  - `exportSave(state) -> string` — base64 of `{ v, t, c, d }` where `d` is the serialized state and `c` is `checksum(JSON.stringify(d))`
  - `importSave(str) -> { ok, state?, errors: string[], preview?: {level, lifetimeGrease} }` — takes only the string; never throws
  - `validateLoaded(raw) -> string[]` — structural validation used by both `importSave` and `loadGame`; empty array means valid
  - `saveGame(state, store, slot = 'main') -> boolean`
  - `loadGame(store, slot = 'main') -> state`
  - `MIGRATIONS` — registry keyed by the version it upgrades *from*
  - `migrate(raw) -> { ok, state?, error? }`

- [ ] **Step 1: Write the failing tests**

```js
// test/state.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newState, DATA } from './bundle.mjs';

test('fresh state matches the spec shape exactly', () => {
  const s = newState(1000);
  assert.equal(s.saveVersion, 1);
  assert.equal(s.run.foodLevel, 1);
  assert.equal(s.run.upgrades && typeof s.run.upgrades, 'object');
  assert.ok(s.meta.permanentBonuses, 'permanentBonuses must exist for prestige');
  assert.equal(s.meta.permanentBonuses.goldenBurger, false);
  assert.ok(s.meta.chestPity && s.meta.daily && s.meta.streak && s.meta.seen);
  assert.ok(s.settings && s.timestamps.created === 1000);
});

test('all 5 run currencies start at zero and are BigNum-shaped', () => {
  const s = newState(1000);
  for (const c of ['grease','fry','fizz','chicken','spice']) {
    assert.deepEqual(s.run.currencies[c], { m: 0, e: 0 }, `${c} must start at zero`);
  }
});

test('newState returns independent objects', () => {
  const a = newState(1), b = newState(2);
  a.run.upgrades.foo = true;
  assert.equal(b.run.upgrades.foo, undefined, 'states must not share references');
});
```

```js
// test/save.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newState, exportSave, importSave, checksum, migrate, SAVE_VERSION } from './bundle.mjs';

test('export/import round-trips exactly', () => {
  const s = newState(1000);
  s.run.foodLevel = 17;
  s.run.currencies.grease = { m: 4.2, e: 24 };
  s.meta.clout = { m: 88, e: 0 };
  const out = importSave(exportSave(s));
  assert.equal(out.ok, true, out.errors.join('; '));
  assert.equal(out.state.run.foodLevel, 17);
  assert.deepEqual(out.state.run.currencies.grease, { m: 4.2, e: 24 });
  assert.deepEqual(out.state.meta.clout, { m: 88, e: 0 });
});

test('import rejects a tampered payload', () => {
  const s = newState(1000);
  const blob = exportSave(s);
  const obj = JSON.parse(Buffer.from(blob, 'base64').toString('utf8'));
  obj.d.run.foodLevel = 50;
  const tampered = Buffer.from(JSON.stringify(obj)).toString('base64');
  const out = importSave(tampered);
  assert.equal(out.ok, false);
  assert.ok(out.errors.join(' ').match(/checksum/i), 'should name the checksum');
});

test('import rejects malformed input without throwing', () => {
  for (const bad of ['', 'not-base64!!', 'e30', Buffer.from('{}').toString('base64'), 'null']) {
    const out = importSave(bad);
    assert.equal(out.ok, false, `should reject: ${bad}`);
    assert.ok(Array.isArray(out.errors));
  }
});

test('import reports a preview for confirmation', () => {
  const s = newState(1000); s.run.foodLevel = 23;
  const out = importSave(exportSave(s));
  assert.equal(out.preview.level, 23);
});

test('checksum is stable and content-sensitive', () => {
  assert.equal(checksum('abc'), checksum('abc'));
  assert.notEqual(checksum('abc'), checksum('abd'));
});

test('migration chain upgrades an older save', () => {
  const out = migrate({ saveVersion: 0, run: { foodLevel: 5 }, meta: {}, settings: {}, timestamps: {} });
  assert.equal(out.ok, true, out.error);
  assert.equal(out.state.saveVersion, SAVE_VERSION);
});

test('migration refuses a save from the future rather than guessing', () => {
  const out = migrate({ saveVersion: SAVE_VERSION + 5, run: {} });
  assert.equal(out.ok, false);
  assert.match(out.error, /newer|future/i);
});

test('validator rejects wrong types and out-of-range values', () => {
  const s = newState(1000);
  s.run.foodLevel = 'banana';
  s.run.currencies.grease = { m: 1, e: -99999 };
  const out = importSave(exportSave(s));
  assert.equal(out.ok, false);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `newState` not exported.

- [ ] **Step 3: Implement `src/09_state.js`**

`newState()` returns exactly the spec §4 shape with every currency a fresh `{m:0,e:0}` object and no shared references.

Serialization: BigNum → `"m|e"` compact string; sets → sorted arrays; on load, parse back and rebuild BigNums.

`checksum` is FNV-1a over `JSON.stringify(d)` with keys sorted so serialization is deterministic.

`importSave` order: base64-decode → JSON parse → structural validate (types, ranges, version) → checksum verify → migrate → apply. Return `errors` as an array; **never throw**.

`validateLoaded(raw)` must clamp rather than reject where safe (e.g. `foodLevel` clamped to 1-50, `activeBoosters` filtered to known ids) and reject only where corruption is structural.

`MIGRATIONS` registry with the commented example stub from spec §9.

- [ ] **Step 4: Run the tests to verify they passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/09_state.js src/exports.json test/state.test.js test/save.test.js
git commit -m "feat(state): save schema, migration chain, checksummed export/import with validation"
```

---

### Task 11: Offline earnings integration

**Files:**
- Create: `src/10_offline.js`
- Modify: `src/exports.json` (append `"computeOffline"`)
- Test: `test/offline.test.js`

**Interfaces:**
- Consumes: `BigNum`, `CONFIG` from Tasks 2-3; the `productionPerSec`-shaped function is passed in (systems land in Plan 2, so this task tests the integrator against a stub)
- Produces `computeOffline(state, nowMs, productionPerSec) -> { elapsedMs, cappedMs, gains: {currency: {m,e}} }`

- [ ] **Step 1: Write the failing test**

```js
// test/offline.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeOffline, newState, BigNum, CONFIG } from './bundle.mjs';

const prod = () => ({ m: 10, e: 0 }); // 10 grease/sec flat

test('caps absence at the configured maximum', () => {
  const s = newState(0);
  const out = computeOffline(s, 100 * 3600 * 1000, prod); // 100 hours away
  assert.equal(out.capped, true);
  assert.equal(out.elapsedMs, CONFIG.OFFLINE.maxHours * 3600 * 1000);
});

test('applies offline efficiency', () => {
  const s = newState(0);
  const out = computeOffline(s, 3600 * 1000, prod);
  const expected = 10 * 3600 * CONFIG.OFFLINE.efficiency;
  assert.ok(Math.abs(out.gains.grease.m * Math.pow(10, out.gains.grease.e) - expected) < 1);
});

test('clamps a negative elapsed time from a backwards clock', () => {
  const s = newState(10000);
  const out = computeOffline(s, 0, prod);
  assert.equal(out.elapsedMs, 0);
  assert.deepEqual(out.gains.grease, { m: 0, e: 0 });
});

test('an expired booster contributes only for its remaining life', () => {
  const s = newState(0);
  const window = 3600 * 1000;
  s.run.activeBoosters = [{ id: 'x2-grease', startedAt: -600 * 1000, expiresAt: 600 * 1000 }];
  const withBoost = computeOffline(s, window, prod);
  // booster alive for the first 600s of a 3600s window at x2, plain for the rest
  const expected = prod().m * (600 * 2 + 3000) * CONFIG.OFFLINE.efficiency;
  assert.ok(Math.abs(withBoost.gains.grease.m * Math.pow(10, withBoost.gains.grease.e) - expected) < 1,
    'booster must be time-weighted, not applied to the whole window');
});

test('two boosters with different expiries integrate exactly', () => {
  const s = newState(0);
  s.run.activeBoosters = [
    { id: 'a', startedAt: -3600 * 1000, expiresAt: 1800 * 1000 },
    { id: 'b', startedAt: -3600 * 1000, expiresAt: 900 * 1000 },
  ];
  const out = computeOffline(s, 3600 * 1000, prod);
  assert.ok(out.gains.grease.e >= 3, 'should produce a large combined gain');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `computeOffline` not exported.

- [ ] **Step 3: Implement `src/10_offline.js`**

Build the boundary list: window start, window end, and each active booster's `startedAt`/`expiresAt` clipped into the window. Sort and dedupe. For each consecutive pair, compute the product of the multipliers active in that sub-interval, and accumulate `dt * productionPerSec * product`. Multiply the total by `CONFIG.OFFLINE.efficiency`.

This closed-form integration is why the "expired booster" and "two boosters" tests pass — the naive "current multiplier × elapsed" approach gets both wrong.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/10_offline.js src/exports.json test/offline.test.js
git commit -m "feat(offline): closed-form earnings with exact booster time-weighting"
```

---

## Plan 1 Completion Criteria

- [ ] `npm test` passes with every suite green
- [ ] `npm run validate` reports `0 errors`
- [ ] `npm run build` emits a single `index.html` containing all content and no `import`/`export` statements
- [ ] `node build.js --check` passes
- [ ] **All 360 hand-authored content entries validate** — no dangling `requires`, no illegal effect types, no non-positive costs, no unreachable `levelReq`
- [ ] `docs/generated-upgrades.md` exists for review

## Roadmap — Plans 2-4

Not detailed here. Each gets its own plan document once Plan 1 lands, because their interfaces depend on names this plan introduces.

**Plan 2 — Economy (headless).** `src/11_selectors.js`, `src/12_systems.js`, `src/13_progression.js`, `src/14_chests.js`, `src/15_daily.js`, `src/16_achievements.js`, `src/17_actions.js`. Ships `test/balance.test.js` — the "cheapest-payback-first" bot simulator printing level-reached-by-time and PASS/FAIL against the spec §6.3 pacing table, plus both §6.2 milestone variants. Also ships `test/daily.test.js`, which carries the end-to-end date-policy assertions promised in Review Focus line 3 (clock-backward refusal, no double-grant across a timezone shift, Streak Freeze consumption, streak reset). **This is where the economy risk is retired.**

**Plan 3 — Click & Feel.** `src/20_sprites.js` (grid→canvas engine, ~350 sprites), `src/21_audio.js`, `src/22_fx.js`, `src/23_scene.js`, `src/24_input.js`, `src/25_sim.js`, `src/26_boot.js`. Two-canvas render architecture, the click pipeline, combo, crit tiers, particles, pooled floating text, synthesized audio. Ships `test/smoke.test.js` — headless Chrome load, zero console errors, click/buy interaction, screenshots at 1280/375/320.

**Plan 4 — Full UI.** `src/30_ui_*.js` shop trees, employee/automation panels, booster strip, chest opening sequence, daily calendar, achievements grid, stats panel, settings, onboarding, tooltips, mobile bottom-sheet and nav, accessibility pass, dev panel. Ships the checklist 11-14 verification.

## Notes for the implementer

- **Filename prefixes are load-bearing.** `build.js` concatenates lexicographically, so `00_config` must precede `05_bignum`. Do not rename files without re-checking dependency order.
- **Adding a new global means editing `src/exports.json`.** The build test fails if an exported name is not actually defined, which catches the commonest slip.
- **`src/07_validate.js` is named to sort before `09_state.js`** because `build.js` needs it available at validation time, independent of the numeric section mapping in the design doc. The design doc's numbering reflects the brief's original section order, not build order.
- **Do not add `import`/`export` to any file in `src/`.** Node reads the generated `test/bundle.mjs`, never the sources.