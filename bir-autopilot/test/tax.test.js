import { test } from 'node:test';
import assert from 'node:assert/strict';
import { graduatedTax, compute1701Q, computeAnnualEstimate } from '../src/tax/incomeTax.js';
import { compute2551Q } from '../src/tax/percentageTax.js';
import { classifyTaxpayer } from '../src/tax/classification.js';
import { estimateLatePenalty } from '../src/tax/penalties.js';
import { toCentavos, formatPeso } from '../src/money.js';

const P = (pesos) => Math.round(pesos * 100);
const sale = (date, pesos, withheldPesos = 0) => ({ date, amount: P(pesos), withheld: P(withheldPesos) });
const expense = (date, pesos) => ({ date, amount: P(pesos) });
const graduated = { incomeTaxOption: 'graduated', deductionMethod: 'osd', mixedIncome: false, vatRegistered: false };
const eight = { ...graduated, incomeTaxOption: '8%' };

test('money parsing handles pesos, commas and parentheses', () => {
  assert.equal(toCentavos('₱1,234.50'), 123450);
  assert.equal(toCentavos('(200)'), -20000);
  assert.equal(toCentavos('0.29'), 29);
  assert.equal(formatPeso(123450), '₱1,234.50');
  assert.throws(() => toCentavos('12abc'));
});

test('graduated tax table (2023 onward)', () => {
  assert.equal(graduatedTax(P(250_000)), 0);
  assert.equal(graduatedTax(P(400_000)), P(22_500));
  assert.equal(graduatedTax(P(500_000)), P(42_500));
  assert.equal(graduatedTax(P(1_000_000)), P(152_500));
  assert.equal(graduatedTax(P(3_000_000)), P(702_500));
  assert.equal(graduatedTax(P(10_000_000)), P(2_902_500));
});

test('2551Q: 3% of quarterly gross sales', () => {
  const sales = [sale('2026-01-10', 100_000), sale('2026-03-31', 50_000), sale('2026-04-01', 999)];
  const form = compute2551Q({ sales, year: 2026, quarter: 1, profile: graduated });
  assert.equal(form.required, true);
  assert.equal(form.grossSales, P(150_000));
  assert.equal(form.taxDue, P(4_500));
});

test('2551Q uses the 1% CREATE rate through June 2023', () => {
  const sales = [sale('2023-05-01', 100_000), sale('2023-08-01', 100_000)];
  assert.equal(compute2551Q({ sales, year: 2023, quarter: 2, profile: graduated }).taxDue, P(1_000));
  assert.equal(compute2551Q({ sales, year: 2023, quarter: 3, profile: graduated }).taxDue, P(3_000));
});

test('2551Q is not required under the 8% option or when VAT-registered', () => {
  assert.equal(compute2551Q({ sales: [], year: 2026, quarter: 1, profile: eight }).required, false);
  assert.equal(compute2551Q({ sales: [], year: 2026, quarter: 1, profile: { ...graduated, vatRegistered: true } }).required, false);
});

test('1701Q 8% option: cumulative, ₱250k exempt, less prior quarters', () => {
  const sales = [sale('2026-02-01', 200_000), sale('2026-05-01', 300_000), sale('2026-08-01', 300_000)];
  const q1 = compute1701Q({ sales, expenses: [], year: 2026, quarter: 1, profile: eight });
  const q2 = compute1701Q({ sales, expenses: [], year: 2026, quarter: 2, profile: eight });
  const q3 = compute1701Q({ sales, expenses: [], year: 2026, quarter: 3, profile: eight });
  assert.equal(q1.payable, 0);
  assert.equal(q2.taxDue, P(20_000));
  assert.equal(q2.payable, P(20_000));
  assert.equal(q3.taxDue, P(44_000));
  assert.equal(q3.paidInPriorQuarters, P(20_000));
  assert.equal(q3.payable, P(24_000));
});

test('1701Q 8% option: mixed-income earners get no ₱250k exemption', () => {
  const sales = [sale('2026-02-01', 200_000)];
  const q1 = compute1701Q({ sales, expenses: [], year: 2026, quarter: 1, profile: { ...eight, mixedIncome: true } });
  assert.equal(q1.payable, P(16_000));
});

test('1701Q credits tax withheld by customers (Form 2307)', () => {
  const sales = [sale('2026-02-01', 400_000, 4_000)];
  const q1 = compute1701Q({ sales, expenses: [], year: 2026, quarter: 1, profile: eight });
  assert.equal(q1.taxDue, P(12_000));
  assert.equal(q1.payable, P(8_000));
});

test('1701Q graduated with OSD and with itemized deductions', () => {
  const sales = [sale('2026-03-01', 1_000_000)];
  const expenses = [expense('2026-03-02', 300_000)];
  const osd = compute1701Q({ sales, expenses, year: 2026, quarter: 1, profile: graduated });
  assert.equal(osd.deductions, P(400_000));
  assert.equal(osd.payable, P(62_500));
  const itemized = compute1701Q({ sales, expenses, year: 2026, quarter: 1, profile: { ...graduated, deductionMethod: 'itemized' } });
  assert.equal(itemized.payable, P(82_500));
});

test('there is no Q4 1701Q; annual estimate nets quarterly payments', () => {
  const sales = [sale('2026-02-01', 200_000), sale('2026-05-01', 300_000), sale('2026-11-01', 100_000)];
  assert.equal(compute1701Q({ sales, expenses: [], year: 2026, quarter: 4, profile: eight }).required, false);
  const annual = computeAnnualEstimate({ sales, expenses: [], year: 2026, profile: eight });
  assert.equal(annual.form, '1701A');
  assert.equal(annual.taxDue, P(28_000)); // (600k - 250k) x 8%
  assert.equal(annual.paidQuarterly, P(20_000));
  assert.equal(annual.balance, P(8_000));
});

test('EOPT taxpayer classification', () => {
  assert.equal(classifyTaxpayer(P(2_999_999)).id, 'micro');
  assert.equal(classifyTaxpayer(P(3_000_000)).id, 'small');
  assert.equal(classifyTaxpayer(P(20_000_000)).id, 'medium');
  assert.equal(classifyTaxpayer(P(1_000_000_000)).id, 'large');
});

test('late penalty: reduced EOPT rates for micro, regular for large', () => {
  const micro = estimateLatePenalty({ basicTax: P(10_000), dueDate: '2026-04-27', paymentDate: '2026-05-27', classification: 'micro' });
  assert.equal(micro.daysLate, 30);
  assert.equal(micro.surcharge, P(1_000));
  assert.equal(micro.interest, 4932);
  const large = estimateLatePenalty({ basicTax: P(10_000), dueDate: '2026-04-27', paymentDate: '2026-05-27', classification: 'large' });
  assert.equal(large.surcharge, P(2_500));
  assert.equal(large.interest, 9863);
  const onTime = estimateLatePenalty({ basicTax: P(10_000), dueDate: '2026-04-27', paymentDate: '2026-04-27' });
  assert.equal(onTime.total, P(10_000));
});
