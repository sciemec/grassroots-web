"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Loader2, CheckCircle, Trophy, Star, Users, Tv,
  Lock, Volume2, CreditCard, Smartphone, X, Radio,
  Zap, ChevronRight, Globe,
} from "lucide-react";
import { normalizePhone } from "@/lib/phone-normalize";
import { useAuthStore } from "@/lib/auth-store";
import { MatchHighlights } from "@/components/MatchHighlights";

// ── Types ──────────────────────────────────────────────────────────────────
type MatchStatus  = "finished" | "live" | "upcoming";
type Dialect      = "EN" | "Shona" | "Ndebele" | "Zulu" | "Tswana";
type PayTab       = "card" | "mobile";
type MobileMethod = "ecocash" | "innbucks" | "onemoney";

interface Match {
  id:                 string;
  group:              string;
  home:               string;
  homeFlagEmoji:      string;
  away:               string;
  awayFlagEmoji:      string;
  date:               string;
  time:               string;
  venue:              string;
  status:             MatchStatus;
  homeScore?:         number;
  awayScore?:         number;
  minute?:            number;
  pitchSponsorName?:  string;
  pitchLogoLeftUrl?:  string;
  pitchLogoRightUrl?: string;
  sponsorTargetUrl?:  string;
}

// ── Fallback hardcoded fixtures ────────────────────────────────────────────
const FALLBACK_MATCHES: Match[] = [
  { id:"m01", group:"A", home:"Mexico",       homeFlagEmoji:"🇲🇽", away:"USA",         awayFlagEmoji:"🇺🇸", date:"Jun 12", time:"19:00", venue:"AT&T Stadium, Dallas",         status:"finished", homeScore:0, awayScore:2 },
  { id:"m02", group:"A", home:"Ghana",         homeFlagEmoji:"🇬🇭", away:"Panama",      awayFlagEmoji:"🇵🇦", date:"Jun 12", time:"22:00", venue:"SoFi Stadium, Los Angeles",    status:"finished", homeScore:2, awayScore:1 },
  { id:"m03", group:"B", home:"Brazil",        homeFlagEmoji:"🇧🇷", away:"Morocco",     awayFlagEmoji:"🇲🇦", date:"Jun 13", time:"15:00", venue:"MetLife Stadium, New Jersey",   status:"finished", homeScore:3, awayScore:1 },
  { id:"m04", group:"B", home:"Portugal",      homeFlagEmoji:"🇵🇹", away:"Serbia",      awayFlagEmoji:"🇷🇸", date:"Jun 13", time:"19:00", venue:"Arrowhead Stadium, KC",         status:"finished", homeScore:2, awayScore:2 },
  { id:"m05", group:"C", home:"Argentina",     homeFlagEmoji:"🇦🇷", away:"Nigeria",     awayFlagEmoji:"🇳🇬", date:"Jun 14", time:"15:00", venue:"Hard Rock Stadium, Miami",      status:"live",     homeScore:1, awayScore:0, minute:67 },
  { id:"m06", group:"C", home:"France",        homeFlagEmoji:"🇫🇷", away:"Australia",   awayFlagEmoji:"🇦🇺", date:"Jun 14", time:"19:00", venue:"Lumen Field, Seattle",          status:"upcoming" },
  { id:"m07", group:"D", home:"England",       homeFlagEmoji:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", away:"Senegal",     awayFlagEmoji:"🇸🇳", date:"Jun 15", time:"15:00", venue:"Allegiant Stadium, Las Vegas",  status:"upcoming" },
  { id:"m08", group:"D", home:"Germany",       homeFlagEmoji:"🇩🇪", away:"Netherlands", awayFlagEmoji:"🇳🇱", date:"Jun 15", time:"19:00", venue:"Rose Bowl, Los Angeles",        status:"upcoming" },
  { id:"m09", group:"E", home:"Spain",         homeFlagEmoji:"🇪🇸", away:"Egypt",       awayFlagEmoji:"🇪🇬", date:"Jun 16", time:"15:00", venue:"BC Place, Vancouver",           status:"upcoming" },
  { id:"m10", group:"E", home:"Japan",         homeFlagEmoji:"🇯🇵", away:"Colombia",    awayFlagEmoji:"🇨🇴", date:"Jun 16", time:"19:00", venue:"Estadio Azteca, Mexico City",   status:"upcoming" },
  { id:"m11", group:"F", home:"South Africa",  homeFlagEmoji:"🇿🇦", away:"Zimbabwe",    awayFlagEmoji:"🇿🇼", date:"Jun 17", time:"15:00", venue:"AT&T Stadium, Dallas",          status:"upcoming" },
  { id:"m12", group:"F", home:"Italy",         homeFlagEmoji:"🇮🇹", away:"Croatia",     awayFlagEmoji:"🇭🇷", date:"Jun 17", time:"19:00", venue:"MetLife Stadium, New Jersey",   status:"upcoming" },
];

const FLAG_MAP: Record<string, string> = {
  "Mexico":"🇲🇽","USA":"🇺🇸","United States":"🇺🇸","Ghana":"🇬🇭","Panama":"🇵🇦",
  "Brazil":"🇧🇷","Morocco":"🇲🇦","Portugal":"🇵🇹","Serbia":"🇷🇸","Argentina":"🇦🇷",
  "Nigeria":"🇳🇬","France":"🇫🇷","Australia":"🇦🇺","England":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Senegal":"🇸🇳",
  "Germany":"🇩🇪","Netherlands":"🇳🇱","Spain":"🇪🇸","Egypt":"🇪🇬","Japan":"🇯🇵",
  "Colombia":"🇨🇴","South Africa":"🇿🇦","Zimbabwe":"🇿🇼","Italy":"🇮🇹","Croatia":"🇭🇷",
};

// ── ESPN API + openfootball fallback ───────────────────────────────────────
async function fetchLiveMatches(): Promise<Match[]> {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa-world-cup/scoreboard",
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error("ESPN error");
    const json = await res.json() as {
      events?: Array<{
        id: string;
        competitions: Array<{
          competitors: Array<{ homeAway: string; team: { displayName: string }; score?: string }>;
          status: { type: { state: string; completed: boolean } };
          situation?: { clock?: string };
          venue?: { fullName: string };
          groups?: Array<{ name: string }>;
        }>;
        date: string;
      }>;
    };
    if (!json.events?.length) throw new Error("No events");

    return json.events.map((ev, i) => {
      const comp   = ev.competitions[0];
      const home   = comp.competitors.find(c => c.homeAway === "home");
      const away   = comp.competitors.find(c => c.homeAway === "away");
      const state  = comp.status.type.state;
      const status: MatchStatus =
        state === "in" ? "live" : state === "post" ? "finished" : "upcoming";
      const d = new Date(ev.date);
      return {
        id:            ev.id,
        group:         comp.groups?.[0]?.name?.replace("Group ", "") ?? String.fromCharCode(65 + (i % 8)),
        home:          home?.team.displayName ?? "TBD",
        homeFlagEmoji: FLAG_MAP[home?.team.displayName ?? ""] ?? "🏳",
        away:          away?.team.displayName ?? "TBD",
        awayFlagEmoji: FLAG_MAP[away?.team.displayName ?? ""] ?? "🏳",
        date:          d.toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
        time:          d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        venue:         comp.venue?.fullName ?? "",
        status,
        homeScore:     home?.score !== undefined ? Number(home.score) : undefined,
        awayScore:     away?.score !== undefined ? Number(away.score) : undefined,
        minute:        status === "live" && comp.situation?.clock
                         ? Number(comp.situation.clock)
                         : undefined,
      };
    });
  } catch {
    // Try openfootball as secondary fallback
    try {
      const res = await fetch(
        "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json",
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error();
      await res.json();
      // openfootball 2026 data not yet available — fall through to hardcoded
    } catch { /* fall through */ }
    return [];
  }
}

// ── localStorage helpers ───────────────────────────────────────────────────
const UNLOCK_KEY = "wc_unlocked_matches";
function loadUnlocked(): string[] {
  try { return JSON.parse(localStorage.getItem(UNLOCK_KEY) ?? "[]") as string[]; }
  catch { return []; }
}
function saveUnlocked(ids: string[]) {
  localStorage.setItem(UNLOCK_KEY, JSON.stringify(ids));
}

// ── AdBanner ───────────────────────────────────────────────────────────────
function AdBanner({ tier }: { tier: "GOLD" | "SILVER" | "BRONZE" }) {
  const STYLES = {
    GOLD:   { bg: "#1a3a20", border: "rgba(240,180,41,0.35)", label: "GOLD SPONSOR",   h: 160 },
    SILVER: { bg: "#161f18", border: "rgba(200,200,200,0.2)", label: "SILVER SPONSOR", h: 120 },
    BRONZE: { bg: "#141d16", border: "rgba(180,100,40,0.2)",  label: "BRONZE SPONSOR", h: 80  },
  };
  const s = STYLES[tier];
  return (
    <div
      className="rounded-xl flex flex-col items-center justify-center text-center px-3 w-full"
      style={{ backgroundColor: s.bg, border: `1px solid ${s.border}`, height: s.h, minHeight: s.h }}
    >
      <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.18)" }}>
        {tier === "GOLD" ? "⭐ " : ""}{s.label}
      </p>
      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.1)" }}>Ad space available</p>
      <a
        href="mailto:sponsors@grassrootssports.live"
        className="text-[9px] mt-1.5 hover:underline"
        style={{ color: "rgba(240,180,41,0.4)" }}
      >
        Contact us
      </a>
    </div>
  );
}

