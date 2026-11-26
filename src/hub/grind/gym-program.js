// Program 4-Day Hybrid Split (Push/Pull/Legs/Posterior Chain) - satu-satunya sumber data buat:
// (1) starter preset template di getGymTemplate (grind/supabase.js) kalau user belum ada riwayat
// sesi di split itu, (2) auto-pilih split pills sesuai hari di GET /hub/grind/gym & default rest
// timer per gerakan (gym-page.js), (3) jadwal gym default mingguan /hub/grind kalau user belum
// nge-import training plan custom di tanggal itu (lihat router.js: injectDefaultGymPlans).
export const GYM_SPLITS = ["Push", "Pull", "Legs", "Posterior Chain", "Custom"];

// ---------- Gym Schedule & Time Configuration (terpusat, bukan hardcoded di dashboard.js) ----------
// Senin=1 ... Minggu=7, konsisten sama convention dayOfWeekWib di modul lain. Jam latihan sengaja
// SELALU di luar jam kerja Senin-Jumat (09:00-18:00): pagi sebelum kerja (Push) atau malam setelah
// kerja selesai, >=18:15 (Pull/Legs) - KECUALI Sabtu (Posterior Chain) yang ringkas (45 menit) &
// ditaruh sore terpisah dari jadwal Badminton, biar recovery tetap kejaga buat Long Run Minggu.
export const DEFAULT_GYM_SCHEDULE = [
  {
    dayOfWeek: 1,
    split: "Push",
    title: "Gym — Push",
    subtitle: "Chest, Shoulders, Triceps (7 exercises)",
    startTime: "06:00",
    endTime: "07:15",
  },
  {
    dayOfWeek: 2,
    split: "Pull",
    title: "Gym — Pull",
    subtitle: "Back, Rear Delts, Biceps (7 exercises)",
    startTime: "18:45",
    endTime: "20:00",
  },
  {
    dayOfWeek: 4,
    split: "Legs",
    title: "Gym — Legs",
    subtitle: "Quads, Glutes, Hamstrings, Calves (7 exercises)",
    startTime: "18:45",
    endTime: "20:00",
  },
  {
    dayOfWeek: 6,
    split: "Posterior Chain",
    title: "Gym — Posterior Chain",
    subtitle: "Deadlift & Posterior Chain · RPE 6–7 (7 exercises)",
    startTime: "15:00",
    endTime: "15:45",
  },
];

// Derived dari DEFAULT_GYM_SCHEDULE (bukan daftar terpisah) biar satu-satunya sumber jadwal cuma
// DEFAULT_GYM_SCHEDULE - nggak ada 2 tempat yang bisa kebablasan nggak sinkron kalau jadwalnya
// diubah lagi nanti.
export const SPLIT_BY_DAY = Object.fromEntries(DEFAULT_GYM_SCHEDULE.map((e) => [e.dayOfWeek, e.split]));

export function defaultSplitForDay(dayOfWeek) {
  return SPLIT_BY_DAY[dayOfWeek] || null;
}

function formatScheduledTime(startTime, endTime) {
  return `${startTime}–${endTime}`;
}

