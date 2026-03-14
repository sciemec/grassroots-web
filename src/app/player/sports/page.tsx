"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { SportSelector } from "@/components/sports/sport-selector";
import { SPORT_MAP, SPORTS, SportKey } from "@/config/sports";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

interface SportEntry {
  sport: SportKey;
  position?: string;
  age_group?: string;
  primary: boolean;
}

export default function MySportsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<SportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [adding, setAdding] = useState(false);
  const [pickerSport, setPickerSport] = useState<SportKey | null>(null);
  const [pickerPosition, setPickerPosition] = useState("");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    api.get("/profile/sports")
      .then((r) => setEntries(r.data ?? []))
      .catch(() => {
        // Seed from primary sport in profile if no multi-sport data yet
        api.get("/profile").then((r) => {
          const sport = r.data.sport as SportKey | undefined;
          if (sport && SPORT_MAP[sport]) {
            setEntries([{ sport, position: r.data.position ?? "", age_group: r.data.age_group ?? "", primary: true }]);
          }
        }).catch(() => {});
      })
      .finally(() => setLoading(false));
  }, [user, router]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/profile/sports", { sports: entries });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silent — user sees no change
    } finally {
      setSaving(false);
    }
  };

  const addSport = () => {
    if (!pickerSport) return;
    if (entries.some((e) => e.sport === pickerSport)) {
      setAdding(false);
      setPickerSport(null);
      setPickerPosition("");
      return;
    }
    setEntries((prev) => [
      ...prev,
      { sport: pickerSport, position: pickerPosition, primary: prev.length === 0 },
    ]);
    setAdding(false);
    setPickerSport(null);
    setPickerPosition("");
  };

  const removeSport = (key: SportKey) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.sport !== key);
      // Re-assign primary to first if primary was removed
      if (next.length > 0 && !next.some((e) => e.primary)) {
        next[0].primary = true;
      }
      return next;
    });
  };

  const setPrimary = (key: SportKey) => {
    setEntries((prev) => prev.map((e) => ({ ...e, primary: e.sport === key })));
  };

  const unusedSports = SPORTS.filter((s) => !entries.some((e) => e.sport === s.key));

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-xl space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 pt-16 lg:pt-6">
        <div className="mx-auto max-w-xl">
          {/* Header */}
          <div className="mb-8 flex items-center gap-3">
            <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">My Sports</h1>
              <p className="text-sm text-muted-foreground">
                Track multiple sports — stats, AI feedback, and performance per sport
              </p>
            </div>
          </div>

          {/* Current sport entries */}
          <div className="space-y-3 mb-6">
            {entries.length === 0 && (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No sports added yet. Add your first sport below.
              </div>
            )}
            {entries.map((entry) => {
              const cfg = SPORT_MAP[entry.sport];
              return (
                <div key={entry.sport} className="flex items-center gap-3 rounded-xl border bg-card p-4">
                  <span className="text-3xl">{cfg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{cfg.label}</p>
                      {entry.primary && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.position ? entry.position : "No position set"} · {cfg.governingBody}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!entry.primary && (
                      <button
                        onClick={() => setPrimary(entry.sport)}
                        className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
                        title="Set as primary"
                      >
                        Set primary
                      </button>
                    )}
                    <Link
                      href={`/player/sports/${entry.sport}`}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      Stats <ChevronRight className="h-3 w-3" />
                    </Link>
                    <button
                      onClick={() => removeSport(entry.sport)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add sport */}
          {adding ? (
            <div className="rounded-xl border bg-card p-5 space-y-4 mb-6">
              <p className="text-sm font-semibold">Select sport to add</p>
              <SportSelector
                value={pickerSport ?? ([] as unknown as SportKey)}
                onChange={(v) => setPickerSport(v as SportKey)}
                multi={false}
                size="sm"
              />
              {pickerSport && SPORT_MAP[pickerSport]?.positions && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Position (optional)</label>
                  <select
                    value={pickerPosition}
                    onChange={(e) => setPickerPosition(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select position…</option>
                    {SPORT_MAP[pickerSport].positions?.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={addSport}
                  disabled={!pickerSport}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50 transition-colors hover:bg-primary/90"
                >
                  Add sport
                </button>
                <button
                  onClick={() => { setAdding(false); setPickerSport(null); setPickerPosition(""); }}
                  className="rounded-lg border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            unusedSports.length > 0 && (
              <button
                onClick={() => setAdding(true)}
                className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="h-4 w-4" /> Add another sport
              </button>
            )
          )}

          {/* Save */}
          <button
            onClick={save}
            disabled={saving || entries.length === 0}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50 transition-colors hover:bg-primary/90"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </span>
            ) : saved ? "Saved!" : "Save sports"}
          </button>

          {/* Quick links to individual sport pages */}
          {entries.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sport Pages
              </p>
              <div className="grid grid-cols-2 gap-3">
                {entries.map((entry) => {
                  const cfg = SPORT_MAP[entry.sport];
                  return (
                    <Link
                      key={entry.sport}
                      href={`/player/sports/${entry.sport}`}
                      className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:border-primary/40 hover:bg-muted/40 transition-colors"
                    >
                      <span className="text-2xl">{cfg.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold">{cfg.label}</p>
                        <p className="text-xs text-muted-foreground">Stats & AI Feedback</p>
                      </div>
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
