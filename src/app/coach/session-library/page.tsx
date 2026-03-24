"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Search, ChevronDown, ChevronUp, Shield, Swords, Zap, Star, AlertTriangle } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { COACHING_SESSIONS, CATEGORIES, type CoachingSession } from "@/lib/football-knowledge";

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  attacking:    { label: "Attacking",    icon: Swords,       color: "text-amber-400",  bg: "bg-amber-500/20 border-amber-500/30" },
  defending:    { label: "Defending",    icon: Shield,       color: "text-blue-400",   bg: "bg-blue-500/20 border-blue-500/30"  },
  pressing:     { label: "Pressing",     icon: Zap,          color: "text-green-400",  bg: "bg-green-500/20 border-green-500/30"},
  fundamentals: { label: "Fundamentals", icon: Star,         color: "text-purple-400", bg: "bg-purple-500/20 border-purple-500/30"},
  safety:       { label: "Safety",       icon: AlertTriangle,color: "text-red-400",    bg: "bg-red-500/20 border-red-500/30"    },
};

const LEVEL_COLORS: Record<string, string> = {
  youth:        "bg-green-500/20 text-green-300",
  grassroots:   "bg-emerald-500/20 text-emerald-300",
  intermediate: "bg-blue-500/20 text-blue-300",
  advanced:     "bg-purple-500/20 text-purple-300",
  all:          "bg-gray-500/20 text-gray-300",
};

function SessionCard({ session }: { session: CoachingSession }) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[session.category];
  const Icon = meta.icon;

  // Extract key sections from content for display
  const overview = useMemo(() => {
    const text = session.content;
    const ovIdx = text.toLowerCase().indexOf("session overview");
    const kpIdx = text.toLowerCase().indexOf("key coaching points");
    if (ovIdx !== -1 && kpIdx !== -1) {
      return text.slice(ovIdx, kpIdx).replace("Session overview", "").trim().slice(0, 400);
    }
    return text.slice(0, 400);
  }, [session.content]);

  const keyPoints = useMemo(() => {
    const text = session.content;
    const kpIdx = text.toLowerCase().indexOf("key coaching points");
    if (kpIdx === -1) return [];
    const section = text.slice(kpIdx + 20, kpIdx + 1200);
    return section
      .split(/[•\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 300)
      .slice(0, 6);
  }, [session.content]);

  const exercises = useMemo(() => {
    const text = session.content;
    const matches = Array.from(text.matchAll(/(?:part\s*\d+|exercise\s*\d+)[:\s–-]+([^\n.]{10,80})/gi));
    return matches.slice(0, 6).map(m => m[0].trim());
  }, [session.content]);

  return (
    <div className="rounded-2xl border border-white/10 bg-card/80 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${meta.bg}`}>
            <Icon className={`h-5 w-5 ${meta.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-sm font-bold text-white leading-tight">{session.title}</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium border ${meta.bg} ${meta.color}`}>
                {meta.label}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_COLORS[session.level]}`}>
                {session.level.charAt(0).toUpperCase() + session.level.slice(1)}
              </span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                {session.source} · {session.pages}p
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 text-white/40 mt-1">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/10 px-5 py-4 space-y-4">
          {/* Session overview */}
          {overview && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/50">Session Overview</p>
              <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">{overview}</p>
            </div>
          )}

          {/* Exercises */}
          {exercises.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Exercises</p>
              <div className="space-y-1">
                {exercises.map((ex, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-white/75">
                    <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white/60">{i + 1}</span>
                    <span>{ex}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key coaching points */}
          {keyPoints.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Key Coaching Points</p>
              <ul className="space-y-1.5">
                {keyPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                    <span className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${meta.color.replace("text-","bg-")}`} />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Full content toggle */}
          <details className="group">
            <summary className="cursor-pointer text-xs text-white/40 hover:text-white/60 transition-colors">
              View full session text ({session.pages} pages)
            </summary>
            <pre className="mt-3 rounded-xl bg-black/20 p-4 text-xs text-white/60 whitespace-pre-wrap leading-relaxed overflow-auto max-h-96">
              {session.content}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

export default function SessionLibraryPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filtered = useMemo(() => {
    return COACHING_SESSIONS.filter(s => {
      const matchesCat = activeCategory === "all" || s.category === activeCategory;
      const q = search.toLowerCase();
      const matchesSearch = !q || s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [search, activeCategory]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: COACHING_SESSIONS.length };
    for (const cat of CATEGORIES) {
      c[cat] = COACHING_SESSIONS.filter(s => s.category === cat).length;
    }
    return c;
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl">

          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <Link href="/coach" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Session Library</h1>
              <p className="text-sm text-accent/80 italic">
                {COACHING_SESSIONS.length} FIFA & FA coaching sessions — tap any card to read
              </p>
            </div>
          </div>

          {/* Source badges */}
          <div className="mb-5 flex flex-wrap gap-2">
            {["FIFA Elite Academy Sessions", "FCRF Talent Development", "The FA Guidelines"].map(badge => (
              <span key={badge} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
                {badge}
              </span>
            ))}
          </div>

          {/* Search */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Search sessions, drills, tactics…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Category filter */}
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${activeCategory === "all" ? "bg-white text-black" : "border border-white/20 text-white/60 hover:bg-white/10"}`}
            >
              All <span className="opacity-60">({counts.all})</span>
            </button>
            {CATEGORIES.map(cat => {
              const meta = CATEGORY_META[cat];
              const Icon = meta.icon;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${activeCategory === cat ? `border ${meta.bg} ${meta.color}` : "border border-white/20 text-white/60 hover:bg-white/10"}`}
                >
                  <Icon className="h-3 w-3" />
                  {meta.label} <span className="opacity-60">({counts[cat] ?? 0})</span>
                </button>
              );
            })}
          </div>

          {/* Session cards */}
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/20 p-12 text-center">
              <BookOpen className="mx-auto mb-3 h-8 w-8 text-white/20" />
              <p className="text-sm text-white/40">No sessions match your search</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(s => <SessionCard key={s.id} session={s} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
