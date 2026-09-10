import express from "express";
import multer from "multer";
import { TelegramClient } from "../shared/telegram.js";
import { analyzeReceiptImage } from "./gemini.js";
import { detectCategory } from "./categorize.js";
import { parseExpenseInputs } from "./parse.js";
import { requireAuth } from "../shared/auth.js";
import { getAllowedChatIds } from "../shared/users.js";
import { renderSpendingDashboard } from "./dashboard.js";
import {
  saveExpenseLogsBatch,
  uploadReceiptImage,
  getLastBalance,
  deleteLastExpenseLog,
  updateLastCategory,
  getAggregatedExpenses,
  setWeeklyBudget,
  getWeeklyBudget,
  searchExpenseLogs,
  getRecentExpenseLogs,
  getWeekExpenseLogs,
  getDayBoundsWib,
  getWeekBoundsWib,
  getMonthBoundsWib,
} from "./supabase.js";

const { sendText, editText, answerCallbackQuery, setMyCommands, downloadPhoto } =
  new TelegramClient(process.env.TELEGRAM_BOT_TOKEN_SPENDING);

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

// jaga-jaga kalau Telegram retry webhook pas server baru bangun dari cold start
// (Render free tier), biar nggak keproses dua kali jadi transaksi dobel
const processedUpdateIds = new Map();
const UPDATE_ID_TTL_MS = 6 * 60 * 60 * 1000;

function isDuplicateUpdate(updateId) {
  if (updateId == null) return false;
  const now = Date.now();
  for (const [id, expiresAt] of processedUpdateIds) {
    if (expiresAt < now) processedUpdateIds.delete(id);
  }
  if (processedUpdateIds.has(updateId)) return true;
  processedUpdateIds.set(updateId, now + UPDATE_ID_TTL_MS);
  return false;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatRupiah(amount) {
  return `Rp${Math.round(amount).toLocaleString("id-ID")}`;
}

function formatDateLabelWib(isoString) {
  const wib = new Date(new Date(isoString).getTime() + 7 * 60 * 60 * 1000);
  return `${wib.getUTCDate()} ${BULAN[wib.getUTCMonth()]}`;
}

function toWibDateKey(isoString) {
  const wib = new Date(new Date(isoString).getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 10);
}

function formatWibLabelFromKey(dateKey) {
  const d = new Date(`${dateKey}T00:00:00Z`);
  return `${d.getUTCDate()} ${BULAN[d.getUTCMonth()]}`;
}

// Senin=1 ... Minggu=7, sama kayak convention di getWeekBoundsWib (spending/supabase.js)
function wibDayOfWeek() {
  const wibNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return wibNow.getUTCDay() || 7;
}

// nunggu jawaban nominal kalau user cuma kirim nama barang tanpa harga (mis. "kopi")
const pendingDescriptions = new Map();
function setPendingDescription(chatId, desc) {
  pendingDescriptions.set(chatId, { desc, expiresAt: Date.now() + 5 * 60 * 1000 });
}
function takePendingDescription(chatId) {
  const entry = pendingDescriptions.get(chatId);
  if (!entry) return null;
  pendingDescriptions.delete(chatId);
  return entry.expiresAt >= Date.now() ? entry.desc : null;
}

// 12 kategori (disederhanakan dari versi awal yang punya 23 kategori)
const CATEGORY_KEYBOARD = [
  [{ text: "↩️ Undo", callback_data: "undo" }],
  [
    { text: "🍜 Food", callback_data: "cat_Food" },
    { text: "☕ Coffee", callback_data: "cat_Coffee" },
    { text: "🥤 Drink", callback_data: "cat_Drink" },
  ],
  [
    { text: "🛒 Groceries", callback_data: "cat_Groceries" },
    { text: "🚗 Transport", callback_data: "cat_Transport" },
    { text: "🛍️ Shopping", callback_data: "cat_Shopping" },
  ],
  [
    { text: "📱 Bills", callback_data: "cat_Bills" },
    { text: "🏥 Health", callback_data: "cat_Health" },
    { text: "🎮 Entertainment", callback_data: "cat_Entertainment" },
  ],
  [
    { text: "🎁 Social", callback_data: "cat_Social" },
    { text: "🐱 Pets", callback_data: "cat_Pets" },
    { text: "📦 Other", callback_data: "cat_Other" },
  ],
  [{ text: "❌ Tutup", callback_data: "dismiss" }],
];

async function reportText(chatId, period) {
  const bounds =
    period === "today"
      ? getDayBoundsWib()
      : period === "week"
        ? getWeekBoundsWib()
        : getMonthBoundsWib();

  const [{ total, categories }, balance] = await Promise.all([
    getAggregatedExpenses(chatId, bounds.startISO, bounds.endISO),
    getLastBalance(chatId),
  ]);

  const rangeLabel = `${formatDateLabelWib(bounds.startISO)} - ${formatDateLabelWib(bounds.endISO)}`;
  let text = `📊 <b>Report: ${period.toUpperCase()}</b>\n📅 ${rangeLabel}\n\n`;
  text += `Total Pengeluaran: <b>${formatRupiah(total)}</b>\n\n`;

  const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) {
    text += `Breakdown Kategori:\n`;
    text += sorted.map(([cat, amt]) => `  ├ ${escapeHtml(cat)}: ${formatRupiah(amt)}`).join("\n");
    text += "\n\n";
  }
  text += `💳 <b>Current Balance: ${formatRupiah(balance)}</b>`;
  return text;
}

