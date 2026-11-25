import express from "express";
import { requireAuth } from "../../shared/auth.js";
import {
  todayDateKeyWib,
  getWeekDateBoundsWib,
  getNextWeekDateBoundsWib,
  getMonthDateBoundsWib,
  defaultSessionTimeWib,
  getPlanByDate,
  getPlanById,
  getPlanRange,
  getUpcomingRace,
  markPlanStatus,
  updatePlan,
  movePlanToToday,
  getSessionsByDate,
  getSessionsInRange,
  getSessionsSince,
  createSession,
  updateSession,
  deleteSession,
  addGymSets,
  getLastGymSplit,
  getRecentSessions,
  getMonthSummary,
  importTrainingPlan,
} from "./supabase.js";
import { renderGrindPage } from "./dashboard.js";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
// Target lari mingguan tetap 21km, bukan dijumlah dari target_distance_km tiap plan Run minggu
// ini - jadwal yang padat/longgar nggak ikut nggeser angka targetnya, cuma Actual yang gerak.
const WEEKLY_RUN_TARGET_KM = 21;

function redirectWithError(res, message) {
  res.redirect(`/hub/grind?err=${encodeURIComponent(message)}`);
}

function sportForSessionType(sessionType) {
  if (sessionType === "BADMINTON") return "badminton";
  if (sessionType === "TENNIS") return "tennis";
  if (sessionType === "GYM") return "gym";
  if (sessionType === "SWIM") return "swim";
  if (sessionType === "REST") return null;
  return "run";
}

const PLAN_TYPE_TO_SUBTYPE = { EASY: "Easy", QUALITY: "Tempo", "LONG RUN": "Long Run", "RACE DAY": "Race" };

// "Baru aja Run (>=5km) atau Badminton" dalam 24 jam terakhir -> saranin fokus Upper Body
// malam ini daripada Heavy Legs (Smart Recovery Hint di form Gym).
function buildRecoveryHint(recentSessions) {
  const heavyRun = recentSessions.find((s) => s.type === "RUN" && Number(s.distance_km) >= 5);
  const highIntensity = recentSessions.find((s) => s.type === "BADMINTON" || s.type === "TENNIS");
  if (heavyRun) return "Kamu baru aja Run - malam ini disarankan fokus Upper Body (Push/Pull) daripada Heavy Legs.";
  if (highIntensity)
    return `Kamu baru aja ${highIntensity.type === "TENNIS" ? "Tennis" : "Badminton"} - malam ini disarankan fokus Upper Body (Push/Pull) daripada Heavy Legs.`;
  return null;
}

export const router = express.Router();

router.get("/hub/grind", requireAuth, async (req, res) => {
  try {
    const phone = req.user.phone;
    const todayKey = todayDateKeyWib();
    const { startKey: weekStart, endKey: weekEnd } = getWeekDateBoundsWib();
    const { startKey: nextWeekStart, endKey: nextWeekEnd } = getNextWeekDateBoundsWib();
    const { startKey: monthStart, endKey: monthEnd } = getMonthDateBoundsWib();
    const sinceISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [
      todayPlan,
      todaySessions,
      upcomingRace,
      weekPlans,
      nextWeekPlans,
      weekSessions,
      monthSummary,
      historyLogs,
      recentSessions,
    ] = await Promise.all([
      getPlanByDate(phone, todayKey),
      getSessionsByDate(phone, todayKey),
      getUpcomingRace(phone, todayKey),
      getPlanRange(phone, weekStart, weekEnd),
      getPlanRange(phone, nextWeekStart, nextWeekEnd),
      getSessionsInRange(phone, weekStart, weekEnd),
      getMonthSummary(phone, monthStart, monthEnd),
      getRecentSessions(phone, 30),
      getSessionsSince(phone, sinceISO),
    ]);

    const weekTargetKm = WEEKLY_RUN_TARGET_KM;

    let openForm = req.query.form || null;
    let prefill = null;
    if (req.query.complete && /^\d+$/.test(req.query.complete)) {
      const plan = await getPlanById(phone, req.query.complete);
      if (plan) {
        const sport = sportForSessionType(plan.session_type);
        if (sport) {
          openForm = sport;
          prefill = {
            planId: plan.id,
            subType: PLAN_TYPE_TO_SUBTYPE[plan.session_type] || null,
            distanceKm: plan.target_distance_km,
          };
        }
      }
    }

    const flash = req.query.err
      ? { type: "error", text: req.query.err }
      : req.query.ok
        ? { type: "success", text: "Saved." }
        : null;

    res.send(
      renderGrindPage({
        todayPlan,
        todaySessions,
        upcomingRace,
        weekPlans,
        nextWeekPlans,
        weekSessions,
        weekTargetKm,
        monthSummary,
        historyLogs,
        recoveryHint: buildRecoveryHint(recentSessions),
        flash,
        openForm,
        prefill,
        defaultTime: defaultSessionTimeWib(),
        todayKey,
      })
    );
  } catch (err) {
    console.error(err);
    res.status(500).send(`Gagal load halaman Grind: ${err.message}`);
  }
});

