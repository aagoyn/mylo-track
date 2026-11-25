import { DASHBOARD_CSS, escapeHtml, navHeader, faviconLink, svgIcon, svgIconLabel, iconBadgeHtml, bottomNavHtml } from "../../shared/dashboard-layout.js";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SESSION_TYPE_BADGE = {
  EASY: `${svgIcon("activity", { size: 16 })}Easy`,
  QUALITY: `${svgIcon("activity", { size: 16 })}Quality`,
  "LONG RUN": `${svgIcon("activity", { size: 16 })}Long Run`,
  BADMINTON: `${svgIcon("racket", { size: 16 })}Badminton`,
  GYM: `${svgIcon("dumbbell", { size: 16 })}Gym`,
  REST: `${svgIcon("moon", { size: 16 })}Rest`,
  "RACE DAY": `${svgIcon("flag", { size: 16 })}Race Day`,
  SWIM: `${svgIcon("waves", { size: 16 })}Swim`,
  TENNIS: `${svgIcon("tennisBall", { size: 16 })}Tennis`,
};
const TYPE_ICON = {
  RUN: svgIcon("activity", { size: 16 }),
  BADMINTON: svgIcon("racket", { size: 16 }),
  GYM: svgIcon("dumbbell", { size: 16 }),
  REST: svgIcon("moon", { size: 16 }),
  SWIM: svgIcon("waves", { size: 16 }),
  TENNIS: svgIcon("tennisBall", { size: 16 }),
};

// Dipakai khusus hero "plan hari ini" (planHeroHtml) - icon-badge gede + label teks polos tanpa
// icon ketempel (beda sama SESSION_TYPE_BADGE yang gabungin icon+text jadi 1 string buat badge
// kecil di Schedule/History).
const SESSION_TYPE_ICON_NAME = {
  EASY: "activity", QUALITY: "activity", "LONG RUN": "activity", "RACE DAY": "flag",
  BADMINTON: "racket", GYM: "dumbbell", REST: "moon", SWIM: "waves", TENNIS: "tennisBall",
};
const SESSION_TYPE_LABEL_TEXT = {
  EASY: "Easy", QUALITY: "Quality", "LONG RUN": "Long Run", "RACE DAY": "Race Day",
  BADMINTON: "Badminton", GYM: "Gym", REST: "Rest", SWIM: "Swim", TENNIS: "Tennis",
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

// "119-139 bpm (Zona 2 - pakai Metode Run/Walk kalau susah turun)" -> "Zone 2" doang (bukan
// seluruh catatannya, itu udah kepotong duluan sama stripParenthetical) - buat label kecil di
// bawah "Heart rate" pada planFactsGridHtml. null kalau nggak ada pola "Zona/Zone N" sama sekali.
function extractZone(str) {
  const m = String(str || "").match(/zon[ae]\s*(\d+)/i);
  return m ? `Zone ${m[1]}` : null;
}

// Hero "plan hari ini": icon-badge gede + angka jarak besar (buat sesi berbasis jarak) atau
// label jenis sesi polos (Gym/Rest/dst yang nggak punya target jarak).
function planHeroHtml(plan) {
  const iconName = SESSION_TYPE_ICON_NAME[plan.session_type] || "activity";
  const label = SESSION_TYPE_LABEL_TEXT[plan.session_type] || plan.session_type;
  const hasDistance = plan.target_distance_km != null;
  return `<div class="plan-hero">
    <div class="icon-badge">${svgIcon(iconName, { size: 24 })}</div>
    <div class="plan-hero-value">${hasDistance ? `${plan.target_distance_km}<span class="plan-hero-unit">km</span>` : escapeHtml(label)}</div>
  </div>
  ${hasDistance ? `<div class="plan-hero-subtype">${escapeHtml(label)}</div>` : ""}`;
}

// Grid 2 kolom pace/HR di bawah hero - cuma dirender kalau ada datanya (kebanyakan relevan buat
// sesi Run, sport lain biasanya nggak ngisi target_pace/target_hr).
function planFactsGridHtml(plan) {
  const facts = [];
  if (plan.target_pace) facts.push({ value: stripParenthetical(plan.target_pace), label: "Target pace" });
  if (plan.target_hr) {
    const zone = extractZone(plan.target_hr);
    facts.push({ value: stripParenthetical(plan.target_hr), label: zone ? `Heart rate · ${zone}` : "Heart rate" });
  }
  if (!facts.length) return "";
  return `<div class="plan-facts-grid">${facts
    .map((f) => `<div><div class="plan-fact-value">${escapeHtml(f.value)}</div><div class="plan-fact-label">${f.label}</div></div>`)
    .join("")}</div>`;
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
    icon: TYPE_ICON[s.type] || svgIcon("activity", { size: 16 }),
    title: s.sub_type || s.type,
    subtitle: sessionFacts(s).join(" · ") || "Session logged",
    timestamp: s.created_at,
  };
}

