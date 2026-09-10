import { DASHBOARD_CSS, escapeHtml, navHeader, faviconLink, iconLabel } from "../../shared/dashboard-layout.js";

function formatRupiah(amount) {
  return `Rp${Math.round(amount).toLocaleString("id-ID")}`;
}

function overviewLine(label, value, sign) {
  return `<div class="mood-history-item"><div>${label}</div><div>${sign}${formatRupiah(Math.abs(value))}</div></div>`;
}

function incomeRow(entry) {
  return `<div class="activity-row">
    <div class="activity-icon">💵</div>
    <div class="activity-main">
      <div class="activity-title">${formatRupiah(entry.amount)}</div>
      ${entry.note ? `<div class="activity-subtitle">${escapeHtml(entry.note)}</div>` : ""}
    </div>
    <div class="activity-time">${entry.dateLabel}</div>
  </div>`;
}

function expenseRow(entry) {
  return `<div class="activity-row">
    <div class="activity-icon">💸</div>
    <div class="activity-main">
      <div class="activity-title">-${formatRupiah(entry.amount)}</div>
      ${entry.note ? `<div class="activity-subtitle">${escapeHtml(entry.note)}</div>` : ""}
    </div>
    <div class="activity-time">${entry.dateLabel}</div>
  </div>`;
}

const SAVINGS_TYPE_META = {
  withdrawal: { icon: "🏧", sign: "-", label: "Withdrawal" },
  deposit: { icon: "💰", sign: "+", label: "Deposit" },
  opening_balance: { icon: "🏁", sign: "+", label: "Starting Balance" },
};

function savingsRow(entry) {
  const meta = SAVINGS_TYPE_META[entry.type] || SAVINGS_TYPE_META.deposit;
  return `<div class="activity-row">
    <div class="activity-icon">${meta.icon}</div>
    <div class="activity-main">
      <div class="activity-title">${meta.sign}${formatRupiah(entry.amount)} ${meta.label}</div>
      ${entry.note ? `<div class="activity-subtitle">${escapeHtml(entry.note)}</div>` : ""}
    </div>
    <div class="activity-time">${entry.dateLabel}</div>
  </div>`;
}

function billCardHtml(bill) {
  const payForm = !bill.paid
    ? `<form class="item-edit-form" method="POST" action="/hub/vault/bills/${bill.id}/pay">
         <div class="item-edit-row">
           <div>
             <label for="pay-${bill.id}">Amount paid (Rp)</label>
             <input type="number" id="pay-${bill.id}" name="amount" placeholder="e.g. ${bill.defaultAmount ?? "0"}">
           </div>
           <button type="submit">Mark Paid</button>
         </div>
       </form>`
    : "";

  return `<div class="wishlist-item">
    <div class="wishlist-item-head">
      <div class="wishlist-title">🧾 ${escapeHtml(bill.name)}</div>
      ${
        bill.paid
          ? `<span class="badge status-badge">✅ Paid ${formatRupiah(bill.paid.amount)}</span>`
          : `<span class="badge priority-medium">Not paid yet</span>`
      }
    </div>
    <div class="wishlist-meta">Default: ${bill.defaultAmount != null ? formatRupiah(bill.defaultAmount) : "—"}</div>
    ${payForm}
    <details class="inline-toggle">
      <summary>Edit</summary>
      <div class="inline-toggle-body">
        <form class="wishlist-item-form" method="POST" action="/hub/vault/bills/${bill.id}/update">
          <input type="text" name="name" value="${escapeHtml(bill.name)}" required>
          <input type="number" name="default_amount" placeholder="Default amount" value="${bill.defaultAmount ?? ""}">
          <button type="submit">Save</button>
        </form>
        <form class="delete-form" method="POST" action="/hub/vault/bills/${bill.id}/delete">
          <button type="submit">Delete</button>
        </form>
      </div>
    </details>
  </div>`;
}

