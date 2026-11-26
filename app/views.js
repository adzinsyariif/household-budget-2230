// HearthLedger views: the four pages (Dashboard, Budgets, Transactions,
// Insights) as render functions. Each returns HTML for the main region;
// main.js wires the controls after every render.

import { CATEGORIES, INCOME_SOURCES } from './data.js';
import {
  budgetRows, categoryById, fmt, fmtSigned, monthLabel, monthTotals,
  monthTransactions, trendSeries,
} from './store.js';
import { dailySpark, donutChart, trendChart } from './charts.js';

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function summaryCards(state, key) {
  const t = monthTotals(state, key);
  const prev = monthTotals(state, prevKey(key));
  const spendDelta = t.spending - prev.spending;
  const savedPct = t.income > 0 ? Math.round((t.remaining / t.income) * 100) : 0;
  return `<section class="cards" aria-label="Month summary">
    <div class="card card-income"><p class="card-label">Income</p><p class="card-value">${fmt(t.income)}</p><p class="card-note">${fmtSigned(t.income - prev.income)} vs last month</p></div>
    <div class="card card-spend"><p class="card-label">Spending</p><p class="card-value">${fmt(t.spending)}</p><p class="card-note">${fmtSigned(spendDelta)} vs last month</p></div>
    <div class="card card-left"><p class="card-label">Left to spend / save</p><p class="card-value">${fmt(t.remaining)}</p><p class="card-note">${savedPct}% of income kept</p></div>
    <div class="card card-budget"><p class="card-label">Budget used</p><p class="card-value">${budgetUsedPct(state, key)}%</p><p class="card-note">${overCount(state, key)} ${overCount(state, key) === 1 ? 'category' : 'categories'} over target</p></div>
  </section>`;
}

function prevKey(key) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function budgetUsedPct(state, key) {
  const rows = budgetRows(state, key).filter((r) => r.id !== 'savings');
  const target = rows.reduce((a, r) => a + r.target, 0);
  const spent = rows.reduce((a, r) => a + r.spent, 0);
  return target > 0 ? Math.round((spent / target) * 100) : 0;
}

function overCount(state, key) {
  return budgetRows(state, key).filter((r) => r.over && r.id !== 'savings').length;
}

function budgetBar(r) {
  const width = Math.min(100, r.pct);
  const cls = r.id === 'savings' ? 'bar-savings' : (r.over ? 'bar-over' : (r.pct >= 85 ? 'bar-warn' : 'bar-ok'));
  const status = r.id === 'savings'
    ? (r.spent >= r.target ? 'Goal reached' : `${fmt(r.left)} to goal`)
    : (r.over ? `${fmt(-r.left)} over` : `${fmt(r.left)} left`);
  return `<li class="budget-row">
    <span class="budget-icon" style="background:${r.color}" aria-hidden="true">${esc(r.icon)}</span>
    <span class="budget-name">${esc(r.name)}</span>
    <span class="budget-figs">${fmt(r.spent)} <span class="muted">of ${fmt(r.target)}</span></span>
    <span class="bar" role="progressbar" aria-label="${esc(r.name)} budget" aria-valuenow="${r.pct}" aria-valuemin="0" aria-valuemax="100"><span class="bar-fill ${cls}" style="width:${width}%"></span></span>
    <span class="budget-status">${status}</span>
  </li>`;
}

function txRow(t, editable) {
  const cat = t.kind === 'income' ? null : categoryById(t.category);
  const badge = t.kind === 'income'
    ? `<span class="tx-badge badge-income" aria-hidden="true">↓</span>`
    : `<span class="tx-badge" style="background:${cat.color}" aria-hidden="true">${esc(cat.icon)}</span>`;
  const meta = t.kind === 'income' ? esc(t.category) : esc(cat.name);
  const actions = editable
    ? `<span class="tx-actions"><button type="button" class="btn btn-small" data-edit="${t.id}">Edit</button><button type="button" class="btn btn-small btn-danger" data-delete="${t.id}" aria-label="Delete ${esc(t.label)}">Delete</button></span>`
    : '';
  return `<li class="tx-row">${badge}
    <span class="tx-main"><span class="tx-label">${esc(t.label)}</span><span class="tx-meta">${meta} · ${esc(t.date.slice(8, 10))} ${esc(monthLabel(t.date.slice(0, 7)).slice(0, 3))}${t.note ? ' · ' + esc(t.note) : ''}</span></span>
    <span class="tx-amount ${t.kind === 'income' ? 'amt-in' : 'amt-out'}">${t.kind === 'income' ? '+' : '−'}${fmt(t.amount).slice(0)}</span>${actions}</li>`;
}

