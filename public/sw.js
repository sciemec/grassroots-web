// Grassroots Sport Pro — Service Worker (Workbox-powered)
// Cache version — bump this string whenever you deploy a breaking change
// so users immediately get the new JS bundle instead of the stale cached one.
const CACHE_VERSION = "v20260326-2";
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
