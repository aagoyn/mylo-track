import express from "express";
import { requireAuth } from "../../shared/auth.js";
import {
  getProducts,
  getActiveProducts,
  getProductById,
  createProduct,
  updateProduct,
  setProductStatus,
  deleteProduct,
  getAllRoutineRules,
  upsertRoutineRule,
  setRuleEnabled,
  listRelationships,
  upsertRelationship,
  setRelationshipEnabled,
  deleteRelationship,
  listRotationGroups,
  mergeIntoRotationGroup,
  setRotationGroupEnabled,
  setRotationGroupPreference,
  deleteRotationGroup,
  setDailyChoice,
  todayDateKeyWib,
} from "./supabase.js";
import { getDayRoutine } from "./routine-engine.js";
import { analyzeProduct, reviewRoutine } from "./gemini.js";
import {
  renderSkincareDashboard,
  renderProductsPage,
  renderProductFormPage,
  renderSuggestionPage,
  renderRoutineReviewPage,
  renderRulesPage,
  suggestionCardHtml,
} from "./dashboard.js";

const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function dateLabelForKey(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const wibDate = new Date(Date.UTC(y, m - 1, d));
  return `${WEEKDAYS_EN[wibDate.getUTCDay()]}, ${MONTHS_EN[wibDate.getUTCMonth()]} ${wibDate.getUTCDate()}`;
}

function redirectErr(res, path, message) {
  res.redirect(`${path}?err=${encodeURIComponent(message)}`);
}

function flashFromQuery(query) {
  if (query.err) return { type: "error", text: query.err };
  if (query.ok) return { type: "success", text: "Saved." };
  return null;
}

// Cocokin nama produk yang disebut AI ("with_product") ke id produk existing milik user -
// AI cuma tau nama, bukan id, dan kadang salah eja/salah huruf besar-kecil.
function matchProductByName(products, name) {
  const normalized = name.trim().toLowerCase();
  return products.find((p) => p.name.trim().toLowerCase() === normalized);
}

// Ubah hasil gemini.js (yang isinya nama produk) jadi bentuk siap-render (yang isinya id
// produk) buat dashboard.js - nama yang nggak match ke produk manapun di-drop + dicatat di
// warnings, bukan bikin request gagal.
function enrichSuggestion(rawSuggestion, existingProducts) {
  const warnings = [...rawSuggestion.warnings];
  const relationships = [];
  for (const rel of rawSuggestion.relationships) {
    const match = matchProductByName(existingProducts, rel.with_product);
    if (!match) {
      warnings.push(`AI mentioned "${rel.with_product}" but that doesn't match any of your products — skipped.`);
      continue;
    }
    relationships.push({ type: rel.type, targetId: match.id, targetName: match.name, reason: rel.reason });
  }

  const rotationTargets = rawSuggestion.rotation.with_products
    .map((name) => matchProductByName(existingProducts, name))
    .filter(Boolean);
  if (rawSuggestion.rotation.mode && rotationTargets.length !== rawSuggestion.rotation.with_products.length) {
    warnings.push("AI mentioned a product for rotation/alternative that doesn't match any of your products — skipped.");
  }

  return {
    suggestion: rawSuggestion.suggestion,
    relationships,
    rotation: {
      mode: rotationTargets.length ? rawSuggestion.rotation.mode : null,
      targetIds: rotationTargets.map((p) => p.id),
      targetNames: rotationTargets.map((p) => p.name),
      note: rawSuggestion.rotation.note,
    },
    reasoning: rawSuggestion.reasoning,
    warnings,
  };
}

function parseRoutineOrder(raw) {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : 100;
}

function toArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

export const router = express.Router();

// ---------- today's routine ----------