// ── Football Pitch Canvas ──────────────────────────────────────────────────
function FootballPitch({ match }: { match: Match | null }) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const ballAngle  = useRef(0);
  const rafRef     = useRef<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    // Grass background
    ctx.fillStyle = "#2d7a3a";
    ctx.fillRect(0, 0, W, H);

    // Grass stripes
    for (let i = 0; i < 8; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = "rgba(0,0,0,0.045)";
        ctx.fillRect(0, i * (H / 8), W, H / 8);
      }
    }

    ctx.strokeStyle = "rgba(255,255,255,0.82)";
    ctx.lineWidth   = 1.8;

    // Pitch border
    const pad = 14;
    ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2);

    // Center line
    ctx.beginPath(); ctx.moveTo(W / 2, pad); ctx.lineTo(W / 2, H - pad); ctx.stroke();

    // Center circle
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 42, 0, Math.PI * 2); ctx.stroke();

    // Center spot
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 3, 0, Math.PI * 2); ctx.fill();

    // Left penalty area
    const paW = 82, paH = 136;
    ctx.strokeRect(pad, (H - paH) / 2, paW, paH);
    // Left 6-yard box
    ctx.strokeRect(pad, (H - 62) / 2, 28, 62);
    // Left penalty spot
    ctx.beginPath(); ctx.arc(pad + 56, H / 2, 2.5, 0, Math.PI * 2); ctx.fill();

    // Right penalty area
    ctx.strokeRect(W - pad - paW, (H - paH) / 2, paW, paH);
    // Right 6-yard box
    ctx.strokeRect(W - pad - 28, (H - 62) / 2, 28, 62);
    // Right penalty spot
    ctx.beginPath(); ctx.arc(W - pad - 56, H / 2, 2.5, 0, Math.PI * 2); ctx.fill();

    // Goals (white bars)
    ctx.fillStyle   = "rgba(255,255,255,0.13)";
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth   = 1.5;
    ctx.fillRect(pad - 9, (H - 52) / 2, 9, 52);
    ctx.strokeRect(pad - 9, (H - 52) / 2, 9, 52);
    ctx.fillRect(W - pad, (H - 52) / 2, 9, 52);
    ctx.strokeRect(W - pad, (H - 52) / 2, 9, 52);

    // Team flag emojis
    ctx.font = "20px serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,1)";
    if (match?.homeFlagEmoji) ctx.fillText(match.homeFlagEmoji, W / 4,     H / 2 + 8);
    if (match?.awayFlagEmoji) ctx.fillText(match.awayFlagEmoji, (W * 3) / 4, H / 2 + 8);

    // Score overlay for live/finished
    if (match && match.homeScore !== undefined) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      const sw = 70, sh = 28;
      ctx.beginPath();
      ctx.roundRect(W / 2 - sw / 2, H / 2 - sh / 2 - 30, sw, sh, 6);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(`${match.homeScore} – ${match.awayScore}`, W / 2, H / 2 - 12);
    }

    // Minute indicator for live matches
    if (match?.status === "live" && match.minute) {
      ctx.fillStyle = "rgba(239,68,68,0.85)";
      const mw = 42, mh = 18;
      ctx.beginPath();
      ctx.roundRect(W / 2 - mw / 2, H - pad - mh - 4, mw, mh, 4);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font      = "bold 10px sans-serif";
      ctx.fillText(`${match.minute}'`, W / 2, H - pad - 8);
    }

    // GrassRoots watermark
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle   = "#f0b429";
    ctx.font        = "bold 13px sans-serif";
    ctx.textAlign   = "center";
    ctx.fillText("GRASSROOTS SPORTS", W / 2, H - 6);
    ctx.restore();

    // Pitch sponsor watermark
    if (match?.pitchSponsorName) {
      ctx.save();
      ctx.globalAlpha = 0.14;
      ctx.fillStyle   = "#fff";
      ctx.font        = "bold 10px sans-serif";
      ctx.textAlign   = "center";
      ctx.fillText(match.pitchSponsorName.toUpperCase(), W / 2, 26);
      ctx.restore();
    }

    // Ball animation for live
    if (match?.status === "live") {
      ballAngle.current += 0.018;
      const bx = W / 2 + Math.cos(ballAngle.current) * 65;
      const by = H / 2 + Math.sin(ballAngle.current * 0.65) * 38;
      // Shadow
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle   = "#000";
      ctx.beginPath();
      ctx.ellipse(bx + 1, by + 3, 7, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // Ball
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#222";
      ctx.beginPath(); ctx.arc(bx - 2, by - 2, 2.5, 0, Math.PI * 2); ctx.fill();
      rafRef.current = requestAnimationFrame(draw);
    }
  }, [match]);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
      <canvas ref={canvasRef} width={520} height={270} className="w-full h-auto block" />
      {match?.pitchSponsorName && match.sponsorTargetUrl && (
        <a
          href={match.sponsorTargetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center py-1 text-[9px] font-bold uppercase tracking-widest"
          style={{ backgroundColor: "#0d1a0f", color: "rgba(240,180,41,0.4)" }}
        >
          Powered by {match.pitchSponsorName}
        </a>
      )}
    </div>
  );
}

