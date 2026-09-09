import { supabase } from "../../shared/supabase-client.js";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export function todayDateKeyWib() {
  return new Date(Date.now() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

export function dayOfWeekWib(dateKey) {
  return new Date(`${dateKey}T00:00:00Z`).getUTCDay();
}

export const CATEGORY_VALUES = [
  "Cleansing Oil",
  "Micellar Water",
  "Cleanser",
  "Toner",
  "Essence",
  "Ampoule",
  "Serum",
  "Treatment",
  "Eye Cream",
  "Moisturizer",
  "Sunscreen",
  "Mask",
  "Exfoliant",
  "Spot Treatment",
  "Body Lotion",
  "Body Treatment",
  "Body Sunscreen",
  "Other",
];
export const AREA_VALUES = ["FACE", "BODY"];
export const STATUS_VALUES = ["ACTIVE", "PAUSED", "FINISHED"];
export const ROUTINE_TIME_VALUES = ["AM", "PM", "BOTH"];
export const FREQUENCY_TYPE_VALUES = ["DAILY", "DAYS_OF_WEEK"];
export const RELATIONSHIP_TYPE_VALUES = ["EXCLUDE", "OPTIONAL_WITH"];
export const ROTATION_MODE_VALUES = ["ROTATE", "ALTERNATIVE"];

// ---------- products ----------

export async function getProducts(phone) {
  const { data, error } = await supabase
    .from("skincare_products")
    .select("id, name, brand, category, area, status, notes, created_at")
    .eq("phone", phone)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getActiveProducts(phone) {
  const { data, error } = await supabase
    .from("skincare_products")
    .select("id, name, brand, category, area, status, notes")
    .eq("phone", phone)
    .eq("status", "ACTIVE");
  if (error) throw error;
  return data;
}

export async function getProductById(phone, id) {
  const { data, error } = await supabase
    .from("skincare_products")
    .select("id, name, brand, category, area, status, notes")
    .eq("phone", phone)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createProduct(phone, { name, brand, category, area, notes }) {
  const { data, error } = await supabase
    .from("skincare_products")
    .insert({
      phone,
      name,
      brand: brand || null,
      category: CATEGORY_VALUES.includes(category) ? category : "Other",
      area: AREA_VALUES.includes(area) ? area : "FACE",
      notes: notes || null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateProduct(phone, id, { name, brand, category, area, notes }) {
  const { error } = await supabase
    .from("skincare_products")
    .update({
      name,
      brand: brand || null,
      category: CATEGORY_VALUES.includes(category) ? category : "Other",
      area: AREA_VALUES.includes(area) ? area : "FACE",
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("phone", phone)
    .eq("id", id);
  if (error) throw error;
}

export async function setProductStatus(phone, id, status) {
  if (!STATUS_VALUES.includes(status)) throw new Error(`Status tidak valid: ${status}`);
  const patch = { status, updated_at: new Date().toISOString() };
  if (status === "FINISHED") patch.finished_at = new Date().toISOString();
  const { error } = await supabase.from("skincare_products").update(patch).eq("phone", phone).eq("id", id);
  if (error) throw error;
}

// Bersihin referensi produk yang dihapus dari rotation group (FK di rules/relationships udah
// on-delete-cascade, tapi product_ids di rotation group cuma jsonb array biasa)
export async function deleteProduct(phone, id) {
  const groups = await listRotationGroups(phone);
  for (const g of groups) {
    if (!g.product_ids.includes(id)) continue;
    const remaining = g.product_ids.filter((pid) => pid !== id);
    if (remaining.length < 2) {
      await supabase.from("skincare_rotation_groups").delete().eq("phone", phone).eq("id", g.id);
    } else {
      const patch = { product_ids: remaining, updated_at: new Date().toISOString() };
      if (g.preferred_product_id === id) patch.preferred_product_id = null;
      await supabase.from("skincare_rotation_groups").update(patch).eq("phone", phone).eq("id", g.id);
    }
  }
  const { error } = await supabase.from("skincare_products").delete().eq("phone", phone).eq("id", id);
  if (error) throw error;
}

// ---------- routine rules ----------

export async function getRoutineRuleForProduct(phone, productId) {
  const { data, error } = await supabase
    .from("skincare_routine_rules")
    .select("*")
    .eq("phone", phone)
    .eq("product_id", productId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAllRoutineRules(phone) {
  const { data, error } = await supabase.from("skincare_routine_rules").select("*").eq("phone", phone);
  if (error) throw error;
  return data;
}

export async function getEnabledRoutineRules(phone) {
  const { data, error } = await supabase
    .from("skincare_routine_rules")
    .select("*")
    .eq("phone", phone)
    .eq("enabled", true);
  if (error) throw error;
  return data;
}

// approved oleh user lewat form approve suggestion (atau edit manual di halaman rules) - satu
// rule per produk, jadi upsert on (phone, product_id)
export async function upsertRoutineRule(
  phone,
  productId,
  { routineTime, frequencyType, daysOfWeek, timesPerWeek, routineOrder, enabled = true }
) {
  const { error } = await supabase.from("skincare_routine_rules").upsert(
    {
      phone,
      product_id: productId,
      routine_time: ROUTINE_TIME_VALUES.includes(routineTime) ? routineTime : "AM",
      frequency_type: FREQUENCY_TYPE_VALUES.includes(frequencyType) ? frequencyType : "DAILY",
      days_of_week: Array.isArray(daysOfWeek) ? daysOfWeek : [],
      times_per_week: timesPerWeek ?? null,
      routine_order: Number.isFinite(routineOrder) ? routineOrder : 100,
      enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "phone,product_id" }
  );
  if (error) throw error;
}

export async function setRuleEnabled(phone, ruleId, enabled) {
  const { error } = await supabase
    .from("skincare_routine_rules")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("phone", phone)
    .eq("id", ruleId);
  if (error) throw error;
}

export async function deleteRoutineRule(phone, ruleId) {
  const { error } = await supabase.from("skincare_routine_rules").delete().eq("phone", phone).eq("id", ruleId);
  if (error) throw error;
}

// ---------- relationships (EXCLUDE / OPTIONAL_WITH) ----------

export async function listRelationships(phone) {
  const { data, error } = await supabase
    .from("skincare_relationships")
    .select(
      "id, relationship_type, note, enabled, source:source_product_id(id, name), target:target_product_id(id, name)"
    )
    .eq("phone", phone);
  if (error) throw error;
  return data;
}

export async function getEnabledRelationships(phone) {
  const { data, error } = await supabase
    .from("skincare_relationships")
    .select("id, source_product_id, target_product_id, relationship_type, enabled")
    .eq("phone", phone)
    .eq("enabled", true);
  if (error) throw error;
  return data;
}

// find-or-create - approve yang sama nggak nambah baris duplikat kalau di-submit ulang
export async function upsertRelationship(phone, { sourceProductId, targetProductId, type, note }) {
  if (!RELATIONSHIP_TYPE_VALUES.includes(type)) throw new Error(`Tipe relationship tidak valid: ${type}`);
  const { data: existing, error: findErr } = await supabase
    .from("skincare_relationships")
    .select("id")
    .eq("phone", phone)
    .eq("source_product_id", sourceProductId)
    .eq("target_product_id", targetProductId)
    .eq("relationship_type", type)
    .maybeSingle();
  if (findErr) throw findErr;

  if (existing) {
    const { error } = await supabase
      .from("skincare_relationships")
      .update({ enabled: true, note: note || null, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("skincare_relationships").insert({
    phone,
    source_product_id: sourceProductId,
    target_product_id: targetProductId,
    relationship_type: type,
    note: note || null,
  });
  if (error) throw error;
}

export async function setRelationshipEnabled(phone, id, enabled) {
  const { error } = await supabase
    .from("skincare_relationships")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("phone", phone)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteRelationship(phone, id) {
  const { error } = await supabase.from("skincare_relationships").delete().eq("phone", phone).eq("id", id);
  if (error) throw error;
}

// ---------- rotation groups (ROTATE / ALTERNATIVE) ----------

export async function listRotationGroups(phone) {
  const { data, error } = await supabase.from("skincare_rotation_groups").select("*").eq("phone", phone);
  if (error) throw error;
  return data;
}

export async function getEnabledRotationGroups(phone) {
  const { data, error } = await supabase
    .from("skincare_rotation_groups")
    .select("*")
    .eq("phone", phone)
    .eq("enabled", true);
  if (error) throw error;
  return data;
}

// Approve suggestion "produk ini alternatif/rotasi dengan produk lain" - kalau salah satu
// produknya udah punya grup yang cocok modenya, gabung ke situ (union set) daripada bikin
// grup duplikat; kalau modenya beda, biarin grup lama & bikin grup baru terpisah.
export async function mergeIntoRotationGroup(phone, { mode, label, productIds }) {
  if (!ROTATION_MODE_VALUES.includes(mode)) throw new Error(`Mode rotasi tidak valid: ${mode}`);
  const groups = await listRotationGroups(phone);
  const existing = groups.find((g) => g.mode === mode && g.product_ids.some((id) => productIds.includes(id)));

  if (existing) {
    const merged = Array.from(new Set([...existing.product_ids, ...productIds]));
    const { error } = await supabase
      .from("skincare_rotation_groups")
      .update({ product_ids: merged, enabled: true, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await supabase
    .from("skincare_rotation_groups")
    .insert({ phone, mode, label: label || null, product_ids: productIds })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function setRotationGroupEnabled(phone, id, enabled) {
  const { error } = await supabase
    .from("skincare_rotation_groups")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("phone", phone)
    .eq("id", id);
  if (error) throw error;
}

export async function setRotationGroupPreference(phone, id, preferredProductId) {
  const { error } = await supabase
    .from("skincare_rotation_groups")
    .update({ preferred_product_id: preferredProductId || null, updated_at: new Date().toISOString() })
    .eq("phone", phone)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteRotationGroup(phone, id) {
  const { error } = await supabase.from("skincare_rotation_groups").delete().eq("phone", phone).eq("id", id);
  if (error) throw error;
}

// ---------- daily choices (buat grup ALTERNATIVE mode "biarkan aku pilih tiap pagi") ----------

export async function getDailyChoicesForDate(phone, dateKey) {
  const { data, error } = await supabase
    .from("skincare_daily_choices")
    .select("group_id, product_id")
    .eq("phone", phone)
    .eq("choice_date", dateKey);
  if (error) throw error;
  return data;
}

export async function setDailyChoice(phone, groupId, dateKey, productId) {
  const { error } = await supabase
    .from("skincare_daily_choices")
    .upsert(
      { phone, group_id: groupId, choice_date: dateKey, product_id: productId },
      { onConflict: "phone,group_id,choice_date" }
    );
  if (error) throw error;
}
