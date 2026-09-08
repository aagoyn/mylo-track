import express from "express";
import { requireAuth } from "../shared/auth.js";
import {
  getDayBoundsWib as getSpendingDayBoundsWib,
  getAggregatedExpenses,
  getRecentExpenseLogs,
} from "../spending/supabase.js";
import { getTodayCalories, getTodayMacros, getTodayFoodLogs } from "../calorie/supabase.js";
import {
  getMonthBoundsWib,
  saveMood,
  getTodayMoodLogs,
  getMoodLogsInRange,
  getMoodLogsForDate,
  getRecentMoodLogs,
} from "./supabase.js";
import { renderHubDashboard, renderMoodPage } from "./dashboard.js";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const MOOD_META = {
  terrible: { emoji: "😫", label: "Terrible" },
  bad: { emoji: "😕", label: "Bad" },
  okay: { emoji: "😐", label: "Okay" },
  good: { emoji: "🙂", label: "Good" },
  great: { emoji: "😍", label: "Great" },
};

function wibNow() {
  return new Date(Date.now() + WIB_OFFSET_MS);
}

function toWibDateKey(isoString) {
  const wib = new Date(new Date(isoString).getTime() + WIB_OFFSET_MS);
  return wib.toISOString().slice(0, 10);
}

function toWibTime(isoString) {
  const wib = new Date(new Date(isoString).getTime() + WIB_OFFSET_MS);
  return wib.toISOString().slice(11, 16);
}

function formatRupiah(amount) {
  return `Rp${Math.round(amount).toLocaleString("id-ID")}`;
}

