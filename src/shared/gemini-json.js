// Wrapper generateContent() yang bikin dua penyebab gagal paling umum jadi jelas:
// (1) API Gemini-nya sendiri yang error (network/auth/rate-limit/safety block), atau
// (2) API-nya sukses tapi balesannya bukan JSON yang valid (model "ngoceh" di luar format).
export async function generateJson(model, contents) {
  let result;
  try {
    result = await model.generateContent(contents);
  } catch (err) {
    throw new Error(`Gagal menghubungi Gemini API: ${err.message}`);
  }

  const text = result.response.text().trim();
  const jsonText = text.replace(/^```json\s*|^```\s*|```$/g, "").trim();

  try {
    return JSON.parse(jsonText);
  } catch {
    throw new Error(`Gemini membalas dengan format yang bukan JSON: "${jsonText.slice(0, 150)}"`);
  }
}
