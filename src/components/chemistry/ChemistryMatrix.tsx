"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface PairScore {
  player_a_id: string;
  player_b_id: string;
  chemistry_score: number;
  style_score: number;
  matching_dims: string[];
  diverging_dims: string[];
  explanation_en: string | null;
}

export interface SquadPlayer {
  id: string;
  name: string;
  position: string;
}

interface ChemistryMatrixProps {
  pairs: PairScore[];
  players: SquadPlayer[];
}

function scoreColor(score: number): string {
  if (score >= 85) return "bg-green-600 text-white";
  if (score >= 70) return "bg-green-400 text-white";
  if (score >= 55) return "bg-yellow-500 text-black";
  if (score >= 40) return "bg-orange-500 text-white";
  return "bg-red-600 text-white";
}

export default function ChemistryMatrix({ pairs, players }: ChemistryMatrixProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);

  // Build bidirectional lookup: "idA|idB" and "idB|idA" both map to the same pair
  const pairMap = new Map<string, PairScore>();
  for (const pair of pairs) {
    pairMap.set(`${pair.player_a_id}|${pair.player_b_id}`, pair);
    pairMap.set(`${pair.player_b_id}|${pair.player_a_id}`, pair);
  }

  const getPair = (aId: string, bId: string): PairScore | null =>
    pairMap.get(`${aId}|${bId}`) ?? null;

  const handleCellClick = (aId: string, bId: string) => {
    if (aId === bId) return;
    const pair = getPair(aId, bId);
    if (!pair) return;
    // Always navigate with canonical order matching what the API expects
    router.push(`/coach/chemistry/pair/${aId}/${bId}`);
  };

  if (players.length === 0) {
    return (
      <p className="text-sm text-gray-600 py-8 text-center">
        No squad members with chemistry data yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse">
        <thead>
          <tr>
            {/* Empty corner cell */}
            <th className="w-28 min-w-[7rem]" />
            {players.map((p) => (
              <th
                key={p.id}
                className="pb-2 text-center align-bottom"
                style={{ minWidth: 44 }}
              >
                <span
                  className="block text-[10px] text-gray-700 font-bold leading-tight"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", maxHeight: 72 }}
                >
                  {p.name.split(" ")[0]}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((rowPlayer) => (
            <tr key={rowPlayer.id}>
              {/* Row label */}
              <td className="pr-2 text-right text-[11px] text-gray-700 font-bold whitespace-nowrap align-middle">
                {rowPlayer.name.split(" ")[0]}
              </td>

              {players.map((colPlayer) => {
                const cellKey = `${rowPlayer.id}|${colPlayer.id}`;
                const isSelf = rowPlayer.id === colPlayer.id;
                const pair = isSelf ? null : getPair(rowPlayer.id, colPlayer.id);
                const isHovered = hovered === cellKey;

                return (
                  <td key={colPlayer.id} className="p-0.5 align-middle">
                    {isSelf ? (
                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs select-none">
                        —
                      </div>
                    ) : pair ? (
                      <button
                        onClick={() => handleCellClick(rowPlayer.id, colPlayer.id)}
                        onMouseEnter={() => setHovered(cellKey)}
                        onMouseLeave={() => setHovered(null)}
                        className={`w-10 h-10 rounded text-xs font-bold transition-all duration-150 ${scoreColor(pair.chemistry_score)} ${isHovered ? "scale-125 z-10 relative shadow-xl ring-2 ring-white/30" : ""}`}
                        title={`${rowPlayer.name} × ${colPlayer.name}: ${Math.round(pair.chemistry_score)}%`}
                      >
                        {Math.round(pair.chemistry_score)}
                      </button>
                    ) : (
                      <div
                        className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs"
                        title="No data yet"
                      >
                        ?
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-gray-600">
        <span className="font-bold text-gray-800">Chemistry score:</span>
        {[
          { label: "85+ Excellent", cls: "bg-green-600" },
          { label: "70–84 Strong", cls: "bg-green-400" },
          { label: "55–69 Good", cls: "bg-yellow-500" },
          { label: "40–54 Moderate", cls: "bg-orange-500" },
          { label: "<40 Low", cls: "bg-red-600" },
          { label: "No data", cls: "bg-gray-200" },
        ].map(({ label, cls }) => (
          <span key={label} className="flex items-center gap-1">
            <span className={`w-3 h-3 rounded ${cls} inline-block flex-shrink-0`} />
            {label}
          </span>
        ))}
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Click any cell to view the full chemistry breakdown for that pair.
      </p>
    </div>
  );
}
