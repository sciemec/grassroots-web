"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Pause, Square, Zap, RotateCcw } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType = "pass" | "receive" | "shot" | "lost" | "header" | "tackle" | "dribble";
type SessionType = "rondo" | "match" | "shooting" | "fitness" | "free";
type Phase = "setup" | "live" | "paused" | "ended";

interface PlayerEvent {
  id: string;
  type: EventType;
  ts: number; // ms from session start
  min: number;
}

interface SessionRecord {
  id: string;
  date: string;
  sessionType: SessionType;
  duration: string;
  totalEvents: number;
  passRatio: number;
  actionsPerMin: number;
  aiAnalysis: string;
}

const SESSION_LABELS: Record<SessionType, string> = {
  rondo:    "Rondo",
  match:    "Match",
  shooting: "Shooting Drill",
  fitness:  "Fitness Circuit",
  free:     "Free Training",
};

const EVENT_CONFIG: Record<EventType, { label: string; emoji: string; color: string; bg: string }> = {
  pass:    { label: "Pass",      emoji: "✅", color: "text-green-400",  bg: "bg-green-500/10 border-green-500/30 hover:bg-green-500/20" },
  receive: { label: "Receive",   emoji: "📩", color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20" },
  shot:    { label: "Shot",      emoji: "🎯", color: "text-red-400",    bg: "bg-red-500/10 border-red-500/30 hover:bg-red-500/20" },
  lost:    { label: "Lost Ball", emoji: "❌", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20" },
  header:  { label: "Header",    emoji: "🗣", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20" },
  tackle:  { label: "Tackle",    emoji: "💪", color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20" },
  dribble: { label: "Dribble",   emoji: "🔄", color: "text-teal-400",   bg: "bg-teal-500/10 border-teal-500/30 hover:bg-teal-500/20" },
};

const EVENT_ORDER: EventType[] = ["pass", "receive", "shot", "lost", "header", "tackle", "dribble"];
const STORAGE_KEY = "gs_player_session_tracker";
const HISTORY_KEY = "gs_player_session_history";

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlayerSessionTrackerPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [sessionType, setSessionType] = useState<SessionType>("rondo");
  const [playerName, setPlayerName] = useState("");
  const [phase, setPhase] = useState<Phase>("setup");
  const [elapsed, setElapsed] = useState(0);
  const [events, setEvents] = useState<PlayerEvent[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [lastEvent, setLastEvent] = useState<PlayerEvent | null>(null);
  const [saved, setSaved] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    try {
      const h = localStorage.getItem(HISTORY_KEY);
      if (h) setHistory(JSON.parse(h));
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const d = JSON.parse(s);
        setSessionType(d.sessionType ?? "rondo");
        setPlayerName(d.playerName ?? "");
        setEvents(d.events ?? []);
        setElapsed(d.elapsed ?? 0);
        if (d.phase === "live" || d.phase === "paused") setPhase("paused");
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionType, playerName, events, elapsed, phase }));
    } catch {}
  }, [sessionType, playerName, events, elapsed, phase]);

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

  const kickOff = () => {
    setPhase("live");
    startTimer();
  };

  const togglePause = () => {
    if (phase === "live") { stopTimer(); setPhase("paused"); }
    else if (phase === "paused") { setPhase("live"); startTimer(); }
  };

  const endSession = () => {
    stopTimer();
    setPhase("ended");
  };

  const resetAll = () => {
    stopTimer();
    setEvents([]);
    setElapsed(0);
    setPhase("setup");
    setAiAnalysis("");
    setLastEvent(null);
    setSaved(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const logEvent = (type: EventType) => {
    if (phase !== "live") return;
    const ev: PlayerEvent = {
      id: Date.now().toString(),
      type,
      ts: elapsed,
      min: Math.floor(elapsed / 60000),
    };
    setEvents(prev => [...prev, ev]);
    setLastEvent(ev);
  };

  // ─── Stats ───────────────────────────────────────────────────────────────

  const counts = EVENT_ORDER.reduce((acc, t) => {
    acc[t] = events.filter(e => e.type === t).length;
    return acc;
  }, {} as Record<EventType, number>);

  const totalEvents = events.length;
  const durationMin = elapsed / 60000;
  const actionsPerMin = durationMin > 0 ? totalEvents / durationMin : 0;
  const passLost = counts.pass + counts.lost;
  const passRatio = passLost > 0 ? counts.pass / passLost : 0;

  // Actions per minute bucketed by minute
  const minuteBuckets: Record<number, number> = {};
  events.forEach(e => {
    minuteBuckets[e.min] = (minuteBuckets[e.min] ?? 0) + 1;
  });

  const fmtTime = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ─── AI Analysis ─────────────────────────────────────────────────────────

  const runAi = async () => {
    if (events.length < 5) return;
    setAiLoading(true);
    const name = playerName || user?.name || "the player";
    const prompt = `You are an AI football performance coach on Grassroots Sport (Zimbabwe).

Player: ${name}
Session type: ${SESSION_LABELS[sessionType]}
Duration: ${fmtTime(elapsed)}
Total actions: ${totalEvents}
Actions per minute: ${actionsPerMin.toFixed(1)}

EVENT BREAKDOWN:
${EVENT_ORDER.map(t => `  ${EVENT_CONFIG[t].label}: ${counts[t]}`).join("\n")}

Pass:Lost ball ratio: ${passRatio.toFixed(2)} (above 2.0 = good composure)
Defensive actions (tackles + headers): ${counts.tackle + counts.header}
Attacking actions (shots + dribbles): ${counts.shot + counts.dribble}

Activity by minute:
${Object.entries(minuteBuckets).map(([m, c]) => `  Min ${m}: ${c} actions`).join("\n") || "  (no data)"}

Based on this data:
1. **Performance summary** — how active and effective was ${name} in this session?
2. **Strengths** — what does the data show they do well?
3. **Key concern** — one specific area to improve with a drill recommendation.
4. **Intensity rating** — rate the session 1–10 based on actions per minute and variety.
5. **Next session focus** — one concrete goal for next time.

Keep it direct, specific to the numbers, and encouraging. Max 5 sentences total.`;

    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, stream: false }),
      });
      const data = await res.json();
      setAiAnalysis(data.response ?? "Analysis unavailable.");
      saveToHistory(data.response ?? "");
    } catch {
      setAiAnalysis("AI unavailable — check your connection.");
    } finally {
      setAiLoading(false);
    }
  };

  const saveToHistory = useCallback((analysis: string) => {
    const record: SessionRecord = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      sessionType,
      duration: fmtTime(elapsed),
      totalEvents,
      passRatio: parseFloat(passRatio.toFixed(2)),
      actionsPerMin: parseFloat(actionsPerMin.toFixed(1)),
      aiAnalysis: analysis,
    };
    setHistory(prev => {
      const updated = [record, ...prev].slice(0, 20);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, [sessionType, elapsed, totalEvents, passRatio, actionsPerMin]);

  const saveToProfile = async () => {
    if (!user) { router.push("/login"); return; }
    try {
      await api.post("/player/stats", {
        sport: user.sport ?? "football",
        match_type: sessionType,
        date: new Date().toISOString().split("T")[0],
        passes: counts.pass,
        shots: counts.shot,
        tackles: counts.tackle,
        interceptions: counts.receive,
        distance_covered: parseFloat((actionsPerMin * 0.08).toFixed(2)),
        minutes_played: Math.floor(elapsed / 60000),
        notes: aiAnalysis.slice(0, 300),
      });
      setSaved(true);
    } catch {
      setSaved(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4">

        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <Link href="/player" className="rounded-lg border border-white/10 p-1.5 hover:bg-white/5">
            <ArrowLeft className="h-4 w-4 text-white/60" />
          </Link>
          <div>
            <h1 className="text-sm font-black text-white">Session Tracker</h1>
            <p className="text-[10px] text-white/40">Friend operates · builds your training profile</p>
          </div>
          {phase !== "setup" && (
            <button onClick={resetAll} className="ml-auto rounded-lg border border-white/10 p-1.5 hover:bg-white/5">
              <RotateCcw className="h-3.5 w-3.5 text-white/40" />
            </button>
          )}
        </div>

        {/* Setup */}
        {phase === "setup" && (
          <div className="space-y-4 rounded-2xl border border-white/10 bg-card/60 p-4">
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">Player Name</p>
              <input
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder={user?.name ?? "Enter player name"}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">Session Type</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(Object.keys(SESSION_LABELS) as SessionType[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setSessionType(s)}
                    className={`rounded-xl border py-3 text-xs font-bold transition-colors ${sessionType === s ? "border-accent bg-accent/10 text-accent" : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"}`}
                  >
                    {SESSION_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/3 p-3">
              <p className="text-[10px] font-semibold text-white/40 mb-1">How to use</p>
              <p className="text-[10px] text-white/30 leading-relaxed">
                Give your phone to a friend. Every time you perform an action during the session, they tap the matching button. The AI analyses your movement pattern and builds your training profile.
              </p>
            </div>

            <button
              onClick={kickOff}
              className="w-full rounded-xl bg-[#1A6B3C] py-3 text-sm font-bold text-white hover:bg-[#1A6B3C]/80 flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4" /> Start Session
            </button>
          </div>
        )}

        {/* Timer bar */}
        {phase !== "setup" && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-card/60 p-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-black ${phase === "live" ? "bg-green-600 animate-pulse" : phase === "paused" ? "bg-amber-600" : "bg-muted"}`}>
              {phase === "live" ? "▶" : phase === "paused" ? "⏸" : "■"}
            </div>
            <div className="flex-1">
              <p className="text-2xl font-black tracking-widest text-white">{fmtTime(elapsed)}</p>
              <p className="text-[10px] text-white/50">{SESSION_LABELS[sessionType]} · {totalEvents} actions logged</p>
            </div>
            <div className="flex gap-1.5">
              {phase !== "ended" && (
                <button onClick={togglePause} className="rounded-lg border border-white/20 px-2 py-1.5 text-xs font-bold text-white hover:bg-white/10">
                  {phase === "live" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
              )}
              {phase !== "ended" && (
                <button onClick={endSession} className="rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20">
                  <Square className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Last action flash */}
        {lastEvent && phase === "live" && (
          <div className={`mb-3 flex items-center gap-2 rounded-xl border px-3 py-2 ${EVENT_CONFIG[lastEvent.type].bg}`}>
            <span className="text-lg">{EVENT_CONFIG[lastEvent.type].emoji}</span>
            <span className={`text-xs font-black ${EVENT_CONFIG[lastEvent.type].color}`}>
              {EVENT_CONFIG[lastEvent.type].label} logged @ {fmtTime(lastEvent.ts)}
            </span>
          </div>
        )}

        {/* Event buttons */}
        {(phase === "live" || phase === "paused") && (
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {EVENT_ORDER.map(type => {
              const cfg = EVENT_CONFIG[type];
              return (
                <button
                  key={type}
                  onPointerDown={() => logEvent(type)}
                  disabled={phase !== "live"}
                  className={`relative flex flex-col items-center rounded-2xl border py-4 transition-transform active:scale-95 select-none
                    ${phase === "live" ? cfg.bg : "border-white/5 bg-white/3 opacity-40 cursor-default"}`}
                >
                  <span className="text-2xl mb-1">{cfg.emoji}</span>
                  <span className={`text-[10px] font-black ${cfg.color}`}>{cfg.label}</span>
                  {counts[type] > 0 && (
                    <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[9px] font-black text-black">
                      {counts[type]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Live mini-stats */}
        {phase === "live" && totalEvents >= 3 && (
          <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/10 bg-card/40 p-2.5 text-center">
              <p className="text-lg font-black text-white">{actionsPerMin.toFixed(1)}</p>
              <p className="text-[9px] text-white/40">per min</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-card/40 p-2.5 text-center">
              <p className={`text-lg font-black ${passRatio >= 2 ? "text-green-400" : passRatio >= 1 ? "text-amber-400" : "text-red-400"}`}>
                {passRatio.toFixed(1)}
              </p>
              <p className="text-[9px] text-white/40">pass ratio</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-card/40 p-2.5 text-center">
              <p className="text-lg font-black text-white">{counts.tackle + counts.header}</p>
              <p className="text-[9px] text-white/40">def. actions</p>
            </div>
          </div>
        )}

        {/* Ended state */}
        {phase === "ended" && (
          <div className="space-y-4">
            {/* Summary card */}
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4">
              <p className="mb-3 text-xs font-black text-accent uppercase tracking-widest">Session Complete</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-2.5 text-center">
                  <p className="text-xl font-black text-white">{totalEvents}</p>
                  <p className="text-[9px] text-white/40">total actions</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-2.5 text-center">
                  <p className="text-xl font-black text-white">{actionsPerMin.toFixed(1)}</p>
                  <p className="text-[9px] text-white/40">actions / min</p>
                </div>
              </div>
              {/* Event breakdown bars */}
              <div className="space-y-1.5">
                {EVENT_ORDER.filter(t => counts[t] > 0).map(type => {
                  const cfg = EVENT_CONFIG[type];
                  const pct = totalEvents > 0 ? Math.round((counts[type] / totalEvents) * 100) : 0;
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className={cfg.color}>{cfg.emoji} {cfg.label}</span>
                        <span className="text-white/50">{counts[type]} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-accent/60 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Analysis */}
            {!aiAnalysis && (
              <button
                onClick={runAi}
                disabled={aiLoading}
                className="w-full rounded-xl border border-[#f0b429]/40 bg-[#f0b429]/10 py-3 text-sm font-bold text-[#f0b429] hover:bg-[#f0b429]/20 flex items-center justify-center gap-2"
              >
                <Zap className="h-4 w-4" />
                {aiLoading ? "Analysing…" : "Get AI Performance Analysis"}
              </button>
            )}

            {aiAnalysis && (
              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-purple-300">AI Coach Feedback</p>
                <p className="text-xs text-white/70 leading-relaxed whitespace-pre-line">{aiAnalysis}</p>
              </div>
            )}

            {/* Save to profile */}
            {user && !saved && (
              <button onClick={saveToProfile} className="w-full rounded-xl bg-[#1A6B3C] py-3 text-sm font-bold text-white hover:bg-[#1A6B3C]/80">
                Save to My Profile
              </button>
            )}
            {saved && (
              <p className="text-center text-xs text-green-400 font-bold">✓ Saved to your training profile</p>
            )}
            {!user && (
              <Link href="/login" className="block w-full rounded-xl border border-accent/40 py-3 text-center text-sm font-bold text-accent">
                Sign in to save this session
              </Link>
            )}

            <button onClick={resetAll} className="w-full rounded-xl border border-white/10 py-2 text-xs font-bold text-white/40 hover:text-white/70">
              Start New Session
            </button>
          </div>
        )}

        {/* History */}
        {history.length > 0 && phase === "setup" && (
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">Recent Sessions</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.map(rec => (
                <div key={rec.id} className="rounded-xl border border-white/10 bg-card/40 p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-white">{SESSION_LABELS[rec.sessionType]}</p>
                      <p className="text-[9px] text-white/40">{rec.date} · {rec.duration} · {rec.totalEvents} actions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-accent">{rec.actionsPerMin}/min</p>
                      <p className="text-[9px] text-white/40">pass ratio {rec.passRatio}</p>
                    </div>
                  </div>
                  {rec.aiAnalysis && (
                    <p className="mt-1.5 text-[10px] text-white/50 leading-relaxed line-clamp-2">{rec.aiAnalysis}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
