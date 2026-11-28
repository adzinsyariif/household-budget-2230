// HearthLedger transactions page: the month's full ledger with search,
// type and category filters, edit/delete on every row, a running
// balance, CSV export and the add form.

import { CATEGORIES, INCOME_SOURCES } from './data.js';
import { fmt, monthLabel, monthTotals, monthTransactions } from './store.js';
import { esc, quickAddForm, txRow } from './ui.js';

export function transactionsView(state, filters) {
  const key = state.month;
  // Running balance is computed over the whole month in date order, then
  // the list is shown newest first with each row's balance attached.
  const chronological = [...monthTransactions(state, key)].reverse();
  const balanceById = new Map();
  let running = 0;
  for (const t of chronological) {
    running += t.kind === 'income' ? t.amount : -t.amount;
    balanceById.set(t.id, running);
  }
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
    <p class="panel-intro">${list.length} shown · Income ${fmt(totals.income)} · Spending ${fmt(totals.spending)} · Left ${fmt(totals.remaining)} · the pale figure on each row is the running balance</p>
    <div class="tx-tools" role="search">
      <label>Search <input type="search" id="tx-search" value="${esc(filters.query)}" placeholder="e.g. rent, FreshMart"></label>
      <label>Type <select id="tx-kind">
        <option value="all" ${filters.kind === 'all' ? 'selected' : ''}>All</option>
        <option value="income" ${filters.kind === 'income' ? 'selected' : ''}>Income</option>
        <option value="expense" ${filters.kind === 'expense' ? 'selected' : ''}>Spending</option></select></label>
      <label>Category <select id="tx-category">${catOptions}</select></label>
      <button type="button" class="btn" id="tx-export">Export CSV</button>
    </div>
    <ul class="tx-list">${list.map((t) => txRow(t, true, balanceById.get(t.id))).join('') || '<li class="empty">Nothing matches — try a different search, or add an entry below.</li>'}</ul>
    ${quickAddForm(state)}
  </section>`;
}
