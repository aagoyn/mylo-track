import { DASHBOARD_CSS, escapeHtml, navHeader, faviconLink, iconLabel } from "../../shared/dashboard-layout.js";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SESSION_TYPE_BADGE = {
  EASY: iconLabel("/icons/running.png", "Easy"),
  QUALITY: iconLabel("/icons/running.png", "Quality"),
  "LONG RUN": iconLabel("/icons/running.png", "Long Run"),
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

// Opsi "ubah jenis sesi" di Edit plan (Schedule) - value-nya harus sama persis sama session_type
// yang dikenali sportForSessionType/SESSION_TYPE_BADGE di router.js & dashboard.js.
const SESSION_TYPE_OPTIONS = [
  { value: "EASY", label: "Easy Run" },
  { value: "QUALITY", label: "Quality (Tempo)" },
  { value: "LONG RUN", label: "Long Run" },
  { value: "RACE DAY", label: "Race Day" },
  { value: "SWIM", label: "Swim" },
  { value: "BADMINTON", label: "Badminton" },
  { value: "TENNIS", label: "Tennis" },
  { value: "GYM", label: "Gym" },
  { value: "REST", label: "Rest" },
];

function dateLabel(dateKey) {
  const d = new Date(`${dateKey}T00:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

function daysUntil(dateKey) {
  const today = new Date(`${new Date(Date.now() + WIB_OFFSET_MS).toISOString().slice(0, 10)}T00:00:00Z`);
  const target = new Date(`${dateKey}T00:00:00Z`);
  return Math.round((target - today) / 86400000);
}

// Target Pace/HR yang di-import dari sheet kadang nempel sama catatan panjang dalam kurung
// (mis. "119-139 bpm (Zona 2 - pakai Metode Run/Walk kalau susah turun)") - di ringkasan plan
// cuma angka intinya yang relevan, catatan lengkapnya tetep utuh di plan.instructions (lihat
// todayPlanAndLoggerHtml/scheduleDayHtml yang nampilin instructions terpisah).
function stripParenthetical(str) {
  return str ? str.replace(/\s*\([^)]*\)/g, "").trim() : str;
}

function planSummaryLine(plan) {
  const parts = [];
  if (plan.target_distance_km) parts.push(`${plan.target_distance_km}km`);
  if (plan.target_pace) parts.push(stripParenthetical(plan.target_pace));
  if (plan.target_hr) parts.push(stripParenthetical(plan.target_hr));
  return parts.join(" · ");
}

// Judul pendek buat Race Countdown Banner - "RACE DAY: UI ULTRA 7K. Ini race kecil..." jadi
// cuma "UI ULTRA 7K" (kalimat pertama sebelum titik, minus prefix "RACE DAY:").
function raceShortTitle(raceName) {
  if (!raceName) return "Race Day";
  const firstSentence = raceName.split(".")[0];
  const stripped = firstSentence.replace(/^RACE DAY:\s*/i, "").trim();
  return stripped || "Race Day";
}

function raceWhenLabel(diff) {
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff < 0) return `${Math.abs(diff)}d ago`;
  return `in ${diff} days`;
}

function shortDateLabel(dateKey) {
  const d = new Date(`${dateKey}T00:00:00Z`);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

// Swim dicatat dalam meter (bukan km kayak Run) - distance_km di DB tetap kesimpen dalam km
// (konsisten 1 kolom buat semua sport jarak), cuma dikonversi ke meter pas ditampilkan/diisi di
// form. Pace-nya juga ngikut konvensi renang: per 100m, bukan per km.
function formatSessionDistance(s) {
  return s.type === "SWIM" ? `${Math.round(s.distance_km * 1000)}m` : `${s.distance_km}km`;
}

function formatSessionPace(s) {
  return s.type === "SWIM" ? `${s.avg_pace}/100m` : `${s.avg_pace}/km`;
}

function sessionFacts(s) {
  const facts = [];
  if (s.distance_km) facts.push(formatSessionDistance(s));
  if (s.avg_pace) facts.push(formatSessionPace(s));
  if (s.duration_min) facts.push(`${s.duration_min}min`);
  if (s.avg_hr) facts.push(`${s.avg_hr}bpm`);
  return facts;
}

// Dipakai Hub buat masukin sesi Grind yang udah dilog hari ini ke list "Recent"
// (sebelumnya cuma Spending/Calorie/Mood/Journal yang nongol di situ).
export function grindActivityRow(s) {
  return {
    icon: TYPE_ICON[s.type] || "🏃",
    title: s.sub_type || s.type,
    subtitle: sessionFacts(s).join(" · ") || "Session logged",
    timestamp: s.created_at,
  };
}

function sessionLineHtml(s) {
  const facts = sessionFacts(s);
  return `<div class="card-sub">${TYPE_ICON[s.type] || "•"} ${s.session_time} ${escapeHtml(s.sub_type || s.type)}${facts.length ? " — " + facts.join(" · ") : ""}</div>`;
}

// ---------- Race countdown & phase banner ----------

export function raceBannerHtml(upcomingRace) {
  if (!upcomingRace) return "";
  const diff = daysUntil(upcomingRace.plan_date);
  const phaseLabel = upcomingRace.phase ? ` · Week ${upcomingRace.week_num || "?"} ${upcomingRace.phase}` : "";
  return `<div class="card" style="margin-bottom:12px; background:var(--accent-deep); border-color:var(--accent);">
    <div class="card-value card-value-compact">🏁 ${escapeHtml(raceShortTitle(upcomingRace.race_name))} · ${raceWhenLabel(diff)} (${shortDateLabel(upcomingRace.plan_date)})${phaseLabel}</div>
  </div>`;
}

// ---------- Hub card (ringkas, dipakai di /hub) ----------

// Quick-add dipangkas ke 4 olahraga yang aktif dibiasain (Run/Badminton/Gym/Rest) biar grid-nya
// 2x2 yang bersih & tombolnya gampang di-tap di HP - Swim & Tennis masih bisa dicatat lewat
// "Complete Plan" kalau plan hari itu jenisnya SWIM/TENNIS (lihat sportForSessionType di
// router.js), cuma nggak dapet tile ad-hoc sendiri lagi.
const QUICK_ADD_SPORTS = [
  { form: "run", icon: "/icons/running.png", label: "Run" },
  { form: "badminton", icon: "/icons/shuttlecock.png", label: "Badminton" },
  { form: "gym", icon: "/icons/dumbbell.png", label: "Gym" },
];

function restTileHtml() {
  return `<form method="POST" action="/hub/grind/sessions/rest" style="margin:0;">
      <button type="submit" class="sport-tile"><span class="sport-tile-emoji">😴</span>Rest</button>
    </form>`;
}

// Dipakai di card Grind /hub - tiap tile navigate ke /hub/grind (forms-nya cuma ada di sana).
function quickAddTilesHub() {
  const tiles = QUICK_ADD_SPORTS.map(
    (s) => `<a class="sport-tile" href="/hub/grind?form=${s.form}#today-logger"><img src="${s.icon}" alt="">${s.label}</a>`
  ).join("");

  return `<div class="card-sub" style="margin:10px 0 6px;">Or log a session</div>
  <div class="sport-tile-grid">
    ${tiles}
    ${restTileHtml()}
  </div>`;
}

// Dipakai di /hub/grind sendiri - tiap tile nge-trigger buka form yang pas di tempat (lihat
// quickAddScript), bukan navigate ke section lain.
function quickAddTilesGrindPage() {
  const tiles = QUICK_ADD_SPORTS.map(
    (s) => `<button type="button" class="sport-tile" data-target="form-${s.form}"><img src="${s.icon}" alt="">${s.label}</button>`
  ).join("");

  return `<div class="card-sub" style="margin:10px 0 6px;">Or log a session</div>
  <div class="sport-tile-grid" id="today-logger">
    ${tiles}
    ${restTileHtml()}
  </div>`;
}

export function grindHubCardHtml({ todayPlan, todaySessions, upcomingRace }) {
  const raceLine = upcomingRace
    ? `<div class="card-sub">🏁 ${escapeHtml(raceShortTitle(upcomingRace.race_name))} · ${raceWhenLabel(daysUntil(upcomingRace.plan_date))}</div>`
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
          : `<a class="btn-primary btn-sm" href="/hub/grind?complete=${todayPlan.id}#today-logger">✓ Complete Plan</a>`;
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

  return `${raceLine}${planBlock}${sessionsBlock}${quickAddTilesHub()}`;
}

// ---------- Import / Paste Training Plan (modal, dipicu tombol di header) ----------

function importPlanButtonHtml() {
  return `<button type="button" class="btn-secondary btn-sm" id="import-plan-btn">+ Import Plan</button>`;
}

function importModalHtml() {
  return `<dialog class="modal-dialog" id="import-plan-modal">
    <div class="modal-dialog-body">
      <div class="modal-dialog-header">
        <h3>📋 Import / Paste Training Plan</h3>
        <button type="button" class="modal-close-btn" id="import-plan-close">✕</button>
      </div>
      <form method="POST" action="/hub/grind/import">
        <textarea name="tsv" rows="8" placeholder="Paste dari Google Sheets/Excel (tab-separated): Tanggal | Hari | Minggu Ke- | Fase | Jenis Sesi | Jarak Target (km) | Target Pace | Target HR | Deskripsi/Instruksi | Status | Jarak Aktual (km) | Avg Pace Aktual" required></textarea>
        <button type="submit">Import</button>
      </form>
    </div>
  </dialog>`;
}

function importModalScript() {
  return `<script>
    (function () {
      var btn = document.getElementById("import-plan-btn");
      var modal = document.getElementById("import-plan-modal");
      var close = document.getElementById("import-plan-close");
      if (!btn || !modal) return;
      btn.addEventListener("click", function () { modal.showModal(); });
      if (close) close.addEventListener("click", function () { modal.close(); });
      modal.addEventListener("click", function (e) { if (e.target === modal) modal.close(); });
    })();
  </script>`;
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

function sportFormSummaryHtml(iconPath, label) {
  return `<summary class="sport-form-summary"><img class="sport-form-summary-icon" src="${iconPath}" alt="">Log ${label}</summary>`;
}

// Dipakai Run & Swim - sama-sama jarak + durasi + pace (hybrid auto-calc/manual, lihat
// pacecalcScript). key = prefix id DOM ("run"/"swim"), dipakai jamak biar skrip bisa wire
// beberapa form sejenis dengan 1 fungsi generik. unit "km" (Run) atau "m" (Swim, dicatat dalam
// meter sesuai kebiasaan renang) - distance_km di DB tetap km, konversi meter<->km ditangani di
// sini (tampilan) dan di router (submit), lihat formatSessionDistance/registerDistanceSportRoute.
function distanceSportFormHtml({ key, iconPath, label, action, subtypes, open, prefill, defaultTime, unit = "km" }) {
  const isSwim = unit === "m";
  const distanceVal = isSwim
    ? prefill?.distanceKm != null
      ? Math.round(prefill.distanceKm * 1000)
      : ""
    : (prefill?.distanceKm ?? "");

  return `<details class="form-card" id="form-${key}" ${open ? "open" : ""}>
    ${sportFormSummaryHtml(iconPath, label)}
    <form method="POST" action="${action}">
      ${hiddenPlanId(prefill)}
      ${sessionTimeRadios("session_time", defaultTime)}
      ${subtypes?.length ? `<label>Jenis</label><select name="sub_type">${subtypeOptions(subtypes, prefill?.subType)}</select>` : ""}
      <label>Jarak (${isSwim ? "meter" : "km"})</label>
      <input type="number" step="${isSwim ? "1" : "0.01"}" name="distance_km" id="${key}-distance" value="${distanceVal}">
      <label>Durasi (menit)</label>
      <input type="number" name="duration_min" id="${key}-duration">
      <label>Avg Pace (MM:SS/${isSwim ? "100m" : "km"})</label>
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
    key: "run", iconPath: "/icons/running.png", label: "Run", action: "/hub/grind/sessions/run",
    subtypes: RUN_SUBTYPES, open, prefill, defaultTime,
  });
}

