/**
 * uploadVideoInChunks — resilient video upload for mobile connections.
 *
 * Slices a file into CHUNK_BYTES pieces and sends them sequentially through
 * /api/match-eye/upload (our Render-hosted proxy). Each chunk is retried up
 * to MAX_RETRIES times with exponential backoff. The Google resumable-session
 * URL is threaded from the server response back to subsequent requests so the
 * upload can survive a dropped mobile connection mid-file.
 *
 * Architecture: phone → Render proxy → Google
 * The GEMINI_API_KEY stays server-side. The proxy handles all Google auth.
 * DO NOT change this to direct browser-to-Google without explicit approval —
 * this pathway was broken multiple times on mobile before the proxy was stable.
 */

// Google resumable uploads require non-final chunks to be exact multiples of
// 8,388,608 bytes (8 MiB = 1 × Google granularity unit).
// Valid sizes: 8 MB, 16 MB, 24 MB, 32 MB …
// 25 MB (26,214,400) is NOT a valid multiple — confirmed error Aug 2026.
const GOOGLE_CHUNK_GRANULARITY = 8_388_608; // 8 MiB — Google's required granularity
const CHUNK_BYTES       = 1 * GOOGLE_CHUNK_GRANULARITY; //  8 MB — mobile default (1×)
const LARGE_CHUNK_BYTES = 3 * GOOGLE_CHUNK_GRANULARITY; // 24 MB — desktop (3×), was 25 MB (invalid)
const MAX_RETRIES = 3;

/**
 * Retry delays between chunk upload attempts.
 * 5 s / 15 s gives mobile data time to recover after a tower handoff or brief
 * signal drop. Desktop on WiFi rarely needs more than the first attempt.
 *
 * DO NOT reduce these back to `attempt * 1000` (1 s / 2 s) — that timing was
 * confirmed too short for mobile data recovery on field tests (July 2026).
 */
const RETRY_DELAYS_MS = [5_000, 15_000, 30_000] as const;

/**
 * Guard: throws before any chunk reaches the network if the size violates
 * Google's resumable-upload chunk granularity rule.
 *
 * Google requirement: every non-final chunk MUST be an exact multiple of
 * 8,388,608 bytes (GOOGLE_CHUNK_GRANULARITY). The final chunk may be any size.
 *
 * Call this immediately before sendChunkXhr — it is the single enforcement
 * point for this rule across ALL chunk-size paths (mobile, desktop, adaptive).
 *
 * @throws Error with a descriptive message if the size is invalid.
 */
export function assertValidChunkSize(bytes: number, isFinalChunk: boolean): void {
  if (isFinalChunk) return; // final chunk: any size is accepted by Google
  if (bytes % GOOGLE_CHUNK_GRANULARITY !== 0) {
    throw new Error(
      `Invalid chunk size: ${bytes} bytes is not a multiple of ` +
      `${GOOGLE_CHUNK_GRANULARITY} (Google resumable upload granularity). ` +
      `Valid sizes: 8 MB (${GOOGLE_CHUNK_GRANULARITY}), ` +
      `16 MB (${2 * GOOGLE_CHUNK_GRANULARITY}), ` +
      `24 MB (${3 * GOOGLE_CHUNK_GRANULARITY}), etc.`
    );
  }
}

/**
 * Returns the appropriate chunk size for the current device and network,
 * and logs the decision to the console for field diagnostics.
 *
 * Priority order:
 *   1. navigator.connection.effectiveType (Android Chrome) — most accurate
 *   2. User-agent mobile detection (iOS / unknown) — safe fallback
 *   3. Desktop — maximum throughput
 *
 * effectiveType values (Network Information API, Android Chrome only):
 *   "slow-2g" / "2g"  → 8 MB  — 4 MB is NOT a valid Google multiple; 8 MB is minimum
 *   "3g"              → 8 MB  — moderate; 8 MB ≈ 8–25 s, safe handoff window
 *   "4g"              → 24 MB — fast data; treat same as WiFi desktop (was 25 MB — invalid)
 *
 * iOS Safari does NOT expose navigator.connection, so we fall back to 8 MB
 * for any mobile user agent where connection quality is unknowable.
 *
 * DO NOT merge mobile and desktop back to a single chunk size without
 * confirming the mobile upload failure is solved by another mechanism.
 * DO NOT lower the "4g" threshold without field-testing — Android "4g" covers
 * everything from LTE Cat-1 (~10 Mbps) to 5G (>100 Mbps).
 */
