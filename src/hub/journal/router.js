import express from "express";
import { requireAuth } from "../../shared/auth.js";
import { saveJournalEntry, getJournalEntry, getRecentJournalEntries, todayDateKeyWib } from "./supabase.js";
import { renderJournalPage } from "./dashboard.js";

export const router = express.Router();

router.get("/hub/journal", requireAuth, async (req, res) => {
  try {
    const phone = req.user.phone;
    const todayKey = todayDateKeyWib();
    const viewDate = req.query.date || todayKey;

    const [entry, recent] = await Promise.all([
      getJournalEntry(phone, viewDate),
      getRecentJournalEntries(phone, 10),
    ]);

    const flash = req.query.err
      ? { type: "error", text: req.query.err }
      : req.query.ok
        ? { type: "success", text: "Saved." }
        : null;

    res.send(
      renderJournalPage({
        viewDate,
        todayKey,
        entry,
        recent,
        editMode: Boolean(req.query.edit) || !entry,
        flash,
      })
    );
  } catch (err) {
    console.error(err);
    res.status(500).send(`Gagal load halaman journal: ${err.message}`);
  }
});

router.post("/hub/journal", requireAuth, async (req, res) => {
  const dateKey = req.body.date || todayDateKeyWib();
  const content = (req.body.content || "").trim();

  if (!content) {
    return res.redirect(`/hub/journal?date=${dateKey}&err=${encodeURIComponent("Entry can't be empty.")}`);
  }

  try {
    await saveJournalEntry(req.user.phone, dateKey, content);
    res.redirect(`/hub/journal?date=${dateKey}&ok=1`);
  } catch (err) {
    console.error(err);
    res.redirect(`/hub/journal?date=${dateKey}&err=${encodeURIComponent(`Gagal simpan journal: ${err.message}`)}`);
  }
});
