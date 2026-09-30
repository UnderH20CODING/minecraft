const $ = (sel, root = document) => root.querySelector(sel);

const peso = (centavos) => (centavos < 0 ? '-' : '') + '₱' + (Math.abs(centavos) / 100)
  .toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const longDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-PH', {
  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
});
const manilaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
const daysUntil = (iso) => Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${manilaToday()}T00:00:00Z`)) / 86_400_000);

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  node.append(...children.flat().filter((c) => c !== null && c !== undefined && c !== false));
  return node;
}

async function api(path, options = {}) {
  const res = await fetch(path, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error ?? `Request failed (${res.status})`), { body });
  return body;
}

let summary = null;
const yearSelect = $('#year');

function initYears() {
  const current = Number(manilaToday().slice(0, 4));
  for (let y = current; y >= 2023; y--) yearSelect.append(el('option', { value: y }, String(y)));
  yearSelect.addEventListener('change', refresh);
}

function dueBadge(deadline, { compact = false } = {}) {
  if (!deadline) return null;
  const days = daysUntil(deadline.due);
  const cls = days < 0 ? 'past' : days <= 7 ? 'soon' : 'later';
  const text = compact
    ? (days < 0 ? 'past' : days === 0 ? 'today' : `in ${days}d`)
    : days < 0 ? `was due ${longDate(deadline.due)}` : days === 0 ? 'due today' : `due ${longDate(deadline.due)} (${days}d)`;
  return el('span', { class: `due ${cls}`, title: deadline.moved ? `Moved from ${deadline.statutory} (weekend/holiday)` : '' }, text);
}

function openWorksheet(form) {
  const dialog = $('#worksheet-template').content.firstElementChild.cloneNode(true);
  const profile = summary.profile;
  $('.ws-title', dialog).textContent = `BIR Form ${form.form}: ${form.title}`;
  $('.ws-meta', dialog).textContent = [
    profile.businessName, profile.tin && `TIN ${profile.tin}`, profile.rdo && `RDO ${profile.rdo}`,
    form.quarter ? `Q${form.quarter} ${form.year}` : String(form.year),
    form.period && `Period ${form.period.start} to ${form.period.end}`,
    form.method,
  ].filter(Boolean).join(' · ');
  const rows = $('.ws-rows', dialog);
  for (const f of form.fields) {
    rows.append(el('tr', {}, el('td', {}, f.label, f.note ? el('div', { class: 'small muted' }, f.note) : null), el('td', { class: 'num' }, peso(f.amount))));
  }
  $('.ws-note', dialog).textContent = 'Transfer these amounts into the matching fields of the form in eBIRForms, eFPS or ORUS. Review before submitting.';
  $('.ws-print', dialog).addEventListener('click', () => window.print());
  $('.ws-close', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();
}

function formRow(form) {
  if (!form.required) {
    return el('li', { class: 'form na' }, el('div', {}, el('strong', {}, form.form), el('span', { class: 'small muted' }, form.reason)));
  }
  const amount = form.form === '2551Q' ? form.taxDue : form.payable;
  return el('li', { class: 'form' },
    el('div', {},
      el('strong', {}, form.form),
      el('span', { class: 'amount' }, peso(amount)),
      dueBadge(form.deadline)),
    el('button', { type: 'button', class: 'link', onclick: () => openWorksheet(form) }, 'Worksheet'));
}

function renderQuarters() {
  const container = $('#quarters');
  container.replaceChildren(...summary.quarters.map((q) => el('article', { class: 'card quarter' },
    el('h3', {}, `Q${q.quarter}`),
    el('dl', {},
      el('dt', {}, 'Gross sales'), el('dd', {}, peso(q.grossSales)),
      el('dt', {}, 'Expenses'), el('dd', {}, peso(q.expenses)),
      el('dt', {}, 'Invoices'), el('dd', {}, String(q.salesCount))),
    el('ul', { class: 'forms' }, q.forms.map(formRow)))));

  const a = summary.annual;
  const annualForm = { ...a, fields: [
    { label: 'Gross sales/receipts for the year', amount: a.grossSales },
    ...(a.exemption ? [{ label: 'Less: amount exempt under the 8% option', amount: a.exemption }] : []),
    ...(a.deductions ? [{ label: 'Less: deductions', amount: a.deductions }] : []),
    { label: 'Taxable base', amount: a.taxBase },
    { label: `Income tax due (${a.method})`, amount: a.taxDue },
    { label: 'Less: paid in 1701Q (Q1 to Q3)', amount: a.paidQuarterly },
    { label: 'Less: creditable tax withheld (Form 2307)', amount: a.withheld },
    { label: a.balance >= 0 ? 'Balance payable' : 'Overpayment (refund or carry over)', amount: Math.abs(a.balance) },
  ] };
  $('#annual').replaceChildren(
    el('div', {},
      el('h3', {}, `Annual return ${a.form} (estimate)`),
      el('p', { class: 'muted small' }, 'Based on everything recorded for the year so far.')),
    el('div', { class: 'annual-figures' },
      el('span', { class: 'amount' }, peso(Math.max(0, a.balance))),
      dueBadge(a.deadline),
      el('button', { type: 'button', class: 'link', onclick: () => openWorksheet(annualForm) }, 'Worksheet')));

  $('#totals').textContent = `${peso(summary.annualGross)} gross sales · ${summary.classification.label} taxpayer (EOPT)`;
}

function renderWarnings() {
  $('#warnings').replaceChildren(...summary.warnings.map((w) => el('li', { class: w.level }, w.message)));
}

function renderCalendar() {
  $('#calendar').replaceChildren(...summary.deadlines.map((d) => el('li', {},
    el('span', { class: 'date' }, longDate(d.due)),
    el('span', {}, el('strong', {}, d.form), ` ${d.title}`, d.moved ? el('span', { class: 'small muted' }, ` (moved from ${d.statutory})`) : null),
    dueBadge(d, { compact: true }))));
}

async function renderNextDeadline() {
  const upcoming = await api('/api/deadlines/upcoming');
  const hero = $('#next-deadline');
  const next = upcoming[0];
  if (!next) { hero.hidden = true; return; }
  let amount = null;
  const yearSummary = next.taxYear === summary.year ? summary : await api(`/api/summary?year=${next.taxYear}`);
  if (next.quarter) {
    const form = yearSummary.quarters[next.quarter - 1].forms.find((f) => f.form === next.form);
    if (form?.required) amount = form.form === '2551Q' ? form.taxDue : form.payable;
  } else amount = Math.max(0, yearSummary.annual.balance);
  const days = daysUntil(next.due);
  hero.hidden = false;
  hero.replaceChildren(
    el('div', {},
      el('p', { class: 'eyebrow' }, 'Next deadline'),
      el('h2', {}, `${next.form}: ${next.title}`),
      el('p', {}, `${longDate(next.due)}${next.moved ? ` (moved from ${next.statutory})` : ''}`)),
    el('div', { class: 'hero-figures' },
      el('span', { class: 'countdown' }, days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'}`),
      amount !== null ? el('span', { class: 'muted' }, `Est. ${peso(amount)}`) : null));
}

