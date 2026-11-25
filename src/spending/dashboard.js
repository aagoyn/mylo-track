import {
  DASHBOARD_CSS,
  escapeHtml,
  themeToggleHtml,
  horizontalStackedBarChartSvg,
  faviconLink,
  svgIcon,
  svgIconLabel,
  statBarHtml,
  progressFormScript,
  bottomNavHtml,
} from "../shared/dashboard-layout.js";

function formatRupiah(amount) {
  return `Rp${Math.round(amount).toLocaleString("id-ID")}`;
}

const CATEGORY_COLOR_PALETTE = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4",
  "#a855f7", "#eab308", "#ec4899", "#10b981", "#f97316", "#64748b",
];

// warna kategori ditentukan otomatis dari data chart-nya sendiri (urut dari total terbesar)
function buildCategorySeries(days) {
  const totalsByCategory = {};
  for (const day of days) {
    for (const [key, value] of Object.entries(day.values)) {
      totalsByCategory[key] = (totalsByCategory[key] || 0) + value;
    }
  }
  return Object.entries(totalsByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([key], i) => ({
      key,
      name: key,
      color: CATEGORY_COLOR_PALETTE[i % CATEGORY_COLOR_PALETTE.length],
    }));
}

// CSS khusus halaman ini (month input, dkk) - BUKAN di shared/dashboard-layout.js biar nggak
// nular ke halaman lain, sama pola-nya kayak HUB_PAGE_CSS/GRIND_PAGE_CSS di /hub & /hub/grind.
const SPENDING_PAGE_CSS = `
  .container { padding-bottom: calc(92px + env(safe-area-inset-bottom)); }
  .month-input {
    border: 1px solid var(--border); background: var(--surface); color: var(--text);
    border-radius: 999px; padding: 6px 12px; font-size: 13px; font-family: inherit; cursor: pointer;
  }
  .log-expense-date {
    border: 1px solid var(--border); background: var(--bg); color: var(--text);
    border-radius: 8px; padding: 6px 8px; font-size: 12px; font-family: inherit; cursor: pointer; flex-shrink: 0;
  }
`;

// Satu panel tab Category Breakdown (Today/This Week/This Month) - micro-bar proporsi per
// kategori + baris Total. Semua 3 panel dirender sekaligus (yang nggak aktif disembunyiin lewat
// `hidden`), jadi ganti tab di client murni toggle visibility, nggak reload/fetch apa-apa.
function categoryTabPanelHtml(key, { total, categories }, active) {
  const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  const rows = sorted.length
    ? sorted
        .map(([cat, amt]) => {
          const pct = total > 0 ? Math.round((amt / total) * 100) : 0;
          return `<div class="category-bar-row">
            <div class="category-bar-head">
              <span class="category-bar-name">${escapeHtml(cat)}</span>
              <span class="category-bar-amount">${formatRupiah(amt)}</span>
            </div>
            <div class="category-bar-track"><div class="category-bar-fill" style="width:${pct}%"></div></div>
          </div>`;
        })
        .join("")
    : `<div class="empty-state">No data yet.</div>`;

  return `<div data-tab-panel="${key}" ${active ? "" : "hidden"}>
    ${rows}
    <div class="category-total-row"><span>Total</span><span>${formatRupiah(total)}</span></div>
  </div>`;
}

// Toggle tab Category Breakdown tanpa reload - konten semua tab udah ke-render, tinggal
// disembunyiin/ditampilin (lihat categoryTabPanelHtml).
function segmentedTabsScript() {
  return `<script>
    (function () {
      var tabs = document.querySelectorAll(".segmented-tab[data-tab-target]");
      var panels = document.querySelectorAll("[data-tab-panel]");
      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          tabs.forEach(function (t) { t.classList.remove("active"); });
          tab.classList.add("active");
          var key = tab.dataset.tabTarget;
          panels.forEach(function (p) { p.hidden = p.dataset.tabPanel !== key; });
        });
      });
    })();
  </script>`;
}

