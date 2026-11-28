// HearthLedger main: hash routing, the month switcher, form wiring,
// goal contributions and CSV export. State lives in store.js; each page
// renders from its own views-*.js module.

import { CATEGORIES, INCOME_SOURCES } from './data.js';
import {
  addGoal, addTransaction, deleteGoal, deleteTransaction, loadState,
  monthLabel, monthTransactions, monthsPresent, resetState, saveState,
  setBudget, shiftMonth, updateTransaction,
} from './store.js';
import { quickAddForm } from './ui.js';
import { dashboardView } from './views-dashboard.js';
import { budgetsView } from './views-budgets.js';
import { transactionsView } from './views-transactions.js';
import { goalsView } from './views-goals.js';
import { insightsView } from './views-insights.js';

let state = loadState();
let editingId = null;
const filters = { kind: 'all', category: 'all', query: '' };

const app = document.getElementById('app');
const monthLabelEl = document.getElementById('month-label');

function route() {
  const hash = location.hash || '#/';
  if (hash.startsWith('#/budgets')) return 'budgets';
  if (hash.startsWith('#/transactions')) return 'transactions';
  if (hash.startsWith('#/goals')) return 'goals';
  if (hash.startsWith('#/insights')) return 'insights';
  return 'dashboard';
}

function render() {
  const r = route();
  document.querySelectorAll('[data-nav]').forEach((a) => {
    const active = a.getAttribute('data-nav') === r;
    a.classList.toggle('nav-active', active);
    if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  monthLabelEl.textContent = monthLabel(state.month);
  if (r === 'budgets') app.innerHTML = budgetsView(state);
  else if (r === 'transactions') app.innerHTML = transactionsView(state, filters);
  else if (r === 'goals') app.innerHTML = goalsView(state);
  else if (r === 'insights') app.innerHTML = insightsView(state);
  else app.innerHTML = dashboardView(state);
  wire();
}

function wire() {
  // Budget target inputs (Budgets page)
  app.querySelectorAll('[data-budget]').forEach((input) => {
    input.addEventListener('change', () => {
      setBudget(state, input.getAttribute('data-budget'), Number(input.value) || 0);
      render();
    });
  });

  // Transaction filters
  const search = document.getElementById('tx-search');
  if (search) search.addEventListener('input', () => {
    filters.query = search.value;
    const pos = search.selectionStart;
    render();
    const again = document.getElementById('tx-search');
    again.focus(); again.setSelectionRange(pos, pos);
  });
  const kindSel = document.getElementById('tx-kind');
  if (kindSel) kindSel.addEventListener('change', () => { filters.kind = kindSel.value; render(); });
  const catSel = document.getElementById('tx-category');
  if (catSel) catSel.addEventListener('change', () => { filters.category = catSel.value; render(); });
  const exportBtn = document.getElementById('tx-export');
  if (exportBtn) exportBtn.addEventListener('click', exportCsv);

  // Edit / delete buttons
  app.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => {
    editingId = b.getAttribute('data-edit');
    const tx = state.transactions.find((t) => t.id === editingId);
    if (!tx) return;
    const formHost = document.getElementById('tx-form');
    formHost.outerHTML = quickAddForm(state, tx);
    wireForm();
    document.getElementById('f-label').focus();
  }));
  app.querySelectorAll('[data-delete]').forEach((b) => b.addEventListener('click', () => {
    deleteTransaction(state, b.getAttribute('data-delete'));
    if (editingId === b.getAttribute('data-delete')) editingId = null;
    render();
  }));

  // Goal actions: contribute logs a tagged savings transfer; remove drops the goal.
  app.querySelectorAll('[data-contribute]').forEach((b) => b.addEventListener('click', () => {
    const goal = state.goals.find((g) => g.id === b.getAttribute('data-contribute'));
    if (!goal || !(goal.monthly > 0)) return;
    addTransaction(state, {
      kind: 'expense', category: 'savings',
      label: 'Transfer to ' + goal.name.toLowerCase(),
      amount: goal.monthly, date: state.month + '-28', note: 'goal:' + goal.id,
    });
    render();
  }));
  app.querySelectorAll('[data-delete-goal]').forEach((b) => b.addEventListener('click', () => {
    deleteGoal(state, b.getAttribute('data-delete-goal'));
    render();
  }));
  const goalForm = document.getElementById('goal-form');
  if (goalForm) goalForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const data = new FormData(goalForm);
    const name = String(data.get('name')).trim();
    const target = Math.round(Number(data.get('target')));
    const monthly = Math.round(Number(data.get('monthly')));
    if (!name || !(target > 0) || monthly < 0) return;
    addGoal(state, { name, target, monthly });
    render();
  });

  wireForm();
}

function wireForm() {
  const form = document.getElementById('tx-form');
  if (!form) return;
  const kindSel = document.getElementById('f-kind');
  const catSel = document.getElementById('f-category');
  kindSel.addEventListener('change', () => {
    const opts = kindSel.value === 'income'
      ? INCOME_SOURCES.map((s) => `<option value="${s}">${s}</option>`).join('')
      : CATEGORIES.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
    catSel.innerHTML = opts;
  });
  const cancel = document.getElementById('f-cancel');
  if (cancel) cancel.addEventListener('click', () => { editingId = null; render(); });
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const data = new FormData(form);
    const fields = {
      kind: String(data.get('kind')),
      category: String(data.get('category')),
      label: String(data.get('label')).trim(),
      amount: Math.round(Number(data.get('amount')) * 100) / 100,
      date: String(data.get('date')),
      note: String(data.get('note') || '').trim(),
    };
    if (!fields.label || !(fields.amount > 0) || !fields.date) return;
    if (editingId) { updateTransaction(state, editingId, fields); editingId = null; }
    else addTransaction(state, fields);
    state.month = fields.date.slice(0, 7);
    saveState(state);
    syncMonthSelect();
    render();
  });
}

function exportCsv() {
  const rows = [['date', 'type', 'category', 'label', 'amount', 'note']];
  for (const t of monthTransactions(state, state.month)) {
    rows.push([t.date, t.kind, t.category, t.label, t.amount.toFixed(2), t.note || '']);
  }
  const csv = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `hearthledger-${state.month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Month switcher in the header.
document.getElementById('month-prev').addEventListener('click', () => {
  state.month = shiftMonth(state.month, -1); saveState(state); syncMonthSelect(); render();
});
document.getElementById('month-next').addEventListener('click', () => {
  state.month = shiftMonth(state.month, 1); saveState(state); syncMonthSelect(); render();
});
document.getElementById('month-select').addEventListener('change', (ev) => {
  state.month = ev.target.value; saveState(state); render();
});
document.getElementById('reset-demo').addEventListener('click', () => {
  state = resetState(); editingId = null; syncMonthSelect(); render();
});

function syncMonthSelect() {
  const sel = document.getElementById('month-select');
  sel.innerHTML = monthsPresent(state).map((k) => `<option value="${k}" ${k === state.month ? 'selected' : ''}>${monthLabel(k)}</option>`).join('');
}

window.addEventListener('hashchange', render);
syncMonthSelect();
render();
