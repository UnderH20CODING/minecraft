import { applyRate, sum } from '../money.js';
import { quarterOf, quarterRange, yearOf } from '../dates.js';
import { percentageTaxRate } from './rules.js';

export function percentageTaxApplies(profile) {
  if (profile.vatRegistered) {
    return { applies: false, reason: 'VAT-registered taxpayers file BIR Form 2550Q instead of 2551Q.' };
  }
  if (profile.incomeTaxOption === '8%') {
    return { applies: false, reason: 'The 8% income tax option is in lieu of percentage tax, so no 2551Q is due.' };
  }
  return { applies: true };
}

// BIR Form 2551Q: Quarterly Percentage Tax Return (NIRC Sec. 116, ATC PT010).
export function compute2551Q({ sales, year, quarter, profile }) {
  const period = quarterRange(year, quarter);
  const base = { form: '2551Q', title: 'Quarterly Percentage Tax Return', year, quarter, period };
  const applicability = percentageTaxApplies(profile);
  if (!applicability.applies) return { ...base, required: false, reason: applicability.reason };

  const inQuarter = sales.filter((s) => yearOf(s.date) === year && quarterOf(s.date) === quarter);

  // A quarter can straddle a rate change (Q3 2020, Q3 2023 boundaries), so group by rate.
  const byRate = new Map();
  for (const sale of inQuarter) {
    const rate = percentageTaxRate(sale.date);
    byRate.set(rate, (byRate.get(rate) ?? 0) + sale.amount);
  }
  const schedule = [...byRate.entries()].map(([rate, taxableAmount]) => ({
    atc: 'PT010',
    description: 'Persons exempt from VAT under Sec. 109(CC)',
    taxableAmount,
    rate,
    taxDue: applyRate(taxableAmount, rate),
  }));

  const grossSales = sum(inQuarter, 'amount');
  const taxDue = sum(schedule, 'taxDue');
  return {
    ...base,
    required: true,
    transactionCount: inQuarter.length,
    grossSales,
    schedule,
    taxDue,
    fields: [
      { label: 'Taxable amount (gross sales/receipts), ATC PT010', amount: grossSales },
      ...schedule.map((row) => ({ label: `Tax due at ${row.rate * 100}%`, amount: row.taxDue })),
      { label: 'Total tax due', amount: taxDue },
      { label: 'Less: creditable percentage tax withheld (Form 2307), if any', amount: 0, note: 'Enter from your 2307s' },
      { label: 'Tax still payable', amount: taxDue },
    ],
  };
}
