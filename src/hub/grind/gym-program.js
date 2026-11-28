// Program 4-Day Gym Split (Push/Posterior Chain/Pull/Legs, Senin-Rabu-Kamis-Jumat) - satu-satunya sumber data buat:
// (1) starter preset template di getGymTemplate (grind/supabase.js) kalau user belum ada riwayat
// sesi di split itu, (2) auto-pilih split pills sesuai hari di GET /hub/grind/gym & default rest
// timer per gerakan (gym-page.js), (3) jadwal gym default mingguan /hub/grind kalau user belum
// nge-import training plan custom di tanggal itu (lihat router.js: injectDefaultGymPlans).
export const GYM_SPLITS = ["Push", "Pull", "Legs", "Posterior Chain", "Custom"];

// ---------- Gym Schedule & Time Configuration (terpusat, bukan hardcoded di dashboard.js) ----------
// Senin=1 ... Minggu=7, konsisten sama convention dayOfWeekWib di modul lain. Jam latihan sengaja
// SELALU di luar jam kerja Senin-Jumat (09:00-18:00): pagi sebelum kerja (Push/Posterior Chain/Legs
// - Rabu & Jumat WFH jadi bisa mulai lebih siang dikit, 06:30) atau malam setelah kerja selesai,
// >=18:45 (Pull). Selasa (Interval Run), Sabtu (Badminton), Minggu (Long Run) di luar jadwal Gym
// ini - dicatat manual lewat form Run/Badminton, bukan default plan GYM.
export const DEFAULT_GYM_SCHEDULE = [
  {
    dayOfWeek: 1,
    split: "Push",
    title: "Gym — Push",
    subtitle: "Chest, Shoulders, Triceps (5 exercises)",
    startTime: "06:00",
    endTime: "07:15",
  },
  {
    dayOfWeek: 3,
    split: "Posterior Chain",
    title: "Gym — Posterior Chain",
    subtitle: "Conventional Deadlift & Posterior Chain · RPE 6–7 (5 exercises)",
    startTime: "06:30",
    endTime: "07:45",
  },
  {
    dayOfWeek: 4,
    split: "Pull",
    title: "Gym — Pull",
    subtitle: "Back, Rear Delts, Biceps (6 exercises)",
    startTime: "18:45",
    endTime: "20:00",
  },
  {
    dayOfWeek: 5,
    split: "Legs",
    title: "Gym — Legs",
    subtitle: "Quads, Glutes, Hamstrings, Core (6 exercises)",
    startTime: "06:30",
    endTime: "07:45",
  },
];

