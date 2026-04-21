"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import {
  Brain, Play, Square, BarChart2, Network, Map,
  FileText, Download, Activity, Loader2, Target,
} from "lucide-react";
import jsPDF from "jspdf";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type Team     = "home" | "away";
type Mode     = "touch" | "shot" | "pass" | "zone";
type Phase    = "setup" | "live" | "ended";
type ResultTab = "touch" | "xg" | "pass" | "heatmap" | "report";

interface TouchEv { id: string; type: "touch"; team: Team; player: number; min: number; sec: number }
interface ShotEv  { id: string; type: "shot";  team: Team; zone: string; xg: number; isGoal: boolean; min: number }
interface PassEv  { id: string; type: "pass";  team: Team; fromPlayer: number; toPlayer: number; min: number }
interface ZoneEv  { id: string; type: "zone";  team: Team; player: number; pitchZone: string; min: number }
type MatchEvent = TouchEv | ShotEv | PassEv | ZoneEv;

/* ─── Constants ─────────────────────────────────────────────────────────── */
const XG_ZONES = [
  { id: "six_yard",     label: "Six-Yard Box", xg: 0.76 },
  { id: "penalty_spot", label: "Penalty Spot", xg: 0.45 },
  { id: "central_box",  label: "Central Box",  xg: 0.35 },
  { id: "wide_left",    label: "Wide Box L",   xg: 0.12 },
  { id: "wide_right",   label: "Wide Box R",   xg: 0.12 },
  { id: "edge_centre",  label: "Edge Centre",  xg: 0.18 },
  { id: "edge_left",    label: "Edge Left",    xg: 0.07 },
  { id: "edge_right",   label: "Edge Right",   xg: 0.07 },
  { id: "long_range",   label: "Long Range",   xg: 0.04 },
];

const PITCH_ZONES = [
  "Own Box",  "Left Def",   "Right Def",
  "Left Mid", "Centre Mid", "Right Mid",
  "Left Att", "Right Att",  "Opp Box",
];

// Approximate pitch positions for SVG pass map (x%, y%)
const PLAYER_POS: Record<number, [number, number]> = {
  1:  [50, 88],
  2:  [15, 67], 3: [35, 67], 4: [65, 67], 5: [85, 67],
  6:  [20, 44], 7: [50, 44], 8: [80, 44],
  9:  [25, 20], 10: [50, 20], 11: [75, 20],
};

const STARTERS   = [1,2,3,4,5,6,7,8,9,10,11];
const SPORTS     = ["Football","Netball","Rugby","Basketball","Cricket","Athletics"];
const FORMATIONS = ["4-3-3","4-4-2","4-2-3-1","3-5-2","5-3-2","Custom"];

