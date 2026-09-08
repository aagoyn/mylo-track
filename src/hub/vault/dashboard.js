import { DASHBOARD_CSS, escapeHtml, navHeader } from "../../shared/dashboard-layout.js";

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

function savingsRow(entry) {
  const isWithdrawal = entry.type === "withdrawal";
  return `<div class="activity-row">
    <div class="activity-icon">${isWithdrawal ? "🏧" : "💰"}</div>
    <div class="activity-main">
      <div class="activity-title">${isWithdrawal ? "-" : "+"}${formatRupiah(entry.amount)} ${isWithdrawal ? "Withdrawal" : "Deposit"}</div>
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
    <form class="wishlist-item-form" method="POST" action="/hub/vault/bills/${bill.id}/update" style="margin-top:8px;">
      <input type="text" name="name" value="${escapeHtml(bill.name)}" required>
      <input type="number" name="default_amount" placeholder="Default amount" value="${bill.defaultAmount ?? ""}">
      <button type="submit">Save</button>
    </form>
    <form class="delete-form" method="POST" action="/hub/vault/bills/${bill.id}/delete" style="margin-top:8px;">
      <button type="submit">Delete</button>
    </form>
  </div>`;
}

export function renderVaultPage({
  monthlyIncome,
  monthlySavingsNet,
  monthlyTopupTotal,
  monthlyBillsPaidTotal,
  monthlyRemaining,
  savingsTotal,
  bills,
  recentIncome,
  recentSavings,
  flash,
}) {
  const incomeRows = recentIncome.length
    ? recentIncome.map(incomeRow).join("")
    : `<div class="empty-state">No income logged yet.</div>`;

  const savingsRows = recentSavings.length
    ? recentSavings.map(savingsRow).join("")
    : `<div class="empty-state">No savings activity yet.</div>`;

  const billRows = bills.length
    ? bills.map(billCardHtml).join("")
    : `<div class="empty-state">No bills set up yet.</div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vault</title>
<style>${DASHBOARD_CSS}</style>
</head>
<body>
  <div class="container">
    ${navHeader({ icon: "🏦", title: "Vault", links: [{ href: "/hub", label: "🏠 Home" }] })}

    ${flash ? `<div class="flash flash-${flash.type}">${escapeHtml(flash.text)}</div>` : ""}

    <div class="card">
      <div class="card-label">🏦 Monthly Overview</div>
      <div class="card-value">${formatRupiah(monthlyRemaining)} left</div>
      <table style="margin-top:10px;">
        <tbody>
          ${overviewLine("Income this month", monthlyIncome, "+")}
          ${overviewLine("Savings (net)", monthlySavingsNet, "-")}
          ${overviewLine("Weekly topups", monthlyTopupTotal, "-")}
          ${overviewLine("Bills paid", monthlyBillsPaidTotal, "-")}
        </tbody>
      </table>
    </div>

    <h2>💵 Income</h2>
    <details class="form-card">
      <summary>Log Income</summary>
      <form method="POST" action="/hub/vault/income">
        <input type="number" name="amount" placeholder="e.g. 9500000" required>
        <input type="text" name="note" placeholder="e.g. Salary September">
        <button type="submit">Save</button>
      </form>
    </details>
    <div class="activity-list" style="margin-top:8px;">${incomeRows}</div>

    <h2>💰 Savings</h2>
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
    </details>
    <div class="activity-list" style="margin-top:8px;">${savingsRows}</div>

    <h2>🧾 Bills</h2>
    <div class="wishlist-list">${billRows}</div>
    <details class="form-card" style="margin-top:8px;">
      <summary>Add Bill</summary>
      <form method="POST" action="/hub/vault/bills">
        <input type="text" name="name" placeholder="e.g. Kos" required>
        <input type="number" name="default_amount" placeholder="Default amount (optional)">
        <button type="submit">Save</button>
      </form>
    </details>
  </div>
</body>
</html>`;
}
