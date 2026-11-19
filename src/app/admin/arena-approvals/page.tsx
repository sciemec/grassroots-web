"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, XCircle, Clock, ChevronLeft, RefreshCw,
  Building2, Briefcase, Users, MapPin, Trophy, ShieldCheck, Flag, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

const API       = process.env.NEXT_PUBLIC_API_URL;
const GRS_GREEN = "#1a5c2a";

type PendingClub = {
  id: string;
  name: string;
  sport: string;
  province: string;
  tier: string | null;
  status: string;
  created_at: string;
  coach: { id: string; name: string } | null;
};

type PendingPosting = {
  id: string;
  position: string;
  sport: string;
  province: string | null;
  age_min: number;
  age_max: number;
  description: string;
  status: string;
  created_at: string;
  poster: { id: string; name: string } | null;
  club: { id: string; name: string } | null;
};

type ClubVerification = {
  id: string;
  club_id: string;
  club_name: string;
  contact_name: string;
  contact_role: string;
  contact_phone: string | null;
  contact_email: string | null;
  registration_number: string | null;
  governing_body: string | null;
  affiliation_number: string | null;
  registration_doc_url: string | null;
  submitted_by_name: string | null;
  status: string;
  created_at: string;
};

type ClubReport = {
  id: string;
  club_id: string;
  club_name: string;
  club_sport: string;
  club_province: string;
  club_status: string;
  reporter_name: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  club_open_reports: number;
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function ArenaApprovalsPage() {
  const token = useAuthStore((s) => s.token);

  const [tab, setTab]                   = useState<"clubs" | "talent" | "verifications" | "reports">("clubs");
  const [clubs, setClubs]               = useState<PendingClub[]>([]);
  const [postings, setPostings]         = useState<PendingPosting[]>([]);
  const [verifications, setVerifications] = useState<ClubVerification[]>([]);
  const [reports, setReports]           = useState<ClubReport[]>([]);
  const [loading, setLoading]           = useState(false);
  const [actionId, setActionId]         = useState<string | null>(null);
  const [rejectNotes, setRejectNotes]   = useState<Record<string, string>>({});

  const loadClubs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/arena/clubs?status=pending_approval`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setClubs(Array.isArray(json.data) ? json.data : []);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [token]);

  const loadPostings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/arena/talent-wanted?status=pending_approval`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setPostings(Array.isArray(json.data) ? json.data : []);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [token]);

  const loadVerifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/arena/club-verifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setVerifications(Array.isArray(json.data) ? json.data : []);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [token]);

  const loadReports = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/arena/club-reports?status=open`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setReports(Array.isArray(json.data) ? json.data : []);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (tab === "clubs")          loadClubs();
    if (tab === "talent")         loadPostings();
    if (tab === "verifications")  loadVerifications();
    if (tab === "reports")        loadReports();
  }, [tab, loadClubs, loadPostings, loadVerifications, loadReports]);

  const actOnClub = async (id: string, action: "approve" | "reject") => {
    if (!token) return;
    setActionId(id);
    try {
      const res = await fetch(`${API}/admin/arena/clubs/${id}/${action}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) setClubs((prev) => prev.filter((c) => c.id !== id));
    } catch { /* silent */ }
    setActionId(null);
  };

  const actOnVerification = async (id: string, action: "approve" | "reject") => {
    if (!token) return;
    setActionId(id);
    try {
      const res = await fetch(`${API}/admin/arena/club-verifications/${id}/${action}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: rejectNotes[id] ?? null }),
      });
      if (res.ok) setVerifications((prev) => prev.filter((v) => v.id !== id));
    } catch { /* silent */ }
    setActionId(null);
  };

  const resolveReport = async (id: string, resolution: "reviewed" | "dismissed", unsuspend = false) => {
    if (!token) return;
    setActionId(id);
    try {
      const res = await fetch(`${API}/admin/arena/club-reports/${id}/resolve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ resolution, unsuspend }),
      });
      if (res.ok) setReports((prev) => prev.filter((r) => r.id !== id));
    } catch { /* silent */ }
    setActionId(null);
  };

  const actOnPosting = async (id: string, action: "approve" | "reject") => {
    if (!token) return;
    setActionId(id);
    try {
      const res = await fetch(`${API}/admin/arena/talent-wanted/${id}/${action}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) setPostings((prev) => prev.filter((p) => p.id !== id));
    } catch { /* silent */ }
    setActionId(null);
  };

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/admin" className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <ChevronLeft size={18} className="text-gray-600" />
          </Link>
          <div className="flex-1">
            <p className="font-semibold text-sm text-gray-900">Arena Approvals</p>
            <p className="text-xs text-gray-400">Review clubs and talent board listings before they go live</p>
          </div>
          <button
            onClick={() => tab === "clubs" ? loadClubs() : loadPostings()}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <RefreshCw size={16} className="text-gray-500" />
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Tab switcher */}
        <div className="flex gap-2 flex-wrap">
          {([
            { key: "clubs",          label: "Clubs",         icon: <Building2 size={14} />,   count: clubs.length },
            { key: "talent",         label: "Talent Board",  icon: <Briefcase size={14} />,   count: postings.length },
            { key: "verifications",  label: "Verifications", icon: <ShieldCheck size={14} />, count: verifications.length },
            { key: "reports",        label: "Reports",       icon: <Flag size={14} />,         count: reports.length },
          ] as { key: typeof tab; label: string; icon: React.ReactNode; count: number }[]).map(({ key, label, icon, count }) => (
            <button key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors"
              style={{
                background:  tab === key ? GRS_GREEN : "white",
                color:       tab === key ? "white" : "#374151",
                borderColor: tab === key ? GRS_GREEN : "#e5e7eb",
              }}
            >
              {icon} {label} {count > 0 && tab !== key && `(${count})`}
            </button>
          ))}
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {/* Clubs list */}
        {!loading && tab === "clubs" && (
          <>
            {clubs.length === 0 ? (
              <div className="text-center py-16">
                <Trophy size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 text-sm">No clubs pending approval</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">{clubs.length} club{clubs.length !== 1 ? "s" : ""} waiting for review</p>
                {clubs.map((club) => {
                  const isAct = actionId === club.id;
                  return (
                    <div key={club.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3 flex-1 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                            style={{ background: GRS_GREEN }}
                          >
                            {club.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">{club.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-gray-500">
                              <span>{club.sport}</span>
                              <span className="text-gray-300">·</span>
                              <span className="flex items-center gap-0.5"><MapPin size={10} />{club.province}</span>
                              {club.tier && <><span className="text-gray-300">·</span><span>{club.tier}</span></>}
                            </div>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 flex-shrink-0">
                          <Clock size={10} /> Pending
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-3 text-[11px] text-gray-400">
                        {club.coach && (
                          <span className="flex items-center gap-1"><Users size={11} /> Coach: {club.coach.name}</span>
                        )}
                        <span>Submitted {timeAgo(club.created_at)}</span>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => actOnClub(club.id, "approve")}
                          disabled={isAct}
                          className="flex-1 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                          style={{ background: GRS_GREEN }}
                        >
                          <CheckCircle2 size={13} /> Approve
                        </button>
                        <button
                          onClick={() => actOnClub(club.id, "reject")}
                          disabled={isAct}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold border disabled:opacity-50 flex items-center justify-center gap-1.5"
                          style={{ borderColor: "#ef4444", color: "#ef4444" }}
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Talent Board list */}
        {!loading && tab === "talent" && (
          <>
            {postings.length === 0 ? (
              <div className="text-center py-16">
                <Briefcase size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 text-sm">No talent board listings pending approval</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">{postings.length} listing{postings.length !== 1 ? "s" : ""} waiting for review</p>
                {postings.map((posting) => {
                  const isAct = actionId === posting.id;
                  return (
                    <div key={posting.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3 flex-1 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                            style={{ background: "#7c3aed" }}
                          >
                            <Briefcase size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-gray-900">{posting.position} — {posting.sport}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-gray-500">
                              {posting.province && <span className="flex items-center gap-0.5"><MapPin size={10} />{posting.province}</span>}
                              <span>Age {posting.age_min}–{posting.age_max}</span>
                              {posting.club && <><span className="text-gray-300">·</span><span>{posting.club.name}</span></>}
                            </div>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 flex-shrink-0">
                          <Clock size={10} /> Pending
                        </span>
                      </div>

                      {posting.description && (
                        <p className="mt-3 text-xs text-gray-600 line-clamp-2 bg-gray-50 rounded-lg px-3 py-2">
                          {posting.description}
                        </p>
                      )}

                      <div className="mt-3 flex items-center gap-3 text-[11px] text-gray-400">
                        {posting.poster && <span>Posted by {posting.poster.name}</span>}
                        <span>Submitted {timeAgo(posting.created_at)}</span>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => actOnPosting(posting.id, "approve")}
                          disabled={isAct}
                          className="flex-1 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                          style={{ background: GRS_GREEN }}
                        >
                          <CheckCircle2 size={13} /> Approve & Notify Players
                        </button>
                        <button
                          onClick={() => actOnPosting(posting.id, "reject")}
                          disabled={isAct}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold border disabled:opacity-50 flex items-center justify-center gap-1.5"
                          style={{ borderColor: "#ef4444", color: "#ef4444" }}
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        {/* Verifications list */}
        {!loading && tab === "verifications" && (
          <>
            {verifications.length === 0 ? (
              <div className="text-center py-16">
                <ShieldCheck size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 text-sm">No verification requests pending</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">{verifications.length} verification{verifications.length !== 1 ? "s" : ""} waiting for review</p>
                {verifications.map((v) => {
                  const isAct = actionId === v.id;
                  return (
                    <div key={v.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{v.club_name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Submitted {timeAgo(v.created_at)}{v.submitted_by_name ? ` by ${v.submitted_by_name}` : ""}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 flex-shrink-0">
                          <Clock size={10} /> Pending
                        </span>
                      </div>

                      <div className="bg-gray-50 rounded-xl px-3 py-2.5 space-y-1 text-xs text-gray-700">
                        <p><span className="text-gray-400">Contact:</span> {v.contact_name} ({v.contact_role})</p>
                        {v.contact_phone && <p><span className="text-gray-400">Phone:</span> {v.contact_phone}</p>}
                        {v.contact_email && <p><span className="text-gray-400">Email:</span> {v.contact_email}</p>}
                        {v.governing_body && <p><span className="text-gray-400">Governing body:</span> {v.governing_body}{v.affiliation_number ? ` — ${v.affiliation_number}` : ""}</p>}
                        {v.registration_number && <p><span className="text-gray-400">Reg. number:</span> {v.registration_number}</p>}
                        {v.registration_doc_url && (
                          <a href={v.registration_doc_url} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 font-medium mt-1" style={{ color: GRS_GREEN }}>
                            View registration document →
                          </a>
                        )}
                      </div>

                      <textarea
                        placeholder="Rejection reason (required when rejecting)..."
                        value={rejectNotes[v.id] ?? ""}
                        onChange={(e) => setRejectNotes((prev) => ({ ...prev, [v.id]: e.target.value }))}
                        rows={2}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none resize-none" />

                      <div className="flex gap-2">
                        <button onClick={() => actOnVerification(v.id, "approve")} disabled={isAct}
                          className="flex-1 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                          style={{ background: GRS_GREEN }}>
                          <CheckCircle2 size={13} /> Approve & Verify
                        </button>
                        <button onClick={() => actOnVerification(v.id, "reject")} disabled={isAct || !(rejectNotes[v.id]?.trim())}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold border disabled:opacity-50 flex items-center justify-center gap-1.5"
                          style={{ borderColor: "#ef4444", color: "#ef4444" }}>
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Reports list */}
        {!loading && tab === "reports" && (
          <>
            {reports.length === 0 ? (
              <div className="text-center py-16">
                <Flag size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 text-sm">No open club reports</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">{reports.length} open report{reports.length !== 1 ? "s" : ""}</p>
                {reports.map((r) => {
                  const isAct  = actionId === r.id;
                  const isSuspended = r.club_status === "suspended";
                  const REASON_LABELS: Record<string, string> = {
                    contact_minor: "Contacted a minor directly",
                    fake_club:     "Fake or fraudulent club",
                    harassment:    "Harassment",
                    spam:          "Spam",
                    other:         "Other",
                  };
                  return (
                    <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm text-gray-900">{r.club_name}</p>
                            {isSuspended && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                                style={{ background: "#fef2f2", color: "#b91c1c" }}>
                                <AlertTriangle size={10} /> Suspended
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{r.club_sport} · {r.club_province}</p>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-50 text-red-700 flex-shrink-0">
                          {r.club_open_reports} open report{r.club_open_reports !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="bg-gray-50 rounded-xl px-3 py-2.5 space-y-1 text-xs text-gray-700">
                        <p><span className="text-gray-400">Reason:</span> {REASON_LABELS[r.reason] ?? r.reason}</p>
                        {r.details && <p><span className="text-gray-400">Details:</span> {r.details}</p>}
                        <p><span className="text-gray-400">Reporter:</span> {r.reporter_name} · {timeAgo(r.created_at)}</p>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => resolveReport(r.id, "reviewed")} disabled={isAct}
                          className="flex-1 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                          style={{ background: GRS_GREEN }}>
                          <CheckCircle2 size={13} /> Reviewed — Valid
                        </button>
                        <button onClick={() => resolveReport(r.id, "dismissed")} disabled={isAct}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 disabled:opacity-50 flex items-center justify-center gap-1.5">
                          <XCircle size={13} /> Dismiss
                        </button>
                        {isSuspended && (
                          <button onClick={() => resolveReport(r.id, "dismissed", true)} disabled={isAct}
                            className="w-full py-2 rounded-xl text-xs font-semibold border disabled:opacity-50 flex items-center justify-center gap-1.5"
                            style={{ borderColor: GRS_GREEN, color: GRS_GREEN }}>
                            Dismiss + Lift Suspension
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
