// HearthLedger charts: hand-built inline SVG, no library, works offline.
// A donut for spending by category, grouped bars with a kept-line for the
// monthly trend, a daily sparkline, a progress ring for goals and a
// stacked bar for the 50/30/20 split. Every chart carries text labels so
// it reads without colour alone.

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

// Donut of category spending. Segments tile the ring exactly (each starts
// where the last ended) with a 1.5px paper gap between neighbours.
export function donutChart(rows, centreTop, centreBottom, size = 230) {
  const total = rows.reduce((a, r) => a + r.spent, 0);
  const cx = size / 2, cy = size / 2, r = size / 2 - 16, w = 32;
  if (total <= 0) {
    return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="No spending yet this month"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#D8D2C4" stroke-width="${w}"/><text x="${cx}" y="${cy - 4}" text-anchor="middle" class="chart-centre">${esc(centreTop)}</text><text x="${cx}" y="${cy + 18}" text-anchor="middle" class="chart-centre-sub">${esc(centreBottom)}</text></svg>`;
  }
  const circ = 2 * Math.PI * r;
  let offset = circ * 0.25; // start at the top
  const segs = rows.filter((x) => x.spent > 0).map((x) => {
    const len = (x.spent / total) * circ;
    const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${x.color}" stroke-width="${w}" stroke-dasharray="${Math.max(0, len - 1.5).toFixed(1)} ${(circ - len + 1.5).toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"><title>${esc(x.name)}: ${money(x.spent)}</title></circle>`;
    offset -= len;
    return seg;
  }).join('');
  return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Spending by category, total ${esc(centreTop)}">${segs}<text x="${cx}" y="${cy - 4}" text-anchor="middle" class="chart-centre">${esc(centreTop)}</text><text x="${cx}" y="${cy + 18}" text-anchor="middle" class="chart-centre-sub">${esc(centreBottom)}</text></svg>`;
}

// Grouped bars (income vs spending) with a line for what was kept.
export function trendChart(series, width = 640, height = 250) {
  const padL = 52, padR = 12, padT = 16, padB = 30;
  const innerW = width - padL - padR, innerH = height - padT - padB;
  const max = Math.max(1000, ...series.flatMap((s) => [s.income, s.spending, s.kept]));
  const step = innerW / series.length;
  const barW = Math.min(24, step / 3.4);
  const y = (v) => padT + innerH - (v / max) * innerH;
  let grid = '';
  for (let i = 0; i <= 4; i += 1) {
    const v = (max / 4) * i, yy = y(v);
    grid += `<line x1="${padL}" y1="${yy}" x2="${width - padR}" y2="${yy}" class="chart-grid"/><text x="${padL - 8}" y="${yy + 4}" text-anchor="end" class="chart-axis">$${Math.round(v / 1000)}k</text>`;
  }
  const bars = series.map((s, i) => {
    const x0 = padL + i * step + step / 2;
    return `<rect x="${(x0 - barW - 2).toFixed(1)}" y="${y(s.income).toFixed(1)}" width="${barW}" height="${(padT + innerH - y(s.income)).toFixed(1)}" rx="3" fill="#5B8C5A"><title>${esc(s.label)} income ${money(s.income)}</title></rect>`
      + `<rect x="${(x0 + 2).toFixed(1)}" y="${y(s.spending).toFixed(1)}" width="${barW}" height="${(padT + innerH - y(s.spending)).toFixed(1)}" rx="3" fill="#C4553B"><title>${esc(s.label)} spending ${money(s.spending)}</title></rect>`
      + `<text x="${x0}" y="${height - 8}" text-anchor="middle" class="chart-axis">${esc(s.label)}</text>`;
  }).join('');
  const pts = series.map((s, i) => `${(padL + i * step + step / 2).toFixed(1)},${y(Math.max(0, s.kept)).toFixed(1)}`).join(' ');
  const dots = series.map((s, i) => `<circle cx="${(padL + i * step + step / 2).toFixed(1)}" cy="${y(Math.max(0, s.kept)).toFixed(1)}" r="3.5" fill="#12403F"><title>${esc(s.label)} kept ${money(s.kept)}</title></circle>`).join('');
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Income versus spending with amount kept, last six months">${grid}${bars}<polyline points="${pts}" fill="none" stroke="#12403F" stroke-width="2.5" stroke-linejoin="round"/>${dots}</svg>`;
}

// Daily spending sparkline for the chosen month, with the month's
// biggest day marked.
export function dailySpark(transactions, monthKey, width = 640, height = 130) {
  const [y, m] = monthKey.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  const perDay = new Array(days).fill(0);
  for (const t of transactions) {
    if (t.kind === 'expense') perDay[Number(t.date.slice(8, 10)) - 1] += t.amount;
  }
  const max = Math.max(50, ...perDay);
  const pad = 8, innerW = width - pad * 2, innerH = height - pad * 2 - 16;
  const x = (i) => pad + (i / (days - 1)) * innerW;
  const yy = (v) => pad + innerH - (v / max) * innerH;
  const pts = perDay.map((v, i) => `${x(i).toFixed(1)},${yy(v).toFixed(1)}`).join(' ');
  const area = `${pad},${pad + innerH} ${pts} ${pad + innerW},${pad + innerH}`;
  const peak = perDay.indexOf(max);
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Daily spending through the month"><polygon points="${area}" fill="#12403F" opacity="0.12"/><polyline points="${pts}" fill="none" stroke="#12403F" stroke-width="2.5" stroke-linejoin="round"/><circle cx="${x(peak).toFixed(1)}" cy="${yy(max).toFixed(1)}" r="4" fill="#C4553B"><title>Biggest day: the ${peak + 1}th, ${money(max)}</title></circle><text x="${pad}" y="${height - 2}" class="chart-axis">1st</text><text x="${width - pad}" y="${height - 2}" text-anchor="end" class="chart-axis">${days}th</text></svg>`;
}

// Progress ring for a savings goal: pct filled, centre shows the percent.
export function progressRing(pct, size = 92) {
  const r = size / 2 - 8, c = size / 2, circ = 2 * Math.PI * r;
  const filled = (Math.min(100, Math.max(0, pct)) / 100) * circ;
  return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="${pct}% saved"><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#EAE3D2" stroke-width="9"/><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#7A8B3D" stroke-width="9" stroke-linecap="round" stroke-dasharray="${filled.toFixed(1)} ${circ.toFixed(1)}" stroke-dashoffset="${(circ * 0.25).toFixed(1)}"/><text x="${c}" y="${c + 6}" text-anchor="middle" class="ring-pct">${pct}%</text></svg>`;
}

// One stacked horizontal bar: needs / wants / savings shares of income,
// with whatever income is still unallocated shown as its own pale segment
// so the bar always spans the whole income.
export function splitBar(groups) {
  const parts = [
    { key: 'needs', label: 'Needs', color: '#12403F' },
    { key: 'wants', label: 'Wants', color: '#D9932E' },
    { key: 'savings', label: 'Savings', color: '#7A8B3D' },
  ];
  const assigned = parts.reduce((a, p) => a + groups[p.key].targetPct, 0);
  const unallocated = Math.max(0, 100 - assigned);
  const scale = assigned > 100 ? 100 / assigned : 1;
  const segs = parts.map((p) => {
    const pct = groups[p.key].targetPct;
    return `<span class="split-seg" style="width:${(pct * scale).toFixed(1)}%;background:${p.color}" title="${p.label}: ${pct}% of income"><span class="split-label">${p.label} ${pct}%</span></span>`;
  }).join('') + (unallocated > 0
    ? `<span class="split-seg split-unalloc" style="width:${unallocated}%" title="Unallocated: ${unallocated}% of income"><span class="split-label">Unallocated ${unallocated}%</span></span>`
    : '');
  return `<div class="split-bar" role="img" aria-label="Budget targets split: needs ${groups.needs.targetPct} percent, wants ${groups.wants.targetPct} percent, savings ${groups.savings.targetPct} percent, unallocated ${unallocated} percent of income">${segs}</div>`;
}
