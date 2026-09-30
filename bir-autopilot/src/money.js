// All money is stored and computed as integer centavos to avoid float drift.

export function toCentavos(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Math.round(value * 100);
  let s = String(value).trim().replace(/[₱,\s]/g, '').replace(/^PHP/i, '');
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (!/^-?\d*\.?\d+$/.test(s)) throw new Error(`Not a valid amount: "${value}"`);
  const c = Math.round(parseFloat(s) * 100);
  return negative ? -c : c;
}

export function formatPeso(centavos) {
  const sign = centavos < 0 ? '-' : '';
  const abs = Math.abs(centavos);
  const pesos = Math.floor(abs / 100).toLocaleString('en-US');
  const cents = String(abs % 100).padStart(2, '0');
  return `${sign}₱${pesos}.${cents}`;
}

export function applyRate(centavos, rate) {
  return Math.round(centavos * rate);
}

export function sum(items, key) {
  return items.reduce((total, item) => total + (key ? item[key] : item), 0);
}
