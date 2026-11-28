# HearthLedger — Household Budget

[![make.fun](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/c/best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/adzinsyariif/household-budget-2230/rank.svg)](https://make.fun/c/best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/adzinsyariif/household-budget-2230/reward.svg)](https://make.fun/c/best-household-budget-site-20261126-1457)

HearthLedger is a household budget site that runs entirely offline in the browser — no account, no network, no build step. It keeps a family's money in one calm ledger: income in, spending out, a monthly target for every category, savings goals to aim at, the bills that land every month, and a clear view of what is left.

## Features

- **Dashboard** — income, spending, what's left and daily pace at a glance, with month-over-month deltas; a spending-by-category donut, per-category budget progress (over-target turns red, savings is a goal to reach), a bills strip, a goals strip, the latest entries and the add form.
- **Budgets page** — editable monthly target for each of the ten categories (Housing, Groceries, Utilities, Transport, Health, Kids & school, Dining out, Leisure, Other, Savings), an allocation line showing how much income is still unassigned, and a 50/30/20 lens that splits the targets into needs, wants and savings.
- **Transactions page** — the full month's ledger with search, type/category filters, a running balance on every row, edit and delete, and one-click CSV export.
- **Goals & bills page** — savings goals (emergency fund, family holiday, new boiler) with progress rings, monthly contributions and projected finish dates computed from the ledger's own transfers; below, the recurring-bills table with due days and paid/due status for the month. Add a goal, contribute with one click, or remove one.
- **Insights page** — a six-month income-vs-spending trend with a "kept" line, a daily-spending sparkline with the biggest day marked, the biggest category movers versus last month, year-to-date totals, and plain-language takeaways computed from the ledger.
- **Add entries anywhere** — the add/edit form sits on the dashboard and transactions pages; new entries land in their month automatically.
- **Month switcher** — step through months with the header arrows or jump via the dropdown.
- **Sample household** — first load seeds six months (June–November 2026) of a realistic two-salary family ledger, so every chart, goal and total is alive immediately; "Restore sample data" brings it back any time.
- **Private by design** — everything persists in `localStorage` on the device; the site makes no network requests and loads no external fonts, scripts or images.
- **Works on phone and desktop** — side navigation on desktop becomes a bottom bar on phones; accessible labels, focus rings and reduced-motion support throughout.

## Running it

Serve `app/` with any static file server, e.g. `node serve.ts` then open http://localhost:8080. To build the make.fun hand-in bundle: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.

## Build log

- v1: dashboard, budgets, transactions and insights pages with seeded ledger and SVG charts.
- v2: views split per page; savings goals with progress rings and projected finish dates; recurring bills with paid/due status; 50/30/20 allocation lens on the budgets page; daily-pace card; category movers and year-to-date on insights; running balance on transactions; donut segments now tile the ring exactly.

## License

MIT — see LICENSE.
