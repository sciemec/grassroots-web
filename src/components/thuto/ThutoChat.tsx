"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, Sparkles, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import api from "@/lib/api";

const ThutoOnboarding = dynamic(() => import("./ThutoOnboarding"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const STORAGE_KEY = "thuto_chat_history";
const MAX_STORED  = 10;

// ── DNA session questions injected as THUTO's opening message (sessions 2–5) ─

const DNA_SESSION_OPENERS: Record<number, string> = {
  2: "Mhoro! While we talk today — how many hours of sleep do you usually get each night? And what do you typically eat in a day? Be honest, I want to build advice around real food you actually have access to.",
  3: "Welcome back! Quick one — are you currently in school? And does your family know about your football dream? Do they support you?",
  4: "Good to see you again. When things go wrong in a match — you miss a chance, make an error — how do you usually feel and react? Also, how many days a week can you realistically train?",
  5: "Last few things I want to know about you — what kind of football do you love to watch? What player's style do you wish you played like? And what is it about the game itself that makes you genuinely happy?",
};

// ── THUTO Avatar ──────────────────────────────────────────────────────────────

function ThutoAvatar({ size = "sm", pulse = false }: { size?: "sm" | "lg"; pulse?: boolean }) {
  const dim = size === "lg" ? "h-9 w-9 text-base" : "h-7 w-7 text-sm";
  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center rounded-full border border-teal-400/50 bg-gradient-to-br from-teal-600 to-emerald-700 shadow-sm ${dim} ${
        pulse ? "animate-pulse" : ""
      }`}
    >
      <span className="font-bold text-white select-none">T</span>
    </div>
  );
}

// ── ThinkingDots ──────────────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <span className="inline-flex items-end gap-0.5 h-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-teal-400"
          style={{ animation: `thuto-bounce 1.2s infinite ${i * 0.2}s` }}
        />
      ))}
      <style>{`@keyframes thuto-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
    </span>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <ThutoAvatar />}
      <div
        className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-sm bg-[#1a6b3c]/70 text-white"
            : "rounded-bl-sm bg-teal-900/50 text-white border border-teal-500/20"
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

// ── DEV FLAG ──────────────────────────────────────────────────────────────────
// Set to true when THUTO is ready for production use.
// While false: only a static circle renders — no panel, no onboarding, no clicks.
const THUTO_ACTIVE = true;

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ThutoChat() {
  const [onboarded,       setOnboarded]       = useState(true); // true = skip check until hydrated
  const [open,            setOpen]            = useState(false);
  const [messages,        setMessages]        = useState<Message[]>([]);
  const [input,           setInput]           = useState("");
  const [thinking,        setThinking]        = useState(false);
  const [unread,          setUnread]          = useState(0);
  const [dnaCompleteness, setDnaCompleteness] = useState(0);

  const inputRef  = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── THUTO_ACTIVE = false → inert circle only, nothing opens ──────────────
  if (!THUTO_ACTIVE) {
    return (
      <div
        aria-label="THUTO AI — coming soon"
        title="THUTO — in development"
        className="fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 border-teal-400/30 bg-gradient-to-br from-teal-600/60 to-emerald-700/60 shadow-lg shadow-teal-900/20 opacity-50 cursor-default select-none"
      >
        <span className="text-xl font-bold text-white">T</span>
      </div>
    );
  }

  // ── Check onboarding status + fetch DNA completeness on mount ────────────
  useEffect(() => {
    // Check if the player has completed THUTO onboarding
    const hasOnboarded = localStorage.getItem("thuto_onboarded") === "true";
    setOnboarded(hasOnboarded);

    api.get("/player/dna")
      .then((res) => {
        setDnaCompleteness(res.data?.data?.profile_completeness ?? 0);
      })
      .catch(() => {}); // non-critical — bar simply stays hidden
  }, []);

  // ── Load chat history + auto-open if flagged ──────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Message[] = JSON.parse(raw);
        setMessages(parsed.slice(-MAX_STORED));
      }
    } catch {
      // ignore parse errors — start fresh
    }
    if (localStorage.getItem("thuto_chat_open") === "1") {
      localStorage.removeItem("thuto_chat_open");
      setOpen(true);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "thuto_chat_open" && e.newValue === "1") {
        localStorage.removeItem("thuto_chat_open");
        setOpen(true);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // ── Persist messages ──────────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED)));
    } catch {
      // storage full — ignore
    }
  }, [messages]);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking, open]);

  // ── On open: clear unread, focus input, inject preloads, inject DNA session
  useEffect(() => {
    if (!open) return;

    setUnread(0);
    setTimeout(() => inputRef.current?.focus(), 150);

    // Inject a preloaded message from another page (e.g. training page)
    const preloaded = localStorage.getItem("thuto_preload_message");
    if (preloaded) {
      localStorage.removeItem("thuto_preload_message");
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: preloaded, timestamp: Date.now() },
      ]);
    }

    // Inject DNA session questions on first open of a new day (sessions 2–5)
    const session   = parseInt(localStorage.getItem("thuto_dna_session") ?? "0", 10);
    const lastAsked = localStorage.getItem("thuto_dna_last_asked") ?? "";
    const today     = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    if (session >= 2 && session <= 5 && lastAsked !== today) {
      const opener = DNA_SESSION_OPENERS[session];
      if (opener) {
        localStorage.setItem("thuto_dna_last_asked", today);
        localStorage.setItem("thuto_dna_session", String(session + 1));
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: opener, timestamp: Date.now() },
        ]);
      }
    }

    // Re-fetch DNA completeness so bar reflects latest backend state
    api.get("/player/dna")
      .then((res) => setDnaCompleteness(res.data?.data?.profile_completeness ?? 0))
      .catch(() => {});
  }, [open]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || thinking) return;

    const userMsg: Message = {
      id: crypto.randomUUID(), role: "user", content: text, timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);

    try {
      const res = await api.post("/thuto/chat", { message: text });
      const answer: string =
        res.data?.answer ?? res.data?.response ?? "Ndiri here — I'm here, let's talk.";

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: answer, timestamp: Date.now() },
      ]);

      if (!open) setUnread((n) => n + 1);

      // Re-fetch DNA completeness — extractDnaFromMessage may have updated it
      api.get("/player/dna")
        .then((res) => setDnaCompleteness(res.data?.data?.profile_completeness ?? 0))
        .catch(() => {});

    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Ndine dambudziko diki — I have a small issue right now. Please try again in a moment.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem("thuto_onboarded", "true");
    setOnboarded(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (!onboarded) {
    return <ThutoOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <>
      {/* ── Chat Panel ─────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-20 right-4 z-50 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d1f12] shadow-2xl shadow-teal-900/40"
          style={{ width: "min(400px, calc(100vw - 2rem))", height: "min(500px, calc(100vh - 7rem))" }}
          role="dialog"
          aria-label="THUTO AI Chat"
        >
          {/* Header */}
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3">
              <ThutoAvatar size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white">THUTO</p>
                <p className="text-xs text-teal-400">AI Player Agent</p>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="rounded-lg px-2 py-1 text-xs text-white/30 transition-colors hover:bg-white/10 hover:text-white/60"
                    title="Clear chat history"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close THUTO chat"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* DNA completeness bar — visible when 0 < completeness < 100 */}
            {dnaCompleteness > 0 && dnaCompleteness < 100 && (
              <div className="border-b border-white/5 px-4 pt-2 pb-2">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-[10px] text-white/40">THUTO is getting to know you</p>
                  <p className="text-[10px] font-medium text-teal-400">{dnaCompleteness}% complete</p>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-teal-500/60 transition-all duration-500"
                    style={{ width: `${dnaCompleteness}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && !thinking && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-teal-400/30 bg-teal-900/30">
                  <Sparkles className="h-6 w-6 text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Ask THUTO anything</p>
                  <p className="mt-0.5 text-xs text-white/40">
                    Training plans, drills, nutrition, tactics, motivation
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {["Build my fitness", "Best drills for me", "How do I improve?"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="rounded-full border border-teal-500/30 bg-teal-900/20 px-3 py-1 text-xs text-teal-300 transition-colors hover:bg-teal-900/40"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {thinking && (
              <div className="flex items-end gap-2">
                <ThutoAvatar pulse />
                <div className="rounded-2xl rounded-bl-sm bg-teal-900/50 px-3 py-2.5 border border-teal-500/20">
                  <ThinkingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-white/10 px-3 py-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 focus-within:border-teal-500/50 transition-colors">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask THUTO..."
                disabled={thinking}
                className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none disabled:opacity-50"
                maxLength={2000}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || thinking}
                aria-label="Send message"
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white transition-colors hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Trigger Button ─────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close THUTO chat" : "Open THUTO chat"}
        className={`fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-xl transition-all duration-200 ${
          open
            ? "border-teal-400/60 bg-gradient-to-br from-teal-700 to-emerald-800 shadow-teal-500/30 scale-95"
            : "border-teal-400/50 bg-gradient-to-br from-teal-600 to-emerald-700 shadow-teal-500/20 hover:scale-105 hover:shadow-teal-500/40"
        }`}
      >
        {open ? (
          <X className="h-5 w-5 text-white" />
        ) : (
          <span className="text-xl font-bold text-white select-none">T</span>
        )}

        {/* Unread badge */}
        {!open && unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#f0b429] text-[10px] font-bold text-[#1a3a1a] shadow">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}
