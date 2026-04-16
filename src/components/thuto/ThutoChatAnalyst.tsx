"use client";

/**
 * ThutoChatAnalyst
 *
 * THUTO AI for analysts — page-aware floating assistant that explains
 * what each analyst tool does, how to read the results, and what
 * actions to take based on the data.
 *
 * Covers: Live Match Collector, xG Analysis, Pass Map, Heatmaps,
 *         Tactical Report, Season Intelligence, Touch Tracker.
 *
 * THUTO UI RULE (permanent):
 * - Default state = small circle. Always.
 * - Full panel = only after the user clicks the circle.
 * - Circle turns red when there are unread messages.
 */

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X, Send, Sparkles, ChevronDown, Mic, MicOff } from "lucide-react";
import { searchOffline, preloadOfflineAI } from "@/lib/offline-ai";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id:        string;
  role:      "user" | "assistant";
  content:   string;
  timestamp: number;
}

const STORAGE_KEY = "thuto_analyst_chat_history";
const MAX_STORED  = 10;

// ── Base system prompt ────────────────────────────────────────────────────────

const BASE_PROMPT =
  "You are THUTO — an AI data analyst assistant on GrassRoots Sports, Zimbabwe's AI sports platform. " +
  "You speak directly to the match analyst. You are precise, data-literate, and clear. " +
  "You explain complex sports analytics in simple terms that grassroots coaches and analysts " +
  "can immediately understand and act on. You know the realities of data collection at grassroots " +
  "level in Zimbabwe: no Opta feed, no tracking cameras — just an analyst with a tablet at the " +
  "touchline logging events by hand. Your job is to help them collect clean data, interpret it " +
  "correctly, and turn numbers into decisions the coach can use. " +
  "When an analyst is stuck, overwhelmed, or unsure how to present data — be their confidence. " +
  "Remind them that a single clear insight delivered well is worth more than 20 stats that confuse the coach.\n\n" +

  "== ANALYST HUB TOOLS — HOW THEY WORK ==\n\n" +

  "LIVE MATCH COLLECTOR (/analyst/live-match)\n" +
  "What it does: The analyst taps pitch zones during a live match to log every shot attempt. " +
  "Each zone has a pre-set xG (expected goals) value based on location — e.g. six-yard box = 0.76, " +
  "penalty spot = 0.45, long range = 0.04. The tool auto-calculates cumulative xG for home and away teams.\n" +
  "Key metric: xG = the probability that a shot from that location results in a goal, based on historical data.\n" +
  "How to use: Before kick-off enter team names and sport. During the match, tap the pitch zone " +
  "where each shot is taken. Mark 'Goal?' if it goes in. At full time, the xG vs actual goals " +
  "comparison shows who over- or under-performed.\n" +
  "Data storage: Client-side only during the session. Not saved to the backend yet.\n\n" +

  "xG & SHOT ANALYSIS (/analyst/xg-analysis)\n" +
  "What it does: Reviews all shots logged in previous sessions (stored in browser). " +
  "Compares cumulative xG to actual goals scored for each team across multiple matches.\n" +
  "How to read the results:\n" +
  "- xG > actual goals = team is underperforming their chances (finishing problem or bad luck)\n" +
  "- xG < actual goals = team is overperforming (good finishing or easy xG from set pieces)\n" +
  "- Large difference consistently = a real pattern worth addressing in training\n" +
  "Shot quality insight: If most shots are from low-xG zones (edge of box, long range), " +
  "the team needs to work on getting into better positions before shooting.\n\n" +

  "PASS MAP (/analyst/pass-map)\n" +
  "What it does: The analyst places player dots on a virtual pitch and draws pass connections " +
  "between them by tapping two players. Each connection counts how many passes were made between " +
  "that pair. Thicker lines = more passes between those players.\n" +
  "How to read it:\n" +
  "- Dominant connections show who the team plays through (key playmaker)\n" +
  "- Isolated players (few connections) may be poorly positioned or underused\n" +
  "- One-sided network = team plays down one flank — vulnerable to overloads on the other side\n" +
  "- Ranked connections table shows the top passing partnerships\n" +
  "Data storage: Saved in browser localStorage. PDF export available.\n\n" +

  "PLAYER HEATMAPS (/analyst/heatmaps)\n" +
  "What it does: The analyst enters a squad list and manually records zone touches for each player " +
  "during or after a match. The pitch is divided into zones (3 columns x 10 rows). " +
  "Colour intensity shows where each player was most active: green (low) → red (high).\n" +
  "How to read it:\n" +
  "- Red/orange zones = where the player spent most time and touched the ball most\n" +
  "- Large red area in the wrong zone = player out of position\n" +
  "- Striker with most touches in own half = not making forward runs\n" +
  "- Two players with identical heatmaps = positional overlap, tactical adjustment needed\n" +
  "Data storage: Saved in browser localStorage. PDF export with coloured zone grid available.\n\n" +

  "TACTICAL REPORT (/analyst/tactical-report)\n" +
  "What it does: The analyst fills in match context (formation, possession %, shots, etc.) " +
  "and optionally adds coach observations. THUTO generates a full written tactical analysis " +
  "using AI. The report can be copied or downloaded as a PDF.\n" +
  "What the AI analyses:\n" +
  "- Formation effectiveness given the stats\n" +
  "- Possession vs shots ratio (efficiency)\n" +
  "- Patterns and tactical concerns\n" +
  "- Specific recommendations for the next match\n" +
  "Data storage: Form and generated report saved in browser localStorage.\n\n" +

  "SEASON INTELLIGENCE (/analyst/season)\n" +
  "What it does: Reads match history from the Touch Tracker (localStorage key: gs_touch_tracker_history) " +
  "and real match results from the backend API (/matches). Displays:\n" +
  "- xG per match bar chart (home xG vs away xG vs actual goals)\n" +
  "- Over/under performance table: positive = overperformed vs xG, negative = underperformed\n" +
  "- AI season summary generated on demand\n" +
  "How to read it: Track whether xG over/under performance is consistent — consistent " +
  "underperformance is a finishing problem; consistent overperformance may be unsustainable.\n\n" +

  "TOUCH TRACKER (/analyst/touch-tracker)\n" +
  "What it does: A real-time match event logger — the analyst taps events as they happen " +
  "(possession, duels, passes, shots). Builds a match event timeline. History saved to " +
  "localStorage and used by Season Intelligence for trend analysis.\n\n" +

  "== WHO CAN ACCESS THE ANALYST HUB ==\n" +
  "Only users with the 'analyst' or 'admin' role. The analyst role must be assigned by an admin " +
  "in /admin/users. There is no self-registration for analyst accounts — it is a professional role " +
  "assigned to designated match analysts at a club or school.\n\n" +

  "== DATA STORAGE NOTE ==\n" +
  "All analyst tools currently save data to the browser (localStorage). This means:\n" +
  "- Data survives page refresh ✅\n" +
  "- Data is lost if browser cache is cleared ⚠️\n" +
  "- Data cannot be shared between devices ⚠️\n" +
  "- Backend persistence is planned for a future Pro tier feature\n\n" +

  "Keep answers focused and practical. Use clear plain English — the analyst may be sharing " +
  "insights with a coach who has no data background. Always end with a concrete next step.";

