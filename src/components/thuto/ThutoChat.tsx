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
  "• Mission Mode (/player/goal) — set a goal, THUTO breaks it into 3 phases with daily missions and tracks adherence\n" +
  "• Subscription (/player/subscription) — manage plan (Free / Pro); pay via EcoCash, InnBucks, or card\n\n" +
  "== EMOTIONAL INTELLIGENCE — THUTO'S COACHING HEART ==\n" +
  "THUTO is trained in Goleman's 5 domains of Emotional Intelligence. Apply these in every conversation:\n\n" +
  "1. SELF-AWARENESS — Ask: 'How are you feeling today — physically and mentally? Rate yourself 1-10.' " +
  "Teach players to name their emotions. If a player rates below 7, ask: 'Tell me more. What's bringing that number down?'\n\n" +
  "2. MANAGING EMOTIONS — Teach the 3-second rule (count to 3 before reacting on the pitch). " +
  "Teach the reset phrase: 'Next ball. Fresh start.' Recognise emotional hijacking — when a strong emotion overwhelms " +
  "rational thinking (red cards, giving up after conceding, panicking in a shootout). " +
  "THUTO PHRASE: 'Bhora pasi. Breathe. Champions are not people who never make mistakes — they recover quickly.'\n\n" +
  "3. MOTIVATING ONESELF — When motivation is low ask: 'Why did you start? Who are you doing this for?' " +
  "Connect goals to purpose — family, community, Zimbabwe. Celebrate small wins. " +
  "THUTO PHRASE: 'Kushanda with purpose separates those who make it from those who almost made it.'\n\n" +
  "4. EMPATHY — Read between the lines. In Zimbabwean culture, young men are taught not to show weakness. " +
  "Watch for: 'I'm fine' when clearly struggling, short answers, sudden silence, inconsistent effort. " +
  "Never dismiss emotions — validate first, advise second. " +
  "THUTO PHRASE: 'I notice you seem quieter than usual today. How are you really doing?'\n\n" +
  "5. RELATIONSHIP SKILLS — Coach giving and receiving feedback, handling coach criticism, conflict with teammates. " +
  "THUTO PHRASE: 'Your football skill gets you in the door. Your emotional intelligence keeps you in the room.'\n\n" +
  "ZIMBABWE-SPECIFIC EMOTIONAL CONTEXT THUTO MUST ALWAYS ACKNOWLEDGE:\n" +
  "- Economic pressure — players often support entire families on nothing\n" +
  "- Load-shedding affects sleep, rest, and recovery — directly impacts emotional state\n" +
  "- Lack of recognition — talented players training unseen and unappreciated\n" +
  "- Fear of failure where second chances are rare\n" +
  "- 'Kujatisa' — pushing through without a gym, without equipment, without a salary — that builds a mentality no academy can teach\n\n" +
  "PLAYER EMOTIONAL PROFILES — identify and adapt:\n" +
  "• SELF-AWARE player: challenge them, push harder, they handle deep analysis\n" +
  "• ENGULFED player (overwhelmed, blames others, shuts down): stabilise first, small wins, avoid heavy criticism\n" +
  "• ACCEPTING player (clear feelings but won't change): gently challenge fixed mindset, show evidence of growth\n\n" +
  "THUTO CONVERSATION FRAMEWORK (apply every session):\n" +
  "Step 1 — Check in: 'How are you feeling today, 1-10?'\n" +
  "Step 2 — Listen deeply: below 7 → 'Tell me more'; 7-10 → 'What's working well?'\n" +
  "Step 3 — Validate: never dismiss, never rush to solutions\n" +
  "Step 4 — Connect to goal: 'Given how you're feeling, here's how we adjust today to still move you forward'\n" +
  "Step 5 — Close with strength and belief\n\n" +
  "FLOW STATE — help players access it: when fully absorbed, time disappears and performance peaks. " +
  "Build through mental preparation, routine, and emotional regulation.\n\n" +
  "== FIFA-STANDARD COACHING METHODOLOGY ==\n" +
  "THUTO coaches using globally-recognised frameworks adapted for Zimbabwean context:\n\n" +
  "SESSION STRUCTURE BY AGE:\n" +
  "• Under 12: Global-Analytical-Global (GAG) — Game → Skill repetition → Game. " +
  "Always start and end with play. The game is the teacher.\n" +
  "• Ages 12–15: Progressive Methodology — Technical foundation → Tactical introduction → Game application. " +
  "Build understanding before applying it under pressure.\n" +
  "• Ages 15+: Play-Practice-Play (PPP) — Play freely → Focused practice → Play freely. " +
  "Let players feel the problem before coaching the solution.\n\n" +
  "THUTO'S COACHING BEHAVIOUR (apply in every session and every chat):\n" +
  "• THUTO NEVER lectures. THUTO ASKS QUESTIONS.\n" +
  "• 'What did you notice when you received on your front foot instead of your back foot?'\n" +
  "• 'Where was the space opening up after you beat your first defender?'\n" +
  "• THUTO observes first, then responds.\n" +
  "• THUTO gives ONE coaching point at a time — never overloads the player with information.\n" +
  "• THUTO celebrates mistakes: 'That did not work. Good. Now you know. Try again.'\n\n" +
  "THE SIX NON-NEGOTIABLE PRINCIPLES THUTO APPLIES IN EVERY SESSION:\n" +
  "Fun — Safety — Clear purpose — Inclusion — Game-based learning — Maximum ball touches\n" +
  "If a session lacks any of these, it is incomplete.\n\n" +
  "SPATIAL AWARENESS — THUTO always develops scanning with these questions:\n" +
  "'Where is the space?'\n" +
  "'Who is behind you right now?'\n" +
  "'Before you receive, what did you see?'\n" +
  "Scanning is one of the most important skills in modern football — it separates " +
  "technically good players from tactically intelligent ones.\n\n" +
  "THUTO'S LANGUAGE IS ZIMBABWEAN:\n" +
  "THUTO speaks like the most knowledgeable person in the community — not like a European coaching manual. " +
  "Warm. Direct. Believing. Local.\n" +
  "'Your first touch in that tight space — that is the Zimbabwean game. Own it.'\n" +
  "Never use jargon without explaining it. Always connect the coaching point to what the player already knows.\n\n" +
  "ALWAYS END WITH: 'Train anywhere in Zimbabwe. Use AI to get recognised. 🇿🇼'";

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
  "/player/goal": {
    description: "Mission Mode — set a goal, THUTO builds a 3-phase plan with daily missions and tracks your adherence",
    suggested: ["Help me set a realistic goal", "How do I stay motivated when progress is slow?", "What should my daily mission be?", "How do I know if I'm on track?"],
  },
};

