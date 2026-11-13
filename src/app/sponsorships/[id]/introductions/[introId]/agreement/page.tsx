"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { PublicNavbar } from "@/components/layout/public-navbar";

interface IntroAgreement {
  id: string;
  agreed_amount_cents: number | null;
  currency: string;
  payee_name: string | null;
  what_sponsor_provides: string | null;
  what_sponsor_receives: string | null;
  notes: string | null;
  status: "draft" | "confirmed";
  updated_at: string;
}

interface PageProps {
  params: { id: string; introId: string };
}

const CURRENCIES = ["USD", "ZIG", "ZAR", "GBP", "EUR"];

function AgreementFields({ agreement }: { agreement: IntroAgreement }) {
  return (
    <div className="space-y-4 text-sm">
      {agreement.agreed_amount_cents != null && (
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Amount</div>
          <div className="text-gray-900 font-semibold text-base">
            {agreement.currency}{" "}
            {(agreement.agreed_amount_cents / 100).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      )}
      {agreement.payee_name && (
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Payee</div>
          <div className="text-gray-800">{agreement.payee_name}</div>
        </div>
      )}
      {agreement.what_sponsor_provides && (
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Sponsor provides</div>
          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">{agreement.what_sponsor_provides}</div>
        </div>
      )}
      {agreement.what_sponsor_receives && (
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Sponsor receives</div>
          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">{agreement.what_sponsor_receives}</div>
        </div>
      )}
      {agreement.notes && (
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</div>
          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">{agreement.notes}</div>
        </div>
      )}
    </div>
  );
}

function StepDot({
  label,
  done,
  active,
}: {
  label: string;
  done: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-0">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{
          backgroundColor: done
            ? "#1a5c2a"
            : active
            ? "#e8f5e9"
            : "#e5e7eb",
          color: done ? "#fff" : active ? "#1a5c2a" : "#9ca3af",
          border: active && !done ? "2px solid #1a5c2a" : "none",
        }}
      >
        {done ? "✓" : "·"}
      </div>
      <span
        className="text-xs text-center leading-tight"
        style={{ color: done || active ? "#1a5c2a" : "#9ca3af", fontWeight: done || active ? 600 : 400 }}
      >
        {label}
      </span>
    </div>
  );
}

