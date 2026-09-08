import { DASHBOARD_CSS, escapeHtml, navHeader, stackedBarChartSvg } from "../shared/dashboard-layout.js";

const MACRO_SERIES = [
  { key: "protein", name: "Protein", color: "#f97316" },
  { key: "carbs", name: "Karbo", color: "#eab308" },
  { key: "fat", name: "Lemak", color: "#a855f7" },
];

export function renderCalorieDashboard({
  target,
  total,
  macroTargets,
  todayMacros,
  todayLogRows,
  weekRows,
  weekChartData,
  weightRows,
  flash,
}) {
  const remaining = target != null ? target - total : null;

  const macroCards = [
    ["🥩 Protein", todayMacros.protein_g, macroTargets.protein_target_g, "g"],
    ["🍚 Karbo", todayMacros.carbs_g, macroTargets.carbs_target_g, "g"],
    ["🧈 Lemak", todayMacros.fat_g, macroTargets.fat_target_g, "g"],
    ["🍬 Gula", todayMacros.sugar_g, macroTargets.sugar_target_g, "g"],
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
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Calorie Tracker</title>
<style>${DASHBOARD_CSS}</style>
</head>
<body>
  <div class="container">
    ${navHeader({
      icon: "🍽️",
      title: "Calorie Tracker",
      links: [{ href: "/dashboard/spending", label: "💸 Pengeluaran" }],
    })}

    ${flash ? `<div class="flash flash-${flash.type}">${escapeHtml(flash.text)}</div>` : ""}

    <div class="card">
      <div class="card-label">🔥 Kalori Hari Ini</div>
      <div class="card-value">${total}${target != null ? ` / ${target}` : ""} kcal</div>
      ${
        remaining != null
          ? `<div class="card-sub">${remaining >= 0 ? `Sisa ${remaining}` : `Lebih ${Math.abs(remaining)}`} kcal</div>`
          : ""
      }
    </div>
    <section class="cards macro-cards">
      ${macroCards}
    </section>

    <h2>📝 Catat Makanan</h2>
    <div class="forms">
      <div class="form-card">
        <h3>✍️ Via Teks</h3>
        <form method="POST" action="/dashboard/calorie/food-text">
          <input type="text" name="description" placeholder="mis. nasi goreng 1 porsi" required>
          <button type="submit">Catat</button>
        </form>
      </div>
      <div class="form-card">
        <h3>📸 Via Foto</h3>
        <form method="POST" action="/dashboard/calorie/food-photo" enctype="multipart/form-data">
          <input type="file" name="photo" accept="image/*" required>
          <button type="submit">Catat</button>
        </form>
      </div>
      <div class="form-card">
        <h3>⚖️ Berat Badan</h3>
        <form method="POST" action="/dashboard/calorie/weight">
          <input type="number" step="0.1" name="weight" placeholder="mis. 65.5" required>
          <button type="submit">Catat</button>
        </form>
      </div>
    </div>

    <h2>🎯 Set Target</h2>
    <div class="forms">
      <div class="form-card">
        <h3>🔥 Target Kalori Harian</h3>
        <form method="POST" action="/dashboard/calorie/target">
          <input type="number" name="target" placeholder="mis. 2000" required>
          <button type="submit">Simpan</button>
        </form>
      </div>
      <div class="form-card">
        <h3>🥩🍚🧈🍬 Target Makro (g)</h3>
        <form method="POST" action="/dashboard/calorie/target-macro">
          <input type="number" step="0.1" name="protein" placeholder="Protein" required>
          <input type="number" step="0.1" name="carbs" placeholder="Karbo" required>
          <input type="number" step="0.1" name="fat" placeholder="Lemak" required>
          <input type="number" step="0.1" name="sugar" placeholder="Gula (opsional)">
          <button type="submit">Simpan</button>
        </form>
      </div>
    </div>

    <h2>📋 Log Hari Ini</h2>
    <table>
      <thead><tr><th>🕐 Jam</th><th>🍽️ Makanan</th><th>🔥 Kalori</th></tr></thead>
      <tbody>${todayLogRows || `<tr><td colspan="3">Belum ada log.</td></tr>`}</tbody>
    </table>

    <h2>📅 Rekap 7 Hari (kalori dari Protein/Karbo/Lemak)</h2>
    ${
      weekChartData?.length
        ? `<div class="chart-card">${stackedBarChartSvg(weekChartData, MACRO_SERIES, { itemsPerRow: 6 })}</div>`
        : ""
    }
    <table>
      <thead><tr><th>📆 Hari</th><th>🔥 Kalori</th></tr></thead>
      <tbody>${weekRows || `<tr><td colspan="2">Belum ada data.</td></tr>`}</tbody>
    </table>

    <h2>⚖️ Berat Badan</h2>
    <table>
      <thead><tr><th>🗓️ Tanggal</th><th>⚖️ Berat</th></tr></thead>
      <tbody>${weightRows || `<tr><td colspan="2">Belum ada data.</td></tr>`}</tbody>
    </table>
  </div>
</body>
</html>`;
}
