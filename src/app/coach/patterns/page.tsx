"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2,
  Loader2, Brain, ChevronDown, ChevronUp, RefreshCw, Zap, Shield,
  Target, Activity, Layers,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CoachMatch {
  id: string;
  opponent: string;
  venue?: string;
  date: string;
  our_score: number;
  their_score: number;
  formation?: string;
  scorers?: string;
  yellow_cards?: number;
  red_cards?: number;
}

interface MatchEvent {
  type: string;
  minute: number;
  team: "home" | "away";
  player?: string;
}

interface MatchEventRecord {
  matchId: string;
  date: string;
  opponent: string;
  sport: string;
  events: MatchEvent[];
}

type Severity = "critical" | "warning" | "good";

interface Pattern {
  id: string;
  icon: React.ElementType;
  title: string;
  severity: Severity;
  evidence: string;
  insight: string;
  drill: {
    name: string;
    duration: string;
    description: string;
    cue: string;
  };
}

// ─── Drill prescriptions lookup ───────────────────────────────────────────────

const DRILLS: Record<string, Pattern["drill"]> = {
  late_energy: {
    name: "Ball Relay Endurance Circuit",
    duration: "20 min",
    description:
      "Split squad into 4 groups. Each group does 5-minute continuous ball relay — dribble, pass, sprint to receive — no standing still. " +
      "No rest between sets. Simulates 65–90 minute match intensity. Ball always in play.",
    cue: "FIFA principle: endurance built WITH the ball, never without it.",
  },
  poor_defense: {
    name: "Defensive Shape Rondo",
    duration: "25 min",
    description:
      "6 attackers vs 4 defenders in a 20×20m box. Defenders must win the ball and keep possession for 5 passes to score a point. " +
      "Switch roles every 5 minutes. Develops defensive communication and compact shape under pressure.",
    cue: "Focus: 'Who covers the cover?' — every defender must know their role when the ball moves.",
  },
  discipline: {
    name: "Decision Delay Drill",
    duration: "15 min",
    description:
      "Attackers vs defenders in 1v1 corridors. Defender's only rule: no contact until attacker enters the box zone. " +
      "Forces patience. Repeat any foul with a 'delayed tackle' demonstration. " +
      "Reward the defender who wins the ball cleanly with a point.",
    cue: "Cue word: 'Patience.' Shout it whenever a defender dives in early.",
  },
  low_scoring: {
    name: "Finishing under Fatigue",
    duration: "20 min",
    description:
      "Players sprint 20m with ball, then immediately finish against goalkeeper. " +
      "3 touches maximum after receiving the final pass. " +
      "Run 12 repetitions — simulates finishing at 80 minutes when legs are heavy.",
    cue: "Quality over power. 'Aim for corners — always corners.'",
  },
  formation: {
    name: "Shape Transition 3v3 Game",
    duration: "20 min",
    description:
      "Play 3v3 in a 30×20m pitch. Coach calls formation switch mid-game: '4-3-3 NOW' or '4-4-2 NOW'. " +
      "Teams must reorganise in under 10 seconds without losing possession. " +
      "Builds tactical flexibility and positional awareness.",
    cue: "No player asks 'where do I go?' — they already know before the ball arrives.",
  },
  slow_start: {
    name: "High-Press Warm-Up Game",
    duration: "15 min",
    description:
      "Start every session with 5 minutes of full-intensity pressing game — " +
      "4v4, tiny goals, team must press within 3 seconds of losing the ball. " +
      "No passive warm-up. Simulates the first 15 minutes of a match at full tempo.",
    cue: "First touch, first press. Train what you want to see in minute 1.",
  },
};

// ─── Pattern calculation ───────────────────────────────────────────────────────

