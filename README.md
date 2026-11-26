# HearthLedger — Household Budget

[![make.fun](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/c/best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/adzinsyariif/household-budget-2230/rank.svg)](https://make.fun/c/best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/adzinsyariif/household-budget-2230/reward.svg)](https://make.fun/c/best-household-budget-site-20261126-1457)

HearthLedger is a household budget site that runs entirely offline in the browser — no account, no network, no build step. It keeps a family's money in one calm ledger: income in, spending out, a monthly target for every category, and a clear view of what is left.

## Features

- **Dashboard** — income, spending, what's left and budget used at a glance, with month-over-month deltas; a spending-by-category donut and per-category budget progress bars (over-target turns red, savings is a goal to reach).
- **Budgets page** — editable monthly target for each of the ten categories (Housing, Groceries, Utilities, Transport, Dining out, Health, Kids & school, Leisure, Savings, Other), with an allocation line that shows how much income is still unassigned.
- **Transactions page** — the full month's ledger with search, type/category filters, edit and delete on every row, and one-click CSV export.
- **Insights page** — a six-month income-vs-spending trend chart, a daily-spending sparkline for the month, and plain-language takeaways computed from the ledger (biggest cost, over-target categories, daily average, savings progress).
- **Add entries anywhere** — the add/edit form sits on the dashboard and transactions pages; new entries land in their month automatically.
- **Month switcher** — step through months with the header arrows or jump via the dropdown.
- **Sample household** — first load seeds six months (June–November 2026) of a realistic two-salary family ledger, so every chart and total is alive immediately; "Restore sample data" brings it back any time.
- **Private by design** — everything persists in `localStorage` on the device; the site makes no network requests and loads no external fonts, scripts or images.
- **Works on phone and desktop** — side navigation on desktop becomes a bottom bar on phones; accessible labels, focus rings and reduced-motion support throughout.

## Running it

Serve `app/` with any static file server, e.g. `node serve.ts` then open http://localhost:8080. To build the make.fun hand-in bundle: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.

## Build log

- v1: dashboard, budgets, transactions and insights pages with seeded ledger and SVG charts.
- v2 (after screenshot review): fixed the donut so segments sum to the month total (Savings now included), raised default targets so the allocation line reads sensibly, stopped the phone month label wrapping.
- v3: pluralised the over-target count, tightened budget-row spacing so the full list fits the cover view, re-shot all four screenshots.

## License

MIT — see LICENSE.
