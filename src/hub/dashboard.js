import { DASHBOARD_CSS, escapeHtml, navHeader, faviconLink, iconLabel, themeToggleHtml } from "../shared/dashboard-layout.js";
import { clockedHubCardHtml } from "./clocked/dashboard.js";
import { grindHubCardHtml } from "./grind/dashboard.js";

function formatRupiah(amount) {
  return `Rp${Math.round(amount).toLocaleString("id-ID")}`;
}

function activityRow({ icon, title, subtitle, time }) {
  return `
    <div class="activity-row">
      <div class="activity-icon">${icon}</div>
      <div class="activity-main">
        <div class="activity-title">${escapeHtml(title || "")}</div>
        ${subtitle ? `<div class="activity-subtitle">${escapeHtml(subtitle)}</div>` : ""}
      </div>
      ${time ? `<div class="activity-time">${time}</div>` : ""}
    </div>`;
}

function formatRupiahSigned(amount) {
  const sign = amount < 0 ? "-" : "";
  return `${sign}${formatRupiah(Math.abs(amount))}`;
}

// Chips 1-tap buat transaksi yang sering berulang (lihat getFrequentExpenses di
// spending/supabase.js) - klik chip langsung submit tanpa perlu ngetik ulang, lihat
// quickExpenseScript. data-text formatnya "deskripsi jumlah" (langsung kebaca parseExpenseInputs).
function frequentChipsHtml(frequentExpenses) {
  if (!frequentExpenses.length) return "";
  const chips = frequentExpenses
    .map(
      (f) =>
        `<button type="button" class="freq-chip" data-text="${escapeHtml(f.description)} ${f.amount}">${escapeHtml(f.description)} · ${formatRupiah(f.amount)}</button>`
    )
    .join("");
  return `<div class="freq-chip-row">${chips}</div>`;
}

// CSS khusus halaman /hub (FAB Quick Expense + dialog-nya) - sengaja ditaruh di sini, BUKAN di
// shared/dashboard-layout.js, biar nggak nular ke halaman lain yang nggak butuh FAB ini sama
// sekali (lihat juga grind/dashboard.js buat FAB Import Plan, pola yang sama tapi terpisah).
const HUB_PAGE_CSS = `
  .hub-fab {
    position: fixed; bottom: calc(20px + env(safe-area-inset-bottom)); right: 20px; z-index: 40;
    display: inline-flex; align-items: center; justify-content: center;
    padding: 14px 22px; border-radius: 999px; border: none;
    background: var(--accent); color: #fff; font-size: 15px; font-weight: 700;
    box-shadow: 0 8px 24px rgba(41,37,36,.3); cursor: pointer; font-family: inherit;
  }
  .hub-fab:hover { background: var(--accent-hover); }

  dialog.qe-dialog {
    border: none; border-radius: 16px; padding: 0; margin: auto; background: var(--surface); color: var(--text);
    max-width: 380px; width: calc(100% - 32px); box-shadow: 0 12px 40px rgba(0,0,0,.25);
  }
  dialog.qe-dialog::backdrop { background: rgba(28,25,23,.45); backdrop-filter: blur(2px); }
  .qe-dialog-body { padding: 18px; }
  .qe-dialog-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .qe-dialog-header h3 { margin: 0; font-size: 15px; }
  .qe-close-btn {
    border: none; background: var(--bg); color: var(--text-muted); font-size: 16px; line-height: 1;
    cursor: pointer; width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
  }
  .qe-close-btn:hover { background: var(--surface-hover); color: var(--text); }
  .qe-dialog-body input[type="text"] {
    width: 100%; padding: 9px 10px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--bg); color: var(--text); box-sizing: border-box; font-size: 14px; margin-bottom: 8px;
  }
  .qe-dialog-body button[type="submit"] {
    width: 100%; padding: 9px 10px; border-radius: 8px; border: none;
    background: var(--accent); color: #fff; font-size: 13px; cursor: pointer; font-family: inherit;
  }
  .qe-dialog-body button[type="submit"]:hover { background: var(--accent-hover); }
  .freq-chip-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
  .freq-chip {
    padding: 6px 12px; border-radius: 999px; background: var(--bg); border: 1px solid var(--border);
    color: var(--text); font-size: 12px; cursor: pointer; font-family: inherit;
  }
  .freq-chip:hover { background: var(--surface-hover); border-color: var(--border-hover); }

  .hub-toast {
    position: fixed; bottom: calc(86px + env(safe-area-inset-bottom)); left: 50%; transform: translateX(-50%);
    background: var(--text); color: var(--bg); padding: 10px 18px; border-radius: 999px; font-size: 13px;
    box-shadow: 0 8px 24px rgba(0,0,0,.2); z-index: 50; max-width: calc(100% - 40px); text-align: center;
  }
`;

