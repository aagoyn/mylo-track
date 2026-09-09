// Routine Engine — kerja MURNI dari data yang sudah DISETUJUI user (produk aktif, routine
// rules, relationships, rotation groups). Nggak pernah manggil AI, dan nggak pernah milih
// produk secara acak: kalau ada pilihan yang belum ditentukan (grup ALTERNATIVE tanpa
// preferensi/pilihan hari itu), dikembalikan sebagai "needsChoice" biar user yang milih.
import {
  getActiveProducts,
  getEnabledRoutineRules,
  getEnabledRelationships,
  getEnabledRotationGroups,
  getDailyChoicesForDate,
  todayDateKeyWib,
  dayOfWeekWib,
} from "./supabase.js";

const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function ruleAppliesToday(rule, dayOfWeek) {
  if (!rule.enabled) return false;
  if (rule.frequency_type === "DAYS_OF_WEEK") {
    return Array.isArray(rule.days_of_week) && rule.days_of_week.includes(dayOfWeek);
  }
  return true; // DAILY
}

function timeMatches(rule, routineTime) {
  return rule.routine_time === "BOTH" || rule.routine_time === routineTime;
}

// Index deterministic (bukan random) dari tanggal+groupId, dipakai buat ROTATE supaya
// hasilnya konsisten kalau routine di-generate ulang untuk tanggal yang sama.
function deterministicIndex(dateKey, groupId, length) {
  if (length <= 0) return 0;
  let hash = 0;
  const seed = `${dateKey}:${groupId}`;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % length;
}

export function computeRoutine({
  dateKey,
  dayOfWeek,
  routineTime,
  area,
  products,
  rules,
  relationships,
  rotationGroups,
  dailyChoices,
}) {
  const productById = new Map(products.map((p) => [p.id, p]));

  let entries = rules
    .filter((r) => {
      const product = productById.get(r.product_id);
      return product && product.status === "ACTIVE" && product.area === area;
    })
    .filter((r) => timeMatches(r, routineTime) && ruleAppliesToday(r, dayOfWeek))
    .map((r) => ({
      productId: r.product_id,
      product: productById.get(r.product_id),
      routineOrder: r.routine_order ?? 100,
      optional: false,
    }));

  const conflicts = [];

  // EXCLUDE: kalau source & target dua-duanya aktif hari ini, target di-drop. Kalau ada
  // pasangan yang saling exclude satu sama lain, itu konflik nyata - jangan asal pilih salah
  // satu, kasih tau user.
  const excludeRels = relationships.filter((r) => r.enabled && r.relationship_type === "EXCLUDE");
  let activeIds = new Set(entries.map((e) => e.productId));
  const removed = new Set();
  for (const rel of excludeRels) {
    if (!activeIds.has(rel.source_product_id) || !activeIds.has(rel.target_product_id)) continue;
    const mutual = excludeRels.some(
      (other) =>
        other.source_product_id === rel.target_product_id && other.target_product_id === rel.source_product_id
    );
    if (mutual) {
      const already = conflicts.some(
        (c) =>
          c.type === "MUTUAL_EXCLUDE" &&
          c.productIds.includes(rel.source_product_id) &&
          c.productIds.includes(rel.target_product_id)
      );
      if (!already) conflicts.push({ type: "MUTUAL_EXCLUDE", productIds: [rel.source_product_id, rel.target_product_id] });
      continue;
    }
    removed.add(rel.target_product_id);
  }
  entries = entries.filter((e) => !removed.has(e.productId));
  activeIds = new Set(entries.map((e) => e.productId));

  // OPTIONAL_WITH: source ditandai opsional kalau target juga lagi aktif hari itu (informational,
  // nggak menghapus apa pun dari routine).
  for (const rel of relationships) {
    if (!rel.enabled || rel.relationship_type !== "OPTIONAL_WITH") continue;
    if (activeIds.has(rel.source_product_id) && activeIds.has(rel.target_product_id)) {
      const entry = entries.find((e) => e.productId === rel.source_product_id);
      if (entry) entry.optional = true;
    }
  }

  const needsChoice = [];

  for (const group of rotationGroups) {
    if (!group.enabled) continue;
    const membersToday = entries.filter((e) => group.product_ids.includes(e.productId));
    if (membersToday.length <= 1) continue;

    if (group.mode === "ROTATE") {
      const sorted = [...membersToday].sort((a, b) => (a.productId > b.productId ? 1 : -1));
      const keepId = sorted[deterministicIndex(dateKey, group.id, sorted.length)].productId;
      entries = entries.filter((e) => !membersToday.includes(e) || e.productId === keepId);
    } else if (group.mode === "ALTERNATIVE") {
      let chosenId = group.preferred_product_id;
      if (!chosenId || !membersToday.some((e) => e.productId === chosenId)) {
        const todaysChoice = dailyChoices.find((c) => c.group_id === group.id);
        chosenId = todaysChoice ? todaysChoice.product_id : null;
      }
      if (chosenId && membersToday.some((e) => e.productId === chosenId)) {
        entries = entries.filter((e) => !membersToday.includes(e) || e.productId === chosenId);
      } else {
        entries = entries.filter((e) => !membersToday.includes(e));
        needsChoice.push({
          groupId: group.id,
          label: group.label || "Choose one",
          options: membersToday.map((e) => ({ id: e.productId, name: e.product.name })),
        });
      }
    }
  }

  entries.sort((a, b) => a.routineOrder - b.routineOrder || a.product.name.localeCompare(b.product.name));

  return {
    dateKey,
    dayLabel: WEEKDAYS_EN[dayOfWeek],
    routineTime,
    area,
    steps: entries.map((e, i) => ({
      step: i + 1,
      productId: e.productId,
      name: e.product.name,
      brand: e.product.brand,
      category: e.product.category,
      optional: e.optional,
    })),
    needsChoice,
    conflicts,
  };
}

