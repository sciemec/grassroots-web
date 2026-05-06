// Grassroots Sport Pro — Service Worker v2
// Uses native Cache API only — NO CDN imports, works fully offline.
// Bump CACHE_VERSION on every deployment to bust stale caches.
const CACHE_VERSION = "v20260506-1";

const STATIC_CACHE = `gs-static-${CACHE_VERSION}`;   // Next.js hashed JS/CSS chunks
const PAGES_CACHE  = `gs-pages-${CACHE_VERSION}`;    // HTML shells for hub pages
const ASSETS_CACHE = `gs-assets-${CACHE_VERSION}`;   // images, fonts
const API_CACHE    = "gs-api";                        // API responses (no version — updated in place)
const DATA_CACHE   = "gs-knowledge";                  // /data/*.json knowledge base

const OFFLINE_URL  = "/offline";

// ── Pages to precache on install ─────────────────────────────────────────────
// These are fetched and stored during SW install so they load instantly offline.
const PRECACHE_PAGES = [
  // Core shell
  "/",
  "/login",
  "/register",
  "/offline",
  "/manifest.json",
  "/favicon.ico",

  // Player hub
  "/player",
  "/player/profile",
  "/player/sessions",
  "/player/drills",
  "/player/stats",
  "/player/milestones",
  "/player/nutrition",
  "/player/ai-coach",
  "/player/training-formats",
  "/player/notifications",
  "/player/progress",
  "/player/goal",
  "/player/showcase",
  "/player/assessment",
  "/player/development",
  "/player/vault",

  // Coach hub
  "/coach",
  "/coach/squad",
  "/coach/matches",
  "/coach/training-plans",
  "/coach/live-match",
  "/coach/tactics",
  "/coach/stats",
  "/coach/set-pieces",
  "/coach/ai-insights",
];

// ── Install: fetch and cache all hub pages ────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGES_CACHE).then((cache) =>
      // allSettled — individual 404s don't abort the install
      Promise.allSettled(PRECACHE_PAGES.map((url) => cache.add(url)))
    )
  );
});

// ── Activate: delete caches from old CACHE_VERSION ───────────────────────────
self.addEventListener("activate", (event) => {
  const KEEP = new Set([STATIC_CACHE, PAGES_CACHE, ASSETS_CACHE, API_CACHE, DATA_CACHE, "thuto-config"]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !KEEP.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── SKIP_WAITING (triggered by workbox-window update banner) ─────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

// ── Fetch handler ─────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  const isOurOrigin = url.origin === self.location.origin;
  const isApiOrigin = url.hostname.includes("bhora-ai.onrender.com");

  // 1. Next.js static chunks (/_next/static/) — CacheFirst (hashed = immutable)
  if (isOurOrigin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 2. Images + fonts — StaleWhileRevalidate
  if (isOurOrigin && (request.destination === "image" || request.destination === "font")) {
    event.respondWith(staleWhileRevalidate(request, ASSETS_CACHE));
    return;
  }

  // 3. Knowledge base JSON (/data/*.json) — StaleWhileRevalidate
  if (isOurOrigin && url.pathname.startsWith("/data/") && url.pathname.endsWith(".json")) {
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
    return;
  }

  // 4. API GET calls (bhora-ai backend) — NetworkFirst, 24 h cache fallback
  if (isApiOrigin && request.method === "GET") {
    event.respondWith(networkFirst(request, API_CACHE, 10_000));
    return;
  }

  // 5. Navigation (HTML pages) — NetworkFirst, fall back to cached shell, then /offline
  if (isOurOrigin && request.mode === "navigate") {
    event.respondWith(
      networkFirst(request, PAGES_CACHE, 8_000).catch(() =>
        caches.match(OFFLINE_URL).then((r) => r || Response.error())
      )
    );
    return;
  }

  // 6. Everything else — network only (non-GET mutations, external requests)
});

// ── Cache strategy helpers ────────────────────────────────────────────────────

/** CacheFirst: serve from cache; on miss, fetch → cache → return. */
async function cacheFirst(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh.ok) cache.put(request, fresh.clone());
  return fresh;
}

/**
 * NetworkFirst: try network with a timeout; on failure serve from cache.
 * On success the fresh response is stored, replacing the stale cached copy.
 */
async function networkFirst(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await withTimeout(fetch(request.clone()), timeoutMs);
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(request);
    return cached || Response.error();
  }
}

/**
 * StaleWhileRevalidate: return cached copy immediately (if any), then
 * update the cache in the background for next time.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchAndCache = fetch(request)
    .then((fresh) => {
      if (fresh.ok) cache.put(request, fresh.clone());
      return fresh;
    })
    .catch(() => null);

  // If we have a cached copy, return it immediately and refresh in background
  if (cached) {
    fetchAndCache.catch(() => {}); // fire and forget
    return cached;
  }

  // No cache — wait for the network
  const fresh = await fetchAndCache;
  return fresh || Response.error();
}

/** Reject after timeoutMs — used to bound network waits. */
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("sw-timeout")), ms);
    promise.then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e);  }
    );
  });
}

// ── THUTO Success Engine — periodic sync ──────────────────────────────────────
// Fires approximately once every 24 hours on Chrome when periodicSync is granted.
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "thuto-daily-checkin") {
    event.waitUntil(fireThutoDailyNotification());
  }
});

async function fireThutoDailyNotification() {
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
  const now     = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const tgtMins = targetHour * 60 + targetMinute;
  const diff    = Math.abs(nowMins - tgtMins);
  if (diff > 90 && diff < 24 * 60 - 90) return; // wrong time window — skip

  const messages = [
    { title: "THUTO Daily Check-In", body: "Time to log your training. 30 seconds — keep your goal alive. Pamberi!" },
    { title: "THUTO Daily Check-In", body: "Champions show up every day. Tap to log your check-in. Ramba uchishanda!" },
    { title: "THUTO Daily Check-In", body: "Your goal is waiting. Did you train today? Tap to log it now. Unokwanisa!" },
  ];
  const msg = messages[Math.floor(Math.random() * messages.length)];
  await self.registration.showNotification(msg.title, {
    body:  msg.body,
    icon:  "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    data:  { url: "/player/goal" },
  });
}

// Open the goal page when a THUTO notification is clicked
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/player/goal";
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
