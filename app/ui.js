// HearthLedger shared UI pieces: escaping, the budget progress bar, the
// transaction row and the add/edit form used by more than one page.

import { CATEGORIES, INCOME_SOURCES } from './data.js';
import { categoryById, fmt, monthLabel } from './store.js';

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function budgetBar(r) {
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

export function txRow(t, editable, balance = null) {
  const cat = t.kind === 'income' ? null : categoryById(t.category);
  const badge = t.kind === 'income'
    ? `<span class="tx-badge badge-income" aria-hidden="true">↓</span>`
    : `<span class="tx-badge" style="background:${cat.color}" aria-hidden="true">${esc(cat.icon)}</span>`;
  const meta = t.kind === 'income' ? esc(t.category) : esc(cat.name);
  const actions = editable
    ? `<span class="tx-actions"><button type="button" class="btn btn-small" data-edit="${t.id}">Edit</button><button type="button" class="btn btn-small btn-danger" data-delete="${t.id}" aria-label="Delete ${esc(t.label)}">Delete</button></span>`
    : '';
  const bal = balance === null ? '' : `<span class="tx-balance" title="Running balance after this entry">${fmt(balance)}</span>`;
  return `<li class="tx-row">${badge}
    <span class="tx-main"><span class="tx-label">${esc(t.label)}</span><span class="tx-meta">${meta} · ${esc(t.date.slice(8, 10))} ${esc(monthLabel(t.date.slice(0, 7)).slice(0, 3))}${t.note && !t.note.startsWith('goal:') ? ' · ' + esc(t.note) : ''}</span></span>
    <span class="tx-amount ${t.kind === 'income' ? 'amt-in' : 'amt-out'}">${t.kind === 'income' ? '+' : '−'}${fmt(t.amount)}</span>${bal}${actions}</li>`;
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