function greetingForHour(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDateLabelEn(wibDate) {
  return `${WEEKDAYS_EN[wibDate.getUTCDay()]}, ${MONTHS_EN[wibDate.getUTCMonth()]} ${wibDate.getUTCDate()}`;
}

// day map: dateKey -> last mood log hari itu (aturan MVP: mood terakhir yang menang kalau ada >1 log)
function buildDayMap(rows) {
  const map = new Map();
  for (const row of rows) {
    map.set(toWibDateKey(row.created_at), row);
  }
  return map;
}

// current streak = jumlah hari berturut-turut mundur dari hari terakhir yang punya mood log
function computeStreak(dateKeysSet) {
  if (dateKeysSet.size === 0) return 0;
  const sorted = [...dateKeysSet].sort().reverse();
  let streak = 1;
  const cursor = new Date(`${sorted[0]}T00:00:00Z`);
  for (let i = 1; i < sorted.length; i++) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    const expectedKey = cursor.toISOString().slice(0, 10);
    if (sorted[i] === expectedKey) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export const router = express.Router();

router.get("/hub", requireAuth, async (req, res) => {
  const phone = req.user.phone;
  const now = wibNow();
  const todayKey = now.toISOString().slice(0, 10);

  const [
    spendingResult,
    calorieResult,
    moodResult,
    recentSpendingResult,
    recentCalorieResult,
    recentMoodResult,
  ] = await Promise.allSettled([
    (async () => {
      const { startISO, endISO } = getSpendingDayBoundsWib();
      return getAggregatedExpenses(phone, startISO, endISO);
    })(),
    Promise.all([getTodayCalories(phone), getTodayMacros(phone)]),
    getTodayMoodLogs(phone),
    getRecentExpenseLogs(phone, 20),
    getTodayFoodLogs(phone),
    getRecentMoodLogs(phone, 10),
  ]);

  const spendingTotalToday = spendingResult.status === "fulfilled" ? spendingResult.value.total : null;
  const spendingCountToday =
    recentSpendingResult.status === "fulfilled"
      ? recentSpendingResult.value.filter((r) => toWibDateKey(r.created_at) === todayKey).length
      : 0;
  const spendingToday =
    spendingTotalToday != null ? { total: spendingTotalToday, count: spendingCountToday } : null;

  const calorieToday =
    calorieResult.status === "fulfilled"
      ? { calories: calorieResult.value[0], protein_g: calorieResult.value[1].protein_g }
      : null;

  const todayMoodLogs = moodResult.status === "fulfilled" ? moodResult.value : [];
  const moodToday = todayMoodLogs.length ? todayMoodLogs[todayMoodLogs.length - 1] : null;
  const moodCheckinsToday = todayMoodLogs.length;

  const recentActivity = [];
  if (recentSpendingResult.status === "fulfilled") {
    for (const r of recentSpendingResult.value) {
      recentActivity.push({
        icon: "💰",
        title: r.description,
        subtitle: formatRupiah(r.amount),
        timestamp: r.created_at,
      });
    }
  }
  if (recentCalorieResult.status === "fulfilled") {
    for (const r of recentCalorieResult.value) {
      recentActivity.push({
        icon: "🔥",
        title: r.food_name,
        subtitle: `${r.calories} kcal`,
        timestamp: r.created_at,
      });
    }
  }
  if (recentMoodResult.status === "fulfilled") {
    for (const r of recentMoodResult.value) {
      const meta = MOOD_META[r.mood] || { emoji: "😐", label: r.mood };
      recentActivity.push({
        icon: meta.emoji,
        title: meta.label,
        subtitle: r.note || "",
        timestamp: r.created_at,
      });
    }
  }
  recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.send(
    renderHubDashboard({
      greeting: greetingForHour(now.getUTCHours()),
      dateLabel: formatDateLabelEn(now),
      username: req.user.username,
      spendingToday,
      calorieToday,
      moodToday,
      moodCheckinsToday,
      recentActivity: recentActivity.slice(0, 3).map((a) => ({ ...a, time: toWibTime(a.timestamp) })),
    })
  );
});

router.get("/hub/mood", requireAuth, async (req, res) => {
  try {
    const phone = req.user.phone;
    const now = wibNow();
    const todayKey = now.toISOString().slice(0, 10);
    const year = parseInt(req.query.year, 10) || now.getUTCFullYear();
    const month = parseInt(req.query.month, 10) || now.getUTCMonth() + 1;
    const selectedDate = req.query.date || null;

    const { startISO, endISO, daysInMonth } = getMonthBoundsWib(year, month);
    const monthLogs = await getMoodLogsInRange(phone, startISO, endISO);
    const dayMap = buildDayMap(monthLogs);

    // dihitung dari SEMUA check-in bulan ini (bukan cuma satu terakhir per hari) -
    // "logged this month" & "streak" di bawah tetap pakai dayMap/date-key unik, bukan ini
    const summaryCounts = { terrible: 0, bad: 0, okay: 0, good: 0, great: 0 };
    for (const row of monthLogs) {
      if (summaryCounts[row.mood] != null) summaryCounts[row.mood]++;
    }
    const mostCommonEntry = Object.entries(summaryCounts).sort((a, b) => b[1] - a[1])[0];
    const mostCommon = mostCommonEntry && mostCommonEntry[1] > 0 ? mostCommonEntry[0] : null;

    // streak dihitung dari jendela 90 hari terakhir, bukan cuma bulan yang lagi ditampilin
    const streakWindowStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const streakLogs = await getMoodLogsInRange(phone, streakWindowStart, now.toISOString());
    const streakDateKeys = new Set(streakLogs.map((r) => toWibDateKey(r.created_at)));
    const streak = computeStreak(streakDateKeys);

    const todayMoodLogs = await getTodayMoodLogs(phone);
    const moodToday = todayMoodLogs.length ? todayMoodLogs[todayMoodLogs.length - 1] : null;
    const moodCheckinsToday = todayMoodLogs.length;

    let dayDetail = null;
    if (selectedDate) {
      const rows = await getMoodLogsForDate(phone, selectedDate); // ascending - urutan kronologis
      const d = new Date(`${selectedDate}T00:00:00Z`);
      dayDetail = {
        date: selectedDate,
        dateLabel: `${WEEKDAYS_EN[d.getUTCDay()]}, ${MONTHS_EN[d.getUTCMonth()]} ${d.getUTCDate()}`,
        checkins: rows.map((r) => {
          const meta = MOOD_META[r.mood] || { emoji: "😐", label: r.mood };
          return { time: toWibTime(r.created_at), emoji: meta.emoji, label: meta.label, note: r.note };
        }),
      };
    }

    const recentMoodForHistory = await getRecentMoodLogs(phone, 10);
    const yesterdayKey = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const history = recentMoodForHistory.map((r) => {
      const dateKey = toWibDateKey(r.created_at);
      const d = new Date(`${dateKey}T00:00:00Z`);
      const dayLabel =
        dateKey === todayKey
          ? "Today"
          : dateKey === yesterdayKey
            ? "Yesterday"
            : `${MONTHS_EN[d.getUTCMonth()]} ${d.getUTCDate()}`;
      const meta = MOOD_META[r.mood] || { emoji: "😐", label: r.mood };
      return { dayLabel, emoji: meta.emoji, label: meta.label, note: r.note };
    });

    const flash = req.query.err
      ? { type: "error", text: req.query.err }
      : req.query.ok
        ? { type: "success", text: "Mood saved." }
        : null;

    res.send(
      renderMoodPage({
        year,
        month,
        monthLabel: `${MONTHS_EN[month - 1]} ${year}`,
        daysInMonth,
        dayMap,
        selectedDate,
        todayKey,
        dayDetail,
        moodToday,
        moodCheckinsToday,
        summaryCounts,
        mostCommon,
        streak,
        loggedThisMonth: dayMap.size,
        history,
        flash,
      })
    );
  } catch (err) {
    console.error(err);
    res.status(500).send(`Gagal load halaman mood: ${err.message}`);
  }
});

router.post("/hub/mood", requireAuth, async (req, res) => {
  const mood = req.body.mood;
  const note = (req.body.note || "").trim();

  try {
    await saveMood(req.user.phone, mood, note);
    res.redirect("/hub/mood?ok=1");
  } catch (err) {
    console.error(err);
    res.redirect(`/hub/mood?err=${encodeURIComponent(`Gagal simpan mood: ${err.message}`)}`);
  }
});