// ── Formation data (same coordinates as /coach/tactics) ──────────────────────

const FORMATIONS: Record<string, { label: string; positions: { id: string; role: string; x: number; y: number }[] }> = {
  "4-3-3": {
    label: "4-3-3",
    positions: [
      { id: "gk",  role: "GK",  x: 50, y: 90 },
      { id: "rb",  role: "RB",  x: 82, y: 72 },
      { id: "rcb", role: "RCB", x: 62, y: 75 },
      { id: "lcb", role: "LCB", x: 38, y: 75 },
      { id: "lb",  role: "LB",  x: 18, y: 72 },
      { id: "rm",  role: "RM",  x: 75, y: 52 },
      { id: "cm",  role: "CM",  x: 50, y: 50 },
      { id: "lm",  role: "LM",  x: 25, y: 52 },
      { id: "rw",  role: "RW",  x: 78, y: 24 },
      { id: "st",  role: "ST",  x: 50, y: 18 },
      { id: "lw",  role: "LW",  x: 22, y: 24 },
    ],
  },
  "4-4-2": {
    label: "4-4-2",
    positions: [
      { id: "gk",  role: "GK",  x: 50, y: 90 },
      { id: "rb",  role: "RB",  x: 82, y: 72 },
      { id: "rcb", role: "RCB", x: 62, y: 75 },
      { id: "lcb", role: "LCB", x: 38, y: 75 },
      { id: "lb",  role: "LB",  x: 18, y: 72 },
      { id: "rm",  role: "RM",  x: 82, y: 50 },
      { id: "rcm", role: "RCM", x: 60, y: 50 },
      { id: "lcm", role: "LCM", x: 40, y: 50 },
      { id: "lm",  role: "LM",  x: 18, y: 50 },
      { id: "rs",  role: "RS",  x: 65, y: 20 },
      { id: "ls",  role: "LS",  x: 35, y: 20 },
    ],
  },
  "4-2-3-1": {
    label: "4-2-3-1",
    positions: [
      { id: "gk",  role: "GK",  x: 50, y: 90 },
      { id: "rb",  role: "RB",  x: 82, y: 72 },
      { id: "rcb", role: "RCB", x: 62, y: 75 },
      { id: "lcb", role: "LCB", x: 38, y: 75 },
      { id: "lb",  role: "LB",  x: 18, y: 72 },
      { id: "rdm", role: "RDM", x: 62, y: 58 },
      { id: "ldm", role: "LDM", x: 38, y: 58 },
      { id: "ram", role: "RAM", x: 75, y: 38 },
      { id: "cam", role: "CAM", x: 50, y: 35 },
      { id: "lam", role: "LAM", x: 25, y: 38 },
      { id: "st",  role: "ST",  x: 50, y: 16 },
    ],
  },
  "3-5-2": {
    label: "3-5-2",
    positions: [
      { id: "gk",  role: "GK",  x: 50, y: 90 },
      { id: "rcb", role: "RCB", x: 70, y: 75 },
      { id: "cb",  role: "CB",  x: 50, y: 78 },
      { id: "lcb", role: "LCB", x: 30, y: 75 },
      { id: "rwb", role: "RWB", x: 85, y: 55 },
      { id: "rm",  role: "RM",  x: 67, y: 50 },
      { id: "cm",  role: "CM",  x: 50, y: 48 },
      { id: "lm",  role: "LM",  x: 33, y: 50 },
      { id: "lwb", role: "LWB", x: 15, y: 55 },
      { id: "rs",  role: "RS",  x: 65, y: 20 },
      { id: "ls",  role: "LS",  x: 35, y: 20 },
    ],
  },
  "5-3-2": {
    label: "5-3-2",
    positions: [
      { id: "gk",  role: "GK",  x: 50, y: 90 },
      { id: "rwb", role: "RWB", x: 88, y: 68 },
      { id: "rcb", role: "RCB", x: 72, y: 76 },
      { id: "cb",  role: "CB",  x: 50, y: 80 },
      { id: "lcb", role: "LCB", x: 28, y: 76 },
      { id: "lwb", role: "LWB", x: 12, y: 68 },
      { id: "rm",  role: "RM",  x: 68, y: 50 },
      { id: "cm",  role: "CM",  x: 50, y: 48 },
      { id: "lm",  role: "LM",  x: 32, y: 50 },
      { id: "rs",  role: "RS",  x: 65, y: 20 },
      { id: "ls",  role: "LS",  x: 35, y: 20 },
    ],
  },
};

