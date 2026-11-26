// Program 4-Day Hybrid Split (Push/Pull/Legs/Posterior Chain) - satu-satunya sumber data buat:
// (1) starter preset template di getGymTemplate (grind/supabase.js) kalau user belum ada riwayat
// sesi di split itu, (2) auto-pilih split pills sesuai hari di GET /hub/grind/gym & default rest
// timer per gerakan (gym-page.js), (3) jadwal gym default mingguan /hub/grind kalau user belum
// nge-import training plan custom di tanggal itu (lihat router.js: injectDefaultGymPlans).
export const GYM_SPLITS = ["Push", "Pull", "Legs", "Posterior Chain", "Custom"];

// Senin=1 ... Minggu=7, konsisten sama convention dayOfWeekWib di modul lain.
export const SPLIT_BY_DAY = { 1: "Push", 2: "Pull", 4: "Legs", 6: "Posterior Chain" };

export function defaultSplitForDay(dayOfWeek) {
  return SPLIT_BY_DAY[dayOfWeek] || null;
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

const DEFAULT_GYM_PLAN_INSTRUCTIONS = {
  Push: "Upper Body: Chest, Shoulders, Triceps · 7 exercises",
  Pull: "Upper Body: Back, Rear Delts, Biceps · 7 exercises",
  Legs: "Lower Body: Quads, Glutes, Hamstrings, Calves · 7 exercises",
  "Posterior Chain": "Deadlift Day · RPE 6–7, jaga recovery untuk Long Run Minggu · 7 exercises",
};

function addDaysToKey(dateKey, days) {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function dayOfWeekForDateKey(dateKey) {
  const d = new Date(`${dateKey}T00:00:00Z`);
  return d.getUTCDay() || 7;
}

// Plan virtual (id: null, "virtual: true") dipakai cuma buat DITAMPILKAN kalau belum ada plan
// asli (dari DB/import TSV) di tanggal itu - nggak pernah disimpan ke grind_plans. Jangan dikira
// plan asli: rendering (dashboard.js) & router HARUS cek `.virtual` sebelum nge-assume ada plan.id
// yang valid buat endpoint complete/skip/edit/move-to-today.
export function defaultGymPlanForDate(dateKey) {
  const split = defaultSplitForDay(dayOfWeekForDateKey(dateKey));
  if (!split) return null;
  return {
    id: null,
    plan_date: dateKey,
    session_type: "GYM",
    sub_type: split,
    status: "PENDING",
    target_distance_km: null,
    target_pace: null,
    target_hr: null,
    instructions: DEFAULT_GYM_PLAN_INSTRUCTIONS[split] || null,
    virtual: true,
  };
}

// Sisipkan plan gym default ke daftar plan 1 minggu (dari DB) buat tanggal-tanggal yang belum
// punya plan sama sekali - dipakai weekPlans/nextWeekPlans di GET /hub/grind (Schedule viewer).
export function injectDefaultGymPlans(plans, startKey, endKey) {
  const existingDates = new Set(plans.map((p) => p.plan_date));
  const merged = [...plans];
  let cursor = startKey;
  let guard = 0;
  while (guard < 31) {
    if (!existingDates.has(cursor)) {
      const virtualPlan = defaultGymPlanForDate(cursor);
      if (virtualPlan) merged.push(virtualPlan);
    }
    if (cursor === endKey) break;
    cursor = addDaysToKey(cursor, 1);
    guard++;
  }
  merged.sort((a, b) => (a.plan_date < b.plan_date ? -1 : a.plan_date > b.plan_date ? 1 : 0));
  return merged;
}
