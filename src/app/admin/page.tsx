"use client";

import Link from "next/link";
import { Users, ShieldCheck, Search, CreditCard, BarChart2, Megaphone, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

interface AdminStats {
  total_users: number;
  total_players: number;
  total_coaches: number;
  total_scouts: number;
  total_fans: number;
  active_sessions_today: number;
  new_registrations_this_week: number;
}

const HUB_CARDS = [
  { icon: Users,       title: "Users",           subtitle: "Manage all users",        href: "/admin/users",          bg: "bg-blue-600" },
  { icon: ShieldCheck, title: "Verifications",   subtitle: "Document verifications",  href: "/admin/verifications",  bg: "bg-green-600" },
  { icon: Search,      title: "Scout Requests",  subtitle: "Contact approvals",       href: "/admin/scout-requests", bg: "bg-purple-600" },
  { icon: CreditCard,  title: "Subscriptions",   subtitle: "Billing & plans",         href: "/admin/subscriptions",  bg: "bg-amber-600" },
  { icon: BarChart2,   title: "Platform Stats",  subtitle: "System analytics",        href: "/admin/stats",          bg: "bg-red-600" },
  { icon: Megaphone,   title: "Announcements",   subtitle: "Platform notices",        href: "/admin/announcements",  bg: "bg-teal-600" },
];

export default function AdminHubPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery<{ data: AdminStats }>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await api.get("/admin/stats");
      return res.data;
    },
    enabled: !!user,
  });

  const stats = data?.data;

  const statCards = [
    { label: "Total Users",    value: stats?.total_users },
    { label: "Players",        value: stats?.total_players },
    { label: "Coaches",        value: stats?.total_coaches },
    { label: "Scouts",         value: stats?.total_scouts },
    { label: "Active Today",   value: stats?.active_sessions_today },
    { label: "New This Week",  value: stats?.new_registrations_this_week },
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">Admin Hub</p>
          <h1 className="mt-1 text-2xl font-bold text-white">
            {user?.name?.split(" ")[0]} — Admin
          </h1>
          <p className="mt-0.5 text-sm italic text-accent/80">
            Ongorora — Platform management &amp; oversight
          </p>
        </div>

        {/* Hub cards */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent/70">
            Admin Tools
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {HUB_CARDS.map(({ icon: Icon, title, subtitle, href, bg }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-card/60 p-5 transition-all hover:scale-[1.02] hover:border-white/20 hover:bg-card"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Platform stats */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent/70">
            Platform Overview
          </p>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading stats…
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {statCards.map(({ label, value }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-card/60 p-4">
                  <p className="text-2xl font-bold text-white">
                    {value !== undefined ? value.toLocaleString() : "—"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
