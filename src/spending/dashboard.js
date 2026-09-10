import { DASHBOARD_CSS, escapeHtml, navHeader, horizontalStackedBarChartSvg, faviconLink, iconLabel, statBarHtml, progressFormScript } from "../shared/dashboard-layout.js";

// flavor text buat "Budget Boss HP bar" - gamify budget mingguan biar lebih iseng dilihat
function budgetFlavorText(pct, remaining, weeklyBudget) {
  if (!weeklyBudget) return "Set a weekly budget to start the fight.";
  if (remaining <= 0)
    return `💀 Budget Boss defeated you — over by Rp${Math.round(Math.abs(remaining)).toLocaleString("id-ID")}.`;
  if (pct < 20) return "🔥 Critical HP! Spend carefully.";
  if (pct < 50) return "⚔️ Halfway through the week's dungeon.";
  return "💪 Budget's looking strong.";
}

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

function periodCard(icon, text, { total, categories }) {
  const rows = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `<tr><td>${cat}</td><td>Rp${Math.round(amt).toLocaleString("id-ID")}</td></tr>`)
    .join("");

  return `
    <div>
      <h2>${iconLabel(icon, text)}</h2>
      <table>
        <thead><tr><th>🏷️ Category</th><th>💰 Total</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="2">No data yet.</td></tr>`}</tbody>
      </table>
      <div class="card" style="margin-top: 8px;">
        <div class="card-label">Total ${text}</div>
        <div class="card-value">Rp${Math.round(total).toLocaleString("id-ID")}</div>
      </div>
    </div>`;
}

export function renderSpendingDashboard({
  balance,
  weeklyBudget,
  weekSpent,
  daysElapsedInWeek,
  daysLeftInWeek,
  today,
  week,
  month,
  weekChartData,
  transactionRows,
  flash,
}) {
  const remaining = weeklyBudget ? weeklyBudget - weekSpent : null;
  const avgDaily = daysElapsedInWeek > 0 ? weekSpent / daysElapsedInWeek : 0;
  const maxPerDay =
    remaining != null && remaining > 0 && daysLeftInWeek > 0 ? remaining / daysLeftInWeek : null;
  const budgetPct = weeklyBudget ? ((remaining ?? 0) / weeklyBudget) * 100 : 0;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Spending Tracker</title>
${faviconLink("/icons/spending.png")}
<style>${DASHBOARD_CSS}</style>
</head>
<body>
  <div class="container">
    ${navHeader({
      icon: "/icons/spending.png",
      title: "Spending Tracker",
      links: [{ href: "/hub", label: iconLabel("/icons/home.png", "Home") }],
    })}
    <nav class="subnav"><a href="/dashboard/calorie">${iconLabel("/icons/calorie.png", "Calories")}</a></nav>

    ${flash ? `<div class="flash flash-${flash.type}">${escapeHtml(flash.text)}</div>` : ""}

    <section class="cards">
      <div class="card">
        <div class="card-label">💳 Running Balance</div>
        <div class="card-value">Rp${Math.round(balance).toLocaleString("id-ID")}</div>
        ${
          maxPerDay != null
            ? `<div class="card-sub">Rp${Math.round(maxPerDay).toLocaleString("id-ID")}/day max (${daysLeftInWeek}d left this week)</div>`
            : ""
        }
      </div>
      <div class="card">
        <div class="card-label">⚔️ Weekly Budget HP</div>
        <div class="card-value card-value-compact">${weeklyBudget ? `Rp${Math.round(weeklyBudget).toLocaleString("id-ID")}` : "Not set"}</div>
        ${weeklyBudget ? statBarHtml(budgetPct) : ""}
        ${
          remaining != null
            ? `<div class="card-sub">${remaining >= 0 ? `Rp${Math.round(remaining).toLocaleString("id-ID")} left` : `Rp${Math.round(Math.abs(remaining)).toLocaleString("id-ID")} over`}</div>`
            : ""
        }
        <div class="card-sub">${budgetFlavorText(budgetPct, remaining ?? 0, weeklyBudget)}</div>
      </div>
      <div class="card">
        <div class="card-label">📊 Avg Daily</div>
        <div class="card-value">Rp${Math.round(avgDaily).toLocaleString("id-ID")}</div>
        <div class="card-sub">this week so far</div>
      </div>
    </section>

    <h2>💸 Log Expense</h2>
    <div class="forms">
      <div class="form-card">
        <h3>${iconLabel("/icons/via-text.png", "Via Text")}</h3>
        <form method="POST" action="/dashboard/spending/expense-text">
          <input type="text" name="text" placeholder="e.g. coffee 25k" required>
          <button type="submit">Save</button>
        </form>
      </div>
      <div class="form-card">
        <h3>${iconLabel("/icons/receipt.png", "Via Receipt Photo")}</h3>
        <form method="POST" action="/dashboard/spending/expense-photo" enctype="multipart/form-data" id="expense-photo-form">
          <input type="file" name="photo" accept="image/*" required>
          <button type="submit" id="expense-photo-submit">Save</button>
          <div class="upload-progress" id="expense-photo-progress" hidden>
            <div class="upload-progress-bar"></div>
          </div>
        </form>
      </div>
    </div>

    <h2>${iconLabel("/icons/weekly-budget.png", "Set Weekly Budget")}</h2>
    <div class="forms">
      <details class="form-card">
        <summary>${iconLabel("/icons/top-up.png", "Top Up / Update Budget")}</summary>
        <form method="POST" action="/dashboard/spending/topup">
          <input type="number" name="amount" placeholder="e.g. 500000" required>
          <button type="submit">Save</button>
        </form>
      </details>
    </div>

    <h2>${iconLabel("/icons/trend.png", "7-Day Spending Trend (by Category)")}</h2>
    ${
      weekChartData?.length
        ? `<div class="chart-card">${horizontalStackedBarChartSvg(weekChartData, buildCategorySeries(weekChartData), {
            formatValue: (v) => `${Math.round(v / 1000)}k`,
            itemsPerRow: 4,
          })}</div>`
        : ""
    }

    <div class="grid-2">
      ${periodCard("/icons/today.png", "Today", today)}
      ${periodCard("/icons/week.png", "This Week", week)}
    </div>
    ${periodCard("/icons/month.png", "This Month", month)}

    <h2>${iconLabel("/icons/recent-transactions.png", "Recent Transactions")}</h2>
    <table>
      <thead><tr><th class="nowrap">🗓️ Date</th><th>📝 Description</th><th>🏷️ Category</th><th>💰 Amount</th></tr></thead>
      <tbody>${transactionRows || `<tr><td colspan="4">No transactions yet.</td></tr>`}</tbody>
    </table>
  </div>
  ${progressFormScript([
    { formId: "expense-photo-form", submitId: "expense-photo-submit", progressId: "expense-photo-progress", loadingLabel: "Reading receipt..." },
  ])}
</body>
</html>`;
}
