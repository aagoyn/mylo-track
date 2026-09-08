import express from "express";
import { requireAuth } from "../../shared/auth.js";
import {
  getWishlistItems,
  createWishlistItem,
  updateWishlistItem,
  deleteWishlistItem,
} from "./supabase.js";
import { renderWishlistPage } from "./dashboard.js";

function parsePrice(raw) {
  const trimmed = (raw || "").trim();
  if (!trimmed) return null;
  const value = parseFloat(trimmed);
  return isNaN(value) || value < 0 ? null : value;
}

export const router = express.Router();

router.get("/hub/wishlist", requireAuth, async (req, res) => {
  try {
    const items = await getWishlistItems(req.user.phone);

    const flash = req.query.err
      ? { type: "error", text: req.query.err }
      : req.query.ok
        ? { type: "success", text: "Saved." }
        : null;

    res.send(renderWishlistPage({ items, flash }));
  } catch (err) {
    console.error(err);
    res.status(500).send(`Gagal load halaman wishlist: ${err.message}`);
  }
});

router.post("/hub/wishlist", requireAuth, async (req, res) => {
  const title = (req.body.title || "").trim();
  if (!title) return res.redirect("/hub/wishlist?err=Title can't be empty.");

  try {
    await createWishlistItem(req.user.phone, {
      title,
      category: req.body.category,
      estimatedPrice: parsePrice(req.body.estimated_price),
      priority: req.body.priority,
      status: req.body.status,
      note: (req.body.note || "").trim(),
    });
    res.redirect("/hub/wishlist?ok=1");
  } catch (err) {
    console.error(err);
    res.redirect(`/hub/wishlist?err=${encodeURIComponent(`Gagal simpan item: ${err.message}`)}`);
  }
});

router.post("/hub/wishlist/:id/update", requireAuth, async (req, res) => {
  const title = (req.body.title || "").trim();
  if (!title) return res.redirect("/hub/wishlist?err=Title can't be empty.");

  try {
    await updateWishlistItem(req.user.phone, req.params.id, {
      title,
      category: req.body.category,
      estimatedPrice: parsePrice(req.body.estimated_price),
      priority: req.body.priority,
      status: req.body.status,
      note: (req.body.note || "").trim(),
    });
    res.redirect("/hub/wishlist?ok=1");
  } catch (err) {
    console.error(err);
    res.redirect(`/hub/wishlist?err=${encodeURIComponent(`Gagal update item: ${err.message}`)}`);
  }
});

router.post("/hub/wishlist/:id/delete", requireAuth, async (req, res) => {
  try {
    await deleteWishlistItem(req.user.phone, req.params.id);
    res.redirect("/hub/wishlist?ok=1");
  } catch (err) {
    console.error(err);
    res.redirect(`/hub/wishlist?err=${encodeURIComponent(`Gagal hapus item: ${err.message}`)}`);
  }
});
