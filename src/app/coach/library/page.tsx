"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  BookOpen, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Shield, 
  Swords, 
  Zap, 
  Star, 
  AlertTriangle,
  Flame,
  RefreshCw,
  Target,
  Sparkles
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { COACHING_SESSIONS, CATEGORIES, type CoachingSession } from "@/lib/football-knowledge";

// 🔄 CONNECTOR INTERNALS: Import your upgraded positions blueprint registry
import { POSITION_FOCUS_MAP } from "@/config/positions";

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  attacking:     { label: "Attacking",     icon: Swords,       color: "text-amber-400",  bg: "bg-amber-500/20 border-amber-500/30" },
  defending:     { label: "Defending",     icon: Shield,       color: "text-blue-400",   bg: "bg-blue-500/20 border-blue-500/30"  },
  pressing:      { label: "Pressing",      icon: Zap,          color: "text-green-400",  bg: "bg-green-500/20 border-green-500/30"},
  fundamentals:  { label: "Fundamentals",  icon: Star,         color: "text-purple-400", bg: "bg-purple-500/20 border-purple-500/30"},
  safety:        { label: "Safety",        icon: AlertTriangle,color: "text-red-400",    bg: "bg-red-500/20 border-red-500/30"    },
};

// 🛡️ Safe Role Icon Registry to align staff selections with custom visual styles
const ROLE_ICON_REGISTRY: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  striker:    { label: "Striker Specialist", icon: Flame, color: "text-amber-400" },
  midfielder: { label: "Engine Room Lead",   icon: RefreshCw, color: "text-emerald-400" },
  defender:   { label: "Defensive Director", icon: Shield, color: "text-blue-400" },
  goalkeeper: { label: "GK Supervisor",     icon: Target, color: "text-purple-400" }
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
  const meta = CATEGORY_META[session.category] || CATEGORY_META.fundamentals;
  const Icon = meta.icon;

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
    if (kpIdx !== -1) {
      const section = text.slice(kpIdx + 20, kpIdx + 1200);
      return section
        .split(/[•\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 20 && s.length < 300)
        .slice(0, 6);
    }
    const headings = Array.from(text.matchAll(/---\s+([A-Z][^-\n]{5,60}?)\s+---/g));
    return headings.slice(0, 6).map(m => m[1].trim());
  }, [session.content]);

  const exercises = useMemo(() => {
    const text = session.content;
    const matches = Array.from(text.matchAll(/(?:part\s*\d+|exercise\s*\d+)[:\s–-]+([^\n.]{10,80})/gi));
    if (matches.length > 0) return matches.slice(0, 6).map(m => m[0].trim());
    const drills = Array.from(text.matchAll(/(?:drill\s*\d+|step\s*\d+|\d+\.\s+[A-Z])[:\s–-]+([^\n]{10,80})/gi));
    return drills.slice(0, 6).map(m => m[0].trim());
  }, [session.content]);

  return (
    <div className="rounded-2xl border border-white/10 bg-card/80 overflow-hidden shadow-xs hover:border-white/20 transition-all">
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
            <h3 className="text-sm font-bold text-white leading-tight mb-1 truncate">{session.title}</h3>
            <div className="flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${meta.bg} ${meta.color}`}>
                {meta.label}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${LEVEL_COLORS[session.level]}`}>
                {session.level}
              </span>
              <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-white/50 font-medium">
                {session.source}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 text-white/40 mt-1">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/10 px-5 py-4 space-y-4 bg-black/10">
          {overview && (
            <div>
              <p className="mb-1.5 text-xs font-black uppercase tracking-wider text-white/40">Session Overview</p>
              <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">{overview}</p>
            </div>
          )}

          {exercises.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-wider text-white/40">Exercises & Circuits</p>
              <div className="space-y-1">
                {exercises.map((ex, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-white/75">
                    <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-black text-white/60">{i + 1}</span>
                    <span className="font-medium">{ex}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {keyPoints.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-wider text-white/40">Key Coaching Principles</p>
              <ul className="space-y-1.5">
                {keyPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/80 font-medium">
                    <span className={`mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full ${meta.color.replace("text-","bg-")}`} />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <details className="group border-t border-white/5 pt-3">
            <summary className="cursor-pointer text-[11px] font-bold text-white/40 hover:text-white/60 uppercase tracking-wider transition-colors list-none flex items-center gap-1">
              <span>🗚 View complete instructional textbook dossier</span>
              <span className="text-[10px] font-mono opacity-65">({session.pages} pages)</span>
            </summary>
            <pre className="mt-3 rounded-xl bg-black/40 p-4 text-xs text-white/60 whitespace-pre-wrap leading-relaxed overflow-auto max-h-96 border border-white/5 font-mono">
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
  
  // 🎯 CONNECTIVITY HUB ENGINE STATE: Holds selection of active position track
  const [selectedStaffRole, setSelectedStaffRole] = useState<string>("all");

  // 📐 Business Filtering Engine Map
  const filtered = useMemo(() => {
    return COACHING_SESSIONS.filter(s => {
      const matchesCat = activeCategory === "all" || s.category === activeCategory;
      
      const q = search.toLowerCase();
      const matchesSearch = !q || s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q);
      
      // 🧩 ROLE ALIGNMENT CONNECTIVITY LOGIC
      let matchesRole = true;
      if (selectedStaffRole !== "all") {
        const roleBlueprint = POSITION_FOCUS_MAP[selectedStaffRole];
        if (roleBlueprint) {
          // Check if drill category matches any keyword filters in the position focus map
          const targetTags = roleBlueprint.targetDrillCategories || [];
          matchesRole = targetTags.some(tag => 
            s.title.toLowerCase().includes(tag.replace("_", " ")) || 
            s.content.toLowerCase().includes(tag.replace("_", " ")) ||
            (selectedStaffRole === "striker" && s.category === "attacking") ||
            (selectedStaffRole === "defender" && s.category === "defending")
          );
        }
      }

      return matchesCat && matchesSearch && matchesRole;
    });
  }, [search, activeCategory, selectedStaffRole]);

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
        <div className="mx-auto max-w-3xl space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <Link href="/coach/dashboard" className="rounded-lg p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight uppercase">Session Library</h1>
                <p className="text-xs text-white/50 font-semibold italic">
                  {COACHING_SESSIONS.length} FIFA & FA developmental blueprints linked directly
                </p>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-1 bg-amber-500/10 text-[#f0b429] border border-amber-500/20 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
              <Sparkles size={12} /> Coach Hub Matrix Active
            </div>
          </div>

          {/* 🚀 TARGET ROLE FILTERS LINK: Connects coaching staff specialties straight to data blueprints */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 pl-1">Filter By Specialization Track</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <button
                onClick={() => setSelectedStaffRole("all")}
                className={`px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-center border ${
                  selectedStaffRole === "all" 
                    ? "bg-[#f0b429] text-[#1c3d22] border-[#f0b429]" 
                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                }`}
              >
                All Drills
              </button>

              {Object.entries(ROLE_ICON_REGISTRY).map(([roleKey, meta]) => {
                const RoleIcon = meta.icon;
                return (
                  <button
                    key={roleKey}
                    onClick={() => setSelectedStaffRole(roleKey)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border ${
                      selectedStaffRole === roleKey
                        ? "bg-[#1c3d22] border-emerald-500 text-emerald-400 font-bold"
                        : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    <RoleIcon size={12} className={selectedStaffRole === roleKey ? "text-emerald-400" : "text-white/40"} />
                    <span>{roleKey}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Search specific technical drills, tactics, sets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-3 text-xs font-bold text-white placeholder-white/30 outline-none focus:bg-black/20 focus:border-[#f0b429] transition-all"
            />
          </div>

          {/* Category filter tabs */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 pl-1">Tactical Domains</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveCategory("all")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${activeCategory === "all" ? "bg-white text-black font-black" : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"}`}
              >
                All Blocks <span className="text-[10px] opacity-50">({counts.all})</span>
              </button>
              {CATEGORIES.map(cat => {
                const meta = CATEGORY_META[cat];
                if (!meta) return null;
                const Icon = meta.icon;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${activeCategory === cat ? `border ${meta.bg} ${meta.color} bg-white/5` : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"}`}
                  >
                    <Icon className="h-3 w-3" />
                    {meta.label} <span className="text-[10px] opacity-50">({counts[cat] ?? 0})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Session Cards Render Loop */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-white/10 p-12 text-center">
                <BookOpen className="mx-auto mb-3 h-8 w-8 text-white/20" />
                <p className="text-xs font-black uppercase tracking-wider text-white/40">No technical drill matches located inside focus parameters</p>
              </div>
            ) : (
              filtered.map(s => <SessionCard key={s.id} session={s} />)
            )}
          </div>
          
        </div>
      </main>
    </div>
  );
}