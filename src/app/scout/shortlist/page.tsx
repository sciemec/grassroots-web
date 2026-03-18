"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, Trash2, Brain, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";
import { queryAI } from "@/lib/ai-query";

interface ShortlistPlayer {
  id: string;
  initials: string;
  position: string;
  province: string;
  age_group: string;
  overall_score: number | null;
  talent_score: number | null;
  added_at: string;
  notes?: string;
}

export default function ScoutShortlistPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [shortlist, setShortlist] = useState<ShortlistPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState<string[]>([]);
  const [aiComparison, setAiComparison] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    // Attempt to load shortlist from scout API
    api.get("/scout/contact-requests")
      .then((res) => {
        // Map contact request data to shortlist format
        const raw = res.data?.data ?? res.data ?? [];
        setShortlist(raw.map((r: { id: string; player?: { id?: string; initials?: string; position?: string; region?: string; age_group?: string; overall_score?: number }; created_at: string }) => ({
          id: r.id,
          initials: r.player?.initials ?? "?",
          position: r.player?.position ?? "Unknown",
          province: r.player?.region ?? "Zimbabwe",
          age_group: r.player?.age_group ?? "senior",
          overall_score: r.player?.overall_score ?? null,
          talent_score: null,
          added_at: r.created_at,
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, router]);

  const toggleCompare = (id: string) => {
    setComparing((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const generateComparison = async () => {
    setLoadingAi(true);
    const selected = shortlist.filter((p) => comparing.includes(p.id));
    const summary = selected.map((p) => `${p.initials} (${p.position}, ${p.age_group}, ${p.province}): score ${p.overall_score ?? "N/A"}`).join(" vs ");
    try {
      const reply = await queryAI(`Compare these players for scouting: ${summary}. Provide a brief comparison of their potential, key differences, and a recommendation on who to prioritize for signing. Write in professional scouting language.`, "scout");
      setAiComparison(reply);
    } catch { setAiComparison("Unable to generate comparison."); }
    finally { setLoadingAi(false); }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/scout" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">My Shortlist</h1>
              <p className="text-sm text-muted-foreground">Players you&apos;ve contacted or saved</p>
            </div>
          </div>
          {comparing.length >= 2 && (
            <button onClick={generateComparison} disabled={loadingAi}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors">
              {loadingAi ? <><Loader2 className="h-4 w-4 animate-spin" /> Comparing…</> : <><Brain className="h-4 w-4" /> Compare ({comparing.length})</>}
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : shortlist.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Star className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Shortlist empty</p>
            <p className="mt-1 text-sm text-muted-foreground">Contact players from the search page to build your shortlist</p>
            <Link href="/scout" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              Search players
            </Link>
          </div>
        ) : (
          <>
            {comparing.length >= 2 && (
              <div className="mb-4 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-700">
                {comparing.length} players selected for comparison. Click &quot;Compare&quot; for an AI analysis.
              </div>
            )}

            <div className="mb-6 space-y-3">
              {shortlist.map((player) => (
                <div key={player.id}
                  className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                    comparing.includes(player.id) ? "border-purple-500/40 bg-purple-500/5" : "bg-card"
                  }`}>
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-muted text-base font-bold">
                    {player.initials}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{player.initials}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{player.position}</span>
                      <span className="text-xs uppercase text-muted-foreground">{player.age_group}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{player.province}</p>
                  </div>
                  {player.overall_score && (
                    <div className="text-center">
                      <p className="text-xl font-bold text-primary">{player.overall_score}%</p>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                  )}
                  <button onClick={() => toggleCompare(player.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      comparing.includes(player.id) ? "bg-purple-500 text-white" : "border hover:bg-muted"
                    }`}>
                    {comparing.includes(player.id) ? "✓ Compare" : "Compare"}
                  </button>
                  <button className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {aiComparison && (
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <h3 className="font-semibold text-purple-700">AI Scouting Comparison</h3>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{aiComparison}</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