// ── Page context map ──────────────────────────────────────────────────────────

interface PageCtx {
  description: string;
  suggested:   string[];
}

const PAGE_CONTEXT: Record<string, PageCtx> = {
  "/analyst": {
    description: "Analyst Hub Home — overview of all 6 data tools available",
    suggested: [
      "What does each analyst tool do?",
      "Where do I start as a new analyst?",
      "Who can access the analyst hub?",
      "How do I get the analyst role?",
    ],
  },
  "/analyst/live-match": {
    description: "Live Match Collector — tap pitch zones to log shots and calculate xG in real time",
    suggested: [
      "What is xG and how is it calculated?",
      "How do I log a shot correctly?",
      "What do I do if the app freezes mid-match?",
      "We have 2.1 xG but only scored 1 goal — what does that mean?",
    ],
  },
  "/analyst/xg-analysis": {
    description: "xG & Shot Analysis — compare expected goals to actual goals across sessions",
    suggested: [
      "Our xG is always higher than our goals — what is wrong?",
      "What is a good xG per match for a grassroots team?",
      "How do I improve shot quality to create higher-xG chances?",
      "Explain the difference between xG and goals to my coach",
    ],
  },
  "/analyst/pass-map": {
    description: "Pass Map — visualise passing networks and identify key partnerships",
    suggested: [
      "How do I read a pass map?",
      "One player has very few connections — what does that tell me?",
      "All our passing is on the right side — what is the risk?",
      "How do I use a pass map to find our best playmaker?",
    ],
  },
  "/analyst/heatmaps": {
    description: "Player Heatmaps — zone-based position and touch coverage per player",
    suggested: [
      "How do I read a player heatmap?",
      "My striker's heatmap is mostly in our own half — what does that mean?",
      "Two players have almost identical heatmaps — is that a problem?",
      "How do I use heatmaps to fix defensive positioning?",
    ],
  },
  "/analyst/tactical-report": {
    description: "Tactical Report — fill in match stats and get an AI-written analysis with PDF export",
    suggested: [
      "What information do I need before generating a report?",
      "How do I explain this report to the coach in 2 minutes?",
      "We had 65% possession but lost — what should the report highlight?",
      "How do I share this report with the team?",
    ],
  },
  "/analyst/season": {
    description: "Season Intelligence — season-long xG trends, match history, and AI summary",
    suggested: [
      "We consistently underperform our xG — is this a pattern or bad luck?",
      "How many matches do I need before the data is meaningful?",
      "Our xG is improving but results aren't — why?",
      "Generate a season summary I can present to the club committee",
    ],
  },
  "/analyst/touch-tracker": {
    description: "Touch Tracker — real-time match event logger feeding Season Intelligence",
    suggested: [
      "What events should I log in the Touch Tracker?",
      "How does Touch Tracker data feed into Season Intelligence?",
      "What is the most important event to log during a match?",
      "How do I set up the Touch Tracker before kick-off?",
    ],
  },
  "/analyst/match-map": {
    description: "Match Map — spatial match event mapping on a pitch grid",
    suggested: [
      "How do I use the match map?",
      "What events should I mark on the pitch?",
      "How does the match map help with post-match analysis?",
      "Can I export the match map as a report?",
    ],
  },
};

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

