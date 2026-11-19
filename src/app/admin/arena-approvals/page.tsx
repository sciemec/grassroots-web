"use client";
import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, XCircle, Clock, ChevronLeft, RefreshCw,
  Building2, Briefcase, Users, MapPin, Trophy,
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

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function ArenaApprovalsPage() {
  const token = useAuthStore((s) => s.token);

  const [tab, setTab]           = useState<"clubs" | "talent">("clubs");
  const [clubs, setClubs]       = useState<PendingClub[]>([]);
  const [postings, setPostings] = useState<PendingPosting[]>([]);
  const [loading, setLoading]   = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

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

  useEffect(() => {
    if (tab === "clubs")  loadClubs();
    if (tab === "talent") loadPostings();
  }, [tab, loadClubs, loadPostings]);

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
        <div className="flex gap-2">
          <button
            onClick={() => setTab("clubs")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors"
            style={{
              background:  tab === "clubs" ? GRS_GREEN : "white",
              color:       tab === "clubs" ? "white" : "#374151",
              borderColor: tab === "clubs" ? GRS_GREEN : "#e5e7eb",
            }}
          >
            <Building2 size={14} /> Clubs {clubs.length > 0 && tab !== "clubs" && `(${clubs.length})`}
          </button>
          <button
            onClick={() => setTab("talent")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors"
            style={{
              background:  tab === "talent" ? GRS_GREEN : "white",
              color:       tab === "talent" ? "white" : "#374151",
              borderColor: tab === "talent" ? GRS_GREEN : "#e5e7eb",
            }}
          >
            <Briefcase size={14} /> Talent Board {postings.length > 0 && tab !== "talent" && `(${postings.length})`}
          </button>
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
      </div>
    </div>
  );
}
