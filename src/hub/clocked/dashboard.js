import { DASHBOARD_CSS, escapeHtml, navHeader, faviconLink, iconLabel } from "../../shared/dashboard-layout.js";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const CLOCK_OUT_AFTER_MS = 9 * 60 * 60 * 1000;

const MODE_ICON = { WFO: "/icons/work-from-office.png", WFH: "/icons/work-from-home.png", OFF: "/icons/day-off.png" };
const MODE_LABEL = { WFO: "WFO", WFH: "WFH", OFF: "Off" };

// variasi wording buat countdown - biar nggak monoton, dipilih sekali per page load (server-side),
// sama pola-nya kayak GREETINGS di hub/router.js / budgetFlavorText di spending
const COUNTDOWN_PHRASES = [
  "You can go home in",
  "Freedom in",
  "Hang tight —",
  "Counting down:",
  "Almost there,",
  "Clocking out in",
];

function pickCountdownPhrase() {
  return COUNTDOWN_PHRASES[Math.floor(Math.random() * COUNTDOWN_PHRASES.length)];
}

// rotating wording buat ajakan clock-in/mark WFH/off, sama pola-nya kayak COUNTDOWN_PHRASES
const MODE_PHRASES = {
  WFO: ["📅 Scheduled WFO today", "Ready to clock in?", "Off to the office?", "Time to punch in", "Let's get to work"],
  WFH: ["Working from home today?", "Comfy clothes, let's go", "WFH mode: on", "Home office, engage"],
  OFF: ["Enjoy your day off!", "No work today?", "Take it easy today", "Well-deserved break?"],
};

function pickModePhrase(mode) {
  const options = MODE_PHRASES[mode] || [];
  return options[Math.floor(Math.random() * options.length)] || "";
}

function todayDefaultMode() {
  const day = dayOfWeekWib();
  if ([1, 2, 4].includes(day)) return "WFO";
  if (day === 6 || day === 7) return "OFF";
  return "WFH";
}

const MODE_ACTION = { WFO: "/hub/clocked/clock-in", WFH: "/hub/clocked/mark-day", OFF: "/hub/clocked/mark-day" };
const MODE_BUTTON_LABEL = { WFO: "Clock In", WFH: "Mark WFH", OFF: "Mark Day Off" };

// Tombol besar utama, dipakai bareng di kartu Hub & halaman /hub/clocked (state "belum ada log").
function bigActionButtonHtml(mode, { stopPropagation = false } = {}) {
  const hidden = mode !== "WFO" ? `<input type="hidden" name="mode" value="${mode}">` : "";
  return `<form method="POST" action="${MODE_ACTION[mode]}" style="margin-top:6px;" ${stopPropagation ? `onclick="event.stopPropagation()"` : ""}>
    ${hidden}
    <button type="submit" class="btn-primary btn-wide-short">${iconLabel(MODE_ICON[mode], MODE_BUTTON_LABEL[mode])}</button>
  </form>`;
}

function toWibTime(isoString) {
  const wib = new Date(new Date(isoString).getTime() + WIB_OFFSET_MS);
  return wib.toISOString().slice(11, 16);
}

