import { supabase } from "../../shared/supabase-client.js";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const SAVINGS_TYPES = ["deposit", "withdrawal"];

function wibPartsToIso(year, month, day, hour = 0, minute = 0, second = 0) {
  return new Date(Date.UTC(year, month, day, hour, minute, second) - WIB_OFFSET_MS).toISOString();
}

// selalu bulan berjalan (WIB) - Vault nggak punya navigasi bulan kayak Mood, MVP dulu
function getCurrentMonthBoundsWib() {
  const wibNow = new Date(Date.now() + WIB_OFFSET_MS);
  const y = wibNow.getUTCFullYear();
  const m = wibNow.getUTCMonth();
  return {
    startISO: wibPartsToIso(y, m, 1, 0, 0, 0),
    endISO: wibPartsToIso(y, m + 1, 0, 23, 59, 59),
  };
}

// ===== Income =====

export async function saveIncome(phone, amount, note) {
  const { error } = await supabase.from("income_logs").insert({ phone, amount, note: note || null });
  if (error) throw error;
}

export async function getRecentIncomeLogs(phone, limit = 10) {
  const { data, error } = await supabase
    .from("income_logs")
    .select("amount, note, created_at")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getMonthlyIncomeTotal(phone) {
  const { startISO, endISO } = getCurrentMonthBoundsWib();
  const { data, error } = await supabase
    .from("income_logs")
    .select("amount")
    .eq("phone", phone)
    .gte("created_at", startISO)
    .lte("created_at", endISO);
  if (error) throw error;
  return data.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
}

// ===== Savings =====

export async function saveSavingsEntry(phone, amount, type, note) {
  if (!SAVINGS_TYPES.includes(type)) {
    throw new Error(`Tipe savings tidak valid: "${type}"`);
  }
  const { error } = await supabase.from("savings_logs").insert({ phone, amount, type, note: note || null });
  if (error) throw error;
}

function netSavings(rows) {
  return rows.reduce((sum, row) => {
    const amount = Number(row.amount) || 0;
    return row.type === "withdrawal" ? sum - amount : sum + amount;
  }, 0);
}

export async function getSavingsTotal(phone) {
  const { data, error } = await supabase.from("savings_logs").select("amount, type").eq("phone", phone);
  if (error) throw error;
  return netSavings(data);
}

export async function getMonthlySavingsNet(phone) {
  const { startISO, endISO } = getCurrentMonthBoundsWib();
  const { data, error } = await supabase
    .from("savings_logs")
    .select("amount, type")
    .eq("phone", phone)
    .gte("created_at", startISO)
    .lte("created_at", endISO);
  if (error) throw error;
  return netSavings(data);
}

export async function getRecentSavingsLogs(phone, limit = 10) {
  const { data, error } = await supabase
    .from("savings_logs")
    .select("amount, type, note, created_at")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// ===== Bills =====

export async function getBillTemplates(phone) {
  const { data, error } = await supabase
    .from("bill_templates")
    .select("id, name, default_amount, created_at")
    .eq("phone", phone)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

// dipakai buat verifikasi ownership sebelum update/delete/pay - id-nya dikirim dari form (input
// klien), sama alasannya kayak getFoodLogById di calorie/supabase.js
export async function getBillTemplateById(phone, id) {
  const { data, error } = await supabase
    .from("bill_templates")
    .select("id, name, default_amount")
    .eq("phone", phone)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createBillTemplate(phone, name, defaultAmount) {
  const { error } = await supabase
    .from("bill_templates")
    .insert({ phone, name, default_amount: defaultAmount });
  if (error) throw error;
}

export async function updateBillTemplate(phone, id, { name, defaultAmount }) {
  const { error } = await supabase
    .from("bill_templates")
    .update({ name, default_amount: defaultAmount })
    .eq("phone", phone)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteBillTemplate(phone, id) {
  const { error } = await supabase.from("bill_templates").delete().eq("phone", phone).eq("id", id);
  if (error) throw error;
}

export async function payBill(phone, name, amount) {
  const { error } = await supabase.from("bill_payments").insert({ phone, name, amount });
  if (error) throw error;
}

export async function getBillPaymentsThisMonth(phone) {
  const { startISO, endISO } = getCurrentMonthBoundsWib();
  const { data, error } = await supabase
    .from("bill_payments")
    .select("name, amount, created_at")
    .eq("phone", phone)
    .gte("created_at", startISO)
    .lte("created_at", endISO);
  if (error) throw error;
  return data;
}
