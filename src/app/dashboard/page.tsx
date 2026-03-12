"use client";

import { useQuery } from "@tanstack/react-query";
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
      const res = await api.get("/api/admin/stats");
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
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform overview</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>
    </DashboardLayout>
  );
}
