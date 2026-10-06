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

test('pow is correct', () => {
  const p = BigNum.pow(BigNum.fromNumber(3.1), 49);
  assert.ok(p.m >= 1 && p.m < 10, `mantissa ${p.m} out of range`);
  const approx = BigNum.fromNumber(Math.pow(3.1, 49));
  const relErr = Math.abs(p.m - approx.m) / approx.m;
  assert.ok(relErr < 1e-10, `relative error ${relErr} should be < 1e-10`);
  assert.equal(p.e, approx.e);
});

test('pow edge cases', () => {
  const p0 = BigNum.pow(BigNum.fromNumber(5), 0);
  assert.deepEqual(p0, { m: 1, e: 0 });
  const pz = BigNum.pow(BigNum.fromNumber(0), 5);
  assert.deepEqual(pz, { m: 0, e: 0 });
  const pz0 = BigNum.pow(BigNum.fromNumber(0), 0);
  assert.deepEqual(pz0, { m: 1, e: 0 });
  const pn = BigNum.pow(BigNum.fromNumber(100), -1);
  assert.ok(pn.m >= 1 && pn.m < 10);
  assert.ok(pn.e < 0);
});

test('fromNumber and cmp handle negatives correctly', () => {
  assert.deepEqual(BigNum.fromNumber(-5), { m: -5, e: 0 });
  assert.deepEqual(BigNum.fromNumber(-1234), { m: -1.234, e: 3 });
  assert.deepEqual(BigNum.fromNumber(-0.5), { m: -5, e: -1 });
  const s = BigNum.sub(BigNum.fromNumber(1), BigNum.fromNumber(5));
  assert.equal(BigNum.cmp(s, BigNum.fromNumber(0)), -1);
  assert.equal(BigNum.cmp(s, BigNum.fromNumber(-4)), 0);
});

// The plan's save format writes a BigNum as "m|e" (Task 9). The real serializer
// ships with the state module; this mirrors its shape, so the round-trip below
// exercises fromString against the text a save file actually holds rather than
// against a convenient stand-in.
const serializeForSave = (a) => `${a.m}|${a.e}`;

test('fromString parses negative input in every branch', () => {
  // Plain integer, decimal, and decimal-with-exponent each used to come back as
  // a NaN pair or as a positive magnitude.
  assert.deepEqual(BigNum.fromString('-15400'), { m: -1.54, e: 4 });
  assert.deepEqual(BigNum.fromString('-5'), { m: -5, e: 0 });
  assert.deepEqual(BigNum.fromString('-1e300'), { m: -1, e: 300 });
  assert.deepEqual(BigNum.fromString('-0.5'), { m: -5, e: -1 });
  // The branch that already carried a sign, kept as a control.
  assert.deepEqual(BigNum.fromString('-1.234e3'), { m: -1.234, e: 3 });
  // A decimal with a non-zero integer part falls out of parseFloat rather than
  // out of the mantissa split, so its sign is pinned separately.
  assert.deepEqual(BigNum.fromString('-12.34'), { m: -1.234, e: 1 });
  // Below the decimal point as well: leading-zero and bare-dot spellings.
  assert.deepEqual(BigNum.fromString('-0.05'), { m: -5, e: -2 });
  assert.deepEqual(BigNum.fromString('-.5'), { m: -5, e: -1 });
  // A negative integer that needs no normalization at all.
  assert.deepEqual(BigNum.fromString('-99'), { m: -9.9, e: 1 });
});

test('fromString parses a leading-zero decimal to its own magnitude', () => {
  // "0.5" is five tenths. The leading-zero branch divided the digits by the
  // point's power of ten *and* set the exponent to it, counting it once per
  // digit: "0.5" read as 0.05, "0.05" as 0.0005, "0.0001" as 0.00000001.
  assert.deepEqual(BigNum.fromString('0.5'), { m: 5, e: -1 });
  assert.deepEqual(BigNum.fromString('.5'), { m: 5, e: -1 });
  assert.deepEqual(BigNum.fromString('0.25'), { m: 2.5, e: -1 });
  assert.deepEqual(BigNum.fromString('0.1'), { m: 1, e: -1 });
  assert.deepEqual(BigNum.fromString('0.0001'), { m: 1, e: -4 });
  assert.deepEqual(BigNum.fromString('+0.5'), { m: 5, e: -1 });
  // It is the value, not the spelling: these now agree with fromNumber.
  for (const s of ['0.5', '.5', '0.25', '-0.05', '-0.25', '0.1']) {
    assert.deepEqual(BigNum.fromString(s), BigNum.fromNumber(Number(s)), s);
  }
});