function calculatePatterns(
  matches: CoachMatch[],
  eventRecords: MatchEventRecord[]
): Pattern[] {
  if (matches.length === 0) return [];

  const recent = matches.slice(0, 10);
  const wins   = recent.filter((m) => m.our_score > m.their_score).length;
  const draws  = recent.filter((m) => m.our_score === m.their_score).length;
  const losses = recent.filter((m) => m.our_score < m.their_score).length;
  const played = recent.length;

  const totalConceded = recent.reduce((s, m) => s + (m.their_score ?? 0), 0);
  const totalScored   = recent.reduce((s, m) => s + (m.our_score ?? 0), 0);
  const cleanSheets   = recent.filter((m) => (m.their_score ?? 0) === 0).length;
  const totalYellows  = recent.reduce((s, m) => s + (m.yellow_cards ?? 0), 0);
  const totalReds     = recent.reduce((s, m) => s + (m.red_cards ?? 0), 0);

  const avgConceded = totalConceded / played;
  const avgScored   = totalScored   / played;

  // Late-game energy: from detailed event records
  let lateGoalsConceded = 0;
  let earlyGoalsConceded = 0;
  eventRecords.slice(0, 10).forEach((rec) => {
    rec.events.forEach((e) => {
      if (e.type === "goal" && e.team === "away") {
        if (e.minute >= 65) lateGoalsConceded++;
        else earlyGoalsConceded++;
      }
    });
  });

  // Formation effectiveness
  const formMap: Record<string, { played: number; wins: number }> = {};
  recent.forEach((m) => {
    const f = m.formation ?? "Unknown";
    if (!formMap[f]) formMap[f] = { played: 0, wins: 0 };
    formMap[f].played++;
    if (m.our_score > m.their_score) formMap[f].wins++;
  });
  const bestFormation = Object.entries(formMap).sort(
    (a, b) => b[1].wins / b[1].played - a[1].wins / a[1].played
  )[0];
  const worstFormation = Object.entries(formMap).sort(
    (a, b) => a[1].wins / a[1].played - b[1].wins / b[1].played
  )[0];
  const hasFormationGap =
    formMap &&
    Object.keys(formMap).length >= 2 &&
    bestFormation &&
    worstFormation &&
    bestFormation[0] !== worstFormation[0];

  const patterns: Pattern[] = [];

  // ── 1. Overall Form ──────────────────────────────────────────────────────────
  const winRate = wins / played;
  patterns.push({
    id: "form",
    icon: winRate >= 0.6 ? TrendingUp : TrendingDown,
    title: "Team Form & Momentum",
    severity: winRate >= 0.6 ? "good" : winRate >= 0.4 ? "warning" : "critical",
    evidence: `Last ${played} matches: ${wins}W ${draws}D ${losses}L — ${Math.round(winRate * 100)}% win rate.`,
    insight:
      winRate >= 0.6
        ? "Strong form — your squad is building momentum. Maintain match intensity in training this week. Avoid overloading — preserve energy."
        : winRate >= 0.4
        ? "Inconsistent form. Your squad is capable but results are unpredictable. The issue is often mental, not technical — consistency of effort."
        : "Form crisis detected. Results suggest a structural or motivational problem. This week: reduce tactical complexity, rebuild confidence with small wins in training.",
    drill: winRate < 0.5 ? DRILLS.finishing ?? DRILLS.low_scoring : DRILLS.formation,
  });

  // ── 2. Defensive Solidity ────────────────────────────────────────────────────
  const cleanSheetRate = cleanSheets / played;
  patterns.push({
    id: "defense",
    icon: Shield,
    title: "Defensive Solidity",
    severity:
      avgConceded <= 1 ? "good" : avgConceded <= 2 ? "warning" : "critical",
    evidence: `Conceding ${avgConceded.toFixed(1)} goals per match. ${cleanSheets} clean sheet${cleanSheets !== 1 ? "s" : ""} in last ${played} matches (${Math.round(cleanSheetRate * 100)}%).`,
    insight:
      avgConceded <= 1
        ? "Excellent defensive record. Your defensive shape is working. Continue emphasising compact pressing triggers in training."
        : avgConceded <= 2
        ? "Leaking too many goals. Defenders are leaving gaps — likely a communication issue, not individual quality. Focus on defensive shape drills."
        : "Critical: your team is conceding heavily. Attackers are pressing incorrectly, leaving gaps behind. Defensive shape must be the number one training priority this week.",
    drill: DRILLS.poor_defense,
  });

  // ── 3. Late-Game Energy Drop ─────────────────────────────────────────────────
  const lateTotal = lateGoalsConceded + earlyGoalsConceded;
  const lateRatio = lateTotal > 0 ? lateGoalsConceded / lateTotal : null;
  const hasLatePattern = lateTotal >= 3;
  patterns.push({
    id: "energy",
    icon: Activity,
    title: "Late-Game Energy (65–90 min)",
    severity: !hasLatePattern
      ? "good"
      : lateRatio !== null && lateRatio >= 0.6
      ? "critical"
      : "warning",
    evidence: hasLatePattern
      ? `${lateGoalsConceded} of ${lateTotal} goals conceded came after minute 65 (${lateRatio !== null ? Math.round(lateRatio * 100) : 0}% of concessions are late-game).`
      : eventRecords.length === 0
      ? "No detailed match events yet. Complete matches via Live Match to unlock this pattern."
      : `${lateGoalsConceded} late goals conceded vs ${earlyGoalsConceded} early — no significant late-game pattern detected.`,
    insight:
      hasLatePattern && lateRatio !== null && lateRatio >= 0.6
        ? "Your team is losing energy after 65 minutes. This is a fitness and rotation issue. Prescribed drill focuses on ball-integrated endurance — builds match fitness without boring running circuits."
        : "Late-game energy looks stable. Continue ball-centric conditioning to maintain this standard through a full season.",
    drill: DRILLS.late_energy,
  });

  // ── 4. Discipline ────────────────────────────────────────────────────────────
  const cardsPerMatch = (totalYellows + totalReds * 3) / played;
  patterns.push({
    id: "discipline",
    icon: AlertTriangle,
    title: "Discipline & Card Control",
    severity:
      cardsPerMatch < 1 ? "good" : cardsPerMatch < 2.5 ? "warning" : "critical",
    evidence: `${totalYellows} yellow${totalYellows !== 1 ? "s" : ""} and ${totalReds} red${totalReds !== 1 ? "s" : ""} in last ${played} matches — ${(totalYellows / played).toFixed(1)} yellows per match.`,
    insight:
      cardsPerMatch < 1
        ? "Excellent discipline. Your team plays smart, clean football. This is a competitive advantage — opponents cannot frustrate you into mistakes."
        : cardsPerMatch < 2.5
        ? "Discipline is borderline. Players are fouling unnecessarily. Usually a sign of positional mistakes being covered by fouls rather than tactical positioning."
        : "Discipline is a serious problem. Excessive cards disrupt your team structure and risk suspensions. This week: Decision Delay Drill. Teach patience — the tackle is the last resort, not the first.",
    drill: DRILLS.discipline,
  });

  // ── 5. Scoring Efficiency ────────────────────────────────────────────────────
  patterns.push({
    id: "scoring",
    icon: Target,
    title: "Goal Scoring Efficiency",
    severity: avgScored >= 2 ? "good" : avgScored >= 1 ? "warning" : "critical",
    evidence: `Scoring ${avgScored.toFixed(1)} goals per match over last ${played} matches. Total: ${totalScored} goals.`,
    insight:
      avgScored >= 2
        ? "Clinical in front of goal. Your attackers are converting chances consistently. Focus on creating more chances — the finishing is already there."
        : avgScored >= 1
        ? "Scoring below potential. Your team likely creates chances but misses too many. Finishing under pressure and fatigue is the key gap to address."
        : "Struggling to score. This is either a chance-creation problem or a finishing problem (or both). The prescribed drill simulates high-fatigue finishing — the hardest condition to train.",
    drill: DRILLS.low_scoring,
  });

  // ── 6. Formation Effectiveness (only if data exists) ────────────────────────
  if (hasFormationGap) {
    const bestRate = Math.round((bestFormation[1].wins / bestFormation[1].played) * 100);
    const worstRate = Math.round((worstFormation[1].wins / worstFormation[1].played) * 100);
    patterns.push({
      id: "formation",
      icon: Layers,
      title: "Formation Effectiveness",
      severity: bestRate - worstRate >= 40 ? "warning" : "good",
      evidence: `${bestFormation[0]}: ${bestRate}% win rate (${bestFormation[1].played} matches) vs ${worstFormation[0]}: ${worstRate}% win rate (${worstFormation[1].played} matches).`,
      insight:
        bestRate - worstRate >= 40
          ? `You win significantly more in ${bestFormation[0]} than ${worstFormation[0]}. Consider committing to your strongest formation before experimenting. Shape Transition drill builds flexibility without sacrificing your best system.`
          : `Your formations show similar win rates — good tactical flexibility. Continue developing players who can function in multiple systems.`,
      drill: DRILLS.formation,
    });
  }

  return patterns;
}

