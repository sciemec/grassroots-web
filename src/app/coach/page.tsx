"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, Brain, ChevronRight, Flame, Shield, AlertTriangle,
  Trophy, Radio, ClipboardList, Loader2,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";
import type { SquadMember } from "@/types";

function PageSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-8">
          <div className="h-8 w-52 animate-pulse rounded-lg bg-muted" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </main>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  fit:      "bg-green-500/15 text-green-700",
  injured:  "bg-red-500/15 text-red-700",
  caution:  "bg-amber-500/15 text-amber-700",
};

export default function CoachHubPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [squad, setSquad] = useState<SquadMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (user.role !== "coach") { router.push("/dashboard"); return; }
    api.get("/coach/squad")
      .then((res) => setSquad(res.data?.data ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, router]);

  const fit      = squad.filter((m) => m.status === "fit").length;
  const injured  = squad.filter((m) => m.status === "injured").length;
  const caution  = squad.filter((m) => m.status === "caution").length;

  const getQuickInsight = async () => {
    setInsightLoading(true);
    setAiInsight("");
    const summary = `Squad of ${squad.length}: ${fit} fit, ${injured} injured, ${caution} on caution.`;
    try {
      const res = await api.post("/ai-coach/query", {
        message: `Coach insight request. ${summary} Give me 3 concise coaching recommendations for today's training session. Format as a numbered list.`,
      });
      setAiInsight(res.data?.response ?? res.data?.message ?? "");
    } catch {
      setAiInsight("Unable to load insights. Check your connection.");
    } finally {
      setInsightLoading(false);
    }
  };

  if (!user || loading) return <PageSkeleton />;

  const quickActions = [
    { icon: Users,       label: "My Squad",      href: "/coach/squad",       bg: "bg-blue-500",   hover: "hover:bg-blue-400" },
    { icon: ClipboardList,label: "Tactics Board", href: "/coach/tactics",     bg: "bg-green-500",  hover: "hover:bg-green-400" },
    { icon: Trophy,      label: "Matches",        href: "/coach/matches",     bg: "bg-amber-500",  hover: "hover:bg-amber-400" },
    { icon: Brain,       label: "AI Insights",    href: "/coach/ai-insights", bg: "bg-purple-500", hover: "hover:bg-purple-400" },
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-balance text-2xl font-bold">
            Coach Hub — {user.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your squad, tactics, and get AI-powered coaching support
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { icon: Users,         label: "Squad size",   value: squad.length, color: "text-blue-500" },
            { icon: Flame,         label: "Fit players",  value: fit,          color: "text-green-500" },
            { icon: AlertTriangle, label: "On caution",   value: caution,      color: "text-amber-500" },
            { icon: Shield,        label: "Injured",      value: injured,      color: "text-red-500" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-xl border bg-card p-5">
              <Icon className={`mb-2 h-5 w-5 ${color}`} />
              <p className="text-2xl font-bold">{value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Quick actions
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickActions.map(({ icon: Icon, label, href, bg, hover }) => (
              <Link
                key={label}
                href={href}
                className={`flex flex-col items-center gap-3 rounded-xl p-5 text-center text-sm font-semibold text-white transition-all active:scale-95 ${bg} ${hover}`}
              >
                <Icon className="h-6 w-6" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* AI banner + squad overview side by side */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* AI Quick Insight */}
          <div className="rounded-2xl border bg-gradient-to-r from-purple-950/60 to-green-950/60 p-6">
            <div className="mb-3 flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-400" />
              <span className="text-sm font-semibold text-purple-300">AI Coaching Assistant</span>
            </div>
            <h3 className="mb-1 text-balance text-lg font-bold text-white">
              Get today&apos;s coaching tips
            </h3>
            <p className="mb-4 text-sm leading-relaxed text-green-300">
              Based on your squad fitness status, get instant AI recommendations.
            </p>
            {aiInsight ? (
              <div className="rounded-xl bg-black/30 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-white">{aiInsight}</p>
                <Link href="/coach/ai-insights" className="mt-3 block text-xs text-purple-300 hover:underline">
                  Open full AI chat →
                </Link>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={getQuickInsight}
                  disabled={insightLoading || squad.length === 0}
                  className="flex items-center gap-2 rounded-xl bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-400 disabled:opacity-50 transition-colors"
                >
                  {insightLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                  {insightLoading ? "Analysing…" : "Get quick tips"}
                </button>
                <Link
                  href="/coach/ai-insights"
                  className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Full chat
                </Link>
              </div>
            )}
          </div>

          {/* Squad fitness overview */}
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Squad fitness</h2>
              <Link href="/coach/squad" className="flex items-center gap-1 text-xs text-primary hover:underline">
                Manage <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {squad.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">No squad yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Add players to get started</p>
                <Link href="/coach/squad" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                  Add players
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {squad.slice(0, 6).map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/40">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {m.shirt_no}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{m.player?.name ?? "—"}</p>
                        <p className="text-xs capitalize text-muted-foreground">{m.position}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[m.status] ?? "bg-muted text-muted-foreground"}`}>
                      {m.status}
                    </span>
                  </div>
                ))}
                {squad.length > 6 && (
                  <Link href="/coach/squad" className="block pt-1 text-center text-xs text-primary hover:underline">
                    +{squad.length - 6} more players →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom links */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Link href="/coach/tactics" className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-muted/40 transition-colors">
            <ClipboardList className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-semibold">Tactics Board</p>
              <p className="text-xs text-muted-foreground">Set formation & lineup</p>
            </div>
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
          <Link href="/coach/matches" className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-muted/40 transition-colors">
            <Trophy className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-semibold">Match Record</p>
              <p className="text-xs text-muted-foreground">Log & review matches</p>
            </div>
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
          <Link href="/streaming" className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-muted/40 transition-colors sm:col-span-1 col-span-2">
            <Radio className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-semibold">Live Matches</p>
              <p className="text-xs text-muted-foreground">Stream & record footage</p>
            </div>
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
        </div>

      </main>
    </div>
  );
}