router.post("/hub/grind/import", requireAuth, async (req, res) => {
  const tsv = (req.body.tsv || "").trim();
  if (!tsv) return redirectWithError(res, "Data kosong.");

  try {
    const { imported, sessionsCreated } = await importTrainingPlan(req.user.phone, tsv);
    res.redirect(`/hub/grind?ok=${encodeURIComponent(`${imported} plan di-import, ${sessionsCreated} sesi historis dibuat.`)}`);
  } catch (err) {
    console.error(err);
    redirectWithError(res, `Gagal import plan: ${err.message}`);
  }
});

router.post("/hub/grind/plan/:id/complete-rest", requireAuth, async (req, res) => {
  try {
    const plan = await getPlanById(req.user.phone, req.params.id);
    if (!plan) return redirectWithError(res, "Plan tidak ditemukan.");
    if (plan.status !== "PENDING") return redirectWithError(res, "Plan ini sudah diproses.");

    await createSession(req.user.phone, {
      planId: plan.id,
      sessionDate: plan.plan_date,
      sessionTime: defaultSessionTimeWib(),
      type: "REST",
    });
    res.redirect("/hub/grind?ok=1");
  } catch (err) {
    console.error(err);
    redirectWithError(res, `Gagal complete: ${err.message}`);
  }
});

router.post("/hub/grind/plan/:id/skip", requireAuth, async (req, res) => {
  try {
    const plan = await getPlanById(req.user.phone, req.params.id);
    if (!plan) return redirectWithError(res, "Plan tidak ditemukan.");
    if (plan.status !== "PENDING") return redirectWithError(res, "Plan ini sudah diproses.");

    await markPlanStatus(req.user.phone, plan.id, "SKIPPED");
    res.redirect("/hub/grind?ok=1");
  } catch (err) {
    console.error(err);
    redirectWithError(res, `Gagal skip plan: ${err.message}`);
  }
});

router.post("/hub/grind/plan/:id/move-to-today", requireAuth, async (req, res) => {
  try {
    await movePlanToToday(req.user.phone, req.params.id, todayDateKeyWib());
    res.redirect("/hub/grind?ok=1");
  } catch (err) {
    console.error(err);
    redirectWithError(res, `Gagal pindahin plan: ${err.message}`);
  }
});

router.post("/hub/grind/plan/:id/update", requireAuth, async (req, res) => {
  const targetDistanceKmRaw = (req.body.target_distance_km || "").trim();
  try {
    await updatePlan(req.user.phone, req.params.id, {
      targetDistanceKm: targetDistanceKmRaw ? parseFloat(targetDistanceKmRaw) : null,
      targetPace: (req.body.target_pace || "").trim(),
      targetHr: (req.body.target_hr || "").trim(),
      instructions: (req.body.instructions || "").trim(),
    });
    res.redirect("/hub/grind?ok=1");
  } catch (err) {
    console.error(err);
    redirectWithError(res, `Gagal update plan: ${err.message}`);
  }
});

// Handler generik buat sport jarak (Run/Swim) & sport durasi (Badminton/Tennis) - bedanya cuma
// field mana yang dipakai, sisanya sama persis (lihat distanceSportFormHtml/durationSportFormHtml
// di dashboard.js).
function registerDistanceSportRoute(path, type) {
  router.post(path, requireAuth, async (req, res) => {
    const distanceKmRaw = (req.body.distance_km || "").trim();
    const durationMinRaw = (req.body.duration_min || "").trim();
    const avgHrRaw = (req.body.avg_hr || "").trim();

    try {
      await createSession(req.user.phone, {
        planId: req.body.plan_id || null,
        sessionDate: todayDateKeyWib(),
        sessionTime: req.body.session_time === "PM" ? "PM" : "AM",
        type,
        subType: req.body.sub_type,
        distanceKm: distanceKmRaw ? parseFloat(distanceKmRaw) : null,
        durationMin: durationMinRaw ? parseInt(durationMinRaw, 10) : null,
        avgPace: (req.body.avg_pace || "").trim(),
        avgHr: avgHrRaw ? parseInt(avgHrRaw, 10) : null,
        notes: (req.body.notes || "").trim(),
      });
      res.redirect("/hub/grind?ok=1");
    } catch (err) {
      console.error(err);
      redirectWithError(res, `Gagal simpan ${type.toLowerCase()}: ${err.message}`);
    }
  });
}

