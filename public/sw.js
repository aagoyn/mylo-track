const CACHE_NAME = "mylo-track-static-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Semua halaman dashboard di-render server-side per request (data user, budget, dll berubah
// terus) jadi sengaja CUMA icon statis yang di-cache - bukan HTML - biar nggak pernah nampilin
// data basi. Cache-first buat icon: cepat & kerja walau offline, aman karena isinya jarang ganti.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.origin === self.location.origin && url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      })
    );
    return;
  }

  // Navigasi antar halaman (termasuk lewat PWA App Shortcut - "Quick Spend" buka
  // /hub?action=quick-expense, "Log Grind" buka /hub/grind, "Clock In / Out" buka /hub/clocked)
  // - network-first EKSPLISIT, nggak pernah dicache, biar query string apapun (termasuk
  // ?action=...) selalu nyampe server fresh dan nggak ke-stuck di cache lama.
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request));
  }
});

// Reminder Clock In/Out (push dikirim dari server lewat web-push, lihat src/shared/push.js).
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Mylo Track", {
      body: data.body || "",
      icon: "/icons/hub.png",
      badge: "/icons/hub.png",
      data: { url: data.url || "/hub/clocked" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/hub/clocked";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(targetUrl));
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});
