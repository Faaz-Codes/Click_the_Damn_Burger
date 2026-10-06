import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dkey, parseDateKey, daysBetween } from './bundle.mjs';

const MS_PER_HOUR = 3600000;

// Runs body with the process clock moved into `zone`, restoring it afterwards.
// Node re-reads process.env.TZ on assignment, so the date logic is exercised
// under a zone that really has the awkward case -- a DST transition, or an
// offset far enough from UTC to move the UTC date -- instead of under whatever
// zone the machine running the tests happens to use. A zone without those
// properties would pass the assertions below no matter how daysBetween worked,
// which is exactly the bug the tests exist to catch.
function inZone(zone, body) {
  const before = process.env.TZ;
  process.env.TZ = zone;
  try {
    body();
  } finally {
    if (before === undefined) delete process.env.TZ;
    else process.env.TZ = before;
  }
}

// The length of one local calendar day -- from its own local midnight to the
// next -- measured the way a naive implementation measures it. Under a DST
// transition this is 23 or 25 hours, which is the whole point.
function localDayLength(y, m, d) {
  return new Date(y, m - 1, d + 1).getTime() - new Date(y, m - 1, d).getTime();
}

function pad2(n) {
  return n < 10 ? '0' + n : String(n);
}

// The day after a 'YYYY-MM-DD' key, built in UTC so the test's own arithmetic
// is not the thing under suspicion.
function nextKey(key) {
  const { y, m, d } = parseDateKey(key);
  const t = new Date(Date.UTC(y, m - 1, d + 1));
  return `${t.getUTCFullYear()}-${pad2(t.getUTCMonth() + 1)}-${pad2(t.getUTCDate())}`;
}

test('dkey uses local calendar parts', () => {
  assert.equal(dkey(new Date(2026, 9, 6, 23, 59).getTime()), '2026-10-06');
  assert.equal(dkey(new Date(2026, 0, 1, 0, 0).getTime()), '2026-01-01');
});

test('dkey reads the local date, not the UTC one', () => {
  inZone('Pacific/Kiritimati', () => {
    // UTC+14: local midnight on 2026-01-01 is 2025-12-31T10:00Z. A dkey built
    // from the UTC getters would answer '2025-12-31'.
    assert.equal(new Date(2026, 0, 1, 0, 0).toISOString(), '2025-12-31T10:00:00.000Z');
    assert.equal(dkey(new Date(2026, 0, 1, 0, 0).getTime()), '2026-01-01');
    // Late local evening: the next UTC date has not arrived yet, so the two
    // readings still disagree and the local one is the player's day.
    assert.equal(new Date(2026, 0, 1, 9, 30).toISOString(), '2025-12-31T19:30:00.000Z');
    assert.equal(dkey(new Date(2026, 0, 1, 9, 30).getTime()), '2026-01-01');
  });
  inZone('Pacific/Pago_Pago', () => {
    // UTC-11, the other direction: local 2026-01-01 evening is already the 2nd
    // in UTC.
    assert.equal(new Date(2026, 0, 1, 23, 30).toISOString(), '2026-01-02T10:30:00.000Z');
    assert.equal(dkey(new Date(2026, 0, 1, 23, 30).getTime()), '2026-01-01');
  });
});

test('dkey zero-pads month and day', () => {
  assert.equal(dkey(new Date(2026, 0, 6).getTime()), '2026-01-06');
  assert.equal(dkey(new Date(2026, 8, 6).getTime()), '2026-09-06');
  assert.equal(dkey(new Date(2026, 11, 31).getTime()), '2026-12-31');
  assert.match(dkey(), /^\d{4}-\d{2}-\d{2}$/, 'with no argument dkey formats now');
});

test('parseDateKey reads back the numbers a key is written with', () => {
  assert.deepEqual(parseDateKey('2026-03-08'), { y: 2026, m: 3, d: 8 });
  assert.deepEqual(parseDateKey('2024-02-29'), { y: 2024, m: 2, d: 29 });
  // dkey always pads, so a key that does not is not a key: reporting nothing is
  // better than reading '2026-1-6' as January 6th of some year.
  assert.equal(parseDateKey('2026-1-6'), null);
  assert.equal(parseDateKey('not a key'), null);
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

test('daysBetween is exact across a DST transition in a zone that has one', () => {
  inZone('America/New_York', () => {
    // Precondition first. In this zone those two local days are 23h and 25h
    // long, so dividing elapsed milliseconds by 86,400,000 cannot produce the
    // calendar answer. On a machine without a DST transition the two
    // assertions below would pass for that broken implementation too, which is
    // why this test switches zones instead of trusting the ambient one.
    assert.equal(localDayLength(2026, 3, 8), 23 * MS_PER_HOUR);
    assert.equal(localDayLength(2026, 11, 1), 25 * MS_PER_HOUR);
    assert.equal(daysBetween('2026-03-07', '2026-03-09'), 2);
    assert.equal(daysBetween('2026-10-31', '2026-11-02'), 2);
    // Rounding cannot rescue it either: a 47-hour span is 1.958 days, and
    // flooring that reports a day the player never lived through.
    assert.equal(daysBetween('2026-03-01', '2026-03-15'), 14);
  });
});

test('daysBetween is a whole number of days wherever the transitions fall', () => {
  inZone('America/New_York', () => {
    const spans = [
      ['2026-03-01', '2026-03-15'], // spans the 23h day
      ['2026-10-25', '2026-11-08'], // spans the 25h day
      ['2026-01-01', '2027-01-01'],
      ['2026-11-01', '2026-11-01']
    ];
    for (const [a, b] of spans) {
      const n = daysBetween(a, b);
      assert.ok(Number.isInteger(n), `${a} -> ${b} gave ${n}, not a whole number of days`);
    }
  });
});

test('every calendar day is exactly one day from the next', () => {
  inZone('America/New_York', () => {
    for (const year of [2024, 2026]) { // 2024 has the leap day in February
      let cursor = `${year}-01-01`;
      const last = year === 2024 ? `${year + 1}-01-01` : `${year + 1}-01-01`;
      let counted = 0;
      while (cursor !== last) {
        const next = nextKey(cursor);
        assert.equal(daysBetween(cursor, next), 1, `${cursor} -> ${next} must be 1 day`);
        cursor = next;
        counted++;
      }
      assert.equal(daysBetween(`${year}-01-01`, last), counted);
      assert.equal(daysBetween(last, `${year}-01-01`), -counted);
    }
  });
});

test('daysBetween is exact across a year boundary', () => {
  assert.equal(daysBetween('2025-12-31', '2026-01-01'), 1);
  assert.equal(daysBetween('2024-02-28', '2024-03-01'), 2); // leap year
});

test('daysBetween reports NaN rather than guessing at a key it cannot read', () => {
  assert.ok(Number.isNaN(daysBetween('2026-01-01', 'rubbish')));
  assert.ok(Number.isNaN(daysBetween('rubbish', '2026-01-01')));
});