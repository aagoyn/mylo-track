import { DASHBOARD_CSS, escapeHtml, navHeader, stackedBarChartSvg, chartLegendHtml, faviconLink, svgIcon, svgIconLabel, progressFormScript, bottomNavHtml } from "../shared/dashboard-layout.js";

// Palet warm muted Mylo Track (ganti dari oranye/kuning/ungu neon default) - konsisten sama
// nuansa taupe/terracotta tema Warm Graphite di seluruh app.
const MACRO_SERIES = [
  { key: "protein", name: "Protein", color: "#C97368" },
  { key: "carbs", name: "Carbs", color: "#D49B6A" },
  { key: "fat", name: "Fat", color: "#8B82B8" },
];

const CALORIE_PAGE_CSS = `
  /* Header "Calorie Tracker" pakai badge SVG custom (lihat navHeader iconHtml di
     renderCalorieDashboard) - bukan <img class="header-icon"> PNG default, biar seragam sama
     treatment icon-badge di tempat lain (36x36, warm taupe, bukan 40x40 default .icon-badge). */
  .calorie-header-badge { width: 36px; height: 36px; border-radius: 10px; }

  /* Jarak lega & konsisten antar-kartu di bagian atas (Calories Today -> macro grid -> Log Food) -
     sebelumnya cuma margin-top 12px dari .macro-cards, nempel ke Log Food di bawahnya. */
  .calorie-top-stack { display: flex; flex-direction: column; gap: 14px; }
  .calorie-top-stack .macro-cards { margin: 0; }

  .target-edit-btn { margin-left: auto; }
  .card-header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
  .log-food-tabs .tab-panel[hidden] { display: none; }

  /* Form Log Weight: 1 baris input+suffix "kg" di dalam kotak + tombol Save setinggi input,
     dibungkus .glass-card tersendiri (bukan nempel di .section-header kayak sebelumnya). */
  .weight-input-row { display: flex; align-items: center; gap: 8px; }
  .weight-input-wrap { flex: 1; position: relative; display: flex; align-items: center; }
  .weight-input-wrap input {
    width: 100%; height: 42px !important; padding: 0 34px 0 12px !important; margin-bottom: 0 !important;
    font-size: 16px; font-weight: 600;
  }
  .weight-input-suffix {
    position: absolute; right: 12px; color: var(--text-dim); font-size: 13px; font-variant-numeric: tabular-nums;
    pointer-events: none;
  }
  .weight-save-btn {
    width: auto; flex-shrink: 0; height: 42px; padding: 0 18px; border: none; border-radius: 8px;
    background: var(--fab-gradient); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
  }
  .weight-save-btn:hover { filter: brightness(1.08); }
`;

// isi salah satu field (weight ATAU calories), yang lain ikut ke-scale proporsional di server -
// makanya placeholder nampilin nilai sekarang, bukan value= (biar field kosong = "nggak diubah")
function itemEditFormHtml(logId, idx, item) {
  const uid = `${logId}-${idx}`;
  return `<form class="item-edit-form" method="POST" action="/dashboard/calorie/item-edit">
    <input type="hidden" name="id" value="${logId}">
    <input type="hidden" name="item_index" value="${idx}">
    <div class="item-edit-row">
      <div>
        <label for="weight-${uid}">New weight (g)</label>
        <input type="number" step="1" id="weight-${uid}" name="weight" placeholder="current: ${item.weight_g ?? "?"}">
      </div>
      <div>
        <label for="calories-${uid}">New calories (kcal)</label>
        <input type="number" step="1" id="calories-${uid}" name="calories" placeholder="current: ${item.calories ?? "?"}">
      </div>
      <button type="submit">Save</button>
    </div>
  </form>`;
}

function itemRowHtml(logId, idx, item) {
  return `<div class="log-item-row">
    <div class="log-item-info">
      <strong>${escapeHtml(item.name)}</strong>
      <span class="card-sub">${item.weight_g ?? "?"}g · ${item.calories} kcal</span>
    </div>
    ${itemEditFormHtml(logId, idx, item)}
  </div>`;
}

function logActionsHtml(entry) {
  return `<div class="form-card" style="margin-top:8px;">
    <h3>${svgIconLabel("refresh", "Re-analyze with AI", { size: 14 })}</h3>
    <p class="card-sub" style="margin:-4px 0 8px;">Don't know the calories? Describe the food (correct
    portion/weight included) and let Gemini re-estimate everything.</p>
    <form method="POST" action="/dashboard/calorie/food-reanalyze" id="food-reanalyze-form-${entry.id}">
      <input type="hidden" name="id" value="${entry.id}">
      <input type="text" name="description" placeholder="e.g. 150g rice, 2 fried eggs" value="${escapeHtml(entry.foodName)}" required>
      <button type="submit" id="food-reanalyze-submit-${entry.id}">Re-analyze</button>
      <div class="upload-progress" id="food-reanalyze-progress-${entry.id}" hidden>
        <div class="upload-progress-bar"></div>
      </div>
    </form>
  </div>
  <div class="danger-zone">
    <form class="delete-form" method="POST" action="/dashboard/calorie/food-delete">
      <input type="hidden" name="id" value="${entry.id}">
      <button type="submit">${svgIconLabel("trash", "Delete this log", { size: 13 })}</button>
    </form>
  </div>`;
}

