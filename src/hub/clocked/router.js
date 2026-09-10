import express from "express";
import { requireAuth } from "../../shared/auth.js";
import { clockIn, clockOut, markDay, getRecentClockLogs, getTodayClockLog } from "./supabase.js";
import { renderClockedPage } from "./dashboard.js";

export const router = express.Router();

function redirectErr(res, path, message) {
  res.redirect(`${path}?err=${encodeURIComponent(message)}`);
}

// Aksi (clock-in/clock-out/mark-day) dipasang di dua tempat: kartu ringkas di /hub, dan
// halaman lengkap /hub/clocked - abis submit, balik ke halaman asal submit-nya, bukan selalu
// ke /hub. Submit dari /hub/clocked juga boleh override mode hari ini yang udah ada (mis. salah
// pencet WFO padahal maunya WFH) - submit dari kartu ringkas Hub tetap locked-once-per-day.
function fromClockedPage(req) {
  return (req.get("Referer") || "").includes("/hub/clocked");
}

function redirectTarget(req) {
  return fromClockedPage(req) ? "/hub/clocked" : "/hub";
}

router.get("/hub/clocked", requireAuth, async (req, res) => {
  try {
    const phone = req.user.phone;
    const [logs, todayLog] = await Promise.all([getRecentClockLogs(phone, 30), getTodayClockLog(phone)]);
    const flash = req.query.err
      ? { type: "error", text: req.query.err }
      : req.query.ok
        ? { type: "success", text: "Saved." }
        : null;
    res.send(renderClockedPage({ logs, todayLog, flash }));
  } catch (err) {
    console.error(err);
    res.status(500).send(`Gagal load halaman Clocked!: ${err.message}`);
  }
});

router.post("/hub/clocked/clock-in", requireAuth, async (req, res) => {
  const target = redirectTarget(req);
  try {
    await clockIn(req.user.phone, { force: fromClockedPage(req) });
    res.redirect(`${target}?ok=1`);
  } catch (err) {
    console.error(err);
    redirectErr(res, target, `Gagal clock in: ${err.message}`);
  }
});

router.post("/hub/clocked/mark-day", requireAuth, async (req, res) => {
  const target = redirectTarget(req);
  const mode = req.body.mode;
  if (mode !== "WFH" && mode !== "OFF") {
    return redirectErr(res, target, "Mode nggak valid.");
  }
  try {
    await markDay(req.user.phone, mode, { force: fromClockedPage(req) });
    res.redirect(`${target}?ok=1`);
  } catch (err) {
    console.error(err);
    redirectErr(res, target, `Gagal simpan: ${err.message}`);
  }
});

router.post("/hub/clocked/clock-out", requireAuth, async (req, res) => {
  const target = redirectTarget(req);
  try {
    await clockOut(req.user.phone);
    res.redirect(`${target}?ok=1`);
  } catch (err) {
    console.error(err);
    redirectErr(res, target, `Gagal clock out: ${err.message}`);
  }
});
