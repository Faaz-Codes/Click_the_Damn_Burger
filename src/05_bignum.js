const BigNum = {
  norm(m, e) {
    if (m === 0) return { m: 0, e: 0 };
    let sign = m < 0 ? -1 : 1;
    let mm = Math.abs(m);
    let ee = e;
    while (mm >= 10) {
      mm /= 10;
      ee += 1;
    }
    while (mm < 1 && mm > 0) {
      mm *= 10;
      ee -= 1;
    }
    // Guard against mm becoming >= 10 due to floating point edge cases
    if (mm >= 10) {
      mm /= 10;
      ee += 1;
    }
    return { m: sign * mm, e: ee };
  },

  fromNumber(n) {
    if (n === 0) return { m: 0, e: 0 };
    let sign = n < 0 ? -1 : 1;
    let val = Math.abs(n);
    let e = Math.floor(Math.log10(val));
    let m = val / Math.pow(10, e);
    let res = BigNum.norm(sign * m, e);
    return res;
  },

  fromString(s) {
    if (typeof s !== 'string') return { m: 0, e: 0 };
    s = s.trim();
    if (s === '0' || s === '0.0') return { m: 0, e: 0 };
    // Handle scientific notation
    if (s.includes('e') || s.includes('E')) {
      const [mantStr, expStr] = s.split(/[eE]/);
      const exp = parseInt(expStr, 10);
      const parsed = BigNum.parseMantissa(mantStr);
      return BigNum.norm(parsed.m, parsed.e + exp);
    }
    const parsed = BigNum.parseMantissa(s);
    return BigNum.norm(parsed.m, parsed.e);
  },

  parseMantissa(s) {
    // Parse a mantissa string without exponent, e.g. "1234", "1.234", ".5" style not needed
    if (s.includes('.')) {
      const [intPart, fracPart] = s.split('.');
      const intVal = intPart === '' ? 0 : parseInt(intPart, 10);
      const fracStr = fracPart;
      const fracVal = fracStr.length === 0 ? 0 : parseInt(fracStr, 10);
      if (intVal === 0) {
        const m = fracVal / Math.pow(10, fracStr.length);
        const e = -fracStr.length;
        return { m, e };
      }
      const totalStr = intPart + fracPart;
      const m = parseFloat(intPart === '0' ? '0.' + fracPart : totalStr.length === 1 ? totalStr : intPart + '.' + fracPart.replace(/^0+/, '') || '0');
      // Easier: just compute
      const num = parseFloat(s);
      if (num >= 1 && num < 10) return { m: num, e: 0 };
      if (num >= 10) {
        const e = Math.floor(Math.log10(num));
        return { m: num / Math.pow(10, e), e };
      }
      if (num > 0 && num < 1) {
        const e = -Math.floor(Math.log10(1 / num));
        return { m: num * Math.pow(10, e), e };
      }
      return { m: num, e: 0 };
    } else {
      const num = parseInt(s, 10);
      if (num === 0) return { m: 0, e: 0 };
      const e = Math.floor(Math.log10(num));
      const m = num / Math.pow(10, e);
      return { m, e };
    }
  },

  toNumber(a) {
    if (a.m === 0) return 0;
    return a.m * Math.pow(10, a.e);
  },

  add(a, b) {
    if (a.m === 0) return { m: b.m, e: b.e };
    if (b.m === 0) return { m: a.m, e: a.e };
    let m1 = a.m;
    let e1 = a.e;
    let m2 = b.m;
    let e2 = b.e;
    if (e1 > e2) {
      const diff = e1 - e2;
      m2 = m2 / Math.pow(10, diff);
      e2 = e1;
    } else if (e2 > e1) {
      const diff = e2 - e1;
      m1 = m1 / Math.pow(10, diff);
      e1 = e2;
    }
    const mSum = m1 + m2;
    return BigNum.norm(mSum, e1);
  },

  sub(a, b) {
    if (b.m === 0) return { m: a.m, e: a.e };
    const negB = { m: -b.m, e: b.e };
    return BigNum.add(a, negB);
  },

  mul(a, b) {
    if (a.m === 0 || b.m === 0) return { m: 0, e: 0 };
    return BigNum.norm(a.m * b.m, a.e + b.e);
  },

  div(a, b) {
    if (b.m === 0) return { m: 1, e: Number.POSITIVE_INFINITY };
    if (a.m === 0) return { m: 0, e: 0 };
    return BigNum.norm(a.m / b.m, a.e - b.e);
  },

  cmp(a, b) {
    const m1 = a.m;
    const m2 = b.m;
    if (m1 === 0 && m2 === 0) return 0;
    if (m1 === 0) return -1 * Math.sign(m2);
    if (m2 === 0) return Math.sign(m1);
    if (m1 < 0 && m2 >= 0) return -1;
    if (m1 >= 0 && m2 < 0) return 1;
    // Same sign, compare magnitude
    const sign = m1 < 0 ? -1 : 1;
    if (a.e > b.e) return sign;
    if (a.e < b.e) return -sign;
    if (m1 > m2) return sign;
    if (m1 < m2) return -sign;
    return 0;
  },

  floor(a) {
    if (a.m === 0) return { m: 0, e: 0 };
    if (a.e >= 0) {
      const shift = Math.pow(10, a.e);
      const floored = Math.floor(a.m * shift);
      return BigNum.norm(floored, 0);
    } else {
      const fracDigits = -a.e;
      const pow10 = Math.pow(10, fracDigits);
      const val = Math.floor(a.m * pow10) / pow10;
      return BigNum.norm(val, a.e);
    }
  },

  sqrt(a) {
    if (a.m === 0) return { m: 0, e: 0 };
    // sqrt(a.m * 10^e) = sqrt(a.m) * 10^(e/2)
    return BigNum.norm(Math.sqrt(Math.abs(a.m)), a.e / 2);
  },

  log10(a) {
    if (a.m === 0) return -Infinity;
    return Math.log10(a.m) + a.e;
  },

  isZero(a) {
    return a.m === 0;
  },

  pow(a, n) {
    if (typeof n !== 'number') n = 0;
    if (n === 0) return { m: 1, e: 0 };
    if (a.m === 0) return { m: 0, e: 0 };
    const x = Math.abs(a.m);
    const eTotal = a.e;
    const r = n * (Math.log10(x) + eTotal);
    // Re-derive from mantissa [1,10): m_exp = 10^frac, e_exp = floor(r)
    const eExp = Math.floor(r);
    const frac = r - eExp;
    let mExp = Math.pow(10, frac);
    if (mExp >= 10) {
      mExp = mExp / 10;
      // eExp adjusted conceptually, but better to renorm
    }
    // Use norm to ensure [1,10)
    let res = BigNum.norm(mExp, eExp);
    if (res.m >= 10) {
      res = { m: res.m / 10, e: res.e + 1 };
    }
    if (res.m < 1 && res.m > 0) {
      res = { m: res.m * 10, e: res.e - 1 };
    }
    // Handle edge cases from floating point - ensure normalized
    if (res.m >= 1 && res.m < 10) {
      // OK
    }
    return res;
  }
};

