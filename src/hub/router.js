import express from "express";
import { requireAuth } from "../shared/auth.js";
import {
  getDayBoundsWib as getSpendingDayBoundsWib,
  getWeekBoundsWib as getSpendingWeekBoundsWib,
  getAggregatedExpenses,
  getRecentExpenseLogs,
  getWeeklyBudget,
  getFrequentExpenses,
  getCategoryOverrides,
  saveExpenseLogsBatch,
  safeToSpendPerDayFrom,
} from "../spending/supabase.js";
import { parseExpenseInputs } from "../spending/parse.js";
import { getTodayCalories, getTodayMacros, getTodayFoodLogs } from "../calorie/supabase.js";
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
import { defaultGymPlanForDate } from "./grind/gym-program.js";
import { renderHubDashboard } from "./dashboard.js";
import { svgIcon } from "../shared/dashboard-layout.js";

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
// nge-track apa-apa jadi nggak ada tekanan buat "harus konsisten". Jam pakai WIB (lihat wibNow()
// - caller selalu lempar now.getUTCHours() dari Date yang udah di-shift +7).
const GREETINGS = {
  // 05:00 - 10:59 WIB
  morning: [
    "Good morning",
    "Rise and shine",
    "Morning",
    "Top of the morning to you",
    "Hey, early bird",
    "Fresh start, fresh day",
    "Coffee first?",
    "Ready for today?",
    "Rise and grind, mylo ☀️",
    "Fresh start, new pace 🏃",
    "Coffee first, world second ☕",
    "Early bird energy today ✨",
    "Let's set the tone for today 👋",
    "Morning check-in, mylo 🌤️",
    "Ready to clock in & crush it? 💪",
    "New day, clean slate 🌱",
    "Lace up or log in? 👟",
    "Fuel up and make it count 🍳",
    "Good morning! What's the game plan? 📋",
    "Sun's up, time to move 🌅",
  ],
  // 11:00 - 16:59 WIB
  afternoon: [
    "Good afternoon",
    "Hey there",
    "Afternoon",
    "Hope your day's going well",
    "Halfway through the day",
    "Keeping busy?",
    "Hey, how's it going",
    "Afternoon check-in",
    "Hope your day's going well 👋",
    "Keeping busy? 👋",
    "Midday pulse check ⚡",
    "Halfway through the day 🎯",
    "Stay sharp, stay hydrated 💧",
    "Powering through the afternoon 🚀",
    "How's the momentum today? 👀",
    "Afternoon cruise mode ⛵",
    "Don't forget to stretch & hydrate 🥤",
    "Steady pace wins the day 🧭",
    "Checking in on the grind 📈",
    "Keep the streak alive, mylo 🔥",
  ],
  // 17:00 - 20:59 WIB
  evening: [
    "Good evening",
    "Evening",
    "Winding down?",
    "Hey you",
    "How was today?",
    "Almost bedtime",
    "Evening wrap-up time",
    "Hey, welcome back",
    "Clocking out soon? 🌇",
    "Evening mode activated 🌙",
    "Time to switch gears 🏸",
    "Unwinding or grinding tonight? 🔥",
    "Golden hour check-in ✨",
    "Solid effort today, mylo 🙌",
    "Work's done, your time starts now 🎧",
    "Court, road, or iron tonight? 🏋️",
    "Cooling down from the rush 🍃",
    "How did today treat you? 🌆",
    "Evening debrief time 📝",
    "Wrapping up the hustle 🏁",
  ],
  // 21:00 - 04:59 WIB (muter lewat tengah malam)
  lateNight: [
    "Burning the midnight oil? 🦉",
    "Night owl check-in 🌌",
    "Wrapping things up for tonight 🛌",
    "Rest up for tomorrow's miles 🔋",
    "Quiet hours, clear mind ✨",
    "Still up, mylo? 🌠",
    "Recovery happens while you sleep 💤",
    "Closing out the day's tabs 📓",
    "Late night log-in 🕯️",
    "Recharge mode: almost on 🔌",
    "Tomorrow's pace starts tonight 🌙",
    "One last check before lights out 😴",
  ],
};

// Dicampur ke pool pilihan acak cuma kalau kondisinya kena (weekend / race dalam waktu dekat) -
// lihat greetingForHour. Nggak gantiin greeting biasa, cuma nambah variasi ekstra ke pool-nya.
const WEEKEND_BONUS_GREETINGS = [
  "Weekend mode: on 🌿",
  "No alarms, just vibes ☀️",
  "Long run or chill day? 🏃",
  "Weekend warrior check-in ⚡",
  "Slow mornings, strong miles ☕",
  "Smash some shuttles today? 🏸",
  "Recharge & reset weekend 🔋",
  "Out of office, into the zone 🎯",
];

// Aktif kalau ada plan RACE DAY dalam <= 7 hari ke depan (lihat isRaceWeek di handler GET /hub).
const RACE_WEEK_BONUS_GREETINGS = [
  "Race week energy loading 🏁",
  "Eyes on the finish line 🎯",
  "Trust the training, mylo 💪",
  "Taper time — keep the legs fresh 👟",
  "Countdown to race day is real ⏱️",
  "Built the base, ready to race 🔥",
  "Every easy mile counts now 🏃",
];

function greetingBucketForHour(hour) {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "lateNight";
}

function greetingForHour(hour, { isWeekend = false, isRaceWeek = false } = {}) {
  let pool = GREETINGS[greetingBucketForHour(hour)];
  if (isWeekend) pool = pool.concat(WEEKEND_BONUS_GREETINGS);
  if (isRaceWeek) pool = pool.concat(RACE_WEEK_BONUS_GREETINGS);
  return pool[Math.floor(Math.random() * pool.length)];
}

