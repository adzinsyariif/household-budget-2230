// HearthLedger goals & bills page: savings goals with progress rings,
// monthly contributions and projected finish dates, plus the recurring
// bills table with paid/due status for the selected month.

import { billStatus, billsTotal, categoryById, fmt, goalProgress, monthLabel } from './store.js';
import { progressRing } from './charts.js';
import { esc } from './ui.js';

function goalCard(state, goal, key) {
  const g = goalProgress(state, goal, key);
  const finish = g.remaining <= 0
    ? 'Target reached — set a new one'
    : (g.doneLabel ? `on track for ${g.doneLabel}` : 'add a monthly amount to project a finish');
  return `<li class="goal-card">
    ${progressRing(g.pct)}
    <div class="goal-main">
      <h3>${esc(g.name)}</h3>
      <p class="goal-figs"><strong>${fmt(g.saved)}</strong> of ${fmt(g.target)} saved · ${fmt(g.monthly)}/month</p>
      <p class="muted small">${g.remaining > 0 ? fmt(g.remaining) + ' to go · ' : ''}${finish}</p>
      <div class="goal-actions">
        <button type="button" class="btn btn-small" data-contribute="${g.id}">Add ${fmt(g.monthly)}</button>
        <button type="button" class="btn btn-small btn-danger" data-delete-goal="${g.id}" aria-label="Remove goal ${esc(g.name)}">Remove</button>
      </div>
    </div>
  </li>`;
}

function billsTable(state, key) {
  const bills = billStatus(state, key);
  const rows = bills.map((b) => {
    const cat = categoryById(b.category);
    return `<tr>
      <td class="bill-due">${b.dueDay}</td>
      <td><span class="dot" style="background:${cat.color}" aria-hidden="true"></span>${esc(b.name)}</td>
      <td>${esc(cat.name)}</td>
      <td class="num">${fmt(b.paid ? b.paidAmount : b.amount)}</td>
      <td>${b.paid ? `<span class="pill pill-paid">Paid ${esc(b.paidDate.slice(8, 10))} ${esc(monthLabel(key).slice(0, 3))}</span>` : '<span class="pill pill-due">Still due</span>'}</td>
    </tr>`;
  }).join('');
  const paidSum = bills.filter((b) => b.paid).reduce((a, b) => a + b.paidAmount, 0);
  return `<section class="panel" aria-labelledby="h-bills">
    <h2 id="h-bills">Recurring bills — ${esc(monthLabel(key))}</h2>
    <p class="panel-intro">The bills that land every month, ${fmt(billsTotal(state))} in all. A bill shows as paid once a matching entry is in the ledger.</p>
    <div class="table-wrap"><table class="bills-table">
      <thead><tr><th scope="col">Due</th><th scope="col">Bill</th><th scope="col">Category</th><th scope="col" class="num">Amount</th><th scope="col">Status</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="3">Paid so far this month</td><td class="num">${fmt(paidSum)}</td><td></td></tr></tfoot>
    </table></div>
  </section>`;
}

export function goalsView(state) {
  const key = state.month;
  const cards = state.goals.map((g) => goalCard(state, g, key)).join('');
  return `<section class="panel" aria-labelledby="h-goals">
    <h2 id="h-goals">Savings goals</h2>
    <p class="panel-intro">Money set aside on purpose. Each goal's saved figure is the ledger's own transfers tagged to it, and the finish date is the remaining amount divided by the monthly contribution.</p>
    <ul class="goal-grid">${cards || '<li class="empty">No goals yet — add your first one below.</li>'}</ul>
    <form class="add-form" id="goal-form" aria-label="Add a savings goal">
      <h3>Add a goal</h3>
      <div class="form-grid">
        <label>Goal name <input name="name" required maxlength="40" placeholder="e.g. New bike"></label>
        <label>Target ($) <input name="target" required type="number" min="1" step="1" placeholder="1000"></label>
        <label>Monthly ($) <input name="monthly" required type="number" min="0" step="1" placeholder="100"></label>
      </div>
      <div class="form-actions"><button type="submit" class="btn btn-primary">Add goal</button></div>
    </form>
  </section>
  ${billsTable(state, key)}`;
}
