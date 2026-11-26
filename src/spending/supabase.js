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

// Bedanya sama getMonthBoundsWib() - dipakai pas user pilih bulan lain lewat selector bulan di
// /dashboard/spending (bukan selalu bulan berjalan). monthKey formatnya "YYYY-MM".
export function getMonthBoundsWibFor(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  return {
    startISO: wibPartsToIso(y, m - 1, 1, 0, 0, 0),
    endISO: wibPartsToIso(y, m, 0, 23, 59, 59),
  };
}

// "YYYY-MM" buat bulan berjalan (WIB) - dipakai default value <input type="month"> kalau user
// belum milih bulan lain lewat query string.
export function currentMonthKeyWib() {
  const now = wibNow();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

// "YYYY-MM-DD" hari ini (WIB) - dipakai default value <input type="date"> di form Log Expense.
export function todayDateKeyWib() {
  const now = wibNow();
  return now.toISOString().slice(0, 10);
}

export async function getLastExpenseLog(phone) {
  const { data, error } = await supabase
    .from("expense_logs")
    .select("*")
    .eq("phone", phone)
    .order("seq", { ascending: false })
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
// `.select()` dibalikin sekalian (rows) buat caller yang butuh render item baru tanpa query lagi
// (lihat POST /hub/quick-expense) - caller lama yang cuma butuh balanceAfter nggak kepengaruh,
// cuma nambah 1 field di return value.
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
      // dto.createdAt dipakai buat "Log for a past date" (Log Expense di /dashboard/spending) -
      // kalau nggak diisi, kolom ini dilepas sama sekali biar jatuh ke default now() di DB.
      ...(dto.createdAt ? { created_at: dto.createdAt } : {}),
    };
  });

  const { data, error } = await supabase
    .from("expense_logs")
    .insert(rows)
    .select("id, description, category, amount, type, created_at");
  if (error) throw error;

  return { balanceAfter: balance, rows: data || [] };
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

  // "Belajar" dari koreksi manual ini - deskripsi transaksi yang baru aja dikoreksi disimpan
  // sebagai keyword, biar transaksi berikutnya dengan deskripsi serupa langsung kebaca bener
  // tanpa nunggu di-hardcode di categorize.js. Lihat detectCategory().
  await saveCategoryOverride(phone, last.description, newCategory);

  return last.description;
}

export async function saveCategoryOverride(phone, keyword, category) {
  const normalized = String(keyword).toLowerCase().trim().replace(/\s+/g, " ");
  if (!normalized) return;

  const { error } = await supabase
    .from("category_overrides")
    .upsert(
      { phone, keyword: normalized, category, updated_at: new Date().toISOString() },
      { onConflict: "phone,keyword" }
    );
  if (error) throw error;
}

// Koreksi kategori dari web dashboard (row mana aja di tabel Recent Transactions, bukan cuma
// transaksi terakhir kayak updateLastCategory). filter phone+id karena id-nya dikirim dari
// form web, dianggap input klien.
export async function updateExpenseLogCategory(phone, id, newCategory) {
  const { data, error } = await supabase
    .from("expense_logs")
    .update({ category: newCategory })
    .eq("phone", phone)
    .eq("id", id)
    .select("description")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  await saveCategoryOverride(phone, data.description, newCategory);
  return data.description;
}

export async function getCategoryOverrides(phone) {
  const { data, error } = await supabase
    .from("category_overrides")
    .select("keyword, category")
    .eq("phone", phone);
  if (error) throw error;
  return data || [];
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
  return { total, categories, count: data.length };
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
    .select("id, description, category, amount, type, balance_after, created_at")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// Frequent Chips (Quick Expense di /hub) - transaksi yang paling sering berulang persis dalam
// 30 hari terakhir, dikelompokkan dari kemiripan description (case-insensitive) + amount yang
// dibulatkan. Dihitung di JS (bukan SQL GROUP BY) karena datanya kecil per user & logic grouping-nya
// (normalize + round) lebih gampang dibaca di sini.
export async function getFrequentExpenses(phone, days = 30, limit = 5) {
  const sinceISO = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("expense_logs")
    .select("description, amount")
    .eq("phone", phone)
    .eq("type", "Expense")
    .gte("created_at", sinceISO);
  if (error) throw error;

  const counts = new Map();
  for (const row of data || []) {
    const amount = Math.round(Number(row.amount) || 0);
    if (!amount) continue;
    const key = `${String(row.description || "").toLowerCase().trim()}__${amount}`;
    const entry = counts.get(key) || { description: row.description, amount, count: 0 };
    entry.count++;
    counts.set(key, entry);
  }

  return [...counts.values()]
    .filter((e) => e.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Search Recent Transactions di /dashboard/spending - cari minimal 30 hari ke belakang (bukan
// cuma transaksi bulan aktif yang lagi ditampilin), cocokin ke description ATAU category.
export async function searchTransactions(phone, keyword, days = 30, limit = 50) {
  const sinceISO = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("expense_logs")
    .select("id, description, category, amount, type, created_at")
    .eq("phone", phone)
    .gte("created_at", sinceISO)
    .or(`description.ilike.%${keyword}%,category.ilike.%${keyword}%`)
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

// Dipakai bareng GET /hub, POST /hub/quick-expense, & /dashboard/spending - "remaining" dari
// getWeeklyBudget (total budget minggu ini, derived dari ledger) dikurangi yang udah kepake
// minggu ini, dibagi rata ke sisa hari (termasuk hari ini). Satu-satunya sumber formula ini biar
// /hub dan /dashboard/spending selalu nunjukkin angka Safe-to-Spend yang sama persis.
export function safeToSpendPerDayFrom(budget, spentThisWeek, now) {
  const remaining = budget - spentThisWeek;
  const dayOfWeek = now.getUTCDay() || 7; // Senin=1 ... Minggu=7
  const daysLeftInWeek = 8 - dayOfWeek; // termasuk hari ini
  return budget && remaining > 0 && daysLeftInWeek > 0 ? remaining / daysLeftInWeek : null;
}

// Weekly budget selalu diturunin langsung dari ledger (Running Balance + yang udah kepake
// minggu ini), bukan disimpan & di-rollover manual di kolom terpisah - "Weekly Topup" adalah
// satu-satunya jenis Income yang pernah di-insert (lihat handleTopup & POST .../topup), jadi
// Running Balance itu sendiri SAMA PERSIS dengan budget yang udah bener kalau di-rollover
// minggu demi minggu sejak awal - dengan derivasi ini nggak ada state anchor yang bisa basi/korup
export async function getWeeklyBudget(phone) {
  const { startISO, endISO } = getWeekBoundsWib();
  const [balance, { total: spentThisWeek }] = await Promise.all([
    getLastBalance(phone),
    getAggregatedExpenses(phone, startISO, endISO),
  ]);
  return balance + spentThisWeek;
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
