// HearthLedger budgets page: an editable monthly target per category,
// the unallocated-income line, and the 50/30/20 lens (needs / wants /
// savings) over the same targets and spending.

import { budgetRows, fmt, groupShares, monthLabel, monthTotals } from './store.js';
import { splitBar } from './charts.js';
import { esc } from './ui.js';

export function budgetsView(state) {
  const key = state.month;
  const rows = budgetRows(state, key);
  const totalTarget = rows.reduce((a, r) => a + r.target, 0);
  const income = monthTotals(state, key).income;
  const unallocated = income - totalTarget;
  const groups = groupShares(state, key);
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
    <h3 class="split-title">How the targets split — the 50/30/20 lens</h3>
    ${splitBar(groups)}
    <p class="muted small">Targets today: needs ${groups.needs.targetPct}% · wants ${groups.wants.targetPct}% · savings ${groups.savings.targetPct}% of income. A common starting split is 50% needs, 30% wants, 20% savings — adjust the targets until the unallocated line sits near zero.</p>
    <ul class="budget-list budget-edit-list">${editor}</ul>
  </section>`;
}
