import { supabase } from "../../shared/supabase-client.js";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const MOOD_VALUES = ["terrible", "bad", "okay", "good", "great"];

function wibNow() {
  return new Date(Date.now() + WIB_OFFSET_MS);
}

function wibPartsToIso(year, month, day, hour = 0, minute = 0, second = 0) {
  return new Date(Date.UTC(year, month, day, hour, minute, second) - WIB_OFFSET_MS).toISOString();
}

function getDayBoundsWib() {
  const now = wibNow();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  return {
    startISO: wibPartsToIso(y, m, d, 0, 0, 0),
    endISO: wibPartsToIso(y, m, d, 23, 59, 59),
  };
}

// month: 1-12 (human-friendly, dikonversi ke 0-indexed internal buat Date.UTC)
export function getMonthBoundsWib(year, month) {
  const m = month - 1;
  return {
    startISO: wibPartsToIso(year, m, 1, 0, 0, 0),
    endISO: wibPartsToIso(year, m + 1, 0, 23, 59, 59), // tanggal 0 bulan depan = akhir bulan ini
    daysInMonth: new Date(Date.UTC(year, m + 1, 0)).getUTCDate(),
  };
}

export async function saveMood(phone, mood, note) {
  if (!MOOD_VALUES.includes(mood)) {
    throw new Error(`Mood tidak valid: "${mood}"`);
  }
  const { error } = await supabase.from("mood_logs").insert({ phone, mood, note: note || null });
  if (error) throw error;
}

// semua check-in mood hari ini, ascending - dipakai buat nentuin mood terakhir (last item)
// SEKALIGUS jumlah check-in hari ini, dalam satu query
export async function getTodayMoodLogs(phone) {
  const { startISO, endISO } = getDayBoundsWib();
  return getMoodLogsInRange(phone, startISO, endISO);
}

export async function getMoodLogsInRange(phone, startISO, endISO) {
  const { data, error } = await supabase
    .from("mood_logs")
    .select("mood, note, created_at")
    .eq("phone", phone)
    .gte("created_at", startISO)
    .lte("created_at", endISO)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getMoodLogsForDate(phone, dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const startISO = wibPartsToIso(year, month - 1, day, 0, 0, 0);
  const endISO = wibPartsToIso(year, month - 1, day, 23, 59, 59);
  return getMoodLogsInRange(phone, startISO, endISO);
}

export async function getRecentMoodLogs(phone, limit = 10) {
  const { data, error } = await supabase
    .from("mood_logs")
    .select("mood, note, created_at")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
