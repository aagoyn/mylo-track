import { DASHBOARD_CSS, escapeHtml, faviconLink, svgIcon, bottomNavHtml } from "../../shared/dashboard-layout.js";
import { exerciseGuideScript, exerciseGuideDialogHtml } from "./exercise-guides.js";

// Halaman standalone Gym Workout Tracker ala Strong/Hevy - rep & set tracker dengan live duration
// timer, floating rest timer, dan auto-save draft ke localStorage. Menggantikan accordion
// "Log Gym" lama di /hub/grind (lihat grind/dashboard.js todayPlanAndLoggerHtml) tapi tetap
// nyimpen sesi lewat endpoint POST /hub/grind/sessions/gym yang sudah ada (addGymSets/createSession
// di grind/supabase.js, tidak berubah).
const GYM_SPLITS = ["Push", "Pull", "Legs", "Upper", "Full Body"];
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
  .set-table-header {
    font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: .03em; padding: 0 2px 4px;
  }
  .set-table-header span:nth-child(3), .set-table-header span:nth-child(4) { text-align: center; }
  .set-row { padding: 4px 2px; border-radius: 8px; margin-bottom: 4px; transition: background .15s ease; }
  .set-row.set-row-done { background: var(--success-bg); }
  .set-index { text-align: center; font-size: 12px; color: var(--text-dim); }
  .set-previous { font-size: 11px; color: var(--text-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .set-input {
    width: 100%; height: 38px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg);
    color: var(--text); text-align: center; font-size: 15px; font-weight: 600; padding: 0 4px;
    box-sizing: border-box; font-family: inherit; margin-bottom: 0 !important;
  }
  .set-row-done .set-input { background: var(--surface); border-color: transparent; }
  .set-check-btn {
    width: 38px; height: 38px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg);
    color: var(--text-dim); cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  }
  .set-check-btn .svg-icon { margin: 0; }
  .set-check-btn.checked { background: var(--success); border-color: var(--success); color: #fff; }

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

  /* Dialog Exercise Form Guide - pakai chrome .modal-dialog/.modal-dialog-body/.modal-dialog-header
     yang sudah ada (lihat spending/calorie dialog), nambah style khusus konten guide-nya aja. */
  .guide-muscle-badge { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
  .guide-diagram-wrap { color: var(--text-muted); margin: 14px 0; }
  .guide-diagram-wrap svg { display: block; }
  .guide-section-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; color: var(--text-dim); margin-bottom: 6px; }
  .guide-steps { margin: 0 0 12px; padding-left: 18px; display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: var(--text); }
  .guide-avoid-box {
    font-size: 12.5px; line-height: 1.5; color: var(--text-muted); background: var(--surface-hover);
    border-radius: 10px; padding: 10px 12px;
  }
  .guide-avoid-box strong { color: var(--danger); }
`;

function splitPillsHtml() {
  const pills = GYM_SPLITS.map(
    (s, i) => `<button type="button" class="segmented-tab${i === 0 ? " active" : ""}" data-split="${s}">${s}</button>`
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

      function renumber(card) {
        card.querySelectorAll(".set-row").forEach(function (row, i) {
          row.querySelector(".set-index").textContent = i + 1;
        });
      }

      function makeSetRow(previousText, weight, reps, done) {
        var row = document.createElement("div");
        row.className = "set-row" + (done ? " set-row-done" : "");
        row.innerHTML =
          '<span class="set-index"></span>' +
          '<span class="set-previous">' + (previousText || "—") + '</span>' +
          '<input type="text" inputmode="decimal" class="set-input set-kg-input" placeholder="kg">' +
          '<input type="text" inputmode="numeric" class="set-input set-reps-input" placeholder="reps">' +
          '<button type="button" class="set-check-btn' + (done ? " checked" : "") + '" aria-label="Set selesai">${svgIcon("check", { size: 16 })}</button>';

        var kgInput = row.querySelector(".set-kg-input");
        var repsInput = row.querySelector(".set-reps-input");
        var checkBtn = row.querySelector(".set-check-btn");
        kgInput.value = weight || "";
        repsInput.value = reps || "";

        kgInput.addEventListener("input", saveDraft);
        repsInput.addEventListener("input", saveDraft);
        checkBtn.addEventListener("click", function () {
          var isDone = !row.classList.contains("set-row-done");
          row.classList.toggle("set-row-done", isDone);
          checkBtn.classList.toggle("checked", isDone);
          if (isDone) {
            if (!started) startWorkout();
            showRestTimer(90);
          }
          saveDraft();
        });

        return row;
      }

      function makeExerciseCard(name, sets) {
        var card = document.createElement("div");
        card.className = "card glass-card exercise-card";
        card.innerHTML =
          '<div class="exercise-card-head">' +
            '<input type="text" class="exercise-name-input" placeholder="Nama gerakan" required>' +
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
          rowsContainer.appendChild(makeSetRow(s.previousText, s.weight, s.reps, s.done));
        });
        renumber(card);

        nameInput.addEventListener("input", saveDraft);
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
          saveDraft();
        });

        return card;
      }

      function renderExercises(exercises) {
        container.innerHTML = "";
        if (!exercises || !exercises.length) {
          container.appendChild(makeExerciseCard("", null));
          return;
        }
        exercises.forEach(function (ex) { container.appendChild(makeExerciseCard(ex.name, ex.sets)); });
      }

      function templateToExercises(templateExercises) {
        return (templateExercises || []).map(function (ex) {
          return {
            name: ex.exerciseName,
            sets: (ex.sets || []).map(function (s) {
              var hasPrevious = s.weightKg != null && Number(s.weightKg) > 0;
              return {
                previousText: hasPrevious ? s.weightKg + "kg × " + (s.reps != null ? s.reps : "-") : null,
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
            };
          });
          return { name: card.querySelector(".exercise-name-input").value, sets: sets };
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
      form.addEventListener("submit", function () {
        tickDuration();
        container.querySelectorAll(".exercise-card").forEach(function (card) {
          var name = card.querySelector(".exercise-name-input").value.trim();
          card.querySelectorAll(".set-row").forEach(function (row, i) {
            var nameField = document.createElement("input");
            nameField.type = "hidden";
            nameField.name = "exercise_name[]";
            nameField.value = name;
            form.appendChild(nameField);

            var orderField = document.createElement("input");
            orderField.type = "hidden";
            orderField.name = "set_order[]";
            orderField.value = i + 1;
            form.appendChild(orderField);

            var weightField = document.createElement("input");
            weightField.type = "hidden";
            weightField.name = "weight_kg[]";
            weightField.value = row.querySelector(".set-kg-input").value;
            form.appendChild(weightField);

            var repsField = document.createElement("input");
            repsField.type = "hidden";
            repsField.name = "reps[]";
            repsField.value = row.querySelector(".set-reps-input").value;
            form.appendChild(repsField);
          });
        });
        clearDraft();
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

export function renderGymPage({ defaultTime, recoveryHint }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gym Workout</title>
${faviconLink("/icons/grind-icon.png")}
<style>${DASHBOARD_CSS}</style>
<style>${GYM_PAGE_CSS}</style>
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
        ${splitPillsHtml()}
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
      <input type="hidden" name="sub_type" id="gym-sub-type-hidden" value="${GYM_SPLITS[0]}">
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
  ${gymPageScript()}
  ${exerciseGuideScript()}
</body>
</html>`;
}