// Dialog Quick Expense + wiring-nya: FAB buka dialog (autofocus input), chip 1-tap langsung
// submit, form submit fetch ke POST /hub/quick-expense (JSON) tanpa reload - sukses update card
// Spending & list Recent in-place, gagal nampilin pesan error di dalam dialog.
function quickExpenseDialogHtml(frequentExpenses) {
  return `<button type="button" class="hub-fab" id="quick-expense-fab" aria-label="Quick Expense">+ Rp</button>
  <dialog class="qe-dialog" id="quick-expense-dialog">
    <div class="qe-dialog-body">
      <div class="qe-dialog-header">
        <h3>💸 Quick Expense</h3>
        <button type="button" class="qe-close-btn" id="quick-expense-close">✕</button>
      </div>
      ${frequentChipsHtml(frequentExpenses)}
      <form id="quick-expense-form">
        <input type="text" id="quick-expense-input" placeholder="kopi 25k, parkir 5k..." autocomplete="off" required>
        <div class="card-sub text-danger-soft" id="quick-expense-error" hidden></div>
        <button type="submit">Add</button>
      </form>
    </div>
  </dialog>
  <div class="hub-toast" id="hub-toast" hidden></div>`;
}

function quickExpenseScript() {
  return `<script>
    (function () {
      var fab = document.getElementById("quick-expense-fab");
      var dialog = document.getElementById("quick-expense-dialog");
      var closeBtn = document.getElementById("quick-expense-close");
      var form = document.getElementById("quick-expense-form");
      var input = document.getElementById("quick-expense-input");
      var errorBox = document.getElementById("quick-expense-error");
      var toast = document.getElementById("hub-toast");
      if (!fab || !dialog || !form || !input) return;

      function formatRupiah(n) { return "Rp" + Math.round(n).toLocaleString("id-ID"); }

      function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.hidden = false;
        clearTimeout(window.__hubToastTimer);
        window.__hubToastTimer = setTimeout(function () { toast.hidden = true; }, 2500);
      }

      function updateSpendingCard(data) {
        var body = document.getElementById("spending-card-body");
        if (!body) return;
        var safeHtml = "";
        if (data.safeToSpend != null) {
          var over = data.todayTotal > data.safeToSpend;
          safeHtml = '<div class="card-sub ' + (over ? "text-danger-soft" : "text-success") + '">Safe: ' + formatRupiah(data.safeToSpend) + '/day</div>';
        }
        body.innerHTML =
          '<div class="card-value">' + formatRupiah(data.todayTotal) + '</div>' +
          '<div class="card-sub">' + data.todayCount + ' transaction' + (data.todayCount === 1 ? "" : "s") + ' today</div>' +
          safeHtml;
      }

      function prependRecent(item) {
        var list = document.getElementById("recent-activity-list");
        if (!list) return;
        var empty = list.querySelector(".empty-state");
        if (empty) empty.remove();
        var row = document.createElement("div");
        row.className = "activity-row";
        row.innerHTML =
          '<div class="activity-icon">💰</div>' +
          '<div class="activity-main"><div class="activity-title"></div><div class="activity-subtitle"></div></div>' +
          '<div class="activity-time"></div>';
        row.querySelector(".activity-title").textContent = item.description;
        row.querySelector(".activity-subtitle").textContent = formatRupiah(item.amount);
        row.querySelector(".activity-time").textContent = item.time;
        list.insertBefore(row, list.firstChild);
      }

      function submitQuickExpense(text) {
        text = (text || "").trim();
        if (!text) return;
        errorBox.hidden = true;
        fetch("/hub/quick-expense", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text }),
        })
          .then(function (r) { return r.json().then(function (data) { return { httpOk: r.ok, data: data }; }); })
          .then(function (result) {
            if (!result.httpOk || !result.data.ok) {
              throw new Error((result.data && result.data.error) || "Gagal menyimpan.");
            }
            dialog.close();
            input.value = "";
            updateSpendingCard(result.data);
            result.data.items.forEach(prependRecent);
            showToast("✓ Added " + result.data.items.length + " expense" + (result.data.items.length === 1 ? "" : "s"));
          })
          .catch(function (err) {
            errorBox.textContent = "⚠️ " + err.message;
            errorBox.hidden = false;
          });
      }

      fab.addEventListener("click", function () {
        errorBox.hidden = true;
        dialog.showModal();
        input.focus();
      });
      if (closeBtn) closeBtn.addEventListener("click", function () { dialog.close(); });
      dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        submitQuickExpense(input.value);
      });
      document.querySelectorAll(".freq-chip").forEach(function (chip) {
        chip.addEventListener("click", function () { submitQuickExpense(chip.dataset.text); });
      });

      // Deep-link dari PWA App Shortcut "Quick Spend" (lihat public/manifest.json, url
      // "/hub?action=quick-expense") - buka dialog otomatis & autofocus biar keyboard HP langsung
      // nongol, lalu bersihin query string-nya (replaceState, bukan redirect) biar refresh manual
      // nggak numbuhin dialog ini lagi-lagi.
      function openFromUrlAction() {
        var action = new URLSearchParams(window.location.search).get("action");
        if (action !== "quick-expense") return;
        fab.click();
        window.history.replaceState({}, "", "/hub");
      }
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", openFromUrlAction);
      } else {
        openFromUrlAction();
      }
    })();
  </script>`;
}

