import { detectCategory } from "./categorize.js";

// "kopi 25k" / "25k kopi" / "makan siang 50k, 2k parkir" -> array of expense dto
export function parseExpenseInputs(text) {
  const content = /^spend\s+/i.test(text) ? text.replace(/^spend\s+/i, "") : text;
  const segments = content.split(/,|\n/);
  const results = [];

  for (let seg of segments) {
    seg = seg.trim();
    if (!seg) continue;

    let amountStr;
    let descStr;

    let match = seg.match(/^([0-9.,kK]+)\s+(.+)$/);
    if (match) {
      amountStr = match[1];
      descStr = match[2];
    } else {
      match = seg.match(/^(.+?)\s+([0-9.,kK]+)$/);
      if (match) {
        descStr = match[1];
        amountStr = match[2];
      } else {
        continue;
      }
    }

    const isK = amountStr.toLowerCase().endsWith("k");
    if (isK) amountStr = amountStr.slice(0, -1);
    let amount = parseInt(amountStr.replace(/[.,]/g, ""), 10);
    if (isNaN(amount) || amount <= 0) continue;
    if (isK) amount *= 1000;

    results.push({
      amount,
      description: descStr,
      category: detectCategory(descStr),
      type: "Expense",
    });
  }

  return results;
}
