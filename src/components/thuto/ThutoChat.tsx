"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, Sparkles, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import api from "@/lib/api";
import { searchOffline, preloadOfflineAI } from "@/lib/offline-ai";

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

// ── Base system prompt ────────────────────────────────────────────────────────

const BASE_PROMPT =
  "You are THUTO, a personal AI player agent on GrassRoots Sports — Zimbabwe's AI sports platform. " +
  "You are warm, encouraging, and knowledgeable about grassroots sport in Zimbabwe. " +
  "Speak to the player like a trusted mentor on the pitch. Help with training, nutrition, " +
  "mindset, tactics, and player development. Keep answers concise and practical. " +
  "Use occasional Shona phrases naturally. End with encouragement.\n\n" +
  "== PLATFORM OVERVIEW ==\n" +
  "GrassRoots Sports is Zimbabwe's first AI-powered sports platform covering Football, Rugby, " +
  "Athletics, Netball, Basketball, Cricket, Swimming, Tennis, Volleyball, and Hockey. " +
  "It helps players get discovered, coaches manage squads, and scouts find talent.\n\n" +
  "== ALL PLAYER HUB FEATURES ==\n" +
  "• Hub Home (/player) — overview dashboard: stats, quick links to all tools, THUTO chat\n" +
  "• AI Coach (/player/ai-coach) — dedicated full-screen chat with THUTO for deep coaching sessions\n" +
  "• Pitch Mode (/player/pitch-mode) — solo training session: pick focus area, use camera for form feedback\n" +
  "• Ubuntu Training (/player/ubuntu) — group training with community; AI suggests drills for the whole group\n" +
  "• Training Formats (/player/training-formats) — Rondo, Small-Sided Games, Shooting drills, full drill library\n" +
  "• Drills (/player/drills) — searchable library of training drills by skill level and sport\n" +
  "• My Sessions (/player/sessions) — log and review training sessions; track frequency and load\n" +
  "• My Profile (/player/profile) — update personal info, position, club, height, weight; upload photo\n" +
  "• My Stats (/player/stats) — view full match stats history across all sports\n" +
  "• Log Match Stats (/player/stats/new) — record stats from a match or training (goals, assists, etc.)\n" +
  "• Milestones (/player/milestones) — celebrate and track personal achievements\n" +
  "• Assessment (/player/assessment) — skill ratings by position with radar chart; position-specific scoring\n" +
  "• Progress Tracker (/player/progress) — track improvement over time with charts\n" +
  "• Development (/player/development) — structured long-term development plan\n" +
  "• My Journey / DNA (/player/ai-coach) — THUTO builds a full player DNA profile over 5 sessions (sleep, mindset, goals, nutrition, inspiration)\n" +
  "• Nutrition (/player/nutrition) — personalised meal plans and food logging for athlete performance\n" +
  "• Sports (/player/sports) — switch between sports; view sport-specific resources\n" +
  "• Showcase (/player/showcase) — upload 60-second skill clips; AI rates the clip and makes it discoverable by scouts\n" +
  "• Vault (/player/vault) — personal highlight video library; create shareable reels for scouts\n" +
  "• Player Valuation (/player/valuation) — AI estimates market value in USD; first of its kind in Zimbabwe\n" +
  "• Potential Score (/player/potential) — AI projects peak rating and development trajectory\n" +
  "• Talent ID (/player/talent-id) — talent identification tools to understand natural strengths\n" +
  "• Verification (/player/verification) — selfie + ID upload; unlocks scannable QR scouting profile\n" +
  "• Subscription (/player/subscription) — manage plan (Free / Pro); pay via EcoCash, InnBucks, or card";

// ── Page context map ──────────────────────────────────────────────────────────

interface PageCtx { description: string; suggested: string[] }