export function dashboardView(state) {
  const key = state.month;
  const totals = monthTotals(state, key);
  const rows = budgetRows(state, key);
  // The donut covers every expense category (Savings included, as money set
  // aside) so its segments always add up to the month's spending total.
  const spendRows = rows;
  const recent = monthTransactions(state, key).slice(0, 7);
  const legend = spendRows.filter((r) => r.spent > 0).map((r) => {
    const pct = totals.spending > 0 ? Math.round((r.spent / totals.spending) * 100) : 0;
    return `<li><span class="dot" style="background:${r.color}" aria-hidden="true"></span>${esc(r.name)} <strong>${fmt(r.spent)}</strong> <span class="muted">${pct}%</span></li>`;
  }).join('');
  return `${summaryCards(state, key)}
  <div class="grid-2">
    <section class="panel" aria-labelledby="h-spend">
      <h2 id="h-spend">Where the money went</h2>
      <div class="donut-wrap">${donutChart(spendRows, fmt(totals.spending), 'spent in ' + monthLabel(key).slice(0, 3))}<ul class="legend">${legend}</ul></div>
    </section>
    <section class="panel" aria-labelledby="h-budgets">
      <h2 id="h-budgets">Budget progress <a class="panel-link" href="#/budgets">Edit targets</a></h2>
      <ul class="budget-list">${rows.map(budgetBar).join('')}</ul>
    </section>
  </div>
  <section class="panel" aria-labelledby="h-recent">
    <h2 id="h-recent">Latest entries <a class="panel-link" href="#/transactions">All transactions</a></h2>
    <ul class="tx-list">${recent.map((t) => txRow(t, false)).join('') || '<li class="empty">No entries this month yet — add your first one below.</li>'}</ul>
    ${quickAddForm(state)}
  </section>`;
}

export function budgetsView(state) {
  const key = state.month;
  const rows = budgetRows(state, key);
  const totalTarget = rows.reduce((a, r) => a + r.target, 0);
  const income = monthTotals(state, key).income;
  const unallocated = income - totalTarget;
  const editor = rows.map((r) => `<li class="budget-edit-row">
      <span class="budget-icon" style="background:${r.color}" aria-hidden="true">${esc(r.icon)}</span>
      <label class="budget-name" for="budget-${r.id}">${esc(r.name)}</label>
      <span class="budget-figs">${fmt(r.spent)} spent</span>
      <span class="budget-input-wrap"><span aria-hidden="true">$</span><input id="budget-${r.id}" class="budget-input" type="number" min="0" step="10" value="${r.target}" data-budget="${r.id}" aria-label="Monthly target for ${esc(r.name)}"></span>
      <span class="bar" role="progressbar" aria-label="${esc(r.name)} budget" aria-valuenow="${r.pct}" aria-valuemin="0" aria-valuemax="100"><span class="bar-fill ${r.over && r.id !== 'savings' ? 'bar-over' : 'bar-ok'}" style="width:${Math.min(100, r.pct)}%"></span></span>
      <span class="budget-status">${r.id === 'savings' ? (r.spent >= r.target ? 'Goal reached' : fmt(r.left) + ' to goal') : (r.over ? fmt(-r.left) + ' over' : fmt(r.left) + ' left')}</span>
    </li>`).join('');
  return `<section class="panel" aria-labelledby="h-budget-page">
    <h2 id="h-budget-page">Monthly budget targets — ${esc(monthLabel(key))}</h2>
    <p class="panel-intro">Set a target for each category. Progress updates as you log spending, and anything over target turns red so you spot it early. Savings is a goal to reach, not a cap.</p>
    <p class="allocation ${unallocated < 0 ? 'alloc-over' : ''}">Income ${fmt(income)} · Targets ${fmt(totalTarget)} · ${unallocated >= 0 ? 'Unallocated ' + fmt(unallocated) + ' — give it a job (a category, or savings)' : 'Over-allocated by ' + fmt(-unallocated) + ' — trim a target'}</p>
    <ul class="budget-list budget-edit-list">${editor}</ul>
    <p class="muted small">Tip: a common starting split is 50% needs, 30% wants, 20% savings. Adjust the targets until the unallocated line sits near zero.</p>
  </section>`;
}

