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

    /* Warm ambient mesh + frosted glass (lihat .glass-card, .fab-btn, body) */
    --gradient-mesh:
      radial-gradient(at 10% 5%, rgba(235, 213, 188, 0.55) 0px, transparent 50%),
      radial-gradient(at 90% 15%, rgba(216, 226, 214, 0.45) 0px, transparent 48%),
      radial-gradient(at 50% 95%, rgba(238, 222, 203, 0.5) 0px, transparent 55%);
    --glass-bg: rgba(255, 255, 255, 0.4);
    --glass-border: rgba(255, 255, 255, 0.85);
    --glass-shadow: 0 4px 24px -2px rgba(72, 58, 44, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.95);
    --glass-list-bg: rgba(255, 255, 255, 0.32);
    --glass-list-border: rgba(72, 58, 44, 0.09);
    --fab-gradient: linear-gradient(135deg, #8C735B 0%, #6F5944 100%);
    --danger-tint-bg: #fbeae6;
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

      --gradient-mesh:
        radial-gradient(at 12% 8%, rgba(150, 106, 66, 0.4) 0px, transparent 50%),
        radial-gradient(at 88% 18%, rgba(84, 110, 96, 0.32) 0px, transparent 48%),
        radial-gradient(at 50% 92%, rgba(122, 90, 62, 0.36) 0px, transparent 55%);
      --glass-bg: rgba(68, 62, 55, 0.62);
      --glass-border: rgba(255, 255, 255, 0.14);
      --glass-shadow: 0 8px 28px -4px rgba(0, 0, 0, 0.45), inset 0 1px 0 0 rgba(255, 255, 255, 0.14);
      --glass-list-bg: rgba(54, 49, 44, 0.55);
      --glass-list-border: rgba(255, 255, 255, 0.09);
      --fab-gradient: linear-gradient(135deg, #B59779 0%, #967A5E 100%);
      --danger-tint-bg: var(--surface);
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

    --gradient-mesh:
      radial-gradient(at 12% 8%, rgba(150, 106, 66, 0.4) 0px, transparent 50%),
      radial-gradient(at 88% 18%, rgba(84, 110, 96, 0.32) 0px, transparent 48%),
      radial-gradient(at 50% 92%, rgba(122, 90, 62, 0.36) 0px, transparent 55%);
    --glass-bg: rgba(68, 62, 55, 0.62);
    --glass-border: rgba(255, 255, 255, 0.14);
    --glass-shadow: 0 8px 28px -4px rgba(0, 0, 0, 0.45), inset 0 1px 0 0 rgba(255, 255, 255, 0.14);
    --glass-list-bg: rgba(54, 49, 44, 0.55);
    --glass-list-border: rgba(255, 255, 255, 0.09);
    --fab-gradient: linear-gradient(135deg, #B59779 0%, #967A5E 100%);
    --danger-tint-bg: var(--surface);
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
  body {
    font-family: system-ui, sans-serif; color: var(--text); margin: 0; padding: 24px 16px 48px;
    font-variant-numeric: tabular-nums;
    background-color: var(--bg); background-image: var(--gradient-mesh); background-attachment: fixed;
  }
  .container { max-width: 720px; margin: 0 auto; padding-bottom: calc(92px + env(safe-area-inset-bottom)); }
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
  a.card:not(.card-accent):not(.card-tint-danger):hover { background: var(--surface-hover); }
  /* Kartu accent (Spending) sengaja dapet hover sendiri (gelapin --accent, BUKAN pindah ke
     --surface-hover yang terang/krem - itu yang bikin teks putihnya ilang kebaca) - --accent-hover
     udah lebih gelap di light mode & lebih terang di dark mode (lihat .card.card-accent di bawah,
     teks dibalik jadi gelap buat varian dark), jadi kontras malah makin aman di kedua tema. */
  a.card.card-accent:hover { background: var(--accent-hover); border-color: var(--accent-hover); }
  /* Permukaan kaca hangat - cuma buat kartu utama & elemen melayang (bento grid, card Grind,
     TODAY/WEEKLY PLAN, dialog, FAB) di atas ambient mesh gradient body, BUKAN buat list item
     (Recent/History/Schedule pakai --glass-list-bg yang lebih ringan, tanpa blur, lihat
     .activity-row/.log-item) biar scroll tetap ringan di HP. */
  .glass-card {
    background: var(--glass-bg) !important; border: 1px solid var(--glass-border) !important;
    box-shadow: var(--glass-shadow); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  }
  a.glass-card:hover { background: var(--glass-bg) !important; filter: brightness(1.03); }
  /* Dark mode: hover kartu glass/bento cuma naikin opacity permukaan kaca dikit, JANGAN
     ganti ke warna terang/krem (lihat a.card:not(.card-accent) di atas - itu juga udah
     di-exclude dari kartu accent). Teks tetap pakai var(--text) yang kontras tinggi. */
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) .bento-card.glass-card:hover,
    :root:not([data-theme="light"]) a.bento-card.glass-card:hover {
      background: rgba(52, 47, 43, 0.82) !important;
      border-color: rgba(214, 188, 160, 0.35) !important;
      filter: none;
    }
  }
  :root[data-theme="dark"] .bento-card.glass-card:hover,
  :root[data-theme="dark"] a.bento-card.glass-card:hover {
    background: rgba(52, 47, 43, 0.82) !important;
    border-color: rgba(214, 188, 160, 0.35) !important;
    filter: none;
  }
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
  .forms details[open] { grid-column: 1 / -1; }
  .form-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
  .form-card h3 { font-size: 13px; color: var(--text-muted); margin: 0 0 10px; font-weight: 500; }
  .form-card > summary { cursor: pointer; font-size: 13px; color: var(--text-muted); font-weight: 500; list-style: none; margin-bottom: 10px; }
  .form-card > summary::-webkit-details-marker { display: none; }
  .form-card > summary::before { content: "▸ "; color: var(--text-dim); }
  .form-card[open] > summary::before { content: "▾ "; }
  .form-card input[type="text"], .form-card input[type="number"], .form-card input[type="date"],
  .ai-suggestion-card input[type="text"], .ai-suggestion-card input[type="number"],
  .inline-toggle-body input[type="text"], .inline-toggle-body input[type="number"], .inline-toggle-body input[type="date"],
  .glass-card form input[type="text"], .glass-card form input[type="number"], .glass-card form input[type="date"] {
    width: 100%; padding: 9px 10px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--bg); color: var(--text); box-sizing: border-box; font-size: 14px; margin-bottom: 8px;
  }
  .form-card input[type="file"], .glass-card form input[type="file"] {
    width: 100%; padding: 9px 10px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--bg); box-sizing: border-box; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;
  }
  .form-card button, .inline-toggle-body button {
    width: 100%; padding: 9px 10px; border-radius: 8px; border: none;
    background: var(--accent); color: white; font-size: 13px; cursor: pointer;
  }
  .form-card button:hover, .inline-toggle-body button:hover { background: var(--accent-hover); }
  /* Form polos di dalam .glass-card (Log Expense, Set Weekly Budget, dst) sebelumnya nggak
     ke-cover sama rule .form-card di atas (beda class), jadi input/button-nya nongol plain HTML
     default. Discoped ke "form" descendant (bukan .glass-card button langsung) biar nggak nabrak
     tombol lain yang udah dipresisi-styling sendiri di dalam glass-card (.icon-btn, .segmented-tab,
     dst - itu semua di LUAR <form>). */
  .glass-card form button {
    width: 100%; padding: 9px 10px; border-radius: 8px; border: none;
    background: var(--fab-gradient); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
  }
  .glass-card form button:hover { filter: brightness(1.08); }

  /* minmax(0, 1fr) (bukan bare 1fr) - kolom boleh nyusut di bawah konten tile-nya, jadi grid
     nggak pernah maksa lebih lebar dari card (lihat juga .sport-tile min-width:0 & label
     ellipsis di bawah - pola sama kayak perbaikan overflow set-row Gym sebelumnya). */
  .sport-tile-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .sport-tile-grid.sport-tile-grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media (max-width: 400px) {
    .sport-tile-grid.sport-tile-grid-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  .sport-tile {
    display: flex; flex-direction: row; align-items: center; gap: 6px; min-width: 0;
    width: 100%; box-sizing: border-box; padding: 10px 8px; border-radius: 14px; border: 1px solid var(--border);
    background: var(--surface); color: var(--text); text-decoration: none; font-size: 13px; font-weight: 500;
    text-align: left; cursor: pointer; font-family: inherit;
  }
  .sport-tile:hover { background: var(--surface-hover); border-color: var(--border-hover); }
  .sport-tile .icon-badge { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; }
  .sport-tile-label { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

  .form-card > summary.sport-form-summary {
    display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 600; color: var(--text);
  }
  .form-card > summary.sport-form-summary::before { content: ""; }
  .sport-form-summary::after { content: "▾"; margin-left: auto; color: var(--text-dim); font-size: 11px; transition: transform .15s ease; }
  .form-card[open] > summary.sport-form-summary::after { transform: rotate(180deg); }
  .sport-form-summary-icon {
    display: flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
    background: var(--accent-deep); color: var(--accent-light); box-sizing: border-box;
  }
  .sport-form-summary-icon .svg-icon { margin: 0; }
  .chart-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 12px; }

  header.hub-header { display: block; }
  .hub-topbar { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 10px; }
  .hub-topbar-actions { display: inline-flex; align-items: center; gap: 12px; flex-shrink: 0; white-space: nowrap; }
  .hub-greeting { display: block; width: 100%; font-size: clamp(1.35rem, 5.5vw, 1.75rem); line-height: 1.25; font-weight: 600; margin: 0 0 4px 0; }
  .hub-date { font-size: 13px; color: var(--text-muted); margin: 0; }
  .hub-sub { font-size: 13px; color: var(--text-dim); margin: 0 0 20px; }
  .empty-state { font-size: 13px; color: var(--text-dim); }
  .empty-state a { color: var(--accent-light); text-decoration: none; }
  .empty-state a:hover { text-decoration: underline; }
  .activity-list { display: flex; flex-direction: column; gap: 8px; }
  .activity-row { display: flex; align-items: center; gap: 12px; background: var(--glass-list-bg); border: 1px solid var(--glass-list-border); border-radius: 12px; padding: 10px 14px; }
  /* Badge ikon 34x34 warm taupe/amber - bungkus SVG line-icon (flame/wallet/book dst) ATAU emoji
     konten (mood) secara seragam, ganti dari sekadar font-size polos sebelumnya. */
  .activity-icon {
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    width: 34px; height: 34px; border-radius: 10px; background: var(--accent-deep); color: var(--accent-light);
    font-size: 16px;
  }
  .activity-icon .svg-icon { margin: 0; }
  .activity-main { flex: 1; min-width: 0; }
  .activity-title { font-size: 13px; font-weight: 500; }
  .activity-subtitle { font-size: 12px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
  .activity-time { font-size: 12px; color: var(--text-dim); white-space: nowrap; font-variant-numeric: tabular-nums; }
  /* Varian "1 kartu terpadu" (RECENT di /hub) - baris jadi flat + separator tipis, bukan kartu
     glass terpisah per baris (jauh lebih hemat ruang vertikal untuk list pendek). */
  .recent-card-list { padding: 4px 14px; }
  .recent-card-list .activity-row {
    background: none; border: none; border-radius: 0; padding: 10px 0;
    border-bottom: 1px solid rgba(140, 122, 107, 0.12);
  }
  .recent-card-list .activity-row:last-child { border-bottom: none; }
  .hub-nav-group { margin-bottom: 20px; }
  .hub-nav-links { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  a.hub-nav-item { display: block; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; color: var(--text); text-decoration: none; font-size: 14px; }
  a.hub-nav-item:hover { background: var(--surface-hover); }

  .section-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 32px 0 8px; }
  .section-header h2 { margin: 0; }
  .text-success { color: var(--success); }
  .text-danger-soft { color: var(--danger-light); }

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
  .category-select {
    width: auto; padding: 4px 22px 4px 10px; font-size: 11px; margin-bottom: 0;
    background-position: right 7px center; border-radius: 999px;
  }

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

  .log-item { background: var(--glass-list-bg); border: 1px solid var(--glass-list-border); border-radius: 12px; margin-bottom: 8px; overflow: hidden; }
  .log-item summary { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 10px; padding: 10px 14px; cursor: pointer; list-style: none; }
  .log-item summary::-webkit-details-marker { display: none; }
  .log-item summary::before { content: "▸"; color: var(--text-dim); font-size: 18px; flex-shrink: 0; transition: transform 0.15s ease; }
  .log-item[open] summary::before { transform: rotate(90deg); }
  .log-time { font-size: 12px; color: var(--text-dim); white-space: nowrap; }
  .log-name { flex: 1; min-width: 110px; overflow-wrap: break-word; font-size: 13px; }
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

  /* .form-card button (lihat .form-card button, .inline-toggle-body button di atas) sengaja
     width:100% buat tombol submit/toggle form biasa, tapi ikut "nangkep" semua tombol kecil
     nested di dalam form Gym (stepper +/-, hapus gerakan, dst) kalau nggak di-override eksplisit
     dengan selector yang lebih spesifik ke bawah ini - makanya tiap tombol kecil Gym selalu
     di-scope ulang via ".form-card <class>" biar menang specificity-nya. */
  .gym-subtype-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .gym-subtype-row select { margin-bottom: 0; width: auto; min-width: 130px; flex: 1; }
  .form-card .gym-subtype-row button { width: auto; flex-shrink: 0; }
  .gym-exercise-card { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 12px; margin-bottom: 10px; }
  .gym-exercise-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .gym-exercise-name { flex: 1; min-width: 0; margin-bottom: 0 !important; font-weight: 600; }
  .gym-last-badge {
    flex-shrink: 0; font-size: 11px; color: var(--accent-light); background: var(--accent-deep);
    padding: 3px 9px; border-radius: 999px; white-space: nowrap;
  }
  .form-card .gym-exercise-remove {
    width: 32px; height: 32px; padding: 0; flex-shrink: 0; border-radius: 50%;
    border: none; background: transparent; color: var(--text-dim); font-size: 16px; line-height: 1; cursor: pointer;
  }
  .form-card .gym-exercise-remove:hover { background: var(--surface-hover); color: var(--danger); }

  .gym-set-rows { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
  .gym-set-header-row, .gym-set-row {
    display: grid; grid-template-columns: 24px minmax(0, 1fr) minmax(0, 1fr) 32px; gap: 8px; align-items: center;
  }
  .gym-set-header-row { font-size: 11px; color: var(--text-dim); padding: 0 8px; }
  .gym-set-col-label { text-align: center; }
  .gym-set-row {
    background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 6px 8px;
    transition: opacity .15s ease, background .15s ease, border-color .15s ease;
  }
  .gym-set-row.gym-set-done-row { opacity: .55; background: var(--success-bg); border-color: transparent; }
  .gym-set-index { width: 24px; font-size: 11px; color: var(--text-dim); text-align: center; }
  /* Field kg/reps dibungkus 1 kotak bulat sendiri (border+background) biar batas antar field
     (kg vs reps) selalu kebaca jelas walau di layar sempit gap-nya tipis - sebelumnya tombol &
     input masing-masing punya border sendiri-sendiri jadi kalau kepepet kelihatan numpuk/nyambung
     kayak satu tombol gede, bukan 2 field yang terpisah. */
  .gym-set-field {
    display: flex; align-items: center; gap: 2px; min-width: 0; overflow: hidden;
    background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 2px;
  }
  .form-card .gym-set-field .stepper-btn {
    flex-shrink: 0; width: auto; padding: 3px 5px; font-size: 10px; border-radius: 5px;
    border: none; background: var(--bg); color: var(--text); cursor: pointer; font-family: inherit; white-space: nowrap;
  }
  .form-card .gym-set-field .stepper-btn:hover { background: var(--surface-hover); }
  .form-card .gym-set-field .stepper-btn:active { background: var(--accent-deep); }
  .gym-weight-input, .gym-reps-input {
    flex: 1; min-width: 0; width: auto; text-align: center; padding: 3px 1px; margin: 0;
    border-radius: 5px; border: none; background: transparent; color: var(--text); font-size: 13px; box-sizing: border-box;
  }
  .gym-weight-input { min-width: 30px; }
  .gym-reps-input { min-width: 24px; }
  .gym-set-done-label { width: 32px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; margin: 0; }

  .inline-icon { width: 16px; height: 16px; object-fit: contain; vertical-align: middle; margin-right: 4px; margin-top: -2px; border-radius: 3px; }
  .svg-icon { vertical-align: middle; margin-right: 6px; margin-top: -2px; flex-shrink: 0; }
  .icon-badge {
    display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
    width: 40px; height: 40px; border-radius: 12px; background: var(--accent-deep); color: var(--accent-light);
  }
  .icon-badge .svg-icon { margin: 0; }
  .icon-badge img { width: 20px; height: 20px; object-fit: contain; }

  /* Varian warna kartu Bento /hub (Spending = solid aksen, Vault = tint lembut pas minus) - FLAT,
     sengaja TANPA glass/blur (beda sama .glass-card yang dipakai Grind/TODO/dialog/FAB), sesuai
     referensi desain "Daily overview". */
  .card.card-accent {
    background: var(--accent); border-color: var(--accent); color: #fff;
  }
  .card.card-accent .card-label { color: rgba(255,255,255,.9); }
  .card.card-accent .card-sub { color: rgba(255,255,255,.78); }
  .card.card-accent .text-success, .card.card-accent .text-danger-soft { color: #fff; }
  .card.card-accent .card-action-link { color: #fff; }
  /* Dark mode --accent jadi tan TERANG (bukan cokelat gelap kayak light mode), jadi teks putih
     malah kontrasnya jelek di atasnya - dibalik ke teks gelap di varian dark. */
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) .card.card-accent { color: #2b2119; }
    :root:not([data-theme="light"]) .card.card-accent .card-label { color: rgba(43,33,25,.85); }
    :root:not([data-theme="light"]) .card.card-accent .card-sub,
    :root:not([data-theme="light"]) .card.card-accent .text-success,
    :root:not([data-theme="light"]) .card.card-accent .text-danger-soft,
    :root:not([data-theme="light"]) .card.card-accent .card-action-link { color: rgba(43,33,25,.75); }
  }
  :root[data-theme="dark"] .card.card-accent { color: #2b2119; }
  :root[data-theme="dark"] .card.card-accent .card-label { color: rgba(43,33,25,.85); }
  :root[data-theme="dark"] .card.card-accent .card-sub,
  :root[data-theme="dark"] .card.card-accent .text-success,
  :root[data-theme="dark"] .card.card-accent .text-danger-soft,
  :root[data-theme="dark"] .card.card-accent .card-action-link { color: rgba(43,33,25,.75); }
  .card.card-tint-danger { background: var(--danger-tint-bg); border-color: transparent; }
  .card-action-link {
    display: inline-flex; align-items: center; gap: 4px; margin-top: 6px;
    font-size: 13px; font-weight: 600; color: var(--accent-light);
  }
  .card-action-link .svg-icon { margin: 0; }

  /* Hero "plan hari ini" (Grind) - ikon gede + angka besar + unit, label jenis sesi di bawahnya,
     plus grid 2 kolom buat pace/HR (lihat todayPlanAndLoggerHtml & grindHubCardHtml). */
  .plan-hero { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
  .plan-hero .icon-badge { width: 52px; height: 52px; border-radius: 16px; }
  .plan-hero-value { font-size: 30px; font-weight: 700; line-height: 1; }
  .plan-hero-unit { font-size: 15px; font-weight: 500; color: var(--text-muted); margin-left: 3px; }
  .plan-hero-subtype { font-size: 13px; color: var(--text-muted); margin: 6px 0 10px; }
  .plan-facts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .plan-fact-value { font-size: 14px; font-weight: 700; }
  .plan-fact-label { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

  /* Race countdown jadi "ribbon" tipis di atas card TODAY, bukan card gede sendiri. */
  .race-ribbon { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
  .race-ribbon-title {
    display: flex; align-items: center; font-size: 11px; font-weight: 700; letter-spacing: .04em;
    text-transform: uppercase; color: var(--text-muted);
  }
  .race-ribbon-pill {
    flex-shrink: 0; font-size: 11px; font-weight: 600; color: var(--accent-light);
    background: var(--accent-deep); padding: 4px 10px; border-radius: 999px; white-space: nowrap;
  }

  .flex-3 { flex: 3; }
  .flex-1 { flex: 1; }

  /* Tombol ikon kecil bulat (edit budget, dst) - beda konteks sama .modal-close-btn (itu khusus
     "tutup dialog") walau tampilannya mirip, sengaja dipisah biar nggak numpuk makna. */
  .icon-btn {
    display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
    width: 30px; height: 30px; border-radius: 50%; border: none;
    background: var(--surface-hover); color: var(--text-muted); cursor: pointer;
  }
  .icon-btn:hover { background: var(--border-hover); color: var(--text); }
  .icon-btn .svg-icon { margin: 0; }

  /* Segmented tabs (Today/This Week/This Month dkk) - konten tiap tab di-render semua di server,
     tab button cuma toggle hidden lewat JS kecil (lihat segmentedTabsScript), jadi ganti tab
     nggak reload halaman. */
  .segmented-tabs { display: flex; gap: 4px; background: var(--bg); border-radius: 10px; padding: 3px; margin-bottom: 12px; }
  .segmented-tab {
    flex: 1; padding: 7px 10px; border-radius: 8px; border: none; background: transparent;
    color: var(--text-muted); font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit;
  }
  .segmented-tab.active { background: var(--surface); color: var(--text); font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,.08); }

  /* Micro-bar proporsi per kategori (Category Breakdown). */
  .category-bar-row { margin-bottom: 10px; }
  .category-bar-head { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
  .category-bar-name { color: var(--text); }
  .category-bar-amount { font-weight: 600; }
  .category-bar-track { height: 6px; border-radius: 999px; background: var(--border); overflow: hidden; }
  .category-bar-fill { height: 100%; border-radius: 999px; background: var(--accent); }
  .category-total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border); }

  /* Recent Transactions - list fleksibel (bukan <table>) biar nominal nggak kepotong di HP. */
  .txn-filter { position: relative; margin-bottom: 10px; }
  .txn-filter .svg-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); margin: 0; color: var(--text-dim); pointer-events: none; }
  .txn-filter input {
    width: 100%; box-sizing: border-box; padding: 9px 10px 9px 34px; border-radius: 10px;
    border: 1px solid var(--border); background: var(--glass-list-bg); color: var(--text);
    font-size: 14px; margin-bottom: 0;
  }
  .txn-list { display: flex; flex-direction: column; gap: 8px; }
  .txn-item {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    background: var(--glass-list-bg); border: 1px solid var(--glass-list-border); border-radius: 12px; padding: 10px 14px;
  }
  .txn-main { flex: 1; min-width: 0; }
  .txn-title { font-weight: 600; font-size: 14px; word-break: break-word; }
  .txn-date { font-size: 12px; color: var(--text-dim); margin-top: 2px; }
  .txn-side { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
  .txn-amount { font-weight: 600; font-size: 14px; white-space: nowrap; }
  .txn-amount.txn-income { color: var(--success); }

  /* Floating bottom nav - kapsul 4 tab melayang, dipakai di /hub, /hub/grind, /hub/grind/gym,
     /dashboard/spending (lihat bottomNavHtml). Blur 16px (bukan 12px default .glass-card) biar
     sama kuatnya kayak FAB/dialog, bukan permukaan "kartu biasa" yang numpang lewat. */
  .bottom-nav {
    position: fixed; bottom: calc(12px + env(safe-area-inset-bottom)); left: 50%; transform: translateX(-50%); z-index: 45;
    border-radius: 999px; padding: 6px; width: min(400px, calc(100% - 32px));
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  }
  .bottom-nav a {
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
    padding: 8px 4px; border-radius: 999px; text-decoration: none; color: var(--text-muted);
    font-size: 11px; font-weight: 500;
  }
  .bottom-nav a .svg-icon { margin: 0; }
  .bottom-nav a.active { background: var(--accent-deep); color: var(--accent-light); }
  .bottom-nav a:active { transform: scale(0.95); transition: transform 0.1s ease; }

  /* Feedback sentuhan native - elemen yang bisa diklik "menyusut" dikit pas ditekan, konsisten di
     semua kartu/tombol interaktif utama (bento grid /hub, tile quick-log olahraga, chip transaksi
     frequent, FAB). Marker class aja (.bento-card/.sport-btn/.fab-btn/.chip-btn), ditempel
     berdampingan sama class styling asli tiap elemen, bukan gantiin. */
  .bento-card:active, .sport-btn:active, .fab-btn:active, .chip-btn:active, .segmented-tab:active, .icon-btn:active {
    transform: scale(0.97);
    transition: transform 0.1s ease;
  }

  /* FAB "+ Rp" / "+ Plan" - gradasi aksen hangat + kaca (blur 16px), posisi/padding-nya sendiri
     ditentuin per halaman (.hub-fab/.grind-fab di hub/dashboard.js & grind/dashboard.js). */
  .fab-btn {
    background: var(--fab-gradient) !important; border: 1px solid var(--glass-border);
    box-shadow: var(--glass-shadow); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  }
  .fab-btn:hover { filter: brightness(1.08); }

  /* Animasi masuk halus buat semua <dialog> modal (Quick Expense, Import Plan, dst) - generik di
     tag dialog biar otomatis kepakai di mana aja tanpa perlu diulang per halaman. */
  @keyframes dialog-pop-in {
    from { opacity: 0; transform: translateY(8px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes dialog-backdrop-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  dialog[open] { animation: dialog-pop-in 0.18s ease-out; }
  dialog::backdrop { animation: dialog-backdrop-fade-in 0.18s ease-out; }

  .stat-bar { height: 10px; border-radius: 999px; background: var(--border); overflow: hidden; margin: 6px 0 4px; }
  .stat-bar-fill { height: 100%; border-radius: 999px; transition: width 0.3s ease; }
  .stat-bar-fill.tier-high { background: linear-gradient(90deg, var(--success-dark), var(--success)); }
  .stat-bar-fill.tier-mid { background: linear-gradient(90deg, var(--warning-hover), #facc15); }
  .stat-bar-fill.tier-low { background: linear-gradient(90deg, var(--danger-dark), var(--danger-light)); }
  .stat-bar-fill.tier-empty { background: linear-gradient(90deg, #fca5a5, #fecaca); }

  .button-row { display: flex; gap: 8px; }
  .button-row button, .button-row .btn-secondary, .button-row .btn-warning, .button-row .btn-primary { width: 100%; }
  .btn-primary {
    display: flex; align-items: center; justify-content: center; gap: 6px; box-sizing: border-box;
    padding: 9px 10px; border-radius: 8px; border: none;
    background: var(--accent); color: white; font-size: 13px; font-weight: 600; text-decoration: none; text-align: center; cursor: pointer;
  }
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

  .schedule-next-week { margin-top: 16px; }
  .schedule-next-week > summary {
    cursor: pointer; font-size: 12px; color: var(--text-dim); text-transform: uppercase;
    letter-spacing: .05em; list-style: none;
  }
  .schedule-next-week > summary::-webkit-details-marker { display: none; }
  .schedule-next-week > summary::before { content: "▸ "; }
  .schedule-next-week[open] > summary::before { content: "▾ "; }
  .schedule-next-week-body { margin-top: 8px; }

  dialog.modal-dialog {
    border: 1px solid var(--glass-border); border-radius: 14px; padding: 0; color: var(--text);
    max-width: 480px; width: 92vw; box-shadow: var(--glass-shadow);
    background: var(--glass-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  }
  dialog.modal-dialog::backdrop { background: rgba(41,37,36,.55); }
  .modal-dialog-body { padding: 18px; }
  .modal-dialog-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .modal-dialog-header h3 { margin: 0; font-size: 15px; display: flex; align-items: center; gap: 8px; }
  .modal-close-btn {
    border: none; background: var(--bg); color: var(--text-muted); font-size: 16px; line-height: 1;
    cursor: pointer; width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
  }
  .modal-close-btn:hover { background: var(--surface-hover); color: var(--text); }
  .modal-dialog-caption { font-size: 12px; color: var(--text-muted); margin: 0 0 10px; line-height: 1.5; }
  .modal-dialog-caption-cols {
    font-size: 11px; color: var(--text-dim); background: var(--bg); border-radius: 8px;
    padding: 8px 10px; margin: 0 0 12px;
  }

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

  /* Label di dalam inline SVG chart (stackedBarChartSvg/horizontalStackedBarChartSvg) - class,
     BUKAN hex mentah, biar ikut var(--text)/var(--text-muted) adaptif tema (sebelumnya fill
     hardcoded #352d29/#85786e bikin angka total nyaris nggak kebaca di dark mode). */
  .chart-total-label { fill: var(--text); font-weight: 600; font-variant-numeric: tabular-nums; }
  .chart-axis-label { fill: var(--text-muted); }

  /* Legend chart dirender sebagai HTML biasa (bukan ikut di dalam <svg>) - lihat chartLegendHtml -
     biar wrapping/gap-nya rapi pakai flexbox asli, bukan dihitung manual per baris di koordinat SVG. */
  .chart-legend { display: flex; flex-wrap: wrap; gap: 8px 16px; font-size: 12px; color: var(--text-muted); margin-top: 10px; }
  .chart-legend.chart-legend-center { justify-content: center; }
  .chart-legend-item { display: inline-flex; align-items: center; gap: 6px; }
  .chart-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
`;

export function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// icon kecil inline sebelum teks label (section header, card-label, dst), pakai file PNG
// yang sama konvensinya kayak faviconLink - path ke public/icons
export function iconLabel(iconPath, text) {
  return `<img class="inline-icon" src="${iconPath}" alt="">${text}`;
}

// Set ikon SVG garis tipis (stroke-based, bukan fill) buat beberapa label/badge kunci yang
// sebelumnya emoji OS - konsisten tajam di semua perangkat/font emoji, nggak kayak PNG raster
// yang sedikit buram kalau di-scale. Cuma nge-cover ikon yang path-nya simpel & aman direproduksi
// manual (flame/wallet/clock/shield-check/activity/moon/flag) - ikon lain (badminton, dumbbell,
// swim, tennis) sengaja TETAP pakai PNG existing (public/icons) karena bentuknya lebih rumit buat
// digambar ulang sebagai path SVG tanpa alat desain visual.
const SVG_ICON_PATHS = {
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
  shieldCheck: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
  waves: '<path d="M2 6c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
  racket: '<circle cx="9" cy="9" r="6"/><line x1="13.5" y1="13.5" x2="21" y2="21"/>',
  tennisBall: '<circle cx="12" cy="12" r="9"/><path d="M4.5 6.5c2.8 2.8 2.8 8.2 0 11M19.5 6.5c-2.8 2.8-2.8 8.2 0 11"/>',
  dumbbell: '<circle cx="5" cy="12" r="3"/><circle cx="19" cy="12" r="3"/><line x1="8" y1="12" x2="16" y2="12"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  alertCircle: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  tag: '<path d="M12.59 2.59a2 2 0 0 0-1.42-.59H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8 8a2 2 0 0 0 2.82 0l7.18-7.18a2 2 0 0 0 0-2.82z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
  barChart: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
  receipt: '<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="13" y2="15"/>',
  edit: '<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  layoutGrid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  scale: '<path d="M12 3v18"/><path d="M5 7h14"/><path d="m5 7-3 9a5 5 0 0 0 6 0Z"/><path d="m19 7-3 9a5 5 0 0 0 6 0Z"/>',
  wheat: '<path d="M12 22V12"/><path d="M12 12a4 4 0 0 1 4-4"/><path d="M12 12a4 4 0 0 0-4-4"/><path d="M12 8a4 4 0 0 1 4-4"/><path d="M12 8a4 4 0 0 0-4-4"/>',
  droplet: '<path d="M12 2s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12Z"/>',
  cube: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M8 16H3v5"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  arrowLeft: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="1"/><line x1="8" y1="6" x2="8" y2="6.01"/><line x1="16" y1="6" x2="16" y2="6.01"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="9" y1="22" x2="9" y2="18"/><line x1="15" y1="22" x2="15" y2="18"/>',
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/>',
  umbrella: '<path d="M12 2a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9Z"/><line x1="12" y1="2" x2="12" y2="4"/><path d="M12 11v9a2 2 0 0 1-4 0"/>',
  dot: '<circle cx="12" cy="12" r="6" fill="currentColor" stroke="none"/>',
};

// size dalam px (18-20 direkomendasikan biar sejajar sama teks di sampingnya, lihat .svg-icon).
export function svgIcon(name, { size = 19 } = {}) {
  const inner = SVG_ICON_PATHS[name];
  if (!inner) return "";
  return `<svg class="svg-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

// Pengganti iconLabel() versi SVG - ikon + teks label, dipakai di card-label /hub dkk.
export function svgIconLabel(name, text, opts) {
  return `${svgIcon(name, opts)}${text}`;
}

// Badge lingkaran lembut warna aksen buat ikon tombol quick-log olahraga (lihat sportIconBadgeHtml
// di hub/dashboard.js & grind/dashboard.js) - bisa dibungkusin ikon SVG ATAU <img> PNG biasa,
// supaya sport yang belum punya SVG (badminton/gym/swim/tennis) tetep dapet treatment visual yang
// sama (bulat, latar aksen) walau isinya masih raster PNG.
export function iconBadgeHtml(innerHtml) {
  return `<span class="icon-badge">${innerHtml}</span>`;
}

// Floating bottom nav (kapsul 4 tab: Home/Grind/Gym/Spend) - dipanggil eksplisit di tiap halaman
// yang mau pakai (/hub, /hub/grind, /hub/grind/gym, /dashboard/spending sejauh ini), BUKAN
// auto-inject global lewat middleware, biar halaman lain (Vault/Clocked/Mood/dst) nggak kena efek
// samping tanpa diminta.
// currentPath: path halaman yang lagi dibuka (hardcode per call site, bukan dari req) - dipakai
// buat nentuin tab mana yang "active". Grind sengaja exclude /hub/grind/gym (match-nya sendiri)
// biar pas lagi di halaman Gym, tab yang nyala cuma Gym - bukan dua-duanya.
const BOTTOM_NAV_ITEMS = [
  { href: "/hub", label: "Home", icon: "layoutGrid", match: (p) => p === "/hub" },
  { href: "/hub/grind", label: "Grind", icon: "activity", match: (p) => p.startsWith("/hub/grind") && !p.startsWith("/hub/grind/gym") },
  { href: "/dashboard/spending", label: "Spend", icon: "wallet", match: (p) => p.startsWith("/dashboard/spending") },
  { href: "/hub/grind/gym", label: "Gym", icon: "dumbbell", match: (p) => p.startsWith("/hub/grind/gym") },
];

export function bottomNavHtml(currentPath) {
  const tabs = BOTTOM_NAV_ITEMS.map((item) => {
    const active = item.match(currentPath || "");
    return `<a href="${item.href}" class="${active ? "active" : ""}" aria-current="${active ? "page" : "false"}">${svgIcon(item.icon, { size: 20 })}<span>${item.label}</span></a>`;
  }).join("");
  return `<nav class="bottom-nav glass-card" aria-label="Primary Navigation">${tabs}</nav>`;
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
// icon: path ke PNG di public/icons (sama yang dipakai buat faviconLink halaman itu) - dirender
// sebagai <img> polos. iconHtml: override opsional (mis. badge SVG line-icon ala Calorie Tracker,
// lihat calorie/dashboard.js) kalau sebuah halaman mau tampilan icon judul yang lebih kustom
// daripada <img> PNG biasa - default-nya tetap <img> biar nggak ngubah halaman lain yang udah ada.
// Log out sengaja cuma ada di header /hub sendiri (lihat hub/dashboard.js) - tiap sub-halaman
// lain udah ada link "Home" buat balik ke situ, jadi nggak perlu logout nyebar di tiap halaman.
export function navHeader({ icon, iconHtml, title, links = [], extra = "" }) {
  const linksHtml = links
    .map((l) => `<a class="nav-link" href="${l.href}">${l.label}</a>`)
    .join("");
  const iconMarkup = iconHtml || `<img class="header-icon" src="${icon}" alt="">`;
  return `<header>
      <h1>${iconMarkup}${title}</h1>
      <div class="nav-links">
        ${extra}
        ${linksHtml}
        ${themeToggleHtml()}
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

// Dipakai stackedBarChartSvg/horizontalStackedBarChartSvg buat id <clipPath> yang unik per
// instance chart - tanpa ini, 2 chart di halaman yang sama bisa numpuk id "bar-clip-0" dkk dan
// SVG browser cuma makein clip-path dari elemen PERTAMA yang match id itu (dobel clip salah).
let chartInstanceSeq = 0;

// Legend chart (dot warna + nama series) - HTML biasa, dirender TERPISAH dari <svg> chart-nya
// (lihat stackedBarChartSvg/horizontalStackedBarChartSvg yang sekarang nggak include legend lagi)
// biar wrapping & spacing-nya pakai flexbox asli, bukan dihitung manual per kolom/baris di
// koordinat SVG. center=true buat chart dengan sedikit series (mis. 3 macro) biar legend-nya
// rapi di tengah; false (default, wrap kiri) buat chart dengan banyak kategori (spending).
export function chartLegendHtml(series, { center = false } = {}) {
  const items = series
    .map(
      (s) =>
        `<span class="chart-legend-item"><span class="chart-legend-dot" style="background:${s.color}"></span>${escapeHtml(s.name)}</span>`
    )
    .join("");
  return `<div class="chart-legend${center ? " chart-legend-center" : ""}">${items}</div>`;
}

// stacked bar chart simpel via inline SVG, nggak butuh library chart eksternal.
// days: [{ label, values: { seriesKey: number } }], series: [{ key, name, color }]
export function stackedBarChartSvg(
  days,
  series,
  { formatValue = (v) => Math.round(v) } = {}
) {
  const instanceId = ++chartInstanceSeq;
  const width = 640;
  const barAreaHeight = 78;
  const barBaseline = 88;
  const dayLabelY = barBaseline + 16;
  const height = dayLabelY + 8;

  const totals = days.map((d) => series.reduce((sum, s) => sum + (d.values[s.key] || 0), 0));
  const max = Math.max(1, ...totals);

  // Bar makin ramping & gap antar bar makin rapat dibanding sebelumnya (dulu tiap bar makan
  // 70% dari slot-nya sendiri, gap 15% tiap sisi - gap & lebar bar saling melengkapi dari slot
  // yang tetap, jadi nggak bisa dikecilin bareng tanpa nyisain ruang). Sisa ruang yang kebebas
  // dari ngecilin dua-duanya ditaruh sebagai padding di kiri-kanan chart, bukan disebar jadi
  // gap ekstra antar bar. Dibatasi max 40px juga - kalau datanya baru 1-2 hari, slotPitch jadi
  // gede banget dan bar bakal melebar jadi kotak raksasa kalau nggak di-cap.
  const slotPitch = width / days.length;
  const barW = Math.min(slotPitch * 0.6, 40);
  const pitch = barW + Math.min(slotPitch * 0.07, 16) * 2;
  const startX = (width - pitch * days.length) / 2 + (pitch - barW) / 2;

  const bars = days
    .map((d, i) => {
      const x = startX + i * pitch;
      const w = barW;
      const total = totals[i];
      const displayTotal = d.displayTotal != null ? d.displayTotal : total;
      const totalHeightPx = (total / max) * barAreaHeight;
      const yTop = barBaseline - totalHeightPx;
      const clipId = `bar-clip-${instanceId}-${i}`;

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

      return `
        ${total > 0 ? `<clipPath id="${clipId}"><rect x="${x}" y="${yTop.toFixed(1)}" width="${w}" height="${totalHeightPx.toFixed(1)}" rx="6" ry="6"/></clipPath>` : ""}
        ${total > 0 ? `<text class="chart-total-label" x="${x + w / 2}" y="${Math.max(10, yTop - 4)}" font-size="11" text-anchor="middle">${formatValue(displayTotal)}</text>` : ""}
        ${total > 0 ? `<g clip-path="url(#${clipId})">${segs}</g>` : ""}
        <text class="chart-axis-label" x="${x + w / 2}" y="${dayLabelY}" font-size="10" text-anchor="middle">${d.label}</text>
      `;
    })
    .join("");

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" role="img" aria-label="Stacked bar chart">${bars}</svg>`;
}

// Varian horizontal - satu row per hari, bar makin ke kanan makin besar (bukan makin ke atas).
// Dipilih buat dashboard Spending: label hari selalu horizontal (nggak kepepet kecil kayak di
// versi vertical), dan ada ruang lebih buat angka total di ujung bar.
// days: [{ label, values: { seriesKey: number } }], series: [{ key, name, color }]
export function horizontalStackedBarChartSvg(
  days,
  series,
  { formatValue = (v) => Math.round(v) } = {}
) {
  const width = 640;
  const rowH = 28;
  const topPad = 4;
  const labelW = 54;
  const valueW = 52;
  const plotWidth = width - labelW - valueW;
  const barThickness = 13;
  const height = topPad + days.length * rowH + 4;

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
          return `<rect x="${x.toFixed(1)}" y="${barY}" width="${segWidth.toFixed(1)}" height="${barThickness}" fill="${s.color}" rx="6" />`;
        })
        .join("");
      const total = totals[i];
      const labelY = rowY + rowH / 2 + 4;
      return `
        <text class="chart-axis-label" x="${labelW - 8}" y="${labelY}" font-size="11" text-anchor="end">${escapeHtml(d.label)}</text>
        <rect x="${labelW}" y="${barY}" width="${plotWidth}" height="${barThickness}" rx="6" fill="rgba(140, 122, 107, 0.12)" />
        ${segs}
        ${total > 0 ? `<text class="chart-total-label" x="${(xCursor + 6).toFixed(1)}" y="${labelY}" font-size="12" text-anchor="start">${formatValue(total)}</text>` : ""}
      `;
    })
    .join("");

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" role="img" aria-label="Horizontal stacked bar chart">${rows}</svg>`;
}
