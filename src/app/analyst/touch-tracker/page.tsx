"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Activity, Play, Pause, Square, Zap, BarChart2, Users, ChevronRight } from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Touch {
  id: string;
  team: "home" | "away";
  num: number; // 1–11 starters, 12–16 = S1–S5 subs
  ts: number;  // ms from match start
  min: number;
  sec: number;
  half: 1 | 2;
}

interface PassLink {
  from: number;
  to: number;
  team: "home" | "away";
  quick: boolean; // <6 s = players close together
}

interface ZoneEvent {
  ts: number;
  zone: "home_attack" | "home_defend" | "midfield" | "unclear";
  description: string;
}

interface MatchStats {
  touchCounts: Record<string, number>;       // "home_6" → 15
  passLinks: PassLink[];
  proximityScores: Record<string, number>;   // "home_6_home_2" → 0.82
  zoneEvents: ZoneEvent[];
  dominantZone: string;
  suggestedFormation: { home: string; away: string };
}

type Phase = "setup" | "live" | "paused" | "halftime" | "ended";
type PlayerRole = "GK" | "DEF" | "MID" | "FWD";

const HOME_STARTERS = [1,2,3,4,5,6,7,8,9,10,11];
const AWAY_STARTERS = [1,2,3,4,5,6,7,8,9,10,11];
const SUBS = [1,2,3,4,5];

const STORAGE_KEY = "gs_touch_tracker";

const ROLE_COLORS: Record<PlayerRole, string> = {
  GK:  "bg-amber-400 text-black",
  DEF: "bg-blue-500 text-white",
  MID: "bg-green-600 text-white",
  FWD: "bg-red-500 text-white",
};

const ROLE_CYCLE: PlayerRole[] = ["GK", "DEF", "MID", "FWD"];

const FORMATION_PRESETS: Record<string, Record<number, PlayerRole>> = {
  "4-4-2": { 1:"GK", 2:"DEF", 3:"DEF", 4:"DEF", 5:"DEF", 6:"MID", 7:"MID", 8:"MID", 9:"MID", 10:"FWD", 11:"FWD" },
  "4-3-3": { 1:"GK", 2:"DEF", 3:"DEF", 4:"DEF", 5:"DEF", 6:"MID", 7:"MID", 8:"MID", 9:"FWD", 10:"FWD", 11:"FWD" },
  "3-5-2": { 1:"GK", 2:"DEF", 3:"DEF", 4:"DEF", 5:"MID", 6:"MID", 7:"MID", 8:"MID", 9:"MID", 10:"FWD", 11:"FWD" },
  "4-2-3-1": { 1:"GK", 2:"DEF", 3:"DEF", 4:"DEF", 5:"DEF", 6:"MID", 7:"MID", 8:"MID", 9:"MID", 10:"MID", 11:"FWD" },
};

function cycleRole(r: PlayerRole): PlayerRole {
  return ROLE_CYCLE[(ROLE_CYCLE.indexOf(r) + 1) % ROLE_CYCLE.length];
}

// ─── Analysis ─────────────────────────────────────────────────────────────────

