import express from "express";
import multer from "multer";
import { TelegramClient } from "../shared/telegram.js";
import { analyzeFoodImage, analyzeFoodText } from "./gemini.js";
import { requireAuth } from "../shared/auth.js";
import { getAllowedChatIds } from "../shared/users.js";
import { renderCalorieDashboard } from "./dashboard.js";
import {
  uploadFoodImage,
  saveFoodLog,
  getDailyTarget,
  setDailyTarget,
  getTodayCalories,
  getTodayFoodLogs,
  getLastFoodLog,
  deleteFoodLog,
  updateFoodLog,
  getWeekFoodLogs,
  getTodayMacros,
  getMacroTargets,
  setMacroTargets,
  addWeightLog,
  getLastWeight,
  getWeightHistory,
  searchFoodLogs,
} from "./supabase.js";

const { sendText, downloadPhoto, setMyCommands } = new TelegramClient(
  process.env.TELEGRAM_BOT_TOKEN_CALORIE
);

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

// jaga-jaga kalau Telegram retry webhook pas server baru bangun dari cold start
// (Render free tier), biar nggak keproses dua kali jadi log dobel
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

function toWibDateKey(isoString) {
  const wib = new Date(new Date(isoString).getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 10);
}

function toWibTime(isoString) {
  const wib = new Date(new Date(isoString).getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(11, 16);
}

function formatWibLabel(dateKey) {
  const d = new Date(`${dateKey}T00:00:00Z`);
  return `${HARI[d.getUTCDay()]} ${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

// exact substring dulu (dua arah); kalau nggak ketemu, fallback ke overlap kata
// biar "tumis sayur jamur bakso" tetap match ke item "Tumis Sayur dan Jamur"
function findItemIndex(items, query) {
  const q = query.toLowerCase().trim();

  const substringIdx = items.findIndex((it) => {
    const name = it.name.toLowerCase();
    return name.includes(q) || q.includes(name);
  });
  if (substringIdx !== -1) return substringIdx;

  const qWords = q.split(/\s+/).filter((w) => w.length > 2);
  let bestIdx = -1;
  let bestScore = 0;
  items.forEach((it, i) => {
    const nameWords = it.name.toLowerCase().split(/\s+/);
    const score = qWords.filter((w) => nameWords.some((nw) => nw.includes(w) || w.includes(nw)))
      .length;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  });
  return bestIdx;
}

function sumItems(items) {
  return items.reduce(
    (acc, it) => ({
      calories: acc.calories + (it.calories || 0),
      protein_g: acc.protein_g + (it.protein_g || 0),
      carbs_g: acc.carbs_g + (it.carbs_g || 0),
      fat_g: acc.fat_g + (it.fat_g || 0),
      sugar_g: acc.sugar_g + (it.sugar_g || 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, sugar_g: 0 }
  );
}

function formatFoodText(analysis) {
  let text = `🍽️ <b>${escapeHtml(analysis.food_name)}</b>\n\n`;
  text += `🔥 Kalori: <b>${analysis.calories} kcal</b>\n`;
  text += `🥩 Protein: ${analysis.protein_g}g\n`;
  text += `🍚 Karbo: ${analysis.carbs_g}g\n`;
  text += `🧈 Lemak: ${analysis.fat_g}g\n`;
  text += `🍬 Gula: ${analysis.sugar_g}g\n`;

  if (analysis.items?.length > 1) {
    const lines = analysis.items.map(
      (it) => `• ${escapeHtml(it.name)} (${it.weight_g}g) — ${it.calories} kcal`
    );
    text += `\n📋 Rincian:\n${lines.join("\n")}\n`;
  }

  if (analysis.notes) {
    text += `\n📝 ${escapeHtml(analysis.notes)}`;
  }

  return text;
}

async function dailySummaryText(chatId) {
  const [target, total, macroTargets, todayMacros] = await Promise.all([
    getDailyTarget(chatId),
    getTodayCalories(chatId),
    getMacroTargets(chatId),
    getTodayMacros(chatId),
  ]);

  let text;
  if (!target) {
    text = `📊 Total hari ini: <b>${total} kcal</b>\n(Belum ada target harian, set dengan kirim "target 2000")`;
  } else {
    const remaining = target - total;
    const line =
      remaining >= 0
        ? `✅ Sisa: <b>${remaining} kcal</b>`
        : `⚠️ Kelebihan: <b>${Math.abs(remaining)} kcal</b>`;
    text = `📊 Total hari ini: <b>${total}</b> / ${target} kcal\n${line}`;
  }

  const hasMacroTarget =
    macroTargets.protein_target_g ||
    macroTargets.carbs_target_g ||
    macroTargets.fat_target_g ||
    macroTargets.sugar_target_g;
  if (hasMacroTarget) {
    const p = `${todayMacros.protein_g}${macroTargets.protein_target_g ? ` / ${macroTargets.protein_target_g}` : ""}g`;
    const c = `${todayMacros.carbs_g}${macroTargets.carbs_target_g ? ` / ${macroTargets.carbs_target_g}` : ""}g`;
    const f = `${todayMacros.fat_g}${macroTargets.fat_target_g ? ` / ${macroTargets.fat_target_g}` : ""}g`;
    const s = `${todayMacros.sugar_g}${macroTargets.sugar_target_g ? ` / ${macroTargets.sugar_target_g}` : ""}g`;
    text += `\n\n🥩 Protein: ${p}\n🍚 Karbo: ${c}\n🧈 Lemak: ${f}\n🍬 Gula: ${s}`;
  }

  return text;
}

function macroLine(label, emoji, current, targetVal) {
  if (!targetVal) return `${emoji} ${label}: ${current}g`;
  const remaining = Math.round((targetVal - current) * 10) / 10;
  const pct = Math.round((current / targetVal) * 100);
  const status = remaining >= 0 ? `sisa ${remaining}g` : `lebih ${Math.abs(remaining)}g`;
  return `${emoji} ${label}: ${current}g / ${targetVal}g (${pct}%, ${status})`;
}

async function macroSummaryText(chatId) {
  const [macroTargets, todayMacros] = await Promise.all([
    getMacroTargets(chatId),
    getTodayMacros(chatId),
  ]);

  const hasMacroTarget =
    macroTargets.protein_target_g ||
    macroTargets.carbs_target_g ||
    macroTargets.fat_target_g ||
    macroTargets.sugar_target_g;

  if (!hasMacroTarget) {
    return (
      `🥗 <b>Makro hari ini</b>\n` +
      `🥩 Protein: ${todayMacros.protein_g}g\n` +
      `🍚 Karbo: ${todayMacros.carbs_g}g\n` +
      `🧈 Lemak: ${todayMacros.fat_g}g\n` +
      `🍬 Gula: ${todayMacros.sugar_g}g\n\n` +
      `(Belum ada target makro, set dengan kirim "target makro 150 200 60 30", gula opsional)`
    );
  }

  const lines = [
    macroLine("Protein", "🥩", todayMacros.protein_g, macroTargets.protein_target_g),
    macroLine("Karbo", "🍚", todayMacros.carbs_g, macroTargets.carbs_target_g),
    macroLine("Lemak", "🧈", todayMacros.fat_g, macroTargets.fat_target_g),
    macroLine("Gula", "🍬", todayMacros.sugar_g, macroTargets.sugar_target_g),
  ];

  return `🥗 <b>Makro hari ini</b>\n${lines.join("\n")}`;
}

async function todayHistoryText(chatId) {
  const rows = await getTodayFoodLogs(chatId);
  if (rows.length === 0) return "📋 Belum ada log hari ini.";

  const lines = rows.map(
    (row) => `🕐 ${toWibTime(row.created_at)} — ${escapeHtml(row.food_name)}: ${row.calories} kcal`
  );
  const total = rows.reduce((sum, row) => sum + (row.calories || 0), 0);
  return `📋 <b>Riwayat hari ini</b>\n${lines.join("\n")}\n\nTotal: <b>${total} kcal</b>`;
}

async function weeklySummaryText(chatId) {
  const rows = await getWeekFoodLogs(chatId);
  if (rows.length === 0) return "📅 Belum ada log minggu ini.";

  const byDay = {};
  for (const row of rows) {
    const key = toWibDateKey(row.created_at);
    byDay[key] = (byDay[key] || 0) + (row.calories || 0);
  }

  const days = Object.keys(byDay).sort();
  const lines = days.map((key) => `${formatWibLabel(key)}: ${byDay[key]} kcal`);
  const total = days.reduce((sum, key) => sum + byDay[key], 0);
  const avg = Math.round(total / days.length);

  return `📅 <b>Rekap 7 hari terakhir</b>\n${lines.join("\n")}\n\n📈 Rata-rata: <b>${avg} kcal</b>/hari`;
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// pakai encodeURIComponent biar pesan error yang dinamis (isinya bisa ada ":", tanda kutip, dll)
// nggak bikin query string-nya rusak
function redirectWithError(res, path, message) {
  res.redirect(`${path}?err=${encodeURIComponent(message)}`);
}

export const router = express.Router();

router.get("/dashboard/calorie", requireAuth, async (req, res) => {
  try {
    const chatId = req.user.phone;
    const [target, total, macroTargets, todayMacros, todayLogs, weekLogs, weightHistory] =
      await Promise.all([
        getDailyTarget(chatId),
        getTodayCalories(chatId),
        getMacroTargets(chatId),
        getTodayMacros(chatId),
        getTodayFoodLogs(chatId),
        getWeekFoodLogs(chatId),
        getWeightHistory(chatId, 10),
      ]);

    const todayLogRows = todayLogs
      .map(
        (r) =>
          `<tr><td>${toWibTime(r.created_at)}</td><td>${escapeHtml(r.food_name)}</td><td>${r.calories} kcal</td></tr>`
      )
      .join("");

    const byDay = {};
    const byDayMacroKcal = {};
    for (const row of weekLogs) {
      const key = toWibDateKey(row.created_at);
      byDay[key] = (byDay[key] || 0) + (row.calories || 0);

      const macros = byDayMacroKcal[key] || { protein: 0, carbs: 0, fat: 0 };
      macros.protein += (row.protein_g || 0) * 4;
      macros.carbs += (row.carbs_g || 0) * 4;
      macros.fat += (row.fat_g || 0) * 9;
      byDayMacroKcal[key] = macros;
    }
    const sortedDayKeys = Object.keys(byDay).sort();
    const weekRows = sortedDayKeys
      .map((key) => `<tr><td>${formatWibLabel(key)}</td><td>${byDay[key]} kcal</td></tr>`)
      .join("");
    const weekChartData = sortedDayKeys.map((key) => ({
      label: formatWibLabel(key),
      values: {
        protein: Math.round(byDayMacroKcal[key].protein),
        carbs: Math.round(byDayMacroKcal[key].carbs),
        fat: Math.round(byDayMacroKcal[key].fat),
      },
    }));

    const weightRows = weightHistory
      .map(
        (r) =>
          `<tr><td>${formatWibLabel(toWibDateKey(r.created_at))}</td><td>${r.weight_kg} kg</td></tr>`
      )
      .join("");

    const flash = req.query.err
      ? { type: "error", text: req.query.err }
      : req.query.ok
        ? { type: "success", text: "Berhasil disimpan." }
        : null;

    res.send(
      renderCalorieDashboard({
        target,
        total,
        macroTargets,
        todayMacros,
        todayLogRows,
        weekRows,
        weekChartData,
        weightRows,
        flash,
      })
    );
  } catch (err) {
    console.error(err);
    res.status(500).send(`Gagal load dashboard: ${escapeHtml(err.message)}`);
  }
});

router.post("/dashboard/calorie/food-text", requireAuth, async (req, res) => {
  const description = (req.body.description || "").trim();
  if (!description) return res.redirect("/dashboard/calorie?err=Deskripsi kosong.");

  try {
    const analysis = await analyzeFoodText(description);
    await saveFoodLog({ phone: req.user.phone, analysis, imageUrl: null });
    res.redirect("/dashboard/calorie?ok=1");
  } catch (err) {
    console.error(err);
    redirectWithError(res, "/dashboard/calorie", `Gagal menganalisis makanan: ${err.message}`);
  }
});

router.post(
  "/dashboard/calorie/food-photo",
  requireAuth,
  upload.single("photo"),
  async (req, res) => {
    if (!req.file) return res.redirect("/dashboard/calorie?err=Foto belum dipilih.");

    try {
      const analysis = await analyzeFoodImage(req.file.buffer, req.file.mimetype);
      const imageUrl = await uploadFoodImage(req.user.phone, req.file.buffer, req.file.mimetype);
      await saveFoodLog({ phone: req.user.phone, analysis, imageUrl });
      res.redirect("/dashboard/calorie?ok=1");
    } catch (err) {
      console.error(err);
      redirectWithError(res, "/dashboard/calorie", `Gagal menganalisis foto: ${err.message}`);
    }
  }
);

router.post("/dashboard/calorie/weight", requireAuth, async (req, res) => {
  const weight = parseFloat(String(req.body.weight || "").replace(",", "."));
  if (isNaN(weight) || weight <= 0) return res.redirect("/dashboard/calorie?err=Berat tidak valid.");

  try {
    await addWeightLog(req.user.phone, weight);
    res.redirect("/dashboard/calorie?ok=1");
  } catch (err) {
    console.error(err);
    redirectWithError(res, "/dashboard/calorie", `Gagal menyimpan berat badan: ${err.message}`);
  }
});

router.post("/dashboard/calorie/target", requireAuth, async (req, res) => {
  const target = parseInt(req.body.target, 10);
  if (isNaN(target) || target <= 0) return res.redirect("/dashboard/calorie?err=Target tidak valid.");

  try {
    await setDailyTarget(req.user.phone, target);
    res.redirect("/dashboard/calorie?ok=1");
  } catch (err) {
    console.error(err);
    redirectWithError(res, "/dashboard/calorie", `Gagal set target kalori: ${err.message}`);
  }
});

router.post("/dashboard/calorie/target-macro", requireAuth, async (req, res) => {
  const protein = parseFloat(req.body.protein);
  const carbs = parseFloat(req.body.carbs);
  const fat = parseFloat(req.body.fat);
  if ([protein, carbs, fat].some((v) => isNaN(v) || v < 0)) {
    return res.redirect("/dashboard/calorie?err=Target makro tidak valid.");
  }

  // gula opsional - form-nya nggak wajib diisi
  const sugarRaw = (req.body.sugar || "").trim();
  const sugar = sugarRaw ? parseFloat(sugarRaw) : null;
  if (sugar != null && (isNaN(sugar) || sugar < 0)) {
    return res.redirect("/dashboard/calorie?err=Target gula tidak valid.");
  }

  try {
    const macros = { protein_target_g: protein, carbs_target_g: carbs, fat_target_g: fat };
    if (sugar != null) macros.sugar_target_g = sugar;
    await setMacroTargets(req.user.phone, macros);
    res.redirect("/dashboard/calorie?ok=1");
  } catch (err) {
    console.error(err);
    redirectWithError(res, "/dashboard/calorie", `Gagal set target makro: ${err.message}`);
  }
});

router.post("/webhook/calorie", async (req, res) => {
  res.sendStatus(200); // ack cepat, proses lanjut di belakang

  if (isDuplicateUpdate(req.body?.update_id)) return;

  const message = req.body?.message;
  if (!message) return;

  const chatId = String(message.chat.id);

  try {
    const allowedChatIds = await getAllowedChatIds();
    if (allowedChatIds.length > 0 && !allowedChatIds.includes(chatId)) return;

    if (message.text) {
      // dukung command lewat menu "/" Telegram (mis. "/target 2000") atau diketik langsung ("target 2000")
      const text = message.text.trim().replace(/^\//, "");

      if (/^start$/i.test(text)) {
        await sendText(
          chatId,
          "✅ Bot aktif dan siap dipakai!\n\n" +
            "Kirim foto makanan buat mulai tracking.\n\n" +
            "Command lain:\n" +
            "/today — rekap & sisa kalori hari ini\n" +
            "/week — rekap 7 hari terakhir\n" +
            "/makro — cek makro (protein/karbo/lemak) hari ini\n" +
            '<code>makan nasi goreng 1 porsi</code> — catat makanan via teks (tanpa foto)\n' +
            '<code>target 2000</code> — set/update target kalori harian\n' +
            '<code>target makro 150 200 60 30</code> — set target protein/karbo/lemak/gula (g), gula opsional\n' +
            '<code>bb 65.5</code> — catat berat badan\n' +
            '<code>riwayat bb</code> — riwayat berat badan\n' +
            '<code>cari nasi goreng</code> — cari log berdasarkan nama makanan\n' +
            '<code>hapus terakhir</code> — hapus log paling baru\n' +
            '<code>edit nasi 120gr</code> — koreksi berat satu item\n' +
            '<code>edit nasi 120kcal</code> — koreksi kalori satu item langsung\n' +
            '<code>edit nasi 120gr, ayam 100gr</code> — koreksi banyak item sekaligus'
        );
        return;
      }

      if (/^today$/i.test(text)) {
        const [history, summary] = await Promise.all([
          todayHistoryText(chatId),
          dailySummaryText(chatId),
        ]);
        await sendText(chatId, `${history}\n\n${summary}`);
        return;
      }

      if (/^week$/i.test(text)) {
        await sendText(chatId, await weeklySummaryText(chatId));
        return;
      }

      if (/^makro$/i.test(text)) {
        await sendText(chatId, await macroSummaryText(chatId));
        return;
      }

      const makanMatch = text.match(/^makan\s+(.+)$/i);
      if (makanMatch) {
        const description = makanMatch[1].trim();
        await sendText(chatId, "🔍 Lagi dianalisis, tunggu sebentar...");

        const analysis = await analyzeFoodText(description);
        await saveFoodLog({ phone: chatId, analysis, imageUrl: null });

        const summary = await dailySummaryText(chatId);
        await sendText(chatId, `${formatFoodText(analysis)}\n\n${summary}`);
        return;
      }

      const macroTargetMatch = text.match(
        /^target\s+makro\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)(?:\s+(\d+(?:\.\d+)?))?$/i
      );
      if (macroTargetMatch) {
        const [, p, c, f, s] = macroTargetMatch;
        const macros = {
          protein_target_g: parseFloat(p),
          carbs_target_g: parseFloat(c),
          fat_target_g: parseFloat(f),
        };
        if (s != null) macros.sugar_target_g = parseFloat(s);
        await setMacroTargets(chatId, macros);
        await sendText(
          chatId,
          `✅ Target makro di-set: Protein ${p}g, Karbo ${c}g, Lemak ${f}g${s != null ? `, Gula ${s}g` : ""}`
        );
        return;
      }

      const targetMatch = text.match(/^target\s+(\d+)/i);
      if (targetMatch) {
        const target = parseInt(targetMatch[1], 10);
        const existing = await getDailyTarget(chatId);
        await setDailyTarget(chatId, target);

        const message = existing
          ? `✅ Target harian diupdate: ${existing} → <b>${target} kcal</b>`
          : `✅ Oke, target harian di-set <b>${target} kcal</b>.`;
        await sendText(chatId, message);
        return;
      }

      if (/^sisa$/i.test(text)) {
        await sendText(chatId, await dailySummaryText(chatId));
        return;
      }

      if (/^riwayat$/i.test(text)) {
        await sendText(chatId, await todayHistoryText(chatId));
        return;
      }

      const bbMatch = text.match(/^bb\s+(\d+(?:[.,]\d+)?)$/i);
      if (bbMatch) {
        const weight = parseFloat(bbMatch[1].replace(",", "."));
        const previous = await getLastWeight(chatId);
        await addWeightLog(chatId, weight);

        let msg = `⚖️ Berat badan dicatat: <b>${weight} kg</b>`;
        if (previous) {
          const diff = Math.round((weight - previous.weight_kg) * 10) / 10;
          const arrow = diff > 0 ? `📈 +${diff}kg` : diff < 0 ? `📉 ${diff}kg` : "➡️ tetap";
          msg += ` (${arrow} dari terakhir)`;
        }
        await sendText(chatId, msg);
        return;
      }

      if (/^riwayat\s*bb$/i.test(text)) {
        const rows = await getWeightHistory(chatId, 10);
        if (rows.length === 0) {
          await sendText(chatId, 'Belum ada catatan berat badan. Kirim <code>bb 65.5</code> buat mulai.');
          return;
        }
        const lines = rows.map(
          (r) => `${formatWibLabel(toWibDateKey(r.created_at))}: ${r.weight_kg} kg`
        );
        await sendText(chatId, `⚖️ <b>Riwayat berat badan</b>\n${lines.join("\n")}`);
        return;
      }

      const cariMatch = text.match(/^cari\s+(.+)$/i);
      if (cariMatch) {
        const keyword = cariMatch[1].trim();
        const rows = await searchFoodLogs(chatId, keyword);
        if (rows.length === 0) {
          await sendText(chatId, `🔍 Nggak ketemu log dengan kata "${escapeHtml(keyword)}".`);
          return;
        }
        const lines = rows.map(
          (r) =>
            `${formatWibLabel(toWibDateKey(r.created_at))} ${toWibTime(r.created_at)} — ${escapeHtml(r.food_name)}: ${r.calories} kcal`
        );
        const avg = Math.round(rows.reduce((sum, r) => sum + (r.calories || 0), 0) / rows.length);
        await sendText(
          chatId,
          `🔍 <b>Hasil cari "${escapeHtml(keyword)}"</b>\n${lines.join("\n")}\n\nRata-rata: ${avg} kcal`
        );
        return;
      }

      if (/^rekap mingguan$/i.test(text)) {
        await sendText(chatId, await weeklySummaryText(chatId));
        return;
      }

      if (/^hapus(\s+terakhir)?$/i.test(text)) {
        const last = await getLastFoodLog(chatId);
        if (!last) {
          await sendText(chatId, "Nggak ada log buat dihapus.");
          return;
        }
        await deleteFoodLog(last.id);
        await sendText(
          chatId,
          `🗑️ Oke, log "${escapeHtml(last.food_name)}" (${last.calories} kcal) dihapus.`
        );
        return;
      }

      // "edit <angka>" — override total kalori langsung, makro ikut ke-skala proporsional
      const editTotalMatch = text.match(/^edit\s+(\d+)\s*$/i);
      if (editTotalMatch) {
        const last = await getLastFoodLog(chatId);
        if (!last) {
          await sendText(chatId, "Nggak ada log buat diedit.");
          return;
        }

        const newCalories = parseInt(editTotalMatch[1], 10);
        const ratio = last.calories ? newCalories / last.calories : 1;
        const macros = {
          calories: newCalories,
          protein_g: Math.round(last.protein_g * ratio * 10) / 10,
          carbs_g: Math.round(last.carbs_g * ratio * 10) / 10,
          fat_g: Math.round(last.fat_g * ratio * 10) / 10,
          sugar_g: Math.round((last.sugar_g || 0) * ratio * 10) / 10,
        };
        await updateFoodLog(last.id, macros);
        await sendText(
          chatId,
          `✏️ Oke, "${escapeHtml(last.food_name)}" diupdate: <b>${macros.calories} kcal</b> ` +
            `(protein ${macros.protein_g}g, karbo ${macros.carbs_g}g, lemak ${macros.fat_g}g, gula ${macros.sugar_g}g)`
        );
        return;
      }

      // "edit <item> <angka><gr|kcal>[, <item2> <angka><gr|kcal>, ...]" — koreksi satu atau
      // banyak komponen sekaligus, dipisah koma
      if (/^edit\s+/i.test(text)) {
        const body = text.replace(/^edit\s+/i, "");
        const segments = body
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        const parsedEdits = segments.map((seg) => {
          const m = seg.match(/^(.+?)\s+(\d+)\s*(gr|g|kcal|kal)$/i);
          return m
            ? { itemQuery: m[1].trim(), value: parseInt(m[2], 10), isKcal: /^k/i.test(m[3]) }
            : null;
        });

        if (parsedEdits.length === 0 || parsedEdits.some((e) => e === null)) {
          await sendText(
            chatId,
            "Format edit:\n" +
              "<code>edit nasi 120gr</code> — koreksi berat item\n" +
              "<code>edit nasi 120kcal</code> — koreksi kalori item langsung\n" +
              "<code>edit nasi 120gr, ayam 100gr</code> — banyak item sekaligus, dipisah koma\n" +
              "<code>edit 450</code> — override total kalori log"
          );
          return;
        }

        const last = await getLastFoodLog(chatId);
        if (!last) {
          await sendText(chatId, "Nggak ada log buat diedit.");
          return;
        }

        const items = last.items || [];
        const confirmLines = [];
        const notFound = [];

        for (const edit of parsedEdits) {
          const idx = findItemIndex(items, edit.itemQuery);
          if (idx === -1) {
            notFound.push(edit.itemQuery);
            continue;
          }

          const item = items[idx];
          if (edit.isKcal) {
            const ratio = item.calories ? edit.value / item.calories : 1;
            items[idx] = {
              ...item,
              calories: edit.value,
              protein_g: Math.round(item.protein_g * ratio * 10) / 10,
              carbs_g: Math.round(item.carbs_g * ratio * 10) / 10,
              fat_g: Math.round(item.fat_g * ratio * 10) / 10,
              sugar_g: Math.round((item.sugar_g || 0) * ratio * 10) / 10,
            };
            confirmLines.push(
              `"${escapeHtml(items[idx].name)}" → ${edit.value} kcal (berat tetap ${item.weight_g}g)`
            );
          } else {
            const ratio = item.weight_g ? edit.value / item.weight_g : 1;
            items[idx] = {
              ...item,
              weight_g: edit.value,
              calories: Math.round(item.calories * ratio),
              protein_g: Math.round(item.protein_g * ratio * 10) / 10,
              carbs_g: Math.round(item.carbs_g * ratio * 10) / 10,
              fat_g: Math.round(item.fat_g * ratio * 10) / 10,
              sugar_g: Math.round((item.sugar_g || 0) * ratio * 10) / 10,
            };
            confirmLines.push(
              `"${escapeHtml(items[idx].name)}" → ${edit.value}g (${items[idx].calories} kcal)`
            );
          }
        }

        if (confirmLines.length === 0) {
          const daftar = items.map((it) => it.name).join(", ") || "(kosong)";
          await sendText(chatId, `Nggak ada item yang cocok. Item di log terakhir: ${escapeHtml(daftar)}`);
          return;
        }

        const totals = sumItems(items);
        await updateFoodLog(last.id, { items, ...totals });

        let reply = `✏️ ${confirmLines.join("\n✏️ ")}`;
        if (notFound.length > 0) {
          reply += `\n\n⚠️ Nggak ketemu: ${notFound.map(escapeHtml).join(", ")}`;
        }
        reply += `\n\nTotal log sekarang: <b>${totals.calories} kcal</b>`;
        await sendText(chatId, reply);
      }
      return;
    }

    if (message.photo?.length) {
      await sendText(chatId, "🔍 Lagi dianalisis, tunggu sebentar...");

      const largest = message.photo[message.photo.length - 1];
      const { buffer, mimeType } = await downloadPhoto(largest.file_id);

      const analysis = await analyzeFoodImage(buffer, mimeType);
      const imageUrl = await uploadFoodImage(chatId, buffer, mimeType);
      await saveFoodLog({ phone: chatId, analysis, imageUrl });

      const summary = await dailySummaryText(chatId);
      await sendText(chatId, `${formatFoodText(analysis)}\n\n${summary}`);
    }
  } catch (err) {
    console.error(err);
    await sendText(chatId, `❌ Gagal proses pesan: ${err.message}`).catch(() => {});
  }
});

const BOT_COMMANDS = [
  { command: "start", description: "Mulai & lihat semua command" },
  { command: "today", description: "Rekap & sisa kalori hari ini" },
  { command: "week", description: "Rekap 7 hari terakhir" },
  { command: "makro", description: "Cek makro (protein/karbo/lemak) hari ini" },
  { command: "makan", description: "Catat makanan via teks, mis. makan nasi goreng 1 porsi" },
  { command: "target", description: "Set target kalori harian, mis. target 2000" },
  { command: "bb", description: "Catat berat badan, mis. bb 65.5" },
  { command: "riwayat", description: "Riwayat log makanan hari ini" },
  { command: "riwayatbb", description: "Riwayat berat badan" },
  { command: "cari", description: "Cari log berdasarkan nama makanan, mis. cari nasi goreng" },
  { command: "edit", description: "Koreksi log terakhir, mis. edit nasi 120gr" },
  { command: "hapus", description: "Hapus log makanan paling baru" },
];

export function registerCommands() {
  return setMyCommands(BOT_COMMANDS);
}
