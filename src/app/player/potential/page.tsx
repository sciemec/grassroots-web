"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Loader2, Star, Target, Clock, ChevronUp } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { queryAI } from "@/lib/ai-query";

const POSITIONS = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"];
const SPORTS = [
  "Football", "Rugby", "Athletics", "Netball", "Basketball",
  "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey",
];

interface PotentialForm {
  age: string;
  position: string;
  current_form: string;
  sessions_per_week: string;
  years_playing: string;
  sport: string;
}

interface ParsedResult {
  currentRating: number;
  projectedPeak: number;
  peakAge: number;
  yearsToPeak: string;
  developmentAreas: string[];
  scoutReadiness: string;
  encouragement: string;
  rawText: string;
}

function parseAIResult(text: string): ParsedResult {
  const numMatch = (pattern: RegExp) => {
    const m = text.match(pattern);
    return m ? parseInt(m[1], 10) : 0;
  };
  const strMatch = (pattern: RegExp, fallback: string) => {
    const m = text.match(pattern);
    return m ? m[1].trim() : fallback;
  };

  const currentRating = numMatch(/CURRENT RATING[:\s]+(\d+)/i) || numMatch(/(\d+)\/100/i) || 60;
  const projectedPeak = numMatch(/PROJECTED PEAK[:\s]+(\d+)/i) || numMatch(/peak.*?(\d+)\/100/i) || 75;
  const peakAge = numMatch(/age\s+(\d+)/i) || 24;
  const yearsToPeak = strMatch(/YEARS TO PEAK[:\s]+([^\n]+)/i, "2-3 years");
  const scoutReadiness = strMatch(/SCOUT READINESS[:\s]+([^\n]+)/i, "6 months away");
  const encouragement = strMatch(/ENCOURAGING MESSAGE[:\s]+([^\n]+(?:\n[^\n1-9][^\n]*)*)/i, "Keep working hard — your potential is there.");

  // Extract development areas as bullet points
  const areasSection = text.match(/KEY DEVELOPMENT AREAS[:\s]+([\s\S]*?)(?:SCOUT READINESS|YEARS TO PEAK|ENCOURAGING|$)/i);
  const developmentAreas = areasSection
    ? areasSection[1]
        .split("\n")
        .map((l) => l.replace(/^[-•*\d.]\s*/, "").trim())
        .filter((l) => l.length > 5)
        .slice(0, 3)
    : ["Consistency in training", "Technical skill development", "Physical conditioning"];

  return { currentRating, projectedPeak, peakAge, yearsToPeak, developmentAreas, scoutReadiness, encouragement, rawText: text };
}

export default function PotentialPage() {
  const { user } = useAuthStore();
  const [form, setForm] = useState<PotentialForm>({
    age: "",
    position: "ST",
    current_form: "6",
    sessions_per_week: "3",
    years_playing: "3",
    sport: "Football",
  });
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function handleAnalyse() {
    if (!form.age) {
      setError("Please enter your age.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const message = `You are a sports development AI for Zimbabwe grassroots sport.
Athlete: Age ${form.age}, Position ${form.position}, Self-rated current form ${form.current_form}/10, Training ${form.sessions_per_week} sessions/week, ${form.years_playing} years playing, Sport: ${form.sport}.

Provide EXACTLY this structure (use these exact headings):
1. CURRENT RATING: X/100 (calculate based on their inputs)
2. PROJECTED PEAK: X/100 at age X (realistic ceiling)
3. YEARS TO PEAK: estimate
4. KEY DEVELOPMENT AREAS: 3 specific things to focus on (bullet points)
5. SCOUT READINESS: "Ready for scouting / 6 months away / 12+ months away"
6. ENCOURAGING MESSAGE: 1-2 sentences in a coach's voice

Keep it motivating but honest. Zimbabwe grassroots context.`;

      const reply = await queryAI(message, "player");
      setResult(parseAIResult(reply));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const progressPct = result
    ? Math.min(100, Math.max(0, ((result.currentRating - 30) / 70) * 100))
    : 0;
  const peakPct = result
    ? Math.min(100, Math.max(0, ((result.projectedPeak - 30) / 70) * 100))
    : 0;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Development Trajectory</h1>
            <p className="text-sm text-muted-foreground">
              See your projected peak performance and the path to get there
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left — Current Profile */}
          <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-6">
            <div className="mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-[#f0b429]" />
              <h2 className="font-semibold">Current Profile — {user?.name ?? "Athlete"}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Age</label>
                <input
                  type="number" min={12} max={40} value={form.age}
                  onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                  placeholder="e.g. 18"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Sport</label>
                <select
                  value={form.sport}
                  onChange={(e) => setForm((f) => ({ ...f, sport: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  {SPORTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Position / Event</label>
                <select
                  value={form.position}
                  onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  {POSITIONS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Current Form <span className="text-muted-foreground">(1–10)</span>
                </label>
                <input
                  type="number" min={1} max={10} value={form.current_form}
                  onChange={(e) => setForm((f) => ({ ...f, current_form: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Training sessions / week</label>
                <input
                  type="number" min={0} max={14} value={form.sessions_per_week}
                  onChange={(e) => setForm((f) => ({ ...f, sessions_per_week: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Years playing this sport</label>
                <input
                  type="number" min={0} max={30} value={form.years_playing}
                  onChange={(e) => setForm((f) => ({ ...f, years_playing: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            <button
              onClick={handleAnalyse}
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f0b429] py-3 text-sm font-semibold text-[#1a3a1a] hover:bg-[#f0b429]/90 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</>
              ) : (
                <><TrendingUp className="h-4 w-4" /> Analyse My Potential</>
              )}
            </button>
          </div>

          {/* Right — AI Trajectory Results */}
          <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-6">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#f0b429]" />
              <h2 className="font-semibold">AI Trajectory Results</h2>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#f0b429]" />
                <p className="text-sm text-muted-foreground">Building your trajectory…</p>
              </div>
            )}

            {!loading && !result && (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <TrendingUp className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Fill in your profile and click &quot;Analyse My Potential&quot; to see your development trajectory
                </p>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-5">
                {/* Rating bars */}
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Rating</span>
                      <span className="font-bold text-[#f0b429] text-lg">{result.currentRating}/100</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted">
                      <div
                        className="h-3 rounded-full bg-[#f0b429] transition-all duration-700"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Projected Peak <span className="text-xs">(age {result.peakAge})</span>
                      </span>
                      <span className="font-bold text-green-500 text-lg">{result.projectedPeak}/100</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted">
                      <div
                        className="h-3 rounded-full bg-green-500 transition-all duration-700"
                        style={{ width: `${peakPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-[#f0b429]">
                    <ChevronUp className="h-4 w-4" />
                    <span className="font-medium">+{result.projectedPeak - result.currentRating} point potential gain</span>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-muted/30 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Years to Peak</p>
                    </div>
                    <p className="text-sm font-semibold">{result.yearsToPeak}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-muted/30 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Target className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Scout Readiness</p>
                    </div>
                    <p className="text-sm font-semibold">{result.scoutReadiness}</p>
                  </div>
                </div>

                {/* Development areas */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Key Development Areas
                  </p>
                  <ul className="space-y-2">
                    {result.developmentAreas.map((area, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#f0b429]/20 text-xs font-bold text-[#f0b429]">
                          {i + 1}
                        </span>
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Encouragement */}
                <div className="rounded-xl border border-[#1a5c2a]/30 bg-[#1a5c2a]/10 px-4 py-3">
                  <p className="text-sm italic text-muted-foreground">&quot;{result.encouragement}&quot;</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
