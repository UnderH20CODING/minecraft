import { applyRate, sum } from '../money.js';
import { quarterOf, quarterRange, yearOf } from '../dates.js';
import {
  EIGHT_PERCENT_EXEMPTION, EIGHT_PERCENT_RATE, FIRST_SUPPORTED_YEAR, GRADUATED_2023, OSD_RATE, VAT_THRESHOLD,
} from './rules.js';

export function graduatedTax(taxableIncome) {
  if (taxableIncome <= 0) return 0;
  const [lower, baseTax, rate] = GRADUATED_2023.find(([min]) => taxableIncome > min);
  return baseTax + applyRate(taxableIncome - lower, rate);
}

function cumulativeThrough(items, year, quarter, key) {
  return sum(items.filter((i) => yearOf(i.date) === year && quarterOf(i.date) <= quarter), key);
}

// Tax due on cumulative figures from January 1 to the end of `quarter`.
function cumulativeTaxDue({ sales, expenses, year, quarter, profile }) {
  const grossSales = cumulativeThrough(sales, year, quarter, 'amount');
  const withheld = cumulativeThrough(sales, year, quarter, 'withheld');

  if (profile.incomeTaxOption === '8%') {
    const exemption = profile.mixedIncome ? 0 : EIGHT_PERCENT_EXEMPTION;
    const taxBase = Math.max(0, grossSales - exemption);
    return {
      method: '8% on gross sales/receipts',
      grossSales, withheld, exemption, deductions: 0, taxBase,
      taxDue: applyRate(taxBase, EIGHT_PERCENT_RATE),
    };
  }

  const useOsd = profile.deductionMethod !== 'itemized';
  const deductions = useOsd
    ? applyRate(grossSales, OSD_RATE)
    : cumulativeThrough(expenses, year, quarter, 'amount');
  const taxBase = Math.max(0, grossSales - deductions);
  return {
    method: useOsd ? 'Graduated rates, 40% OSD' : 'Graduated rates, itemized deductions',
    grossSales, withheld, exemption: 0, deductions, taxBase,
    taxDue: graduatedTax(taxBase),
  };
}

// BIR Form 1701Q: Quarterly Income Tax Return for individuals (self-employed,
// professionals, mixed-income earners). Computed cumulatively, less what was
// paid in earlier quarters and taxes withheld by customers (Form 2307).
export function compute1701Q({ sales, expenses, year, quarter, profile }) {
  const period = { start: quarterRange(year, 1).start, end: quarterRange(year, quarter).end };
  const base = { form: '1701Q', title: 'Quarterly Income Tax Return (Individuals)', year, quarter, period };

  if (year < FIRST_SUPPORTED_YEAR) {
    return { ...base, required: false, reason: `Tax years before ${FIRST_SUPPORTED_YEAR} use an older rate table and are not supported.` };
  }
  if (quarter === 4) {
    return {
      ...base,
      required: false,
      reason: 'There is no 4th-quarter 1701Q. Q4 is settled in the annual return (1701 or 1701A), due April 15.',
    };
  }

  let paidInPriorQuarters = 0;
  let current;
  for (let q = 1; q <= quarter; q++) {
    current = cumulativeTaxDue({ sales, expenses, year, quarter: q, profile });
    current.paidInPriorQuarters = paidInPriorQuarters;
    current.payable = Math.max(0, current.taxDue - paidInPriorQuarters - current.withheld);
    current.overpayment = Math.max(0, paidInPriorQuarters + current.withheld - current.taxDue);
    paidInPriorQuarters += current.payable;
  }

  return {
    ...base,
    required: true,
    ...current,
    fields: [
      { label: 'Cumulative gross sales/receipts (Jan 1 to quarter end)', amount: current.grossSales },
      ...(current.exemption ? [{ label: 'Less: amount exempt under the 8% option', amount: current.exemption }] : []),
      ...(profile.incomeTaxOption === '8%' ? [] : [{
        label: profile.deductionMethod === 'itemized' ? 'Less: allowable itemized deductions' : 'Less: Optional Standard Deduction (40%)',
        amount: current.deductions,
      }]),
      { label: profile.incomeTaxOption === '8%' ? 'Taxable gross sales' : 'Taxable income to date', amount: current.taxBase },
      { label: `Tax due to date (${current.method})`, amount: current.taxDue },
      { label: 'Less: tax paid in previous quarters', amount: current.paidInPriorQuarters },
      { label: 'Less: creditable tax withheld (Form 2307)', amount: current.withheld },
      { label: 'Tax payable this quarter', amount: current.payable },
    ],
  };
}

// Full-year estimate that feeds the April 15 annual return (1701 / 1701A).
export function computeAnnualEstimate({ sales, expenses, year, profile }) {
  const full = cumulativeTaxDue({ sales, expenses, year, quarter: 4, profile });
  const quarterly = compute1701Q({ sales, expenses, year, quarter: 3, profile });
  const paidQuarterly = quarterly.required ? quarterly.paidInPriorQuarters + quarterly.payable : 0;
  const itemized = profile.incomeTaxOption !== '8%' && profile.deductionMethod === 'itemized';
  return {
    form: profile.mixedIncome || itemized ? '1701' : '1701A',
    title: 'Annual Income Tax Return (estimate)',
    year,
    ...full,
    paidQuarterly,
    balance: full.taxDue - paidQuarterly - full.withheld,
  };
}

export function eightPercentEligible(profile, annualGross) {
  return !profile.vatRegistered && annualGross <= VAT_THRESHOLD;
}
