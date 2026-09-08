import { DASHBOARD_CSS, escapeHtml, navHeader, faviconLink, iconLabel } from "../../shared/dashboard-layout.js";

const MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDateLabel(dateKey) {
  const d = new Date(`${dateKey}T00:00:00Z`);
  return `${MONTHS_EN[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function renderJournalPage({ viewDate, todayKey, entry, recent, editMode, flash }) {
  const isToday = viewDate === todayKey;
  const heading = iconLabel("/icons/journal.png", isToday ? "Today" : formatDateLabel(viewDate));

  const body =
    !editMode && entry
      ? `<div class="journal-entry">${escapeHtml(entry.content)}</div>
         <a class="nav-link" href="/hub/journal?date=${viewDate}&edit=1">${isToday ? "Edit today's note" : "Edit this entry"}</a>`
      : `<form method="POST" action="/hub/journal">
           <input type="hidden" name="date" value="${viewDate}">
           <textarea name="content" placeholder="${isToday ? "How was today?" : "Write something..."}" required>${entry ? escapeHtml(entry.content) : ""}</textarea>
           <button type="submit">Save</button>
         </form>`;

  const historyRows = recent.length
    ? recent
        .map(
          (r) => `
      <div class="journal-history-item">
        <a class="journal-history-date" href="/hub/journal?date=${r.journal_date}">${formatDateLabel(r.journal_date)}</a>
        <div class="journal-history-preview">${escapeHtml(r.content.length > 120 ? `${r.content.slice(0, 120)}…` : r.content)}</div>
      </div>`
        )
        .join("")
    : `<div class="empty-state">No journal entries yet.</div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Journal</title>
${faviconLink("/icons/journal.png")}
<style>${DASHBOARD_CSS}</style>
</head>
<body>
  <div class="container">
    ${navHeader({ icon: "/icons/journal.png", title: "Journal", links: [{ href: "/hub", label: "🏠 Home" }] })}

    ${flash ? `<div class="flash flash-${flash.type}">${escapeHtml(flash.text)}</div>` : ""}

    <h2>${heading}</h2>
    ${!isToday ? `<a class="nav-link" href="/hub/journal">← Back to today</a>` : ""}
    ${body}

    <h2>History</h2>
    <div>${historyRows}</div>
  </div>
</body>
</html>`;
}
