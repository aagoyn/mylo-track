export const DASHBOARD_CSS = `
  :root {
    --bg: #f7f4ef;
    --surface: #ffffff;
    --surface-hover: #f1ece4;
    --border: #e9e1d8;
    --border-hover: #ddd1c3;
    --text: #352d29;
    --text-muted: #85786e;
    --text-dim: #a89c8e;
    --accent: #927d6e;
    --accent-hover: #7a6859;
    --accent-light: #7a6859;
    --accent-deep: #ddd1c3;
    --danger: #dc2626;
    --danger-light: #f87171;
    --danger-dark: #b91c1c;
    --danger-bg: #fee2e2;
    --danger-text: #991b1b;
    --success: #16a34a;
    --success-dark: #15803d;
    --success-bg: #dcfce7;
    --success-text: #166534;
    --warning: #b45309;
    --warning-hover: #92400e;
  }
  /* Warm Graphite (dark theme) - follows OS preference by default, overridden by the manual toggle */
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #211f1d;
      --surface: #2b2927;
      --surface-hover: #353230;
      --border: #413d39;
      --border-hover: #544f49;
      --text: #f2ede7;
      --text-muted: #a89c8e;
      --text-dim: #786b5f;
      --accent: #c49a76;
      --accent-hover: #d9b08c;
      --accent-light: #d9b08c;
      --accent-deep: #413427;
      --danger: #f87171;
      --danger-light: #fca5a5;
      --danger-dark: #b91c1c;
      --danger-bg: #450a0a;
      --danger-text: #fecaca;
      --success: #4ade80;
      --success-dark: #16a34a;
      --success-bg: #14532d;
      --success-text: #bbf7d0;
      --warning: #fbbf24;
      --warning-hover: #f59e0b;
    }
  }
  :root[data-theme="dark"] {
    --bg: #211f1d;
    --surface: #2b2927;
    --surface-hover: #353230;
    --border: #413d39;
    --border-hover: #544f49;
    --text: #f2ede7;
    --text-muted: #a89c8e;
    --text-dim: #786b5f;
    --accent: #c49a76;
    --accent-hover: #d9b08c;
    --accent-light: #d9b08c;
    --accent-deep: #413427;
    --danger: #f87171;
    --danger-light: #fca5a5;
    --danger-dark: #b91c1c;
    --danger-bg: #450a0a;
    --danger-text: #fecaca;
    --success: #4ade80;
    --success-dark: #16a34a;
    --success-bg: #14532d;
    --success-text: #bbf7d0;
    --warning: #fbbf24;
    --warning-hover: #f59e0b;
  }
  .theme-toggle { border: none; background: transparent; padding: 0; cursor: pointer; line-height: 0; flex-shrink: 0; }
  .theme-toggle-track {
    display: inline-flex; align-items: center; width: 40px; height: 22px; border-radius: 999px;
    background: var(--border); position: relative; transition: background .2s ease;
  }
  .theme-toggle-thumb {
    position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%;
    background: var(--surface); box-shadow: 0 1px 3px rgba(0,0,0,.3);
    display: flex; align-items: center; justify-content: center; font-size: 10px;
    transition: transform .2s ease, background .2s ease;
  }
  [data-theme="dark"] .theme-toggle-track { background: var(--accent); }
  [data-theme="dark"] .theme-toggle-thumb { transform: translateX(18px); background: var(--surface); }
  * { box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 24px 16px 48px; }
  .container { max-width: 720px; margin: 0 auto; }
  header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px 16px; margin-bottom: 24px; }
  h1 { font-size: 20px; margin: 0; display: flex; align-items: center; gap: 8px; }
  .header-icon { width: 28px; height: 28px; object-fit: contain; border-radius: 6px; flex-shrink: 0; }
  h2 { font-size: 15px; color: var(--text-muted); margin: 32px 0 8px; text-transform: uppercase; letter-spacing: .05em; }
  .nav-links { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  a.nav-link, a.logout { color: var(--text-muted); font-size: 13px; text-decoration: none; }
  a.nav-link:hover, a.logout:hover { color: var(--text); }
  .subnav { display: flex; gap: 8px; flex-wrap: wrap; margin: -8px 0 20px; }
  .subnav a { padding: 6px 12px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border); color: var(--text-muted); font-size: 13px; text-decoration: none; }
  .subnav a:hover { background: var(--surface-hover); color: var(--text); }
  .subnav a.active { background: var(--accent); border-color: var(--accent); color: white; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; }
  .macro-cards { grid-template-columns: repeat(4, 1fr); margin-top: 12px; }
  @media (max-width: 520px) { .macro-cards { grid-template-columns: repeat(2, 1fr); } }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; }
  a.card { display: block; color: inherit; text-decoration: none; }
  a.card:hover { background: var(--surface-hover); }
  .card-label { font-size: 12px; color: var(--text-muted); margin-bottom: 4px; }
  .card-value { font-size: 18px; font-weight: 600; overflow-wrap: break-word; }
  .card-value.card-value-compact { font-size: 15px; }
  .card-sub { font-size: 12px; color: var(--text-dim); margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
  th, td { text-align: left; padding: 10px 14px; font-size: 13px; border-bottom: 1px solid var(--border); }
  th.nowrap, td.nowrap { white-space: nowrap; }
  th { color: var(--text-muted); font-weight: 500; }
  tr:last-child td { border-bottom: none; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 560px) { .grid-2 { grid-template-columns: 1fr; } }
  .grid-2-always { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .flash { padding: 12px 16px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; overflow-wrap: break-word; word-break: break-word; }
  .flash-success { background: var(--success-bg); color: var(--success-text); }
  .flash-error { background: var(--danger-bg); color: var(--danger-text); }
  .forms { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; align-items: start; }
  .form-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
  .form-card h3 { font-size: 13px; color: var(--text-muted); margin: 0 0 10px; font-weight: 500; }
  .form-card > summary { cursor: pointer; font-size: 13px; color: var(--text-muted); font-weight: 500; list-style: none; margin-bottom: 10px; }
  .form-card > summary::-webkit-details-marker { display: none; }
  .form-card > summary::before { content: "▸ "; color: var(--text-dim); }
  .form-card[open] > summary::before { content: "▾ "; }
  .form-card input[type="text"], .form-card input[type="number"], .form-card input[type="date"],
  .ai-suggestion-card input[type="text"], .ai-suggestion-card input[type="number"],
  .inline-toggle-body input[type="text"], .inline-toggle-body input[type="number"], .inline-toggle-body input[type="date"] {
    width: 100%; padding: 9px 10px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--bg); color: var(--text); box-sizing: border-box; font-size: 14px; margin-bottom: 8px;
  }
  .form-card input[type="file"] {
    width: 100%; padding: 9px 10px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--bg); box-sizing: border-box; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;
  }
  .form-card button, .inline-toggle-body button {
    width: 100%; padding: 9px 10px; border-radius: 8px; border: none;
    background: var(--accent); color: white; font-size: 13px; cursor: pointer;
  }
  .form-card button:hover, .inline-toggle-body button:hover { background: var(--accent-hover); }

  .sport-tile-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(72px, 1fr)); gap: 8px; }
  .sport-tile {
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
    width: 100%; box-sizing: border-box; padding: 12px 6px; border-radius: 14px; border: 1px solid var(--border);
    background: var(--surface); color: var(--text); text-decoration: none; font-size: 12px; font-weight: 500;
    text-align: center; cursor: pointer; font-family: inherit;
  }
  .sport-tile:hover { background: var(--surface-hover); border-color: var(--border-hover); }
  .sport-tile img { width: 26px; height: 26px; object-fit: contain; border-radius: 6px; }
  .sport-tile-emoji { font-size: 22px; line-height: 1; }

  .form-card > summary.sport-form-summary {
    display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 600; color: var(--text);
  }
  .form-card > summary.sport-form-summary::before { content: ""; }
  .sport-form-summary::after { content: "▾"; margin-left: auto; color: var(--text-dim); font-size: 11px; transition: transform .15s ease; }
  .form-card[open] > summary.sport-form-summary::after { transform: rotate(180deg); }
  .sport-form-summary-icon {
    width: 30px; height: 30px; object-fit: contain; border-radius: 8px; flex-shrink: 0;
    background: var(--accent-deep); padding: 5px; box-sizing: border-box;
  }
  .chart-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 12px; }

  .hub-greeting { font-size: 22px; font-weight: 600; margin: 0 0 2px; }
  .hub-date { font-size: 13px; color: var(--text-muted); margin: 0 0 4px; }
  .hub-sub { font-size: 13px; color: var(--text-dim); margin: 0 0 20px; }
  .empty-state { font-size: 13px; color: var(--text-dim); }
  .empty-state a { color: var(--accent-light); text-decoration: none; }
  .empty-state a:hover { text-decoration: underline; }
  .activity-list { display: flex; flex-direction: column; gap: 8px; }
  .activity-row { display: flex; align-items: center; gap: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 10px 14px; }
  .activity-icon { font-size: 18px; }
  .activity-main { flex: 1; min-width: 0; }
  .activity-title { font-size: 13px; font-weight: 500; }
  .activity-subtitle { font-size: 12px; color: var(--text-muted); }
  .activity-time { font-size: 12px; color: var(--text-dim); white-space: nowrap; }
  .hub-nav-group { margin-bottom: 20px; }
  .hub-nav-links { display: flex; flex-direction: column; gap: 6px; }
  a.hub-nav-item { display: block; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; color: var(--text); text-decoration: none; font-size: 14px; }
  a.hub-nav-item:hover { background: var(--surface-hover); }

  .mood-picker { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
  .mood-picker input[type="radio"] { position: absolute; opacity: 0; width: 1px; height: 1px; }
  .mood-picker label { display: flex; align-items: center; justify-content: center; width: 52px; height: 52px; border-radius: 12px; background: var(--bg); border: 2px solid var(--border); font-size: 24px; cursor: pointer; }
  .mood-picker input[type="radio"]:checked + label { border-color: var(--accent); background: var(--accent-deep); }
  .mood-note-row { display: flex; gap: 8px; align-items: stretch; }
  .mood-note-row input[type="text"] { flex: 7; width: auto; margin-bottom: 0; }
  .mood-note-row button { flex: 3; width: auto; margin-bottom: 0; }
  .mood-today .card-value { font-size: 22px; }
  .mood-today .card-note { font-size: 13px; color: var(--text-muted); font-style: italic; margin-top: 4px; }

  .calendar-nav { display: flex; align-items: center; justify-content: space-between; margin: 8px 0 12px; }
  .calendar-nav a { color: var(--text-muted); text-decoration: none; font-size: 13px; }
  .calendar-nav a:hover { color: var(--text); }
  .calendar-nav .calendar-label { font-size: 14px; font-weight: 600; }
  .mood-calendar { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; max-width: 100%; }
  .mood-calendar .dow { font-size: 11px; color: var(--text-dim); text-align: center; padding-bottom: 4px; }
  a.mood-cell { display: flex; align-items: center; justify-content: center; aspect-ratio: 1 / 1; border-radius: 6px; background: var(--surface); border: 1px solid var(--border); font-size: 14px; text-decoration: none; color: var(--text); }
  a.mood-cell.mood-empty { background: var(--border); color: var(--text-dim); }
  a.mood-cell.mood-selected { border: 2px solid var(--text); }
  a.mood-cell.mood-terrible { background: #ef444433; }
  a.mood-cell.mood-bad { background: #f9731633; }
  a.mood-cell.mood-okay { background: #eab30833; }
  a.mood-cell.mood-good { background: #22c55e33; }
  a.mood-cell.mood-great { background: #06b6d433; }
  .mood-legend { display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: var(--text-muted); margin-top: 10px; }
  .mood-legend span { display: inline-flex; align-items: center; gap: 4px; }
  .streak-row { display: flex; gap: 12px; margin-top: 12px; }
  .day-detail { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; margin-top: 12px; font-size: 13px; }
  .mood-history-item { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
  .mood-history-item:last-child { border-bottom: none; }

  textarea, select {
    width: 100%; padding: 9px 10px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--bg); color: var(--text); box-sizing: border-box; font-size: 14px; margin-bottom: 8px;
    font-family: inherit;
  }
  textarea { resize: vertical; min-height: 90px; }
  select {
    appearance: none; -webkit-appearance: none; cursor: pointer; padding-right: 30px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2385786e' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 10px center;
  }
  select:hover { border-color: var(--border-hover); }
  .category-select { width: auto; padding: 4px 22px 4px 8px; font-size: 12px; margin-bottom: 0; background-position: right 6px center; }

  .journal-entry { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; white-space: pre-wrap; font-size: 14px; margin-bottom: 8px; }
  .journal-history-item { padding: 10px 0; border-bottom: 1px solid var(--border); }
  .journal-history-item:last-child { border-bottom: none; }
  a.journal-history-date { font-size: 13px; font-weight: 500; color: var(--text); text-decoration: none; }
  a.journal-history-date:hover { color: var(--accent-light); }
  .journal-history-preview { font-size: 13px; color: var(--text-muted); margin-top: 2px; overflow-wrap: break-word; }

  .wishlist-list { display: flex; flex-direction: column; gap: 10px; }
  .wishlist-item { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; }
  .wishlist-item-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
  .wishlist-title { font-size: 15px; font-weight: 600; }
  .wishlist-meta { font-size: 12px; color: var(--text-muted); margin-bottom: 8px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; }
  .priority-low { background: var(--border); color: var(--text-muted); }
  .priority-medium { background: #b4530933; color: var(--warning); }
  .priority-high { background: #dc262633; color: var(--danger); }
  .status-badge { background: var(--border); color: var(--text); }
  .wishlist-item-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; align-items: end; }
  .wishlist-item-form textarea, .wishlist-item-form select, .wishlist-item-form input { margin-bottom: 0; }
  .wishlist-item-form input[type="text"], .wishlist-item-form input[type="number"] {
    width: 100%; padding: 9px 10px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--bg); color: var(--text); box-sizing: border-box; font-size: 14px;
  }
  .wishlist-item-form button { padding: 9px 10px; border-radius: 8px; border: none; background: var(--accent); color: white; font-size: 13px; cursor: pointer; }
  .wishlist-item-form button:hover { background: var(--accent-hover); }
  .delete-form button { background: transparent; border: 1px solid #dc262655; color: var(--danger); padding: 6px 10px; border-radius: 8px; font-size: 12px; cursor: pointer; }
  .delete-form button:hover { background: #dc262615; }

  .danger-zone { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); }

  .upload-progress { margin-top: 8px; height: 6px; border-radius: 999px; background: var(--border); overflow: hidden; position: relative; }
  .upload-progress-bar { position: absolute; top: 0; left: -40%; height: 100%; width: 40%; background: var(--accent); border-radius: 999px; animation: upload-progress-slide 1.1s ease-in-out infinite; }
  @keyframes upload-progress-slide {
    0% { left: -40%; }
    100% { left: 100%; }
  }

  .loading-overlay {
    display: none; position: fixed; inset: 0; background: rgba(41, 37, 36, .55);
    z-index: 1000; align-items: center; justify-content: center; flex-direction: column; gap: 12px;
  }
  .loading-overlay.visible { display: flex; }
  .loading-overlay-spinner {
    width: 40px; height: 40px; border-radius: 50%;
    border: 4px solid rgba(250, 249, 246, .3); border-top-color: var(--accent);
    animation: loading-overlay-spin .8s linear infinite;
  }
  .loading-overlay-text { font-size: 13px; color: #faf9f6; }
  @keyframes loading-overlay-spin { to { transform: rotate(360deg); } }

  label { display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 3px; }

  .log-item { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 8px; overflow: hidden; }
  .log-item summary { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; list-style: none; }
  .log-item summary::-webkit-details-marker { display: none; }
  .log-item summary::before { content: "▸"; color: var(--text-dim); font-size: 18px; flex-shrink: 0; transition: transform 0.15s ease; }
  .log-item[open] summary::before { transform: rotate(90deg); }
  .log-time { font-size: 12px; color: var(--text-dim); white-space: nowrap; }
  .log-name { flex: 1; min-width: 0; overflow-wrap: break-word; font-size: 13px; }
  .log-calories { font-size: 13px; color: var(--text-muted); white-space: nowrap; }
  .log-detail-body { padding: 4px 14px 14px; border-top: 1px solid var(--border); }
  .log-item-row { padding: 10px 0; border-bottom: 1px solid var(--border); }
  .log-item-row:last-child { border-bottom: none; }
  .log-item-info { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; }
  .item-edit-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; align-items: end; }
  .item-edit-row input[type="number"] {
    width: 100%; padding: 9px 10px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--bg); color: var(--text); box-sizing: border-box; font-size: 14px;
  }
  .item-edit-row button { padding: 9px 10px; border-radius: 8px; border: none; background: var(--accent); color: white; font-size: 13px; cursor: pointer; }
  .item-edit-row button:hover { background: var(--accent-hover); }

  .inline-icon { width: 16px; height: 16px; object-fit: contain; vertical-align: middle; margin-right: 4px; margin-top: -2px; border-radius: 3px; }

  .stat-bar { height: 10px; border-radius: 999px; background: var(--border); overflow: hidden; margin: 6px 0 4px; }
  .stat-bar-fill { height: 100%; border-radius: 999px; transition: width 0.3s ease; }
  .stat-bar-fill.tier-high { background: linear-gradient(90deg, var(--success-dark), var(--success)); }
  .stat-bar-fill.tier-mid { background: linear-gradient(90deg, var(--warning-hover), #facc15); }
  .stat-bar-fill.tier-low { background: linear-gradient(90deg, var(--danger-dark), var(--danger-light)); }
  .stat-bar-fill.tier-empty { background: linear-gradient(90deg, #fca5a5, #fecaca); }

  .button-row { display: flex; gap: 8px; }
  .button-row button, .button-row .btn-secondary, .button-row .btn-warning { width: 100%; }
  .btn-primary { padding: 9px 10px; border-radius: 8px; border: none; background: var(--accent); color: white; font-size: 13px; cursor: pointer; }
  .btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
  .btn-secondary {
    display: flex; align-items: center; justify-content: center; box-sizing: border-box;
    padding: 9px 10px; border-radius: 8px; border: 1px solid var(--border);
    background: transparent; color: var(--text-muted); font-size: 13px; text-decoration: none; text-align: center; cursor: pointer;
  }
  .btn-secondary:hover:not(:disabled) { background: var(--surface-hover); color: var(--text); }
  .btn-warning {
    display: flex; align-items: center; justify-content: center; box-sizing: border-box;
    padding: 9px 10px; border-radius: 8px; border: none;
    background: var(--warning); color: #fff7ed; font-size: 13px; font-weight: 600; text-decoration: none; text-align: center; cursor: pointer;
  }
  .btn-warning:hover:not(:disabled) { background: var(--warning-hover); }
  .btn-primary:disabled, .btn-secondary:disabled, .btn-warning:disabled {
    opacity: 0.45; cursor: not-allowed;
  }
  .btn-sm { padding: 6px 10px; font-size: 12px; }
  .btn-wide-short { padding: 6px 28px; }

  .inline-toggle { margin-top: 8px; }
  .inline-toggle > summary { cursor: pointer; font-size: 12px; color: var(--text-dim); list-style: none; }
  .inline-toggle > summary::-webkit-details-marker { display: none; }
  .inline-toggle > summary::before { content: "▸ "; }
  .inline-toggle[open] > summary::before { content: "▾ "; }
  .inline-toggle-body { margin-top: 8px; display: flex; flex-direction: column; gap: 8px; }

  .routine-block { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; margin-bottom: 12px; }
  .routine-block h3 { margin: 0 0 10px; font-size: 14px; }
  .routine-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  .routine-steps li { display: flex; align-items: baseline; gap: 8px; font-size: 14px; }
  .routine-steps .step-num { color: var(--text-dim); font-size: 12px; width: 16px; flex-shrink: 0; }
  .routine-steps .step-optional { color: var(--text-muted); font-style: italic; }
  .routine-steps .step-tag { font-size: 11px; color: var(--text-dim); }
  .choice-box { background: var(--bg); border: 1px dashed var(--accent); border-radius: 10px; padding: 10px 12px; margin-top: 8px; font-size: 13px; }
  .choice-box .choice-options { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
  .choice-box button { padding: 7px 12px; border-radius: 8px; border: none; background: var(--accent); color: white; font-size: 13px; cursor: pointer; }
  .choice-box button:hover { background: var(--accent-hover); }
  .conflict-banner { background: #fde8d2; color: #92400e; border-radius: 10px; padding: 12px 14px; margin-bottom: 16px; font-size: 13px; }

  .ai-suggestion-card { background: var(--surface); border: 1px solid #a8795233; border-radius: 12px; padding: 16px; margin-bottom: 14px; }
  .ai-suggestion-card .ai-badge { display: inline-block; font-size: 11px; color: var(--accent-light); background: var(--accent-deep); padding: 2px 8px; border-radius: 999px; margin-bottom: 8px; }
  .ai-suggestion-card .ai-reasoning { font-size: 13px; color: var(--text); background: var(--bg); border-radius: 8px; padding: 10px 12px; margin: 10px 0; }
  .ai-suggestion-card .ai-warning { font-size: 12px; color: #92400e; margin-top: 6px; }
  .approved-badge { display: inline-block; font-size: 11px; color: var(--success-text); background: var(--success-bg); padding: 2px 8px; border-radius: 999px; }

  .field-group { margin-bottom: 12px; }
  .field-group .field-label { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; font-weight: 500; }
  .radio-row, .checkbox-row { display: flex; gap: 14px; flex-wrap: wrap; font-size: 13px; }
  .radio-row label, .checkbox-row label { display: flex; align-items: center; gap: 5px; color: var(--text); font-size: 13px; margin: 0; }
  .radio-row { gap: 8px; }
  .radio-row label {
    padding: 7px 14px; border-radius: 999px; border: 1px solid var(--border);
    background: var(--bg); color: var(--text-muted); cursor: pointer;
    transition: background .15s ease, border-color .15s ease, color .15s ease;
  }
  .radio-row label:hover { border-color: var(--border-hover); color: var(--text); }
  .radio-row input[type="radio"] { position: absolute; opacity: 0; width: 1px; height: 1px; }
  .radio-row label:has(input:checked) { background: var(--accent-deep); border-color: var(--accent); color: var(--text); }

  input[type="checkbox"] {
    appearance: none; -webkit-appearance: none; margin: 0;
    width: 16px; height: 16px; border-radius: 4px; border: 1px solid var(--border);
    background: var(--bg); cursor: pointer; position: relative; flex-shrink: 0;
    transition: background .15s ease, border-color .15s ease;
  }
  input[type="checkbox"]:hover { border-color: var(--border-hover); }
  input[type="checkbox"]:checked { background: var(--accent); border-color: var(--accent); }
  input[type="checkbox"]:checked::after {
    content: ""; position: absolute; left: 5px; top: 1px;
    width: 4px; height: 8px; border: solid white; border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  .day-checkboxes { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
  .day-checkboxes label { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 11px; color: var(--text-muted); }
  .relationship-list { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
  .relationship-list label { display: flex; align-items: flex-start; gap: 6px; font-size: 13px; color: var(--text); }
  .relationship-list .rel-reason { color: var(--text-dim); font-size: 12px; }

  .rule-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; }
  .rule-card .rule-title { font-weight: 600; font-size: 14px; margin-bottom: 6px; }
  .rule-card .rule-facts { display: flex; gap: 10px; flex-wrap: wrap; font-size: 13px; color: var(--text); margin-bottom: 6px; }
  .rule-card .rule-note { font-size: 12px; color: var(--text-muted); }
  .rule-card .rule-actions { display: flex; gap: 8px; margin-top: 8px; }
  .rule-card .rule-actions button { padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--text); font-size: 12px; cursor: pointer; }
  .rule-card .rule-actions button:hover { background: var(--surface-hover); }
  .rule-card .rule-actions button.btn-danger-outline { border-color: #dc262688; color: var(--danger); }
  .rule-card .rule-actions button.btn-danger-outline:hover { background: #dc262615; border-color: var(--danger); }

  .product-table-wrap, .table-wrap { overflow-x: auto; }
  .product-table-wrap td { vertical-align: top; }
  .product-name-cell { font-weight: 600; }
  .product-brand-cell { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
  .category-cell-main { display: inline-flex; align-items: center; white-space: nowrap; }
  .category-cell-area { margin-top: 4px; }
  .routine-summary-time { white-space: nowrap; color: var(--text); }
  .routine-summary-freq { color: var(--text-muted); margin-top: 2px; }
  .product-table-wrap tr:hover td { background: var(--surface-hover); }
  .actions-menu { position: relative; display: inline-block; }
  .actions-menu-trigger {
    width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--bg); color: var(--text); font-size: 18px; line-height: 1; cursor: pointer;
  }
  .actions-menu-trigger:hover { border-color: var(--border-hover); }
  .actions-menu-list {
    position: absolute; top: calc(100% + 4px); right: 0; z-index: 20; min-width: 180px;
    background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 4px;
    display: none; flex-direction: column; gap: 2px; box-shadow: 0 8px 24px rgba(41,37,36,.14);
  }
  .actions-menu.open .actions-menu-list { display: flex; }
  .actions-menu-list form { display: block; }
  .actions-menu-item {
    display: block; width: 100%; text-align: left; padding: 8px 10px; border-radius: 6px; border: none;
    background: transparent; color: var(--text); font-size: 13px; text-decoration: none; cursor: pointer; box-sizing: border-box;
  }
  .actions-menu-item:hover { background: var(--surface-hover); }
  .actions-menu-item-danger { color: var(--danger); }
  .actions-menu-item-danger:hover { background: #dc262615; }
  .skincare-status-active { background: var(--success-bg); color: var(--success-text); }
  .skincare-status-paused { background: #fef3c7; color: var(--warning-hover); }
  .skincare-status-finished { background: var(--border); color: var(--text-muted); }
  .recovery-banner { background: var(--surface-hover); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; margin-bottom: 10px; font-size: 12px; color: var(--text-muted); }

  .category-dropdown { position: relative; margin-bottom: 8px; }
  .category-dropdown-trigger {
    width: 100%; display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 8px;
    border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 14px; cursor: pointer; text-align: left;
  }
  .category-dropdown-trigger:hover { border-color: var(--border-hover); }
  .category-dropdown-icon { width: 18px; height: 18px; object-fit: contain; border-radius: 3px; flex-shrink: 0; }
  .category-dropdown-label { flex: 1; }
  .category-dropdown-caret { color: var(--text-dim); font-size: 11px; }
  .category-dropdown-menu {
    position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 20; max-height: 260px; overflow-y: auto;
    background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 4px; margin: 0; list-style: none;
    display: none; box-shadow: 0 8px 24px rgba(41,37,36,.14);
  }
  .category-dropdown.open .category-dropdown-menu { display: block; }
  .category-dropdown-menu li { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 6px; font-size: 13px; color: var(--text); cursor: pointer; }
  .category-dropdown-menu li:hover { background: var(--surface-hover); }
  .category-dropdown-menu li img { width: 18px; height: 18px; object-fit: contain; border-radius: 3px; flex-shrink: 0; }
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

// path ke file PNG di public/icons (di-serve static lewat express.static di server.js).
// Sekalian nyangkut semua head tag + script buat PWA (manifest, theme-color, apple-touch-icon,
// service worker registration) - dipanggil di tiap halaman jadi paling gampang numpang di sini
// daripada nambahin tag/script yang sama di 10 file render terpisah.
export function faviconLink(iconPath) {
  return `<link rel="icon" type="image/png" href="${iconPath}">
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/icons/hub.png">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#927d6e">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#c49a76">
<script>if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");</script>`;
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
        ${themeToggleHtml()}
        <a class="logout" href="/logout">Log out</a>
      </div>
    </header>`;
}

// Tombol toggle light/dark - pill + knob custom CSS (bukan PNG, biar nggak gepeng & ikut
// warna tema otomatis). Preferensi disimpan di localStorage dan dipakai ulang lintas halaman -
// tiap halaman full-reload (bukan SPA) jadi script-nya ikut nempel di markup ini biar cukup
// sekali taruh di navHeader/header.
export function themeToggleHtml() {
  return `<button type="button" class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode">
    <span class="theme-toggle-track"><span class="theme-toggle-thumb">🌙</span></span>
  </button>
  <script>
    (function () {
      var root = document.documentElement;
      var btn = document.getElementById("theme-toggle");
      var thumb = btn.querySelector(".theme-toggle-thumb");
      function apply(theme) {
        root.setAttribute("data-theme", theme);
        thumb.textContent = theme === "dark" ? "🌙" : "☀️";
      }
      var saved = localStorage.getItem("theme");
      var theme = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      apply(theme);
      btn.addEventListener("click", function () {
        theme = theme === "dark" ? "light" : "dark";
        localStorage.setItem("theme", theme);
        apply(theme);
      });
    })();
  </script>`;
}

// script kecil buat kasih feedback visual pas form kirim foto/teks lagi diproses AI (bisa
// beberapa detik) - disable submit button, ganti teksnya, tampilin progress bar. configs:
// [{ formId, submitId, progressId, loadingLabel }]. Sisa halaman tetap murni server-rendered.
export function progressFormScript(configs) {
  const calls = configs
    .map(
      ({ formId, submitId, progressId, loadingLabel }) =>
        `wireProgress(${JSON.stringify(formId)}, ${JSON.stringify(submitId)}, ${JSON.stringify(progressId)}, ${JSON.stringify(loadingLabel)});`
    )
    .join("\n    ");

  return `<script>
    function wireProgress(formId, submitId, progressId, loadingLabel) {
      const form = document.getElementById(formId);
      if (!form) return;
      form.addEventListener("submit", function () {
        const submit = document.getElementById(submitId);
        submit.disabled = true;
        submit.textContent = loadingLabel;
        document.getElementById(progressId).hidden = false;
      });
    }
    ${calls}
  </script>`;
}

// Overlay full-page (backdrop + spinner ditengah, blokir klik ke elemen di belakangnya) buat
// form yang tombolnya ada di dalam komponen yang bisa ke-hide sendiri (mis. dropdown yang
// auto-close begitu diklik) - progressFormScript nggak kepake di situ karena progress bar-nya
// ikut collapse/invisible barengan kontainernya. formIds: array id form yang mau di-wire.
export function loadingOverlayHtml(id = "loading-overlay", text = "Loading...") {
  return `<div class="loading-overlay" id="${id}">
    <div class="loading-overlay-spinner"></div>
    <div class="loading-overlay-text">${escapeHtml(text)}</div>
  </div>`;
}

export function overlayFormScript(formIds, overlayId = "loading-overlay") {
  if (!formIds.length) return "";
  return `<script>
    (function () {
      const overlay = document.getElementById(${JSON.stringify(overlayId)});
      if (!overlay) return;
      ${JSON.stringify(formIds)}.forEach(function (formId) {
        const form = document.getElementById(formId);
        if (form) form.addEventListener("submit", function () { overlay.classList.add("visible"); });
      });
    })();
  </script>`;
}

// Submit form[data-ajax-approve] lewat fetch (bukan full-page POST) supaya card lain di halaman
// yang sama (mis. daftar saran AI) nggak ikut hilang dari layar cuma karena approve 1 card -
// halaman nggak pernah navigate, cuma card yang di-approve yang diganti jadi badge "Approved".
// Juga nyediain tombol "approve-all-btn"/"reject-all-btn" opsional (dipakai kalau ada di DOM).
export function ajaxApproveFormScript() {
  return `<script>
    (function () {
      function checkAllDone() {
        if (document.querySelectorAll("form[data-ajax-approve]").length > 0) return;
        const banner = document.getElementById("review-complete-banner");
        if (!banner) return;
        banner.style.display = "block";
        setTimeout(function () { window.location.href = "/hub/skincare"; }, 1500);
      }
      window.__dismissSuggestionCard = function (btn) {
        const card = btn.closest(".ai-suggestion-card");
        if (card) card.remove();
        checkAllDone();
      };

      function approveForm(form) {
        const card = form.closest(".ai-suggestion-card") || form;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalLabel = submitBtn ? submitBtn.textContent : "";
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Approving..."; }

        return fetch(form.action, {
          method: "POST",
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams(new FormData(form)),
        })
          .then(function (res) {
            return res.json().then(function (data) { return { httpOk: res.ok, data: data }; });
          })
          .then(function (result) {
            if (result.httpOk && result.data.ok) {
              card.innerHTML = '<span class="approved-badge">Approved</span>';
              checkAllDone();
            } else {
              throw new Error((result.data && result.data.error) || "Failed to approve.");
            }
          })
          .catch(function (err) {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
            let errBox = form.querySelector(".ajax-approve-error");
            if (!errBox) {
              errBox = document.createElement("div");
              errBox.className = "ai-warning ajax-approve-error";
              form.appendChild(errBox);
            }
            errBox.textContent = "⚠️ " + err.message;
          });
      }

      document.querySelectorAll("form[data-ajax-approve]").forEach(function (form) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          approveForm(form);
        });
      });

      const approveAllBtn = document.getElementById("approve-all-btn");
      const rejectAllBtn = document.getElementById("reject-all-btn");

      if (approveAllBtn) {
        approveAllBtn.addEventListener("click", function () {
          const forms = Array.from(document.querySelectorAll("form[data-ajax-approve]"));
          if (!forms.length) return;
          approveAllBtn.disabled = true;
          if (rejectAllBtn) rejectAllBtn.disabled = true;
          Promise.all(forms.map(approveForm)).finally(function () {
            approveAllBtn.disabled = false;
            if (rejectAllBtn) rejectAllBtn.disabled = false;
          });
        });
      }

      if (rejectAllBtn) {
        rejectAllBtn.addEventListener("click", function () {
          document.querySelectorAll(".ai-suggestion-card").forEach(function (card) { card.remove(); });
          checkAllDone();
        });
      }
    })();
  </script>`;
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

  // Bar makin ramping & gap antar bar makin rapat dibanding sebelumnya (dulu tiap bar makan
  // 70% dari slot-nya sendiri, gap 15% tiap sisi - gap & lebar bar saling melengkapi dari slot
  // yang tetap, jadi nggak bisa dikecilin bareng tanpa nyisain ruang). Sisa ruang yang kebebas
  // dari ngecilin dua-duanya ditaruh sebagai padding di kiri-kanan chart, bukan disebar jadi
  // gap ekstra antar bar.
  const slotPitch = width / days.length;
  const barW = slotPitch * 0.6;
  const gapEachSide = slotPitch * 0.07;
  const pitch = barW + gapEachSide * 2;
  const startX = (width - pitch * days.length) / 2;

  const bars = days
    .map((d, i) => {
      const x = startX + i * pitch + gapEachSide;
      const w = barW;
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
        ${total > 0 ? `<text x="${x + w / 2}" y="${Math.max(10, yCursor - 4)}" font-size="10" fill="#352d29" text-anchor="middle">${formatValue(total)}</text>` : ""}
        ${segs}
        <text x="${x + w / 2}" y="${dayLabelY}" font-size="10" fill="#85786e" text-anchor="middle">${d.label}</text>
      `;
    })
    .join("");

  const legend = categoryLegendSvg(series, width, legendStartY, itemsPerRow);

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" role="img" aria-label="Stacked bar chart">${bars}${legend}</svg>`;
}