function toWibDateLabel(dateKey) {
  const d = new Date(`${dateKey}T00:00:00Z`);
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

function formatDuration(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

// dayOfWeekWib: Senin=1 ... Minggu=7 (konsisten sama convention di fitur lain)
function dayOfWeekWib() {
  const wib = new Date(Date.now() + WIB_OFFSET_MS);
  return wib.getUTCDay() || 7;
}

function modeIconLabel(mode) {
  return iconLabel(MODE_ICON[mode] || MODE_ICON.WFO, MODE_LABEL[mode] || mode);
}

function countdownScript(elId, btnId, targetMs) {
  return `<script>
    (function () {
      const el = document.getElementById(${JSON.stringify(elId)});
      const btn = ${btnId ? `document.getElementById(${JSON.stringify(btnId)})` : "null"};
      if (!el) return;
      const target = ${targetMs};
      function tick() {
        const diff = target - Date.now();
        if (diff <= 0) {
          el.textContent = "Ready to go home! 🎉";
          if (btn) btn.disabled = false;
          return false;
        }
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        el.textContent = h + "h " + m + "m " + s + "s";
        return true;
      }
      if (tick()) {
        const interval = setInterval(function () { if (!tick()) clearInterval(interval); }, 1000);
      }
    })();
  </script>`;
}

// ---------- Hub card: ringkas & interaktif (1 tombol default sesuai hari), TAPI kartu-nya
// sendiri bukan link kayak Calories/Spending - persis behavior awal. ----------

export function clockedHubCardHtml(todayLog) {
  if (!todayLog) {
    const mode = todayDefaultMode();
    return {
      html: `<div class="card-sub">${pickModePhrase(mode)}</div>
             ${bigActionButtonHtml(mode, { stopPropagation: true })}`,
      script: "",
    };
  }

  if (todayLog.work_mode !== "WFO") {
    return { html: `<div class="card-value">${modeIconLabel(todayLog.work_mode)} today</div>`, script: "" };
  }

  if (todayLog.clock_out_at) {
    const durationMs = new Date(todayLog.clock_out_at) - new Date(todayLog.clock_in_at);
    return {
      html: `<div class="card-value">✅ ${formatDuration(durationMs)}</div>
             <div class="card-sub">${toWibTime(todayLog.clock_in_at)} → ${toWibTime(todayLog.clock_out_at)}</div>`,
      script: "",
    };
  }

  const targetMs = new Date(todayLog.clock_in_at).getTime() + CLOCK_OUT_AFTER_MS;
  const ready = Date.now() >= targetMs;
  return {
    html: `
      <div class="card-value" id="clocked-hub-countdown">${ready ? "Ready to go home! 🎉" : formatDuration(targetMs - Date.now())}</div>
      <div class="card-sub">In at ${toWibTime(todayLog.clock_in_at)}</div>
      <form method="POST" action="/hub/clocked/clock-out" style="margin-top:6px;" onclick="event.stopPropagation()">
        <button type="submit" class="btn-primary btn-wide-short" id="clocked-hub-out-btn" ${ready ? "" : "disabled"}>Clock Out</button>
      </form>`,
    script: countdownScript("clocked-hub-countdown", "clocked-hub-out-btn", targetMs),
  };
}

// ---------- Halaman /hub/clocked: status (dipercantik, di-center) + section override yang
// SELALU ada (Clock In/Mark WFH/Mark Day Off) biar bisa diganti kapan aja - mis. salah pencet
// WFO padahal maunya WFH, atau WFO dadakan pas defaultnya WFH/libur. ----------

function overrideButton(mode, action, label) {
  const hidden = mode !== "WFO" ? `<input type="hidden" name="mode" value="${mode}">` : "";
  return `<form method="POST" action="${action}" style="margin:0;">
    ${hidden}
    <button type="submit" class="btn-secondary btn-sm">${label}</button>
  </form>`;
}

// Cuma nampilin opsi yang BEDA dari excludeMode (mode hari ini yang lagi aktif, atau default
// hari ini kalau belum ada log sama sekali - biar nggak dobel sama tombol besar di atasnya).
// Kalau semua 3 opsi ditampilin termasuk yang lagi aktif (di-disable), user bisa nyangka
// tombolnya error/nggak ngerespon pas diklik.
function overrideSectionHtml(excludeMode, { label = "Change today to" } = {}) {
  const options = [
    { mode: "WFO", label: iconLabel(MODE_ICON.WFO, "WFO") },
    { mode: "WFH", label: iconLabel(MODE_ICON.WFH, "WFH") },
    { mode: "OFF", label: iconLabel(MODE_ICON.OFF, "Off") },
  ].filter((o) => o.mode !== excludeMode);

  if (!options.length) return "";

  return `
    <div class="card-sub" style="margin-top:14px; margin-bottom:6px; text-align:center;">${label}</div>
    <div class="button-row" style="justify-content:center; gap:8px;">
      ${options.map((o) => overrideButton(o.mode, MODE_ACTION[o.mode], o.label)).join("")}
    </div>`;
}

export function clockedFullCardHtml(todayLog) {
  let statusHtml;
  let script = "";

  if (!todayLog) {
    const mode = todayDefaultMode();
    statusHtml = `
      <div style="text-align:center;">
        <div class="card-sub" style="margin-bottom:2px;">${pickModePhrase(mode)}</div>
        ${bigActionButtonHtml(mode)}
      </div>`;
    return { html: statusHtml + overrideSectionHtml(mode, { label: "Or, log today as" }), script };
  } else if (todayLog.work_mode !== "WFO") {
    statusHtml = `<div class="card-value" style="text-align:center;">${modeIconLabel(todayLog.work_mode)} today</div>`;
  } else if (todayLog.clock_out_at) {
    const durationMs = new Date(todayLog.clock_out_at) - new Date(todayLog.clock_in_at);
    statusHtml = `
      <div style="text-align:center;">
        <div class="card-value">✅ ${formatDuration(durationMs)}</div>
        <div class="card-sub">${toWibTime(todayLog.clock_in_at)} → ${toWibTime(todayLog.clock_out_at)}</div>
      </div>`;
  } else {
    const targetMs = new Date(todayLog.clock_in_at).getTime() + CLOCK_OUT_AFTER_MS;
    const ready = Date.now() >= targetMs;
    statusHtml = `
      <div style="text-align:center;">
        ${ready ? "" : `<div class="card-sub" style="margin-bottom:2px;">${pickCountdownPhrase()}</div>`}
        <div class="card-value" id="clocked-countdown">${ready ? "Ready to go home! 🎉" : formatDuration(targetMs - Date.now())}</div>
        <div class="card-sub" style="margin-top:2px;">In at ${toWibTime(todayLog.clock_in_at)}</div>
        <form method="POST" action="/hub/clocked/clock-out" style="margin-top:8px;">
          <button type="submit" class="btn-primary btn-wide-short" id="clocked-out-btn" ${ready ? "" : "disabled"}>Clock Out</button>
        </form>
      </div>`;
    script = countdownScript("clocked-countdown", "clocked-out-btn", targetMs);
  }

  return { html: statusHtml + overrideSectionHtml(todayLog?.work_mode), script };
}

function historyRowHtml(log) {
  const duration =
    log.clock_in_at && log.clock_out_at
      ? formatDuration(new Date(log.clock_out_at) - new Date(log.clock_in_at))
      : "—";
  return `<tr>
    <td class="nowrap">${toWibDateLabel(log.work_date)}</td>
    <td class="nowrap">${modeIconLabel(log.work_mode)}</td>
    <td class="nowrap">${log.clock_in_at ? toWibTime(log.clock_in_at) : "—"}</td>
    <td class="nowrap">${log.clock_out_at ? toWibTime(log.clock_out_at) : "—"}</td>
    <td>${duration}</td>
  </tr>`;
}

export function renderClockedPage({ logs, flash, todayLog }) {
  const { html: cardHtml, script } = clockedFullCardHtml(todayLog);
  const historyRows = logs.length
    ? logs.map(historyRowHtml).join("")
    : `<tr><td colspan="5">No history yet.</td></tr>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Clocked!</title>
${faviconLink("/icons/clocked.png")}
<style>${DASHBOARD_CSS}</style>
</head>
<body>
  <div class="container">
    ${navHeader({ icon: "/icons/clocked.png", title: "Clocked!", links: [{ href: "/hub", label: "Home" }] })}

    ${flash ? `<div class="flash flash-${flash.type}">${escapeHtml(flash.text)}</div>` : ""}

    <div class="card">${cardHtml}</div>

    <h2>History</h2>
    <div class="table-wrap">
      <table>
        <thead><tr><th>📅 Date</th><th>Mode</th><th>🟢 Clock In</th><th>🔴 Clock Out</th><th>⏱️ Duration</th></tr></thead>
        <tbody>${historyRows}</tbody>
      </table>
    </div>
  </div>
  ${script}
</body>
</html>`;
}
