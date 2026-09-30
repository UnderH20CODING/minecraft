import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, toCsv } from '../src/csv.js';
import { auditInvoiceSeries, cashReceiptsJournal, importSalesCsv } from '../src/ledger.js';

test('CSV parser handles quotes, embedded commas and CRLF', () => {
  const rows = parseCsv('Date,Description,Amount\r\n2026-01-01,"Ink, paper",100\r\n2026-01-02,"He said ""hi""",5\r\n');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].description, 'Ink, paper');
  assert.equal(rows[1].description, 'He said "hi"');
  assert.equal(toCsv([{ a: 'x,y' }], [{ key: 'a', label: 'A' }]), 'A\r\n"x,y"\r\n');
});

test('sales import accepts header aliases and PH date format, and reports bad rows', () => {
  const csv = 'Petsa,SI No,Customer,Total,CWT\n01/15/2026,SI-1,Ana,"₱1,500.00",15\nnot-a-date,SI-2,Ben,100,\n2026-01-16,SI-3,Cy,,\n';
  const { records, errors } = importSalesCsv(csv);
  assert.equal(records.length, 1);
  assert.deepEqual(records[0], {
    date: '2026-01-15', invoiceNo: 'SI-1', customer: 'Ana', description: '', amount: 150000, withheld: 1500,
  });
  assert.deepEqual(errors.map((e) => e.line), [3, 4]);
});

test('invoice audit finds gaps, duplicates and missing numbers', () => {
  const sales = ['SI-001', 'SI-002', 'SI-005', 'SI-005', ''].map((invoiceNo) => ({ invoiceNo }));
  const audit = auditInvoiceSeries(sales);
  assert.deepEqual(audit.duplicates, ['SI-005']);
  assert.deepEqual(audit.gaps, [{ from: 'SI-003', to: 'SI-004', count: 2 }]);
  assert.equal(audit.salesWithoutInvoiceNo, 1);
});

test('cash receipts journal splits cash and withholding', () => {
  const rows = cashReceiptsJournal([
    { date: '2026-01-02', invoiceNo: 'SI-2', customer: 'B', description: '', amount: 10000, withheld: 100 },
    { date: '2026-01-01', invoiceNo: 'SI-1', customer: 'A', description: 'Mugs', amount: 5000, withheld: 0 },
    { date: '2025-12-31', invoiceNo: 'SI-0', customer: 'Z', description: '', amount: 999, withheld: 0 },
  ], 2026);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].reference, 'SI-1');
  assert.equal(rows[1].cashDebit, '99.00');
  assert.equal(rows[1].runningSales, '150.00');
});
