"use client";

/**
 * FutureFit — Junior Football Development Hub
 *
 * Designed for grassroots coaches working with youth players.
 * Uses the football-knowledge.ts coaching session library (FIFA, FCRF, FA sources)
 * filtered to youth/grassroots levels, plus an AI assistant that searches
 * the knowledge base before calling Claude.
 */

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Search, BookOpen, Brain, Shield, Target, Users,
  ChevronRight, ChevronDown, ChevronUp, AlertTriangle, Loader2,
  Send, Sparkles, Star, Flag, Zap,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import {
  COACHING_SESSIONS,
  findRelevantSessions,
  type CoachingSession,
} from "@/lib/football-knowledge";

// ─── Filter junior-relevant sessions ─────────────────────────────────────────

const JUNIOR_SESSIONS = COACHING_SESSIONS.filter(
  (s) => s.level === "youth" || s.level === "grassroots" || s.level === "all"
);

// ─── Category metadata ────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  attacking:    { label: "Attacking",    icon: Zap,           color: "text-amber-400"  },
  defending:    { label: "Defending",    icon: Shield,        color: "text-blue-400"   },
  pressing:     { label: "Pressing",     icon: Target,        color: "text-green-400"  },
  fundamentals: { label: "Fundamentals", icon: Star,          color: "text-purple-400" },
  safety:       { label: "Safety",       icon: AlertTriangle, color: "text-red-400"    },
};

const LEVEL_META: Record<string, { label: string; color: string }> = {
  youth:      { label: "Youth",       color: "bg-purple-500/20 text-purple-300"  },
  grassroots: { label: "Grassroots",  color: "bg-green-500/20 text-green-300"   },
  all:        { label: "All Ages",    color: "bg-blue-500/20 text-blue-300"     },
};

// ─── Chat message type ────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

// ─── Session Detail Panel ─────────────────────────────────────────────────────

