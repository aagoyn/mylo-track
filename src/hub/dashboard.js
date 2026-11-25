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

function sectionHeaderHtml({ icon, title, href, label }) {
  return `<div class="section-header">
    <h2>${iconLabel(icon, title)}</h2>
    <a class="nav-link" href="${href}">${label}</a>
  </div>`;
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
</head>
<body>
  <div class="container">
    <header>
      <div>
        <p class="hub-greeting">${greeting} 👋</p>
        <p class="hub-date">${dateLabel}</p>
        <p class="hub-sub">Here's your day so far, ${escapeHtml(username)}.</p>
      </div>
      <div class="nav-links">
        ${themeToggleHtml()}
        <a class="logout" href="/logout">Log out</a>
      </div>
    </header>

    <section class="grid-2-always">
      <a class="card" href="/dashboard/calorie">
        <div class="card-label">${iconLabel("/icons/calorie.png", "Calories")}</div>
        ${calorieCard}
      </a>
      <a class="card" href="/dashboard/spending">
        <div class="card-label">${iconLabel("/icons/spending.png", "Spending")}</div>
        ${spendingCard}
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

    ${sectionHeaderHtml({ icon: "/icons/grind-icon.png", title: "Grind", href: "/hub/grind", label: "Open Grind →" })}
    <div class="card">${grindCard}</div>

    <h2>Recent</h2>
    <div class="activity-list">${recentRows}</div>

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
  ${clockedScript}
</body>
</html>`;
}
