// Dates are handled as ISO 'YYYY-MM-DD' strings and UTC Date objects so that
// server time zone never shifts a deadline by a day.

export function parseDate(input) {
  const s = String(input ?? '').trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  let y, mo, d;
  if (m) [, y, mo, d] = m;
  else if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) [, mo, d, y] = m; // MM/DD/YYYY (PH convention)
  else throw new Error(`Unrecognized date "${s}" (use YYYY-MM-DD or MM/DD/YYYY)`);
  const date = new Date(Date.UTC(+y, +mo - 1, +d));
  if (date.getUTCMonth() !== +mo - 1 || date.getUTCDate() !== +d) throw new Error(`Invalid date "${s}"`);
  return toIso(date);
}

export function toIso(date) {
  return date.toISOString().slice(0, 10);
}

export function fromIso(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(iso, days) {
  const d = fromIso(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

export function daysBetween(fromIsoDate, toIsoDate) {
  return Math.round((fromIso(toIsoDate) - fromIso(fromIsoDate)) / 86_400_000);
}

export function yearOf(iso) {
  return Number(iso.slice(0, 4));
}

export function quarterOf(iso) {
  return Math.floor((Number(iso.slice(5, 7)) - 1) / 3) + 1;
}

export function quarterRange(year, quarter) {
  const startMonth = (quarter - 1) * 3;
  const start = toIso(new Date(Date.UTC(year, startMonth, 1)));
  const end = toIso(new Date(Date.UTC(year, startMonth + 3, 0)));
  return { start, end };
}

export function todayIso(timeZone = 'Asia/Manila') {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}

export function formatLong(iso) {
  return fromIso(iso).toLocaleDateString('en-PH', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}
