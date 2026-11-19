"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

// ── Types ────────────────────────────────────────────────────────────────────

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

interface Agreement {
  id: string;
  status: "draft" | "confirmed";
  agreed_amount_cents: number | null;
  currency: string;
  payee_name: string | null;
  what_sponsor_provides: string | null;
  what_sponsor_receives: string | null;
  notes: string | null;
  updated_at: string;
  created_at: string;
  case_id: string;
  introduction_request_id: string;
  case_title: string;
  sponsor_name: string | null;
  sponsor_email: string;
  owner_name: string | null;
  owner_email: string;
}

interface CasesApiResponse {
  data: SponsorshipCase[];
  // Laravel paginator puts these at the top level, not inside meta
  total?: number;
  last_page?: number;
  meta?: { current_page: number; last_page: number; total: number };
}

interface AgreementsApiResponse {
  data: Agreement[];
  current_page: number;
  last_page: number;
  total: number;
}

type View = "cases" | "agreements";
type AgreementStatusFilter = "all" | "draft" | "confirmed";

// ── Constants ────────────────────────────────────────────────────────────────

const CASE_STATUSES = ["in_review", "pending_vouch", "live", "draft", "funded", "closed", "rejected"];

const CASE_STATUS_COLORS: Record<string, string> = {
  live:          "bg-green-100 text-green-800",
  in_review:     "bg-amber-100 text-amber-800",
  pending_vouch: "bg-purple-100 text-purple-800",
  draft:         "bg-gray-100 text-gray-700",
  funded:        "bg-blue-100 text-blue-800",
  closed:        "bg-gray-100 text-gray-500",
  rejected:      "bg-red-100 text-red-700",
};

