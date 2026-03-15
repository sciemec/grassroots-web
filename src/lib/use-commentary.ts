/**
 * use-commentary.ts
 *
 * React hook for live AI match commentary.
 *
 * Flow:
 *   Match event logged → POST /api/commentary (Claude Sonnet 4.6)
 *   → receives 1-2 sentence Zimbabwean-style commentary line
 *   → Web Speech API speaks it aloud in the browser
 *
 * No external TTS API key required — uses the browser's built-in
 * SpeechSynthesis. Works in Chrome, Edge, Firefox, Safari.
 */

import { useCallback, useRef, useState } from "react";
import { MatchEvent, MatchSetup } from "@/app/coach/live-match/_types";

interface UseCommentaryOptions {
  setup: MatchSetup;
  homeScore: number;
  awayScore: number;
}

export function useCommentary({ setup, homeScore, awayScore }: UseCommentaryOptions) {
  const [enabled,  setEnabled]  = useState(false);
  const [lastLine, setLastLine] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const busyRef = useRef(false); // debounce — skip if still generating

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Cancel any currently playing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang   = "en-ZW"; // Zimbabwean English — falls back to en-GB/en-US
    utterance.rate   = 1.05;    // slightly faster — commentary energy
    utterance.pitch  = 1.1;
    utterance.volume = 1.0;

    // Try to pick an English voice with good quality
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Microsoft"))
    ) ?? voices.find((v) => v.lang.startsWith("en")) ?? null;
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend   = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const commentOnEvent = useCallback(async (event: MatchEvent) => {
    if (!enabled || busyRef.current) return;

    busyRef.current = true;
    try {
      const res = await fetch("/api/commentary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event,
          homeTeam:  setup.homeTeam,
          awayTeam:  setup.awayTeam,
          homeScore,
          awayScore,
          sport: setup.sport,
        }),
      });

      if (!res.ok) return;

      const data = await res.json();
      const line: string = data.commentary ?? "";
      if (line) {
        setLastLine(line);
        speak(line);
      }
    } catch {
      // Commentary is non-critical — silently ignore failures
    } finally {
      busyRef.current = false;
    }
  }, [enabled, setup, homeScore, awayScore, speak]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      if (prev) {
        // Turning off — cancel any ongoing speech
        window.speechSynthesis?.cancel();
        setSpeaking(false);
        setLastLine("");
      }
      return !prev;
    });
  }, []);

  return { enabled, toggle, lastLine, speaking, commentOnEvent };
}
