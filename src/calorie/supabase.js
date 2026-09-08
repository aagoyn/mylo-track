import { supabase } from "../shared/supabase-client.js";

export async function uploadFoodImage(phone, imageBuffer, mimeType) {
  const ext = mimeType.split("/")[1] || "jpg";
  const path = `${phone}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("food-photos")
    .upload(path, imageBuffer, { contentType: mimeType });
  if (error) throw error;

  const { data } = supabase.storage.from("food-photos").getPublicUrl(path);
  return data.publicUrl;
}

export async function saveFoodLog({ phone, analysis, imageUrl }) {
  const { error } = await supabase.from("food_logs").insert({
    phone,
    food_name: analysis.food_name,
    calories: analysis.calories,
    protein_g: analysis.protein_g,
    carbs_g: analysis.carbs_g,
    fat_g: analysis.fat_g,
    sugar_g: analysis.sugar_g,
    notes: analysis.notes,
    items: analysis.items,
    image_url: imageUrl,
    raw_response: analysis,
  });
  if (error) throw error;
}

// hari dihitung pakai WIB (UTC+7) tetap, bukan timezone server
function todayStartUtcISO() {
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  const wibNow = new Date(Date.now() + WIB_OFFSET_MS);
  const startWibMidnightUtcMs =
    Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth(), wibNow.getUTCDate()) - WIB_OFFSET_MS;
  return new Date(startWibMidnightUtcMs).toISOString();
}

export async function getTodayCalories(phone) {
  const { data, error } = await supabase
    .from("food_logs")
    .select("calories")
    .eq("phone", phone)
    .gte("created_at", todayStartUtcISO());
  if (error) throw error;
  return data.reduce((sum, row) => sum + (row.calories || 0), 0);
}

export async function getTodayFoodLogs(phone) {
  const { data, error } = await supabase
    .from("food_logs")
    .select("food_name, calories, created_at")
    .eq("phone", phone)
    .gte("created_at", todayStartUtcISO())
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getLastFoodLog(phone) {
  const { data, error } = await supabase
    .from("food_logs")
    .select("*")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteFoodLog(id) {
  const { error } = await supabase.from("food_logs").delete().eq("id", id);
  if (error) throw error;
}

export async function updateFoodLog(id, fields) {
  const { error } = await supabase.from("food_logs").update(fields).eq("id", id);
  if (error) throw error;
}

function weekStartUtcISO() {
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  const wibNow = new Date(Date.now() + WIB_OFFSET_MS);
  const startWibMidnightUtcMs =
    Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth(), wibNow.getUTCDate() - 6) -
    WIB_OFFSET_MS;
  return new Date(startWibMidnightUtcMs).toISOString();
}

export async function getWeekFoodLogs(phone) {
  const { data, error } = await supabase
    .from("food_logs")
    .select("calories, protein_g, carbs_g, fat_g, created_at")
    .eq("phone", phone)
    .gte("created_at", weekStartUtcISO());
  if (error) throw error;
  return data;
}

export async function getDailyTarget(phone) {
  const { data, error } = await supabase
    .from("user_settings")
    .select("daily_target")
    .eq("phone", phone)
    .maybeSingle();
  if (error) throw error;
  return data?.daily_target ?? null;
}

export async function setDailyTarget(phone, target) {
  const { error } = await supabase
    .from("user_settings")
    .upsert({ phone, daily_target: target, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function getTodayMacros(phone) {
  const { data, error } = await supabase
    .from("food_logs")
    .select("protein_g, carbs_g, fat_g, sugar_g")
    .eq("phone", phone)
    .gte("created_at", todayStartUtcISO());
  if (error) throw error;
  const totals = data.reduce(
    (acc, row) => ({
      protein_g: acc.protein_g + (row.protein_g || 0),
      carbs_g: acc.carbs_g + (row.carbs_g || 0),
      fat_g: acc.fat_g + (row.fat_g || 0),
      sugar_g: acc.sugar_g + (row.sugar_g || 0),
    }),
    { protein_g: 0, carbs_g: 0, fat_g: 0, sugar_g: 0 }
  );
  // bulatin ke 1 desimal, jaga-jaga dari floating point error (mis. 50.40000000000006)
  return {
    protein_g: Math.round(totals.protein_g * 10) / 10,
    carbs_g: Math.round(totals.carbs_g * 10) / 10,
    fat_g: Math.round(totals.fat_g * 10) / 10,
    sugar_g: Math.round(totals.sugar_g * 10) / 10,
  };
}

export async function getMacroTargets(phone) {
  const { data, error } = await supabase
    .from("user_settings")
    .select("protein_target_g, carbs_target_g, fat_target_g, sugar_target_g")
    .eq("phone", phone)
    .maybeSingle();
  if (error) throw error;
  return (
    data || { protein_target_g: null, carbs_target_g: null, fat_target_g: null, sugar_target_g: null }
  );
}

export async function setMacroTargets(phone, macros) {
  const { error } = await supabase
    .from("user_settings")
    .upsert({ phone, ...macros, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function addWeightLog(phone, weightKg) {
  const { error } = await supabase.from("weight_logs").insert({ phone, weight_kg: weightKg });
  if (error) throw error;
}

export async function getLastWeight(phone) {
  const { data, error } = await supabase
    .from("weight_logs")
    .select("weight_kg, created_at")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getWeightHistory(phone, limit = 10) {
  const { data, error } = await supabase
    .from("weight_logs")
    .select("weight_kg, created_at")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function searchFoodLogs(phone, keyword, limit = 10) {
  const { data, error } = await supabase
    .from("food_logs")
    .select("food_name, calories, created_at")
    .eq("phone", phone)
    .ilike("food_name", `%${keyword}%`)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
