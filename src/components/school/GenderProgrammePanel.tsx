"use client";

import { TrendingUp, TrendingDown, Minus, Users, BookOpen } from "lucide-react";
import {
  type Gender,
  type SportParticipation,
  getTopSportsForGender,
  getProgrammesForGender,
  getTotalParticipants,
} from "@/data/school-gender-data";

interface GenderProgrammePanelProps {
  gender: Gender;
}

function TrendIcon({ trend }: { trend: SportParticipation["trend"] }) {
  if (trend === "up")   return <TrendingUp  className="h-3.5 w-3.5 text-green-600" />;
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5 text-gray-400" />;
}

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export function GenderProgrammePanel({ gender }: GenderProgrammePanelProps) {
  const topSports    = getTopSportsForGender(gender, 5);
  const programmes   = getProgrammesForGender(gender);
  const total        = getTotalParticipants(gender);
  const accentColor  = gender === "boys" ? "#1a5c2a" : "#c8962a";
  const accentLight  = gender === "boys" ? "#f0fdf4" : "#fffbeb";
  const accentBorder = gender === "boys" ? "#bbf7d0" : "#fde68a";

  return (
    <div className="space-y-6">

      {/* Participation summary */}
      <div
        className="rounded-2xl border p-5"
        style={{ backgroundColor: accentLight, borderColor: accentBorder }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total {gender === "boys" ? "Boys" : "Girls"} Participants
            </p>
            <p className="mt-1 text-3xl font-bold" style={{ color: accentColor }}>
              {fmt(total)}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">across all NASH / NAPH sports</p>
          </div>
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: accentColor }}
          >
            <Users className="h-7 w-7 text-white" />
          </div>
        </div>
      </div>

      {/* Top sports */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Top Sports
        </h3>
        <div className="space-y-2">
          {topSports.map((sport) => {
            const count = gender === "boys" ? sport.boys : sport.girls;
            const pct   = Math.round((count / total) * 100);
            return (
              <div key={sport.sport} className="rounded-xl bg-white border border-gray-100 px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{sport.emoji}</span>
                    <span className="text-sm font-semibold text-gray-800">{sport.sport}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendIcon trend={sport.trend} />
                    <span className="text-sm font-bold" style={{ color: accentColor }}>
                      {fmt(count)}
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-gray-100">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: accentColor }}
                  />
                </div>
                <p className="mt-1 text-right text-[10px] text-gray-400">{pct}% of total</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Programmes */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Active Programmes
        </h3>
        <div className="space-y-2">
          {programmes.map((p) => (
            <div key={p.id} className="rounded-xl bg-white border border-gray-100 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{p.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{p.ageGroup} · {p.registeredSchools} schools</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: p.body === "NASH" ? "#f0fdf4" : "#eff6ff",
                      color:           p.body === "NASH" ? "#166534" : "#1d4ed8",
                    }}
                  >
                    {p.body}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: p.status === "Active" ? "#f0fdf4" : "#fffbeb",
                      color:           p.status === "Active" ? "#166534" : "#92400e",
                    }}
                  >
                    {p.status}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
