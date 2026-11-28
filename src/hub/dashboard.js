import { DASHBOARD_CSS, escapeHtml, navHeader, faviconLink, iconLabel, svgIcon, svgIconLabel, themeToggleHtml, bottomNavHtml } from "../shared/dashboard-layout.js";
import { clockedHubCardHtml } from "./clocked/dashboard.js";
import { grindHubCardHtml } from "./grind/dashboard.js";

// Semua halaman/mini-app sekunder yang ada di src/ (selain Calories/Spending/Grind yang udah
// kebagian kartu bento + section tersendiri di atas) - lihat masing-masing src/hub/<nama>/router.js
// buat route persisnya. Grind sendiri nggak diulang di sini, tapi Gym (sub-halaman standalone
// Grind, src/hub/grind/gym-page.js) ikut nongol karena belum ada link langsung ke situ dari /hub.
const MINI_APPS = [
  { icon: "shieldCheck", label: "Vault", href: "/hub/vault" },
  { icon: "clock", label: "Clocked!", href: "/hub/clocked" },
  { icon: "book", label: "Journal", href: "/hub/journal" },
  { icon: "dumbbell", label: "Gym", href: "/hub/grind/gym" },
  { icon: "smile", label: "Mood", href: "/hub/mood" },
  { icon: "sparkle", label: "Skincare", href: "/hub/skincare" },
  { icon: "heart", label: "Wishlist", href: "/hub/wishlist" },
];

function miniAppsGridHtml() {
  const tiles = MINI_APPS.map(
    (app) => `<a class="card glass-card mini-app-tile" href="${app.href}">
      <span class="mini-app-icon">${svgIcon(app.icon, { size: 18 })}</span>
      <span class="mini-app-label">${escapeHtml(app.label)}</span>
    </a>`
  ).join("");
  return `<div class="mini-apps-grid">${tiles}</div>`;
}

// ---------- This Week strip (full-width, below the 2x2 bento grid, directly above GRIND) ----------
// Compact weekly snapshot pulling from the same source as Schedule This Week on /hub/grind
// (weekPlans = real plans merged with virtual default Gym/Badminton plans, see
// injectDefaultGymPlans) - rendered here as 7 day-dots + 3 metrics + an "Up Next" row, instead of
// repeating another 2x2 grid.
const WEEK_DOT_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

// "done" = solid accent fill, "skipped" = muted grey with a small strike mark, "planned" = dashed
// outline (upcoming), "empty" = bare outline (no plan that day at all).
function weekDayDotsHtml(dayStates, todayKey) {
  return dayStates
    .map((d, i) => {
      const isToday = d.dateKey === todayKey;
      const cls = ["week-day-dot", `week-day-dot-${d.state}`, isToday ? "week-day-dot-today" : ""]
        .filter(Boolean)
        .join(" ");
      return `<span class="${cls}" title="${WEEK_DOT_LETTERS[i]} · ${d.dateKey}"></span>`;
    })
    .join("");
}

// Quick-action pill on the "Up Next" row - the plan there is always still PENDING (not completed
// yet, see findUpNextPlan in hub/router.js), so the button always reads as an action to take
// ("Log"/"Done"), never a checkmark. Virtual Gym/Badminton plans (no plan.id yet) link to their
// respective page/form, a real REST plan completes in place (POST, redirects to /hub/grind), any
// other plan type opens the quick-logger on /hub/grind to record the result.
function upNextActionHtml(plan) {
  if (plan.virtual && plan.session_type === "GYM") {
    return `<a class="week-strip-action-pill" href="/hub/grind/gym?split=${encodeURIComponent(plan.sub_type)}" onclick="event.stopPropagation()">Log →</a>`;
  }
  if (plan.virtual && plan.session_type === "BADMINTON") {
    return `<a class="week-strip-action-pill" href="/hub/grind?form=badminton#today-logger" onclick="event.stopPropagation()">Log →</a>`;
  }
  if (plan.session_type === "REST") {
    return `<form method="POST" action="/hub/grind/plan/${plan.id}/complete-rest" style="margin:0;" onclick="event.stopPropagation()"><button type="submit" class="week-strip-action-pill">Done →</button></form>`;
  }
  return `<a class="week-strip-action-pill" href="/hub/grind?complete=${plan.id}#today-logger" onclick="event.stopPropagation()">Log →</a>`;
}