function computeStats(touches: Touch[]): MatchStats {
  const touchCounts: Record<string, number> = {};
  const passLinks: PassLink[] = [];
  const proximityMap: Record<string, number[]> = {};
  const zoneEvents: ZoneEvent[] = [];

  touches.forEach((t) => {
    const key = `${t.team}_${t.num}`;
    touchCounts[key] = (touchCounts[key] ?? 0) + 1;
  });

  for (let i = 1; i < touches.length; i++) {
    const prev = touches[i - 1];
    const curr = touches[i];
    const dt = curr.ts - prev.ts;

    if (prev.team === curr.team && dt < 30_000) {
      const quick = dt < 6_000;
      passLinks.push({ from: prev.num, to: curr.num, team: curr.team, quick });

      const pairKey = `${curr.team}_${Math.min(prev.num, curr.num)}_${curr.team}_${Math.max(prev.num, curr.num)}`;
      if (!proximityMap[pairKey]) proximityMap[pairKey] = [];
      proximityMap[pairKey].push(quick ? 1 : 0.3);
    }

    // Turnover + zone inference
    if (prev.team !== curr.team && dt < 8_000) {
      const homeNum = prev.team === "home" ? prev.num : curr.num;
      const awayNum = prev.team === "away" ? prev.num : curr.num;
      const homeHasBall = prev.team === "home";

      let zone: Exclude<ZoneEvent["zone"], "unclear"> | null = null;
      let description = "";

      if (homeHasBall) {
        if (homeNum >= 7 && awayNum <= 5) {
          zone = "home_attack";
          description = `Home #${homeNum} → Away #${awayNum} — Home likely in final third`;
        } else if (homeNum <= 5 && awayNum >= 7) {
          zone = "home_defend";
          description = `Home #${homeNum} → Away #${awayNum} — Home likely defending deep`;
        } else {
          zone = "midfield";
          description = `Turnover in midfield area`;
        }
      } else {
        if (awayNum >= 7 && homeNum <= 5) {
          zone = "home_defend";
          description = `Away #${awayNum} → Home #${homeNum} — Away pressing home's box`;
        } else if (awayNum <= 5 && homeNum >= 7) {
          zone = "home_attack";
          description = `Away #${awayNum} → Home #${homeNum} — Away defending deep`;
        } else {
          zone = "midfield";
          description = `Turnover in midfield area`;
        }
      }

      if (zone !== null) {
        zoneEvents.push({ ts: curr.ts, zone, description });
      }
    }
  }

  // Proximity scores
  const proximityScores: Record<string, number> = {};
  Object.entries(proximityMap).forEach(([key, vals]) => {
    proximityScores[key] = vals.reduce((a, b) => a + b, 0) / vals.length;
  });

  // Dominant zone
  const zoneCounts = { home_attack: 0, home_defend: 0, midfield: 0 };
  zoneEvents.forEach((z) => {
    if (z.zone !== "unclear") zoneCounts[z.zone]++;
  });
  const dominantZone = Object.entries(zoneCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "midfield";

  // Formation suggestion (simple heuristic from touch distribution)
  const homeTouches = Object.entries(touchCounts)
    .filter(([k]) => k.startsWith("home_"))
    .sort((a, b) => b[1] - a[1]);

  const suggestedFormation = {
    home: homeTouches.length >= 11 ? "4-3-3" : "4-4-2",
    away: "4-4-2",
  };

  return { touchCounts, passLinks, proximityScores, zoneEvents, dominantZone, suggestedFormation };
}

function buildAiPrompt(
  stats: MatchStats,
  touches: Touch[],
  homeTeam: string,
  awayTeam: string,
  elapsed: number,
  homeRoles: Record<number, PlayerRole>,
  awayRoles: Record<number, PlayerRole>,
): string {
  const min = Math.floor(elapsed / 60000);

  const topHome = Object.entries(stats.touchCounts)
    .filter(([k]) => k.startsWith("home_"))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, v]) => {
      const num = parseInt(k.split("_")[1]);
      const role = num <= 11 ? (homeRoles[num] ?? "?") : `Sub`;
      return `#${num} ${role} (${v} touches)`;
    })
    .join(", ");

  const topAway = Object.entries(stats.touchCounts)
    .filter(([k]) => k.startsWith("away_"))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, v]) => {
      const num = parseInt(k.split("_")[1]);
      const role = num <= 11 ? (awayRoles[num] ?? "?") : `Sub`;
      return `#${num} ${role} (${v} touches)`;
    })
    .join(", ");

  const homeFormation = Object.entries(homeRoles)
    .map(([n, r]) => `#${n}=${r}`)
    .join(", ");
  const awayFormation = Object.entries(awayRoles)
    .map(([n, r]) => `#${n}=${r}`)
    .join(", ");

  const quickLinks = stats.passLinks.filter((p) => p.quick).length;
  const totalLinks = stats.passLinks.length;
  const pct = totalLinks > 0 ? Math.round((quickLinks / totalLinks) * 100) : 0;

  const zones = stats.zoneEvents.slice(-10).map((z) => z.description).join("\n");

  // Half-by-half breakdown
  const h1 = touches.filter((t) => t.half === 1);
  const h2 = touches.filter((t) => t.half === 2);
  const hasHalves = h1.length > 0 && h2.length > 0;

  const halfSummary = hasHalves ? `
1st Half: ${h1.filter(t=>t.team==="home").length} home touches, ${h1.filter(t=>t.team==="away").length} away touches
2nd Half: ${h2.filter(t=>t.team==="home").length} home touches, ${h2.filter(t=>t.team==="away").length} away touches
Momentum shift: ${h2.filter(t=>t.team==="home").length > h1.filter(t=>t.team==="home").length ? homeTeam : awayTeam} dominated the second half by touch count.` : "";

  return `You are a tactical football analyst on the Grassroots Sport platform (Zimbabwe).

Match: ${homeTeam} vs ${awayTeam}
Time elapsed: ${min} minutes
Total touches logged: ${touches.length}

HOME assigned roles: ${homeFormation || "not set"}
HOME key players by touches: ${topHome || "insufficient data"}

AWAY assigned roles: ${awayFormation || "not set"}
AWAY key players by touches: ${topAway || "insufficient data"}

Passing proximity: ${pct}% of consecutive same-team touches happened within 6 seconds (suggesting close player positioning).
${halfSummary}
Recent zone inferences from turnovers:
${zones || "No clear zone data yet"}

Dominant zone so far: ${stats.dominantZone.replace("_", " ")}

Based on this role + touch + proximity data, provide:
1. **Actual formation** for each team — compare assigned roles vs who is actually touching the ball most. Flag any role mismatches.
2. **Key players** controlling the game and why, referencing their role.
3. **Zone of play** — where is the game being fought?
4. **Passing channels** — which role partnerships are most active?
5. ${hasHalves ? "**Half-time comparison** — what changed between the first and second half? Who improved, who faded?" : "**Tactical recommendation** for the coaching staff right now."}

Be concise and direct. Use player numbers and roles (e.g. "#6 MID"). 3-5 sentences per section max.`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TouchTrackerPage() {
  const [homeTeam, setHomeTeam] = useState("Home");
  const [awayTeam, setAwayTeam] = useState("Away");
  const [homeRoles, setHomeRoles] = useState<Record<number, PlayerRole>>(FORMATION_PRESETS["4-4-2"]);
  const [awayRoles, setAwayRoles] = useState<Record<number, PlayerRole>>(FORMATION_PRESETS["4-4-2"]);
  const [phase, setPhase] = useState<Phase>("setup");
  const [currentHalf, setCurrentHalf] = useState<1 | 2>(1);
  const [halfBreakAt, setHalfBreakAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0); // ms
  const [touches, setTouches] = useState<Touch[]>([]);
  const [lastHome, setLastHome] = useState<Touch | null>(null);
  const [lastAway, setLastAway] = useState<Touch | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"log" | "stats" | "ai">("log");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  // Load from storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        setHomeTeam(d.homeTeam ?? "Home");
        setAwayTeam(d.awayTeam ?? "Away");
        setHomeRoles(d.homeRoles ?? FORMATION_PRESETS["4-4-2"]);
        setAwayRoles(d.awayRoles ?? FORMATION_PRESETS["4-4-2"]);
        setTouches(d.touches ?? []);
        setElapsed(d.elapsed ?? 0);
        setCurrentHalf(d.currentHalf ?? 1);
        setHalfBreakAt(d.halfBreakAt ?? null);
        if (d.phase === "live" || d.phase === "paused") setPhase("paused");
        else setPhase(d.phase ?? "setup");
      }
    } catch {}
  }, []);

  // Save to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ homeTeam, awayTeam, homeRoles, awayRoles, touches, elapsed, phase, currentHalf, halfBreakAt }));
    } catch {}
  }, [homeTeam, awayTeam, touches, elapsed, phase]);

  // Timer
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    startTimeRef.current = Date.now() - elapsed;
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 500);
  }, [elapsed]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const kickOff = () => {
    setPhase("live");
    startTimer();
  };

  const togglePause = () => {
    if (phase === "live") {
      pausedAtRef.current = elapsed;
      stopTimer();
      setPhase("paused");
    } else if (phase === "paused") {
      setPhase("live");
      startTimer();
    }
  };

  const callHalfTime = () => {
    stopTimer();
    setHalfBreakAt(elapsed);
    setPhase("halftime");
  };

  const startSecondHalf = () => {
    setCurrentHalf(2);
    setPhase("live");
    startTimer();
  };

  const endMatch = () => {
    stopTimer();
    setPhase("ended");
  };

  const resetAll = () => {
    stopTimer();
    setTouches([]);
    setElapsed(0);
    setCurrentHalf(1);
    setHalfBreakAt(null);
    setPhase("setup");
    setAiAnalysis("");
    setLastHome(null);
    setLastAway(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const logTouch = (team: "home" | "away", num: number) => {
    if (phase !== "live") return;
    const ts = elapsed;
    const min = Math.floor(ts / 60000);
    const sec = Math.floor((ts % 60000) / 1000);
    const touch: Touch = { id: Date.now().toString(), team, num, ts, min, sec, half: currentHalf };
    setTouches((prev) => [...prev, touch]);
    if (team === "home") setLastHome(touch);
    else setLastAway(touch);
  };

  const stats = computeStats(touches);

  const runAiAnalysis = async () => {
    if (touches.length < 5) return;
    setAiLoading(true);
    setActiveTab("ai");
    const prompt = buildAiPrompt(stats, touches, homeTeam, awayTeam, elapsed, homeRoles, awayRoles);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      setAiAnalysis(data.reply ?? data.error ?? "No analysis received.");
    } catch (e) {
      setAiAnalysis("AI analysis unavailable. Check your connection.");
    } finally {
      setAiLoading(false);
    }
  };

  // Format elapsed time
  const fmtTime = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const recentTouches = [...touches].reverse().slice(0, 30);

  const generateReport = () => {
    const date = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const duration = fmtTime(elapsed);

    const teamReport = (team: "home" | "away") => {
      const name = team === "home" ? homeTeam : awayTeam;
      const roles = team === "home" ? homeRoles : awayRoles;
      const total = touches.filter(t => t.team === team).length;
      const counts: Record<number, number> = {};
      touches.filter(t => t.team === team).forEach(t => { counts[t.num] = (counts[t.num] ?? 0) + 1; });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const emoji = team === "home" ? "🔵" : "🟠";
      return [
        `${emoji} ${name.toUpperCase()} — ${total} touches`,
        ...top.map(([num, cnt]) => {
          const n = parseInt(num);
          const role = n <= 11 ? (roles[n] ?? "") : "SUB";
          return `  #${num} ${role} — ${cnt} touches`;
        }),
      ].join("\n");
    };

    const hasHalves = touches.some(t => t.half === 2);
    const halfSection = hasHalves ? [
      "━━━━━━━━━━━━━━━",
      "⏱ HALF-TIME SPLIT",
      "━━━━━━━━━━━━━━━",
      `1st Half: ${homeTeam} ${touches.filter(t=>t.team==="home"&&t.half===1).length} | ${awayTeam} ${touches.filter(t=>t.team==="away"&&t.half===1).length}`,
      `2nd Half: ${homeTeam} ${touches.filter(t=>t.team==="home"&&t.half===2).length} | ${awayTeam} ${touches.filter(t=>t.team==="away"&&t.half===2).length}`,
    ].join("\n") : "";

    const aiSection = aiAnalysis
      ? ["━━━━━━━━━━━━━━━", "🤖 AI TACTICAL ANALYSIS", "━━━━━━━━━━━━━━━", aiAnalysis.slice(0, 600) + (aiAnalysis.length > 600 ? "…" : "")].join("\n")
      : "";

    const lines = [
      "🟢 MATCH REPORT",
      `${homeTeam} vs ${awayTeam}`,
      `📅 ${date} | ⏱ ${duration}`,
      "",
      "━━━━━━━━━━━━━━━",
      "📊 TOUCH SUMMARY",
      "━━━━━━━━━━━━━━━",
      teamReport("home"),
      "",
      teamReport("away"),
      "",
      ...(halfSection ? [halfSection, ""] : []),
      "━━━━━━━━━━━━━━━",
      `📍 DOMINANT ZONE: ${stats.dominantZone.replace(/_/g, " ").toUpperCase()}`,
      "━━━━━━━━━━━━━━━",
      ...(aiSection ? ["", aiSection, ""] : []),
      "Powered by Grassroots Sport 🇿🇼",
    ].join("\n");

    return lines;
  };

  const [copied, setCopied] = useState(false);

  const copyReport = async () => {
    const text = generateReport();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareWhatsApp = () => {
    const text = generateReport();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-4">

        {/* Header */}
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">
            Analyst Hub
          </p>
          <h1 className="mt-1 text-xl font-bold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            Smart Touch Tracker
          </h1>
          <p className="mt-0.5 text-xs text-white/60">
            Tap player numbers as they touch the ball — AI infers formation, zones &amp; key players
          </p>
        </div>

        {/* Setup */}
        {phase === "setup" && (
          <div className="mb-4 rounded-2xl border border-white/10 bg-card/60 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent/70">Match Setup</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase text-white/50">Home Team</label>
                <input
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent"
                  placeholder="Home team name"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase text-white/50">Away Team</label>
                <input
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent"
                  placeholder="Away team name"
                />
              </div>
            </div>
            {/* Role assignment */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                Player Roles — tap to cycle · GK / DEF / MID / FWD
              </p>
              {/* Preset formation buttons */}
              <div className="mb-3 flex flex-wrap gap-1.5">
                {Object.keys(FORMATION_PRESETS).map((f) => (
                  <button
                    key={f}
                    onClick={() => { setHomeRoles(FORMATION_PRESETS[f]); setAwayRoles(FORMATION_PRESETS[f]); }}
                    className="rounded-lg border border-white/20 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-white/60 hover:text-white hover:border-white/40 transition-colors"
                  >
                    {f}
                  </button>
                ))}
                <span className="text-[10px] text-white/30 self-center ml-1">applies to both teams</span>
              </div>
              {/* Role grids */}
              <div className="grid grid-cols-2 gap-3">
                {(["home", "away"] as const).map((team) => {
                  const roles = team === "home" ? homeRoles : awayRoles;
                  const setRoles = team === "home" ? setHomeRoles : setAwayRoles;
                  const teamName = team === "home" ? homeTeam : awayTeam;
                  const color = team === "home" ? "text-blue-400" : "text-orange-400";
                  return (
                    <div key={team}>
                      <p className={`mb-1.5 text-[10px] font-bold uppercase ${color}`}>{teamName}</p>
                      <div className="grid grid-cols-3 gap-1">
                        {HOME_STARTERS.map((n) => (
                          <button
                            key={n}
                            onClick={() => setRoles((prev) => ({ ...prev, [n]: cycleRole(prev[n] ?? "DEF") }))}
                            className="flex flex-col items-center rounded-lg border border-white/10 bg-black/30 py-1.5 hover:border-white/20 transition-colors"
                          >
                            <span className="text-[11px] font-black text-white">#{n}</span>
                            <span className={`mt-0.5 rounded px-1 text-[8px] font-black ${ROLE_COLORS[roles[n] ?? "DEF"]}`}>
                              {roles[n] ?? "DEF"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={kickOff}
              className="w-full rounded-xl bg-[#1A6B3C] py-3 text-sm font-bold text-white hover:bg-[#1A6B3C]/80 flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4" /> Kick Off
            </button>
          </div>
        )}

        {/* Timer bar */}
        {phase !== "setup" && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-card/60 p-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-black ${phase === "live" ? "bg-green-600 animate-pulse" : phase === "halftime" ? "bg-purple-600" : phase === "paused" ? "bg-amber-600" : "bg-muted"}`}>
              {phase === "live" ? "▶" : phase === "halftime" ? "½" : phase === "paused" ? "⏸" : "■"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-2xl font-black tracking-widest text-white">{fmtTime(elapsed)}</p>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${currentHalf === 1 ? "bg-blue-600 text-white" : "bg-orange-500 text-white"}`}>
                  {currentHalf === 1 ? "1ST" : "2ND"}
                </span>
              </div>
              <p className="text-[10px] text-white/50">{homeTeam} vs {awayTeam} · {touches.length} touches logged</p>
            </div>
            <div className="flex gap-1.5 flex-wrap justify-end">
              {phase === "live" && currentHalf === 1 && (
                <button onClick={callHalfTime} className="rounded-lg border border-purple-500/40 bg-purple-500/10 px-2 py-1.5 text-[10px] font-bold text-purple-300 hover:bg-purple-500/20">
                  HT
                </button>
              )}
              {phase !== "ended" && phase !== "halftime" && (
                <button onClick={togglePause} className="rounded-lg border border-white/20 px-2 py-1.5 text-xs font-bold text-white hover:bg-white/10">
                  {phase === "live" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
              )}
              {phase !== "ended" && phase !== "halftime" && (
                <button onClick={endMatch} className="rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20">
                  <Square className="h-4 w-4" />
                </button>
              )}
              <button onClick={resetAll} className="rounded-lg border border-white/10 px-2 py-1.5 text-[10px] font-bold text-white/40 hover:text-white/70">
                ↺
              </button>
            </div>
          </div>
        )}

        {/* Half-time panel */}
        {phase === "halftime" && (
          <div className="mb-4 rounded-2xl border-2 border-purple-500/40 bg-purple-500/10 p-4 space-y-4">
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-widest text-purple-400">Half Time</p>
              <p className="mt-0.5 text-[10px] text-white/50">1st half ended at {fmtTime(halfBreakAt ?? elapsed)}</p>
            </div>
            {/* 1st half summary */}
            <div className="grid grid-cols-2 gap-3">
              {(["home", "away"] as const).map((team) => {
                const h1touches = touches.filter(t => t.team === team && t.half === 1);
                const counts: Record<number, number> = {};
                h1touches.forEach(t => { counts[t.num] = (counts[t.num] ?? 0) + 1; });
                const top = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,3);
                const roles = team === "home" ? homeRoles : awayRoles;
                const color = team === "home" ? "text-blue-400 border-blue-500/20 bg-blue-500/5" : "text-orange-400 border-orange-500/20 bg-orange-500/5";
                return (
                  <div key={team} className={`rounded-xl border p-3 ${color}`}>
                    <p className="mb-1.5 text-[10px] font-bold uppercase">{team === "home" ? homeTeam : awayTeam}</p>
                    <p className="text-xl font-black text-white">{h1touches.length} <span className="text-xs font-normal text-white/40">touches</span></p>
                    <div className="mt-2 space-y-0.5">
                      {top.map(([num, cnt]) => (
                        <p key={num} className="text-[10px] text-white/60">
                          #{num} {roles[parseInt(num)] ?? ""} — {cnt}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={startSecondHalf}
              className="w-full rounded-xl bg-[#1A6B3C] py-3 text-sm font-bold text-white hover:bg-[#1A6B3C]/80 flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4" /> Start 2nd Half
            </button>
            <button onClick={endMatch} className="w-full rounded-xl border border-red-500/30 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10">
              End Match Here
            </button>
          </div>
        )}

        {/* Live touch pads */}
        {(phase === "live" || phase === "paused" || phase === "ended") && (
          <div className="mb-4 grid grid-cols-2 gap-3">

            {/* Home team */}
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-3">
              <p className="mb-2 text-center text-xs font-bold text-blue-400 uppercase tracking-widest">{homeTeam}</p>
              {lastHome && (
                <p className="mb-2 text-center text-[10px] text-blue-300/70">
                  Last: #{lastHome.num} @ {lastHome.min}:{lastHome.sec.toString().padStart(2,"0")}
                </p>
              )}
              {/* Starters */}
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {HOME_STARTERS.map((n) => {
                  const count = stats.touchCounts[`home_${n}`] ?? 0;
                  const role = homeRoles[n] ?? "DEF";
                  return (
                    <button
                      key={n}
                      onPointerDown={() => logTouch("home", n)}
                      disabled={phase !== "live"}
                      className={`relative flex flex-col items-center rounded-lg py-1.5 transition-transform active:scale-95 select-none
                        ${phase === "live" ? "bg-blue-600 text-white hover:bg-blue-500 cursor-pointer" : "bg-blue-600/40 text-white/40 cursor-default"}
                      `}
                    >
                      <span className="text-sm font-black">{n}</span>
                      <span className={`rounded px-1 text-[7px] font-black leading-tight ${phase === "live" ? ROLE_COLORS[role] : "bg-white/10 text-white/30"}`}>
                        {role}
                      </span>
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[8px] font-black text-black">
                          {count > 99 ? "99" : count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Subs */}
              <p className="mb-1 text-center text-[9px] text-blue-300/50 uppercase tracking-widest">Subs</p>
              <div className="grid grid-cols-5 gap-1">
                {SUBS.map((n) => {
                  const playerNum = 11 + n;
                  const count = stats.touchCounts[`home_${playerNum}`] ?? 0;
                  return (
                    <button
                      key={n}
                      onPointerDown={() => logTouch("home", playerNum)}
                      disabled={phase !== "live"}
                      className={`relative rounded py-1.5 text-[10px] font-bold transition-transform active:scale-95 select-none
                        ${phase === "live" ? "bg-blue-800 text-blue-200 hover:bg-blue-700 cursor-pointer" : "bg-blue-800/30 text-blue-200/30 cursor-default"}
                      `}
                    >
                      S{n}
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-400 text-[7px] font-black text-black">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Away team */}
            <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-3">
              <p className="mb-2 text-center text-xs font-bold text-orange-400 uppercase tracking-widest">{awayTeam}</p>
              {lastAway && (
                <p className="mb-2 text-center text-[10px] text-orange-300/70">
                  Last: #{lastAway.num} @ {lastAway.min}:{lastAway.sec.toString().padStart(2,"0")}
                </p>
              )}
              {/* Starters */}
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {AWAY_STARTERS.map((n) => {
                  const count = stats.touchCounts[`away_${n}`] ?? 0;
                  const role = awayRoles[n] ?? "DEF";
                  return (
                    <button
                      key={n}
                      onPointerDown={() => logTouch("away", n)}
                      disabled={phase !== "live"}
                      className={`relative flex flex-col items-center rounded-lg py-1.5 transition-transform active:scale-95 select-none
                        ${phase === "live" ? "bg-orange-600 text-white hover:bg-orange-500 cursor-pointer" : "bg-orange-600/40 text-white/40 cursor-default"}
                      `}
                    >
                      <span className="text-sm font-black">{n}</span>
                      <span className={`rounded px-1 text-[7px] font-black leading-tight ${phase === "live" ? ROLE_COLORS[role] : "bg-white/10 text-white/30"}`}>
                        {role}
                      </span>
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[8px] font-black text-black">
                          {count > 99 ? "99" : count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Subs */}
              <p className="mb-1 text-center text-[9px] text-orange-300/50 uppercase tracking-widest">Subs</p>
              <div className="grid grid-cols-5 gap-1">
                {SUBS.map((n) => {
                  const playerNum = 11 + n;
                  const count = stats.touchCounts[`away_${playerNum}`] ?? 0;
                  return (
                    <button
                      key={n}
                      onPointerDown={() => logTouch("away", playerNum)}
                      disabled={phase !== "live"}
                      className={`relative rounded py-1.5 text-[10px] font-bold transition-transform active:scale-95 select-none
                        ${phase === "live" ? "bg-orange-800 text-orange-200 hover:bg-orange-700 cursor-pointer" : "bg-orange-800/30 text-orange-200/30 cursor-default"}
                      `}
                    >
                      S{n}
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-400 text-[7px] font-black text-black">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* AI trigger + share buttons */}
        {touches.length >= 5 && phase !== "setup" && (
          <div className="mb-4 space-y-2">
            <button
              onClick={runAiAnalysis}
              disabled={aiLoading}
              className="w-full rounded-xl border border-[#f0b429]/40 bg-[#f0b429]/10 py-3 text-sm font-bold text-[#f0b429] hover:bg-[#f0b429]/20 flex items-center justify-center gap-2 transition-colors"
            >
              <Zap className="h-4 w-4" />
              {aiLoading ? "Analysing…" : "Run AI Tactical Analysis"}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={shareWhatsApp}
                className="rounded-xl border border-green-500/40 bg-green-500/10 py-2.5 text-xs font-bold text-green-400 hover:bg-green-500/20 flex items-center justify-center gap-1.5 transition-colors"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                Share on WhatsApp
              </button>
              <button
                onClick={copyReport}
                className="rounded-xl border border-white/20 bg-white/5 py-2.5 text-xs font-bold text-white/70 hover:bg-white/10 flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? "✓ Copied!" : "📋 Copy Report"}
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        {touches.length > 0 && (
          <>
            <div className="mb-3 flex gap-1 rounded-xl border border-white/10 bg-card/40 p-1">
              {(["log", "stats", "ai"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold capitalize transition-colors ${activeTab === t ? "bg-accent text-black" : "text-white/50 hover:text-white"}`}
                >
                  {t === "ai" ? "AI Analysis" : t === "stats" ? "Stats" : "Touch Log"}
                </button>
              ))}
            </div>

            {/* Touch Log */}
            {activeTab === "log" && (
              <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                {recentTouches.map((t) => (
                  <div key={t.id} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${t.team === "home" ? "bg-blue-500/10 border border-blue-500/20" : "bg-orange-500/10 border border-orange-500/20"}`}>
                    <span className={`flex items-center gap-1 w-20 text-[10px] font-black ${t.team === "home" ? "text-blue-400" : "text-orange-400"}`}>
                      {t.min.toString().padStart(2,"0")}:{t.sec.toString().padStart(2,"0")}
                      <span className="text-[7px] text-white/30">{t.half === 2 ? "2H" : "1H"}</span>
                    </span>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black ${t.team === "home" ? "bg-blue-600 text-white" : "bg-orange-600 text-white"}`}>
                      {t.num > 11 ? `S${t.num - 11}` : t.num}
                    </span>
                    <span className="text-xs text-white/60">
                      {t.team === "home" ? homeTeam : awayTeam} #{t.num > 11 ? `Sub ${t.num-11}` : t.num}
                      {t.num <= 11 && (
                        <span className={`ml-1.5 rounded px-1 text-[8px] font-black ${ROLE_COLORS[(t.team === "home" ? homeRoles : awayRoles)[t.num] ?? "DEF"]}`}>
                          {(t.team === "home" ? homeRoles : awayRoles)[t.num] ?? "DEF"}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
                {touches.length > 30 && (
                  <p className="text-center text-[10px] text-white/30 py-2">Showing last 30 of {touches.length} touches</p>
                )}
              </div>
            )}

            {/* Stats */}
            {activeTab === "stats" && (
              <div className="space-y-3">
                {/* Zone events */}
                <div className="rounded-xl border border-white/10 bg-card/40 p-3">
                  <p className="mb-2 text-xs font-bold text-white">Dominant Zone: <span className="text-accent">{stats.dominantZone.replace(/_/g, " ").toUpperCase()}</span></p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {stats.zoneEvents.slice(-8).reverse().map((z, i) => (
                      <p key={i} className="text-[10px] text-white/60">{z.description}</p>
                    ))}
                    {stats.zoneEvents.length === 0 && <p className="text-[10px] text-white/30">No turnover zones detected yet — log more touches</p>}
                  </div>
                </div>

                {/* Top touchers */}
                <div className="grid grid-cols-2 gap-3">
                  {(["home", "away"] as const).map((team) => {
                    const top = Object.entries(stats.touchCounts)
                      .filter(([k]) => k.startsWith(team + "_"))
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5);
                    return (
                      <div key={team} className={`rounded-xl border p-3 ${team === "home" ? "border-blue-500/20 bg-blue-500/5" : "border-orange-500/20 bg-orange-500/5"}`}>
                        <p className={`mb-2 text-xs font-bold ${team === "home" ? "text-blue-400" : "text-orange-400"}`}>
                          {team === "home" ? homeTeam : awayTeam}
                        </p>
                        {top.map(([k, v]) => {
                          const num = k.split("_")[1];
                          const pct = Math.round((v / (touches.filter(t => t.team === team).length || 1)) * 100);
                          return (
                            <div key={k} className="mb-1.5">
                              <div className="flex justify-between text-[10px] text-white/70 mb-0.5">
                                <span className="flex items-center gap-1">
                                  #{parseInt(num) > 11 ? `S${parseInt(num)-11}` : num}
                                  {parseInt(num) <= 11 && (
                                    <span className={`rounded px-1 text-[7px] font-black ${ROLE_COLORS[(team === "home" ? homeRoles : awayRoles)[parseInt(num)] ?? "DEF"]}`}>
                                      {(team === "home" ? homeRoles : awayRoles)[parseInt(num)] ?? "DEF"}
                                    </span>
                                  )}
                                </span>
                                <span>{v} ({pct}%)</span>
                              </div>
                              <div className="h-1 rounded-full bg-white/10">
                                <div className={`h-full rounded-full ${team === "home" ? "bg-blue-500" : "bg-orange-500"}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                        {top.length === 0 && <p className="text-[10px] text-white/30">No touches yet</p>}
                      </div>
                    );
                  })}
                </div>

                {/* Quick pass count */}
                <div className="rounded-xl border border-white/10 bg-card/40 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">Quick Passes (&lt;6s)</p>
                    <p className="text-[10px] text-white/50">Players likely in close proximity</p>
                  </div>
                  <p className="text-xl font-black text-accent">
                    {stats.passLinks.filter(p => p.quick).length}
                    <span className="text-xs text-white/40 ml-1">/ {stats.passLinks.length}</span>
                  </p>
                </div>

                {/* Half comparison */}
                {touches.some(t => t.half === 2) && (
                  <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
                    <p className="mb-2 text-xs font-bold text-purple-300">1st vs 2nd Half</p>
                    {(["home", "away"] as const).map((team) => {
                      const h1 = touches.filter(t => t.team === team && t.half === 1).length;
                      const h2 = touches.filter(t => t.team === team && t.half === 2).length;
                      const total = h1 + h2 || 1;
                      const color = team === "home" ? "bg-blue-500" : "bg-orange-500";
                      const label = team === "home" ? homeTeam : awayTeam;
                      return (
                        <div key={team} className="mb-2">
                          <div className="flex justify-between text-[10px] text-white/60 mb-1">
                            <span>{label}</span>
                            <span>1st: {h1} · 2nd: {h2} {h2 > h1 ? "↑" : h2 < h1 ? "↓" : "="}</span>
                          </div>
                          <div className="flex h-2 rounded-full overflow-hidden bg-white/10">
                            <div className={`${color} opacity-50`} style={{ width: `${(h1/total)*100}%` }} />
                            <div className={color} style={{ width: `${(h2/total)*100}%` }} />
                          </div>
                          <div className="flex justify-between text-[8px] text-white/30 mt-0.5">
                            <span>1st half</span><span>2nd half</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* AI Analysis */}
            {activeTab === "ai" && (
              <div className="rounded-xl border border-[#f0b429]/20 bg-[#f0b429]/5 p-4">
                {aiLoading && (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-3 animate-pulse rounded bg-white/10" style={{ width: `${60 + i * 8}%` }} />
                    ))}
                  </div>
                )}
                {!aiLoading && aiAnalysis && (
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-white/80">{aiAnalysis}</p>
                )}
                {!aiLoading && !aiAnalysis && (
                  <p className="text-center text-xs text-white/40 py-4">
                    Tap &quot;Run AI Tactical Analysis&quot; above to get insights from your touch data.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Hub links */}
        {touches.length >= 10 && (
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">Take this data further</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Pass Map Network", href: "/analyst/pass-map", icon: Users },
                { label: "Player Heatmaps", href: "/analyst/heatmaps", icon: BarChart2 },
                { label: "Match Map", href: "/analyst/match-map", icon: Activity },
                { label: "AI Tactical Report", href: "/analyst/tactical-report", icon: Zap },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="flex items-center gap-2 rounded-xl border border-white/10 bg-card/40 px-3 py-2.5 text-xs font-semibold text-white/70 hover:text-white hover:border-white/20 transition-colors">
                  <l.icon className="h-3.5 w-3.5 text-accent shrink-0" />
                  {l.label}
                  <ChevronRight className="ml-auto h-3 w-3" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Pause overlay hint */}
        {phase === "paused" && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center">
            <p className="text-xs font-bold text-amber-400">Match paused — tap Resume to continue logging</p>
            <button onClick={togglePause} className="mt-2 rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-black">Resume</button>
          </div>
        )}

        {/* Ended state */}
        {phase === "ended" && (
          <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-4 space-y-3">
            <p className="text-center text-xs font-bold text-green-400">
              Match ended — {touches.length} touches logged over {fmtTime(elapsed)}
            </p>
            {touches.length >= 5 && (
              <button onClick={runAiAnalysis} disabled={aiLoading} className="w-full rounded-lg bg-[#f0b429] py-2 text-xs font-bold text-black flex items-center justify-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                {aiLoading ? "Analysing…" : "Get Full AI Report"}
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={shareWhatsApp}
                className="rounded-lg border border-green-600/50 bg-green-600/15 py-2 text-xs font-bold text-green-400 hover:bg-green-600/25 flex items-center justify-center gap-1.5 transition-colors"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                WhatsApp
              </button>
              <button
                onClick={copyReport}
                className="rounded-lg border border-white/20 bg-white/5 py-2 text-xs font-bold text-white/70 hover:bg-white/10 flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? "✓ Copied!" : "📋 Copy"}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
