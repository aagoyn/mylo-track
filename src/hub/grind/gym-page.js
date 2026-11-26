import { DASHBOARD_CSS, escapeHtml, faviconLink, svgIcon, svgIconLabel, bottomNavHtml } from "../../shared/dashboard-layout.js";
import { exerciseGuideScript, exerciseGuideDialogHtml, exerciseGuideStyles, exerciseAlternativesScript } from "./exercise-guides.js";
import { GYM_SPLITS } from "./gym-program.js";

// Halaman standalone Gym Workout Tracker ala Strong/Hevy - rep & set tracker dengan live duration
// timer, floating rest timer, dan auto-save draft ke localStorage. Menggantikan accordion
// "Log Gym" lama di /hub/grind (lihat grind/dashboard.js todayPlanAndLoggerHtml) tapi tetap
// nyimpen sesi lewat endpoint POST /hub/grind/sessions/gym yang sudah ada (addGymSets/createSession
// di grind/supabase.js, tidak berubah).
const DRAFT_KEY = "grind_active_gym_draft";

const GYM_PAGE_CSS = `
  .container { padding-bottom: calc(150px + env(safe-area-inset-bottom)); }

  .gym-header {
    position: sticky; top: 0; z-index: 30; margin: -24px -16px 16px; padding: calc(12px + env(safe-area-inset-top)) 16px 12px;
    border-radius: 0 0 16px 16px;
  }
  /* Baris 1: back+AM/PM di kiri, timer+tombol aksi di kanan - dipisah dari pills Split (baris 2)
     biar nggak sesak kayak sebelumnya (semua numpuk 1 baris, "Full Body" ketekan). */
  .gym-header-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .gym-header-left, .gym-header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .gym-back-link {
    display: inline-flex; align-items: center; gap: 4px; color: var(--text-muted);
    text-decoration: none; font-size: 13px; flex-shrink: 0;
  }
  .gym-back-link:hover { color: var(--text); }
  .gym-timer { font-size: 15px; font-weight: 700; }
  .gym-ampm-toggle { gap: 6px; flex-shrink: 0; }
  .gym-ampm-toggle label { padding: 5px 10px; font-size: 12px; }

  /* Baris 2: pills Split full-width, scrollable horizontal (bukan segmented-tab stretch default)
     biar "Full Body" tetap 1 baris utuh, nggak ketekan jadi 2 baris/kepotong. */
  .gym-split-pills-row { margin-top: 10px; width: 100%; }
  .gym-split-pills {
    display: flex; gap: 6px; width: 100%; overflow-x: auto; scrollbar-width: none;
    background: transparent; padding: 0;
  }
  .gym-split-pills::-webkit-scrollbar { display: none; }
  .gym-split-pills.segmented-tabs .segmented-tab {
    flex: 0 0 auto; white-space: nowrap; background: var(--bg); border: 1px solid var(--border);
  }
  .gym-split-pills.segmented-tabs .segmented-tab.active { border-color: var(--accent); }

  .recovery-banner-gym { margin-bottom: 12px; }

  /* Kartu gerakan dipisah jelas satu sama lain (sebelumnya nempel cuma mengandalkan margin
     default .card) - flex column + gap di container, padding lega di tiap kartu. */
  #gym-exercises-container { display: flex; flex-direction: column; gap: 16px; }
  .exercise-card { padding: 16px; }

  .exercise-card-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .exercise-name-input {
    flex: 1; min-width: 0; font-size: 15px; font-weight: 600; border: none; border-bottom: 1px solid transparent;
    background: transparent; color: var(--text); padding: 4px 0; margin-bottom: 0 !important;
  }
  .exercise-name-input:focus { outline: none; border-bottom-color: var(--accent); }
  .exercise-remove-btn {
    width: 28px; height: 28px; border-radius: 50%; border: none; background: transparent;
    color: var(--text-dim); font-size: 15px; line-height: 1; cursor: pointer; flex-shrink: 0;
  }
  .exercise-remove-btn:hover { background: var(--surface-hover); color: var(--danger); }

  .set-table-header, .set-row {
    display: grid; grid-template-columns: 32px 1fr 76px 76px 40px; gap: 6px; align-items: center;
  }
  .set-row.set-row-duration { grid-template-columns: 32px 1fr 56px 92px 40px; }
  .set-table-header {
    font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: .03em; padding: 0 2px 4px;
  }
  .set-table-header span:nth-child(3), .set-table-header span:nth-child(4) { text-align: center; }
  .set-row { padding: 4px 2px; border-radius: 8px; margin-bottom: 4px; transition: background .15s ease; }
  .set-row.set-row-done { background: var(--success-bg); }
  /* Badge Set jadi tombol (tap buat cycle Working/Warm-up/Failure, lihat fitur #3) - style default
     masih persis span lama biar nggak ganggu tampilan working set (mayoritas kasus). */
  button.set-index {
    text-align: center; font-size: 12px; color: var(--text-dim); background: transparent; border: none;
    cursor: pointer; font-family: inherit; width: 100%; padding: 6px 0; border-radius: 6px;
  }
  .set-index.set-type-warmup { background: rgba(217, 164, 65, .2); color: #8a5a10; font-weight: 700; }
  .set-index.set-type-failure { background: rgba(201, 115, 104, .2); color: #8a3b31; font-weight: 700; }
  .set-previous { font-size: 11px; color: var(--text-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .set-previous.set-previous-tappable { cursor: pointer; border-radius: 6px; padding: 4px 6px; margin: -4px -6px; }
  .set-previous.set-previous-tappable:hover { background: var(--surface-hover); color: var(--text); }
  .set-input {
    width: 100%; height: 38px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg);
    color: var(--text); text-align: center; font-size: 15px; font-weight: 600; padding: 0 4px;
    box-sizing: border-box; font-family: inherit; margin-bottom: 0 !important;
  }
  .set-row-done .set-input { background: var(--surface); border-color: transparent; }
  /* Kolom Sec (gerakan berbasis durasi, mis. Plank) - input + mini stopwatch play/pause, lihat
     fitur #2. Kolom ini gantiin kolom Reps biasa, lebarnya dipelebar via .set-row-duration. */
  .sec-cell { display: flex; align-items: center; gap: 4px; }
  .sec-cell .set-reps-input { flex: 1; min-width: 0; }
  .sec-timer-btn {
    width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg);
    color: var(--text-dim); display: flex; align-items: center; justify-content: center; flex-shrink: 0; cursor: pointer;
  }
  .sec-timer-btn.running { background: var(--accent); color: #fff; border-color: var(--accent); }
  .sec-timer-btn .svg-icon { margin: 0; }
  .set-check-btn {
    width: 38px; height: 38px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg);
    color: var(--text-dim); cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  }
  .set-check-btn .svg-icon { margin: 0; }
  .set-check-btn.checked { background: var(--success); border-color: var(--success); color: #fff; }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) .set-index.set-type-warmup { color: #f0c987; }
    :root:not([data-theme="light"]) .set-index.set-type-failure { color: #e8a79e; }
  }
  :root[data-theme="dark"] .set-index.set-type-warmup { color: #f0c987; }
  :root[data-theme="dark"] .set-index.set-type-failure { color: #e8a79e; }

  .add-set-btn {
    width: 100%; padding: 8px; margin-top: 8px; border-radius: 8px; border: 1px dashed var(--border);
    background: transparent; color: var(--text-muted); font-size: 13px; cursor: pointer; font-family: inherit;
  }
  .add-set-btn:hover { background: var(--surface-hover); color: var(--text); }

  .add-exercise-btn {
    width: 100%; padding: 12px; border-radius: 12px; border: 1px dashed var(--border-hover);
    background: transparent; color: var(--text-muted); font-size: 14px; font-weight: 600; cursor: pointer;
    margin-top: 4px; font-family: inherit;
  }
  .add-exercise-btn:hover { background: var(--surface-hover); color: var(--text); }

  .rest-timer-bar {
    position: fixed; bottom: calc(76px + env(safe-area-inset-bottom)); left: 50%; transform: translateX(-50%);
    z-index: 44; display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 999px;
    width: min(340px, calc(100% - 32px)); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  }
  .rest-timer-bar[hidden] { display: none; }
  .rest-timer-time { font-weight: 700; font-size: 15px; flex: 1; text-align: center; }
  .rest-timer-bar button {
    flex-shrink: 0; padding: 6px 10px; border-radius: 999px; border: none; background: var(--surface-hover);
    color: var(--text); font-size: 12px; cursor: pointer; font-family: inherit;
  }
  .rest-timer-bar button:hover { background: var(--border-hover); }

  /* Quick Tip Banner - dismissible 1x (localStorage grind_gym_tip_dismissed), fade+collapse halus. */
  .gym-tip-banner {
    display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; margin-bottom: 14px;
    font-size: 12.5px; line-height: 1.5; color: var(--text-muted);
    transition: opacity .25s ease, transform .25s ease, max-height .25s ease, padding .25s ease, margin .25s ease;
    max-height: 120px; overflow: hidden;
  }
  .gym-tip-banner[hidden] { display: none; }
  .gym-tip-banner.gym-tip-dismissing {
    opacity: 0; transform: translateY(-6px); max-height: 0; padding-top: 0; padding-bottom: 0; margin-bottom: 0;
  }
  .gym-tip-banner .svg-icon { flex-shrink: 0; margin-top: 1px; color: var(--accent); }
  .gym-tip-text { flex: 1; }
  .gym-tip-close {
    flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; border: none; background: transparent;
    color: var(--text-dim); font-size: 13px; line-height: 1; cursor: pointer; font-family: inherit;
  }
  .gym-tip-close:hover { background: var(--surface-hover); color: var(--text); }

  /* Tombol Guide (?) di header kartu - di kiri tombol hapus. */
  .exercise-guide-btn {
    width: 28px; height: 28px; border-radius: 50%; border: none; background: transparent;
    color: var(--text-dim); cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  }
  .exercise-guide-btn:hover { background: var(--surface-hover); color: var(--accent); }
  .exercise-guide-btn .svg-icon { margin: 0; }

  /* Tombol Swap (ganti alat/variasi gerakan) - sama ukuran sama tombol Guide/Remove. */
  .exercise-swap-btn {
    width: 28px; height: 28px; border-radius: 50%; border: none; background: transparent;
    color: var(--text-dim); cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  }
  .exercise-swap-btn:hover { background: var(--surface-hover); color: var(--accent); }
  .exercise-swap-btn .svg-icon { margin: 0; }

  /* Pill RPE - default abu netral, berubah warna aksen begitu user udah nyetel nilainya. */
  .exercise-rpe-pill {
    padding: 4px 8px; border-radius: 999px; border: 1px solid var(--border); background: var(--bg);
    color: var(--text-dim); font-size: 11px; font-weight: 700; cursor: pointer; flex-shrink: 0; font-family: inherit;
  }
  .exercise-rpe-pill.rpe-set { border-color: var(--accent); color: var(--accent); }

  /* Popover RPE & Swap - absolute terhadap wrapper relative-nya masing-masing. */
  .exercise-rpe-wrap, .exercise-swap-wrap { position: relative; flex-shrink: 0; }
  .rpe-popover, .swap-popover {
    position: absolute; top: 34px; right: 0; z-index: 50; background: var(--bg); border: 1px solid var(--border);
    border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.18); padding: 8px; display: flex; flex-wrap: wrap;
    gap: 6px; width: max-content; max-width: 220px;
  }
  .rpe-popover[hidden], .swap-popover[hidden] { display: none; }
  .rpe-option, .swap-option {
    padding: 6px 10px; border-radius: 999px; border: 1px solid var(--border); background: var(--bg);
    color: var(--text); font-size: 12px; cursor: pointer; font-family: inherit;
  }
  .rpe-option:hover, .swap-option:hover { background: var(--surface-hover); }
  .swap-option { border-radius: 8px; width: 100%; text-align: left; }
  .swap-custom-row { display: flex; gap: 6px; width: 100%; margin-top: 2px; }
  .swap-custom-input {
    flex: 1; min-width: 0; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg);
    color: var(--text); padding: 0 8px; font-size: 12px; font-family: inherit; margin-bottom: 0 !important;
  }
  .swap-custom-apply {
    padding: 0 10px; border-radius: 8px; border: none; background: var(--accent); color: #fff; font-size: 12px;
    cursor: pointer; font-family: inherit; flex-shrink: 0;
  }

  /* Post-Workout Summary & PR dialog */
  .summary-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 14px 0; text-align: center; }
  .summary-stat-value { font-size: 18px; font-weight: 700; color: var(--text); }
  .summary-stat-label { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
  .summary-pr-list { list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  .summary-pr-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 13px; background: var(--surface-hover); border-radius: 8px; padding: 8px 10px; }
  .summary-pr-badge {
    flex-shrink: 0; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; letter-spacing: .03em;
    background: linear-gradient(135deg, #D9A441, #C97368); color: #fff;
  }
`;
// Style konten dialog Exercise Form Guide (muscle badge, diagram animasi, steps, avoid/note box)
// di-export dari exercise-guides.js sendiri (exerciseGuideStyles) - dipakai di renderGymPage,
// bukan dobel ditulis di sini, biar modul guide tetap mandiri/portable.