async function budgetText(chatId) {
  const weekBounds = getWeekBoundsWib();
  const [budget, { total: spent }] = await Promise.all([
    getWeeklyBudget(chatId),
    getAggregatedExpenses(chatId, weekBounds.startISO, weekBounds.endISO),
  ]);

  if (!budget) {
    return `💰 Belum ada budget mingguan.\nSet dengan kirim <code>topup 500k</code>.`;
  }

  const remaining = budget - spent;
  const remainingLine =
    remaining >= 0
      ? `Sisa: <b>${formatRupiah(remaining)}</b>`
      : `Lebih: <b>${formatRupiah(Math.abs(remaining))}</b>`;

  return (
    `💰 <b>Budget Mingguan</b>\n` +
    `Budget: ${formatRupiah(budget)}\n` +
    `Terpakai: ${formatRupiah(spent)}\n` +
    `${remainingLine}`
  );
}

async function handleSearch(chatId, keyword) {
  const rows = await searchExpenseLogs(chatId, keyword);
  if (rows.length === 0) {
    await sendText(chatId, `🔍 Nggak ketemu transaksi dengan kata "${escapeHtml(keyword)}".`);
    return;
  }

  const lines = rows.map(
    (r) =>
      `${formatDateLabelWib(r.created_at)} — ${escapeHtml(r.description)} (${escapeHtml(r.category)}): ${formatRupiah(r.amount)}`
  );
  const total = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  await sendText(
    chatId,
    `🔍 <b>Hasil cari "${escapeHtml(keyword)}"</b>\n${lines.join("\n")}\n\nTotal: ${formatRupiah(total)}`
  );
}

async function saveDtosAndReport(chatId, dtos) {
  const { balanceAfter } = await saveExpenseLogsBatch(chatId, dtos);

  const weekBounds = getWeekBoundsWib();
  const { total: weeklyTotal } = await getAggregatedExpenses(
    chatId,
    weekBounds.startISO,
    weekBounds.endISO
  );

  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const nowStr =
    `${String(now.getUTCHours()).padStart(2, "0")}:` +
    `${String(now.getUTCMinutes()).padStart(2, "0")}:` +
    `${String(now.getUTCSeconds()).padStart(2, "0")}`;

  let reply = `✅ <b>Tersimpan!</b> (🕒 ${nowStr})\n\n`;
  for (const d of dtos) {
    reply += `📝 ${escapeHtml(d.description)}\n📂 ${escapeHtml(d.category)}\n💰 <b>${formatRupiah(d.amount)}</b>\n\n`;
  }

  reply += `📉 Spent this week: ${formatRupiah(weeklyTotal)}\n`;
  reply += `💳 <b>Running Balance: ${formatRupiah(balanceAfter)}</b>\n`;

  await sendText(chatId, reply, CATEGORY_KEYBOARD);
}

async function handleSpend(chatId, text) {
  const dtos = parseExpenseInputs(text);
  if (dtos.length === 0) {
    await sendText(chatId, "❌ Format tidak valid.");
    return;
  }
  await saveDtosAndReport(chatId, dtos);
}

