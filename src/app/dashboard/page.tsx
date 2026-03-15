"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { HubCard } from "@/components/ui/hub-card";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";
import type { DashboardStats } from "@/types";
import {
  Users, ShieldCheck, CreditCard, Dumbbell, ClipboardList, UserPlus,
  ArrowRight, Bell, Heart, BarChart2,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/admin/stats");
      return res.data;
    },
  });

  const { data: recentUsers } = useQuery<{ data: { id: string; player_id: string; email: string; role: string; created_at: string }[] }>({
    queryKey: ["recent-users"],
    queryFn: async () => {
      const res = await api.get("/admin/users", { params: { per_page: 8 } });
      return res.data;
    },
  });

  const statCards = [
    { label: "Total Users",            value: stats?.total_users,             icon: Users,        color: "text-blue-400" },
    { label: "Pending Verifications",  value: stats?.pending_verifications,   icon: ShieldCheck,  color: "text-accent" },
    { label: "Active Subscriptions",   value: stats?.active_subscriptions,    icon: CreditCard,   color: "text-primary" },
    { label: "Sessions Today",         value: stats?.sessions_today,          icon: Dumbbell,     color: "text-purple-400" },
    { label: "Scout Requests",         value: stats?.pending_scout_requests,  icon: ClipboardList,color: "text-red-400" },
    { label: "New This Week",          value: stats?.new_users_this_week,     icon: UserPlus,     color: "text-accent" },
  ];

  const adminCards = [
    { icon: ShieldCheck,  title: "Verifications",  subtitle: "Pending ID checks",          href: "/verifications",  bg: "bg-[#d35400]", gradient: "bg-gradient-to-br from-[#d35400] to-[#a04000]" },
    { icon: Users,        title: "Users",          subtitle: "Manage all accounts",        href: "/users",          bg: "bg-[#1a5276]", gradient: "bg-gradient-to-br from-[#1a5276] to-[#0d2b4a]" },
    { icon: ClipboardList,title: "Scout Requests", subtitle: "Approve contact requests",   href: "/scout-requests", bg: "bg-[#c0392b]", gradient: "bg-gradient-to-br from-[#c0392b] to-[#922b21]" },
    { icon: Bell,         title: "Notifications",  subtitle: "Send platform alerts",       href: "/notifications",  bg: "bg-[#6c3483]", gradient: "bg-gradient-to-br from-[#6c3483] to-[#4a235a]" },
    { icon: BarChart2,    title: "Analytics",      subtitle: "Platform stats — Data",      href: "/analytics",      bg: "bg-[#7d6608]", gradient: "bg-gradient-to-br from-[#9d8209] to-[#7d6608]" },
    { icon: CreditCard,   title: "Subscriptions",  subtitle: "Revenue — Mitengo",          href: "/subscriptions",  bg: "bg-[#1a6b3c]", gradient: "bg-gradient-to-br from-[#27ae60] to-[#1a6b3c]" },
    { icon: Heart,        title: "Community",      subtitle: "Districts & clubs",          href: "/community",      bg: "bg-[#1a5276]", gradient: "bg-gradient-to-br from-[#2471a3] to-[#1a5276]" },
    { icon: Dumbbell,     title: "Sessions",       subtitle: "Training activity log",      href: "/sessions",       bg: "bg-[#6c3483]", gradient: "bg-gradient-to-br from-[#8e44ad] to-[#6c3483]" },
  ];

  const roleColors: Record<string, string> = {
    player: "text-primary",
    coach:  "text-blue-400",
    scout:  "text-red-400",
    fan:    "text-pink-400",
    admin:  "text-accent",
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-accent">
          Mhoro — Admin Dashboard
        </p>
        <h1 className="mt-1 text-2xl font-bold text-white">
          {user?.name?.split(" ")[0] ?? "Admin"} 👋
        </h1>
        <p className="mt-0.5 text-sm italic text-accent/80">
          Tambirai — Platform overview & management
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm">
            <Icon className={`mb-2 h-4 w-4 ${color}`} />
            <p className="text-xl font-bold text-white">
              {value === undefined
                ? <span className="animate-pulse text-muted-foreground text-base">—</span>
                : value.toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Admin hub cards */}
      <div className="mb-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent/70">
          Admin Tools
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {adminCards.map((card) => (
            <HubCard key={card.href} {...card} />
          ))}
        </div>
      </div>

      {/* Recent users */}
      <div className="rounded-2xl border border-white/10 bg-card/60 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent/70">
            Recent Users
          </p>
          <Link href="/users" className="flex items-center gap-1 text-xs text-accent hover:text-white transition-colors">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <ul className="divide-y divide-white/5">
          {recentUsers?.data?.map((u) => (
            <li key={u.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  {(u.player_id ?? u.email)?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{u.player_id ?? u.email}</p>
                  <p className={`text-xs capitalize font-medium ${roleColors[u.role] ?? "text-muted-foreground"}`}>{u.role}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("en-ZW")}</p>
            </li>
          )) ?? [...Array(4)].map((_, i) => (
            <li key={i} className="px-5 py-3">
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            </li>
          ))}
        </ul>
      </div>
    </DashboardLayout>
  );
}
