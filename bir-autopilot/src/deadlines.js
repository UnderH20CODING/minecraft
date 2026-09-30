import { addDays, fromIso, quarterRange, toIso } from './dates.js';
import { percentageTaxApplies } from './tax/percentageTax.js';

// Anonymous Gregorian algorithm for Easter Sunday.
function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return toIso(new Date(Date.UTC(year, month - 1, day)));
}

function lastMondayOfAugust(year) {
  const d = new Date(Date.UTC(year, 8, 0)); // Aug 31
  while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() - 1);
  return toIso(d);
}

// Regular holidays whose dates can be computed (RA 9492 as amended). Eid'l Fitr,
// Eid'l Adha and special non-working days are proclaimed yearly, so pass them in
// through `extraHolidays` (the HOLIDAYS setting).
export function regularHolidays(year) {
  const easter = easterSunday(year);
  return new Set([
    `${year}-01-01`, // New Year's Day
    addDays(easter, -3), // Maundy Thursday
    addDays(easter, -2), // Good Friday
    `${year}-04-09`, // Araw ng Kagitingan
    `${year}-05-01`, // Labor Day
    `${year}-06-12`, // Independence Day
    lastMondayOfAugust(year), // National Heroes Day
    `${year}-11-30`, // Bonifacio Day
    `${year}-12-25`, // Christmas Day
    `${year}-12-30`, // Rizal Day
  ]);
}

export function isNonWorkingDay(iso, extraHolidays = []) {
  const weekday = fromIso(iso).getUTCDay();
  if (weekday === 0 || weekday === 6) return true;
  return regularHolidays(Number(iso.slice(0, 4))).has(iso) || extraHolidays.includes(iso);
}

// When a deadline falls on a weekend or holiday, it moves to the next working day.
export function nextWorkingDay(iso, extraHolidays = []) {
  let d = iso;
  while (isNonWorkingDay(d, extraHolidays)) d = addDays(d, 1);
  return d;
}

function deadline({ id, form, title, taxYear, quarter, statutory, extraHolidays }) {
  const due = nextWorkingDay(statutory, extraHolidays);
  return { id, form, title, taxYear, quarter, statutory, due, moved: due !== statutory };
}

// Every filing deadline that belongs to `taxYear`, including the ones that fall
// in the following calendar year (Q4 2551Q in January, annual ITR in April).
export function deadlinesForTaxYear(taxYear, profile, extraHolidays = []) {
  const list = [];

  if (percentageTaxApplies(profile).applies) {
    for (let q = 1; q <= 4; q++) {
      const quarterEnd = quarterRange(taxYear, q).end;
      const statutory = addDays(quarterEnd, 25); // 25th day after the quarter closes
      list.push(deadline({
        id: `2551Q-${taxYear}-Q${q}`, form: '2551Q', title: `Percentage tax, Q${q} ${taxYear}`,
        taxYear, quarter: q, statutory, extraHolidays,
      }));
    }
  }

  if (!profile.corporation) {
    const quarterly = [[1, `${taxYear}-05-15`], [2, `${taxYear}-08-15`], [3, `${taxYear}-11-15`]];
    for (const [q, statutory] of quarterly) {
      list.push(deadline({
        id: `1701Q-${taxYear}-Q${q}`, form: '1701Q', title: `Quarterly income tax, Q${q} ${taxYear}`,
        taxYear, quarter: q, statutory, extraHolidays,
      }));
    }
    const annualForm = profile.mixedIncome || (profile.incomeTaxOption !== '8%' && profile.deductionMethod === 'itemized')
      ? '1701' : '1701A';
    list.push(deadline({
      id: `${annualForm}-${taxYear}`, form: annualForm, title: `Annual income tax return, ${taxYear}`,
      taxYear, quarter: null, statutory: `${taxYear + 1}-04-15`, extraHolidays,
    }));
  }

  return list.sort((a, b) => a.due.localeCompare(b.due));
}

export function upcomingDeadlines(today, profile, { withinDays = 120, extraHolidays = [] } = {}) {
  const year = Number(today.slice(0, 4));
  const horizon = addDays(today, withinDays);
  return [year - 1, year]
    .flatMap((y) => deadlinesForTaxYear(y, profile, extraHolidays))
    .filter((d) => d.due >= today && d.due <= horizon)
    .sort((a, b) => a.due.localeCompare(b.due));
}