function getChunkSize(): number {
  if (typeof navigator === "undefined") {
    // SSR — no browser APIs available
    console.log("[upload] chunk=24MB reason=ssr");
    return LARGE_CHUNK_BYTES;
  }

  const conn = (navigator as Navigator & {
    connection?: { effectiveType?: string };
  }).connection;

  if (conn?.effectiveType) {
    // Android Chrome: use actual measured network quality
    switch (conn.effectiveType) {
      case "slow-2g":
      case "2g":
        // 4 MB (4,194,304) is NOT a valid Google chunk multiple — use 8 MB minimum.
        console.log("[upload] chunk=8MB reason=android-2g");
        return CHUNK_BYTES; // 8 MB — smallest valid Google chunk size
      case "3g":
        console.log("[upload] chunk=8MB reason=android-3g");
        return CHUNK_BYTES;
      default:
        // "4g" or any future value — treat as fast connection
        console.log(`[upload] chunk=24MB reason=android-${conn.effectiveType}`);
        return LARGE_CHUNK_BYTES;
    }
  }

  // navigator.connection absent — iOS Safari or older Android WebView
  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    console.log("[upload] chunk=8MB reason=ios-default");
    return CHUNK_BYTES; // 8 MB — safe default when signal quality is unknowable
  }

  console.log("[upload] chunk=24MB reason=desktop");
  return LARGE_CHUNK_BYTES;
}

// ── Upload Advisory ─────────────────────────────────────────────────────────
// Typical sustained throughput per connection type (conservative estimates):
const SPEED_MBPS = { "4G": 8, "3G": 1.5 };
const GEMINI_MAX_BYTES = 1.9 * 1024 * 1024 * 1024; // 1.9 GB — Gemini Files API hard limit

export interface UploadAdvisory {
  sizeMB:        number;
  /** "Large file" warning shown when file > 500 MB */
  sizeWarning:   string | null;
  /**
   * Hard-limit error shown when file > 1.9 GB AND routed through the Gemini
   * proxy. Null for large-file path (R2 → server-side ffmpeg → Gemini).
   */
  limitError:    string | null;
  /** Estimated upload time strings, e.g. "~3 min on 4G · ~16 min on 3G" */
  estimatedTime: string;
  /** True when file should take the R2 direct-upload + server-side processing path */
  isLargeFile:   boolean;
}

function fmtMins(seconds: number): string {
  const m = Math.round(seconds / 60);
  return m <= 1 ? "~1 min" : `~${m} min`;
}

/**
 * Returns size info and human-readable upload time estimates for a file.
 * Call this before starting the upload to display a pre-flight advisory to the user.
 */
// Files above this threshold go to R2 first, then a server-side job compresses
// and sends them to Gemini. Raw phone footage for a 45-min half is 3–8 GB.
export const LARGE_FILE_BYTES = 500 * 1024 * 1024; // 500 MB

export function getUploadAdvisory(file: File): UploadAdvisory {
  const sizeMB    = file.size / (1024 * 1024);
  const sizeBytes = file.size;

  const t4G = (sizeBytes / (SPEED_MBPS["4G"] * 1024 * 1024 / 8));
  const t3G = (sizeBytes / (SPEED_MBPS["3G"] * 1024 * 1024 / 8));
  const estimatedTime = `${fmtMins(t4G)} on 4G · ${fmtMins(t3G)} on 3G`;

  const isLargeFile = sizeBytes >= LARGE_FILE_BYTES;

  // Large files go via R2 → server-side ffmpeg → Gemini, so the 1.9 GB
  // Gemini limit applies to the compressed output, not the raw upload.
  // We only block at the browser level for the small-file proxy path.
  const limitError = !isLargeFile && sizeBytes > GEMINI_MAX_BYTES
    ? `File is ${sizeMB.toFixed(0)} MB — exceeds the 1.9 GB Gemini limit. Please trim the video or use a shorter clip.`
    : null;

  const sizeWarning = isLargeFile
    ? `Large file (${sizeMB.toFixed(0)} MB). This will be uploaded to R2 and compressed server-side — upload on WiFi if possible.`
    : !limitError && sizeMB > 500
      ? `Large file (${sizeMB.toFixed(0)} MB). For best results on mobile, record at 720p. Upload on WiFi if possible.`
      : null;

  return { sizeMB, sizeWarning, limitError, estimatedTime, isLargeFile };
}