export function renderHubDashboard({
  greeting,
  dateLabel,
  username,
  spendingToday,
  calorieToday,
  vaultSummary,
  clockedToday,
  grindToday,
  recentActivity,
  frequentExpenses = [],
}) {
  const hasSpending = spendingToday && spendingToday.total > 0;
  const hasCalorie = calorieToday && calorieToday.calories > 0;

  const calorieCard = hasCalorie
    ? `<div class="card-value">${Math.round(calorieToday.calories).toLocaleString("en-US")} kcal</div>
       <div class="card-sub">Protein ${calorieToday.protein_g}g</div>`
    : `<div class="empty-state">No food logged yet<br>+ Log food</div>`;

  // Safe-to-Spend: sisa budget mingguan (lihat getWeeklyBudget di spending/supabase.js, derived
  // dari ledger) dibagi rata ke sisa hari minggu ini (termasuk hari ini) - ijo kalau pengeluaran
  // hari ini masih di bawah jatah harian, merah lembut kalau udah lewat.
  const safeToSpendLine =
    spendingToday?.safeToSpendPerDay != null
      ? `<div class="card-sub ${(spendingToday.total || 0) > spendingToday.safeToSpendPerDay ? "text-danger-soft" : "text-success"}">Safe: ${formatRupiah(spendingToday.safeToSpendPerDay)}/day</div>`
      : "";

  const spendingCard = hasSpending
    ? `<div class="card-value">${formatRupiah(spendingToday.total)}</div>
       <div class="card-sub">${spendingToday.count} transaction${spendingToday.count === 1 ? "" : "s"} today</div>
       ${safeToSpendLine}`
    : `<div class="empty-state">No spending yet<br>+ Log spending</div>${safeToSpendLine}`;

  const { html: clockedCard, script: clockedScript } = clockedHubCardHtml(clockedToday);
  const grindCard = grindHubCardHtml(grindToday);

  const recentRows = recentActivity.length
    ? recentActivity.map((a) => activityRow(a)).join("")
    : `<div class="empty-state">No activity yet today.</div>`;

  const vaultCard = vaultSummary
    ? `<div class="card-value card-value-compact ${vaultSummary.monthlyRemaining < 0 ? "text-danger-soft" : ""}">${formatRupiahSigned(vaultSummary.monthlyRemaining)} left</div>
       <div class="card-sub">Monthly pool · ${vaultSummary.unpaidBillsCount} unpaid Bill${vaultSummary.unpaidBillsCount === 1 ? "" : "s"}</div>`
    : `<div class="empty-state">Couldn't load vault.</div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mylo Hub</title>
${faviconLink("/icons/hub.png")}
<style>${DASHBOARD_CSS}</style>
<style>${HUB_PAGE_CSS}</style>
</head>
<body>
  <div class="container">
    <header class="hub-header">
      <div class="hub-topbar">
        <span class="hub-date">${dateLabel}</span>
        <div class="hub-topbar-actions">
          ${themeToggleHtml()}
          <a class="logout" href="/logout">Log out</a>
        </div>
      </div>
      <h1 class="hub-greeting">${greeting}</h1>
      <p class="hub-sub">Here's your day so far, ${escapeHtml(username)}.</p>
    </header>

    <section class="grid-2-always">
      <a class="card" href="/dashboard/calorie">
        <div class="card-label">${iconLabel("/icons/calorie.png", "Calories")}</div>
        ${calorieCard}
      </a>
      <a class="card" href="/dashboard/spending">
        <div class="card-label">${iconLabel("/icons/spending.png", "Spending")}</div>
        <div id="spending-card-body">${spendingCard}</div>
      </a>
      <div class="card" onclick="location.href='/hub/clocked'" style="cursor:pointer;">
        <div class="card-label">${iconLabel("/icons/clocked.png", "Clocked!")}</div>
        ${clockedCard}
      </div>
      <a class="card" href="/hub/vault">
        <div class="card-label">${iconLabel("/icons/vault.png", "Vault")}</div>
        ${vaultCard}
      </a>
    </section>

    <h2>${iconLabel("/icons/grind-icon.png", "Grind")}</h2>
    <div class="card" onclick="location.href='/hub/grind'" style="cursor:pointer;">${grindCard}</div>

    <h2>Recent</h2>
    <div class="activity-list" id="recent-activity-list">${recentRows}</div>

    <div class="hub-nav-group">
      <h2>Trackers</h2>
      <div class="hub-nav-links">
        <a class="hub-nav-item" href="/dashboard/calorie">${iconLabel("/icons/calorie.png", "Calories")}</a>
        <a class="hub-nav-item" href="/dashboard/spending">${iconLabel("/icons/spending.png", "Spending")}</a>
        <a class="hub-nav-item" href="/hub/grind">${iconLabel("/icons/grind-icon.png", "Grind")}</a>
      </div>
    </div>
    <div class="hub-nav-group">
      <h2>Mini Apps</h2>
      <div class="hub-nav-links">
        <a class="hub-nav-item" href="/hub/vault">${iconLabel("/icons/vault.png", "Vault")}</a>
        <a class="hub-nav-item" href="/hub/clocked">${iconLabel("/icons/clocked.png", "Clocked!")}</a>
        <a class="hub-nav-item" href="/hub/journal">${iconLabel("/icons/journal.png", "Journal")}</a>
      </div>
    </div>
  </div>
  ${quickExpenseDialogHtml(frequentExpenses)}
  ${clockedScript}
  ${quickExpenseScript()}
</body>
</html>`;
}
