import Anthropic from "@anthropic-ai/sdk";

// Fallback ke Claude Haiku 4.5 kalau Gemini API lagi sibuk/limit - cuma aktif kalau
// ANTHROPIC_API_KEY diisi di .env, dan cuma dipakai buat error yang "retryable"
// (503/429/5xx/network), bukan buat error konten (400) atau JSON yang gagal di-parse.
const CLAUDE_FALLBACK_MODEL = "claude-haiku-4-5";
let anthropicClient;

function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!anthropicClient) anthropicClient = new Anthropic();
  return anthropicClient;
}

function isRetryableGeminiError(err) {
  const message = err.message || String(err);
  const statusMatch = message.match(/\[(\d{3})[^\]]*\]/);
  if (statusMatch) {
    const status = Number(statusMatch[1]);
    return status === 503 || status === 429 || status >= 500;
  }
  return /network|fetch failed|enotfound|econnrefused|timeout/i.test(message);
}

// Ubah contents yang sama persis dipakai buat Gemini (string, atau array
// [{inlineData}, promptString]) jadi content blocks format Claude.
function toClaudeContent(contents) {
  if (typeof contents === "string") return [{ type: "text", text: contents }];

  return contents.map((part) => {
    if (typeof part === "string") return { type: "text", text: part };
    if (part.inlineData) {
      return {
        type: "image",
        source: { type: "base64", media_type: part.inlineData.mimeType, data: part.inlineData.data },
      };
    }
    throw new Error("Bagian content nggak dikenali buat fallback Claude.");
  });
}

function parseJsonFromText(text) {
  const jsonText = text.trim().replace(/^```json\s*|^```\s*|```$/g, "").trim();
  return JSON.parse(jsonText);
}

async function tryClaudeFallback(contents) {
  const client = getAnthropicClient();
  if (!client) return null;

  try {
    console.error("Gemini gagal (retryable) - fallback ke Claude Haiku 4.5...");
    const response = await client.messages.create({
      model: CLAUDE_FALLBACK_MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: toClaudeContent(contents) }],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    return parseJsonFromText(textBlock?.text || "");
  } catch (fallbackErr) {
    console.error("Fallback Claude juga gagal:", fallbackErr);
    return null;
  }
}

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

    if (isRetryableGeminiError(err)) {
      const fallbackResult = await tryClaudeFallback(contents);
      if (fallbackResult) return fallbackResult;
    }

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
