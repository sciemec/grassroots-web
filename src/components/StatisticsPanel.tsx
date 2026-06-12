"use client";

import type { ISportsStatistics } from "@/lib/isports/types";

interface StatisticsPanelProps {
  statistics: ISportsStatistics;
}

interface StatRow {
  label: string;
  home: number;
  away: number;
  isPercent?: boolean;
}

function StatBar({ label, home, away, isPercent }: StatRow) {
  const total = home + away || 1;
  const homeWidth = Math.round((home / total) * 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span className="font-medium text-white">{home}{isPercent ? "%" : ""}</span>
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-white">{away}{isPercent ? "%" : ""}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-700">
        <div
          className="bg-[#f0b429] rounded-l-full transition-all"
          style={{ width: `${homeWidth}%` }}
        />
        <div
          className="bg-blue-500 rounded-r-full flex-1 transition-all"
        />
      </div>
    </div>
  );
}

export function StatisticsPanel({ statistics }: StatisticsPanelProps) {
  const { home, away } = statistics;

  const rows: StatRow[] = [
    { label: "Possession", home: home.possession, away: away.possession, isPercent: true },
    { label: "Shots", home: home.shots, away: away.shots },
    { label: "On Target", home: home.shots_on_target, away: away.shots_on_target },
    { label: "Passes", home: home.passes, away: away.passes },
    { label: "Pass Accuracy", home: home.pass_accuracy, away: away.pass_accuracy, isPercent: true },
    { label: "Corners", home: home.corners, away: away.corners },
    { label: "Fouls", home: home.fouls, away: away.fouls },
    { label: "Offsides", home: home.offsides, away: away.offsides },
  ];

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-bold text-gray-300 mb-4">Statistics</h3>
      <div className="flex justify-between text-[10px] text-gray-500 mb-2 uppercase tracking-wider">
        <span className="text-[#f0b429]">Home</span>
        <span className="text-blue-400">Away</span>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <StatBar key={row.label} {...row} />
        ))}
      </div>
    </div>
  );
}