// Filter lokal (client-side, bukan request baru ke server) buat nyari transaksi yang udah
// ke-render di Recent Transactions - cukup buat 15 item terakhir yang emang ditampilin. Baca
// langsung dari teks nama transaksi yang udah ditampilin (.txn-title), bukan dari data-attribute
// terpisah, biar nggak ada 2 sumber data yang bisa beda (dan nggak kena masalah escaping kalau
// deskripsinya ada tanda kutip).
function txnFilterScript() {
  return `<script>
    (function () {
      var input = document.getElementById("txn-filter-input");
      if (!input) return;
      var items = document.querySelectorAll(".txn-item");
      input.addEventListener("input", function () {
        var q = input.value.trim().toLowerCase();
        items.forEach(function (item) {
          var titleEl = item.querySelector(".txn-title");
          var text = titleEl ? titleEl.textContent.toLowerCase() : "";
          item.hidden = q.length > 0 && text.indexOf(q) === -1;
        });
      });
    })();
  </script>`;
}

function weeklyBudgetDialogScript() {
  return `<script>
    (function () {
      var btn = document.getElementById("edit-budget-btn");
      var dialog = document.getElementById("weekly-budget-dialog");
      var closeBtn = document.getElementById("weekly-budget-close");
      if (!btn || !dialog) return;
      btn.addEventListener("click", function () { dialog.showModal(); });
      if (closeBtn) closeBtn.addEventListener("click", function () { dialog.close(); });
      dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
    })();
  </script>`;
}

