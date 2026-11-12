"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { PublicNavbar } from "@/components/layout/public-navbar";

interface SponsorshipCase {
  id: string;
  title: string;
  sport: string;
  category: string;
  story: string | null;
  story_short: string | null;
  cover_image_url: string | null;
  status: string;
  owner_name: string;
  owner_user_id?: string | null;
  province: string | null;
  age_group: string | null;
  vouched: boolean;
  introduction_count: number;
  suggested_payee: string | null;
  created_at: string;
  voucher_name?: string | null;
  voucher_org?: string | null;
  updates?: CaseUpdate[];
  my_introduction?: IntroRequest | null;
  vouches?: VouchRecord[];
  financial_literacy_complete?: boolean;
}

interface VouchRecord {
  id: string;
  status: string;
  voucher_org_name: string | null;
  invite_whatsapp: string | null;
  voucher?: { id: string; name: string } | null;
}

interface CaseUpdate {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

interface IntroRequest {
  id: string;
  status: string;
  offer_cents: number | null;
  message: string | null;
  created_at: string;
}

const SPORT_EMOJI: Record<string, string> = {
  football: "⚽", rugby: "🏉", athletics: "🏃", netball: "🏐",
  basketball: "🏀", cricket: "🏏", swimming: "🏊", tennis: "🎾",
  volleyball: "🏐", hockey: "🏑",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  live:            { label: "Active", color: "#16a34a" },
  in_review:       { label: "Under Review", color: "#d97706" },
  pending_vouch:   { label: "Pending Vouch", color: "#7c3aed" },
  draft:           { label: "Draft", color: "#6b7280" },
  funded:          { label: "Funded", color: "#0369a1" },
  closed:          { label: "Closed", color: "#6b7280" },
};

export default function SponsorshipDetailClient({ id }: { id: string }) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const router = useRouter();

