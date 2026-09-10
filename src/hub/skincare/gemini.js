import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateJson } from "../../shared/gemini-json.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

// Batas peran AI di sini SANGAT penting (lihat test-prompt.txt #37/#39): AI cuma boleh
// mengorganisir rutin (kapan pakai, seberapa sering, urutan, dipisah/bergantian/alternatif),
// BUKAN mendiagnosis kulit atau ngasih klaim medis. Output-nya juga cuma "saran" - yang
// nyimpen jadi rule aktif adalah aplikasi, setelah user approve lewat form (lihat router.js).
const SYSTEM_RULES = `Kamu adalah asisten pengatur RUTIN skincare, BUKAN dokter kulit atau ahli dermatologi.
Tugasmu HANYA mengorganisir: kapan produk dipakai (AM/PM), seberapa sering, urutan pemakaian, dan apakah produk ini sebaiknya dipisah/bergantian/jadi alternatif dari produk lain yang sudah ada.
ATURAN KETAT:
- JANGAN mendiagnosis kondisi kulit apa pun.
- JANGAN mengklaim bisa mengobati/menyembuhkan sesuatu, dan JANGAN menjamin hasil.
- JANGAN memastikan suatu kombinasi produk 100% aman secara medis - kalau ragu, sarankan pisahkan dulu supaya lebih mudah dievaluasi.
- JANGAN merekomendasikan obat resep.
- JANGAN mengarang kandungan/ingredient yang tidak diberikan user - kamu cuma tahu nama, brand, kategori, dan catatan produk.
- Kalau informasi kurang, katakan asumsimu di "warnings" dan sarankan rutin yang sederhana & konservatif.
- Semua yang kamu balas adalah SARAN untuk direview manusia, bukan aturan final.
- Balas HANYA JSON valid, tanpa markdown, tanpa teks lain di luar JSON.

URUTAN PEMAKAIAN ("routine_order") - default umum kalau nggak ada alasan lain dari catatan user:
Cleanser/Micellar Water/Cleansing Oil → Toner → Essence → Ampoule/Serum/Treatment/Spot Treatment
→ Eye Cream → Moisturizer → Sunscreen (SELALU paling akhir di rutin AM, jangan pernah taruh
produk lain setelah sunscreen) → Exfoliant/Mask dipakai terpisah, bukan bagian urutan harian.
Prinsipnya tekstur/fungsi tipis ke tebal, produk yang "menutup" (moisturizer, sunscreen) di
akhir. Kalau produk existing sudah punya "order" tersimpan (lihat konteks di bawah), SISIPKAN
produk baru di antara angka-angka itu (pakai kelipatan 10 supaya ada ruang buat nyisip lagi
nanti) - JANGAN asal kasih angka gede/kecil tanpa mikirin posisi relatifnya ke produk lain yang
sudah ada, dan JANGAN nyaranin ubah order produk lain kecuali itu emang salah taruh.`;

const SUGGESTION_SHAPE = `{
  "suggestion": {
    "routine_time": "AM" | "PM" | "BOTH",
    "frequency_type": "DAILY" | "DAYS_OF_WEEK",
    "days_of_week": [angka 0-6, 0=Minggu; isi HANYA kalau frequency_type = "DAYS_OF_WEEK"],
    "routine_order": number (posisi urutan pemakaian, makin kecil makin awal, pakai kelipatan 10)
  },
  "relationships": [
    { "type": "EXCLUDE" | "OPTIONAL_WITH", "with_product": "nama PERSIS salah satu produk existing yang diberikan", "reason": string }
  ],
  "rotation": { "mode": "ROTATE" | "ALTERNATIVE" | null, "with_products": ["nama produk existing yang perannya mirip"], "note": string },
  "reasoning": string (jelaskan ke user awam pakai bahasa santai, JANGAN pakai istilah teknis seperti "rotation group"/"exclusion rule"/"exclusive choice"),
  "warnings": [string] (kosongkan array kalau tidak ada catatan penting)
}`;

function productsContextText(products, rulesByProductId = new Map()) {
  if (!products.length) return "(belum ada produk skincare aktif lainnya)";
  return products
    .map((p) => {
      const rule = rulesByProductId.get(p.id);
      const ruleText = rule ? `, rule tersimpan: ${rule.routine_time}, order ${rule.routine_order}` : "";
      return `- ${p.name}${p.brand ? ` (${p.brand})` : ""} — kategori: ${p.category}${p.notes ? `, catatan: ${p.notes}` : ""}${ruleText}`;
    })
    .join("\n");
}

