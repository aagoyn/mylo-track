import { setVapidDetails, sendNotification } from "web-push";
import { supabase } from "./supabase-client.js";

setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@example.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function saveSubscription(phone, subscription) {
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      phone,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) throw error;
}

export async function removeSubscription(endpoint) {
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) throw error;
}

// Dipakai scheduler buat tau phone mana aja yang perlu dicek (cuma yang udah pernah subscribe).
export async function getSubscribedPhones() {
  const { data, error } = await supabase.from("push_subscriptions").select("phone");
  if (error) throw error;
  return [...new Set((data || []).map((r) => r.phone))];
}

async function getSubscriptionsForPhone(phone) {
  const { data, error } = await supabase.from("push_subscriptions").select("*").eq("phone", phone);
  if (error) throw error;
  return data || [];
}

// Kirim ke semua device user itu. Subscription yang udah invalid/expired (404/410 dari push
// service) otomatis dibersihin biar nggak terus-terusan dicoba tiap reminder jalan.
export async function sendPushToPhone(phone, payload) {
  const subs = await getSubscriptionsForPhone(phone);
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await removeSubscription(sub.endpoint);
        } else {
          console.error("Gagal kirim push ke", phone, err.statusCode, err.body);
        }
      }
    })
  );
}
