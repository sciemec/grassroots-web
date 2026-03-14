"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BarChart2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { PitchHeatmap, HeatmapPoint } from "@/components/analytics/pitch-heatmap";
import { DefensiveAlerts } from "@/components/analytics/defensive-alerts";

interface MatchRecord {
  id: string;
  opponent: string;
  venue: "home" | "away" | "neutral";
  date: string;
  our_score: number;
  their_score: number;
  formation: string;
  scorers: string;
  yellow_cards: number;
  red_cards: number;
  notes: string;
}

type Outcome = "W" | "D" | "L";

function outcome(m: MatchRecord): Outcome {
  return m.our_score > m.their_score
    ? "W"
    : m.our_score === m.their_score
    ? "D"
    : "L";
}

const OUTCOME_BG: Record<Outcome, string> = {
  W: "bg-green-500/15 text-green-700",
  D: "bg-blue-500/15 text-blue-700",
  L: "bg-red-500/15 text-red-700",
};

/** Circular SVG gauge for possession percentage. */
function PossessionGauge({ pct }: { pct: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * (pct / 100);
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={130} height={130} className="-rotate-90">
        <circle
          cx={65}
          cy={65}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={10}
          className="text-muted/30"
        />
        <circle
          cx={65}
          cy={65}
          r={radius}
          fill="none"
          stroke="#22c55e"
          strokeWidth={10}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="-mt-[100px] flex h-[130px] w-[130px] flex-col items-center justify-center">
        <span className="text-3xl font-black">{pct}%</span>
        <span className="text-xs text-muted-foreground">Est. Possession</span>
      </div>
    </div>
  );
}

