"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import TrustBadge, { TrustLevel } from "@/components/sponsorship/TrustBadge";
import EligibilityChecklist from "@/components/sponsorship/EligibilityChecklist";

interface CaseDetail {
  id: string;
  public_code: string;
  title: string;
  sport: string;
  category: string;
  status: string;
  age_group: string | null;
  province: string | null;
  story_short: string | null;
  story: string | null;
  suggested_payee: string | null;
  target_cents: number | null;
  deadline_at: string | null;
  vouched_by: string | null;
  vouched_by_name: string | null;
  is_minor_beneficiary: boolean;
  guardian_name: string | null;
  introduction_count: number;
  created_at: string;
  owner: { id: string; name: string; email: string } | null;
  trust_level?: string | null;
  grs_verified?: boolean;
  grs_verified_note?: string | null;
  grs_verified_via_call?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  live:          "bg-green-100 text-green-800",
  in_review:     "bg-amber-100 text-amber-800",
  pending_vouch: "bg-purple-100 text-purple-800",
  draft:         "bg-gray-100 text-gray-700",
  funded:        "bg-blue-100 text-blue-800",
  closed:        "bg-gray-100 text-gray-500",
  rejected:      "bg-red-100 text-red-700",
};

function dateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminCaseDetailPage({ params }: { params: { id: string } }) {
  const token     = useAuthStore((s) => s.token);
  const router    = useRouter();
  const base      = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";
  const { id }    = params;

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [showGrsForm, setShowGrsForm] = useState(false);
  const [grsNote, setGrsNote] = useState("");
  const [grsViaCall, setGrsViaCall] = useState(false);
  const [grsSaving, setGrsSaving] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${base}/sponsorships/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => setCaseData(json.data ?? json))
      .catch(() => setError("Could not load case."))
      .finally(() => setLoading(false));
  }, [id, token, base]);

  const updateStatus = async (newStatus: string) => {
    if (!caseData || updating) return;
    setUpdating(true);
    setActionMsg(null);
    try {
      const res = await fetch(`${base}/admin/sponsorships/${caseData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.message ?? "Failed");
      }
      setCaseData((prev) => prev ? { ...prev, status: newStatus } : prev);
      setActionMsg(`Status updated to "${newStatus.replace(/_/g, " ")}"`);
    } catch (err: unknown) {
      setActionMsg((err as Error).message ?? "Could not update status.");
    } finally {
      setUpdating(false);
    }
  };

  const publishCase = async () => {
    if (!caseData || updating) return;
    setUpdating(true);
    setActionMsg(null);
    setPublishError(null);
    try {
      const body: Record<string, string> = {};
      if (overrideReason.trim().length >= 10) body.override_reason = overrideReason.trim();
      const res = await fetch(`${base}/sponsorships/${caseData.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) {
        // 422 = failed gate checks — show exactly what's blocking publication
        const msg = j.message ?? j.error ?? "Could not publish this case.";
        setPublishError(msg);
        return;
      }
      setCaseData((prev) => prev ? { ...prev, status: "live" } : prev);
      setActionMsg("Case is now Live.");
    } catch {
      setPublishError("Network error — could not reach the server.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
          {error ?? "Case not found."}
        </div>
        <Link href="/admin/sponsorships" className="text-sm text-[#1a5c2a] hover:underline">
          ← Back to Sponsorships
        </Link>
      </div>
    );
  }

  const c = caseData;
  const canApprove = c.status === "in_review" || c.status === "pending_vouch";
  const canReject  = c.status === "in_review" || c.status === "pending_vouch" || c.status === "draft";
  const canClose   = c.status === "live";
  const canReopen  = c.status === "closed" || c.status === "rejected";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Nav */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link href="/admin/sponsorships" className="text-sm text-[#1a5c2a] hover:underline">
          ← Sponsorships
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-500 truncate max-w-xs">{c.title}</span>
        <Link
          href={`/sponsorships/${c.public_code ?? c.id}`}
          target="_blank"
          className="ml-auto text-xs text-[#1a5c2a] border border-[#1a5c2a] rounded-lg px-3 py-1.5 hover:bg-[#1a5c2a]/5 transition-colors"
        >
          Public page ↗
        </Link>
      </div>

      {/* Title + status */}
      <div className="flex items-start gap-3 mb-5 flex-wrap">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 leading-snug">{c.title}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-sm text-gray-500">
            <span className="capitalize font-medium">{c.sport}</span>
            <span className="text-gray-300">·</span>
            <span className="capitalize">{c.category.replace(/_/g, " ")}</span>
            {c.age_group && (<><span className="text-gray-300">·</span><span>{c.age_group.replace(/_/g, " ")}</span></>)}
            {c.province && (<><span className="text-gray-300">·</span><span>{c.province}</span></>)}
            <span className="text-gray-300">·</span>
            <span>{dateShort(c.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-700"}`}>
            {c.status.replace(/_/g, " ")}
          </span>
          <TrustBadge level={c.trust_level as TrustLevel} />
        </div>
      </div>

      {/* Action feedback */}
      {actionMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-2.5 text-sm mb-4">
          {actionMsg}
        </div>
      )}
      {/* Eligibility checklist — always visible for admin while case not live */}
      {c.status !== "live" && c.status !== "closed" && c.status !== "rejected" && (
        <div className="mb-5">
          <EligibilityChecklist
            caseId={c.id}
            token={token ?? ""}
            adminMode
            overrideReason={overrideReason}
            onOverrideReasonChange={setOverrideReason}
          />
        </div>
      )}

      {publishError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm mb-4">
          <div className="font-semibold mb-0.5">Cannot approve — gate check failed</div>
          <div>{publishError}</div>
        </div>
      )}

      {/* Admin actions */}
      <div className="flex gap-2 flex-wrap mb-6">
        {canApprove && (
          <button
            onClick={publishCase}
            disabled={updating}
            className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            {updating ? "Checking…" : "Approve → Live"}
          </button>
        )}
        {canReject && (
          <button
            onClick={() => updateStatus("rejected")}
            disabled={updating}
            className="bg-red-50 text-red-700 border border-red-200 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-60"
          >
            Reject
          </button>
        )}
        {canClose && (
          <button
            onClick={() => updateStatus("closed")}
            disabled={updating}
            className="bg-gray-100 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-60"
          >
            Close
          </button>
        )}
        {canReopen && (
          <button
            onClick={() => updateStatus("in_review")}
            disabled={updating}
            className="bg-amber-50 text-amber-700 border border-amber-200 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-60"
          >
            Re-open for review
          </button>
        )}
        {!c.grs_verified && (canApprove || c.status === "draft") && (
          <button
            onClick={() => setShowGrsForm((v) => !v)}
            className="bg-blue-50 text-blue-700 border border-blue-200 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors"
          >
            GRS Verify
          </button>
        )}
        {c.grs_verified && (
          <span className="text-xs text-blue-700 font-semibold self-center">✓ GRS Verified</span>
        )}
        <Link
          href={`/admin/introductions?case=${c.id}`}
          className="ml-auto text-xs text-[#1a5c2a] hover:underline self-center"
        >
          {c.introduction_count} intro{c.introduction_count !== 1 ? "s" : ""} →
        </Link>
      </div>

      {/* GRS verify form */}
      {showGrsForm && !c.grs_verified && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 mb-5">
          <h3 className="text-sm font-semibold text-blue-900 mb-1">GRS Evidence Verification</h3>
          <p className="text-xs text-blue-700 mb-3">
            Use this when no adult voucher is available. Review the athlete&apos;s Talent Passport,
            Arena videos, and registration date, then document your verification below.
          </p>
          <textarea
            value={grsNote}
            onChange={(e) => setGrsNote(e.target.value)}
            rows={3}
            placeholder="Describe the evidence reviewed (e.g. TP scores, Arena clips, registration date, voice call details)…"
            className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 mb-3 bg-white"
          />
          <label className="flex items-center gap-2 text-xs text-blue-800 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={grsViaCall}
              onChange={(e) => setGrsViaCall(e.target.checked)}
              className="rounded"
            />
            Verified by call or voice note
          </label>
          <div className="flex gap-2">
            <button
              disabled={grsSaving || grsNote.trim().length < 10}
              onClick={async () => {
                setGrsSaving(true);
                try {
                  const res = await fetch(`${base}/admin/sponsorships/${c.id}/grs-verify`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ note: grsNote.trim(), verified_via_call: grsViaCall }),
                  });
                  const j = await res.json();
                  if (!res.ok) throw new Error(j.message ?? "Failed");
                  setCaseData((prev) =>
                    prev
                      ? { ...prev, grs_verified: true, grs_verified_note: grsNote.trim(), status: "in_review" }
                      : prev
                  );
                  setShowGrsForm(false);
                  setActionMsg("Case GRS-verified and moved to in_review.");
                } catch (err: unknown) {
                  setActionMsg((err as Error).message ?? "Could not GRS-verify.");
                } finally {
                  setGrsSaving(false);
                }
              }}
              className="bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              {grsSaving ? "Saving…" : "Confirm GRS Verification"}
            </button>
            <button
              onClick={() => { setShowGrsForm(false); setGrsNote(""); setGrsViaCall(false); }}
              className="bg-white text-gray-700 border border-gray-200 text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Meta cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {c.target_cents != null && (
          <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
            <div className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-0.5">Seeking</div>
            <div className="text-sm font-bold text-green-800">
              USD {(c.target_cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </div>
          </div>
        )}
        {c.deadline_at && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">Deadline</div>
            <div className="text-sm font-bold text-gray-800">{dateShort(c.deadline_at)}</div>
          </div>
        )}
        {c.vouched_by_name && (
          <div className="bg-purple-50 border border-purple-100 rounded-xl px-3 py-2.5">
            <div className="text-xs text-purple-600 font-semibold uppercase tracking-wide mb-0.5">Vouched by</div>
            <div className="text-sm font-bold text-purple-800">{c.vouched_by_name}</div>
          </div>
        )}
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">Submitted by</div>
          <div className="text-sm font-bold text-gray-800 truncate">{c.owner?.name ?? "—"}</div>
          {c.owner?.email && (
            <div className="text-xs text-gray-400 truncate">{c.owner.email}</div>
          )}
        </div>
      </div>

      {/* Minor safeguarding notice */}
      {c.is_minor_beneficiary && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-5 flex gap-2">
          <span className="text-base">⚠️</span>
          <div>
            <strong>Minor beneficiary.</strong> Guardian consent required before going live.
            {c.guardian_name && <span> Guardian: <strong>{c.guardian_name}</strong>.</span>}
          </div>
        </div>
      )}

      {/* Summary */}
      {c.story_short && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800 italic mb-5">
          &ldquo;{c.story_short}&rdquo;
        </div>
      )}

      {/* Full story */}
      <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Full Story</h2>
        {c.story ? (
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{c.story}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">No story provided.</p>
        )}
      </div>

      {/* Suggested payee */}
      {c.suggested_payee && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 mb-5">
          <span className="font-semibold text-gray-500 text-xs uppercase tracking-wide block mb-1">Suggested payee / support</span>
          {c.suggested_payee}
        </div>
      )}
    </div>
  );
}
