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