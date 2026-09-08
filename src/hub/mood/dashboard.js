import { DASHBOARD_CSS, escapeHtml, navHeader, faviconLink } from "../../shared/dashboard-layout.js";

const MOOD_META = {
  terrible: { emoji: "😫", label: "Terrible" },
  bad: { emoji: "😕", label: "Bad" },
  okay: { emoji: "😐", label: "Okay" },
  good: { emoji: "🙂", label: "Good" },
  great: { emoji: "😍", label: "Great" },
};

function calendarGridHtml({ year, month, daysInMonth, dayMap, selectedDate, todayKey }) {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  // getUTCDay(): 0=Sun..6=Sat; grid-nya Mon-first jadi digeser: Mon=0..Sun=6
  const firstWeekday = (firstOfMonth.getUTCDay() + 6) % 7;

  const dowHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    .map((d) => `<div class="dow">${d}</div>`)
    .join("");

  const blanks = Array.from({ length: firstWeekday }, () => `<div></div>`).join("");

  const cells = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const log = dayMap.get(dateKey);
    const moodClass = log ? `mood-${log.mood}` : "mood-empty";
    const extraClasses = [
      dateKey === selectedDate ? "mood-selected" : "",
      dateKey === todayKey ? "is-today" : "",
    ]
      .filter(Boolean)
      .join(" ");
    const label = log
      ? `${dateKey}: ${MOOD_META[log.mood]?.label || log.mood}${log.note ? ` - "${log.note}"` : ""}`
      : `${dateKey}: No mood logged`;
    return `<a class="mood-cell ${moodClass} ${extraClasses}" href="/hub/mood?year=${year}&month=${month}&date=${dateKey}" title="${escapeHtml(label)}">${day}</a>`;
  }).join("");

  return `<div class="mood-calendar">${dowHeaders}${blanks}${cells}</div>`;
}

function dayDetailHtml(dayDetail) {
  const { dateLabel, checkins } = dayDetail;
  if (!checkins.length) {
    return `<div class="day-detail"><strong>${dateLabel}</strong><br>No mood logged on this day.</div>`;
  }
  const rows = checkins
    .map(
      (c) =>
        `<div class="mood-history-item">
           <div>${c.emoji} ${c.label}${c.note ? ` — "${escapeHtml(c.note)}"` : ""}</div>
           <div class="activity-time">${c.time}</div>
         </div>`
    )
    .join("");
  return `<div class="day-detail"><strong>${dateLabel}</strong>${rows}</div>`;
}

export function renderMoodPage({
  year,
  month,
  monthLabel,
  daysInMonth,
  dayMap,
  selectedDate,
  todayKey,
  dayDetail,
  moodToday,
  moodCheckinsToday,
  summaryCounts,
  mostCommon,
  streak,
  loggedThisMonth,
  history,
  flash,
}) {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const moodPickerButtons = Object.entries(MOOD_META)
    .map(
      ([value, meta]) =>
        `<input type="radio" name="mood" id="mood-${value}" value="${value}" required>
         <label for="mood-${value}">${meta.emoji}</label>`
    )
    .join("");

  const summaryRows = Object.entries(MOOD_META)
    .map(([value, meta]) => `<tr><td>${meta.emoji} ${meta.label} days</td><td>${summaryCounts[value] || 0}</td></tr>`)
    .join("");

  const historyRows = history.length
    ? history
        .map(
          (h) => `
      <div class="mood-history-item">
        <div>
          <div>${h.emoji} ${h.label}</div>
          ${h.note ? `<div class="activity-subtitle">"${escapeHtml(h.note)}"</div>` : ""}
        </div>
        <div class="activity-time">${h.dayLabel}</div>
      </div>`
        )
        .join("")
    : `<div class="empty-state">No mood history yet.</div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mood Tracker</title>
${faviconLink("/icons/mood.png")}
<style>${DASHBOARD_CSS}</style>
</head>
<body>
  <div class="container">
    ${navHeader({ icon: "/icons/mood.png", title: "Mood Tracker", links: [{ href: "/hub", label: "🏠 Home" }] })}

    ${flash ? `<div class="flash flash-${flash.type}">${escapeHtml(flash.text)}</div>` : ""}

    <h2>How are you feeling?</h2>
    <form method="POST" action="/hub/mood">
      <div class="mood-picker">${moodPickerButtons}</div>
      <input type="text" name="note" placeholder="Optional note">
      <button type="submit">Save Mood</button>
    </form>

    ${
      moodToday
        ? `<div class="card mood-today" style="margin-top:12px;">
             <div class="card-label">Today's mood</div>
             <div class="card-value">${MOOD_META[moodToday.mood]?.emoji || "😐"} ${MOOD_META[moodToday.mood]?.label || moodToday.mood}</div>
             ${moodToday.note ? `<div class="card-note">"${escapeHtml(moodToday.note)}"</div>` : ""}
             ${moodCheckinsToday > 1 ? `<div class="card-sub">${moodCheckinsToday} check-ins today</div>` : ""}
           </div>`
        : ""
    }

    <h2>Your mood activity</h2>
    <div class="calendar-nav">
      <a href="/hub/mood?year=${prevYear}&month=${prevMonth}">‹ Prev</a>
      <span class="calendar-label">${monthLabel}</span>
      <a href="/hub/mood?year=${nextYear}&month=${nextMonth}">Next ›</a>
    </div>
    ${calendarGridHtml({ year, month, daysInMonth, dayMap, selectedDate, todayKey })}
    <div class="mood-legend">
      <span>🟥 Terrible</span><span>🟧 Bad</span><span>🟨 Okay</span><span>🟩 Good</span><span>🟦 Great</span>
    </div>

    ${dayDetail ? dayDetailHtml(dayDetail) : ""}

    <h2>This month</h2>
    <table>
      <tbody>${summaryRows}</tbody>
    </table>
    ${
      mostCommon
        ? `<div class="card" style="margin-top:8px;">
             <div class="card-label">Most common mood</div>
             <div class="card-value">${MOOD_META[mostCommon].emoji} ${MOOD_META[mostCommon].label}</div>
           </div>`
        : ""
    }

    <div class="streak-row">
      <div class="card">
        <div class="card-label">🔥 Current streak</div>
        <div class="card-value">${streak} day${streak === 1 ? "" : "s"}</div>
      </div>
      <div class="card">
        <div class="card-label">📅 Logged this month</div>
        <div class="card-value">${loggedThisMonth} / ${daysInMonth}</div>
      </div>
    </div>

    <h2>Mood history</h2>
    <div class="activity-list">${historyRows}</div>
  </div>
</body>
</html>`;
}