function normalizeSuggestion(parsed) {
  const s = parsed.suggestion || {};
  return {
    suggestion: {
      routine_time: ["AM", "PM", "BOTH"].includes(s.routine_time) ? s.routine_time : "AM",
      frequency_type: s.frequency_type === "DAYS_OF_WEEK" ? "DAYS_OF_WEEK" : "DAILY",
      days_of_week: Array.isArray(s.days_of_week)
        ? s.days_of_week.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
        : [],
      routine_order: Number.isFinite(s.routine_order) ? Math.round(s.routine_order) : 100,
    },
    relationships: Array.isArray(parsed.relationships)
      ? parsed.relationships
          .filter((r) => r && r.with_product && ["EXCLUDE", "OPTIONAL_WITH"].includes(r.type))
          .map((r) => ({
            type: r.type,
            with_product: String(r.with_product).trim(),
            reason: String(r.reason || "").trim(),
          }))
      : [],
    rotation:
      parsed.rotation && ["ROTATE", "ALTERNATIVE"].includes(parsed.rotation.mode)
        ? {
            mode: parsed.rotation.mode,
            with_products: Array.isArray(parsed.rotation.with_products)
              ? parsed.rotation.with_products.map((n) => String(n).trim()).filter(Boolean)
              : [],
            note: String(parsed.rotation.note || "").trim(),
          }
        : { mode: null, with_products: [], note: "" },
    reasoning: String(parsed.reasoning || "").trim(),
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map(String) : [],
  };
}

// Analisis satu produk (baru ditambah, atau existing yang mau di-"Analyze with AI" ulang)
// dalam kaitannya dengan produk aktif lain milik user.
export async function analyzeProduct(newProduct, existingProducts, rulesByProductId = new Map()) {
  const prompt = `${SYSTEM_RULES}

Produk yang mau dianalisis:
Nama: ${newProduct.name}
Brand: ${newProduct.brand || "-"}
Kategori: ${newProduct.category}
Catatan dari user: ${newProduct.notes || "-"}

Produk skincare aktif user saat ini (selain produk di atas):
${productsContextText(existingProducts, rulesByProductId)}

Analisis produk ini dalam kaitannya dengan produk yang sudah ada, lalu balas JSON dengan struktur PERSIS:
${SUGGESTION_SHAPE}`;

  const parsed = await generateJson(model, prompt);
  return normalizeSuggestion(parsed);
}

// Review seluruh rutin aktif user sekaligus ("Review My Routine with AI" / "Analyze my
// skincare routine") - AI cuma boleh mengembalikan saran per produk, TIDAK mengubah apa pun
// sendiri (lihat router.js: hasilnya cuma dirender, disimpan hanya kalau user approve).
export async function reviewRoutine(products, rulesByProductId) {
  if (!products.length) {
    return { suggestions: [], overall_notes: "Belum ada produk aktif untuk dianalisis." };
  }

  const productList = products
    .map((p) => {
      const rule = rulesByProductId.get(p.id);
      const currentRule = rule
        ? `sudah ada rule: ${rule.routine_time}, order ${rule.routine_order}, ${rule.frequency_type}${
            rule.frequency_type === "DAYS_OF_WEEK" ? ` (hari: ${(rule.days_of_week || []).join(",")})` : ""
          }`
        : "belum ada rule tersimpan";
      return `- ${p.name}${p.brand ? ` (${p.brand})` : ""} — kategori: ${p.category}, area: ${p.area}${
        p.notes ? `, catatan: ${p.notes}` : ""
      } [${currentRule}]`;
    })
    .join("\n");

  const prompt = `${SYSTEM_RULES}

Daftar produk skincare aktif milik user saat ini:
${productList}

PENTING: kalau sebuah produk sudah punya "rule tersimpan" (approved sebelumnya), JANGAN sarankan mengubahnya kecuali benar-benar perlu - dan kalaupun perlu, tetap tulis sebagai saran biasa (user yang akan approve/edit/tolak), jangan menganggapnya sudah berubah.

Untuk SETIAP produk yang menurutmu butuh saran (boleh skip produk yang menurutmu sudah pas), balas JSON dengan struktur PERSIS (satu objek per produk di dalam array "suggestions", digabung dengan field "product_name"):
{
  "suggestions": [
    Object.assign({ "product_name": "nama PERSIS salah satu produk di atas" }, ${SUGGESTION_SHAPE})
  ],
  "overall_notes": string (ringkasan singkat pola rutin yang kamu lihat, bahasa santai untuk user awam)
}
(tulis ulang tiap objek di array "suggestions" sebagai JSON object biasa yang berisi field "product_name" DITAMBAH semua field dari struktur suggestion di atas ("suggestion", "relationships", "rotation", "reasoning", "warnings") - jangan literal memakai "Object.assign" di JSON final.)`;

  const parsed = await generateJson(model, prompt);
  const rawSuggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

  return {
    suggestions: rawSuggestions
      .filter((s) => s && s.product_name)
      .map((s) => ({ product_name: String(s.product_name).trim(), ...normalizeSuggestion(s) })),
    overall_notes: String(parsed.overall_notes || "").trim(),
  };
}
