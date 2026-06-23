"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Briefcase, Plus, ChevronRight, Users, Clock, MapPin, Zap,
  CheckCircle2, XCircle, Star, Trophy, ChevronDown, ChevronUp,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Posting {
  id: string;
  sport: string;
  position: string;
  age_min: number;
  age_max: number;
  thuto_min: number;
  province: string | null;
  stipend: boolean;
  description: string;
  status: "open" | "closed";
  closes_at: string | null;
  created_at: string;
  applications_count: number;
  club: { id: string; name: string } | null;
}

interface Application {
  id: string;
  talent_wanted_id: string;
  applicant_id: string;
  message: string;
  availability: string | null;
  status: "pending" | "shortlisted" | "declined" | "trial_invited";
  created_at: string;
  applicant: {
    id: string;
    name: string;
    province: string | null;
    sport: string | null;
  } | null;
}

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:      { label: "Pending",      colour: "bg-gray-100 text-gray-600" },
  shortlisted:  { label: "Shortlisted",  colour: "bg-blue-100 text-blue-700" },
  declined:     { label: "Declined",     colour: "bg-red-100 text-red-600" },
  trial_invited:{ label: "Trial Invited",colour: "bg-green-100 text-green-700" },
};

// ─── ApplicationRow ───────────────────────────────────────────────────────────

