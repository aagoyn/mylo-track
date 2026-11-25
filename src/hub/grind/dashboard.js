import { DASHBOARD_CSS, escapeHtml, navHeader, faviconLink, iconLabel } from "../../shared/dashboard-layout.js";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SESSION_TYPE_BADGE = {
  EASY: iconLabel("/icons/running.png", "🟢 Easy"),
  QUALITY: iconLabel("/icons/running.png", "🟡 Quality"),
  "LONG RUN": iconLabel("/icons/running.png", "🔵 Long Run"),
  BADMINTON: iconLabel("/icons/shuttlecock.png", "Badminton"),
  GYM: iconLabel("/icons/dumbbell.png", "Gym"),
  REST: "😴 Rest",
  "RACE DAY": "🏁 Race Day",
  SWIM: iconLabel("/icons/swim.png", "Swim"),
  TENNIS: iconLabel("/icons/tennis.png", "Tennis"),
};
const TYPE_ICON = {
  RUN: iconLabel("/icons/running.png", ""),
  BADMINTON: iconLabel("/icons/shuttlecock.png", ""),
  GYM: iconLabel("/icons/dumbbell.png", ""),
  REST: "😴",
  SWIM: iconLabel("/icons/swim.png", ""),
  TENNIS: iconLabel("/icons/tennis.png", ""),
};
const RUN_SUBTYPES = ["Easy", "Tempo", "Intervals", "Long Run", "Race"];
const BADMINTON_SUBTYPES = ["Fun", "Sparring", "Competitive"];
const GYM_SUBTYPES = ["Push", "Pull", "Legs", "Upper", "Full Body"];
const TENNIS_SUBTYPES = ["Fun", "Sparring", "Competitive", "Coaching"];