test('fromString round-trips the compact save form for both signs', () => {
  // A saved negative value serializes to a leading "-", and the save validator
  // rejects a NaN mantissa outright, so the parse of this exact shape is what
  // stands between a save and a lost session.
  for (const n of [-5, 5, -1234, 1234, -0.5, 0.5, -1e300, 1e300, -9.87e13, 9.87e13, -0.7, 0, -0]) {
    const original = BigNum.fromNumber(n);
    const text = serializeForSave(original);
    const back = BigNum.fromString(text);
    assert.deepEqual(back, original, `${n} round-tripped through "${text}"`);
    const relErr = Math.abs(BigNum.toNumber(back) - n) / Math.abs(n || 1);
    assert.ok(relErr < 1e-12, `${n} came back as ${JSON.stringify(back)} (relErr ${relErr})`);
  }
  // The literal spellings the save format produces, spelled out.
  assert.deepEqual(BigNum.fromString('-1.234|3'), { m: -1.234, e: 3 });
  assert.deepEqual(BigNum.fromString('-5|-1'), { m: -5, e: -1 });
  assert.deepEqual(BigNum.fromString('-1|300'), { m: -1, e: 300 });
  assert.deepEqual(BigNum.fromString('-9.87|13'), { m: -9.87, e: 13 });
});

test('the compact save form is accepted only as two numeric halves', () => {
  for (const bad of ['1.234|', '|3', '1e5|', '1.234|abc', '1.234|3|5', 'abc|def', '1e5|3', '1.234|e3', '1.234|+']) {
    assert.deepEqual(BigNum.fromString(bad), { m: 0, e: 0 }, `"${bad}" is corrupt, not a number to guess at`);
  }
  // The exponent half keeps its decimal point: sqrt leaves a half-integer
  // exponent behind, and a saved one of those must not read as zero.
  const root = BigNum.sqrt(BigNum.fromString('1e3'));
  assert.deepEqual(BigNum.fromString(serializeForSave(root)), root);
});

test('a leading + and an uppercase E parse like their plain equivalents', () => {
  for (const pair of [['+5', '5'], ['+1.234e3', '1.234e3'], ['-1.234E3', '-1.234e3'], ['+5E+2', '5e2'], ['+1E-3', '1e-3']]) {
    assert.deepEqual(BigNum.fromString(pair[0]), BigNum.fromString(pair[1]), `"${pair[0]}" should parse like "${pair[1]}"`);
  }
  assert.deepEqual(BigNum.fromString('-1.234E3'), { m: -1.234, e: 3 });
  assert.deepEqual(BigNum.fromString('+5E+2'), { m: 5, e: 2 });
  assert.deepEqual(BigNum.fromString('+1E-3'), { m: 1, e: -3 });
  // The sign survives an exponent form whose mantissa has a leading zero too:
  // "-0.5E1" is -5, and the leading-zero branch used to hand back +5e-1.
  assert.deepEqual(BigNum.fromString('-0.5E1'), { m: -5, e: 0 });
});

test('input that carries no number reports zero, never a NaN mantissa', () => {
  // Signed zero is the same zero, whichever way it is written.
  assert.deepEqual(BigNum.fromString('-0'), { m: 0, e: 0 });
  assert.deepEqual(BigNum.fromString('-0.0'), { m: 0, e: 0 });
  assert.deepEqual(BigNum.fromString('  -0  '), { m: 0, e: 0 });
  assert.deepEqual(BigNum.fromString('0'), { m: 0, e: 0 });
  // Text with no number in it is zero, not a poisoned mantissa.
  for (const bad of ['', '   ', 'abc', '-abc', '-', '.', 'e5', '1e', '1e+']) {
    assert.deepEqual(BigNum.fromString(bad), { m: 0, e: 0 }, `"${bad}" should read as zero`);
  }
  // A non-string has always answered zero; fromString must not start throwing
  // on the save-load path, where a thrown error would take the boot down.
  for (const bad of [undefined, null, 42, {}, [], NaN, true]) {
    assert.deepEqual(BigNum.fromString(bad), { m: 0, e: 0 }, `${String(bad)} should read as zero`);
  }
  // Nothing above, and nothing plausible besides, may reach the screen or the
  // save validator as a NaN. "1.2.3" is not in that set: parseFloat still reads
  // its leading number, which is lenient but at least finite.
  for (const input of ['', ' ', 'abc', '-', '.', 'e5', '1e', '1.2.3', '-1.234|', '-abc|-def', '-.', '-0', '-1e', '-1e-', '1e+-2']) {
    const r = BigNum.fromString(input);
    assert.ok(Number.isFinite(r.m), `"${input}" gave mantissa ${r.m}`);
    assert.ok(Number.isFinite(r.e), `"${input}" gave exponent ${r.e}`);
  }
});