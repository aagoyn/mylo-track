import { supabase } from "../../shared/supabase-client.js";
import { parseTrainingPlanTsv, paceToSeconds, secondsToPace } from "./parse.js";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

// Satu-satunya sumber "jam berapa/tanggal berapa sekarang" buat seluruh modul Grind - jangan
// pernah pakai `new Date()` UTC server mentah atau `current_date` SQL buat nentuin "hari ini",
// karena server bisa di-deploy di region manapun (Render dsb nggak selalu UTC+7). Semua
// turunan (todayDateKeyWib, dayOfWeekWib, defaultSessionTimeWib, week/month bounds) derive dari sini.
export function getJakartaNow() {
  return new Date(Date.now() + WIB_OFFSET_MS);
}

export function todayDateKeyWib() {
  return getJakartaNow().toISOString().slice(0, 10);
}

// Senin=1 ... Minggu=7, konsisten sama convention di modul lain (clocked, spending)
function dayOfWeekWib() {
  return getJakartaNow().getUTCDay() || 7;
}

function addDaysToKey(dateKey, days) {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getWeekDateBoundsWib() {
  const monday = addDaysToKey(todayDateKeyWib(), -(dayOfWeekWib() - 1));
  return { startKey: monday, endKey: addDaysToKey(monday, 6) };
}

export function getNextWeekDateBoundsWib() {
  const { endKey } = getWeekDateBoundsWib();
  const nextMonday = addDaysToKey(endKey, 1);
  return { startKey: nextMonday, endKey: addDaysToKey(nextMonday, 6) };
}

export function getMonthDateBoundsWib() {
  const wib = getJakartaNow();
  const y = wib.getUTCFullYear();
  const m = wib.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 0));
  return { startKey: start.toISOString().slice(0, 10), endKey: end.toISOString().slice(0, 10) };
}

// dipakai buat default AM/PM di form Log Run/Badminton/Gym
export function defaultSessionTimeWib() {
  return getJakartaNow().getUTCHours() < 12 ? "AM" : "PM";
}