function swimFormHtml({ open, prefill, defaultTime }) {
  return distanceSportFormHtml({
    key: "swim", iconPath: "/icons/swim.png", label: "Swim", action: "/hub/grind/sessions/swim",
    subtypes: null, open, prefill, defaultTime, unit: "m",
  });
}

// Dipakai Badminton & Tennis - sama-sama durasi + quick-chips 60/90/120 menit.
function durationSportFormHtml({ key, iconPath, label, action, subtypes, open, prefill, defaultTime }) {
  return `<details class="form-card" id="form-${key}" ${open ? "open" : ""}>
    ${sportFormSummaryHtml(iconPath, label)}
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
    key: "badminton", iconPath: "/icons/shuttlecock.png", label: "Badminton", action: "/hub/grind/sessions/badminton",
    subtypes: BADMINTON_SUBTYPES, open, prefill, defaultTime,
  });
}

function tennisFormHtml({ open, prefill, defaultTime }) {
  return durationSportFormHtml({
    key: "tennis", iconPath: "/icons/tennis.png", label: "Tennis", action: "/hub/grind/sessions/tennis",
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
    ${sportFormSummaryHtml("/icons/dumbbell.png", "Gym")}
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

// ---------- Today's Plan + Interactive Quick Logger (gabungan, biar nggak perlu scroll ke
// section terpisah buat nge-log - lihat quickAddScript buat wiring klik tile -> buka form) ----------

function todayPlanAndLoggerHtml({ todayPlan, todaySessions, openForm, prefill, defaultTime, recoveryHint }) {
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
          : `<a class="btn-primary btn-sm" href="/hub/grind?complete=${todayPlan.id}#today-logger">✓ Complete Plan</a>`;
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

  // Swim/Tennis nggak punya tile di quickAddTilesGrindPage lagi, tapi form-nya tetep dirender
  // (disembunyiin lewat <details> tertutup) biar "Complete Plan" masih bisa kebuka kalau plan
  // hari itu jenisnya SWIM/TENNIS (lihat sportForSessionType di router.js).
  const prefillFor = (key) => (openForm === key ? prefill : null);
  const formsHtml = `<div class="forms" style="margin-top:12px;">
    ${runFormHtml({ open: openForm === "run", prefill: prefillFor("run"), defaultTime })}
    ${badmintonFormHtml({ open: openForm === "badminton", prefill: prefillFor("badminton"), defaultTime })}
    ${gymFormHtml({ open: openForm === "gym", prefill: prefillFor("gym"), defaultTime, recoveryHint })}
    ${swimFormHtml({ open: openForm === "swim", prefill: prefillFor("swim"), defaultTime })}
    ${tennisFormHtml({ open: openForm === "tennis", prefill: prefillFor("tennis"), defaultTime })}
  </div>`;

  return `<h2>Today</h2><div class="card">${body}${sessions}${quickAddTilesGrindPage()}</div>${formsHtml}`;
}

// Klik tile Run/Badminton/Gym -> buka <details class="form-card"> yang sesuai persis di bawah
// tile-nya (nggak navigate/reload) & tutup form lain yang lagi kebuka, biar cuma 1 form aktif
// dalam satu waktu kayak accordion.
function quickAddScript() {
  return `<script>
    document.querySelectorAll('.sport-tile[data-target]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.form-card[id^="form-"]').forEach(function (d) {
          if (d.id !== btn.dataset.target) d.open = false;
        });
        var target = document.getElementById(btn.dataset.target);
        if (!target) return;
        target.open = true;
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  </script>`;
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
    <details class="inline-toggle">
      <summary>Ubah target mingguan</summary>
      <div class="inline-toggle-body">
        <form method="POST" action="/hub/grind/settings/weekly-target">
          <label>Target lari per minggu (km)</label>
          <input type="number" step="0.1" name="weekly_run_target_km" value="${weekTargetKm}">
          <button type="submit">Simpan</button>
        </form>
      </div>
    </details>
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
              : `<a class="btn-primary btn-sm" href="/hub/grind?complete=${plan.id}#today-logger">✓ Complete</a>`
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
            <label>Jenis Sesi</label>
            <select name="session_type">${SESSION_TYPE_OPTIONS.map((o) => `<option value="${o.value}" ${o.value === plan.session_type ? "selected" : ""}>${o.label}</option>`).join("")}</select>
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
  <details class="schedule-next-week">
    <summary>Next Week (${nextWeekPlans.length})</summary>
    <div class="schedule-next-week-body">${nextWeek}</div>
  </details>`;
}

