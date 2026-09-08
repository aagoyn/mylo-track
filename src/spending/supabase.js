import { supabase } from "../shared/supabase-client.js";

export async function uploadReceiptImage(phone, imageBuffer, mimeType) {
  const ext = mimeType.split("/")[1] || "jpg";
  const path = `${phone}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("receipt-photos")
    .upload(path, imageBuffer, { contentType: mimeType });
  if (error) throw error;

  const { data } = supabase.storage.from("receipt-photos").getPublicUrl(path);
  return data.publicUrl;
}

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function wibNow() {
  return new Date(Date.now() + WIB_OFFSET_MS);
}

function wibPartsToIso(year, month, day, hour = 0, minute = 0, second = 0) {
  return new Date(Date.UTC(year, month, day, hour, minute, second) - WIB_OFFSET_MS).toISOString();
}

export function getDayBoundsWib() {
  const now = wibNow();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  return {
    startISO: wibPartsToIso(y, m, d, 0, 0, 0),
    endISO: wibPartsToIso(y, m, d, 23, 59, 59),
  };
}

// minggu kalender Senin-Minggu, biar konsisten sama versi Google Apps Script sebelumnya
export function getWeekBoundsWib() {
  const now = wibNow();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const dayOfWeek = now.getUTCDay() || 7; // Senin=1 ... Minggu=7
  const monday = d - dayOfWeek + 1;
  return {
    startISO: wibPartsToIso(y, m, monday, 0, 0, 0),
    endISO: wibPartsToIso(y, m, monday + 6, 23, 59, 59),
  };
}

export function getMonthBoundsWib() {
  const now = wibNow();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  return {
    startISO: wibPartsToIso(y, m, 1, 0, 0, 0),
    endISO: wibPartsToIso(y, m + 1, 0, 23, 59, 59), // tanggal 0 bulan depan = akhir bulan ini
  };
}

export async function getLastExpenseLog(phone) {
  const { data, error } = await supabase
    .from("expense_logs")
    .select("*")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getLastBalance(phone) {
  const last = await getLastExpenseLog(phone);
  return last ? Number(last.balance_after) || 0 : 0;
}

// hitung running balance tiap item di JS, insert semua sekaligus (1 query,
// bukan 2xN query kayak nyimpen satu-satu bergantian)
export async function saveExpenseLogsBatch(phone, dtos) {
  let balance = await getLastBalance(phone);
  const rows = dtos.map((dto) => {
    balance = dto.type === "Income" ? balance + dto.amount : balance - dto.amount;
    return {
      phone,
      description: dto.description,
      category: dto.category,
      amount: dto.amount,
      type: dto.type,
      balance_after: balance,
      image_url: dto.imageUrl || null,
    };
  });

  const { error } = await supabase.from("expense_logs").insert(rows);
  if (error) throw error;

  return { balanceAfter: balance };
}

export async function deleteLastExpenseLog(phone) {
  const last = await getLastExpenseLog(phone);
  if (!last) return null;

  const { error } = await supabase.from("expense_logs").delete().eq("id", last.id);
  if (error) throw error;

  return { description: last.description, amount: last.amount, category: last.category };
}

export async function updateLastCategory(phone, newCategory) {
  const last = await getLastExpenseLog(phone);
  if (!last) return null;

  const { error } = await supabase
    .from("expense_logs")
    .update({ category: newCategory })
    .eq("id", last.id);
  if (error) throw error;

  return last.description;
}

export async function getAggregatedExpenses(phone, startISO, endISO) {
  const { data, error } = await supabase
    .from("expense_logs")
    .select("amount, category")
    .eq("phone", phone)
    .eq("type", "Expense")
    .gte("created_at", startISO)
    .lte("created_at", endISO);
  if (error) throw error;

  const categories = {};
  let total = 0;
  for (const row of data) {
    const amount = Number(row.amount) || 0;
    total += amount;
    categories[row.category] = (categories[row.category] || 0) + amount;
  }
  return { total, categories };
}

export async function getWeekExpenseLogs(phone) {
  const { startISO, endISO } = getWeekBoundsWib();
  const { data, error } = await supabase
    .from("expense_logs")
    .select("amount, category, created_at")
    .eq("phone", phone)
    .eq("type", "Expense")
    .gte("created_at", startISO)
    .lte("created_at", endISO);
  if (error) throw error;
  return data;
}

export async function getRecentExpenseLogs(phone, limit = 20) {
  const { data, error } = await supabase
    .from("expense_logs")
    .select("description, category, amount, type, balance_after, created_at")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function searchExpenseLogs(phone, keyword, limit = 10) {
  const { data, error } = await supabase
    .from("expense_logs")
    .select("description, category, amount, created_at")
    .eq("phone", phone)
    .eq("type", "Expense")
    .ilike("description", `%${keyword}%`)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getWeeklyBudget(phone) {
  const { data, error } = await supabase
    .from("expense_settings")
    .select("weekly_budget")
    .eq("phone", phone)
    .maybeSingle();
  if (error) throw error;
  return Number(data?.weekly_budget) || 0;
}

export async function setWeeklyBudget(phone, amount) {
  const { error } = await supabase
    .from("expense_settings")
    .upsert({ phone, weekly_budget: amount, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// total topup (transfer ke GoPay) dalam rentang tanggal - dipakai Vault buat ngitung berapa
// dari monthly pool yang udah dialokasikan ke spending mingguan bulan ini
export async function getTopupTotal(phone, startISO, endISO) {
  const { data, error } = await supabase
    .from("expense_logs")
    .select("amount")
    .eq("phone", phone)
    .eq("type", "Income")
    .eq("category", "Topup")
    .gte("created_at", startISO)
    .lte("created_at", endISO);
  if (error) throw error;
  return data.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
}