export async function getPlanByDate(phone, dateKey) {
  const { data, error } = await supabase
    .from("grind_plans")
    .select("*")
    .eq("phone", phone)
    .eq("plan_date", dateKey)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPlanById(phone, id) {
  const { data, error } = await supabase
    .from("grind_plans")
    .select("*")
    .eq("phone", phone)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPlanRange(phone, startKey, endKey) {
  const { data, error } = await supabase
    .from("grind_plans")
    .select("*")
    .eq("phone", phone)
    .gte("plan_date", startKey)
    .lte("plan_date", endKey)
    .order("plan_date", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getUpcomingRace(phone, fromDateKey) {
  const { data, error } = await supabase
    .from("grind_plans")
    .select("*")
    .eq("phone", phone)
    .eq("session_type", "RACE DAY")
    .gte("plan_date", fromDateKey)
    .order("plan_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function markPlanStatus(phone, planId, status) {
  const { error } = await supabase
    .from("grind_plans")
    .update({ status })
    .eq("phone", phone)
    .eq("id", planId);
  if (error) throw error;
}

export async function updatePlan(phone, id, { targetDistanceKm, targetPace, targetHr, instructions }) {
  const { error } = await supabase
    .from("grind_plans")
    .update({
      target_distance_km: targetDistanceKm ?? null,
      target_pace: targetPace || null,
      target_hr: targetHr || null,
      instructions: instructions || null,
    })
    .eq("phone", phone)
    .eq("id", id);
  if (error) throw error;
}

export async function getSessionsByDate(phone, dateKey) {
  const { data, error } = await supabase
    .from("grind_sessions")
    .select("*")
    .eq("phone", phone)
    .eq("session_date", dateKey)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getSessionsInRange(phone, startKey, endKey) {
  const { data, error } = await supabase
    .from("grind_sessions")
    .select("*")
    .eq("phone", phone)
    .gte("session_date", startKey)
    .lte("session_date", endKey)
    .order("session_date", { ascending: true });
  if (error) throw error;
  return data || [];
}

// 24 jam terakhir (dari created_at, bukan session_date) - dipakai Smart Recovery Hint di form Gym
export async function getSessionsSince(phone, sinceISO) {
  const { data, error } = await supabase
    .from("grind_sessions")
    .select("type, distance_km, sub_type, created_at")
    .eq("phone", phone)
    .gte("created_at", sinceISO)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// planId datang dari hidden input form (lihat "Complete Plan" di dashboard.js) - nggak bisa
// dipercaya mentah-mentah dari client, jadi di-cek dulu di sini: harus plan milik phone yang
// sama dan masih PENDING, baru boleh ditautkan & bikin plan itu DONE. Kalau nggak valid, sesi
// tetap kesimpen tapi jadi sesi spontan (nggak nyambung ke plan manapun).
export async function createSession(
  phone,
  { planId, sessionDate, sessionTime, type, subType, durationMin, distanceKm, avgPace, avgHr, notes }
) {
  let linkedPlanId = null;
  if (planId) {
    const plan = await getPlanById(phone, planId);
    if (plan && plan.status === "PENDING") linkedPlanId = plan.id;
  }

  const { data, error } = await supabase
    .from("grind_sessions")
    .insert({
      phone,
      plan_id: linkedPlanId,
      session_date: sessionDate,
      session_time: sessionTime,
      type,
      sub_type: subType || null,
      duration_min: durationMin ?? null,
      distance_km: distanceKm ?? null,
      avg_pace: avgPace || null,
      avg_hr: avgHr ?? null,
      notes: notes || null,
    })
    .select("id")
    .single();
  if (error) throw error;

  if (linkedPlanId) await markPlanStatus(phone, linkedPlanId, "DONE");

  return data.id;
}

// Kalau sebuah plan_id udah nggak ditautkan sesi manapun lagi (sesi terakhirnya baru aja
// dihapus, atau tanggalnya digeser - lihat updateSession/deleteSession), plan itu nggak lagi
// "selesai" secara faktual - balikin ke PENDING biar muncul lagi tombol Complete/Skip-nya,
// bukan nyangkut DONE selamanya padahal buktinya udah ilang.
async function revertPlanIfOrphaned(phone, planId) {
  const { data, error } = await supabase
    .from("grind_sessions")
    .select("id")
    .eq("plan_id", planId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) await markPlanStatus(phone, planId, "PENDING");
}

// sessionDate dianggap "koreksi hari sebenarnya" - kalau beda dari tanggal yang kesimpen
// sekarang, sesi itu dilepas dari plan_id lama-nya (plan itu dianggap belum tentu selesai lagi
// di hari aslinya) sebelum balik ngecek apakah plan lama jadi yatim (lihat revertPlanIfOrphaned).
export async function updateSession(phone, id, { sessionDate, durationMin, distanceKm, avgPace, avgHr, notes }) {
  const { data: existing, error: fetchErr } = await supabase
    .from("grind_sessions")
    .select("plan_id, session_date")
    .eq("phone", phone)
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!existing) return;

  const dateChanged = sessionDate && sessionDate !== existing.session_date;

  const { error } = await supabase
    .from("grind_sessions")
    .update({
      session_date: sessionDate || existing.session_date,
      plan_id: dateChanged ? null : existing.plan_id,
      duration_min: durationMin ?? null,
      distance_km: distanceKm ?? null,
      avg_pace: avgPace || null,
      avg_hr: avgHr ?? null,
      notes: notes || null,
    })
    .eq("phone", phone)
    .eq("id", id);
  if (error) throw error;

  if (dateChanged && existing.plan_id) await revertPlanIfOrphaned(phone, existing.plan_id);
}

export async function deleteSession(phone, id) {
  const { data: existing, error: fetchErr } = await supabase
    .from("grind_sessions")
    .select("plan_id")
    .eq("phone", phone)
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) throw fetchErr;

  const { error } = await supabase.from("grind_sessions").delete().eq("phone", phone).eq("id", id);
  if (error) throw error;

  if (existing?.plan_id) await revertPlanIfOrphaned(phone, existing.plan_id);
}

const MOVE_PLAN_TEMP_DATE = "9999-12-30";

// "Move to Today" buat plan hari lain yang PENDING/SKIPPED (lihat scheduleDayHtml). Kalau hari
// ini udah ada plan sendiri yang masih REST/PENDING, dua-duanya ditukar tanggal (bukan ditimpa)
// lewat tanggal sementara dulu - plan_date punya unique(phone,plan_date), jadi nggak bisa
// langsung assign dua row ke tanggal yang sama di step yang sama.
export async function movePlanToToday(phone, planId, todayKey) {
  const plan = await getPlanById(phone, planId);
  if (!plan) throw new Error("Plan tidak ditemukan.");
  if (!["PENDING", "SKIPPED"].includes(plan.status)) throw new Error("Plan ini sudah diproses, nggak bisa dipindah.");
  if (plan.plan_date === todayKey) return;

  const todayPlan = await getPlanByDate(phone, todayKey);
  if (todayPlan && !["REST", "PENDING"].includes(todayPlan.status)) {
    throw new Error("Hari ini sudah diproses, nggak bisa ditukar.");
  }

  if (todayPlan) {
    let { error } = await supabase.from("grind_plans").update({ plan_date: MOVE_PLAN_TEMP_DATE }).eq("phone", phone).eq("id", plan.id);
    if (error) throw error;

    ({ error } = await supabase.from("grind_plans").update({ plan_date: plan.plan_date }).eq("phone", phone).eq("id", todayPlan.id));
    if (error) throw error;

    ({ error } = await supabase
      .from("grind_plans")
      .update({ plan_date: todayKey, status: "PENDING" })
      .eq("phone", phone)
      .eq("id", plan.id));
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("grind_plans")
      .update({ plan_date: todayKey, status: "PENDING" })
      .eq("phone", phone)
      .eq("id", plan.id);
    if (error) throw error;
  }
}

export async function addGymSets(sessionId, sets) {
  if (!sets.length) return;
  const rows = sets.map((s) => ({
    session_id: sessionId,
    exercise_name: s.exerciseName,
    set_order: s.setOrder,
    weight_kg: s.weightKg ?? null,
    reps: s.reps ?? null,
  }));
  const { error } = await supabase.from("grind_gym_sets").insert(rows);
  if (error) throw error;
}

// "Clone Last Split" - ambil gerakan dari sesi GYM terakhir dengan sub_type yang sama, biar form
// baru auto-keisi sebagai referensi/nilai awal (lihat endpoint GET /hub/grind/api/last-split).
export async function getLastGymSplit(phone, subType) {
  const { data: session, error } = await supabase
    .from("grind_sessions")
    .select("id")
    .eq("phone", phone)
    .eq("type", "GYM")
    .eq("sub_type", subType)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!session) return [];

  const { data: sets, error: setsErr } = await supabase
    .from("grind_gym_sets")
    .select("exercise_name, set_order, weight_kg, reps")
    .eq("session_id", session.id)
    .order("set_order", { ascending: true });
  if (setsErr) throw setsErr;
  return sets || [];
}

// History log (30 terakhir) dengan gym sets ikut nempel per sesi GYM, buat tampilan detail
// expandable di /hub/grind.
export async function getRecentSessions(phone, limit = 30) {
  const { data, error } = await supabase
    .from("grind_sessions")
    .select("*")
    .eq("phone", phone)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const sessions = data || [];

  const gymIds = sessions.filter((s) => s.type === "GYM").map((s) => s.id);
  if (!gymIds.length) return sessions.map((s) => ({ ...s, gymSets: [] }));

  const { data: sets, error: setsErr } = await supabase
    .from("grind_gym_sets")
    .select("*")
    .in("session_id", gymIds)
    .order("set_order", { ascending: true });
  if (setsErr) throw setsErr;

  const setsBySession = {};
  for (const s of sets || []) {
    (setsBySession[s.session_id] ||= []).push(s);
  }
  return sessions.map((s) => ({ ...s, gymSets: setsBySession[s.id] || [] }));
}

// Sport Summary (bulan ini): Run (total km, rata-rata pace/HR), Badminton (sesi & jam), Gym
// (sesi & beban tertinggi per gerakan).
export async function getMonthSummary(phone, startKey, endKey) {
  const sessions = await getSessionsInRange(phone, startKey, endKey);

  const runs = sessions.filter((s) => s.type === "RUN");
  const totalKm = runs.reduce((sum, s) => sum + (Number(s.distance_km) || 0), 0);
  const paceSecs = runs.map((s) => paceToSeconds(s.avg_pace)).filter((v) => v != null);
  const avgPaceSec = paceSecs.length ? paceSecs.reduce((a, b) => a + b, 0) / paceSecs.length : null;
  const hrVals = runs.map((s) => s.avg_hr).filter((v) => v != null);
  const avgHr = hrVals.length ? Math.round(hrVals.reduce((a, b) => a + b, 0) / hrVals.length) : null;

  const badmintons = sessions.filter((s) => s.type === "BADMINTON");
  const badmintonMinutes = badmintons.reduce((sum, s) => sum + (Number(s.duration_min) || 0), 0);

  const tennisSessions = sessions.filter((s) => s.type === "TENNIS");
  const tennisMinutes = tennisSessions.reduce((sum, s) => sum + (Number(s.duration_min) || 0), 0);

  const swims = sessions.filter((s) => s.type === "SWIM");
  const swimKm = swims.reduce((sum, s) => sum + (Number(s.distance_km) || 0), 0);

  const gyms = sessions.filter((s) => s.type === "GYM");
  let topLifts = [];
  if (gyms.length) {
    const { data: sets, error } = await supabase
      .from("grind_gym_sets")
      .select("exercise_name, weight_kg, session_id")
      .in("session_id", gyms.map((s) => s.id));
    if (error) throw error;
    const maxBy = {};
    for (const s of sets || []) {
      const w = Number(s.weight_kg) || 0;
      if (!maxBy[s.exercise_name] || w > maxBy[s.exercise_name]) maxBy[s.exercise_name] = w;
    }
    topLifts = Object.entries(maxBy)
      .map(([exerciseName, maxWeight]) => ({ exerciseName, maxWeight }))
      .sort((a, b) => b.maxWeight - a.maxWeight)
      .slice(0, 5);
  }

  return {
    run: { totalKm, avgPace: avgPaceSec != null ? secondsToPace(avgPaceSec) : null, avgHr, count: runs.length },
    badminton: { count: badmintons.length, totalHours: Math.round((badmintonMinutes / 60) * 10) / 10 },
    tennis: { count: tennisSessions.length, totalHours: Math.round((tennisMinutes / 60) * 10) / 10 },
    swim: { totalKm: swimKm, count: swims.length },
    gym: { count: gyms.length, topLifts },
  };
}

function planSessionTypeToType(sessionType) {
  if (sessionType === "BADMINTON") return "BADMINTON";
  if (sessionType === "GYM") return "GYM";
  if (sessionType === "REST") return "REST";
  if (sessionType === "SWIM") return "SWIM";
  if (sessionType === "TENNIS") return "TENNIS";
  return "RUN";
}

const PLAN_TYPE_TO_SUBTYPE = { EASY: "Easy", QUALITY: "Tempo", "LONG RUN": "Long Run", "RACE DAY": "Race" };

// Bulk import TSV (paste dari Google Sheets/Excel) - upsert tiap baris ke grind_plans
// berdasarkan (phone, plan_date). Baris berstatus "Selesai" dengan data aktual (atau sesi
// badminton yang selesai) otomatis bikin historical record di grind_sessions juga, source
// ditandai 'IMPORT' biar re-import nggak bikin duplikat (dicek per plan, bukan per tanggal -
// lihat source check di bawah).
//
// Safe re-import: kalau plan itu di database udah berstatus DONE (misal sebelumnya diselesain
// manual lewat web), status dari TSV TIDAK boleh menimpa balik ke PENDING/SKIPPED - sheet
// training plan sering di-paste ulang sebelum kolom "Status"-nya diupdate manual, jadi re-import
// nggak boleh "mengundo" progress yang udah tercatat.
export async function importTrainingPlan(phone, tsvText) {
  const rows = parseTrainingPlanTsv(tsvText);
  if (!rows.length) return { imported: 0, sessionsCreated: 0 };

  const dates = rows.map((r) => r.planDate).sort();
  const existingPlans = await getPlanRange(phone, dates[0], dates[dates.length - 1]);
  const existingStatusByDate = new Map(existingPlans.map((p) => [p.plan_date, p.status]));

  let imported = 0;
  let sessionsCreated = 0;

  for (const row of rows) {
    const finalStatus = existingStatusByDate.get(row.planDate) === "DONE" ? "DONE" : row.status;

    const { data: plan, error } = await supabase
      .from("grind_plans")
      .upsert(
        {
          phone,
          plan_date: row.planDate,
          week_num: row.weekNum,
          phase: row.phase,
          session_type: row.sessionType,
          race_name: row.raceName,
          target_distance_km: row.targetDistanceKm,
          target_pace: row.targetPace,
          target_hr: row.targetHr,
          instructions: row.instructions,
          status: finalStatus,
        },
        { onConflict: "phone,plan_date" }
      )
      .select("id")
      .single();
    if (error) throw error;
    imported++;

    const isCompletedBadminton = row.sessionType === "BADMINTON" && row.status === "DONE";
    const hasActual = row.actualDistanceKm != null || row.actualPace != null;
    if (row.status !== "DONE" || !(hasActual || isCompletedBadminton)) continue;

    const { data: existing, error: existErr } = await supabase
      .from("grind_sessions")
      .select("id")
      .eq("plan_id", plan.id)
      .eq("source", "IMPORT")
      .limit(1)
      .maybeSingle();
    if (existErr) throw existErr;
    if (existing) continue;

    const { error: insErr } = await supabase.from("grind_sessions").insert({
      phone,
      plan_id: plan.id,
      session_date: row.planDate,
      session_time: "AM",
      type: planSessionTypeToType(row.sessionType),
      sub_type: PLAN_TYPE_TO_SUBTYPE[row.sessionType] || null,
      distance_km: row.actualDistanceKm,
      avg_pace: row.actualPace,
      notes: row.instructions,
      source: "IMPORT",
    });
    if (insErr) throw insErr;
    sessionsCreated++;
  }

  return { imported, sessionsCreated };
}
