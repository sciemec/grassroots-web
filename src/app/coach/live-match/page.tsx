"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Pause,
  StopCircle,
  Coffee,
  Loader2,
  Brain,
  Mic,
  MicOff,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";
import { MatchEvent, MatchPhase, MatchSetup } from "./_types";
import { EventLogger } from "./_components/event-logger";
import { EventLog } from "./_components/event-log";
import { LiveStatsSidebar } from "./_components/live-stats-sidebar";
import { useCommentary } from "@/lib/use-commentary";
import { SPORTS } from "@/config/sports";

/** Formations / systems per sport — omitted for individual sports */
const SPORT_FORMATIONS: Record<string, string[]> = {
  football:   ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2"],
  rugby:      ["Forward-heavy", "Wide game", "Kick-chase", "Pick-and-go"],
  netball:    ["Standard", "Fast-break", "Zone Defence"],
  basketball: ["Motion offence", "Triangle", "Zone defence", "Pick-and-roll"],
  hockey:     ["4-3-3", "3-3-4", "5-3-2"],
  volleyball: ["6-2 rotation", "5-1 rotation", "4-2 rotation"],
};

const DEFAULT_SETUP: MatchSetup = {
  homeTeam: "",
  awayTeam: "",
  sport: "football",
  formation: "4-3-3",
};

