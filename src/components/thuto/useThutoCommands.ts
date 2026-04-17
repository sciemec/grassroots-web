"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CommandType =
  | "start_session"
  | "stop_session"
  | "log_stat"
  | "navigate"
  | "analyse_session";

export interface CommandResult {
  type: CommandType;
  toast: string;
  spoken: string;
  path?: string;
  event?: string;
  /** Only set for analyse_session — the message ThutoChat sends to the AI */
  analyseMessage?: string;
}

// ── Text-to-Speech ────────────────────────────────────────────────────────────
// Uses the browser's built-in SpeechSynthesis API — no extra packages, no cost.
// Prefers en-GB voice for a warm, clear sound; falls back to any English voice,
// then to whatever the browser default is.

function speakConfirmation(text: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  // Cancel any in-progress speech before starting the new one
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate  = 0.95;
  utterance.pitch = 1.0;

  // Voice selection — runs after voices are loaded (they load async in some browsers)
  const applyVoice = () => {
    const voices   = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang === "en-GB") ??
      voices.find((v) => v.lang.startsWith("en")) ??
      null;
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length > 0) {
    applyVoice();
  } else {
    // Voices not yet loaded — wait for the event then speak
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      applyVoice();
    };
    // Fallback: speak with default voice if event never fires
    setTimeout(() => {
      if (!utterance.voice) window.speechSynthesis.speak(utterance);
    }, 500);
  }
}

// ── Navigation map ────────────────────────────────────────────────────────────

interface NavEntry {
  triggers: RegExp;
  path: string;
  label: string;
}

const NAV_MAP: NavEntry[] = [
  { triggers: /open my profile|go to profile|show my profile/,           path: "/player/profile",    label: "your profile"  },
  { triggers: /go to stats|open stats|show my stats/,                    path: "/player/stats",      label: "your stats"    },
  { triggers: /open drills|go to drills|show drills/,                    path: "/player/drills",     label: "drills"        },
  { triggers: /show my progress|go to progress|open progress/,           path: "/player/progress",   label: "your progress" },
  { triggers: /open showcase|go to showcase|show showcase/,              path: "/player/showcase",   label: "showcase"      },
  { triggers: /go to nutrition|open nutrition|show nutrition/,            path: "/player/nutrition",  label: "nutrition"     },
  { triggers: /open goals|go to goals|open mission|show my goal/,        path: "/player/goal",       label: "your goal"     },
  { triggers: /open sessions|go to sessions|show my sessions/,           path: "/player/sessions",   label: "your sessions" },
  { triggers: /open passport|go to passport|show my passport/,           path: "/player/passport",   label: "your passport" },
];

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useThutoCommands() {
  const router = useRouter();

  const executeCommand = useCallback(
    async (transcript: string): Promise<CommandResult | null> => {
      const t = transcript.toLowerCase().trim();

      // ── 1. Start session ────────────────────────────────────────────────────
      if (/start recording|begin session|start training|start session/.test(t)) {
        const result: CommandResult = {
          type:   "start_session",
          toast:  "Session started — THUTO is watching",
          spoken: "Starting your session now",
          path:   "/player/pitch-mode",
        };
        speakConfirmation(result.spoken);
        router.push(result.path!);
        return result;
      }

      // ── 2. Stop session ─────────────────────────────────────────────────────
      if (/stop recording|end session|finish training|stop session/.test(t)) {
        const result: CommandResult = {
          type:   "stop_session",
          toast:  "Session saved — great work",
          spoken: "Session saved. Great work today.",
          path:   "/player/sessions",
        };
        speakConfirmation(result.spoken);
        router.push(result.path!);
        return result;
      }

      // ── 3. Log a stat ───────────────────────────────────────────────────────
      if (/i scored|log a goal|log goal|i got an assist|log assist|i made a save|log a save/.test(t)) {
        let event = "goal";
        if (t.includes("assist")) event = "assist";
        if (t.includes("save"))   event = "save";

        const result: CommandResult = {
          type:   "log_stat",
          toast:  `Logging ${event}…`,
          spoken: `Opening stat logger for a ${event}`,
          path:   `/player/stats/new?event=${event}`,
          event,
        };
        speakConfirmation(result.spoken);
        router.push(result.path!);
        return result;
      }

      // ── 4. Navigate ─────────────────────────────────────────────────────────
      for (const nav of NAV_MAP) {
        if (nav.triggers.test(t)) {
          const result: CommandResult = {
            type:   "navigate",
            toast:  `Opening ${nav.label}`,
            spoken: `Opening ${nav.label}`,
            path:   nav.path,
          };
          speakConfirmation(result.spoken);
          router.push(result.path!);
          return result;
        }
      }

      // ── 5. Analyse session ──────────────────────────────────────────────────
      if (/analyse my session|analyze my session|give me feedback|how did i do|review my training/.test(t)) {
        speakConfirmation("Fetching your last session for analysis");

        try {
          const res = await api.get("/player/sessions");
          const _r      = res.data?.data ?? res.data;
          const sessions = Array.isArray(_r) ? _r : [];
          const last     = sessions[0] ?? null;

          const analyseMessage = last
            ? `Please analyse my last training session and give me specific, actionable feedback. Here is the session data: ${JSON.stringify(last, null, 2)}`
            : "I just finished a training session — please give me general feedback on how I can improve based on what you know about me.";

          return {
            type:           "analyse_session",
            toast:          "Fetching your last session…",
            spoken:         "Fetching your last session for analysis",
            analyseMessage,
          };
        } catch {
          return {
            type:           "analyse_session",
            toast:          "Asking THUTO for feedback…",
            spoken:         "Getting feedback from THUTO",
            analyseMessage: "I just finished training — please give me specific feedback on what I should work on next.",
          };
        }
      }

      // ── No command matched ──────────────────────────────────────────────────
      return null;
    },
    [router]
  );

  return { executeCommand };
}