const uid = () => Math.random().toString(36).slice(2, 10);
const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function MatchBrainPage() {
  const { user } = useAuthStore();

  const [phase,      setPhase]      = useState<Phase>("setup");
  const [mode,       setMode]       = useState<Mode>("touch");
  const [resultTab,  setResultTab]  = useState<ResultTab>("touch");

  const [homeTeam,   setHomeTeam]   = useState("");
  const [awayTeam,   setAwayTeam]   = useState("");
  const [sport,      setSport]      = useState("Football");
  const [formation,  setFormation]  = useState("4-3-3");

  const [events,     setEvents]     = useState<MatchEvent[]>([]);
  const [elapsed,    setElapsed]    = useState(0);
  const [activeTeam, setActiveTeam] = useState<Team>("home");
  const [passFrom,   setPassFrom]   = useState<number | null>(null);
  const [zonePlayer, setZonePlayer] = useState<number | null>(null);
  const [shotIsGoal, setShotIsGoal] = useState(false);

  const [aiReport,       setAiReport]       = useState("");
  const [reportLoading,  setReportLoading]  = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase === "live") {
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  /* ─── Derived data ──────────────────────────────────────────────────── */
  const touchEvs = useMemo(() => events.filter(e => e.type === "touch") as TouchEv[], [events]);
  const shotEvs  = useMemo(() => events.filter(e => e.type === "shot")  as ShotEv[],  [events]);
  const passEvs  = useMemo(() => events.filter(e => e.type === "pass")  as PassEv[],  [events]);
  const zoneEvs  = useMemo(() => events.filter(e => e.type === "zone")  as ZoneEv[],  [events]);

  const homeGoals = useMemo(() => shotEvs.filter(s => s.team === "home" && s.isGoal).length, [shotEvs]);
  const awayGoals = useMemo(() => shotEvs.filter(s => s.team === "away" && s.isGoal).length, [shotEvs]);
  const homeXg    = useMemo(() => shotEvs.filter(s => s.team === "home").reduce((a, s) => a + s.xg, 0), [shotEvs]);
  const awayXg    = useMemo(() => shotEvs.filter(s => s.team === "away").reduce((a, s) => a + s.xg, 0), [shotEvs]);

  const touchCounts = useMemo(() => {
    const m: Record<string, number> = {};
    touchEvs.forEach(e => { const k = `${e.team}_${e.player}`; m[k] = (m[k] ?? 0) + 1; });
    return m;
  }, [touchEvs]);

  const passMatrix = useMemo(() => {
    const m: Record<string, number> = {};
    passEvs.forEach(e => { const k = `${e.team}_${e.fromPlayer}_${e.toPlayer}`; m[k] = (m[k] ?? 0) + 1; });
    return m;
  }, [passEvs]);

  const zoneCounts = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    zoneEvs.forEach(e => {
      const k = `${e.team}_${e.player}`;
      if (!m[k]) m[k] = {};
      m[k][e.pitchZone] = (m[k][e.pitchZone] ?? 0) + 1;
    });
    return m;
  }, [zoneEvs]);

  const topConnections = useMemo(() =>
    Object.entries(passMatrix)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => {
        const [team, from, to] = key.split("_");
        return { team: team as Team, from: Number(from), to: Number(to), count };
      }),
    [passMatrix]
  );

  const min = Math.floor(elapsed / 60);

  /* ─── Event handlers ────────────────────────────────────────────────── */
  const logTouch = (team: Team, player: number) => {
    setEvents(ev => [...ev, { id: uid(), type: "touch", team, player, min, sec: elapsed % 60 }]);
  };

  const logShot = (zone: string, xg: number) => {
    setEvents(ev => [...ev, { id: uid(), type: "shot", team: activeTeam, zone, xg, isGoal: shotIsGoal, min }]);
    setShotIsGoal(false);
  };

  const logPass = (toPlayer: number) => {
    if (passFrom === null) { setPassFrom(toPlayer); return; }
    if (passFrom === toPlayer) { setPassFrom(null); return; }
    setEvents(ev => [...ev, { id: uid(), type: "pass", team: activeTeam, fromPlayer: passFrom, toPlayer, min }]);
    setPassFrom(null);
  };

  const logZone = (zone: string) => {
    if (zonePlayer === null) return;
    setEvents(ev => [...ev, { id: uid(), type: "zone", team: activeTeam, player: zonePlayer, pitchZone: zone, min }]);
    setZonePlayer(null);
  };

  const startMatch = () => {
    if (!homeTeam.trim() || !awayTeam.trim()) return;
    setPhase("live"); setElapsed(0); setEvents([]);
  };

  const endMatch = () => {
    setPhase("ended");
    try {
      const xgShots = shotEvs.map(s => ({ id: s.id, team: s.team, zone: s.zone, xg: s.xg, minute: s.min, isGoal: s.isGoal }));
      localStorage.setItem("gs_xg_shots", JSON.stringify(xgShots));
      localStorage.setItem("gs_match_brain", JSON.stringify({ homeTeam, awayTeam, sport, formation, date: new Date().toISOString(), events }));
      // append to season history
      const prev = JSON.parse(localStorage.getItem("gs_touch_tracker_history") ?? "[]") as object[];
      const entry = { homeTeam, awayTeam, homeXg, awayXg, homeGoals, awayGoals, date: new Date().toISOString() };
      localStorage.setItem("gs_touch_tracker_history", JSON.stringify([entry, ...prev].slice(0, 20)));
    } catch { /* storage unavailable */ }
  };

  const generateReport = async () => {
    setReportLoading(true);
    const topHome = STARTERS.filter(n => (touchCounts[`home_${n}`] ?? 0) > 0)
      .sort((a,b) => (touchCounts[`home_${b}`]??0) - (touchCounts[`home_${a}`]??0))
      .slice(0, 3).map(n => `#${n}(${touchCounts[`home_${n}`]})`).join(", ");
    const topAway = STARTERS.filter(n => (touchCounts[`away_${n}`] ?? 0) > 0)
      .sort((a,b) => (touchCounts[`away_${b}`]??0) - (touchCounts[`away_${a}`]??0))
      .slice(0, 3).map(n => `#${n}(${touchCounts[`away_${n}`]})`).join(", ");
    const summary = `Match: ${homeTeam} vs ${awayTeam} | Sport: ${sport} | Formation: ${formation}
Score: ${homeGoals}–${awayGoals} | xG: ${homeXg.toFixed(2)}–${awayXg.toFixed(2)}
Touches: ${touchEvs.length} | Shots: ${shotEvs.length} | Passes logged: ${passEvs.length}
Top home players by touch: ${topHome || "no data"}
Top away players by touch: ${topAway || "no data"}`;
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Generate a professional 5-section tactical match report for this grassroots Zimbabwe ${sport} match.\n\n${summary}\n\nSections:\n1. MATCH OVERVIEW\n2. POSSESSION & CONTROL\n3. ATTACKING THREAT (xG analysis)\n4. TACTICAL PATTERNS\n5. COACH RECOMMENDATIONS\n\nBe specific, data-driven, and clear. Coach audience is grassroots level.`,
          system_prompt: `You are an expert ${sport} analyst. Write a structured, professional match report using only the data provided. Never make up stats.`,
        }),
      });
      const d = await res.json() as { response?: string };
      setAiReport(d.response ?? "Report generation failed — check GROQ_API_KEY in Vercel.");
    } catch {
      setAiReport("Could not connect to AI. Check your internet connection.");
    }
    setReportLoading(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const green: [number,number,number] = [26,92,42];
    const gold:  [number,number,number] = [240,180,41];

    doc.setFillColor(...green);
    doc.rect(0, 0, 210, 42, "F");
    doc.setTextColor(...gold);
    doc.setFontSize(20); doc.setFont("helvetica","bold");
    doc.text("MATCH BRAIN REPORT", 105, 17, { align: "center" });
    doc.setFontSize(12); doc.setTextColor(255,255,255);
    doc.text(`${homeTeam}  ${homeGoals} — ${awayGoals}  ${awayTeam}`, 105, 28, { align: "center" });
    doc.setFontSize(9);
    doc.text(`xG: ${homeXg.toFixed(2)} — ${awayXg.toFixed(2)}  |  ${sport}  |  ${formation}  |  ${new Date().toLocaleDateString()}`, 105, 36, { align: "center" });

    let y = 52;
    const section = (title: string) => {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFillColor(...gold);
      doc.rect(10, y, 190, 7, "F");
      doc.setTextColor(26,42,26); doc.setFontSize(9); doc.setFont("helvetica","bold");
      doc.text(title, 14, y + 5);
      y += 12; doc.setTextColor(30,30,30); doc.setFont("helvetica","normal"); doc.setFontSize(8);
    };

    section("1. TOUCH ANALYSIS");
    const sortedHome = STARTERS.filter(n=>(touchCounts[`home_${n}`]??0)>0).sort((a,b)=>(touchCounts[`home_${b}`]??0)-(touchCounts[`home_${a}`]??0));
    const sortedAway = STARTERS.filter(n=>(touchCounts[`away_${n}`]??0)>0).sort((a,b)=>(touchCounts[`away_${b}`]??0)-(touchCounts[`away_${a}`]??0));
    doc.text(`${homeTeam}: ${sortedHome.slice(0,6).map(n=>`#${n}(${touchCounts[`home_${n}`]})`).join(", ") || "No data"}`, 12, y); y += 5;
    doc.text(`${awayTeam}: ${sortedAway.slice(0,6).map(n=>`#${n}(${touchCounts[`away_${n}`]})`).join(", ") || "No data"}`, 12, y); y += 5;
    doc.text(`Total touches: ${touchEvs.length}`, 12, y); y += 10;

    section("2. xG & SHOT ANALYSIS");
    doc.text(`${homeTeam}: ${homeGoals} goal(s) from ${homeXg.toFixed(2)} xG — ${homeGoals > homeXg ? "overperformed" : "underperformed"}`, 12, y); y += 5;
    doc.text(`${awayTeam}: ${awayGoals} goal(s) from ${awayXg.toFixed(2)} xG — ${awayGoals > awayXg ? "overperformed" : "underperformed"}`, 12, y); y += 5;
    shotEvs.forEach(s => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`  ${s.team==="home"?"H":"A"} | ${s.zone} | xG:${s.xg.toFixed(2)} | ${s.isGoal?"GOAL":"Miss"} | ${s.min}'`, 12, y); y += 4;
    });
    y += 5;

    section("3. PASSING NETWORK — TOP CONNECTIONS");
    if (topConnections.length === 0) { doc.text("No pass data recorded.", 12, y); y += 5; }
    topConnections.forEach(c => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`  ${c.team==="home"?homeTeam:awayTeam}: #${c.from} → #${c.to} (${c.count} pass${c.count!==1?"es":""})`, 12, y); y += 4;
    });
    y += 5;

    section("4. PLAYER ZONES");
    if (Object.keys(zoneCounts).length === 0) { doc.text("No zone data recorded.", 12, y); y += 5; }
    Object.entries(zoneCounts).forEach(([key, zones]) => {
      if (y > 270) { doc.addPage(); y = 20; }
      const [team, num] = key.split("_");
      const topZone = Object.entries(zones).sort((a,b)=>b[1]-a[1])[0];
      doc.text(`  ${team==="home"?homeTeam:awayTeam} #${num}: most time in ${topZone?.[0]??"—"} (${topZone?.[1]??0}x)`, 12, y); y += 4;
    });
    y += 5;

    if (aiReport) {
      section("5. AI TACTICAL REPORT");
      const lines = doc.splitTextToSize(aiReport, 186);
      (lines as string[]).forEach(line => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, 12, y); y += 4;
      });
    }

    doc.setFontSize(7); doc.setTextColor(150);
    doc.text("GrassRoots Sports — Match Brain | grassrootssports.live", 105, 290, { align: "center" });
    doc.save(`match-brain-${homeTeam.replace(/\s+/g,"-")}-vs-${awayTeam.replace(/\s+/g,"-")}.pdf`);
  };

  /* ─── Small reusables ───────────────────────────────────────────────── */
  const modeButton = (m: Mode, label: string, Icon: React.ElementType) => (
    <button
      key={m}
      onClick={() => { setMode(m); setPassFrom(null); setZonePlayer(null); }}
      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-colors ${
        mode === m ? "bg-[#f0b429] text-[#1a3a1a]" : "bg-white/10 text-white/60 hover:bg-white/20"
      }`}
    >
      <Icon className="h-3 w-3" />{label}
    </button>
  );

  const teamToggle = (
    <div className="mb-3 flex overflow-hidden rounded-xl border border-white/10">
      <button onClick={() => setActiveTeam("home")} className={`flex-1 py-1.5 text-[10px] font-black transition-colors ${activeTeam==="home" ? "bg-blue-600 text-white" : "text-white/40 hover:text-white/60"}`}>
        {homeTeam || "Home"}
      </button>
      <button onClick={() => setActiveTeam("away")} className={`flex-1 py-1.5 text-[10px] font-black transition-colors ${activeTeam==="away" ? "bg-orange-600 text-white" : "text-white/40 hover:text-white/60"}`}>
        {awayTeam || "Away"}
      </button>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════
     SETUP PHASE
  ═══════════════════════════════════════════════════════════════════════ */
  if (phase === "setup") {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="gs-watermark flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-lg">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0b429]">
                <Brain className="h-5 w-5 text-[#1a3a1a]" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-accent/70">Analyst Hub</p>
                <h1 className="text-xl font-black text-white">Match Brain</h1>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-[#f0b429]/30 bg-[#f0b429]/5 p-4 text-xs leading-relaxed text-[#f0b429]/80">
              One session. Four input modes. Six analytical outputs — all synced automatically.
              Collect touches, shots, passes and zones in real time. Full analysis is ready the moment the whistle blows.
            </div>

            <div className="space-y-4 rounded-2xl border border-white/10 bg-card/60 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Home Team</label>
                  <input value={homeTeam} onChange={e => setHomeTeam(e.target.value)} placeholder="e.g. Dynamos FC"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#f0b429]/40" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Away Team</label>
                  <input value={awayTeam} onChange={e => setAwayTeam(e.target.value)} placeholder="e.g. Caps United"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#f0b429]/40" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Sport</label>
                <div className="flex flex-wrap gap-1.5">
                  {SPORTS.map(s => (
                    <button key={s} onClick={() => setSport(s)} className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${sport===s ? "bg-[#f0b429] text-[#1a3a1a]" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>{s}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-white/50">Home Formation</label>
                <div className="flex flex-wrap gap-1.5">
                  {FORMATIONS.map(f => (
                    <button key={f} onClick={() => setFormation(f)} className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${formation===f ? "bg-[#f0b429] text-[#1a3a1a]" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>{f}</button>
                  ))}
                </div>
              </div>

              <button onClick={startMatch} disabled={!homeTeam.trim() || !awayTeam.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f0b429] py-3 text-sm font-black text-[#1a3a1a] transition-colors hover:bg-[#f0b429]/90 disabled:opacity-40">
                <Play className="h-4 w-4" /> Start Match Brain Session
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     RESULTS PHASE
  ═══════════════════════════════════════════════════════════════════════ */
  if (phase === "ended") {
    const TABS: { id: ResultTab; label: string; icon: React.ElementType }[] = [
      { id: "touch",   label: "Touch",    icon: Activity  },
      { id: "xg",      label: "xG",       icon: Target    },
      { id: "pass",    label: "Passes",   icon: Network   },
      { id: "heatmap", label: "Zones",    icon: Map       },
      { id: "report",  label: "AI Report",icon: FileText  },
    ];

    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="gs-watermark flex-1 overflow-auto p-4 lg:p-6">

          {/* Results header card */}
          <div className="mb-4 rounded-2xl border border-white/10 bg-card/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-[#f0b429]" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#f0b429]/70">Match Brain — Full Time</p>
                </div>
                <h2 className="text-lg font-black text-white">{homeTeam} vs {awayTeam}</h2>
                <p className="text-xs text-white/40">{sport} · {formation} · {new Date().toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-white">{homeGoals} — {awayGoals}</p>
                <p className="text-xs text-white/40">xG {homeXg.toFixed(2)} — {awayXg.toFixed(2)}</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[10px]">
              {([["Touches", touchEvs.length, "text-blue-400"], ["Shots", shotEvs.length, "text-red-400"], ["Passes", passEvs.length, "text-green-400"], ["Zones", zoneEvs.length, "text-purple-400"]] as const).map(([l,v,c]) => (
                <div key={l} className="rounded-lg bg-white/5 py-2">
                  <p className={`text-sm font-black ${c}`}>{v}</p>
                  <p className="text-white/40">{l}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <button onClick={exportPDF} className="flex items-center gap-1.5 rounded-xl border border-[#f0b429]/30 bg-[#f0b429]/10 px-4 py-2 text-xs font-black text-[#f0b429] transition-colors hover:bg-[#f0b429]/20">
                <Download className="h-3.5 w-3.5" /> Full PDF Export
              </button>
              <button onClick={() => { setPhase("setup"); setEvents([]); setAiReport(""); setShotIsGoal(false); }}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/50 transition-colors hover:text-white/70">
                New Match
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setResultTab(t.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black transition-colors ${resultTab===t.id ? "bg-[#f0b429] text-[#1a3a1a]" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>
                  <Icon className="h-3.5 w-3.5" />{t.label}
                </button>
              );
            })}
          </div>

          {/* ── TOUCH TAB ─────────────────────────────────────────────── */}
          {resultTab === "touch" && (
            <div className="grid grid-cols-2 gap-3">
              {(["home","away"] as Team[]).map(team => {
                const name  = team === "home" ? homeTeam : awayTeam;
                const isHome = team === "home";
                const sorted = STARTERS
                  .filter(n => (touchCounts[`${team}_${n}`] ?? 0) > 0)
                  .sort((a,b) => (touchCounts[`${team}_${b}`]??0) - (touchCounts[`${team}_${a}`]??0));
                const total = sorted.reduce((s,n) => s + (touchCounts[`${team}_${n}`]??0), 0);
                return (
                  <div key={team} className={`rounded-2xl border p-4 ${isHome ? "border-blue-500/20 bg-blue-500/5" : "border-orange-500/20 bg-orange-500/5"}`}>
                    <p className={`mb-3 text-xs font-black uppercase tracking-widest ${isHome ? "text-blue-400" : "text-orange-400"}`}>{name}</p>
                    {sorted.length === 0
                      ? <p className="text-[10px] text-white/30">No touches logged</p>
                      : sorted.map(n => {
                          const count = touchCounts[`${team}_${n}`] ?? 0;
                          const pct = total > 0 ? (count / total) * 100 : 0;
                          return (
                            <div key={n} className="mb-2">
                              <div className="mb-0.5 flex justify-between text-[10px]">
                                <span className="text-white/60">#{n}</span>
                                <span className={`font-black ${isHome ? "text-blue-400" : "text-orange-400"}`}>{count} ({pct.toFixed(0)}%)</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-white/10">
                                <div className={`h-1.5 rounded-full transition-all ${isHome ? "bg-blue-500" : "bg-orange-500"}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })
                    }
                    <p className="mt-2 text-center text-[9px] text-white/30">{total} total touches</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── XG TAB ────────────────────────────────────────────────── */}
          {resultTab === "xg" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {(["home","away"] as Team[]).map(team => {
                  const isHome = team === "home";
                  const goals = isHome ? homeGoals : awayGoals;
                  const xg    = isHome ? homeXg    : awayXg;
                  const diff  = goals - xg;
                  return (
                    <div key={team} className={`rounded-2xl border p-4 text-center ${isHome ? "border-blue-500/20 bg-blue-500/5" : "border-orange-500/20 bg-orange-500/5"}`}>
                      <p className={`text-xs font-black uppercase ${isHome ? "text-blue-400" : "text-orange-400"}`}>{isHome ? homeTeam : awayTeam}</p>
                      <p className="mt-1 text-3xl font-black text-white">{goals}</p>
                      <p className="text-[10px] text-white/40">goals scored</p>
                      <p className="mt-2 text-sm font-black text-amber-400">{xg.toFixed(2)} xG</p>
                      <p className={`text-[10px] ${diff > 0 ? "text-green-400" : diff < 0 ? "text-red-400" : "text-white/40"}`}>
                        {diff > 0 ? `+${diff.toFixed(2)} overperformed` : diff < 0 ? `${diff.toFixed(2)} underperformed` : "matched xG exactly"}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-2xl border border-white/10 bg-card/60 p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-white/50">Shot Log</p>
                {shotEvs.length === 0
                  ? <p className="text-xs text-white/30">No shots logged</p>
                  : shotEvs.map(s => (
                      <div key={s.id} className={`mb-1.5 flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] ${s.team==="home" ? "bg-blue-500/10" : "bg-orange-500/10"}`}>
                        <span className={`shrink-0 font-black ${s.team==="home" ? "text-blue-400" : "text-orange-400"}`}>{s.team==="home" ? "H" : "A"}</span>
                        <span className="flex-1 text-white/70">{s.zone}</span>
                        <span className="shrink-0 font-mono text-amber-400">{s.xg.toFixed(2)}</span>
                        <span className="shrink-0">{s.isGoal ? "⚽" : <span className="text-white/30">✗</span>}</span>
                        <span className="shrink-0 text-white/30">{s.min}&apos;</span>
                      </div>
                    ))
                }
              </div>
            </div>
          )}

          {/* ── PASS TAB ──────────────────────────────────────────────── */}
          {resultTab === "pass" && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-card/60 p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-white/50">Pass Network Map — {homeTeam}</p>
                {passEvs.length === 0
                  ? <p className="text-xs text-white/30">No passes logged</p>
                  : (
                    <svg viewBox="0 0 100 100" className="w-full rounded-xl" style={{ background: "#0d2010", maxHeight: 260 }}>
                      <rect x="5" y="5" width="90" height="90" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                      <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />
                      <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />
                      {topConnections.filter(c => c.team === "home").map((c, i) => {
                        const from = PLAYER_POS[c.from] ?? [50,50];
                        const to   = PLAYER_POS[c.to]   ?? [50,50];
                        const max  = topConnections[0]?.count ?? 1;
                        return (
                          <line key={i} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}
                            stroke="#60a5fa" strokeWidth={0.4 + (c.count / max) * 2} strokeOpacity={0.55} />
                        );
                      })}
                      {STARTERS.filter(n => (touchCounts[`home_${n}`] ?? 0) > 0).map(n => {
                        const pos = PLAYER_POS[n] ?? [50,50];
                        return (
                          <g key={n}>
                            <circle cx={pos[0]} cy={pos[1]} r="3.2" fill="#2563eb" stroke="white" strokeWidth="0.6" />
                            <text x={pos[0]} y={pos[1]+1} textAnchor="middle" fontSize="2.8" fill="white" fontWeight="bold">{n}</text>
                          </g>
                        );
                      })}
                    </svg>
                  )
                }
              </div>
              <div className="rounded-2xl border border-white/10 bg-card/60 p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-white/50">Top Connections</p>
                {topConnections.length === 0
                  ? <p className="text-xs text-white/30">No passes logged. Use Pass mode during the match.</p>
                  : topConnections.map((c, i) => (
                      <div key={i} className={`mb-1.5 flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] ${c.team==="home" ? "bg-blue-500/10" : "bg-orange-500/10"}`}>
                        <span className={`shrink-0 font-black ${c.team==="home" ? "text-blue-400" : "text-orange-400"}`}>{c.team==="home" ? homeTeam : awayTeam}</span>
                        <span className="flex-1 text-white/70">#{c.from} → #{c.to}</span>
                        <span className="shrink-0 font-black text-amber-400">{c.count}×</span>
                      </div>
                    ))
                }
              </div>
            </div>
          )}

          {/* ── HEATMAP TAB ───────────────────────────────────────────── */}
          {resultTab === "heatmap" && (
            <div className="space-y-3">
              {Object.keys(zoneCounts).length === 0
                ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                    <Map className="mx-auto mb-2 h-6 w-6 text-white/20" />
                    <p className="text-xs text-white/30">No zone data logged.</p>
                    <p className="mt-1 text-[10px] text-white/20">During a match: switch to Zone mode → select player → tap their pitch position.</p>
                  </div>
                )
                : Object.entries(zoneCounts).map(([key, zones]) => {
                    const [team, num] = key.split("_");
                    const maxZ = Math.max(...Object.values(zones), 1);
                    const isHome = team === "home";
                    return (
                      <div key={key} className={`rounded-2xl border p-4 ${isHome ? "border-blue-500/20 bg-blue-500/5" : "border-orange-500/20 bg-orange-500/5"}`}>
                        <p className={`mb-3 text-[10px] font-black uppercase tracking-widest ${isHome ? "text-blue-400" : "text-orange-400"}`}>
                          {isHome ? homeTeam : awayTeam} · Player #{num}
                        </p>
                        <div className="grid grid-cols-3 gap-1">
                          {PITCH_ZONES.map(z => {
                            const count = zones[z] ?? 0;
                            const pct   = count / maxZ;
                            const bg    = pct > 0.7 ? "bg-red-500/80" : pct > 0.4 ? "bg-amber-500/70" : pct > 0.1 ? "bg-yellow-500/50" : "bg-white/5";
                            return (
                              <div key={z} className={`rounded-lg p-2 text-center ${bg} transition-colors`}>
                                <p className="text-[8px] leading-tight text-white/70">{z}</p>
                                {count > 0 && <p className="text-xs font-black text-white">{count}</p>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          )}

          {/* ── AI REPORT TAB ─────────────────────────────────────────── */}
          {resultTab === "report" && (
            <div className="rounded-2xl border border-white/10 bg-card/60 p-5">
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-white/50">AI Tactical Report</p>
              {!aiReport && !reportLoading && (
                <div>
                  <p className="mb-3 text-xs text-white/40">AI will analyse all collected data — touches, xG, passes, zones — and generate a 5-section professional report.</p>
                  <button onClick={generateReport} className="flex items-center gap-2 rounded-xl bg-[#f0b429] px-5 py-2.5 text-sm font-black text-[#1a3a1a] transition-colors hover:bg-[#f0b429]/90">
                    <FileText className="h-4 w-4" /> Generate Report
                  </button>
                </div>
              )}
              {reportLoading && (
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <Loader2 className="h-4 w-4 animate-spin" /> Analysing match data…
                </div>
              )}
              {aiReport && (
                <div className="whitespace-pre-wrap text-xs leading-relaxed text-white/80">{aiReport}</div>
              )}
            </div>
          )}

        </main>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     LIVE PHASE
  ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-4">

        {/* Live header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-red-400">Live</p>
            </div>
            <p className="text-sm font-black text-white">{homeTeam} <span className="text-white/30">vs</span> {awayTeam}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-xl font-black text-white">{homeGoals} — {awayGoals}</p>
              <p className="font-mono text-[10px] text-white/40">{fmtTime(elapsed)}</p>
            </div>
            <button onClick={endMatch} className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-black text-red-400 transition-colors hover:bg-red-500/20">
              <Square className="h-3 w-3" /> End
            </button>
          </div>
        </div>

        {/* Mini stats bar */}
        <div className="mb-3 grid grid-cols-4 gap-1.5 text-center text-[9px]">
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 py-1.5"><p className="font-black text-blue-400">{touchEvs.length}</p><p className="text-white/30">Touches</p></div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 py-1.5"><p className="font-black text-red-400">{shotEvs.length}</p><p className="text-white/30">Shots</p></div>
          <div className="rounded-lg border border-green-500/20 bg-green-500/5 py-1.5"><p className="font-black text-green-400">{passEvs.length}</p><p className="text-white/30">Passes</p></div>
          <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 py-1.5"><p className="font-black text-purple-400">{zoneEvs.length}</p><p className="text-white/30">Zones</p></div>
        </div>

        {/* Mode switcher */}
        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
          {modeButton("touch", "Touch", Activity)}
          {modeButton("shot",  "Shot",  Target)}
          {modeButton("pass",  "Pass",  Network)}
          {modeButton("zone",  "Zone",  Map)}
        </div>

        {/* Team toggle */}
        {teamToggle}

        {/* ── TOUCH MODE ──────────────────────────────────────────────── */}
        {mode === "touch" && (
          <div>
            <div className="grid grid-cols-4 gap-1.5">
              {STARTERS.map(n => {
                const count   = touchCounts[`${activeTeam}_${n}`] ?? 0;
                const isHome  = activeTeam === "home";
                return (
                  <button key={n} onPointerDown={() => logTouch(activeTeam, n)}
                    className={`relative rounded-xl py-3.5 text-sm font-black text-white transition-transform active:scale-95 ${isHome ? "bg-blue-600 hover:bg-blue-500" : "bg-orange-600 hover:bg-orange-500"}`}>
                    {n}
                    {count > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[8px] font-black text-black">
                        {count > 99 ? "99" : count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-center text-[9px] text-white/30">Tap the player&apos;s number every time they touch the ball</p>
          </div>
        )}

        {/* ── SHOT MODE ───────────────────────────────────────────────── */}
        {mode === "shot" && (
          <div>
            <label className="mb-3 flex cursor-pointer items-center gap-2 text-xs text-white/70">
              <input type="checkbox" checked={shotIsGoal} onChange={e => setShotIsGoal(e.target.checked)} className="h-4 w-4 accent-amber-400" />
              Mark as Goal ⚽ (tick before tapping zone)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {XG_ZONES.map(z => (
                <button key={z.id} onClick={() => logShot(z.label, z.xg)}
                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-1 py-3 text-center transition-colors hover:bg-red-500/25 active:scale-95">
                  <p className="text-[10px] font-semibold text-white/70">{z.label}</p>
                  <p className="text-xs font-black text-red-400">{z.xg.toFixed(2)} xG</p>
                </button>
              ))}
            </div>
            <p className="mt-2 text-center text-[9px] text-white/30">Tap the zone the shot came from</p>
          </div>
        )}

        {/* ── PASS MODE ───────────────────────────────────────────────── */}
        {mode === "pass" && (
          <div>
            <div className="mb-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs text-white/60">
              {passFrom === null
                ? "Tap FROM player (who played the pass)"
                : <span>From <strong className="text-amber-400">#{passFrom}</strong> — now tap the TO player</span>
              }
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {STARTERS.map(n => {
                const isFrom  = passFrom === n;
                const isHome  = activeTeam === "home";
                return (
                  <button key={n} onClick={() => logPass(n)}
                    className={`relative rounded-xl py-3.5 text-sm font-black transition-all active:scale-95 ${
                      isFrom ? "bg-amber-400 text-[#1a3a1a] scale-105" : isHome ? "bg-blue-600/80 text-white hover:bg-blue-500" : "bg-orange-600/80 text-white hover:bg-orange-500"
                    }`}>
                    {n}
                    {isFrom && <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 border border-[#1a3a1a] px-1 text-[6px] font-black text-[#1a3a1a]">FROM</span>}
                  </button>
                );
              })}
            </div>
            {passEvs.length > 0 && <p className="mt-2 text-center text-[9px] text-green-400">{passEvs.length} pass{passEvs.length!==1?"es":""} logged this match</p>}
          </div>
        )}

        {/* ── ZONE MODE ───────────────────────────────────────────────── */}
        {mode === "zone" && (
          <div>
            <div className="mb-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs text-white/60">
              {zonePlayer === null
                ? "Tap a player number, then tap their position on the pitch"
                : <span>Player <strong className="text-purple-400">#{zonePlayer}</strong> — tap their current zone</span>
              }
            </div>
            {zonePlayer === null ? (
              <div className="grid grid-cols-4 gap-1.5">
                {STARTERS.map(n => (
                  <button key={n} onClick={() => setZonePlayer(n)}
                    className={`rounded-xl py-3.5 text-sm font-black text-white transition-all active:scale-95 ${activeTeam==="home" ? "bg-blue-600/80 hover:bg-blue-500" : "bg-orange-600/80 hover:bg-orange-500"}`}>
                    {n}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {PITCH_ZONES.map(z => (
                  <button key={z} onClick={() => logZone(z)}
                    className="rounded-xl border border-purple-500/20 bg-purple-500/10 px-1 py-3 text-center text-[10px] font-semibold text-white/70 transition-colors hover:bg-purple-500/25 active:scale-95">
                    {z}
                  </button>
                ))}
                <button onClick={() => setZonePlayer(null)} className="col-span-3 rounded-xl border border-white/10 py-2 text-[10px] text-white/30 hover:text-white/50">
                  Cancel
                </button>
              </div>
            )}
            {zoneEvs.length > 0 && <p className="mt-2 text-center text-[9px] text-purple-400">{zoneEvs.length} zone position{zoneEvs.length!==1?"s":""} logged</p>}
          </div>
        )}

      </main>
    </div>
  );
}