// ─── Severity display ────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: "Critical",  color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30" },
  warning:  { label: "Warning",   color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/30" },
  good:     { label: "Good",      color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/30" },
};

// ─── Pattern card ─────────────────────────────────────────────────────────────

function PatternCard({ pattern }: { pattern: Pattern }) {
  const [drillOpen, setDrillOpen] = useState(false);
  const cfg = SEVERITY_CONFIG[pattern.severity];
  const Icon = pattern.icon;

  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-5`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 flex-shrink-0 ${cfg.color}`} />
          <h3 className="text-sm font-bold text-white">{pattern.title}</h3>
        </div>
        <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${cfg.color} ${cfg.bg}`}>
          {cfg.label}
        </span>
      </div>

      {/* Evidence */}
      <p className="mb-2 text-xs font-semibold text-white/60 uppercase tracking-wide">Evidence</p>
      <p className="mb-3 text-sm text-white/80">{pattern.evidence}</p>

      {/* THUTO insight */}
      <p className="mb-1 text-xs font-semibold text-white/60 uppercase tracking-wide">THUTO Analysis</p>
      <p className="mb-4 text-sm leading-relaxed text-white/90">{pattern.insight}</p>

      {/* Prescribed drill */}
      <button
        onClick={() => setDrillOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-left transition-colors hover:bg-white/10"
      >
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-[#f0b429]" />
          <span className="text-xs font-bold text-[#f0b429]">Prescribed Drill: {pattern.drill.name}</span>
        </div>
        {drillOpen ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
      </button>

      {drillOpen && (
        <div className="mt-2 rounded-xl border border-[#f0b429]/20 bg-[#f0b429]/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-[#f0b429]">{pattern.drill.name}</span>
            <span className="text-xs text-white/40">{pattern.drill.duration}</span>
          </div>
          <p className="mb-2 text-xs leading-relaxed text-white/80">{pattern.drill.description}</p>
          <p className="text-xs italic text-[#f0b429]/70">💡 {pattern.drill.cue}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StrategicPatternsPage() {
  const { user } = useAuthStore();
  const [matches, setMatches]       = useState<CoachMatch[]>([]);
  const [eventRecords, setEventRecords] = useState<MatchEventRecord[]>([]);
  const [patterns, setPatterns]     = useState<Pattern[]>([]);
  const [loading, setLoading]       = useState(true);
  const [fullAnalysis, setFullAnalysis] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    // Load localStorage data
    const localRaw = localStorage.getItem("coach_matches");
    const localMatches: CoachMatch[] = (() => {
      try { return localRaw ? JSON.parse(localRaw) : []; } catch { return []; }
    })();

    const eventsRaw = localStorage.getItem("coach_match_events");
    const localEvents: MatchEventRecord[] = (() => {
      try { return eventsRaw ? JSON.parse(eventsRaw) : []; } catch { return []; }
    })();
    setEventRecords(localEvents);

    // Try API — merge with localStorage (API is source of truth for old matches)
    api.get("/matches")
      .then((res) => {
        const _r = res.data?.data ?? res.data;
        const apiMatches: CoachMatch[] = Array.isArray(_r) ? _r : [];
        // Merge: API matches + localStorage (de-duplicate by id)
        const allIds = new Set(apiMatches.map((m) => String(m.id)));
        const merged = [...apiMatches, ...localMatches.filter((m) => !allIds.has(String(m.id)))];
        setMatches(merged);
        setPatterns(calculatePatterns(merged, localEvents));
      })
      .catch(() => {
        // Offline — use localStorage only
        setMatches(localMatches);
        setPatterns(calculatePatterns(localMatches, localEvents));
      })
      .finally(() => setLoading(false));
  }, []);

  const getFullAnalysis = async () => {
    setAnalysisLoading(true);
    setFullAnalysis("");
    try {
      const summary = patterns.map((p) =>
        `${p.title}: ${SEVERITY_CONFIG[p.severity].label} — ${p.evidence}`
      ).join("\n");

      const prompt = `You are THUTO — coaching intelligence for GrassRoots Sports Zimbabwe.

Coach: ${user?.name ?? "Coach"}
Matches analysed: ${matches.length}

PATTERN DATA:
${summary}

Generate a STRATEGIC COACHING PLAN for the next 4 weeks. Use this structure:
WEEK 1 — WEEK 4: One specific training focus per week, based on the most critical pattern above.
COMPOUNDING LOOP: Explain how fixing Pattern 1 will automatically improve Pattern 2 and 3.
ZIMBABWEAN CONTEXT: One sentence connecting this analysis to what it means for player development and recognition in Zimbabwe.

Keep it under 200 words. Be specific, direct, actionable.`;

      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await res.json();
      setFullAnalysis(data.response ?? data.answer ?? "Analysis failed — check your connection.");
    } catch {
      setFullAnalysis("Unable to generate analysis. Check your connection and try again.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const criticalCount = patterns.filter((p) => p.severity === "critical").length;
  const warningCount  = patterns.filter((p) => p.severity === "warning").length;
  const goodCount     = patterns.filter((p) => p.severity === "good").length;

  const recent10 = matches.slice(0, 10);
  const wins   = recent10.filter((m) => m.our_score > m.their_score).length;
  const losses = recent10.filter((m) => m.our_score < m.their_score).length;
  const draws  = recent10.filter((m) => m.our_score === m.their_score).length;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6">
          <Link href="/coach" className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Coach Hub
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[#f0b429]">
                Compounding Intelligence
              </p>
              <h1 className="mt-1 text-2xl font-bold text-white">Strategic Patterns</h1>
              <p className="mt-0.5 text-sm text-white/60">
                Your match data reveals recurring patterns. Fix them — your entire squad improves.
              </p>
            </div>
            <div className="flex-shrink-0 rounded-xl border border-[#f0b429]/30 bg-[#f0b429]/10 px-3 py-2 text-center">
              <p className="text-lg font-black text-[#f0b429]">{matches.length}</p>
              <p className="text-[10px] text-white/50">matches</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-[#f0b429]" />
          </div>
        ) : matches.length === 0 ? (
          /* Empty state */
          <div className="rounded-2xl border border-dashed border-white/20 p-12 text-center">
            <TrendingDown className="mx-auto mb-4 h-10 w-10 text-white/20" />
            <h3 className="mb-2 text-base font-bold text-white">No match data yet</h3>
            <p className="mb-4 text-sm text-white/50">
              Use the Live Match tool to log your next match. After 3 matches, THUTO will start detecting patterns.
            </p>
            <Link
              href="/coach/live-match"
              className="inline-flex items-center gap-2 rounded-xl bg-[#f0b429] px-5 py-2.5 text-sm font-bold text-[#1a3a1a]"
            >
              Start Live Match
            </Link>
          </div>
        ) : (
          <>
            {/* Summary row */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-6">
              {[
                { label: "Wins",     value: wins,          color: "text-green-400" },
                { label: "Draws",    value: draws,         color: "text-amber-400" },
                { label: "Losses",   value: losses,        color: "text-red-400" },
                { label: "Critical", value: criticalCount, color: "text-red-400" },
                { label: "Warning",  value: warningCount,  color: "text-amber-400" },
                { label: "Good",     value: goodCount,     color: "text-green-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl border border-white/10 bg-card/60 p-3 text-center">
                  <p className={`text-xl font-black ${color}`}>{value}</p>
                  <p className="text-[11px] text-white/40">{label}</p>
                </div>
              ))}
            </div>

            {/* Compounding loop banner */}
            <div className="mb-5 rounded-2xl border border-[#f0b429]/20 bg-gradient-to-r from-[#1a3a1f] to-[#0a1a0e] px-5 py-3">
              <p className="text-xs text-[#f0b429] font-semibold">The Compounding Loop</p>
              <p className="text-xs text-white/60 mt-0.5">
                Better coaching → better players → better results → stronger talent database → scouts find your players → Zimbabwe&apos;s gold standard grows.
              </p>
            </div>

            {/* Pattern cards */}
            <div className="mb-6 space-y-4">
              {/* Critical first */}
              {[...patterns]
                .sort((a, b) => {
                  const order: Record<Severity, number> = { critical: 0, warning: 1, good: 2 };
                  return order[a.severity] - order[b.severity];
                })
                .map((p) => <PatternCard key={p.id} pattern={p} />)}
            </div>

            {/* Full THUTO analysis */}
            <div className="rounded-2xl border border-[#6c3483]/40 bg-gradient-to-br from-[#6c3483]/30 to-[#1a2a1f]/60 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-300" />
                  <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">
                    4-Week Strategic Plan
                  </span>
                </div>
                <button
                  onClick={getFullAnalysis}
                  disabled={analysisLoading}
                  className="flex items-center gap-1.5 rounded-xl border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
                >
                  {analysisLoading
                    ? <><Loader2 className="h-3 w-3 animate-spin" /> Thinking…</>
                    : <><RefreshCw className="h-3 w-3" /> {fullAnalysis ? "Refresh" : "Generate Plan"}</>
                  }
                </button>
              </div>
              <p className="mb-4 text-xs text-white/50">
                THUTO analyses all {patterns.length} patterns and designs a 4-week plan that compounds — fixing one pattern automatically improves others.
              </p>

              {!fullAnalysis && !analysisLoading && (
                <div className="rounded-xl border border-dashed border-white/10 py-6 text-center">
                  <p className="text-xs text-white/30">Click &quot;Generate Plan&quot; to get your week-by-week strategic coaching schedule.</p>
                </div>
              )}

              {analysisLoading && (
                <div className="flex items-center justify-center gap-3 py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-300" />
                  <p className="text-sm text-white/50">THUTO is mapping your compounding strategy…</p>
                </div>
              )}

              {fullAnalysis && !analysisLoading && (
                <div className="rounded-xl bg-black/20 px-4 py-4 space-y-2">
                  {fullAnalysis.split("\n").map((line, i) => {
                    const isHeading = /^WEEK \d|^COMPOUNDING|^ZIMBABWEAN/.test(line.trim());
                    return line.trim() ? (
                      <p key={i} className={isHeading
                        ? "text-xs font-bold text-[#f0b429] uppercase tracking-wide mt-3 first:mt-0"
                        : "text-xs leading-relaxed text-white/80"
                      }>{line}</p>
                    ) : <div key={i} className="h-1" />;
                  })}
                  <p className="mt-3 text-[10px] text-white/25 border-t border-white/10 pt-2">
                    Generated by THUTO AI · {new Date().toLocaleDateString("en-ZW", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
