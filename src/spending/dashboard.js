import { DASHBOARD_CSS, escapeHtml, navHeader, stackedBarChartSvg } from "../shared/dashboard-layout.js";

const CATEGORY_COLOR_PALETTE = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4",
  "#a855f7", "#eab308", "#ec4899", "#10b981", "#f97316", "#64748b",
];

// warna kategori ditentukan otomatis dari data chart-nya sendiri (urut dari total terbesar)
function buildCategorySeries(days) {
  const totalsByCategory = {};
  for (const day of days) {
    for (const [key, value] of Object.entries(day.values)) {
      totalsByCategory[key] = (totalsByCategory[key] || 0) + value;
    }
  }
  return Object.entries(totalsByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([key], i) => ({
      key,
      name: key,
      color: CATEGORY_COLOR_PALETTE[i % CATEGORY_COLOR_PALETTE.length],
    }));
}

function periodCard(label, { total, categories }) {
  const rows = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `<tr><td>${cat}</td><td>Rp${Math.round(amt).toLocaleString("id-ID")}</td></tr>`)
    .join("");

  return `
    <div>
      <h2>${label}</h2>
      <table>
        <thead><tr><th>🏷️ Kategori</th><th>💰 Total</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="2">Belum ada data.</td></tr>`}</tbody>
      </table>
      <div class="card" style="margin-top: 8px;">
        <div class="card-label">Total ${label}</div>
        <div class="card-value">Rp${Math.round(total).toLocaleString("id-ID")}</div>
      </div>
    </div>`;
}

export function renderSpendingDashboard({
  balance,
  weeklyBudget,
  weekSpent,
  today,
  week,
  month,
  weekChartData,
  transactionRows,
  flash,
}) {
  const remaining = weeklyBudget ? weeklyBudget - weekSpent : null;

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Spending Tracker</title>
<style>${DASHBOARD_CSS}</style>
</head>
<body>
  <div class="container">
    ${navHeader({
      icon: "💸",
      title: "Spending Tracker",
      links: [{ href: "/dashboard/calorie", label: "🍽️ Kalori" }],
    })}

    ${flash ? `<div class="flash flash-${flash.type}">${escapeHtml(flash.text)}</div>` : ""}

    <section class="cards">
      <div class="card">
        <div class="card-label">💳 Running Balance</div>
        <div class="card-value">Rp${Math.round(balance).toLocaleString("id-ID")}</div>
      </div>
      <div class="card">
        <div class="card-label">🎯 Budget Mingguan</div>
        <div class="card-value">${weeklyBudget ? `Rp${Math.round(weeklyBudget).toLocaleString("id-ID")}` : "Belum di-set"}</div>
        ${
          remaining != null
            ? `<div class="card-sub">${remaining >= 0 ? `Sisa Rp${Math.round(remaining).toLocaleString("id-ID")}` : `Lebih Rp${Math.round(Math.abs(remaining)).toLocaleString("id-ID")}`}</div>`
            : ""
        }
      </div>
    </section>

    <h2>💸 Catat Pengeluaran</h2>
    <div class="forms">
      <div class="form-card">
        <h3>✍️ Via Teks</h3>
        <form method="POST" action="/dashboard/spending/expense-text">
          <input type="text" name="text" placeholder="mis. kopi 25k" required>
          <button type="submit">Catat</button>
        </form>
      </div>
      <div class="form-card">
        <h3>🧾 Via Foto Struk</h3>
        <form method="POST" action="/dashboard/spending/expense-photo" enctype="multipart/form-data">
          <input type="file" name="photo" accept="image/*" required>
          <button type="submit">Catat</button>
        </form>
      </div>
    </div>

    <h2>🎯 Set Budget Mingguan</h2>
    <div class="forms">
      <div class="form-card">
        <h3>💰 Topup / Update Budget</h3>
        <form method="POST" action="/dashboard/spending/topup">
          <input type="number" name="amount" placeholder="mis. 500000" required>
          <button type="submit">Simpan</button>
        </form>
      </div>
    </div>

    <h2>📈 Tren Pengeluaran 7 Hari (per Kategori)</h2>
    ${
      weekChartData?.length
        ? `<div class="chart-card">${stackedBarChartSvg(weekChartData, buildCategorySeries(weekChartData), {
            formatValue: (v) => `${Math.round(v / 1000)}k`,
            itemsPerRow: 4,
          })}</div>`
        : ""
    }

    <div class="grid-2">
      ${periodCard("📆 Hari Ini", today)}
      ${periodCard("🗓️ Minggu Ini", week)}
    </div>
    ${periodCard("📅 Bulan Ini", month)}

    <h2>🧾 Transaksi Terakhir</h2>
    <table>
      <thead><tr><th>🗓️ Tanggal</th><th>📝 Deskripsi</th><th>🏷️ Kategori</th><th>💰 Jumlah</th></tr></thead>
      <tbody>${transactionRows || `<tr><td colspan="4">Belum ada transaksi.</td></tr>`}</tbody>
    </table>
  </div>
</body>
</html>`;
}
