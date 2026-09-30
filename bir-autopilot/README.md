# BIR Autopilot

Tax compliance autopilot for Philippine micro and small businesses. Import a sales log and it produces:

- **Filing worksheets** for BIR Form **2551Q** (quarterly percentage tax), **1701Q** (quarterly income tax) and the annual **1701 / 1701A**, with the figures to key into eBIRForms, eFPS or ORUS.
- **A filing calendar**: deadlines move past weekends and holidays automatically, and the calendar only shows forms your tax setup actually requires.
- **SMS reminders** through [Semaphore](https://semaphore.co) and **Messenger reminders** through the Send API. Each reminder quotes the estimated amount due.
- **Books of accounts**: a Cash Receipts Journal and a Cash Disbursements Journal, exported as CSV.
- **An EOPT invoice audit**: flags gaps, duplicates and sales with no invoice number.
- **Warnings**: an alert when you approach the ₱3M VAT threshold, your EOPT taxpayer classification, and a late-penalty estimator using the reduced EOPT rates for micro and small taxpayers.

There are no dependencies. It runs on Node ≥ 22.13 and uses the built-in `node:sqlite`.

```bash
npm start            # http://localhost:3000. Click "Load sample data" to see it working
npm test             # 23 tests covering tax math, deadlines, CSV import, reminders and the API
npm run deadlines    # print this year's filing calendar
npm run remind       # send any reminders due today (run daily from cron)
```

Example cron entry, for 8:00 AM Manila time:

```cron
0 8 * * * cd /srv/bir-autopilot && DB_PATH=/srv/data/bir.db SEMAPHORE_API_KEY=... npm run remind
```

## Configuration

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port (default 3000) |
| `DB_PATH` | SQLite file (default `data/bir-autopilot.db`) |
| `HOLIDAYS` | Comma-separated proclaimed holidays, e.g. `2026-03-20,2026-05-27` for Eid'l Fitr, Eid'l Adha and special non-working days. Fixed-date holidays and Holy Week are computed automatically. |
| `SEMAPHORE_API_KEY`, `SEMAPHORE_SENDER_NAME` | SMS reminders |
| `FB_PAGE_TOKEN`, `FB_GRAPH_VERSION`, `MESSENGER_TAG` | Messenger reminders. Meta only allows free-form messages within 24 hours of the user's last message, so set an approved `MESSENGER_TAG` (or use Meta's utility-message products) before you rely on this for reminders. |

If no notifier is configured, reminders are printed to the console.

## CSV format

**Sales** needs `date`, `invoice_no` and `amount`. Optional columns are `customer`, `description` and `withheld` (the tax a customer withheld, from their Form 2307). **Expenses** needs `date` and `amount`. Optional columns are `supplier`, `description` and `category`. Common header aliases are accepted (`total`, `si_no`, `petsa`, `cwt`, ...), and dates can be `YYYY-MM-DD` or `MM/DD/YYYY`. If any row fails, the whole file is rejected with line numbers, so a partial import never silently skews the totals.

## Tax rules implemented

| Rule | Source |
|---|---|
| 2551Q: 3% of gross quarterly sales (1% from Jul 2020 to Jun 2023), ATC PT010, due the 25th day after quarter end | NIRC Sec. 116 and 128, CREATE Act |
| 2551Q not due under the 8% option or for VAT-registered taxpayers | NIRC Sec. 24(A)(2)(b) |
| 1701Q: cumulative computation, less prior-quarter payments and 2307 credits; due May 15, Aug 15 and Nov 15; no Q4 return | NIRC Sec. 74 |
| 8% option: first ₱250k exempt, except for mixed-income earners | NIRC Sec. 24(A)(2)(b) |
| Graduated rates (2023 schedule), 40% OSD or itemized deductions | NIRC Sec. 24(A)(2)(a) and 34(L) |
| Annual 1701A (8% or OSD, purely self-employed) or 1701 (itemized or mixed income), due April 15 | NIRC Sec. 51 |
| Micro/small/medium/large classification; 10% surcharge and 6% interest for micro and small | EOPT Act (RA 11976), RR 8-2024 |
| Invoices replace official receipts; 0605 Annual Registration Fee abolished | EOPT Act |

**Not supported yet:** VAT filers (2550Q), corporations (1702Q), withholding agent returns (1601EQ, 1604E), compromise penalties, and income other than sales.

## Roadmap to a paid product

1. Accounts and multi-business support, plus billing (for example ₱299/month, against a ₱1,500–5,000/month bookkeeper).
2. Integrations to pull sales from POS systems, Shopee, Lazada, GCash and Maya.
3. Filed/paid status per return, with uploads of the eBIRForms confirmation and payment receipt.
4. VAT (2550Q) and withholding (1601EQ / 2307 generation) for businesses above ₱3M.
5. A CPA review marketplace for businesses that want a human to sign off.

> **Disclaimer:** BIR Autopilot prepares worksheets for a person to review. It is not tax advice and is not affiliated with the Bureau of Internal Revenue. Tax rules change, so verify the figures against current BIR issuances before each filing season.
