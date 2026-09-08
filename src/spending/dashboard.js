import { DASHBOARD_CSS, escapeHtml, navHeader, stackedBarChartSvg, faviconLink } from "../shared/dashboard-layout.js";

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
        <thead><tr><th>🏷️ Category</th><th>💰 Total</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="2">No data yet.</td></tr>`}</tbody>
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
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Spending Tracker</title>
${faviconLink("💸")}
<style>${DASHBOARD_CSS}</style>
</head>
<body>
  <div class="container">
    ${navHeader({
      icon: "💸",
      title: "Spending Tracker",
      links: [
        { href: "/hub", label: "🏠 Home" },
        { href: "/dashboard/calorie", label: "🍽️ Calories" },
      ],
    })}

    ${flash ? `<div class="flash flash-${flash.type}">${escapeHtml(flash.text)}</div>` : ""}

    <section class="cards">
      <div class="card">
        <div class="card-label">💳 Running Balance</div>
        <div class="card-value">Rp${Math.round(balance).toLocaleString("id-ID")}</div>
      </div>
      <div class="card">
        <div class="card-label">🎯 Weekly Budget</div>
        <div class="card-value">${weeklyBudget ? `Rp${Math.round(weeklyBudget).toLocaleString("id-ID")}` : "Not set"}</div>
        ${
          remaining != null
            ? `<div class="card-sub">${remaining >= 0 ? `Rp${Math.round(remaining).toLocaleString("id-ID")} left` : `Rp${Math.round(Math.abs(remaining)).toLocaleString("id-ID")} over`}</div>`
            : ""
        }
      </div>
    </section>

    <h2>💸 Log Expense</h2>
    <div class="forms">
      <div class="form-card">
        <h3>✍️ Via Text</h3>
        <form method="POST" action="/dashboard/spending/expense-text">
          <input type="text" name="text" placeholder="e.g. coffee 25k" required>
          <button type="submit">Save</button>
        </form>
      </div>
      <div class="form-card">
        <h3>🧾 Via Receipt Photo</h3>
        <form method="POST" action="/dashboard/spending/expense-photo" enctype="multipart/form-data">
          <input type="file" name="photo" accept="image/*" required>
          <button type="submit">Save</button>
        </form>
      </div>
    </div>

    <h2>🎯 Set Weekly Budget</h2>
    <div class="forms">
      <div class="form-card">
        <h3>💰 Top Up / Update Budget</h3>
        <form method="POST" action="/dashboard/spending/topup">
          <input type="number" name="amount" placeholder="e.g. 500000" required>
          <button type="submit">Save</button>
        </form>
      </div>
    </div>

    <h2>📈 7-Day Spending Trend (by Category)</h2>
    ${
      weekChartData?.length
        ? `<div class="chart-card">${stackedBarChartSvg(weekChartData, buildCategorySeries(weekChartData), {
            formatValue: (v) => `${Math.round(v / 1000)}k`,
            itemsPerRow: 4,
          })}</div>`
        : ""
    }

    <div class="grid-2">
      ${periodCard("📆 Today", today)}
      ${periodCard("🗓️ This Week", week)}
    </div>
    ${periodCard("📅 This Month", month)}

    <h2>🧾 Recent Transactions</h2>
    <table>
      <thead><tr><th>🗓️ Date</th><th>📝 Description</th><th>🏷️ Category</th><th>💰 Amount</th></tr></thead>
      <tbody>${transactionRows || `<tr><td colspan="4">No transactions yet.</td></tr>`}</tbody>
    </table>
  </div>
</body>
</html>`;
}