function SessionDetail({ session, onClose }: { session: CoachingSession; onClose: () => void }) {
  const meta = CATEGORY_META[session.category];
  const Icon = meta?.icon ?? BookOpen;
  const levelMeta = LEVEL_META[session.level];

  // Split content into paragraphs for readability
  const paragraphs = session.content
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 20); // cap at 20 paragraphs for performance

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-t-3xl border border-white/10 bg-[#0f2318] sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-white/10 p-5">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ${meta?.color ?? "text-white"}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${levelMeta?.color ?? "bg-white/10 text-white/60"}`}>
                {levelMeta?.label ?? session.level}
              </span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                {session.source} · {session.pages}pp
              </span>
            </div>
            <p className="mt-1 text-sm font-bold text-white leading-snug">{session.title}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-white/40 hover:text-white transition-colors"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {paragraphs.map((p, i) => {
            // Detect section headings (ALL CAPS or short bold lines)
            const isHeading = p.length < 80 && (p === p.toUpperCase() || /^PART \d|^Phase \d|^Key|^Session|^Organisation|^Objective/.test(p));
            return isHeading ? (
              <p key={i} className="mt-3 text-xs font-bold uppercase tracking-widest text-[#f0b429]">{p}</p>
            ) : (
              <p key={i} className="text-sm text-white/80 leading-relaxed">{p}</p>
            );
          })}
          {session.content.length > paragraphs.join("").length && (
            <p className="text-xs text-white/30 italic">
              · Showing first 20 sections — {session.pages} page session plan ·
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-4">
          <p className="text-center text-xs text-white/30">
            Source: {session.source} · Ask THUTO below for coaching tips on this session
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Session Card ─────────────────────────────────────────────────────────────

function SessionCard({ session, onClick }: { session: CoachingSession; onClick: () => void }) {
  const meta = CATEGORY_META[session.category];
  const Icon = meta?.icon ?? BookOpen;
  const levelMeta = LEVEL_META[session.level];
  const preview = session.content.slice(0, 120).replace(/\s+/g, " ").trim() + "…";

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-white/20 hover:bg-white/10 transition-all active:scale-[0.98]"
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 ${meta?.color ?? "text-white"}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${levelMeta?.color ?? "bg-white/10 text-white/50"}`}>
              {levelMeta?.label ?? session.level}
            </span>
            <span className="text-[9px] text-white/30 uppercase tracking-wider">{session.source}</span>
          </div>
          <p className="text-sm font-semibold text-white leading-snug">{session.title}</p>
          <p className="mt-1 text-xs text-white/50 leading-relaxed line-clamp-2">{preview}</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-white/20 mt-1" />
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FutureFitPage() {
  const [query, setQuery]                   = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedSession, setSelectedSession] = useState<CoachingSession | null>(null);
  const [chatHistory, setChatHistory]       = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput]           = useState("");
  const [chatLoading, setChatLoading]       = useState(false);
  const [showChat, setShowChat]             = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Filter sessions ──────────────────────────────────────────────────────────
  const filteredSessions = (() => {
    let sessions = JUNIOR_SESSIONS;

    if (activeCategory !== "all") {
      sessions = sessions.filter((s) => s.category === activeCategory);
    }

    if (query.trim()) {
      const results = findRelevantSessions(query, 10);
      // Intersect with level filter
      const ids = new Set(results.map((r) => r.id));
      sessions = sessions.filter((s) => ids.has(s.id));
    }

    return sessions;
  })();

  // ── Send chat message with KB context ────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const userMsg: ChatMessage = { role: "user", text };
    const next = [...chatHistory, userMsg];
    setChatHistory(next);
    setChatInput("");
    setChatLoading(true);

    // Build context from relevant sessions
    const relevant = findRelevantSessions(text, 3);
    const context = relevant.length > 0
      ? `\n\nKNOWLEDGE BASE CONTEXT (from FIFA/FCRF/FA junior coaching materials):\n` +
        relevant.map((s) => `--- ${s.title} (${s.source}) ---\n${s.content.slice(0, 600)}`).join("\n\n")
      : "";

    const systemPrompt =
      `You are THUTO, the AI coach assistant for GrassRoots Sports in Zimbabwe. ` +
      `You specialise in junior football coaching (youth and grassroots levels). ` +
      `Provide practical, field-ready advice suitable for coaches with no access to professional facilities. ` +
      `Keep answers concise (3-5 sentences max unless asked for detail). ` +
      `Use simple language — your coaches may be new to formal coaching. ` +
      `Always mention player safety first when relevant.` +
      context;

    const history = next.slice(-8).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.text,
    }));

    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          system_prompt: systemPrompt,
          history: history.slice(0, -1), // exclude current user msg (sent as message)
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.response ?? data.reply ?? "No response from THUTO.";
        setChatHistory([...next, { role: "assistant", text: reply }]);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        return;
      }
    } catch { /* fall through */ }

    setChatHistory([...next, {
      role: "assistant",
      text: "THUTO is currently offline. Check your connection and try again.",
    }]);
  }, [chatInput, chatLoading, chatHistory]);

  const categories = [
    { key: "all",         label: "All",          icon: BookOpen       },
    { key: "attacking",   label: "Attack",       icon: Zap            },
    { key: "defending",   label: "Defence",      icon: Shield         },
    { key: "pressing",    label: "Pressing",     icon: Target         },
    { key: "fundamentals",label: "Skills",       icon: Star           },
    { key: "safety",      label: "Safety",       icon: AlertTriangle  },
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="gs-watermark flex-1 overflow-auto">
        {/* ── Hero header ─────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0b1f12]/95 backdrop-blur-md px-5 py-4">
          <div className="flex items-center gap-3">
            <Link href="/coach" className="rounded-lg p-1.5 text-white/40 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#f0b429]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f0b429]">
                  FutureFit
                </span>
                <span className="text-[10px] text-white/30 uppercase tracking-wider">Junior Development</span>
              </div>
              <h1 className="text-lg font-bold text-white leading-tight">Junior Football Hub</h1>
            </div>
            <button
              onClick={() => setShowChat((v) => !v)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                showChat
                  ? "bg-[#f0b429] text-[#1a3a1a]"
                  : "bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              <Brain className="h-3.5 w-3.5" />
              {showChat ? "Sessions" : "Ask THUTO"}
            </button>
          </div>

          {/* Search */}
          {!showChat && (
            <div className="mt-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sessions — e.g. 'pressing', 'U14 passing'…"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/30 outline-none focus:border-[#f0b429]/40 focus:ring-1 focus:ring-[#f0b429]/20 transition-all"
              />
            </div>
          )}
        </div>

        {/* ── THUTO Chat Panel ─────────────────────────────────────────────── */}
        {showChat && (
          <div className="flex flex-col" style={{ height: "calc(100vh - 120px)" }}>
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f0b429]/20">
                <Sparkles className="h-4 w-4 text-[#f0b429]" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">THUTO — Junior Coach AI</p>
                <p className="text-xs text-white/40">Searches FIFA, FCRF & FA knowledge base first</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {chatHistory.length === 0 && (
                <div className="space-y-3 pt-4">
                  <p className="text-center text-xs text-white/30 uppercase tracking-wider">Suggested questions</p>
                  {[
                    "How do I coach pressing for U14 boys?",
                    "What are the best fundamentals drills for 10-12 year olds?",
                    "How do I spot concussion symptoms during training?",
                    "Give me a 45-minute session plan for youth attacking",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setChatInput(q); }}
                      className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left text-xs text-white/70 hover:border-[#f0b429]/30 hover:text-white transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0b429]/20 mt-0.5">
                      <Sparkles className="h-3.5 w-3.5 text-[#f0b429]" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#f0b429] text-[#1a3a1a] font-medium"
                      : "bg-white/10 text-white"
                  }`}>
                    {msg.text.split("\n").map((line, j) => (
                      <span key={j}>{line}{j < msg.text.split("\n").length - 1 && <br />}</span>
                    ))}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f0b429]/20">
                    <Sparkles className="h-3.5 w-3.5 text-[#f0b429]" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-2.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white/50" />
                    <span className="text-xs text-white/50">Searching knowledge base…</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                  placeholder="Ask about junior coaching…"
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#f0b429]/40 transition-all"
                  disabled={chatLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!chatInput.trim() || chatLoading}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0b429] text-[#1a3a1a] disabled:opacity-40 transition-opacity"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Sessions Panel ───────────────────────────────────────────────── */}
        {!showChat && (
          <div className="px-4 pb-8">
            {/* Category filter chips */}
            <div className="my-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeCategory === key
                      ? "bg-[#f0b429] text-[#1a3a1a]"
                      : "bg-white/10 text-white/60 hover:bg-white/15 hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Stats banner */}
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-[#f0b429]/20 bg-[#f0b429]/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-[#f0b429]" />
                <span className="text-xs font-semibold text-[#f0b429]">
                  {filteredSessions.length} session{filteredSessions.length !== 1 ? "s" : ""} for junior players
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-white/30" />
                <span className="text-[10px] text-white/30">FIFA · FCRF · FA</span>
              </div>
            </div>

            {/* Concussion safety banner */}
            {(activeCategory === "all" || activeCategory === "safety") && (
              <button
                onClick={() => {
                  const s = JUNIOR_SESSIONS.find((s) => s.category === "safety");
                  if (s) setSelectedSession(s);
                }}
                className="mb-3 w-full rounded-2xl border border-red-500/30 bg-red-950/30 p-4 text-left hover:border-red-500/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-300">Concussion Guidelines — Required Reading</p>
                    <p className="mt-0.5 text-xs text-red-400/70">FA safety protocol · All junior coaches must know these signs and steps</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-red-400/40 mt-0.5 shrink-0" />
                </div>
              </button>
            )}

            {/* Session list */}
            <div className="space-y-3">
              {filteredSessions
                .filter((s) => s.category !== "safety") // safety shown above
                .map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onClick={() => setSelectedSession(session)}
                  />
                ))}

              {filteredSessions.filter((s) => s.category !== "safety").length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-12 text-center">
                  <Search className="h-8 w-8 text-white/20 mb-3" />
                  <p className="text-sm font-semibold text-white/60">No sessions found</p>
                  <p className="mt-1 text-xs text-white/30">Try a different search or ask THUTO</p>
                  <button
                    onClick={() => { setQuery(""); setActiveCategory("all"); }}
                    className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-xs text-white/60 hover:bg-white/15 transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            {/* THUTO prompt at bottom */}
            <button
              onClick={() => setShowChat(true)}
              className="mt-6 w-full rounded-2xl border border-[#f0b429]/20 bg-gradient-to-br from-[#f0b429]/10 to-[#f0b429]/5 p-4 text-center hover:border-[#f0b429]/40 transition-colors"
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-[#f0b429]" />
                <span className="text-sm font-semibold text-[#f0b429]">Ask THUTO anything about junior coaching</span>
              </div>
              <p className="mt-1 text-xs text-white/30">Searches FIFA, FCRF & FA knowledge base · Works offline</p>
            </button>
          </div>
        )}
      </main>

      {/* Session detail modal */}
      {selectedSession && (
        <SessionDetail
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}