// Wrapper async: fetch data yang sudah APPROVED lalu compute. AI nggak pernah dipanggil di sini.
export async function getRoutineForUser(phone, dateKey = todayDateKeyWib(), routineTime, area = "FACE") {
  const dayOfWeek = dayOfWeekWib(dateKey);
  const [products, rules, relationships, rotationGroups, dailyChoices] = await Promise.all([
    getActiveProducts(phone),
    getEnabledRoutineRules(phone),
    getEnabledRelationships(phone),
    getEnabledRotationGroups(phone),
    getDailyChoicesForDate(phone, dateKey),
  ]);
  return computeRoutine({ dateKey, dayOfWeek, routineTime, area, products, rules, relationships, rotationGroups, dailyChoices });
}

// Ambil AM+PM sekaligus untuk satu area, plus data mentah (dipakai bareng biar nggak query
// berkali-kali dari router untuk halaman dashboard/hub-card yang butuh keduanya).
export async function getDayRoutine(phone, dateKey = todayDateKeyWib()) {
  const dayOfWeek = dayOfWeekWib(dateKey);
  const [products, rules, relationships, rotationGroups, dailyChoices] = await Promise.all([
    getActiveProducts(phone),
    getEnabledRoutineRules(phone),
    getEnabledRelationships(phone),
    getEnabledRotationGroups(phone),
    getDailyChoicesForDate(phone, dateKey),
  ]);

  const base = { dateKey, dayOfWeek, products, rules, relationships, rotationGroups, dailyChoices };
  return {
    faceAM: computeRoutine({ ...base, routineTime: "AM", area: "FACE" }),
    facePM: computeRoutine({ ...base, routineTime: "PM", area: "FACE" }),
    bodyAM: computeRoutine({ ...base, routineTime: "AM", area: "BODY" }),
    bodyPM: computeRoutine({ ...base, routineTime: "PM", area: "BODY" }),
    hasBodyProducts: products.some((p) => p.area === "BODY"),
  };
}
