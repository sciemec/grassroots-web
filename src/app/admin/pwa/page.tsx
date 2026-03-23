"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Smartphone, Monitor, Tablet, Globe, TrendingUp, Calendar, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

interface PwaStats {
  total: number;
  today: number;
  this_week: number;
  this_month: number;
  by_platform: { platform: string; count: number }[];
  by_browser:  { browser:   string; count: number }[];
  by_device:   { device_type: string; count: number }[];
  recent: {
    name: string;
    platform: string;
    browser: string;
    device_type: string;
    installed_at: string;
  }[];
}

const PLATFORM_EMOJI: Record<string, string> = {
  android: "🤖", ios: "🍎", windows: "🪟", macos: "🍏", linux: "🐧", unknown: "❓",
};

const DEVICE_ICON = { mobile: Smartphone, desktop: Monitor, tablet: Tablet };

export default function PwaStatsPage() {
  const { user, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) router.push("/login");
    else if (user.role !== "admin") router.push("/dashboard");
  }, [_hasHydrated, user, router]);

  const { data, isLoading } = useQuery<PwaStats>({
    queryKey: ["admin-pwa-stats"],
    queryFn: async () => {
      const res = await api.get("/admin/pwa-stats");
      return res.data;
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });

  if (!_hasHydrated || !user) return null;

  const topCards = [
    { label: "Total Installs",   value: data?.total,      icon: Download,    color: "text-[#f0b429]" },
    { label: "Today",            value: data?.today,      icon: Calendar,    color: "text-green-400" },
    { label: "This Week",        value: data?.this_week,  icon: TrendingUp,  color: "text-blue-400" },
    { label: "This Month",       value: data?.this_month, icon: Globe,       color: "text-purple-400" },
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/admin" className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-accent">Admin · PWA</p>
            <h1 className="mt-0.5 text-2xl font-bold text-white">PWA Install Tracker</h1>
            <p className="mt-0.5 text-sm text-muted-foreground italic">
              Track who installed Grassroots Sport on their device
            </p>
          </div>
        </div>

        {/* Top stat cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {topCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-4">
              <Icon className={`mb-2 h-4 w-4 ${color}`} />
              <p className="text-2xl font-bold text-white">
                {isLoading ? "—" : (value ?? 0).toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-3">

          {/* By Platform */}
          <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-accent/70">By Platform</p>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 animate-pulse rounded-lg bg-muted" />)}</div>
            ) : data?.by_platform.length ? (
              <div className="space-y-3">
                {data.by_platform.map(({ platform, count }) => {
                  const pct = data.total ? Math.round((count / data.total) * 100) : 0;
                  return (
                    <div key={platform}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 capitalize text-white">
                          {PLATFORM_EMOJI[platform] ?? "📱"} {platform}
                        </span>
                        <span className="text-muted-foreground">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/10">
                        <div className="h-1.5 rounded-full bg-[#f0b429]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </div>

          {/* By Browser */}
          <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-accent/70">By Browser</p>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 animate-pulse rounded-lg bg-muted" />)}</div>
            ) : data?.by_browser.length ? (
              <div className="space-y-3">
                {data.by_browser.map(({ browser, count }) => {
                  const pct = data.total ? Math.round((count / data.total) * 100) : 0;
                  return (
                    <div key={browser}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="capitalize text-white">{browser}</span>
                        <span className="text-muted-foreground">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/10">
                        <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </div>

          {/* By Device Type */}
          <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-accent/70">By Device</p>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-8 animate-pulse rounded-lg bg-muted" />)}</div>
            ) : data?.by_device.length ? (
              <div className="space-y-3">
                {data.by_device.map(({ device_type, count }) => {
                  const pct = data.total ? Math.round((count / data.total) * 100) : 0;
                  const Icon = DEVICE_ICON[device_type as keyof typeof DEVICE_ICON] ?? Smartphone;
                  return (
                    <div key={device_type}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 capitalize text-white">
                          <Icon className="h-3.5 w-3.5 text-blue-400" /> {device_type}
                        </span>
                        <span className="text-muted-foreground">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/10">
                        <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </div>
        </div>

        {/* Recent Installs */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-accent/70">Recent Installs</p>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}</div>
          ) : data?.recent.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">User</th>
                    <th className="pb-2 pr-4 font-medium">Platform</th>
                    <th className="pb-2 pr-4 font-medium">Browser</th>
                    <th className="pb-2 pr-4 font-medium">Device</th>
                    <th className="pb-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.recent.map((install, i) => (
                    <tr key={i} className="text-white/80">
                      <td className="py-2.5 pr-4 font-mono text-xs">{install.name}</td>
                      <td className="py-2.5 pr-4 capitalize">
                        {PLATFORM_EMOJI[install.platform] ?? "📱"} {install.platform}
                      </td>
                      <td className="py-2.5 pr-4 capitalize">{install.browser}</td>
                      <td className="py-2.5 pr-4 capitalize">{install.device_type}</td>
                      <td className="py-2.5 text-xs text-muted-foreground">
                        {new Date(install.installed_at).toLocaleDateString("en-ZW", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Download className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No installs recorded yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Installs are tracked when users add the app to their home screen
              </p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