export interface ChunkUploadResult {
  fileUri:  string;
  fileName: string;
  mimeType: string;
}

interface ServerChunkResponse {
  sessionUrl?:     string;
  fileUri?:        string;
  fileName?:       string;
  mimeType?:       string;
  error?:          string;
  /** Set by proxy when Google returns 308 Resume Incomplete.
   *  The next PUT must start at this byte offset (everything before was accepted). */
  confirmedOffset?: number;
}

// ── Upload Error Classification ───────────────────────────────────────────────
// XHR provides zero additional error code on Android Chrome (onerror fires with
// a plain ProgressEvent and no `.error` property).  We classify by HTTP status
// code and XHR event type so callers see an actionable message instead of a
// generic "Network error".

type UploadErrorKind =
  | "connection-dropped" // xhr.onerror  — TCP connection actively terminated by OS or carrier
  | "timeout"            // xhr.ontimeout — no response within 90 s (stalled, not dropped)
  | "session-expired"    // HTTP 410/499  — Google resumable session URL expired
  | "bad-request"        // HTTP 400      — chunk-size violation or malformed parameters
  | "server-error"       // HTTP 5xx      — proxy or Google transient server error
  | "parse-error"        // unparseable JSON returned by proxy
  | "unknown";           // any other HTTP error code

class UploadError extends Error {
  constructor(message: string, public readonly kind: UploadErrorKind) {
    super(message);
    this.name = "UploadError";
  }
}

/**
 * Returns true when retrying the same chunk may succeed.
 * "connection-dropped" and "timeout" are transient network conditions.
 * "server-error" (5xx) is a transient Google/proxy condition.
 * Everything else (session-expired, bad-request, parse-error) is fatal — retrying will not help.
 */
function isRetryable(kind: UploadErrorKind): boolean {
  return kind === "connection-dropped" || kind === "timeout" || kind === "server-error";
}

// ── Screen Wake Lock ─────────────────────────────────────────────────────────
// Prevents Android / iOS from dimming the screen and killing the XHR connection
// mid-upload.  Samsung One UI's aggressive battery management has been confirmed
// to fire xhr.onerror at 3 % on 4G by killing the TCP socket when the screen
// dims (field-tested July 2026).
// Chrome 84+ / Samsung Internet 11+ support this API; it silently no-ops on
// other browsers — no polyfill needed.

type WakeLockHandle = { release(): Promise<void> } | null;

async function acquireWakeLock(): Promise<WakeLockHandle> {
  if (typeof navigator === "undefined") return null;
  const nav = navigator as Navigator & {
    wakeLock?: { request(type: "screen"): Promise<{ release(): Promise<void> }> };
  };
  if (!nav.wakeLock) return null;
  try {
    const lock = await nav.wakeLock.request("screen");
    console.log("[upload] wake-lock acquired");
    return lock;
  } catch {
    // Permission denied or API not available — upload continues without it
    return null;
  }
}

/**
 * Send a single chunk to our Render proxy via XHR (so onprogress fires for
 * accurate progress bars) and resolve with the JSON response.
 *
 * The proxy at /api/match-eye/upload forwards the bytes to Google and returns
 * the Google session URL so we can continue the same resumable upload session
 * on the next chunk without re-authenticating.
 */
