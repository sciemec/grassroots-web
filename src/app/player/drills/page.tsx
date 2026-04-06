"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Clock, ChevronDown, ChevronUp, ArrowLeft,
  Wrench, Eye, MessageSquare, Package, X, WifiOff, UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import {
  ALL_DRILLS, DRILL_CATEGORIES,
  type TrainingDrill, type DrillCategory,
} from "@/data/training-drills";
import api from "@/lib/api";

// ─── Assigned drill shape (from FutureFit coach assignment) ───────────────────
interface AssignedDrill {
  id: string;
  drillName: string;
  formatLabel: string;
  playerNames: string;
  message: string;
  assignedAt: string;
}

// ─── API drill shape ───────────────────────────────────────────────────────────
interface ApiDrill {
  id: string | number;
  name: string;
  category?: string;
  focus_area?: string;
  difficulty?: string;
  description?: string;
  instructions?: string;
  reps?: string | null;
  duration_minutes?: number | null;
  age_phase?: string;
}

/** Map API response to our TrainingDrill shape so the UI is consistent */
function mapApiDrill(d: ApiDrill): TrainingDrill {
  const catId = d.category ?? "attacking_skills";
  const catInfo = DRILL_CATEGORIES.find((c) => c.id === catId) ?? DRILL_CATEGORIES[0];
  const steps = d.instructions
    ? d.instructions.split(/\n|\d+\./).map((s) => s.trim()).filter(Boolean)
    : ["Follow your coach's guidance for this drill."];

  return {
    id: String(d.id),
    name: d.name,
    category: catInfo.id,
    categoryLabel: catInfo.label,
    skillId: d.focus_area ?? "general",
    durationSeconds: d.duration_minutes ? d.duration_minutes * 60 : 60,
    setup: d.description ?? "",
    equipment: [],
    instructions: steps,
    coachingFocus: d.focus_area ?? "",
    cameraFocus: "",
  };
}

