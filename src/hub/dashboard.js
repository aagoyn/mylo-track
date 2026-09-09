import { DASHBOARD_CSS, escapeHtml, navHeader, faviconLink, iconLabel } from "../shared/dashboard-layout.js";

const MOOD_META = {
  terrible: { emoji: "😫", label: "Terrible" },
  bad: { emoji: "😕", label: "Bad" },
  okay: { emoji: "😐", label: "Okay" },
  good: { emoji: "🙂", label: "Good" },
  great: { emoji: "😍", label: "Great" },
};

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

export function renderHubDashboard({
  greeting,
  dateLabel,
  username,
  spendingToday,
  calorieToday,
  moodToday,
  moodCheckinsToday,
  journalToday,
  wishlistSummary,
  vaultSummary,
  skincareSummary,
  recentActivity,
}) {
  const hasSpending = spendingToday && spendingToday.total > 0;
  const hasCalorie = calorieToday && calorieToday.calories > 0;

  const calorieCard = hasCalorie
    ? `<div class="card-value">${Math.round(calorieToday.calories).toLocaleString("en-US")} kcal</div>
       <div class="card-sub">Protein ${calorieToday.protein_g}g</div>`
    : `<div class="empty-state">No food logged yet<br>+ Log food</div>`;

  const spendingCard = hasSpending
    ? `<div class="card-value">${formatRupiah(spendingToday.total)}</div>
       <div class="card-sub">${spendingToday.count} transaction${spendingToday.count === 1 ? "" : "s"} today</div>`
    : `<div class="empty-state">No spending yet<br>+ Log spending</div>`;

  const moodCard = moodToday
    ? `<div class="card-value">${MOOD_META[moodToday.mood]?.emoji || "😐"} ${MOOD_META[moodToday.mood]?.label || moodToday.mood}</div>
       ${moodToday.note ? `<div class="card-note">"${escapeHtml(moodToday.note)}"</div>` : ""}
       ${moodCheckinsToday > 1 ? `<div class="card-sub">${moodCheckinsToday} check-ins today</div>` : ""}`
    : `<div class="empty-state">Not logged<br><a href="/hub/mood">+ Log mood</a></div>`;

  const recentRows = recentActivity.length
    ? recentActivity.map((a) => activityRow(a)).join("")
    : `<div class="empty-state">No activity yet today.</div>`;

  const journalSection = journalToday
    ? `<div class="journal-entry">${escapeHtml(journalToday.content)}</div>
       <a class="nav-link" href="/hub/journal?edit=1">Edit today's note</a>`
    : `<div class="empty-state">How was your day?</div>
       <a class="nav-link" href="/hub/journal">Write something...</a>`;

  const wishlistSection = wishlistSummary
    ? wishlistSummary.count > 0
      ? `<div class="card-sub">${wishlistSummary.count} item${wishlistSummary.count === 1 ? "" : "s"}${wishlistSummary.highPriorityCount ? ` · ${wishlistSummary.highPriorityCount} high priority` : ""}</div>
         <div class="empty-state" style="margin-top:6px;">${wishlistSummary.previewTitles.map(escapeHtml).join(" · ")}</div>
         <a class="nav-link" href="/hub/wishlist">View wishlist</a>`
      : `<div class="empty-state">Nothing on your wishlist yet.</div>
         <a class="nav-link" href="/hub/wishlist">Add something</a>`
    : `<div class="empty-state">Couldn't load wishlist.</div>`;

  const vaultSection = vaultSummary
    ? `<div class="card-value">${formatRupiah(vaultSummary.monthlyRemaining)} left</div>
       <div class="card-sub">Monthly pool</div>
       <a class="nav-link" href="/hub/vault">View vault</a>`
    : `<div class="empty-state">Couldn't load vault.</div>`;

  const skincareSection = skincareSummary
    ? skincareSummary.hasProducts
      ? `<div class="card-sub">Morning · ${skincareSummary.amSteps} step${skincareSummary.amSteps === 1 ? "" : "s"}</div>
         <div class="card-sub">Tonight · ${skincareSummary.pmSteps} step${skincareSummary.pmSteps === 1 ? "" : "s"}</div>
         <a class="nav-link" href="/hub/skincare">Open Skincare</a>`
      : `<div class="empty-state">No products yet.</div>
         <a class="nav-link" href="/hub/skincare">Add your products</a>`
    : `<div class="empty-state">Couldn't load skincare.</div>`;

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
        <a class="logout" href="/logout">${iconLabel("/icons/exit.png", "Log out")}</a>
      </div>
    </header>

    <section class="cards">
      <a class="card" href="/dashboard/calorie">
        <div class="card-label">${iconLabel("/icons/calorie.png", "Calories")}</div>
        ${calorieCard}
      </a>
      <a class="card" href="/dashboard/spending">
        <div class="card-label">${iconLabel("/icons/spending.png", "Spending")}</div>
        ${spendingCard}
      </a>
      <div class="card mood-today">
        <div class="card-label">${iconLabel("/icons/mood.png", "Mood")}</div>
        ${moodCard}
      </div>
    </section>

    <h2>${iconLabel("/icons/journal.png", "Today")}</h2>
    <div class="card">${journalSection}</div>

    <h2>${iconLabel("/icons/wishlist.png", "Things I Want")}</h2>
    <div class="card">${wishlistSection}</div>

    <h2>${iconLabel("/icons/vault.png", "Vault")}</h2>
    <div class="card">${vaultSection}</div>

    <h2>${iconLabel("/icons/skincare.png", "Skincare")}</h2>
    <div class="card">${skincareSection}</div>

    <h2>Recent</h2>
    <div class="activity-list">${recentRows}</div>

    <div class="hub-nav-group">
      <h2>Trackers</h2>
      <div class="hub-nav-links">
        <a class="hub-nav-item" href="/dashboard/calorie">${iconLabel("/icons/calorie.png", "Calories")}</a>
        <a class="hub-nav-item" href="/dashboard/spending">${iconLabel("/icons/spending.png", "Spending")}</a>
      </div>
    </div>
    <div class="hub-nav-group">
      <h2>Mini Apps</h2>
      <div class="hub-nav-links">
        <a class="hub-nav-item" href="/hub/mood">${iconLabel("/icons/mood.png", "Mood")}</a>
        <a class="hub-nav-item" href="/hub/journal">${iconLabel("/icons/journal.png", "Journal")}</a>
        <a class="hub-nav-item" href="/hub/wishlist">${iconLabel("/icons/wishlist.png", "Wishlist")}</a>
        <a class="hub-nav-item" href="/hub/vault">${iconLabel("/icons/vault.png", "Vault")}</a>
        <a class="hub-nav-item" href="/hub/skincare">${iconLabel("/icons/skincare.png", "Skincare")}</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}