/** Horizontal bar for shot accuracy. */
function ShotAccuracyBar({ goalsFor, totalShots }: { goalsFor: number; totalShots: number }) {
  const pct = totalShots > 0 ? Math.round((goalsFor / totalShots) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
        <span>Shot accuracy</span>
        <span className="font-semibold text-foreground">
          {pct}% ({goalsFor}/{totalShots})
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted/40">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Parses top scorers from the scorers field of matches. */
function parseTopScorers(matches: MatchRecord[]): { name: string; goals: number }[] {
  const tally: Record<string, number> = {};
  for (const m of matches) {
    if (!m.scorers) continue;
    const names = m.scorers.split(",").map((s) => {
      const clean = s.trim().replace(/\s+\d+'?/g, "").trim();
      return clean;
    });
    for (const name of names) {
      if (name.length > 0) {
        tally[name] = (tally[name] ?? 0) + 1;
      }
    }
  }
  return Object.entries(tally)
    .map(([name, goals]) => ({ name, goals }))
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5);
}

/** Groups wins by formation and computes win percentage. */
function formationStats(matches: MatchRecord[]): { formation: string; winPct: number; played: number }[] {
  const groups: Record<string, { wins: number; played: number }> = {};
  for (const m of matches) {
    if (!groups[m.formation]) groups[m.formation] = { wins: 0, played: 0 };
    groups[m.formation].played += 1;
    if (outcome(m) === "W") groups[m.formation].wins += 1;
  }
  return Object.entries(groups)
    .map(([formation, d]) => ({
      formation,
      winPct: Math.round((d.wins / d.played) * 100),
      played: d.played,
    }))
    .sort((a, b) => b.winPct - a.winPct);
}

/** Generates heatmap points based on goals scored (more goals = hotter centre-forward zone). */
function generateAttackZonePoints(goalsFor: number): HeatmapPoint[] {
  if (goalsFor === 0) return [];
  const points: HeatmapPoint[] = [];
  const intensity = Math.min(1, goalsFor / 20);

  // Central attacking third — most activity
  points.push({ x: 50, y: 20, intensity: intensity });
  points.push({ x: 45, y: 25, intensity: intensity * 0.8 });
  points.push({ x: 55, y: 25, intensity: intensity * 0.8 });
  points.push({ x: 50, y: 15, intensity: intensity * 0.9 });

  // Wide areas if high scoring
  if (goalsFor > 5) {
    points.push({ x: 20, y: 30, intensity: intensity * 0.5 });
    points.push({ x: 80, y: 30, intensity: intensity * 0.5 });
  }
  // Midfield if very high scoring
  if (goalsFor > 10) {
    points.push({ x: 50, y: 40, intensity: intensity * 0.4 });
  }
  return points;
}

export default function StatsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [matches, setMatches] = useState<MatchRecord[]>([]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    const saved = localStorage.getItem("coach_matches");
    if (saved) {
      try {
        setMatches(JSON.parse(saved) as MatchRecord[]);
      } catch {
        // ignore parse errors
      }
    }
  }, [user, router]);

  if (!user) return null;

  const goalsFor = matches.reduce((s, m) => s + m.our_score, 0);
  const goalsAgainst = matches.reduce((s, m) => s + m.their_score, 0);
  const totalYellows = matches.reduce((s, m) => s + m.yellow_cards, 0);
  const totalReds = matches.reduce((s, m) => s + m.red_cards, 0);

  // Estimated possession: proxy based on goals ratio
  const totalGoals = goalsFor + goalsAgainst;
  const estPossession =
    totalGoals > 0 ? Math.max(30, Math.min(70, Math.round((goalsFor / totalGoals) * 100))) : 50;

  // Shot accuracy uses goalsFor and a rough estimate of 5 shots/goal
  const estimatedShots = goalsFor * 5;

  // Form streak: last 5 matches
  const last5 = matches.slice(0, 5);

  // Goals per match chart data
  const chartData = matches
    .slice()
    .reverse()
    .slice(-10)
    .map((m, i) => ({
      name: `M${i + 1}`,
      scored: m.our_score,
      conceded: m.their_score,
    }));

  const topScorers = parseTopScorers(matches);
  const formations = formationStats(matches);
  const attackPoints = generateAttackZonePoints(goalsFor);

  if (matches.length === 0) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex items-center gap-3">
            <Link href="/coach" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold">Season Stats</h1>
          </div>
          <div className="rounded-xl border border-dashed p-12 text-center">
            <BarChart2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No match data yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Log matches to see your season stats
            </p>
            <Link
              href="/coach/matches"
              className="mt-3 inline-block text-sm text-primary hover:underline"
            >
              Log a match →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/coach" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Season Stats</h1>
            <p className="text-sm text-muted-foreground">
              {matches.length} match{matches.length !== 1 ? "es" : ""} · Visual analytics
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-5 lg:col-span-2">
            {/* Goals per match bar chart */}
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold">
                Goals Scored vs Conceded (last 10)
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barGap={2}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                    }}
                  />
                  <Bar dataKey="scored" name="Goals For" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill="#22c55e" />
                    ))}
                  </Bar>
                  <Bar dataKey="conceded" name="Goals Against" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill="#ef4444" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Formation performance */}
            {formations.length > 0 && (
              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-4 text-sm font-semibold">
                  Formation Performance
                </h2>
                <div className="space-y-3">
                  {formations.map(({ formation, winPct, played }) => (
                    <div key={formation}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{formation}</span>
                        <span className="text-xs text-muted-foreground">
                          {winPct}% wins · {played} games
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted/40">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${winPct}%`,
                            background:
                              winPct >= 60
                                ? "#22c55e"
                                : winPct >= 40
                                ? "#f59e0b"
                                : "#ef4444",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attack zones heatmap */}
            <PitchHeatmap
              title="Attack Zones (based on goals scored)"
              points={attackPoints}
              width={480}
              height={300}
              team="home"
            />

            {/* Defensive alerts */}
            <DefensiveAlerts matches={matches} />
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Possession gauge */}
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold">Possession (Est.)</h2>
              <div className="flex justify-center">
                <PossessionGauge pct={estPossession} />
              </div>
            </div>

            {/* Shot accuracy */}
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 text-sm font-semibold">Shot Accuracy (Est.)</h2>
              <ShotAccuracyBar
                goalsFor={goalsFor}
                totalShots={estimatedShots}
              />
            </div>

            {/* Form streak */}
            {last5.length > 0 && (
              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-3 text-sm font-semibold">
                  Recent Form (last 5)
                </h2>
                <div className="flex gap-2">
                  {last5.map((m) => {
                    const o = outcome(m);
                    return (
                      <span
                        key={m.id}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${OUTCOME_BG[o]}`}
                      >
                        {o}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Top scorers */}
            {topScorers.length > 0 && (
              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-3 text-sm font-semibold">Top Scorers</h2>
                <div className="space-y-2">
                  {topScorers.map(({ name, goals }, i) => (
                    <div
                      key={name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                          {i + 1}
                        </span>
                        <span className="text-sm">{name}</span>
                      </div>
                      <span className="text-sm font-semibold">
                        ⚽ {goals}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cards */}
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 text-sm font-semibold">Discipline</h2>
              <div className="flex justify-around">
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-500">
                    {totalYellows}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Yellow ({matches.length > 0
                      ? (totalYellows / matches.length).toFixed(1)
                      : "0"}{" "}
                    /match)
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">
                    {totalReds}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Red ({matches.length > 0
                      ? (totalReds / matches.length).toFixed(1)
                      : "0"}{" "}
                    /match)
                  </p>
                </div>
              </div>
            </div>

            {/* Goals summary */}
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 text-sm font-semibold">Goals Summary</h2>
              <div className="flex justify-around">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">
                    {goalsFor}
                  </p>
                  <p className="text-xs text-muted-foreground">Scored</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-muted-foreground">
                    {goalsFor - goalsAgainst > 0
                      ? `+${goalsFor - goalsAgainst}`
                      : goalsFor - goalsAgainst}
                  </p>
                  <p className="text-xs text-muted-foreground">GD</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">
                    {goalsAgainst}
                  </p>
                  <p className="text-xs text-muted-foreground">Conceded</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
