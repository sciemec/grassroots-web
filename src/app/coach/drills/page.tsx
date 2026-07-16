"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  Clock,
  ChevronRight,
  Dumbbell,
  Filter,
  X,
} from "lucide-react";
import { getRoleConfig } from "@/config/coaching-staff";
import {
  DEPARTMENT_DRILLS,
  getDrillsByDepartment,
  type Drill,
} from "@/lib/department-drills";

const DIFFICULTY_COLOR: Record<string, { bg: string; text: string }> = {
  beginner:     { bg: "#dcfce7", text: "#166534" },
  intermediate: { bg: "#fef3c7", text: "#92400e" },
  advanced:     { bg: "#fee2e2", text: "#991b1b" },
};

const PHASE_COLOR: Record<string, string> = {
  Technical:          "#dbeafe",
  Tactical:           "#ede9fe",
  Game:               "#dcfce7",
  Combination:        "#fce7f3",
  "1v1":              "#fef9c3",
  Transition:         "#ffedd5",
  Positional:         "#e0f2fe",
  Testing:            "#f3f4f6",
  Agility:            "#fdf4ff",
  Conditioning:       "#fee2e2",
  Recovery:           "#dcfce7",
  Analysis:           "#dbeafe",
  Visualization:      "#ede9fe",
  "Advanced Metrics": "#fef3c7",
  Scouting:           "#f3f4f6",
  Emergency:          "#fee2e2",
  Prevention:         "#dcfce7",
  Treatment:          "#fef3c7",
  Wellness:           "#dbeafe",
  Monitoring:         "#ede9fe",
  Compliance:         "#f3f4f6",
  Logistics:          "#ffedd5",
  Operations:         "#fce7f3",
  Documentation:      "#e0f2fe",
  Finance:            "#fdf4ff",
};

