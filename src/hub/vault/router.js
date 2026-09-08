import express from "express";
import { requireAuth } from "../../shared/auth.js";
import { getTopupTotal } from "../../spending/supabase.js";
import {
  saveIncome,
  getRecentIncomeLogs,
  getMonthlyIncomeTotal,
  saveSavingsEntry,
  getSavingsTotal,
  getMonthlySavingsNet,
  getRecentSavingsLogs,
  getBillTemplates,
  getBillTemplateById,
  createBillTemplate,
  updateBillTemplate,
  deleteBillTemplate,
  payBill,
  getBillPaymentsThisMonth,
  saveMiscExpense,
  getMonthlyMiscExpenseTotal,
  getRecentMiscExpenses,
} from "./supabase.js";
import { renderVaultPage } from "./dashboard.js";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function wibPartsToIso(year, month, day, hour = 0, minute = 0, second = 0) {
  return new Date(Date.UTC(year, month, day, hour, minute, second) - WIB_OFFSET_MS).toISOString();
}

function currentMonthBoundsWib() {
  const wibNow = new Date(Date.now() + WIB_OFFSET_MS);
  const y = wibNow.getUTCFullYear();
  const m = wibNow.getUTCMonth();
  return {
    startISO: wibPartsToIso(y, m, 1, 0, 0, 0),
    endISO: wibPartsToIso(y, m + 1, 0, 23, 59, 59),
  };
}

function toWibDateLabel(isoString) {
  const wib = new Date(new Date(isoString).getTime() + WIB_OFFSET_MS);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${MONTHS[wib.getUTCMonth()]} ${wib.getUTCDate()}`;
}

// pakai encodeURIComponent biar pesan error dinamis nggak bikin query string rusak
function redirectWithError(res, path, message) {
  res.redirect(`${path}?err=${encodeURIComponent(message)}`);
}

export const router = express.Router();

router.get("/hub/vault", requireAuth, async (req, res) => {
  try {
    const phone = req.user.phone;
    const { startISO, endISO } = currentMonthBoundsWib();

    const [
      monthlyIncome,
      monthlySavingsNet,
      monthlyTopupTotal,
      savingsTotal,
      billTemplates,
      billPaymentsThisMonth,
      recentIncome,
      recentSavings,
      monthlyMiscExpenseTotal,
      recentMiscExpenses,
    ] = await Promise.all([
      getMonthlyIncomeTotal(phone),
      getMonthlySavingsNet(phone),
      getTopupTotal(phone, startISO, endISO),
      getSavingsTotal(phone),
      getBillTemplates(phone),
      getBillPaymentsThisMonth(phone),
      getRecentIncomeLogs(phone, 10),
      getRecentSavingsLogs(phone, 10),
      getMonthlyMiscExpenseTotal(phone),
      getRecentMiscExpenses(phone, 10),
    ]);

    const paidByName = new Map(billPaymentsThisMonth.map((p) => [p.name, p]));
    const monthlyBillsPaidTotal = billPaymentsThisMonth.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    );
    const bills = billTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      defaultAmount: t.default_amount,
      paid: paidByName.get(t.name) || null,
    }));

    const monthlyRemaining =
      monthlyIncome - monthlySavingsNet - monthlyTopupTotal - monthlyBillsPaidTotal - monthlyMiscExpenseTotal;

    const flash = req.query.err
      ? { type: "error", text: req.query.err }
      : req.query.ok
        ? { type: "success", text: "Saved." }
        : null;

    res.send(
      renderVaultPage({
        monthlyIncome,
        monthlySavingsNet,
        monthlyTopupTotal,
        monthlyBillsPaidTotal,
        monthlyMiscExpenseTotal,
        monthlyRemaining,
        savingsTotal,
        bills,
        recentIncome: recentIncome.map((r) => ({ ...r, dateLabel: toWibDateLabel(r.created_at) })),
        recentSavings: recentSavings.map((r) => ({ ...r, dateLabel: toWibDateLabel(r.created_at) })),
        recentMiscExpenses: recentMiscExpenses.map((r) => ({ ...r, dateLabel: toWibDateLabel(r.created_at) })),
        flash,
      })
    );
  } catch (err) {
    console.error(err);
    res.status(500).send(`Gagal load halaman vault: ${err.message}`);
  }
});

router.post("/hub/vault/income", requireAuth, async (req, res) => {
  const amount = parseFloat(req.body.amount);
  const note = (req.body.note || "").trim();
  if (isNaN(amount) || amount <= 0) {
    return redirectWithError(res, "/hub/vault", "Invalid income amount.");
  }

  try {
    await saveIncome(req.user.phone, amount, note);
    res.redirect("/hub/vault?ok=1");
  } catch (err) {
    console.error(err);
    redirectWithError(res, "/hub/vault", `Gagal simpan income: ${err.message}`);
  }
});

router.post("/hub/vault/expenses", requireAuth, async (req, res) => {
  const amount = parseFloat(req.body.amount);
  const note = (req.body.note || "").trim();
  if (isNaN(amount) || amount <= 0) {
    return redirectWithError(res, "/hub/vault", "Invalid expense amount.");
  }

  try {
    await saveMiscExpense(req.user.phone, amount, note);
    res.redirect("/hub/vault?ok=1");
  } catch (err) {
    console.error(err);
    redirectWithError(res, "/hub/vault", `Gagal simpan pengeluaran: ${err.message}`);
  }
});

router.post("/hub/vault/savings", requireAuth, async (req, res) => {
  const amount = parseFloat(req.body.amount);
  const type = req.body.type;
  const note = (req.body.note || "").trim();

  if (isNaN(amount) || amount <= 0 || !["deposit", "withdrawal", "opening_balance"].includes(type)) {
    return redirectWithError(res, "/hub/vault", "Invalid savings entry.");
  }

  try {
    if (type === "withdrawal") {
      const currentTotal = await getSavingsTotal(req.user.phone);
      if (amount > currentTotal) {
        return redirectWithError(
          res,
          "/hub/vault",
          `Can't withdraw more than your current savings (Rp${Math.round(currentTotal).toLocaleString("id-ID")}).`
        );
      }
    }
    await saveSavingsEntry(req.user.phone, amount, type, note);
    res.redirect("/hub/vault?ok=1");
  } catch (err) {
    console.error(err);
    redirectWithError(res, "/hub/vault", `Gagal simpan savings: ${err.message}`);
  }
});

