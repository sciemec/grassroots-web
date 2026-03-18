"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Brain, Send, Loader2, Target } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { queryAI } from "@/lib/ai-query";

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

interface SummaryStats {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  played: number;
}

interface TacticalResponse {
  question: string;
  answer: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  { label: "Why are we losing?", emoji: "📉" },
  { label: "What's working well?", emoji: "✅" },
  { label: "Defensive weaknesses", emoji: "🛡️" },
  { label: "Who should I start next match?", emoji: "📋" },
];

/** Computes summary stats from match history. */
function computeStats(matches: MatchRecord[]): SummaryStats {
  return {
    wins: matches.filter((m) => m.our_score > m.their_score).length,
    draws: matches.filter((m) => m.our_score === m.their_score).length,
    losses: matches.filter((m) => m.our_score < m.their_score).length,
    goalsFor: matches.reduce((s, m) => s + m.our_score, 0),
    goalsAgainst: matches.reduce((s, m) => s + m.their_score, 0),
    played: matches.length,
  };
}

/** Builds a match context summary string for Claude. */
function buildMatchContext(matches: MatchRecord[], stats: SummaryStats): string {
  const recentFive = matches.slice(0, 5);
  const formStr = recentFive
    .map((m) =>
      m.our_score > m.their_score
        ? "W"
        : m.our_score === m.their_score
        ? "D"
        : "L"
    )
    .join("");

  const formations = Array.from(new Set(matches.map((m) => m.formation))).join(", ");
  const totalCards = matches.reduce(
    (s, m) => s + m.yellow_cards + m.red_cards,
    0
  );

  return (
    `Season record: ${stats.wins}W ${stats.draws}D ${stats.losses}L. ` +
    `Goals: ${stats.goalsFor} scored, ${stats.goalsAgainst} conceded. ` +
    `Recent form (last ${recentFive.length}): ${formStr || "N/A"}. ` +
    `Formations used: ${formations || "unknown"}. ` +
    `Total cards this season: ${totalCards}.` +
    (recentFive.length > 0
      ? ` Last match: vs ${recentFive[0].opponent} (${recentFive[0].our_score}-${recentFive[0].their_score}).`
      : "")
  );
}

/** Loading skeleton for the AI response area. */
function ResponseSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-3.5 w-3/4 rounded bg-muted" />
      <div className="h-3.5 w-full rounded bg-muted" />
      <div className="h-3.5 w-5/6 rounded bg-muted" />
      <div className="h-3.5 w-2/3 rounded bg-muted" />
    </div>
  );
}

/** Displays a single AI response card. */
function ResponseCard({ item }: { item: TacticalResponse }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-primary">{item.question}</p>
        <span className="flex-shrink-0 text-xs text-muted-foreground">
          {item.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div className="text-sm leading-relaxed text-foreground">
        {item.answer.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            {i < item.answer.split("\n").length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function TacticalAnalysisPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [responses, setResponses] = useState<TacticalResponse[]>([]);
  const [customQuestion, setCustomQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [responses, loading]);

  const stats = computeStats(matches);

  /** Sends a question to Claude with full match context injected. */
  const askClaude = async (question: string) => {
    if (!question.trim() || loading) return;
    setError("");
    setLoading(true);
    setCustomQuestion("");

    const context = buildMatchContext(matches, stats);

    const message = matches.length > 0
      ? `Match data context: ${context}\n\nQuestion: ${question}`
      : question;

    try {
      const answer = await queryAI(message, "coach");

      setResponses((prev) => [
        ...prev,
        { question, answer, timestamp: new Date() },
      ]);
    } catch {
      setError(
        "Failed to reach AI service. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askClaude(customQuestion);
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/coach"
              className="rounded-lg p-1.5 hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">Tactical Analysis</h1>
              <p className="text-xs text-muted-foreground">
                AI answers based on your match history
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-3xl space-y-6 p-6">
            {/* Season summary */}
            {matches.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  {
                    label: "Played",
                    value: stats.played,
                    color: "text-foreground",
                  },
                  { label: "Won", value: stats.wins, color: "text-green-500" },
                  {
                    label: "Drawn",
                    value: stats.draws,
                    color: "text-blue-500",
                  },
                  { label: "Lost", value: stats.losses, color: "text-red-500" },
                  {
                    label: "GD",
                    value:
                      stats.goalsFor - stats.goalsAgainst > 0
                        ? `+${stats.goalsFor - stats.goalsAgainst}`
                        : String(stats.goalsFor - stats.goalsAgainst),
                    color:
                      stats.goalsFor >= stats.goalsAgainst
                        ? "text-green-500"
                        : "text-red-500",
                  },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="rounded-xl border bg-card p-4 text-center"
                  >
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  No match history found. Log matches first to get data-driven
                  analysis.
                </p>
                <Link
                  href="/coach/matches"
                  className="mt-2 inline-block text-sm text-primary hover:underline"
                >
                  Go to Match Record →
                </Link>
              </div>
            )}

            {/* Quick-fire question buttons */}
            <div>
              <p className="mb-3 text-sm font-semibold">Quick Questions</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {QUICK_QUESTIONS.map(({ label, emoji }) => (
                  <button
                    key={label}
                    onClick={() => askClaude(label)}
                    disabled={loading}
                    className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left text-sm hover:bg-muted/40 disabled:opacity-50 transition-colors"
                  >
                    <span className="text-lg">{emoji}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom question input */}
            <div className="rounded-xl border bg-card p-4">
              <p className="mb-2 text-sm font-medium">Ask your own question</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Should I change formation against a high press?"
                  className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  onClick={() => askClaude(customQuestion)}
                  disabled={!customQuestion.trim() || loading}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40 transition-colors"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="rounded-xl border bg-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4 animate-pulse text-emerald-600" />
                  <span className="text-xs text-muted-foreground">
                    Claude is analysing your data…
                  </span>
                </div>
                <ResponseSkeleton />
              </div>
            )}

            {/* Response history */}
            {responses.length > 0 && (
              <div className="space-y-4">
                {[...responses].reverse().map((item, i) => (
                  <ResponseCard key={i} item={item} />
                ))}
              </div>
            )}

            {responses.length === 0 && !loading && (
              <div className="rounded-xl border border-dashed p-10 text-center">
                <Brain className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">Ask a tactical question</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Claude will analyse your season data and give coaching advice
                </p>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>
      </main>
    </div>
  );
}
