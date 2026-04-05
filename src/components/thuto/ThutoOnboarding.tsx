"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, ArrowRight, Sparkles } from "lucide-react";
import api from "@/lib/api";

interface Props {
  onComplete: () => void;
}

type Phase = "loading" | "typing" | "awaiting_input" | "thinking" | "exchange_done";

// ── THUTO Avatar ──────────────────────────────────────────────────────────────

function ThutoAvatar({ pulse = false }: { pulse?: boolean }) {
  return (
    <div className="relative flex-shrink-0">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-teal-400/60 bg-gradient-to-br from-teal-600 to-emerald-700 shadow-lg shadow-teal-500/30 ${
          pulse ? "animate-pulse" : ""
        }`}
      >
        <span className="text-lg font-bold tracking-tight text-white select-none">T</span>
      </div>
      {/* Online dot */}
      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0d1f12] bg-teal-400" />
    </div>
  );
}

// ── Typewriter hook ───────────────────────────────────────────────────────────

function useTypewriter(text: string, active: boolean, msPerChar = 15) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const iRef = useRef(0);

  useEffect(() => {
    if (!active || !text) return;
    setDisplayed("");
    setDone(false);
    iRef.current = 0;

    const tick = setInterval(() => {
      iRef.current += 1;
      setDisplayed(text.slice(0, iRef.current));
      if (iRef.current >= text.length) {
        clearInterval(tick);
        setDone(true);
      }
    }, msPerChar);

    return () => clearInterval(tick);
  }, [text, active, msPerChar]);

  return { displayed, done };
}

// ── ThinkingDots ──────────────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <span className="inline-flex items-end gap-0.5 h-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-teal-400"
          style={{ animation: `bounce 1.2s infinite ${i * 0.2}s` }}
        />
      ))}
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ThutoOnboarding({ onComplete }: Props) {
  const [greeting, setGreeting] = useState("");
  const [reply, setReply] = useState("");
  const [thutoResponse, setThutoResponse] = useState("");
  const [phase, setPhase] = useState<Phase>("loading");
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { displayed: greetingTyped, done: greetingDone } = useTypewriter(
    greeting,
    phase === "typing"
  );
  const { displayed: responseTyped, done: responseDone } = useTypewriter(
    thutoResponse,
    phase === "thinking" ? false : !!thutoResponse && phase !== "loading"
  );

  // ── Fetch onboarding greeting on mount ────────────────────────────────────
  useEffect(() => {
    api
      .post("/thuto/onboard")
      .then((res) => {
        const text: string = res.data?.answer ?? res.data?.response ?? "";
        if (text) {
          setGreeting(text);
          setPhase("typing");
        } else {
          setError("THUTO could not load. Please refresh.");
        }
      })
      .catch(() => {
        setError("Could not connect to THUTO. Check your connection.");
      });
  }, []);

  // ── When greeting finishes typing → show input ────────────────────────────
  useEffect(() => {
    if (greetingDone) {
      setPhase("awaiting_input");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [greetingDone]);

  // ── When THUTO response finishes typing → show CTA ───────────────────────
  useEffect(() => {
    if (responseDone && thutoResponse) {
      setPhase("exchange_done");
    }
  }, [responseDone, thutoResponse]);

  // ── Scroll to bottom whenever content changes ─────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [greetingTyped, responseTyped, reply, phase]);

  // ── Send player reply to THUTO ────────────────────────────────────────────
  const sendReply = async () => {
    const msg = input.trim();
    if (!msg || phase !== "awaiting_input") return;

    setReply(msg);
    setInput("");
    setPhase("thinking");

    try {
      const res = await api.post("/thuto/chat", { message: msg });
      const text: string = res.data?.answer ?? res.data?.response ?? "";
      setThutoResponse(text || "Zvakanaka! Let's get you started on your journey.");
    } catch {
      setThutoResponse(
        "Zvakanaka! I'm having a small connection issue right now — but your journey starts today. Let's head to your dashboard!"
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  };

  const handleComplete = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("thuto_onboarded", "true");
    }
    onComplete();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="THUTO AI Player Agent Onboarding"
    >
      {/* Panel */}
      <div className="relative flex h-full max-h-[640px] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d1f12] shadow-2xl shadow-teal-900/40">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <ThutoAvatar />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-white">THUTO</p>
            <p className="text-xs text-teal-400">Murairidzi wako — Your AI Player Agent</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-teal-900/40 px-2.5 py-1 text-xs font-medium text-teal-300">
            <Sparkles className="h-3 w-3" />
            Powered by Claude AI
          </div>
        </div>

        {/* Chat body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Loading state */}
          {phase === "loading" && !error && (
            <div className="flex items-start gap-3">
              <ThutoAvatar />
              <div className="space-y-2 pt-1">
                <div className="h-3 w-48 animate-pulse rounded-full bg-white/10" />
                <div className="h-3 w-36 animate-pulse rounded-full bg-white/10" />
                <div className="h-3 w-40 animate-pulse rounded-full bg-white/10" />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-900/20 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* THUTO greeting */}
          {(phase === "typing" || phase === "awaiting_input" || phase === "thinking" || phase === "exchange_done") && greeting && (
            <div className="flex items-start gap-3">
              <ThutoAvatar />
              <div className="max-w-[78%] rounded-2xl rounded-tl-sm bg-teal-900/40 px-4 py-3 text-sm leading-relaxed text-white border border-teal-500/20">
                {greetingTyped}
                {!greetingDone && (
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-teal-400 align-middle" />
                )}
              </div>
            </div>
          )}

          {/* Player reply bubble */}
          {reply && (
            <div className="flex items-start justify-end gap-3">
              <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-[#1a6b3c]/70 px-4 py-3 text-sm leading-relaxed text-white">
                {reply}
              </div>
            </div>
          )}

          {/* THUTO thinking indicator */}
          {phase === "thinking" && !thutoResponse && (
            <div className="flex items-start gap-3">
              <ThutoAvatar pulse />
              <div className="rounded-2xl rounded-tl-sm bg-teal-900/40 px-4 py-3.5 border border-teal-500/20">
                <ThinkingDots />
              </div>
            </div>
          )}

          {/* THUTO response */}
          {thutoResponse && (
            <div className="flex items-start gap-3">
              <ThutoAvatar />
              <div className="max-w-[78%] rounded-2xl rounded-tl-sm bg-teal-900/40 px-4 py-3 text-sm leading-relaxed text-white border border-teal-500/20">
                {responseTyped}
                {phase !== "exchange_done" && !responseDone && (
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-teal-400 align-middle" />
                )}
              </div>
            </div>
          )}

          {/* Continue CTA */}
          {phase === "exchange_done" && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 rounded-xl bg-[#f0b429] px-6 py-3 text-sm font-bold text-[#1a3a1a] shadow-lg shadow-yellow-900/30 transition-all hover:bg-[#e0a420] hover:shadow-yellow-900/50 active:scale-95"
              >
                Continue to your dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area — only shown while awaiting reply */}
        {phase === "awaiting_input" && (
          <div className="border-t border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 focus-within:border-teal-500/60 transition-colors">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your reply to THUTO..."
                className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                maxLength={500}
              />
              <button
                onClick={sendReply}
                disabled={!input.trim()}
                aria-label="Send reply"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white transition-colors hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1.5 text-center text-xs text-white/30">
              Press Enter to send
            </p>
          </div>
        )}

        {/* Skip button — always available after greeting loads */}
        {(phase === "awaiting_input" || phase === "thinking" || phase === "exchange_done") && (
          <button
            onClick={handleComplete}
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-white/30 transition-colors hover:bg-white/10 hover:text-white/60"
            aria-label="Skip onboarding"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