function dateLabel(dateKey) {
  const d = new Date(`${dateKey}T00:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

function daysUntil(dateKey) {
  const today = new Date(`${new Date(Date.now() + WIB_OFFSET_MS).toISOString().slice(0, 10)}T00:00:00Z`);
  const target = new Date(`${dateKey}T00:00:00Z`);
  return Math.round((target - today) / 86400000);
}

function planSummaryLine(plan) {
  const parts = [];
  if (plan.target_distance_km) parts.push(`${plan.target_distance_km}km`);
  if (plan.target_pace) parts.push(plan.target_pace);
  if (plan.target_hr) parts.push(plan.target_hr);
  return parts.join(" · ");
}

function sessionLineHtml(s) {
  const facts = [];
  if (s.distance_km) facts.push(`${s.distance_km}km`);
  if (s.avg_pace) facts.push(`${s.avg_pace}/km`);
  if (s.duration_min) facts.push(`${s.duration_min}min`);
  if (s.avg_hr) facts.push(`${s.avg_hr}bpm`);
  return `<div class="card-sub">${TYPE_ICON[s.type] || "•"} ${s.session_time} ${escapeHtml(s.sub_type || s.type)}${facts.length ? " — " + facts.join(" · ") : ""}</div>`;
}

// ---------- Race countdown & phase banner ----------

export function raceBannerHtml(upcomingRace) {
  if (!upcomingRace) return "";
  const diff = daysUntil(upcomingRace.plan_date);
  const when = diff === 0 ? "today!" : diff === 1 ? "tomorrow" : `${diff} hari lagi`;
  const phaseLabel = upcomingRace.phase ? ` · Week ${upcomingRace.week_num || "?"} ${upcomingRace.phase} Phase` : "";
  return `<div class="card" style="margin-bottom:12px; background:var(--accent-deep); border-color:var(--accent);">
    <div class="card-value">🏁 ${escapeHtml(upcomingRace.race_name || "Race Day")} — ${when}</div>
    <div class="card-sub">${dateLabel(upcomingRace.plan_date)}${phaseLabel}</div>
  </div>`;
}

// ---------- Hub card (ringkas, dipakai di /hub) ----------

function quickAddRowHtml() {
  return `<div class="button-row" style="flex-wrap:wrap; margin-top:8px;">
    <a class="btn-secondary btn-sm" href="/hub/grind?form=run#log-forms">${iconLabel("/icons/running.png", "+ Run")}</a>
    <a class="btn-secondary btn-sm" href="/hub/grind?form=swim#log-forms">${iconLabel("/icons/swim.png", "+ Swim")}</a>
    <a class="btn-secondary btn-sm" href="/hub/grind?form=badminton#log-forms">${iconLabel("/icons/shuttlecock.png", "+ Badminton")}</a>
    <a class="btn-secondary btn-sm" href="/hub/grind?form=tennis#log-forms">${iconLabel("/icons/tennis.png", "+ Tennis")}</a>
    <a class="btn-secondary btn-sm" href="/hub/grind?form=gym#log-forms">${iconLabel("/icons/dumbbell.png", "+ Gym")}</a>
    <form method="POST" action="/hub/grind/sessions/rest" style="margin:0;">
      <button type="submit" class="btn-secondary btn-sm">😴 Rest</button>
    </form>
  </div>`;
}

export function grindHubCardHtml({ todayPlan, todaySessions, upcomingRace }) {
  const raceLine = upcomingRace
    ? `<div class="card-sub">🏁 ${escapeHtml(upcomingRace.race_name || "Race Day")} in ${daysUntil(upcomingRace.plan_date)} hari</div>`
    : "";

  let planBlock;
  if (!todayPlan) {
    planBlock = `<div class="empty-state">No plan for today.</div>`;
  } else {
    const summary = planSummaryLine(todayPlan);
    planBlock = `<div class="card-value card-value-compact">${SESSION_TYPE_BADGE[todayPlan.session_type] || todayPlan.session_type}</div>
      ${summary ? `<div class="card-sub">${escapeHtml(summary)}</div>` : ""}`;

    if (todayPlan.status === "PENDING") {
      const completeBtn =
        todayPlan.session_type === "REST"
          ? `<form method="POST" action="/hub/grind/plan/${todayPlan.id}/complete-rest" style="margin:0;">
               <button type="submit" class="btn-primary btn-sm">✓ Complete</button>
             </form>`
          : `<a class="btn-primary btn-sm" href="/hub/grind?complete=${todayPlan.id}#log-forms">✓ Complete Plan</a>`;
      planBlock += `<div class="button-row" style="margin-top:8px;">
        ${completeBtn}
        <form method="POST" action="/hub/grind/plan/${todayPlan.id}/skip" style="margin:0;">
          <button type="submit" class="btn-secondary btn-sm">Skip</button>
        </form>
      </div>`;
    } else {
      planBlock += `<div class="card-sub">${todayPlan.status === "DONE" ? "✅ Done" : "⏭ Skipped"}</div>`;
    }
  }

  const sessionsBlock = todaySessions.length ? todaySessions.map(sessionLineHtml).join("") : "";

  return `${raceLine}${planBlock}${sessionsBlock}${quickAddRowHtml()}
    <a class="nav-link" href="/hub/grind" style="display:inline-block; margin-top:8px;">Open Grind</a>`;
}

// ---------- Today's Plan card (full page) ----------

function todayCardHtml(todayPlan, todaySessions) {
  let body;
  if (!todayPlan) {
    body = `<div class="empty-state">No plan scheduled for today.</div>`;
  } else {
    const summary = planSummaryLine(todayPlan);
    body = `<div class="card-value">${SESSION_TYPE_BADGE[todayPlan.session_type] || todayPlan.session_type}</div>
      ${summary ? `<div class="card-sub">${escapeHtml(summary)}</div>` : ""}
      ${todayPlan.instructions ? `<div class="card-sub" style="margin-top:6px;">${escapeHtml(todayPlan.instructions)}</div>` : ""}`;

    if (todayPlan.status === "PENDING") {
      const completeBtn =
        todayPlan.session_type === "REST"
          ? `<form method="POST" action="/hub/grind/plan/${todayPlan.id}/complete-rest" style="margin:0;">
               <button type="submit" class="btn-primary btn-sm">✓ Complete</button>
             </form>`
          : `<a class="btn-primary btn-sm" href="/hub/grind?complete=${todayPlan.id}#log-forms">✓ Complete Plan</a>`;
      body += `<div class="button-row" style="margin-top:10px;">
        ${completeBtn}
        <form method="POST" action="/hub/grind/plan/${todayPlan.id}/skip" style="margin:0;">
          <button type="submit" class="btn-secondary btn-sm">Skip</button>
        </form>
      </div>`;
    } else {
      body += `<div class="card-sub" style="margin-top:6px;">${todayPlan.status === "DONE" ? "✅ Done" : "⏭ Skipped"}</div>`;
    }
  }

  const sessions = todaySessions.length
    ? `<div style="margin-top:10px; border-top:1px solid var(--border); padding-top:10px;">${todaySessions.map(sessionLineHtml).join("")}</div>`
    : "";

  return `<h2>Today</h2><div class="card">${body}${sessions}</div>${quickAddRowHtml()}`;
}

// ---------- Import / Paste Training Plan ----------

function importSectionHtml(flash) {
  return `<details class="form-card" style="margin-top:16px;">
    <summary>📋 Import / Paste Training Plan</summary>
    <form method="POST" action="/hub/grind/import">
      <textarea name="tsv" rows="8" placeholder="Paste dari Google Sheets/Excel (tab-separated): Tanggal | Hari | Minggu Ke- | Fase | Jenis Sesi | Jarak Target (km) | Target Pace | Target HR | Deskripsi/Instruksi | Status | Jarak Aktual (km) | Avg Pace Aktual" required></textarea>
      <button type="submit">Import</button>
    </form>
  </details>`;
}

// ---------- Log Run/Badminton/Gym forms ----------

function subtypeOptions(options, selected) {
  return options.map((o) => `<option value="${o}" ${o === selected ? "selected" : ""}>${o}</option>`).join("");
}

function hiddenPlanId(prefill) {
  return prefill?.planId ? `<input type="hidden" name="plan_id" value="${prefill.planId}">` : "";
}

function sessionTimeRadios(name, defaultTime) {
  return `<div class="radio-row" style="margin-bottom:8px;">
    <label><input type="radio" name="${name}" value="AM" ${defaultTime === "AM" ? "checked" : ""}>AM</label>
    <label><input type="radio" name="${name}" value="PM" ${defaultTime === "PM" ? "checked" : ""}>PM</label>
  </div>`;
}

// Dipakai Run & Swim - sama-sama jarak + durasi + pace (hybrid auto-calc/manual, lihat
// pacecalcScript). key = prefix id DOM ("run"/"swim"), dipakai jamak biar skrip bisa wire
// beberapa form sejenis dengan 1 fungsi generik.
function distanceSportFormHtml({ key, icon, label, action, subtypes, open, prefill, defaultTime }) {
  const distanceVal = prefill?.distanceKm ?? "";
  return `<details class="form-card" id="form-${key}" ${open ? "open" : ""}>
    <summary>${icon} Log ${label}</summary>
    <form method="POST" action="${action}">
      ${hiddenPlanId(prefill)}
      ${sessionTimeRadios("session_time", defaultTime)}
      ${subtypes?.length ? `<label>Jenis</label><select name="sub_type">${subtypeOptions(subtypes, prefill?.subType)}</select>` : ""}
      <label>Jarak (km)</label>
      <input type="number" step="0.01" name="distance_km" id="${key}-distance" value="${distanceVal}">
      <label>Durasi (menit)</label>
      <input type="number" name="duration_min" id="${key}-duration">
      <label>Avg Pace (MM:SS/km)</label>
      <input type="text" name="avg_pace" id="${key}-pace" placeholder="auto dari jarak & durasi, atau isi manual">
      <label>Avg HR (bpm)</label>
      <input type="number" name="avg_hr">
      <label>Catatan</label>
      <textarea name="notes" rows="2"></textarea>
      <button type="submit">Simpan</button>
    </form>
  </details>`;
}

function runFormHtml({ open, prefill, defaultTime }) {
  return distanceSportFormHtml({
    key: "run", icon: iconLabel("/icons/running.png", ""), label: "Run", action: "/hub/grind/sessions/run",
    subtypes: RUN_SUBTYPES, open, prefill, defaultTime,
  });
}

function swimFormHtml({ open, prefill, defaultTime }) {
  return distanceSportFormHtml({
    key: "swim", icon: iconLabel("/icons/swim.png", ""), label: "Swim", action: "/hub/grind/sessions/swim",
    subtypes: null, open, prefill, defaultTime,
  });
}

// Dipakai Badminton & Tennis - sama-sama durasi + quick-chips 60/90/120 menit.
function durationSportFormHtml({ key, icon, label, action, subtypes, open, prefill, defaultTime }) {
  return `<details class="form-card" id="form-${key}" ${open ? "open" : ""}>
    <summary>${icon} Log ${label}</summary>
    <form method="POST" action="${action}">
      ${hiddenPlanId(prefill)}
      ${sessionTimeRadios("session_time", defaultTime)}
      <label>Jenis</label>
      <select name="sub_type">${subtypeOptions(subtypes, prefill?.subType)}</select>
      <label>Durasi (menit)</label>
      <div class="button-row" style="margin-bottom:8px;">
        <button type="button" class="btn-secondary btn-sm" onclick="document.getElementById('${key}-duration').value=60">60</button>
        <button type="button" class="btn-secondary btn-sm" onclick="document.getElementById('${key}-duration').value=90">90</button>
        <button type="button" class="btn-secondary btn-sm" onclick="document.getElementById('${key}-duration').value=120">120</button>
      </div>
      <input type="number" name="duration_min" id="${key}-duration">
      <label>Avg HR (bpm, opsional)</label>
      <input type="number" name="avg_hr">
      <label>Catatan</label>
      <textarea name="notes" rows="2"></textarea>
      <button type="submit">Simpan</button>
    </form>
  </details>`;
}

function badmintonFormHtml({ open, prefill, defaultTime }) {
  return durationSportFormHtml({
    key: "badminton", icon: iconLabel("/icons/shuttlecock.png", ""), label: "Badminton", action: "/hub/grind/sessions/badminton",
    subtypes: BADMINTON_SUBTYPES, open, prefill, defaultTime,
  });
}

function tennisFormHtml({ open, prefill, defaultTime }) {
  return durationSportFormHtml({
    key: "tennis", icon: iconLabel("/icons/tennis.png", ""), label: "Tennis", action: "/hub/grind/sessions/tennis",
    subtypes: TENNIS_SUBTYPES, open, prefill, defaultTime,
  });
}

function gymSetRowHtml(exerciseName = "", setOrder = 1, weightKg = "", reps = "") {
  return `<div class="item-edit-row gym-set-row">
    <div><label>Exercise</label><input type="text" name="exercise_name[]" value="${escapeHtml(exerciseName)}" required></div>
    <div><label>Set</label><input type="number" name="set_order[]" min="1" value="${setOrder}" required></div>
    <div><label>Weight (kg)</label><input type="number" step="0.5" name="weight_kg[]" value="${weightKg}"></div>
    <div><label>Reps</label><input type="number" name="reps[]" value="${reps}"></div>
    <div><button type="button" class="btn-secondary btn-sm" onclick="this.closest('.gym-set-row').remove()">✕</button></div>
  </div>`;
}

function gymFormHtml({ open, prefill, defaultTime, recoveryHint }) {
  return `<details class="form-card" id="form-gym" ${open ? "open" : ""}>
    <summary>${iconLabel("/icons/dumbbell.png", "Log Gym")}</summary>
    ${recoveryHint ? `<div class="recovery-banner">💡 ${escapeHtml(recoveryHint)}</div>` : ""}
    <form method="POST" action="/hub/grind/sessions/gym" id="gym-form">
      ${hiddenPlanId(prefill)}
      ${sessionTimeRadios("session_time", defaultTime)}
      <label>Split</label>
      <select name="sub_type" id="gym-subtype">${subtypeOptions(GYM_SUBTYPES, prefill?.subType)}</select>
      <div class="card-sub" style="margin:-4px 0 8px;">Pilih split buat auto-isi dari sesi terakhir (Clone Last Split)</div>

      <div id="gym-sets-container">${gymSetRowHtml()}</div>
      <div class="button-row" style="margin:8px 0;">
        <button type="button" class="btn-secondary btn-sm" id="gym-add-set">+ Add Set</button>
        <button type="button" class="btn-secondary btn-sm" id="gym-add-exercise">+ Add Exercise</button>
      </div>

      <div class="card-sub" style="margin-bottom:4px;">Rest Timer</div>
      <div class="button-row" style="margin-bottom:8px;">
        <button type="button" class="btn-secondary btn-sm" onclick="grindStartRestTimer(60)">60s</button>
        <button type="button" class="btn-secondary btn-sm" onclick="grindStartRestTimer(90)">90s</button>
        <button type="button" class="btn-secondary btn-sm" onclick="grindStartRestTimer(120)">120s</button>
      </div>
      <div class="card-sub" id="gym-rest-timer-display"></div>

      <label style="margin-top:8px;">Durasi total (menit, opsional)</label>
      <input type="number" name="duration_min">
      <label>Catatan</label>
      <textarea name="notes" rows="2"></textarea>
      <button type="submit">Simpan</button>
    </form>
  </details>`;
}

function logFormsHtml({ openForm, prefill, defaultTime, recoveryHint }) {
  const prefillFor = (key) => (openForm === key ? prefill : null);
  return `<h2 id="log-forms">Log Session</h2>
  <div class="forms">
    ${runFormHtml({ open: openForm === "run", prefill: prefillFor("run"), defaultTime })}
    ${swimFormHtml({ open: openForm === "swim", prefill: prefillFor("swim"), defaultTime })}
    ${badmintonFormHtml({ open: openForm === "badminton", prefill: prefillFor("badminton"), defaultTime })}
    ${tennisFormHtml({ open: openForm === "tennis", prefill: prefillFor("tennis"), defaultTime })}
    ${gymFormHtml({ open: openForm === "gym", prefill: prefillFor("gym"), defaultTime, recoveryHint })}
  </div>`;
}

// ---------- Weekly Plan vs Actual ----------

function weeklyProgressHtml({ weekPlans, weekSessions, weekTargetKm }) {
  const actualKm = weekSessions.filter((s) => s.type === "RUN").reduce((sum, s) => sum + (Number(s.distance_km) || 0), 0);
  const activeDays = new Set(weekSessions.map((s) => s.session_date)).size;
  const pct = weekTargetKm > 0 ? Math.round((actualKm / weekTargetKm) * 100) : 0;

  return `<h2>Weekly Plan vs Actual</h2>
  <div class="card">
    <div class="card-label">Target ${weekTargetKm.toFixed(1)}km · Actual ${actualKm.toFixed(1)}km</div>
    <div class="stat-bar"><div class="stat-bar-fill ${pct >= 100 ? "tier-high" : pct >= 50 ? "tier-mid" : "tier-low"}" style="width:${Math.min(100, pct)}%"></div></div>
    <div class="card-sub">${activeDays} hari aktif minggu ini · ${weekPlans.length} sesi terjadwal</div>
  </div>`;
}

// ---------- Schedule & Plan Viewer ----------

function scheduleDayHtml(plan, todayKey) {
  const badge = SESSION_TYPE_BADGE[plan.session_type] || plan.session_type;
  const statusBadge =
    plan.status === "DONE" ? " ✅" : plan.status === "SKIPPED" ? " ⏭" : "";
  const summary = planSummaryLine(plan);

  const actions =
    plan.status === "PENDING"
      ? `<div class="button-row" style="margin-top:8px;">
          ${
            plan.session_type === "REST"
              ? `<form method="POST" action="/hub/grind/plan/${plan.id}/complete-rest" style="margin:0;"><button type="submit" class="btn-primary btn-sm">✓ Complete</button></form>`
              : `<a class="btn-primary btn-sm" href="/hub/grind?complete=${plan.id}#log-forms">✓ Complete</a>`
          }
          <form method="POST" action="/hub/grind/plan/${plan.id}/skip" style="margin:0;"><button type="submit" class="btn-secondary btn-sm">Skip</button></form>
        </div>`
      : "";

  // Jadwal yang kelewat (SKIPPED) atau belum sempat dikerjakan (PENDING) di hari lain bisa
  // digeser ke hari ini - lihat movePlanToToday (grind/supabase.js) buat logic tukar tanggalnya.
  const moveToToday =
    plan.plan_date !== todayKey && ["PENDING", "SKIPPED"].includes(plan.status)
      ? `<form method="POST" action="/hub/grind/plan/${plan.id}/move-to-today" style="margin-top:6px;">
          <button type="submit" class="btn-secondary btn-sm">↪ Move to Today</button>
        </form>`
      : "";

  return `<details class="log-item">
    <summary><span class="log-name">${dateLabel(plan.plan_date)} — ${badge}${statusBadge}</span></summary>
    <div class="log-detail-body">
      ${summary ? `<div class="card-sub">${escapeHtml(summary)}</div>` : ""}
      ${plan.instructions ? `<div class="card-sub" style="margin-top:4px;">${escapeHtml(plan.instructions)}</div>` : ""}
      ${actions}
      ${moveToToday}
      <details class="inline-toggle">
        <summary>Edit plan</summary>
        <div class="inline-toggle-body">
          <form method="POST" action="/hub/grind/plan/${plan.id}/update">
            <label>Jarak Target (km)</label>
            <input type="number" step="0.01" name="target_distance_km" value="${plan.target_distance_km ?? ""}">
            <label>Target Pace</label>
            <input type="text" name="target_pace" value="${escapeHtml(plan.target_pace || "")}">
            <label>Target HR</label>
            <input type="text" name="target_hr" value="${escapeHtml(plan.target_hr || "")}">
            <label>Instruksi</label>
            <textarea name="instructions" rows="2">${escapeHtml(plan.instructions || "")}</textarea>
            <button type="submit">Simpan</button>
          </form>
        </div>
      </details>
    </div>
  </details>`;
}

function scheduleViewerHtml({ weekPlans, nextWeekPlans, todayKey }) {
  const thisWeek = weekPlans.length
    ? weekPlans.map((p) => scheduleDayHtml(p, todayKey)).join("")
    : `<div class="empty-state">Belum ada plan minggu ini.</div>`;
  const nextWeek = nextWeekPlans.length
    ? nextWeekPlans.map((p) => scheduleDayHtml(p, todayKey)).join("")
    : `<div class="empty-state">Belum ada plan minggu depan.</div>`;

  return `<h2>Schedule</h2>
  <div class="card-sub" style="margin:-4px 0 8px;">This Week</div>
  ${thisWeek}
  <div class="card-sub" style="margin:16px 0 8px;">Next Week</div>
  ${nextWeek}`;
}

// ---------- Sport Summary (bulan ini) ----------

function sportSummaryHtml(monthSummary) {
  const { run, swim, badminton, tennis, gym } = monthSummary;
  return `<h2>Sport Summary (This Month)</h2>
  <div class="cards">
    <div class="card">
      <div class="card-label">${iconLabel("/icons/running.png", "Run")}</div>
      <div class="card-value card-value-compact">${run.totalKm.toFixed(1)}km</div>
      <div class="card-sub">${run.count} sesi${run.avgPace ? ` · avg ${run.avgPace}/km` : ""}${run.avgHr ? ` · avg ${run.avgHr}bpm` : ""}</div>
    </div>
    <div class="card">
      <div class="card-label">${iconLabel("/icons/swim.png", "Swim")}</div>
      <div class="card-value card-value-compact">${swim.totalKm.toFixed(1)}km</div>
      <div class="card-sub">${swim.count} sesi</div>
    </div>
    <div class="card">
      <div class="card-label">${iconLabel("/icons/shuttlecock.png", "Badminton")}</div>
      <div class="card-value card-value-compact">${badminton.count} sesi</div>
      <div class="card-sub">${badminton.totalHours}h total</div>
    </div>
    <div class="card">
      <div class="card-label">${iconLabel("/icons/tennis.png", "Tennis")}</div>
      <div class="card-value card-value-compact">${tennis.count} sesi</div>
      <div class="card-sub">${tennis.totalHours}h total</div>
    </div>
    <div class="card">
      <div class="card-label">${iconLabel("/icons/dumbbell.png", "Gym")}</div>
      <div class="card-value card-value-compact">${gym.count} sesi</div>
      <div class="card-sub">${gym.topLifts.length ? gym.topLifts.map((l) => `${escapeHtml(l.exerciseName)} ${l.maxWeight}kg`).join(", ") : "Belum ada data beban."}</div>
    </div>
  </div>`;
}

// ---------- History Log ----------

function historyRowHtml(s) {
  const facts = [];
  if (s.distance_km) facts.push(`${s.distance_km}km`);
  if (s.avg_pace) facts.push(`${s.avg_pace}/km`);
  if (s.duration_min) facts.push(`${s.duration_min}min`);
  if (s.avg_hr) facts.push(`${s.avg_hr}bpm`);

  const setsHtml = s.gymSets.length
    ? `<div class="log-item-row">${s.gymSets
        .map((g) => `<div class="log-item-info"><span>${escapeHtml(g.exercise_name)} (set ${g.set_order})</span><span>${g.weight_kg ?? "-"}kg × ${g.reps ?? "-"}</span></div>`)
        .join("")}</div>`
    : "";

  return `<details class="log-item">
    <summary>
      <span class="log-time">${dateLabel(s.session_date)} ${s.session_time}</span>
      <span class="log-name">${TYPE_ICON[s.type] || "•"} ${escapeHtml(s.sub_type || s.type)}</span>
      <span class="log-calories">${facts.join(" · ")}</span>
    </summary>
    <div class="log-detail-body">
      ${s.notes ? `<div class="card-sub">${escapeHtml(s.notes)}</div>` : ""}
      ${setsHtml}
      <details class="inline-toggle">
        <summary>Edit</summary>
        <div class="inline-toggle-body">
          <form method="POST" action="/hub/grind/sessions/${s.id}/update">
            <label>Tanggal</label>
            <input type="date" name="session_date" value="${s.session_date}">
            <label>Jarak (km)</label>
            <input type="number" step="0.01" name="distance_km" value="${s.distance_km ?? ""}">
            <label>Durasi (menit)</label>
            <input type="number" name="duration_min" value="${s.duration_min ?? ""}">
            <label>Avg Pace</label>
            <input type="text" name="avg_pace" value="${escapeHtml(s.avg_pace || "")}">
            <label>Avg HR</label>
            <input type="number" name="avg_hr" value="${s.avg_hr ?? ""}">
            <label>Catatan</label>
            <textarea name="notes" rows="2">${escapeHtml(s.notes || "")}</textarea>
            <button type="submit">Simpan</button>
          </form>
        </div>
      </details>
      <form method="POST" action="/hub/grind/sessions/${s.id}/delete" style="margin-top:8px;" onsubmit="return confirm('Hapus sesi ini?')">
        <button type="submit" class="btn-secondary btn-sm">🗑 Delete</button>
      </form>
    </div>
  </details>`;
}

function historyLogHtml(historyLogs) {
  const rows = historyLogs.length
    ? historyLogs.map(historyRowHtml).join("")
    : `<div class="empty-state">Belum ada histori latihan.</div>`;
  return `<h2>History</h2>${rows}`;
}

// ---------- Client scripts ----------

// Hybrid auto-calc/manual pace, dipakai bareng Run & Swim (lihat distanceSportFormHtml) - tiap
// key dapet wiring sendiri-sendiri (nggak saling ganggu antar form).
// Bidirectional: cukup isi 2 dari 3 (jarak, durasi, pace), yang ketiga keisi otomatis. Field
// yang udah diedit manual langsung (durationManual/paceManual) dilindungi dari auto-overwrite -
// begitu user ngetik manual di salah satu, field itu berhenti ikut dihitung ulang otomatis.
function pacecalcScript() {
  return `<script>
    ["run", "swim"].forEach(function (key) {
      var dist = document.getElementById(key + "-distance");
      var dur = document.getElementById(key + "-duration");
      var pace = document.getElementById(key + "-pace");
      if (!dist || !dur || !pace) return;
      var durationManual = false;
      var paceManual = false;

      function paceStrToSeconds(str) {
        var m = String(str || "").match(/^(\\d{1,2}):(\\d{2})$/);
        if (!m) return null;
        return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
      }
      function secondsToPaceStr(sec) {
        var mm = Math.floor(sec / 60);
        var ss = Math.round(sec % 60);
        return String(mm).padStart(2, "0") + ":" + String(ss).padStart(2, "0");
      }

      function calcPaceFromDuration() {
        if (paceManual) return;
        var d = parseFloat(dist.value);
        var m = parseFloat(dur.value);
        if (!d || !m) return;
        pace.value = secondsToPaceStr((m * 60) / d);
      }
      function calcDurationFromPace() {
        if (durationManual) return;
        var d = parseFloat(dist.value);
        var paceSec = paceStrToSeconds(pace.value);
        if (!d || !paceSec) return;
        dur.value = Math.round((d * paceSec) / 60);
      }

      dist.addEventListener("input", function () {
        calcPaceFromDuration();
        if (!dur.value) calcDurationFromPace();
      });
      dur.addEventListener("input", function () {
        durationManual = true;
        calcPaceFromDuration();
      });
      pace.addEventListener("input", function () {
        paceManual = true;
        if (!dur.value) calcDurationFromPace();
      });
    });
  </script>`;
}

// Draft form Gym di-autosave ke localStorage ("grind_active_gym_draft") tiap ada perubahan
// (gerakan/set/beban/reps/split/durasi/catatan) biar nggak ilang kalau tab PWA ke-refresh atau
// layar HP kekunci di tengah sesi latihan - direstore pas form dibuka lagi, dan baru dihapus
// begitu form ini disubmit.
function gymFormScript() {
  return `<script>
    (function () {
      var container = document.getElementById("gym-sets-container");
      var subtypeSelect = document.getElementById("gym-subtype");
      var form = document.getElementById("gym-form");
      var durationInput = form ? form.querySelector('input[name="duration_min"]') : null;
      var notesInput = form ? form.querySelector('textarea[name="notes"]') : null;
      if (!container || !form) return;

      var DRAFT_KEY = ${JSON.stringify("grind_active_gym_draft")};

      function makeRow(exerciseName, setOrder, weightKg, reps) {
        var row = document.createElement("div");
        row.className = "item-edit-row gym-set-row";
        row.innerHTML =
          '<div><label>Exercise</label><input type="text" name="exercise_name[]" required></div>' +
          '<div><label>Set</label><input type="number" name="set_order[]" min="1" required></div>' +
          '<div><label>Weight (kg)</label><input type="number" step="0.5" name="weight_kg[]"></div>' +
          '<div><label>Reps</label><input type="number" name="reps[]"></div>' +
          '<div><button type="button" class="btn-secondary btn-sm">✕</button></div>';
        row.querySelector('input[name="exercise_name[]"]').value = exerciseName || "";
        row.querySelector('input[name="set_order[]"]').value = setOrder || 1;
        row.querySelector('input[name="weight_kg[]"]').value = weightKg != null ? weightKg : "";
        row.querySelector('input[name="reps[]"]').value = reps != null ? reps : "";
        row.querySelector("button").addEventListener("click", function () { row.remove(); saveDraft(); });
        row.querySelectorAll("input").forEach(function (el) { el.addEventListener("input", saveDraft); });
        return row;
      }

      function saveDraft() {
        try {
          var sets = Array.prototype.map.call(container.querySelectorAll(".gym-set-row"), function (row) {
            return {
              exercise_name: row.querySelector('input[name="exercise_name[]"]').value,
              set_order: row.querySelector('input[name="set_order[]"]').value,
              weight_kg: row.querySelector('input[name="weight_kg[]"]').value,
              reps: row.querySelector('input[name="reps[]"]').value,
            };
          });
          localStorage.setItem(DRAFT_KEY, JSON.stringify({
            subType: subtypeSelect ? subtypeSelect.value : "",
            durationMin: durationInput ? durationInput.value : "",
            notes: notesInput ? notesInput.value : "",
            sets: sets,
          }));
        } catch (e) {}
      }

      function clearDraft() {
        try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
      }

      function restoreDraft() {
        var draft = null;
        try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch (e) {}
        if (!draft || !draft.sets || !draft.sets.length) return false;

        container.innerHTML = "";
        draft.sets.forEach(function (s) {
          container.appendChild(makeRow(s.exercise_name, s.set_order, s.weight_kg, s.reps));
        });
        if (subtypeSelect && draft.subType) subtypeSelect.value = draft.subType;
        if (durationInput && draft.durationMin) durationInput.value = draft.durationMin;
        if (notesInput && draft.notes) notesInput.value = draft.notes;
        return true;
      }

      if (!restoreDraft()) {
        container.querySelectorAll(".gym-set-row input").forEach(function (el) {
          el.addEventListener("input", saveDraft);
        });
      }

      document.getElementById("gym-add-set").addEventListener("click", function () {
        var rows = container.querySelectorAll(".gym-set-row");
        var last = rows[rows.length - 1];
        var exerciseName = last ? last.querySelector('input[name="exercise_name[]"]').value : "";
        var lastOrder = last ? parseInt(last.querySelector('input[name="set_order[]"]').value, 10) || 0 : 0;
        container.appendChild(makeRow(exerciseName, lastOrder + 1, null, null));
        saveDraft();
      });

      document.getElementById("gym-add-exercise").addEventListener("click", function () {
        container.appendChild(makeRow("", 1, null, null));
        saveDraft();
      });

      if (subtypeSelect) {
        subtypeSelect.addEventListener("change", function () {
          fetch("/hub/grind/api/last-split?sub_type=" + encodeURIComponent(subtypeSelect.value))
            .then(function (r) { return r.json(); })
            .then(function (data) {
              if (!data.sets || !data.sets.length) return;
              container.innerHTML = "";
              data.sets.forEach(function (s) {
                container.appendChild(makeRow(s.exercise_name, s.set_order, s.weight_kg, s.reps));
              });
              saveDraft();
            })
            .catch(function () {});
        });
      }

      if (durationInput) durationInput.addEventListener("input", saveDraft);
      if (notesInput) notesInput.addEventListener("input", saveDraft);

      form.addEventListener("submit", clearDraft);
    })();

    function grindStartRestTimer(seconds) {
      var display = document.getElementById("gym-rest-timer-display");
      if (!display) return;
      if (window.__grindRestTimerInterval) clearInterval(window.__grindRestTimerInterval);
      var remaining = seconds;
      display.textContent = "Rest: " + remaining + "s";
      window.__grindRestTimerInterval = setInterval(function () {
        remaining--;
        if (remaining <= 0) {
          clearInterval(window.__grindRestTimerInterval);
          display.textContent = "Rest done!";
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          return;
        }
        display.textContent = "Rest: " + remaining + "s";
      }, 1000);
    }
  </script>`;
}

// ---------- Page ----------

export function renderGrindPage({
  todayPlan,
  todaySessions,
  upcomingRace,
  weekPlans,
  nextWeekPlans,
  weekSessions,
  weekTargetKm,
  monthSummary,
  historyLogs,
  recoveryHint,
  flash,
  openForm,
  prefill,
  defaultTime,
  todayKey,
}) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Grind</title>
${faviconLink("/icons/grind-icon.png")}
<style>${DASHBOARD_CSS}</style>
</head>
<body>
  <div class="container">
    ${navHeader({ icon: "/icons/grind-icon.png", title: "Grind", links: [{ href: "/hub", label: "Home" }] })}

    ${flash ? `<div class="flash flash-${flash.type}">${escapeHtml(flash.text)}</div>` : ""}

    ${raceBannerHtml(upcomingRace)}
    ${todayCardHtml(todayPlan, todaySessions)}
    ${importSectionHtml(flash)}
    ${logFormsHtml({ openForm, prefill, defaultTime, recoveryHint })}
    ${weeklyProgressHtml({ weekPlans, weekSessions, weekTargetKm })}
    ${scheduleViewerHtml({ weekPlans, nextWeekPlans, todayKey })}
    ${sportSummaryHtml(monthSummary)}
    ${historyLogHtml(historyLogs)}
  </div>
  ${pacecalcScript()}
  ${gymFormScript()}
</body>
</html>`;
}
