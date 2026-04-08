"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, Sparkles, ChevronDown } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

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
        className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
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

// ── Visitor system prompt ─────────────────────────────────────────────────────

const VISITOR_SYSTEM_PROMPT = `You are THUTO, the AI guide for GrassRoots Sports — Zimbabwe's first AI-powered sports platform (grassrootssports.live).

Your job: help visitors understand what the platform does and encourage them to sign up.
Be warm, friendly, and concise. Use simple language. Mention Shona phrases occasionally.
Never make up features that aren't listed below.

== PLATFORM OVERVIEW ==
GrassRoots Sports helps Zimbabwean athletes, coaches, scouts, and fans manage sport with AI tools that were previously only available to elite clubs.
Slogan: "Train Anywhere in Zimbabwe. Use AI to Get Recognized."

== HUB CARDS & FEATURES ==

PLAYER HUB (/player)
- AI Coach (THUTO) — personalised coaching advice, training plans, nutrition
- Pitch Mode — solo training sessions with focus area selection and pose-camera form check
- Ubuntu Training — train with your community group; AI suggests drills for the group
- Training Formats — Rondo, Small-Sided Games, Shooting, Drills library
- Milestones — track personal achievements and goals
- My Journey / DNA — builds a full player DNA profile over time (sleep, mindset, goals)
- Showcase — upload short skill clips; AI rates the clip and makes it discoverable by scouts
- Vault — personal highlight video library with shareable reels
- Player Valuation — AI estimates the player's market value in USD
- Potential Score — projects the player's peak rating and development trajectory
- Verification — identity verification that unlocks a scannable QR scouting profile

COACH HUB (/coach)
- Squad Manager — add up to 23 players, track fitness status (fit / caution / injured)
- FutureFit — long-term player development and progression tracking
- Live Match Dashboard — real-time multi-sport match events, AI half-time analysis
- Tactics Board — formations and tactical planning
- Set Piece Analytics — corner and free kick success rates, AI recommendations
- Training Plans — multi-sport structured training programmes
- AI Insights — AI-generated team performance insights

SCOUT HUB (/scout)
- Player Discovery Feed — browse verified players by province, sport, position, age
- Shortlist — save players of interest
- Showcase Clips — browse player skill videos
- AI Scouting Reports — generate professional PDF reports powered by AI
- Semantic Search — natural language search (e.g. "fast left-footed strikers under 17 in Harare")

FAN HUB (/fan)
- Discover Players — find players across Zimbabwe
- Follow Players — follow favourite players and see their training activity
- Leaderboard — top-ranked players by sport and province

ANALYST HUB (/analyst)
- Live Match Collector — pitchside xG data collection (tap zones to log shots)
- xG & Shot Analysis — expected goals vs actual goals comparison
- Pass Map — visual network of passes between players
- Player Heatmaps — zone-based position coverage maps with PDF export
- Tactical Report — AI-generated tactical analysis with PDF export
- Season Intelligence — season-long trends and match history

BUSINESS HUB (/business-hub)
- Budget Planner — track team finances (income vs expenditure)
- Sponsor Finder — directory of Zimbabwean sports sponsors (NetOne, Econet, Delta, CBZ)
- Financial Tracker — log transactions, see monthly income/expense chart
- Event Planner — plan tournaments with checklist management
- Business Skills — articles on sponsorship proposals, ZIFA grants, player contracts

INJURY TRACKER (/injury-tracker)
- AI injury risk scoring based on training load, rest days, injury history, age
- Plain-English recommendations ("Rest 48 hours. No high-intensity training today.")

SCHOOL LEAGUES (/school-leagues)
- NASH and NAPH tournament management for Zimbabwean schools
- League tables, fixture scheduling, result submission

TALENT DATABASE (/talent-database)
- National Top Players database filterable by sport, province, position, age group
- Only players who have opted in to scouting are visible

== PRICING ==
FREE ($0/month):
- Player profile, basic stats, 1 sport, THUTO AI chat, training drills, community access

PRO ($5/month):
- All 10 sports, unlimited video uploads, AI scouting reports, showcase clips, squad management, set piece analytics, analyst hub, priority support

== HOW TO JOIN ==
Sign up at grassrootssports.live/register
Choose a role: Player, Coach, Scout, or Fan
Takes under 2 minutes — no phone required, just email and password.

== SPORTS SUPPORTED ==
Football, Rugby, Athletics, Netball, Basketball, Cricket, Swimming, Tennis, Volleyball, Hockey

== LANGUAGE ==
Platform supports English, ChiShona, and isiNdebele.

Keep answers short (2-4 sentences max unless a list is genuinely needed).
Always end by inviting the visitor to sign up or ask another question.`;

// ── Suggested starter questions ───────────────────────────────────────────────

const STARTERS = [
  "What can players do here?",
  "How does the Coach Hub work?",
  "Is it free to join?",
  "What sports do you support?",
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function ThutoChatVisitor() {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [thinking, setThinking] = useState(false);

  const inputRef  = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking, open]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const sendMessage = async (text?: string) => {
    const body = (text ?? input).trim();
    if (!body || thinking) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: body };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);

    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: body,
          system_prompt: VISITOR_SYSTEM_PROMPT,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error(`AI error ${res.status}`);
      const data = await res.json();
      const answer: string =
        data?.response ?? data?.answer ?? "Ndinokufara — I'm happy to help. Please ask me anything about GrassRoots Sports!";

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: answer },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Ndine dambudziko diki — I have a small issue right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* ── Chat Panel ───────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-20 right-4 z-50 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d1f12] shadow-2xl shadow-teal-900/40"
          style={{ width: "min(400px, calc(100vw - 2rem))", height: "min(500px, calc(100vh - 7rem))" }}
          role="dialog"
          aria-label="THUTO AI Guide"
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center gap-2.5 border-b border-white/10 px-4 py-3">
            <ThutoAvatar size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">THUTO</p>
              <p className="text-xs text-teal-400">Your GrassRoots Guide</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close THUTO"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && !thinking && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-teal-400/30 bg-teal-900/30">
                  <Sparkles className="h-6 w-6 text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Mhoro! I&apos;m THUTO</p>
                  <p className="mt-0.5 text-xs text-white/40">
                    Ask me anything about GrassRoots Sports
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
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
                placeholder="Ask about the app…"
                disabled={thinking}
                className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none disabled:opacity-50"
                maxLength={500}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || thinking}
                aria-label="Send message"
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white transition-colors hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-3 w-3" />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-white/20">
              Ready to join?{" "}
              <a href="/register" className="text-teal-400 hover:underline">
                Sign up free →
              </a>
            </p>
          </div>
        </div>
      )}

      {/* ── Floating Trigger Button ───────────────────────────────────────── */}
      {/* THUTO UI RULE: always a small circle. Full panel only on click.    */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close THUTO guide" : "Chat with THUTO — your AI guide"}
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
      </button>
    </>
  );
}
