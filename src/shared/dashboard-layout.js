export const DASHBOARD_CSS = `
  * { box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 24px 16px 48px; }
  .container { max-width: 720px; margin: 0 auto; }
  header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  h1 { font-size: 20px; margin: 0; }
  h2 { font-size: 15px; color: #94a3b8; margin: 32px 0 8px; text-transform: uppercase; letter-spacing: .05em; }
  .nav-links { display: flex; align-items: center; gap: 16px; }
  a.nav-link, a.logout { color: #94a3b8; font-size: 13px; text-decoration: none; }
  a.nav-link:hover, a.logout:hover { color: #e2e8f0; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; }
  .macro-cards { grid-template-columns: repeat(3, 1fr); margin-top: 12px; }
  @media (max-width: 420px) { .macro-cards { grid-template-columns: 1fr; } }
  .card { background: #1e293b; border-radius: 12px; padding: 14px 16px; }
  .card-label { font-size: 12px; color: #94a3b8; margin-bottom: 4px; }
  .card-value { font-size: 18px; font-weight: 600; overflow-wrap: break-word; }
  .card-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 12px; overflow: hidden; }
  th, td { text-align: left; padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #334155; }
  th { color: #94a3b8; font-weight: 500; }
  tr:last-child td { border-bottom: none; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 560px) { .grid-2 { grid-template-columns: 1fr; } }
  .flash { padding: 12px 16px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; }
  .flash-success { background: #14532d; color: #bbf7d0; }
  .flash-error { background: #450a0a; color: #fecaca; }
  .forms { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
  .form-card { background: #1e293b; border-radius: 12px; padding: 16px; }
  .form-card h3 { font-size: 13px; color: #94a3b8; margin: 0 0 10px; font-weight: 500; }
  .form-card input[type="text"], .form-card input[type="number"] {
    width: 100%; padding: 9px 10px; border-radius: 8px; border: 1px solid #334155;
    background: #0f172a; color: #e2e8f0; box-sizing: border-box; font-size: 14px; margin-bottom: 8px;
  }
  .form-card input[type="file"] { width: 100%; font-size: 12px; color: #94a3b8; margin-bottom: 8px; }
  .form-card button {
    width: 100%; padding: 9px 10px; border-radius: 8px; border: none;
    background: #6366f1; color: white; font-size: 13px; cursor: pointer;
  }
  .form-card button:hover { background: #4f46e5; }
  .chart-card { background: #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
`;

export function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// header dashboard dengan nav-link ke dashboard "pasangan" (same-origin sekarang, bukan cross-app URL lagi)
export function navHeader({ icon, title, links = [] }) {
  const linksHtml = links
    .map((l) => `<a class="nav-link" href="${l.href}">${l.label}</a>`)
    .join("");
  return `<header>
      <h1>${icon} ${title}</h1>
      <div class="nav-links">
        ${linksHtml}
        <a class="logout" href="/logout">Keluar</a>
      </div>
    </header>`;
}

// stacked bar chart simpel via inline SVG, nggak butuh library chart eksternal.
// days: [{ label, values: { seriesKey: number } }], series: [{ key, name, color }]
export function stackedBarChartSvg(
  days,
  series,
  { formatValue = (v) => Math.round(v), itemsPerRow = 4 } = {}
) {
  const width = 640;
  const barAreaHeight = 90;
  const barBaseline = 100;
  const dayLabelY = barBaseline + 16;
  const legendRows = Math.max(1, Math.ceil(series.length / itemsPerRow));
  const legendStartY = dayLabelY + 14;
  const height = legendStartY + legendRows * 16 + 6;

  const totals = days.map((d) => series.reduce((sum, s) => sum + (d.values[s.key] || 0), 0));
  const max = Math.max(1, ...totals);
  const barWidth = width / days.length;

  const bars = days
    .map((d, i) => {
      const x = i * barWidth + barWidth * 0.15;
      const w = barWidth * 0.7;
      let yCursor = barBaseline;
      const segs = series
        .map((s) => {
          const v = d.values[s.key] || 0;
          if (!v) return "";
          const segHeight = (v / max) * barAreaHeight;
          const y = yCursor - segHeight;
          yCursor = y;
          return `<rect x="${x}" y="${y.toFixed(1)}" width="${w}" height="${segHeight.toFixed(1)}" fill="${s.color}" />`;
        })
        .join("");
      const total = totals[i];
      return `
        ${total > 0 ? `<text x="${x + w / 2}" y="${Math.max(10, yCursor - 4)}" font-size="9" fill="#e2e8f0" text-anchor="middle">${formatValue(total)}</text>` : ""}
        ${segs}
        <text x="${x + w / 2}" y="${dayLabelY}" font-size="10" fill="#94a3b8" text-anchor="middle">${d.label}</text>
      `;
    })
    .join("");

  const legend = series
    .map((s, i) => {
      const col = i % itemsPerRow;
      const row = Math.floor(i / itemsPerRow);
      const x = Math.round(4 + col * (width / itemsPerRow));
      const y = legendStartY + row * 16;
      return `
        <rect x="${x}" y="${y - 8}" width="9" height="9" fill="${s.color}" rx="2" />
        <text x="${x + 13}" y="${y}" font-size="9" fill="#94a3b8">${escapeHtml(s.name)}</text>
      `;
    })
    .join("");

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" role="img" aria-label="Stacked bar chart">${bars}${legend}</svg>`;
}
