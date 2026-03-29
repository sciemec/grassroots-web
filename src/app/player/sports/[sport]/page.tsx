"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Brain, Save, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { SPORT_MAP, SPORT_STATS, getSportAnalysisPrompt, SportKey } from "@/config/sports";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";
import { queryAI } from "@/lib/ai-query";

interface StatEntry {
  [key: string]: string | number;
}

interface AiResponse {
  text: string;
  loading: boolean;
  error: string;
}

function StatField({ name, value, onChange }: {
  name: string;
  value: string | number;
  onChange: (v: string) => void;
}) {
  const label = name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type={name.includes("Pct") || name.includes("Accuracy") || name.includes("Economy") ? "text" : "number"}
        step={name.includes("Pct") || name.includes("Accuracy") ? "0.1" : "1"}
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="w-full rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

export default function SportStatsPage() {
  const { sport } = useParams<{ sport: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const sportKey = sport as SportKey;
  const cfg = SPORT_MAP[sportKey];

  const [roleKey, setRoleKey] = useState<string>("all");
  const [stats, setStats] = useState<StatEntry>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [context, setContext] = useState("");
  const [ai, setAi] = useState<AiResponse>({ text: "", loading: false, error: "" });
  const [history, setHistory] = useState<{ date: string; role: string; stats: StatEntry }[]>([]);

  const sportRoles = useMemo(
    () => SPORT_STATS[sportKey] ?? { all: ["minutesPlayed", "goals", "assists"] },
    [sportKey]
  );
  const roleKeys = Object.keys(sportRoles);

  // Initialise stat fields as empty strings
  const initStats = useCallback((rk: string) => {
    const fields = sportRoles[rk] ?? [];
    const blank: StatEntry = {};
    fields.forEach((f) => { blank[f] = ""; });
    setStats(blank);
  }, [sportRoles]);

  useEffect(() => {
    // guests allowed — no login redirect
    if (!cfg) { router.push("/player/sports"); return; }
    initStats(roleKey);

    api.get(`/profile/sports/${sportKey}/stats`)
      .then((r) => setHistory(r.data ?? []))
      .catch(() => {});
  }, [user, router, cfg, sportKey, roleKey, initStats]);

  const onRoleChange = (rk: string) => {
    setRoleKey(rk);
    initStats(rk);
  };

  const saveStats = async () => {
    setSaving(true);
    try {
      await api.post(`/profile/sports/${sportKey}/stats`, { role: roleKey, stats });
      const newEntry = { date: new Date().toISOString(), role: roleKey, stats };
      setHistory((prev) => [newEntry, ...prev.slice(0, 9)]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const getAiFeedback = async () => {
    setAi({ text: "", loading: true, error: "" });

    const statSummary = Object.entries(stats)
      .filter(([, v]) => v !== "" && v !== 0)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    const systemPrompt = getSportAnalysisPrompt(sportKey, statSummary || "No stats provided.", roleKey);
    const message = [
      systemPrompt,
      context ? `Additional context: ${context}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      const reply = await queryAI(message, "player");
      setAi({ text: reply, loading: false, error: "" });
    } catch {
      setAi({ text: "", loading: false, error: "Failed to get AI feedback. Please try again." });
    }
  };

  if (!cfg) return null;

  const fields = sportRoles[roleKey] ?? [];

  // Netball court diagram — highlights zones for each role
  const NETBALL_ZONES: Record<string, { thirds: ("defending" | "centre" | "attacking")[]; label: string }> = {
    shooter:  { thirds: ["attacking"],            label: "Attacking third — GS/GA" },
    midcourt: { thirds: ["centre"],               label: "Centre third — WA/C/WD" },
    defender: { thirds: ["defending"],            label: "Defending third — GD/GK" },
  };
  const courtZone = NETBALL_ZONES[roleKey];

  function NetballCourt() {
    const thirds = ["defending", "centre", "attacking"] as const;
    const thirdColors: Record<string, string> = {
      defending: "#1E6B3C",
      centre:    "#D4900A",
      attacking: "#B5261E",
    };
    const active = courtZone?.thirds ?? [];
    return (
      <div className="rounded-xl border bg-card p-5">
        <p className="mb-3 text-sm font-semibold">Court Position Zones</p>
        <svg viewBox="0 0 240 140" className="w-full max-w-xs mx-auto" style={{ borderRadius: 8, border: "1px solid #ffffff18" }}>
          {/* Court outline */}
          <rect x="0" y="0" width="240" height="140" rx="4" fill="#0a150c" />
          {/* Three thirds */}
          {thirds.map((t, i) => {
            const x = i * 80;
            const isActive = active.includes(t);
            return (
              <g key={t}>
                <rect x={x} y="0" width="80" height="140"
                  fill={isActive ? `${thirdColors[t]}44` : "#ffffff06"}
                  stroke={isActive ? thirdColors[t] : "#ffffff15"}
                  strokeWidth={isActive ? 1.5 : 0.5}
                />
                {/* Goal circles */}
                {i === 0 && <ellipse cx="40" cy="70" rx="22" ry="22" fill="none" stroke={isActive ? thirdColors[t] : "#ffffff20"} strokeWidth="1" />}
                {i === 2 && <ellipse cx="200" cy="70" rx="22" ry="22" fill="none" stroke={isActive ? thirdColors[t] : "#ffffff20"} strokeWidth="1" />}
                {/* Centre circle */}
                {i === 1 && <circle cx="120" cy="70" r="14" fill="none" stroke={isActive ? thirdColors[t] : "#ffffff20"} strokeWidth="1" />}
                {/* Labels */}
                <text x={x + 40} y="70" textAnchor="middle" dominantBaseline="middle"
                  fill={isActive ? "#fff" : "#ffffff40"} fontSize="9" fontWeight={isActive ? "bold" : "normal"}>
                  {t === "defending" ? "DEF" : t === "centre" ? "MID" : "ATK"}
                </text>
                {/* Position abbreviations */}
                {t === "defending" && <>
                  <text x="20" y="30" textAnchor="middle" fill={isActive ? "#7fffb0" : "#ffffff25"} fontSize="7">GK</text>
                  <text x="60" y="50" textAnchor="middle" fill={isActive ? "#7fffb0" : "#ffffff25"} fontSize="7">GD</text>
                </>}
                {t === "centre" && <>
                  <text x="100" y="40" textAnchor="middle" fill={isActive ? "#ffd966" : "#ffffff25"} fontSize="7">WD</text>
                  <text x="120" y="25" textAnchor="middle" fill={isActive ? "#ffd966" : "#ffffff25"} fontSize="7">C</text>
                  <text x="140" y="40" textAnchor="middle" fill={isActive ? "#ffd966" : "#ffffff25"} fontSize="7">WA</text>
                </>}
                {t === "attacking" && <>
                  <text x="180" y="50" textAnchor="middle" fill={isActive ? "#ffaaaa" : "#ffffff25"} fontSize="7">GA</text>
                  <text x="220" y="30" textAnchor="middle" fill={isActive ? "#ffaaaa" : "#ffffff25"} fontSize="7">GS</text>
                </>}
              </g>
            );
          })}
          {/* Dividing lines */}
          <line x1="80" y1="0" x2="80" y2="140" stroke="#ffffff20" strokeWidth="0.5" />
          <line x1="160" y1="0" x2="160" y2="140" stroke="#ffffff20" strokeWidth="0.5" />
        </svg>
        {courtZone && (
          <p className="mt-2 text-center text-xs text-muted-foreground">{courtZone.label}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 pt-16 lg:pt-6">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <Link href="/player/sports" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-3xl">{cfg.emoji}</span>
            <div>
              <h1 className="text-2xl font-bold">{cfg.label}</h1>
              <p className="text-xs text-muted-foreground">{cfg.governingBody} · {cfg.competitions[0]}</p>
            </div>
          </div>

          {sportKey === "netball" && <NetballCourt />}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Stat entry */}
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-4 text-sm font-semibold">Log Performance Stats</h2>

                {/* Role tabs */}
                {roleKeys.length > 1 && (
                  <div className="mb-4 flex gap-2">
                    {roleKeys.map((rk) => (
                      <button
                        key={rk}
                        onClick={() => onRoleChange(rk)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                          roleKey === rk
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {rk}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {fields.map((field) => (
                    <StatField
                      key={field}
                      name={field}
                      value={stats[field] ?? ""}
                      onChange={(v) => setStats((prev) => ({ ...prev, [field]: v }))}
                    />
                  ))}
                </div>

                <button
                  onClick={saveStats}
                  disabled={saving}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50 transition-colors hover:bg-primary/90"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saved ? "Saved!" : saving ? "Saving…" : "Log stats"}
                </button>
              </div>

              {/* Recent history */}
              {history.length > 0 && (
                <div className="rounded-xl border bg-card p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold">Recent Entries</h2>
                  </div>
                  <div className="space-y-2">
                    {history.slice(0, 5).map((entry, i) => (
                      <div key={i} className="flex items-start justify-between rounded-lg bg-muted/40 px-3 py-2">
                        <div>
                          <p className="text-xs font-medium capitalize">{entry.role}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {Object.entries(entry.stats)
                              .filter(([, v]) => v !== "" && v !== 0)
                              .slice(0, 3)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(" · ")}
                          </p>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Feedback */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">AI Performance Feedback</h2>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Add context (optional)
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                  placeholder={`e.g. "This was a cup final, I played ${roleKey === "goalkeeper" || roleKey === "all" ? "centrally" : "on the right"}, we won 2-1…"`}
                  className="w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>

              <button
                onClick={getAiFeedback}
                disabled={ai.loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2.5 text-sm font-semibold text-primary disabled:opacity-50 transition-colors hover:bg-primary/20"
              >
                {ai.loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</>
                ) : (
                  <><Brain className="h-4 w-4" /> Get AI Feedback</>
                )}
              </button>

              {ai.error && (
                <p className="text-xs text-destructive">{ai.error}</p>
              )}

              {ai.text && (
                <div className="rounded-xl bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                  {ai.text}
                </div>
              )}

              {!ai.text && !ai.loading && (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <Brain className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">
                    Fill in your stats and click &ldquo;Get AI Feedback&rdquo; for personalised{" "}
                    {cfg.label.toLowerCase()} analysis from your AI coach.
                  </p>
                </div>
              )}

              {/* Competitions */}
              <div className="border-t pt-4">
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {cfg.governingBody} Competitions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {cfg.competitions.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
