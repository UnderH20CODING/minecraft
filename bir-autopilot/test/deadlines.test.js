import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deadlinesForTaxYear, nextWorkingDay, regularHolidays, upcomingDeadlines } from '../src/deadlines.js';

const graduated = { incomeTaxOption: 'graduated', deductionMethod: 'osd', mixedIncome: false, vatRegistered: false };
const eight = { ...graduated, incomeTaxOption: '8%' };
const byId = (list) => Object.fromEntries(list.map((d) => [d.id, d]));

test('computed 2026 regular holidays include Holy Week and Heroes Day', () => {
  const h = regularHolidays(2026);
  assert.ok(h.has('2026-04-02')); // Maundy Thursday
  assert.ok(h.has('2026-04-03')); // Good Friday
  assert.ok(h.has('2026-08-31')); // last Monday of August
});

test('deadlines on weekends and holidays roll to the next working day', () => {
  assert.equal(nextWorkingDay('2026-04-25'), '2026-04-27'); // Saturday
  assert.equal(nextWorkingDay('2026-04-02'), '2026-04-06'); // Maundy Thu, Good Fri, weekend
  assert.equal(nextWorkingDay('2026-05-15'), '2026-05-15'); // Friday
  assert.equal(nextWorkingDay('2026-05-15', ['2026-05-15']), '2026-05-18'); // proclaimed holiday
});

test('2026 filing calendar for a graduated-rate filer', () => {
  const d = byId(deadlinesForTaxYear(2026, graduated));
  assert.equal(d['2551Q-2026-Q1'].due, '2026-04-27');
  assert.equal(d['2551Q-2026-Q2'].due, '2026-07-27');
  assert.equal(d['2551Q-2026-Q3'].due, '2026-10-26');
  assert.equal(d['2551Q-2026-Q4'].due, '2027-01-25');
  assert.equal(d['1701Q-2026-Q1'].due, '2026-05-15');
  assert.equal(d['1701Q-2026-Q2'].due, '2026-08-17');
  assert.equal(d['1701Q-2026-Q3'].due, '2026-11-16');
  assert.equal(d['1701A-2026'].due, '2027-04-15');
  assert.equal(Object.keys(d).length, 8);
});

test('8% filers get no 2551Q deadlines; itemized/mixed filers use Form 1701', () => {
  const eightList = deadlinesForTaxYear(2026, eight);
  assert.ok(eightList.every((d) => d.form !== '2551Q'));
  assert.ok(deadlinesForTaxYear(2026, { ...graduated, deductionMethod: 'itemized' }).some((d) => d.id === '1701-2026'));
  assert.ok(deadlinesForTaxYear(2026, { ...eight, mixedIncome: true }).some((d) => d.id === '1701-2026'));
});

test('upcoming deadlines include the prior tax year\'s January and April filings', () => {
  const upcoming = upcomingDeadlines('2026-01-02', graduated, { withinDays: 120 });
  assert.deepEqual(upcoming.map((d) => d.id), ['2551Q-2025-Q4', '1701A-2025', '2551Q-2026-Q1']);
});