// ── AI Commentary ──────────────────────────────────────────────────────────
function AICommentary({ match }: { match: Match | null }) {
  const [dialect,     setDialect]     = useState<Dialect>("EN");
  const [commentary,  setCommentary]  = useState<string | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [commentType, setCommentType] = useState<"live" | "halftime" | "tactical">("live");

  const DIALECTS: Dialect[] = ["EN", "Shona", "Ndebele", "Zulu", "Tswana"];

  const generate = async () => {
    if (!match) return;
    setLoading(true);
    setCommentary(null);
    const TYPE_PROMPTS = {
      live:     "Generate 3 sentences of exciting live match commentary. Be dramatic and energetic.",
      halftime: "Give a 3-sentence halftime analysis covering key moments and tactical insights.",
      tactical: "Provide a 3-sentence tactical breakdown covering formations, pressing, and key duels.",
    };
    try {
      const score = match.homeScore !== undefined
        ? `${match.homeScore}–${match.awayScore}`
        : "yet to kick off";
      const prompt = `Match: ${match.homeFlagEmoji} ${match.home} vs ${match.awayFlagEmoji} ${match.away}. Score: ${score}. Status: ${match.status}${match.minute ? ` (${match.minute}')` : ""}. Venue: ${match.venue}. ${TYPE_PROMPTS[commentType]}${dialect !== "EN" ? ` Reply in ${dialect}.` : ""}`;
      const res  = await fetch("/api/ai-coach", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message:       prompt,
          system_prompt: "You are an expert football commentator for the 2026 FIFA World Cup. Keep it punchy and vivid.",
        }),
      });
      const data = await res.json() as { response?: string; answer?: string };
      setCommentary(data.response ?? data.answer ?? "No commentary available right now.");
    } catch {
      setCommentary("Could not generate commentary. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#0d1a0f", border: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ backgroundColor: "#111f14", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2">
          <Radio size={12} style={{ color: "#f0b429" }} />
          <span className="text-xs font-black uppercase tracking-widest text-white">AI Commentary</span>
          {match?.status === "live" && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(239,68,68,0.2)", color: "#f87171" }}>
              ● LIVE
            </span>
          )}
        </div>
        {/* Dialect selector */}
        <div className="flex gap-0.5">
          {DIALECTS.map((d) => (
            <button
              key={d}
              onClick={() => setDialect(d)}
              className="text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors"
              style={{
                backgroundColor: dialect === d ? "#f0b429" : "transparent",
                color:           dialect === d ? "#0a1a0f" : "rgba(255,255,255,0.28)",
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* Type selector */}
        <div className="flex gap-2 mb-3">
          {(["live", "halftime", "tactical"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setCommentType(t)}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all capitalize"
              style={{
                backgroundColor: commentType === t ? "rgba(240,180,41,0.1)" : "transparent",
                borderColor:     commentType === t ? "rgba(240,180,41,0.3)" : "rgba(255,255,255,0.07)",
                color:           commentType === t ? "#f0b429" : "rgba(255,255,255,0.28)",
              }}
            >
              {t === "live" ? "Live" : t === "halftime" ? "Half Time" : "Tactical"}
            </button>
          ))}
        </div>

        {/* Generate button */}
        <button
          disabled={!match || loading}
          onClick={generate}
          className="w-full py-2 rounded-xl text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1.5 mb-4 transition-all"
          style={{
            backgroundColor: match && !loading ? "#f0b429" : "rgba(255,255,255,0.05)",
            color:           match && !loading ? "#0a1a0f" : "rgba(255,255,255,0.2)",
          }}
        >
          {loading
            ? <><Loader2 size={12} className="animate-spin" /> Generating...</>
            : <><Zap size={12} /> {commentType === "live" ? "Get Commentary" : commentType === "halftime" ? "Halftime Analysis" : "Tactical View"}</>
          }
        </button>

        {/* Output */}
        {commentary ? (
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.78)" }}>
            {commentary}
          </p>
        ) : (
          <p className="text-xs text-center py-3" style={{ color: "rgba(255,255,255,0.18)" }}>
            {match ? "Click Generate to get AI commentary" : "Select a match from the schedule"}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Payment modal ──────────────────────────────────────────────────────────
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

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);
  useEffect(() => () => stopPoll(), [stopPoll]);

  useEffect(() => {
    if (!polling || !pollUrl) return;
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/payments/paynow/status?pollUrl=${encodeURIComponent(pollUrl)}`);
        const data = await res.json() as { paid?: boolean };
        if (data.paid) { stopPoll(); setPolling(false); onUnlocked(match.id); onClose(); }
      } catch { /* keep polling */ }
    }, 3000);
    return stopPoll;
  }, [polling, pollUrl, match.id, onUnlocked, onClose, stopPoll]);

  const payMobile = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) { setError("Enter a valid phone number."); return; }
    setPaying(true); setError(null);
    try {
      const res  = await fetch("/api/payments/match-donate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: match.id, amount: "1", phone: normalizePhone(phone), donor_name: userName || "Fan" }),
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
      style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 relative"
        style={{ backgroundColor: "#111f14", border: "1px solid rgba(240,180,41,0.2)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors hover:bg-white/10"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          <X size={18} />
        </button>

        <div className="mb-5">
          <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#f0b429" }}>
            Unlock Audio Commentary
          </div>
          <h3 className="text-white font-black text-base leading-tight">
            {match.homeFlagEmoji} {match.home} vs {match.awayFlagEmoji} {match.away}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.32)" }}>
            {match.date} · Group {match.group}
          </p>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black mt-3"
            style={{ backgroundColor: "rgba(240,180,41,0.12)", color: "#f0b429" }}
          >
            <Volume2 size={11} /> $1.00 — one-time unlock
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {([["mobile", <Smartphone key="s" size={12} />, "Mobile Money"], ["card", <CreditCard key="c" size={12} />, "Card"]] as [PayTab, React.ReactNode, string][]).map(([t, icon, label]) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all"
              style={{
                backgroundColor: tab === t ? "#f0b429" : "transparent",
                borderColor:     tab === t ? "#f0b429" : "rgba(255,255,255,0.1)",
                color:           tab === t ? "#0a1a0f" : "rgba(255,255,255,0.4)",
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
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              Approve the $1 payment on your {method === "ecocash" ? "EcoCash" : method === "innbucks" ? "InnBucks" : "OneMoney"} app
            </p>
            <button onClick={() => { stopPoll(); setPolling(false); }} className="mt-4 text-xs hover:underline" style={{ color: "rgba(255,255,255,0.28)" }}>
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
                    color:           method === m ? "#f0b429" : "rgba(255,255,255,0.38)",
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
                color:           !paying && phoneOk ? "#0a1a0f" : "rgba(255,255,255,0.18)",
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
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
              Pay securely with Visa, Mastercard or any debit card. You will be taken to Stripe to complete the $1 payment.
            </p>
            <button
              disabled={paying}
              onClick={payCard}
              className="w-full py-3 rounded-xl text-sm font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
              style={{
                backgroundColor: !paying ? "#f0b429" : "rgba(255,255,255,0.06)",
                color:           !paying ? "#0a1a0f" : "rgba(255,255,255,0.18)",
              }}
            >
              {paying
                ? <><Loader2 size={14} className="animate-spin" /> Redirecting...</>
                : <><CreditCard size={14} /> Pay $1 with Card</>
              }
            </button>
            <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>
              Powered by Stripe · SSL encrypted
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Match card (schedule list item) ───────────────────────────────────────
function MatchCard({
  match, selected, unlocked, onSelect, onUnlock,
}: {
  match:    Match;
  selected: boolean;
  unlocked: boolean;
  onSelect: (m: Match) => void;
  onUnlock: (m: Match) => void;
}) {
  const STATUS: Record<MatchStatus, { color: string; label: string }> = {
    live:     { color: "#f87171", label: "● LIVE" },
    finished: { color: "rgba(255,255,255,0.28)", label: "FT" },
    upcoming: { color: "#f0b429", label: "UPCOMING" },
  };
  const s = STATUS[match.status];

  return (
    <div
      onClick={() => onSelect(match)}
      className="rounded-xl p-3 cursor-pointer transition-all"
      style={{
        backgroundColor: selected ? "#1a3a20" : "#0d1a0f",
        border: `1px solid ${selected ? "rgba(240,180,41,0.4)" : "rgba(255,255,255,0.06)"}`,
      }}
    >
      {/* Group + status */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-bold" style={{ color: "rgba(255,255,255,0.22)" }}>Group {match.group}</span>
        <span className="text-[9px] font-black uppercase tracking-wide" style={{ color: s.color }}>{s.label}</span>
      </div>

      {/* Teams + score */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm">{match.homeFlagEmoji}</span>
            <span className="text-xs font-bold text-white truncate">{match.home}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-sm">{match.awayFlagEmoji}</span>
            <span className="text-xs font-bold text-white truncate">{match.away}</span>
          </div>
        </div>
        <div className="text-center shrink-0 w-12">
          {match.homeScore !== undefined ? (
            <>
              <div className="text-sm font-black text-white leading-none">{match.homeScore}</div>
              <div className="text-sm font-black text-white leading-none">{match.awayScore}</div>
            </>
          ) : (
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>{match.time}</span>
          )}
        </div>
      </div>

      {/* Audio unlock micro-button */}
      {unlocked ? (
        <div className="mt-2 flex items-center gap-1 text-[9px] font-black" style={{ color: "#f0b429" }}>
          <Volume2 size={9} /> AUDIO UNLOCKED
        </div>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onUnlock(match); }}
          className="mt-2 w-full flex items-center justify-center gap-1 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all hover:bg-white/10"
          style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.28)" }}
        >
          <Lock size={8} /> Unlock Audio $1
        </button>
      )}
    </div>
  );
}

// ── Scoreboard panel ──────────────────────────────────────────────────────
function Scoreboard({ match, unlocked, onUnlock }: {
  match:    Match;
  unlocked: boolean;
  onUnlock: (m: Match) => void;
}) {
  const STATUS_LABEL: Record<MatchStatus, string> = {
    live:     `● LIVE ${match.minute ? `${match.minute}'` : ""}`,
    finished: "Full Time",
    upcoming: `${match.date} · ${match.time}`,
  };
  const STATUS_COLOR: Record<MatchStatus, string> = {
    live:     "#f87171",
    finished: "rgba(255,255,255,0.4)",
    upcoming: "#f0b429",
  };

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: "#111f14", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Match meta */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
          Group {match.group} · {match.venue}
        </span>
        <span className="text-xs font-black uppercase tracking-wide" style={{ color: STATUS_COLOR[match.status] }}>
          {STATUS_LABEL[match.status]}
        </span>
      </div>

      {/* Teams + score */}
      <div className="flex items-center justify-between gap-4">
        {/* Home */}
        <div className="flex-1 text-center">
          <div className="text-5xl leading-none mb-2">{match.homeFlagEmoji}</div>
          <p className="text-white font-black text-sm uppercase tracking-wide">{match.home}</p>
        </div>

        {/* Score */}
        <div className="text-center shrink-0">
          {match.homeScore !== undefined ? (
            <div className="text-4xl font-black text-white tabular-nums">
              {match.homeScore} <span style={{ color: "rgba(255,255,255,0.25)" }}>–</span> {match.awayScore}
            </div>
          ) : (
            <div className="text-2xl font-black" style={{ color: "rgba(255,255,255,0.2)" }}>vs</div>
          )}
          <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.22)" }}>{match.date}</p>
        </div>

        {/* Away */}
        <div className="flex-1 text-center">
          <div className="text-5xl leading-none mb-2">{match.awayFlagEmoji}</div>
          <p className="text-white font-black text-sm uppercase tracking-wide">{match.away}</p>
        </div>
      </div>

      {/* Audio unlock */}
      <div className="mt-5">
        {unlocked ? (
          <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black" style={{ backgroundColor: "rgba(240,180,41,0.1)", color: "#f0b429" }}>
            <Volume2 size={14} />
            {match.status === "live" ? "Audio Live — Streaming Now" : match.status === "upcoming" ? "Audio Ready for Match Day" : "Replay Audio Available"}
          </div>
        ) : (
          <button
            onClick={() => onUnlock(match)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black uppercase tracking-wide transition-all hover:bg-white/10"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
          >
            <Lock size={13} /> Unlock Audio Commentary — $1
          </button>
        )}
      </div>
    </div>
  );
}

// ── Countries + perks ─────────────────────────────────────────────────────
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

// ── Main page ──────────────────────────────────────────────────────────────
export default function WorldCupPage() {
  const user     = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hasHydrated);

  const [matches,         setMatches]   = useState<Match[]>(FALLBACK_MATCHES);
  const [selected,        setSelected]  = useState<Match>(FALLBACK_MATCHES[4]); // default: live match
  const [unlockedMatches, setUnlocked]  = useState<string[]>([]);
  const [payMatch,        setPayMatch]  = useState<Match | null>(null);
  const [fetchedLive,     setFetchedLive] = useState(false);

  // Registration form state
  const [showRegBanner, setShowRegBanner] = useState(false);
  const [showRegForm,   setShowRegForm]   = useState(false);
  const [contactType,   setContactType]   = useState<"phone" | "email">("phone");
  const [fullName,      setFullName]      = useState("");
  const [country,       setCountry]       = useState("Zimbabwe");
  const [email,         setEmail]         = useState("");
  const [regPhone,      setRegPhone]      = useState("");
  const [password,      setPassword]      = useState("");
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [regError,      setRegError]      = useState<string | null>(null);

  // Show reg banner for guests after 10 seconds
  useEffect(() => {
    if (!hydrated) return;
    if (user) return;
    const t = setTimeout(() => setShowRegBanner(true), 10_000);
    return () => clearTimeout(t);
  }, [hydrated, user]);

  // Load unlocked matches
  useEffect(() => { setUnlocked(loadUnlocked()); }, []);

  // Handle Stripe redirect back
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
    }
  }, []);

  // Fetch live scores from ESPN
  useEffect(() => {
    const load = async () => {
      const live = await fetchLiveMatches();
      if (live.length > 0) {
        setMatches(live);
        // auto-select first live match, else first match
        const liveMatch = live.find(m => m.status === "live") ?? live[0];
        setSelected(liveMatch);
      }
      setFetchedLive(true);
    };
    void load();
    // Auto-refresh every 30s
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleUnlocked = useCallback((matchId: string) => {
    setUnlocked((prev) => {
      const next = Array.from(new Set([...prev, matchId]));
      saveUnlocked(next);
      return next;
    });
  }, []);

  // Registration validation
  const contactValid =
    contactType === "email"
      ? email.includes("@") && email.includes(".")
      : regPhone.replace(/\D/g, "").length >= 9;
  const canSubmit = fullName.trim().length >= 2 && country !== "" && contactValid && password.length >= 6;

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
        body.phone = normalizePhone(regPhone.trim());
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
        const data = await res.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[]> };
        const msg =
          data.message ||
          (data.errors ? Object.values(data.errors).flat().join(" ") : null) ||
          "Registration failed. Please try again.";
        throw new Error(msg);
      }
      const data = await res.json() as { token?: string; user?: { id?: string } };
      if (data.token)    localStorage.setItem("auth_token", data.token);
      if (data.user?.id) localStorage.setItem("player_id", data.user.id);
      setShowRegForm(false);
      setShowRegBanner(false);
      window.location.href = "/login?registered=1";
    } catch (err) {
      setRegError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setIsSubmitting(false); }
  };

  // Groups for schedule
  const groups = Array.from(new Set(matches.map(m => m.group)));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a1a0f" }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: "#0a1a0f", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#1a3a20", border: "1px solid rgba(240,180,41,0.25)" }}>
            <Trophy size={16} style={{ color: "#f0b429" }} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest leading-none" style={{ color: "#f0b429" }}>GRS World Cup</p>
            <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>FIFA 2026 · Live AI Coverage</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!fetchedLive && <Loader2 size={13} className="animate-spin" style={{ color: "rgba(255,255,255,0.2)" }} />}
          {user ? (
            <Link href="/fan" className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(240,180,41,0.1)", color: "#f0b429" }}>
              Fan Hub <ChevronRight size={10} className="inline" />
            </Link>
          ) : (
            <button
              onClick={() => setShowRegForm(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: "rgba(240,180,41,0.1)", color: "#f0b429" }}
            >
              Join Free
            </button>
          )}
        </div>
      </div>

      {/* ── Guest registration banner ────────────────────────────────────── */}
      {showRegBanner && !user && !showRegForm && (
        <div
          className="px-4 py-3 flex items-center justify-between gap-3"
          style={{ backgroundColor: "#1a3a20", borderBottom: "1px solid rgba(240,180,41,0.2)" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Globe size={14} style={{ color: "#f0b429" }} />
            <p className="text-xs font-semibold text-white truncate">
              Save unlocked matches + get live WhatsApp updates — free fan account
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowRegForm(true)}
              className="text-xs font-black px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: "#f0b429", color: "#0a1a0f" }}
            >
              Join Free
            </button>
            <button onClick={() => setShowRegBanner(false)} style={{ color: "rgba(255,255,255,0.3)" }}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Hero strip ───────────────────────────────────────────────────── */}
      <div className="text-center pt-8 pb-6 px-4">
        <div className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-3" style={{ backgroundColor: "rgba(240,180,41,0.15)", color: "#f0b429" }}>
          FIFA World Cup 2026 · USA · Canada · Mexico
        </div>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mb-2">
          Live Scores · AI Commentary
        </h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>
          Follow every match. Unlock live AI audio commentary. Discover the next generation of talent.
        </p>
        <div className="flex flex-wrap justify-center gap-2.5 mt-5">
          {PERKS.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.48)" }}
            >
              <Icon size={11} style={{ color: "#f0b429" }} /> {text}
            </div>
          ))}
        </div>
      </div>

      {/* ── 3-column layout ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-3 pb-16">
        <div className="flex gap-3 items-start">

          {/* ── LEFT: Schedule + BRONZE ad ─────────────────────────────── */}
          <div className="hidden lg:flex flex-col gap-3 w-64 xl:w-72 shrink-0">
            <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.2)" }}>
              Group Stage
            </div>
            <div className="flex flex-col gap-1.5 max-h-[calc(100vh-200px)] overflow-y-auto pr-1 scrollbar-thin">
              {groups.map((group) => (
                <div key={group}>
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1 ml-1" style={{ color: "rgba(255,255,255,0.18)" }}>
                    Group {group}
                  </p>
                  {matches.filter(m => m.group === group).map((m) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      selected={selected.id === m.id}
                      unlocked={unlockedMatches.includes(m.id)}
                      onSelect={setSelected}
                      onUnlock={setPayMatch}
                    />
                  ))}
                </div>
              ))}
            </div>
            <AdBanner tier="BRONZE" />
          </div>

          {/* ── CENTER: Scoreboard + Pitch + Commentary + Highlights ────── */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">

            {/* Scoreboard */}
            <Scoreboard
              match={selected}
              unlocked={unlockedMatches.includes(selected.id)}
              onUnlock={setPayMatch}
            />

            {/* Football pitch canvas */}
            <FootballPitch match={selected} />

            {/* AI Commentary */}
            <AICommentary match={selected} />

            {/* Match Highlights (only for live or finished matches) */}
            {(selected.status === "live" || selected.status === "finished") && (
              <MatchHighlights matchId={selected.id} />
            )}

            {/* Mobile-only: match schedule */}
            <div className="lg:hidden">
              <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.2)" }}>
                All Matches
              </p>
              <div className="flex flex-col gap-1.5">
                {matches.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    selected={selected.id === m.id}
                    unlocked={unlockedMatches.includes(m.id)}
                    onSelect={setSelected}
                    onUnlock={setPayMatch}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: GOLD + SILVER ads ────────────────────────────────── */}
          <div className="hidden xl:flex flex-col gap-3 w-56 shrink-0">
            <AdBanner tier="GOLD" />
            <AdBanner tier="SILVER" />
            {/* Quick stats panel */}
            <div className="rounded-xl p-4" style={{ backgroundColor: "#0d1a0f", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.2)" }}>
                Quick Stats
              </p>
              <div className="space-y-2">
                {[
                  { label: "Matches played",  value: matches.filter(m => m.status === "finished").length.toString() },
                  { label: "Live now",        value: matches.filter(m => m.status === "live").length.toString() },
                  { label: "Upcoming",        value: matches.filter(m => m.status === "upcoming").length.toString() },
                  { label: "Audio unlocked",  value: `${unlockedMatches.length}/${matches.length}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.28)" }}>{label}</span>
                    <span className="text-xs font-black text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Discover talent CTA */}
            <Link
              href="/talent-database"
              className="rounded-xl p-4 block transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#1a3a20", border: "1px solid rgba(240,180,41,0.2)" }}
            >
              <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "#f0b429" }}>Discover Talent</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Find the next Zimbabwean football star</p>
              <div className="flex items-center gap-1 mt-2 text-[10px] font-bold" style={{ color: "#f0b429" }}>
                Explore <ChevronRight size={10} />
              </div>
            </Link>
          </div>

        </div>
      </div>

      {/* ── Registration modal ──────────────────────────────────────────── */}
      {showRegForm && !user && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.9)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowRegForm(false); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 relative"
            style={{ backgroundColor: "#111f14", border: "1px solid rgba(240,180,41,0.15)" }}
          >
            <button
              onClick={() => setShowRegForm(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              <X size={18} />
            </button>

            <h2 className="text-lg font-black text-white mb-1">Join as a Fan</h2>
            <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.32)" }}>
              Free account. Save unlocked matches + get live updates. Takes 30 seconds.
            </p>

            {regError && (
              <div className="mb-4 p-3 rounded-xl text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                {regError}
              </div>
            )}

            <div className="space-y-4">
              {/* Full name */}
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Full Name</label>
                <input
                  type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Tendai Musona"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  style={{ backgroundColor: "#1a3a20", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Country</label>
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
                        color:           contactType === t ? "#0a1a0f" : "rgba(255,255,255,0.45)",
                      }}
                    >
                      {t === "phone" ? "Phone Number" : "Email"}
                    </button>
                  ))}
                </div>
                {contactType === "phone" ? (
                  <>
                    <input
                      type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+263 77 123 4567"
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      style={{ backgroundColor: "#1a3a20", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                    <p className="text-xs mt-1.5" style={{ color: "rgba(240,180,41,0.55)" }}>
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
                <label className="block text-xs font-bold mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Password</label>
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
                  color:           canSubmit && !isSubmitting ? "#0a1a0f" : "rgba(255,255,255,0.22)",
                  cursor:          canSubmit && !isSubmitting ? "pointer"  : "not-allowed",
                }}
              >
                {isSubmitting
                  ? <><Loader2 size={16} className="animate-spin" /> Creating account...</>
                  : <><CheckCircle size={16} /> Join & Access Matches</>
                }
              </button>
            </div>

            <p className="text-center text-xs mt-5" style={{ color: "rgba(255,255,255,0.22)" }}>
              Already have an account?{" "}
              <Link href="/login" className="font-bold hover:underline" style={{ color: "rgba(240,180,41,0.55)" }}>
                Sign in
              </Link>
            </p>
            <p className="text-center text-xs mt-2">
              <Link href="/register" className="hover:underline" style={{ color: "rgba(255,255,255,0.2)" }}>
                Not a fan? Register as Player, Coach or Scout
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* ── Payment modal ────────────────────────────────────────────────── */}
      {payMatch && (
        <PaymentModal
          match={payMatch}
          onClose={() => setPayMatch(null)}
          onUnlocked={handleUnlocked}
          userName={user?.name ?? ""}
        />
      )}

    </div>
  );
}
