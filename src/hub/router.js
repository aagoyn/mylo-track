import express from "express";
import { requireAuth } from "../shared/auth.js";
import {
  getDayBoundsWib as getSpendingDayBoundsWib,
  getWeekBoundsWib as getSpendingWeekBoundsWib,
  getAggregatedExpenses,
  getRecentExpenseLogs,
  getWeeklyBudget,
} from "../spending/supabase.js";
import { getTodayFoodLogs } from "../calorie/supabase.js";
import { getRecentMoodLogs } from "./mood/supabase.js";
import { getJournalEntry, todayDateKeyWib } from "./journal/supabase.js";
import { getTopupTotal } from "../spending/supabase.js";
import {
  getMonthlyIncomeTotal,
  getMonthlySavingsNet,
  getBillPaymentsThisMonth,
  getMonthlyMiscExpenseTotal,
  getBillTemplates,
} from "./vault/supabase.js";
import { getTodayClockLog } from "./clocked/supabase.js";
import { getPlanByDate, getSessionsByDate, getUpcomingRace, todayDateKeyWib as grindTodayDateKeyWib } from "./grind/supabase.js";
import { grindActivityRow } from "./grind/dashboard.js";
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

function wibPartsToIso(year, month, day, hour = 0, minute = 0, second = 0) {
  return new Date(Date.UTC(year, month, day, hour, minute, second) - WIB_OFFSET_MS).toISOString();
}

function currentMonthBoundsWib() {
  const now = wibNow();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  return {
    startISO: wibPartsToIso(y, m, 1, 0, 0, 0),
    endISO: wibPartsToIso(y, m + 1, 0, 23, 59, 59),
  };
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

// beberapa variasi per waktu, dipilih random tiap load - biar nggak monoton doang, bukan
// nge-track apa-apa jadi nggak ada tekanan buat "harus konsisten"
const GREETINGS = {
  morning: [
    "Good morning",
    "Rise and shine",
    "Morning",
    "Top of the morning to you",
    "Hey, early bird",
    "Fresh start, fresh day",
    "Coffee first?",
    "Ready for today?",
  ],
  afternoon: [
    "Good afternoon",
    "Hey there",
    "Afternoon",
    "Hope your day's going well",
    "Halfway through the day",
    "Keeping busy?",
    "Hey, how's it going",
    "Afternoon check-in",
  ],
  evening: [
    "Good evening",
    "Evening",
    "Winding down?",
    "Hey you",
    "How was today?",
    "Almost bedtime",
    "Evening wrap-up time",
    "Hey, welcome back",
  ],
};

function greetingForHour(hour) {
  const bucket = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const options = GREETINGS[bucket];
  return options[Math.floor(Math.random() * options.length)];
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
    weeklyBudgetResult,
    recentSpendingResult,
    recentCalorieResult,
    recentMoodResult,
    journalResult,
    vaultResult,
    clockedResult,
    grindResult,
  ] = await Promise.allSettled([
    (async () => {
      const { startISO, endISO } = getSpendingDayBoundsWib();
      return getAggregatedExpenses(phone, startISO, endISO);
    })(),
    (async () => {
      const { startISO, endISO } = getSpendingWeekBoundsWib();
      const [budget, { total: spentThisWeek }] = await Promise.all([
        getWeeklyBudget(phone),
        getAggregatedExpenses(phone, startISO, endISO),
      ]);
      return { budget, spentThisWeek };
    })(),
    getRecentExpenseLogs(phone, 20),
    getTodayFoodLogs(phone),
    getRecentMoodLogs(phone, 10),
    getJournalEntry(phone, todayDateKeyWib()),
    (async () => {
      const { startISO, endISO } = currentMonthBoundsWib();
      const [monthlyIncome, monthlySavingsNet, monthlyTopupTotal, billPayments, monthlyMiscExpenseTotal, billTemplates] =
        await Promise.all([
          getMonthlyIncomeTotal(phone),
          getMonthlySavingsNet(phone),
          getTopupTotal(phone, startISO, endISO),
          getBillPaymentsThisMonth(phone),
          getMonthlyMiscExpenseTotal(phone),
          getBillTemplates(phone),
        ]);
      const monthlyBillsPaidTotal = billPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const paidNames = new Set(billPayments.map((p) => p.name));
      const unpaidBillsCount = billTemplates.filter((t) => !paidNames.has(t.name)).length;
      return {
        monthlyRemaining: monthlyIncome - monthlySavingsNet - monthlyTopupTotal - monthlyBillsPaidTotal - monthlyMiscExpenseTotal,
        unpaidBillsCount,
      };
    })(),
    getTodayClockLog(phone),
    (async () => {
      const dateKey = grindTodayDateKeyWib();
      const [todayPlan, todaySessions, upcomingRace] = await Promise.all([
        getPlanByDate(phone, dateKey),
        getSessionsByDate(phone, dateKey),
        getUpcomingRace(phone, dateKey),
      ]);
      return { todayPlan, todaySessions, upcomingRace };
    })(),
  ]);

  const spendingTotalToday = spendingResult.status === "fulfilled" ? spendingResult.value.total : null;
  const spendingCountToday =
    recentSpendingResult.status === "fulfilled"
      ? recentSpendingResult.value.filter((r) => toWibDateKey(r.created_at) === todayKey).length
      : 0;

  // Safe-to-Spend Today: sisa budget mingguan (lihat getWeeklyBudget, derived dari ledger -
  // remaining = budget - spentThisWeek) dibagi rata ke sisa hari minggu ini (termasuk hari ini),
  // sama persis formula "Xd left this week" di /dashboard/spending - lihat spending/router.js.
  let safeToSpendPerDay = null;
  if (weeklyBudgetResult.status === "fulfilled") {
    const { budget, spentThisWeek } = weeklyBudgetResult.value;
    const remaining = budget - spentThisWeek;
    const dayOfWeek = now.getUTCDay() || 7; // Senin=1 ... Minggu=7
    const daysLeftInWeek = 8 - dayOfWeek; // termasuk hari ini
    if (budget && remaining > 0 && daysLeftInWeek > 0) safeToSpendPerDay = remaining / daysLeftInWeek;
  }

  const spendingToday =
    spendingTotalToday != null ? { total: spendingTotalToday, count: spendingCountToday, safeToSpendPerDay } : null;

  const journalToday = journalResult.status === "fulfilled" ? journalResult.value : null;

  const vaultSummary = vaultResult.status === "fulfilled" ? vaultResult.value : null;

  const clockedToday = clockedResult.status === "fulfilled" ? clockedResult.value : null;

  const grindToday =
    grindResult.status === "fulfilled"
      ? grindResult.value
      : { todayPlan: null, todaySessions: [], upcomingRace: null };

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
  for (const s of grindToday.todaySessions) {
    recentActivity.push(grindActivityRow(s));
  }
  recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.send(
    renderHubDashboard({
      greeting: greetingForHour(now.getUTCHours()),
      dateLabel: formatDateLabelEn(now),
      username: req.user.username,
      spendingToday,
      vaultSummary,
      clockedToday,
      grindToday,
      recentActivity: recentActivity.slice(0, 4).map((a) => ({ ...a, time: toWibTime(a.timestamp) })),
    })
  );
});