function splitPillsHtml(defaultSplit) {
  const active = GYM_SPLITS.includes(defaultSplit) ? defaultSplit : GYM_SPLITS[0];
  const pills = GYM_SPLITS.map(
    (s) => `<button type="button" class="segmented-tab${s === active ? " active" : ""}" data-split="${s}">${s}</button>`
  ).join("");
  return `<div class="segmented-tabs gym-split-pills" id="gym-split-pills">${pills}</div>`;
}

function ampmToggleHtml(defaultTime) {
  return `<div class="radio-row gym-ampm-toggle" id="gym-ampm-toggle">
    <label class="${defaultTime !== "PM" ? "active" : ""}"><input type="radio" name="gym_session_time" value="AM" ${defaultTime !== "PM" ? "checked" : ""}>AM</label>
    <label class="${defaultTime === "PM" ? "active" : ""}"><input type="radio" name="gym_session_time" value="PM" ${defaultTime === "PM" ? "checked" : ""}>PM</label>
  </div>`;
}

function gymPageScript() {
  return `<script>
    (function () {
      var DRAFT_KEY = ${JSON.stringify(DRAFT_KEY)};
      var container = document.getElementById("gym-exercises-container");
      var splitPillsEl = document.getElementById("gym-split-pills");
      var addExerciseBtn = document.getElementById("gym-add-exercise");
      var form = document.getElementById("gym-page-form");
      var durationHidden = document.getElementById("gym-duration-min-hidden");
      var timerDisplay = document.getElementById("gym-duration");
      var startFinishBtn = document.getElementById("gym-start-finish-btn");
      var restBar = document.getElementById("rest-timer-bar");
      var restTimeEl = document.getElementById("rest-timer-time");
      if (!container || !splitPillsEl || !form) return;

      // Quick Tip Banner - tampil 1x doang (cek localStorage), ditutup via tombol ✕ dengan
      // animasi fade+collapse (CSS transition di .gym-tip-dismissing), baru hidden setelah selesai.
      var TIP_DISMISSED_KEY = "grind_gym_tip_dismissed";
      var tipBanner = document.getElementById("gym-tip-banner");
      var tipCloseBtn = document.getElementById("gym-tip-close");
      if (tipBanner) {
        try {
          if (localStorage.getItem(TIP_DISMISSED_KEY) !== "true") tipBanner.hidden = false;
        } catch (e) { tipBanner.hidden = false; }
        if (tipCloseBtn) {
          tipCloseBtn.addEventListener("click", function () {
            try { localStorage.setItem(TIP_DISMISSED_KEY, "true"); } catch (e) {}
            tipBanner.classList.add("gym-tip-dismissing");
            setTimeout(function () { tipBanner.hidden = true; }, 260);
          });
        }
      }

      // Timer nggak auto-jalan pas halaman dibuka (beda dari versi sebelumnya) - baru mulai pas
      // user klik "Start Workout" ATAU centang set pertama (auto-start), lihat startWorkout().
      var started = false;
      var startTime = null;
      var tickInterval = null;
      var restEndAt = null;
      var restInterval = null;

      function pad(n) { return String(n).padStart(2, "0"); }

      function tickDuration() {
        if (!started || !startTime) return;
        var elapsed = Math.floor((Date.now() - startTime) / 1000);
        var mm = Math.floor(elapsed / 60);
        var ss = elapsed % 60;
        timerDisplay.textContent = pad(mm) + ":" + pad(ss);
        if (durationHidden) durationHidden.value = Math.max(1, Math.round(elapsed / 60));
      }

      function startWorkout(resumeStartTime) {
        if (started) return;
        started = true;
        startTime = resumeStartTime || Date.now();
        if (startFinishBtn) {
          startFinishBtn.textContent = "Finish Workout";
          startFinishBtn.dataset.state = "finish";
        }
        tickDuration();
        if (tickInterval) clearInterval(tickInterval);
        tickInterval = setInterval(tickDuration, 1000);
        saveDraft();
      }

      if (startFinishBtn) {
        startFinishBtn.addEventListener("click", function () {
          if (!started) {
            startWorkout();
          } else {
            form.requestSubmit();
          }
        });
      }

      function showRestTimer(seconds) {
        restEndAt = Date.now() + seconds * 1000;
        restBar.hidden = false;
        if (restInterval) clearInterval(restInterval);
        function tick() {
          var remaining = Math.ceil((restEndAt - Date.now()) / 1000);
          if (remaining <= 0) {
            clearInterval(restInterval);
            restBar.hidden = true;
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            return;
          }
          restTimeEl.textContent = pad(Math.floor(remaining / 60)) + ":" + pad(remaining % 60);
        }
        tick();
        restInterval = setInterval(tick, 250);
      }

      document.getElementById("rest-timer-minus").addEventListener("click", function () {
        if (restEndAt == null) return;
        restEndAt -= 15000;
      });
      document.getElementById("rest-timer-plus").addEventListener("click", function () {
        if (restEndAt == null) return;
        restEndAt += 15000;
      });
      document.getElementById("rest-timer-skip").addEventListener("click", function () {
        if (restInterval) clearInterval(restInterval);
        restBar.hidden = true;
      });

      // Badge SET: tap buat cycle Working (angka urut) -> W (Warm-up) -> F (Failure) -> balik ke
      // Working (fitur #3). Nomor urut "asli" disimpen di dataset.orderNum (diisi renumber()),
      // dataset.setType nentuin apa yang ditampilin ("W"/"F" nimpa angka).
      function applySetTypeBadge(row) {
        var btn = row.querySelector(".set-index");
        var type = row.dataset.setType || "working";
        btn.classList.remove("set-type-warmup", "set-type-failure");
        if (type === "warmup") { btn.textContent = "W"; btn.classList.add("set-type-warmup"); }
        else if (type === "failure") { btn.textContent = "F"; btn.classList.add("set-type-failure"); }
        else { btn.textContent = row.dataset.orderNum || "1"; }
      }

      function renumber(card) {
        card.querySelectorAll(".set-row").forEach(function (row, i) {
          row.dataset.orderNum = i + 1;
          applySetTypeBadge(row);
        });
      }

      function playBeep() {
        try {
          var Ctx = window.AudioContext || window.webkitAudioContext;
          if (!Ctx) return;
          var ctx = new Ctx();
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        } catch (e) {}
      }

      function makeSetRow(previousText, weight, reps, done, setType) {
        var row = document.createElement("div");
        row.className = "set-row" + (done ? " set-row-done" : "");
        row.dataset.setType = setType || "working";
        // previousText cuma dibikin tappable (fitur #1) kalau pola "Xkg × Y" dari riwayat beneran
        // (bukan label target preset "Target: 6–8 reps" yang nggak punya angka pasti buat diisi).
        var hasFillablePrevious = /^[\d.]+\s*kg\s*×\s*\d+/i.test(previousText || "");
        row.innerHTML =
          '<button type="button" class="set-index"></button>' +
          '<span class="set-previous' + (hasFillablePrevious ? " set-previous-tappable" : "") + '">' + (previousText || "—") + '</span>' +
          '<input type="text" inputmode="decimal" class="set-input set-kg-input" placeholder="kg">' +
          '<div class="sec-cell">' +
            '<input type="text" inputmode="numeric" class="set-input set-reps-input" placeholder="reps">' +
            '<button type="button" class="sec-timer-btn" aria-label="Mulai hitung mundur" hidden>${svgIcon("play", { size: 13 })}</button>' +
          '</div>' +
          '<button type="button" class="set-check-btn' + (done ? " checked" : "") + '" aria-label="Set selesai">${svgIcon("check", { size: 16 })}</button>';

        var kgInput = row.querySelector(".set-kg-input");
        var repsInput = row.querySelector(".set-reps-input");
        var checkBtn = row.querySelector(".set-check-btn");
        var typeBtn = row.querySelector(".set-index");
        var secBtn = row.querySelector(".sec-timer-btn");
        kgInput.value = weight || "";
        repsInput.value = reps || "";

        kgInput.addEventListener("input", saveDraft);
        repsInput.addEventListener("input", saveDraft);

        typeBtn.addEventListener("click", function () {
          var order = ["working", "warmup", "failure"];
          var idx = order.indexOf(row.dataset.setType || "working");
          row.dataset.setType = order[(idx + 1) % order.length];
          applySetTypeBadge(row);
          saveDraft();
        });

        if (hasFillablePrevious) {
          row.querySelector(".set-previous").addEventListener("click", function () {
            var m = /^([\d.]+)\s*kg\s*×\s*(\d+)/i.exec(previousText || "");
            if (!m) return;
            kgInput.value = m[1];
            repsInput.value = m[2];
            saveDraft();
          });
        }

        var secInterval = null;
        secBtn.addEventListener("click", function () {
          if (secInterval) {
            clearInterval(secInterval);
            secInterval = null;
            secBtn.classList.remove("running");
            secBtn.innerHTML = '${svgIcon("play", { size: 13 })}';
            return;
          }
          var target = parseInt(repsInput.value, 10);
          if (!target || target <= 0) target = 30;
          var remaining = target;
          secBtn.classList.add("running");
          secBtn.innerHTML = '${svgIcon("pause", { size: 13 })}';
          repsInput.value = remaining;
          secInterval = setInterval(function () {
            remaining -= 1;
            repsInput.value = Math.max(0, remaining);
            if (remaining <= 0) {
              clearInterval(secInterval);
              secInterval = null;
              secBtn.classList.remove("running");
              secBtn.innerHTML = '${svgIcon("play", { size: 13 })}';
              repsInput.value = target;
              if (navigator.vibrate) navigator.vibrate(200);
              playBeep();
              saveDraft();
              if (!row.classList.contains("set-row-done")) checkBtn.click();
            }
          }, 1000);
        });

        checkBtn.addEventListener("click", function () {
          var isDone = !row.classList.contains("set-row-done");
          row.classList.toggle("set-row-done", isDone);
          checkBtn.classList.toggle("checked", isDone);
          if (isDone) {
            if (!started) startWorkout();
            var card = row.closest(".exercise-card");
            var restSec = card ? parseInt(card.dataset.restSec || "90", 10) : 90;
            showRestTimer(restSec || 90);
          }
          saveDraft();
        });

        return row;
      }

      var RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 10];

      // Gerakan berbasis durasi (fitur #2) - header Reps berubah jadi Sec, Kg jadi opsional (BW),
      // mini stopwatch di tiap set row ikutan muncul. Dicek dari nama gerakan, live tiap diketik/
      // diganti (termasuk lewat Quick Swap) biar langsung nyesuaiin.
      function isDurationExerciseName(name) {
        return /plank/i.test(name || "");
      }
      function updateDurationMode(card) {
        var name = card.querySelector(".exercise-name-input").value;
        var duration = isDurationExerciseName(name);
        card.dataset.durationMode = duration ? "true" : "false";
        var repsHeader = card.querySelector(".set-table-header span:nth-child(4)");
        if (repsHeader) repsHeader.textContent = duration ? "Sec" : "Reps";
        card.querySelectorAll(".set-reps-input").forEach(function (inp) { inp.placeholder = duration ? "sec" : "reps"; });
        card.querySelectorAll(".set-kg-input").forEach(function (inp) { inp.placeholder = duration ? "BW" : "kg"; });
        card.querySelectorAll(".sec-timer-btn").forEach(function (btn) { btn.hidden = !duration; });
        card.querySelectorAll(".set-row").forEach(function (row) { row.classList.toggle("set-row-duration", duration); });
      }

      // Tutup semua popover RPE/Swap yang lagi kebuka, KECUALI yang lagi di-toggle (except) -
      // dipanggil tiap mau buka popover baru & lewat 1 listener global document (klik di luar).
      function closeAllPopovers(except) {
        document.querySelectorAll(".rpe-popover, .swap-popover").forEach(function (p) {
          if (p !== except) p.hidden = true;
        });
      }
      document.addEventListener("click", function (e) {
        if (e.target.closest(".exercise-rpe-wrap, .exercise-swap-wrap")) return;
        closeAllPopovers(null);
      });

      function buildSwapPopoverContent(currentName) {
        var alts = (window.getExerciseAlternatives ? window.getExerciseAlternatives(currentName) : []) || [];
        var html = alts.map(function (alt) {
          return '<button type="button" class="swap-option" data-name="' + alt + '">' + alt + '</button>';
        }).join("");
        html +=
          '<div class="swap-custom-row">' +
            '<input type="text" class="swap-custom-input" placeholder="Nama lain...">' +
            '<button type="button" class="swap-custom-apply">OK</button>' +
          '</div>';
        return html;
      }

      function makeExerciseCard(name, sets, restSec, rpe) {
        var card = document.createElement("div");
        card.className = "card glass-card exercise-card";
        card.dataset.restSec = restSec || 90;
        card.dataset.rpe = rpe || "";
        card.innerHTML =
          '<div class="exercise-card-head">' +
            '<input type="text" class="exercise-name-input" placeholder="Nama gerakan" required>' +
            '<div class="exercise-rpe-wrap">' +
              '<button type="button" class="exercise-rpe-pill' + (rpe ? " rpe-set" : "") + '" aria-label="Set target RPE">' + (rpe ? "RPE " + rpe : "RPE") + '</button>' +
              '<div class="rpe-popover" hidden>' +
                RPE_VALUES.map(function (v) { return '<button type="button" class="rpe-option" data-rpe="' + v + '">' + v + '</button>'; }).join("") +
              '</div>' +
            '</div>' +
            '<div class="exercise-swap-wrap">' +
              '<button type="button" class="exercise-swap-btn" aria-label="Ganti gerakan">${svgIcon("refresh", { size: 15 })}</button>' +
              '<div class="swap-popover" hidden></div>' +
            '</div>' +
            '<button type="button" class="exercise-guide-btn" aria-label="Panduan gerakan">${svgIcon("helpCircle", { size: 16 })}</button>' +
            '<button type="button" class="exercise-remove-btn" aria-label="Hapus gerakan">✕</button>' +
          '</div>' +
          '<div class="set-table-header"><span>Set</span><span>Previous</span><span>Kg</span><span>Reps</span><span></span></div>' +
          '<div class="set-rows"></div>' +
          '<button type="button" class="add-set-btn">+ Add Set</button>';

        var nameInput = card.querySelector(".exercise-name-input");
        var rowsContainer = card.querySelector(".set-rows");
        nameInput.value = name || "";

        (sets && sets.length ? sets : [{ previousText: null, weight: "", reps: "" }]).forEach(function (s) {
          rowsContainer.appendChild(makeSetRow(s.previousText, s.weight, s.reps, s.done, s.setType));
        });
        renumber(card);
        updateDurationMode(card);

        nameInput.addEventListener("input", function () {
          updateDurationMode(card);
          saveDraft();
        });
        card.querySelector(".exercise-guide-btn").addEventListener("click", function () {
          if (window.openExerciseGuide) window.openExerciseGuide(nameInput.value);
        });
        card.querySelector(".exercise-remove-btn").addEventListener("click", function () {
          card.remove();
          saveDraft();
        });
        card.querySelector(".add-set-btn").addEventListener("click", function () {
          var rows = rowsContainer.querySelectorAll(".set-row");
          var last = rows[rows.length - 1];
          var lastWeight = last ? last.querySelector(".set-kg-input").value : "";
          var lastReps = last ? last.querySelector(".set-reps-input").value : "";
          rowsContainer.appendChild(makeSetRow(null, lastWeight, lastReps, false));
          renumber(card);
          updateDurationMode(card);
          saveDraft();
        });

        // RPE pill popover (fitur #3)
        var rpePill = card.querySelector(".exercise-rpe-pill");
        var rpePopover = card.querySelector(".rpe-popover");
        rpePill.addEventListener("click", function (e) {
          e.stopPropagation();
          var willOpen = rpePopover.hidden;
          closeAllPopovers(willOpen ? rpePopover : null);
          rpePopover.hidden = !willOpen;
        });
        rpePopover.querySelectorAll(".rpe-option").forEach(function (opt) {
          opt.addEventListener("click", function () {
            card.dataset.rpe = opt.dataset.rpe;
            rpePill.textContent = "RPE " + opt.dataset.rpe;
            rpePill.classList.add("rpe-set");
            rpePopover.hidden = true;
            saveDraft();
          });
        });

        // Quick Swap Exercise (fitur #4) - popover-nya di-rebuild tiap dibuka biar daftar
        // alternatifnya ngikutin nama gerakan TERKINI (bisa aja user udah ngetik manual duluan).
        var swapBtn = card.querySelector(".exercise-swap-btn");
        var swapPopover = card.querySelector(".swap-popover");
        swapBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          var willOpen = swapPopover.hidden;
          closeAllPopovers(willOpen ? swapPopover : null);
          if (willOpen) {
            swapPopover.innerHTML = buildSwapPopoverContent(nameInput.value);
            swapPopover.querySelectorAll(".swap-option").forEach(function (opt) {
              opt.addEventListener("click", function () {
                nameInput.value = opt.dataset.name;
                updateDurationMode(card);
                swapPopover.hidden = true;
                saveDraft();
              });
            });
            var customInput = swapPopover.querySelector(".swap-custom-input");
            swapPopover.querySelector(".swap-custom-apply").addEventListener("click", function () {
              var val = customInput.value.trim();
              if (!val) return;
              nameInput.value = val;
              updateDurationMode(card);
              swapPopover.hidden = true;
              saveDraft();
            });
          }
          swapPopover.hidden = !willOpen;
        });

        return card;
      }

      function renderExercises(exercises) {
        container.innerHTML = "";
        if (!exercises || !exercises.length) {
          container.appendChild(makeExerciseCard("", null, 90));
          return;
        }
        exercises.forEach(function (ex) { container.appendChild(makeExerciseCard(ex.name, ex.sets, ex.restSec, ex.rpe)); });
      }

      // targetReps (preset, mis. "6–8") ditampilin sebagai sub-label "Target: 6–8 reps" di kolom
      // Previous - beda sama riwayat sesi terakhir (lastSummary/"Last: 40kg × 8") yang muncul per
      // set kalau split-nya udah pernah dilog (lihat getGymTemplate, grind/supabase.js).
      function targetLabel(targetReps) {
        if (!targetReps) return null;
        var isDuration = /s$/i.test(targetReps) && /\d/.test(targetReps);
        return "Target: " + targetReps + (isDuration ? "" : " reps");
      }

      function templateToExercises(templateExercises) {
        return (templateExercises || []).map(function (ex) {
          var presetLabel = targetLabel(ex.targetReps);
          return {
            name: ex.exerciseName,
            restSec: ex.restSec || 90,
            sets: (ex.sets || []).map(function (s) {
              var hasPrevious = s.weightKg != null && Number(s.weightKg) > 0;
              return {
                previousText: presetLabel || (hasPrevious ? s.weightKg + "kg × " + (s.reps != null ? s.reps : "-") : null),
                weight: "",
                reps: "",
                done: false,
              };
            }),
          };
        });
      }

      function collectState() {
        var exercises = Array.prototype.map.call(container.querySelectorAll(".exercise-card"), function (card) {
          var sets = Array.prototype.map.call(card.querySelectorAll(".set-row"), function (row) {
            return {
              previousText: row.querySelector(".set-previous").textContent,
              weight: row.querySelector(".set-kg-input").value,
              reps: row.querySelector(".set-reps-input").value,
              done: row.classList.contains("set-row-done"),
              setType: row.dataset.setType || "working",
            };
          });
          return {
            name: card.querySelector(".exercise-name-input").value,
            restSec: parseInt(card.dataset.restSec || "90", 10),
            rpe: card.dataset.rpe || "",
            sets: sets,
          };
        });
        return {
          split: getActiveSplit(),
          sessionTime: getActiveAmPm(),
          started: started,
          startTime: startTime,
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

      function getActiveSplit() {
        var active = splitPillsEl.querySelector(".segmented-tab.active");
        return active ? active.dataset.split : ${JSON.stringify(GYM_SPLITS[0])};
      }
      function setActiveSplit(split) {
        splitPillsEl.querySelectorAll(".segmented-tab").forEach(function (btn) {
          btn.classList.toggle("active", btn.dataset.split === split);
        });
        var hidden = document.getElementById("gym-sub-type-hidden");
        if (hidden) hidden.value = split;
      }
      function getActiveAmPm() {
        var checked = document.querySelector('input[name="gym_session_time"]:checked');
        return checked ? checked.value : "AM";
      }

      function loadTemplate(split) {
        container.innerHTML = '<div class="empty-state">Loading template...</div>';
        fetch("/hub/grind/gym-template?split=" + encodeURIComponent(split))
          .then(function (r) { return r.json(); })
          .then(function (data) { renderExercises(templateToExercises(data.exercises)); saveDraft(); })
          .catch(function () { renderExercises([]); });
      }

      splitPillsEl.querySelectorAll(".segmented-tab[data-split]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          setActiveSplit(btn.dataset.split);
          loadTemplate(btn.dataset.split);
        });
      });
      document.querySelectorAll('input[name="gym_session_time"]').forEach(function (radio) {
        radio.addEventListener("change", function () {
          document.querySelectorAll(".gym-ampm-toggle label").forEach(function (l) {
            l.classList.toggle("active", l.querySelector("input").checked);
          });
          var hidden = document.getElementById("gym-session-time-hidden");
          if (hidden) hidden.value = getActiveAmPm();
          saveDraft();
        });
      });

      if (addExerciseBtn) {
        addExerciseBtn.addEventListener("click", function () {
          container.appendChild(makeExerciseCard("", null));
          saveDraft();
        });
      }

      // ---------- Submit: translate card state into the parallel-array fields that
      // POST /hub/grind/sessions/gym already expects (exercise_name[]/set_order[]/weight_kg[]/reps[]).
      // 1RM estimasi (Epley) buat bandingin PR: kg * (1 + reps/30). "Previous" di-parse dari pola
      // "Xkg × Y" (hasil Last: riwayat sesi sebelumnya) - preset Target: tanpa angka pasti diabaikan.
      function parsePreviousEst(text) {
        var m = /([\d.]+)\s*kg\s*×\s*(\d+)/i.exec(text || "");
        if (!m) return 0;
        var kg = parseFloat(m[1]);
        var reps = parseInt(m[2], 10);
        if (!kg || !reps) return 0;
        return kg * (1 + reps / 30);
      }

      function buildWorkoutSummary() {
        var totalVolume = 0;
        var workingSets = 0;
        var prs = [];
        container.querySelectorAll(".exercise-card").forEach(function (card) {
          var name = card.querySelector(".exercise-name-input").value.trim();
          if (!name) return;
          var prevBest = 0;
          var currentBest = 0;
          var currentBestWeight = 0;
          var currentBestReps = 0;
          card.querySelectorAll(".set-row").forEach(function (row) {
            var setType = row.dataset.setType || "working";
            var done = row.classList.contains("set-row-done");
            var kg = parseFloat(row.querySelector(".set-kg-input").value) || 0;
            var reps = parseInt(row.querySelector(".set-reps-input").value, 10) || 0;
            var prevEst = parsePreviousEst(row.querySelector(".set-previous").textContent);
            if (prevEst > prevBest) prevBest = prevEst;
            if (done && setType !== "warmup") {
              workingSets++;
              if (kg && reps) totalVolume += kg * reps;
              var est = kg ? kg * (1 + reps / 30) : 0;
              if (est > currentBest) {
                currentBest = est;
                currentBestWeight = kg;
                currentBestReps = reps;
              }
            }
          });
          if (prevBest > 0 && currentBest > prevBest) {
            prs.push({ name: name, weight: currentBestWeight, reps: currentBestReps });
          }
        });
        return {
          durationMin: durationHidden ? parseInt(durationHidden.value, 10) || 0 : 0,
          totalVolume: totalVolume,
          workingSets: workingSets,
          prs: prs,
        };
      }

      var summaryDialog = document.getElementById("workout-summary-dialog");

      function showWorkoutSummary(summary) {
        var durationEl = document.getElementById("summary-duration");
        var volumeEl = document.getElementById("summary-volume");
        var setsEl = document.getElementById("summary-sets");
        var prSection = document.getElementById("summary-pr-section");
        var prList = document.getElementById("summary-pr-list");
        if (durationEl) durationEl.textContent = summary.durationMin + " min";
        if (volumeEl) volumeEl.textContent = Math.round(summary.totalVolume).toLocaleString("id-ID") + " kg";
        if (setsEl) setsEl.textContent = summary.workingSets;
        if (prList) {
          prList.innerHTML = summary.prs.map(function (pr) {
            return '<li class="summary-pr-item"><span>' + pr.name + ' — ' + pr.weight + 'kg × ' + pr.reps + '</span><span class="summary-pr-badge">NEW PR</span></li>';
          }).join("");
        }
        if (prSection) prSection.hidden = summary.prs.length === 0;
        if (summaryDialog && summaryDialog.showModal) summaryDialog.showModal();
        else window.location.href = "/hub/grind";
      }

      var summaryDoneBtn = document.getElementById("summary-done-btn");
      if (summaryDoneBtn) summaryDoneBtn.addEventListener("click", function () { window.location.href = "/hub/grind"; });
      if (summaryDialog) summaryDialog.addEventListener("cancel", function (e) { e.preventDefault(); window.location.href = "/hub/grind"; });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        tickDuration();

        var summary = buildWorkoutSummary();
        // Server cuma pasang express.urlencoded (bukan multer) buat parse body - kirim sebagai
        // application/x-www-form-urlencoded (URLSearchParams), BUKAN FormData/multipart, biar
        // req.body["exercise_name[]"] dkk tetap ke-parse persis kayak submit form native biasa.
        var params = new URLSearchParams(new FormData(form));
        container.querySelectorAll(".exercise-card").forEach(function (card) {
          var name = card.querySelector(".exercise-name-input").value.trim();
          var rpe = card.dataset.rpe || "";
          card.querySelectorAll(".set-row").forEach(function (row, i) {
            params.append("exercise_name[]", name);
            params.append("set_order[]", i + 1);
            params.append("weight_kg[]", row.querySelector(".set-kg-input").value);
            params.append("reps[]", row.querySelector(".set-reps-input").value);
            params.append("set_type[]", row.dataset.setType || "working");
            params.append("rpe[]", rpe);
          });
        });

        if (startFinishBtn) startFinishBtn.disabled = true;
        fetch(form.action, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params.toString() })
          .then(function () {
            clearDraft();
            showWorkoutSummary(summary);
          })
          .catch(function () {
            if (startFinishBtn) startFinishBtn.disabled = false;
            alert("Gagal menyimpan workout, coba lagi.");
          });
      });

      // ---------- Initial load: draft wins over auto-loaded template ----------
      var draft = readDraft();
      if (draft && draft.exercises && draft.exercises.length) {
        setActiveSplit(draft.split || ${JSON.stringify(GYM_SPLITS[0])});
        var amPmRadio = document.querySelector('input[name="gym_session_time"][value="' + (draft.sessionTime || "AM") + '"]');
        if (amPmRadio) {
          amPmRadio.checked = true;
          document.querySelectorAll(".gym-ampm-toggle label").forEach(function (l) {
            l.classList.toggle("active", l.querySelector("input").checked);
          });
        }
        var sessionTimeHidden = document.getElementById("gym-session-time-hidden");
        if (sessionTimeHidden) sessionTimeHidden.value = getActiveAmPm();
        renderExercises(draft.exercises);
        // Resume timer cuma kalau workout itu udah di-"Start" sebelumnya (draft.started) - draft
        // yang baru dari auto-load template doang (belum ada set dicentang/Start ditekan) TETAP
        // diam di 00:00/"Start Workout", sesuai niat "jangan auto-start pas halaman dibuka".
        if (draft.started && draft.startTime) startWorkout(draft.startTime);
      } else {
        loadTemplate(getActiveSplit());
      }
    })();
  </script>`;
}