/** Setup form before match starts. */
function SetupForm({
  setup,
  onChange,
  onStart,
}: {
  setup: MatchSetup;
  onChange: (s: MatchSetup) => void;
  onStart: () => void;
}) {
  const valid = setup.homeTeam.trim() && setup.awayTeam.trim() && setup.sport;
  const formations = SPORT_FORMATIONS[setup.sport] ?? [];

  const handleSportChange = (sportKey: string) => {
    const defaultFormation = SPORT_FORMATIONS[sportKey]?.[0] ?? "";
    onChange({ ...setup, sport: sportKey, formation: defaultFormation });
  };

  const kickoffLabel: Record<string, string> = {
    football: "Kick Off", rugby: "Kick Off", cricket: "Start Match",
    athletics: "Start Race", swimming: "Start Race", tennis: "Start Match",
    netball: "Centre Pass", basketball: "Tip Off", volleyball: "Serve", hockey: "Bully Off",
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 py-8">
      <div className="text-center">
        <h2 className="text-xl font-bold">Match Setup</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select sport and enter team details
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-4">
        {/* Sport selector */}
        <div>
          <label className="mb-2 block text-sm font-medium">Sport</label>
          <div className="grid grid-cols-5 gap-1.5">
            {SPORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => handleSportChange(s.key)}
                className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-all ${
                  setup.sport === s.key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                <span className="text-xl">{s.emoji}</span>
                <span className="text-[10px] font-medium leading-tight">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Team names */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Home Team</label>
            <input
              type="text"
              value={setup.homeTeam}
              onChange={(e) => onChange({ ...setup, homeTeam: e.target.value })}
              placeholder="Your team"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Away Team</label>
            <input
              type="text"
              value={setup.awayTeam}
              onChange={(e) => onChange({ ...setup, awayTeam: e.target.value })}
              placeholder="Opponent"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Formation — only for team sports that use tactical shapes */}
        {formations.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">Formation / System</label>
            <select
              value={setup.formation}
              onChange={(e) => onChange({ ...setup, formation: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            >
              {formations.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={onStart}
          disabled={!valid}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Play className="h-4 w-4" />
          {kickoffLabel[setup.sport] ?? "Start Match"}
        </button>
      </div>
    </div>
  );
}

/** Halftime Claude analysis panel. */
function HalftimePanel({
  analysis,
  loading,
  onResume,
}: {
  analysis: string;
  loading: boolean;
  onResume: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl space-y-4 py-6">
      <div className="rounded-xl border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Coffee className="h-5 w-5 text-amber-500" />
          <h2 className="font-semibold">Half Time</h2>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Claude is building your halftime report…
            </div>
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-5/6 rounded bg-muted" />
          </div>
        ) : analysis ? (
          <div className="rounded-xl bg-muted/40 p-4 text-sm leading-relaxed">
            {analysis.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                {i < analysis.split("\n").length - 1 && <br />}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No analysis available. Start second half.
          </p>
        )}

        <button
          onClick={onResume}
          disabled={loading}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Play className="h-4 w-4" /> Start Second Half
        </button>
      </div>
    </div>
  );
}

export default function LiveMatchPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [phase, setPhase] = useState<MatchPhase>("setup");
  const [setup, setSetup] = useState<MatchSetup>(DEFAULT_SETUP);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [halftimeAnalysis, setHalftimeAnalysis] = useState("");
  const [halftimeLoading, setHalftimeLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  /** Timer tick. */
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(
        () => setElapsed((s) => s + 1),
        1000
      );
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const currentMinute = Math.floor(elapsed / 60) + 1;

  const homeScore = events.filter(
    (e) => e.type === "goal" && e.team === "home"
  ).length;
  const awayScore = events.filter(
    (e) => e.type === "goal" && e.team === "away"
  ).length;

  const commentary = useCommentary({ setup, homeScore, awayScore });

  const handleStart = () => {
    setPhase("live");
    setRunning(true);
    setElapsed(0);
    setEvents([]);
  };

  const handlePauseResume = () => setRunning((r) => !r);

  /** Calls Claude for halftime tactical adjustments. */
  const handleHalftime = useCallback(async () => {
    setRunning(false);
    setPhase("halftime");
    setHalftimeLoading(true);

    const eventSummary = events
      .map((e) => `${e.minute}' ${e.type} (${e.team})`)
      .join(", ");

    const formationLine = setup.formation ? ` Formation: ${setup.formation}.` : "";
    const message =
      `Halftime analysis. Sport: ${setup.sport}. Match: ${setup.homeTeam} vs ${setup.awayTeam}. ` +
      `Score: ${homeScore}-${awayScore}.${formationLine} ` +
      `Events so far: ${eventSummary || "none"}. ` +
      `Give tactical adjustments for the second half in 3 bullet points.`;

    try {
      const res = await api.post("/ai-coach/query", { message });
      setHalftimeAnalysis(
        res.data?.response ?? res.data?.message ?? "No analysis returned."
      );
    } catch {
      setHalftimeAnalysis(
        "Could not reach AI service. Review your first-half events and adjust your shape."
      );
    } finally {
      setHalftimeLoading(false);
    }
  }, [events, setup, homeScore, awayScore]);

  const handleResumeSecondHalf = () => {
    setPhase("live");
    setRunning(true);
  };

  /** Saves match to localStorage and ends. */
  const handleEndMatch = useCallback(() => {
    if (!confirm("End match and save to match records?")) return;
    setRunning(false);
    setPhase("ended");

    const saved = localStorage.getItem("coach_matches");
    const existing = (() => {
      try {
        return saved ? (JSON.parse(saved) as Record<string, unknown>[]) : [];
      } catch {
        console.error("[LiveMatch] Corrupted match history in localStorage — resetting.");
        localStorage.removeItem("coach_matches");
        return [];
      }
    })();

    const record = {
      id: Date.now().toString(),
      opponent: setup.awayTeam,
      venue: "home" as const,
      date: new Date().toISOString().slice(0, 10),
      our_score: homeScore,
      their_score: awayScore,
      formation: setup.formation,
      scorers: events
        .filter((e) => e.type === "goal" && e.team === "home" && e.player)
        .map((e) => `${e.player} ${e.minute}'`)
        .join(", "),
      yellow_cards: events.filter(
        (e) => e.type === "yellow_card" && e.team === "home"
      ).length,
      red_cards: events.filter(
        (e) => e.type === "red_card" && e.team === "home"
      ).length,
      notes: `Logged via Live Match. ${events.length} events recorded.`,
    };

    localStorage.setItem(
      "coach_matches",
      JSON.stringify([record, ...existing])
    );
  }, [events, setup, homeScore, awayScore]);

  const logEvent = (evt: Omit<MatchEvent, "id">) => {
    const event: MatchEvent = { ...evt, id: crypto.randomUUID() };
    setEvents((prev) => [...prev, event]);
    commentary.commentOnEvent(event);
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background dark">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden bg-zinc-950 text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/coach"
              className="rounded-lg p-1.5 hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">
                Analyst&apos;s Tablet
              </h1>
              <p className="text-xs text-zinc-400">Live Match Dashboard</p>
            </div>
          </div>

          {phase === "live" && (
            <div className="flex items-center gap-2">
              {/* AI Commentary toggle */}
              <button
                onClick={commentary.toggle}
                title={commentary.enabled ? "Turn off AI commentary" : "Turn on AI commentary"}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                  commentary.enabled
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {commentary.enabled
                  ? <><Mic className="h-3.5 w-3.5 animate-pulse" /> On Air</>
                  : <><MicOff className="h-3.5 w-3.5" /> Commentary</>
                }
              </button>

              <button
                onClick={handlePauseResume}
                className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-800 transition-colors"
              >
                {running ? (
                  <><Pause className="h-3.5 w-3.5" /> Pause</>
                ) : (
                  <><Play className="h-3.5 w-3.5" /> Resume</>
                )}
              </button>
              <button
                onClick={handleHalftime}
                className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400 hover:bg-amber-500/20 transition-colors"
              >
                <Coffee className="h-3.5 w-3.5" /> Half Time
              </button>
              <button
                onClick={handleEndMatch}
                className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <StopCircle className="h-3.5 w-3.5" /> End Match
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {phase === "setup" && (
            <SetupForm
              setup={setup}
              onChange={setSetup}
              onStart={handleStart}
            />
          )}

          {phase === "halftime" && (
            <HalftimePanel
              analysis={halftimeAnalysis}
              loading={halftimeLoading}
              onResume={handleResumeSecondHalf}
            />
          )}

          {phase === "ended" && (
            <div className="mx-auto max-w-lg py-8 text-center">
              <p className="text-xl font-bold">Match Over</p>
              <p className="mt-2 text-4xl font-black">
                {homeScore} – {awayScore}
              </p>
              <p className="mt-1 text-zinc-400 text-sm">
                {setup.homeTeam} vs {setup.awayTeam}
              </p>
              <Link
                href="/coach/matches"
                className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                View Match Records
              </Link>
            </div>
          )}

          {/* Commentary banner — shown when enabled and a line is available */}
          {phase === "live" && commentary.enabled && commentary.lastLine && (
            <div className={`mb-4 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all ${
              commentary.speaking
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                : "border-zinc-700 bg-zinc-900 text-zinc-300"
            }`}>
              <Mic className={`h-4 w-4 flex-shrink-0 ${commentary.speaking ? "text-emerald-400 animate-pulse" : "text-zinc-500"}`} />
              <span className="italic">&ldquo;{commentary.lastLine}&rdquo;</span>
            </div>
          )}

          {phase === "live" && (
            <div className="grid gap-5 lg:grid-cols-3">
              {/* Left: event logger + timeline */}
              <div className="space-y-4 lg:col-span-2">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Log Event — Minute {currentMinute}
                  </p>
                  <EventLogger
                    minute={currentMinute}
                    homeTeam={setup.homeTeam}
                    awayTeam={setup.awayTeam}
                    onLog={logEvent}
                  />
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Match Timeline
                  </p>
                  <EventLog
                    events={events}
                    homeTeam={setup.homeTeam}
                    awayTeam={setup.awayTeam}
                  />
                </div>
              </div>

              {/* Right: live stats */}
              <div>
                <LiveStatsSidebar
                  homeScore={homeScore}
                  awayScore={awayScore}
                  homeTeam={setup.homeTeam}
                  awayTeam={setup.awayTeam}
                  events={events}
                  elapsedSeconds={elapsed}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
