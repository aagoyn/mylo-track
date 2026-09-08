import { DASHBOARD_CSS, escapeHtml, navHeader, stackedBarChartSvg, faviconLink, iconLabel } from "../shared/dashboard-layout.js";

const MACRO_SERIES = [
  { key: "protein", name: "Protein", color: "#f97316" },
  { key: "carbs", name: "Carbs", color: "#eab308" },
  { key: "fat", name: "Fat", color: "#a855f7" },
];

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
    <h3>🔄 Re-analyze with AI</h3>
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
      <button type="submit">Delete this log</button>
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
      <span class="log-calories">${entry.calories} kcal</span>
    </summary>
    <div class="log-detail-body">
      ${itemsHtml}
      ${logActionsHtml(entry)}
    </div>
  </details>`;
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
    ["/icons/protein.png", "Protein", todayMacros.protein_g, macroTargets.protein_target_g, "g"],
    ["/icons/carbs.png", "Carbs", todayMacros.carbs_g, macroTargets.carbs_target_g, "g"],
    ["/icons/fat.png", "Fat", todayMacros.fat_g, macroTargets.fat_target_g, "g"],
    ["/icons/sugar.png", "Sugar", todayMacros.sugar_g, macroTargets.sugar_target_g, "g"],
  ]
    .map(
      ([icon, text, current, targetVal, unit]) => `
      <div class="card">
        <div class="card-label">${iconLabel(icon, text)}</div>
        <div class="card-value">${current}${targetVal ? ` / ${targetVal}` : ""}${unit}</div>
      </div>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Calorie Tracker</title>
${faviconLink("/icons/calorie.png")}
<style>${DASHBOARD_CSS}</style>
</head>
<body>
  <div class="container">
    ${navHeader({
      icon: "/icons/calorie.png",
      title: "Calorie Tracker",
      links: [
        { href: "/hub", label: "🏠 Home" },
        { href: "/dashboard/spending", label: "💸 Spending" },
      ],
    })}

    ${flash ? `<div class="flash flash-${flash.type}">${escapeHtml(flash.text)}</div>` : ""}

    <div class="card">
      <div class="card-label">🔥 Calories Today</div>
      <div class="card-value">${total}${target != null ? ` / ${target}` : ""} kcal</div>
      ${
        remaining != null
          ? `<div class="card-sub">${remaining >= 0 ? `${remaining} left` : `${Math.abs(remaining)} over`} kcal</div>`
          : ""
      }
    </div>
    <section class="cards macro-cards">
      ${macroCards}
    </section>

    <h2>📝 Log Food</h2>
    <div class="forms">
      <div class="form-card">
        <h3>${iconLabel("/icons/via-text.png", "Via Text")}</h3>
        <form method="POST" action="/dashboard/calorie/food-text">
          <input type="text" name="description" placeholder="e.g. fried rice 1 serving" required>
          <button type="submit">Save</button>
        </form>
      </div>
      <div class="form-card">
        <h3>${iconLabel("/icons/camera.png", "Via Photo")}</h3>
        <form method="POST" action="/dashboard/calorie/food-photo" enctype="multipart/form-data" id="food-photo-form">
          <input type="file" name="photo" accept="image/*" required>
          <button type="submit" id="food-photo-submit">Save</button>
          <div class="upload-progress" id="food-photo-progress" hidden>
            <div class="upload-progress-bar"></div>
          </div>
        </form>
      </div>
      <div class="form-card">
        <h3>${iconLabel("/icons/scales.png", "Weight")}</h3>
        <form method="POST" action="/dashboard/calorie/weight">
          <input type="number" step="0.1" name="weight" placeholder="e.g. 65.5" required>
          <button type="submit">Save</button>
        </form>
      </div>
    </div>

    <h2>${iconLabel("/icons/target.png", "Set Targets")}</h2>
    <div class="forms">
      <div class="form-card">
        <h3>🔥 Daily Calorie Target</h3>
        <form method="POST" action="/dashboard/calorie/target">
          <input type="number" name="target" placeholder="e.g. 2000" required>
          <button type="submit">Save</button>
        </form>
      </div>
      <div class="form-card">
        <h3>🥩🍚🧈🍬 Macro Targets (g)</h3>
        <form method="POST" action="/dashboard/calorie/target-macro">
          <input type="number" step="0.1" name="protein" placeholder="Protein" required>
          <input type="number" step="0.1" name="carbs" placeholder="Carbs" required>
          <input type="number" step="0.1" name="fat" placeholder="Fat" required>
          <input type="number" step="0.1" name="sugar" placeholder="Sugar (optional)">
          <button type="submit">Save</button>
        </form>
      </div>
    </div>

    <h2>${iconLabel("/icons/log.png", "Today's Log")}</h2>
    <p class="card-sub" style="margin:-4px 0 8px;">Click a log to see its item breakdown, re-analyze
    with AI, or delete it.</p>
    <div>
      ${
        todayLogEntries.length
          ? todayLogEntries.map((entry) => logEntryHtml(entry, expandedId)).join("")
          : `<div class="empty-state">No logs yet.</div>`
      }
    </div>

    <h2>${iconLabel("/icons/week.png", "7-Day Recap (calories from Protein/Carbs/Fat)")}</h2>
    ${
      weekChartData?.length
        ? `<div class="chart-card">${stackedBarChartSvg(weekChartData, MACRO_SERIES, { itemsPerRow: 6 })}</div>`
        : ""
    }
    <table>
      <thead><tr><th>📆 Day</th><th>🔥 Calories</th></tr></thead>
      <tbody>${weekRows || `<tr><td colspan="2">No data yet.</td></tr>`}</tbody>
    </table>

    <h2>${iconLabel("/icons/scales.png", "Weight")}</h2>
    <table>
      <thead><tr><th>🗓️ Date</th><th>⚖️ Weight</th></tr></thead>
      <tbody>${weightRows || `<tr><td colspan="2">No data yet.</td></tr>`}</tbody>
    </table>
  </div>
  <script>
    // JS minimal, cuma buat kasih feedback visual pas foto/deskripsi lagi dianalisis Gemini
    // (bisa beberapa detik) - sisa halaman ini tetap murni server-rendered, no-JS.
    function wireProgress(formId, submitId, progressId, loadingLabel) {
      const form = document.getElementById(formId);
      if (!form) return;
      form.addEventListener("submit", function () {
        const submit = document.getElementById(submitId);
        submit.disabled = true;
        submit.textContent = loadingLabel;
        document.getElementById(progressId).hidden = false;
      });
    }
    wireProgress("food-photo-form", "food-photo-submit", "food-photo-progress", "Analyzing...");
    ${todayLogEntries
      .map(
        (entry) =>
          `wireProgress("food-reanalyze-form-${entry.id}", "food-reanalyze-submit-${entry.id}", "food-reanalyze-progress-${entry.id}", "Re-analyzing...");`
      )
      .join("\n    ")}
  </script>
</body>
</html>`;
}