function daysUntilDateKey(dateKey, todayKey) {
  const target = new Date(`${dateKey}T00:00:00Z`);
  const today = new Date(`${todayKey}T00:00:00Z`);
  return Math.round((target - today) / 86400000);
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
    calorieResult,
    recentSpendingResult,
    recentCalorieResult,
    recentMoodResult,
    journalResult,
    vaultResult,
    clockedResult,
    grindResult,
    frequentExpensesResult,
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
    Promise.all([getTodayCalories(phone), getTodayMacros(phone)]),
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
      const [rawTodayPlan, todaySessions, upcomingRace] = await Promise.all([
        getPlanByDate(phone, dateKey),
        getSessionsByDate(phone, dateKey),
        getUpcomingRace(phone, dateKey),
      ]);
      const todayPlan = rawTodayPlan || defaultGymPlanForDate(dateKey);
      return { todayPlan, todaySessions, upcomingRace };
    })(),
    getFrequentExpenses(phone, 30, 5),
  ]);

  const spendingTotalToday = spendingResult.status === "fulfilled" ? spendingResult.value.total : null;
  const spendingCountToday =
    recentSpendingResult.status === "fulfilled"
      ? recentSpendingResult.value.filter((r) => toWibDateKey(r.created_at) === todayKey).length
      : 0;

  const safeToSpendPerDay =
    weeklyBudgetResult.status === "fulfilled"
      ? safeToSpendPerDayFrom(weeklyBudgetResult.value.budget, weeklyBudgetResult.value.spentThisWeek, now)
      : null;

  const spendingToday =
    spendingTotalToday != null ? { total: spendingTotalToday, count: spendingCountToday, safeToSpendPerDay } : null;

  const calorieToday =
    calorieResult.status === "fulfilled"
      ? { calories: calorieResult.value[0], protein_g: calorieResult.value[1].protein_g }
      : null;

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
        icon: svgIcon("wallet", { size: 16 }),
        title: r.description,
        subtitle: formatRupiah(r.amount),
        timestamp: r.created_at,
      });
    }
  }
  if (recentCalorieResult.status === "fulfilled") {
    for (const r of recentCalorieResult.value) {
      recentActivity.push({
        icon: svgIcon("flame", { size: 16 }),
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
      icon: svgIcon("book", { size: 16 }),
      title: "Journal",
      subtitle: `"${preview}"`,
      timestamp: journalToday.updated_at,
    });
  }
  for (const s of grindToday.todaySessions) {
    recentActivity.push(grindActivityRow(s));
  }
  recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const frequentExpenses = frequentExpensesResult.status === "fulfilled" ? frequentExpensesResult.value : [];

  const isWeekend = now.getUTCDay() === 0 || now.getUTCDay() === 6; // Minggu/Sabtu (now udah di-shift ke WIB)
  const isRaceWeek = !!grindToday.upcomingRace && daysUntilDateKey(grindToday.upcomingRace.plan_date, todayKey) <= 7;

  res.send(
    renderHubDashboard({
      greeting: greetingForHour(now.getUTCHours(), { isWeekend, isRaceWeek }),
      dateLabel: formatDateLabelEn(now),
      username: req.user.username,
      spendingToday,
      calorieToday,
      vaultSummary,
      clockedToday,
      grindToday,
      recentActivity: recentActivity.slice(0, 4).map((a) => ({ ...a, time: toWibTime(a.timestamp) })),
      frequentExpenses,
    })
  );
});

// FAB "+ Rp" di /hub (lihat hub/dashboard.js quickExpenseDialogHtml) - sama persis logic parsing
// & auto-learn kategorisasi kayak POST /dashboard/spending/expense-text, cuma responnya JSON
// (bukan redirect) biar dialog-nya bisa update UI in-place tanpa reload halaman.
router.post("/hub/quick-expense", requireAuth, async (req, res) => {
  const text = (req.body.text || "").trim();
  if (!text) return res.status(400).json({ ok: false, error: "Input kosong." });

  try {
    const phone = req.user.phone;
    const overrides = await getCategoryOverrides(phone);
    const dtos = parseExpenseInputs(text, overrides);
    if (!dtos.length) return res.status(400).json({ ok: false, error: "Format tidak dikenali." });

    const { rows } = await saveExpenseLogsBatch(phone, dtos);

    const now = wibNow();
    const todayKey = now.toISOString().slice(0, 10);
    const { startISO: dayStart, endISO: dayEnd } = getSpendingDayBoundsWib();
    const { startISO: weekStart, endISO: weekEnd } = getSpendingWeekBoundsWib();

    const [{ total: todayTotal }, budget, { total: spentThisWeek }, recentLogs] = await Promise.all([
      getAggregatedExpenses(phone, dayStart, dayEnd),
      getWeeklyBudget(phone),
      getAggregatedExpenses(phone, weekStart, weekEnd),
      getRecentExpenseLogs(phone, 20),
    ]);
    const todayCount = recentLogs.filter((r) => toWibDateKey(r.created_at) === todayKey).length;

    res.json({
      ok: true,
      items: rows.map((r) => ({
        description: r.description,
        category: r.category,
        amount: Number(r.amount),
        time: toWibTime(r.created_at),
      })),
      todayTotal,
      todayCount,
      safeToSpend: safeToSpendPerDayFrom(budget, spentThisWeek, now),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});
