import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { openStore } from '../src/db.js';
import { createApp } from '../src/server.js';
import { runReminders } from '../src/reminders.js';

function fakeNotifier(channel = 'sms') {
  const sent = [];
  return { channel, sent, canSend: (p) => Boolean(p.phone), send: async (_p, text) => { sent.push(text); } };
}

test('reminders go out on lead days and are never sent twice', async () => {
  const store = openStore(':memory:');
  store.saveProfile({ businessName: 'Tindahan ni Aling Nena', phone: '09171234567' });
  store.addSales([{ date: '2026-08-01', invoiceNo: 'SI-1', customer: '', description: '', amount: 10_000_00, withheld: 0 }]);
  const sms = fakeNotifier();

  // 2551Q Q3 2026 is due Mon Oct 26 (Oct 25 is a Sunday): 7 days from Oct 19.
  const first = await runReminders({ store, notifiers: [sms], today: '2026-10-19' });
  assert.deepEqual(first.map((r) => [r.deadline, r.status]), [['2551Q-2026-Q3', 'sent']]);
  assert.match(sms.sent[0], /Tindahan ni Aling Nena: BIR 2551Q .* due in 7 days, Mon, Oct 26, 2026\. Est\. tax due: ₱300\.00/);

  const second = await runReminders({ store, notifiers: [sms], today: '2026-10-19' });
  assert.equal(second[0].status, 'already-sent');
  assert.equal(sms.sent.length, 1);

  const noLeadDay = await runReminders({ store, notifiers: [sms], today: '2026-10-20' });
  assert.equal(noLeadDay.length, 0);
  store.close();
});

test('HTTP API: import sample data, then summary, books and validation', async () => {
  const store = openStore(':memory:');
  const server = createServer(createApp({ store, notifiers: [] }));
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const salesCsv = readFileSync(new URL('../samples/sales-sample.csv', import.meta.url), 'utf8');
    const imported = await fetch(`${base}/api/sales/import`, { method: 'POST', body: salesCsv }).then((r) => r.json());
    assert.equal(imported.imported, 139);

    const summary = await fetch(`${base}/api/summary?year=2026`).then((r) => r.json());
    assert.equal(summary.quarters[0].forms[0].form, '2551Q');
    assert.equal(summary.quarters[0].forms[0].deadline.due, '2026-04-27');
    assert.ok(summary.warnings.some((w) => w.message.includes('SI-1046')), 'sample invoice gap is flagged');

    const csv = await fetch(`${base}/api/books/cash-receipts.csv?year=2026`).then((r) => r.text());
    assert.ok(csv.startsWith('Date,Invoice No.,Particulars'));

    const bad = await fetch(`${base}/api/sales/import`, { method: 'POST', body: 'date,amount\nnope,1\n' });
    assert.equal(bad.status, 422);
    const badProfile = await fetch(`${base}/api/profile`, { method: 'PUT', body: JSON.stringify({ incomeTaxOption: '5%' }) });
    assert.equal(badProfile.status, 400);
    const badPenalty = await fetch(`${base}/api/penalty?tax=100&due=soon`);
    assert.equal(badPenalty.status, 400);
    const traversal = await fetch(`${base}/..%2f..%2fpackage.json`);
    assert.equal(traversal.status, 404);
  } finally {
    server.close();
    store.close();
  }
});