function logEntryHtml(entry, expandedId) {
  const itemsHtml = entry.items.length
    ? entry.items.map((item, idx) => itemRowHtml(entry.id, idx, item)).join("")
    : `<div class="empty-state">No item breakdown available for this log.</div>`;

  return `<details class="log-item" ${entry.id === expandedId ? "open" : ""}>
    <summary>
      <span class="log-time">${entry.time}</span>
      <span class="log-name">${escapeHtml(entry.foodName)}</span>
      <span class="log-calories tabular-nums">${entry.calories} kcal</span>
    </summary>
    <div class="log-detail-body">
      ${itemsHtml}
      ${logActionsHtml(entry)}
    </div>
  </details>`;
}

function macroCardHtml(icon, text, current, targetVal, unit) {
  return `<div class="card glass-card">
    <div class="card-label">${svgIconLabel(icon, text, { size: 16 })}</div>
    <div class="card-value tabular-nums">${current}${targetVal ? ` / ${targetVal}` : ""}${unit}</div>
  </div>`;
}

function logFoodTabsHtml() {
  return `<div class="card glass-card">
    <div class="card-label">${svgIconLabel("flame", "Log Food", { size: 16 })}</div>
    <div class="segmented-tabs log-food-tabs">
      <button type="button" class="segmented-tab active" data-tab-target="text">Text</button>
      <button type="button" class="segmented-tab" data-tab-target="photo">Photo</button>
    </div>

    <div class="tab-panel" data-tab-panel="text">
      <form method="POST" action="/dashboard/calorie/food-text" id="food-text-form">
        <input type="text" name="description" placeholder="e.g. fried rice 1 serving" required>
        <button type="submit" id="food-text-submit">Save</button>
        <div class="upload-progress" id="food-text-progress" hidden>
          <div class="upload-progress-bar"></div>
        </div>
      </form>
    </div>

    <div class="tab-panel" data-tab-panel="photo" hidden>
      <form method="POST" action="/dashboard/calorie/food-photo" enctype="multipart/form-data" id="food-photo-form">
        <input type="file" name="photo" accept="image/*" required>
        <button type="submit" id="food-photo-submit">Save</button>
        <div class="upload-progress" id="food-photo-progress" hidden>
          <div class="upload-progress-bar"></div>
        </div>
      </form>
    </div>
  </div>`;
}

function targetsDialogHtml(target, macroTargets) {
  return `<dialog id="calorie-targets-dialog" class="modal-dialog">
    <div class="modal-dialog-body">
      <div class="modal-dialog-header">
        <h3>${svgIconLabel("target", "Edit Targets", { size: 17 })}</h3>
        <button type="button" class="modal-close-btn" onclick="document.getElementById('calorie-targets-dialog').close()">&times;</button>
      </div>
      <form method="POST" action="/dashboard/calorie/target">
        <label for="daily-target-input">Daily Calorie Target</label>
        <input type="number" id="daily-target-input" name="target" placeholder="e.g. 2000" value="${target ?? ""}" required>
        <button type="submit">Save Calorie Target</button>
      </form>
      <form method="POST" action="/dashboard/calorie/target-macro" style="margin-top:14px;">
        <label>Macro Targets (g)</label>
        <input type="number" step="0.1" name="protein" placeholder="Protein" value="${macroTargets.protein_target_g ?? ""}" required>
        <input type="number" step="0.1" name="carbs" placeholder="Carbs" value="${macroTargets.carbs_target_g ?? ""}" required>
        <input type="number" step="0.1" name="fat" placeholder="Fat" value="${macroTargets.fat_target_g ?? ""}" required>
        <input type="number" step="0.1" name="sugar" placeholder="Sugar (optional)" value="${macroTargets.sugar_target_g ?? ""}">
        <button type="submit">Save Macro Targets</button>
      </form>
    </div>
  </dialog>`;
}

function logFoodTabsScript() {
  return `<script>
    (function () {
      var tabs = document.querySelectorAll(".log-food-tabs .segmented-tab[data-tab-target]");
      var panels = document.querySelectorAll(".tab-panel[data-tab-panel]");
      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          tabs.forEach(function (t) { t.classList.remove("active"); });
          tab.classList.add("active");
          var key = tab.dataset.tabTarget;
          panels.forEach(function (p) { p.hidden = p.dataset.tabPanel !== key; });
        });
      });

      var openBtn = document.getElementById("open-targets-dialog");
      var dialog = document.getElementById("calorie-targets-dialog");
      if (openBtn && dialog) openBtn.addEventListener("click", function () { dialog.showModal(); });
    })();
  </script>`;
}

