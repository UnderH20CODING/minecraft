import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toCsv } from './csv.js';
import { parseDate, todayIso } from './dates.js';
import { upcomingDeadlines } from './deadlines.js';
import {
  CASH_DISBURSEMENTS_COLUMNS, CASH_RECEIPTS_COLUMNS, cashDisbursementsJournal, cashReceiptsJournal,
  importExpensesCsv, importSalesCsv,
} from './ledger.js';
import { notifiersFromEnv } from './notifiers/index.js';
import { runReminders } from './reminders.js';
import { buildSummary } from './report.js';
import { estimateLatePenalty } from './tax/penalties.js';
import { toCentavos } from './money.js';
import { openStore } from './db.js';

const PUBLIC_DIR = fileURLToPath(new URL('../public/', import.meta.url));
const SAMPLES_DIR = fileURLToPath(new URL('../samples/', import.meta.url));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.csv': 'text/csv; charset=utf-8', '.svg': 'image/svg+xml' };
const MAX_BODY = 5 * 1024 * 1024;

const PROFILE_FIELDS = {
  businessName: 'string', tin: 'string', rdo: 'string', phone: 'string', messengerPsid: 'string',
  incomeTaxOption: ['graduated', '8%'], deductionMethod: ['osd', 'itemized'],
  mixedIncome: 'boolean', vatRegistered: 'boolean', reminderDays: 'days',
};

function sanitizeProfile(input) {
  const out = {};
  for (const [key, type] of Object.entries(PROFILE_FIELDS)) {
    if (!(key in input)) continue;
    const v = input[key];
    if (Array.isArray(type)) {
      if (!type.includes(v)) throw httpError(400, `${key} must be one of ${type.join(', ')}`);
      out[key] = v;
    } else if (type === 'boolean') out[key] = Boolean(v);
    else if (type === 'days') {
      if (!Array.isArray(v) || !v.every((d) => Number.isInteger(d) && d >= 0 && d <= 60)) {
        throw httpError(400, 'reminderDays must be whole numbers between 0 and 60');
      }
      out[key] = [...new Set(v)].sort((a, b) => b - a);
    } else out[key] = String(v ?? '').slice(0, 200);
  }
  return out;
}

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw httpError(413, 'Upload too large (5 MB max)');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function readJson(req) {
  const text = await readBody(req);
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw httpError(400, 'Body must be valid JSON');
  }
}

function send(res, status, body, type = 'application/json; charset=utf-8', extraHeaders = {}) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', ...extraHeaders });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
}

function parseYear(url) {
  const year = Number(url.searchParams.get('year') ?? todayIso().slice(0, 4));
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw httpError(400, 'Invalid year');
  return year;
}

async function serveStatic(res, baseDir, pathname) {
  const target = normalize(join(baseDir, pathname));
  if (!target.startsWith(baseDir)) return send(res, 404, { error: 'Not found' });
  try {
    const data = await readFile(target);
    send(res, 200, data, MIME[extname(target)] ?? 'application/octet-stream');
  } catch {
    send(res, 404, { error: 'Not found' });
  }
}

export function createApp({ store, notifiers = notifiersFromEnv(), extraHolidays = [] }) {
  return async function handler(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const route = `${req.method} ${url.pathname}`;
    try {
      switch (route) {
        case 'GET /api/profile':
          return send(res, 200, store.getProfile());
        case 'PUT /api/profile':
          return send(res, 200, store.saveProfile(sanitizeProfile(await readJson(req))));

        case 'POST /api/sales/import':
        case 'POST /api/expenses/import': {
          const isSales = url.pathname.includes('sales');
          const { records, errors } = (isSales ? importSalesCsv : importExpensesCsv)(await readBody(req));
          if (errors.length && url.searchParams.get('strict') !== 'false') {
            return send(res, 422, { imported: 0, errors });
          }
          const replaceYear = url.searchParams.get('replaceYear');
          const imported = isSales
            ? store.addSales(records, { replaceYear })
            : store.addExpenses(records, { replaceYear });
          return send(res, 200, { imported, errors });
        }
        case 'DELETE /api/transactions':
          store.clearTransactions();
          return send(res, 200, { ok: true });
        case 'GET /api/sales':
          return send(res, 200, store.listSales());
        case 'GET /api/expenses':
          return send(res, 200, store.listExpenses());

        case 'GET /api/summary':
          return send(res, 200, buildSummary({
            profile: store.getProfile(), sales: store.listSales(), expenses: store.listExpenses(),
            year: parseYear(url), extraHolidays,
          }));

        case 'GET /api/deadlines/upcoming':
          return send(res, 200, upcomingDeadlines(todayIso(), store.getProfile(), { withinDays: 365, extraHolidays }));

        case 'GET /api/penalty': {
          const q = url.searchParams;
          let input;
          try {
            input = {
              basicTax: toCentavos(q.get('tax')),
              dueDate: parseDate(q.get('due')),
              paymentDate: q.get('paid') ? parseDate(q.get('paid')) : todayIso(),
              classification: q.get('class') ?? 'micro',
            };
          } catch (err) {
            throw httpError(400, err.message);
          }
          return send(res, 200, estimateLatePenalty(input));
        }

        case 'GET /api/books/cash-receipts.csv':
        case 'GET /api/books/cash-disbursements.csv': {
          const year = parseYear(url);
          const receipts = url.pathname.includes('receipts');
          const csv = receipts
            ? toCsv(cashReceiptsJournal(store.listSales(), year), CASH_RECEIPTS_COLUMNS)
            : toCsv(cashDisbursementsJournal(store.listExpenses(), year), CASH_DISBURSEMENTS_COLUMNS);
          const name = `${receipts ? 'cash-receipts' : 'cash-disbursements'}-journal-${year}.csv`;
          return send(res, 200, csv, 'text/csv; charset=utf-8', { 'Content-Disposition': `attachment; filename="${name}"` });
        }

        case 'POST /api/reminders/run': {
          const dryRun = url.searchParams.get('dryRun') !== 'false';
          const today = url.searchParams.get('today') ?? todayIso();
          return send(res, 200, await runReminders({ store, notifiers, today, extraHolidays, dryRun }));
        }
      }

      if (req.method === 'GET' && url.pathname.startsWith('/samples/')) {
        return serveStatic(res, SAMPLES_DIR, url.pathname.slice('/samples/'.length));
      }
      if (req.method === 'GET' && !url.pathname.startsWith('/api/')) {
        return serveStatic(res, PUBLIC_DIR, url.pathname === '/' ? 'index.html' : url.pathname);
      }
      return send(res, 404, { error: 'Not found' });
    } catch (err) {
      const status = err.status ?? 500;
      if (status === 500) console.error(err);
      return send(res, status, { error: status === 500 ? 'Internal error' : err.message });
    }
  };
}

export function parseHolidays(value = process.env.HOLIDAYS ?? '') {
  return value.split(',').map((s) => s.trim()).filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 3000);
  const store = openStore();
  createServer(createApp({ store, extraHolidays: parseHolidays() })).listen(port, () => {
    console.log(`BIR Autopilot running at http://localhost:${port}`);
  });
}