export function renderGymPage({ defaultTime, defaultSplit, recoveryHint }) {
  const activeSplit = GYM_SPLITS.includes(defaultSplit) ? defaultSplit : GYM_SPLITS[0];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gym Workout</title>
${faviconLink("/icons/grind-icon.png")}
<style>${DASHBOARD_CSS}</style>
<style>${GYM_PAGE_CSS}</style>
<style>${exerciseGuideStyles()}</style>
</head>
<body>
  <div class="container">
    <header class="gym-header glass-card">
      <div class="gym-header-top">
        <div class="gym-header-left">
          <a class="gym-back-link" href="/hub/grind">${svgIcon("arrowLeft", { size: 16 })}Grind</a>
          ${ampmToggleHtml(defaultTime)}
        </div>
        <div class="gym-header-right">
          <div class="gym-timer tabular-nums" id="gym-duration">00:00</div>
          <button type="button" class="btn-primary btn-sm" id="gym-start-finish-btn" data-state="start">Start Workout</button>
        </div>
      </div>
      <div class="gym-split-pills-row">
        ${splitPillsHtml(activeSplit)}
      </div>
    </header>

    ${recoveryHint ? `<div class="recovery-banner recovery-banner-gym">${escapeHtml(recoveryHint)}</div>` : ""}

    <div class="card glass-card gym-tip-banner" id="gym-tip-banner" hidden>
      ${svgIcon("helpCircle", { size: 16 })}
      <span class="gym-tip-text">Isi beban (kg) & reps → tap <strong>✓</strong> untuk mulai rest timer otomatis → tap <strong>Finish Workout</strong> setelah selesai.</span>
      <button type="button" class="gym-tip-close" id="gym-tip-close" aria-label="Tutup tip">✕</button>
    </div>

    <form method="POST" action="/hub/grind/sessions/gym" id="gym-page-form">
      <input type="hidden" name="session_time" id="gym-session-time-hidden" value="${defaultTime === "PM" ? "PM" : "AM"}">
      <input type="hidden" name="sub_type" id="gym-sub-type-hidden" value="${activeSplit}">
      <input type="hidden" name="duration_min" id="gym-duration-min-hidden" value="1">

      <div id="gym-exercises-container"><div class="empty-state">Loading template...</div></div>
      <button type="button" class="add-exercise-btn" id="gym-add-exercise">+ Add Exercise</button>
    </form>

    <div class="rest-timer-bar glass-card" id="rest-timer-bar" hidden>
      <button type="button" id="rest-timer-minus">-15s</button>
      <span class="rest-timer-time tabular-nums" id="rest-timer-time">01:30</span>
      <button type="button" id="rest-timer-plus">+15s</button>
      <button type="button" id="rest-timer-skip">Skip</button>
    </div>
  </div>
  ${bottomNavHtml("/hub/grind/gym")}
  ${exerciseGuideDialogHtml()}

  <dialog class="modal-dialog glass-card" id="workout-summary-dialog">
    <div class="modal-dialog-body">
      <div class="modal-dialog-header">
        <h3>${svgIconLabel("check", "Workout Selesai!", { size: 16 })}</h3>
      </div>
      <div class="summary-stat-grid">
        <div><div class="summary-stat-value tabular-nums" id="summary-duration">0 min</div><div class="summary-stat-label">Durasi</div></div>
        <div><div class="summary-stat-value tabular-nums" id="summary-volume">0 kg</div><div class="summary-stat-label">Total Volume</div></div>
        <div><div class="summary-stat-value tabular-nums" id="summary-sets">0</div><div class="summary-stat-label">Working Sets</div></div>
      </div>
      <div id="summary-pr-section" hidden>
        <div class="guide-section-label">PR Highlights</div>
        <ul class="summary-pr-list" id="summary-pr-list"></ul>
      </div>
      <button type="button" class="btn-primary" id="summary-done-btn" style="width:100%; margin-top:14px;">Done</button>
    </div>
  </dialog>

  ${gymPageScript()}
  ${exerciseGuideScript()}
  ${exerciseAlternativesScript()}
</body>
</html>`;
}