function fillProfile(profile) {
  const form = $('#profile-form');
  for (const [key, value] of Object.entries(profile)) {
    const input = form.elements[key];
    if (!input) continue;
    if (input.type === 'checkbox') input.checked = Boolean(value);
    else input.value = Array.isArray(value) ? value.join(', ') : value;
  }
  $('#business-line').textContent = profile.businessName
    ? [profile.businessName, profile.tin && `TIN ${profile.tin}`].filter(Boolean).join(' · ')
    : 'Set up your business profile to begin';
  form.elements.deductionMethod.disabled = profile.incomeTaxOption === '8%';
}

async function refresh() {
  const year = yearSelect.value;
  summary = await api(`/api/summary?year=${year}`);
  fillProfile(summary.profile);
  renderWarnings();
  renderQuarters();
  renderCalendar();
  $('#dl-receipts').href = `/api/books/cash-receipts.csv?year=${year}`;
  $('#dl-disbursements').href = `/api/books/cash-disbursements.csv?year=${year}`;
  await renderNextDeadline();
}

function wireProfile() {
  const form = $('#profile-form');
  form.elements.incomeTaxOption.addEventListener('change', (e) => {
    form.elements.deductionMethod.disabled = e.target.value === '8%';
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    data.mixedIncome = form.elements.mixedIncome.checked;
    data.vatRegistered = form.elements.vatRegistered.checked;
    data.deductionMethod = form.elements.deductionMethod.value;
    data.reminderDays = String(data.reminderDays || '').split(/[,\s]+/).filter(Boolean).map(Number);
    try {
      await api('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      await refresh();
    } catch (err) {
      alert(err.message);
    }
  });
}

async function importFile(kind, text, replace) {
  const params = new URLSearchParams();
  if (replace) params.set('replaceYear', yearSelect.value);
  return api(`/api/${kind}/import?${params}`, { method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: text });
}

function showImportResult(lines, errors = []) {
  const box = $('#import-result');
  box.replaceChildren(
    ...lines.map((l) => el('p', {}, l)),
    errors.length ? el('ul', { class: 'errors' }, errors.slice(0, 10).map((e) => el('li', {}, `Line ${e.line}: ${e.message}`))) : null);
}

function wireImport() {
  const form = $('#import-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lines = [];
    try {
      for (const kind of ['sales', 'expenses']) {
        const file = form.elements[kind].files[0];
        if (!file) continue;
        const result = await importFile(kind, await file.text(), form.elements.replace.checked);
        lines.push(`Imported ${result.imported} ${kind}.`);
      }
      showImportResult(lines.length ? lines : ['Choose a CSV file first.']);
      form.reset();
      form.elements.replace.checked = true;
      await refresh();
    } catch (err) {
      showImportResult([...lines, `Import failed: ${err.message}. Nothing from this file was saved.`], err.body?.errors);
    }
  });

  $('#load-sample').addEventListener('click', async () => {
    const [sales, expenses] = await Promise.all([
      fetch('/samples/sales-sample.csv').then((r) => r.text()),
      fetch('/samples/expenses-sample.csv').then((r) => r.text()),
    ]);
    await api('/api/transactions', { method: 'DELETE' });
    const s = await importFile('sales', sales, false);
    const x = await importFile('expenses', expenses, false);
    yearSelect.value = '2026';
    showImportResult([`Loaded sample data: ${s.imported} sales and ${x.imported} expenses for 2026.`]);
    await refresh();
  });
}