export const GYM_PROGRAM = {
  Push: {
    muscleFocus: "Chest · Shoulders · Triceps",
    note: null,
    exercises: [
      { name: "Barbell Bench Press", sets: 3, repsLabel: "6–8", restSec: 150 },
      { name: "Incline Dumbbell Press", sets: 3, repsLabel: "8–10", restSec: 120 },
      { name: "Seated Shoulder Press", sets: 3, repsLabel: "8–10", restSec: 120 },
      { name: "Cable Lateral Raise", sets: 3, repsLabel: "12–15", restSec: 75 },
      { name: "Pec Deck Fly", sets: 2, repsLabel: "12–15", restSec: 75 },
      { name: "Triceps Rope Pushdown", sets: 3, repsLabel: "10–12", restSec: 75 },
      { name: "Overhead Triceps Extension", sets: 2, repsLabel: "12", restSec: 75 },
    ],
  },
  Pull: {
    muscleFocus: "Back · Rear Delts · Biceps",
    note: null,
    exercises: [
      { name: "Pull-up / Assisted Pull-up", sets: 3, repsLabel: "6–8", restSec: 150 },
      { name: "Lat Pulldown", sets: 3, repsLabel: "8–12", restSec: 90 },
      { name: "Chest Supported Row", sets: 3, repsLabel: "8–10", restSec: 120 },
      { name: "Seated Cable Row", sets: 2, repsLabel: "10–12", restSec: 90 },
      { name: "Reverse Pec Deck", sets: 3, repsLabel: "12–15", restSec: 75 },
      { name: "EZ Bar Bicep Curl", sets: 3, repsLabel: "10–12", restSec: 75 },
      { name: "Hammer Curl", sets: 2, repsLabel: "10–12", restSec: 75 },
    ],
  },
  Legs: {
    muscleFocus: "Quads · Glutes · Hamstrings · Calves",
    note: null,
    exercises: [
      { name: "Barbell Back Squat", sets: 3, repsLabel: "6–8", restSec: 150 },
      { name: "Bulgarian Split Squat", sets: 3, repsLabel: "8 / leg", restSec: 120 },
      { name: "Leg Press", sets: 2, repsLabel: "10–12", restSec: 120 },
      { name: "Seated Leg Curl", sets: 3, repsLabel: "10–12", restSec: 75 },
      { name: "Hip Thrust", sets: 3, repsLabel: "8–12", restSec: 120 },
      { name: "Standing Calf Raise", sets: 3, repsLabel: "12–15", restSec: 60 },
      { name: "Tibialis Raise", sets: 2, repsLabel: "15–20", restSec: 60 },
    ],
  },
  "Posterior Chain": {
    muscleFocus: "Deadlift · Glutes · Core",
    note: "RPE 6–7 - jaga recovery buat Long Run hari Minggu, jangan all-out.",
    exercises: [
      { name: "Conventional Deadlift", sets: 3, repsLabel: "3–5", restSec: 180 },
      { name: "Barbell Hip Thrust", sets: 2, repsLabel: "8–10", restSec: 120 },
      { name: "Back Extension", sets: 2, repsLabel: "10–12", restSec: 75 },
      { name: "Chest Supported Row", sets: 2, repsLabel: "10–12", restSec: 90 },
      { name: "Cable Pull Through", sets: 2, repsLabel: "12", restSec: 75 },
      { name: "Pallof Press", sets: 3, repsLabel: "12 / side", restSec: 60 },
      { name: "Plank", sets: 3, repsLabel: "30–45s", restSec: 60 },
    ],
  },
  Custom: { muscleFocus: null, note: null, exercises: [] },
};

export function presetExercisesForSplit(split) {
  const program = GYM_PROGRAM[split];
  if (!program || !program.exercises.length) return [];
  return program.exercises.map((ex) => ({
    exerciseName: ex.name,
    lastSummary: null,
    targetReps: ex.repsLabel,
    restSec: ex.restSec,
    sets: Array.from({ length: ex.sets }, (_, i) => ({ setOrder: i + 1, weightKg: 0, reps: null })),
  }));
}

// Dipakai getGymTemplate (history branch) biar rest timer tetap sesuai rekomendasi program
// walaupun gerakannya diambil dari riwayat sesi terakhir, bukan dari preset.
export function restSecForExerciseName(name) {
  const n = (name || "").toLowerCase();
  for (const split of Object.keys(GYM_PROGRAM)) {
    for (const ex of GYM_PROGRAM[split].exercises) {
      if (ex.name.toLowerCase() === n) return ex.restSec;
    }
  }
  return null;
}

