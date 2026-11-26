// HearthLedger charts: hand-built inline SVG (no library, works offline).
// A donut for spending by category, bars for the monthly trend, and a
// sparkline of daily spending. Every chart carries text labels so it reads
// without colour alone.

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Donut of category spending. `rows` = [{name, color, spent}], centre shows the total.
export function donutChart(rows, centreTop, centreBottom, size = 220) {
  const total = rows.reduce((a, r) => a + r.spent, 0);
  const cx = size / 2, cy = size / 2, r = size / 2 - 14, w = 30;
  if (total <= 0) {
    return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="No spending yet this month"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#D8D2C4" stroke-width="${w}"/><text x="${cx}" y="${cy - 4}" text-anchor="middle" class="chart-centre">${esc(centreTop)}</text><text x="${cx}" y="${cy + 18}" text-anchor="middle" class="chart-centre-sub">${esc(centreBottom)}</text></svg>`;
  }
  const circ = 2 * Math.PI * r;
  let offset = circ * 0.25; // start at the top
  const segs = rows.filter((x) => x.spent > 0).map((x) => {
    const len = (x.spent / total) * circ;
    const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${x.color}" stroke-width="${w}" stroke-dasharray="${Math.max(0, len - 2).toFixed(1)} ${circ.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"><title>${esc(x.name)}: $${Math.round(x.spent).toLocaleString('en-US')}</title></circle>`;
    offset -= len;
    return seg;
  }).join('');
  return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Spending by category, total ${esc(centreTop)}">${segs}<text x="${cx}" y="${cy - 4}" text-anchor="middle" class="chart-centre">${esc(centreTop)}</text><text x="${cx}" y="${cy + 18}" text-anchor="middle" class="chart-centre-sub">${esc(centreBottom)}</text></svg>`;
}

// Grouped bars: income vs spending per month, with a value axis.
export function trendChart(series, width = 640, height = 240) {
  const padL = 52, padR = 12, padT = 14, padB = 30;
  const innerW = width - padL - padR, innerH = height - padT - padB;
  const max = Math.max(1000, ...series.flatMap((s) => [s.income, s.spending]));
  const step = innerW / series.length;
  const barW = Math.min(26, step / 3);
  const y = (v) => padT + innerH - (v / max) * innerH;
  let grid = '';
  for (let i = 0; i <= 4; i += 1) {
    const v = (max / 4) * i, yy = y(v);
    grid += `<line x1="${padL}" y1="${yy}" x2="${width - padR}" y2="${yy}" class="chart-grid"/><text x="${padL - 8}" y="${yy + 4}" text-anchor="end" class="chart-axis">$${Math.round(v / 1000)}k</text>`;
  }
  const bars = series.map((s, i) => {
    const x0 = padL + i * step + step / 2;
    return `<rect x="${(x0 - barW - 2).toFixed(1)}" y="${y(s.income).toFixed(1)}" width="${barW}" height="${(padT + innerH - y(s.income)).toFixed(1)}" rx="3" fill="#5B8C5A"><title>${esc(s.label)} income $${Math.round(s.income).toLocaleString('en-US')}</title></rect>`
      + `<rect x="${(x0 + 2).toFixed(1)}" y="${y(s.spending).toFixed(1)}" width="${barW}" height="${(padT + innerH - y(s.spending)).toFixed(1)}" rx="3" fill="#C4553B"><title>${esc(s.label)} spending $${Math.round(s.spending).toLocaleString('en-US')}</title></rect>`
      + `<text x="${x0}" y="${height - 8}" text-anchor="middle" class="chart-axis">${esc(s.label)}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Income versus spending, last six months">${grid}${bars}</svg>`;
}

// Daily spending sparkline for the chosen month.
export function dailySpark(transactions, monthKey, width = 640, height = 120) {
  const [y, m] = monthKey.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  const perDay = new Array(days).fill(0);
  for (const t of transactions) {
    if (t.kind === 'expense') perDay[Number(t.date.slice(8, 10)) - 1] += t.amount;
  }
  const max = Math.max(50, ...perDay);
  const pad = 8, innerW = width - pad * 2, innerH = height - pad * 2 - 14;
  const pts = perDay.map((v, i) => `${(pad + (i / (days - 1)) * innerW).toFixed(1)},${(pad + innerH - (v / max) * innerH).toFixed(1)}`).join(' ');
  const area = `${pad},${pad + innerH} ${pts} ${pad + innerW},${pad + innerH}`;
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Daily spending through the month"><polygon points="${area}" fill="#123B3C" opacity="0.12"/><polyline points="${pts}" fill="none" stroke="#123B3C" stroke-width="2.5" stroke-linejoin="round"/><text x="${pad}" y="${height - 2}" class="chart-axis">1st</text><text x="${width - pad}" y="${height - 2}" text-anchor="end" class="chart-axis">${days}th</text></svg>`;
}