export function renderSpendingDashboard({
  monthKey,
  monthLabel,
  todayDateKey,
  weeklyBudget,
  weekSpent,
  safeToSpendPerDay,
  today,
  week,
  month,
  weekChartData,
  transactionItemsHtml,
  flash,
}) {
  const remaining = weeklyBudget ? weeklyBudget - weekSpent : null;
  const budgetPct = weeklyBudget ? ((remaining ?? 0) / weeklyBudget) * 100 : 0;
  const overBudget = remaining != null && remaining < 0;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Spending Tracker</title>
${faviconLink("/icons/spending.png")}
<style>${DASHBOARD_CSS}</style>
<style>${SPENDING_PAGE_CSS}</style>
</head>
<body>
  <div class="container">
    <header class="hub-header">
      <div class="hub-topbar">
        <a class="nav-link" href="/hub">← Hub</a>
        <div class="hub-topbar-actions">
          <input type="month" class="month-input" value="${monthKey}" onchange="location.href='/dashboard/spending?month=' + this.value">
          ${themeToggleHtml()}
        </div>
      </div>
      <h1 class="hub-greeting" style="font-size:22px;">${svgIconLabel("wallet", "Spending Tracker")}</h1>
    </header>

    ${flash ? `<div class="flash flash-${flash.type}">${escapeHtml(flash.text)}</div>` : ""}

    <section class="grid-2-always">
      <div class="card glass-card">
        <div class="card-label">${svgIconLabel("calendar", "Today")}</div>
        <div class="card-value">${formatRupiah(today.total)}</div>
        <div class="card-sub">${today.count} transaction${today.count === 1 ? "" : "s"}</div>
      </div>
      <div class="card glass-card">
        <div class="card-label">${svgIconLabel("barChart", "This Month")}</div>
        <div class="card-value">${formatRupiah(month.total)}</div>
        <div class="card-sub">${escapeHtml(monthLabel)}</div>
      </div>
    </section>

    <div class="card glass-card" style="margin-top:12px;">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
        <div class="card-label" style="margin-bottom:0;">${svgIconLabel("wallet", "Daily Safe-to-Spend")}</div>
        <button type="button" class="icon-btn" id="edit-budget-btn" aria-label="Edit weekly budget">${svgIcon("edit", { size: 15 })}</button>
      </div>
      <div class="card-value ${overBudget ? "text-danger-soft" : ""}">${safeToSpendPerDay != null ? `${formatRupiah(safeToSpendPerDay)}/day` : "No budget set"}</div>
      ${weeklyBudget ? statBarHtml(budgetPct) : ""}
      <div class="card-sub">${
        remaining != null
          ? remaining >= 0
            ? `${formatRupiah(remaining)} left this week`
            : `${formatRupiah(Math.abs(remaining))} over this week`
          : "Set a weekly budget to see your daily safe-to-spend."
      }</div>
    </div>

    <h2>${svgIconLabel("wallet", "Log Expense")}</h2>
    <div class="card glass-card">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px;">
        <div class="card-label" style="margin-bottom:0;">What did you spend on?</div>
        <input type="date" class="log-expense-date" name="date" form="log-expense-form" value="${todayDateKey}" max="${todayDateKey}" aria-label="Date">
      </div>
      <form method="POST" action="/dashboard/spending/expense-text" id="log-expense-form">
        <input type="text" name="text" placeholder="e.g. kopi 25k, parkir 5k" required>
        <button type="submit">Save</button>
      </form>
      <details class="inline-toggle" style="margin-top:10px;">
        <summary>${svgIconLabel("receipt", "Upload a receipt photo instead")}</summary>
        <div class="inline-toggle-body">
          <form method="POST" action="/dashboard/spending/expense-photo" enctype="multipart/form-data" id="expense-photo-form">
            <input type="file" name="photo" accept="image/*" required>
            <button type="submit" id="expense-photo-submit">Save</button>
            <div class="upload-progress" id="expense-photo-progress" hidden>
              <div class="upload-progress-bar"></div>
            </div>
          </form>
        </div>
      </details>
    </div>

    <h2>${svgIconLabel("tag", "Category Breakdown")}</h2>
    <div class="card glass-card">
      <div class="segmented-tabs">
        <button type="button" class="segmented-tab active" data-tab-target="today">Today</button>
        <button type="button" class="segmented-tab" data-tab-target="week">This Week</button>
        <button type="button" class="segmented-tab" data-tab-target="month">This Month</button>
      </div>
      ${categoryTabPanelHtml("today", today, true)}
      ${categoryTabPanelHtml("week", week, false)}
      ${categoryTabPanelHtml("month", month, false)}
    </div>

    <h2>${svgIconLabel("barChart", "7-Day Spending Trend")}</h2>
    ${
      weekChartData?.length
        ? `<div class="chart-card glass-card">${horizontalStackedBarChartSvg(weekChartData, buildCategorySeries(weekChartData), {
            formatValue: (v) => `${Math.round(v / 1000)}k`,
            itemsPerRow: 4,
          })}</div>`
        : ""
    }

    <h2>${svgIconLabel("receipt", "Recent Transactions")}</h2>
    <div class="txn-filter">
      ${svgIcon("search", { size: 15 })}
      <input type="text" id="txn-filter-input" placeholder="Search transactions...">
    </div>
    <div class="txn-list">${transactionItemsHtml || `<div class="empty-state">No transactions yet.</div>`}</div>
  </div>

  ${bottomNavHtml("/dashboard/spending")}

  <dialog class="modal-dialog glass-card" id="weekly-budget-dialog">
    <div class="modal-dialog-body">
      <div class="modal-dialog-header">
        <h3>${svgIconLabel("edit", "Set / Update Weekly Budget")}</h3>
        <button type="button" class="modal-close-btn" id="weekly-budget-close">✕</button>
      </div>
      <p class="modal-dialog-caption">Top up nominal baru ditambahkan ke Running Balance, dan jadi acuan budget mingguan berikutnya.</p>
      <form method="POST" action="/dashboard/spending/topup">
        <input type="number" name="amount" placeholder="e.g. 500000" required>
        <button type="submit">Save</button>
      </form>
    </div>
  </dialog>

  ${progressFormScript([
    { formId: "expense-photo-form", submitId: "expense-photo-submit", progressId: "expense-photo-progress", loadingLabel: "Reading receipt..." },
  ])}
  ${segmentedTabsScript()}
  ${txnFilterScript()}
  ${weeklyBudgetDialogScript()}
</body>
</html>`;
}