const PAGE_CONTEXT: Record<string, PageCtx> = {
  "/player": {
    description: "Player Hub Home — your central dashboard for all training tools",
    suggested: ["What can I do here?", "Help me build a training plan", "How do I get scouted?"],
  },
  "/player/ai-coach": {
    description: "AI Coach & Player DNA — deep coaching sessions with THUTO",
    suggested: ["Build my player DNA", "Give me a personalised training plan", "How do I improve my weaknesses?"],
  },
  "/player/pitch-mode": {
    description: "Pitch Mode — solo training with camera form feedback",
    suggested: ["What should I focus on today?", "How do I use the camera for form check?", "Best drills for solo training"],
  },
  "/player/ubuntu": {
    description: "Ubuntu Training — group sessions with AI drill suggestions",
    suggested: ["What drills work best for a group?", "How does Ubuntu training help me?", "Suggest a warm-up for my group"],
  },
  "/player/training-formats": {
    description: "Training Formats — Rondo, SSGs, Shooting, Drills library",
    suggested: ["What is a rondo drill?", "Best small-sided games for forwards", "Recommend a shooting session"],
  },
  "/player/drills": {
    description: "Drills Library — searchable drills by skill and sport",
    suggested: ["Find drills for my position", "Best fitness drills for pre-season", "Drills to improve my first touch"],
  },
  "/player/sessions": {
    description: "My Sessions — log and track your training frequency and load",
    suggested: ["How often should I train?", "What should I log after a session?", "Am I overtraining?"],
  },
  "/player/sessions/new": {
    description: "Log New Session — record today's training",
    suggested: ["What details should I include?", "How do I rate session intensity?", "What counts as a session?"],
  },
  "/player/profile": {
    description: "My Profile — personal info, position, club, photo",
    suggested: ["Why is my profile important for scouts?", "What should I fill in first?", "How do scouts find me?"],
  },
  "/player/stats": {
    description: "My Stats History — all your match and training stats",
    suggested: ["How do I read my stats?", "What stats matter most to scouts?", "How do I improve my pass accuracy?"],
  },
  "/player/stats/new": {
    description: "Log Match Stats — record goals, assists and performance data",
    suggested: ["What stats should I track?", "How do I log a match?", "Does this help with scouting?"],
  },
  "/player/milestones": {
    description: "Milestones — celebrate personal achievements and goals",
    suggested: ["What milestones should I set?", "How do I stay motivated?", "Suggest a 3-month goal for me"],
  },
  "/player/assessment": {
    description: "Skill Assessment — position-specific ratings and radar chart",
    suggested: ["What does my radar chart mean?", "Which skills should I work on most?", "How is my score calculated?"],
  },
  "/player/progress": {
    description: "Progress Tracker — charts showing improvement over time",
    suggested: ["Am I improving?", "How long to see real progress?", "What should I measure every month?"],
  },
  "/player/development": {
    description: "Development Plan — structured long-term player development",
    suggested: ["Build me a development plan", "What should a 16-year-old focus on?", "How do I develop into a pro?"],
  },
  "/player/nutrition": {
    description: "Nutrition Hub — personalised meal plans for athletes",
    suggested: ["What should I eat before training?", "Cheap high-protein meals in Zimbabwe", "Help me log my meals"],
  },
  "/player/showcase": {
    description: "Showcase — upload skill clips for scouts to discover you",
    suggested: ["What makes a good showcase clip?", "How do scouts find my videos?", "What skill should I film?"],
  },
  "/player/vault": {
    description: "Highlight Vault — personal video library and shareable reels",
    suggested: ["How do I create a reel?", "Can scouts see my vault?", "What highlights should I keep?"],
  },
  "/player/valuation": {
    description: "Player Valuation — AI estimates your market value in USD",
    suggested: ["How is my value calculated?", "How do I increase my value?", "What do scouts look for?"],
  },
  "/player/potential": {
    description: "Potential Score — AI projects your peak rating and trajectory",
    suggested: ["What is my potential score?", "How do I reach my projected peak?", "Am I developing fast enough?"],
  },
  "/player/verification": {
    description: "Verification — upload selfie and ID to unlock your QR scouting profile",
    suggested: ["Why should I verify?", "What is a QR scouting profile?", "How do scouts use my QR code?"],
  },
  "/player/subscription": {
    description: "Subscription — manage your plan and payment",
    suggested: ["What does Pro include?", "How do I pay with EcoCash?", "Is the free plan enough to get scouted?"],
  },
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
  const pathname = usePathname();

  // Resolve page context — exact match first, then prefix match, then fallback
  const pageCtx: PageCtx =
    PAGE_CONTEXT[pathname] ??
    Object.entries(PAGE_CONTEXT)
      .filter(([k]) => k !== "/player" && pathname.startsWith(k))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ??
    PAGE_CONTEXT["/player"];

  const buildContext = () => {
    const parts: string[] = [];
    parts.push(`\nCURRENT PAGE: ${pageCtx.description}`);
    try {
      const pageData = localStorage.getItem("thuto_page_data");
      if (pageData) parts.push(`\nPAGE DATA: ${pageData}`);
    } catch { /* ignore */ }
    return parts.join("");
  };

  const [onboarded,       setOnboarded]       = useState(false);
  const [hydrated,        setHydrated]        = useState(false);
  const [open,            setOpen]            = useState(false);
  const [messages,        setMessages]        = useState<Message[]>([]);
  const [input,           setInput]           = useState("");
  const [thinking,        setThinking]        = useState(false);
  const [unread,          setUnread]          = useState(0);
  const [dnaCompleteness, setDnaCompleteness] = useState(0);

  const inputRef  = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Check onboarding status + fetch DNA completeness on mount ────────────
  useEffect(() => {
    // Check if the player has completed THUTO onboarding
    const hasOnboarded = localStorage.getItem("thuto_onboarded") === "true";
    setOnboarded(hasOnboarded);
    setHydrated(true);

    // Preload offline knowledge base in the background so it's ready if connection drops
    preloadOfflineAI();

    // Restore cross-page unread signals (e.g. set by session logging on another page)
    const bumped = parseInt(localStorage.getItem("thuto_unread_count") ?? "0", 10);
    if (bumped > 0) {
      setUnread((n) => n + bumped);
      localStorage.removeItem("thuto_unread_count");
    }

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
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          system_prompt: BASE_PROMPT + buildContext(),
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error(`AI error ${res.status}`);
      const data = await res.json();
      const answer: string = data?.response ?? data?.answer ?? "Ndiri here — I'm here, let's talk.";

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
      // Groq failed — try offline knowledge base before showing an error
      const offline = await searchOffline(text);
      const content = offline
        ? `${offline.text}\n\n📚 _Offline mode — from ${offline.source}_`
        : "Ndine dambudziko diki — I have a small issue right now. Please try again in a moment.";

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content, timestamp: Date.now() },
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

  // ── Render ────────────────────────────────────────────────────────────────
  // THUTO UI RULE: always a small circle. NEVER auto-opens.
  // Onboarding modal only appears when the player CLICKS the circle.
  return (
    <>
      {/* ── Onboarding modal — only after hydration confirms not onboarded ── */}
      {hydrated && !onboarded && open && (
        <ThutoOnboarding onComplete={handleOnboardingComplete} />
      )}

      {/* ── Chat Panel — only after hydration confirms onboarded ─────────── */}
      {hydrated && onboarded && open && (
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
                <p className="text-xs text-teal-400 truncate" title={pageCtx.description}>
                  {pageCtx.description.split("—")[0].trim()}
                </p>
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
                    {pageCtx.description.split("—")[1]?.trim() ?? "Training, nutrition, tactics, motivation"}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {pageCtx.suggested.map((s) => (
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
      {/* THUTO UI RULE: always a small circle. Grows big only on click.    */}
      {/* When unread > 0: whole circle turns red. Normal: teal.            */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close THUTO chat" : "Open THUTO chat"}
        className={`fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-xl transition-all duration-200 ${
          open
            ? "border-teal-400/60 bg-gradient-to-br from-teal-700 to-emerald-800 shadow-teal-500/30 scale-95"
            : unread > 0
            ? "border-red-400/70 bg-gradient-to-br from-red-600 to-red-700 shadow-red-500/40 hover:scale-105 hover:shadow-red-500/60 animate-pulse"
            : "border-teal-400/50 bg-gradient-to-br from-teal-600 to-emerald-700 shadow-teal-500/20 hover:scale-105 hover:shadow-teal-500/40"
        }`}
      >
        {open ? (
          <X className="h-5 w-5 text-white" />
        ) : (
          <span className="text-xl font-bold text-white select-none">T</span>
        )}

        {/* Unread count badge — shown on top of red circle */}
        {!open && unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-red-600 shadow">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}