// Jadwal default non-gym (Badminton Sabtu pagi) - sama konsepnya kayak DEFAULT_GYM_SCHEDULE: cuma
// saran tampilan (virtual, nggak pernah ditulis ke grind_plans), bukan plan asli. Nggak ada
// mekanisme override jam kayak Gym (lihat grind_gym_schedule_overrides) karena belum diminta.
export const DEFAULT_BADMINTON_SCHEDULE = [
  {
    dayOfWeek: 6,
    title: "Badminton",
    subtitle: "Default Sabtu Pagi",
    startTime: "08:00",
    endTime: "10:00",
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
    note: "Target RIR 2–3 di tiap gerakan - jangan sampai technical failure.",
    exercises: [
      { name: "Bench Press / Chest Press", sets: 3, repsLabel: "8–10", restSec: 120 },
      { name: "Incline Dumbbell Press", sets: 3, repsLabel: "10–12", restSec: 90 },
      { name: "Seated Shoulder Press", sets: 3, repsLabel: "8–10", restSec: 90 },
      { name: "Dumbbell Lateral Raise", sets: 3, repsLabel: "12–15", restSec: 60 },
      { name: "Cable Triceps Pushdown", sets: 3, repsLabel: "10–12", restSec: 60 },
    ],
  },
  Pull: {
    muscleFocus: "Back · Rear Delts · Biceps",
    note: "Target RIR 2–3 di tiap gerakan - jangan sampai technical failure.",
    exercises: [
      { name: "Lat Pulldown", sets: 3, repsLabel: "8–12", restSec: 90 },
      { name: "Chest-Supported Row", sets: 3, repsLabel: "8–12", restSec: 90 },
      { name: "Seated Cable Row", sets: 2, repsLabel: "10–12", restSec: 75 },
      { name: "Reverse Pec Deck / Rear Delt Fly", sets: 3, repsLabel: "12–15", restSec: 60 },
      { name: "Dumbbell Biceps Curl", sets: 3, repsLabel: "10–12", restSec: 60 },
      { name: "Hammer Curl", sets: 2, repsLabel: "10–12", restSec: 60 },
    ],
  },
  Legs: {
    muscleFocus: "Quads · Glutes · Hamstrings · Core",
    note: "Jumat: jaga 3 RIR, jangan sampai gagal - ada Badminton Sabtu & Long Run Minggu.",
    exercises: [
      { name: "Squat / Hack Squat", sets: 3, repsLabel: "8–10", restSec: 120 },
      { name: "Leg Press", sets: 2, repsLabel: "10–12", restSec: 90 },
      { name: "Bulgarian Split Squat", sets: 2, repsLabel: "8–10 / leg", restSec: 90 },
      { name: "Leg Extension", sets: 2, repsLabel: "12–15", restSec: 60 },
      { name: "Standing Calf Raise", sets: 2, repsLabel: "12–15", restSec: 60 },
      { name: "Plank", sets: 3, repsLabel: "30–45s", restSec: 60 },
    ],
  },
  "Posterior Chain": {
    muscleFocus: "Deadlift · Glutes · Hamstrings",
    note: "Deadlift RPE 6–7 (rest 2–3 menit) - jaga recovery buat Badminton Sabtu & Long Run Minggu, jangan all-out.",
    exercises: [
      { name: "Conventional Deadlift", sets: 3, repsLabel: "5", restSec: 165 },
      { name: "Hip Thrust", sets: 3, repsLabel: "8–10", restSec: 120 },
      { name: "Seated Leg Curl", sets: 3, repsLabel: "10–12", restSec: 75 },
      { name: "Cable Glute Kickback", sets: 2, repsLabel: "12–15", restSec: 60 },
      { name: "Back Extension", sets: 2, repsLabel: "10–12", restSec: 60 },
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

function timeToMinutes(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || "");
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const mi = parseInt(m[2], 10);
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}

// Validasi override jam latihan sebelum disimpan (lihat router.js POST /hub/grind/gym-schedule/
// override) - aturan dasar DEFAULT_GYM_SCHEDULE harus tetap kejaga: format HH:MM yang valid, jam
// selesai > jam mulai, dan nggak boleh bentrok sama jam kerja Senin-Jumat (09:00-18:00). Return
// null kalau valid, atau pesan error (string) kalau nggak.
export function validateGymScheduleOverride(dateKey, startTime, endTime) {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  if (startMin == null || endMin == null) return "Format jam harus HH:MM.";
  if (endMin <= startMin) return "Jam selesai harus setelah jam mulai.";

  const dow = dayOfWeekForDateKey(dateKey);
  const isWeekday = dow >= 1 && dow <= 5;
  if (isWeekday) {
    const workStart = 9 * 60;
    const workEnd = 18 * 60;
    if (startMin < workEnd && endMin > workStart) {
      return "Jam latihan nggak boleh bentrok sama jam kerja (09:00–18:00) di hari kerja.";
    }
  }
  return null;
}

// Plan virtual (id: null, "virtual: true") dipakai cuma buat DITAMPILKAN kalau belum ada plan GYM
// asli (dari DB/import TSV) di tanggal itu - nggak pernah disimpan ke grind_plans. Jangan dikira
// plan asli: rendering (dashboard.js) & router HARUS cek `.virtual` sebelum nge-assume ada plan.id
// yang valid buat endpoint complete/skip/edit/move-to-today.
//
// `override` ({ start_time, end_time }, opsional) datang dari grind_gym_schedule_overrides (lihat
// supabase.js: getGymScheduleOverrides) - kalau ADA, jam itu yang dipakai & `tentative: false`;
// kalau TIDAK ADA, pakai jam default DEFAULT_GYM_SCHEDULE & `tentative: true` (saran perencanaan,
// bukan jadwal pasti - lihat scheduleTimeBadgeHtml buat indikator jam/status-nya).
export function defaultGymPlanForDate(dateKey, override) {
  const entry = DEFAULT_GYM_SCHEDULE.find((e) => e.dayOfWeek === dayOfWeekForDateKey(dateKey));
  if (!entry) return null;
  const startTime = override ? override.start_time : entry.startTime;
  const endTime = override ? override.end_time : entry.endTime;
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
    start_time: startTime,
    end_time: endTime,
    scheduled_time: formatScheduledTime(startTime, endTime),
    tentative: !override,
    virtual: true,
  };
}

// Plan virtual Badminton (default Sabtu 08:00-10:00) - sama aturannya kayak defaultGymPlanForDate:
// id: null, virtual: true, nggak pernah disimpan ke grind_plans. Selalu `tentative: true` (belum
// ada mekanisme override jam buat Badminton).
export function defaultBadmintonPlanForDate(dateKey) {
  const entry = DEFAULT_BADMINTON_SCHEDULE.find((e) => e.dayOfWeek === dayOfWeekForDateKey(dateKey));
  if (!entry) return null;
  return {
    id: null,
    plan_date: dateKey,
    session_type: "BADMINTON",
    sub_type: null,
    status: "PENDING",
    target_distance_km: null,
    target_pace: null,
    target_hr: null,
    instructions: null,
    title: entry.title,
    start_time: entry.startTime,
    end_time: entry.endTime,
    scheduled_time: formatScheduledTime(entry.startTime, entry.endTime),
    tentative: true,
    virtual: true,
  };
}

// Sisipkan plan gym & Badminton default ke daftar plan 1 minggu (dari DB) buat tanggal-tanggal
// yang belum punya plan GYM/BADMINTON sama sekali - dipakai weekPlans/nextWeekPlans di GET
// /hub/grind (Schedule viewer). BEDA dari versi lama: cuma dicek session_type === "GYM"/"BADMINTON"
// (bukan "ada plan APAPUN di tanggal itu"), jadi sesi lain yang udah dijadwalin di tanggal yang
// sama tetap tampil BERDAMPINGAN sebagai item terpisah, bukan nimpa/nyembunyiin jadwal default.
// `overrides` (opsional): array hasil getGymScheduleOverrides, dipetakan per plan_date di sini.
export function injectDefaultGymPlans(plans, startKey, endKey, overrides) {
  const gymDates = new Set(plans.filter((p) => p.session_type === "GYM").map((p) => p.plan_date));
  const badmintonDates = new Set(plans.filter((p) => p.session_type === "BADMINTON").map((p) => p.plan_date));
  const overrideByDate = new Map((overrides || []).map((o) => [o.plan_date, o]));
  // Dilacak terpisah dari gymDates (yang cuma plan GYM ASLI) - dipakai buat nyaring Rest default
  // di bawah, soalnya plan GYM VIRTUAL yang baru disisipin di loop ini juga harus ikut diitung
  // "hari itu udah ada latihan", bukan cuma plan GYM asli dari DB.
  const allGymDates = new Set(gymDates);
  const merged = [...plans];
  let cursor = startKey;
  let guard = 0;
  while (guard < 31) {
    if (!gymDates.has(cursor)) {
      const virtualPlan = defaultGymPlanForDate(cursor, overrideByDate.get(cursor));
      if (virtualPlan) {
        merged.push(virtualPlan);
        allGymDates.add(cursor);
      }
    }
    if (!badmintonDates.has(cursor)) {
      const virtualBadminton = defaultBadmintonPlanForDate(cursor);
      if (virtualBadminton) {
        merged.push(virtualBadminton);
        badmintonDates.add(cursor);
      }
    }
    if (cursor === endKey) break;
    cursor = addDaysToKey(cursor, 1);
    guard++;
  }
  // grind_plans punya unique(phone, plan_date) - jadi REST asli & GYM/BADMINTON asli nggak pernah
  // bentrok tanggal yang sama di DB. Satu-satunya cara REST bisa "numpuk" di tanggal yang sama
  // adalah REST asli (dari import plan) + GYM/BADMINTON VIRTUAL yang baru disisipin di atas - itu
  // yang mau dihindarin di sini (lihat spec: "jangan tampilkan Rest default kalau udah ada jadwal
  // Gym/Badminton di hari yang sama"), biar nggak kesannya kontradiktif ("Rest" tapi ada "Start Gym").
  const filtered = merged.filter(
    (p) => !(p.session_type === "REST" && (allGymDates.has(p.plan_date) || badmintonDates.has(p.plan_date)))
  );
  // Kronologis: tanggal dulu, baru jam mulai (scheduled_time/start_time) dalam hari yang sama -
  // item tanpa jam spesifik (plan asli lama belum punya kolom waktu) ditaruh duluan sebelum item
  // yang punya jam pasti, biar nggak nebak-nebak urutannya.
  filtered.sort((a, b) => {
    if (a.plan_date !== b.plan_date) return a.plan_date < b.plan_date ? -1 : 1;
    if (a.start_time && b.start_time) return a.start_time < b.start_time ? -1 : a.start_time > b.start_time ? 1 : 0;
    if (a.start_time && !b.start_time) return 1;
    if (!a.start_time && b.start_time) return -1;
    return 0;
  });
  return filtered;
}

// Auto-Complete Check: kalau di tanggal plan Gym/Badminton virtual itu udah ada log sesi beneran
// (dari grind_sessions - buat Gym, APAPUN split-nya, orang bisa aja ganti split pas latihan),
// tandain status-nya "DONE" tanpa user perlu nge-complete manual (plan virtual kan nggak pernah
// ada tombol Complete sungguhan karena nggak ada plan.id). Dipakai di router.js buat weekPlans
// (weekSessions-nya emang cuma ada buat minggu berjalan, minggu depan nggak mungkin ada log).
export function markCompletedGymPlans(plans, sessions) {
  const loggedGymDates = new Set((sessions || []).filter((s) => s.type === "GYM").map((s) => s.session_date));
  const loggedBadmintonDates = new Set((sessions || []).filter((s) => s.type === "BADMINTON").map((s) => s.session_date));
  return plans.map((p) => {
    if (!p.virtual) return p;
    if (p.session_type === "GYM" && loggedGymDates.has(p.plan_date)) return { ...p, status: "DONE" };
    if (p.session_type === "BADMINTON" && loggedBadmintonDates.has(p.plan_date)) return { ...p, status: "DONE" };
    return p;
  });
}
