// src/lib/engines/frame-extractor.ts
// Shared video-to-canvas frame extractor used by all GRS AI engines.
// Client-side only — never import on the server.

export interface ExtractedFrame {
  canvas:    HTMLCanvasElement;
  timestamp: number; // seconds into video
  index:     number;
}

export async function extractFrames(
  file:        File,
  maxFrames  = 30,
  onProgress?: (pct: number) => void,
): Promise<ExtractedFrame[]> {
  return new Promise((resolve, reject) => {
    const url    = URL.createObjectURL(file);
    const video  = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d');
    if (!ctx) { URL.revokeObjectURL(url); reject(new Error('No canvas 2D context')); return; }

    video.src         = url;
    video.muted       = true;
    video.playsInline = true;
    video.preload     = 'auto';

    video.onloadedmetadata = async () => {
      const dur = video.duration;
      if (!isFinite(dur) || dur <= 0) {
        URL.revokeObjectURL(url);
        reject(new Error('Video duration unknown — cannot seek.'));
        return;
      }

      canvas.width  = 640;
      canvas.height = Math.round(640 * (video.videoHeight / Math.max(video.videoWidth, 1)));

      const frames: ExtractedFrame[] = [];
      const step = dur / maxFrames;

      for (let i = 0; i < maxFrames; i++) {
        const ts = i * step + step * 0.1; // slight offset avoids black frames
        video.currentTime = ts;
        await new Promise<void>((res) => { video.onseeked = () => res(); });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const f   = document.createElement('canvas');
        f.width   = canvas.width;
        f.height  = canvas.height;
        f.getContext('2d')!.drawImage(canvas, 0, 0);
        frames.push({ canvas: f, timestamp: ts, index: i });
        onProgress?.(Math.round(((i + 1) / maxFrames) * 100));
      }

      URL.revokeObjectURL(url);
      resolve(frames);
    };

    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not decode video.')); };
  });
}