function thisWeekStripHtml(thisWeek, todayKey) {
  const { weekRangeLabel, dayStates, sessionsLabel, kmLabel, spendLabel, upNextPlan } = thisWeek;

  const upNextRight = upNextPlan
    ? `<span class="week-strip-upnext-title">${escapeHtml(upNextPlan.title || upNextPlan.session_type)}</span>
       ${upNextPlan.scheduled_time ? `<span class="week-strip-time-badge">${upNextPlan.scheduled_time}</span>` : ""}
       ${upNextActionHtml(upNextPlan)}`
    : `<span class="week-strip-upnext-title" style="color:var(--text-dim); font-weight:500;">All caught up this week 🎉</span>`;

  return `<div class="card glass-card week-strip" onclick="location.href='/hub/grind'" style="cursor:pointer;">
    <div class="week-strip-top">
      <span class="week-strip-label">THIS WEEK (${escapeHtml(weekRangeLabel)})</span>
      <div class="week-day-dots">${weekDayDotsHtml(dayStates, todayKey)}</div>
    </div>
    <div class="week-strip-metrics">
      <span>${escapeHtml(sessionsLabel)}</span>
      <span>${escapeHtml(kmLabel)}</span>
      <span>${escapeHtml(spendLabel)}</span>
    </div>
    <div class="week-strip-upnext">
      <span class="week-strip-upnext-label">Up Next</span>
      ${upNextRight}
    </div>
  </div>`;
}

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
        `<button type="button" class="freq-chip chip-btn" data-text="${escapeHtml(f.description)} ${f.amount}">${escapeHtml(f.description)} · ${formatRupiah(f.amount)}</button>`
    )
    .join("");
  return `<div class="freq-chip-row">${chips}</div>`;
}

