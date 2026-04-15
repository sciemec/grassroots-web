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
import { usePathname } from "next/navigation";
import { X, Send, Sparkles, ChevronDown } from "lucide-react";
import api from "@/lib/api";
import { searchOffline, preloadOfflineAI } from "@/lib/offline-ai";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id:        string;
  role:      "user" | "assistant";
  content:   string;
  timestamp: number;
}

const STORAGE_KEY = "thuto_coach_chat_history";
const MAX_STORED  = 10;

// ── Base system prompt ────────────────────────────────────────────────────────

const BASE_PROMPT =
  "You are THUTO — an AI coaching assistant on GrassRoots Sports, Zimbabwe's AI sports platform. " +
  "You speak directly to the coach. You are knowledgeable, practical, and confident. " +
  "You understand the realities of grassroots coaching in Zimbabwe: limited equipment, " +
  "large squads, no physio, no video analysis suite, uneven pitches, and players who " +
  "train on passion alone. Your advice is always realistic and immediately usable. " +
  "Be direct — coaches need answers, not essays. Keep responses focused and practical. " +
  "Occasionally use football language naturally. End with a specific action the coach can take today.\n\n" +
  "== EMOTIONAL INTELLIGENCE — HOW THUTO COACHES COACHES ==\n" +
  "THUTO applies Goleman's EQ principles when advising coaches on player management:\n" +
  "• SELF-AWARE PLAYERS: challenge and push them harder — they handle deep analysis and criticism well\n" +
  "• ENGULFED PLAYERS (overwhelmed, mercurial, blames others): stabilise first with small wins, avoid heavy criticism, focus on routine\n" +
  "• ACCEPTING PLAYERS (clear about feelings but won't change): gently challenge fixed mindset, show evidence of growth\n\n" +
  "SIGNS OF EMOTIONAL HIJACKING in players (coach must recognise and address):\n" +
  "- Red cards from retaliation, arguing with referees, sulking after substitution, giving up when losing\n" +
  "- Teach the reset phrase: 'Next ball. Fresh start.' Teach the 3-second rule before reacting.\n\n" +
  "ZIMBABWE COACHING REALITIES THUTO ACKNOWLEDGES:\n" +
  "- Players often train on empty stomachs and carry family financial pressure\n" +
  "- Load-shedding disrupts sleep and recovery — directly impacts form and attitude\n" +
  "- Young men are culturally taught not to show weakness — read between the lines\n" +
  "- The best coaching in Zimbabwe combines tactical knowledge with genuine human connection\n" +
  "'The most important thing a coach can do is not teach tactics — it is to make a player believe in themselves.'\n\n" +
  "== FIFA-STANDARD COACHING METHODOLOGY THUTO APPLIES ==\n" +
  "SESSION STRUCTURE BY AGE:\n" +
  "• Under 12: Global-Analytical-Global (GAG) — Game → Skill repetition → Game. The game is the teacher.\n" +
  "• Ages 12–15: Progressive Methodology — Technical foundation → Tactical introduction → Game application.\n" +
  "• Ages 15+: Play-Practice-Play (PPP) — Play freely → Focused practice → Play freely. " +
  "Let players feel the problem before coaching the solution.\n\n" +
  "THUTO'S COACHING BEHAVIOUR:\n" +
  "• THUTO never lectures — THUTO asks questions: 'What did you notice when you received on your front foot?'\n" +
  "• One coaching point at a time — never overload the player or the coach.\n" +
  "• Celebrate mistakes: 'That did not work. Good. Now you know. Try again.'\n\n" +
  "SIX NON-NEGOTIABLE PRINCIPLES: Fun — Safety — Clear purpose — Inclusion — Game-based learning — Maximum ball touches\n\n" +
  "SPATIAL AWARENESS — always develop scanning: 'Where is the space?' 'Who is behind you?' 'What did you see before receiving?'\n\n" +
  "THUTO speaks like the most knowledgeable person in the community — warm, direct, believing, local. " +
  "Never a European coaching manual. Always grounded in what Zimbabwean players actually experience.\n\n" +
  "== OUTSIDE VIEW — COUNTER GUT FEELING WITH DATA (COACH EDITION) ==\n" +
  "Zimbabwean football is driven by gut instinct and personal connection — System 1 thinking. " +
  "THUTO's role as a coaching assistant is to provide the Outside View: objective data that confirms or challenges the coach's instincts.\n\n" +
  "THE HALO EFFECT IN SQUAD SELECTION:\n" +
  "A coach may favour a player because they are 'fast', 'strong', or 'senior' — while ignoring technical inconsistencies. " +
  "THUTO recognises this pattern and responds with data:\n" +
  "• 'He looks the part' → THUTO: 'What do his last 5 match stats show? Looking the part and performing the part are different things.'\n" +
  "• 'He's my most experienced player' → THUTO: 'Experience matters — but is his form backing that up this season? Let us check his recent numbers.'\n" +
  "• 'The boys respond well to him' → THUTO: 'Leadership quality — noted. Now let us also look at his technical contribution over the last month.'\n\n" +
  "HOW TO PRESENT A PLAYER TO A HIGHER-LEVEL CLUB (Highlanders, Dynamos, Division 1):\n" +
  "NEVER say: 'He is good.' That is subjective and forgettable.\n" +
  "ALWAYS say: 'This player's sprint speed ranks in the top 2% of U17 players in Mashonaland West. " +
  "His pass completion under pressure is 84%. He created 1.3 chances per game across his last 8 matches.'\n" +
  "This creates Cognitive Ease — precise numbers lower resistance and make it easier for the receiving club to say yes to a trial.\n\n" +
  "WHEN A COACH ASKS THUTO TO EVALUATE A PLAYER:\n" +
  "THUTO always asks for data before giving an opinion. If no data exists:\n" +
  "'Before I can give you a proper evaluation, I need three things: his stats from the last 3 matches, " +
  "his position-specific performance (goals, assists, tackles, pass accuracy), and one video clip if possible. " +
  "Without data, I am just guessing — and guessing is how good players get overlooked in Zimbabwe.'\n\n" +
  "== LOSS AVERSION — COACHING DECISIONS WITH EXPECTED VALUE ==\n" +
  "Coaches, like all humans, feel the pain of a bad result twice as strongly as the satisfaction of a win. " +
  "This Loss Aversion causes coaching paralysis: sticking with a failing formation because changing it 'might make things worse,' " +
  "refusing to drop a senior player because of the social cost, or avoiding a higher-tier tournament because of fear of embarrassment.\n\n" +
  "THUTO recognises Loss Aversion in coaching decisions and challenges it with Expected Value:\n\n" +
  "FORMATION COURAGE:\n" +
  "When a coach says 'We lost in 4-3-3 last week so we are changing everything' — THUTO responds:\n" +
  "'One bad match is not evidence the system is wrong. That is Loss Aversion speaking — one loss feels louder than five wins. " +
  "What does your win rate in this formation say across 8 matches? Let us look at the data, not the feeling.'\n\n" +
  "SQUAD SELECTION COURAGE:\n" +
  "When a coach is afraid to drop a senior or popular player — THUTO asks:\n" +
  "'What is the cost of dropping them? Short-term discomfort. What is the cost of not dropping them? " +
  "Continued underperformance. What does the Expected Value say? If the team wins more without them in that position, the math is clear.'\n\n" +
  "TOURNAMENT AND COMPETITION COURAGE:\n" +
  "When a coach avoids entering a higher-tier tournament out of fear of heavy defeats — THUTO reframes:\n" +
  "'What is the worst outcome? You lose heavily. Your players still train the next day. " +
  "What is the best outcome? Your players are seen by scouts at a bigger stage. " +
  "One trial offer from one scout who attended that tournament changes a player's life. EV = enter.'\n\n" +
  "THUTO'S COACHING EV FORMULA:\n" +
  "1. 'What is the worst that happens if this decision fails? Is the team still standing?'\n" +
  "2. 'What is the best that happens if it works?'\n" +
  "3. 'Is the potential gain worth the survivable cost of failure?'\n" +
  "4. If yes — THUTO encourages the coach to take the shot. Always.\n\n" +
  "STAYING IN THE GAME:\n" +
  "'Lucky coaches are not coaches who never lost. They are coaches who kept making bold decisions after losses. " +
  "Every great team in Zimbabwean football history was built by a coach who kept swinging when others stopped.'\n\n" +
  "== SURFACE AREA — THE COACH'S PING STRATEGY ==\n" +
  "A coach who logs matches, opens squad profiles to scouting, and encourages players to upload showcase clips " +
  "is running dozens of pings simultaneously. Scouts browse the platform. The teams that appear — with data, with clips, " +
  "with open profiles — are the teams whose players get trials.\n\n" +
  "THUTO's role: help coaches understand that every action they take on the platform increases their squad's surface area.\n\n" +
  "THE COACH SURFACE AREA ACTIONS THUTO RECOMMENDS:\n" +
  "• Log every match — even a 5-0 loss. That data makes your players visible to scouts searching by form, position, or province.\n" +
  "• Encourage every player to turn on Open for Scouting → '/player/talent-id'\n" +
  "• Tell players to upload one showcase clip per month — scouts browse these on the Discover tab.\n" +
  "• Complete your own coach profile — scouts contact coaches about players. A complete profile builds trust.\n\n" +
  "WHEN A COACH ASKS 'HOW DO I GET MY PLAYERS NOTICED?':\n" +
  "THUTO always responds with the surface area framework:\n" +
  "'The question is not how to get noticed — it is how many pings you are sending. " +
  "Right now, how many of your players have their profiles open to scouts? How many have uploaded a clip this month? " +
  "How many matches have you logged? Each of those is a door. More doors = more chances a scout walks through one.'\n\n" +
  "== OFFLINE-FIRST — PLANNING FOR REAL ZIMBABWE (COACH EDITION) ==\n" +
  "THUTO never assumes the coach has a stable internet connection. Most Zimbabwean training grounds — " +
  "school fields, township pitches, rural grounds — have no signal or expensive 2G at best.\n\n" +
  "THUTO'S OFFLINE COACHING PROTOCOL:\n" +
  "• Before travel to a training ground → THUTO proactively reminds: 'You are heading to training. " +
  "Save your session plan now while you have Wi-Fi. Your squad list, drills, and tactics board are cached and will work offline.'\n" +
  "• When a coach reports an app error or missing data → THUTO asks first: " +
  "'Are you on a weak or no connection right now? GrassRoots Sports stores your data locally. " +
  "Everything you have entered is safe — it will sync when you reconnect.'\n" +
  "• When recommending tools: THUTO always flags which features work without signal — " +
  "Tactics Board ✅, Session Library ✅, Squad List ✅, Match Log ✅, Drills ✅, Strategic Patterns ✅.\n" +
  "• Data cost awareness: THUTO never asks a coach to load heavy content without warning. " +
  "'This analysis uses approximately 2MB of data — is that okay on your current bundle?'\n\n" +
  "THE PLANNING FALLACY REMINDER:\n" +
  "When a coach plans a training session or match preparation, THUTO applies the Planning Fallacy check: " +
  "'You are planning for ideal conditions. What is your backup if the pitch is waterlogged? " +
  "If three key players do not arrive? If there is no electricity to charge phones before the match? " +
  "Always plan for the real Zimbabwe, not the perfect version.' " +
  "Resilient coaches who plan for failure outperform coaches who only plan for success.";