router.post("/hub/vault/bills", requireAuth, async (req, res) => {
  const name = (req.body.name || "").trim();
  const defaultAmountRaw = (req.body.default_amount || "").trim();
  const defaultAmount = defaultAmountRaw ? parseFloat(defaultAmountRaw) : null;

  if (!name) return redirectWithError(res, "/hub/vault", "Bill name can't be empty.");

  try {
    await createBillTemplate(req.user.phone, name, defaultAmount);
    res.redirect("/hub/vault?ok=1");
  } catch (err) {
    console.error(err);
    redirectWithError(res, "/hub/vault", `Gagal simpan bill: ${err.message}`);
  }
});

router.post("/hub/vault/bills/:id/update", requireAuth, async (req, res) => {
  const name = (req.body.name || "").trim();
  const defaultAmountRaw = (req.body.default_amount || "").trim();
  const defaultAmount = defaultAmountRaw ? parseFloat(defaultAmountRaw) : null;

  if (!name) return redirectWithError(res, "/hub/vault", "Bill name can't be empty.");

  try {
    const existing = await getBillTemplateById(req.user.phone, req.params.id);
    if (!existing) return redirectWithError(res, "/hub/vault", "Bill not found.");

    await updateBillTemplate(req.user.phone, req.params.id, { name, defaultAmount });
    res.redirect("/hub/vault?ok=1");
  } catch (err) {
    console.error(err);
    redirectWithError(res, "/hub/vault", `Gagal update bill: ${err.message}`);
  }
});

router.post("/hub/vault/bills/:id/delete", requireAuth, async (req, res) => {
  try {
    const existing = await getBillTemplateById(req.user.phone, req.params.id);
    if (!existing) return redirectWithError(res, "/hub/vault", "Bill not found.");

    await deleteBillTemplate(req.user.phone, req.params.id);
    res.redirect("/hub/vault?ok=1");
  } catch (err) {
    console.error(err);
    redirectWithError(res, "/hub/vault", `Gagal hapus bill: ${err.message}`);
  }
});

router.post("/hub/vault/bills/:id/pay", requireAuth, async (req, res) => {
  const amountRaw = (req.body.amount || "").trim();

  try {
    const existing = await getBillTemplateById(req.user.phone, req.params.id);
    if (!existing) return redirectWithError(res, "/hub/vault", "Bill not found.");

    const amount = amountRaw ? parseFloat(amountRaw) : Number(existing.default_amount);
    if (isNaN(amount) || amount <= 0) {
      return redirectWithError(res, "/hub/vault", "Invalid payment amount.");
    }

    await payBill(req.user.phone, existing.name, amount);
    res.redirect("/hub/vault?ok=1");
  } catch (err) {
    console.error(err);
    redirectWithError(res, "/hub/vault", `Gagal catat pembayaran: ${err.message}`);
  }
});
