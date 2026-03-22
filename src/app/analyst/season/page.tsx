"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";
import { queryAI } from "@/lib/ai-query";

interface CoachMatch {
  id: string;
  opponent: string;
  match_date: string;
  our_score: number | null;
  their_score: number | null;
  venue: "home" | "away" | "neutral";
  formation: string;
  sport: string;
  competition: string;
  outcome: "W" | "D" | "L" | null;
}

function outcomeColor(o: "W" | "D" | "L" | null) {
  if (o === "W") return "bg-green-500 text-white";
  if (o === "D") return "bg-yellow-400 text-black";
  if (o === "L") return "bg-[#ce1126] text-white";
  return "bg-white/10 text-white/50";
}

export default function SeasonIntelligencePage() {
  const [aiReport, setAiReport] = useState("");
  const [generating, setGenerating] = useState(false);

  const { data, isLoading, isError } = useQuery<{ data: CoachMatch[] }>({
    queryKey: ["coach-matches-season"],
    queryFn: () => api.get("/matches").then((r) => r.data),
    retry: false,
  });

  const matches: CoachMatch[] = data?.data ?? [];

  // Played matches only (with scores)
  const played = matches.filter(
    (m) => m.our_score !== null && m.their_score !== null
  );

  const wins   = played.filter((m) => m.outcome === "W").length;
  const draws  = played.filter((m) => m.outcome === "D").length;
  const losses = played.filter((m) => m.outcome === "L").length;

  const goalsFor     = played.reduce((s, m) => s + (m.our_score ?? 0), 0);
  const goalsAgainst = played.reduce((s, m) => s + (m.their_score ?? 0), 0);
  const goalDiff     = goalsFor - goalsAgainst;

  const points = wins * 3 + draws;

  // Form guide — last 10 played, newest first
  const form = [...played]
    .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())
    .slice(0, 10);

  const generateReport = async () => {
    if (played.length === 0) return;
    setGenerating(true);
    setAiReport("");
    const summary = played
      .slice(0, 10)
      .map(
        (m) =>
          `${m.match_date.slice(0, 10)}: ${m.outcome} vs ${m.opponent} (${m.our_score}-${m.their_score}, ${m.venue}, ${m.formation})`
      )
      .join("\n");

    const prompt = `You are a football analyst. Review this season data and write a concise Season Intelligence Report.\n\nSEASON STATS:\n- Played: ${played.length} | W${wins} D${draws} L${losses}\n- Goals: ${goalsFor} for, ${goalsAgainst} against (GD ${goalDiff > 0 ? "+" : ""}${goalDiff})\n- Points: ${points}\n\nRECENT RESULTS (newest first):\n${summary}\n\nWrite 3 sections:\n1. SEASON SUMMARY — overall performance trend\n2. STRENGTHS — what the team does well based on the data\n3. AREAS TO ADDRESS — tactical or consistency issues\n\nKeep each section to 2-3 sentences. Be specific and data-driven.`;

    const result = await queryAI(prompt, "analyst");
    setAiReport(result);
    setGenerating(false);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/analyst" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Season Intelligence</h1>
            <p className="text-sm text-accent/80 italic">Rolling form, goal trends, AI season review</p>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-white/10 bg-card/60 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Season data is only available to coaches. Log matches in the Coach Hub to populate this view.
            </p>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="space-y-6">
            {/* Season stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Played",       value: played.length,   color: "text-white" },
                { label: "Points",       value: points,          color: "text-[#f0b429]" },
                { label: "Goal Diff",    value: `${goalDiff > 0 ? "+" : ""}${goalDiff}`, color: goalDiff >= 0 ? "text-green-400" : "text-red-400" },
                { label: "W / D / L",    value: `${wins} / ${draws} / ${losses}`, color: "text-white/80" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm text-center">
                  <p className={`text-2xl font-black ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Goals row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm text-center">
                <p className="text-2xl font-black text-green-400">{goalsFor}</p>
                <p className="text-xs text-muted-foreground">Goals Scored</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm text-center">
                <p className="text-2xl font-black text-red-400">{goalsAgainst}</p>
                <p className="text-xs text-muted-foreground">Goals Conceded</p>
              </div>
            </div>

            {/* Form guide */}
            <div className="rounded-2xl border border-white/10 bg-card/60 p-5 backdrop-blur-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Form Guide — Last 10 Results (newest first)
              </p>
              {form.length === 0 ? (
                <p className="text-xs text-muted-foreground">No played matches yet.</p>
              ) : (
                <div className="space-y-2">
                  {/* Chip row */}
                  <div className="flex flex-wrap gap-1.5">
                    {form.map((m) => (
                      <span
                        key={m.id}
                        title={`${m.outcome} vs ${m.opponent} (${m.our_score}-${m.their_score})`}
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${outcomeColor(m.outcome)}`}
                      >
                        {m.outcome ?? "?"}
                      </span>
                    ))}
                  </div>
                  {/* Table */}
                  <div className="mt-3 divide-y divide-white/5 max-h-64 overflow-y-auto">
                    {form.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 py-2 text-xs">
                        <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black ${outcomeColor(m.outcome)}`}>
                          {m.outcome ?? "?"}
                        </span>
                        <span className="flex-1 font-medium text-white">{m.opponent}</span>
                        <span className="font-bold text-white/80">{m.our_score}–{m.their_score}</span>
                        <span className="text-muted-foreground capitalize">{m.venue}</span>
                        <span className="text-muted-foreground">{m.match_date.slice(0, 10)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Season Report */}
            <div className="rounded-2xl border border-white/10 bg-card/60 p-5 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  AI Season Review
                </p>
                <button
                  onClick={generateReport}
                  disabled={generating || played.length === 0}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {generating ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
                  ) : (
                    <><TrendingUp className="h-3.5 w-3.5" /> Generate Report</>
                  )}
                </button>
              </div>

              {played.length === 0 && !generating && (
                <p className="text-xs text-muted-foreground">
                  Add played matches in Coach Hub → Matches to generate a report.
                </p>
              )}

              {aiReport && (
                <div className="rounded-xl bg-background/60 p-4 text-sm leading-relaxed whitespace-pre-wrap text-white/90">
                  {aiReport}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
