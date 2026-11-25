// Parser murni (nggak nyentuh DB) buat import "Paste Training Plan" dari Google Sheets/Excel -
// konsumsinya ada di importTrainingPlan() (grind/supabase.js). Lihat juga spending/parse.js +
// spending/categorize.js buat pola split serupa (pure parsing vs DB orchestration).

const MONTHS_ID = {
  jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, jun: 5, jul: 6,
  agu: 7, ags: 7, sep: 8, okt: 9, nov: 10, des: 11,
};

// "9 Nov 2026" / "1 Des 2026" -> "2026-11-09". null kalau nggak cocok (dipakai buat skip
// baris header pas import, lihat parseTrainingPlanTsv).
export function parseIndoDate(raw) {
  const str = String(raw || "").trim();
  const m = str.match(/^(\d{1,2})\s+([a-zA-Z]+)\.?\s+(\d{4})$/);
  if (!m) return null;
  const month = MONTHS_ID[m[2].toLowerCase().slice(0, 3)];
  if (month === undefined) return null;
  return `${m[3]}-${String(month + 1).padStart(2, "0")}-${String(parseInt(m[1], 10)).padStart(2, "0")}`;
}

// "3,5" -> 3.5, "5.07km" -> 5.07. null kalau kosong/nggak ada angka sama sekali.
export function cleanNumber(raw) {
  if (raw == null) return null;
  const str = String(raw).trim().replace(",", ".");
  if (!str) return null;
  const match = str.match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}

// "9'57\"" -> "09:57", "8:46" -> "08:46". String lain (mis. range target pace
// "8:30-9:15/km") dibalikin apa adanya - itu free text, bukan avg_pace aktual.
export function cleanPace(raw) {
  const str = String(raw || "").trim();
  if (!str) return null;
  let m = str.match(/^(\d{1,2}):(\d{2})$/);
  if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
  m = str.match(/(\d{1,2})['’]\s*(\d{1,2})/);
  if (m) return `${m[1].padStart(2, "0")}:${m[2].padStart(2, "0")}`;
  return str;
}

export function paceToSeconds(pace) {
  const m = String(pace || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

export function secondsToPace(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = Math.round(totalSec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const SESSION_TYPE_MAP = {
  easy: "EASY", "easy run": "EASY",
  quality: "QUALITY", tempo: "QUALITY", interval: "QUALITY", intervals: "QUALITY",
  "long run": "LONG RUN", longrun: "LONG RUN",
  badminton: "BADMINTON",
  gym: "GYM",
  rest: "REST",
  "race day": "RACE DAY", race: "RACE DAY", raceday: "RACE DAY",
  swim: "SWIM", renang: "SWIM",
  tennis: "TENNIS", tenis: "TENNIS",
};

export function normalizeSessionType(raw) {
  const key = String(raw || "").trim().toLowerCase();
  return SESSION_TYPE_MAP[key] || String(raw || "").trim().toUpperCase() || "REST";
}

const STATUS_MAP = { selesai: "DONE", dilewati: "SKIPPED", belum: "PENDING", rest: "PENDING" };

export function mapImportStatus(raw) {
  return STATUS_MAP[String(raw || "").trim().toLowerCase()] || "PENDING";
}

// Kolom (tab-separated, sesuai urutan yang di-paste user dari Google Sheets/Excel):
// Tanggal | Hari | Minggu Ke- | Fase | Jenis Sesi | Jarak Target (km) | Target Pace |
// Target HR | Deskripsi/Instruksi | Status | Jarak Aktual (km) | Avg Pace Aktual
//
// Baris yang kolom pertamanya bukan tanggal valid (mis. header) otomatis di-skip.
export function parseTrainingPlanTsv(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const rows = [];
  for (const line of lines) {
    const cols = line.split("\t");
    const planDate = parseIndoDate(cols[0]);
    if (!planDate) continue;

    const sessionType = normalizeSessionType(cols[4]);
    const instructions = (cols[8] || "").trim() || null;

    rows.push({
      planDate,
      weekNum: cols[2] ? parseInt(cols[2], 10) || null : null,
      phase: (cols[3] || "").trim() || null,
      sessionType,
      raceName: sessionType === "RACE DAY" ? instructions : null,
      targetDistanceKm: cleanNumber(cols[5]),
      targetPace: (cols[6] || "").trim() || null,
      targetHr: (cols[7] || "").trim() || null,
      instructions,
      status: mapImportStatus(cols[9]),
      actualDistanceKm: cleanNumber(cols[10]),
      actualPace: cleanPace(cols[11]),
    });
  }
  return rows;
}
