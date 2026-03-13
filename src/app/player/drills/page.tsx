"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Search, ChevronDown, ChevronUp, Clock, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

interface Drill {
  id: string;
  name: string;
  category: string;
  focus_area: string;
  difficulty: string;
  description: string;
  instructions: string;
  reps: string | null;
  duration_minutes: number | null;
  age_phase: string;
}

const CATEGORIES = ["All", "dribbling", "shooting", "passing", "fitness", "defending", "goalkeeping"];
const DIFFICULTIES = ["All", "beginner", "intermediate", "advanced"];

const diffColor: Record<string, string> = {
  beginner: "bg-green-500/20 text-green-700",
  intermediate: "bg-yellow-500/20 text-yellow-700",
  advanced: "bg-red-500/20 text-red-700",
};

function DrillCard({ drill }: { drill: Drill }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Dumbbell className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium">{drill.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-xs capitalize text-muted-foreground">{drill.category}</span>
            {drill.difficulty && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${diffColor[drill.difficulty] ?? "bg-muted text-muted-foreground"}`}>
                {drill.difficulty}
              </span>
            )}
            {drill.duration_minutes && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {drill.duration_minutes}min
              </span>
            )}
            {drill.reps && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <RotateCcw className="h-3 w-3" /> {drill.reps}
              </span>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t px-5 py-4 space-y-3">
          {drill.description && (
            <p className="text-sm text-muted-foreground">{drill.description}</p>
          )}
          {drill.instructions && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Instructions</p>
              <ol className="space-y-1.5">
                {drill.instructions.split(/\n|\d+\./).filter(Boolean).map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="flex-shrink-0 font-bold text-primary">{i + 1}.</span>
                    {step.trim()}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DrillsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    api.get("/drills")
      .then((res) => setDrills(res.data?.data ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, router]);

  const filtered = drills.filter((d) => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.focus_area?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || d.category === category;
    const matchDiff = difficulty === "All" || d.difficulty === difficulty;
    return matchSearch && matchCat && matchDiff;
  });

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Drill Library</h1>
            <p className="text-sm text-muted-foreground">{drills.length} drills across all categories</p>
          </div>
        </div>

        {/* Search + difficulty filter */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search drills…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border bg-card py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring capitalize"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{d === "All" ? "All levels" : d}</option>
            ))}
          </select>
        </div>

        {/* Category chips */}
        <div className="mb-5 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                category === c
                  ? "bg-primary text-primary-foreground"
                  : "border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {c === "All" ? "All" : c}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[72px] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Dumbbell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No drills found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters</p>
            {(search || category !== "All" || difficulty !== "All") && (
              <button
                onClick={() => { setSearch(""); setCategory("All"); setDifficulty("All"); }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{filtered.length} drill{filtered.length !== 1 ? "s" : ""}</p>
            {filtered.map((drill) => (
              <DrillCard key={drill.id} drill={drill} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
