// Factory karena dua bot (spending & calorie) jalan di satu process yang sama,
// masing-masing dengan token-nya sendiri.
export function createTelegramClient(token) {
  const API = `https://api.telegram.org/bot${token}`;
  const FILE_API = `https://api.telegram.org/file/bot${token}`;

  async function callApi(method, payload) {
    const res = await fetch(`${API}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`${method} failed: ${res.status} ${await res.text()}`);
    return res.json();
  }

  return {
    async sendText(chatId, text, keyboard) {
      const payload = { chat_id: chatId, text, parse_mode: "HTML" };
      if (keyboard) payload.reply_markup = { inline_keyboard: keyboard };
      await callApi("sendMessage", payload);
    },

    async editText(chatId, messageId, text) {
      await callApi("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [] },
      });
    },

    async answerCallbackQuery(callbackQueryId) {
      await callApi("answerCallbackQuery", { callback_query_id: callbackQueryId });
    },

    async setMyCommands(commands) {
      await callApi("setMyCommands", { commands });
    },

    async downloadPhoto(fileId) {
      const fileRes = await fetch(`${API}/getFile?file_id=${fileId}`);
      if (!fileRes.ok) throw new Error(`getFile failed: ${fileRes.status}`);
      const { result } = await fileRes.json();

      const fileDownload = await fetch(`${FILE_API}/${result.file_path}`);
      if (!fileDownload.ok) throw new Error(`file download failed: ${fileDownload.status}`);

      const buffer = Buffer.from(await fileDownload.arrayBuffer());
      const mimeType = result.file_path.endsWith(".png") ? "image/png" : "image/jpeg";
      return { buffer, mimeType };
    },
  };
}