  const [caseData, setCaseData] = useState<SponsorshipCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Intro request modal state
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [introMessage, setIntroMessage] = useState("");
  const [introOffer, setIntroOffer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [introError, setIntroError] = useState<string | null>(null);
  const [introSuccess, setIntroSuccess] = useState(false);

  // Vouch request state (owner only, draft / pending_vouch)
  const [showVouchForm, setShowVouchForm] = useState(false);
  const [vouchMode, setVouchMode] = useState<"platform" | "whatsapp">("platform");
  const [vouchUserId, setVouchUserId] = useState("");
  const [vouchWhatsapp, setVouchWhatsapp] = useState("");
  const [vouchSubmitting, setVouchSubmitting] = useState(false);
  const [vouchError, setVouchError] = useState<string | null>(null);
  const [vouchSuccess, setVouchSuccess] = useState(false);

  const base = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

  useEffect(() => {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const fetchPublic = () =>
      fetch(`${base}/sponsorships/${id}`, { headers }).then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      });

    // When authenticated, try the owner/admin detail endpoint first so draft
    // cases are visible to the owner. Fall back to the public endpoint if the
    // caller is not the owner, admin, or a voucher (403).
    const load = token
      ? fetch(`${base}/sponsorships/${id}/detail`, { headers }).then((r) => {
          if (r.status === 403) return fetchPublic();
          if (r.status === 404) { setNotFound(true); return null; }
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
      : fetchPublic();

    load
      .then((json) => { if (json) setCaseData(json.data ?? json); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, token, base]);

  const submitIntro = async () => {
    if (!user) { router.push("/login"); return; }
    setSubmitting(true);
    setIntroError(null);

    const body: Record<string, unknown> = {};
    if (introMessage.trim()) body.message = introMessage.trim();
    if (introOffer.trim()) body.offer_cents = Math.round(parseFloat(introOffer) * 100);

    try {
      const res = await fetch(`${base}/sponsorships/${id}/introductions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setIntroError(json.message ?? "Could not submit request. Please try again.");
        return;
      }
      setIntroSuccess(true);
      setShowIntroModal(false);
      setCaseData((prev) => prev
        ? { ...prev, introduction_count: prev.introduction_count + 1, my_introduction: json.data }
        : prev);
    } catch {
      setIntroError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const withdrawIntro = async (introId: string) => {
    if (!confirm("Withdraw your introduction request?")) return;
    try {
      await fetch(`${base}/sponsor/introductions/${introId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setCaseData((prev) => prev ? { ...prev, my_introduction: { ...prev.my_introduction!, status: "withdrawn" } } : prev);
    } catch {
      // silent
    }
  };

  const requestVouch = async () => {
    setVouchSubmitting(true);
    setVouchError(null);

    const body: Record<string, string> =
      vouchMode === "platform"
        ? { voucher_user_id: vouchUserId.trim() }
        : { invite_whatsapp: vouchWhatsapp.trim() };

    try {
      const res = await fetch(`${base}/sponsorships/${id}/vouch/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setVouchError(json.message ?? "Could not send vouch request.");
        return;
      }
      setVouchSuccess(true);
      setShowVouchForm(false);
      setVouchUserId("");
      setVouchWhatsapp("");
      setCaseData((prev) =>
        prev
          ? {
              ...prev,
              status: prev.status === "draft" ? "pending_vouch" : prev.status,
              vouches: [...(prev.vouches ?? []), json.data],
            }
          : prev
      );
    } catch {
      setVouchError("Network error. Please try again.");
    } finally {
      setVouchSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <PublicNavbar />
        <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse space-y-4">
          <div className="h-56 bg-gray-200 rounded-2xl" />
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (notFound || !caseData) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <PublicNavbar />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Case not found</h1>
          <p className="text-gray-500 text-sm mb-6">This case may have been removed or the link is incorrect.</p>
          <Link href="/sponsorships" className="bg-[#1a5c2a] text-white text-sm font-semibold px-5 py-2.5 rounded-full">
            Browse Cases
          </Link>
        </div>
      </div>
    );
  }

  const c = caseData;
  const sportEmoji = SPORT_EMOJI[c.sport?.toLowerCase()] ?? "🏅";
  const statusConfig = STATUS_LABELS[c.status] ?? { label: c.status, color: "#6b7280" };
  const myIntro = c.my_introduction;
  const canRequestIntro = c.status === "live" && (!myIntro || myIntro.status === "withdrawn");
  const isOwner = user?.id === c.owner_user_id;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <PublicNavbar />

      {/* Cover */}
      <div className="relative h-56 md:h-72 bg-gradient-to-br from-[#1a5c2a] to-[#2e7d45] overflow-hidden">
        {c.cover_image_url ? (
          <img src={c.cover_image_url} alt={c.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-7xl opacity-40">{sportEmoji}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div className="flex gap-2 flex-wrap">
            <span className="bg-white/90 text-[#1a5c2a] text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
              {sportEmoji} {c.sport}
            </span>
            {c.vouched && (
              <span className="bg-[#f0b429] text-[#1a3a1a] text-xs font-bold px-2.5 py-1 rounded-full">
                ✓ Vouched
              </span>
            )}
            {c.financial_literacy_complete && (
              <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                📚 Financially Literate
              </span>
            )}
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: statusConfig.color }}
            >
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{c.title}</h1>
            <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
              <span className="capitalize">{c.category?.replace(/_/g, " ")}</span>
              {c.province && <><span>·</span><span>{c.province}</span></>}
              {c.age_group && <><span>·</span><span className="capitalize">{c.age_group.replace(/_/g, " ")}</span></>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xl font-bold text-[#1a5c2a]">{c.introduction_count}</div>
            <div className="text-xs text-gray-500">sponsor{c.introduction_count === 1 ? "" : "s"} interested</div>
          </div>
        </div>

        {/* Intro request status / CTA */}
        <div className="mb-5">
          {introSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm font-medium mb-3">
              Your introduction request has been submitted. The athlete will be notified.
            </div>
          )}
          {myIntro && myIntro.status !== "withdrawn" && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm mb-3 flex items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-blue-800 capitalize">Request {myIntro.status}</span>
                {myIntro.status === "pending" && (
                  <span className="text-blue-600"> — awaiting athlete response</span>
                )}
                {myIntro.status === "accepted" && (
                  <span className="text-green-700"> — GRS will be in touch to facilitate the introduction.</span>
                )}
                {myIntro.status === "declined" && (
                  <span className="text-gray-600"> — the athlete has declined at this time.</span>
                )}
              </div>
              {myIntro.status === "pending" && (
                <button
                  onClick={() => withdrawIntro(myIntro.id)}
                  className="text-xs text-red-600 hover:underline flex-shrink-0"
                >
                  Withdraw
                </button>
              )}
            </div>
          )}

          {c.status === "live" && (
            <>
              {!user ? (
                <Link
                  href="/login"
                  className="block w-full text-center bg-[#1a5c2a] hover:bg-[#145222] text-white font-semibold text-sm py-3 rounded-xl transition-colors"
                >
                  Sign in to Ask to Connect
                </Link>
              ) : canRequestIntro ? (
                <button
                  onClick={() => setShowIntroModal(true)}
                  className="w-full bg-[#1a5c2a] hover:bg-[#145222] text-white font-semibold text-sm py-3 rounded-xl transition-colors"
                >
                  Ask to Connect
                </button>
              ) : null}
            </>
          )}
        </div>

        {/* Owner draft / pending_vouch management panel */}
        {isOwner && (c.status === "draft" || c.status === "pending_vouch") && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
            <h2 className="font-semibold text-gray-900 mb-1">Your Case — Awaiting a Vouch</h2>
            <p className="text-xs text-gray-500 mb-4">
              A coach, teacher, or club official must vouch for this case before it can go live for sponsors to see.
            </p>

            {/* Existing vouch requests */}
            {c.vouches && c.vouches.length > 0 && (
              <div className="mb-4 space-y-2">
                {c.vouches.map((v) => (
                  <div key={v.id} className="bg-gray-50 rounded-lg px-3 py-2 text-xs flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-800 truncate">
                      {v.voucher_org_name ?? v.voucher?.name ?? (v.invite_whatsapp ? `WhatsApp: ${v.invite_whatsapp}` : "Pending")}
                    </span>
                    <span
                      className={`flex-shrink-0 px-2 py-0.5 rounded-full font-medium ${
                        v.status === "confirmed" ? "bg-green-100 text-green-800"
                        : v.status === "declined" || v.status === "revoked" ? "bg-red-100 text-red-700"
                        : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {v.status === "requested" ? "Waiting" : v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {vouchSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-3 py-2 text-xs font-medium mb-3">
                Vouch request sent!
              </div>
            )}

            {!showVouchForm ? (
              <button
                onClick={() => { setShowVouchForm(true); setVouchSuccess(false); }}
                className="w-full border-2 border-dashed border-[#1a5c2a]/30 hover:border-[#1a5c2a]/60 text-[#1a5c2a] text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                + Request a Voucher
              </button>
            ) : (
              <div className="border border-gray-200 rounded-xl p-4">
                {/* Mode toggle */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setVouchMode("platform")}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${vouchMode === "platform" ? "bg-[#1a5c2a] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    Platform User
                  </button>
                  <button
                    onClick={() => setVouchMode("whatsapp")}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${vouchMode === "whatsapp" ? "bg-[#1a5c2a] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    WhatsApp Invite
                  </button>
                </div>

                {vouchError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs mb-3">
                    {vouchError}
                  </div>
                )}

                {vouchMode === "platform" ? (
                  <div className="mb-3">
                    <label className="text-xs font-medium text-gray-700 block mb-1">Coach or Official&apos;s User ID</label>
                    <input
                      type="text"
                      value={vouchUserId}
                      onChange={(e) => setVouchUserId(e.target.value)}
                      placeholder="Paste the coach's user ID from their profile"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
                    />
                    <p className="text-xs text-gray-400 mt-1">The person must have a coach or admin role on GRS.</p>
                  </div>
                ) : (
                  <div className="mb-3">
                    <label className="text-xs font-medium text-gray-700 block mb-1">WhatsApp Number</label>
                    <input
                      type="tel"
                      value={vouchWhatsapp}
                      onChange={(e) => setVouchWhatsapp(e.target.value)}
                      placeholder="e.g. 0771 234 567"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
                    />
                    <p className="text-xs text-gray-400 mt-1">We&apos;ll send them a WhatsApp message with a vouching link.</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowVouchForm(false); setVouchError(null); }}
                    className="flex-1 border border-gray-300 text-gray-700 text-xs font-medium py-2 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={requestVouch}
                    disabled={vouchSubmitting || (vouchMode === "platform" ? !vouchUserId.trim() : !vouchWhatsapp.trim())}
                    className="flex-1 bg-[#1a5c2a] text-white text-xs font-semibold py-2 rounded-lg hover:bg-[#145222] disabled:opacity-60"
                  >
                    {vouchSubmitting ? "Sending…" : "Send Request"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vouch info */}
        {c.vouched && (c.voucher_org || c.voucher_name) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm mb-5 flex items-start gap-2">
            <span className="text-lg">✓</span>
            <div>
              <span className="font-semibold text-amber-800">Vouched by </span>
              <span className="text-amber-700">{c.voucher_org ?? c.voucher_name}</span>
              <p className="text-amber-600 text-xs mt-0.5">This case has been verified by a trusted coach or organisation.</p>
            </div>
          </div>
        )}

        {/* Story */}
        {c.story && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
            <h2 className="font-semibold text-gray-900 mb-3">The Story</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{c.story}</p>
          </div>
        )}

        {/* Suggested support */}
        {c.suggested_payee && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
            <h2 className="font-semibold text-gray-900 mb-1">Suggested Support</h2>
            <p className="text-sm text-gray-600">{c.suggested_payee}</p>
          </div>
        )}

        {/* Updates */}
        {c.updates && c.updates.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
            <h2 className="font-semibold text-gray-900 mb-4">Updates</h2>
            <div className="space-y-4">
              {c.updates.map((u) => (
                <div key={u.id} className="border-l-2 border-[#1a5c2a] pl-3">
                  <div className="text-xs text-gray-400 mb-0.5">
                    {new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  {u.title && <div className="font-medium text-sm text-gray-900">{u.title}</div>}
                  <p className="text-sm text-gray-600 mt-0.5">{u.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="bg-[#1a5c2a]/5 border border-[#1a5c2a]/20 rounded-2xl p-5 mb-5">
          <h2 className="font-semibold text-[#1a5c2a] mb-3">How the connection works</h2>
          <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
            <li>You submit an introduction request (optional message and sponsorship idea).</li>
            <li>The athlete reviews your request and accepts or declines.</li>
            <li>If accepted, GRS facilitates the formal introduction so you can discuss terms directly.</li>
          </ol>
        </div>

        {/* Back */}
        <Link href="/sponsorships" className="text-sm text-[#1a5c2a] hover:underline">
          ← Back to Sponsorships
        </Link>
      </div>

      {/* Intro Request Modal */}
      {showIntroModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="font-bold text-gray-900 text-lg mb-1">Ask to Connect</h2>
            <p className="text-xs text-gray-500 mb-4">
              Your request will be reviewed by the athlete. GRS will facilitate the introduction if accepted.
            </p>

            {introError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs mb-3">
                {introError}
              </div>
            )}

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Message <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={introMessage}
                  onChange={(e) => setIntroMessage(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="Introduce yourself and explain how you'd like to support this athlete..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
                />
                <div className="text-xs text-gray-400 text-right mt-0.5">{introMessage.length}/1000</div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Sponsorship idea / USD amount <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={introOffer}
                  onChange={(e) => setIntroOffer(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowIntroModal(false); setIntroError(null); }}
                className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitIntro}
                disabled={submitting}
                className="flex-1 bg-[#1a5c2a] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#145222] transition-colors disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
