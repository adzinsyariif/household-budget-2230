// HearthLedger insights: the six-month trend with the kept-line, the
// daily-spending shape of the month, category movers versus last month,
// year-to-date totals and plain-language takeaways from the ledger.

import {
  budgetRows, categoryMovers, dailyPace, fmt, fmtSigned, monthLabel,
  monthTotals, monthTransactions, prevKey, trendSeries, yearToDate,
} from './store.js';
import { dailySpark, trendChart } from './charts.js';
import { esc } from './ui.js';

function moversPanel(state, key) {
  const movers = categoryMovers(state, key).filter((m) => m.delta !== 0).slice(0, 5);
  const rows = movers.map((m) => `<li class="mover-row">
      <span class="budget-icon" style="background:${m.color}" aria-hidden="true">${esc(m.icon)}</span>
      <span class="mover-name">${esc(m.name)}</span>
      <span class="mover-figs">${fmt(m.before)} → ${fmt(m.now)}</span>
      <span class="mover-delta ${m.delta > 0 ? 'delta-up' : 'delta-down'}">${fmtSigned(m.delta)}</span>
    </li>`).join('');
  return `<section class="panel" aria-labelledby="h-movers">
    <h2 id="h-movers">Biggest movers vs ${esc(monthLabel(prevKey(key)))}</h2>
    <ul class="mover-list">${rows || '<li class="empty">No change versus last month.</li>'}</ul>
  </section>`;
}

export function insightsView(state) {
  const key = state.month;
  const series = trendSeries(state, key, 6);
  const rows = budgetRows(state, key).filter((r) => r.id !== 'savings');
  const biggest = [...rows].sort((a, b) => b.spent - a.spent)[0];
  const over = rows.filter((r) => r.over);
  const totals = monthTotals(state, key);
  const prev = monthTotals(state, prevKey(key));
  const savingsRow = budgetRows(state, key).find((r) => r.id === 'savings');
  const pace = dailyPace(state, key);
  const ytd = yearToDate(state, key);
  const tips = [];
  if (over.length) tips.push(`<li><strong>${over.map((r) => esc(r.name)).join(', ')}</strong> ${over.length === 1 ? 'is' : 'are'} over target — trim there first before touching essentials.</li>`);
  if (biggest && biggest.spent > 0) tips.push(`<li><strong>${esc(biggest.name)}</strong> is your biggest cost at ${fmt(biggest.spent)} (${Math.round((biggest.spent / Math.max(1, totals.spending)) * 100)}% of spending).</li>`);
  tips.push(`<li>Daily pace is <strong>${fmt(pace.perDay)}</strong> across the first ${pace.lastDay} days — at that pace the month ends near ${fmt(pace.projected)}.</li>`);
  if (savingsRow) tips.push(`<li>Savings: <strong>${fmt(savingsRow.spent)}</strong> of the ${fmt(savingsRow.target)} goal (${savingsRow.pct}%). ${savingsRow.spent >= savingsRow.target ? 'Goal reached — consider raising it next month.' : 'Another ' + fmt(savingsRow.left) + ' reaches the goal.'}</li>`);
  tips.push(`<li>Spending ${totals.spending <= prev.spending ? 'fell' : 'rose'} ${fmt(Math.abs(totals.spending - prev.spending))} versus last month (${fmt(prev.spending)} → ${fmt(totals.spending)}).</li>`);
  tips.push(`<li>Year to date (${ytd.months} months): earned ${fmt(ytd.income)}, spent ${fmt(ytd.spending)}, kept <strong>${fmt(ytd.kept)}</strong>.</li>`);
  return `<section class="panel" aria-labelledby="h-trend">
    <h2 id="h-trend">Six-month trend</h2>
    <p class="panel-intro"><span class="dot" style="background:#5B8C5A" aria-hidden="true"></span> Income &nbsp; <span class="dot" style="background:#C4553B" aria-hidden="true"></span> Spending &nbsp; <span class="dot" style="background:#12403F" aria-hidden="true"></span> Kept (line) — steady income, spending that stays under it.</p>
    ${trendChart(series)}
  </section>
  <div class="grid-2">
    <section class="panel" aria-labelledby="h-daily">
      <h2 id="h-daily">Spending through ${esc(monthLabel(key))}</h2>
      ${dailySpark(monthTransactions(state, key), key)}
      <p class="muted small">Rent lands on the 2nd, so the month starts high and settles into weekly shops. The red dot is the biggest day.</p>
    </section>
    ${moversPanel(state, key)}
  </div>
  <section class="panel" aria-labelledby="h-tips">
    <h2 id="h-tips">What the numbers say</h2>
    <ul class="tips">${tips.join('')}</ul>
  </section>`;
}
