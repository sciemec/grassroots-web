/**
 * Upload Queue — background queue for videos deferred due to weak connection.
 *
 * Usage:
 *   const result = await enqueueUpload(file, onProgress, compress);
 *   // Returns the same ChunkUploadResult as uploadVideoInChunksParallel().
 *   // The promise resolves only when the upload actually completes (may be
 *   // minutes later if the device is on a weak connection).
 *
 * Auto-drain:
 *   Android → navigator.connection "change" event fires when signal improves.
 *   iOS     → 60-second polling interval re-probes and drains if improved.
 *
 * flushQueue() bypasses the connection check and uploads immediately.
 * This is called when the user taps "Upload anyway".
 */

import type { ChunkUploadResult } from "@/lib/upload-chunks";
import { uploadVideoInChunksParallel } from "@/lib/upload-chunks";
import { getUploadStrategy } from "@/lib/use-upload-strategy";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QueueEntry {
  file: File;
  onProgress: (pct: number) => void;
  compress: boolean;
  resolve: (result: ChunkUploadResult) => void;
  reject: (err: unknown) => void;
}

// ---------------------------------------------------------------------------
// Module-level singleton state (browser only)
// ---------------------------------------------------------------------------

const queue: QueueEntry[] = [];
let draining = false;

/**
 * EventTarget that pages can listen to for queue-state changes.
 * Dispatches a "queue-change" event whenever an item is added or removed.
 * Null on the server (SSR guard).
 */
export const uploadQueueEvents: EventTarget | null =
  typeof window !== "undefined" ? new EventTarget() : null;

function emitQueueChange(): void {
  uploadQueueEvents?.dispatchEvent(new Event("queue-change"));
}

// ---------------------------------------------------------------------------
// Core drain logic
// ---------------------------------------------------------------------------

async function compressIfNeeded(file: File, compress: boolean): Promise<File> {
  if (!compress) return file;
  // Dynamic import so pages that don't need compression don't pay the cost.
  const { compressVideo } = await import("@/lib/compress-video");
  return compressVideo(file, () => undefined);
}

async function processQueue(forceFlush = false): Promise<void> {
  if (draining) return;
  if (queue.length === 0) return;

  if (!forceFlush) {
    const strategy = await getUploadStrategy();
    if (strategy.mode !== "live") return; // still too weak
  }

  draining = true;
  while (queue.length > 0) {
    const entry = queue[0];
    try {
      const fileToUpload = await compressIfNeeded(entry.file, entry.compress);
      const result = await uploadVideoInChunksParallel(fileToUpload, entry.onProgress);
      entry.resolve(result);
    } catch (err) {
      entry.reject(err);
    } finally {
      queue.shift();
      emitQueueChange();
    }
  }
  draining = false;
}

// ---------------------------------------------------------------------------
// Auto-drain listeners (browser only)
// ---------------------------------------------------------------------------

if (typeof window !== "undefined") {
  // Android Chrome: fires when effective connection type changes.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = (navigator as any).connection;
  conn?.addEventListener("change", () => {
    void processQueue();
  });

  // iOS / no-API: poll every 60 seconds.
  setInterval(() => {
    if (queue.length > 0 && !draining) {
      void processQueue();
    }
  }, 60_000);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Add a video to the upload queue.
 * Returns a Promise that resolves with ChunkUploadResult when the upload completes.
 * The upload may happen immediately (if connection is good) or after the auto-drain
 * detects an improved signal.
 */
export function enqueueUpload(
  file: File,
  onProgress: (pct: number) => void,
  compress = false,
): Promise<ChunkUploadResult> {
  return new Promise<ChunkUploadResult>((resolve, reject) => {
    queue.push({ file, onProgress, compress, resolve, reject });
    emitQueueChange();
    // Try to drain immediately — if connection is weak, processQueue() will bail.
    void processQueue();
  });
}

/**
 * Bypass the connection check and drain the queue immediately.
 * Call this when the user taps "Upload anyway".
 */
export function flushQueue(): void {
  void processQueue(true);
}

/** Number of items currently waiting in the queue. */
export function getQueueLength(): number {
  return queue.length;
}
