#!/usr/bin/env node
// Usage:
//   node src/cli.js remind [--today=YYYY-MM-DD] [--dry-run]   send due reminders (run daily from cron)
//   node src/cli.js deadlines [--year=YYYY]                    list filing deadlines
//   node src/cli.js import-sales <file.csv> [--replace-year=YYYY]
//   node src/cli.js import-expenses <file.csv> [--replace-year=YYYY]
import { readFileSync } from 'node:fs';
import { formatLong, todayIso } from './dates.js';
import { deadlinesForTaxYear } from './deadlines.js';
import { importExpensesCsv, importSalesCsv } from './ledger.js';
import { notifiersFromEnv } from './notifiers/index.js';
import { runReminders } from './reminders.js';
import { openStore } from './db.js';
import { parseHolidays } from './server.js';

const [command, ...rest] = process.argv.slice(2);
const flags = Object.fromEntries(rest.filter((a) => a.startsWith('--')).map((a) => {
  const [k, v] = a.slice(2).split('=');
  return [k, v ?? true];
}));
const positional = rest.filter((a) => !a.startsWith('--'));
const store = openStore();
const extraHolidays = parseHolidays();

try {
  if (command === 'remind') {
    const results = await runReminders({
      store, notifiers: notifiersFromEnv(), today: flags.today ?? todayIso(), extraHolidays, dryRun: Boolean(flags['dry-run']),
    });
    if (!results.length) console.log('No reminders due today.');
    for (const r of results) console.log(`${r.status.padEnd(12)} ${r.channel.padEnd(10)} ${r.deadline}${r.error ? `  ${r.error}` : ''}`);
    if (results.some((r) => r.status === 'failed')) process.exitCode = 1;
  } else if (command === 'deadlines') {
    const year = Number(flags.year ?? todayIso().slice(0, 4));
    for (const d of deadlinesForTaxYear(year, store.getProfile(), extraHolidays)) {
      console.log(`${formatLong(d.due).padEnd(20)} ${d.form.padEnd(6)} ${d.title}${d.moved ? `  (moved from ${d.statutory})` : ''}`);
    }
  } else if (command === 'import-sales' || command === 'import-expenses') {
    const text = readFileSync(positional[0], 'utf8');
    const isSales = command === 'import-sales';
    const { records, errors } = (isSales ? importSalesCsv : importExpensesCsv)(text);
    for (const e of errors) console.error(`line ${e.line}: ${e.message}`);
    if (errors.length) {
      console.error(`${errors.length} row(s) had errors; nothing imported.`);
      process.exitCode = 1;
    } else {
      const opts = { replaceYear: flags['replace-year'] };
      const n = isSales ? store.addSales(records, opts) : store.addExpenses(records, opts);
      console.log(`Imported ${n} ${isSales ? 'sales' : 'expenses'}.`);
    }
  } else {
    console.log('Commands: remind, deadlines, import-sales, import-expenses (see src/cli.js)');
  }
} finally {
  store.close();
}