// CSS khusus halaman /hub (FAB Quick Expense + dialog-nya) - sengaja ditaruh di sini, BUKAN di
// shared/dashboard-layout.js, biar nggak nular ke halaman lain yang nggak butuh FAB ini sama
// sekali (lihat juga grind/dashboard.js buat FAB Import Plan, pola yang sama tapi terpisah).
const HUB_PAGE_CSS = `
  /* Ruang kosong ekstra di bawah biar konten terakhir (nav bawah dst) nggak ketutupan FAB "+ Rp"
     yang posisinya fixed melayang di pojok kanan bawah. */
  .container { padding-bottom: calc(144px + env(safe-area-inset-bottom)); }

  /* Warna/blur FAB (gradasi + kaca) datang dari .fab-btn (shared) - di sini cuma posisi/ukuran. */
  .hub-fab {
    position: fixed; bottom: calc(84px + env(safe-area-inset-bottom)); right: 20px; z-index: 40;
    display: inline-flex; align-items: center; justify-content: center;
    padding: 14px 22px; border-radius: 999px;
    color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit;
  }

  /* ---------- This Week strip (full-width, below the 2x2 bento grid, directly above GRIND) ---------- */
  .week-strip { display: flex; flex-direction: column; gap: 8px; margin-top: 20px; margin-bottom: 14px; }
  .week-strip-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .week-strip-label { font-size: 11px; font-weight: 700; letter-spacing: .04em; color: var(--text-dim); }
  .week-day-dots { display: flex; gap: 6px; }
  .week-day-dot {
    position: relative; width: 9px; height: 9px; border-radius: 999px; border: 1.5px solid var(--border);
    background: transparent; box-sizing: border-box;
  }
  .week-day-dot-done { background: var(--success); border-color: var(--success); }
  .week-day-dot-planned { border-style: dashed; border-color: var(--accent); }
  /* Skipped - muted grey fill + a small diagonal strike, clearly different from both the solid
     accent "done" dot and the dashed "planned" outline. */
  .week-day-dot-skipped { background: var(--text-dim); border-color: var(--text-dim); opacity: .55; }
  .week-day-dot-skipped::after {
    content: ""; position: absolute; left: -1px; right: -1px; top: 50%; height: 1px;
    background: var(--bg); transform: translateY(-50%) rotate(-45deg);
  }
  .week-day-dot-today { box-shadow: 0 0 0 2px rgba(201, 115, 104, .3); }
  .week-strip-metrics { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text); }
  .week-strip-metrics span:not(:last-child)::after { content: "·"; margin-left: 8px; color: var(--text-dim); font-weight: 400; }
  .week-strip-upnext {
    display: flex; align-items: center; gap: 8px; font-size: 12.5px;
    padding-top: 8px; border-top: 1px solid var(--border);
  }
  .week-strip-upnext-label { flex-shrink: 0; color: var(--text-dim); font-weight: 600; }
  .week-strip-upnext-title {
    flex: 1; min-width: 0; font-weight: 600; color: var(--text);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .week-strip-time-badge {
    flex-shrink: 0; font-size: 11px; font-weight: 600; color: var(--text-muted);
    padding: 2px 8px; border-radius: 999px; border: 1px dashed var(--border);
    font-variant-numeric: tabular-nums;
  }
  .week-strip-action-pill {
    flex-shrink: 0; display: inline-flex; align-items: center; gap: 3px;
    padding: 4px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 700;
    background: var(--accent-deep); color: var(--accent-light); cursor: pointer; border: none;
    text-decoration: none; font-family: inherit;
  }

  dialog.qe-dialog {
    border: 1px solid var(--glass-border); border-radius: 16px; padding: 0; margin: auto; color: var(--text);
    max-width: 380px; width: calc(100% - 32px); box-shadow: var(--glass-shadow);
    background: var(--glass-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
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
    position: fixed; top: calc(16px + env(safe-area-inset-top)); left: 50%; transform: translate(-50%, 0);
    background: var(--text); color: var(--bg); padding: 10px 18px; border-radius: 999px; font-size: 13px;
    box-shadow: 0 8px 24px rgba(0,0,0,.2); z-index: 60; max-width: calc(100% - 40px); text-align: center;
    animation: hub-toast-slide-down 0.25s ease-out;
  }
  @keyframes hub-toast-slide-down {
    from { opacity: 0; transform: translate(-50%, -12px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }

  /* Grid app launcher "Mini Apps & Tools" - 2 kolom compact horizontal (icon kiri + label kanan
     sejajar presisi di 1 baris), ganti dari 3 kolom kotak besar icon-on-top sebelumnya. */
  .mini-apps-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .mini-app-tile {
    min-height: unset; padding: 12px 14px; display: flex; flex-direction: row; align-items: center;
    justify-content: flex-start; gap: 10px; text-align: left; text-decoration: none; color: var(--text);
  }
  .mini-app-tile:active { transform: scale(0.96); transition: transform 0.1s ease; }
  .mini-app-icon {
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    width: 34px; height: 34px; border-radius: 10px; background: var(--accent-deep); color: var(--accent-light);
  }
  .mini-app-icon .svg-icon { margin: 0; }
  .mini-app-label { flex: 1; min-width: 0; font-size: 13.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;

// Dialog Quick Expense + wiring-nya: FAB buka dialog (autofocus input), chip 1-tap langsung
// submit, form submit fetch ke POST /hub/quick-expense (JSON) tanpa reload - sukses update card
// Spending & list Recent in-place, gagal nampilin pesan error di dalam dialog.
function quickExpenseDialogHtml(frequentExpenses) {
  return `<button type="button" class="hub-fab fab-btn" id="quick-expense-fab" aria-label="Quick Expense">+ Rp</button>
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
          safeHtml +
          '<div class="card-action-link">View spending<svg class="svg-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></div>';
      }

      function prependRecent(item) {
        var list = document.getElementById("recent-activity-list");
        if (!list) return;
        var empty = list.querySelector(".empty-state");
        if (empty) empty.remove();
        var row = document.createElement("div");
        row.className = "activity-row";
        row.innerHTML =
          '<div class="activity-icon">${svgIcon("wallet", { size: 16 })}</div>' +
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
              throw new Error((result.data && result.data.error) || "Failed to save.");
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
  thisWeek,
  todayKey,
  recentActivity,
  frequentExpenses = [],
}) {
  const hasSpending = spendingToday && spendingToday.total > 0;
  const hasCalorie = calorieToday && calorieToday.calories > 0;

  // Card-action-link render DIV (bukan <a>) sengaja - kartu ini udah dibungkus <a class="card">
  // sendiri (lihat markup di bawah), nested <a> invalid & bisa bikin behavior klik aneh.
  const calorieCard = `
    <div class="card-value">${hasCalorie ? `${Math.round(calorieToday.calories).toLocaleString("en-US")} kcal` : "No food logged yet"}</div>
    ${hasCalorie ? `<div class="card-sub">Protein ${calorieToday.protein_g}g</div>` : ""}
    <div class="card-action-link">${svgIcon("plus", { size: 14 })}Log food</div>`;

  // Safe-to-Spend: sisa budget mingguan (lihat getWeeklyBudget di spending/supabase.js, derived
  // dari ledger) dibagi rata ke sisa hari minggu ini (termasuk hari ini) - ijo kalau pengeluaran
  // hari ini masih di bawah jatah harian, merah lembut kalau udah lewat.
  const safeToSpendLine =
    spendingToday?.safeToSpendPerDay != null
      ? `<div class="card-sub ${(spendingToday.total || 0) > spendingToday.safeToSpendPerDay ? "text-danger-soft" : "text-success"}">Safe: ${formatRupiah(spendingToday.safeToSpendPerDay)}/day</div>`
      : "";

  const spendingCard = `
    <div class="card-value">${hasSpending ? formatRupiah(spendingToday.total) : "No spending yet"}</div>
    <div class="card-sub">${spendingToday?.count || 0} transaction${spendingToday?.count === 1 ? "" : "s"} today</div>
    ${safeToSpendLine}
    <div class="card-action-link">View spending${svgIcon("arrowRight", { size: 14 })}</div>`;

  const { html: clockedCard, script: clockedScript } = clockedHubCardHtml(clockedToday);
  const grindCard = grindHubCardHtml(grindToday);

  const recentRows = recentActivity.length
    ? recentActivity.map((a) => activityRow(a)).join("")
    : `<div class="empty-state">No activity yet today.</div>`;

  const vaultNegative = !!vaultSummary && vaultSummary.monthlyRemaining < 0;
  const vaultCard = vaultSummary
    ? `<div class="card-value ${vaultNegative ? "text-danger-soft" : ""}">${formatRupiahSigned(vaultSummary.monthlyRemaining)}</div>
       <div class="card-sub">left in monthly pool</div>
       ${vaultSummary.unpaidBillsCount > 0 ? `<div class="card-sub text-danger-soft">${svgIcon("alertCircle", { size: 13 })}${vaultSummary.unpaidBillsCount} unpaid Bill${vaultSummary.unpaidBillsCount === 1 ? "" : "s"}</div>` : ""}`
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
      <a class="card bento-card" href="/dashboard/calorie">
        <div class="card-label">${svgIconLabel("flame", "Calories")}</div>
        ${calorieCard}
      </a>
      <a class="card bento-card card-accent" href="/dashboard/spending">
        <div class="card-label">${svgIconLabel("wallet", "Spending")}</div>
        <div id="spending-card-body">${spendingCard}</div>
      </a>
      <div class="card bento-card" onclick="location.href='/hub/clocked'" style="cursor:pointer;">
        <div class="card-label">${svgIconLabel("clock", "Clocked!")}</div>
        ${clockedCard}
      </div>
      <a class="card bento-card${vaultNegative ? " card-tint-danger" : ""}" href="/hub/vault">
        <div class="card-label">${svgIconLabel("shieldCheck", "Vault")}</div>
        ${vaultCard}
      </a>
    </section>

    ${thisWeekStripHtml(thisWeek, todayKey)}

    <h2>${iconLabel("/icons/grind-icon.png", "Grind")}</h2>
    <div class="card bento-card glass-card" onclick="location.href='/hub/grind'" style="cursor:pointer;">${grindCard}</div>

    <h2>Recent</h2>
    <div class="card glass-card recent-card-list" id="recent-activity-list">${recentRows}</div>

    <h2>Mini Apps & Tools</h2>
    ${miniAppsGridHtml()}
  </div>
  ${bottomNavHtml("/hub")}
  ${quickExpenseDialogHtml(frequentExpenses)}
  ${clockedScript}
  ${quickExpenseScript()}
</body>
</html>`;
}
