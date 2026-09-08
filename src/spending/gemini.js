import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateJson } from "../shared/gemini-json.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

const PROMPT = `Kamu adalah asisten baca struk belanja. Lihat foto struk/nota ini, cari total akhir yang dibayar (grand total, bukan subtotal sebelum diskon/pajak/biaya layanan kalau ada beberapa angka), dan buat deskripsi singkat isi belanjaan (nama toko atau item utama).
Balas HANYA dalam format JSON tanpa markdown, dengan struktur persis:
{
  "amount": number (total bayar dalam Rupiah, angka polos tanpa simbol atau pemisah ribuan),
  "description": string (deskripsi singkat, mis. nama toko atau item utama)
}
Kalau nggak yakin, tetap kasih estimasi angka terbaik, jangan kosong.`;

export async function analyzeReceiptImage(imageBuffer, mimeType) {
  const parsed = await generateJson(model, [
    { inlineData: { data: imageBuffer.toString("base64"), mimeType } },
    PROMPT,
  ]);

  if (parsed.amount == null) {
    throw new Error(`Gemini nggak ngasih field "amount" di hasil baca struk.`);
  }

  return {
    amount: Math.round(Number(parsed.amount)) || 0,
    description: String(parsed.description || "Struk belanja").trim(),
  };
}