function wireReminders() {
  const form = $('#reminder-form');
  form.elements.today.value = manilaToday();
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const results = await api(`/api/reminders/run?dryRun=true&today=${form.elements.today.value}`, { method: 'POST' });
    $('#reminder-result').replaceChildren(...(results.length
      ? results.map((r) => el('li', {}, el('span', { class: 'channel' }, r.channel), r.text ?? r.status))
      : [el('li', { class: 'muted' }, 'Nothing would be sent that day. Reminders go out on the lead days set in your profile.')]));
  });
}

function wirePenalty() {
  const form = $('#penalty-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const params = new URLSearchParams(new FormData(form));
    params.set('class', summary?.classification.id ?? 'micro');
    try {
      const r = await api(`/api/penalty?${params}`);
      $('#penalty-result').textContent = r.daysLate === 0
        ? 'Not late: no surcharge or interest.'
        : `${r.daysLate} days late: surcharge ${peso(r.surcharge)} (${r.rates.surcharge * 100}%) + interest ${peso(r.interest)} (${r.rates.annualInterest * 100}%/yr) = ${peso(r.total)} total, before any compromise penalty.`;
    } catch (err) {
      $('#penalty-result').textContent = err.message;
    }
  });
}

initYears();
wireProfile();
wireImport();
wireReminders();
wirePenalty();
refresh().catch((err) => showImportResult([`Could not load data: ${err.message}`]));
