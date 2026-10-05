# Snackonomics — Design Specification

**Date:** 2026-10-06
**Status:** Approved design, pending implementation plan
**Build path:** Modular sources + concat build → single self-contained `index.html`

---

## 1. Overview

Snackonomics is a pixel-art idle/clicker game. The player clicks food to earn **Grease**, buys upgrades/employees/automation, levels through **50 foods**, and manages 7 currencies, chests with pity, boosters, dailies/streaks, achievements, offline earnings, and synthesized audio.

### 1.1 Goals

1. The click feels incredible (priority #1)
2. The UI looks handcrafted and cohesive (priority #2)
3. Everything shown actually works — no dead buttons (priority #3)
4. Economy paces to the §5.4 milestone table (priority #4)
5. Writing is funny (priority #5)
6. Code is clean and data-driven (priority #6)

### 1.2 Non-goals (this build)

Pets, cards, random events, lucky wheel, prestige, secret room, cosmetics. Each ships as a visibly **LOCKED / COMING SOON** tile with a one-line joke. The data model is prestige-ready so these can be added later without a save migration crisis.

### 1.3 Success criteria

The 16-point acceptance checklist in §16 of the build brief passes end-to-end.

---

## 2. Deliverable & Build

**Shipped artifact:** `index.html` — one self-contained file. Vanilla JS + CSS. No build step for the player. No external JS libraries. No external images. Google Fonts may load externally, every font with a fallback stack. Runs offline after first load. Publishable as a static page.

**Developer-side tooling** (repo-only, not part of the deliverable):

```
src/          15 modules + sprites/*.js
build.js      ~40 lines — concatenates src/ into index.html
test/         6 suites, run via `node test/run.js`
```

### 2.1 Module map (maps to the brief's §14 section order)

| File | Brief section | Contents |
|---|---|---|
| `src/00_config.js` | 1 | `CONFIG` — every balance number |
| `src/01_data_core.js` | 2 | currencies, foodLevels, locations |
| `src/02_data_upgrades.js` | 2 | 4 trees (104 upgrades) |
| `src/03_data_people.js` | 2 | employees, automation |
| `src/04_data_loot.js` | 2 | boosters, chests, dailies, achievements, quips |
| `src/05_bignum.js` | 3 | BigNum + formatting |
| `src/06_utils.js` | 4 | rng/seed, time, storage, pools, pubsub |
| `src/07_sprites.js` | 5 | sprite engine |
| `src/08_audio.js` | 6 | audio engine |
| `src/09_state.js` | 7 | state, save/migrate/import/export |
| `src/10_systems.js` | 8 | production, boosters, chests/pity, daily/streak, achievements, offline, levels |
| `src/11_sim.js` | 9 | fixed 10Hz accumulator + rAF clock |
| `src/12_fx.js` | 11 | particles, floating text, screen effects |
| `src/13_ui.js` | 10 | components, delegation, render diffing |
| `src/14_boot.js` | 12 | load → offline modal → onboarding |
| `src/sprites/*.js` | — | ~350 sprite grids, split by family |

---

## 3. Architecture

### 3.1 The one rule

**UI reads state and dispatches actions; only systems mutate state.**

### 3.2 Layers, one direction of dependency

```
        DATA / CONFIG  (pure constants, no imports, no side effects)
              ▲            ▲              ▲
              │            │              │
         Selectors    Systems         Build-time data validation
         (pure fns)   (only writer)         (test suite)
              ▲            │
              │            │  emits
              │        Events  (pub/sub)
              │            ▼
              └────────  UI  (reads, dispatches Actions, never writes)
```

### 3.3 Three glue pieces

| Piece | Job | Why |
|---|---|---|
| `Events` | tiny pub/sub (`on/off/emit`) | Systems announce `currency:grease`, `levelup`, `chest:opened`. Without it, UI polls `state` 60×/sec and re-renders everything. |
| `Sel.*` | pure selectors: `Sel.greasePerSec()`, `Sel.clickPower()`, `Sel.canAfford()` | **One** implementation of every formula, shared by systems and UI. Prevents the classic idle-game bug where the stats panel and the real economy drift apart. |
| `Actions.*` | explicit commands: `buyUpgrade`, `buyEmployee`, `buyAutomation`, `openChest`, `claimDaily`, `useBooster`, `spendClout`, `importSave`, `resetSave` | Every state mutation is one greppable line. Makes "no logic in the DOM layer" enforceable. |

### 3.4 Anti-goals

No plugin system, no component framework, no virtual DOM. A ~40-line `patchText()` diff helper beats a 400-line framework for ~40 components and keeps the single-file promise honest.

---

## 4. State Model

```js
state = {
  saveVersion: 1,
  run: {
    foodLevel: 1,
    lifetimeGreaseThisRun: BigNum,
    currencies: { grease, fry, fizz, chicken, spice } // BigNum each; clout is meta
    upgrades:   { [id]: true },
    employees:  { [id]: count },
    automation: { [id]: count },
    activeBoosters: [ { id, startedAt, expiresAt } ],
    combo:      { count, lastClickAt },
    runStartedAt: ts
  },
  meta: {
    prestigeLevel: 0, culinaryCredits: 0, prestigeUpgrades: {},
    achievements: { [id]: { unlockedAt, clout } },
    chestPity:   { [tier]: { opensSinceHigh, totalOpens } },
    daily:       { lastClaimDate: "YYYY-MM-DD", freezeTokens, lastFreezeEarnedDate },
    streak:      { count, best },
    boosterInventory: { [boosterId]: count },
    permanentBonuses: { goldenBurger: false },
    stats:       { clicks, crits, megas, jackpots, ... },
    clout: BigNum, cloutSpent: BigNum,
    unlockedTabs: [], seen: {}          // tutorial flags
  },
  settings: {
    sound, music, soundVol, musicVol, reducedMotion, crt,
    notation, textScale, confirmThreshold, autosaveIndicator
  },
  timestamps: { lastSeen, created }
}
```

### 4.1 Prestige-readiness rules

- **`meta` is written by nothing in this build.** Pure reserved space. A future reset cannot corrupt it.
- `daily`, `streak`, `achievements`, `chestPity`, `boosterInventory`, `permanentBonuses`, `clout` → `meta` (survive prestige).
- `activeBoosters` → `run` (boosters expire on prestige).
- Golden Burger writes `meta.permanentBonuses.goldenBurger` → +100% global production across prestiges.

---

## 5. Number System

`BigNum = { m, e }` normalized so `1 ≤ m < 10`.

Operations: `add, sub, mul, div, pow, cmp, floor, sqrt, log10, fromNumber, toString`.

Currency math uses BigNum beyond ~1e15. Below that, native floats are exact enough and faster.

### 5.1 Display

| Range | Format |
|---|---|
| < 1,000 | plain integer, or one decimal |
| 1,000+ | suffixes `K, M, B, T, Qa, Qi, Sx, Sp, Oc, No, Dc, UDc, DDc, TDc, QaDc, QiDc, SxDc, SpDc, OcDc, NoDc, Vg, UVg, …` continuing to 1e303 |
| — | 2-3 significant decimals (`15.4K`, `2.80M`) |

The suffix list is a single generated array in `CONFIG.SUFFIXES` (standard short-scale names, doubling every 3 orders of magnitude). `BigNum.toString` and all three notation modes read from that one array, so adding a suffix is a one-line change and the `bignum` suite verifies every boundary against it.

Notation modes (setting): **Standard** / **Scientific** / **Engineering**.

Joke thresholds, each a one-time toast:
- 1e60 — "YOUR CALCULATOR HAS GIVEN UP"
- 1e100 — "SCIENTIFIC NOTATION ENABLED" (auto-switch, with option to revert)
- 1e200 — "NUMBERS ARE NO LONGER MEANINGFUL"

Serialization: compact strings (`"1.234e18"`). Unit-tested for `1e300 + 1e300`, mul/div round-trips, and every suffix boundary.

---

## 6. Economy Formulas

```
cost(n) = baseCost × growth^n          growth 1.12–1.18, tier-dependent

CLICKS — order matters, breaks the circular dependency:
  clickCore     = CLICK_BASE × clickMult × boosterClickMult        (no production link)
  autoGrease    = Σ (automation_owned × spec_rate) × clickCore
  empGrease     = Σ (employee_owned × emp_rate)
  greasePerSec  = (autoGrease + empGrease) × prodMult
                  × milestoneBonus × boosterMult × permanentMult
  clickPower    = (CLICK_BASE + LINK_RATE × greasePerSec)
                  × clickMult × comboMult × critMult               ← combo/clicks only

SECONDARY CURRENCIES:
  fryPerSec     = LINK2 × greasePerSec × fryTreeMult   × milestone
  fizzPerSec    = LINK2 × greasePerSec × drinkTreeMult × milestone
  chickenPerSec = LINK2 × greasePerSec × chickTreeMult × milestone
```

**Why the ordering.** Click power scales with production; automation production scales with click power. Naively that is infinite recursion. Computing `clickCore` (no production link) → production → then adding the production link to `clickPower` resolves it with no frame lag and no self-feeding loop.

**Combo multiplies clicks only**, never passive production. A ×100 combo tier inflating idle income would wreck the pacing curve.

**Additive within an upgrade tree, multiplicative across trees.** Documented in code and exposed in the "How production is calculated" tooltip: `base × upgrades × boosters × combo × milestones`.

### 6.1 Effect enum

One `applyEffect()` handles all of:

`clickMult, prodMult, critChance, critMult, fryRate, fizzRate, chickenRate, boosterDuration, chestLuck, offlineEff, costReduction, spiceGain, cloutGain, comboDecayResist`

**Naming contract:** these are the only effect *type* names allowed in data. Each aggregates into the corresponding multiplier named in §6 — e.g. every `fryRate` effect on owned Fry upgrades sums into `fryTreeMult`, and only `prodMult`/`clickMult` types feed the Grease-side multipliers. The `data` suite rejects any effect type outside this list, so a typo can never become a silently-ignored upgrade.

### 6.2 Milestone bonus — open decision, data will settle it

Config: `CONFIG.MILESTONES = { employee: {25:2, 50:2, 100:2, 200:2}, automation: {...} }`

Brief §5.5 says owning 25/50/100/200 of a unit gives that unit ×2, which is ambiguous at scale:

| Reading | At 200 owned | Problem |
|---|---|---|
| Cumulative (×2×4×8×16) | ×1024 | Probably breaks the late curve |
| Once per unit type | ×2 | Milestones pointless past 25 |
| Cumulative, employees only | ×1024 emp / ×1 auto | **Recommended** |

Rationale: employees produce *flat* Grease/sec and genuinely need milestone help to stay relevant against automation that scales with click power. Automation already scales; multiplying it again double-dips.

**The simulator runs cumulative-on-both and cumulative-on-employees-only and reports which lands closer to the §5.4 pacing table.** Data decides, not taste.

**Shipping default if the two are within 2% of the targets:** cumulative-on-employees-only, automation at ×1. This is a stated fallback, not a deferral — the spec is never ambiguous about what ships.

### 6.3 Pacing targets (tuned against, per brief §5.4)

| Milestone | Active play | Idle-heavy |
|---|---|---|
| First upgrade purchase | 10 s | n/a |
| Level 2 | 30 s | n/a |
| First automation | 2 min | n/a |
| Level 5 | 4 min | 6 min |
| Level 10 | 12 min | 20 min |
| Level 25 | 1.5 h | 3 h |
| Level 50 | 8–10 h | 15 h |

**Level-up threshold:** `threshold(n) = 150 × 3.1^(n-1)` on lifetime Grease this run. Verified: L2 = 465, L10 ≈ 4.0e6, L50 ≈ 1.8e26.

This formula alone gets to Lv50 at ~1e26 lifetime; the §5.4 pacing table is the **real** constraint. Growth rates and base costs get tuned until the simulator hits it. If the formula and the targets cannot both be satisfied, the mismatch is reported explicitly rather than silently shipped.

### 6.4 Endgame

Level 50 "THE OMNIFOOD" does not end the game: "THE END™" banner → "...just kidding" → endless **Omni Ascension** counter (+× multiplier per extra 1000× lifetime Grease). UI notes prestige is "coming soon".

---

## 7. Content Tables

### 7.1 Food levels (50) — from original spec §1

Sad Egg (Egg Cart) · Toast (Toast Station) · Sandwich (Sandwich Counter) · Hot Dog (Hot Dog Stand) · Burger (Burger Joint) · Fries (Fry Station) · Soda (Drink Machine) · Chicken (Chicken Counter) · Pizza (Pizza Oven) · Tacos (Taco Stand) · Burrito (Burrito Bar) · Pasta (Pasta Kitchen) · Ramen (Ramen Shop) · Sushi (Sushi Bar) · Dumplings (Dumpling Factory) · Pancakes (Pancake House) · Waffles (Waffle Factory) · Donuts (Donut Shop) · Ice Cream (Ice Cream Parlour) · Cake (Cake Factory) · Cupcakes (Cupcake Empire) · Cookies (Cookie Factory) · Chocolate (Chocolate Plant) · Popcorn (Cinema Food Empire) · Pretzels (Pretzel Factory) · Cheese (Cheese Corporation) · Bacon (Bacon Industries) · Steak (Steakhouse) · BBQ (BBQ Empire) · Mega Meal (Mega Food Court) · Combo Meal (Combo Corporation) · Nuclear Spicy Food (Spice Labs) · Mystery Food (Food Research Lab) · Ultimate Breakfast (Breakfast Empire) · Ancient Food (Ancient Food Temple) · Alien Food (Alien Restaurant) · Genetically Modified Food (Bio-Food Labs) · Robot Food (Robo Kitchen) · Nuclear Food (Nuclear Kitchen) · Volcano Food (Volcano Restaurant) · Moon Food (Lunar Restaurant) · Planet Food (Planetary Franchise) · Cosmic Food (Cosmic Kitchen) · Black Hole Buffet (Gravity Dining) · Time Food (Temporal Kitchen) · Multiversal Food (Multiverse Franchise) · Infinite Food (Infinite Restaurant) · Sentient Food (Food Intelligence Lab) · Food God (Divine Kitchen) · THE OMNIFOOD (THE END™)

Each entry: `{ id, name, sprite, buildingName, unlocks[], threshold, quips[], locationId, palette }`

**Sprite policy (hybrid, approved).** ~24 foods get hand-authored distinct silhouettes. Levels 25–50 get procedural variation: palette swaps, glow overlays, orbiting particles, cosmic backgrounds — permitted by the brief.

**Hand-authored regardless of level** (joke pivots that must not be palette swaps): **Mystery Food (33)**, **Ancient Food (35)**, **Time Food (45)**, **Sentient Food (48)**. Plus the hidden potato.

**Mystery Food** reveals its silhouette on level-up: a blank form that resolves into the real sprite with a stepped-dissolve.

### 7.2 Upgrade trees (104) — original spec §2–§5

- **Food** (25) — exact % values given in spec → maps to `prodMult`/`clickMult`. 10 early, 8 mid, 7 late.
- **Fry** (27) — names only.
- **Drink** (26) — names only.
- **Chicken** (26) — names only.

Fry/Drink/Chicken effects are **auto-assigned by a deterministic rule**, not left to taste:

```
For tree T with N upgrades, split into thirds (early/mid/late):
  early  (i < N/3):  value = 0.05 + 0.055 × i          → +5% … ~+65%
  mid    (next third): value = 2 ^ (1 + i)              → ×2 … ×256
  late   (final third): value = 10 ^ (3 + 2×i)         → ×1K … ×1e9
```

Each tree then maps its own theme onto the three thirds, so the *shape* of the escalation is uniform but the *meaning* is not:

| Tree | Early third | Mid third | Late third |
|---|---|---|---|
| **Fry** | `prodMult` (tier-flavoured) | `critChance` | `critMult` |
| **Drink** | `fizzRate` | `boosterDuration` | `fizzRate` + `prodMult` |
| **Chicken** | `chestLuck` | `chickenRate` | `spiceGain` / `cloutGain` |

The generated table is dumped to `docs/generated-upgrades.md` at build time and reviewed before tuning, so any single line can be overridden by hand in `DATA` without touching the generator. The Food tree is exempt — the spec supplies exact percentages.

Named story beats that must land: Drink #26 "The Ocean Is Now Soda"; Chicken #26 "The Chicken Has Achieved Consciousness" → triggers **"We know what you've been doing."**

### 7.3 Employees (30, 6 tiers) — original spec §6

| Tier | Employees |
|---|---|
| 1 | Intern, Part-Time Cook, Cashier, Dishwasher, Cook |
| 2 | Chef, Fry Technician, Drink Specialist, Chicken Specialist, Burger Engineer |
| 3 | Shift Manager, Restaurant Manager, Regional Manager, Corporate Manager, Corporate Executive |
| 4 | Food Economist, Food Analyst, Food Scientist, AI Chef, Food Engineer |
| 5 | Burger Wizard, Alien Consultant, Robot Manager, Genetic Food Scientist, Cosmic Chef |
| 6 | Food Emperor, World's Greatest Chef, Intergalactic Restaurant Manager, Food Intelligence, **The Omnichef** |

Quantity-based purchase, ×1 / ×10 / ×100 / MAX. Each has an "upgrade level" track via milestones. Funny one-liner in every description.

### 7.4 Automation (21) — original spec §7, exact rates

| Group | Machines (clicks/sec) |
|---|---|
| Early | Basic Clicker 1 · Better Clicker 5 · Automatic Fryer 10 · Auto Grill 20 · Auto Cashier 50 · Food Conveyor 100 |
| Mid | Industrial Conveyor 500 · Robot Cook 1K · Robot Fryer 5K · Food Assembly Line 10K · AI Kitchen 50K · Automated Restaurant 100K |
| Late | Food Factory 1M · Food Megafactory 10M · Automated Food City 100M · Food Manufacturing Network 1B · Planetary Food Factory 10B · Interplanetary Supply Chain 100B · Galactic Food Network 1T · Universal Food Production 1Qa · Omniversal Kitchen ∞ |

**Modelled as auto-clicks scaled by click power**, not flat Grease/sec — so Food-tree click upgrades boost the whole fleet, creating a real optimization puzzle instead of flat income. `Omniversal Kitchen (∞)` is a huge finite number (1e30/s) displayed as ∞, clamped so the sim cannot melt.

**Owned machines appear in the scene**, capped at what fits on the counter with a "+N" counter beyond, so the food stays the hero at late game.

### 7.5 Currencies (7) — original spec §10

| Currency | Earned from | Spent on |
|---|---|---|
| **Grease** | clicks, production, automation | almost everything |
| **Fry Bucks** | fry production (unlocks Lv6) | Fry tree |
| **Fizz** | drink production (unlocks Lv7) | Drink tree, boosters |
| **Chicken Points** | chicken production (unlocks Lv8) | Chicken tree, chest keys |
| **Spice** | crits (small chance), chests, certain boosters | risky/gamble upgrades, booster re-rolls |
| **Clout** | achievements | titles, UI themes, bragging items |
| **Food Crimes** | secret achievements, Mythic/Secret chests only | Forbidden Menu (4–6 absurd upgrades) |

Every currency has ≥1 earn and ≥1 spend. Secondary currencies appear in the resource bar only after their unlock level, with a "NEW CURRENCY" popup.

Food Crimes target: a handful per hour at best.

### 7.6 Boosters — original spec §8

| Rarity | Booster | Effect |
|---|---|---|
| Common | Grease Spray | ×2 production, 60s |
| Common | Warm Hands | ×2 click, 45s |
| Common | Butter Fingers | +30% crit chance, 60s |
| Chaotic | **Burger Time** | every click is a crit, 20s + special food frame |
| Chaotic | Double Time | ×2 click, combo decay resist, 90s |
| Chaotic | Fry Daddy | ×5 Fry rate, 2m |
| Chaotic | Fizz Frenzy | ×5 Fizz rate, 2m |
| Chaotic | Nugget Storm | ×3 chest luck, 3m |
| Chaotic | Cluck Famous | ×5 Chicken rate, 2m |
| Absurd | Spicy Time | ×10 production but −10% click, 30s |
| Absurd | Ocean Mode | ×25 production, 60s |
| Absurd | The Accountant Is Away | ×100 production, 10s |
| Absurd | Eukaryotic | ×2 offline efficiency, 6h |

**Stacking rules** (stated in tooltip): different boosters multiply; total booster multiplier is **soft-capped** (config); re-activating the same booster **refreshes duration, does not stack**. Max 4 active. Active boosters show in a strip with pixel timer bars.

Sources: chests, dailies, bought with Fizz (cost scales), special events.

**Expiry is wall-clock `expiresAt`, never tick counts** — tick-based timers desync under tab throttling and overnight closure.

### 7.7 Chests (7 tiers) — original spec §9

| Tier | Name | Rarity |
|---|---|---|
| 1 | Grease Bin | Common |
| 2 | Napkin Bundle | Uncommon |
| 3 | Sauce Packet Case | Rare |
| 4 | Supply Crate | Epic |
| 5 | Franchise Vault | Legendary |
| 6 | Anomaly Crate | Mythic |
| 7 | [REDACTED] | Secret |

**Reward categories in this build:** currencies, boosters, temporary buffs, small permanent run upgrades.

**Excluded by approved decision:** spec §9 lists Pets / Cards / Cosmetics. Those systems are out of scope, so chests roll **nothing** from those categories rather than awarding placeholders for systems that don't exist.

**Pity system:** persistent per-tier counter, survives sessions. Each non-hit raises high-rarity odds. Guaranteed Epic+ after N opens, Legendary+ after M (config). Luck Meter progress bar + "NEXT CHEST: EPIC+" when armed.

**Chest sources:** level-ups, achievements, daily rewards, streak milestones, Chicken Points keys.

**Opening sequence (4–6s, skippable after 1s):** chest sprite on dark overlay → stepped shake → crack of light → pixel particles → rarity banner with color flash → reward card flips in → quantity counts up → items fly to counters.

Rarity **never relies on colour alone** — always a text label plus a distinct border pattern or icon.

### 7.8 Daily rewards & streaks — original spec §11

30-day calendar of pixel cards. Streak milestones at **3 / 7 / 14 / 30 / 50 / 100 / 365** days.

**Day 30: Golden Burger** → `meta.permanentBonuses.goldenBurger` → permanent +100% global production, survives prestige.

Missing a day resets the streak, but **one Streak Freeze token per week** (earned) preserves it.

Rewards needing out-of-scope systems (Golden Employee cosmetics, "Food God") grant an equivalent in-scope reward plus a **Trophy Case** entry.

### 7.9 Locations (10)

5 levels each, per the brief §5.3. Each swaps scene background, ground tile, sign, ambient sprites, **and a background palette shift**. Transition via wipe.

| # | Location | Levels | Scene notes |
|---|---|---|---|
| 1 | Mom's Kitchen | 1–5 | Cracked tile, humming fridge, one sad fluorescent tube |
| 2 | The Parking Lot | 6–10 | Asphalt, moths around a lamp, distant traffic |
| 3 | Food Court | 11–15 | Fluorescent panels, endless seating, a fountain |
| 4 | Strip Mall | 16–20 | Neon signs, rain on the lot, a drive-thru queue |
| 5 | Downtown | 21–25 | Street-level glass, pigeons, steam from a vent |
| 6 | Industrial District | 26–30 | Silos, pipework, a very loud factory hum |
| 7 | The Fridge | 31–35 | Frost, hanging lamps, things that should not be moving |
| 8 | The Abyss | 36–40 | Bioluminescence, drifting particulate, no floor |
| 9 | The Orbital Ring | 41–45 | Planet below, station window frame, slow rotation |
| 10 | Galactic Food Empire | 46–50 | Nebula, orbital food fleets, the food is the sun |

Each location also carries its own 3–4 ambient sprite behaviours (steam puffs, flies, flickering neon, drifting clouds) and a sign with a joke.

### 7.10 Achievements (115)

Brief §6.7 requires 70+ across 10 categories plus 8+ hidden. The original spec did not enumerate them; written in-voice, per approval. Rarity tiers Common → Secret grant increasing Clout.

**Clicking (14)**

| Achievement | Condition | Clout |
|---|---|---|
| First Contact | Click the food once | 1 |
| Ten Down | 10 total clicks | 1 |
| Carpal Tunnel Award | 100 total clicks | 2 |
| Speed Demon | 100 clicks in under 10 seconds | 3 |
| Critical Believer | 10 critical hits | 2 |
| Big Game Hunter | Land a MEGA crit | 5 |
| Chosen One | Trigger "THE [FOOD] HAS CHOSEN YOU" | 10 |
| Double Digits | Reach a 10 combo | 1 |
| Twenty-Five Below | Reach a 25 combo | 2 |
| Hundred Club | Reach a 100 combo | 4 |
| Thousand Yard Combo | Reach a 1000 combo | 10 |
| Self-Aware | See "COMBO DESTROYED" 10 times | 2 |
| Pacifist Protocol | Reach level 10 without clicking once | 8 |
| Peak Human | Reach combo ×100 | 10 |

**Production (10)**

| Achievement | Condition | Clout |
|---|---|---|
| Grease Earnings | 1,000 lifetime Grease | 1 |
| Grease Eternity | 1e6 lifetime Grease | 1 |
| Grease Overachiever | 1e12 lifetime Grease | 2 |
| Grease Incarnate | 1e30 lifetime Grease | 5 |
| Greased Lightning | 1,000 Grease/sec | 1 |
| Industrialist | 1e6 Grease/sec | 2 |
| Compound Interest | 1e12 Grease/sec | 4 |
| Overachiever | Own 200 of a single machine | 5 |
| Wheels on the Cart | First automation purchase | 1 |
| Idling Away | 1 hour of playtime | 2 |

**Food Levels (14)**

| Achievement | Condition | Clout |
|---|---|---|
| Eggselent Beginning | Reach Level 2 | 1 |
| Toast Enthusiasm | Level 3 | 1 |
| Sandwich Syndrome | Level 4 | 1 |
| Hot Dog Handler | Level 5 | 1 |
| Burger Acumen | Level 6 | 1 |
| Fully Loaded | Level 10 | 2 |
| Fry Cook | Level 11 | 2 |
| Restaurant Owner | Level 16 | 2 |
| Franchise Mogul | Level 21 | 3 |
| Industrial Food Magnate | Level 26 | 3 |
| Galactic Middle Management | Level 36 | 4 |
| Reality Brick | Level 41 | 5 |
| The End™ | Level 50 | 10 |
| It's Not Over | Omni Ascension ×1 | 10 |

**Currency (13)**

| Achievement | Condition | Clout |
|---|---|---|
| First Payday | 100 Fry Bucks | 1 |
| Fry Cookbook | 1e6 Fry Bucks | 2 |
| Caught With My Fizz Down | Unlock Fizz | 1 |
| Ocean Problem | Buy "The Ocean Is Now Soda" | 5 |
| Certified Chicken Professional | Unlock Chicken Points | 1 |
| Spicy Business | 1 Spice | 2 |
| Empty The Spice Cabinet | 1,000 Spice | 4 |
| Influence: None | 10 Clout | 1 |
| Pyramid Scheme | 100 Clout | 2 |
| Corporate Ladder Climb | 500 Clout | 3 |
| First Crime | 1 Food Crime | 10 |
| Organised Cuisine | 25 Food Crimes | 15 |
| The Forbidden Menu | Buy a Forbidden Menu upgrade | 20 |

**Employees (12)**

| Achievement | Condition | Clout |
|---|---|---|
| Hireling | Hire 1 employee | 1 |
| Staffing Crisis | 10 employees | 1 |
| Whole Crew | 25 employees | 2 |
| Double Staffed | 50 employees | 3 |
| Menace to Kitchen Uniforms | 100 employees | 4 |
| Running out of Employees | 200 employees | 6 |
| Chef's Kiss | Hire a Tier 3 employee | 2 |
| Corporate Archetype | Hire Corporate Executive | 3 |
| Burger Wizard | Hire Burger Wizard | 5 |
| Consulting Fees | Hire Alien Consultant | 5 |
| The Champ | Hire World's Greatest Chef | 8 |
| OMNICHEF | Hire The Omnichef | 20 |

**Automation (10)**

| Achievement | Condition | Clout |
|---|---|---|
| Click Fixer | Buy Basic Clicker | 1 |
| Robotic Workforce | 10 machines | 1 |
| Fully Automated | 100 machines | 3 |
| Skynet, But Food | Buy Robot Cook | 2 |
| The Factory | Buy Food Factory | 3 |
| Industrial Food Complex | Buy Food Megafactory | 3 |
| City Planner | Buy Automated Food City | 4 |
| Interplanetary Logistics | Buy Interplanetary Supply Chain | 5 |
| Galactic SCM | Buy Galactic Food Network | 8 |
| Omniversal | Buy Omniversal Kitchen | 20 |

**Chests (9)**

| Achievement | Condition | Clout |
|---|---|---|
| Unboxing | Open 1 chest | 1 |
| Chest Enthusiast | 10 chests | 2 |
| Dumpster Divers | 50 chests | 3 |
| Professional Looter | 100 chests | 4 |
| Pity Party | Hit an Epic+ pity guarantee | 5 |
| Jackpot Fever | Open a Legendary | 10 |
| THE GOOD STUFF | Open a Mythic chest | 15 |
| Forbidden Fruit | Open a Secret chest | 25 |
| Keymaster | Buy a chest with Chicken Points | 2 |

**Boosters (6)**

| Achievement | Condition | Clout |
|---|---|---|
| Adrenaline | Use your first booster | 1 |
| Chemically Enhanced | Activate 10 boosters | 2 |
| Burger Time | Activate Burger Time | 5 |
| Cumulative | Have 3 boosters active at once | 3 |
| Buzzworthy | Reach ×100 combo while a combo booster is active | 5 |
| Just Add Water | Have a booster active for 30 cumulative minutes | 4 |

**Streaks (9)**

| Achievement | Condition | Clout |
|---|---|---|
| Regular | 3-day streak | 1 |
| Week Notice | 7-day streak | 2 |
| Fortnight Chef | 14-day streak | 3 |
| Golden Touch | 30-day streak (Golden Burger) | 10 |
| Half Century of Consistency | 50-day streak | 8 |
| Century Club | 100-day streak | 12 |
| Year of Food | 365-day streak | 25 |
| Frostbite | Use a Streak Freeze | 5 |
| Perfect Week | 7 claims with no missed day | 4 |

**Absurd (8)**

| Achievement | Condition | Clout |
|---|---|---|
| Regret Button | Reset a save | 3 |
| Speedrun ANY% | Reach level 50 in under 3 hours | 20 |
| Whale | Spend 1e12 Grease in one purchase | 8 |
| Found Footage | Import a save | 5 |
| Self Aware | Enable the CRT filter | 1 |
| Loud and Proud | Max the music volume | 2 |
| Chaos Theory | Activate Spicy Time | 3 |
| It's Not Even Food | Reach level 50 and click the Omnifood 50 times | 15 |

**Secrets (10)** — displayed as "???" with no requirement text until unlocked

| Achievement | Condition | Clout |
|---|---|---|
| **Don't Click The Potato** | Find and click the hidden potato sprite | 15 |
| There Is No Spoon | Click the counter 25 times in one visit | 10 |
| Behind the Menu | Find the door in a location background | 10 |
| The Fifth Wall | Click the Omnifood during the "THE END™" banner | 15 |
| Founded It | Own 1000 of a single machine | 20 |
| Meeting Room | Open all 7 chest tiers in one session | 15 |
| The Accountant | Have Clout exactly 69 | 5 |
| Off The Books | Earn Food Crime without a single crit | 20 |
| Closed Sign | Let a 30-second booster expire while idle | 10 |
| Sound Design Award | Have CRT on, reduced motion on, and trigger a JACKPOT | 10 |

**The hidden potato** lives subtly in location backgrounds — a small sprite in the scenery, not announced. Finding and clicking it unlocks the achievement and plays a distinct joke sting.

**Toast queue:** unlocks fire a pixel toast with an airhorn-style synth sting, **queued so multiple never overlap**.

### 7.11 Food quips (40+)

Tagged by context: `early, mid, late, comboBreak, idle, highLevel`, plus per-food specials. At most one quip per 25–40s, never during crits, never stacked, never the same quip twice in a row.

Examples: "Please stop." / "I have a family." / "This seems economically irresponsible." / "The accountant is concerned." / "Please consider touching grass." / "I am unpaid and overcooked."

---

## 8. Core Systems

### 8.1 The click — priority #1

Input via **`pointerdown`**, not `click`: fires ~1 frame sooner, and pointer events give per-touch delivery for free so **every finger counts** for multi-touch. `touch-action: manipulation` on the food eliminates the 300ms double-tap-zoom delay and pinch gestures.

A transparent `<button>` is positioned over the food's canvas bounds, giving keyboard focus, Enter/Space activation, and ARIA for free rather than bolting them on later.

Every click performs, in order:
1. **Squash** — `scale(1, 0.88)` 60ms → spring back with overshoot 140ms (CSS transform, GPU composited)
2. **Hit-flash** — one white frame via `globalCompositeOperation` on the scene canvas (no DOM filter, no repaint storm)
3. **Particles** — 4–8 squares, 5–7px, food's own palette, gravity + drag, ~400ms
4. **Floating number** — pooled DOM span at pointer, rises ~40px, fades. **Pool of 40, ring-buffer reuse. Never allocate during a click.**
5. **THUNK** — square wave, 90ms, pitch × `(1 + rand × 0.08)` so it never grates
6. **Screen nudge** — crits only, only if reduced motion is off
7. **Combo++**

**Crit tiers**

| Tier | Mult | Chance | Treatment |
|---|---|---|---|
| Normal | ×1 | ~94.79% | — |
| **CRITICAL!** | ×10 | 5% | ketchup-red text, bonk SFX, small shake |
| **MEGA!** | ×100 | 0.2% | full-screen flash, oversized text, 3× particles |
| **THE [FOOD] HAS CHOSEN YOU** | ×10,000 | 0.01% | gold banner, unique fanfare, particle shower |

Expected value ≈ **×2.65 per click**, so clicking stays genuinely strong.

**A global flash-rate limiter caps full-screen flashes at 3/sec** regardless of click rate — photosensitivity is a real constraint and a fast clicker must not be able to trigger it.

Floating text names the current food: "CRITICAL BURGER!"

### 8.2 Combo

Tiers: 10 → +10% · 25 → +25% · 50 → +50% · 100 → ×2 · 500 → ×10 · 1000 → ×100. Decay after ~1.5s idle.

The meter is a **segmented DOM bar, not canvas** — `role="progressbar"` with a value is required by §11 and canvas text is invisible to assistive tech. The flame meter above it is a small cached-sprite canvas. Colour and flame size change per tier; break stamps "COMBO DESTROYED", and the food occasionally says "Weak."

**Auto-clickers never build combo** — stated in the tooltip.

### 8.3 Food personality

Pixel speech bubble with typewriter text. Rare: one quip per 25–40s, never during crits, never stacked, never the same quip twice in a row.

### 8.4 Progressive unlock schedule

Lv1 click + Grease · Lv2 basic upgrades · Lv3 automation · Lv5 employees · Lv6 Fry Station · Lv7 Drinks + boosters · Lv8 Chicken · Lv10 chests · Lv15 achievements UI emphasis (achievements still **track** from the start) · Dailies and streaks available from the first session (retention must not wait).

Locked tabs show a padlock and "Unlocks at Level N". New systems get a one-time "NEW!" badge.

### 8.5 Level-up moment

Screen flash → food sprite swaps with a stepped pixel-block dissolve → confetti of pixel squares → banner "LEVEL 7: SODA" → unlock list slides in. Under 2.5s, skippable by tap. No more than 3 flashes/sec.

---

## 9. Save System

`localStorage` in try/catch. On failure (private mode, quota, disabled) the game runs in memory behind a persistent **"PROGRESS WON'T BE SAVED"** banner rather than crashing.

```
save ──► validate ──► migrate(saveVersion → 1) ──► apply ──► state
                    └─ on failure ──► backup slot ──► fresh start
```

The validator runs on **every** load, not just import — a corrupted-but-parseable save is worse than a missing one.

Serialization: BigNum → compact strings, sets → sorted arrays, rest plain JSON.

**Migration chain**, keyed by version so v2 is a one-line addition later:

```js
const MIGRATIONS = {
  // 1: (s) => { s.meta.cloutSpent ??= {}; return s; },   // example stub
};
```

**Export/import checksum:** FNV-1a over the payload string. This is **corruption detection, not security** — it is a client-side game and anyone can read the save.

**Import flow:** validate → preview modal showing level + lifetime Grease → back up current save to slot 2 → apply. Corrupted import is rejected with an explanation.

**Reset:** double confirmation, type **BURGER**.

**Autosave:** every 15s plus on `visibilitychange` and `beforeunload`, with a small "SAVED" pixel indicator.

Boosters expire on wall-clock `expiresAt`, never tick counts.

### 9.1 Offline earnings

Closed-form — no tick replay. `OFFLINE_MAX_HOURS = 8`, `offlineEfficiency = 0.5` (upgradeable).

```js
localDateKey(ts)          // "YYYY-MM-DD" from LOCAL date parts
daysBetween(a, b)         // calendar days via Date.UTC, never ms/86400000
```

**Booster handling.** Earnings integrate `production_per_sec(t) × offlineEfficiency` across the absence window. An expired booster contributes only for its remaining life. Integrates exactly by collecting ≤10 boundary timestamps (window start/end + each active booster's clipped start/expiry), sorting, and summing `Δt × prod/sec × Π(active multipliers)` per sub-interval — ~20 lines, exactly correct even for two boosters with different expiry times, which the naive "current multiplier × elapsed" gets wrong.

**"WELCOME BACK" modal:** time away, per-currency gains, big animated COLLECT with coins flying into the bar. Skipped if away under 60s or no production exists.

### 9.2 Daily date edge cases

| Hazard | Behaviour |
|---|---|
| Re-claim same date | Blocked. Idempotent. |
| **Clock moved backward** | Claim **rejected, streak untouched.** "TIME TRAVEL DETECTED — YOUR CALENDAR IS CONFUSED." Never punish the player for their OS lying. |
| Timezone shift ±1 day | Degrades gracefully: negative gap → treated as already claimed. No double-claim, no punishment. |
| Missed exactly 1 day | Consumes a Streak Freeze if available; streak preserved. |
| Missed 2+ days | Cannot bridge — streak resets to 1. |
| Freeze earning | 1 per 7 days, tracked by date, never stacks beyond 1. |

Dividing raw milliseconds by 86,400,000 breaks on DST days (23- and 25-hour days). Normalizing both dates to UTC midnight first makes `daysBetween` exact.

---

## 10. Rendering & UI

### 10.1 Render architecture: two canvases

| Canvas | Redraws | Contents |
|---|---|---|
| `#scene` | every frame | blits **cached offscreen layers** (parallax background, ground, sign) + machine sprites + food sprite + steam/flies |
| `#fx` | every frame | particles + screen effects, cleared each frame |

Expensive parts — parallax layers, ground tiles, every sprite frame — are **rasterized once and cached**. A frame is ~3 `drawImage` blits plus ~20 small sprite blits. Comfortably 60fps on a mid-range phone; verified with headless Chrome rather than asserted.

Particles on canvas (many, physics). Floating text as **pooled DOM** (few, crisp text-shadow, keeps DOM count bounded).

**Simulation:** fixed 10Hz accumulator with delta-time, so background throttling cannot break math. Long gaps use the offline calc path instead of replaying ticks. Render via `requestAnimationFrame`; DOM updates **diffed** — never rebuild lists, update text nodes in place. Pause rendering when hidden. Cap ~150 concurrent particles/floating text. No memory growth over a 1-hour session.

### 10.2 Visual direction — "Chunky Pixel Diner"

- All sprites `image-rendering: pixelated`, **integer scaling only** (2×, 3×, 4×, 6×). No half-pixel positions.
- Pixel borders: stepped corners, **no `border-radius`**. Panels built with `box-shadow` stacks or `clip-path: polygon()` notches.
- 2px dark outline on every interactive element. Hard offset drop shadows, no soft blur (`box-shadow: 0 4px 0 #000`).
- Buttons chunky and tactile: raised with a bottom lip; pressed translates down 3–4px and removes the lip.
- Stepped timing (`steps(4)`, `steps(6)`) for sprite-like motion. Smooth easing only for big juicy moments.
- Optional CRT layer (scanlines + faint vignette), **on by default but gentle**.

**Palette** (CSS variables, used exclusively):

`--ink #14101f` · `--panel #241b3a` · `--panel-hi #33264f` · `--grease #ffc83d` · `--ketchup #e8433a` · `--mustard #f5a623` · `--lettuce #5ed36b` · `--soda #3fc1ff` · `--cream #fff4d6` · `--mute #9d8fc0` · `--gold #ffe27a` · `--purple #b266ff`

Rarity: Common `--mute`, Uncommon `--lettuce`, Rare `--soda`, Epic `--purple`, Legendary `--gold`, Mythic `--ketchup`, Secret `#ffffff` with animated shimmer. **Rarity never relies on colour alone** — always a text label plus a distinct border pattern or icon.

**Typography:** display/numbers `"Press Start 2P"` → `"Courier New", monospace`. Body `"VT323"` / `"Silkscreen"` → `monospace`, readable at 16px+, **never Press Start 2P for paragraphs**. Large numbers get a text-shadow stack for a chunky outlined look. Strict scale 10/12/16/20/32/48px. Scalable 100/125/150%.

### 10.3 Sprite pipeline

All art generated in code from **palette-indexed string grids**, drawn to canvas once, then cached.

- Foods: 24×24 grids at 6–8× (~150–190px on screen)
- Icons (currencies, buttons, employees, upgrades, chests): 16×16 grids at 2–3×
- Per-sprite palette map, max 6–8 colours including outline and highlight
- ~350 sprites: 50 foods, 7 chest tiers (closed + open), 6 currencies, ~25 employee portraits, automation machines, 4 upgrade-tree icons, location backgrounds, UI atoms (coin, star, flame, lock, check, gift)
- **Emoji never used as primary art.** Allowed only in plain-text flavor strings and tooltips.
- Idle animation (2–3 frame bob/blink or CSS wobble) and a hit frame (white flash + squash)
- Procedural variation for later levels: palette swaps, glow overlays, orbiting particles, cosmic backgrounds

### 10.4 Desktop layout (1024px+)

```
┌───────────────────────────────────────────────────────────────┐
│ LOGO  [Grease][Fry][Fizz][Chicken][Spice][Clout][Crimes]      │
├───────────────┬─────────────────────────────┬─────────────────┤
│ SHOP (tabs)   │  LOCATION BACKGROUND        │ STATS           │
│ ▸ Upgrades    │  level banner + progress    │ Grease/sec      │
│ ▸ Employees   │                             │ Click power     │
│ ▸ Automation  │      [ BIG FOOD ]          │ Crit chance     │
│ ▸ Boosters    │    combo meter + quips      │ Combo           │
│ ▸ (locked…)   │  active booster strip       │ Playtime        │
├───────────────┴─────────────────────────────┴─────────────────┤
│ CHESTS │ DAILY │ ACHIEVEMENTS │ LOCKED… │ SETTINGS            │
└───────────────────────────────────────────────────────────────┘
```

Centre stage is a **scene**, not a blank panel: location background with parallax light, counter/ground line, ambient sprites (steam puffs, flies, flickering neon, drifting clouds at higher levels), machines accumulating along the counter, big food on top.

Shop tabs are sprite icons with labels. Affordable items pulse gently with a green border; unaffordable are dimmed but readable. Currency counters animate (rolling digits, tick on gain); only unlocked currencies are visible.

### 10.5 Mobile layout (<768px — designed, not shrunk)

- Top: compact resource strip — Grease large, others in a horizontally scrollable chip row
- Centre: big food dominant (~45% viewport height) with combo + booster strip
- Bottom nav, 5 tabs, 56px+ targets: **Home, Shop, Rewards, Trophies, More**
- Shop opens as a **bottom sheet** — drag handle, 70% height, internal scroll, swipeable category tabs
- Modals are full-screen sheets with a clear close button
- No horizontal overflow at 320px. Respect safe-area insets. Tap targets 44px minimum. `touch-action: manipulation`.
- Multi-touch: every finger tap counts as a click.

---

## 11. Audio

Synthesized chiptune via Web Audio API — no files.

**SFX:** click THUNK (square, pitch-varied), crit BONK, purchase POP, level-up arpeggio, chest "DING DING DING", legendary fanfare, achievement airhorn sting, error buzz.

**Music:** looping 4-bar chiptune track from a note sequencer — upbeat diner-jazz meets 8-bit. Toggleable.

- Audio starts only after first user gesture (autoplay policy). Separate Sound/Music toggles plus volume sliders, persisted.
- Legendary reward shows a big pixel-text voice-line gag ("WHAT THE FRY?!") with the fanfare. No profanity, no recorded speech.

---

## 12. Accessibility

- Full keyboard support: Space/Enter clicks the food, logical Tab order, arrow keys navigate shop tabs, Esc closes modals, focus trapped in modals, visible pixel-style focus ring (2px gold outline with offset)
- `prefers-reduced-motion` honoured by default plus manual toggle: disables shake, flashes, parallax, particle bursts (replaced with simple fades)
- No rapid flashing over 3/sec for level-up/jackpot effects
- ARIA: labelled buttons, `aria-live="polite"` region for toasts and big gains (throttled), `role="progressbar"` on progress bars, `role="dialog"` on modals
- Contrast: body text ≥4.5:1 against its panel
- Tooltips open on hover **and** focus **and** tap on an "i" icon (mobile). **Never hover-only.**
- Scalable text setting (100/125/150%)

---

## 13. Tooltips & Onboarding

Every mechanic gets a short tooltip: combo, crit, pity, streak, offline cap, booster stacking, production breakdown, each currency.

**First launch:** title card — *"WELCOME TO SNACKONOMICS: Your financial future is now dependent on a burger."* → [START COOKING] → pulsing arrow guides the first click → after ~10 Grease, highlight the first upgrade → after first purchase, hint at automation. **Maximum one hint at a time**, dismissible, tracked in `meta.seen` so it never repeats.

---

## 14. Settings

Sound, Music, volumes, Reduced motion, CRT filter, Number notation, Text scale, Confirm expensive purchases (threshold in config), Auto-save indicator, Export/Import, Reset save (double confirm), About/credits (jokes).

**Hidden dev panel** behind `?dev=1` — add currencies, set level, spawn chests, trigger offline test, run balance simulator. Not reachable in normal play.

---

## 15. Testing

Six suites in `test/`, run by `node test/run.js`. This is the payoff of the modular build.

| Suite | Covers |
|---|---|
| `bignum` | Normalization, add/sub/mul/div/pow/sqrt/log10, `1e300 + 1e300`, mul/div round-trips, **every suffix boundary**, all three notation modes |
| `save` | Export→import round-trip, checksum rejection, migration chain, backup slot, validator rejects malformed types |
| `dates` | Idempotent daily claim, clock rollback, DST boundary, timezone shift, freeze token, streak reset |
| `data` | Unique ids, no dangling `requires`, valid effect types, positive costs, reachable `levelReq`, achievements referencing currencies that exist |
| `balance` | The §5.4 simulator — prints level-reached-by-time and **PASS/FAIL against the pacing table** |
| `smoke` | Headless Chrome: page loads, zero console errors, click/buy/open-chest, screenshots at desktop/375px/320px |

**`data` is the load-bearing suite.** With 104 upgrades, 30 employees, 21 machines, and 115 achievements written by hand, there *will* be typos — a `requires` pointing at a nonexistent id, a cost of 0, a `levelReq` of 999. Those fail silently at runtime as permanently greyed-out buttons, exactly the dead UI the acceptance checklist forbids.

**Honest limitation:** headless Chrome verifies the game boots, runs clean, and renders. It cannot verify *feel* or true multi-touch on a physical phone. Screenshots at all three widths plus a written manual checklist cover the rest.

---

## 16. Acceptance Checklist → Test Mapping

| # | Requirement | Verified by |
|---|---|---|
| 1 | Intro → first click with juice → first upgrade | smoke + manual |
| 2 | Automation produces; scene gains machines | smoke + screenshot |
| 3 | Levels 1→50 with gating + level-up animation | balance + smoke |
| 4 | Fry/Drink/Chicken unlock, accrue, spend | data + smoke |
| 5 | Boosters obtained, activated, expire; stacking holds | smoke + manual |
| 6 | Chests open; pity fills and guarantees | smoke (pity unit assertions) |
| 7 | Daily once per date; streak/freezes | dates suite |
| 8 | Achievements unlock, toast, grant Clout; secrets hidden | data + smoke |
| 9 | Reopen restores save; offline capped | save suite + smoke |
| 10 | Export → reset → import; corrupted rejected | save suite |
| 11 | 320px/375px: no h-scroll, nav + sheets work, multi-touch | screenshots + manual |
| 12 | Reduced motion + keyboard-only play | manual |
| 13 | Stable 60fps feel, no DOM growth | smoke (perf counters) |
| 14 | No dead buttons; unbuilt systems marked LOCKED | data + manual |

---

## 17. Decisions Made Under Delegation

The user approved these without further discussion:

1. **Fry/Drink/Chicken effects auto-assigned** along the Food tree's escalating curve, since the spec gives names but no percentages. Full generated table printed for review.
2. **Employee costs/rates** via `cost(n) = baseCost × growth^n` with tier-scaled baseCost and per-tier production; later tiers cost ~10–14× more, produce ~8–12× more.
3. **Chests award nothing** from Pets / Cards / Cosmetics (spec §9 lists them; systems are out of scope) rather than inventing placeholders.
4. **Lucky Wheel** (spec §12) ships as a LOCKED tile, teasing "THE WHEEL HAS DECIDED YOU DESERVE NOTHING."
5. **Achievements written in-voice** (spec did not enumerate them).
6. **Hybrid sprites** — ~24 hand-authored silhouettes + procedural variation for 25–50, with Mystery Food, Ancient Food, Time Food, and Sentient Food always hand-authored.

## 18. Open Risks

| Risk | Mitigation |
|---|---|
| Economy misses the §5.4 pacing table | The `balance` simulator exists specifically to surface this before shipping; §6.2's milestone ambiguity is resolved by running both variants |
| ~350 hand-authored entries contain data typos | The `data` validator suite fails the build on any dangling reference, non-positive cost, or unreachable `levelReq` |
| Single-file output drifts from sources | `build.js` is deterministic and `test/smoke` runs against the built `index.html`, not the sources |
| Sprite count exceeds authoring budget | Hybrid policy caps hand-authored work at ~24 foods; the rest are procedural |