// Display formatting. Every value printed here is read out of CONFIG at call
// time, never at module-evaluation time: 00_config.js is concatenated first, so
// by the time these functions run the CONFIG literal exists.
const FMT_PLAIN_LIMIT = 1000; // below this a count reads best with no decimals
const FMT_TIER_ORDERS = 3; // orders of magnitude covered by one SUFFIXES entry
const FMT_MANTISSA_PLACES = 3; // decimal places shown on a 1..10 mantissa

const fmt = {
  notation: 'standard',

  setNotation(mode) {
    if (mode === 'standard' || mode === 'scientific' || mode === 'engineering') {
      fmt.notation = mode;
    }
  },

  // num(bignum, { decimals }) -> display string in the current notation.
  num(a, opts) {
    const places = opts && typeof opts.decimals === 'number' ? opts.decimals : undefined;
    if (!a || BigNum.isZero(a)) return '0';
    const sign = a.m < 0 ? '-' : '';
    const abs = { m: Math.abs(a.m), e: a.e };
    const magnitude = BigNum.log10(abs);
    if (fmt.notation === 'scientific') return fmtScientific(abs, places, sign);
    if (fmt.notation === 'engineering') return fmtEngineering(abs, places, sign);
    return fmtStandard(abs, magnitude, places, sign);
  }
};

// Standard: plain integers under 1000, then K/M/B/... with 2-3 significant decimals.
function fmtStandard(abs, magnitude, places, sign) {
  if (magnitude < Math.log10(FMT_PLAIN_LIMIT)) {
    return sign + String(Math.round(abs.m * Math.pow(10, abs.e)));
  }
  let tier = Math.floor(magnitude / FMT_TIER_ORDERS);
  // |m| is in [1,10) and the power is in [-2,2), so this never overflows.
  let scaled = abs.m * Math.pow(10, abs.e - tier * FMT_TIER_ORDERS);
  if (places !== undefined) {
    if (tier >= CONFIG.SUFFIXES.length) return fmtScientific(abs, places, sign);
    return sign + scaled.toFixed(places) + CONFIG.SUFFIXES[tier];
  }
  // Round at the finest resolution the display ever uses, then shed decimals as
  // the magnitude grows: >= 100 shows none, >= 10 shows one, otherwise two.
  scaled = fmtRound(scaled, 2);
  if (scaled >= 100) scaled = fmtRound(scaled, 0);
  else if (scaled >= 10) scaled = fmtRound(scaled, 1);
  // A value that rounds up to a whole 1000 belongs to the next tier, not this one.
  if (scaled >= FMT_PLAIN_LIMIT) {
    tier += 1;
    scaled = fmtRound(scaled / FMT_PLAIN_LIMIT, 2);
  }
  if (tier >= CONFIG.SUFFIXES.length) return fmtScientific(abs, places, sign);
  const decimals = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  return sign + scaled.toFixed(decimals) + CONFIG.SUFFIXES[tier];
}

// Scientific: normalised mantissa and true exponent, e.g. 1.234e18.
function fmtScientific(abs, places, sign) {
  return sign + fmtMantissa(abs, places) + 'e' + abs.e;
}

// Engineering: exponent rounded up to a multiple of three, e.g. 0.123e21.
function fmtEngineering(abs, places, sign) {
  const exponent = Math.ceil(abs.e / FMT_TIER_ORDERS) * FMT_TIER_ORDERS;
  const rescaled = { m: abs.m * Math.pow(10, abs.e - exponent), e: exponent };
  return sign + fmtMantissa(rescaled, places) + 'e' + exponent;
}

function fmtMantissa(abs, places) {
  return abs.m.toFixed(places !== undefined ? places : FMT_MANTISSA_PLACES);
}

function fmtRound(value, places) {
  const factor = Math.pow(10, places);
  return Math.round(value * factor) / factor;
}