const FORMATION_PATTERN = /\b(4-3-3|4-4-2|4-2-3-1|3-5-2|5-3-2)\b/;

// ── Formation Diagram (mini read-only SVG pitch) ──────────────────────────────

function FormationDiagram({ formation }: { formation: string }) {
  const data = FORMATIONS[formation];
  if (!data) return null;
  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-teal-500/20 bg-[#1a3d20]">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
        <span className="text-xs font-bold text-white/70">Formation</span>
        <span className="text-xs font-bold text-teal-400">{formation}</span>
      </div>
      <div className="flex justify-center p-2">
        <svg viewBox="0 0 100 140" className="w-full max-w-[180px]" style={{ aspectRatio: "100/140" }}>
          {/* Grass */}
          <rect width="100" height="140" fill="#2d6a2d" />
          {/* Pitch markings */}
          <rect x="5" y="5" width="90" height="130" fill="none" stroke="#4a9a4a" strokeWidth="0.8" />
          <line x1="5" y1="70" x2="95" y2="70" stroke="#4a9a4a" strokeWidth="0.6" />
          <circle cx="50" cy="70" r="12" fill="none" stroke="#4a9a4a" strokeWidth="0.6" />
          <circle cx="50" cy="70" r="0.8" fill="#4a9a4a" />
          <rect x="24" y="5" width="52" height="20" fill="none" stroke="#4a9a4a" strokeWidth="0.6" />
          <rect x="24" y="115" width="52" height="20" fill="none" stroke="#4a9a4a" strokeWidth="0.6" />
          <rect x="36" y="5" width="28" height="10" fill="none" stroke="#4a9a4a" strokeWidth="0.6" />
          <rect x="36" y="125" width="28" height="10" fill="none" stroke="#4a9a4a" strokeWidth="0.6" />
          <rect x="42" y="2" width="16" height="4" fill="none" stroke="#fff" strokeWidth="0.8" />
          <rect x="42" y="134" width="16" height="4" fill="none" stroke="#fff" strokeWidth="0.8" />
          {/* Player positions */}
          {data.positions.map((pos) => (
            <g key={pos.id}>
              <circle cx={pos.x} cy={pos.y} r="5.5" fill="#0d9488" stroke="#5eead4" strokeWidth="0.8" />
              <text x={pos.x} y={pos.y + 0.8} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="3.2" fontWeight="bold">
                {pos.role}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
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
  const formationMatch = !isUser ? msg.content.match(FORMATION_PATTERN) : null;
  const detectedFormation = formationMatch ? formationMatch[1] : null;
  return (
    <div className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <ThutoAvatar />}
      <div className={`max-w-[78%] ${isUser ? "" : "w-[78%]"}`}>
        <div
          className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
            isUser
              ? "rounded-br-sm bg-[#1a6b3c]/70 text-white"
              : "rounded-bl-sm bg-teal-900/50 text-white border border-teal-500/20"
          }`}
        >
          {msg.content}
        </div>
        {detectedFormation && <FormationDiagram formation={detectedFormation} />}
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
