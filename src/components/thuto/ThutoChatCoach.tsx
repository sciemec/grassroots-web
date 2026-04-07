"use client";

/**
 * ThutoChatCoach
 *
 * THUTO AI for coaches — same floating circle as the player version,
 * but with a coaching system prompt, coaching suggested questions,
 * no player DNA onboarding, and a separate chat history key.
 *
 * THUTO UI RULE (permanent):
 * - Default state = small circle. Always.
 * - Full panel = only after the user clicks the circle.
 * - Circle turns red when there are unread messages.
 */

import { useEffect, useRef, useState } from "react";
import { X, Send, Sparkles, ChevronDown } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id:        string;
  role:      "user" | "assistant";
  content:   string;
  timestamp: number;
}

const STORAGE_KEY = "thuto_coach_chat_history";
const MAX_STORED  = 10;

// ── Coaching suggested prompts ────────────────────────────────────────────────

const SUGGESTED = [
  "Design a 60-min pressing session with cones only",
  "Why do we keep conceding from set pieces?",
  "How do I motivate a losing team at half time?",
  "Best formation against a physical direct team",
];

// ── Coach system prompt ───────────────────────────────────────────────────────

const COACH_SYSTEM_PROMPT =
  "You are THUTO — an AI coaching assistant on GrassRoots Sports, Zimbabwe's AI sports platform. " +
  "You speak directly to the coach. You are knowledgeable, practical, and confident. " +
  "You understand the realities of grassroots coaching in Zimbabwe: limited equipment, " +
  "large squads, no physio, no video analysis suite, uneven pitches, and players who " +
  "train on passion alone. Your advice is always realistic and immediately usable. " +
  "Help the coach with: session design, tactics, formation selection, squad motivation, " +
  "set pieces, player development, half-time team talks, and weekly planning. " +
  "Be direct — coaches need answers, not essays. Keep responses focused and practical. " +
  "Occasionally use football language naturally. End with a specific action the coach can take today.";

// ── Sub-components ────────────────────────────────────────────────────────────

function ThutoAvatar({ size = "sm", pulse = false }: { size?: "sm" | "lg"; pulse?: boolean }) {
  const dim = size === "lg" ? "h-9 w-9 text-base" : "h-7 w-7 text-sm";
  return (
    <div className={`flex-shrink-0 flex items-center justify-center rounded-full border border-teal-400/50 bg-gradient-to-br from-teal-600 to-emerald-700 shadow-sm ${dim} ${pulse ? "animate-pulse" : ""}`}>
      <span className="font-bold text-white select-none">T</span>
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
          style={{ animation: `thuto-bounce 1.2s infinite ${i * 0.2}s` }}
        />
      ))}
      <style>{`@keyframes thuto-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
    </span>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <ThutoAvatar />}
      <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
        isUser
          ? "rounded-br-sm bg-[#1a6b3c]/70 text-white"
          : "rounded-bl-sm bg-teal-900/50 text-white border border-teal-500/20"
      }`}>
        {msg.content.split("\n").map((line, i, arr) => (
          <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
        ))}
        <p className={`mt-1 text-xs opacity-40 ${isUser ? "text-right" : ""}`}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ThutoChatCoach() {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [thinking, setThinking] = useState(false);
  const [unread,   setUnread]   = useState(0);

  const inputRef  = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Load chat history ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw).slice(-MAX_STORED));
    } catch { /* ignore */ }

    const bumped = parseInt(localStorage.getItem("thuto_coach_unread") ?? "0", 10);
    if (bumped > 0) {
      setUnread((n) => n + bumped);
      localStorage.removeItem("thuto_coach_unread");
    }
  }, []);

  // ── Persist messages ─────────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED)));
    } catch { /* storage full */ }
  }, [messages]);

  // ── Scroll to bottom ─────────────────────────────────────────────────────
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking, open]);

  // ── On open: clear unread, focus input ───────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setUnread(0);
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || thinking) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);

    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message:       text,
          system_prompt: COACH_SYSTEM_PROMPT,
          history:       messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error(`AI error ${res.status}`);
      const data = await res.json();
      const answer: string = data?.response ?? data?.answer ?? "Let me think on that — try again in a moment, Coach.";

      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: answer, timestamp: Date.now() }]);
      if (!open) setUnread((n) => n + 1);

    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "Connection issue — please try again, Coach.", timestamp: Date.now() },
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Chat Panel ── */}
      {open && (
        <div
          className="fixed bottom-20 right-4 z-50 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d1f12] shadow-2xl shadow-teal-900/40"
          style={{ width: "min(400px, calc(100vw - 2rem))", height: "min(500px, calc(100vh - 7rem))" }}
          role="dialog"
          aria-label="THUTO Coaching Assistant"
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 flex-shrink-0 border-b border-white/10 px-4 py-3">
            <ThutoAvatar size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">THUTO</p>
              <p className="text-xs text-teal-400">AI Coaching Assistant</p>
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

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && !thinking && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-teal-400/30 bg-teal-900/30">
                  <Sparkles className="h-6 w-6 text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Ask THUTO anything, Coach</p>
                  <p className="mt-0.5 text-xs text-white/40">
                    Tactics, sessions, motivation, squad management
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTED.map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="rounded-full border border-teal-500/30 bg-teal-900/20 px-3 py-1 text-xs text-teal-300 transition-colors hover:bg-teal-900/40 text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}

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
                placeholder="Ask THUTO, Coach..."
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

      {/* ── Floating Circle — THUTO UI RULE: always visible, click to open ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close THUTO coaching assistant" : "Open THUTO coaching assistant"}
        className={`fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-xl transition-all duration-200 ${
          open
            ? "border-teal-400/60 bg-gradient-to-br from-teal-700 to-emerald-800 shadow-teal-500/30 scale-95"
            : unread > 0
            ? "border-red-400/70 bg-gradient-to-br from-red-600 to-red-700 shadow-red-500/40 hover:scale-105 animate-pulse"
            : "border-teal-400/50 bg-gradient-to-br from-teal-600 to-emerald-700 shadow-teal-500/20 hover:scale-105"
        }`}
      >
        {open
          ? <X className="h-5 w-5 text-white" />
          : <span className="text-xl font-bold text-white select-none">T</span>}

        {!open && unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-red-600 shadow">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}