function DrillCard({ drill, dept }: { drill: Drill; dept: string }) {
  const [expanded, setExpanded] = useState(false);
  const diff = DIFFICULTY_COLOR[drill.difficulty] ?? { bg: "#f3f4f6", text: "#374151" };
  const phaseBg = PHASE_COLOR[drill.phase] ?? "#f3f4f6";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full capitalize"
                style={{ backgroundColor: diff.bg, color: diff.text }}
              >
                {drill.difficulty}
              </span>
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full text-gray-600"
                style={{ backgroundColor: phaseBg }}
              >
                {drill.phase}
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-[14px] leading-snug mb-1">
              {drill.name}
            </h3>
            <div className="flex items-center gap-1 text-[12px] text-gray-400">
              <Clock size={11} />
              <span>{drill.duration}</span>
            </div>
          </div>
          <ChevronRight
            size={16}
            className={`text-gray-300 shrink-0 mt-1 transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          <p className="text-[13px] text-gray-600 leading-relaxed">{drill.description}</p>

          {drill.coachingPoints.length > 0 && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                Coaching Points
              </p>
              <ul className="space-y-1">
                {drill.coachingPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700">
                    <span
                      className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: "#1a5c2a" }}
                    />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {drill.equipment.length > 0 && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                Equipment
              </p>
              <div className="flex flex-wrap gap-1.5">
                {drill.equipment.map((eq, i) => (
                  <span key={i} className="text-[12px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          )}

          {dept && (
            <Link
              href={`/coach/tactics/board?dept=${dept}`}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white px-3 py-1.5 rounded-full transition-colors"
              style={{ backgroundColor: "#1a5c2a" }}
            >
              Draw on Board
              <ChevronRight size={11} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function DrillsPageInner() {
  const params = useSearchParams();
  const deptParam = params.get("dept") ?? "";
  const categoryParam = params.get("category") ?? "";

  const roleConfig = getRoleConfig(deptParam);
  const department = roleConfig?.department ?? "all";

  const deptDrills = useMemo(() => getDrillsByDepartment(department), [department]);

  const phases = useMemo(
    () => Array.from(new Set(deptDrills.map((d) => d.phase))),
    [deptDrills]
  );

  const [search, setSearch] = useState(categoryParam.replace(/_/g, " "));
  const [selectedPhase, setSelectedPhase] = useState<string>("");
  const [selectedDiff, setSelectedDiff] = useState<string>("");

  const filtered = useMemo(() => {
    let list = deptDrills;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.phase.toLowerCase().includes(q)
      );
    }
    if (selectedPhase) list = list.filter((d) => d.phase === selectedPhase);
    if (selectedDiff) list = list.filter((d) => d.difficulty === selectedDiff);
    return list;
  }, [deptDrills, search, selectedPhase, selectedDiff]);

  const backHref = deptParam
    ? `/coach/technical-staff/${deptParam}`
    : "/coach/technical-staff";

  const pageTitle = roleConfig ? `${roleConfig.title} Drills` : "Drills Library";

  const totalCount = Object.keys(DEPARTMENT_DRILLS)
    .filter((k) => k !== "all")
    .reduce((s, k) => s + DEPARTMENT_DRILLS[k].length, 0);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Sticky nav */}
      <nav className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={backHref}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm transition-colors"
            >
              <ArrowLeft size={16} />
              {roleConfig ? roleConfig.title : "Technical Staff"}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-900">Drills</span>
          </div>
          <span className="text-[12px] text-gray-400">
            {filtered.length} drill{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#dcfce7" }}
            >
              <Dumbbell size={16} style={{ color: "#16a34a" }} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">{pageTitle}</h1>
              <p className="text-[13px] text-gray-400">
                {department === "all"
                  ? `${totalCount} drills across all departments`
                  : `${deptDrills.length} drills for this department`}
              </p>
            </div>
          </div>

          {categoryParam && (
            <div
              className="mt-3 px-3 py-2 rounded-xl text-[12px] font-medium flex items-center justify-between"
              style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
            >
              <span>
                Showing results for:{" "}
                <strong>{categoryParam.replace(/_/g, " ")}</strong>
              </span>
              <button onClick={() => setSearch("")} className="hover:opacity-70" aria-label="Clear filter">
                <X size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drills…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1a5c2a] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Phase + Difficulty filters */}
        <div className="flex gap-2 mb-5 flex-wrap items-center">
          <Filter size={12} className="text-gray-400 shrink-0" />
          {phases.map((ph) => (
            <button
              key={ph}
              onClick={() => setSelectedPhase(selectedPhase === ph ? "" : ph)}
              className="text-[12px] font-medium px-2.5 py-1 rounded-full border transition-colors"
              style={
                selectedPhase === ph
                  ? { backgroundColor: "#1a5c2a", color: "#fff", borderColor: "#1a5c2a" }
                  : { backgroundColor: "#fff", color: "#374151", borderColor: "#e5e7eb" }
              }
            >
              {ph}
            </button>
          ))}

          <div className="flex gap-1.5 ml-auto">
            {(["beginner", "intermediate", "advanced"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDiff(selectedDiff === d ? "" : d)}
                className="text-[12px] font-medium px-2.5 py-1 rounded-full border transition-colors capitalize"
                style={
                  selectedDiff === d
                    ? {
                        backgroundColor: DIFFICULTY_COLOR[d].bg,
                        color: DIFFICULTY_COLOR[d].text,
                        borderColor: DIFFICULTY_COLOR[d].bg,
                      }
                    : { backgroundColor: "#fff", color: "#374151", borderColor: "#e5e7eb" }
                }
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Drill list */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <Dumbbell size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold mb-1">No drills found</p>
            <p className="text-gray-400 text-[13px]">
              Try clearing the search or changing filters.
            </p>
            <button
              onClick={() => { setSearch(""); setSelectedPhase(""); setSelectedDiff(""); }}
              className="mt-4 text-[13px] font-semibold text-white px-4 py-2 rounded-full"
              style={{ backgroundColor: "#1a5c2a" }}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((drill) => (
              <DrillCard key={drill.id} drill={drill} dept={deptParam} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CoachDrillsPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}
          className="flex items-center justify-center"
        >
          <div className="w-8 h-8 border-2 border-gray-300 border-t-green-700 rounded-full animate-spin" />
        </div>
      }
    >
      <DrillsPageInner />
    </Suspense>
  );
}
