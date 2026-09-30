import { parseCsv } from './csv.js';
import { parseDate, yearOf } from './dates.js';
import { toCentavos } from './money.js';

const ALIASES = {
  date: ['date', 'transaction_date', 'invoice_date', 'petsa'],
  invoiceNo: ['invoice_no', 'invoice', 'invoice_number', 'si_no', 'or_no', 'receipt_no', 'reference'],
  customer: ['customer', 'client', 'buyer', 'sold_to', 'customer_name'],
  supplier: ['supplier', 'vendor', 'payee', 'paid_to'],
  description: ['description', 'item', 'items', 'particulars', 'details', 'memo'],
  amount: ['amount', 'total', 'gross', 'gross_amount', 'sales', 'net_sales', 'halaga'],
  withheld: ['withheld', 'withholding', 'cwt', 'tax_withheld', 'ewt', '2307'],
  category: ['category', 'account', 'expense_type'],
};

function pick(row, field) {
  const key = ALIASES[field].find((alias) => row[alias] !== undefined && row[alias] !== '');
  return key ? row[key] : '';
}

function normalize(rows, kind) {
  const records = [];
  const errors = [];
  for (const row of rows) {
    try {
      const date = parseDate(pick(row, 'date'));
      const amount = toCentavos(pick(row, 'amount'));
      if (!pick(row, 'amount')) throw new Error('Missing amount');
      const record = kind === 'sale'
        ? {
          date,
          invoiceNo: pick(row, 'invoiceNo'),
          customer: pick(row, 'customer'),
          description: pick(row, 'description'),
          amount,
          withheld: toCentavos(pick(row, 'withheld')),
        }
        : {
          date,
          supplier: pick(row, 'supplier'),
          description: pick(row, 'description'),
          category: pick(row, 'category') || 'Uncategorized',
          amount,
        };
      records.push(record);
    } catch (err) {
      errors.push({ line: row._line, message: err.message });
    }
  }
  return { records, errors };
}

export function importSalesCsv(text) {
  return normalize(parseCsv(text), 'sale');
}

export function importExpensesCsv(text) {
  return normalize(parseCsv(text), 'expense');
}

// Under the EOPT Act the invoice is the primary sales document, and invoices
// must be issued in unbroken serial order. Flag gaps and duplicates per prefix.
export function auditInvoiceSeries(sales) {
  const seen = new Map();
  const duplicates = [];
  const series = new Map();
  const missingNumbers = [];

  for (const sale of sales) {
    const no = sale.invoiceNo?.trim();
    if (!no) { missingNumbers.push(sale); continue; }
    if (seen.has(no)) duplicates.push(no);
    seen.set(no, true);
    const m = no.match(/^(.*?)(\d+)$/);
    if (!m) continue;
    const [, prefix, digits] = m;
    if (!series.has(prefix)) series.set(prefix, { width: digits.length, numbers: [] });
    series.get(prefix).numbers.push(Number(digits));
  }

  const gaps = [];
  for (const [prefix, { width, numbers }] of series) {
    const sorted = [...new Set(numbers)].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      const from = sorted[i - 1] + 1;
      const to = sorted[i] - 1;
      if (to >= from) {
        const label = (n) => prefix + String(n).padStart(width, '0');
        gaps.push({ from: label(from), to: label(to), count: to - from + 1 });
      }
    }
  }

  return {
    duplicates: [...new Set(duplicates)],
    gaps,
    salesWithoutInvoiceNo: missingNumbers.length,
  };
}

// Columnar books: Cash Receipts Journal (sales) and Cash Disbursements Journal (expenses).
export function cashReceiptsJournal(sales, year) {
  let running = 0;
  return sales
    .filter((s) => yearOf(s.date) === year)
    .sort((a, b) => a.date.localeCompare(b.date) || String(a.invoiceNo).localeCompare(String(b.invoiceNo)))
    .map((s) => {
      running += s.amount;
      return {
        date: s.date,
        reference: s.invoiceNo,
        particulars: [s.customer, s.description].filter(Boolean).join(' - '),
        cashDebit: ((s.amount - s.withheld) / 100).toFixed(2),
        cwtDebit: (s.withheld / 100).toFixed(2),
        salesCredit: (s.amount / 100).toFixed(2),
        runningSales: (running / 100).toFixed(2),
      };
    });
}

export const CASH_RECEIPTS_COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'reference', label: 'Invoice No.' },
  { key: 'particulars', label: 'Particulars' },
  { key: 'cashDebit', label: 'Cash (Dr)' },
  { key: 'cwtDebit', label: 'Creditable Withholding Tax (Dr)' },
  { key: 'salesCredit', label: 'Sales (Cr)' },
  { key: 'runningSales', label: 'Running Total Sales' },
];

export function cashDisbursementsJournal(expenses, year) {
  return expenses
    .filter((e) => yearOf(e.date) === year)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      date: e.date,
      payee: e.supplier,
      particulars: e.description,
      account: e.category,
      expenseDebit: (e.amount / 100).toFixed(2),
      cashCredit: (e.amount / 100).toFixed(2),
    }));
}

export const CASH_DISBURSEMENTS_COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'payee', label: 'Payee' },
  { key: 'particulars', label: 'Particulars' },
  { key: 'account', label: 'Account' },
  { key: 'expenseDebit', label: 'Expense (Dr)' },
  { key: 'cashCredit', label: 'Cash (Cr)' },
];
