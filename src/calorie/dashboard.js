import { DASHBOARD_CSS, escapeHtml, navHeader, stackedBarChartSvg, faviconLink } from "../shared/dashboard-layout.js";

const MACRO_SERIES = [
  { key: "protein", name: "Protein", color: "#f97316" },
  { key: "carbs", name: "Carbs", color: "#eab308" },
  { key: "fat", name: "Fat", color: "#a855f7" },
];

function editFormHtml(entry) {
  return `<div class="form-card" style="margin-top:8px;">
    <h3>✏️ Edit Log</h3>
    <form method="POST" action="/dashboard/calorie/food-edit">
      <input type="hidden" name="id" value="${entry.id}">
      <input type="text" name="food_name" placeholder="Food name" value="${escapeHtml(entry.food_name)}" required>
      <input type="number" name="calories" placeholder="Calories" value="${entry.calories}" required>
      <input type="number" step="0.1" name="protein" placeholder="Protein (g)" value="${entry.protein_g}" required>
      <input type="number" step="0.1" name="carbs" placeholder="Carbs (g)" value="${entry.carbs_g}" required>
      <input type="number" step="0.1" name="fat" placeholder="Fat (g)" value="${entry.fat_g}" required>
      <input type="number" step="0.1" name="sugar" placeholder="Sugar (g, optional)" value="${entry.sugar_g ?? ""}">
      <button type="submit">Save</button>
    </form>
    <a class="cancel-link" href="/dashboard/calorie">Cancel</a>
    <div class="danger-zone">
      <form class="delete-form" method="POST" action="/dashboard/calorie/food-delete">
        <input type="hidden" name="id" value="${entry.id}">
        <button type="submit">Delete this log</button>
      </form>
    </div>
  </div>`;
}

export function renderCalorieDashboard({
  target,
  total,
  macroTargets,
  todayMacros,
  todayLogRows,
  weekRows,
  weekChartData,
  weightRows,
  editEntry,
  flash,
}) {
  const remaining = target != null ? target - total : null;

  const macroCards = [
    ["🥩 Protein", todayMacros.protein_g, macroTargets.protein_target_g, "g"],
    ["🍚 Carbs", todayMacros.carbs_g, macroTargets.carbs_target_g, "g"],
    ["🧈 Fat", todayMacros.fat_g, macroTargets.fat_target_g, "g"],
    ["🍬 Sugar", todayMacros.sugar_g, macroTargets.sugar_target_g, "g"],
  ]
    .map(
      ([label, current, targetVal, unit]) => `
      <div class="card">
        <div class="card-label">${label}</div>
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
        <h3>✍️ Via Text</h3>
        <form method="POST" action="/dashboard/calorie/food-text">
          <input type="text" name="description" placeholder="e.g. fried rice 1 serving" required>
          <button type="submit">Save</button>
        </form>
      </div>
      <div class="form-card">
        <h3>📸 Via Photo</h3>
        <form method="POST" action="/dashboard/calorie/food-photo" enctype="multipart/form-data" id="food-photo-form">
          <input type="file" name="photo" accept="image/*" required>
          <button type="submit" id="food-photo-submit">Save</button>
          <div class="upload-progress" id="food-photo-progress" hidden>
            <div class="upload-progress-bar"></div>
          </div>
        </form>
      </div>
      <div class="form-card">
        <h3>⚖️ Weight</h3>
        <form method="POST" action="/dashboard/calorie/weight">
          <input type="number" step="0.1" name="weight" placeholder="e.g. 65.5" required>
          <button type="submit">Save</button>
        </form>
      </div>
    </div>

    <h2>🎯 Set Targets</h2>
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

    <h2>📋 Today's Log</h2>
    <table>
      <thead><tr><th>🕐 Time</th><th>🍽️ Food</th><th>🔥 Calories</th></tr></thead>
      <tbody>${todayLogRows || `<tr><td colspan="3">No logs yet.</td></tr>`}</tbody>
    </table>
    ${editEntry ? editFormHtml(editEntry) : ""}

    <h2>📅 7-Day Recap (calories from Protein/Carbs/Fat)</h2>
    ${
      weekChartData?.length
        ? `<div class="chart-card">${stackedBarChartSvg(weekChartData, MACRO_SERIES, { itemsPerRow: 6 })}</div>`
        : ""
    }
    <table>
      <thead><tr><th>📆 Day</th><th>🔥 Calories</th></tr></thead>
      <tbody>${weekRows || `<tr><td colspan="2">No data yet.</td></tr>`}</tbody>
    </table>

    <h2>⚖️ Weight</h2>
    <table>
      <thead><tr><th>🗓️ Date</th><th>⚖️ Weight</th></tr></thead>
      <tbody>${weightRows || `<tr><td colspan="2">No data yet.</td></tr>`}</tbody>
    </table>
  </div>
  <script>
    // JS minimal, cuma buat kasih feedback visual pas foto lagi dianalisis Gemini (bisa
    // beberapa detik) - sisa halaman ini tetap murni server-rendered, no-JS.
    document.getElementById("food-photo-form").addEventListener("submit", function () {
      document.getElementById("food-photo-submit").disabled = true;
      document.getElementById("food-photo-submit").textContent = "Analyzing...";
      document.getElementById("food-photo-progress").hidden = false;
    });
  </script>
</body>
</html>`;
}
