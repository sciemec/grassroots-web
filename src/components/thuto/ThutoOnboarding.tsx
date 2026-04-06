"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, ArrowRight, Sparkles } from "lucide-react";
import api from "@/lib/api";

interface Props {
  onComplete: () => void;
}

// DNA questions asked naturally after the initial goal exchange (Session 1)
const DNA_QUESTIONS = [
  "Do you have a football at home you can train with?",
  "Tell me about where you usually train — a field, your yard, a street?",
] as const;

// Explicit stage machine — each stage maps to exactly one UI state
type Stage =
  | "loading"        // fetching greeting from API
  | "greeting"       // THUTO greeting is typewriting
  | "goal_input"     // player types their goal
  | "goal_thinking"  // waiting for THUTO's goal response from API
  | "goal_response"  // THUTO goal response is typewriting
  | "dna1_question"  // THUTO DNA Q1 is typewriting
  | "dna1_input"     // player types their DNA Q1 answer
  | "dna2_question"  // THUTO DNA Q2 is typewriting
  | "dna2_input"     // player types their DNA Q2 answer
  | "done";          // all exchanges complete — show CTA

// ── Typewriter hook ───────────────────────────────────────────────────────────

function useTypewriter(text: string, active: boolean, msPerChar = 14) {
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

// ── Sub-components ────────────────────────────────────────────────────────────

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
      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0d1f12] bg-teal-400" />
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-end gap-0.5 h-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-teal-400"
          style={{ animation: `ob-bounce 1.2s infinite ${i * 0.2}s` }}
        />
      ))}
      <style>{`@keyframes ob-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
    </span>
  );
}

function ThutoBubble({
  text,
  cursor = false,
  pulse = false,
}: {
  text: string;
  cursor?: boolean;
  pulse?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <ThutoAvatar pulse={pulse} />
      <div className="max-w-[78%] rounded-2xl rounded-tl-sm bg-teal-900/40 px-4 py-3 text-sm leading-relaxed text-white border border-teal-500/20">
        {text}
        {cursor && (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-teal-400 align-middle" />
        )}
      </div>
    </div>
  );
}

function PlayerBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-[#1a6b3c]/70 px-4 py-3 text-sm leading-relaxed text-white">
        {text}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ThutoOnboarding({ onComplete }: Props) {
  const [stage,        setStage]        = useState<Stage>("loading");
  const [typingText,   setTypingText]   = useState("");
  const [greeting,     setGreeting]     = useState("");
  const [playerGoal,   setPlayerGoal]   = useState("");
  const [goalResponse, setGoalResponse] = useState("");
  const [playerDna1,   setPlayerDna1]   = useState("");
  const [playerDna2,   setPlayerDna2]   = useState("");
  const [input,        setInput]        = useState("");
  const [error,        setError]        = useState("");

  const inputRef  = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Typewriter is active only during stages where THUTO is speaking
  const isTypingStage =
    stage === "greeting"      ||
    stage === "goal_response" ||
    stage === "dna1_question" ||
    stage === "dna2_question";

  const { displayed, done: typingDone } = useTypewriter(typingText, isTypingStage);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayed, stage, playerGoal, playerDna1, playerDna2]);

  // ── Focus input when awaiting player reply ────────────────────────────────
  useEffect(() => {
    if (stage === "goal_input" || stage === "dna1_input" || stage === "dna2_input") {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [stage]);

  // ── Fetch onboarding greeting — retryable ─────────────────────────────────
  const fetchGreeting = () => {
    setError("");
    setStage("loading");
    api
      .post("/thuto/onboard")
      .then((res) => {
        const text: string = res.data?.answer ?? res.data?.response ?? "";
        if (text) {
          setGreeting(text);
          setTypingText(text);
          setStage("greeting");
        } else {
          setError("THUTO could not load. Please try again.");
        }
      })
      .catch((err: { response?: { status?: number } }) => {
        const status = err?.response?.status;
        if (status === 503) {
          setError("THUTO is waking up — this can take up to 30 seconds on first load. Try again.");
        } else if (status === 500) {
          setError("THUTO is not configured yet. Please contact support or try again later.");
        } else {
          setError("Could not connect to THUTO. Check your connection and try again.");
        }
      });
  };

  useEffect(() => { fetchGreeting(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Advance stage when typewriter finishes ────────────────────────────────
  useEffect(() => {
    if (!typingDone) return;

    switch (stage) {
      case "greeting":
        // Greeting done → wait for player goal
        setStage("goal_input");
        break;

      case "goal_response":
        // Goal response done → short pause, then ask DNA Q1
        setTimeout(() => {
          setTypingText(DNA_QUESTIONS[0]);
          setStage("dna1_question");
        }, 500);
        break;

      case "dna1_question":
        // DNA Q1 done → wait for player answer
        setStage("dna1_input");
        break;

      case "dna2_question":
        // DNA Q2 done → wait for player answer
        setStage("dna2_input");
        break;
    }
  }, [typingDone, stage]);

  // ── Send player message ───────────────────────────────────────────────────
  const send = async () => {
    const msg = input.trim();
    if (!msg) return;
    setInput("");

    switch (stage) {
      case "goal_input": {
        setPlayerGoal(msg);
        setStage("goal_thinking");
        try {
          const res = await api.post("/thuto/chat", { message: msg });
          const text: string =
            res.data?.answer ?? res.data?.response ??
            "Zvakanaka! Your goal is clear. Let me learn a bit more about you so I can coach you properly.";
          setGoalResponse(text);
          setTypingText(text);
          setStage("goal_response");
        } catch {
          const fallback =
            "Zvakanaka! I hear you. Let me learn a bit more about your situation so I can give you the right advice.";
          setGoalResponse(fallback);
          setTypingText(fallback);
          setStage("goal_response");
        }
        break;
      }

      case "dna1_input": {
        // Save answer + send silently for DNA extraction
        setPlayerDna1(msg);
        api.post("/thuto/chat", { message: msg }).catch(() => {});
        // Immediately ask DNA Q2
        setTypingText(DNA_QUESTIONS[1]);
        setStage("dna2_question");
        break;
      }

      case "dna2_input": {
        // Save answer + send silently for DNA extraction
        setPlayerDna2(msg);
        api.post("/thuto/chat", { message: msg }).catch(() => {});
        // Mark Session 1 complete — Session 2 starts next login
        localStorage.setItem("thuto_onboarded", "true");
        localStorage.setItem("thuto_dna_session", "2");
        setStage("done");
        break;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleComplete = () => {
    localStorage.setItem("thuto_onboarded", "true");
    localStorage.setItem("thuto_dna_session", "2");
    onComplete();
  };

  // ── Derived display flags ─────────────────────────────────────────────────

  const showGoalResponse =
    !!goalResponse &&
    stage !== "goal_thinking" &&
    stage !== "greeting" &&
    stage !== "goal_input";

  const showDna1Question = [
    "dna1_question", "dna1_input",
    "dna2_question", "dna2_input", "done",
  ].includes(stage);

  const showDna2Question = [
    "dna2_question", "dna2_input", "done",
  ].includes(stage);

  const isAwaiting =
    stage === "goal_input" ||
    stage === "dna1_input" ||
    stage === "dna2_input";

  const inputPlaceholder =
    stage === "goal_input"
      ? "What do you most want to improve as an athlete?"
      : stage === "dna1_input"
      ? "Yes / No — tell me more if you like..."
      : "Describe your training spot...";

  const canSkip = stage !== "loading" && stage !== "greeting";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="THUTO AI Player Agent Onboarding"
    >
      <div className="relative flex h-full max-h-[700px] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d1f12] shadow-2xl shadow-teal-900/40">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <ThutoAvatar />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-white">THUTO</p>
            <p className="text-xs text-teal-400">Murairidzi wako — Your AI Player Agent</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-teal-900/40 px-2.5 py-1 text-xs font-medium text-teal-300">
            <Sparkles className="h-3 w-3" />
            Powered by DeepSeek
          </div>
        </div>

        {/* Chat body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Loading skeleton */}
          {stage === "loading" && !error && (
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
            <div className="rounded-xl border border-red-500/30 bg-red-900/20 p-4">
              <p className="text-sm text-red-300">{error}</p>
              <button
                onClick={fetchGreeting}
                className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/30"
              >
                Try again
              </button>
            </div>
          )}

          {/* THUTO greeting */}
          {greeting && (
            <ThutoBubble
              text={stage === "greeting" ? displayed : greeting}
              cursor={stage === "greeting" && !typingDone}
            />
          )}

          {/* Player goal */}
          {playerGoal && <PlayerBubble text={playerGoal} />}

          {/* THUTO thinking */}
          {stage === "goal_thinking" && (
            <div className="flex items-start gap-3">
              <ThutoAvatar pulse />
              <div className="rounded-2xl rounded-tl-sm bg-teal-900/40 px-4 py-3.5 border border-teal-500/20">
                <ThinkingDots />
              </div>
            </div>
          )}

          {/* THUTO goal response */}
          {showGoalResponse && (
            <ThutoBubble
              text={stage === "goal_response" ? displayed : goalResponse}
              cursor={stage === "goal_response" && !typingDone}
            />
          )}

          {/* THUTO DNA Q1 */}
          {showDna1Question && (
            <ThutoBubble
              text={stage === "dna1_question" ? displayed : DNA_QUESTIONS[0]}
              cursor={stage === "dna1_question" && !typingDone}
            />
          )}

          {/* Player DNA1 answer */}
          {playerDna1 && <PlayerBubble text={playerDna1} />}

          {/* THUTO DNA Q2 */}
          {showDna2Question && (
            <ThutoBubble
              text={stage === "dna2_question" ? displayed : DNA_QUESTIONS[1]}
              cursor={stage === "dna2_question" && !typingDone}
            />
          )}

          {/* Player DNA2 answer */}
          {playerDna2 && <PlayerBubble text={playerDna2} />}

          {/* Done — CTA */}
          {stage === "done" && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 rounded-xl bg-[#f0b429] px-6 py-3 text-sm font-bold text-[#1a3a1a] shadow-lg shadow-yellow-900/30 transition-all hover:bg-[#e0a420] active:scale-95"
              >
                Continue to your dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        {isAwaiting && (
          <div className="border-t border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 focus-within:border-teal-500/60 transition-colors">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={inputPlaceholder}
                className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                maxLength={500}
              />
              <button
                onClick={send}
                disabled={!input.trim()}
                aria-label="Send"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white transition-colors hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1.5 text-center text-xs text-white/30">Press Enter to send</p>
          </div>
        )}

        {/* Skip button */}
        {canSkip && (
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
