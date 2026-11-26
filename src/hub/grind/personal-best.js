// Mesin kalkulasi Personal Best (PB lari & PR gym) - murni fungsi kalkulasi, nggak nyentuh
// Supabase sama sekali (gampang di-test & dipanggil dari router.js dengan data yang udah di-fetch
// penuh/chronological). Dipakai buat: (1) kartu ringkasan "Personal Bests" di /hub/grind,
// (2) badge PB/PR otomatis + highlight set di daftar History (dashboard.js).
import { paceToSeconds, secondsToPace } from "./parse.js";

// Gerakan utama (Big Lifts & Key Compounds) - diprioritaskan tampil di tab Gym kartu Personal
// Bests. Dua varian Hip Thrust (biasa & versi Posterior Chain) sama-sama dianggap "gerakan utama"
// (lihat gym-program.js: Legs pakai "Hip Thrust", Posterior Chain pakai "Barbell Hip Thrust").
export const BIG_LIFT_EXERCISES = [
  "Conventional Deadlift",
  "Barbell Back Squat",
  "Barbell Bench Press",
  "Hip Thrust",
  "Barbell Hip Thrust",
  "Seated Shoulder Press",
  "Pull-up / Assisted Pull-up",
];

const MILESTONES = [
  { key: "5K", km: 5 },
  { key: "10K", km: 10 },
  { key: "Half Marathon", km: 21.1 },
];

// Urutan prioritas label badge PB kalau satu sesi mecahin lebih dari satu rekor sekaligus (History
// cuma nampilin 1 pill badge per sesi, biar nggak penuh).
const RUN_BADGE_PRIORITY = ["Longest Distance", "Fastest Pace", "Best 5K", "Best 10K", "Best Half Marathon", "Longest Duration"];

export function formatDurationSec(totalSec) {
  const sec = Math.round(totalSec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// sessions: ascending kronologis (session_date lalu created_at) - WAJIB ascending, karena rekor
// dihitung "siapa yang pertama kali nyampe angka ini" (dipakai juga buat badge PB per sesi).
export function computeRunningPBs(sessions) {
  let longestDistance = null;
  let fastestPace = null;
  let longestDuration = null;
  const milestoneBests = { "5K": null, "10K": null, "Half Marathon": null };
  const sessionBadges = {}; // session_id -> ["Longest Distance", ...] (bisa lebih dari satu)

  for (const s of sessions) {
    const km = Number(s.distance_km) || 0;
    const paceSec = paceToSeconds(s.avg_pace);
    const durMin = Number(s.duration_min) || 0;
    const reasons = [];

    if (km > 0 && (!longestDistance || km > longestDistance.km)) {
      longestDistance = { km, date: s.session_date, sessionId: s.id };
      reasons.push("Longest Distance");
    }
    if (km >= 3 && paceSec != null && (!fastestPace || paceSec < fastestPace.paceSec)) {
      fastestPace = { paceSec, pace: secondsToPace(paceSec), km, date: s.session_date, sessionId: s.id };
      reasons.push("Fastest Pace");
    }
    if (durMin > 0 && (!longestDuration || durMin > longestDuration.min)) {
      longestDuration = { min: durMin, date: s.session_date, sessionId: s.id };
      reasons.push("Longest Duration");
    }
    for (const { key, km: milestoneKm } of MILESTONES) {
      if (km >= milestoneKm && paceSec != null) {
        const timeSec = paceSec * milestoneKm;
        const best = milestoneBests[key];
        if (!best || timeSec < best.timeSec) {
          milestoneBests[key] = { timeSec, date: s.session_date, km, sessionId: s.id };
          reasons.push(`Best ${key}`);
        }
      }
    }

    if (reasons.length) {
      reasons.sort((a, b) => RUN_BADGE_PRIORITY.indexOf(a) - RUN_BADGE_PRIORITY.indexOf(b));
      sessionBadges[s.id] = reasons;
    }
  }

  return { longestDistance, fastestPace, longestDuration, milestones: milestoneBests, sessionBadges };
}

// gymSessions: ascending kronologis, tiap elemen { id, session_date, sets: [{exerciseName,
// setOrder, weightKg, reps, setType}] } - set tipe "warmup" DIKECUALIKAN dari perhitungan rekor
// (nggak representatif buat PR beban/1RM beneran).
export function computeGymPRs(gymSessions) {
  const records = {}; // exerciseName -> { maxWeight, best1RM }
  const sessionPRs = {}; // session_id -> [{exerciseName, kg, reps}]
  const setBreaks = {}; // session_id -> Set("exerciseName|setOrder") buat highlight baris di History

  for (const session of gymSessions) {
    for (const set of session.sets || []) {
      if ((set.setType || "working") === "warmup") continue;
      const kg = Number(set.weightKg) || 0;
      const reps = Number(set.reps) || 0;
      if (!kg || !reps) continue;
      const est = kg * (1 + reps / 30);

      const rec = records[set.exerciseName] || { maxWeight: null, best1RM: null };
      let broke = false;
      if (!rec.maxWeight || kg > rec.maxWeight.kg) {
        rec.maxWeight = { kg, reps, date: session.session_date, sessionId: session.id };
        broke = true;
      }
      if (!rec.best1RM || est > rec.best1RM.est) {
        rec.best1RM = { est, kg, reps, date: session.session_date, sessionId: session.id };
        broke = true;
      }
      records[set.exerciseName] = rec;

      if (broke) {
        (sessionPRs[session.id] = sessionPRs[session.id] || []).push({ exerciseName: set.exerciseName, kg, reps });
        (setBreaks[session.id] = setBreaks[session.id] || new Set()).add(`${set.exerciseName}|${set.setOrder}`);
      }
    }
  }

  return { records, sessionPRs, setBreaks };
}
