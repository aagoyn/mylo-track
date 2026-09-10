import { supabase } from "../../shared/supabase-client.js";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
export const CLOCK_OUT_AFTER_MS = 9 * 60 * 60 * 1000;
const SELECT_FIELDS = "id, work_date, work_mode, clock_in_at, clock_out_at";

export function todayDateKeyWib() {
  const wib = new Date(Date.now() + WIB_OFFSET_MS);
  return wib.toISOString().slice(0, 10);
}

// Senin=1 ... Minggu=7 - dipakai buat nentuin aksi default kartu (WFO hari Senin/Selasa/Kamis,
// WFH hari Rabu/Jumat, Off hari weekend). Cuma nentuin default/aksi utama - Clock In (WFO)
// tetep bisa dipencet kapan aja lewat link override, buat kasus WFO dadakan.
export function dayOfWeekWib() {
  const wib = new Date(Date.now() + WIB_OFFSET_MS);
  return wib.getUTCDay() || 7;
}

export async function getTodayClockLog(phone) {
  const { data, error } = await supabase
    .from("clockin_logs")
    .select(SELECT_FIELDS)
    .eq("phone", phone)
    .eq("work_date", todayDateKeyWib())
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Set mode hari ini. Default di-lock sekali per hari (kartu Hub - kalau udah ada log, nggak
// nimpa). force:true dipakai khusus dari halaman /hub/clocked, biar bisa override kapan aja
// (mis. salah pencet WFO padahal maunya WFH) - ganti mode selalu reset clock_in_at/clock_out_at
// biar konsisten sama mode barunya (WFO dapet clock_in_at baru = sekarang, WFH/OFF dua-duanya null).
export async function setTodayMode(phone, mode, { force = false } = {}) {
  const existing = await getTodayClockLog(phone);
  if (existing && !force) return existing;

  const payload = {
    phone,
    work_date: todayDateKeyWib(),
    work_mode: mode,
    clock_in_at: mode === "WFO" ? new Date().toISOString() : null,
    clock_out_at: null,
  };

  const { data, error } = await supabase
    .from("clockin_logs")
    .upsert(payload, { onConflict: "phone,work_date" })
    .select(SELECT_FIELDS)
    .single();
  if (error) throw error;
  return data;
}

export async function clockIn(phone, opts) {
  return setTodayMode(phone, "WFO", opts);
}

export async function markDay(phone, mode, opts) {
  return setTodayMode(phone, mode, opts);
}

export async function clockOut(phone) {
  const today = await getTodayClockLog(phone);
  if (!today || !today.clock_in_at) throw new Error("Belum clock-in hari ini.");
  if (today.clock_out_at) return today;

  const elapsedMs = Date.now() - new Date(today.clock_in_at).getTime();
  if (elapsedMs < CLOCK_OUT_AFTER_MS) {
    throw new Error("Belum genap 9 jam sejak clock-in.");
  }

  const { data, error } = await supabase
    .from("clockin_logs")
    .update({ clock_out_at: new Date().toISOString() })
    .eq("id", today.id)
    .select(SELECT_FIELDS)
    .single();
  if (error) throw error;
  return data;
}

export async function getRecentClockLogs(phone, limit = 20) {
  const { data, error } = await supabase
    .from("clockin_logs")
    .select(SELECT_FIELDS)
    .eq("phone", phone)
    .order("work_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