router.get("/hub/skincare", requireAuth, async (req, res) => {
  try {
    const phone = req.user.phone;
    const dateKey = todayDateKeyWib();
    const [products, dayRoutine] = await Promise.all([getProducts(phone), getDayRoutine(phone, dateKey)]);
    const productById = new Map(products.map((p) => [p.id, p]));

    let recovery = null;
    if (req.query.recovery) {
      const active = await getActiveProducts(phone);
      const face = active.filter((p) => p.area === "FACE");
      const cleanser = face.find((p) => p.category === "Cleanser" || p.category === "Cleansing Oil");
      const moisturizer = face.find((p) => p.category === "Moisturizer");
      recovery = { steps: [cleanser, moisturizer].filter(Boolean) };
    }

    res.send(
      renderSkincareDashboard({
        productsCount: products.length,
        dayRoutine,
        productById,
        dateLabel: dateLabelForKey(dateKey),
        recovery,
      })
    );
  } catch (err) {
    console.error(err);
    res.status(500).send(`Gagal load halaman skincare: ${err.message}`);
  }
});

// ---------- products ----------

router.get("/hub/skincare/products", requireAuth, async (req, res) => {
  try {
    const phone = req.user.phone;
    const [products, rules] = await Promise.all([getProducts(phone), getAllRoutineRules(phone)]);
    const rulesByProductId = new Map(rules.map((r) => [r.product_id, r]));
    res.send(renderProductsPage({ products, rulesByProductId, flash: flashFromQuery(req.query) }));
  } catch (err) {
    console.error(err);
    res.status(500).send(`Gagal load halaman produk: ${err.message}`);
  }
});

// Add Product langsung disusul AI analysis buat produk itu (bukan 2 langkah terpisah) - kalau
// AI-nya gagal, produknya tetep kesimpen (cuma belum ada rule), user masih bisa "Analyze with
// AI" lagi dari list kapan aja (lihat productRowHtml).
router.post("/hub/skincare/products", requireAuth, async (req, res) => {
  const phone = req.user.phone;
  const name = (req.body.name || "").trim();
  if (!name) return redirectErr(res, "/hub/skincare/products", "Product name can't be empty.");

  let productId;
  try {
    productId = await createProduct(phone, {
      name,
      brand: (req.body.brand || "").trim(),
      category: req.body.category,
      area: req.body.area,
      notes: (req.body.notes || "").trim(),
    });
  } catch (err) {
    console.error(err);
    return redirectErr(res, "/hub/skincare/products", `Gagal simpan produk: ${err.message}`);
  }

  try {
    const product = await getProductById(phone, productId);
    const activeProducts = await getActiveProducts(phone);
    const context = activeProducts.filter((p) => p.id !== product.id);

    const rawSuggestion = await analyzeProduct(product, context);
    const enriched = enrichSuggestion(rawSuggestion, context);

    res.send(renderSuggestionPage({ product, enriched, backHref: "/hub/skincare/products" }));
  } catch (err) {
    console.error(err);
    redirectErr(
      res,
      "/hub/skincare/products",
      `Product saved, but AI analysis failed: ${err.message}. You can retry with "Analyze with AI" from the list.`
    );
  }
});

router.get("/hub/skincare/products/:id/edit", requireAuth, async (req, res) => {
  try {
    const product = await getProductById(req.user.phone, req.params.id);
    if (!product) return res.status(404).send("Product not found.");
    res.send(renderProductFormPage({ mode: "edit", product, flash: flashFromQuery(req.query) }));
  } catch (err) {
    console.error(err);
    res.status(500).send(`Gagal load produk: ${err.message}`);
  }
});

router.post("/hub/skincare/products/:id/update", requireAuth, async (req, res) => {
  const name = (req.body.name || "").trim();
  if (!name) return redirectErr(res, `/hub/skincare/products/${req.params.id}/edit`, "Product name can't be empty.");

  try {
    await updateProduct(req.user.phone, req.params.id, {
      name,
      brand: (req.body.brand || "").trim(),
      category: req.body.category,
      area: req.body.area,
      notes: (req.body.notes || "").trim(),
    });
    res.redirect("/hub/skincare/products?ok=1");
  } catch (err) {
    console.error(err);
    redirectErr(res, `/hub/skincare/products/${req.params.id}/edit`, `Gagal update produk: ${err.message}`);
  }
});

router.post("/hub/skincare/products/:id/pause", requireAuth, async (req, res) => {
  try {
    await setProductStatus(req.user.phone, req.params.id, "PAUSED");
    res.redirect("/hub/skincare/products?ok=1");
  } catch (err) {
    console.error(err);
    redirectErr(res, "/hub/skincare/products", `Gagal pause produk: ${err.message}`);
  }
});

