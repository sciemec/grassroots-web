"use client";

// Public progress bar + needs checklist.
// Receives the `progress` object embedded in the public case detail API response.

import { CheckCircle2, Circle } from "lucide-react";

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

interface NeedItem {
  id: string;
  item: string;
  qty: number;
  unit_cost_cents: number;
  total_cents: number;
  covered: boolean;
}

interface Progress {
  target_cents: number;
  verified_cents: number;
  unverified_cents: number;
  verified_pct: number;
  unverified_pct: number;
  disclaimer: string;
  needs: NeedItem[];
}

interface Props {
  progress: Progress;
}

export default function ProgressDisplay({ progress }: Props) {
  const {
    target_cents,
    verified_cents,
    unverified_cents,
    verified_pct,
    unverified_pct,
    disclaimer,
    needs,
  } = progress;

  // If nothing to show, render nothing
  if (target_cents === 0 && needs.length === 0) {
    return null;
  }

  const coveredCount = needs.filter((n) => n.covered).length;

  // Milestone badges — 25 / 50 / 75 / 100 %
  const MILESTONES = [25, 50, 75, 100] as const;
  const highestMilestone = MILESTONES.filter((m) => verified_pct >= m).pop() ?? null;
  const MILESTONE_CFG: Record<number, { label: string; badge: string; text: string }> = {
    25:  { label: "25% reached 🎉",     badge: "bg-blue-50 border-blue-200",     text: "text-blue-700"   },
    50:  { label: "Halfway there 🌟",   badge: "bg-amber-50 border-amber-200",   text: "text-amber-700"  },
    75:  { label: "75% reached 💪",     badge: "bg-orange-50 border-orange-200", text: "text-orange-700" },
    100: { label: "Fully supported 🏆", badge: "bg-green-50 border-green-200",   text: "text-green-700"  },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold text-gray-900 text-sm">Support Progress</h2>
        {highestMilestone != null && (
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${MILESTONE_CFG[highestMilestone].badge} ${MILESTONE_CFG[highestMilestone].text}`}>
            {MILESTONE_CFG[highestMilestone].label}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {target_cents > 0 && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>
              <span className="font-semibold text-[#1a5c2a]">{fmt(verified_cents)}</span>
              {unverified_cents > 0 && (
                <span className="text-gray-400"> + {fmt(unverified_cents)} reported</span>
              )}
              {" "}/ {fmt(target_cents)}
            </span>
            <span className="font-semibold text-gray-700">{verified_pct}%</span>
          </div>

          {/* Bar — overflow:visible so tick marks show above rounded corners */}
          <div className="relative h-3 rounded-full bg-gray-100 overflow-visible">
            {verified_pct > 0 && (
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-[#1a5c2a] transition-all overflow-hidden"
                style={{ width: `${verified_pct}%` }}
              />
            )}
            {unverified_pct > 0 && (
              <div
                className="absolute top-0 h-full bg-[#a8d5b5] transition-all overflow-hidden"
                style={{ left: `${verified_pct}%`, width: `${unverified_pct}%` }}
              />
            )}
            {/* Milestone tick marks at 25 / 50 / 75% */}
            {([25, 50, 75] as const).map((m) => (
              <div
                key={m}
                className="absolute top-0 h-full w-px bg-white/70 z-10"
                style={{ left: `${m}%` }}
              />
            ))}
          </div>

          {/* Tick labels */}
          <div className="relative mt-0.5" style={{ height: "14px" }}>
            {([25, 50, 75] as const).map((m) => (
              <span
                key={m}
                className="absolute text-[9px] text-gray-300 -translate-x-1/2 select-none"
                style={{ left: `${m}%` }}
              >
                {m}%
              </span>
            ))}
          </div>

          {unverified_cents > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[#a8d5b5] mr-1" />
              Lighter segment = owner-reported, not yet verified by GRS
            </p>
          )}
        </div>
      )}

      {/* Needs checklist */}
      {needs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Needs checklist
            </p>
            {needs.length > 0 && (
              <span className="text-xs text-gray-400">
                {coveredCount}/{needs.length} covered
              </span>
            )}
          </div>
          <ul className="divide-y divide-gray-50">
            {needs.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-2">
                <span className="flex-shrink-0">
                  {item.covered
                    ? <CheckCircle2 size={15} className="text-green-600" />
                    : <Circle      size={15} className="text-gray-300" />
                  }
                </span>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${item.covered ? "text-gray-500 line-through" : "text-gray-800"}`}>
                    {item.item}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    × {item.qty} · {fmt(item.total_cents)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer — always shown */}
      <p className="text-xs text-gray-400 border-t border-gray-100 pt-3 italic">
        {disclaimer}
      </p>
    </div>
  );
}