function sendChunkXhr(
  chunk:           Blob,
  params:          URLSearchParams,
  sessionUrl:      string | null,
  onChunkProgress: (loaded: number) => void,
): Promise<ServerChunkResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onChunkProgress(e.loaded);
    };

    xhr.onload = () => {
      // ── Session expired — fatal, no point retrying the same session URL ──
      if (xhr.status === 410 || xhr.status === 499) {
        reject(new UploadError(
          `Upload session expired (${xhr.status}) — please start the upload again.`,
          "session-expired",
        ));
        return;
      }

      // ── Bad request — fatal, retrying the same chunk will keep failing ───
      if (xhr.status === 400) {
        let msg = `Upload rejected (400) — invalid chunk size or parameters.`;
        try {
          const body = JSON.parse(xhr.responseText) as { error?: string };
          if (body.error) msg = body.error;
        } catch { /* ignore */ }
        reject(new UploadError(msg, "bad-request"));
        return;
      }

      // ── Server error — transient, worth retrying ─────────────────────────
      if (xhr.status >= 500) {
        let msg = `Server error (${xhr.status}) — retrying.`;
        try {
          const body = JSON.parse(xhr.responseText) as { error?: string };
          if (body.error) msg = body.error;
        } catch { /* ignore */ }
        reject(new UploadError(msg, "server-error"));
        return;
      }

      // ── Success ───────────────────────────────────────────────────────────
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as ServerChunkResponse);
        } catch {
          reject(new UploadError(
            "Unexpected response from upload server — could not parse JSON.",
            "parse-error",
          ));
        }
        return;
      }

      // ── Other non-2xx ─────────────────────────────────────────────────────
      let msg = `Upload chunk failed (${xhr.status})`;
      try {
        const body = JSON.parse(xhr.responseText) as { error?: string };
        if (body.error) msg = body.error;
      } catch { /* ignore */ }
      reject(new UploadError(msg, "unknown"));
    };

    // ── Connection dropped (mobile tower handoff / Samsung battery manager) ─
    // Android Chrome fires onerror with no additional error code when the OS
    // terminates the TCP socket.  We log network state for field diagnostics.
    xhr.onerror = () => {
      const conn = (navigator as Navigator & {
        connection?: { effectiveType?: string; downlink?: number; rtt?: number };
      }).connection;
      const netInfo = conn
        ? ` [net: ${conn.effectiveType ?? "?"}, ↓${conn.downlink ?? "?"}Mbps, rtt ${conn.rtt ?? "?"}ms]`
        : "";
      reject(new UploadError(
        `Connection dropped during upload${netInfo} — will retry automatically.`,
        "connection-dropped",
      ));
    };

    xhr.open("POST", `/api/match-eye/upload?${params.toString()}`);
    // 90 s per chunk — prevents an infinite hang when mobile data stalls.
    // Without this, a stalled (not dropped) connection hangs until the OS kills it.
    xhr.timeout = 90_000;
    xhr.ontimeout = () =>
      reject(new UploadError(
        "Upload chunk timed out (90 s) — connection too slow or stalled. Will retry.",
        "timeout",
      ));
    // chunk.type is always populated for File objects and MediaRecorder blobs.
    // Fallback to octet-stream (not video/mp4) so audio files are never mislabelled
    // to Gemini when chunk.type is unexpectedly empty.
    xhr.setRequestHeader("Content-Type", chunk.type || "application/octet-stream");
    // Thread the Google resumable-session URL so the server continues the same session
    if (sessionUrl) xhr.setRequestHeader("X-Upload-Session-Url", sessionUrl);
    xhr.send(chunk);
  });
}

/**
 * Upload a File to the Gemini Files API in 8 MB chunks via our Render proxy.
 *
 * Architecture: phone → /api/match-eye/upload (Render) → Google Files API
 * Each chunk is retried up to MAX_RETRIES times with exponential backoff.
 *
 * @param file       - The video File to upload.
 * @param onProgress - Called with integer 0–95 as bytes are sent.
 * @returns          - { fileUri, fileName, mimeType } from the Gemini Files API.
 */
