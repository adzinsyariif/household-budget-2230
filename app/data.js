// HearthLedger seed data: the category set, monthly budget targets,
// savings goals, recurring bills and a realistic household ledger for
// June–November 2026 so the first load is alive with real figures.
// All amounts are in US dollars. Dates are ISO days (YYYY-MM-DD).

export const CATEGORIES = [
  { id: 'housing',   name: 'Housing',       color: '#12403F', icon: '⌂', group: 'needs' },
  { id: 'groceries', name: 'Groceries',     color: '#5B8C5A', icon: '◐', group: 'needs' },
  { id: 'utilities', name: 'Utilities',     color: '#D9932E', icon: '◑', group: 'needs' },
  { id: 'transport', name: 'Transport',     color: '#4E7FA6', icon: '➤', group: 'needs' },
  { id: 'health',    name: 'Health',        color: '#8A6BA8', icon: '✚', group: 'needs' },
  { id: 'kids',      name: 'Kids & school', color: '#3E9B8F', icon: '✿', group: 'needs' },
  { id: 'dining',    name: 'Dining out',    color: '#C4553B', icon: '✦', group: 'wants' },
  { id: 'leisure',   name: 'Leisure',       color: '#B5658F', icon: '♪', group: 'wants' },
  { id: 'other',     name: 'Other',         color: '#8C8578', icon: '•', group: 'wants' },
  { id: 'savings',   name: 'Savings',       color: '#7A8B3D', icon: '❦', group: 'savings' },
];

export const INCOME_SOURCES = ['Salary', 'Freelance', 'Rental', 'Benefits', 'Other income'];

// Monthly spending targets per category (dollars). Savings is a goal, not a cap.
export const DEFAULT_BUDGETS = {
  housing: 1500, groceries: 700, utilities: 320, transport: 320, health: 220,
  kids: 340, dining: 300, leisure: 280, other: 220, savings: 1200,
};

// Savings goals. `base` is what was set aside before the ledger starts;
// transfers in the ledger tagged `goal:<id>` in their note add to it, so
// the saved figure is always the ledger's own arithmetic.
export const DEFAULT_GOALS = [
  { id: 'emergency', name: 'Emergency fund', target: 9000, monthly: 450, base: 0 },
  { id: 'holiday',   name: 'Family holiday', target: 3000, monthly: 200, base: 500 },
  { id: 'boiler',    name: 'New boiler',     target: 2400, monthly: 150, base: 900 },
];

// Recurring bills: name, typical amount, day of month due, category.
// A bill counts as paid in a month when a ledger entry that month carries
// the bill's name in its label.
export const DEFAULT_BILLS = [
  { id: 'rent',      name: 'Rent',             amount: 1450, dueDay: 2,  category: 'housing' },
  { id: 'electric',  name: 'Electricity & gas', amount: 132, dueDay: 3,  category: 'utilities' },
  { id: 'lunches',   name: 'School lunches',    amount: 48,  dueDay: 6,  category: 'kids' },
  { id: 'water',     name: 'Water bill',        amount: 41,  dueDay: 8,  category: 'utilities' },
  { id: 'streaming', name: 'Streaming + music', amount: 24,  dueDay: 12, category: 'leisure' },
  { id: 'bus',       name: 'Bus passes',        amount: 56,  dueDay: 13, category: 'transport' },
  { id: 'internet',  name: 'Internet & phones', amount: 79,  dueDay: 19, category: 'utilities' },
];

let seq = 0;
function tx(date, kind, category, label, amount, note = '') {
  seq += 1;
  return { id: 'seed-' + seq, date, kind, category, label, amount, note };
}

// One month of a two-adult, two-child household. Rent, salaries and the
// savings transfer repeat; the small rows drift a little each month so
// every month reads like a real ledger, not a photocopy.
function monthRows(y, m, vary) {
  const d = (day) => `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return [
    tx(d(1), 'income', 'Salary', 'Salary — Maya (clinic)', 3420),
    tx(d(1), 'income', 'Salary', 'Salary — Daniel (logistics)', 2890),
    tx(d(2), 'expense', 'housing', 'Rent — Maple St flat', 1450, 'Standing order'),
    tx(d(3), 'expense', 'utilities', 'Electricity & gas', 118 + vary * 6),
    tx(d(4), 'expense', 'groceries', 'Weekly shop — FreshMart', 132 + vary * 4),
    tx(d(5), 'expense', 'transport', 'Fuel', 64 + vary * 3),
    tx(d(6), 'expense', 'kids', 'School lunches (top-up)', 48),
    tx(d(7), 'expense', 'dining', 'Pizza night with neighbours', 42 + vary * 2),
    tx(d(8), 'expense', 'utilities', 'Water bill', 41),
    tx(d(9), 'expense', 'groceries', 'Market — fruit & veg', 57 + vary * 2),
    tx(d(10), 'expense', 'health', 'Pharmacy', 23 + vary),
    tx(d(11), 'expense', 'groceries', 'Weekly shop — FreshMart', 121 + vary * 5),
    tx(d(12), 'expense', 'leisure', 'Streaming + music', 24),
    tx(d(13), 'expense', 'transport', 'Bus passes (×2)', 56),
    tx(d(14), 'expense', 'other', 'Household supplies', 31 + vary * 2),
    tx(d(15), 'income', 'Freelance', 'Freelance design — invoice 114', 380 + vary * 25),
    tx(d(16), 'expense', 'kids', 'Football club fees', 35),
    tx(d(17), 'expense', 'dining', 'Coffee & cake', 18),
    tx(d(18), 'expense', 'groceries', 'Weekly shop — FreshMart', 139 + vary * 3),
    tx(d(19), 'expense', 'utilities', 'Internet & phones', 79),
    tx(d(20), 'expense', 'health', 'Dentist check-up', 65),
    tx(d(21), 'expense', 'leisure', 'Cinema tickets (family)', 44),
    tx(d(22), 'expense', 'transport', 'Car service deposit', 90 + vary * 10),
    tx(d(23), 'expense', 'groceries', 'Bakery & pantry top-up', 46),
    tx(d(24), 'expense', 'kids', 'School trip payment', 30 + vary * 2),
    tx(d(25), 'expense', 'dining', 'Takeaway — noodle bar', 36 + vary * 2),
    tx(d(26), 'expense', 'other', 'Birthday gift for Gran', 40),
    tx(d(27), 'expense', 'savings', 'Transfer to emergency fund', 450, 'goal:emergency'),
    tx(d(28), 'expense', 'groceries', 'Weekly shop — FreshMart', 128 + vary * 4),
  ];
}

export function seedLedger() {
  seq = 0;
  const all = [
    ...monthRows(2026, 6, 0),
    ...monthRows(2026, 7, 1),
    ...monthRows(2026, 8, 2),
    ...monthRows(2026, 9, 1),
    ...monthRows(2026, 10, 3),
    ...monthRows(2026, 11, 2),
  ];
  // A few one-offs so the story has texture: a quarterly insurance bill in
  // September, a holiday-fund top-up in October, and in November a boiler
  // repair (the reason that goal exists) plus a small work bonus.
  all.push(tx('2026-09-09', 'expense', 'transport', 'Car insurance (quarterly)', 212));
  all.push(tx('2026-10-27', 'expense', 'savings', 'Transfer to holiday fund', 400, 'goal:holiday'));
  all.push(tx('2026-11-15', 'expense', 'housing', 'Boiler repair (call-out)', 185, 'One-off'));
  all.push(tx('2026-11-20', 'income', 'Other income', 'Work bonus — Daniel', 250));
  return all;
}

export const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
