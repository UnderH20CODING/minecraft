import { quarterOf, yearOf } from './dates.js';
import { deadlinesForTaxYear } from './deadlines.js';
import { auditInvoiceSeries } from './ledger.js';
import { formatPeso, sum } from './money.js';
import { classifyTaxpayer } from './tax/classification.js';
import { compute1701Q, computeAnnualEstimate } from './tax/incomeTax.js';
import { compute2551Q } from './tax/percentageTax.js';
import { FIRST_SUPPORTED_YEAR, VAT_THRESHOLD } from './tax/rules.js';

export function buildWarnings({ profile, year, sales, annualGross, invoiceAudit }) {
  const warnings = [];
  const add = (level, message) => warnings.push({ level, message });

  if (profile.vatRegistered) {
    add('error', 'VAT-registered businesses (2550Q) are not supported yet. The figures here only cover non-VAT taxpayers.');
  }
  if (year < FIRST_SUPPORTED_YEAR) {
    add('error', `Tax year ${year} predates the 2023 rate table and is not supported.`);
  }
  if (annualGross > VAT_THRESHOLD) {
    add('error', `Gross sales of ${formatPeso(annualGross)} exceed the ₱3,000,000 VAT threshold, so you must register as a VAT taxpayer${profile.incomeTaxOption === '8%' ? '. You also lose the 8% option: the whole year\'s income tax is recomputed at graduated rates, and percentage tax applies to sales made before VAT registration' : ''}. Talk to your RDO or an accountant.`);
  } else if (annualGross > VAT_THRESHOLD * 0.8) {
    add('warn', `Gross sales are ${Math.round((annualGross / VAT_THRESHOLD) * 100)}% of the ₱3,000,000 VAT threshold. Plan for VAT registration if sales keep growing.`);
  }
  if (invoiceAudit.duplicates.length) {
    add('warn', `Duplicate invoice numbers: ${invoiceAudit.duplicates.slice(0, 5).join(', ')}${invoiceAudit.duplicates.length > 5 ? '…' : ''}.`);
  }
  for (const gap of invoiceAudit.gaps.slice(0, 5)) {
    add('warn', `Invoice series gap: ${gap.from}${gap.count > 1 ? ` to ${gap.to}` : ''} (${gap.count} missing). Cancelled invoices must be kept, not skipped.`);
  }
  if (invoiceAudit.salesWithoutInvoiceNo) {
    add('warn', `${invoiceAudit.salesWithoutInvoiceNo} sale(s) have no invoice number. Under the EOPT Act an invoice is required for every sale that meets the BIR threshold.`);
  }
  if (!sales.length) add('info', `No sales recorded for ${year} yet. Import your sales log to compute your returns.`);
  add('info', 'The ₱500 Annual Registration Fee (BIR Form 0605) was abolished by the EOPT Act (RA 11976) in January 2024, so nothing is due for it.');
  return warnings;
}

export function buildSummary({ profile, sales: allSales, expenses: allExpenses, year, extraHolidays = [] }) {
  const sales = allSales.filter((s) => yearOf(s.date) === year);
  const expenses = allExpenses.filter((e) => yearOf(e.date) === year);
  const annualGross = sum(sales, 'amount');
  const classification = classifyTaxpayer(annualGross);
  const invoiceAudit = auditInvoiceSeries(sales);
  const deadlines = deadlinesForTaxYear(year, profile, extraHolidays);

  const quarters = [1, 2, 3, 4].map((quarter) => {
    const qSales = sales.filter((s) => quarterOf(s.date) === quarter);
    const qExpenses = expenses.filter((e) => quarterOf(e.date) === quarter);
    const forms = [
      compute2551Q({ sales, year, quarter, profile }),
      compute1701Q({ sales, expenses, year, quarter, profile }),
    ].map((form) => ({
      ...form,
      deadline: deadlines.find((d) => d.form === form.form && d.quarter === quarter) ?? null,
    }));
    return {
      quarter,
      grossSales: sum(qSales, 'amount'),
      expenses: sum(qExpenses, 'amount'),
      withheld: sum(qSales, 'withheld'),
      salesCount: qSales.length,
      forms,
    };
  });

  const annual = computeAnnualEstimate({ sales, expenses, year, profile });
  annual.deadline = deadlines.find((d) => d.form === annual.form) ?? null;

  return {
    year,
    profile,
    annualGross,
    annualExpenses: sum(expenses, 'amount'),
    classification,
    quarters,
    annual,
    deadlines,
    invoiceAudit,
    warnings: buildWarnings({ profile, year, sales, annualGross, invoiceAudit }),
  };
}

// Amount the reminder should quote for a given deadline.
export function amountForDeadline(summary, deadline) {
  if (deadline.quarter) {
    const form = summary.quarters[deadline.quarter - 1].forms.find((f) => f.form === deadline.form);
    if (!form?.required) return null;
    return form.form === '2551Q' ? form.taxDue : form.payable;
  }
  return Math.max(0, summary.annual.balance);
}
