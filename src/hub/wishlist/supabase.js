import { supabase } from "../../shared/supabase-client.js";

export const CATEGORY_VALUES = ["Product", "Food", "Travel", "Experience", "Hobby", "Other"];
export const PRIORITY_VALUES = ["Low", "Medium", "High"];
export const STATUS_VALUES = ["Thinking", "Want", "Ready to buy", "Bought", "Dropped"];

export async function getWishlistItems(phone) {
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("id, title, category, estimated_price, priority, status, note, created_at")
    .eq("phone", phone)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createWishlistItem(phone, { title, category, estimatedPrice, priority, status, note }) {
  const { error } = await supabase.from("wishlist_items").insert({
    phone,
    title,
    category: CATEGORY_VALUES.includes(category) ? category : "Other",
    estimated_price: estimatedPrice,
    priority: PRIORITY_VALUES.includes(priority) ? priority : "Medium",
    status: STATUS_VALUES.includes(status) ? status : "Thinking",
    note: note || null,
  });
  if (error) throw error;
}

// filter phone+id (bukan cuma id) karena id-nya dikirim dari form web, jadi dianggap
// input klien - bukan hasil query yang udah difilter phone sebelumnya kayak di calorie/spending
export async function updateWishlistItem(phone, id, { title, category, estimatedPrice, priority, status, note }) {
  const { error } = await supabase
    .from("wishlist_items")
    .update({
      title,
      category: CATEGORY_VALUES.includes(category) ? category : "Other",
      estimated_price: estimatedPrice,
      priority: PRIORITY_VALUES.includes(priority) ? priority : "Medium",
      status: STATUS_VALUES.includes(status) ? status : "Thinking",
      note: note || null,
      updated_at: new Date().toISOString(),
    })
    .eq("phone", phone)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteWishlistItem(phone, id) {
  const { error } = await supabase.from("wishlist_items").delete().eq("phone", phone).eq("id", id);
  if (error) throw error;
}