export function renderCalorieDashboard({
  target,
  total,
  macroTargets,
  todayMacros,
  todayLogEntries,
  expandedId,
  weekRows,
  weekChartData,
  weightRows,
  flash,
}) {
  const remaining = target != null ? target - total : null;

  const macroCards = [
    ["dumbbell", "Protein", todayMacros.protein_g, macroTargets.protein_target_g, "g"],
    ["wheat", "Carbs", todayMacros.carbs_g, macroTargets.carbs_target_g, "g"],
    ["droplet", "Fat", todayMacros.fat_g, macroTargets.fat_target_g, "g"],
    ["cube", "Sugar", todayMacros.sugar_g, macroTargets.sugar_target_g, "g"],
  ]
    .map(([icon, text, current, targetVal, unit]) => macroCardHtml(icon, text, current, targetVal, unit))
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Calorie Tracker</title>
${faviconLink("/icons/calorie.png")}
<style>${DASHBOARD_CSS}</style>
<style>${CALORIE_PAGE_CSS}</style>
</head>
<body>
  <div class="container">
    ${navHeader({
      iconHtml: `<span class="icon-badge calorie-header-badge">${svgIcon("flame", { size: 20 })}</span>`,
      title: "Calorie Tracker",
    })}

    ${flash ? `<div class="flash flash-${flash.type}">${escapeHtml(flash.text)}</div>` : ""}

    <div class="calorie-top-stack">
      <div class="card glass-card">
        <div class="card-header-row">
          <div class="card-label">${svgIconLabel("flame", "Calories Today", { size: 16 })}</div>
          <button type="button" class="icon-btn target-edit-btn" id="open-targets-dialog" aria-label="Edit Targets">${svgIcon("target", { size: 16 })}</button>
        </div>
        <div class="card-value tabular-nums">${total}${target != null ? ` / ${target}` : ""} kcal</div>
        ${
          remaining != null
            ? `<div class="card-sub tabular-nums">${remaining >= 0 ? `${remaining} left` : `${Math.abs(remaining)} over`} kcal</div>`
            : ""
        }
      </div>
      <section class="cards macro-cards">
        ${macroCards}
      </section>

      ${logFoodTabsHtml()}
    </div>

    <h2>${svgIconLabel("receipt", "Today's Log", { size: 14 })}</h2>
    <p class="card-sub" style="margin:-4px 0 8px;">Click a log to see its item breakdown, re-analyze
    with AI, or delete it.</p>
    <div>
      ${
        todayLogEntries.length
          ? todayLogEntries.map((entry) => logEntryHtml(entry, expandedId)).join("")
          : `<div class="empty-state">No logs yet.</div>`
      }
    </div>

    <h2>${svgIconLabel("barChart", "7-Day Recap (calories from Protein/Carbs/Fat)", { size: 14 })}</h2>
    ${
      weekChartData?.length
        ? `<div class="chart-card glass-card">${stackedBarChartSvg(weekChartData, MACRO_SERIES)}${chartLegendHtml(MACRO_SERIES, { center: true })}</div>`
        : ""
    }
    <div class="table-wrap">
      <table>
        <thead><tr><th>${svgIconLabel("calendar", "Day", { size: 13 })}</th><th>${svgIconLabel("flame", "Calories", { size: 13 })}</th></tr></thead>
        <tbody>${weekRows || `<tr><td colspan="2">No data yet.</td></tr>`}</tbody>
      </table>
    </div>

    <h2>${svgIconLabel("scale", "Weight", { size: 14 })}</h2>
    <div class="card glass-card">
      <form method="POST" action="/dashboard/calorie/weight" class="weight-input-row">
        <div class="weight-input-wrap">
          <input type="number" step="0.1" inputmode="decimal" name="weight" placeholder="60.0" required>
          <span class="weight-input-suffix">kg</span>
        </div>
        <button type="submit" class="weight-save-btn">Save</button>
      </form>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>${svgIconLabel("calendar", "Date", { size: 13 })}</th><th>${svgIconLabel("scale", "Weight", { size: 13 })}</th></tr></thead>
        <tbody>${weightRows || `<tr><td colspan="2">No data yet.</td></tr>`}</tbody>
      </table>
    </div>
  </div>
  ${bottomNavHtml("/dashboard/calorie")}
  ${targetsDialogHtml(target, macroTargets)}
  ${progressFormScript([
    { formId: "food-text-form", submitId: "food-text-submit", progressId: "food-text-progress", loadingLabel: "Analyzing..." },
    { formId: "food-photo-form", submitId: "food-photo-submit", progressId: "food-photo-progress", loadingLabel: "Analyzing..." },
    ...todayLogEntries.map((entry) => ({
      formId: `food-reanalyze-form-${entry.id}`,
      submitId: `food-reanalyze-submit-${entry.id}`,
      progressId: `food-reanalyze-progress-${entry.id}`,
      loadingLabel: "Re-analyzing...",
    })),
  ])}
  ${logFoodTabsScript()}
</body>
</html>`;
}
