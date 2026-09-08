import { DASHBOARD_CSS, escapeHtml, navHeader, faviconLink } from "../../shared/dashboard-layout.js";

// duplikat kecil dari daftar value di ./supabase.js (dipakai buat validasi di sana) - sengaja
// nggak di-import dari situ biar dashboard.js (layer render doang) nggak ikut narik
// shared/supabase-client.js cuma buat baca 3 array constant
const CATEGORY_VALUES = ["Product", "Food", "Travel", "Experience", "Hobby", "Other"];
const PRIORITY_VALUES = ["Low", "Medium", "High"];
const STATUS_VALUES = ["Thinking", "Want", "Ready to buy", "Bought", "Dropped"];

const CATEGORY_EMOJI = {
  Product: "🛍️",
  Food: "🍽️",
  Travel: "✈️",
  Experience: "🎟️",
  Hobby: "🎮",
  Other: "📦",
};

const PRIORITY_CLASS = { Low: "priority-low", Medium: "priority-medium", High: "priority-high" };

function formatRupiah(amount) {
  return `Rp${Math.round(amount).toLocaleString("id-ID")}`;
}

function selectOptions(values, selected) {
  return values.map((v) => `<option value="${v}" ${v === selected ? "selected" : ""}>${v}</option>`).join("");
}

function wishlistItemHtml(item) {
  const emoji = CATEGORY_EMOJI[item.category] || "📦";
  const priorityClass = PRIORITY_CLASS[item.priority] || "priority-medium";

  return `<div class="wishlist-item">
    <div class="wishlist-item-head">
      <div class="wishlist-title">${emoji} ${escapeHtml(item.title)}</div>
      <span class="badge ${priorityClass}">${item.priority}</span>
    </div>
    <div class="wishlist-meta">
      ${item.category}${item.estimated_price ? ` · ${formatRupiah(item.estimated_price)}` : ""}
      · <span class="badge status-badge">${item.status}</span>
    </div>
    <form class="wishlist-item-form" method="POST" action="/hub/wishlist/${item.id}/update">
      <input type="text" name="title" value="${escapeHtml(item.title)}" required>
      <select name="category">${selectOptions(CATEGORY_VALUES, item.category)}</select>
      <select name="priority">${selectOptions(PRIORITY_VALUES, item.priority)}</select>
      <select name="status">${selectOptions(STATUS_VALUES, item.status)}</select>
      <input type="number" step="1000" name="estimated_price" placeholder="Price (optional)" value="${item.estimated_price ?? ""}">
      <input type="text" name="note" placeholder="Note (optional)" value="${escapeHtml(item.note || "")}">
      <button type="submit">Save</button>
    </form>
    <form class="delete-form" method="POST" action="/hub/wishlist/${item.id}/delete" style="margin-top:8px;">
      <button type="submit">Delete</button>
    </form>
  </div>`;
}

export function renderWishlistPage({ items, flash }) {
  const itemRows = items.length
    ? items.map(wishlistItemHtml).join("")
    : `<div class="empty-state">Your wishlist is empty. Add something below.</div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Wishlist</title>
${faviconLink("/icons/wishlist.png")}
<style>${DASHBOARD_CSS}</style>
</head>
<body>
  <div class="container">
    ${navHeader({ icon: "🛍️", title: "Things I Want", links: [{ href: "/hub", label: "🏠 Home" }] })}

    ${flash ? `<div class="flash flash-${flash.type}">${escapeHtml(flash.text)}</div>` : ""}

    <h2>Add Item</h2>
    <div class="form-card">
      <form method="POST" action="/hub/wishlist">
        <input type="text" name="title" placeholder="e.g. MacBook" required>
        <select name="category">${selectOptions(CATEGORY_VALUES, "Other")}</select>
        <select name="priority">${selectOptions(PRIORITY_VALUES, "Medium")}</select>
        <select name="status">${selectOptions(STATUS_VALUES, "Thinking")}</select>
        <input type="number" step="1000" name="estimated_price" placeholder="Estimated price (optional)">
        <input type="text" name="note" placeholder="Note (optional)">
        <button type="submit">Add</button>
      </form>
    </div>

    <h2>Things I Want</h2>
    <div class="wishlist-list">${itemRows}</div>
  </div>
</body>
</html>`;
}
