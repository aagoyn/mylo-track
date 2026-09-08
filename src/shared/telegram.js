// Class karena dua bot (spending & calorie) jalan di satu process yang sama, masing-masing
// dengan state-nya sendiri (token/base URL) - butuh instance terpisah per bot.
export class TelegramClient {
  #api;
  #fileApi;

  constructor(token) {
    this.#api = `https://api.telegram.org/bot${token}`;
    this.#fileApi = `https://api.telegram.org/file/bot${token}`;
  }

  async #callApi(method, payload) {
    const res = await fetch(`${this.#api}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`${method} failed: ${res.status} ${await res.text()}`);
    return res.json();
  }

  // arrow function fields biar tetap bisa didestructure di call site (mis. const { sendText } = client)
  // tanpa kehilangan binding `this` ke instance-nya
  sendText = async (chatId, text, keyboard) => {
    const payload = { chat_id: chatId, text, parse_mode: "HTML" };
    if (keyboard) payload.reply_markup = { inline_keyboard: keyboard };
    await this.#callApi("sendMessage", payload);
  };

  editText = async (chatId, messageId, text) => {
    await this.#callApi("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [] },
    });
  };

  answerCallbackQuery = async (callbackQueryId) => {
    await this.#callApi("answerCallbackQuery", { callback_query_id: callbackQueryId });
  };

  setMyCommands = async (commands) => {
    await this.#callApi("setMyCommands", { commands });
  };

  downloadPhoto = async (fileId) => {
    const fileRes = await fetch(`${this.#api}/getFile?file_id=${fileId}`);
    if (!fileRes.ok) throw new Error(`getFile failed: ${fileRes.status} ${await fileRes.text()}`);
    const { result } = await fileRes.json();

    const fileDownload = await fetch(`${this.#fileApi}/${result.file_path}`);
    if (!fileDownload.ok)
      throw new Error(`file download failed: ${fileDownload.status} ${await fileDownload.text()}`);

    const buffer = Buffer.from(await fileDownload.arrayBuffer());
    const mimeType = result.file_path.endsWith(".png") ? "image/png" : "image/jpeg";
    return { buffer, mimeType };
  };
}
