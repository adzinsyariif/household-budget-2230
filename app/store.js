// HearthLedger store: the ledger state, localStorage persistence, and
// every derived figure the pages show — totals, category sums, budget
// progress, savings-goal progress, bill status, daily pace and movers.
// Nothing here invents a number: each figure is arithmetic over the
// ledger rows, so the pages always agree with each other.

import { CATEGORIES, DEFAULT_BILLS, DEFAULT_BUDGETS, DEFAULT_GOALS, seedLedger } from './data.js';

const KEY = 'hearthledger-v2';

export function monthKeyOf(dateStr) { return dateStr.slice(0, 7); }

function freshState() {
  return {
    transactions: seedLedger(),
    budgets: { ...DEFAULT_BUDGETS },
    goals: DEFAULT_GOALS.map((g) => ({ ...g })),
    bills: DEFAULT_BILLS.map((b) => ({ ...b })),
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
    if (!Array.isArray(parsed.goals)) parsed.goals = DEFAULT_GOALS.map((g) => ({ ...g }));
    if (!Array.isArray(parsed.bills)) parsed.bills = DEFAULT_BILLS.map((b) => ({ ...b }));
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

export function prevKey(key) { return shiftMonth(key, -1); }

export function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export function daysInMonth(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m, 0).getDate();
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

// Needs / wants / savings shares of the month's targets and of what was
// actually spent — the 50/30/20 lens on the same ledger.
export function groupShares(state, key) {
  const rows = budgetRows(state, key);
  const groups = { needs: { target: 0, spent: 0 }, wants: { target: 0, spent: 0 }, savings: { target: 0, spent: 0 } };
  for (const r of rows) { groups[r.group].target += r.target; groups[r.group].spent += r.spent; }
  const income = monthTotals(state, key).income;
  for (const g of Object.values(groups)) {
    g.targetPct = income > 0 ? Math.round((g.target / income) * 100) : 0;
    g.spentPct = income > 0 ? Math.round((g.spent / income) * 100) : 0;
  }
  return groups;
}

// Daily pace: spending so far divided by the days covered (up to the
// latest entry), and where that pace lands by month end.
export function dailyPace(state, key) {
  const rows = monthTransactions(state, key).filter((t) => t.kind === 'expense');
  const totals = monthTotals(state, key);
  const lastDay = rows.length ? Math.max(...rows.map((t) => Number(t.date.slice(8, 10)))) : 0;
  const perDay = lastDay > 0 ? totals.spending / lastDay : 0;
  return { perDay, lastDay, projected: perDay * daysInMonth(key) };
}

// Category movers versus last month: biggest rises and falls in dollars.
export function categoryMovers(state, key) {
  const now = categorySpending(state, key);
  const before = categorySpending(state, prevKey(key));
  return CATEGORIES
    .map((c) => ({ ...c, now: now[c.id] || 0, before: before[c.id] || 0, delta: (now[c.id] || 0) - (before[c.id] || 0) }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

// Last `count` months ending at `key`: income, spending and what was kept.
export function trendSeries(state, key, count = 6) {
  const out = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const k = shiftMonth(key, -i);
    const t = monthTotals(state, k);
    out.push({ key: k, label: monthLabel(k).slice(0, 3), income: t.income, spending: t.spending, kept: t.remaining });
  }
  return out;
}

// Year to date (the selected month's calendar year, up to that month).
export function yearToDate(state, key) {
  const year = key.slice(0, 4);
  let income = 0, spending = 0, months = 0;
  for (const k of monthsPresent(state)) {
    if (k.startsWith(year) && k <= key) { const t = monthTotals(state, k); income += t.income; spending += t.spending; months += 1; }
  }
  return { income, spending, kept: income - spending, months };
}

// --- Savings goals -------------------------------------------------------

export function goalSaved(state, goal) {
  let saved = goal.base || 0;
  for (const t of state.transactions) {
    if (t.kind === 'expense' && t.category === 'savings' && (t.note || '').includes('goal:' + goal.id)) saved += t.amount;
  }
  return saved;
}

export function goalProgress(state, goal, key) {
  const saved = goalSaved(state, goal);
  const pct = goal.target > 0 ? Math.min(100, Math.round((saved / goal.target) * 100)) : 0;
  const remaining = Math.max(0, goal.target - saved);
  const monthsLeft = goal.monthly > 0 ? Math.ceil(remaining / goal.monthly) : null;
  const doneKey = monthsLeft === null ? null : shiftMonth(key, monthsLeft);
  return { ...goal, saved, pct, remaining, monthsLeft, doneLabel: doneKey ? monthLabel(doneKey) : null };
}

export function addGoal(state, fields) {
  const id = 'goal-' + Date.now().toString(36);
  state.goals.push({ id, base: 0, ...fields });
  saveState(state);
  return id;
}

export function deleteGoal(state, id) {
  state.goals = state.goals.filter((g) => g.id !== id);
  saveState(state);
}

// --- Recurring bills -----------------------------------------------------

export function billStatus(state, key) {
  const rows = monthTransactions(state, key).filter((t) => t.kind === 'expense');
  return state.bills.map((b) => {
    const paidRow = rows.find((t) => t.category === b.category && t.label.toLowerCase().includes(b.name.toLowerCase()));
    return { ...b, paid: Boolean(paidRow), paidAmount: paidRow ? paidRow.amount : null, paidDate: paidRow ? paidRow.date : null };
  }).sort((a, b) => a.dueDay - b.dueDay);
}

export function billsTotal(state) {
  return state.bills.reduce((a, b) => a + b.amount, 0);
}

// --- Ledger writes --------------------------------------------------------

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