async function handleReceipt(chatId, { amount, description, imageUrl }) {
  const dto = {
    amount,
    description,
    category: detectCategory(description),
    type: "Expense",
    imageUrl,
  };
  await saveDtosAndReport(chatId, [dto]);
}

async function handleTopup(chatId, normalizedText) {
  const match = normalizedText.match(/^topup\s+([0-9.,kK]+)$/i);
  if (!match) {
    await sendText(chatId, "❌ Format tidak valid.\nContoh: <code>topup 500k</code>");
    return;
  }

  let amountStr = match[1].toLowerCase();
  const isK = amountStr.endsWith("k");
  if (isK) amountStr = amountStr.slice(0, -1);
  let amount = parseInt(amountStr.replace(/[.,]/g, ""), 10);
  if (isNaN(amount) || amount < 0) {
    await sendText(chatId, "❌ Nominal tidak valid.");
    return;
  }
  if (isK) amount *= 1000;

  const currentBudget = await getWeeklyBudget(chatId);
  const newBudget = currentBudget + amount;
  await setWeeklyBudget(chatId, newBudget);
  const { balanceAfter } = await saveExpenseLogsBatch(chatId, [
    { description: "Weekly Topup", category: "Topup", amount, type: "Income" },
  ]);

  await sendText(
    chatId,
    `🔄 <b>Budget & Balance Updated!</b>\n\n💰 Topup: ${formatRupiah(amount)}\n` +
      `💳 <b>New Balance: ${formatRupiah(balanceAfter)}</b>\n\n` +
      `(Target budget mingguan sekarang ${formatRupiah(newBudget)})`
  );
}

async function handleUndo(chatId) {
  const deleted = await deleteLastExpenseLog(chatId);
  if (!deleted) {
    await sendText(chatId, "⚠️ Data kosong.");
    return;
  }
  await sendText(
    chatId,
    `↩️ Dibatalkan:\n${escapeHtml(deleted.description)}\n${formatRupiah(deleted.amount)}`
  );
}

async function handleStart(chatId) {
  await sendText(
    chatId,
    "👋 <b>Halo! Kirimkan pengeluaran harian kamu</b>\n\n" +
      "Input format fleksibel:\n" +
      "<code>makan siang 50k, 2k parkir</code>\n\n" +
      "Bisa juga satu transaksi:\n" +
      "<code>kopi 25k</code>\n\n" +
      "Atau nama dulu:\n" +
      "<code>kopi</code>\n" +
      "kemudian bot akan tanya nominalnya.\n\n" +
      "Kirim foto struk juga bisa, bot bakal baca total & catat otomatis.\n\n" +
      "Command lain:\n" +
      "/today — rekap hari ini\n" +
      "/week — rekap minggu ini\n" +
      "/month — rekap bulan ini\n" +
      "/budget — cek budget mingguan & sisa\n" +
      "<code>cari kopi</code> — cari transaksi berdasarkan deskripsi\n" +
      "/undo — hapus transaksi terakhir\n" +
      "/topup 500k — set/update budget mingguan"
  );
}

async function handleCallback(chatId, cb) {
  const messageId = cb.message.message_id;
  const data = cb.data;

  await answerCallbackQuery(cb.id).catch(() => {});

  if (data === "dismiss") {
    await editText(chatId, messageId, escapeHtml(cb.message.text));
    return;
  }

  if (data === "undo") {
    const deleted = await deleteLastExpenseLog(chatId);
    if (deleted) {
      await editText(
        chatId,
        messageId,
        `↩️ <b>Dibatalkan:</b>\n${escapeHtml(deleted.description)}\n${formatRupiah(deleted.amount)}`
      );
    }
    return;
  }

  if (data.startsWith("cat_")) {
    const newCategory = data.slice(4);
    const description = await updateLastCategory(chatId, newCategory);
    if (description) {
      await editText(
        chatId,
        messageId,
        `${escapeHtml(cb.message.text)}\n\n✅ Dikoreksi menjadi kategori ${escapeHtml(newCategory)}`
      );
    }
  }
}

