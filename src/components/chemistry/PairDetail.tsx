"use client";

export interface PairData {
  player_a_id: string;
  player_b_id: string;
  chemistry_score: number;
  style_score: number;
  demographic_score: number;
  geo_score: number;
  formula_version: number;
  matching_dims: (string | { dimension: string; label?: string })[];
  diverging_dims: (string | { dimension: string; label?: string })[];
  explanation_en: string | null;
  calculated_at: string;
}

interface PairDetailProps {
  pair: PairData;
  playerAName: string;
  playerBName: string;
}

function dimLabel(d: string | { dimension: string; label?: string }): string {
  if (typeof d === "string") return d;
  return d.label ?? d.dimension;
}

function ScoreBar({ label, value, weight, color }: { label: string; value: number; weight: string; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-white/70">
          {label} <span className="text-white/30">({weight})</span>
        </span>
        <span className="font-bold text-white">{Math.round(value)}</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

export default function PairDetail({ pair, playerAName, playerBName }: PairDetailProps) {
  const score = Math.round(pair.chemistry_score);
  const overallColor =
    score >= 85 ? "text-green-400" :
    score >= 70 ? "text-green-300" :
    score >= 55 ? "text-yellow-400" :
    score >= 40 ? "text-orange-400" :
    "text-red-400";

  const ringColor =
    score >= 85 ? "ring-green-500/30" :
    score >= 70 ? "ring-green-400/30" :
    score >= 55 ? "ring-yellow-500/30" :
    "ring-orange-500/30";

  return (
    <div className="space-y-5">
      {/* Overall score hero */}
      <div className={`rounded-2xl border border-white/10 bg-white/5 p-6 text-center ring-1 ${ringColor}`}>
        <div className={`text-8xl font-black leading-none ${overallColor}`}>
          {score}
          <span className="text-3xl text-white/30">%</span>
        </div>
        <div className="mt-2 text-white/50 text-sm">Overall Chemistry Score</div>
        <div className="mt-1 text-white/80 text-base font-semibold">
          {playerAName} × {playerBName}
        </div>
        <div className="mt-1 text-white/30 text-xs">Formula v{pair.formula_version}</div>
      </div>

      {/* Score breakdown */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
        <h3 className="text-sm font-bold text-white/80">Score Breakdown</h3>
        <ScoreBar label="Style Similarity"   weight="60%" value={pair.style_score}       color="bg-blue-500" />
        <ScoreBar label="Demographic Match"  weight="25%" value={pair.demographic_score} color="bg-purple-500" />
        <ScoreBar label="Geographic Score"   weight="15%" value={pair.geo_score}         color="bg-teal-500" />

        {/* Weighted total explanation */}
        <p className="text-xs text-white/30 pt-1">
          Final = (style × 0.60) + (demographic × 0.25) + (geographic × 0.15)
        </p>
      </div>

      {/* Matching dimensions */}
      {pair.matching_dims.length > 0 && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
          <h3 className="text-sm font-bold text-green-400 mb-2">Shared Strengths</h3>
          <p className="text-xs text-white/50 mb-3">
            These playing style dimensions are strongly aligned between the two players.
          </p>
          <div className="flex flex-wrap gap-2">
            {pair.matching_dims.map((d, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-medium">
                {dimLabel(d)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Diverging dimensions */}
      {pair.diverging_dims.length > 0 && (
        <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4">
          <h3 className="text-sm font-bold text-orange-400 mb-2">Complementary Differences</h3>
          <p className="text-xs text-white/50 mb-3">
            These dimensions differ — potentially complementary on the pitch.
          </p>
          <div className="flex flex-wrap gap-2">
            {pair.diverging_dims.map((d, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-medium">
                {dimLabel(d)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI explanation */}
      {pair.explanation_en ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-bold text-white/80 mb-2">THUTO Analysis</h3>
          <p className="text-white/70 text-sm leading-relaxed">{pair.explanation_en}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-bold text-white/50 mb-1">THUTO Analysis</h3>
          <p className="text-white/30 text-xs">
            AI explanation not yet generated. It will appear after the nightly batch job runs (02:00 Harare).
          </p>
        </div>
      )}

      {/* Footer */}
      <p className="text-xs text-white/25 text-center">
        Calculated {new Date(pair.calculated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
      </p>
    </div>
  );
}
