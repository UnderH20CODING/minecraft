import { applyRate } from '../money.js';
import { daysBetween } from '../dates.js';
import { PENALTY_RATES } from './rules.js';

// Estimate of the civil penalties for filing or paying after the deadline:
// a one-time surcharge plus simple annual interest on the unpaid tax. The
// compromise penalty is set by BIR schedule and is not estimated here.
export function estimateLatePenalty({ basicTax, dueDate, paymentDate, classification = 'micro' }) {
  const daysLate = Math.max(0, daysBetween(dueDate, paymentDate));
  const rates = PENALTY_RATES[classification] ?? PENALTY_RATES.micro;
  if (daysLate === 0 || basicTax <= 0) {
    return { daysLate, surcharge: 0, interest: 0, total: basicTax, rates };
  }
  const surcharge = applyRate(basicTax, rates.surcharge);
  const interest = applyRate(basicTax, (rates.annualInterest * daysLate) / 365);
  return { daysLate, surcharge, interest, total: basicTax + surcharge + interest, rates };
}
