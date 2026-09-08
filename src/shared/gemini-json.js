// Ubah error mentah dari SDK @google/generative-ai (yang isinya URL request + nama library +
// status HTTP digabung jadi satu string panjang) jadi pesan singkat yang enak dibaca user.
function friendlyGeminiError(err) {
  const message = err.message || String(err);
  const statusMatch = message.match(/\[(\d{3})[^\]]*\]\s*(.*)$/s);

  if (statusMatch) {
    const status = Number(statusMatch[1]);
    if (status === 503) return "Gemini API lagi sibuk (server penuh). Coba lagi beberapa menit lagi.";
    if (status === 429) return "Kuota/limit Gemini API abis buat sekarang. Coba lagi nanti.";
    if (status === 400) return "Gemini nggak bisa proses foto/teks ini (format nggak didukung atau input aneh).";
    if (status >= 500) return `Gemini API lagi ada masalah di server mereka (${status}). Coba lagi nanti.`;
    const reason = statusMatch[2].trim();
    return reason ? `Gemini API error (${status}): ${reason}` : `Gemini API error (${status}).`;
  }

  if (/network|fetch failed|enotfound|econnrefused|timeout/i.test(message)) {
    return "Nggak bisa konek ke Gemini API — cek koneksi internet server.";
  }

  return message;
}

// Wrapper generateContent() yang bikin dua penyebab gagal paling umum jadi jelas:
// (1) API Gemini-nya sendiri yang error (network/auth/rate-limit/safety block), atau
// (2) API-nya sukses tapi balesannya bukan JSON yang valid (model "ngoceh" di luar format).
export async function generateJson(model, contents) {
  let result;
  try {
    result = await model.generateContent(contents);
  } catch (err) {
    console.error("Gemini API error (raw):", err); // detail teknis lengkap tetap kelog di server
    throw new Error(`Gagal menghubungi Gemini API: ${friendlyGeminiError(err)}`);
  }

  const text = result.response.text().trim();
  const jsonText = text.replace(/^```json\s*|^```\s*|```$/g, "").trim();

  try {
    return JSON.parse(jsonText);
  } catch {
    throw new Error(`Gemini membalas dengan format yang bukan JSON: "${jsonText.slice(0, 150)}"`);
  }
}
