import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const DEFAULT_PROFILE = {
  businessName: '',
  tin: '',
  rdo: '',
  incomeTaxOption: 'graduated', // 'graduated' | '8%'
  deductionMethod: 'osd', // 'osd' | 'itemized' (graduated only)
  mixedIncome: false, // also earns compensation income (no ₱250k exemption under 8%)
  vatRegistered: false,
  phone: '', // for SMS reminders, e.g. 09171234567
  messengerPsid: '', // Page-scoped ID of the owner on your Facebook Page
  reminderDays: [7, 3, 1, 0],
};

export function openStore(path = process.env.DB_PATH ?? 'data/bir-autopilot.db') {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY, date TEXT NOT NULL, invoice_no TEXT, customer TEXT,
      description TEXT, amount INTEGER NOT NULL, withheld INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY, date TEXT NOT NULL, supplier TEXT, description TEXT,
      category TEXT, amount INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reminders_sent (
      deadline_id TEXT NOT NULL, lead_days INTEGER NOT NULL, channel TEXT NOT NULL,
      sent_at TEXT NOT NULL, PRIMARY KEY (deadline_id, lead_days, channel)
    );
    CREATE INDEX IF NOT EXISTS sales_date ON sales(date);
    CREATE INDEX IF NOT EXISTS expenses_date ON expenses(date);
  `);

  const insertSale = db.prepare(
    'INSERT INTO sales (date, invoice_no, customer, description, amount, withheld) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const insertExpense = db.prepare(
    'INSERT INTO expenses (date, supplier, description, category, amount) VALUES (?, ?, ?, ?, ?)',
  );

  function transaction(fn) {
    db.exec('BEGIN');
    try {
      const result = fn();
      db.exec('COMMIT');
      return result;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }

  return {
    getProfile() {
      const row = db.prepare("SELECT value FROM settings WHERE key = 'profile'").get();
      return { ...DEFAULT_PROFILE, ...(row ? JSON.parse(row.value) : {}) };
    },
    saveProfile(profile) {
      const merged = { ...this.getProfile(), ...profile };
      db.prepare("INSERT INTO settings (key, value) VALUES ('profile', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
        .run(JSON.stringify(merged));
      return merged;
    },
    addSales(records, { replaceYear } = {}) {
      return transaction(() => {
        if (replaceYear) db.prepare("DELETE FROM sales WHERE substr(date, 1, 4) = ?").run(String(replaceYear));
        for (const r of records) insertSale.run(r.date, r.invoiceNo, r.customer, r.description, r.amount, r.withheld);
        return records.length;
      });
    },
    addExpenses(records, { replaceYear } = {}) {
      return transaction(() => {
        if (replaceYear) db.prepare("DELETE FROM expenses WHERE substr(date, 1, 4) = ?").run(String(replaceYear));
        for (const r of records) insertExpense.run(r.date, r.supplier, r.description, r.category, r.amount);
        return records.length;
      });
    },
    listSales() {
      return db.prepare('SELECT id, date, invoice_no AS invoiceNo, customer, description, amount, withheld FROM sales ORDER BY date, id').all()
        .map((r) => ({ ...r }));
    },
    listExpenses() {
      return db.prepare('SELECT id, date, supplier, description, category, amount FROM expenses ORDER BY date, id').all()
        .map((r) => ({ ...r }));
    },
    clearTransactions() {
      db.exec('DELETE FROM sales; DELETE FROM expenses;');
    },
    reminderSent(deadlineId, leadDays, channel) {
      return !!db.prepare('SELECT 1 FROM reminders_sent WHERE deadline_id = ? AND lead_days = ? AND channel = ?')
        .get(deadlineId, leadDays, channel);
    },
    markReminderSent(deadlineId, leadDays, channel) {
      db.prepare('INSERT OR IGNORE INTO reminders_sent (deadline_id, lead_days, channel, sent_at) VALUES (?, ?, ?, ?)')
        .run(deadlineId, leadDays, channel, new Date().toISOString());
    },
    close() {
      db.close();
    },
  };
}