export function renderVaultPage({
  monthlyIncome,
  monthlySavingsNet,
  monthlyTopupTotal,
  monthlyBillsPaidTotal,
  monthlyMiscExpenseTotal,
  monthlyRemaining,
  savingsTotal,
  bills,
  recentIncome,
  recentSavings,
  recentMiscExpenses,
  flash,
}) {
  const incomeRows = recentIncome.length
    ? recentIncome.map(incomeRow).join("")
    : `<div class="empty-state">No income logged yet.</div>`;

  const savingsRows = recentSavings.length
    ? recentSavings.map(savingsRow).join("")
    : `<div class="empty-state">No savings activity yet.</div>`;

  const expenseRows = recentMiscExpenses.length
    ? recentMiscExpenses.map(expenseRow).join("")
    : `<div class="empty-state">No other expenses logged yet.</div>`;

  const billRows = bills.length
    ? bills.map(billCardHtml).join("")
    : `<div class="empty-state">No bills set up yet.</div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vault</title>
${faviconLink("/icons/vault.png")}
<style>${DASHBOARD_CSS}</style>
</head>
<body>
  <div class="container">
    ${navHeader({ icon: "/icons/vault.png", title: "Vault", links: [{ href: "/hub", label: iconLabel("/icons/home.png", "Home") }] })}

    ${flash ? `<div class="flash flash-${flash.type}">${escapeHtml(flash.text)}</div>` : ""}

    <div class="card">
      <div class="card-label">${iconLabel("/icons/vault.png", "Monthly Overview")}</div>
      <div class="card-value">${formatRupiah(monthlyRemaining)} left</div>
      <div style="margin-top:10px;">
        ${overviewLine("Income this month", monthlyIncome, "+")}
        ${overviewLine("Savings (net)", monthlySavingsNet, "-")}
        ${overviewLine("Weekly topups", monthlyTopupTotal, "-")}
        ${overviewLine("Bills paid", monthlyBillsPaidTotal, "-")}
        ${overviewLine("Other expenses", monthlyMiscExpenseTotal, "-")}
      </div>
    </div>

    <h2>${iconLabel("/icons/income.png", "Income")}</h2>
    <details class="form-card">
      <summary>Log Income</summary>
      <form method="POST" action="/hub/vault/income">
        <input type="number" name="amount" placeholder="e.g. 9500000" required>
        <input type="text" name="note" placeholder="e.g. Salary September">
        <button type="submit">Save</button>
      </form>
    </details>
    <div class="activity-list" style="margin-top:8px;">${incomeRows}</div>

    <h2>${iconLabel("/icons/saving.png", "Savings")}</h2>
    <div class="card">
      <div class="card-label">Total Savings</div>
      <div class="card-value">${formatRupiah(savingsTotal)}</div>
    </div>
    <details class="form-card" style="margin-top:8px;">
      <summary>Add / Withdraw</summary>
      <form method="POST" action="/hub/vault/savings">
        <input type="number" name="amount" placeholder="Amount" required>
        <input type="text" name="note" placeholder="Note (optional)">
        <div class="button-row">
          <button type="submit" name="type" value="deposit">Add to Savings</button>
          <button type="submit" name="type" value="withdrawal">Withdraw</button>
        </div>
      </form>
      <details class="inline-toggle">
        <summary>Already have savings from before?</summary>
        <div class="inline-toggle-body">
          <form method="POST" action="/hub/vault/savings">
            <input type="number" name="amount" placeholder="Existing savings amount" required>
            <input type="text" name="note" placeholder="e.g. Starting balance">
            <input type="hidden" name="type" value="opening_balance">
            <button type="submit">Set Starting Balance</button>
          </form>
        </div>
      </details>
    </details>
    <div class="activity-list" style="margin-top:8px;">${savingsRows}</div>

    <h2>${iconLabel("/icons/bills.png", "Bills")}</h2>
    <div class="wishlist-list">${billRows}</div>
    <details class="form-card" style="margin-top:8px;">
      <summary>Add Bill</summary>
      <form method="POST" action="/hub/vault/bills">
        <input type="text" name="name" placeholder="e.g. Kos" required>
        <input type="number" name="default_amount" placeholder="Default amount (optional)">
        <button type="submit">Save</button>
      </form>
    </details>

    <h2>${iconLabel("/icons/other-expenses.png", "Other Expenses")}</h2>
    <details class="form-card">
      <summary>Log Expense</summary>
      <form method="POST" action="/hub/vault/expenses">
        <input type="number" name="amount" placeholder="Amount" required>
        <input type="text" name="note" placeholder="e.g. One-off purchase">
        <button type="submit">Save</button>
      </form>
    </details>
    <div class="activity-list" style="margin-top:8px;">${expenseRows}</div>
  </div>
</body>
</html>`;
}
