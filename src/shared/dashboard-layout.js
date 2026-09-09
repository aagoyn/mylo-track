export const DASHBOARD_CSS = `
  * { box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 24px 16px 48px; }
  .container { max-width: 720px; margin: 0 auto; }
  header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px 16px; margin-bottom: 24px; }
  h1 { font-size: 20px; margin: 0; display: flex; align-items: center; gap: 8px; }
  .header-icon { width: 28px; height: 28px; object-fit: contain; border-radius: 6px; flex-shrink: 0; }
  h2 { font-size: 15px; color: #94a3b8; margin: 32px 0 8px; text-transform: uppercase; letter-spacing: .05em; }
  .nav-links { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  a.nav-link, a.logout { color: #94a3b8; font-size: 13px; text-decoration: none; }
  a.nav-link:hover, a.logout:hover { color: #e2e8f0; }
  .subnav { display: flex; gap: 8px; flex-wrap: wrap; margin: -8px 0 20px; }
  .subnav a { padding: 6px 12px; border-radius: 999px; background: #1e293b; color: #94a3b8; font-size: 13px; text-decoration: none; }
  .subnav a:hover { background: #334155; color: #e2e8f0; }
  .subnav a.active { background: #6366f1; color: white; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; }
  .macro-cards { grid-template-columns: repeat(4, 1fr); margin-top: 12px; }
  @media (max-width: 520px) { .macro-cards { grid-template-columns: repeat(2, 1fr); } }
  .card { background: #1e293b; border-radius: 12px; padding: 14px 16px; }
  a.card { display: block; color: inherit; text-decoration: none; }
  a.card:hover { background: #253347; }
  .card-label { font-size: 12px; color: #94a3b8; margin-bottom: 4px; }
  .card-value { font-size: 18px; font-weight: 600; overflow-wrap: break-word; }
  .card-value.card-value-compact { font-size: 15px; }
  .card-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 12px; overflow: hidden; }
  th, td { text-align: left; padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #334155; }
  th { color: #94a3b8; font-weight: 500; }
  tr:last-child td { border-bottom: none; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 560px) { .grid-2 { grid-template-columns: 1fr; } }
  .flash { padding: 12px 16px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; overflow-wrap: break-word; word-break: break-word; }
  .flash-success { background: #14532d; color: #bbf7d0; }
  .flash-error { background: #450a0a; color: #fecaca; }
  .forms { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; align-items: start; }
  .form-card { background: #1e293b; border-radius: 12px; padding: 16px; }
  .form-card h3 { font-size: 13px; color: #94a3b8; margin: 0 0 10px; font-weight: 500; }
  .form-card > summary { cursor: pointer; font-size: 13px; color: #94a3b8; font-weight: 500; list-style: none; margin-bottom: 10px; }
  .form-card > summary::-webkit-details-marker { display: none; }
  .form-card > summary::before { content: "▸ "; color: #64748b; }
  .form-card[open] > summary::before { content: "▾ "; }
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

  .hub-greeting { font-size: 22px; font-weight: 600; margin: 0 0 2px; }
  .hub-date { font-size: 13px; color: #94a3b8; margin: 0 0 4px; }
  .hub-sub { font-size: 13px; color: #64748b; margin: 0 0 20px; }
  .empty-state { font-size: 13px; color: #64748b; }
  .empty-state a { color: #818cf8; text-decoration: none; }
  .empty-state a:hover { text-decoration: underline; }
  .activity-list { display: flex; flex-direction: column; gap: 8px; }
  .activity-row { display: flex; align-items: center; gap: 12px; background: #1e293b; border-radius: 12px; padding: 10px 14px; }
  .activity-icon { font-size: 18px; }
  .activity-main { flex: 1; min-width: 0; }
  .activity-title { font-size: 13px; font-weight: 500; }
  .activity-subtitle { font-size: 12px; color: #94a3b8; }
  .activity-time { font-size: 12px; color: #64748b; white-space: nowrap; }
  .hub-nav-group { margin-bottom: 20px; }
  .hub-nav-links { display: flex; flex-direction: column; gap: 6px; }
  a.hub-nav-item { display: block; background: #1e293b; border-radius: 10px; padding: 10px 14px; color: #e2e8f0; text-decoration: none; font-size: 14px; }
  a.hub-nav-item:hover { background: #334155; }

  .mood-picker { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
  .mood-picker input[type="radio"] { position: absolute; opacity: 0; width: 1px; height: 1px; }
  .mood-picker label { display: flex; align-items: center; justify-content: center; width: 52px; height: 52px; border-radius: 12px; background: #0f172a; border: 2px solid #334155; font-size: 24px; cursor: pointer; }
  .mood-picker input[type="radio"]:checked + label { border-color: #6366f1; background: #312e81; }
  .mood-today .card-value { font-size: 22px; }
  .mood-today .card-note { font-size: 13px; color: #94a3b8; font-style: italic; margin-top: 4px; }

  .calendar-nav { display: flex; align-items: center; justify-content: space-between; margin: 8px 0 12px; }
  .calendar-nav a { color: #94a3b8; text-decoration: none; font-size: 13px; }
  .calendar-nav a:hover { color: #e2e8f0; }
  .calendar-nav .calendar-label { font-size: 14px; font-weight: 600; }
  .mood-calendar { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; max-width: 100%; }
  .mood-calendar .dow { font-size: 11px; color: #64748b; text-align: center; padding-bottom: 4px; }
  a.mood-cell { display: flex; align-items: center; justify-content: center; aspect-ratio: 1 / 1; border-radius: 6px; background: #1e293b; font-size: 14px; text-decoration: none; border: 2px solid transparent; color: #e2e8f0; }
  a.mood-cell.mood-empty { background: #334155; color: #64748b; }
  a.mood-cell.mood-selected { border-color: #e2e8f0; }
  a.mood-cell.mood-terrible { background: #ef444455; }
  a.mood-cell.mood-bad { background: #f9731655; }
  a.mood-cell.mood-okay { background: #eab30855; }
  a.mood-cell.mood-good { background: #22c55e55; }
  a.mood-cell.mood-great { background: #06b6d455; }
  .mood-legend { display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: #94a3b8; margin-top: 10px; }
  .mood-legend span { display: inline-flex; align-items: center; gap: 4px; }
  .streak-row { display: flex; gap: 12px; margin-top: 12px; }
  .day-detail { background: #1e293b; border-radius: 12px; padding: 14px 16px; margin-top: 12px; font-size: 13px; }
  .mood-history-item { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid #334155; font-size: 13px; }
  .mood-history-item:last-child { border-bottom: none; }

  textarea, select {
    width: 100%; padding: 9px 10px; border-radius: 8px; border: 1px solid #334155;
    background: #0f172a; color: #e2e8f0; box-sizing: border-box; font-size: 14px; margin-bottom: 8px;
    font-family: inherit;
  }
  textarea { resize: vertical; min-height: 90px; }

  .journal-entry { background: #1e293b; border-radius: 12px; padding: 16px; white-space: pre-wrap; font-size: 14px; margin-bottom: 8px; }
  .journal-history-item { padding: 10px 0; border-bottom: 1px solid #334155; }
  .journal-history-item:last-child { border-bottom: none; }
  a.journal-history-date { font-size: 13px; font-weight: 500; color: #e2e8f0; text-decoration: none; }
  a.journal-history-date:hover { color: #818cf8; }
  .journal-history-preview { font-size: 13px; color: #94a3b8; margin-top: 2px; overflow-wrap: break-word; }

  .wishlist-list { display: flex; flex-direction: column; gap: 10px; }
  .wishlist-item { background: #1e293b; border-radius: 12px; padding: 14px 16px; }
  .wishlist-item-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
  .wishlist-title { font-size: 15px; font-weight: 600; }
  .wishlist-meta { font-size: 12px; color: #94a3b8; margin-bottom: 8px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; }
  .priority-low { background: #33415555; color: #94a3b8; }
  .priority-medium { background: #eab30833; color: #eab308; }
  .priority-high { background: #ef444433; color: #ef4444; }
  .status-badge { background: #33415555; color: #cbd5e1; }
  .wishlist-item-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; align-items: end; }
  .wishlist-item-form textarea, .wishlist-item-form select, .wishlist-item-form input { margin-bottom: 0; }
  .wishlist-item-form input[type="text"], .wishlist-item-form input[type="number"] {
    width: 100%; padding: 9px 10px; border-radius: 8px; border: 1px solid #334155;
    background: #0f172a; color: #e2e8f0; box-sizing: border-box; font-size: 14px;
  }
  .wishlist-item-form button { padding: 9px 10px; border-radius: 8px; border: none; background: #6366f1; color: white; font-size: 13px; cursor: pointer; }
  .wishlist-item-form button:hover { background: #4f46e5; }
  .delete-form button { background: transparent; border: 1px solid #ef444455; color: #ef4444; padding: 6px 10px; border-radius: 8px; font-size: 12px; cursor: pointer; }
  .delete-form button:hover { background: #ef444422; }

  .danger-zone { margin-top: 20px; padding-top: 16px; border-top: 1px solid #334155; }

  .upload-progress { margin-top: 8px; height: 6px; border-radius: 999px; background: #334155; overflow: hidden; position: relative; }
  .upload-progress-bar { position: absolute; top: 0; left: -40%; height: 100%; width: 40%; background: #6366f1; border-radius: 999px; animation: upload-progress-slide 1.1s ease-in-out infinite; }
  @keyframes upload-progress-slide {
    0% { left: -40%; }
    100% { left: 100%; }
  }

  label { display: block; font-size: 11px; color: #94a3b8; margin-bottom: 3px; }

  .log-item { background: #1e293b; border-radius: 12px; margin-bottom: 8px; overflow: hidden; }
  .log-item summary { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; list-style: none; }
  .log-item summary::-webkit-details-marker { display: none; }
  .log-item summary::before { content: "▸"; color: #64748b; font-size: 18px; flex-shrink: 0; transition: transform 0.15s ease; }
  .log-item[open] summary::before { transform: rotate(90deg); }
  .log-time { font-size: 12px; color: #64748b; white-space: nowrap; }
  .log-name { flex: 1; min-width: 0; overflow-wrap: break-word; font-size: 13px; }
  .log-calories { font-size: 13px; color: #94a3b8; white-space: nowrap; }
  .log-detail-body { padding: 4px 14px 14px; border-top: 1px solid #334155; }
  .log-item-row { padding: 10px 0; border-bottom: 1px solid #334155; }
  .log-item-row:last-child { border-bottom: none; }
  .log-item-info { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; }
  .item-edit-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; align-items: end; }
  .item-edit-row input[type="number"] {
    width: 100%; padding: 9px 10px; border-radius: 8px; border: 1px solid #334155;
    background: #0f172a; color: #e2e8f0; box-sizing: border-box; font-size: 14px;
  }
  .item-edit-row button { padding: 9px 10px; border-radius: 8px; border: none; background: #6366f1; color: white; font-size: 13px; cursor: pointer; }
  .item-edit-row button:hover { background: #4f46e5; }

  .inline-icon { width: 16px; height: 16px; object-fit: contain; vertical-align: middle; margin-right: 4px; margin-top: -2px; border-radius: 3px; }
  .logout { display: inline-flex; align-items: center; }
  .logout .inline-icon { width: 20px; height: 20px; margin-top: 0; margin-right: 3px; }

  .stat-bar { height: 14px; border-radius: 999px; background: #334155; overflow: hidden; margin: 6px 0 4px; }
  .stat-bar-fill { height: 100%; border-radius: 999px; transition: width 0.3s ease; }
  .stat-bar-fill.tier-high { background: #22c55e; }
  .stat-bar-fill.tier-mid { background: #eab308; }
  .stat-bar-fill.tier-low { background: #ef4444; }
  .stat-bar-fill.tier-empty { background: #7f1d1d; }

  .button-row { display: flex; gap: 8px; }
  .button-row button { width: 100%; }

  .inline-toggle { margin-top: 8px; }
  .inline-toggle > summary { cursor: pointer; font-size: 12px; color: #64748b; list-style: none; }
  .inline-toggle > summary::-webkit-details-marker { display: none; }
  .inline-toggle > summary::before { content: "▸ "; }
  .inline-toggle[open] > summary::before { content: "▾ "; }
  .inline-toggle-body { margin-top: 8px; display: flex; flex-direction: column; gap: 8px; }

  .routine-block { background: #1e293b; border-radius: 12px; padding: 14px 16px; margin-bottom: 12px; }
  .routine-block h3 { margin: 0 0 10px; font-size: 14px; }
  .routine-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  .routine-steps li { display: flex; align-items: baseline; gap: 8px; font-size: 14px; }
  .routine-steps .step-num { color: #64748b; font-size: 12px; width: 16px; flex-shrink: 0; }
  .routine-steps .step-optional { color: #94a3b8; font-style: italic; }
  .routine-steps .step-tag { font-size: 11px; color: #64748b; }
  .choice-box { background: #0f172a; border: 1px dashed #6366f1; border-radius: 10px; padding: 10px 12px; margin-top: 8px; font-size: 13px; }
  .choice-box .choice-options { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
  .choice-box button { padding: 7px 12px; border-radius: 8px; border: none; background: #6366f1; color: white; font-size: 13px; cursor: pointer; }
  .choice-box button:hover { background: #4f46e5; }
  .conflict-banner { background: #451a03; color: #fdba74; border-radius: 10px; padding: 12px 14px; margin-bottom: 16px; font-size: 13px; }

  .ai-suggestion-card { background: #1e293b; border: 1px solid #6366f133; border-radius: 12px; padding: 16px; margin-bottom: 14px; }
  .ai-suggestion-card .ai-badge { display: inline-block; font-size: 11px; color: #a5b4fc; background: #312e81; padding: 2px 8px; border-radius: 999px; margin-bottom: 8px; }
  .ai-suggestion-card .ai-reasoning { font-size: 13px; color: #cbd5e1; background: #0f172a; border-radius: 8px; padding: 10px 12px; margin: 10px 0; }
  .ai-suggestion-card .ai-warning { font-size: 12px; color: #fdba74; margin-top: 6px; }
  .approved-badge { display: inline-block; font-size: 11px; color: #86efac; background: #14532d; padding: 2px 8px; border-radius: 999px; }

  .field-group { margin-bottom: 12px; }
  .field-group .field-label { font-size: 12px; color: #94a3b8; margin-bottom: 6px; font-weight: 500; }
  .radio-row, .checkbox-row { display: flex; gap: 14px; flex-wrap: wrap; font-size: 13px; }
  .radio-row label, .checkbox-row label { display: flex; align-items: center; gap: 5px; color: #e2e8f0; font-size: 13px; margin: 0; }
  .day-checkboxes { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
  .day-checkboxes label { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 11px; color: #94a3b8; }
  .relationship-list { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
  .relationship-list label { display: flex; align-items: flex-start; gap: 6px; font-size: 13px; color: #e2e8f0; }
  .relationship-list .rel-reason { color: #64748b; font-size: 12px; }

  .rule-card { background: #1e293b; border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; }
  .rule-card .rule-title { font-weight: 600; font-size: 14px; margin-bottom: 6px; }
  .rule-card .rule-facts { display: flex; gap: 10px; flex-wrap: wrap; font-size: 13px; color: #cbd5e1; margin-bottom: 6px; }
  .rule-card .rule-note { font-size: 12px; color: #94a3b8; }
  .rule-card .rule-actions { display: flex; gap: 8px; margin-top: 8px; }
  .rule-card .rule-actions button { padding: 6px 10px; border-radius: 8px; border: 1px solid #334155; background: transparent; color: #cbd5e1; font-size: 12px; cursor: pointer; }
  .rule-card .rule-actions button:hover { background: #334155; }

  .product-table-wrap { overflow-x: auto; }
  .recovery-banner { background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 10px 12px; margin-bottom: 10px; font-size: 12px; color: #94a3b8; }
`;