export default function AgreementPage({ params }: PageProps) {
  const { id, introId } = params;
  const router = useRouter();
  const token  = useAuthStore((s) => s.token);
  const user   = useAuthStore((s) => s.user);
  const base   = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

  const [loading,          setLoading]          = useState(true);
  const [caseTitle,        setCaseTitle]        = useState("");
  const [playerName,       setPlayerName]       = useState("");
  const [caseOwnerUserId,  setCaseOwnerUserId]  = useState<string | null>(null);
  const [agreement,        setAgreement]        = useState<IntroAgreement | null>(null);
  const [fetchError,       setFetchError]       = useState<string | null>(null);

  // form
  const [amount,   setAmount]   = useState("");
  const [currency, setCurrency] = useState("USD");
  const [payee,    setPayee]    = useState("");
  const [provides, setProvides] = useState("");
  const [receives, setReceives] = useState("");
  const [notes,    setNotes]    = useState("");

  const [saving,     setSaving]     = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saveError,  setSaveError]  = useState<string | null>(null);
  const [justSaved,  setJustSaved]  = useState(false);

  useEffect(() => {
    if (!token) { router.replace("/login"); return; }

    Promise.all([
      fetch(`${base}/sponsorships/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${base}/sponsorships/${id}/introductions/${introId}/agreement`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])
      .then(async ([caseRes, agreeRes]) => {
        if (caseRes.ok) {
          const json = await caseRes.json();
          const c = json.data ?? json;
          setCaseTitle(c.title ?? "");
          setCaseOwnerUserId(c.owner_user_id ?? null);
          const p = c.player;
          if (p) {
            setPlayerName(`${p.first_name ?? ""} ${p.surname ?? ""}`.trim());
          }
        }
        if (agreeRes.ok) {
          const json = await agreeRes.json();
          if (json.data) {
            const a: IntroAgreement = json.data;
            setAgreement(a);
            setAmount(a.agreed_amount_cents ? String(a.agreed_amount_cents / 100) : "");
            setCurrency(a.currency ?? "USD");
            setPayee(a.payee_name ?? "");
            setProvides(a.what_sponsor_provides ?? "");
            setReceives(a.what_sponsor_receives ?? "");
            setNotes(a.notes ?? "");
          }
        }
      })
      .catch(() => setFetchError("Could not load agreement data. Please refresh."))
      .finally(() => setLoading(false));
  }, [id, introId, token, base, router]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setJustSaved(false);
    try {
      const res = await fetch(
        `${base}/sponsorships/${id}/introductions/${introId}/agreement`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            agreed_amount_cents: amount ? Math.round(parseFloat(amount) * 100) : null,
            currency,
            payee_name:              payee.trim()    || null,
            what_sponsor_provides:   provides.trim() || null,
            what_sponsor_receives:   receives.trim() || null,
            notes:                   notes.trim()    || null,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setSaveError(json.message ?? "Could not save. Please try again.");
        return;
      }
      setAgreement(json.data);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!window.confirm("Confirm this agreement? Both parties will be notified and the terms will be locked.")) return;
    setConfirming(true);
    setSaveError(null);
    try {
      const res = await fetch(
        `${base}/sponsorships/${id}/introductions/${introId}/agreement/confirm`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setSaveError(json.message ?? "Could not confirm. Please try again.");
        return;
      }
      setAgreement(json.data);
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  const isConfirmed = agreement?.status === "confirmed";
  const hasDraft    = !!agreement;
  const isOwner     = !!user && !!caseOwnerUserId && user.id === caseOwnerUserId;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <PublicNavbar />
        <div className="max-w-2xl mx-auto px-4 py-10 animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-20 bg-gray-200 rounded-2xl" />
          <div className="h-10 bg-gray-200 rounded-xl" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <PublicNavbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href={`/sponsorships/${id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5"
        >
          <span>←</span>
          <span>Back to case</span>
        </Link>

        {/* Progress stepper */}
        <div className="flex items-start gap-0 mb-7">
          <StepDot label="Intro Accepted" done />
          <div className="flex-1 h-px bg-gray-300 mt-3.5 mx-1" />
          <StepDot
            label="Draft"
            done={hasDraft}
            active={!hasDraft}
          />
          <div className="flex-1 h-px bg-gray-300 mt-3.5 mx-1" />
          <StepDot label="Confirmed" done={isConfirmed} active={hasDraft && !isConfirmed} />
        </div>

        {/* Case context card */}
        <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4 mb-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-gray-400 mb-0.5 font-medium uppercase tracking-wide">Sponsorship case</div>
            <div className="font-semibold text-gray-900 text-sm leading-snug">{caseTitle || "—"}</div>
            {playerName && (
              <div className="text-xs text-gray-500 mt-0.5">Athlete: {playerName}</div>
            )}
          </div>
          <div
            className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: isConfirmed ? "#dcfce7" : hasDraft ? "#fef3c7" : "#f3f4f6",
              color:           isConfirmed ? "#166534" : hasDraft ? "#92400e" : "#6b7280",
            }}
          >
            {isConfirmed ? "✓ Confirmed" : hasDraft ? "Draft" : "No agreement yet"}
          </div>
        </div>

        {fetchError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
            {fetchError}
          </div>
        )}

        {/* ── CONFIRMED: read-only view (everyone) ── */}
        {isConfirmed && agreement ? (
          <div className="bg-white rounded-2xl border border-green-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-bold">
                ✓
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">Agreement confirmed</div>
                <div className="text-xs text-gray-400">
                  {new Date(agreement.updated_at).toLocaleDateString("en-GB", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </div>
              </div>
            </div>

            <AgreementFields agreement={agreement} />

            <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-400">
              This agreement is locked. Contact GrassRoots Sports to make amendments.
            </div>
          </div>

        ) : isOwner ? (
          /* ── OWNER: read-only draft view ── */
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            {!hasDraft ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-3">📋</div>
                <div className="font-semibold text-gray-700 text-sm mb-1">No terms drafted yet</div>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  The sponsor will record the agreed terms here. Check back once they have saved a draft.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
                  >
                    ✎
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">Sponsor&apos;s proposed terms</div>
                    <div className="text-xs text-gray-400">
                      Review the terms below and confirm once you agree.
                    </div>
                  </div>
                </div>

                <AgreementFields agreement={agreement!} />

                {saveError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs mt-4">
                    {saveError}
                  </div>
                )}

                <div className="mt-5 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleConfirm}
                    disabled={confirming}
                    className="w-full bg-[#1a5c2a] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#145222] disabled:opacity-60 transition-colors"
                  >
                    {confirming ? "Confirming…" : "Confirm Agreement"}
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Confirming locks the terms. Both parties will be notified.
                  </p>
                </div>
              </>
            )}
          </div>

        ) : (
          /* ── SPONSOR: editable form ── */
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Record the agreed terms</h2>
            <p className="text-xs text-gray-500 mb-5">
              All fields are optional. Fill in what has been verbally agreed so both parties have a written record. Save a draft as many times as needed before confirming.
            </p>

            {saveError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs mb-4">
                {saveError}
              </div>
            )}

            {justSaved && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-xs mb-4">
                Draft saved.
              </div>
            )}

            <div className="space-y-4">
              {/* Amount + Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Amount <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 250"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 bg-white"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payee */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Payee name <span className="text-gray-400 font-normal">(who receives payment — optional)</span>
                </label>
                <input
                  type="text"
                  value={payee}
                  onChange={(e) => setPayee(e.target.value)}
                  placeholder="e.g. Tendai Moyo or Harare Athletic Club"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
                />
              </div>

              {/* What sponsor provides */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  What the sponsor provides <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={provides}
                  onChange={(e) => setProvides(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  placeholder="e.g. $250 towards kit and tournament entry fees, paid by 15 March"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 resize-none"
                />
                <div className="text-right text-xs text-gray-400 mt-0.5">{provides.length}/2000</div>
              </div>

              {/* What sponsor receives */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  What the sponsor receives <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={receives}
                  onChange={(e) => setReceives(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  placeholder="e.g. Logo on kit for the season, monthly progress update via WhatsApp"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 resize-none"
                />
                <div className="text-right text-xs text-gray-400 mt-0.5">{receives.length}/2000</div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Additional notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={2000}
                  rows={2}
                  placeholder="Any other terms, conditions, or context"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 border border-[#1a5c2a] text-[#1a5c2a] text-sm font-semibold py-2.5 rounded-xl hover:bg-[#1a5c2a]/5 disabled:opacity-60 transition-colors"
                >
                  {saving ? "Saving…" : "Save Draft"}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={confirming || !hasDraft}
                  title={!hasDraft ? "Save a draft first" : undefined}
                  className="flex-1 bg-[#1a5c2a] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#145222] disabled:opacity-60 transition-colors"
                >
                  {confirming ? "Confirming…" : "Confirm Agreement"}
                </button>
              </div>

              {!hasDraft && (
                <p className="text-xs text-gray-400 text-center">
                  Save a draft first. Once both parties agree, confirm to lock the terms.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
