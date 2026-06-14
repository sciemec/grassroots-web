"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, CheckCircle, Trophy, Star, Users, Tv,
  Lock, Volume2, CreditCard, Smartphone, X,
} from "lucide-react";
import { normalizePhone } from "@/lib/phone-normalize";
import { useAuthStore } from "@/lib/auth-store";

// ── Types ─────────────────────────────────────────────────────────────────
type MatchStatus = "finished" | "live" | "upcoming";
type View        = "register" | "matches";
type PayTab      = "card" | "mobile";
type MobileMethod = "ecocash" | "innbucks" | "onemoney";

interface Match {
  id:             string;
  group:          string;
  home:           string;
  homeFlagEmoji:  string;
  away:           string;
  awayFlagEmoji:  string;
  date:           string;
  time:           string;
  venue:          string;
  status:         MatchStatus;
  homeScore?:     number;
  awayScore?:     number;
}

// ── Hardcoded FIFA World Cup 2026 Group Stage fixtures ────────────────────
const MATCHES: Match[] = [
  { id: "m01", group: "A", home: "Mexico",       homeFlagEmoji: "🇲🇽", away: "USA",         awayFlagEmoji: "🇺🇸", date: "Jun 12", time: "19:00", venue: "AT&T Stadium, Dallas",        status: "finished", homeScore: 0, awayScore: 2 },
  { id: "m02", group: "A", home: "Ghana",         homeFlagEmoji: "🇬🇭", away: "Panama",      awayFlagEmoji: "🇵🇦", date: "Jun 12", time: "22:00", venue: "SoFi Stadium, Los Angeles",   status: "finished", homeScore: 2, awayScore: 1 },
  { id: "m03", group: "B", home: "Brazil",        homeFlagEmoji: "🇧🇷", away: "Morocco",     awayFlagEmoji: "🇲🇦", date: "Jun 13", time: "15:00", venue: "MetLife Stadium, New Jersey",  status: "finished", homeScore: 3, awayScore: 1 },
  { id: "m04", group: "B", home: "Portugal",      homeFlagEmoji: "🇵🇹", away: "Serbia",      awayFlagEmoji: "🇷🇸", date: "Jun 13", time: "19:00", venue: "Arrowhead Stadium, KC",       status: "finished", homeScore: 2, awayScore: 2 },
  { id: "m05", group: "C", home: "Argentina",     homeFlagEmoji: "🇦🇷", away: "Nigeria",     awayFlagEmoji: "🇳🇬", date: "Jun 14", time: "15:00", venue: "Hard Rock Stadium, Miami",    status: "live",     homeScore: 1, awayScore: 0 },
  { id: "m06", group: "C", home: "France",        homeFlagEmoji: "🇫🇷", away: "Australia",   awayFlagEmoji: "🇦🇺", date: "Jun 14", time: "19:00", venue: "Lumen Field, Seattle",         status: "upcoming" },
  { id: "m07", group: "D", home: "England",       homeFlagEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", away: "Senegal",     awayFlagEmoji: "🇸🇳", date: "Jun 15", time: "15:00", venue: "Allegiant Stadium, Las Vegas", status: "upcoming" },
  { id: "m08", group: "D", home: "Germany",       homeFlagEmoji: "🇩🇪", away: "Netherlands", awayFlagEmoji: "🇳🇱", date: "Jun 15", time: "19:00", venue: "Rose Bowl, Los Angeles",       status: "upcoming" },
  { id: "m09", group: "E", home: "Spain",         homeFlagEmoji: "🇪🇸", away: "Egypt",       awayFlagEmoji: "🇪🇬", date: "Jun 16", time: "15:00", venue: "BC Place, Vancouver",          status: "upcoming" },
  { id: "m10", group: "E", home: "Japan",         homeFlagEmoji: "🇯🇵", away: "Colombia",    awayFlagEmoji: "🇨🇴", date: "Jun 16", time: "19:00", venue: "Estadio Azteca, Mexico City",  status: "upcoming" },
  { id: "m11", group: "F", home: "South Africa",  homeFlagEmoji: "🇿🇦", away: "Zimbabwe",    awayFlagEmoji: "🇿🇼", date: "Jun 17", time: "15:00", venue: "AT&T Stadium, Dallas",         status: "upcoming" },
  { id: "m12", group: "F", home: "Italy",         homeFlagEmoji: "🇮🇹", away: "Croatia",     awayFlagEmoji: "🇭🇷", date: "Jun 17", time: "19:00", venue: "MetLife Stadium, New Jersey",  status: "upcoming" },
];

const COUNTRIES = [
  "Zimbabwe","Afghanistan","Albania","Algeria","Angola","Argentina","Armenia","Australia",
  "Austria","Azerbaijan","Bahrain","Bangladesh","Belarus","Belgium","Benin","Bolivia",
  "Bosnia and Herzegovina","Botswana","Brazil","Bulgaria","Burkina Faso","Burundi",
  "Cambodia","Cameroon","Canada","Chad","Chile","China","Colombia","Congo","Costa Rica",
  "Croatia","Cuba","Czech Republic","Denmark","DR Congo","Ecuador","Egypt","El Salvador",
  "Eritrea","Estonia","Ethiopia","Finland","France","Gabon","Gambia","Georgia","Germany",
  "Ghana","Greece","Guatemala","Guinea","Haiti","Honduras","Hungary","India","Indonesia",
  "Iran","Iraq","Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan",
  "Kazakhstan","Kenya","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia",
  "Libya","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Mali","Malta",
  "Mauritania","Mauritius","Mexico","Moldova","Mongolia","Morocco","Mozambique","Myanmar",
  "Namibia","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea",
  "Norway","Oman","Pakistan","Palestine","Panama","Paraguay","Peru","Philippines","Poland",
  "Portugal","Qatar","Romania","Russia","Rwanda","Saudi Arabia","Senegal","Serbia",
  "Sierra Leone","Singapore","Slovakia","Slovenia","Somalia","South Africa","South Korea",
  "South Sudan","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Syria","Taiwan",
  "Tajikistan","Tanzania","Thailand","Togo","Tunisia","Turkey","Turkmenistan","Uganda",
  "Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan",
  "Venezuela","Vietnam","Yemen","Zambia","Other",
];

const PERKS = [
  { icon: Star,    text: "Vote Player of the Tournament" },
  { icon: Tv,      text: "Live match updates via WhatsApp" },
  { icon: Users,   text: "Follow your favourite local players" },
  { icon: Volume2, text: "Unlock audio commentary — $1 per match" },
];

const UNLOCK_KEY = "wc_unlocked_matches";
function loadUnlocked(): string[] {
  try { return JSON.parse(localStorage.getItem(UNLOCK_KEY) ?? "[]") as string[]; }
  catch { return []; }
}
function saveUnlocked(ids: string[]) {
  localStorage.setItem(UNLOCK_KEY, JSON.stringify(ids));
}

// ── Payment modal ─────────────────────────────────────────────────────────
function PaymentModal({
  match, onClose, onUnlocked, userName,
}: {
  match:      Match;
  onClose:    () => void;
  onUnlocked: (id: string) => void;
  userName:   string;
}) {
  const [tab,     setTab]     = useState<PayTab>("mobile");
  const [method,  setMethod]  = useState<MobileMethod>("ecocash");
  const [phone,   setPhone]   = useState("");
  const [paying,  setPaying]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [pollUrl, setPollUrl] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };
  useEffect(() => () => stopPoll(), []);

  useEffect(() => {
    if (!polling || !pollUrl) return;
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/payments/paynow/status?pollUrl=${encodeURIComponent(pollUrl)}`);
        const data = await res.json() as { paid?: boolean };
        if (data.paid) {
          stopPoll();
          setPolling(false);
          onUnlocked(match.id);
          onClose();
        }
      } catch { /* keep polling */ }
    }, 3000);
    return stopPoll;
  }, [polling, pollUrl, match.id, onUnlocked, onClose]);

  const payMobile = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) { setError("Enter a valid phone number."); return; }
    setPaying(true); setError(null);
    try {
      const res  = await fetch("/api/payments/match-donate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id:   match.id,
          amount:     "1",
          phone:      normalizePhone(phone),
          donor_name: userName || "Fan",
        }),
      });
      const data = await res.json() as { poll_url?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Payment failed.");
      if (data.poll_url) { setPollUrl(data.poll_url); setPolling(true); }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setPaying(false); }
  };

  const payCard = async () => {
    setPaying(true); setError(null);
    try {
      const res  = await fetch("/api/payments/match-unlock", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, matchTitle: `${match.home} vs ${match.away}` }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Could not start payment.");
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPaying(false);
    }
  };

  const phoneOk = phone.replace(/\D/g, "").length >= 9;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 relative"
        style={{ backgroundColor: "#111f14", border: "1px solid rgba(240,180,41,0.2)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors hover:bg-white/10"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#f0b429" }}>
            Unlock Audio Commentary
          </div>
          <h3 className="text-white font-black text-base leading-tight">
            {match.homeFlagEmoji} {match.home} vs {match.awayFlagEmoji} {match.away}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            {match.date} · Group {match.group}
          </p>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black mt-3"
            style={{ backgroundColor: "rgba(240,180,41,0.12)", color: "#f0b429" }}
          >
            <Volume2 size={11} /> $1.00 — one-time unlock
          </div>
        </div>

        {/* Payment method tabs */}
        <div className="flex gap-2 mb-4">
          {([
            ["mobile", <Smartphone key="s" size={12} />, "Mobile Money"],
            ["card",   <CreditCard key="c" size={12} />, "Card"],
          ] as [PayTab, React.ReactNode, string][]).map(([t, icon, label]) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all"
              style={{
                backgroundColor: tab === t ? "#f0b429" : "transparent",
                borderColor:     tab === t ? "#f0b429" : "rgba(255,255,255,0.12)",
                color:           tab === t ? "#0a1a0f" : "rgba(255,255,255,0.45)",
              }}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {error && (
          <div
            className="mb-4 p-2.5 rounded-xl text-xs"
            style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
          >
            {error}
          </div>
        )}

        {polling ? (
          <div className="text-center py-6">
            <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: "#f0b429" }} />
            <p className="text-white text-sm font-bold">Check your phone</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              Approve the $1 payment on your {method === "ecocash" ? "EcoCash" : method === "innbucks" ? "InnBucks" : "OneMoney"} app
            </p>
            <button onClick={() => { stopPoll(); setPolling(false); }} className="mt-4 text-xs hover:underline" style={{ color: "rgba(255,255,255,0.3)" }}>
              Cancel
            </button>
          </div>
        ) : tab === "mobile" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-1.5">
              {(["ecocash", "innbucks", "onemoney"] as MobileMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className="py-2 rounded-xl text-xs font-bold border transition-all"
                  style={{
                    backgroundColor: method === m ? "rgba(240,180,41,0.15)" : "transparent",
                    borderColor:     method === m ? "#f0b429" : "rgba(255,255,255,0.1)",
                    color:           method === m ? "#f0b429" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {m === "ecocash" ? "EcoCash" : m === "innbucks" ? "InnBucks" : "OneMoney"}
                </button>
              ))}
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+263 77 123 4567"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              style={{ backgroundColor: "#1a3a20", border: "1px solid rgba(255,255,255,0.08)" }}
            />
            <button
              disabled={paying || !phoneOk}
              onClick={payMobile}
              className="w-full py-3 rounded-xl text-sm font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
              style={{
                backgroundColor: !paying && phoneOk ? "#f0b429" : "rgba(255,255,255,0.06)",
                color:           !paying && phoneOk ? "#0a1a0f" : "rgba(255,255,255,0.2)",
                cursor:          !paying && phoneOk ? "pointer"  : "not-allowed",
              }}
            >
              {paying
                ? <><Loader2 size={14} className="animate-spin" /> Sending push...</>
                : <>Pay $1 via {method === "ecocash" ? "EcoCash" : method === "innbucks" ? "InnBucks" : "OneMoney"}</>
              }
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              Pay securely with Visa, Mastercard or any debit card. You will be taken to Stripe to complete the $1 payment.
            </p>
            <button
              disabled={paying}
              onClick={payCard}
              className="w-full py-3 rounded-xl text-sm font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
              style={{
                backgroundColor: !paying ? "#f0b429" : "rgba(255,255,255,0.06)",
                color:           !paying ? "#0a1a0f" : "rgba(255,255,255,0.2)",
                cursor:          !paying ? "pointer"  : "not-allowed",
              }}
            >
              {paying
                ? <><Loader2 size={14} className="animate-spin" /> Redirecting...</>
                : <><CreditCard size={14} /> Pay $1 with Card</>
              }
            </button>
            <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
              Powered by Stripe · SSL encrypted
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Match card ────────────────────────────────────────────────────────────
function MatchCard({
  match, unlocked, onUnlock,
}: {
  match:    Match;
  unlocked: boolean;
  onUnlock: (m: Match) => void;
}) {
  const STATUS_STYLE: Record<MatchStatus, { bg: string; color: string; label: string }> = {
    live:     { bg: "rgba(239,68,68,0.15)",    color: "#f87171",              label: "● LIVE" },
    finished: { bg: "rgba(255,255,255,0.05)",  color: "rgba(255,255,255,0.3)", label: "FT" },
    upcoming: { bg: "rgba(240,180,41,0.1)",    color: "#f0b429",              label: "UPCOMING" },
  };
  const s = STATUS_STYLE[match.status];

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        backgroundColor: "#111f14",
        border: `1px solid ${unlocked ? "rgba(240,180,41,0.3)" : "rgba(255,255,255,0.06)"}`,
      }}
    >
      {/* Group + status */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.25)" }}>
          Group {match.group}
        </span>
        <span
          className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{ backgroundColor: s.bg, color: s.color }}
        >
          {s.label}
        </span>
      </div>

      {/* Teams + score */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 text-center">
          <div className="text-2xl leading-none mb-1">{match.homeFlagEmoji}</div>
          <p className="text-white text-xs font-bold leading-tight">{match.home}</p>
        </div>
        <div className="text-center shrink-0 px-1">
          {match.homeScore !== undefined ? (
            <span className="text-lg font-black text-white">
              {match.homeScore} – {match.awayScore}
            </span>
          ) : (
            <span className="text-sm font-black" style={{ color: "rgba(255,255,255,0.25)" }}>vs</span>
          )}
          <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
            {match.date} · {match.time}
          </p>
        </div>
        <div className="flex-1 text-center">
          <div className="text-2xl leading-none mb-1">{match.awayFlagEmoji}</div>
          <p className="text-white text-xs font-bold leading-tight">{match.away}</p>
        </div>
      </div>

      {/* Venue */}
      <p className="text-[10px] text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
        {match.venue}
      </p>

      {/* Audio state */}
      {unlocked ? (
        <div
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black"
          style={{ backgroundColor: "rgba(240,180,41,0.12)", color: "#f0b429" }}
        >
          <Volume2 size={13} />
          {match.status === "live"     ? "Audio Live — Streaming Now" :
           match.status === "upcoming" ? "Audio Ready for Match Day"  :
                                         "Replay Audio Available"}
        </div>
      ) : (
        <button
          onClick={() => onUnlock(match)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all hover:bg-white/10"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
        >
          <Lock size={12} /> Unlock Audio — $1
        </button>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function WorldCupPage() {
  const router   = useRouter();
  const user     = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hasHydrated);

  const [view,            setView]    = useState<View>("register");
  const [unlockedMatches, setUnlocked] = useState<string[]>([]);
  const [selectedMatch,   setSelected] = useState<Match | null>(null);

  // Registration form
  const [contactType,   setContactType]   = useState<"phone" | "email">("phone");
  const [fullName,      setFullName]      = useState("");
  const [country,       setCountry]       = useState("Zimbabwe");
  const [email,         setEmail]         = useState("");
  const [phone,         setPhone]         = useState("");
  const [password,      setPassword]      = useState("");
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [regError,      setRegError]      = useState<string | null>(null);

  // Show matches if already logged in
  useEffect(() => {
    if (!hydrated) return;
    if (user) setView("matches");
  }, [hydrated, user]);

  // Load unlocked matches from localStorage
  useEffect(() => { setUnlocked(loadUnlocked()); }, []);

  // Stripe redirect back: /worldcup?unlocked=matchId
  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const matchId = params.get("unlocked");
    if (matchId) {
      setUnlocked((prev) => {
        const next = Array.from(new Set([...prev, matchId]));
        saveUnlocked(next);
        return next;
      });
      window.history.replaceState({}, "", "/worldcup");
      setView("matches");
    }
  }, []);

  const handleUnlocked = useCallback((matchId: string) => {
    setUnlocked((prev) => {
      const next = Array.from(new Set([...prev, matchId]));
      saveUnlocked(next);
      return next;
    });
  }, []);

  const contactValid =
    contactType === "email"
      ? email.includes("@") && email.includes(".")
      : phone.replace(/\D/g, "").length >= 9;
  const canSubmit =
    fullName.trim().length >= 2 && country !== "" && contactValid && password.length >= 6;

  const handleRegister = async () => {
    setIsSubmitting(true);
    setRegError(null);
    try {
      const parts      = fullName.trim().split(" ");
      const first_name = parts[0];
      const surname    = parts.slice(1).join(" ") || parts[0];
      const body: Record<string, unknown> = {
        first_name, surname, name: fullName.trim(), country,
        password, password_confirmation: password, role: "fan",
      };
      if (contactType === "email") {
        body.email = email.trim().toLowerCase();
      } else {
        body.phone = normalizePhone(phone.trim());
      }
      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), 90_000);
      let res: Response;
      try {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body), signal: controller.signal,
        });
      } catch (fetchErr) {
        if ((fetchErr as { name?: string }).name === "AbortError")
          throw new Error("Server is waking up — please try again in 30 seconds.");
        throw new Error("Cannot reach server. Check your connection and try again.");
      } finally { clearTimeout(timeout); }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          data.message ||
          (data.errors ? Object.values(data.errors).flat().join(" ") : null) ||
          "Registration failed. Please try again.";
        throw new Error(msg as string);
      }
      const data = await res.json();
      if (data.token)    localStorage.setItem("auth_token", data.token);
      if (data.user?.id) localStorage.setItem("player_id", data.user.id);
      router.push("/login?registered=1");
    } catch (err) {
      setRegError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a1a0f" }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="text-center pt-14 pb-10 px-4">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
          style={{ backgroundColor: "#1a3a20", border: "1px solid rgba(240,180,41,0.3)" }}
        >
          <Trophy size={32} style={{ color: "#f0b429" }} />
        </div>
        <div
          className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-3"
          style={{ backgroundColor: "rgba(240,180,41,0.15)", color: "#f0b429" }}
        >
          GRS World Cup 2026
        </div>
        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white mb-2">
          FIFA World Cup<br />2026
        </h1>
        <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>
          Follow every match. Unlock live AI audio commentary. Discover the next generation of talent.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {PERKS.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)" }}
            >
              <Icon size={13} style={{ color: "#f0b429" }} />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ── Matches view ─────────────────────────────────────────────── */}
      {view === "matches" ? (
        <div className="max-w-2xl mx-auto px-4 pb-20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-black text-sm uppercase tracking-widest">Group Stage</h2>
            <span
              className="text-[10px] font-semibold px-2 py-1 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)" }}
            >
              {unlockedMatches.length} / {MATCHES.length} unlocked
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {MATCHES.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                unlocked={unlockedMatches.includes(match.id)}
                onUnlock={setSelected}
              />
            ))}
          </div>
          <p className="text-center text-xs mt-8" style={{ color: "rgba(255,255,255,0.15)" }}>
            AI audio commentary powered by GrassRoots Sports · $1 per match · cancel any time
          </p>
          {!user && (
            <p className="text-center text-xs mt-2">
              <button
                onClick={() => setView("register")}
                className="font-bold hover:underline"
                style={{ color: "rgba(240,180,41,0.5)" }}
              >
                Create a free fan account to save your unlocked matches
              </button>
            </p>
          )}
        </div>
      ) : (
        /* ── Register view ─────────────────────────────────────────── */
        <div className="flex justify-center px-4 pb-20">
          <div className="w-full max-w-md">
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: "#111f14", border: "1px solid rgba(240,180,41,0.15)" }}
            >
              <h2 className="text-lg font-black text-white mb-1">Join as a Fan</h2>
              <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
                Takes 30 seconds. Then unlock audio commentary for any match — $1 each.
              </p>

              {regError && (
                <div
                  className="mb-4 p-3 rounded-xl text-sm"
                  style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}
                >
                  {regError}
                </div>
              )}

              <div className="space-y-4">
                {/* Full name */}
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Full Name
                  </label>
                  <input
                    type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Tendai Musona"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    style={{ backgroundColor: "#1a3a20", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Country
                  </label>
                  <select
                    value={country} onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    style={{ backgroundColor: "#1a3a20", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c} style={{ backgroundColor: "#1a3a20" }}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Contact toggle */}
                <div>
                  <div className="flex gap-2 mb-3">
                    {(["phone", "email"] as const).map((t) => (
                      <button
                        key={t} type="button" onClick={() => setContactType(t)}
                        className="flex-1 py-2 rounded-xl border text-sm font-semibold transition-all"
                        style={{
                          backgroundColor: contactType === t ? "#f0b429" : "transparent",
                          borderColor:     contactType === t ? "#f0b429" : "rgba(255,255,255,0.12)",
                          color:           contactType === t ? "#0a1a0f" : "rgba(255,255,255,0.5)",
                        }}
                      >
                        {t === "phone" ? "Phone Number" : "Email"}
                      </button>
                    ))}
                  </div>
                  {contactType === "phone" ? (
                    <>
                      <input
                        type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                        placeholder="+263 77 123 4567"
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        style={{ backgroundColor: "#1a3a20", border: "1px solid rgba(255,255,255,0.08)" }}
                      />
                      <p className="text-xs mt-1.5" style={{ color: "rgba(240,180,41,0.6)" }}>
                        Use your WhatsApp number — your account connects automatically
                      </p>
                    </>
                  ) : (
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      style={{ backgroundColor: "#1a3a20", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Password
                  </label>
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    style={{ backgroundColor: "#1a3a20", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                </div>

                {/* Submit */}
                <button
                  disabled={!canSubmit || isSubmitting}
                  onClick={handleRegister}
                  className="w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                  style={{
                    backgroundColor: canSubmit && !isSubmitting ? "#f0b429" : "rgba(255,255,255,0.07)",
                    color:           canSubmit && !isSubmitting ? "#0a1a0f" : "rgba(255,255,255,0.25)",
                    cursor:          canSubmit && !isSubmitting ? "pointer"  : "not-allowed",
                  }}
                >
                  {isSubmitting
                    ? <><Loader2 size={16} className="animate-spin" /> Creating account...</>
                    : <><CheckCircle size={16} /> Join & Access Matches</>
                  }
                </button>
              </div>

              <p className="text-center text-xs mt-5" style={{ color: "rgba(255,255,255,0.25)" }}>
                Already have an account?{" "}
                <Link href="/login" className="font-bold hover:underline" style={{ color: "rgba(240,180,41,0.6)" }}>
                  Sign in
                </Link>
                {" · "}
                <button
                  onClick={() => setView("matches")}
                  className="font-bold hover:underline"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  Browse matches first
                </button>
              </p>
            </div>

            <p className="text-center text-xs mt-4">
              <Link href="/register" className="hover:underline" style={{ color: "rgba(255,255,255,0.25)" }}>
                Not a fan? Register as Player, Coach or Scout
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {selectedMatch && (
        <PaymentModal
          match={selectedMatch}
          onClose={() => setSelected(null)}
          onUnlocked={handleUnlocked}
          userName={user?.name ?? ""}
        />
      )}
    </div>
  );
}
