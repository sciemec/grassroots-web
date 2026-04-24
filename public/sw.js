// Grassroots Sport Pro — Service Worker (Workbox-powered)
// Cache version — bump this string whenever you deploy a breaking change
// so users immediately get the new JS bundle instead of the stale cached one.
const CACHE_VERSION = "v20260424-1";
importScripts("https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js");

const { strategies, routing, expiration, backgroundSync, precaching } = workbox;

const OFFLINE_URL = "/offline";

// Precache shell pages only — knowledge base JSON loaded on demand
precaching.precacheAndRoute([
  { url: "/",              revision: null },
  { url: "/login",         revision: null },
  { url: "/register",      revision: null },
  { url: OFFLINE_URL,      revision: null },
  { url: "/manifest.json", revision: null },
  { url: "/favicon.ico",   revision: null },
]);

// JS + CSS bundles — NetworkFirst so deployments are picked up immediately.
// Falls back to cache only when offline. Cache name includes version so old
// stale bundles are ignored after a CACHE_VERSION bump.
routing.registerRoute(
  ({ request }) => ["script", "style"].includes(request.destination),
  new strategies.NetworkFirst({
    cacheName: `gs-bundles-${CACHE_VERSION}`,
    networkTimeoutSeconds: 8,
    plugins: [new expiration.ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 86400 })],
  })
);

// Images and fonts — still fine to serve stale (they don't change often)
routing.registerRoute(
  ({ request }) => ["image", "font"].includes(request.destination),
  new strategies.StaleWhileRevalidate({
    cacheName: `gs-assets-${CACHE_VERSION}`,
    plugins: [new expiration.ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 2592000 })],
  })
);

// Knowledge base JSON — cache on first use, not on install
routing.registerRoute(
  ({ url }) => url.pathname.startsWith("/data/") && url.pathname.endsWith(".json"),
  new strategies.StaleWhileRevalidate({
    cacheName: "gs-knowledge",
    plugins: [new expiration.ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 604800 })],
  })
);

// Pages — NetworkFirst so users always get the freshest HTML shell
routing.registerRoute(
  ({ request }) => request.mode === "navigate",
  new strategies.NetworkFirst({
    cacheName: `gs-pages-${CACHE_VERSION}`,
    networkTimeoutSeconds: 8,
    plugins: [new expiration.ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 86400 })],
  })
);

// API — Network First with 10s timeout
routing.registerRoute(
  ({ url }) => url.hostname.includes("bhora-ai.onrender.com"),
  new strategies.NetworkFirst({
    cacheName: "gs-api",
    networkTimeoutSeconds: 10,
    plugins: [new expiration.ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 300 })],
  })
);

// Background sync — queue failed POST/PUT when offline
const bgSyncPlugin = new backgroundSync.BackgroundSyncPlugin("gs-sync-queue", {
  maxRetentionTime: 1440,
});

routing.registerRoute(
  ({ url, request }) => url.hostname.includes("bhora-ai.onrender.com") && request.method === "POST",
  new strategies.NetworkOnly({ plugins: [bgSyncPlugin] }),
  "POST"
);

routing.registerRoute(
  ({ url, request }) => url.hostname.includes("bhora-ai.onrender.com") && request.method === "PUT",
  new strategies.NetworkOnly({ plugins: [bgSyncPlugin] }),
  "PUT"
);

// Offline fallback
routing.setCatchHandler(async ({ request }) => {
  if (request.destination === "document") return caches.match(OFFLINE_URL);
  return Response.error();
});

// ── THUTO Success Engine — periodic sync ──────────────────────────────────────
// Fires approximately once every 24 hours on Chrome (requires periodic-background-sync permission)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "thuto-daily-checkin") {
    event.waitUntil(fireThutoDailyNotification());
  }
});

async function fireThutoDailyNotification() {
  // Read the user's chosen reminder time from Cache API
  let targetHour = 7, targetMinute = 0;
  try {
    const cache = await caches.open("thuto-config");
    const resp  = await cache.match("/thuto-reminder-config");
    if (resp) {
      const cfg    = await resp.json();
      targetHour   = typeof cfg.hour   === "number" ? cfg.hour   : 7;
      targetMinute = typeof cfg.minute === "number" ? cfg.minute : 0;
    }
  } catch { /* use defaults if cache unavailable */ }

  // Only fire if Chrome woke us within ±90 minutes of the user's chosen time.
  // periodicSync does not fire at an exact clock time — this gate prevents
  // nudges arriving at 2am or 11pm when the user asked for 7am.
  const now     = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const tgtMins = targetHour * 60 + targetMinute;
  const diff    = Math.abs(nowMins - tgtMins);
  const withinWindow = diff <= 90 || diff >= (24 * 60 - 90); // also handles midnight wrap

  if (!withinWindow) return; // wrong time — skip silently

  const messages = [
    { title: "THUTO Daily Check-In ⚽", body: "Time to log your training. 30 seconds — keep your goal alive. Pamberi! 🔥" },
    { title: "THUTO Daily Check-In ⚽", body: "Champions show up every day. Tap to log your check-in. Ramba uchishanda!" },
    { title: "THUTO Daily Check-In ⚽", body: "Your goal is waiting. Did you train today? Tap to log it now. Unokwanisa! 🌟" },
  ];
  const msg = messages[Math.floor(Math.random() * messages.length)];
  await self.registration.showNotification(msg.title, {
    body: msg.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    data: { url: "/player/success/checkin" },
  });
}

// Open check-in page when notification is clicked
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/player/success/checkin";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      clients.openWindow(url);
    })
  );
});