export async function uploadVideoInChunks(
  file:       File,
  onProgress: (pct: number) => void,
): Promise<ChunkUploadResult> {
  const totalSize   = file.size;
  const totalChunks = Math.ceil(totalSize / CHUNK_BYTES);
  let   sessionUrl: string | null = null;
  let   bytesUploaded = 0;

  // Prevent Android/iOS from dimming the screen mid-upload (which kills the
  // XHR socket on Samsung One UI's aggressive battery management).
  const wakeLock = await acquireWakeLock();
  try {
    for (let i = 0; i < totalChunks; i++) {
      const start  = i * CHUNK_BYTES;
      const end    = Math.min(start + CHUNK_BYTES, totalSize);
      const isLast = i === totalChunks - 1;

      // `chunk` and params are mutable — a 308 Resume Incomplete response updates
      // them mid-loop so the next attempt resumes from the confirmed byte offset.
      let chunk  = file.slice(start, end);
      const params = new URLSearchParams({
        size:   String(totalSize),
        chunk:  String(chunk.size),
        offset: String(start),
        last:   String(isLast),
      });

      // Guard: enforce Google's chunk granularity before anything hits the network.
      // This throws immediately with a clear message if the chunk size is wrong,
      // preventing the cryptic "not a multiple of 8388608" error from Google.
      assertValidChunkSize(chunk.size, isLast);

      let lastError: Error | null = null;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          const delayMs = RETRY_DELAYS_MS[attempt - 1] ?? 30_000;
          console.log(
            `[upload] retry chunk=${i + 1}/${totalChunks} attempt=${attempt + 1} ` +
            `delay=${delayMs / 1000}s err="${lastError?.message}"`,
          );
          // Mobile-safe backoff: 5 s / 15 s / 30 s — gives mobile data time to recover
          await new Promise<void>((r) => setTimeout(r, delayMs));
        }

        try {
          const res = await sendChunkXhr(
            chunk,
            params,
            sessionUrl,
            (loaded) => {
              // Report cumulative progress across all chunks, capped at 95%
              onProgress(Math.round(((bytesUploaded + loaded) / totalSize) * 95));
            },
          );

          if (res.error) throw new Error(res.error);

          // Thread the session URL forward to subsequent chunk requests
          if (res.sessionUrl) sessionUrl = res.sessionUrl;

          // 308 Resume Incomplete — Google partially accepted this chunk.
          // Re-slice from the confirmed byte offset and retry the remainder.
          // The proxy skips the granularity check for resume slices (?resume=1).
          if (res.confirmedOffset !== undefined) {
            const resumeFrom = res.confirmedOffset;
            console.log(
              `[upload] 308 resume chunk=${i + 1}/${totalChunks} offset=${resumeFrom}`,
            );
            chunk = file.slice(resumeFrom, end);
            params.set("offset", String(resumeFrom));
            params.set("chunk",  String(chunk.size));
            params.set("resume", "1");
            lastError = null;
            continue; // retry attempt loop with updated slice
          }

          if (isLast) {
            if (!res.fileUri) throw new Error("Upload server did not return a file URI");
            return {
              fileUri:  res.fileUri,
              fileName: res.fileName ?? "",
              mimeType: res.mimeType ?? file.type,
            };
          }

          bytesUploaded = end;
          lastError = null;
          break; // chunk succeeded — advance to next chunk
        } catch (err) {
          lastError = err instanceof Error ? err : new Error("Unknown upload error");
          // Don't waste retry attempts on fatal errors (session-expired, bad-request)
          // where the same chunk will never succeed.
          if (lastError instanceof UploadError && !isRetryable(lastError.kind)) break;
        }
      }

      if (lastError) {
        const pct = Math.round((bytesUploaded / totalSize) * 100);
        lastError.message =
          `${lastError.message} (chunk ${i + 1}/${totalChunks}, ${pct}% had uploaded)`;
        throw lastError;
      }
    }
  } finally {
    if (wakeLock) await wakeLock.release().catch(() => { /* ignore release errors */ });
  }

  throw new Error("Upload completed but no file URI was returned");
}

/**
 * Adaptive-chunk variant — uses 24 MB on desktop, 8 MB on mobile.
 *
 * Desktop (WiFi):  24 MB chunks (3 × 8 MiB granularity) — fewer proxy round trips.
 * Mobile (4G/3G):   8 MB chunks — shorter transfer window per chunk, far less
 *   exposure to tower handoffs that trigger xhr.onerror on mobile data.
 *   Field-confirmed fix: 25 MB chunks took 25–65 s on mobile data, regularly
 *   hitting connection drops.  8 MB chunks cut the window to 8–25 s.
 *
 * Google resumable upload is still sequential (required by the protocol).
 *
 * Use this instead of uploadVideoInChunks on /player/analyse, /coach/match-eye,
 * /analyst/match-eye.  The original uploadVideoInChunks is preserved for
 * backwards compatibility.
 */