const AGR_STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  draft:     { badge: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-400" },
  confirmed: { badge: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function dateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtAmount(cents: number, currency: string) {
  return `${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })} ${currency}`;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSponsorshipsPage() {
  const token = useAuthStore((s) => s.token);
  const base  = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

  const [view, setView] = useState<View>("cases");

  // ── Cases state ──────────────────────────────────────────────────────────
  const [cases, setCases]           = useState<SponsorshipCase[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [caseStatusFilter, setCaseStatusFilter] = useState("in_review");
  const [casesPage, setCasesPage]   = useState(1);
  const [casesLastPage, setCasesLastPage] = useState(1);
  const [casesTotal, setCasesTotal] = useState(0);
  const [casesError, setCasesError] = useState<string | null>(null);

  // ── Agreements state ──────────────────────────────────────────────────────
  const [agreements, setAgreements]           = useState<Agreement[]>([]);
  const [agrLoading, setAgrLoading]           = useState(false);
  const [agrLoaded, setAgrLoaded]             = useState(false);
  const [agrStatusFilter, setAgrStatusFilter] = useState<AgreementStatusFilter>("all");
  const [agrPage, setAgrPage]                 = useState(1);
  const [agrLastPage, setAgrLastPage]         = useState(1);
  const [agrTotal, setAgrTotal]               = useState(0);
  const [agrError, setAgrError]               = useState<string | null>(null);
  const [expandedId, setExpandedId]           = useState<string | null>(null);

  // ── Cases fetch ───────────────────────────────────────────────────────────
  useEffect(() => { setCasesPage(1); }, [caseStatusFilter]);

  useEffect(() => {
    if (!token) return;
    setCasesLoading(true);
    setCasesError(null);
    const params = new URLSearchParams({ status: caseStatusFilter, page: String(casesPage) });
    fetch(`${base}/admin/sponsorships?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<CasesApiResponse>; })
      .then((json) => {
        setCases(json.data ?? []);
        setCasesLastPage(json.last_page ?? json.meta?.last_page ?? 1);
        setCasesTotal(json.total ?? json.meta?.total ?? 0);
      })
      .catch(() => setCasesError("Failed to load cases."))
      .finally(() => setCasesLoading(false));
  }, [caseStatusFilter, casesPage, token, base]);

  // ── Agreements fetch (lazy — first switch to Agreements tab) ─────────────
  useEffect(() => { setAgrPage(1); }, [agrStatusFilter]);

  useEffect(() => {
    if (view !== "agreements") return;
    if (!token) return;
    setAgrLoading(true);
    setAgrError(null);
    const params = new URLSearchParams({ page: String(agrPage) });
    if (agrStatusFilter !== "all") params.set("status", agrStatusFilter);
    fetch(`${base}/admin/agreements?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<AgreementsApiResponse>; })
      .then((json) => {
        setAgreements(json.data ?? []);
        setAgrLastPage(json.last_page ?? 1);
        setAgrTotal(json.total ?? 0);
        setAgrLoaded(true);
      })
      .catch(() => setAgrError("Failed to load agreements."))
      .finally(() => setAgrLoading(false));
  }, [view, agrStatusFilter, agrPage, token, base]);

  // ── Case status update ────────────────────────────────────────────────────
  const updateCaseStatus = async (caseId: string, newStatus: string) => {
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

  // Approve → Live must go through the guarded publish() path so gate
  // checks (vouch, financial literacy, minor consent) are enforced.
  const approveCase = async (caseId: string) => {
    try {
      const res = await fetch(`${base}/sponsorships/${caseId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const j = await res.json();
      if (!res.ok) {
        const msg = j.message ?? j.error ?? "Could not publish this case.";
        alert(`Gate check failed:\n\n${msg}`);
        return;
      }
      setCases((prev) => prev.map((c) => c.id === caseId ? { ...c, status: "live" } : c));
    } catch {
      alert("Network error — could not reach the server.");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sponsorships</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {view === "cases"
              ? `${casesTotal} case${casesTotal !== 1 ? "s" : ""} · ${caseStatusFilter.replace(/_/g, " ")}`
              : `${agrTotal} agreement${agrTotal !== 1 ? "s" : ""}${agrStatusFilter !== "all" ? ` · ${agrStatusFilter}` : ""}`}
          </p>
        </div>
        <Link
          href="/admin/introductions"
          className="text-sm font-medium text-[#1a5c2a] border border-[#1a5c2a] rounded-lg px-4 py-2 hover:bg-[#1a5c2a]/5 transition-colors"
        >
          Introductions →
        </Link>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-6">
        {(["cases", "agreements"] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${
              view === v
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {v}
            {v === "agreements" && agrLoaded && agrTotal > 0 && (
              <span className="ml-1.5 text-xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-semibold">
                {agrTotal}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── CASES VIEW ─────────────────────────────────────────────────────── */}
      {view === "cases" && (
        <>
          <div className="flex gap-2 flex-wrap mb-5">
            {CASE_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setCaseStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
                  caseStatusFilter === s
                    ? "bg-[#1a5c2a] text-white border-[#1a5c2a]"
                    : "bg-white text-gray-600 border-gray-300 hover:border-[#1a5c2a]"
                }`}
              >
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {casesError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{casesError}</div>
          )}

          {casesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">📋</div>
              <p className="font-medium">No cases with status &ldquo;{caseStatusFilter.replace(/_/g, " ")}&rdquo;</p>
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
                            {dateShort(c.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell capitalize text-gray-600">{c.sport}</td>
                        <td className="px-4 py-3 hidden sm:table-cell text-gray-600">{c.owner_name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${CASE_STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-700"}`}>
                            {c.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 font-medium">{c.introduction_count}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            {(c.status === "in_review" || c.status === "pending_vouch") && (
                              <>
                                <button onClick={() => approveCase(c.id)} className="text-xs bg-green-600 text-white px-2.5 py-1 rounded-lg hover:bg-green-700 transition-colors">
                                  Approve
                                </button>
                                <button onClick={() => updateCaseStatus(c.id, "rejected")} className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-lg hover:bg-red-200 transition-colors">
                                  Reject
                                </button>
                              </>
                            )}
                            {c.status === "live" && (
                              <button onClick={() => updateCaseStatus(c.id, "closed")} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg hover:bg-gray-200 transition-colors">
                                Close
                              </button>
                            )}
                            <Link href={`/admin/sponsorships/${c.id}`} className="text-xs text-[#1a5c2a] hover:underline">
                              View →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {casesLastPage > 1 && (
                <div className="flex justify-center items-center gap-3 mt-6">
                  <button onClick={() => setCasesPage((p) => Math.max(1, p - 1))} disabled={casesPage === 1} className="px-4 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">Previous</button>
                  <span className="text-sm text-gray-600">Page {casesPage} of {casesLastPage}</span>
                  <button onClick={() => setCasesPage((p) => Math.min(casesLastPage, p + 1))} disabled={casesPage === casesLastPage} className="px-4 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── AGREEMENTS VIEW ────────────────────────────────────────────────── */}
      {view === "agreements" && (
        <>
          {/* Status filter */}
          <div className="flex gap-2 mb-5">
            {(["all", "draft", "confirmed"] as AgreementStatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setAgrStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
                  agrStatusFilter === s
                    ? "bg-[#1a5c2a] text-white border-[#1a5c2a]"
                    : "bg-white text-gray-600 border-gray-300 hover:border-[#1a5c2a]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {agrError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{agrError}</div>
          )}

          {agrLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : agreements.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">🤝</div>
              <p className="font-medium text-gray-500">
                No {agrStatusFilter !== "all" ? agrStatusFilter : ""} agreements yet
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                {agreements.map((agr) => {
                  const style    = AGR_STATUS_STYLES[agr.status] ?? AGR_STATUS_STYLES.draft;
                  const expanded = expandedId === agr.id;
                  const hasDetail = agr.what_sponsor_provides || agr.what_sponsor_receives || agr.notes || agr.payee_name;

                  return (
                    <div key={agr.id}>
                      {/* Main row */}
                      <div className="flex items-start gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          {/* Sponsor → Case */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-gray-900">
                              {agr.sponsor_name ?? agr.sponsor_email}
                            </span>
                            <span className="text-gray-400 text-xs hidden sm:inline">→</span>
                            <Link
                              href={`/sponsorships/${agr.case_id}`}
                              className="text-xs text-[#1a5c2a] hover:underline truncate hidden sm:inline"
                            >
                              {agr.case_title}
                            </Link>
                          </div>
                          {/* Meta row */}
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-gray-400">{agr.sponsor_email}</span>
                            {agr.agreed_amount_cents != null && (
                              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded px-1.5 py-0.5 font-medium">
                                {fmtAmount(agr.agreed_amount_cents, agr.currency)}
                              </span>
                            )}
                            <span className="text-xs text-gray-300">·</span>
                            <span className="text-xs text-gray-400">Updated {dateShort(agr.updated_at)}</span>
                          </div>
                          {/* Case title on mobile */}
                          <Link
                            href={`/sponsorships/${agr.case_id}`}
                            className="text-xs text-[#1a5c2a] hover:underline mt-0.5 block sm:hidden truncate"
                          >
                            {agr.case_title}
                          </Link>
                        </div>

                        {/* Right: status + expand */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${style.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            {agr.status}
                          </span>
                          {hasDetail && (
                            <button
                              onClick={() => setExpandedId(expanded ? null : agr.id)}
                              className="text-xs text-gray-400 hover:text-gray-700 px-1 transition-colors"
                              title={expanded ? "Collapse" : "Show details"}
                            >
                              {expanded ? "▲" : "▼"}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {expanded && (
                        <div className="px-4 pb-4 space-y-3">
                          {agr.payee_name && (
                            <div className="text-xs text-gray-500">
                              <span className="font-semibold text-gray-700">Payee:</span> {agr.payee_name}
                            </div>
                          )}
                          {agr.what_sponsor_provides && (
                            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Sponsor provides</div>
                              <p className="text-sm text-blue-900 whitespace-pre-line">{agr.what_sponsor_provides}</p>
                            </div>
                          )}
                          {agr.what_sponsor_receives && (
                            <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
                              <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">Sponsor receives</div>
                              <p className="text-sm text-purple-900 whitespace-pre-line">{agr.what_sponsor_receives}</p>
                            </div>
                          )}
                          {agr.notes && (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</div>
                              <p className="text-sm text-gray-700 whitespace-pre-line">{agr.notes}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-3 pt-1">
                            <Link
                              href={`/sponsorships/${agr.case_id}/introductions/${agr.introduction_request_id}/agreement`}
                              className="text-xs font-semibold text-[#1a5c2a] hover:underline"
                            >
                              View full agreement →
                            </Link>
                            <span className="text-xs text-gray-400">
                              Owner: {agr.owner_name ?? agr.owner_email}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {agrLastPage > 1 && (
                <div className="flex justify-center items-center gap-3 mt-6">
                  <button onClick={() => setAgrPage((p) => Math.max(1, p - 1))} disabled={agrPage === 1} className="px-4 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">Previous</button>
                  <span className="text-sm text-gray-600">Page {agrPage} of {agrLastPage}</span>
                  <button onClick={() => setAgrPage((p) => Math.min(agrLastPage, p + 1))} disabled={agrPage === agrLastPage} className="px-4 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