function sessionLineHtml(s) {
  const facts = sessionFacts(s);
  return `<div class="card-sub">${TYPE_ICON[s.type] || "•"} ${s.session_time} ${escapeHtml(s.sub_type || s.type)}${facts.length ? " — " + facts.join(" · ") : ""}</div>`;
}

// ---------- Race countdown ribbon (header tipis di atas card TODAY, bukan card sendiri) ----------

function raceRibbonHtml(upcomingRace) {
  if (!upcomingRace) return "";
  const diff = daysUntil(upcomingRace.plan_date);
  const phaseLabel = upcomingRace.phase ? ` · Week ${upcomingRace.week_num || "?"} ${upcomingRace.phase}` : "";
  const detail = `${shortDateLabel(upcomingRace.plan_date)}${phaseLabel}`;
  return `<div class="race-ribbon" title="${escapeHtml(detail)}">
    <div class="race-ribbon-title">${svgIcon("flag", { size: 14 })}${escapeHtml(raceShortTitle(upcomingRace.race_name))}</div>
    <div class="race-ribbon-pill">${raceWhenLabel(diff)}</div>
  </div>`;
}

// ---------- Hub card (ringkas, dipakai di /hub) ----------

// Card Grind di /hub cuma kebagian 4 olahraga yang paling sering (Run/Badminton/Gym/Rest) biar
// grid-nya 2x2 & tombolnya gede buat di-tap - forms Swim/Tennis cuma ada di halaman /hub/grind
// sendiri, jadi dari /hub tile itu nggak ditampilin biar nggak misleading (klik tapi harus
// navigate dulu buat ketemu form-nya).
const QUICK_ADD_SPORTS_HUB = [
  { form: "run", svg: "activity", label: "Run" },
  { form: "badminton", svg: "racket", label: "Badminton" },
  { form: "gym", svg: "dumbbell", label: "Gym" },
];

// Di /hub/grind sendiri semua 5 olahraga dapet tile (grid 3 kolom x 2 baris bareng Rest).
const QUICK_ADD_SPORTS_FULL = [
  { form: "run", svg: "activity", label: "Run" },
  { form: "swim", svg: "waves", label: "Swim" },
  { form: "badminton", svg: "racket", label: "Badminton" },
  { form: "tennis", svg: "tennisBall", label: "Tennis" },
  { form: "gym", svg: "dumbbell", label: "Gym" },
];

function restTileHtml({ stopPropagation = false } = {}) {
  return `<form method="POST" action="/hub/grind/sessions/rest" style="margin:0;" ${stopPropagation ? `onclick="event.stopPropagation()"` : ""}>
      <button type="submit" class="sport-tile sport-btn">${iconBadgeHtml(svgIcon("moon", { size: 20 }))}<span class="sport-tile-label">Rest</span></button>
    </form>`;
}

// Dipakai di card Grind /hub - tiap tile navigate ke /hub/grind (forms-nya cuma ada di sana).
// Kartu Grind di /hub sendiri udah bisa diklik ke /hub/grind (lihat grindHubCardHtml), jadi tiap
// tile di sini butuh stopPropagation biar klik tile-nya nggak ikut ke-tangkep sama onclick kartu.
function quickAddTilesHub() {
  const tiles = QUICK_ADD_SPORTS_HUB.map(
    (s) =>
      `<a class="sport-tile sport-btn" href="/hub/grind?form=${s.form}#today-logger" onclick="event.stopPropagation()">${iconBadgeHtml(svgIcon(s.svg, { size: 20 }))}<span class="sport-tile-label">${s.label}</span></a>`
  ).join("");

  return `<div class="card-sub" style="margin:10px 0 6px;">Or log a session</div>
  <div class="sport-tile-grid">
    ${tiles}
    ${restTileHtml({ stopPropagation: true })}
  </div>`;
}

// Dipakai di /hub/grind sendiri - tiap tile nge-trigger buka form yang pas di tempat (lihat
// quickAddScript), bukan navigate ke section lain.
function quickAddTilesGrindPage() {
  const tiles = QUICK_ADD_SPORTS_FULL.map(
    (s) =>
      `<button type="button" class="sport-tile sport-btn" data-target="form-${s.form}">${iconBadgeHtml(svgIcon(s.svg, { size: 20 }))}<span class="sport-tile-label">${s.label}</span></button>`
  ).join("");

  return `<div class="card-sub" style="margin:10px 0 6px;">Or log a session</div>
  <div class="sport-tile-grid sport-tile-grid-3" id="today-logger">
    ${tiles}
    ${restTileHtml()}
  </div>`;
}