export async function uploadVideoInChunksParallel(
  file:       File,
  onProgress: (pct: number) => void,
): Promise<ChunkUploadResult> {
  const totalSize   = file.size;
  const chunkSize   = getChunkSize(); // 8 MB on mobile, 24 MB on desktop
  const totalChunks = Math.ceil(totalSize / chunkSize);
  let   sessionUrl: string | null = null;
  let   bytesUploaded = 0;

  // Prevent Android/iOS from dimming the screen mid-upload (which kills the
  // XHR socket on Samsung One UI's aggressive battery management).
  const wakeLock = await acquireWakeLock();
  try {
    for (let i = 0; i < totalChunks; i++) {
      const start  = i * chunkSize;
      const end    = Math.min(start + chunkSize, totalSize);
      const isLast = i === totalChunks - 1;

      // `chunk` and params are mutable — a 308 Resume Incomplete response updates
      // them mid-loop so the next attempt resumes from the confirmed byte offset.
      let chunk  = file.slice(start, end);
      const params = new URLSearchParams({
        size:   String(totalSize),
        chunk:  String(chunk.size),
        offset: String(start),
        last:   String(isLast),
      });

      // Guard: same rule as uploadVideoInChunks — enforce before anything hits the network.
      assertValidChunkSize(chunk.size, isLast);

      let lastError: Error | null = null;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          const delayMs = RETRY_DELAYS_MS[attempt - 1] ?? 30_000;
          console.log(
            `[upload] retry chunk=${i + 1}/${totalChunks} attempt=${attempt + 1} ` +
            `delay=${delayMs / 1000}s err="${lastError?.message}"`,
          );
          // Mobile-safe backoff: 5 s / 15 s / 30 s — gives mobile data time to recover
          await new Promise<void>((r) => setTimeout(r, delayMs));
        }

        try {
          const res = await sendChunkXhr(
            chunk,
            params,
            sessionUrl,
            (loaded) => {
              onProgress(Math.round(((bytesUploaded + loaded) / totalSize) * 95));
            },
          );

          if (res.error) throw new Error(res.error);
          if (res.sessionUrl) sessionUrl = res.sessionUrl;

          // 308 Resume Incomplete — Google partially accepted this chunk.
          // Re-slice from the confirmed byte offset and retry the remainder.
          // The proxy skips the granularity check for resume slices (?resume=1).
          if (res.confirmedOffset !== undefined) {
            const resumeFrom = res.confirmedOffset;
            console.log(
              `[upload] 308 resume chunk=${i + 1}/${totalChunks} offset=${resumeFrom}`,
            );
            chunk = file.slice(resumeFrom, end);
            params.set("offset", String(resumeFrom));
            params.set("chunk",  String(chunk.size));
            params.set("resume", "1");
            lastError = null;
            continue; // retry attempt loop with updated slice
          }

          if (isLast) {
            if (!res.fileUri) throw new Error("Upload server did not return a file URI");
            return {
              fileUri:  res.fileUri,
              fileName: res.fileName ?? "",
              mimeType: res.mimeType ?? file.type,
            };
          }

          bytesUploaded = end;
          lastError = null;
          break;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error("Unknown upload error");
          // Don't waste retry attempts on fatal errors (session-expired, bad-request)
          // where the same chunk will never succeed.
          if (lastError instanceof UploadError && !isRetryable(lastError.kind)) break;
        }
      }

      if (lastError) {
        const pct = Math.round((bytesUploaded / totalSize) * 100);
        lastError.message =
          `${lastError.message} (chunk ${i + 1}/${totalChunks}, ${pct}% had uploaded)`;
        throw lastError;
      }
    }
  } finally {
    if (wakeLock) await wakeLock.release().catch(() => { /* ignore release errors */ });
  }

  throw new Error("Upload completed but no file URI was returned");
}
