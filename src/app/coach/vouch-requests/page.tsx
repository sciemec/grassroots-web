"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

interface VouchRequest {
  vouch_id: string;
  case_id: string;
  status: "requested" | "confirmed" | "declined" | "revoked";
  statement: string | null;
  confirmed_at: string | null;
  vouch_created_at: string;
  case_title: string;
  category: string;
  sport: string;
  story_short: string | null;
  province: string | null;
  age_group: string | null;
  beneficiary_name: string | null;
  beneficiary_type: string;
  owner_name: string | null;
  owner_email: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  trial_fee:         "Trial Fee",
  kit:               "Kit",
  travel:            "Travel",
  scholarship_app:   "Scholarship",
  training:          "Training",
  team:              "Team",
  kit_and_equipment: "Kit & Equipment",
  tournament_fees:   "Tournament Fees",
  training_camp:     "Training Camp",
  coaching_fees:     "Coaching Fees",
  transport:         "Transport",
  academic_support:  "Academic Support",
  medical:           "Medical",
  other:             "Other",
  registration_fees: "Registration Fees",
  equipment:         "Equipment",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function VouchCard({
  v,
  onConfirmed,
  onDeclined,
}: {
  v: VouchRequest;
  onConfirmed: (vouchId: string, statement: string) => void;
  onDeclined: (vouchId: string) => void;
}) {
  const token = useAuthStore((s) => s.token);
  const [open, setOpen] = useState(false);
  const [statement, setStatement] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const base = process.env.NEXT_PUBLIC_API_URL ?? "";

  async function handleConfirm() {
    if (statement.trim().length < 20) {
      setError("Please write at least 20 characters in your statement.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(
        `${base}/sponsorships/${v.case_id}/vouch/${v.vouch_id}/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ statement: statement.trim() }),
        }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.message ?? "Something went wrong. Please try again.");
        return;
      }
      onConfirmed(v.vouch_id, statement.trim());
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecline() {
    if (!confirm("Are you sure you want to decline this vouch request?")) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(
        `${base}/sponsorships/${v.case_id}/vouch/${v.vouch_id}/decline`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.message ?? "Something went wrong.");
        return;
      }
      onDeclined(v.vouch_id);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const isPending = v.status === "requested";
  const isConfirmed = v.status === "confirmed";

  return (
    <div
      className="bg-white rounded-2xl border shadow-sm overflow-hidden"
      style={{ borderColor: isPending ? "#bbf7d0" : "#e5e5e5" }}
    >
      {/* Card header */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {isPending && (
                <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  Action Required
                </span>
              )}
              {isConfirmed && (
                <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  ✓ Vouched
                </span>
              )}
              {v.status === "declined" && (
                <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  Declined
                </span>
              )}
              <span className="text-[10px] text-gray-400">{timeAgo(v.vouch_created_at)}</span>
            </div>

            <h3 className="text-sm font-bold text-gray-900 leading-tight truncate">
              {v.case_title}
            </h3>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {v.beneficiary_name && (
                <span className="text-xs text-gray-600 font-medium">{v.beneficiary_name}</span>
              )}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                {CATEGORY_LABELS[v.category] ?? v.category}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 capitalize">
                {v.sport}
              </span>
              {v.province && (
                <span className="text-[10px] text-gray-400">{v.province}</span>
              )}
            </div>
          </div>

          <Link
            href={`/sponsorships/${v.case_id}`}
            className="text-xs font-semibold text-[#1a5c2a] hover:underline shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            View case →
          </Link>
        </div>

        {v.story_short && (
          <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">
            {v.story_short}
          </p>
        )}

        <div className="text-xs text-gray-400 mt-2">
          Submitted by <span className="font-medium text-gray-600">{v.owner_name ?? v.owner_email}</span>
        </div>
      </div>

      {/* Confirmed statement display */}
      {isConfirmed && v.statement && (
        <div className="px-5 pb-4">
          <div className="bg-green-50 border border-green-100 rounded-xl p-3">
            <div className="text-[10px] font-black uppercase tracking-wider text-green-600 mb-1">
              Your vouch statement
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">{v.statement}</p>
          </div>
        </div>
      )}

      {/* Pending: vouch or decline */}
      {isPending && (
        <div className="border-t border-gray-100 px-5 py-4">
          {!open ? (
            <div className="flex gap-2">
              <button
                onClick={() => setOpen(true)}
                className="flex-1 text-xs font-bold py-2 rounded-xl text-white transition-colors"
                style={{ backgroundColor: "#1a5c2a" }}
              >
                Vouch for this case
              </button>
              <button
                onClick={handleDecline}
                disabled={submitting}
                className="px-4 text-xs font-semibold py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Decline
              </button>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Your vouch statement <span className="text-gray-400 font-normal">(min 20 characters)</span>
              </label>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="I know this athlete personally and can confirm their dedication, character and genuine need for this support. For example, I have coached them for 2 seasons..."
                rows={4}
                className="w-full text-xs border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:border-[#1a5c2a] leading-relaxed"
              />
              <div className="text-right text-[10px] text-gray-400 mt-0.5">
                {statement.length} / 1000
              </div>
              {error && (
                <p className="text-xs text-red-500 mt-1">{error}</p>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleConfirm}
                  disabled={submitting || statement.trim().length < 20}
                  className="flex-1 text-xs font-bold py-2 rounded-xl text-white disabled:opacity-40 transition-colors"
                  style={{ backgroundColor: "#1a5c2a" }}
                >
                  {submitting ? "Submitting…" : "Confirm & Vouch"}
                </button>
                <button
                  onClick={() => { setOpen(false); setStatement(""); setError(""); }}
                  className="px-4 text-xs font-semibold py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CoachVouchRequestsPage() {
  const router = useRouter();
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [vouches, setVouches] = useState<VouchRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "coach" && user.role !== "admin") {
      router.replace("/coach");
      return;
    }
  }, [hasHydrated, user, router]);

  useEffect(() => {
    if (!token || !user) return;
    if (user.role !== "coach" && user.role !== "admin") return;

    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    fetch(`${base}/coach/vouch-requests`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.data) setVouches(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, user]);

  if (!hasHydrated || !user) return null;

  const pending   = vouches.filter((v) => v.status === "requested");
  const resolved  = vouches.filter((v) => v.status !== "requested");

  function handleConfirmed(vouchId: string, statement: string) {
    setVouches((prev) =>
      prev.map((v) =>
        v.vouch_id === vouchId
          ? { ...v, status: "confirmed", statement, confirmed_at: new Date().toISOString() }
          : v
      )
    );
  }

  function handleDeclined(vouchId: string) {
    setVouches((prev) =>
      prev.map((v) => (v.vouch_id === vouchId ? { ...v, status: "declined" } : v))
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-40">
        <Link href="/coach" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Coach Hub
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="font-semibold text-gray-900">Vouch Requests</h1>
        {pending.length > 0 && (
          <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: "#1a5c2a" }}>
            {pending.length} pending
          </span>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
                <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
                <div className="h-2 bg-gray-100 rounded w-1/2 mb-4" />
                <div className="h-8 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : vouches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="text-4xl mb-3">🤝</div>
            <h2 className="font-bold text-gray-800 mb-1">No vouch requests yet</h2>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
              When a player on the platform asks you to vouch for their sponsorship case, it will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Pending section */}
            {pending.length > 0 && (
              <section className="mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">
                  Awaiting your response — {pending.length}
                </p>
                <div className="space-y-4">
                  {pending.map((v) => (
                    <VouchCard
                      key={v.vouch_id}
                      v={v}
                      onConfirmed={handleConfirmed}
                      onDeclined={handleDeclined}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Resolved section */}
            {resolved.length > 0 && (
              <section>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">
                  Previously actioned — {resolved.length}
                </p>
                <div className="space-y-3">
                  {resolved.map((v) => (
                    <VouchCard
                      key={v.vouch_id}
                      v={v}
                      onConfirmed={handleConfirmed}
                      onDeclined={handleDeclined}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
