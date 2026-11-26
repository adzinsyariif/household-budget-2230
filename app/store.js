// HearthLedger store: the ledger state, localStorage persistence, and every
// derived figure the pages show (totals, category sums, budget progress).

import { CATEGORIES, DEFAULT_BUDGETS, seedLedger } from './data.js';

const KEY = 'hearthledger-v1';

export function monthKeyOf(dateStr) { return dateStr.slice(0, 7); }

export function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function freshState() {
  return {
    transactions: seedLedger(),
    budgets: { ...DEFAULT_BUDGETS },
    month: '2026-11',
    seeded: true,
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) { const s = freshState(); saveState(s); return s; }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.transactions) || typeof parsed.budgets !== 'object') return freshState();
    return parsed;
  } catch { return freshState(); }
}

export function saveState(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full/blocked: keep working in memory */ }
}

export function resetState() {
  const s = freshState();
  saveState(s);
  return s;
}

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

export function monthsPresent(state) {
  const set = new Set(state.transactions.map((t) => monthKeyOf(t.date)));
  set.add(state.month);
  return [...set].sort();
}

export function shiftMonth(key, delta) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export function monthTransactions(state, key) {
  return state.transactions
    .filter((t) => monthKeyOf(t.date) === key)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function monthTotals(state, key) {
  let income = 0, spending = 0;
  for (const t of monthTransactions(state, key)) {
    if (t.kind === 'income') income += t.amount; else spending += t.amount;
  }
  return { income, spending, remaining: income - spending };
}

export function categorySpending(state, key) {
  const sums = {};
  for (const c of CATEGORIES) sums[c.id] = 0;
  for (const t of monthTransactions(state, key)) {
    if (t.kind === 'expense') sums[t.category] = (sums[t.category] || 0) + t.amount;
  }
  return sums;
}

export function budgetRows(state, key) {
  const sums = categorySpending(state, key);
  return CATEGORIES.map((c) => {
    const spent = sums[c.id] || 0;
    const target = state.budgets[c.id] || 0;
    const pct = target > 0 ? Math.round((spent / target) * 100) : 0;
    return { ...c, spent, target, pct, left: target - spent, over: spent > target && target > 0 };
  });
}

// Last six months ending at `key`: income vs spending for the trend chart.
export function trendSeries(state, key, count = 6) {
  const out = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const k = shiftMonth(key, -i);
    const t = monthTotals(state, k);
    out.push({ key: k, label: monthLabel(k).slice(0, 3), income: t.income, spending: t.spending });
  }
  return out;
}

export function addTransaction(state, fields) {
  const id = 'tx-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  state.transactions.push({ id, ...fields });
  saveState(state);
  return id;
}

export function updateTransaction(state, id, fields) {
  const i = state.transactions.findIndex((t) => t.id === id);
  if (i >= 0) { state.transactions[i] = { ...state.transactions[i], ...fields }; saveState(state); }
}

export function deleteTransaction(state, id) {
  state.transactions = state.transactions.filter((t) => t.id !== id);
  saveState(state);
}

export function setBudget(state, categoryId, amount) {
  state.budgets[categoryId] = Math.max(0, Math.round(amount));
  saveState(state);
}

export function fmt(n) {
  const sign = n < 0 ? '−' : '';
  return sign + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
}

export function fmtSigned(n) {
  return (n >= 0 ? '+' : '−') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
}
