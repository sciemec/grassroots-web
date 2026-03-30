"use client";

import { useEffect, useRef, useState } from "react";
import { Brain, Send, Mic, Loader2, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { useGuestGate } from "@/components/ui/register-modal";
import { playerAiCoachPrompt, ageGroupMatchFeedbackPrompt } from "@/config/prompts";
import { SportKey } from "@/config/sports";
import api from "@/lib/api";
import { searchOffline, preloadOfflineAI } from "@/lib/offline-ai";
import { loadPlayerContext, type PlayerContext } from "@/lib/player-context";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  "Why is pressing important for my position?",
  "When should I press and when should I hold my shape?",
  "How do I use my body to win a 1v1 duel?",
  "Where should I position when my team is attacking?",
  "Why is my first touch letting me down — and how do I fix it?",
  "How do full-backs create and finish attacks?",
  "When should I shoot vs pass in the final third?",
  "How do I recover properly after an intense session?",
  "Why do I keep losing the ball under pressure?",
  "Ndisimudze sei pamutambo wefootball?",
];

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className={`h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
        isUser ? "bg-green-500 text-white" : "bg-purple-600 text-white"
      }`}>
        {isUser ? "Me" : <Brain className="h-4 w-4" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? "bg-green-600 text-white rounded-tr-sm"
          : "bg-muted text-foreground rounded-tl-sm"
      }`}>
        {msg.content.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            {i < msg.content.split("\n").length - 1 && <br />}
          </span>
        ))}
        <p className={`mt-1 text-xs opacity-60 ${isUser ? "text-right" : ""}`}>
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

export default function AICoachPage() {
  const { user } = useAuthStore();

  // Wait for Zustand persist to rehydrate from localStorage before running the
  // auth guard — same race condition fix as DashboardLayout.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  // Guest gate — allow 3 free questions before prompting registration
  const GUEST_LIMIT = 3;
  const GUEST_COUNT_KEY = "gs_guest_ai_count";
  const { requireAuth } = useGuestGate();
  const [guestCount, setGuestCount] = useState(0);

  useEffect(() => {
    if (hydrated && !user) {
      const stored = parseInt(localStorage.getItem(GUEST_COUNT_KEY) ?? "0", 10);
      setGuestCount(stored);
    }
  }, [hydrated, user]);

  const [playerCtx, setPlayerCtx] = useState<PlayerContext | null>(null);
  const [ctxLoaded, setCtxLoaded] = useState(false);

  // Load rich player context once user is ready
  useEffect(() => {
    if (!user) return;
    loadPlayerContext({
      name:      user.name,
      sport:     user.sport,
      position:  user.position,
      age_group: user.age_group,
      province:  user.province,
    }).then((ctx) => {
      setPlayerCtx(ctx);
      setCtxLoaded(true);
    }).catch(() => {
      setCtxLoaded(true); // context failed — proceed with basic info
    });
  }, [user]);

  /** Build system prompt — uses rich context when loaded, falls back to basic */
  const systemPrompt = playerAiCoachPrompt(
    playerCtx
      ? {
          sport:              (playerCtx.sport as SportKey) ?? "football",
          position:           playerCtx.position,
          ageGroup:           playerCtx.ageGroup,
          province:           playerCtx.province,
          name:               playerCtx.name,
          club:               playerCtx.club,
          heightCm:           playerCtx.heightCm,
          weightKg:           playerCtx.weightKg,
          preferredFoot:      playerCtx.preferredFoot,
          skillScore:         playerCtx.skillScore,
          skillLevel:         playerCtx.skillLevel,
          showcaseTopSkill:   playerCtx.showcaseTopSkill,
          showcaseTopRating:  playerCtx.showcaseTopRating,
          showcaseClipCount:  playerCtx.showcaseClipCount,
          statsSummary:       playerCtx.statsSummary,
          sessionsThisWeek:   playerCtx.sessionsThisWeek,
          lastSessionType:    playerCtx.lastSessionType,
          totalSessions:      playerCtx.totalSessions,
        }
      : {
          sport:    (user?.sport as SportKey) ?? "football",
          position: user?.position ?? undefined,
          ageGroup: user?.age_group ?? undefined,
          province: user?.province ?? undefined,
          name:     user?.name ?? undefined,
        }
  );

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Waita! I'm your AI Coach. Loading your profile data...",
      timestamp: new Date(),
    },
  ]);

  // Guest welcome — shown instead of the profile-loading message
  useEffect(() => {
    if (hydrated && !user) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Waita! I'm your AI Coach — Zimbabwe's first AI-powered sports coach.\n\nYou have ${GUEST_LIMIT} free questions. Ask me anything about technique, fitness, tactics, nutrition, or recovery.\n\nNdingakubatsira nerurimi rwechiShona too! 🇿🇼`,
        timestamp: new Date(),
      }]);
      setCtxLoaded(true);
    }
  }, [hydrated, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update welcome message once context is loaded
  useEffect(() => {
    if (!ctxLoaded) return;
    const ctx = playerCtx;
    let welcome = `Waita, ${ctx?.name ?? user?.name ?? ""}! I'm your AI Coach.\n\n`;

    if (ctx?.skillScore !== null && ctx?.skillScore !== undefined) {
      welcome += `I can see your skill score is ${ctx.skillScore}/100 (${ctx.skillLevel}). `;
    }
    if (ctx?.showcaseTopSkill && ctx?.showcaseTopRating) {
      welcome += `Your strongest showcase skill is ${ctx.showcaseTopSkill} at ${ctx.showcaseTopRating.toFixed(1)}/10. `;
    }
    if (ctx?.statsSummary && ctx.statsSummary !== "No match stats recorded yet.") {
      welcome += `\n\n${ctx.statsSummary}.`;
    }
    if (!ctx?.skillScore && !ctx?.recentStats?.length) {
      welcome += `I don't see any stats or sessions logged yet — once you start training and upload showcase clips, I can give you much more specific advice.`;
    }
    welcome += `\n\nAsk me anything about technique, fitness, tactics, nutrition, or recovery. Ndingakubatsira nerurimi rwechiShona too.`;

    setMessages([{ id: "welcome", role: "assistant", content: welcome, timestamp: new Date() }]);
  }, [ctxLoaded]); // eslint-disable-line react-hooks/exhaustive-deps
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Preload offline knowledge bases in the background as soon as the page mounts
  useEffect(() => { preloadOfflineAI(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * callAI — routes the request to the right AI service:
   *
   * Real users  → POST /api/v1/ask  (Laravel → DeepSeekService::answerFootballQuestion)
   *               request:  { question, role, language }
   *               response: { answer }
   *
   * Dev-bypass  → POST /api/ai-coach (Next.js server route → DeepSeek API directly)
   * or 401 fallback  request:  { message, system_prompt, history }
   *               response: { response }
   *
   * The Next.js route preserves conversation history; the Laravel /ask endpoint
   * handles each message independently (backend limitation — no history param).
   */
  const callAI = async (message: string, systemP: string, history: { role: string; content: string }[]) => {
    // Step 1 — DeepSeek via Laravel (PRIMARY — cheaper, fast)
    // Guests and dev-bypass tokens skip this (API returns 401) → fall through to Claude
    try {
      const res = await api.post("/ask", {
        question: message,
        role: user?.role ?? "player",
        language: "english",
        context: playerCtx ? {
          name:          playerCtx.name,
          sport:         playerCtx.sport,
          position:      playerCtx.position,
          age_group:     playerCtx.ageGroup,
          province:      playerCtx.province,
          club:          playerCtx.club,
          skill_score:   playerCtx.skillScore,
          skill_level:   playerCtx.skillLevel,
          top_skill:     playerCtx.showcaseTopSkill,
          top_rating:    playerCtx.showcaseTopRating,
          stats_summary: playerCtx.statsSummary,
          sessions_week: playerCtx.sessionsThisWeek,
          last_session:  playerCtx.lastSessionType,
        } : undefined,
      });
      const reply = res.data?.answer ?? res.data?.response ?? res.data?.message ?? "";
      if (reply) return reply;
    } catch {
      // 401 (guest/dev-bypass) or network error → fall through to Claude
    }

    // Step 2 — Claude Sonnet via Next.js proxy (FALLBACK — richer, handles guests + deep conversations)
    // Includes conversation history and FIFA/FA knowledge base
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, system_prompt: systemP, history }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data.response ?? data.reply ?? "";
        if (reply) return reply;
      }
    } catch {
      // Claude unavailable → fall through to offline
    }

    // Step 3 — Offline knowledge base (no internet required)
    const offline = await searchOffline(message);
    if (offline) {
      return `${offline.text}\n\n_📚 Offline response from: ${offline.source}_`;
    }

    throw new Error("I couldn't connect to any AI service. Please check your connection and try again.");
  };

  const sendWithMatchFeedback = async (matchStats: string) => {
    const ageGroup = user?.age_group ?? "senior";
    const system = ageGroupMatchFeedbackPrompt({ ageGroup, matchStats });
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: `Analyse my recent match:\n${matchStats}`, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const reply = await callAI(userMsg.content, system, []);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: reply || "Analysis complete.", timestamp: new Date() }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "I couldn't analyse the match right now. Please try again.";
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: msg, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    // Guest gate: check free question limit before sending
    if (!user) {
      if (guestCount >= GUEST_LIMIT) {
        requireAuth("use unlimited AI coaching");
        return;
      }
      const newCount = guestCount + 1;
      localStorage.setItem(GUEST_COUNT_KEY, String(newCount));
      setGuestCount(newCount);
    }

    if (content === "Analyse my last match and give me feedback") {
      sendWithMatchFeedback("No match stats provided — give general post-match feedback advice and ask the player to share their stats.");
      return;
    }
    setInput("");

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const reply = await callAI(content, systemPrompt, history);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: reply || "I couldn't process that. Please try again.", timestamp: new Date() },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sorry, I'm having trouble connecting right now.";
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: msg, timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "Chat cleared. What would you like to work on?",
      timestamp: new Date(),
    }]);
  };

  if (!hydrated) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-600">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">AI Coach</h1>
              <p className="text-xs text-muted-foreground">Powered by Claude · Knows your training history</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!user && (
              <div className={`rounded-full px-3 py-1 text-xs font-medium border ${
                guestCount >= GUEST_LIMIT
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
              }`}>
                {guestCount >= GUEST_LIMIT
                  ? "No questions left — register free"
                  : `${GUEST_LIMIT - guestCount} free question${GUEST_LIMIT - guestCount !== 1 ? "s" : ""} left`}
              </div>
            )}
            <button
              onClick={clearChat}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear chat
            </button>
          </div>
        </div>

        {/* Suggested prompts — show when only welcome message */}
        {messages.length === 1 && (
          <div className="border-b px-6 py-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="rounded-full border bg-card px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 scroll-smooth overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-600">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Thinking…</span>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t px-6 py-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask your AI Coach… (Enter to send, Shift+Enter for new line)"
                className="w-full resize-none rounded-xl border bg-card px-4 py-3 pr-12 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                style={{ maxHeight: 120, overflowY: "auto" }}
              />
            </div>
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-40 transition-colors"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
            <button
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border bg-card text-muted-foreground hover:bg-muted transition-colors"
              title="Voice input (coming soon)"
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            AI Coach supports English and Shona · Responses based on your real training data
          </p>
        </div>
      </div>
    </div>
  );
}
