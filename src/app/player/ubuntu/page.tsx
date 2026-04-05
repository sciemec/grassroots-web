"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, ArrowLeft, CheckCircle2, XCircle, MapPin,
  Plus, Sparkles, Star, Zap, Calendar,
} from "lucide-react";
import api from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Suggestion {
  user_id: string;
  name: string;
  area: string;
  strengths: string[];
  they_have: string[];
  match_reason: string;
  // connection_id is set after backend creates the pending row
  connection_id?: string;
}

interface Partner {
  connection_id: string;
  peer_id: string;
  peer_name: string;
  area: string | null;
  group_id: string | null;
  group_name: string | null;
  strengths: string[];
  leadership_score: number;
  accepted_at: string | null;
}

type Tab = "suggestions" | "partners";

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function UbuntuPage() {
  const router = useRouter();

  const [tab,         setTab]         = useState<Tab>("suggestions");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [partners,    setPartners]    = useState<Partner[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  // Per-suggestion responding state
  const [responding, setResponding] = useState<Record<string, boolean>>({});
  // Per-connection session form state
  const [sessionOpen,  setSessionOpen]  = useState<string | null>(null); // connection_id
  const [sessionDate,  setSessionDate]  = useState(new Date().toISOString().slice(0, 10));
  const [sessionFocus, setSessionFocus] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [savingSession, setSavingSession] = useState(false);
  const [sessionDone,  setSessionDone]  = useState<string | null>(null); // connection_id that just saved

  useEffect(() => {
    Promise.all([
      api.get("/ubuntu/suggestions").catch(() => ({ data: { data: [] } })),
      api.get("/ubuntu/connections").catch(() => ({ data: { data: [] } })),
    ]).then(([sugRes, partRes]) => {
      setSuggestions(sugRes.data?.data ?? []);
      setPartners(partRes.data?.data ?? []);
    })
      .catch(() => setError("Could not load Ubuntu data."))
      .finally(() => setLoading(false));
  }, []);

  // ── Respond to a suggestion ───────────────────────────────────────────────

  const respond = async (connectionId: string, response: "accepted" | "declined") => {
    setResponding((prev) => ({ ...prev, [connectionId]: true }));
    try {
      await api.post(`/ubuntu/connections/${connectionId}/respond`, { response });
      if (response === "accepted") {
        // Move from suggestions to partners list — reload partners
        const res = await api.get("/ubuntu/connections");
        setPartners(res.data?.data ?? []);
        setTab("partners");
      }
      // Remove from suggestions either way
      setSuggestions((prev) => prev.filter((s) => s.connection_id !== connectionId));
    } catch {
      // silently fail — user can retry
    } finally {
      setResponding((prev) => ({ ...prev, [connectionId]: false }));
    }
  };

  // ── Log a session ─────────────────────────────────────────────────────────

  const logSession = async (groupId: string, connectionId: string) => {
    if (!sessionFocus.trim()) return;
    setSavingSession(true);
    try {
      await api.post(`/ubuntu/groups/${groupId}/session`, {
        session_date: sessionDate,
        focus: sessionFocus.trim(),
        notes: sessionNotes.trim() || undefined,
      });
      setSessionOpen(null);
      setSessionFocus("");
      setSessionNotes("");
      setSessionDone(connectionId);
      setTimeout(() => setSessionDone(null), 3000);
    } catch {
      // silently fail
    } finally {
      setSavingSession(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-lg space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="border-b border-white/10 bg-[#0d1f12] px-4 py-4">
        <div className="mx-auto max-w-lg">
          <div className="mb-2 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-teal-400">Ubuntu</p>
              <h1 className="text-lg font-bold text-white">Train Together</h1>
            </div>
          </div>
          <p className="text-xs text-white/30 italic pl-11">
            "Umuntu ngumuntu ngabantu" — I am because we are
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0d1f12]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg">
          {(["suggestions", "partners"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? "border-b-2 border-teal-400 text-teal-300"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {t === "suggestions" ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  THUTO Suggestions
                  {suggestions.length > 0 && (
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white">
                      {suggestions.length}
                    </span>
                  )}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Partners
                  {partners.length > 0 && (
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-white/60">
                      {partners.length}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-5 space-y-4">

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* ── SUGGESTIONS TAB ──────────────────────────────────────────────── */}
        {tab === "suggestions" && (
          <>
            {suggestions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-teal-400/20 bg-teal-900/20">
                  <Sparkles className="h-6 w-6 text-teal-400/60" />
                </div>
                <p className="text-sm font-semibold text-white/60">No suggestions yet</p>
                <p className="mt-1 text-xs text-white/30 max-w-[220px] mx-auto">
                  THUTO finds players in your area each morning at 08:00. Make sure your Player DNA
                  has your location set.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-white/40">
                  THUTO matched these players near you — accept to start training together.
                </p>
                {suggestions.map((s) => (
                  <div
                    key={s.user_id}
                    className="rounded-2xl border border-teal-500/20 bg-teal-900/10 p-4 space-y-3"
                  >
                    {/* Player info */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-teal-800/60 text-sm font-bold text-teal-300">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">{s.name}</p>
                        {s.area && (
                          <p className="flex items-center gap-1 text-xs text-white/40">
                            <MapPin className="h-3 w-3" />
                            {s.area}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Match reason */}
                    <p className="text-xs text-white/50 italic leading-relaxed">
                      "{s.match_reason}"
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {s.they_have.map((item) => (
                        <span
                          key={item}
                          className="flex items-center gap-1 rounded-full bg-[#f0b429]/10 px-2 py-0.5 text-[11px] font-medium text-[#f0b429]"
                        >
                          <Zap className="h-2.5 w-2.5" />
                          has {item}
                        </span>
                      ))}
                      {s.strengths.map((skill) => (
                        <span
                          key={skill}
                          className="flex items-center gap-1 rounded-full bg-teal-900/40 px-2 py-0.5 text-[11px] text-teal-300"
                        >
                          <Star className="h-2.5 w-2.5" />
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Accept / Decline */}
                    {s.connection_id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => respond(s.connection_id!, "accepted")}
                          disabled={responding[s.connection_id]}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {responding[s.connection_id] ? "Connecting..." : "Train Together"}
                        </button>
                        <button
                          onClick={() => respond(s.connection_id!, "declined")}
                          disabled={responding[s.connection_id]}
                          className="flex items-center justify-center rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/40 hover:border-white/20 hover:text-white/70 disabled:opacity-50 transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-center text-xs text-white/30 italic">
                        Open the notification THUTO sent you to accept this match
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── PARTNERS TAB ─────────────────────────────────────────────────── */}
        {tab === "partners" && (
          <>
            {partners.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                <Users className="mx-auto mb-3 h-8 w-8 text-white/20" />
                <p className="text-sm font-semibold text-white/60">No training partners yet</p>
                <p className="mt-1 text-xs text-white/30">
                  Accept a THUTO suggestion to get your first partner
                </p>
                <button
                  onClick={() => setTab("suggestions")}
                  className="mt-4 rounded-xl bg-teal-600/20 border border-teal-500/30 px-4 py-2 text-xs font-semibold text-teal-300 hover:bg-teal-600/30 transition-colors"
                >
                  View Suggestions
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {partners.map((p) => (
                  <div
                    key={p.connection_id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3"
                  >
                    {/* Partner header */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-teal-900/50 text-sm font-bold text-teal-300">
                        {p.peer_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">{p.peer_name}</p>
                        <div className="flex items-center gap-2 text-xs text-white/40">
                          {p.area && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {p.area}
                            </span>
                          )}
                          {p.leadership_score > 0 && (
                            <span className="flex items-center gap-1 text-[#f0b429]/70">
                              <Star className="h-3 w-3" />
                              {p.leadership_score} pts
                            </span>
                          )}
                        </div>
                      </div>
                      {p.accepted_at && (
                        <p className="flex-shrink-0 text-[11px] text-white/25">
                          since {new Date(p.accepted_at).toLocaleDateString("en-ZW", {
                            day: "numeric", month: "short",
                          })}
                        </p>
                      )}
                    </div>

                    {/* Strengths */}
                    {p.strengths.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {p.strengths.map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-teal-900/30 px-2 py-0.5 text-[11px] text-teal-300/70"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Group info + session log */}
                    {p.group_id ? (
                      sessionOpen === p.connection_id ? (
                        <div className="space-y-2 border-t border-white/10 pt-3">
                          <p className="text-xs font-semibold text-white/60">
                            Log a session — {p.group_name ?? "your group"}
                          </p>
                          <input
                            type="date"
                            value={sessionDate}
                            onChange={(e) => setSessionDate(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-teal-500/50"
                          />
                          <input
                            value={sessionFocus}
                            onChange={(e) => setSessionFocus(e.target.value)}
                            placeholder="Focus (e.g. Shooting drills)"
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-teal-500/50"
                            maxLength={200}
                          />
                          <textarea
                            value={sessionNotes}
                            onChange={(e) => setSessionNotes(e.target.value)}
                            placeholder="Notes (optional)"
                            rows={2}
                            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-teal-500/50"
                            maxLength={2000}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => logSession(p.group_id!, p.connection_id)}
                              disabled={savingSession || !sessionFocus.trim()}
                              className="flex-1 rounded-xl bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-40 transition-colors"
                            >
                              {savingSession ? "Saving..." : "Save Session"}
                            </button>
                            <button
                              onClick={() => setSessionOpen(null)}
                              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/40 hover:text-white transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSessionOpen(p.connection_id)}
                          className={`flex w-full items-center justify-center gap-1.5 rounded-xl border py-2 text-xs transition-colors ${
                            sessionDone === p.connection_id
                              ? "border-teal-500/40 bg-teal-900/20 text-teal-300"
                              : "border-white/10 text-white/40 hover:border-teal-500/30 hover:text-teal-300"
                          }`}
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          {sessionDone === p.connection_id ? "Session saved ✓" : "Log a session"}
                        </button>
                      )
                    ) : (
                      <p className="text-center text-[11px] text-white/20 italic">
                        Group will be created when you first train together
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