router.post("/hub/skincare/products/:id/finish", requireAuth, async (req, res) => {
  try {
    await setProductStatus(req.user.phone, req.params.id, "FINISHED");
    res.redirect("/hub/skincare/products?ok=1");
  } catch (err) {
    console.error(err);
    redirectErr(res, "/hub/skincare/products", `Gagal finish produk: ${err.message}`);
  }
});

router.post("/hub/skincare/products/:id/delete", requireAuth, async (req, res) => {
  try {
    await deleteProduct(req.user.phone, req.params.id);
    res.redirect("/hub/skincare/products?ok=1");
  } catch (err) {
    console.error(err);
    redirectErr(res, "/hub/skincare/products", `Gagal hapus produk: ${err.message}`);
  }
});

// ---------- AI analysis (nggak nyimpen apa pun sampai user approve) ----------

router.post("/hub/skincare/analyze", requireAuth, async (req, res) => {
  try {
    const phone = req.user.phone;
    const product = await getProductById(phone, req.body.product_id);
    if (!product) return res.status(404).send("Product not found.");

    const activeProducts = await getActiveProducts(phone);
    const context = activeProducts.filter((p) => p.id !== product.id);

    const rawSuggestion = await analyzeProduct(product, context);
    const enriched = enrichSuggestion(rawSuggestion, context);

    res.send(renderSuggestionPage({ product, enriched, backHref: "/hub/skincare/products" }));
  } catch (err) {
    console.error(err);
    redirectErr(res, "/hub/skincare/products", `Gagal analisis produk: ${err.message}`);
  }
});

router.post("/hub/skincare/review", requireAuth, async (req, res) => {
  try {
    const phone = req.user.phone;
    const [activeProducts, rules] = await Promise.all([getActiveProducts(phone), getAllRoutineRules(phone)]);
    const rulesByProductId = new Map(rules.map((r) => [r.product_id, r]));

    const { suggestions, overall_notes } = await reviewRoutine(activeProducts, rulesByProductId);

    const cards = suggestions
      .map((s) => {
        const product = matchProductByName(activeProducts, s.product_name);
        if (!product) return null;
        const context = activeProducts.filter((p) => p.id !== product.id);
        const enriched = enrichSuggestion(s, context);
        return suggestionCardHtml({ product, enriched, cancelHref: "/hub/skincare" });
      })
      .filter(Boolean);

    res.send(renderRoutineReviewPage({ cards, overallNotes: overall_notes, hasNoSuggestions: cards.length === 0 }));
  } catch (err) {
    console.error(err);
    redirectErr(res, "/hub/skincare", `Gagal review rutin: ${err.message}`);
  }
});

// ---------- approve suggestion -> jadi rule/relationship/rotation deterministic ----------

router.post("/hub/skincare/suggestions/approve", requireAuth, async (req, res) => {
  try {
    const phone = req.user.phone;
    const product = await getProductById(phone, req.body.product_id);
    if (!product) return res.status(404).send("Product not found.");

    const days = toArray(req.body.days).map((d) => parseInt(d, 10)).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);

    await upsertRoutineRule(phone, product.id, {
      routineTime: req.body.routine_time,
      frequencyType: req.body.frequency_type,
      daysOfWeek: days,
      routineOrder: parseRoutineOrder(req.body.routine_order),
      enabled: true,
    });

    for (const targetId of toArray(req.body.exclude_target)) {
      await upsertRelationship(phone, { sourceProductId: product.id, targetProductId: targetId, type: "EXCLUDE" });
    }
    for (const targetId of toArray(req.body.optional_target)) {
      await upsertRelationship(phone, { sourceProductId: product.id, targetProductId: targetId, type: "OPTIONAL_WITH" });
    }

    if (req.body.apply_rotation && req.body.rotation_mode) {
      const rotateTargets = toArray(req.body.rotate_target);
      if (rotateTargets.length) {
        await mergeIntoRotationGroup(phone, {
          mode: req.body.rotation_mode,
          label: null,
          productIds: [product.id, ...rotateTargets],
        });
      }
    }

    res.redirect("/hub/skincare/rules?ok=1");
  } catch (err) {
    console.error(err);
    redirectErr(res, "/hub/skincare", `Gagal simpan rule dari saran AI: ${err.message}`);
  }
});