export function grindHubCardHtml({ todayPlan, todaySessions, upcomingRace }) {
  const raceLine = raceRibbonHtml(upcomingRace);

  let planBlock;
  if (!todayPlan) {
    planBlock = `<div class="empty-state">No plan for today.</div>`;
  } else {
    planBlock = `${planHeroHtml(todayPlan)}${planFactsGridHtml(todayPlan)}`;

    if (todayPlan.status === "PENDING") {
      const completeBtn =
        todayPlan.session_type === "REST"
          ? `<form method="POST" action="/hub/grind/plan/${todayPlan.id}/complete-rest" class="flex-3" style="margin:0;" onclick="event.stopPropagation()">
               <button type="submit" class="btn-primary btn-sm">✓ Complete</button>
             </form>`
          : `<a class="btn-primary btn-sm flex-3" href="/hub/grind?complete=${todayPlan.id}#today-logger" onclick="event.stopPropagation()">✓ Complete Plan</a>`;
      planBlock += `<div class="button-row" style="margin-top:8px;">
        ${completeBtn}
        <form method="POST" action="/hub/grind/plan/${todayPlan.id}/skip" class="flex-1" style="margin:0;" onclick="event.stopPropagation()">
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

// ---------- Import / Paste Training Plan (FAB + dialog, khusus halaman ini) ----------

// CSS FAB "+ Plan" - sengaja ditaruh di sini (bukan shared/dashboard-layout.js) biar nggak nular
// ke halaman lain yang nggak butuh FAB ini sama sekali (lihat juga hub/dashboard.js buat FAB
// Quick Expense, pola yang sama tapi terpisah).
const GRIND_PAGE_CSS = `
  /* Ruang kosong ekstra di bawah biar konten terakhir (History dst) nggak ketutupan FAB
     "+ Plan" yang posisinya fixed melayang di pojok kanan bawah. */
  .container { padding-bottom: calc(144px + env(safe-area-inset-bottom)); }

  /* Warna/blur FAB (gradasi + kaca) datang dari .fab-btn (shared) - di sini cuma posisi/ukuran. */
  .grind-fab {
    position: fixed; bottom: calc(84px + env(safe-area-inset-bottom)); right: 20px; z-index: 40;
    display: inline-flex; align-items: center; justify-content: center;
    padding: 14px 22px; border-radius: 999px;
    color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit;
  }
`;

function importPlanFabHtml() {
  return `<button type="button" class="grind-fab fab-btn" id="import-plan-fab" aria-label="Import Training Plan">+ Plan</button>`;
}

function importModalHtml() {
  return `<dialog class="modal-dialog glass-card" id="import-plan-modal">
    <div class="modal-dialog-body">
      <div class="modal-dialog-header">
        <h3>📋 Import / Paste Training Plan</h3>
        <button type="button" class="modal-close-btn" id="import-plan-close">✕</button>
      </div>
      <p class="modal-dialog-caption">Tempel baris tab-separated dari Google Sheets/Excel, urutan kolom:</p>
      <p class="modal-dialog-caption-cols">Tanggal · Hari · Minggu Ke- · Fase · Jenis Sesi · Jarak Target (km) · Target Pace · Target HR · Deskripsi/Instruksi · Status · Jarak Aktual (km) · Avg Pace Aktual</p>
      <form method="POST" action="/hub/grind/import">
        <textarea name="tsv" rows="8" placeholder="Tempel data di sini..." required></textarea>
        <button type="submit">Import</button>
      </form>
    </div>
  </dialog>`;
}

function importModalScript() {
  return `<script>
    (function () {
      var btn = document.getElementById("import-plan-fab");
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

function sportFormSummaryHtml(iconSvg, label) {
  return `<summary class="sport-form-summary"><span class="sport-form-summary-icon">${svgIcon(iconSvg, { size: 18 })}</span>Log ${label}</summary>`;
}

// Dipakai Run & Swim - sama-sama jarak + durasi + pace (hybrid auto-calc/manual, lihat
// pacecalcScript). key = prefix id DOM ("run"/"swim"), dipakai jamak biar skrip bisa wire
// beberapa form sejenis dengan 1 fungsi generik. unit "km" (Run) atau "m" (Swim, dicatat dalam
// meter sesuai kebiasaan renang) - distance_km di DB tetap km, konversi meter<->km ditangani di
// sini (tampilan) dan di router (submit), lihat formatSessionDistance/registerDistanceSportRoute.
function distanceSportFormHtml({ key, iconSvg, label, action, subtypes, open, prefill, defaultTime, unit = "km" }) {
  const isSwim = unit === "m";
  const distanceVal = isSwim
    ? prefill?.distanceKm != null
      ? Math.round(prefill.distanceKm * 1000)
      : ""
    : (prefill?.distanceKm ?? "");

  return `<details class="form-card" id="form-${key}" ${open ? "open" : ""}>
    ${sportFormSummaryHtml(iconSvg, label)}
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
    key: "run", iconSvg: "activity", label: "Run", action: "/hub/grind/sessions/run",
    subtypes: RUN_SUBTYPES, open, prefill, defaultTime,
  });
}

function swimFormHtml({ open, prefill, defaultTime }) {
  return distanceSportFormHtml({
    key: "swim", iconSvg: "waves", label: "Swim", action: "/hub/grind/sessions/swim",
    subtypes: null, open, prefill, defaultTime, unit: "m",
  });
}

// Dipakai Badminton & Tennis - sama-sama durasi + quick-chips 60/90/120 menit.
function durationSportFormHtml({ key, iconSvg, label, action, subtypes, open, prefill, defaultTime }) {
  return `<details class="form-card" id="form-${key}" ${open ? "open" : ""}>
    ${sportFormSummaryHtml(iconSvg, label)}
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
    key: "badminton", iconSvg: "racket", label: "Badminton", action: "/hub/grind/sessions/badminton",
    subtypes: BADMINTON_SUBTYPES, open, prefill, defaultTime,
  });
}

function tennisFormHtml({ open, prefill, defaultTime }) {
  return durationSportFormHtml({
    key: "tennis", iconSvg: "tennisBall", label: "Tennis", action: "/hub/grind/sessions/tennis",
    subtypes: TENNIS_SUBTYPES, open, prefill, defaultTime,
  });
}

function gymFormHtml({ open, prefill, defaultTime, recoveryHint }) {
  return `<details class="form-card" id="form-gym" ${open ? "open" : ""}>
    ${sportFormSummaryHtml("dumbbell", "Gym")}
    ${recoveryHint ? `<div class="recovery-banner">💡 ${escapeHtml(recoveryHint)}</div>` : ""}
    <form method="POST" action="/hub/grind/sessions/gym" id="gym-form">
      ${hiddenPlanId(prefill)}
      ${sessionTimeRadios("session_time", defaultTime)}
      <label>Split</label>
      <div class="gym-subtype-row">
        <select name="sub_type" id="gym-subtype">${subtypeOptions(GYM_SUBTYPES, prefill?.subType)}</select>
        <button type="button" class="btn-secondary btn-sm" id="gym-reset-template" hidden>Reset to Template</button>
      </div>

      <div id="gym-exercises-container"><div class="empty-state">Loading template...</div></div>
      <div class="button-row" style="margin:8px 0;">
        <button type="button" class="btn-secondary btn-sm" id="gym-add-exercise">+ Add Exercise</button>
      </div>

      <div class="card-sub" style="margin-bottom:4px;">Rest Timer</div>
      <div class="button-row" style="margin-bottom:8px;">
        <button type="button" class="btn-secondary btn-sm" onclick="grindStartRestTimer(45)">45s</button>
        <button type="button" class="btn-secondary btn-sm" onclick="grindStartRestTimer(60)">60s</button>
        <button type="button" class="btn-secondary btn-sm" onclick="grindStartRestTimer(90)">90s</button>
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

function todayPlanAndLoggerHtml({ todayPlan, todaySessions, upcomingRace, openForm, prefill, defaultTime, recoveryHint }) {
  const raceLine = raceRibbonHtml(upcomingRace);

  let body;
  if (!todayPlan) {
    body = `<div class="empty-state">No plan scheduled for today.</div>`;
  } else {
    body = `${planHeroHtml(todayPlan)}${planFactsGridHtml(todayPlan)}
      ${todayPlan.instructions ? `<div class="card-sub" style="margin-top:2px;">${escapeHtml(todayPlan.instructions)}</div>` : ""}`;

    if (todayPlan.status === "PENDING") {
      const completeBtn =
        todayPlan.session_type === "REST"
          ? `<form method="POST" action="/hub/grind/plan/${todayPlan.id}/complete-rest" class="flex-3" style="margin:0;">
               <button type="submit" class="btn-primary btn-sm">✓ Complete</button>
             </form>`
          : `<a class="btn-primary btn-sm flex-3" href="/hub/grind?complete=${todayPlan.id}#today-logger">✓ Complete Plan</a>`;
      body += `<div class="button-row" style="margin-top:10px;">
        ${completeBtn}
        <form method="POST" action="/hub/grind/plan/${todayPlan.id}/skip" class="flex-1" style="margin:0;">
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

  const prefillFor = (key) => (openForm === key ? prefill : null);
  const formsHtml = `<div class="forms" style="margin-top:12px;">
    ${runFormHtml({ open: openForm === "run", prefill: prefillFor("run"), defaultTime })}
    ${badmintonFormHtml({ open: openForm === "badminton", prefill: prefillFor("badminton"), defaultTime })}
    ${gymFormHtml({ open: openForm === "gym", prefill: prefillFor("gym"), defaultTime, recoveryHint })}
    ${swimFormHtml({ open: openForm === "swim", prefill: prefillFor("swim"), defaultTime })}
    ${tennisFormHtml({ open: openForm === "tennis", prefill: prefillFor("tennis"), defaultTime })}
  </div>`;

  return `<h2>Today</h2><div class="card glass-card">${raceLine}${body}${sessions}${quickAddTilesGrindPage()}</div>${formsHtml}`;
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
  <div class="card glass-card">
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

function sportSummaryCardHtml(iconSvg, label, valueHtml, subHtml, { hidden = false } = {}) {
  return `<div class="card"${hidden ? ' hidden data-sport-summary-extra' : ""}>
    <div class="card-label">${svgIconLabel(iconSvg, label)}</div>
    <div class="card-value card-value-compact">${valueHtml}</div>
    <div class="card-sub">${subHtml}</div>
  </div>`;
}

// Run/Badminton/Gym selalu nongol (3 olahraga yang rutin dilacak). Swim/Tennis otomatis ikut
// nongol kalau bulan ini ada sesinya (count > 0) - kalau masih 0 sesi, kartunya disembunyiin
// (bukan dihapus - lihat sportSummaryToggleScript) biar nggak pincang/kosong tiap bulan,
// tapi tetep bisa diintip lewat tombol "Show all sports" di header.
function sportSummaryHtml(monthSummary) {
  const { run, badminton, gym, swim, tennis } = monthSummary;

  const coreCards = [
    sportSummaryCardHtml(
      "activity", "Run", `${run.totalKm.toFixed(1)}km`,
      `${run.count} sesi${run.avgPace ? ` · avg ${run.avgPace}/km` : ""}${run.avgHr ? ` · avg ${run.avgHr}bpm` : ""}`
    ),
    sportSummaryCardHtml("racket", "Badminton", `${badminton.count} sesi`, `${badminton.totalHours}h total`),
    sportSummaryCardHtml(
      "dumbbell", "Gym", `${gym.count} sesi`,
      gym.topLifts.length ? gym.topLifts.map((l) => `${escapeHtml(l.exerciseName)} ${l.maxWeight}kg`).join(", ") : "Belum ada data beban."
    ),
  ];

  const swimCard = sportSummaryCardHtml("waves", "Swim", `${swim.totalKm.toFixed(1)}km`, `${swim.count} sesi`, { hidden: swim.count === 0 });
  const tennisCard = sportSummaryCardHtml("tennisBall", "Tennis", `${tennis.count} sesi`, `${tennis.totalHours}h total`, { hidden: tennis.count === 0 });
  const hasHiddenSports = swim.count === 0 || tennis.count === 0;

  const toggle = hasHiddenSports
    ? `<button type="button" class="nav-link" id="sport-summary-toggle" data-more-label="Show all sports" data-less-label="Hide" style="background:none; border:none; padding:0; cursor:pointer; font:inherit;">Show all sports</button>`
    : "";

  return `<div class="section-header">
    <h2>Sport Summary (This Month)</h2>
    ${toggle}
  </div>
  <div class="cards">
    ${coreCards.join("")}
    ${swimCard}
    ${tennisCard}
  </div>`;
}

// Toggle 2 arah (bukan sekali pakai) - "Show all sports" nampilin Swim/Tennis yang masih 0 sesi,
// klik lagi ("Hide") nyembunyiin balik. Lihat juga historyShowAllScript, pola sama.
function sportSummaryToggleScript() {
  return `<script>
    (function () {
      var btn = document.getElementById("sport-summary-toggle");
      if (!btn) return;
      var extraCards = document.querySelectorAll("[data-sport-summary-extra]");
      btn.addEventListener("click", function () {
        var willShow = extraCards.length ? extraCards[0].hidden : false;
        extraCards.forEach(function (c) { c.hidden = !willShow; });
        btn.textContent = willShow ? btn.dataset.lessLabel : btn.dataset.moreLabel;
      });
    })();
  </script>`;
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
       <button type="button" class="btn-secondary btn-sm" id="history-show-all"
         data-more-label="Show All (${restLogs.length} more)" data-less-label="Show Less"
         style="width:100%; margin-top:4px;">Show All (${restLogs.length} more)</button>`
    : "";

  return `<h2>History</h2>${visibleRows}${restRows}`;
}

// Toggle 2 arah - sebelumnya cuma sekali pakai (klik -> tampil semua, nggak bisa balik ke
// collapsed tanpa reload halaman), sekarang klik lagi ("Show Less") nyembunyiin balik yang
// "rest"-nya tanpa reload.
function historyShowAllScript() {
  return `<script>
    (function () {
      var btn = document.getElementById("history-show-all");
      var rest = document.getElementById("history-rest");
      if (!btn || !rest) return;
      btn.addEventListener("click", function () {
        var willShow = rest.hidden;
        rest.hidden = !willShow;
        btn.textContent = willShow ? btn.dataset.lessLabel : btn.dataset.moreLabel;
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

// Form Gym: card per gerakan (nama editable, badge "Last: Xkg × Y" dari sesi terakhir kalau ada,
// + Copy Set yang nyalin angka dari baris terakhir) biar nyatet latihan beban nggak perlu ngetik
// gerakan/set satu-satu tiap kali. Ganti Split -> auto-fetch GET /hub/grind/gym-template (prioritas
// sesi terakhir, fallback starter preset - lihat getGymTemplate di supabase.js), KECUALI ada draft
// aktif buat split yang sama di localStorage ("grind_active_gym_draft") - draft dimenangkan biar
// progres yang lagi diisi nggak ketiban template setiap re-render, tombol "Reset to Template"
// disediakan buat yang mau sengaja muat ulang. Checklist "selesai" per set otomatis mulai Rest
// Timer 90s + getar pas abis. Semua state (termasuk checklist) di-autosave tiap ada perubahan,
// baru dihapus begitu form ini disubmit.
function gymFormScript() {
  return `<script>
    (function () {
      var container = document.getElementById("gym-exercises-container");
      var subtypeSelect = document.getElementById("gym-subtype");
      var resetBtn = document.getElementById("gym-reset-template");
      var addExerciseBtn = document.getElementById("gym-add-exercise");
      var form = document.getElementById("gym-form");
      var durationInput = form ? form.querySelector('input[name="duration_min"]') : null;
      var notesInput = form ? form.querySelector('textarea[name="notes"]') : null;
      if (!container || !form || !subtypeSelect) return;

      var DRAFT_KEY = ${JSON.stringify("grind_active_gym_draft")};

      function startRestTimerIfAvailable() {
        if (typeof grindStartRestTimer === "function") grindStartRestTimer(90);
      }

      function renumberSets(card) {
        card.querySelectorAll(".gym-set-row").forEach(function (row, i) {
          row.querySelector(".gym-set-index").textContent = i + 1;
          row.querySelector(".gym-set-order-hidden").value = i + 1;
        });
      }

      function syncExerciseName(card) {
        var name = card.querySelector(".gym-exercise-name").value;
        card.querySelectorAll(".gym-exercise-name-hidden").forEach(function (el) { el.value = name; });
      }

      function makeSetRow(weightKg, reps, done) {
        var row = document.createElement("div");
        row.className = "gym-set-row";
        row.innerHTML =
          '<span class="gym-set-index"></span>' +
          '<input type="hidden" class="gym-exercise-name-hidden" name="exercise_name[]">' +
          '<input type="hidden" class="gym-set-order-hidden" name="set_order[]">' +
          '<div class="gym-set-field">' +
            '<button type="button" class="stepper-btn" data-step="-2.5">−2.5</button>' +
            '<input type="text" inputmode="decimal" class="gym-weight-input" name="weight_kg[]">' +
            '<button type="button" class="stepper-btn" data-step="2.5">+2.5</button>' +
          '</div>' +
          '<div class="gym-set-field">' +
            '<button type="button" class="stepper-btn" data-step="-1">−1</button>' +
            '<input type="text" inputmode="numeric" class="gym-reps-input" name="reps[]">' +
            '<button type="button" class="stepper-btn" data-step="1">+1</button>' +
          '</div>' +
          '<label class="gym-set-done-label"><input type="checkbox" class="gym-set-done-checkbox"></label>';

        var weightInput = row.querySelector(".gym-weight-input");
        var repsInput = row.querySelector(".gym-reps-input");
        var doneCheckbox = row.querySelector(".gym-set-done-checkbox");
        weightInput.value = weightKg != null && weightKg !== "" ? weightKg : "";
        repsInput.value = reps != null && reps !== "" ? reps : "";
        if (done) {
          doneCheckbox.checked = true;
          row.classList.add("gym-set-done-row");
        }

        row.querySelectorAll(".stepper-btn[data-step]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var step = parseFloat(btn.dataset.step);
            var targetInput = btn.parentElement.querySelector("input");
            var current = parseFloat(targetInput.value) || 0;
            var next = Math.round((current + step) * 100) / 100;
            if (next < 0) next = 0;
            targetInput.value = next;
            saveDraft();
          });
        });
        weightInput.addEventListener("input", saveDraft);
        repsInput.addEventListener("input", saveDraft);
        doneCheckbox.addEventListener("change", function () {
          row.classList.toggle("gym-set-done-row", doneCheckbox.checked);
          if (doneCheckbox.checked) startRestTimerIfAvailable();
          saveDraft();
        });

        return row;
      }

      function makeExerciseCard(exerciseName, lastSummary, sets) {
        var card = document.createElement("div");
        card.className = "gym-exercise-card";
        card.innerHTML =
          '<div class="gym-exercise-head">' +
            '<input type="text" class="gym-exercise-name" placeholder="Nama gerakan" required>' +
            '<span class="gym-last-badge"></span>' +
            '<button type="button" class="gym-exercise-remove" aria-label="Hapus gerakan">✕</button>' +
          '</div>' +
          '<div class="gym-set-header-row">' +
            '<span></span><span class="gym-set-col-label">kg</span><span class="gym-set-col-label">reps</span><span></span>' +
          '</div>' +
          '<div class="gym-set-rows"></div>' +
          '<button type="button" class="btn-secondary btn-sm gym-copy-set">+ Copy Set</button>';

        var nameInput = card.querySelector(".gym-exercise-name");
        var badge = card.querySelector(".gym-last-badge");
        var rowsContainer = card.querySelector(".gym-set-rows");

        nameInput.value = exerciseName || "";
        if (lastSummary) {
          badge.textContent = lastSummary;
        } else {
          badge.hidden = true;
        }

        (sets && sets.length ? sets : [{ weightKg: "", reps: "" }]).forEach(function (s) {
          rowsContainer.appendChild(makeSetRow(s.weightKg, s.reps, s.done));
        });
        renumberSets(card);
        syncExerciseName(card);

        nameInput.addEventListener("input", function () { syncExerciseName(card); saveDraft(); });
        card.querySelector(".gym-exercise-remove").addEventListener("click", function () {
          card.remove();
          saveDraft();
        });
        card.querySelector(".gym-copy-set").addEventListener("click", function () {
          var rows = rowsContainer.querySelectorAll(".gym-set-row");
          var last = rows[rows.length - 1];
          var lastWeight = last ? last.querySelector(".gym-weight-input").value : "";
          var lastReps = last ? last.querySelector(".gym-reps-input").value : "";
          rowsContainer.appendChild(makeSetRow(lastWeight, lastReps, false));
          renumberSets(card);
          syncExerciseName(card);
          saveDraft();
        });

        return card;
      }

      function renderExercises(exercises) {
        container.innerHTML = "";
        if (!exercises || !exercises.length) {
          container.appendChild(makeExerciseCard("", null, [{ weightKg: "", reps: "" }]));
          return;
        }
        exercises.forEach(function (ex) {
          container.appendChild(makeExerciseCard(ex.exerciseName, ex.lastSummary, ex.sets));
        });
      }

      // ---------- draft persistence ----------

      function collectState() {
        var exercises = Array.prototype.map.call(container.querySelectorAll(".gym-exercise-card"), function (card) {
          var badge = card.querySelector(".gym-last-badge");
          var sets = Array.prototype.map.call(card.querySelectorAll(".gym-set-row"), function (row) {
            return {
              weightKg: row.querySelector(".gym-weight-input").value,
              reps: row.querySelector(".gym-reps-input").value,
              done: row.querySelector(".gym-set-done-checkbox").checked,
            };
          });
          return {
            exerciseName: card.querySelector(".gym-exercise-name").value,
            lastSummary: badge.hidden ? null : badge.textContent,
            sets: sets,
          };
        });
        return {
          split: subtypeSelect.value,
          durationMin: durationInput ? durationInput.value : "",
          notes: notesInput ? notesInput.value : "",
          exercises: exercises,
        };
      }

      function saveDraft() {
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify(collectState())); } catch (e) {}
      }

      function clearDraft() {
        try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
      }

      function readDraft() {
        try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch (e) { return null; }
      }

      // ---------- template loading ----------

      function loadTemplate(split) {
        container.innerHTML = '<div class="empty-state">Loading template...</div>';
        if (resetBtn) resetBtn.hidden = true;
        fetch("/hub/grind/gym-template?split=" + encodeURIComponent(split))
          .then(function (r) { return r.json(); })
          .then(function (data) { renderExercises(data.exercises); saveDraft(); })
          .catch(function () { renderExercises([]); });
      }

      function loadForSplit(split, forceTemplate) {
        var draft = !forceTemplate ? readDraft() : null;
        if (draft && draft.split === split && draft.exercises && draft.exercises.length) {
          renderExercises(draft.exercises);
          if (durationInput && draft.durationMin) durationInput.value = draft.durationMin;
          if (notesInput && draft.notes) notesInput.value = draft.notes;
          if (resetBtn) resetBtn.hidden = false;
          return;
        }
        loadTemplate(split);
      }

      subtypeSelect.addEventListener("change", function () { loadForSplit(subtypeSelect.value, false); });
      if (resetBtn) resetBtn.addEventListener("click", function () { loadForSplit(subtypeSelect.value, true); });
      if (addExerciseBtn) {
        addExerciseBtn.addEventListener("click", function () {
          container.appendChild(makeExerciseCard("", null, [{ weightKg: "", reps: "" }]));
          saveDraft();
        });
      }
      if (durationInput) durationInput.addEventListener("input", saveDraft);
      if (notesInput) notesInput.addEventListener("input", saveDraft);

      form.addEventListener("submit", clearDraft);

      loadForSplit(subtypeSelect.value, false);
    })();

    // Berbasis timestamp (bukan counter yang dikurangin tiap tick) biar nggak meleset kalau
    // setInterval di-throttle pas tab background/layar mati - skenario paling umum pas nunggu
    // rest timer gym. navigator.vibrate() sendiri kemungkinan besar DIBLOKIR browser kalau
    // halaman lagi nggak keliatan (itu alasan utama "udah selesai tapi nggak getar") - makanya
    // ada listener visibilitychange di bawah yang nyoba getar ULANG begitu user balik buka
    // tabnya kalau ternyata timer udah lewat waktu dia ninggalin halaman.
    function grindStartRestTimer(seconds) {
      var display = document.getElementById("gym-rest-timer-display");
      if (!display) return;
      if (window.__grindRestTimerInterval) clearInterval(window.__grindRestTimerInterval);
      window.__grindRestTimerEndAt = Date.now() + seconds * 1000;
      window.__grindRestTimerVibrated = false;

      function tick() {
        var remainingMs = window.__grindRestTimerEndAt - Date.now();
        if (remainingMs <= 0) {
          clearInterval(window.__grindRestTimerInterval);
          display.textContent = "Rest done!";
          if (!window.__grindRestTimerVibrated && navigator.vibrate) {
            window.__grindRestTimerVibrated = navigator.vibrate([200, 100, 200]);
          }
          return;
        }
        display.textContent = "Rest: " + Math.ceil(remainingMs / 1000) + "s";
      }

      tick();
      window.__grindRestTimerInterval = setInterval(tick, 250);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState !== "visible" || !window.__grindRestTimerEndAt) return;
      var display = document.getElementById("gym-rest-timer-display");
      if (display && Date.now() >= window.__grindRestTimerEndAt && !window.__grindRestTimerVibrated) {
        display.textContent = "Rest done!";
        if (navigator.vibrate) window.__grindRestTimerVibrated = navigator.vibrate([200, 100, 200]);
      }
    });
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
<style>${GRIND_PAGE_CSS}</style>
</head>
<body>
  <div class="container">
    ${navHeader({
      icon: "/icons/grind-icon.png",
      title: "Grind",
      links: [{ href: "/hub", label: "Home" }],
    })}

    ${flash ? `<div class="flash flash-${flash.type}">${escapeHtml(flash.text)}</div>` : ""}

    ${todayPlanAndLoggerHtml({ todayPlan, todaySessions, upcomingRace, openForm, prefill, defaultTime, recoveryHint })}
    ${weeklyProgressHtml({ weekPlans, weekSessions, weekTargetKm })}
    ${scheduleViewerHtml({ weekPlans, nextWeekPlans, todayKey })}
    ${sportSummaryHtml(monthSummary)}
    ${historyLogHtml(historyLogs)}
  </div>
  ${bottomNavHtml("/hub/grind")}
  ${importPlanFabHtml()}
  ${importModalHtml()}
  ${pacecalcScript()}
  ${gymFormScript()}
  ${quickAddScript()}
  ${importModalScript()}
  ${sportSummaryToggleScript()}
  ${historyShowAllScript()}
</body>
</html>`;
}
