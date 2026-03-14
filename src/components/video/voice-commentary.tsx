"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Square, Volume2 } from "lucide-react";

export interface VoiceCommentaryProps {
  /** Text to speak. Changing this prop while autoPlay is true will speak the new text. */
  commentary: string;
  /** Start speaking immediately when commentary prop changes. Default false. */
  autoPlay?: boolean;
  /** Tone preset that adjusts rate and pitch. Default "analytical". */
  style?: "enthusiastic" | "calm" | "analytical";
}

type SpeakState = "idle" | "speaking" | "paused";

// Preferred voices in priority order (matches available BCP-47 locales)
const PREFERRED_LOCALES = ["en-ZW", "en-ZA", "en-GB", "en-US"];

/** Select the best available SpeechSynthesis voice for Zimbabwean English. */
function selectVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  for (const locale of PREFERRED_LOCALES) {
    const match = voices.find((v) => v.lang === locale);
    if (match) return match;
  }
  // Fallback: any English voice
  return voices.find((v) => v.lang.startsWith("en")) ?? voices[0] ?? null;
}

const STYLE_PRESETS: Record<
  NonNullable<VoiceCommentaryProps["style"]>,
  { rate: number; pitch: number }
> = {
  enthusiastic: { rate: 1.1, pitch: 1.2 },
  calm:         { rate: 0.85, pitch: 0.95 },
  analytical:   { rate: 1.0,  pitch: 1.0 },
};

const SPEED_OPTIONS = [0.8, 1.0, 1.2] as const;
type SpeedOption = (typeof SPEED_OPTIONS)[number];

/**
 * VoiceCommentary — reads AI commentary aloud using the Web Speech API.
 * Works entirely offline; no external APIs are required.
 */
export function VoiceCommentary({
  commentary,
  autoPlay = false,
  style = "analytical",
}: VoiceCommentaryProps) {
  // Guard: Web Speech API is browser-native and not available in SSR
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const [state, setState] = useState<SpeakState>("idle");
  const [speed, setSpeed] = useState<SpeedOption>(1.0);
  const [volume, setVolume] = useState(1.0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  /** Cancel any ongoing speech and clean up. */
  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setState("idle");
  }, [supported]);

  /** Build and speak an utterance from the current commentary. */
  const speak = useCallback(
    (text: string) => {
      if (!supported || !text.trim()) return;
      window.speechSynthesis.cancel(); // cancel previous

      const preset = STYLE_PRESETS[style];
      const utter = new SpeechSynthesisUtterance(text);
      utter.voice = selectVoice();
      utter.rate = preset.rate * speed;
      utter.pitch = preset.pitch;
      utter.volume = volume;

      utter.onstart = () => setState("speaking");
      utter.onpause = () => setState("paused");
      utter.onresume = () => setState("speaking");
      utter.onend = () => setState("idle");
      utter.onerror = () => setState("idle");

      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
    },
    [supported, style, speed, volume]
  );

  /** Auto-speak when commentary prop changes and autoPlay is true. */
  useEffect(() => {
    if (autoPlay && commentary) speak(commentary);
    // Intentionally not re-running on `speak` identity change to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentary, autoPlay]);

  /** Clean up speech when component unmounts. */
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  const togglePlayPause = () => {
    if (!supported) return;
    if (state === "idle") {
      speak(commentary);
    } else if (state === "speaking") {
      window.speechSynthesis.pause();
      setState("paused");
    } else if (state === "paused") {
      window.speechSynthesis.resume();
      setState("speaking");
    }
  };

  if (!supported) {
    return (
      <div className="rounded-xl border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        Voice commentary is not supported in this browser.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      {/* Title row */}
      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">AI Voice Commentary</span>
        {state === "speaking" && <SpeakingIndicator />}
      </div>

      {/* Commentary preview */}
      {commentary && (
        <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">
          {commentary}
        </p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Play / Pause */}
        <button
          onClick={togglePlayPause}
          disabled={!commentary.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
          aria-label={state === "speaking" ? "Pause" : "Play"}
        >
          {state === "speaking" ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>

        {/* Stop */}
        <button
          onClick={stop}
          disabled={state === "idle"}
          className="flex h-9 w-9 items-center justify-center rounded-full border hover:bg-muted disabled:opacity-30 transition-colors"
          aria-label="Stop"
        >
          <Square className="h-3.5 w-3.5" />
        </button>

        {/* Speed selector */}
        <div className="flex items-center gap-1 ml-1">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                speed === s
                  ? "bg-primary text-primary-foreground"
                  : "border hover:bg-muted text-muted-foreground"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Volume */}
        <div className="flex flex-1 items-center gap-1.5 min-w-0 ml-2">
          <Volume2 className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 accent-primary"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}

/** Animated green-bar equaliser shown while speaking. */
function SpeakingIndicator() {
  return (
    <span className="flex items-end gap-[2px] h-4" aria-hidden>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-green-500"
          style={{
            height: `${40 + Math.random() * 60}%`,
            animation: `speakBar 0.5s ease-in-out ${i * 0.1}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes speakBar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </span>
  );
}
