// Grassroots Sport Pro — Service Worker (Workbox-powered)
importScripts("https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js");

const { strategies, routing, expiration, backgroundSync, precaching } = workbox;

const CACHE_VERSION = "v2";
const OFFLINE_URL   = "/offline";

// Precache shell pages + knowledge base data files
precaching.precacheAndRoute([
  { url: "/",              revision: CACHE_VERSION },
  { url: "/login",         revision: CACHE_VERSION },
  { url: "/register",      revision: CACHE_VERSION },
  { url: OFFLINE_URL,      revision: CACHE_VERSION },
  { url: "/manifest.json", revision: CACHE_VERSION },
  { url: "/favicon.ico",   revision: CACHE_VERSION },
  // Offline knowledge base — cache at install time so AI works without internet
  { url: "/data/coaching_knowledge.json",  revision: CACHE_VERSION },
  { url: "/data/drill_library.json",       revision: CACHE_VERSION },
  { url: "/data/development_phases.json",  revision: CACHE_VERSION },
  { url: "/data/fitness_protocols.json",   revision: CACHE_VERSION },
  { url: "/data/session_programmes.json",  revision: CACHE_VERSION },
  { url: "/data/football_guide.json",      revision: CACHE_VERSION },
  { url: "/data/feedback_responses.json",  revision: CACHE_VERSION },
  { url: "/data/nutrition_advice.json",    revision: CACHE_VERSION },
  { url: "/data/zim_foods.json",           revision: CACHE_VERSION },
  { url: "/data/zimbabwe_schools.json",    revision: CACHE_VERSION },
  { url: "/data/poverty_districts.json",   revision: CACHE_VERSION },
]);

// Static assets — Cache First
routing.registerRoute(
  ({ request }) =>
    ["script","style","image","font"].includes(request.destination),
  new strategies.CacheFirst({
    cacheName: "gs-assets-" + CACHE_VERSION,
    plugins: [new expiration.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 2592000 })],
  })
);

// Pages — Stale While Revalidate
routing.registerRoute(
  ({ request }) => request.mode === "navigate",
  new strategies.StaleWhileRevalidate({
    cacheName: "gs-pages-" + CACHE_VERSION,
    plugins: [new expiration.ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 86400 })],
  })
);

// API — Network First with 10s timeout
routing.registerRoute(
  ({ url }) => url.hostname.includes("bhora-ai.onrender.com"),
  new strategies.NetworkFirst({
    cacheName: "gs-api-" + CACHE_VERSION,
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
