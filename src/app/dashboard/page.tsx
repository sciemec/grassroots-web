"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import api from "@/lib/api";
import type { DashboardStats } from "@/types";
import {
  Users,
  ShieldCheck,
  CreditCard,
  Dumbbell,
  ClipboardList,
  UserPlus,
  ArrowRight,
} from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | undefined;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={`rounded-md p-2 ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold">
        {value === undefined ? <span className="animate-pulse text-muted-foreground text-xl">—</span> : value.toLocaleString()}
      </p>
    </div>
  );
}

export default function DashboardPage() {
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

  const cards = [
    { label: "Total Users", value: stats?.total_users, icon: Users, color: "bg-blue-500" },
    { label: "Pending Verifications", value: stats?.pending_verifications, icon: ShieldCheck, color: "bg-amber-500" },
    { label: "Active Subscriptions", value: stats?.active_subscriptions, icon: CreditCard, color: "bg-green-500" },
    { label: "Sessions Today", value: stats?.sessions_today, icon: Dumbbell, color: "bg-purple-500" },
    { label: "Scout Requests Pending", value: stats?.pending_scout_requests, icon: ClipboardList, color: "bg-red-500" },
    { label: "New Users This Week", value: stats?.new_users_this_week, icon: UserPlus, color: "bg-indigo-500" },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-balance">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform overview</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent users */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="font-semibold">Recent Users</h2>
            <Link href="/users" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="divide-y">
            {recentUsers?.data?.map((u) => (
              <li key={u.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{u.player_id ?? u.email}</p>
                  <p className="text-xs capitalize text-muted-foreground">{u.role}</p>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</p>
              </li>
            )) ?? [...Array(4)].map((_, i) => (
              <li key={i} className="px-5 py-3">
                <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              </li>
            ))}
          </ul>
        </div>

        {/* Quick actions */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/verifications", label: "Review Verifications", color: "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20" },
              { href: "/scout-requests", label: "Scout Requests", color: "bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/20" },
              { href: "/notifications", label: "Send Notification", color: "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20" },
              { href: "/community", label: "Community Districts", color: "bg-green-500/10 text-green-700 hover:bg-green-500/20" },
              { href: "/analytics", label: "View Analytics", color: "bg-purple-500/10 text-purple-700 hover:bg-purple-500/20" },
              { href: "/users", label: "Manage Users", color: "bg-muted text-muted-foreground hover:bg-muted/80" },
            ].map(({ href, label, color }) => (
              <Link key={href} href={href}
                className={`rounded-xl px-3 py-3 text-sm font-medium transition-colors ${color}`}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
