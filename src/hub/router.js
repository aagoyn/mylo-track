import express from "express";
import { requireAuth } from "../shared/auth.js";
import {
  getDayBoundsWib as getSpendingDayBoundsWib,
  getAggregatedExpenses,
  getRecentExpenseLogs,
} from "../spending/supabase.js";
import { getTodayCalories, getTodayMacros, getTodayFoodLogs } from "../calorie/supabase.js";
import { getTodayMoodLogs, getRecentMoodLogs } from "./mood/supabase.js";
import { getJournalEntry, todayDateKeyWib } from "./journal/supabase.js";
import { getWishlistItems } from "./wishlist/supabase.js";
import { renderHubDashboard } from "./dashboard.js";

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
    journalResult,
    wishlistResult,
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
    getJournalEntry(phone, todayDateKeyWib()),
    getWishlistItems(phone),
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

  const journalToday = journalResult.status === "fulfilled" ? journalResult.value : null;

  const wishlistItems = wishlistResult.status === "fulfilled" ? wishlistResult.value : null;
  const wishlistSummary = wishlistItems
    ? {
        count: wishlistItems.length,
        highPriorityCount: wishlistItems.filter((i) => i.priority === "High").length,
        previewTitles: wishlistItems.slice(0, 3).map((i) => i.title),
      }
    : null;

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
  if (journalToday) {
    const preview =
      journalToday.content.length > 60 ? `${journalToday.content.slice(0, 60)}…` : journalToday.content;
    recentActivity.push({
      icon: "📝",
      title: "Journal",
      subtitle: `"${preview}"`,
      timestamp: journalToday.updated_at,
    });
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
      journalToday,
      wishlistSummary,
      recentActivity: recentActivity.slice(0, 4).map((a) => ({ ...a, time: toWibTime(a.timestamp) })),
    })
  );
});
