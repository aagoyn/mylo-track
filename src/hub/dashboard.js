import { DASHBOARD_CSS, escapeHtml, navHeader, faviconLink, statBarHtml } from "../shared/dashboard-layout.js";

// status Mylo (mascot kucing Hub) reaksi ke seberapa aktif kamu hari ini - murni fun,
// dihitung dari 4 sinyal yang udah ada (bukan data baru): spending/calorie/mood/journal
function myloStatus(count) {
  if (count >= 4) return { emoji: "😻", text: "Mylo is having the best day!" };
  if (count >= 2) return { emoji: "😺", text: "Mylo's doing alright." };
  if (count >= 1) return { emoji: "😿", text: "Mylo's a little bored." };
  return { emoji: "🙀", text: "Mylo hasn't seen you today!" };
}

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

  const activityCount = [hasSpending, hasCalorie, Boolean(moodToday), Boolean(journalToday)].filter(
    Boolean
  ).length;
  const mylo = myloStatus(activityCount);

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
        <a class="logout" href="/logout">Log out</a>
      </div>
    </header>

    <div class="card mylo-card">
      <img class="mylo-avatar" src="/icons/hub.png" alt="Mylo">
      <div class="mylo-main">
        <div class="card-label">${mylo.emoji} Mylo</div>
        <div class="card-value" style="font-size:14px;">${mylo.text}</div>
        ${statBarHtml((activityCount / 4) * 100)}
        <div class="card-sub">${activityCount}/4 things logged today</div>
      </div>
    </div>

    <section class="cards">
      <a class="card" href="/dashboard/calorie">
        <div class="card-label">🔥 Calories</div>
        ${calorieCard}
      </a>
      <a class="card" href="/dashboard/spending">
        <div class="card-label">💰 Spending</div>
        ${spendingCard}
      </a>
      <div class="card mood-today">
        <div class="card-label">😊 Mood</div>
        ${moodCard}
      </div>
    </section>

    <h2>📝 Today</h2>
    <div class="card">${journalSection}</div>

    <h2>🛍️ Things I Want</h2>
    <div class="card">${wishlistSection}</div>

    <h2>Recent</h2>
    <div class="activity-list">${recentRows}</div>

    <div class="hub-nav-group">
      <h2>Trackers</h2>
      <div class="hub-nav-links">
        <a class="hub-nav-item" href="/dashboard/calorie">🔥 Calories</a>
        <a class="hub-nav-item" href="/dashboard/spending">💰 Spending</a>
      </div>
    </div>
    <div class="hub-nav-group">
      <h2>Mini Apps</h2>
      <div class="hub-nav-links">
        <a class="hub-nav-item" href="/hub/mood">😊 Mood</a>
        <a class="hub-nav-item" href="/hub/journal">📝 Journal</a>
        <a class="hub-nav-item" href="/hub/wishlist">🛍️ Wishlist</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}
