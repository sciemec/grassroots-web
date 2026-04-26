"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import {
  Building2, Users, Star, ClipboardList, Trophy,
  Clock, CheckCircle2, ChevronRight, Loader2,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

interface Stats {
  clubs_pending: number;
  clubs_active:  number;
  players_total: number;
  shortlisted:   number;
  province_name: string;
}

const NAV_CARDS = [
  {
    href:    "/province-admin/clubs",
    icon:    Building2,
    title:   "Club Management",
    desc:    "Approve or reject club registrations",
    color:   "from-blue-900/40 to-blue-800/20",
    border:  "border-blue-500/20",
    iconBg:  "bg-blue-500/20 text-blue-300",
  },
  {
    href:    "/province-admin/players",
    icon:    Users,
    title:   "Players in Province",
    desc:    "Browse all registered players by zone",
    color:   "from-green-900/40 to-green-800/20",
    border:  "border-green-500/20",
    iconBg:  "bg-green-500/20 text-green-300",
  },
  {
    href:    "/province-admin/shortlist",
    icon:    Star,
    title:   "Talent Shortlist",
    desc:    "Curate top talent and export PDF",
    color:   "from-yellow-900/40 to-yellow-800/20",
    border:  "border-yellow-500/20",
    iconBg:  "bg-yellow-500/20 text-yellow-300",
  },
  {
    href:    "/province-admin/clubs?status=pending",
    icon:    ClipboardList,
    title:   "Pending Approvals",
    desc:    "Review clubs awaiting verification",
    color:   "from-orange-900/40 to-orange-800/20",
    border:  "border-orange-500/20",
    iconBg:  "bg-orange-500/20 text-orange-300",
  },
  {
    href:    "/province-admin/leagues",
    icon:    Trophy,
    title:   "League Management",
    desc:    "Create leagues, schedule fixtures, record results",
    color:   "from-purple-900/40 to-purple-800/20",
    border:  "border-purple-500/20",
    iconBg:  "bg-purple-500/20 text-purple-300",
  },
];

export default function ProvinceAdminPage() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/province-admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => setStats(data?.data ?? data))
      .catch(() => setStats({
        clubs_pending: 0,
        clubs_active:  0,
        players_total: 0,
        shortlisted:   0,
        province_name: "Your Province",
      }))
      .finally(() => setLoading(false));
  }, [token]);

  const STAT_TILES = [
    { label: "Clubs Pending",  value: stats?.clubs_pending ?? 0, icon: Clock,         color: "text-orange-400" },
    { label: "Active Clubs",   value: stats?.clubs_active  ?? 0, icon: CheckCircle2,  color: "text-green-400"  },
    { label: "Players",        value: stats?.players_total ?? 0, icon: Users,         color: "text-blue-400"   },
    { label: "Shortlisted",    value: stats?.shortlisted   ?? 0, icon: Star,          color: "text-yellow-400" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            ZIFA Province Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">
            {loading ? "Loading…" : (stats?.province_name ?? "Province Admin")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back, {user?.name ?? "Administrator"}
          </p>
        </div>

        {/* Stats row */}
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground mb-8">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading stats…</span>
          </div>
        ) : (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STAT_TILES.map(t => (
              <div key={t.label}
                className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm">
                <t.icon className={`h-5 w-5 mb-2 ${t.color}`} />
                <p className="text-2xl font-bold text-foreground">{t.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pending clubs alert */}
        {!loading && (stats?.clubs_pending ?? 0) > 0 && (
          <Link href="/province-admin/clubs?status=pending"
            className="mb-6 flex items-center justify-between rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 hover:bg-orange-500/15 transition-all">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-orange-400" />
              <p className="text-sm font-medium text-orange-300">
                {stats!.clubs_pending} club{stats!.clubs_pending > 1 ? "s" : ""} awaiting your approval
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-orange-400/50" />
          </Link>
        )}

        {/* Navigation cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {NAV_CARDS.map(card => (
            <Link key={card.href} href={card.href}
              className={`group rounded-2xl border ${card.border} bg-gradient-to-br ${card.color} p-5 transition-all hover:scale-[1.01]`}>
              <div className="flex items-start justify-between">
                <div className={`rounded-xl p-2.5 ${card.iconBg}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/50 transition-colors mt-1" />
              </div>
              <p className="mt-4 text-base font-semibold text-white">{card.title}</p>
              <p className="mt-1 text-xs text-white/50">{card.desc}</p>
            </Link>
          ))}
        </div>

      </main>
    </div>
  );
}
