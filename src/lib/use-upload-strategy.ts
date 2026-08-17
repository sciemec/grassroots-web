/**
 * Upload Strategy — connection-quality gate for all chunked video upload pages.
 *
 * Two detection mechanisms, one threshold:
 *   Android Chrome  → navigator.connection.downlink  (sync, 0 ms)
 *   iOS / no-API   → 1 MB pre-flight probe to ?probe=1 (async, 1–16 s)
 *   Desktop        → assume WiFi → always "live"
 *
 * Threshold math:
 *   8 MB chunk, 90 s XHR timeout → needs ≥ 0.89 Mbps effective upload.
 *   Mobile upload ≈ 40 % of downlink → downlink must be ≥ 2.22 Mbps.
 *   We use 2.0 Mbps as the practical gate (conservative, prevents near-miss timeouts).
 */

export const LIVE_THRESHOLD_MBPS = 2.0;

/** Size of the probe payload in bytes (1 MB). */
const PROBE_BYTES = 1_048_576;

export type UploadMode = "live" | "queue";

export interface ConnectionSnapshot {
  downlinkMbps: number | null;
  effectiveType: string | null;
  detectionMethod: "connection-api" | "probe" | "ua-fallback";
}

export interface UploadStrategyResult {
  mode: UploadMode;
  reason: string;
  snapshot: ConnectionSnapshot;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Build 1 MB of pseudo-random bytes (XOR-shift — non-compressible by HTTP). */
function makePseudoRandomBytes(byteLength: number): Uint8Array {
  const buf = new Uint8Array(byteLength);
  let seed = 0xdeadbeef;
  for (let i = 0; i < byteLength; i++) {
    seed ^= seed << 13;
    seed ^= seed >> 17;
    seed ^= seed << 5;
    buf[i] = seed & 0xff;
  }
  return buf;
}

/**
 * Android Chrome path (sync).
 * Returns downlink Mbps when navigator.connection is available, else null.
 */
function tryApiStrategy(): { downlinkMbps: number; effectiveType: string } | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = (navigator as any).connection;
  if (!conn) return null;

  const downlink: number = conn.downlink ?? 0;
  const effectiveType: string = conn.effectiveType ?? "unknown";

  // downlink is reported as 0 on some Android builds when the value is unknown.
  if (downlink === 0) return null;

  return { downlinkMbps: downlink, effectiveType };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Measure actual upload throughput by sending 1 MB to the probe endpoint.
 * Returns Mbps, or null if the fetch fails.
 */
export async function measureUploadSpeed(): Promise<number | null> {
  if (typeof window === "undefined") return null;
  try {
    const payload = makePseudoRandomBytes(PROBE_BYTES);
    const t0 = performance.now();
    const res = await fetch("/api/match-eye/upload?probe=1", {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: new Blob([payload.buffer as ArrayBuffer], { type: "application/octet-stream" }),
    });
    if (!res.ok) return null;
    const elapsedSec = (performance.now() - t0) / 1000;
    const bits = PROBE_BYTES * 8;
    return bits / elapsedSec / 1_000_000; // Mbps
  } catch {
    return null;
  }
}

/**
 * Determine whether to attempt a live upload or queue for later.
 *
 * Fast path  (~0 ms):   Android Chrome → reads navigator.connection.downlink
 * Slow path  (1–16 s):  iOS / no-API   → runs the 1 MB probe
 * Instant    (~0 ms):   Desktop UA     → assume WiFi, always "live"
 */
export async function getUploadStrategy(): Promise<UploadStrategyResult> {
  if (typeof window === "undefined") {
    // SSR — should never be called server-side, but guard anyway.
    return {
      mode: "live",
      reason: "Server-side render — defaulting to live",
      snapshot: { downlinkMbps: null, effectiveType: null, detectionMethod: "ua-fallback" },
    };
  }

  // --- Fast path: Android Chrome (Connection API) ---
  const apiResult = tryApiStrategy();
  if (apiResult !== null) {
    const { downlinkMbps, effectiveType } = apiResult;
    const mode: UploadMode = downlinkMbps >= LIVE_THRESHOLD_MBPS ? "live" : "queue";
    return {
      mode,
      reason:
        mode === "live"
          ? `Good connection (${downlinkMbps.toFixed(1)} Mbps measured)`
          : `Weak connection (${downlinkMbps.toFixed(1)} Mbps — below ${LIVE_THRESHOLD_MBPS} Mbps threshold)`,
      snapshot: { downlinkMbps, effectiveType, detectionMethod: "connection-api" },
    };
  }

  // --- Desktop UA fast path: assume WiFi ---
  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);
  if (!isMobile) {
    return {
      mode: "live",
      reason: "Desktop device — assuming WiFi",
      snapshot: { downlinkMbps: null, effectiveType: null, detectionMethod: "ua-fallback" },
    };
  }

  // --- Slow path: iOS / mobile without Connection API → probe ---
  const probedMbps = await measureUploadSpeed();
  if (probedMbps === null) {
    // Probe failed (offline / server unreachable) → queue.
    return {
      mode: "queue",
      reason: "Connection probe failed — queuing for retry",
      snapshot: { downlinkMbps: null, effectiveType: null, detectionMethod: "probe" },
    };
  }
  const mode: UploadMode = probedMbps >= LIVE_THRESHOLD_MBPS ? "live" : "queue";
  return {
    mode,
    reason:
      mode === "live"
        ? `Good connection (${probedMbps.toFixed(1)} Mbps measured)`
        : `Weak connection (${probedMbps.toFixed(1)} Mbps — below ${LIVE_THRESHOLD_MBPS} Mbps threshold)`,
    snapshot: { downlinkMbps: probedMbps, effectiveType: null, detectionMethod: "probe" },
  };
}
