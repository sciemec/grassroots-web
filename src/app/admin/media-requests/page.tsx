"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

const STATUS_LABELS: Record<string, string> = {
  pending:      "Pending",
  acknowledged: "Acknowledged",
  in_progress:  "In Progress",
  done:         "Done",
};

const STATUS_COLORS: Record<string, string> = {
  pending:      "bg-amber-100 text-amber-700",
  acknowledged: "bg-blue-50 text-blue-700",
  in_progress:  "bg-purple-50 text-purple-700",
  done:         "bg-green-100 text-green-700",
};

interface MediaRequest {
  id: string;
  case_id: string;
  story_angle: string;
  why_now: string | null;
  status: string;
  created_at: string;
  case_title: string;
  case_status: string;
  owner_name: string | null;
  owner_email: string | null;
}

export default function AdminMediaRequestsPage() {
  const token         = useAuthStore((s) => s.token);
  const hasHydrated   = useAuthStore((s) => s._hasHydrated);

  const [requests,  setRequests]  = useState<MediaRequest[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [updating,  setUpdating]  = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated || !token) return;
    setLoading(true);
    fetch(`${BASE}/admin/media-requests`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j) => setRequests(j.data ?? []))
      .catch(() => setError("Could not load media requests."))
      .finally(() => setLoading(false));
  }, [hasHydrated, token]);

  const updateStatus = async (id: string, status: string) => {
    if (!token) return;
    setUpdating(id);
    try {
      const res = await fetch(`${BASE}/admin/media-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, Accept: "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const j = await res.json();
        setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...j.data } : r)));
      }
    } catch { /* silent */ }
    finally { setUpdating(null); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-gray-500 hover:underline">← Admin</Link>
        <h1 className="text-xl font-bold text-gray-900 mt-1">Media Help Requests</h1>
        <p className="text-sm text-gray-500 mt-0.5">Cases requesting GRS media coverage support.</p>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && requests.length === 0 && (
        <p className="text-sm text-gray-500 italic">No media requests yet.</p>
      )}

      {!loading && requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{req.case_title}</p>
                  <p className="text-xs text-gray-500">
                    {req.owner_name ?? req.owner_email ?? "Unknown"} ·{" "}
                    {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[req.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {STATUS_LABELS[req.status] ?? req.status}
                </span>
              </div>

              <p className="text-xs font-medium text-gray-700 mb-0.5">Story angle</p>
              <p className="text-xs text-gray-600 mb-2 whitespace-pre-wrap">{req.story_angle}</p>

              {req.why_now && (
                <>
                  <p className="text-xs font-medium text-gray-700 mb-0.5">Why now</p>
                  <p className="text-xs text-gray-600 mb-2">{req.why_now}</p>
                </>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                <Link
                  href={`/admin/sponsorships/${req.case_id}`}
                  className="text-xs text-[#1a5c2a] hover:underline font-medium"
                >
                  View case →
                </Link>
                {Object.keys(STATUS_LABELS).map((s) =>
                  s !== req.status ? (
                    <button
                      key={s}
                      onClick={() => updateStatus(req.id, s)}
                      disabled={updating === req.id}
                      className="text-xs px-2.5 py-1 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      → {STATUS_LABELS[s]}
                    </button>
                  ) : null
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
