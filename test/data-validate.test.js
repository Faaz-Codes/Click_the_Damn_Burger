import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTables, DATA } from './bundle.mjs';

test('the shipped data passes validation', () => {
  const errors = validateTables(DATA);
  assert.deepEqual(errors, [], `data errors:\n${errors.join('\n')}`);
});

test('detects duplicate ids', () => {
  // achievements carry non-cloneable check functions, so shallow-copy the
  // array and reuse one entry's reference rather than structuredClone.
  const bad = DATA.achievements.slice();
  bad.push({ ...bad[0] });
  const errs = validateTables({ ...DATA, achievements: bad });
  assert.ok(errs.some(e => /duplicate id/i.test(e)), 'should flag duplicate achievement id');
});

test('detects a dangling requires reference', () => {
  const bad = DATA.upgrades.map(u => ({ ...u }));
  bad[0] = { ...bad[0], requires: ['does-not-exist'] };
  const errs = validateTables({ ...DATA, upgrades: bad });
  assert.ok(errs.some(e => /does-not-exist/.test(e)), 'should flag dangling requires');
});

test('detects an unknown effect type', () => {
  const bad = DATA.upgrades.map(u => ({ ...u }));
  bad[0] = { ...bad[0], effect: { type: 'teleport', value: 1 } };
  const errs = validateTables({ ...DATA, upgrades: bad });
  assert.ok(errs.some(e => /teleport/.test(e)), 'should flag unknown effect type');
});

test('detects non-positive costs and unreachable levelReq', () => {
  const bad = DATA.upgrades.map(u => ({ ...u }));
  bad[0] = { ...bad[0], cost: { currency: 'grease', amount: 0 } };
  bad[1] = { ...bad[1], levelReq: 999 };
  const errs = validateTables({ ...DATA, upgrades: bad });
  assert.ok(errs.some(e => /amount 0|non-positive/.test(e)));
  assert.ok(errs.some(e => /levelReq 999/.test(e)));
});

test('detects an achievement referencing a nonexistent currency', () => {
  const bad = DATA.achievements.slice();
  bad[0] = { ...bad[0], requires: { currency: 'ghostbucks' } };
  const errs = validateTables({ ...DATA, achievements: bad });
  assert.ok(errs.some(e => /ghostbucks/.test(e)));
});

test('detects an upgrade requirement loop without hanging', () => {
  const bad = DATA.upgrades.map(u => ({ ...u }));
  const food = bad.filter(u => u.tree === 'food');
  food[0].requires = [food[1].id];
  food[1].requires = [food[0].id];
  const started = process.hrtime.bigint();
  const errs = validateTables({ ...DATA, upgrades: bad });
  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  assert.ok(ms < 2000, `validator took ${ms}ms — cycle detection is not terminating`);
  assert.ok(errs.some(e => /cycle/i.test(e)), 'should report the 2-node requires cycle');
});

test('detects a dangling buff id in a reward table', () => {
  const tables = DATA.chestTables.map(t => ({ tier: t.tier, entries: t.entries.slice() }));
  tables[0] = { tier: tables[0].tier, entries: [...tables[0].entries, { weight: 5, kind: 'buff', id: 'no-such-buff', amount: 1 }] };
  const errs = validateTables({ ...DATA, chestTables: tables });
  assert.ok(errs.some(e => /no-such-buff/.test(e)), 'should flag the dangling buff');
});