function addDaysToKey(dateKey, days) {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function dayOfWeekForDateKey(dateKey) {
  const d = new Date(`${dateKey}T00:00:00Z`);
  return d.getUTCDay() || 7;
}

// Plan virtual (id: null, "virtual: true") dipakai cuma buat DITAMPILKAN kalau belum ada plan GYM
// asli (dari DB/import TSV) di tanggal itu - nggak pernah disimpan ke grind_plans. Jangan dikira
// plan asli: rendering (dashboard.js) & router HARUS cek `.virtual` sebelum nge-assume ada plan.id
// yang valid buat endpoint complete/skip/edit/move-to-today.
export function defaultGymPlanForDate(dateKey) {
  const entry = DEFAULT_GYM_SCHEDULE.find((e) => e.dayOfWeek === dayOfWeekForDateKey(dateKey));
  if (!entry) return null;
  return {
    id: null,
    plan_date: dateKey,
    session_type: "GYM",
    sub_type: entry.split,
    status: "PENDING",
    target_distance_km: null,
    target_pace: null,
    target_hr: null,
    instructions: entry.subtitle,
    title: entry.title,
    start_time: entry.startTime,
    end_time: entry.endTime,
    scheduled_time: formatScheduledTime(entry.startTime, entry.endTime),
    virtual: true,
  };
}

// Sisipkan plan gym default ke daftar plan 1 minggu (dari DB) buat tanggal-tanggal yang belum
// punya plan GYM sama sekali - dipakai weekPlans/nextWeekPlans di GET /hub/grind (Schedule
// viewer). BEDA dari versi lama: cuma dicek session_type === "GYM" (bukan "ada plan APAPUN di
// tanggal itu"), jadi sesi lain yang udah dijadwalin di tanggal yang sama (mis. Badminton Sabtu)
// tetap tampil BERDAMPINGAN sebagai item terpisah, bukan nimpa/nyembunyiin jadwal Gym default.
export function injectDefaultGymPlans(plans, startKey, endKey) {
  const gymDates = new Set(plans.filter((p) => p.session_type === "GYM").map((p) => p.plan_date));
  const merged = [...plans];
  let cursor = startKey;
  let guard = 0;
  while (guard < 31) {
    if (!gymDates.has(cursor)) {
      const virtualPlan = defaultGymPlanForDate(cursor);
      if (virtualPlan) merged.push(virtualPlan);
    }
    if (cursor === endKey) break;
    cursor = addDaysToKey(cursor, 1);
    guard++;
  }
  // Kronologis: tanggal dulu, baru jam mulai (scheduled_time/start_time) dalam hari yang sama -
  // item tanpa jam spesifik (plan asli lama belum punya kolom waktu) ditaruh duluan sebelum item
  // yang punya jam pasti, biar nggak nebak-nebak urutannya.
  merged.sort((a, b) => {
    if (a.plan_date !== b.plan_date) return a.plan_date < b.plan_date ? -1 : 1;
    if (a.start_time && b.start_time) return a.start_time < b.start_time ? -1 : a.start_time > b.start_time ? 1 : 0;
    if (a.start_time && !b.start_time) return 1;
    if (!a.start_time && b.start_time) return -1;
    return 0;
  });
  return merged;
}

// Auto-Complete Check: kalau di tanggal plan Gym virtual itu udah ada log sesi GYM beneran
// (dari grind_sessions, APAPUN split-nya - orang bisa aja ganti split pas latihan), tandain
// status-nya "DONE" tanpa user perlu nge-complete manual (plan virtual kan nggak pernah ada
// tombol Complete sungguhan karena nggak ada plan.id). Dipakai di router.js buat weekPlans
// (weekSessions-nya emang cuma ada buat minggu berjalan, minggu depan nggak mungkin ada log).
export function markCompletedGymPlans(plans, sessions) {
  const loggedGymDates = new Set((sessions || []).filter((s) => s.type === "GYM").map((s) => s.session_date));
  return plans.map((p) => (p.virtual && p.session_type === "GYM" && loggedGymDates.has(p.plan_date) ? { ...p, status: "DONE" } : p));
}