// ─── Drill Detail Modal ────────────────────────────────────────────────────────
function DrillModal({ drill, cat, onClose }: { drill: TrainingDrill; cat: DrillCategory; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-card shadow-2xl">
        {/* Colour header */}
        <div className="sticky top-0 rounded-t-2xl px-6 py-5" style={{ backgroundColor: cat.hex }}>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/70">{drill.categoryLabel}</p>
          <h2 className="text-xl font-bold text-white">{drill.name}</h2>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-white/80">
              <Clock className="h-3.5 w-3.5" />
              {drill.durationSeconds}s
            </span>
            {drill.skillId && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium capitalize text-white">
                {drill.skillId}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-6 p-6">
          {/* Setup */}
          {drill.setup && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Setup</p>
              <p className="text-sm leading-relaxed">{drill.setup}</p>
            </div>
          )}

          {/* Equipment */}
          {drill.equipment.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <Package className="h-3.5 w-3.5" /> Equipment
              </p>
              <div className="flex flex-wrap gap-2">
                {drill.equipment.map((item) => (
                  <span key={item} className="rounded-full border bg-muted px-3 py-1 text-xs">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {drill.instructions.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Step-by-Step</p>
              <ol className="space-y-3">
                {drill.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: cat.hex }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Coaching Focus */}
          {drill.coachingFocus && (
            <div className="rounded-xl border-l-4 bg-muted/40 px-4 py-3" style={{ borderLeftColor: cat.hex }}>
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" /> Coaching Focus
              </p>
              <p className="text-sm">{drill.coachingFocus}</p>
            </div>
          )}

          {/* Camera Focus */}
          {drill.cameraFocus && (
            <div className="rounded-xl border-l-4 border-sky-400 bg-sky-500/5 px-4 py-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-sky-600">
                <Eye className="h-3.5 w-3.5" /> Camera Focus
              </p>
              <p className="text-sm">{drill.cameraFocus}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Drill Row ─────────────────────────────────────────────────────────────────
function DrillRow({ drill, cat, onOpen }: { drill: TrainingDrill; cat: DrillCategory; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-4 rounded-xl border bg-card px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
    >
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: cat.hex }}
      >
        <Wrench className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{drill.name}</p>
        {drill.setup && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{drill.setup}</p>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />{drill.durationSeconds}s
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}

// ─── Category Section ──────────────────────────────────────────────────────────
function CategorySection({
  cat, drills, onDrillOpen,
}: {
  cat: DrillCategory;
  drills: TrainingDrill[];
  onDrillOpen: (drill: TrainingDrill) => void;
}) {
  const [open, setOpen] = useState(false);
  if (drills.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 transition-opacity hover:opacity-90"
        style={{ backgroundColor: cat.hex }}
      >
        <div className="text-left">
          <p className="font-semibold text-white">{cat.label}</p>
          <p className="mt-0.5 text-xs text-white/70">{drills.length} drills · {drills[0]?.skillId} focus</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
            {drills.length}
          </span>
          {open ? <ChevronUp className="h-5 w-5 text-white" /> : <ChevronDown className="h-5 w-5 text-white" />}
        </div>
      </button>

      {open && (
        <div className="divide-y bg-card">
          {drills.map((drill) => (
            <div key={drill.id} className="px-4 py-2">
              <DrillRow drill={drill} cat={cat} onOpen={() => onDrillOpen(drill)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function DrillsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [drills, setDrills] = useState<TrainingDrill[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [search, setSearch] = useState("");
  const [activeModal, setActiveModal] = useState<TrainingDrill | null>(null);
  const [assignedDrills, setAssignedDrills] = useState<AssignedDrill[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Load coach-assigned drills — tries API first, falls back to localStorage
  useEffect(() => {
    const fetchAssigned = async () => {
      try {
        const res = await api.get("/player/assigned-drills");
        const payload = res.data?.data ?? res.data;
        if (Array.isArray(payload) && payload.length > 0) {
          setAssignedDrills(payload as AssignedDrill[]);
          return;
        }
      } catch { /* fall through to localStorage */ }
      // localStorage fallback — same device demo (coach + player on same browser)
      try {
        const raw = localStorage.getItem("gs_futurefit_assignments");
        if (raw) setAssignedDrills(JSON.parse(raw) as AssignedDrill[]);
      } catch { /* ignore */ }
    };
    fetchAssigned();

    const dismissed = localStorage.getItem("gs_dismissed_assignments");
    if (dismissed) setDismissedIds(new Set(JSON.parse(dismissed) as string[]));
  }, []);

  const dismissAssignment = (id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem("gs_dismissed_assignments", JSON.stringify(Array.from(next))); } catch { /* ignore */ }
      return next;
    });
  };

  useEffect(() => {
    // guests allowed — no login redirect

    api.get("/drills")
      .then((res) => {
        try {
          const payload = res.data?.data ?? res.data;
          // Guard: backend may return HTML (500 page) or a non-array value
          const raw: ApiDrill[] = Array.isArray(payload) ? payload : [];
          if (raw.length > 0) {
            setDrills(raw.map(mapApiDrill));
          } else {
            setDrills(ALL_DRILLS);
            setUsingFallback(true);
          }
        } catch {
          setDrills(ALL_DRILLS);
          setUsingFallback(true);
        }
      })
      .catch(() => {
        // API unavailable (500, timeout, network) — use bundled drills
        setDrills(ALL_DRILLS);
        setUsingFallback(true);
      })
      .finally(() => setLoading(false));
  }, [user, router]);


  const modalCat = activeModal
    ? DRILL_CATEGORIES.find((c) => c.id === activeModal.category) ?? DRILL_CATEGORIES[0]
    : null;

  const searchResults = search.trim()
    ? drills.filter((d) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.categoryLabel.toLowerCase().includes(search.toLowerCase()) ||
        d.skillId.toLowerCase().includes(search.toLowerCase()) ||
        d.setup.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  // Group current drills by category
  const grouped = DRILL_CATEGORIES.map((cat) => ({
    cat,
    drills: drills.filter((d) => d.category === cat.id),
  }));

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Drill Library</h1>
              <p className="text-xs text-muted-foreground">
                {loading ? "Loading…" : `${drills.length} drills across ${DRILL_CATEGORIES.length} categories`}
              </p>
            </div>
          </div>

          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search drills, categories, skills…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Coach-assigned drills */}
          {assignedDrills.filter((a) => !dismissedIds.has(a.id)).length > 0 && (
            <div className="rounded-2xl border border-[#f0b429]/30 bg-[#f0b429]/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-[#f0b429]" />
                <p className="text-sm font-bold text-white">Assigned by Your Coach</p>
                <span className="ml-auto rounded-full bg-[#f0b429]/20 px-2 py-0.5 text-[10px] font-bold text-[#f0b429]">
                  {assignedDrills.filter((a) => !dismissedIds.has(a.id)).length} new
                </span>
              </div>
              <div className="space-y-2">
                {assignedDrills
                  .filter((a) => !dismissedIds.has(a.id))
                  .slice()
                  .reverse()
                  .map((a) => (
                    <div key={a.id} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{a.drillName}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">{a.formatLabel} format · {new Date(a.assignedAt).toLocaleDateString()}</p>
                        {a.message && (
                          <p className="mt-1 text-xs text-[#f0b429]/80 italic">&ldquo;{a.message}&rdquo;</p>
                        )}
                      </div>
                      <button
                        onClick={() => dismissAssignment(a.id)}
                        className="shrink-0 rounded-lg p-1 text-white/20 hover:text-white/50 transition-colors mt-0.5"
                        aria-label="Dismiss"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Fallback notice */}
          {usingFallback && !loading && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
              <WifiOff className="h-4 w-4 flex-shrink-0" />
              <span>
                <span className="font-semibold">Offline library loaded.</span>{" "}
                {drills.length} built-in drills available — your team&apos;s drills will sync when the server is back.
              </span>
            </div>
          )}

          {/* Loading skeletons */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : searchResults !== null ? (
            /* Search results */
            <>
              <p className="text-sm text-muted-foreground">
                {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
              </p>
              {searchResults.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-12 text-center">
                  <p className="font-medium">No drills found</p>
                  <p className="mt-1 text-sm text-muted-foreground">Try a different search term</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((drill) => {
                    const cat = DRILL_CATEGORIES.find((c) => c.id === drill.category) ?? DRILL_CATEGORIES[0];
                    return (
                      <DrillRow key={drill.id} drill={drill} cat={cat} onOpen={() => setActiveModal(drill)} />
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Category accordion */
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total Drills",  value: drills.length },
                  { label: "Categories",    value: DRILL_CATEGORIES.length },
                  { label: "Duration",      value: "1 min each" },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border bg-card p-3 text-center">
                    <p className="text-lg font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              {grouped.map(({ cat, drills: catDrills }) => (
                <CategorySection
                  key={cat.id}
                  cat={cat}
                  drills={catDrills}
                  onDrillOpen={(drill) => setActiveModal(drill)}
                />
              ))}
            </>
          )}
        </div>
      </main>

      {activeModal && modalCat && (
        <DrillModal drill={activeModal} cat={modalCat} onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
}