// ---------- Sport Summary (bulan ini) ----------

// Swim & Tennis dikeluarin dari Sport Summary (fokus ke 3 olahraga yang aktif dilacak rutin -
// lihat QUICK_ADD_SPORTS) tapi monthSummary (grind/supabase.js) tetep ngitung semuanya, jadi data
// swim/tennis bulan ini nggak hilang, cuma nggak ditampilin sebagai kartu di sini.
function sportSummaryHtml(monthSummary) {
  const { run, badminton, gym } = monthSummary;
  return `<h2>Sport Summary (This Month)</h2>
  <div class="cards">
    <div class="card">
      <div class="card-label">${iconLabel("/icons/running.png", "Run")}</div>
      <div class="card-value card-value-compact">${run.totalKm.toFixed(1)}km</div>
      <div class="card-sub">${run.count} sesi${run.avgPace ? ` · avg ${run.avgPace}/km` : ""}${run.avgHr ? ` · avg ${run.avgHr}bpm` : ""}</div>
    </div>
    <div class="card">
      <div class="card-label">${iconLabel("/icons/shuttlecock.png", "Badminton")}</div>
      <div class="card-value card-value-compact">${badminton.count} sesi</div>
      <div class="card-sub">${badminton.totalHours}h total</div>
    </div>
    <div class="card">
      <div class="card-label">${iconLabel("/icons/dumbbell.png", "Gym")}</div>
      <div class="card-value card-value-compact">${gym.count} sesi</div>
      <div class="card-sub">${gym.topLifts.length ? gym.topLifts.map((l) => `${escapeHtml(l.exerciseName)} ${l.maxWeight}kg`).join(", ") : "Belum ada data beban."}</div>
    </div>
  </div>`;
}