export function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// icon kecil inline sebelum teks label (section header, card-label, dst), pakai file PNG
// yang sama konvensinya kayak faviconLink - path ke public/icons
export function iconLabel(iconPath, text) {
  return `<img class="inline-icon" src="${iconPath}" alt="">${text}`;
}

// bar generik (HP budget, "affection" Mylo, dst) - warnanya otomatis ijo/kuning/merah/gelap
// berdasarkan persentase, dipakai bareng buat beberapa fitur biar konsisten
export function statBarHtml(pct) {
  const clamped = Math.max(0, Math.min(100, pct));
  const tier = clamped <= 0 ? "tier-empty" : clamped < 20 ? "tier-low" : clamped < 50 ? "tier-mid" : "tier-high";
  return `<div class="stat-bar"><div class="stat-bar-fill ${tier}" style="width:${clamped}%"></div></div>`;
}

// path ke file PNG di public/icons (di-serve static lewat express.static di server.js)
export function faviconLink(iconPath) {
  return `<link rel="icon" type="image/png" href="${iconPath}">`;
}

// header dashboard dengan nav-link ke dashboard "pasangan" (same-origin sekarang, bukan cross-app URL lagi)
// icon: path ke PNG di public/icons (sama yang dipakai buat faviconLink halaman itu)
export function navHeader({ icon, title, links = [] }) {
  const linksHtml = links
    .map((l) => `<a class="nav-link" href="${l.href}">${l.label}</a>`)
    .join("");
  return `<header>
      <h1><img class="header-icon" src="${icon}" alt="">${title}</h1>
      <div class="nav-links">
        ${linksHtml}
        <a class="logout" href="/logout">${iconLabel("/icons/exit.png", "Log out")}</a>
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