// ---------- rules management ----------

router.get("/hub/skincare/rules", requireAuth, async (req, res) => {
  try {
    const phone = req.user.phone;
    const [products, rules, relationships, rotationGroups] = await Promise.all([
      getProducts(phone),
      getAllRoutineRules(phone),
      listRelationships(phone),
      listRotationGroups(phone),
    ]);
    const rulesByProductId = new Map(rules.map((r) => [r.product_id, r]));
    const productById = new Map(products.map((p) => [p.id, p]));

    res.send(renderRulesPage({ products, rulesByProductId, relationships, rotationGroups, productById }));
  } catch (err) {
    console.error(err);
    res.status(500).send(`Gagal load halaman rules: ${err.message}`);
  }
});

router.post("/hub/skincare/rules/:id/toggle", requireAuth, async (req, res) => {
  try {
    const rules = await getAllRoutineRules(req.user.phone);
    const rule = rules.find((r) => r.id === req.params.id);
    if (!rule) return res.status(404).send("Rule not found.");
    await setRuleEnabled(req.user.phone, rule.id, !rule.enabled);
    res.redirect("/hub/skincare/rules?ok=1");
  } catch (err) {
    console.error(err);
    redirectErr(res, "/hub/skincare/rules", `Gagal update rule: ${err.message}`);
  }
});

router.post("/hub/skincare/relationships/:id/toggle", requireAuth, async (req, res) => {
  try {
    const relationships = await listRelationships(req.user.phone);
    const rel = relationships.find((r) => r.id === req.params.id);
    if (!rel) return res.status(404).send("Rule not found.");
    await setRelationshipEnabled(req.user.phone, rel.id, !rel.enabled);
    res.redirect("/hub/skincare/rules?ok=1");
  } catch (err) {
    console.error(err);
    redirectErr(res, "/hub/skincare/rules", `Gagal update rule: ${err.message}`);
  }
});

router.post("/hub/skincare/relationships/:id/delete", requireAuth, async (req, res) => {
  try {
    await deleteRelationship(req.user.phone, req.params.id);
    res.redirect("/hub/skincare/rules?ok=1");
  } catch (err) {
    console.error(err);
    redirectErr(res, "/hub/skincare/rules", `Gagal hapus rule: ${err.message}`);
  }
});

router.post("/hub/skincare/groups/:id/toggle", requireAuth, async (req, res) => {
  try {
    const groups = await listRotationGroups(req.user.phone);
    const group = groups.find((g) => g.id === req.params.id);
    if (!group) return res.status(404).send("Group not found.");
    await setRotationGroupEnabled(req.user.phone, group.id, !group.enabled);
    res.redirect("/hub/skincare/rules?ok=1");
  } catch (err) {
    console.error(err);
    redirectErr(res, "/hub/skincare/rules", `Gagal update grup: ${err.message}`);
  }
});

router.post("/hub/skincare/groups/:id/preference", requireAuth, async (req, res) => {
  try {
    await setRotationGroupPreference(req.user.phone, req.params.id, req.body.preferred_product_id || null);
    res.redirect("/hub/skincare/rules?ok=1");
  } catch (err) {
    console.error(err);
    redirectErr(res, "/hub/skincare/rules", `Gagal simpan preferensi: ${err.message}`);
  }
});

router.post("/hub/skincare/groups/:id/delete", requireAuth, async (req, res) => {
  try {
    await deleteRotationGroup(req.user.phone, req.params.id);
    res.redirect("/hub/skincare/rules?ok=1");
  } catch (err) {
    console.error(err);
    redirectErr(res, "/hub/skincare/rules", `Gagal hapus grup: ${err.message}`);
  }
});

// dipakai dashboard hari ini buat grup ALTERNATIVE mode "biarkan aku pilih tiap pagi"
router.post("/hub/skincare/groups/:id/choose-today", requireAuth, async (req, res) => {
  try {
    await setDailyChoice(req.user.phone, req.params.id, todayDateKeyWib(), req.body.product_id);
    res.redirect("/hub/skincare");
  } catch (err) {
    console.error(err);
    redirectErr(res, "/hub/skincare", `Gagal simpan pilihan: ${err.message}`);
  }
});