// legend dipakai bareng oleh stackedBarChartSvg (vertical) dan horizontalStackedBarChartSvg
function categoryLegendSvg(series, width, startY, itemsPerRow) {
  return series
    .map((s, i) => {
      const col = i % itemsPerRow;
      const row = Math.floor(i / itemsPerRow);
      const x = Math.round(4 + col * (width / itemsPerRow));
      const y = startY + row * 16;
      return `
        <rect x="${x}" y="${y - 8}" width="9" height="9" fill="${s.color}" rx="2" />
        <text x="${x + 13}" y="${y}" font-size="9" fill="#85786e">${escapeHtml(s.name)}</text>
      `;
    })
    .join("");
}

// Varian horizontal - satu row per hari, bar makin ke kanan makin besar (bukan makin ke atas).
// Dipilih buat dashboard Spending: label hari selalu horizontal (nggak kepepet kecil kayak di
// versi vertical), dan ada ruang lebih buat angka total di ujung bar.
// days: [{ label, values: { seriesKey: number } }], series: [{ key, name, color }]
export function horizontalStackedBarChartSvg(
  days,
  series,
  { formatValue = (v) => Math.round(v), itemsPerRow = 4 } = {}
) {
  const width = 640;
  const rowH = 32;
  const topPad = 6;
  const labelW = 54;
  const valueW = 52;
  const plotWidth = width - labelW - valueW;
  const barThickness = 16;

  const legendRows = Math.max(1, Math.ceil(series.length / itemsPerRow));
  const rowsEndY = topPad + days.length * rowH;
  const legendStartY = rowsEndY + 18;
  const height = legendStartY + legendRows * 16 + 6;

  const totals = days.map((d) => series.reduce((sum, s) => sum + (d.values[s.key] || 0), 0));
  const max = Math.max(1, ...totals);

  const rows = days
    .map((d, i) => {
      const rowY = topPad + i * rowH;
      const barY = rowY + (rowH - barThickness) / 2;
      let xCursor = labelW;
      const segs = series
        .map((s) => {
          const v = d.values[s.key] || 0;
          if (!v) return "";
          const segWidth = (v / max) * plotWidth;
          const x = xCursor;
          xCursor += segWidth;
          return `<rect x="${x.toFixed(1)}" y="${barY}" width="${segWidth.toFixed(1)}" height="${barThickness}" fill="${s.color}" rx="2" />`;
        })
        .join("");
      const total = totals[i];
      const labelY = rowY + rowH / 2 + 4;
      return `
        <text x="${labelW - 8}" y="${labelY}" font-size="11" fill="#85786e" text-anchor="end">${escapeHtml(d.label)}</text>
        ${segs}
        ${total > 0 ? `<text x="${(xCursor + 6).toFixed(1)}" y="${labelY}" font-size="10" fill="#352d29">${formatValue(total)}</text>` : ""}
      `;
    })
    .join("");

  const legend = categoryLegendSvg(series, width, legendStartY, itemsPerRow);

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" role="img" aria-label="Horizontal stacked bar chart">${rows}${legend}</svg>`;
}