// ── Voice Input Hook ──────────────────────────────────────────────────────────

type VoiceState = "idle" | "listening" | "unsupported";

function useVoiceInput(onTranscript: (text: string) => void) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as typeof window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition ??
      (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition })
        .webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) { setVoiceState("unsupported"); return; }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-ZW";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      onTranscript(event.results[0][0].transcript);
      setVoiceState("idle");
    };
    recognition.onerror = () => setVoiceState("idle");
    recognition.onend   = () => setVoiceState((s) => s === "listening" ? "idle" : s);

    recognitionRef.current = recognition;
  }, [onTranscript]);

  const toggleListening = () => {
    if (voiceState === "unsupported" || !recognitionRef.current) return;
    if (voiceState === "listening") {
      recognitionRef.current.stop();
      setVoiceState("idle");
    } else {
      try { recognitionRef.current.start(); setVoiceState("listening"); }
      catch { setVoiceState("idle"); }
    }
  };

  return { voiceState, toggleListening };
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ThutoChatAnalyst() {
  const pathname = usePathname();

  // Resolve current page context — exact match, then prefix match, then fallback
  const pageCtx: PageCtx =
    PAGE_CONTEXT[pathname] ??
    Object.entries(PAGE_CONTEXT)
      .filter(([k]) => k !== "/analyst" && pathname.startsWith(k))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ??
    PAGE_CONTEXT["/analyst"];

  const buildContext = () => {
    const parts: string[] = [`\n\nCURRENT PAGE: ${pageCtx.description}`];
    try {
      const pageData = localStorage.getItem("thuto_page_data");
      if (pageData) parts.push(`\nPAGE DATA: ${pageData}`);
    } catch { /* ignore */ }
    return parts.join("");
  };

  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [thinking, setThinking] = useState(false);
  const [unread,   setUnread]   = useState(0);

  const inputRef  = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Voice input ───────────────────────────────────────────────────────────
  const handleTranscript = (text: string) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
    setTimeout(() => inputRef.current?.focus(), 50);
  };
  const { voiceState, toggleListening } = useVoiceInput(handleTranscript);

  useEffect(() => {
    preloadOfflineAI();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw).slice(-MAX_STORED));
    } catch { /* ignore */ }

    const bumped = parseInt(localStorage.getItem("thuto_analyst_unread") ?? "0", 10);
    if (bumped > 0) {
      setUnread((n) => n + bumped);
      localStorage.removeItem("thuto_analyst_unread");
    }
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED)));
    } catch { /* storage full */ }
  }, [messages]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking, open]);

  useEffect(() => {
    if (!open) return;
    setUnread(0);
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

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
          system_prompt: BASE_PROMPT + buildContext(),
          history:       messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`);

      const answer: string = data?.response ?? data?.answer ?? "Let me think on that — try again in a moment.";
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: answer, timestamp: Date.now() }]);
      if (!open) setUnread((n) => n + 1);

    } catch {
      const offline = await searchOffline(text);
      const content = offline
        ? `${offline.text}\n\n📚 _Offline mode — from ${offline.source}_`
        : "⚠️ Connection issue — please check your network and try again.";
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content, timestamp: Date.now() }]);
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
          aria-label="THUTO Analyst Assistant"
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 flex-shrink-0 border-b border-white/10 px-4 py-3">
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

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && !thinking && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-teal-400/30 bg-teal-900/30">
                  <Sparkles className="h-6 w-6 text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Ask THUTO to explain the data</p>
                  <p className="mt-0.5 text-xs text-white/40">
                    {pageCtx.description.split("—")[1]?.trim() ?? "xG, pass maps, heatmaps, tactical reports"}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {pageCtx.suggested.map((s) => (
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
                placeholder={voiceState === "listening" ? "Listening…" : "Ask THUTO about the data..."}
                disabled={thinking}
                className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none disabled:opacity-50"
                maxLength={2000}
              />
              {voiceState !== "unsupported" && (
                <button
                  onClick={toggleListening}
                  disabled={thinking}
                  aria-label={voiceState === "listening" ? "Stop listening" : "Speak to THUTO"}
                  title={voiceState === "listening" ? "Tap to stop" : "Speak your question"}
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    voiceState === "listening"
                      ? "bg-red-600 text-white animate-pulse hover:bg-red-500"
                      : "text-white/40 hover:bg-white/10 hover:text-teal-400"
                  }`}
                >
                  {voiceState === "listening"
                    ? <MicOff className="h-3.5 w-3.5" />
                    : <Mic     className="h-3.5 w-3.5" />}
                </button>
              )}
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
        aria-label={open ? "Close THUTO analyst assistant" : "Open THUTO analyst assistant"}
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
