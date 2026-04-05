"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, UserPlus, Calendar, ArrowLeft, CheckCircle2,
  XCircle, Clock, MapPin, ChevronRight, Plus, LogOut,
} from "lucide-react";
import api from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Connection {
  id: string;
  peer_id: string;
  peer_name: string;
  status: "pending" | "accepted" | "declined" | "ended";
  initiated_by: "ai" | "player";
  ai_match_reason: string | null;
  accepted_at: string | null;
  direction: "sent" | "received";
}

interface GroupMember {
  user_id: string;
  name: string;
  role: "member" | "leader";
  joined_at: string;
}

interface UbuntuSession {
  id: string;
  session_date: string;
  focus: string;
  notes: string | null;
  leader?: { id: string; name: string } | null;
}

interface Group {
  id: string;
  name: string;
  area_label: string;
  my_role: "member" | "leader";
  member_count: number;
  members: GroupMember[];
  last_session: UbuntuSession | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  pending:  "bg-yellow-500/15 text-yellow-300",
  accepted: "bg-teal-500/15 text-teal-300",
  declined: "bg-red-500/15 text-red-400",
  ended:    "bg-white/5 text-white/30",
};

type Tab = "connections" | "groups";

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function UbuntuPage() {
  const router = useRouter();

  const [tab,         setTab]         = useState<Tab>("connections");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [groups,      setGroups]      = useState<Group[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  // New group form
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName,     setGroupName]     = useState("");
  const [groupArea,     setGroupArea]     = useState("");
  const [savingGroup,   setSavingGroup]   = useState(false);

  // Session log form
  const [sessionGroupId, setSessionGroupId] = useState<string | null>(null);
  const [sessionDate,    setSessionDate]    = useState(new Date().toISOString().slice(0, 10));
  const [sessionFocus,   setSessionFocus]   = useState("");
  const [sessionNotes,   setSessionNotes]   = useState("");
  const [savingSession,  setSavingSession]  = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/ubuntu/connections"),
      api.get("/ubuntu/groups"),
    ])
      .then(([connRes, groupRes]) => {
        setConnections(connRes.data?.data ?? []);
        setGroups(groupRes.data?.data ?? []);
      })
      .catch(() => setError("Could not load Ubuntu data."))
      .finally(() => setLoading(false));
  }, []);

  const respondToConnection = async (id: string, action: "accept" | "decline") => {
    await api.patch(`/ubuntu/connections/${id}/${action}`);
    setConnections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: action === "accept" ? "accepted" : "declined" } : c))
    );
  };

  const endConnection = async (id: string) => {
    await api.patch(`/ubuntu/connections/${id}/end`);
    setConnections((prev) => prev.map((c) => (c.id === id ? { ...c, status: "ended" } : c)));
  };

  const createGroup = async () => {
    if (!groupName.trim() || !groupArea.trim()) return;
    setSavingGroup(true);
    try {
      const res = await api.post("/ubuntu/groups", { name: groupName.trim(), area_label: groupArea.trim() });
      setGroups((prev) => [res.data.data, ...prev]);
      setGroupName("");
      setGroupArea("");
      setShowGroupForm(false);
    } catch {
      // silently fail — user can retry
    } finally {
      setSavingGroup(false);
    }
  };

  const leaveGroup = async (id: string) => {
    await api.delete(`/ubuntu/groups/${id}/leave`);
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  const logSession = async () => {
    if (!sessionGroupId || !sessionFocus.trim()) return;
    setSavingSession(true);
    try {
      await api.post(`/ubuntu/groups/${sessionGroupId}/sessions`, {
        session_date: sessionDate,
        focus: sessionFocus.trim(),
        notes: sessionNotes.trim() || undefined,
      });
      setSessionGroupId(null);
      setSessionFocus("");
      setSessionNotes("");
    } catch {
      // silently fail
    } finally {
      setSavingSession(false);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────

  const pending   = connections.filter((c) => c.status === "pending" && c.direction === "received");
  const accepted  = connections.filter((c) => c.status === "accepted");

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-lg space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
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
          <div className="mb-3 flex items-center gap-3">
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
          <p className="text-xs text-white/40 italic">
            "Umuntu ngumuntu ngabantu" — I am because we are
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0d1f12]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg">
          {(["connections", "groups"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? "border-b-2 border-teal-400 text-teal-300"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {t}
              {t === "connections" && pending.length > 0 && (
                <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white">
                  {pending.length}
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

        {/* ── CONNECTIONS TAB ──────────────────────────────────────────────── */}
        {tab === "connections" && (
          <>
            {/* Pending requests */}
            {pending.length > 0 && (
              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-400">
                  Connection Requests
                </p>
                <div className="space-y-2">
                  {pending.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-white">{c.peer_name}</p>
                          {c.ai_match_reason && (
                            <p className="mt-0.5 text-xs text-white/40 italic">{c.ai_match_reason}</p>
                          )}
                          <span className="mt-1 inline-block rounded-full bg-teal-900/40 px-2 py-0.5 text-[10px] text-teal-300">
                            {c.initiated_by === "ai" ? "AI suggested" : "Player request"}
                          </span>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => respondToConnection(c.id, "accept")}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white hover:bg-teal-500 transition-colors"
                            title="Accept"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => respondToConnection(c.id, "decline")}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/50 hover:bg-white/20 transition-colors"
                            title="Decline"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Accepted connections */}
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/40">
                Training Partners ({accepted.length})
              </p>
              {accepted.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                  <Users className="mx-auto mb-3 h-8 w-8 text-white/20" />
                  <p className="text-sm font-medium text-white/60">No training partners yet</p>
                  <p className="mt-1 text-xs text-white/30">
                    THUTO will suggest players near you to train with
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {accepted.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-900/50 text-sm font-bold text-teal-300">
                          {c.peer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{c.peer_name}</p>
                          {c.accepted_at && (
                            <p className="text-xs text-white/30">
                              Training since {new Date(c.accepted_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short" })}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => endConnection(c.id)}
                        className="text-xs text-white/20 hover:text-red-400 transition-colors"
                        title="End connection"
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Sent / declined / ended (collapsed) */}
            {connections.filter((c) => !["pending", "accepted"].includes(c.status) || (c.status === "pending" && c.direction === "sent")).length > 0 && (
              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/30">Other</p>
                <div className="space-y-1.5">
                  {connections
                    .filter((c) => c.status !== "accepted" && !(c.status === "pending" && c.direction === "received"))
                    .map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5"
                      >
                        <p className="text-sm text-white/50">{c.peer_name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[c.status]}`}>
                          {c.status}
                        </span>
                      </div>
                    ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ── GROUPS TAB ───────────────────────────────────────────────────── */}
        {tab === "groups" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
                My Groups ({groups.length})
              </p>
              <button
                onClick={() => setShowGroupForm((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                New Group
              </button>
            </div>

            {/* Create group form */}
            {showGroupForm && (
              <div className="rounded-2xl border border-teal-500/20 bg-teal-900/10 p-4 space-y-3">
                <p className="text-sm font-semibold text-white">Create a Training Group</p>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name (e.g. Mbare Strikers)"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-teal-500/50"
                  maxLength={120}
                />
                <input
                  value={groupArea}
                  onChange={(e) => setGroupArea(e.target.value)}
                  placeholder="Area (e.g. Mbare, Harare)"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-teal-500/50"
                  maxLength={120}
                />
                <div className="flex gap-2">
                  <button
                    onClick={createGroup}
                    disabled={savingGroup || !groupName.trim() || !groupArea.trim()}
                    className="flex-1 rounded-xl bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-40 transition-colors"
                  >
                    {savingGroup ? "Creating..." : "Create Group"}
                  </button>
                  <button
                    onClick={() => setShowGroupForm(false)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/40 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Group list */}
            {groups.length === 0 && !showGroupForm ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                <Users className="mx-auto mb-3 h-8 w-8 text-white/20" />
                <p className="text-sm font-medium text-white/60">No groups yet</p>
                <p className="mt-1 text-xs text-white/30">
                  Create a group to train with players in your area
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map((g) => (
                  <div key={g.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                    {/* Group header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-white">{g.name}</p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/40">
                          <MapPin className="h-3 w-3" />
                          {g.area_label}
                          <span className="text-white/20">·</span>
                          <Users className="h-3 w-3" />
                          {g.member_count} member{g.member_count !== 1 ? "s" : ""}
                          {g.my_role === "leader" && (
                            <>
                              <span className="text-white/20">·</span>
                              <span className="text-teal-400">Leader</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => leaveGroup(g.id)}
                        className="text-xs text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
                        title="Leave group"
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Last session */}
                    {g.last_session && (
                      <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                        <Calendar className="h-3.5 w-3.5 text-teal-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-white/60 truncate">
                            Last: <span className="text-white">{g.last_session.focus}</span>
                          </p>
                          <p className="text-[11px] text-white/30">
                            {new Date(g.last_session.session_date).toLocaleDateString("en-ZW", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Log session button */}
                    {sessionGroupId === g.id ? (
                      <div className="space-y-2 border-t border-white/10 pt-3">
                        <p className="text-xs font-semibold text-white/60">Log a session</p>
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
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-teal-500/50 resize-none"
                          maxLength={2000}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={logSession}
                            disabled={savingSession || !sessionFocus.trim()}
                            className="flex-1 rounded-xl bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-40 transition-colors"
                          >
                            {savingSession ? "Saving..." : "Save Session"}
                          </button>
                          <button
                            onClick={() => setSessionGroupId(null)}
                            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/40 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSessionGroupId(g.id)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 py-2 text-xs text-white/40 hover:border-teal-500/30 hover:text-teal-300 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Log session
                      </button>
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
