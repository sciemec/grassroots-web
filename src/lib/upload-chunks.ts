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

const CHUNK_BYTES = 8 * 1024 * 1024; // 8 MB — matches Google's resumable upload chunk granularity
const MAX_RETRIES = 3;

// ── Upload Advisory ─────────────────────────────────────────────────────────
// Typical sustained throughput per connection type (conservative estimates):
const SPEED_MBPS = { "4G": 8, "3G": 1.5 };
const GEMINI_MAX_BYTES = 1.9 * 1024 * 1024 * 1024; // 1.9 GB — Gemini Files API hard limit

export interface UploadAdvisory {
  sizeMB:        number;
  /** "Large file" warning shown when file > 500 MB */
  sizeWarning:   string | null;
  /** Hard-limit error shown when file > 1.9 GB */
  limitError:    string | null;
  /** Estimated upload time strings, e.g. "~3 min on 4G · ~16 min on 3G" */
  estimatedTime: string;
}

function fmtMins(seconds: number): string {
  const m = Math.round(seconds / 60);
  return m <= 1 ? "~1 min" : `~${m} min`;
}

/**
 * Returns size info and human-readable upload time estimates for a file.
 * Call this before starting the upload to display a pre-flight advisory to the user.
 */
export function getUploadAdvisory(file: File): UploadAdvisory {
  const sizeMB    = file.size / (1024 * 1024);
  const sizeBytes = file.size;

  const t4G = (sizeBytes / (SPEED_MBPS["4G"] * 1024 * 1024 / 8));
  const t3G = (sizeBytes / (SPEED_MBPS["3G"] * 1024 * 1024 / 8));
  const estimatedTime = `${fmtMins(t4G)} on 4G · ${fmtMins(t3G)} on 3G`;

  const limitError = sizeBytes > GEMINI_MAX_BYTES
    ? `File is ${sizeMB.toFixed(0)} MB — exceeds the 1.9 GB Gemini limit. Please trim the video or use a shorter clip.`
    : null;

  const sizeWarning = !limitError && sizeMB > 500
    ? `Large file (${sizeMB.toFixed(0)} MB). For best results on mobile, record at 720p. Upload on WiFi if possible.`
    : null;

  return { sizeMB, sizeWarning, limitError, estimatedTime };
}

export interface ChunkUploadResult {
  fileUri:  string;
  fileName: string;
  mimeType: string;
}

interface ServerChunkResponse {
  sessionUrl?: string;
  fileUri?:    string;
  fileName?:   string;
  mimeType?:   string;
  error?:      string;
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
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as ServerChunkResponse);
        } catch {
          reject(new Error("Unexpected response from upload server"));
        }
      } else {
        let msg = `Upload chunk failed (${xhr.status})`;
        try {
          const body = JSON.parse(xhr.responseText) as { error?: string };
          if (body.error) msg = body.error;
        } catch { /* ignore parse error, use generic msg */ }
        reject(new Error(msg));
      }
    };

    xhr.onerror = () =>
      reject(new Error("Network error during upload — check your connection and try again"));

    xhr.open("POST", `/api/match-eye/upload?${params.toString()}`);
    xhr.setRequestHeader("Content-Type", chunk.type || "video/mp4");
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

  for (let i = 0; i < totalChunks; i++) {
    const start  = i * CHUNK_BYTES;
    const end    = Math.min(start + CHUNK_BYTES, totalSize);
    const chunk  = file.slice(start, end);
    const isLast = i === totalChunks - 1;

    const params = new URLSearchParams({
      size:   String(totalSize),
      chunk:  String(chunk.size),
      offset: String(start),
      last:   String(isLast),
    });

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        // Exponential backoff: 1 s, 2 s before retrying
        await new Promise<void>((r) => setTimeout(r, attempt * 1000));
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
      }
    }

    if (lastError) throw lastError;
  }

  throw new Error("Upload completed but no file URI was returned");
}
