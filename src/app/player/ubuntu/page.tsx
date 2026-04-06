"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, ArrowLeft, Calendar, MapPin, Star,
  Plus, Trophy, ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";
import api from "@/lib/api";
import UbuntuSuggestionCard from "@/components/ubuntu/UbuntuSuggestionCard";

// ── Types ──────────────────────────────────────────────────────────────────────

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

interface GroupMember {
  user_id: string;
  name: string;
  role: "member" | "leader";
  joined_at: string;
}

interface UbuntuSessionItem {
  id: string;
  session_date: string;
  focus: string;
  notes: string | null;
}

interface GroupDetail {
  id: string;
  name: string;
  area_label: string;
  my_role: "member" | "leader";
  member_count: number;
  members: GroupMember[];
  last_session: UbuntuSessionItem | null;
}

interface Suggestion {
  user_id: string;
  name: string;
  area: string;
  strengths: string[];
  they_have: string[];
  match_reason: string;
  connection_id?: string;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-teal-400">
      {children}
    </p>
  );
}

function LeadershipBadge({ score }: { score: number }) {
  const tier =
    score >= 100 ? { label: "Ubuntu Elder",   color: "text-[#f0b429]",  border: "border-[#f0b429]/30",  bg: "bg-[#f0b429]/10" } :
    score >= 50  ? { label: "Team Builder",    color: "text-teal-300",   border: "border-teal-500/30",   bg: "bg-teal-900/20"  } :
                   { label: "Rising Leader",   color: "text-white/60",   border: "border-white/10",      bg: "bg-white/5"       };

  return (
    <div className={`rounded-2xl border p-4 ${tier.border} ${tier.bg}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className={`h-5 w-5 ${tier.color}`} />
          <p className={`font-bold ${tier.color}`}>{tier.label}</p>
        </div>
        <span className={`text-2xl font-bold ${tier.color}`}>{score}</span>
      </div>
      <div className="space-y-1.5 text-xs text-white/40">
        <p className="flex justify-between">
          <span>Lead a session</span>
          <span className="text-white/60">+5 pts</span>
        </p>
        <p className="flex justify-between">
          <span>Accept a connection</span>
          <span className="text-white/60">+10 pts</span>
        </p>
        <p className="flex justify-between">
          <span>50 pts — unlock group leader role</span>
          <span className={score >= 50 ? "text-teal-400" : "text-white/20"}>
            {score >= 50 ? "✓ Unlocked" : `${50 - score} to go`}
          </span>
        </p>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function UbuntuPage() {
  const router = useRouter();

  const [partners,     setPartners]     = useState<Partner[]>([]);
  const [group,        setGroup]        = useState<GroupDetail | null>(null);
  const [suggestions,  setSuggestions]  = useState<Suggestion[]>([]);
  const [myScore,      setMyScore]      = useState(0);
  const [loading,      setLoading]      = useState(true);

  // Session log form
  const [sessionOpen,  setSessionOpen]  = useState(false);
  const [sessionDate,  setSessionDate]  = useState(new Date().toISOString().slice(0, 10));
  const [sessionFocus, setSessionFocus] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [savingSession, setSavingSession] = useState(false);
  const [sessionSaved,  setSessionSaved]  = useState(false);

  // AI drill suggestion
  const [drillSuggestion, setDrillSuggestion] = useState<string | null>(null);
  const [loadingDrills,   setLoadingDrills]   = useState(false);

  // Group members expand
  const [membersOpen, setMembersOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/ubuntu/connections").catch(() => ({ data: { data: [] } })),
      api.get("/ubuntu/suggestions").catch(() => ({ data: { data: [] } })),
      api.get("/profile").catch(() => ({ data: {} })),
    ]).then(([connRes, sugRes, profRes]) => {
      const fetchedPartners: Partner[] = connRes.data?.data ?? [];
      setPartners(fetchedPartners);
      setSuggestions(sugRes.data?.data ?? []);
      setMyScore(profRes.data?.profile?.leadership_score ?? 0);

      // Load group detail from first partner's group_id
      const groupId = fetchedPartners.find((p) => p.group_id)?.group_id;
      if (groupId) {
        api.get(`/ubuntu/groups/${groupId}`).then((r) => {
          setGroup(r.data?.data ?? null);
        }).catch(() => {});
      }
    }).finally(() => setLoading(false));
  }, []);

  const logSession = async () => {
    const groupId = partners.find((p) => p.group_id)?.group_id;
    if (!groupId || !sessionFocus.trim()) return;
    setSavingSession(true);
    try {
      await api.post(`/ubuntu/groups/${groupId}/session`, {
        session_date: sessionDate,
        focus: sessionFocus.trim(),
        notes: sessionNotes.trim() || undefined,
      });
      setSessionOpen(false);
      setSessionFocus("");
      setSessionNotes("");
      setSessionSaved(true);
      setMyScore((s) => s + 5);
      setTimeout(() => setSessionSaved(false), 3000);
    } catch {
      // silently fail
    } finally {
      setSavingSession(false);
    }
  };

  const fetchDrillSuggestion = async () => {
    const groupId = partners.find((p) => p.group_id)?.group_id;
    if (!groupId || loadingDrills) return;
    setLoadingDrills(true);
    try {
      // Ask THUTO for a group drill suggestion
      const res = await api.post("/thuto/chat", {
        message: `Suggest one specific drill for our Ubuntu training group to do together at our next session. Keep it short — one drill, one sentence why it helps the group grow together.`,
      });
      setDrillSuggestion(res.data?.answer ?? res.data?.response ?? null);
    } catch {
      // silently fail
    } finally {
      setLoadingDrills(false);
    }
  };

  const handleSuggestionRespond = (response: "accepted" | "declined", userId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.user_id !== userId));
    if (response === "accepted") {
      // Refresh partners
      api.get("/ubuntu/connections").then((r) => {
        setPartners(r.data?.data ?? []);
      }).catch(() => {});
    }
  };

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

  const groupId = partners.find((p) => p.group_id)?.group_id ?? null;

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
              <p className="text-xs font-medium uppercase tracking-widest text-teal-400">Ubuntu Network</p>
              <h1 className="text-lg font-bold text-white">Train Together</h1>
            </div>
            {/* Leadership score pill in header */}
            {myScore > 0 && (
              <div className="ml-auto flex items-center gap-1.5 rounded-full border border-[#f0b429]/20 bg-[#f0b429]/10 px-3 py-1">
                <Trophy className="h-3 w-3 text-[#f0b429]" />
                <span className="text-xs font-bold text-[#f0b429]">{myScore} pts</span>
              </div>
            )}
          </div>
          <p className="pl-11 text-xs italic text-white/30">
            &quot;Umuntu ngumuntu ngabantu&quot; — I am because we are
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-6 px-4 py-6">

        {/* ── THUTO SUGGESTIONS ──────────────────────────────────────────────── */}
        {suggestions.length > 0 && (
          <section>
            <SectionLabel>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                THUTO Suggestions
              </span>
            </SectionLabel>
            <div className="space-y-3">
              {suggestions.map((s) => (
                s.connection_id ? (
                  <UbuntuSuggestionCard
                    key={s.user_id}
                    connectionId={s.connection_id}
                    thutoMessage={s.match_reason}
                    matchName={s.name}
                    matchArea={s.area}
                    theyHave={s.they_have}
                    theirStrengths={s.strengths}
                    onRespond={(resp) => handleSuggestionRespond(resp, s.user_id)}
                  />
                ) : (
                  // No connection_id yet — suggestion came from GET /ubuntu/suggestions
                  // (AI hasn't created the connection row yet — show read-only card)
                  <div key={s.user_id} className="rounded-2xl border border-teal-500/20 bg-teal-900/10 p-4 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-teal-400/40 bg-gradient-to-br from-teal-600 to-emerald-700">
                        <span className="text-xs font-bold text-white">T</span>
                      </div>
                      <p className="text-sm leading-relaxed text-white/70 italic">&quot;{s.match_reason}&quot;</p>
                    </div>
                    <div className="ml-11 flex items-center gap-2 text-sm text-white/50">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-800/50 text-xs font-bold text-teal-300">
                        {s.name.charAt(0)}
                      </div>
                      <span>{s.name}</span>
                      {s.area && (
                        <span className="flex items-center gap-0.5 text-xs text-white/30">
                          <MapPin className="h-3 w-3" />{s.area}
                        </span>
                      )}
                    </div>
                    <p className="ml-11 text-[11px] text-white/25 italic">
                      Check your notifications to respond to this match
                    </p>
                  </div>
                )
              ))}
            </div>
          </section>
        )}

        {/* ── MY TRAINING PARTNERS ───────────────────────────────────────────── */}
        <section>
          <SectionLabel>My Training Partners ({partners.length})</SectionLabel>
          {partners.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-white/20" />
              <p className="text-sm font-medium text-white/50">No training partners yet</p>
              <p className="mt-1 text-xs text-white/30">
                THUTO runs matches daily at 08:00 — opt in from the dashboard to get started
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {partners.map((p) => (
                <div
                  key={p.connection_id}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-teal-900/50 text-sm font-bold text-teal-300">
                    {p.peer_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{p.peer_name}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-white/35">
                      {p.area && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />{p.area}
                        </span>
                      )}
                      {p.strengths.slice(0, 2).map((s) => (
                        <span key={s} className="flex items-center gap-0.5 text-teal-400/60">
                          <Star className="h-2.5 w-2.5" />{s}
                        </span>
                      ))}
                    </div>
                  </div>
                  {p.accepted_at && (
                    <p className="flex-shrink-0 text-[11px] text-white/20">
                      {new Date(p.accepted_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short" })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── MY GROUP ───────────────────────────────────────────────────────── */}
        {group && (
          <section>
            <SectionLabel>My Group</SectionLabel>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
              {/* Group header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-white">{group.name}</p>
                  <p className="flex items-center gap-1 text-xs text-white/40">
                    <MapPin className="h-3 w-3" />{group.area_label}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  group.my_role === "leader"
                    ? "bg-[#f0b429]/15 text-[#f0b429]"
                    : "bg-white/5 text-white/40"
                }`}>
                  {group.my_role === "leader" ? "Leader" : "Member"}
                </span>
              </div>

              {/* Members toggle */}
              <button
                onClick={() => setMembersOpen((v) => !v)}
                className="flex w-full items-center justify-between text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {group.member_count} member{group.member_count !== 1 ? "s" : ""}
                </span>
                {membersOpen
                  ? <ChevronUp className="h-3.5 w-3.5" />
                  : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              {membersOpen && (
                <div className="space-y-1.5 border-t border-white/5 pt-2">
                  {group.members.map((m) => (
                    <div key={m.user_id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-900/50 text-[10px] font-bold text-teal-300">
                          {m.name.charAt(0)}
                        </div>
                        <span className="text-white/60">{m.name}</span>
                      </div>
                      {m.role === "leader" && (
                        <span className="text-[#f0b429]/70">Leader</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Last session */}
              {group.last_session && (
                <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                  <Calendar className="h-3.5 w-3.5 text-teal-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-white/60 truncate">
                      Last session: <span className="text-white">{group.last_session.focus}</span>
                    </p>
                    <p className="text-[11px] text-white/30">
                      {new Date(group.last_session.session_date).toLocaleDateString("en-ZW", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* THUTO drill suggestion */}
              <div>
                {drillSuggestion ? (
                  <div className="flex items-start gap-2 rounded-xl border border-teal-500/20 bg-teal-900/20 p-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-emerald-700 text-[10px] font-bold text-white">
                      T
                    </div>
                    <p className="text-xs leading-relaxed text-white/70 italic">{drillSuggestion}</p>
                  </div>
                ) : (
                  <button
                    onClick={fetchDrillSuggestion}
                    disabled={loadingDrills}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-teal-500/20 py-2 text-xs text-teal-400/60 hover:border-teal-500/40 hover:text-teal-300 disabled:opacity-50 transition-colors"
                  >
                    {loadingDrills ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border border-teal-400/30 border-t-teal-400" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {loadingDrills ? "THUTO is thinking..." : "Ask THUTO for a group drill"}
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── LOG A SESSION ──────────────────────────────────────────────────── */}
        {groupId && (
          <section>
            <SectionLabel>Log a Group Session</SectionLabel>
            {sessionSaved && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-900/20 px-4 py-2.5">
                <Star className="h-4 w-4 text-teal-400" />
                <p className="text-sm text-teal-300">Session saved — +5 leadership points earned!</p>
              </div>
            )}
            {!sessionOpen ? (
              <button
                onClick={() => setSessionOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-4 text-sm font-medium text-white/50 transition-colors hover:border-teal-500/30 hover:text-teal-300"
              >
                <Plus className="h-4 w-4" />
                Log a session
              </button>
            ) : (
              <div className="rounded-2xl border border-teal-500/20 bg-teal-900/10 p-4 space-y-3">
                <p className="text-sm font-semibold text-white">Today&apos;s session</p>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-teal-500/50"
                />
                <input
                  value={sessionFocus}
                  onChange={(e) => setSessionFocus(e.target.value)}
                  placeholder="What did you focus on? (e.g. Shooting drills)"
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
                    onClick={logSession}
                    disabled={savingSession || !sessionFocus.trim()}
                    className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-40 transition-colors"
                  >
                    {savingSession ? "Saving..." : "Save Session +5pts"}
                  </button>
                  <button
                    onClick={() => setSessionOpen(false)}
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/40 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── LEADERSHIP SCORE ───────────────────────────────────────────────── */}
        <section>
          <SectionLabel>Leadership Score</SectionLabel>
          <LeadershipBadge score={myScore} />
        </section>

      </div>
    </div>
  );
}
