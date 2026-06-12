// src/lib/audio-commentary.ts — Groq TTS audio commentary
//
// Uses /api/tts (Groq playai-tts) instead of window.speechSynthesis.
// new Audio(blobUrl).play() works on ALL browsers including iOS Safari,
// unlike speechSynthesis which is blocked on mobile when triggered from timers.
//
// iOS unlock: call audio.unlock() inside a button-click handler (user gesture)
// before the first commentary line arrives. After that, audio chained via
// onended plays freely without further gestures.

class GroqAudioCommentary {
  private queue: string[] = [];
  private isPlayingFlag = false;
  private unlocked = false;

  /**
   * Call this ONCE inside a synchronous user-gesture handler (e.g. the "Audio On"
   * button click). Creates a silent Web Audio buffer which unlocks iOS audio for
   * the rest of the browser session.
   */
  unlock(): void {
    if (this.unlocked || typeof window === 'undefined') return;
    try {
      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
      ctx.resume().catch(() => {});
    } catch {
      // Best-effort — silently ignore if Web Audio not available
    }
    this.unlocked = true;
  }

  private async playText(text: string): Promise<void> {
    this.isPlayingFlag = true;
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const audio = new Audio(url);

      await new Promise<void>((resolve) => {
        audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
        audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
        audio.play().catch(() => resolve()); // resolve on block — don't hang the queue
      });
    } catch {
      // Skip this line, continue queue
    } finally {
      this.isPlayingFlag = false;
      const next = this.queue.shift();
      if (next) void this.playText(next);
    }
  }

  queueCommentary(text: string): void {
    if (!this.isPlayingFlag) {
      void this.playText(text);
    } else {
      this.queue.push(text);
    }
  }

  stop(): void {
    this.queue = [];
    this.isPlayingFlag = false;
  }

  get isPlaying(): boolean {
    return this.isPlayingFlag;
  }
}

let instance: GroqAudioCommentary | null = null;

export function getAudioCommentary(): GroqAudioCommentary {
  if (typeof window === 'undefined') return {} as GroqAudioCommentary;
  if (!instance) instance = new GroqAudioCommentary();
  return instance;
}
