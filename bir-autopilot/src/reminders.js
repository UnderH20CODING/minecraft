import { daysBetween, formatLong, todayIso } from './dates.js';
import { upcomingDeadlines } from './deadlines.js';
import { formatPeso } from './money.js';
import { amountForDeadline, buildSummary } from './report.js';

export function reminderText({ deadline, daysLeft, amount, businessName }) {
  const when = daysLeft === 0 ? 'TODAY' : daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`;
  const who = businessName ? `${businessName}: ` : '';
  const due = amount === null ? '' : amount > 0 ? ` Est. tax due: ${formatPeso(amount)}.` : ' Est. tax due: ₱0.00 (still file the return).';
  return `${who}BIR ${deadline.form} (${deadline.title}) is due ${when}, ${formatLong(deadline.due)}.${due} File & pay via eBIRForms/ePay.`;
}

// Sends one message per (deadline, lead day, channel). Safe to run many times a
// day from cron because sent reminders are recorded.
export async function runReminders({ store, notifiers, today = todayIso(), extraHolidays = [], dryRun = false }) {
  const profile = store.getProfile();
  const leadDays = profile.reminderDays ?? [7, 3, 1, 0];
  const maxLead = Math.max(...leadDays);
  const upcoming = upcomingDeadlines(today, profile, { withinDays: maxLead, extraHolidays });
  const sales = store.listSales();
  const expenses = store.listExpenses();
  const summaries = new Map();
  const results = [];

  for (const deadline of upcoming) {
    const daysLeft = daysBetween(today, deadline.due);
    if (!leadDays.includes(daysLeft)) continue;
    if (!summaries.has(deadline.taxYear)) {
      summaries.set(deadline.taxYear, buildSummary({ profile, sales, expenses, year: deadline.taxYear, extraHolidays }));
    }
    const amount = amountForDeadline(summaries.get(deadline.taxYear), deadline);
    const text = reminderText({ deadline, daysLeft, amount, businessName: profile.businessName });

    for (const notifier of notifiers) {
      if (!notifier.canSend(profile)) continue;
      if (store.reminderSent(deadline.id, daysLeft, notifier.channel)) {
        results.push({ deadline: deadline.id, channel: notifier.channel, status: 'already-sent' });
        continue;
      }
      if (dryRun) {
        results.push({ deadline: deadline.id, channel: notifier.channel, status: 'dry-run', text });
        continue;
      }
      try {
        await notifier.send(profile, text);
        store.markReminderSent(deadline.id, daysLeft, notifier.channel);
        results.push({ deadline: deadline.id, channel: notifier.channel, status: 'sent', text });
      } catch (err) {
        results.push({ deadline: deadline.id, channel: notifier.channel, status: 'failed', error: err.message });
      }
    }
  }
  return results;
}
