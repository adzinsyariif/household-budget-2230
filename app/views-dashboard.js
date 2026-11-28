// HearthLedger dashboard: the month at a glance — summary cards with
// month-over-month deltas, daily pace, the spending donut, budget
// progress, upcoming bills and the latest entries with the add form.

import {
  billStatus, budgetRows, dailyPace, fmt, fmtSigned, goalProgress,
  monthLabel, monthTotals, monthTransactions, prevKey, trendSeries,
} from './store.js';
import { donutChart } from './charts.js';
import { budgetBar, esc, quickAddForm, txRow } from './ui.js';

function summaryCards(state, key) {
  const t = monthTotals(state, key);
  const prev = monthTotals(state, prevKey(key));
  const pace = dailyPace(state, key);
  const savedPct = t.income > 0 ? Math.round((t.remaining / t.income) * 100) : 0;
  const over = budgetRows(state, key).filter((r) => r.over && r.id !== 'savings').length;
  return `<section class="cards" aria-label="Month summary">
    <div class="card card-income"><p class="card-label">Income</p><p class="card-value">${fmt(t.income)}</p><p class="card-note">${fmtSigned(t.income - prev.income)} vs last month</p></div>
    <div class="card card-spend"><p class="card-label">Spending</p><p class="card-value">${fmt(t.spending)}</p><p class="card-note">${fmtSigned(t.spending - prev.spending)} vs last month</p></div>
    <div class="card card-left"><p class="card-label">Left to spend / save</p><p class="card-value">${fmt(t.remaining)}</p><p class="card-note">${savedPct}% of income kept</p></div>
    <div class="card card-pace"><p class="card-label">Daily pace</p><p class="card-value">${fmt(pace.perDay)}<span class="card-unit">/day</span></p><p class="card-note">ends near ${fmt(pace.projected)} · ${over} ${over === 1 ? 'category' : 'categories'} over target</p></div>
  </section>`;
}

function billsStrip(state, key) {
  const bills = billStatus(state, key);
  const due = bills.filter((b) => !b.paid);
  const paidCount = bills.length - due.length;
  const items = due.length
    ? due.slice(0, 3).map((b) => `<li><span class="bill-day">${b.dueDay}</span> ${esc(b.name)} <strong>${fmt(b.amount)}</strong></li>`).join('')
    : bills.map((b) => `<li><span class="bill-day bill-paid" aria-hidden="true">✓</span> ${esc(b.name)} <strong>${fmt(b.paidAmount)}</strong></li>`).join('');
  return `<section class="panel" aria-labelledby="h-bills-strip">
    <h2 id="h-bills-strip">Bills this month <a class="panel-link" href="#/goals">All bills &amp; goals</a></h2>
    <p class="panel-intro">${paidCount} of ${bills.length} paid${due.length ? ' — still to come:' : ' — all covered:'}</p>
    <ul class="bill-strip">${items}</ul>
  </section>`;
}

function goalsStrip(state, key) {
  const goals = state.goals.map((g) => goalProgress(state, g, key));
  const items = goals.map((g) => `<li class="goal-strip-row">
      <span class="goal-strip-name">${esc(g.name)}</span>
      <span class="bar" role="progressbar" aria-label="${esc(g.name)} progress" aria-valuenow="${g.pct}" aria-valuemin="0" aria-valuemax="100"><span class="bar-fill bar-savings" style="width:${g.pct}%"></span></span>
      <span class="goal-strip-figs">${fmt(g.saved)} of ${fmt(g.target)} · ${g.pct}%</span>
    </li>`).join('');
  return `<section class="panel" aria-labelledby="h-goals-strip">
    <h2 id="h-goals-strip">Savings goals <a class="panel-link" href="#/goals">Manage goals</a></h2>
    <ul class="goal-strip">${items}</ul>
  </section>`;
}

export function dashboardView(state) {
  const key = state.month;
  const totals = monthTotals(state, key);
  const rows = budgetRows(state, key);
  // The donut covers every expense category (Savings included, as money
  // set aside) so its segments always add up to the month's spending.
  const recent = monthTransactions(state, key).slice(0, 5);
  const legend = rows.filter((r) => r.spent > 0).map((r) => {
    const pct = totals.spending > 0 ? Math.round((r.spent / totals.spending) * 100) : 0;
    return `<li><span class="dot" style="background:${r.color}" aria-hidden="true"></span>${esc(r.name)} <strong>${fmt(r.spent)}</strong> <span class="muted">${pct}%</span></li>`;
  }).join('');
  const trend = trendSeries(state, key, 6);
  const keptNote = trend.map((s) => `${s.label} ${fmt(s.kept)}`).join(' · ');
  return `${summaryCards(state, key)}
  <div class="grid-2">
    <section class="panel" aria-labelledby="h-spend">
      <h2 id="h-spend">Where the money went</h2>
      <div class="donut-wrap">${donutChart(rows, fmt(totals.spending), 'spent in ' + monthLabel(key).slice(0, 3))}<ul class="legend">${legend}</ul></div>
      <p class="muted small trend-note">Kept each month: ${esc(keptNote)}. <a href="#/insights">See the trend</a></p>
    </section>
    <section class="panel" aria-labelledby="h-budgets">
      <h2 id="h-budgets">Budget progress <a class="panel-link" href="#/budgets">Edit targets</a></h2>
      <ul class="budget-list">${rows.map(budgetBar).join('')}</ul>
    </section>
  </div>
  <div class="grid-2">
    ${billsStrip(state, key)}
    ${goalsStrip(state, key)}
  </div>
  <section class="panel" aria-labelledby="h-recent">
    <h2 id="h-recent">Latest entries <a class="panel-link" href="#/transactions">All transactions</a></h2>
    <ul class="tx-list">${recent.map((t) => txRow(t, false)).join('') || '<li class="empty">No entries this month yet — add your first one below.</li>'}</ul>
    ${quickAddForm(state)}
  </section>`;
}
