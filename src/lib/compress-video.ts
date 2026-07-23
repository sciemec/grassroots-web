// Client-side video compression using ffmpeg.wasm (single-threaded).
// No SharedArrayBuffer or COOP/COEP headers required.
// Reduces videos to 720p H.264 before upload — typically cuts file size by 85-95%.

import type { FFmpeg } from "@ffmpeg/ffmpeg";

let ff: FFmpeg | null = null;
let loadPromise: Promise<void> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ff?.loaded) return ff;

  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { toBlobURL } = await import("@ffmpeg/util");

  if (!ff) ff = new FFmpeg();

  if (!loadPromise) {
    const base = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    loadPromise = ff.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
    });
  }

  await loadPromise;
  return ff;
}

/**
 * Compress a video file to 720p H.264 in the browser before upload.
 * Skips compression if the file is already under 50 MB.
 * Falls back to the original file if compression fails.
 *
 * @param file        The original video File from the file picker
 * @param onProgress  Called with 0–100 during compression (may jump non-linearly)
 * @returns           A compressed File, or the original if skipped/failed
 */
export async function compressVideo(
  file: File,
  onProgress: (pct: number) => void
): Promise<File> {
  // Skip compression for small files — not worth the WASM startup cost
  const SKIP_BELOW_MB = 50;
  if (file.size < SKIP_BELOW_MB * 1024 * 1024) {
    onProgress(100);
    return file;
  }

  try {
    const engine = await getFFmpeg();
    const { fetchFile } = await import("@ffmpeg/util");

    const progressHandler = ({ progress }: { progress: number }) => {
      onProgress(Math.min(99, Math.round(progress * 100)));
    };
    engine.on("progress", progressHandler);

    await engine.writeFile("input", await fetchFile(file));

    await engine.exec([
      "-i", "input",
      // Scale to 720p, preserve aspect ratio, no upscaling
      "-vf", "scale=1280:720:force_original_aspect_ratio=decrease",
      "-c:v", "libx264",
      "-preset", "ultrafast",   // fastest encode — good enough for AI analysis
      "-crf", "28",             // constant quality; lower = bigger file, higher = more compression
      "-c:a", "aac",
      "-b:a", "96k",
      "-movflags", "+faststart", // allows streaming playback before full download
      "output.mp4",
    ]);

    const data = await engine.readFile("output.mp4") as Uint8Array;

    engine.off("progress", progressHandler);
    await engine.deleteFile("input").catch(() => undefined);
    await engine.deleteFile("output.mp4").catch(() => undefined);

    onProgress(100);
    return new File([data], "compressed.mp4", { type: "video/mp4" });
  } catch {
    // Compression failed — upload the original so the user isn't blocked
    onProgress(100);
    return file;
  }
}