function ApplicationRow({
  app,
  onStatusChange,
}: {
  app: Application;
  onStatusChange: (appId: string, status: Application["status"]) => Promise<void>;
}) {
  const [expanded, setExpanded]   = useState(false);
  const [updating, setUpdating]   = useState(false);

  const handleStatus = async (status: Application["status"]) => {
    setUpdating(true);
    await onStatusChange(app.id, status);
    setUpdating(false);
  };

  const cfg = STATUS_CONFIG[app.status];

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    return `${d}d ago`;
  };

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ backgroundColor: "#1a5c2a" }}
        >
          {app.applicant?.name
            ? app.applicant.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
            : "?"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">
              {app.applicant?.name ?? "Unknown Player"}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.colour}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {app.applicant?.sport ?? "Sport unknown"} · {app.applicant?.province ?? "Province unknown"} · {timeAgo(app.created_at)}
          </p>
        </div>

        {expanded ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Message */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Message</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{app.message}</p>
          </div>

          {/* Availability */}
          {app.availability && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Availability</p>
              <p className="text-sm text-gray-700">{app.availability}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {app.status !== "shortlisted" && (
              <button
                onClick={() => handleStatus("shortlisted")}
                disabled={updating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
              >
                <Star size={12} />
                Shortlist
              </button>
            )}
            {app.status !== "trial_invited" && (
              <button
                onClick={() => handleStatus("trial_invited")}
                disabled={updating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
              >
                <Trophy size={12} />
                Invite to Trial
              </button>
            )}
            {app.status !== "declined" && (
              <button
                onClick={() => handleStatus("declined")}
                disabled={updating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50"
              >
                <XCircle size={12} />
                Decline
              </button>
            )}
            {app.status !== "pending" && (
              <button
                onClick={() => handleStatus("pending")}
                disabled={updating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              >
                Reset to Pending
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PostingPanel ─────────────────────────────────────────────────────────────

function PostingPanel({
  posting,
  isActive,
  onClick,
}: {
  posting: Posting;
  isActive: boolean;
  onClick: () => void;
}) {
  const daysLeft = posting.closes_at
    ? Math.max(0, Math.ceil((new Date(posting.closes_at).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl border transition-colors"
      style={{
        backgroundColor: isActive ? "#f0fdf4" : "white",
        borderColor: isActive ? "#1a5c2a" : "#e5e7eb",
      }}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: "#1a5c2a" }}>
              {posting.sport}
            </span>
            {posting.status === "closed" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Closed</span>
            )}
          </div>
          <p className="font-bold text-gray-900 text-sm">{posting.position}</p>
          {posting.club && <p className="text-xs text-gray-500">{posting.club.name}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Users size={11} />
            {posting.applications_count}
          </span>
          {daysLeft !== null && (
            <span className={`flex items-center gap-1 text-xs ${daysLeft <= 3 ? "text-red-500 font-semibold" : "text-gray-400"}`}>
              <Clock size={11} />
              {daysLeft === 0 ? "Today" : `${daysLeft}d`}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoachRecruitmentPage() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const searchParams   = useSearchParams();
  const preselectedId  = searchParams?.get("posting") ?? null;

  const API = process.env.NEXT_PUBLIC_API_URL;

  const [postings, setPostings]         = useState<Posting[]>([]);
  const [activePostingId, setActivePostingId] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingPostings, setLoadingPostings] = useState(true);
  const [loadingApps, setLoadingApps]   = useState(false);
  const [error, setError]               = useState("");

  // Load postings
  useEffect(() => {
    if (!token) return;
    setLoadingPostings(true);
    fetch(`${API}/arena/talent-wanted?mine=true`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => setPostings(safeArray<Posting>(j)))
      .catch(() => setError("Failed to load postings."))
      .finally(() => setLoadingPostings(false));
  }, [token, API]);

  // Pre-select from URL param
  useEffect(() => {
    if (preselectedId && postings.length > 0) {
      if (postings.some((p) => p.id === preselectedId)) setActivePostingId(preselectedId);
    }
  }, [preselectedId, postings]);

  // Load applications when active posting changes
  const loadApplications = useCallback(async (postingId: string) => {
    if (!token) return;
    setLoadingApps(true);
    setApplications([]);
    try {
      const res = await fetch(`${API}/arena/talent-wanted/${postingId}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json();
      setApplications(safeArray<Application>(j?.applications ?? j));
    } catch {
      // silent — show empty state
    } finally {
      setLoadingApps(false);
    }
  }, [token, API]);

  useEffect(() => {
    if (activePostingId !== null) loadApplications(activePostingId);
  }, [activePostingId, loadApplications]);

  const handleStatusChange = async (appId: string, status: Application["status"]) => {
    if (!token || activePostingId === null) return;
    try {
      await fetch(`${API}/arena/talent-wanted/${activePostingId}/applications/${appId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status } : a));
    } catch {
      // silent
    }
  };

  const activePosting = postings.find((p) => p.id === activePostingId);

  const statusCounts = {
    pending:      applications.filter((a) => a.status === "pending").length,
    shortlisted:  applications.filter((a) => a.status === "shortlisted").length,
    trial_invited:applications.filter((a) => a.status === "trial_invited").length,
    declined:     applications.filter((a) => a.status === "declined").length,
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recruitment</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your talent wanted postings and review applicants</p>
          </div>
          <Link
            href="/arena/recruitment/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "#c8962a" }}
          >
            <Plus size={15} />
            New Posting
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {loadingPostings ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-gray-200 border-t-green-600 rounded-full mx-auto mb-2" />
            <p className="text-sm text-gray-400">Loading postings…</p>
          </div>
        ) : postings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
            <Briefcase size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-700">No postings yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Post your first Talent Wanted to start receiving applications.</p>
            <Link
              href="/arena/recruitment/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "#1a5c2a" }}
            >
              <Plus size={15} /> Post Talent Wanted
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-5 gap-4">
            {/* Left — postings list */}
            <div className="md:col-span-2 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
                Your Postings ({postings.length})
              </p>
              {postings.map((p) => (
                <PostingPanel
                  key={p.id}
                  posting={p}
                  isActive={p.id === activePostingId}
                  onClick={() => setActivePostingId(p.id === activePostingId ? null : p.id)}
                />
              ))}
            </div>

            {/* Right — applications */}
            <div className="md:col-span-3">
              {activePosting === undefined ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center text-gray-400">
                  <Users size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Select a posting to view applications</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                  {/* Posting header */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-bold text-gray-900">{activePosting.position}</h2>
                        {activePosting.club && (
                          <p className="text-sm text-gray-500">{activePosting.club.name}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin size={11} />
                            {activePosting.province ?? "Nationwide"}
                          </span>
                          <span>Age {activePosting.age_min}–{activePosting.age_max}</span>
                          {activePosting.thuto_min > 0 && (
                            <span className="flex items-center gap-1" style={{ color: "#7c3aed" }}>
                              <Zap size={11} />
                              THUTO {activePosting.thuto_min}+
                            </span>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/arena/recruitment/${activePosting.id}`}
                        className="text-xs text-green-700 hover:underline"
                      >
                        View public listing
                      </Link>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {(["pending", "shortlisted", "trial_invited", "declined"] as const).map((s) => (
                        <div key={s} className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-lg font-bold text-gray-900">{statusCounts[s]}</p>
                          <p className="text-xs text-gray-500 capitalize leading-tight">{STATUS_CONFIG[s].label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Applications list */}
                  <div className="p-5 space-y-2">
                    {loadingApps ? (
                      <div className="py-8 text-center">
                        <div className="animate-spin w-5 h-5 border-2 border-gray-200 border-t-green-600 rounded-full mx-auto mb-2" />
                        <p className="text-xs text-gray-400">Loading applications…</p>
                      </div>
                    ) : applications.length === 0 ? (
                      <div className="py-10 text-center">
                        <CheckCircle2 size={28} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm text-gray-500">No applications yet</p>
                        <p className="text-xs text-gray-400 mt-1">Share the posting link to reach more players.</p>
                      </div>
                    ) : (
                      applications.map((app) => (
                        <ApplicationRow
                          key={app.id}
                          app={app}
                          onStatusChange={handleStatusChange}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