export function transactionsView(state, filters) {
  const key = state.month;
  let list = monthTransactions(state, key);
  if (filters.kind !== 'all') list = list.filter((t) => t.kind === filters.kind);
  if (filters.category !== 'all') list = list.filter((t) => t.category === filters.category);
  if (filters.query) {
    const q = filters.query.toLowerCase();
    list = list.filter((t) => (t.label + ' ' + t.note).toLowerCase().includes(q));
  }
  const catOptions = ['<option value="all">All categories</option>',
    ...INCOME_SOURCES.map((s) => `<option value="${esc(s)}" ${filters.category === s ? 'selected' : ''}>${esc(s)} (income)</option>`),
    ...CATEGORIES.map((c) => `<option value="${c.id}" ${filters.category === c.id ? 'selected' : ''}>${esc(c.name)}</option>`)].join('');
  const totals = monthTotals(state, key);
  return `<section class="panel" aria-labelledby="h-tx">
    <h2 id="h-tx">Transactions — ${esc(monthLabel(key))}</h2>
    <p class="panel-intro">${list.length} shown · Income ${fmt(totals.income)} · Spending ${fmt(totals.spending)} · Left ${fmt(totals.remaining)}</p>
    <div class="tx-tools" role="search">
      <label>Search <input type="search" id="tx-search" value="${esc(filters.query)}" placeholder="e.g. rent, FreshMart"></label>
      <label>Type <select id="tx-kind">
        <option value="all" ${filters.kind === 'all' ? 'selected' : ''}>All</option>
        <option value="income" ${filters.kind === 'income' ? 'selected' : ''}>Income</option>
        <option value="expense" ${filters.kind === 'expense' ? 'selected' : ''}>Spending</option></select></label>
      <label>Category <select id="tx-category">${catOptions}</select></label>
      <button type="button" class="btn" id="tx-export">Export CSV</button>
    </div>
    <ul class="tx-list">${list.map((t) => txRow(t, true)).join('') || '<li class="empty">Nothing matches — try a different search, or add an entry below.</li>'}</ul>
    ${quickAddForm(state)}
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
  const daily = (totals.spending / new Date(...key.split('-').map(Number), 0).getDate());
  const tips = [];
  if (over.length) tips.push(`<li><strong>${over.map((r) => esc(r.name)).join(', ')}</strong> ${over.length === 1 ? 'is' : 'are'} over target — trim there first before touching essentials.</li>`);
  if (biggest && biggest.spent > 0) tips.push(`<li><strong>${esc(biggest.name)}</strong> is your biggest cost at ${fmt(biggest.spent)} (${Math.round((biggest.spent / Math.max(1, totals.spending)) * 100)}% of spending).</li>`);
  tips.push(`<li>Average daily spending is <strong>${fmt(daily)}</strong>. At that pace the month ends near ${fmt(totals.spending)}.</li>`);
  if (savingsRow) tips.push(`<li>Savings: <strong>${fmt(savingsRow.spent)}</strong> of the ${fmt(savingsRow.target)} goal (${savingsRow.pct}%). ${savingsRow.spent >= savingsRow.target ? 'Goal reached — consider raising it next month.' : 'Another ' + fmt(savingsRow.left) + ' reaches the goal.'}</li>`);
  tips.push(`<li>Spending ${totals.spending <= prev.spending ? 'fell' : 'rose'} ${fmt(Math.abs(totals.spending - prev.spending))} versus last month (${fmt(prev.spending)} → ${fmt(totals.spending)}).</li>`);
  return `<section class="panel" aria-labelledby="h-trend">
    <h2 id="h-trend">Six-month trend</h2>
    <p class="panel-intro"><span class="dot" style="background:#5B8C5A" aria-hidden="true"></span> Income &nbsp; <span class="dot" style="background:#C4553B" aria-hidden="true"></span> Spending — steady income, spending that stays under it.</p>
    ${trendChart(series)}
  </section>
  <div class="grid-2">
    <section class="panel" aria-labelledby="h-daily">
      <h2 id="h-daily">Spending through ${esc(monthLabel(key))}</h2>
      ${dailySpark(monthTransactions(state, key), key)}
      <p class="muted small">Rent lands on the 2nd, so the month starts high and settles into weekly shops.</p>
    </section>
    <section class="panel" aria-labelledby="h-tips">
      <h2 id="h-tips">What the numbers say</h2>
      <ul class="tips">${tips.join('')}</ul>
    </section>
  </div>`;
}

// Add / edit form, shared by the dashboard and transactions pages.
export function quickAddForm(state, editing = null) {
  const e = editing || { kind: 'expense', category: 'groceries', label: '', amount: '', date: state.month + '-15', note: '' };
  const catOpts = (kind) => kind === 'income'
    ? INCOME_SOURCES.map((s) => `<option value="${esc(s)}" ${e.category === s ? 'selected' : ''}>${esc(s)}</option>`).join('')
    : CATEGORIES.map((c) => `<option value="${c.id}" ${e.category === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  return `<form class="add-form" id="tx-form" aria-label="${editing ? 'Edit transaction' : 'Add a transaction'}">
    <h3>${editing ? 'Edit entry' : 'Add an entry'}</h3>
    <div class="form-grid">
      <label>Type <select name="kind" id="f-kind">
        <option value="expense" ${e.kind === 'expense' ? 'selected' : ''}>Spending</option>
        <option value="income" ${e.kind === 'income' ? 'selected' : ''}>Income</option></select></label>
      <label>Category <select name="category" id="f-category">${catOpts(e.kind)}</select></label>
      <label>What was it? <input name="label" id="f-label" required maxlength="80" value="${esc(e.label)}" placeholder="e.g. Weekly shop"></label>
      <label>Amount ($) <input name="amount" id="f-amount" required type="number" min="0.01" step="0.01" value="${esc(e.amount)}" placeholder="0.00"></label>
      <label>Date <input name="date" id="f-date" required type="date" value="${esc(e.date)}"></label>
      <label>Note (optional) <input name="note" id="f-note" maxlength="60" value="${esc(e.note)}" placeholder="e.g. standing order"></label>
    </div>
    <div class="form-actions">
      <button type="submit" class="btn btn-primary">${editing ? 'Save changes' : 'Add entry'}</button>
      ${editing ? '<button type="button" class="btn" id="f-cancel">Cancel</button>' : ''}
    </div>
  </form>`;
}

export { prevKey };