function registerDurationSportRoute(path, type) {
  router.post(path, requireAuth, async (req, res) => {
    const durationMinRaw = (req.body.duration_min || "").trim();
    const avgHrRaw = (req.body.avg_hr || "").trim();

    try {
      await createSession(req.user.phone, {
        planId: req.body.plan_id || null,
        sessionDate: todayDateKeyWib(),
        sessionTime: req.body.session_time === "PM" ? "PM" : "AM",
        type,
        subType: req.body.sub_type,
        durationMin: durationMinRaw ? parseInt(durationMinRaw, 10) : null,
        avgHr: avgHrRaw ? parseInt(avgHrRaw, 10) : null,
        notes: (req.body.notes || "").trim(),
      });
      res.redirect("/hub/grind?ok=1");
    } catch (err) {
      console.error(err);
      redirectWithError(res, `Gagal simpan ${type.toLowerCase()}: ${err.message}`);
    }
  });
}

registerDistanceSportRoute("/hub/grind/sessions/run", "RUN");
registerDistanceSportRoute("/hub/grind/sessions/swim", "SWIM");
registerDurationSportRoute("/hub/grind/sessions/badminton", "BADMINTON");
registerDurationSportRoute("/hub/grind/sessions/tennis", "TENNIS");

router.post("/hub/grind/sessions/gym", requireAuth, async (req, res) => {
  const durationMinRaw = (req.body.duration_min || "").trim();

  const exerciseNames = [].concat(req.body["exercise_name[]"] || []);
  const setOrders = [].concat(req.body["set_order[]"] || []);
  const weights = [].concat(req.body["weight_kg[]"] || []);
  const reps = [].concat(req.body["reps[]"] || []);

  try {
    const sessionId = await createSession(req.user.phone, {
      planId: req.body.plan_id || null,
      sessionDate: todayDateKeyWib(),
      sessionTime: req.body.session_time === "PM" ? "PM" : "AM",
      type: "GYM",
      subType: req.body.sub_type,
      durationMin: durationMinRaw ? parseInt(durationMinRaw, 10) : null,
      notes: (req.body.notes || "").trim(),
    });

    const sets = exerciseNames
      .map((name, i) => ({
        exerciseName: (name || "").trim(),
        setOrder: parseInt(setOrders[i], 10) || i + 1,
        weightKg: weights[i] ? parseFloat(weights[i]) : null,
        reps: reps[i] ? parseInt(reps[i], 10) : null,
      }))
      .filter((s) => s.exerciseName);

    await addGymSets(sessionId, sets);
    res.redirect("/hub/grind?ok=1");
  } catch (err) {
    console.error(err);
    redirectWithError(res, `Gagal simpan gym: ${err.message}`);
  }
});

router.post("/hub/grind/sessions/rest", requireAuth, async (req, res) => {
  try {
    const todayKey = todayDateKeyWib();
    const todayPlan = await getPlanByDate(req.user.phone, todayKey);
    const planId = todayPlan?.session_type === "REST" && todayPlan.status === "PENDING" ? todayPlan.id : null;

    await createSession(req.user.phone, {
      planId,
      sessionDate: todayKey,
      sessionTime: defaultSessionTimeWib(),
      type: "REST",
    });
    res.redirect("/hub/grind?ok=1");
  } catch (err) {
    console.error(err);
    redirectWithError(res, `Gagal simpan rest: ${err.message}`);
  }
});

router.post("/hub/grind/sessions/:id/update", requireAuth, async (req, res) => {
  const distanceKmRaw = (req.body.distance_km || "").trim();
  const durationMinRaw = (req.body.duration_min || "").trim();
  const avgHrRaw = (req.body.avg_hr || "").trim();

  try {
    await updateSession(req.user.phone, req.params.id, {
      sessionDate: (req.body.session_date || "").trim(),
      distanceKm: distanceKmRaw ? parseFloat(distanceKmRaw) : null,
      durationMin: durationMinRaw ? parseInt(durationMinRaw, 10) : null,
      avgPace: (req.body.avg_pace || "").trim(),
      avgHr: avgHrRaw ? parseInt(avgHrRaw, 10) : null,
      notes: (req.body.notes || "").trim(),
    });
    res.redirect("/hub/grind?ok=1");
  } catch (err) {
    console.error(err);
    redirectWithError(res, `Gagal update sesi: ${err.message}`);
  }
});

router.post("/hub/grind/sessions/:id/delete", requireAuth, async (req, res) => {
  try {
    await deleteSession(req.user.phone, req.params.id);
    res.redirect("/hub/grind?ok=1");
  } catch (err) {
    console.error(err);
    redirectWithError(res, `Gagal hapus sesi: ${err.message}`);
  }
});

router.get("/hub/grind/api/last-split", requireAuth, async (req, res) => {
  try {
    const sets = await getLastGymSplit(req.user.phone, req.query.sub_type);
    res.json({ sets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
