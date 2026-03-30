"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, Brain, ChevronRight, Flame, Shield, AlertTriangle,
  Trophy, Radio, ClipboardList, Loader2, Film, Activity, Crosshair, BookOpen,
  Layers, ScanSearch,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { HubCard } from "@/components/ui/hub-card";
import api from "@/lib/api";
import { searchOffline } from "@/lib/offline-ai";
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
  const { user, _hasHydrated } = useAuthStore();
  const [squad, setSquad] = useState<SquadMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { setLoading(false); return; } // guests allowed — layout shows GuestBanner
    if (user.role !== "coach" && user.role !== "admin") { router.push("/dashboard"); return; }
    api.get("/coach/squad")
      .then((res) => setSquad(res.data?.data ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, router, _hasHydrated]);

  const fit      = squad.filter((m) => m.status === "fit").length;
  const injured  = squad.filter((m) => m.status === "injured").length;
  const caution  = squad.filter((m) => m.status === "caution").length;

  const getQuickInsight = async () => {
    setInsightLoading(true);
    setAiInsight("");
    const summary = `Squad of ${squad.length}: ${fit} fit, ${injured} injured, ${caution} on caution.`;
    const message = `Coach insight request. ${summary} Give me 3 concise coaching recommendations for today's training session. Format as a numbered list.`;
    try {
      // Step 1 — Laravel backend
      try {
        const res = await api.post("/ask", { question: message, role: "coach", language: "english" });
        const reply = res.data?.answer ?? res.data?.response ?? res.data?.message ?? "";
        if (reply) { setAiInsight(reply); return; }
      } catch { /* fall through */ }

      // Step 2 — Claude proxy
      try {
        const res = await fetch("/api/ai-coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data.response ?? data.reply ?? "";
          if (reply) { setAiInsight(reply); return; }
        }
      } catch { /* fall through */ }

      // Step 3 — Offline knowledge base
      const offline = await searchOffline(message);
      if (offline) { setAiInsight(`${offline.text}\n\n_📚 Offline: ${offline.source}_`); return; }

      setAiInsight("Unable to load insights. Check your connection.");
    } finally {
      setInsightLoading(false);
    }
  };

  if (!_hasHydrated || loading) return <PageSkeleton />;

  const hubCards = [
    { icon: Brain,        title: "AI Insights",      subtitle: "Mubatsiri wako — Claude AI",  href: "/coach/ai-insights",       bg: "bg-[#6c3483]", gradient: "bg-gradient-to-br from-[#6c3483] to-[#4a235a]" },
    { icon: Users,        title: "My Squad",         subtitle: "Timu yako — Manage squad",    href: "/coach/squad",             bg: "bg-[#1a5276]", gradient: "bg-gradient-to-br from-[#1a5276] to-[#0d2b4a]" },
    { icon: ClipboardList,title: "Tactics Board",    subtitle: "Formation & set pieces",      href: "/coach/tactics",           bg: "bg-[#1a6b3c]", gradient: "bg-gradient-to-br from-[#27ae60] to-[#1a6b3c]" },
    { icon: Trophy,       title: "Matches",          subtitle: "Log & review — Zvikwata",     href: "/coach/matches",           bg: "bg-[#d35400]", gradient: "bg-gradient-to-br from-[#d35400] to-[#a04000]" },
    { icon: Crosshair,    title: "Tactical Analysis",subtitle: "Deep analysis — AI powered",  href: "/coach/tactical-analysis", bg: "bg-[#7d6608]", gradient: "bg-gradient-to-br from-[#9d8209] to-[#7d6608]" },
    { icon: Film,         title: "Video Studio",     subtitle: "Record & edit — Vidiyo",      href: "/video-studio",            bg: "bg-[#1a5276]", gradient: "bg-gradient-to-br from-[#2471a3] to-[#1a5276]" },
    { icon: Activity,     title: "Injury Tracker",   subtitle: "Player health status",        href: "/injury-tracker",          bg: "bg-[#c0392b]", gradient: "bg-gradient-to-br from-[#c0392b] to-[#922b21]" },
    { icon: Radio,        title: "Live Matches",     subtitle: "Stream & broadcast live",     href: "/streaming",               bg: "bg-[#1a6b3c]", gradient: "bg-gradient-to-br from-[#1e8449] to-[#1a6b3c]" },
    { icon: BookOpen,     title: "Session Library",  subtitle: "FIFA & FA coaching sessions", href: "/coach/session-library",   bg: "bg-[#2471a3]", gradient: "bg-gradient-to-br from-[#2e86c1] to-[#1a5276]" },
    { icon: ScanSearch,   title: "Scouting",         subtitle: "Player TalentID rankings",    href: "/coach/scouting",          bg: "bg-[#4a235a]", gradient: "bg-gradient-to-br from-[#7d3c98] to-[#4a235a]" },
    { icon: Layers,       title: "Training Plans",   subtitle: "Phases & programmes",         href: "/coach/training-plans",    bg: "bg-[#145a32]", gradient: "bg-gradient-to-br from-[#1e8449] to-[#145a32]" },
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-widest text-[#1A6B3C]">
            Mhoro — Coach Hub
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#0D2B1A]">
            {user?.name?.split(" ")[0] ?? "Coach"} 👋
          </h1>
          <p className="mt-0.5 text-sm italic text-[#1A6B3C]/80">
            Ramba uchishanda — Manage your squad & tactics
          </p>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Users,         label: "Squad",      value: squad.length, color: "text-blue-400" },
            { icon: Flame,         label: "Fit",        value: fit,          color: "text-primary" },
            { icon: AlertTriangle, label: "Caution",    value: caution,      color: "text-accent" },
            { icon: Shield,        label: "Injured",    value: injured,      color: "text-red-400" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm">
              <Icon className={`mb-2 h-4 w-4 ${color}`} />
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Hub cards grid */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#1A6B3C]">
            Coach Tools
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {hubCards.map((card) => (
              <HubCard key={card.href} {...card} />
            ))}
          </div>
        </div>

        {/* AI insight + squad side by side */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* AI Quick Insight */}
          <div className="rounded-2xl border border-[#6c3483]/40 bg-gradient-to-br from-[#6c3483]/40 to-[#1a4a2e]/60 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-300" />
              <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">AI Coaching Assistant</span>
            </div>
            <h3 className="mb-1 text-base font-bold text-white">Get today&apos;s coaching tips</h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Based on your squad fitness — instant AI recommendations.
            </p>
            {aiInsight ? (
              <div className="rounded-xl bg-black/30 p-3">
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-white">{aiInsight}</p>
                <Link href="/coach/ai-insights" className="mt-2 block text-xs text-purple-300 hover:underline">
                  Open full AI chat →
                </Link>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={getQuickInsight}
                  disabled={insightLoading || squad.length === 0}
                  className="flex items-center gap-2 rounded-xl bg-[#6c3483] px-4 py-2 text-xs font-semibold text-white hover:bg-[#8e44ad] disabled:opacity-50 transition-colors"
                >
                  {insightLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
                  {insightLoading ? "Analysing…" : "Get quick tips"}
                </button>
                <Link
                  href="/coach/ai-insights"
                  className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Full chat
                </Link>
              </div>
            )}
          </div>

          {/* Squad fitness */}
          <div className="rounded-2xl border border-white/10 bg-card/60 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#1A6B3C]">Squad Fitness</p>
              <Link href="/coach/squad" className="flex items-center gap-1 text-xs text-[#1A6B3C] hover:text-[#0D2B1A] transition-colors">
                Manage <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            {squad.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/20 p-6 text-center">
                <Users className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
                <p className="text-sm font-medium text-white">No squad yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Wedzera vatambi — Add players</p>
                <Link href="/coach/squad" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors">
                  Add players
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                {squad.slice(0, 6).map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                        {m.shirt_no}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{m.player?.name ?? "—"}</p>
                        <p className="text-xs capitalize text-muted-foreground">{m.position}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[m.status] ?? "bg-muted text-muted-foreground"}`}>
                      {m.status}
                    </span>
                  </div>
                ))}
                {squad.length > 6 && (
                  <Link href="/coach/squad" className="block pt-1 text-center text-xs text-accent hover:text-white transition-colors">
                    +{squad.length - 6} more →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
