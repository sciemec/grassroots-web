"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Building2, Search, MapPin, Users, ChevronRight, Loader2,
  Handshake, TrendingUp, Shield, Filter,
} from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Team { id: string; sport: string; }

interface Org {
  id: string;
  name: string;
  type: string;
  province: string;
  sports: string[];
  description: string | null;
  contact_email: string | null;
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

const TYPE_COLORS: Record<string, string> = {
  School:  "bg-blue-500/15 text-blue-300",
  Academy: "bg-purple-500/15 text-purple-300",
  Club:    "bg-green-500/15 text-green-300",
};

// Estimated audience reach based on type + team count
function estimatedAudience(org: Org): string {
  const base = org.type === "School" ? 400 : org.type === "Academy" ? 150 : 200;
  const total = base + org.teams.length * 60;
  if (total >= 1000) return `${(total / 1000).toFixed(1)}k+`;
  return `${total}+`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BusinessDirectoryPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

  const [orgs, setOrgs] = useState<Org[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("All Provinces");
  const [type, setType] = useState("All Types");
  const [showFilters, setShowFilters] = useState(false);

  const fetchOrgs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search.trim()) params.set("search", search.trim());
      if (province !== "All Provinces") params.set("province", province);
      if (type !== "All Types") params.set("type", type);

      const res = await fetch(`${apiUrl}/organisations/discover?${params}`);
      const json = await res.json();
      setOrgs(json.data ?? []);
      setMeta({ current_page: json.current_page, last_page: json.last_page, total: json.total });
    } catch {
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, search, province, type]);

  useEffect(() => {
    const t = setTimeout(() => fetchOrgs(1), 300);
    return () => clearTimeout(t);
  }, [fetchOrgs]);

  const activeFilters = [province !== "All Provinces", type !== "All Types"].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#0d1f12]">
      <PublicNavbar />

      {/* Hero */}
      <div className="pt-24 pb-10 px-4 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-400">Business Hub</p>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Organisation Directory
        </h1>
        <p className="mt-2 text-sm text-white/60 max-w-xl mx-auto">
          Find grassroots sports organisations to sponsor, partner with, or support across Zimbabwe
        </p>
      </div>

      {/* Value props for sponsors */}
      <div className="mx-auto max-w-4xl px-4 mb-8">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Handshake, title: "Find Sponsorship Targets", desc: "Browse active organisations by sport, province, and type" },
            { icon: TrendingUp, title: "Reach Grassroots Audiences", desc: "Connect with thousands of athletes, parents, and fans" },
            { icon: Shield,    title: "Verified Organisations",    desc: "All organisations self-registered with contact details" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-white/8 bg-white/5 p-4 text-center">
              <Icon className="mx-auto mb-2 h-5 w-5 text-amber-400" />
              <p className="text-xs font-semibold text-white">{title}</p>
              <p className="mt-0.5 text-[11px] text-white/40 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-16">

        {/* Search + filters */}
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

        {showFilters && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            {[
              { label: "Province", value: province, options: PROVINCES, set: setProvince },
              { label: "Type",     value: type,     options: ORG_TYPES,  set: setType },
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

        {!loading && meta && (
          <p className="mb-3 text-xs text-white/40">{meta.total} organisation{meta.total !== 1 ? "s" : ""} listed</p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
          </div>
        ) : orgs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
            <Building2 className="mx-auto mb-3 h-10 w-10 text-white/20" />
            <p className="text-sm text-white/50">No organisations found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orgs.map((org) => (
              <Link
                key={org.id}
                href={`/schools/${org.slug}`}
                className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-amber-500/30 hover:bg-white/8 transition-all"
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
                    <Building2 className="h-5 w-5 text-amber-400" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{org.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[org.type] ?? "bg-white/10 text-white/60"}`}>
                        {org.type}
                      </span>
                    </div>

                    <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-white/50">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{org.province}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />{org.teams.length} team{org.teams.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Sports + Sponsor reach */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {org.sports.slice(0, 3).map((s) => (
                        <span key={s} className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-white/60">{s}</span>
                      ))}
                      {org.sports.length > 3 && (
                        <span className="text-[10px] text-white/30">+{org.sports.length - 3} more</span>
                      )}
                      <span className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                        ~{estimatedAudience(org)} audience
                      </span>
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

        {/* Register CTA */}
        <div className="mt-10 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-900/20 to-yellow-900/10 p-6 text-center">
          <p className="text-sm font-semibold text-white">Is your organisation missing from this directory?</p>
          <p className="mt-1 text-xs text-white/50">
            Register on GrassRoots Sport and make your organisation discoverable to sponsors and fans.
          </p>
          <Link
            href="/register"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-[#0d1f12] hover:bg-amber-400 transition-colors"
          >
            Register your organisation
          </Link>
        </div>

      </div>
    </div>
  );
}
