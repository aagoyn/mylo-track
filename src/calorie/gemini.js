import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateJson } from "../shared/gemini-json.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

const PROMPT = `Kamu adalah asisten nutrisi. Lihat foto makanan ini, pisahkan jadi komponen-komponennya (misal: nasi, ayam, sayur), dan estimasikan gizi tiap komponen secara terpisah.
Balas HANYA dalam format JSON tanpa markdown, dengan struktur persis:
{
  "food_name": string (nama singkat keseluruhan hidangan),
  "items": [
    {
      "name": string,
      "weight_g": number,
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number
    }
  ],
  "notes": string
}
Pisahkan jadi beberapa item kalau memang ada beberapa jenis makanan berbeda di piring. Kalau cuma satu jenis makanan, cukup satu item. Kalau tidak yakin, tetap kasih angka estimasi terbaik, jangan kosong.`;

function sumItems(items) {
  return items.reduce(
    (acc, it) => ({
      calories: acc.calories + (it.calories || 0),
      protein_g: acc.protein_g + (it.protein_g || 0),
      carbs_g: acc.carbs_g + (it.carbs_g || 0),
      fat_g: acc.fat_g + (it.fat_g || 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );
}

export async function analyzeFoodImage(imageBuffer, mimeType) {
  const parsed = await generateJson(model, [
    { inlineData: { data: imageBuffer.toString("base64"), mimeType } },
    PROMPT,
  ]);

  if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
    throw new Error(`Gemini nggak ngasih rincian item makanan yang valid dari foto ini.`);
  }

  return {
    food_name: parsed.food_name,
    items: parsed.items,
    notes: parsed.notes,
    ...sumItems(parsed.items),
  };
}

const TEXT_PROMPT = `Kamu adalah asisten nutrisi. Berdasarkan deskripsi makanan berikut (dalam Bahasa Indonesia), pisahkan jadi komponen-komponennya (misal: nasi, ayam, sayur), dan estimasikan gizi tiap komponen secara terpisah.
Balas HANYA dalam format JSON tanpa markdown, dengan struktur persis:
{
  "food_name": string (nama singkat keseluruhan hidangan),
  "items": [
    {
      "name": string,
      "weight_g": number,
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number
    }
  ],
  "notes": string
}
Pisahkan jadi beberapa item kalau memang ada beberapa jenis makanan berbeda. Kalau cuma satu jenis makanan, cukup satu item. Kalau berat/porsi tidak disebutkan, asumsikan porsi normal orang dewasa. Kalau tidak yakin, tetap kasih angka estimasi terbaik, jangan kosong.

Deskripsi makanan: `;

export async function analyzeFoodText(description) {
  const parsed = await generateJson(model, TEXT_PROMPT + description);

  if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
    throw new Error(`Gemini nggak ngasih rincian item makanan yang valid dari deskripsi ini.`);
  }

  return {
    food_name: parsed.food_name,
    items: parsed.items,
    notes: parsed.notes,
    ...sumItems(parsed.items),
  };
}
