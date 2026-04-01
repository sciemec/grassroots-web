"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Building2, MapPin, Users, ChevronRight, Loader2, Filter } from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Team {
  id: string;
  name: string;
  sport: string;
  age_group: string | null;
  gender: string;
}

interface Org {
  id: string;
  name: string;
  type: string;
  province: string;
  sports: string[];
  description: string | null;
  slug: string;
  teams: Team[];
}

interface PageMeta {
  current_page: number;
  last_page: number;
  total: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PROVINCES = [
  "All Provinces", "Harare", "Bulawayo", "Manicaland", "Mashonaland Central",
  "Mashonaland East", "Mashonaland West", "Masvingo",
  "Matabeleland North", "Matabeleland South", "Midlands",
];

const ORG_TYPES = ["All Types", "School", "Academy", "Club"];

const SPORTS = [
  "All Sports", "Football", "Netball", "Rugby", "Athletics", "Basketball",
  "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey",
];

const TYPE_COLORS: Record<string, string> = {
  School:  "bg-blue-500/15 text-blue-300",
  Academy: "bg-purple-500/15 text-purple-300",
  Club:    "bg-green-500/15 text-green-300",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function SchoolsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

  const [orgs, setOrgs] = useState<Org[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("All Provinces");
  const [type, setType] = useState("All Types");
  const [sport, setSport] = useState("All Sports");
  const [showFilters, setShowFilters] = useState(false);

  const fetchOrgs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search.trim()) params.set("search", search.trim());
      if (province !== "All Provinces") params.set("province", province);
      if (type !== "All Types") params.set("type", type);
      if (sport !== "All Sports") params.set("sport", sport);

      const res = await fetch(`${apiUrl}/organisations/discover?${params}`);
      const json = await res.json();
      setOrgs(json.data ?? []);
      setMeta({ current_page: json.current_page, last_page: json.last_page, total: json.total });
    } catch {
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, search, province, type, sport]);

  // Debounced fetch on filter changes
  useEffect(() => {
    const t = setTimeout(() => fetchOrgs(1), 300);
    return () => clearTimeout(t);
  }, [fetchOrgs]);

  const activeFilters = [province !== "All Provinces", type !== "All Types", sport !== "All Sports"].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#0d1f12]">
      <PublicNavbar />

      {/* Hero */}
      <div className="pt-24 pb-10 text-center px-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-400">Fan Hub</p>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Find Schools, Academies &amp; Clubs
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Discover grassroots sports organisations across Zimbabwe
        </p>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-16">

        {/* Search + filter bar */}
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search organisations…"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/30 focus:border-amber-500/40 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`relative flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
              showFilters || activeFilters > 0
                ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilters > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-[#0d1f12]">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* Filter dropdowns */}
        {showFilters && (
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              { label: "Province", value: province, options: PROVINCES, set: setProvince },
              { label: "Type", value: type, options: ORG_TYPES, set: setType },
              { label: "Sport", value: sport, options: SPORTS, set: setSport },
            ].map(({ label, value, options, set }) => (
              <div key={label}>
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-widest text-white/40">{label}</label>
                <select
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0d2b1a] px-3 py-2 text-sm text-white focus:border-amber-500/40 focus:outline-none"
                >
                  {options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Results count */}
        {!loading && meta && (
          <p className="mb-3 text-xs text-white/40">
            {meta.total} organisation{meta.total !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
          </div>
        ) : orgs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
            <Building2 className="mx-auto mb-3 h-10 w-10 text-white/20" />
            <p className="text-sm text-white/50">No organisations found.</p>
            <p className="mt-1 text-xs text-white/30">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orgs.map((org) => (
              <Link
                key={org.id}
                href={`/schools/${org.slug}`}
                className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-amber-500/30 hover:bg-white/8 transition-all"
              >
                <div className="flex items-start gap-4 min-w-0">
                  {/* Icon */}
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
                    <Building2 className="h-5 w-5 text-amber-400" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{org.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[org.type] ?? "bg-white/10 text-white/60"}`}>
                        {org.type}
                      </span>
                    </div>

                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-white/50">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {org.province}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {org.teams.length} team{org.teams.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {org.sports.slice(0, 4).map((s) => (
                        <span key={s} className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-white/60">
                          {s}
                        </span>
                      ))}
                      {org.sports.length > 4 && (
                        <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-white/40">
                          +{org.sports.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 flex-shrink-0 text-white/30 mt-1" />
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => fetchOrgs(p)}
                className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                  p === meta.current_page
                    ? "bg-amber-500 text-[#0d1f12]"
                    : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