// ---------- History Log ----------

// Field jarak/pace cuma relevan buat sport yang ngukur jarak (Run & Swim) - Badminton/Tennis/Gym/
// Rest nggak pernah punya nilai ini, jadi disembunyiin dari form Edit biar nggak nampilin field
// yang selalu kosong.
const DISTANCE_SPORT_TYPES = ["RUN", "SWIM"];

function historyRowHtml(s) {
  const facts = sessionFacts(s);
  const isDistanceSport = DISTANCE_SPORT_TYPES.includes(s.type);
  const isSwim = s.type === "SWIM";
  const distanceValue = isSwim && s.distance_km != null ? Math.round(s.distance_km * 1000) : (s.distance_km ?? "");

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
            <input type="hidden" name="type" value="${s.type}">
            <label>Tanggal</label>
            <input type="date" name="session_date" value="${s.session_date}">
            ${
              isDistanceSport
                ? `<label>Jarak (${isSwim ? "meter" : "km"})</label>
            <input type="number" step="${isSwim ? "1" : "0.01"}" name="distance_km" value="${distanceValue}">`
                : ""
            }
            <label>Durasi (menit)</label>
            <input type="number" name="duration_min" value="${s.duration_min ?? ""}">
            ${
              isDistanceSport
                ? `<label>Avg Pace (MM:SS/${isSwim ? "100m" : "km"})</label>
            <input type="text" name="avg_pace" value="${escapeHtml(s.avg_pace || "")}">`
                : ""
            }
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

const HISTORY_VISIBLE_COUNT = 7;

function historyLogHtml(historyLogs) {
  if (!historyLogs.length) return `<h2>History</h2><div class="empty-state">Belum ada histori latihan.</div>`;

  const visibleRows = historyLogs.slice(0, HISTORY_VISIBLE_COUNT).map(historyRowHtml).join("");
  const restLogs = historyLogs.slice(HISTORY_VISIBLE_COUNT);
  const restRows = restLogs.length
    ? `<div id="history-rest" hidden>${restLogs.map(historyRowHtml).join("")}</div>
       <button type="button" class="btn-secondary btn-sm" id="history-show-all" style="width:100%; margin-top:4px;">Show All (${restLogs.length} more)</button>`
    : "";

  return `<h2>History</h2>${visibleRows}${restRows}`;
}

function historyShowAllScript() {
  return `<script>
    (function () {
      var btn = document.getElementById("history-show-all");
      var rest = document.getElementById("history-rest");
      if (!btn || !rest) return;
      btn.addEventListener("click", function () {
        rest.hidden = false;
        btn.hidden = true;
      });
    })();
  </script>`;
}

// ---------- Client scripts ----------

// Hybrid auto-calc/manual pace, dipakai bareng Run & Swim (lihat distanceSportFormHtml) - tiap
// key dapet wiring sendiri-sendiri (nggak saling ganggu antar form).
// Bidirectional: cukup isi 2 dari 3 (jarak, durasi, pace), yang ketiga keisi otomatis. Field
// yang udah diedit manual langsung (durationManual/paceManual) dilindungi dari auto-overwrite -
// begitu user ngetik manual di salah satu, field itu berhenti ikut dihitung ulang otomatis.
// segment: Run pace itu per 1km (distance field udah dalam km), Swim pace per 100m (distance
// field dalam meter) - lihat distanceSportFormHtml unit "km"/"m".
function pacecalcScript() {
  return `<script>
    var GRIND_PACE_SEGMENT = { run: 1, swim: 100 };
    Object.keys(GRIND_PACE_SEGMENT).forEach(function (key) {
      var segment = GRIND_PACE_SEGMENT[key];
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
        pace.value = secondsToPaceStr((m * 60 * segment) / d);
      }
      function calcDurationFromPace() {
        if (durationManual) return;
        var d = parseFloat(dist.value);
        var paceSec = paceStrToSeconds(pace.value);
        if (!d || !paceSec) return;
        dur.value = Math.round((d / segment) * paceSec / 60);
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
    ${navHeader({
      icon: "/icons/grind-icon.png",
      title: "Grind",
      links: [{ href: "/hub", label: "Home" }],
      extra: importPlanButtonHtml(),
    })}

    ${flash ? `<div class="flash flash-${flash.type}">${escapeHtml(flash.text)}</div>` : ""}

    ${raceBannerHtml(upcomingRace)}
    ${todayPlanAndLoggerHtml({ todayPlan, todaySessions, openForm, prefill, defaultTime, recoveryHint })}
    ${weeklyProgressHtml({ weekPlans, weekSessions, weekTargetKm })}
    ${scheduleViewerHtml({ weekPlans, nextWeekPlans, todayKey })}
    ${sportSummaryHtml(monthSummary)}
    ${historyLogHtml(historyLogs)}
  </div>
  ${importModalHtml()}
  ${pacecalcScript()}
  ${gymFormScript()}
  ${quickAddScript()}
  ${importModalScript()}
  ${historyShowAllScript()}
</body>
</html>`;
}