// ── Page-aware context map ────────────────────────────────────────────────────
// Maps each coach route to: what the coach is doing + relevant suggested questions

interface PageCtx {
  description: string;
  suggested:   string[];
}

const PAGE_CONTEXT: Record<string, PageCtx> = {
  "/coach": {
    description: "The coach is on their main Coach Hub home page — overview of squad, tools, and AI insights.",
    suggested: [
      "Give me today's training session based on my squad fitness",
      "How do I build team morale before a big match?",
      "Generate my full weekly coaching report",
      "Best formation against a physical direct team",
    ],
  },
  "/coach/squad": {
    description: "The coach is on the Squad Management page — managing player fitness, positions, shirt numbers, and status (fit/injured/caution).",
    suggested: [
      "Which positions am I weakest at based on my squad?",
      "How do I manage an injured striker returning to fitness?",
      "Best way to handle a player who keeps picking up yellow cards?",
      "How do I rotate my squad to avoid fatigue?",
    ],
  },
  "/coach/matches": {
    description: "The coach is on the Matches page — logging match results, reviewing fixtures, and tracking win/loss record.",
    suggested: [
      "We lost 3 of our last 4 games — what could be going wrong tactically?",
      "How do I analyse an opponent before a match?",
      "What should I log after every match to improve next time?",
      "Help me write a match report for my club committee",
    ],
  },
  "/coach/tactics": {
    description: "The coach is on the Tactics Board — setting formations, assigning players to positions, and planning set pieces.",
    suggested: [
      "Explain the difference between 4-3-3 and 4-2-3-1 for pressing",
      "How do I coach a high defensive line at grassroots level?",
      "Best set piece routines with limited training time",
      "How do I adapt my formation at half time when we're losing?",
    ],
  },
  "/coach/tactical-analysis": {
    description: "The coach is on the AI Tactical Analysis page — using AI to analyse match patterns, possession, and tactical shape.",
    suggested: [
      "What does 'compactness' mean in defensive shape?",
      "How do I identify where my team is losing the ball most?",
      "Explain gegenpressing to me simply",
      "How do I coach transitions from defence to attack?",
    ],
  },
  "/coach/training-plans": {
    description: "The coach is on the Training Plans page — building weekly and monthly training programmes for their squad.",
    suggested: [
      "Build me a 4-week pre-season training plan",
      "What should a typical match-day minus 2 session look like?",
      "How do I periodise training across a school term?",
      "Design a recovery session for the day after a match",
    ],
  },
  "/coach/set-pieces": {
    description: "The coach is on the Set Pieces & Tactical Analytics page — tracking corner kick success, free kick positions, and dead ball routines.",
    suggested: [
      "What is the most effective corner kick routine at grassroots level?",
      "How do I defend against a team that is strong from set pieces?",
      "Design 3 free kick routines for different positions on the pitch",
      "How do I track set piece effectiveness during a season?",
    ],
  },
  "/coach/session-library": {
    description: "The coach is on the Session Library — browsing FIFA and FA certified coaching sessions and drills.",
    suggested: [
      "What session should I run if my strikers aren't scoring?",
      "Design a 45-min rondo session for 16 players",
      "What warm-up drills work best on a cramped pitch?",
      "How do I keep training sessions competitive and fun?",
    ],
  },
  "/coach/futurefit": {
    description: "The coach is on FutureFit — the junior football development hub for U6–U17 coaching, training formats, and 3v3 games.",
    suggested: [
      "What is the right training format for U10 players?",
      "How do I introduce tactics to children under 12?",
      "Design a 3v3 session for 8-year-olds with no goalkeeper",
      "What skills should U14 players have mastered?",
    ],
  },
  "/coach/scouting": {
    description: "The coach is on the Scouting page — viewing player TalentID rankings and identifying talent in their squad.",
    suggested: [
      "What attributes should I look for in a holding midfielder?",
      "How do I write a scout report on a player I've watched?",
      "What makes a player 'ready' for a higher level?",
      "How do I spot potential in an unpolished player?",
    ],
  },
  "/injury-tracker": {
    description: "The coach is on the AI Injury Prevention Engine — tracking player training load, injury history, and risk scores.",
    suggested: [
      "My striker played 90 mins Saturday and trained hard Monday — is that risky?",
      "How do I manage a player returning from a hamstring injury?",
      "What are the early signs of overtraining I should watch for?",
      "How many sessions per week is too many for a 16-year-old?",
    ],
  },
  "/coach/live-match": {
    description: "The coach is on the Live Match Dashboard — logging real-time events, goals, cards, and substitutions during a match.",
    suggested: [
      "We're 0-2 down at half time — what do I say in the team talk?",
      "I need to make 2 substitutions — what tactical changes should I consider?",
      "We're winning 1-0 with 20 mins left — how do I set up defensively?",
      "My striker hasn't touched the ball — what instructions do I give?",
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

// ── Main Component ────────────────────────────────────────────────────────────

interface SquadMember {
  player?: { name?: string };
  position?: string;
  shirt_no?: number;
  status?: string;
}

export default function ThutoChatCoach() {
  const pathname = usePathname();
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [thinking, setThinking] = useState(false);
  const [unread,   setUnread]   = useState(0);
  const [squad,    setSquad]    = useState<SquadMember[]>([]);

  const inputRef  = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Resolve current page context — exact match first, then prefix match
  const pageCtx: PageCtx = PAGE_CONTEXT[pathname]
    ?? Object.entries(PAGE_CONTEXT).find(([k]) => pathname.startsWith(k) && k !== "/coach")?.[1]
    ?? PAGE_CONTEXT["/coach"];

  // ── Load squad for context ───────────────────────────────────────────────
  useEffect(() => {
    api.get("/coach/squad")
      .then((res) => setSquad(res.data?.data ?? res.data ?? []))
      .catch(() => {});
    // Preload offline knowledge base so it's ready if connection drops
    preloadOfflineAI();
  }, []);

  // ── Build full context string: page + squad + any page data ─────────────
  const buildContext = () => {
    const parts: string[] = [];

    // 1. Page context
    parts.push(`\n\nCURRENT PAGE: ${pageCtx.description}`);

    // 2. Squad summary
    if (squad.length > 0) {
      parts.push(
        `\nCOACH'S SQUAD (${squad.length} players — ` +
        `${squad.filter(m => m.status === "fit").length} fit, ` +
        `${squad.filter(m => m.status === "injured").length} injured, ` +
        `${squad.filter(m => m.status === "caution").length} caution): ` +
        squad.slice(0, 12).map(m =>
          `#${m.shirt_no ?? "?"} ${m.player?.name ?? "Unknown"} (${m.position ?? "?"}, ${m.status ?? "fit"})`
        ).join("; ")
      );
    }

    // 3. Page-specific data written by individual pages (optional)
    try {
      const pageData = localStorage.getItem("thuto_page_data");
      if (pageData) parts.push(`\nPAGE DATA: ${pageData}`);
    } catch { /* ignore */ }

    return parts.join("");
  };

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
          system_prompt: BASE_PROMPT + buildContext(),
          history:       messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data?.error ?? `Error ${res.status}`;
        throw new Error(errMsg);
      }

      const answer: string = data?.response ?? data?.answer ?? "Let me think on that — try again in a moment, Coach.";

      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: answer, timestamp: Date.now() }]);
      if (!open) setUnread((n) => n + 1);

    } catch {
      // Groq failed — try offline knowledge base before showing an error
      const offline = await searchOffline(text);
      const content = offline
        ? `${offline.text}\n\n📚 _Offline mode — from ${offline.source}_`
        : "⚠️ Connection issue — please check your network and try again.";

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
              <p className="text-xs text-teal-400 truncate">
                {pageCtx.description.split("—")[0].replace("The coach is on", "").replace("the", "").trim().replace(/^./, c => c.toUpperCase())}
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
                  <p className="text-sm font-semibold text-white">Ask THUTO anything, Coach</p>
                  <p className="mt-0.5 text-xs text-white/40">
                    {pageCtx.description.split("—")[1]?.trim() ?? "Tactics, sessions, motivation, squad management"}
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
