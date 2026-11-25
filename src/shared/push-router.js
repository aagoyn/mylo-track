import express from "express";
import { requireAuth } from "./auth.js";
import { saveSubscription, removeSubscription } from "./push.js";

export const router = express.Router();

router.get("/push/public-key", requireAuth, (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || "" });
});

router.post("/push/subscribe", requireAuth, async (req, res) => {
  try {
    await saveSubscription(req.user.phone, req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Gagal simpan subscription." });
  }
});

router.post("/push/unsubscribe", requireAuth, async (req, res) => {
  try {
    await removeSubscription(req.body.endpoint);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Gagal hapus subscription." });
  }
});
