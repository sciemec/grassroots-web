"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import api from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

interface Analytics {
  registrations: { date: string; count: number }[];
  verifications: { status: string; count: number }[];
  subscriptions: { plan: string; count: number }[];
  sessions_by_day: { date: string; count: number }[];
  revenue_by_month: { month: string; amount_usd: number }[];
}

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery<Analytics>({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await api.get("/admin/analytics");
      return res.data;
    },
  });

  const skeleton = <div className="h-64 animate-pulse rounded-xl bg-muted" />;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Platform trends and performance</p>
      </div>

      <div className="grid gap-8">
        {/* Registrations over time */}
        <div className="rounded-xl border bg-card p-6">
          <SectionTitle title="Registrations (last 30 days)" sub="New users per day" />
          {isLoading ? skeleton : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data?.registrations ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Verification breakdown */}
          <div className="rounded-xl border bg-card p-6">
            <SectionTitle title="Verifications by Status" sub="All-time breakdown" />
            {isLoading ? skeleton : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={data?.verifications ?? []} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {(data?.verifications ?? []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Subscriptions by plan */}
          <div className="rounded-xl border bg-card p-6">
            <SectionTitle title="Active Subscriptions by Plan" sub="Current active plans" />
            {isLoading ? skeleton : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data?.subscriptions ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="plan" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Sessions per day */}
        <div className="rounded-xl border bg-card p-6">
          <SectionTitle title="Training Sessions (last 30 days)" sub="Sessions recorded per day" />
          {isLoading ? skeleton : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data?.sessions_by_day ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue */}
        <div className="rounded-xl border bg-card p-6">
          <SectionTitle title="Revenue (USD) by Month" sub="Subscription payments received" />
          {isLoading ? skeleton : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data?.revenue_by_month ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => [`$${v}`, "Revenue"]} />
                <Line type="monotone" dataKey="amount_usd" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