async function processMessage(chatId, rawText) {
  const text = rawText.trim();
  // dukung command lewat menu "/" Telegram atau diketik langsung
  const normalized = text.replace(/^\//, "").trim();
  const firstWord = (normalized.split(/\s+/)[0] || "").toLowerCase();

  if (firstWord === "start") return handleStart(chatId);
  if (firstWord === "today") return sendText(chatId, await reportText(chatId, "today"));
  if (firstWord === "week") return sendText(chatId, await reportText(chatId, "week"));
  if (firstWord === "month") return sendText(chatId, await reportText(chatId, "month"));
  if (firstWord === "undo") return handleUndo(chatId);
  if (firstWord === "topup") return handleTopup(chatId, normalized);
  if (firstWord === "budget") return sendText(chatId, await budgetText(chatId));

  if (firstWord === "cari") {
    const keyword = normalized.replace(/^cari\s*/i, "").trim();
    if (!keyword) {
      await sendText(chatId, "Contoh: <code>cari kopi</code>");
      return;
    }
    return handleSearch(chatId, keyword);
  }

  if (/^[0-9.,kK]+$/.test(normalized)) {
    const pending = takePendingDescription(chatId);
    if (pending) return handleSpend(chatId, `${pending} ${normalized}`);
    return handleSpend(chatId, normalized);
  }

  if (!/\d/.test(normalized)) {
    setPendingDescription(chatId, normalized);
    await sendText(
      chatId,
      `Berapa harga untuk "${escapeHtml(normalized)}"?\n<i>(Ketik angkanya aja, misal: 25k)</i>`
    );
    return;
  }

  return handleSpend(chatId, normalized);
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// pakai encodeURIComponent biar pesan error yang dinamis (isinya bisa ada ":", tanda kutip, dll)
// nggak bikin query string-nya rusak
function redirectWithError(res, path, message) {
  res.redirect(`${path}?err=${encodeURIComponent(message)}`);
}

export const router = express.Router();

router.get("/dashboard/spending", requireAuth, async (req, res) => {
  try {
    const chatId = req.user.phone;
    const dayBounds = getDayBoundsWib();
    const weekBounds = getWeekBoundsWib();
    const monthBounds = getMonthBoundsWib();

    const [balance, weeklyBudget, today, week, month, transactions, weekLogs] = await Promise.all([
      getLastBalance(chatId),
      getWeeklyBudget(chatId),
      getAggregatedExpenses(chatId, dayBounds.startISO, dayBounds.endISO),
      getAggregatedExpenses(chatId, weekBounds.startISO, weekBounds.endISO),
      getAggregatedExpenses(chatId, monthBounds.startISO, monthBounds.endISO),
      getRecentExpenseLogs(chatId, 15),
      getWeekExpenseLogs(chatId),
    ]);

    const transactionRows = transactions
      .map(
        (r) =>
          `<tr><td class="nowrap">${formatDateLabelWib(r.created_at)}</td><td>${escapeHtml(r.description)}</td><td>${escapeHtml(r.category)}</td><td>${r.type === "Income" ? "+" : "-"}${formatRupiah(r.amount)}</td></tr>`
      )
      .join("");

    const byDay = {};
    for (const row of weekLogs) {
      const key = toWibDateKey(row.created_at);
      const categories = byDay[key] || {};
      categories[row.category] = (categories[row.category] || 0) + (Number(row.amount) || 0);
      byDay[key] = categories;
    }
    const weekChartData = Object.keys(byDay)
      .sort()
      .map((key) => ({ label: formatWibLabelFromKey(key), values: byDay[key] }));

    const flash = req.query.err
      ? { type: "error", text: req.query.err }
      : req.query.ok
        ? { type: "success", text: "Berhasil disimpan." }
        : null;

    const dayOfWeek = wibDayOfWeek(); // 1=Senin..7=Minggu
    const daysElapsedInWeek = dayOfWeek; // termasuk hari ini
    const daysLeftInWeek = 8 - dayOfWeek; // termasuk hari ini

    res.send(
      renderSpendingDashboard({
        balance,
        weeklyBudget,
        weekSpent: week.total,
        daysElapsedInWeek,
        daysLeftInWeek,
        today,
        week,
        month,
        weekChartData,
        transactionRows,
        flash,
      })
    );
  } catch (err) {
    console.error(err);
    res.status(500).send(`Gagal load dashboard: ${escapeHtml(err.message)}`);
  }
});

router.post("/dashboard/spending/expense-text", requireAuth, async (req, res) => {
  const text = (req.body.text || "").trim();
  if (!text) return res.redirect("/dashboard/spending?err=Input kosong.");

  try {
    const dtos = parseExpenseInputs(text);
    if (dtos.length === 0) return res.redirect("/dashboard/spending?err=Format tidak valid.");

    await saveExpenseLogsBatch(req.user.phone, dtos);
    res.redirect("/dashboard/spending?ok=1");
  } catch (err) {
    console.error(err);
    redirectWithError(res, "/dashboard/spending", `Gagal menyimpan pengeluaran: ${err.message}`);
  }
});

router.post(
  "/dashboard/spending/expense-photo",
  requireAuth,
  upload.single("photo"),
  async (req, res) => {
    if (!req.file) return res.redirect("/dashboard/spending?err=Foto belum dipilih.");

    try {
      const { amount, description } = await analyzeReceiptImage(req.file.buffer, req.file.mimetype);
      if (!amount || amount <= 0) {
        return res.redirect("/dashboard/spending?err=Nggak berhasil baca total di struk ini.");
      }

      const imageUrl = await uploadReceiptImage(req.user.phone, req.file.buffer, req.file.mimetype);
      const dto = {
        amount,
        description,
        category: detectCategory(description),
        type: "Expense",
        imageUrl,
      };
      await saveExpenseLogsBatch(req.user.phone, [dto]);
      res.redirect("/dashboard/spending?ok=1");
    } catch (err) {
      console.error(err);
      redirectWithError(res, "/dashboard/spending", `Gagal menganalisis struk: ${err.message}`);
    }
  }
);

router.post("/dashboard/spending/topup", requireAuth, async (req, res) => {
  const amount = parseInt(req.body.amount, 10);
  if (isNaN(amount) || amount < 0) return res.redirect("/dashboard/spending?err=Nominal tidak valid.");

  try {
    const currentBudget = await getWeeklyBudget(req.user.phone);
    await setWeeklyBudget(req.user.phone, currentBudget + amount);
    await saveExpenseLogsBatch(req.user.phone, [
      { description: "Weekly Topup", category: "Topup", amount, type: "Income" },
    ]);
    res.redirect("/dashboard/spending?ok=1");
  } catch (err) {
    console.error(err);
    redirectWithError(res, "/dashboard/spending", `Gagal update budget: ${err.message}`);
  }
});

router.post("/webhook/spending", async (req, res) => {
  res.sendStatus(200); // ack cepat, proses lanjut di belakang

  const update = req.body;
  if (!update) return;
  if (isDuplicateUpdate(update.update_id)) return;

  const chatId = update.callback_query
    ? String(update.callback_query.from.id)
    : update.message
      ? String(update.message.chat.id)
      : null;
  if (!chatId) return;

  try {
    const allowedChatIds = await getAllowedChatIds();
    if (allowedChatIds.length > 0 && !allowedChatIds.includes(chatId)) return;

    if (update.callback_query) {
      await handleCallback(chatId, update.callback_query);
      return;
    }

    const message = update.message;

    if (message.text) {
      await processMessage(chatId, message.text);
      return;
    }

    if (message.photo?.length) {
      await sendText(chatId, "🔍 Lagi baca struk, tunggu sebentar...");

      const largest = message.photo[message.photo.length - 1];
      const { buffer, mimeType } = await downloadPhoto(largest.file_id);
      const { amount, description } = await analyzeReceiptImage(buffer, mimeType);

      if (!amount || amount <= 0) {
        await sendText(
          chatId,
          "❌ Nggak berhasil baca total di struk ini, coba foto lebih jelas atau catat manual."
        );
        return;
      }

      const imageUrl = await uploadReceiptImage(chatId, buffer, mimeType);
      await handleReceipt(chatId, { amount, description, imageUrl });
    }
  } catch (err) {
    console.error(err);
    await sendText(chatId, `❌ Gagal proses pesan: ${err.message}`).catch(() => {});
  }
});

const BOT_COMMANDS = [
  { command: "start", description: "Mulai dan lihat panduan" },
  { command: "today", description: "Report pengeluaran hari ini" },
  { command: "week", description: "Report pengeluaran minggu ini" },
  { command: "month", description: "Report pengeluaran bulan ini" },
  { command: "budget", description: "Cek budget mingguan & sisa" },
  { command: "cari", description: "Cari transaksi berdasarkan deskripsi, mis. cari kopi" },
  { command: "topup", description: "Set/update budget mingguan & income" },
  { command: "undo", description: "Batalkan input terakhir" },
];

export function registerCommands() {
  return setMyCommands(BOT_COMMANDS);
}
