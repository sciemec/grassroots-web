"use client";

/**
 * ThutoChatAdmin
 *
 * THUTO AI for platform administrators — page-aware floating assistant that
 * explains what each admin tool does, surfaces live platform stats (pending
 * queues, user counts, subscriptions), and helps admins make faster decisions
 * on verifications, scout requests, coach credentials, and moderation.
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
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id:        string;
  role:      "user" | "assistant";
  content:   string;
  timestamp: number;
}

interface PlatformStats {
  total_users:            number;
  pending_verifications:  number;
  active_subscriptions:   number;
  sessions_today:         number;
  pending_scout_requests: number;
  new_users_this_week:    number;
}

const STORAGE_KEY = "thuto_admin_chat_history";
const MAX_STORED  = 10;

// ── Base system prompt ────────────────────────────────────────────────────────

const BASE_PROMPT =
  "You are THUTO — an AI platform assistant on GrassRoots Sports, Zimbabwe's AI sports platform. " +
  "You are speaking directly to the platform ADMINISTRATOR — the person with root access who manages " +
  "all users, approves verifications, monitors revenue, and keeps the platform running. " +
  "Your role is to help the admin make faster, better decisions: surface what needs attention, " +
  "explain what each tool does, guide them through approval workflows, and flag anything unusual. " +
  "You are direct, precise, and professional. The admin's time is valuable — get to the point.\n\n" +

  "== ADMIN CONSOLE — ALL SECTIONS ==\n\n" +

  "1. USER MANAGEMENT\n" +
  "Users (/admin/users): View all accounts. Filter by role (player, coach, scout, fan, analyst, admin). " +
  "Edit roles, suspend accounts, reset passwords. Use this when a user reports access problems or " +
  "when you need to promote someone to a new role.\n\n" +
  "Verifications (/admin/verifications): Identity verification queue. Players submit selfie + ID document. " +
  "Admin reviews and approves or rejects. Approved players get a verified badge on their public profile. " +
  "Pending count shown in the live context below — check this daily.\n\n" +
  "Scout Requests (/admin/scout-requests): Scouts who apply for accreditation. Review their organisation, " +
  "accreditation number, and scouting regions. Approve to give them access to player discovery and shortlisting.\n\n" +
  "Player Preview (/admin/player-preview): Preview any player profile exactly as it appears to scouts and fans. " +
  "Use this to verify profile quality before approving scout access to a player.\n\n" +
  "Coach Credentials (/admin/coach-credentials): Coaches submit CAF coaching badges and certifications. " +
  "Review and verify. Verified coaches get a credential badge on their public profile in the Coaching Marketplace.\n\n" +

  "2. REVENUE & SUBSCRIPTIONS\n" +
  "Subscriptions (/admin/subscriptions): All active and cancelled subscriptions. Shows plan, amount, " +
  "payment method (Stripe or Paynow), and renewal date. Use this for billing disputes or to manually " +
  "adjust a subscription.\n\n" +
  "Platform Stats (/admin/stats): Registration trends, verification status breakdown, subscription plans, " +
  "training sessions by day, revenue by month, and full Arena engagement analytics. " +
  "Use this for weekly reviews and investor reporting.\n\n" +
  "Engagement (/admin/engagement): Sponsor dashboard — live and 14-day KPIs. Shows sponsor reach, " +
  "impressions, and conversion metrics. Share this with sponsors for ROI reporting.\n\n" +
  "Push Notifications (/notifications): Send FCM push alerts to all users or a specific user. " +
  "Use this for platform announcements, outage notices, or feature launch alerts.\n\n" +
  "Talent Database (/admin/talent-database): Browse all registered players with profile and scout status. " +
  "Filter by province, sport, position, age group.\n\n" +

  "3. SAFEGUARDING & PARTNERS\n" +
  "Verified Partners (/admin/partners): Organisations (academies, clubs, schools) that applied to be " +
  "listed as verified partners. Review and approve. Approved partners get a partner badge and appear " +
  "in the Coaching Marketplace.\n\n" +
  "Contact Requests (/admin/contact-requests): Scouts requesting contact with minors must go through " +
  "admin moderation before the request reaches the guardian. Review and approve or reject each request. " +
  "This is a safeguarding-critical queue — review daily.\n\n" +

  "4. CONTENT & COMMUNITY\n" +
  "Announcements (/admin/announcements): Create platform-wide notices shown to all users. " +
  "Use for maintenance windows, feature launches, tournament announcements.\n\n" +
  "Fan Hub Mod (/admin/fan-hub): Review, approve, and remove videos uploaded to the Fan Hub. " +
  "Reject anything that violates community guidelines.\n\n" +
  "WhatsApp (/admin/whatsapp): WhatsApp bot configuration and message logs. Shows incoming messages, " +
  "delivery status, and bot routing decisions. Use to debug WhatsApp integration issues.\n\n" +
  "Community (/admin/community): Clubs, schools, and league oversight. Review registrations and " +
  "remove inappropriate entries.\n\n" +
  "Tournaments (/admin/tournaments/munhumutapa-2026): Munhumutapa Cup fixture management. " +
  "Add results, update brackets, manage teams.\n\n" +
  "Comment Reports (/admin/reports): Flagged comments from the Arena feed. Review and moderate — " +
  "remove, warn, or dismiss each report.\n\n" +

  "5. PLATFORM & INFRASTRUCTURE\n" +
  "System Health (/admin/health): API uptime, response times, error rates. Check this first whenever " +
  "users report the platform is slow or broken. A Render cold start (first request after 15+ minutes " +
  "of inactivity) typically takes 30–60 seconds — this is normal on the free tier.\n\n" +
  "Stream Control (/admin/stream): Live broadcast management. Start, stop, and monitor live streams.\n\n" +
  "PWA Stats (/admin/pwa): Install rates and offline usage data for the Progressive Web App.\n\n" +

  "== PLATFORM CONTEXT ==\n" +
  "Platform: GrassRoots Sports — Zimbabwe's first AI-powered grassroots sports platform.\n" +
  "Backend: bhora-ai.onrender.com (Laravel + PostgreSQL, hosted on Render free tier).\n" +
  "Frontend: grassrootssports.live (Next.js, hosted on Render).\n" +
  "WhatsApp: Meta Cloud API (NOT Twilio — migrated July 2026).\n" +
  "Payments: Stripe (international) + Paynow Zimbabwe (EcoCash, InnBucks, OneMoney).\n" +
  "AI engine: Gemini 2.0 Flash for THUTO chat; GeminiAnalysisService for video analysis.\n\n" +

  "== ADMIN DECISION PRINCIPLES ==\n" +
  "- Verification approvals: require selfie + valid ID document. Reject blurry or mismatched documents.\n" +
  "- Scout requests: require real organisation name. Reject obvious spam or anonymous requests.\n" +
  "- Contact requests for minors: default to REJECT if any doubt. Safeguarding > convenience.\n" +
  "- Coach credentials: check the CAF badge number format and expiry date.\n" +
  "- Subscription disputes: always check Stripe/Paynow logs before issuing a refund.\n\n" +

  "Keep answers short and actionable. When the admin asks what to do next, " +
  "look at the pending queue counts in the context and point them to the highest-priority item.";

// ── Page context map ──────────────────────────────────────────────────────────

interface PageCtx {
  description: string;
  suggested:   string[];
}

const PAGE_CONTEXT: Record<string, PageCtx> = {
  "/admin": {
    description: "Admin Console Home — overview of all platform management tools",
    suggested: [
      "What needs my attention right now?",
      "How many verifications are pending?",
      "What does each section in the admin console do?",
      "How do I approve a scout?",
    ],
  },
  "/admin/users": {
    description: "Users — all accounts, roles, and access management",
    suggested: [
      "How do I change a user's role?",
      "How do I suspend an account?",
      "How do I create an analyst account?",
      "A user says they can't log in — what should I check?",
    ],
  },
  "/admin/verifications": {
    description: "Verifications — identity verification queue (selfie + ID review)",
    suggested: [
      "What documents should I accept for verification?",
      "When should I reject a verification?",
      "What happens after I approve a verification?",
      "How long should a verification take to review?",
    ],
  },
  "/admin/scout-requests": {
    description: "Scout Requests — accreditation and contact approvals",
    suggested: [
      "What information does a scout need to provide?",
      "When should I reject a scout request?",
      "What access does an approved scout get?",
      "How do I contact a scout before approving?",
    ],
  },
  "/admin/coach-credentials": {
    description: "Coach Credentials — review and verify coaching badges and certifications",
    suggested: [
      "What CAF badge levels are valid?",
      "How do I verify a coaching badge is real?",
      "What does a verified coach badge show on their profile?",
      "A coach submitted an expired badge — what should I do?",
    ],
  },
  "/admin/subscriptions": {
    description: "Subscriptions — billing, plans, and Stripe/Paynow dashboard",
    suggested: [
      "How do I check if a payment went through?",
      "A user paid but their subscription isn't active — what do I do?",
      "How do I process a refund?",
      "What subscription plans are available?",
    ],
  },
  "/admin/stats": {
    description: "Platform Stats — registrations, sessions, revenue, and Arena analytics",
    suggested: [
      "What are our registration numbers this week?",
      "Which province has the most active users?",
      "How much revenue did we make this month?",
      "What sport is most popular on the platform?",
    ],
  },
  "/admin/partners": {
    description: "Verified Partners — review and approve partner applications",
    suggested: [
      "What qualifies an organisation to be a verified partner?",
      "What does a partner badge look like on the platform?",
      "How do I reject a partner application?",
      "Can a school be a verified partner?",
    ],
  },
  "/admin/contact-requests": {
    description: "Contact Requests — moderate scout contact requests for minor players",
    suggested: [
      "What is the process for approving a contact request?",
      "When should I automatically reject a contact request?",
      "Does the guardian see rejected requests?",
      "How is a guardian notified when a request is approved?",
    ],
  },
  "/admin/announcements": {
    description: "Announcements — platform-wide notices and broadcasts",
    suggested: [
      "How do I send an announcement to all users?",
      "Can I target announcements to a specific role?",
      "What is a good format for a maintenance notice?",
      "How long do announcements stay visible?",
    ],
  },
  "/admin/whatsapp": {
    description: "WhatsApp — bot configuration and message logs",
    suggested: [
      "Why is the WhatsApp bot not responding?",
      "How do I check if a message was delivered?",
      "What commands does the WhatsApp bot support?",
      "How do I debug a failed WhatsApp notification?",
    ],
  },
  "/admin/health": {
    description: "System Health — API uptime, response times, and error rates",
    suggested: [
      "The API is slow — what should I check first?",
      "What is a Render cold start and is it normal?",
      "How do I check if the database is responding?",
      "Where do I find the error logs?",
    ],
  },
  "/admin/engagement": {
    description: "Engagement — sponsor dashboard with live and 14-day KPIs",
    suggested: [
      "How do I generate a sponsor report?",
      "What KPIs does the sponsor dashboard show?",
      "How do I add a new sponsor to the dashboard?",
      "A sponsor wants ROI data — what can I show them?",
    ],
  },
  "/admin/fan-hub": {
    description: "Fan Hub Mod — review, approve, and remove fan-uploaded videos",
    suggested: [
      "What are the content guidelines for Fan Hub videos?",
      "How do I remove an inappropriate video?",
      "Does the uploader get notified when a video is removed?",
      "How many videos are waiting for review?",
    ],
  },
  "/admin/reports": {
    description: "Comment Reports — review and moderate flagged Arena comments",
    suggested: [
      "What types of comments get flagged?",
      "What are my options when reviewing a flagged comment?",
      "Does the commenter get notified if their comment is removed?",
      "How do I issue a warning to a user?",
    ],
  },
  "/admin/talent-database": {
    description: "Talent Database — all registered players with profile and scout status",
    suggested: [
      "How do I find all players open for scouting?",
      "Which players have completed their talent passport?",
      "How do I export the talent database?",
      "What does 'scout visible' mean on a player profile?",
    ],
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ThutoAvatar({ size = "sm", pulse = false }: { size?: "sm" | "lg"; pulse?: boolean }) {
  const dim = size === "lg" ? "h-9 w-9 text-base" : "h-7 w-7 text-sm";
  return (
    <div className={`flex-shrink-0 flex items-center justify-center rounded-full border border-purple-400/50 bg-gradient-to-br from-purple-700 to-indigo-800 shadow-sm ${dim} ${pulse ? "animate-pulse" : ""}`}>
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
          className="inline-block h-1.5 w-1.5 rounded-full bg-purple-400"
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
          ? "rounded-br-sm bg-[#1a5c2a]/70 text-white"
          : "rounded-bl-sm bg-purple-900/50 text-white border border-purple-500/20"
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

type VoiceState = "idle" | "listening" | "unsupported" | "error";

function useVoiceInput(onTranscript: (text: string) => void) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!voiceError) return;
    const t = setTimeout(() => { setVoiceError(null); setVoiceState("idle"); }, 4000);
    return () => clearTimeout(t);
  }, [voiceError]);

  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as typeof window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition ??
      (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition })
        .webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) { setVoiceState("unsupported"); return; }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-GB";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) onTranscript(transcript);
      setVoiceState("idle");
    };

    recognition.onerror = (event: Event & { error?: string }) => {
      const err = event.error ?? "unknown";
      if (err === "not-allowed" || err === "permission-denied") {
        setVoiceError("Microphone blocked. Allow mic access in your browser settings.");
      } else if (err === "no-speech") {
        setVoiceError("No speech heard. Tap the mic and speak clearly.");
      } else {
        setVoiceError("Voice input failed. Please try again.");
      }
      setVoiceState("error");
    };

    recognition.onend = () => setVoiceState((s) => s === "listening" ? "idle" : s);
    recognitionRef.current = recognition;
  }, [onTranscript]);

  const toggleListening = () => {
    if (voiceState === "unsupported" || !recognitionRef.current) return;
    if (voiceState === "listening") {
      recognitionRef.current.stop();
      setVoiceState("idle");
    } else {
      try {
        recognitionRef.current.abort();
        recognitionRef.current.start();
        setVoiceState("listening");
        setVoiceError(null);
      } catch {
        setVoiceError("Could not start microphone. Please try again.");
        setVoiceState("error");
      }
    }
  };

  return { voiceState, toggleListening, voiceError };
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ThutoChatAdmin() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const [open,           setOpen]           = useState(false);
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [input,          setInput]          = useState("");
  const [thinking,       setThinking]       = useState(false);
  const [unread,         setUnread]         = useState(0);
  const [platformStats,  setPlatformStats]  = useState<PlatformStats | null>(null);

  const inputRef  = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleTranscript = (text: string) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
    setTimeout(() => inputRef.current?.focus(), 50);
  };
  const { voiceState, toggleListening, voiceError } = useVoiceInput(handleTranscript);

  // Resolve current page context
  const pageCtx: PageCtx =
    PAGE_CONTEXT[pathname ?? ""] ??
    Object.entries(PAGE_CONTEXT)
      .filter(([k]) => k !== "/admin" && (pathname ?? "").startsWith(k))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ??
    PAGE_CONTEXT["/admin"];

  // ── Load platform stats + chat history ────────────────────────────────────
  useEffect(() => {
    api.get("/admin/stats")
      .then((res) => {
        const d = res.data?.data ?? res.data;
        setPlatformStats(d ?? null);
      })
      .catch(() => {});

    preloadOfflineAI();

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw).slice(-MAX_STORED));
    } catch { /* ignore */ }

    const bumped = parseInt(localStorage.getItem("thuto_admin_unread") ?? "0", 10);
    if (bumped > 0) {
      setUnread((n) => n + bumped);
      localStorage.removeItem("thuto_admin_unread");
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

  // ── Build context string ──────────────────────────────────────────────────
  const buildContext = () => {
    const parts: string[] = [];

    // 0. Role clarification
    parts.push(`\nCURRENT ROLE: You are talking to the PLATFORM ADMINISTRATOR (root access). Give precise operational guidance — what to approve, what to reject, what to investigate, and in what order of priority. Do not give player development, coaching, or scouting advice.`);

    // 1. Admin identity
    const adminName = (user as { name?: string } | null)?.name ?? "Admin";
    parts.push(`\nADMIN: ${adminName}`);

    // 2. Live platform stats (pending queues — highest priority items)
    if (platformStats) {
      const urgentItems: string[] = [];
      if (platformStats.pending_verifications > 0)
        urgentItems.push(`${platformStats.pending_verifications} verification${platformStats.pending_verifications !== 1 ? "s" : ""} pending`);
      if (platformStats.pending_scout_requests > 0)
        urgentItems.push(`${platformStats.pending_scout_requests} scout request${platformStats.pending_scout_requests !== 1 ? "s" : ""} pending`);

      parts.push(
        `\nPLATFORM SNAPSHOT: ` +
        `${platformStats.total_users} total users | ` +
        `${platformStats.new_users_this_week} new this week | ` +
        `${platformStats.active_subscriptions} active subscription${platformStats.active_subscriptions !== 1 ? "s" : ""} | ` +
        `${platformStats.sessions_today} session${platformStats.sessions_today !== 1 ? "s" : ""} today`
      );

      if (urgentItems.length > 0) {
        parts.push(`\nACTION QUEUE: ${urgentItems.join("; ")} — these need attention`);
      } else {
        parts.push(`\nACTION QUEUE: No pending items — all queues clear`);
      }
    }

    // 3. Current page
    parts.push(`\n\nCURRENT PAGE: ${pageCtx.description}`);

    // 4. Page-specific data written by individual pages (optional)
    try {
      const pageData = localStorage.getItem("thuto_page_data");
      if (pageData) parts.push(`\nPAGE DATA: ${pageData}`);
    } catch { /* ignore */ }

    return parts.join("");
  };

  // ── Send message ──────────────────────────────────────────────────────────
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

      const answer: string = data?.response ?? data?.answer ?? "Let me check that — try again in a moment.";
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
          className="fixed bottom-20 right-4 z-50 flex flex-col overflow-hidden rounded-2xl border border-purple-500/20 bg-[#0f0a1e] shadow-2xl shadow-purple-900/40"
          style={{ width: "min(400px, calc(100vw - 2rem))", height: "min(500px, calc(100vh - 7rem))" }}
          role="dialog"
          aria-label="THUTO Admin Assistant"
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 flex-shrink-0 border-b border-purple-500/20 px-4 py-3">
            <ThutoAvatar size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">THUTO</p>
              <p className="text-xs text-purple-400 truncate">
                {platformStats
                  ? `${platformStats.total_users} users · ${platformStats.pending_verifications + platformStats.pending_scout_requests} pending`
                  : "Admin Assistant"}
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
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-purple-400/30 bg-purple-900/30">
                  <Sparkles className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Ask THUTO about the platform</p>
                  {platformStats && (platformStats.pending_verifications > 0 || platformStats.pending_scout_requests > 0) && (
                    <p className="mt-1 text-xs text-amber-400 font-medium">
                      {platformStats.pending_verifications + platformStats.pending_scout_requests} item{(platformStats.pending_verifications + platformStats.pending_scout_requests) !== 1 ? "s" : ""} need your attention
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-white/40">
                    {pageCtx.description.split("—")[1]?.trim() ?? "users, verifications, subscriptions, health"}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {pageCtx.suggested.map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="rounded-full border border-purple-500/30 bg-purple-900/20 px-3 py-1 text-xs text-purple-300 transition-colors hover:bg-purple-900/40 text-left"
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
                <div className="rounded-2xl rounded-bl-sm bg-purple-900/50 px-3 py-2.5 border border-purple-500/20">
                  <ThinkingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Voice error toast */}
          {voiceError && (
            <div className="flex-shrink-0 mx-3 mb-1 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-900/60 px-3 py-2 text-xs font-medium text-red-200 shadow-md">
              <MicOff className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{voiceError}</span>
            </div>
          )}

          {/* Input */}
          <div className="flex-shrink-0 border-t border-purple-500/20 px-3 py-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-purple-500/20 bg-white/5 px-3 py-2 focus-within:border-purple-500/50 transition-colors">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={voiceState === "listening" ? "Listening…" : "Ask THUTO about the platform..."}
                disabled={thinking}
                className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none disabled:opacity-50"
                maxLength={2000}
              />
              {voiceState !== "unsupported" && (
                <button
                  onClick={toggleListening}
                  disabled={thinking}
                  aria-label={voiceState === "listening" ? "Stop listening" : "Speak to THUTO"}
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    voiceState === "listening"
                      ? "bg-red-600 text-white animate-pulse hover:bg-red-500"
                      : "text-white/40 hover:bg-white/10 hover:text-purple-400"
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
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white transition-colors hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed"
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
        aria-label={open ? "Close THUTO admin assistant" : "Open THUTO admin assistant"}
        className={`fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-xl transition-all duration-200 ${
          open
            ? "border-purple-400/60 bg-gradient-to-br from-purple-700 to-indigo-800 shadow-purple-500/30 scale-95"
            : unread > 0
            ? "border-red-400/70 bg-gradient-to-br from-red-600 to-red-700 shadow-red-500/40 hover:scale-105 animate-pulse"
            : "border-purple-400/50 bg-gradient-to-br from-purple-700 to-indigo-800 shadow-purple-500/20 hover:scale-105"
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
