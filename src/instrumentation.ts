// Sentry removed to keep the Cloudflare Workers bundle under 10 MB.
// Re-enable by installing @sentry/nextjs and restoring Sentry.init() calls here.

// ── Keep-alive pings ──────────────────────────────────────────────────────────
// Render free/standard tier sleeps services after ~10 min of inactivity.
// We ping all three Render services every 9 minutes so they stay warm.
// This only runs in the Node.js runtime (not edge), once per server boot.

const KEEP_ALIVE_URLS = [
  "https://grassroots-ai-service.onrender.com/health",  // CoachAnalysisTab Python service
  "https://ai.bhora-ai.onrender.com/health",            // FitnessTestTab Python service
  "https://bhora-ai.onrender.com/api/v1/health",        // Laravel backend
];

const PING_INTERVAL_MS = 9 * 60 * 1000; // 9 minutes

async function pingServices() {
  await Promise.allSettled(
    KEEP_ALIVE_URLS.map((url) =>
      fetch(url, { signal: AbortSignal.timeout(10_000) }).catch(() => {})
    )
  );
}

export async function register() {
  // Only start the interval in the Node.js runtime, not in the edge runtime
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Initial ping on boot so services are warm immediately
    pingServices();
    setInterval(pingServices, PING_INTERVAL_MS);
  }
}
