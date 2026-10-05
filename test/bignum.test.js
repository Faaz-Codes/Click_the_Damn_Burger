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