"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

interface SponsorshipCase {
  id: string;
  title: string;
  sport: string;
  category: string;
  status: string;
  owner_name: string;
  province: string | null;
  age_group: string | null;
  vouched: boolean;
  introduction_count: number;
  flag_count?: number;
  created_at: string;
}

interface ApiResponse {
  data: SponsorshipCase[];
  meta?: { current_page: number; last_page: number; total: number };
}

const STATUSES = ["in_review", "pending_vouch", "live", "draft", "funded", "closed", "rejected"];

const STATUS_COLORS: Record<string, string> = {
  live:          "bg-green-100 text-green-800",
  in_review:     "bg-amber-100 text-amber-800",
  pending_vouch: "bg-purple-100 text-purple-800",
  draft:         "bg-gray-100 text-gray-700",
  funded:        "bg-blue-100 text-blue-800",
  closed:        "bg-gray-100 text-gray-500",
  rejected:      "bg-red-100 text-red-700",
};

export default function AdminSponsorshipsPage() {
  const token = useAuthStore((s) => s.token);

  const [cases, setCases] = useState<SponsorshipCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("in_review");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setPage(1); }, [statusFilter]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ status: statusFilter, page: String(page) });
    const base = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

    fetch(`${base}/admin/sponsorships?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<ApiResponse>; })
      .then((json) => {
        setCases(json.data ?? []);
        setLastPage(json.meta?.last_page ?? 1);
        setTotal(json.meta?.total ?? 0);
      })
      .catch(() => setError("Failed to load cases."))
      .finally(() => setLoading(false));
  }, [statusFilter, page, token]);

  const updateStatus = async (caseId: string, newStatus: string) => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";
    try {
      const res = await fetch(`${base}/admin/sponsorships/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      setCases((prev) => prev.map((c) => c.id === caseId ? { ...c, status: newStatus } : c));
    } catch {
      alert("Could not update status. Please try again.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sponsorship Cases</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} case{total !== 1 ? "s" : ""} in <span className="capitalize">{statusFilter.replace(/_/g, " ")}</span></p>
        </div>
        <Link
          href="/admin/introductions"
          className="text-sm font-medium text-[#1a5c2a] border border-[#1a5c2a] rounded-lg px-4 py-2 hover:bg-[#1a5c2a]/5 transition-colors"
        >
          View Introduction Requests →
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
              statusFilter === s
                ? "bg-[#1a5c2a] text-white border-[#1a5c2a]"
                : "bg-white text-gray-600 border-gray-300 hover:border-[#1a5c2a]"
            }`}
          >
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : cases.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-medium">No cases with status &ldquo;{statusFilter.replace(/_/g, " ")}&rdquo;</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Case</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Sport</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">Owner</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Intros</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/sponsorships/${c.id}`} className="font-medium text-gray-900 hover:text-[#1a5c2a] hover:underline line-clamp-1">
                        {c.title}
                      </Link>
                      {c.flag_count && c.flag_count > 0 ? (
                        <span className="ml-2 text-xs bg-red-100 text-red-700 rounded px-1.5 py-0.5">
                          {c.flag_count} flag{c.flag_count > 1 ? "s" : ""}
                        </span>
                      ) : null}
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell capitalize text-gray-600">{c.sport}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600">{c.owner_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {c.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 font-medium">{c.introduction_count}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {c.status === "in_review" && (
                          <>
                            <button
                              onClick={() => updateStatus(c.id, "live")}
                              className="text-xs bg-green-600 text-white px-2.5 py-1 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateStatus(c.id, "rejected")}
                              className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {c.status === "live" && (
                          <button
                            onClick={() => updateStatus(c.id, "closed")}
                            className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Close
                          </button>
                        )}
                        <Link
                          href={`/admin/sponsorships/${c.id}`}
                          className="text-xs text-[#1a5c2a] hover:underline"
                        >
                          View →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">Previous</button>
              <span className="text-sm text-gray-600">Page {page} of {lastPage}</span>
              <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page === lastPage} className="px-4 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
