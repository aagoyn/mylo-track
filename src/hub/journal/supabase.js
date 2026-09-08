import { supabase } from "../../shared/supabase-client.js";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export function todayDateKeyWib() {
  const wib = new Date(Date.now() + WIB_OFFSET_MS);
  return wib.toISOString().slice(0, 10);
}

// upsert - dipakai baik buat bikin entry hari ini maupun edit entry tanggal lama (dateKey
// yang dikirim balik dari form-nya), jadi nggak perlu logic "create vs update" terpisah
export async function saveJournalEntry(phone, dateKey, content) {
  const { error } = await supabase.from("journal_logs").upsert(
    { phone, journal_date: dateKey, content, updated_at: new Date().toISOString() },
    { onConflict: "phone,journal_date" }
  );
  if (error) throw error;
}

export async function getJournalEntry(phone, dateKey) {
  const { data, error } = await supabase
    .from("journal_logs")
    .select("journal_date, content, updated_at")
    .eq("phone", phone)
    .eq("journal_date", dateKey)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRecentJournalEntries(phone, limit = 10) {
  const { data, error } = await supabase
    .from("journal_logs")
    .select("journal_date, content, updated_at")
    .eq("phone", phone)
    .order("journal_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
