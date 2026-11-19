"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { PublicNavbar } from "@/components/layout/public-navbar";

interface SponsorshipCase {
  id: string;
  public_code?: string;
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
  target_cents: number | null;
  currency?: string | null;
  deadline_at?: string | null;
  suggested_payee: string | null;
  created_at: string;
  voucher_name?: string | null;
  voucher_org?: string | null;
  updates?: CaseUpdate[];
  my_introduction?: IntroRequest | null;
  vouches?: VouchRecord[];
  financial_literacy_complete?: boolean;
  player?: PlayerData | null;
  auto_accept_introductions?: boolean;
  // raw backend fields that need normalising
  vouched_by?: { org_name?: string | null; confirmed_at?: string | null } | null;
  financial_literacy?: { owner?: boolean; player?: boolean; guardian?: boolean } | null;
  is_minor?: boolean;
}

interface SkillRating {
  skill_code: string;
  rating: number;
}

interface PlayerHighlight {
  id: string;
  event_type: string;
  speed_kmh: number | null;
  r2_url: string | null;
  created_at: string;
}

interface PlayerData {
  first_name: string;
  surname?: string;
  position?: string;
  sport?: string;
  age_group?: string;
  avatar_url?: string | null;
  club?: string | null;
  skill_ratings?: SkillRating[];
  highlights?: PlayerHighlight[];
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
  kind?: string;
  title?: string;
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

interface OwnerIntro {
  id: string;
  status: string;
  sponsor_user_id: string | null;
  offer_cents: number | null;
  message: string | null;
  sponsor_name: string | null;
  sponsor_email: string | null;
  created_at: string;
}

interface IntroAgreement {
  id: string;
  introduction_request_id: string;
  agreed_amount_cents: number | null;
  currency: string;
  payee_name: string | null;
  what_sponsor_provides: string | null;
  what_sponsor_receives: string | null;
  notes: string | null;
  status: "draft" | "confirmed";
  created_at: string;
  updated_at: string;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function normalizeCase(raw: Record<string, unknown>): SponsorshipCase {
  const vouched_by = raw.vouched_by as SponsorshipCase["vouched_by"];
  const financial_literacy = raw.financial_literacy as SponsorshipCase["financial_literacy"];
  return {
    ...(raw as unknown as SponsorshipCase),
    voucher_org:
      (raw.voucher_org as string | null) ??
      vouched_by?.org_name ??
      null,
    financial_literacy_complete:
      (raw.financial_literacy_complete as boolean | undefined) ??
      financial_literacy?.owner ??
      false,
  };
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function fmt(cents: number, currency = "USD") {
  return `${currency} ${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

// ─── constants ───────────────────────────────────────────────────────────────

const SPORT_EMOJI: Record<string, string> = {
  football: "⚽", rugby: "🏉", athletics: "🏃", netball: "🏐",
  basketball: "🏀", cricket: "🏏", swimming: "🏊", tennis: "🎾",
  volleyball: "🏐", hockey: "🏑",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; step: number }> = {
  draft:         { label: "Draft",         color: "#6b7280", bg: "#f3f4f6", step: 0 },
  pending_vouch: { label: "Pending Vouch", color: "#7c3aed", bg: "#ede9fe", step: 1 },
  in_review:     { label: "Under Review",  color: "#d97706", bg: "#fef3c7", step: 2 },
  live:          { label: "Active",        color: "#16a34a", bg: "#dcfce7", step: 3 },
  funded:        { label: "Funded",        color: "#0369a1", bg: "#dbeafe", step: 4 },
  closed:        { label: "Closed",        color: "#6b7280", bg: "#f3f4f6", step: 5 },
};

const JOURNEY_STEPS = ["Draft", "Vouch", "Review", "Live"];

// ─── component ───────────────────────────────────────────────────────────────

export default function SponsorshipDetailClient({ id, submitted = false }: { id: string; submitted?: boolean }) {
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const router = useRouter();

  const [caseData, setCaseData] = useState<SponsorshipCase | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  // share
  const [copied, setCopied] = useState(false);

  // intro request modal
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [introMessage,   setIntroMessage]   = useState("");
  const [introOffer,     setIntroOffer]      = useState("");
  const [submitting,     setSubmitting]      = useState(false);
  const [introError,     setIntroError]      = useState<string | null>(null);
  const [introSuccess,   setIntroSuccess]    = useState(false);

  // vouch request (owner, draft / pending_vouch)
  const [showVouchForm,   setShowVouchForm]   = useState(false);
  const [vouchMode,       setVouchMode]       = useState<"platform" | "whatsapp">("platform");
  const [vouchUserId,     setVouchUserId]     = useState("");
  const [vouchWhatsapp,   setVouchWhatsapp]   = useState("");
  const [vouchSubmitting, setVouchSubmitting] = useState(false);
  const [vouchError,      setVouchError]      = useState<string | null>(null);
  const [vouchSuccess,    setVouchSuccess]    = useState(false);

  // proof of use (owner, live)
  const [showProofForm,   setShowProofForm]   = useState(false);
  const [proofBody,       setProofBody]       = useState("");
  const [proofSubmitting, setProofSubmitting] = useState(false);
  const [proofError,      setProofError]      = useState<string | null>(null);
  const [proofSuccess,    setProofSuccess]    = useState(false);

  // agreement badge (sponsor whose intro was accepted)
  const [agreement,       setAgreement]       = useState<IntroAgreement | null>(null);
  const [agreementLoaded, setAgreementLoaded] = useState(false);

  // owner intro panel
  const [ownerIntros,       setOwnerIntros]       = useState<OwnerIntro[]>([]);
  const [ownerIntrosLoaded, setOwnerIntrosLoaded] = useState(false);
  const [respondingId,      setRespondingId]      = useState<string | null>(null);
  const [respondError,      setRespondError]      = useState<string | null>(null);
  const [introTab,          setIntroTab]          = useState<"pending" | "accepted" | "expired">("pending");

  // auto-accept
  const [autoAccept,       setAutoAccept]      = useState(false);
  const [autoAcceptSaving, setAutoAcceptSaving] = useState(false);

  const base = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";
  const isPublicCode = typeof id === "string" && id.length === 8;

  // ─── data loading ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!hasHydrated) return;

    setNotFound(false);
    setLoading(true);

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const fetchPublic = () => {
      const url = isPublicCode
        ? `${base}/sponsorships/by-code/${id}`
        : `${base}/sponsorships/${id}`;
      return fetch(url, { headers }).then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      });
    };

    const load = token && !isPublicCode
      ? fetch(`${base}/sponsorships/${id}/detail`, { headers }).then((r) => {
          if (r.status === 403) return fetchPublic();
          if (r.status === 404) { setNotFound(true); return null; }
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
      : fetchPublic();

    load
      .then((json) => {
        if (json) {
          const raw = json.data ?? json;
          setCaseData(normalizeCase(raw as Record<string, unknown>));
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, token, base, isPublicCode, hasHydrated]);

  useEffect(() => {
    const intro = caseData?.my_introduction;
    if (!intro || intro.status !== "accepted" || !token || agreementLoaded) return;
    setAgreementLoaded(true);
    fetch(`${base}/sponsorships/${caseData!.id}/introductions/${intro.id}/agreement`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => { if (json?.data) setAgreement(json.data); })
      .catch(() => {});
  }, [caseData?.my_introduction, token, base, id, agreementLoaded]);

  useEffect(() => {
    if (!caseData || !user || !token || ownerIntrosLoaded) return;
    if (user.id !== caseData.owner_user_id) return;
    setOwnerIntrosLoaded(true);
    fetch(`${base}/sponsorships/${caseData!.id}/introductions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => { if (Array.isArray(json?.data)) setOwnerIntros(json.data); })
      .catch(() => {});
  }, [caseData, user, token, base, id, ownerIntrosLoaded]);

  useEffect(() => {
    if (caseData?.auto_accept_introductions !== undefined) {
      setAutoAccept(!!caseData.auto_accept_introductions);
    }
  }, [caseData?.auto_accept_introductions]);

  // ─── actions ───────────────────────────────────────────────────────────────

  const copyLink = () => {
    const url = `${window.location.origin}/sponsorships/${caseData?.public_code ?? id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const shareOnWhatsApp = () => {
    const url = `${window.location.origin}/sponsorships/${caseData?.public_code ?? id}`;
    const name = caseData?.owner_name ?? "an athlete";
    const title = caseData?.title ?? "their sponsorship case";
    const text = `Support ${name} — ${title} 🏅\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  const toggleAutoAccept = async () => {
    if (!token || autoAcceptSaving) return;
    const next = !autoAccept;
    setAutoAccept(next);
    setAutoAcceptSaving(true);
    try {
      await fetch(`${base}/sponsorships/${caseData!.id}/settings`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ auto_accept_introductions: next }),
      });
    } catch {
      setAutoAccept(!next);
    } finally {
      setAutoAcceptSaving(false);
    }
  };

  const respondIntro = async (introId: string, action: "accept" | "decline") => {
    if (!token) return;
    setRespondingId(introId);
    setRespondError(null);
    try {
      const r = await fetch(`${base}/sponsorships/${caseData!.id}/introductions/${introId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setRespondError((j as { message?: string }).message ?? "Something went wrong.");
        return;
      }
      const newStatus = action === "accept" ? "accepted" : "declined";
      setOwnerIntros((prev) =>
        prev.map((i) => (i.id === introId ? { ...i, status: newStatus } : i))
      );
      if (action === "accept") setIntroTab("accepted");
    } catch {
      setRespondError("Could not send response. Please try again.");
    } finally {
      setRespondingId(null);
    }
  };

  const submitIntro = async () => {
    if (!user) { router.push("/login"); return; }
    setSubmitting(true);
    setIntroError(null);

    const body: Record<string, unknown> = {};
    if (introMessage.trim()) body.message = introMessage.trim();
    if (introOffer.trim()) body.offer_cents = Math.round(parseFloat(introOffer) * 100);

    try {
      const res = await fetch(`${base}/sponsorships/${caseData!.id}/introductions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
      setCaseData((prev) => prev
        ? { ...prev, my_introduction: { ...prev.my_introduction!, status: "withdrawn" } }
        : prev);
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
      const res = await fetch(`${base}/sponsorships/${caseData!.id}/vouch/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
      setCaseData((prev) => prev
        ? {
            ...prev,
            status: prev.status === "draft" ? "pending_vouch" : prev.status,
            vouches: [...(prev.vouches ?? []), json.data],
          }
        : prev);
    } catch {
      setVouchError("Network error. Please try again.");
    } finally {
      setVouchSubmitting(false);
    }
  };

  const postProof = async () => {
    setProofSubmitting(true);
    setProofError(null);
    try {
      const res = await fetch(`${base}/sponsorships/${caseData!.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: proofBody.trim(), kind: "proof", notify_sponsors: true }),
      });
      const json = await res.json();
      if (!res.ok) {
        setProofError(json.message ?? "Could not post proof. Please try again.");
        return;
      }
      setProofSuccess(true);
      setShowProofForm(false);
      setProofBody("");
      setCaseData((prev) => prev ? { ...prev, updates: [json.data, ...(prev.updates ?? [])] } : prev);
    } catch {
      setProofError("Network error. Please try again.");
    } finally {
      setProofSubmitting(false);
    }
  };

  // ─── loading / 404 ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <PublicNavbar />
        <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse space-y-4">
          <div className="h-64 bg-gray-200 rounded-2xl" />
          <div className="flex gap-5">
            <div className="flex-1 space-y-3">
              <div className="h-7 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-40 bg-gray-200 rounded-xl" />
            </div>
            <div className="w-72 space-y-3 hidden lg:block">
              <div className="h-48 bg-gray-200 rounded-xl" />
              <div className="h-14 bg-gray-200 rounded-xl" />
            </div>
          </div>
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

  // ─── derived state ─────────────────────────────────────────────────────────

  const c           = caseData;
  const sportEmoji  = SPORT_EMOJI[c.sport?.toLowerCase()] ?? "🏅";
  const statusCfg   = STATUS_CONFIG[c.status] ?? { label: c.status, color: "#6b7280", bg: "#f3f4f6", step: -1 };
  const myIntro     = c.my_introduction;
  const canRequestIntro = c.status === "live"
    && !isOwner
    && (!myIntro || myIntro.status === "withdrawn" || myIntro.status === "expired");
  const isOwner     = user?.id === c.owner_user_id;
  const deadlineDays = c.deadline_at ? daysUntil(c.deadline_at) : null;
  const deadlineSoon = deadlineDays !== null && deadlineDays >= 0 && deadlineDays <= 7;

  const pendingCount  = ownerIntros.filter((i) => i.status === "pending").length;
  const acceptedCount = ownerIntros.filter((i) => i.status === "accepted").length;
  const expiredCount  = ownerIntros.filter((i) => i.status === "expired").length;

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <PublicNavbar />

      {/* ── Cover hero ─────────────────────────────────────────────────────── */}
      <div className="relative h-60 md:h-80 overflow-hidden">
        {c.cover_image_url ? (
          <img src={c.cover_image_url} alt={c.title} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-8xl"
            style={{ background: "linear-gradient(135deg, #1a5c2a 0%, #2e7d45 60%, #c8962a 100%)" }}
          >
            <span className="opacity-30">{sportEmoji}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* badges */}
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
          <span className="bg-white/90 text-[#1a5c2a] text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
            {sportEmoji} {c.sport}
          </span>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: statusCfg.color }}
          >
            {statusCfg.label}
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
        </div>

        {/* share buttons */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <button
            onClick={shareOnWhatsApp}
            className="bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </button>
          <button
            onClick={copyLink}
            className="bg-white/90 hover:bg-white text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors"
          >
            {copied ? "✓ Copied!" : "⎘ Copy link"}
          </button>
        </div>
      </div>

      {/* ── Main 2-column layout ───────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-5 items-start">

        {/* ══ LEFT COLUMN ═══════════════════════════════════════════════════ */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Case submitted success banner */}
          {submitted && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm font-medium">
              Your case has been submitted! Our team will review it and you&apos;ll be notified when it goes live.
            </div>
          )}

          {/* Title + meta */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2">{c.title}</h1>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
              <span className="capitalize">{c.category?.replace(/_/g, " ")}</span>
              {c.province && <><span>·</span><span>{c.province}</span></>}
              {c.age_group && <><span>·</span><span className="capitalize">{c.age_group.replace(/_/g, " ")}</span></>}
              <span>·</span>
              <span>Posted by {c.owner_name}</span>
            </div>

            {/* Owner: status journey strip */}
            {isOwner && statusCfg.step >= 0 && statusCfg.step < JOURNEY_STEPS.length && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-3">Case progress</p>
                <div className="flex items-center gap-0">
                  {JOURNEY_STEPS.map((label, i) => {
                    const done   = i < statusCfg.step;
                    const active = i === statusCfg.step;
                    return (
                      <div key={label} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                              done   ? "bg-[#1a5c2a] border-[#1a5c2a] text-white" :
                              active ? "bg-white border-[#1a5c2a] text-[#1a5c2a] ring-2 ring-[#1a5c2a]/20" :
                                       "bg-gray-100 border-gray-200 text-gray-400"
                            }`}
                          >
                            {done ? "✓" : i + 1}
                          </div>
                          <span className={`text-xs font-medium ${active ? "text-[#1a5c2a]" : done ? "text-gray-600" : "text-gray-400"}`}>
                            {label}
                          </span>
                        </div>
                        {i < JOURNEY_STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 mb-5 mx-1 ${done ? "bg-[#1a5c2a]" : "bg-gray-200"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Vouch info */}
          {c.vouched && (c.voucher_org || c.voucher_name) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
              <span className="text-lg flex-shrink-0 mt-0.5">✓</span>
              <div>
                <span className="font-semibold text-amber-800">Vouched by </span>
                <span className="text-amber-700">{c.voucher_org ?? c.voucher_name}</span>
                <p className="text-amber-600 text-xs mt-0.5">Verified by a trusted coach or organisation.</p>
              </div>
            </div>
          )}

          {/* Sponsor intro status (non-owner) */}
          {!isOwner && (
            <>
              {introSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm font-medium">
                  Your introduction request has been submitted. The athlete will be notified.
                </div>
              )}
              {myIntro && myIntro.status !== "withdrawn" && (
                <div className={`rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3 border ${
                  myIntro.status === "expired" ? "bg-slate-50 border-slate-200" : "bg-blue-50 border-blue-200"
                }`}>
                  <div>
                    <span className={`font-semibold capitalize ${myIntro.status === "expired" ? "text-slate-600" : "text-blue-800"}`}>
                      Request {myIntro.status}
                    </span>
                    {myIntro.status === "pending"   && <span className="text-blue-600"> — awaiting athlete response</span>}
                    {myIntro.status === "accepted"  && <span className="text-green-700"> — GRS will be in touch to facilitate the introduction.</span>}
                    {myIntro.status === "declined"  && <span className="text-gray-600"> — the athlete has declined at this time.</span>}
                    {myIntro.status === "expired"   && <span className="text-slate-500"> — no response within 7 days. You can re-apply if the case is still live.</span>}
                  </div>
                  {myIntro.status === "pending" && (
                    <button onClick={() => withdrawIntro(myIntro.id)} className="text-xs text-red-600 hover:underline flex-shrink-0">
                      Withdraw
                    </button>
                  )}
                </div>
              )}

              {/* Agreement card — sponsor whose intro was accepted */}
              {myIntro?.status === "accepted" && (
                <Link
                  href={`/sponsorships/${caseData!.id}/introductions/${myIntro.id}/agreement`}
                  className="block bg-white rounded-2xl border border-gray-200 p-4 hover:border-[#1a5c2a]/40 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🤝</span>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Sponsorship Agreement</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {agreement?.status === "confirmed"
                            ? `Confirmed ${new Date(agreement.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                            : agreement?.status === "draft"
                            ? "Draft saved — tap to edit or confirm"
                            : "Tap to record agreed terms"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {agreement?.status === "confirmed" && (
                        <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">✓ Confirmed</span>
                      )}
                      {agreement?.status === "draft" && (
                        <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Draft</span>
                      )}
                      {!agreement && (
                        <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Not started</span>
                      )}
                      <span className="text-gray-400 group-hover:text-[#1a5c2a] transition-colors text-sm">→</span>
                    </div>
                  </div>
                </Link>
              )}
            </>
          )}

          {/* Story */}
          {c.story && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">The Story</h2>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{c.story}</p>
            </div>
          )}

          {/* Player Profile */}
          {c.player && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">About the Athlete</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#1a5c2a]/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {c.player.avatar_url ? (
                    <img src={c.player.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-[#1a5c2a]">{c.player.first_name?.[0] ?? "?"}</span>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {c.player.first_name}{c.player.surname ? ` ${c.player.surname}` : ""}
                  </div>
                  <div className="text-xs text-gray-500 flex flex-wrap gap-x-2 mt-0.5">
                    {c.player.position && <span className="capitalize">{c.player.position}</span>}
                    {c.player.age_group && <><span>·</span><span className="capitalize">{c.player.age_group.replace(/_/g, " ")}</span></>}
                    {c.player.club && <><span>·</span><span>{c.player.club}</span></>}
                  </div>
                </div>
              </div>

              {c.player.skill_ratings && c.player.skill_ratings.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Coach Ratings</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {c.player.skill_ratings.map((r) => (
                      <div key={r.skill_code}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs text-gray-600 capitalize">{r.skill_code.replace(/_/g, " ")}</span>
                          <span className="text-xs font-semibold text-[#1a5c2a]">{r.rating.toFixed(1)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#1a5c2a] rounded-full" style={{ width: `${(r.rating / 10) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {c.player.highlights && c.player.highlights.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Highlights</div>
                  <div className="flex flex-wrap gap-2">
                    {c.player.highlights.map((h) => (
                      <span
                        key={h.id}
                        className="inline-flex items-center gap-1.5 bg-[#1a5c2a]/8 text-[#1a5c2a] text-xs font-medium px-2.5 py-1 rounded-full capitalize"
                      >
                        🎬 {h.event_type.replace(/_/g, " ")}
                        {h.speed_kmh ? ` · ${h.speed_kmh} km/h` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Suggested support */}
          {c.suggested_payee && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-1">Suggested Support</h2>
              <p className="text-sm text-gray-600">{c.suggested_payee}</p>
            </div>
          )}

          {/* Updates */}
          {c.updates && c.updates.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Updates</h2>
              <div className="space-y-4">
                {c.updates.map((u) => (
                  <div key={u.id} className={`border-l-2 pl-3 ${u.kind === "proof" ? "border-emerald-500" : "border-[#1a5c2a]"}`}>
                    <div className="text-xs text-gray-400 mb-0.5">
                      {new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    {u.kind === "proof" && (
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-xs font-semibold text-emerald-700">🧾 Proof of Use</span>
                      </div>
                    )}
                    {u.title && <div className="font-medium text-sm text-gray-900">{u.title}</div>}
                    <p className="text-sm text-gray-600 mt-0.5">{u.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proof of Use — owner only, live cases */}
          {isOwner && c.status === "live" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-gray-900">Proof of Use</h2>
                {!showProofForm && (
                  <button
                    onClick={() => { setShowProofForm(true); setProofSuccess(false); }}
                    className="text-xs font-medium text-[#1a5c2a] hover:underline"
                  >
                    + Add proof
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Keep sponsors informed by sharing a note or receipt showing how support was used. Connected sponsors will be notified.
              </p>
              {proofSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-3 py-2 text-xs font-medium mb-3">
                  Proof posted — connected sponsors have been notified.
                </div>
              )}
              {showProofForm && (
                <div className="border border-gray-200 rounded-xl p-4">
                  {proofError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs mb-3">{proofError}</div>
                  )}
                  <label className="text-xs font-medium text-gray-700 block mb-1">What did the support go towards?</label>
                  <textarea
                    value={proofBody}
                    onChange={(e) => setProofBody(e.target.value)}
                    maxLength={1000}
                    rows={4}
                    placeholder="e.g. Purchased boots and training kit for the upcoming season. Receipt sent to GRS via WhatsApp."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowProofForm(false); setProofError(null); setProofBody(""); }}
                      className="flex-1 border border-gray-300 text-gray-700 text-xs font-medium py-2 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={postProof}
                      disabled={proofSubmitting || !proofBody.trim()}
                      className="flex-1 bg-[#1a5c2a] text-white text-xs font-semibold py-2 rounded-lg hover:bg-[#145222] disabled:opacity-60"
                    >
                      {proofSubmitting ? "Posting…" : "Post Proof"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* How it works */}
          <div className="bg-[#1a5c2a]/5 border border-[#1a5c2a]/20 rounded-2xl p-5">
            <h2 className="font-semibold text-[#1a5c2a] mb-3">How the connection works</h2>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
              <li>You submit an introduction request (optional message and sponsorship idea).</li>
              <li>The athlete reviews your request and accepts or declines.</li>
              <li>If accepted, GRS facilitates the formal introduction so you can discuss terms directly.</li>
            </ol>
          </div>

          <Link href="/sponsorships" className="inline-block text-sm text-[#1a5c2a] hover:underline pb-6">
            ← Back to Sponsorships
          </Link>
        </div>

        {/* ══ RIGHT COLUMN (sticky) ══════════════════════════════════════════ */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-5 lg:sticky lg:top-4 lg:self-start">

          {/* Stats card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            {c.target_cents != null && (
              <div className="mb-4 pb-4 border-b border-gray-100">
                <div className="text-3xl font-bold text-[#1a5c2a] leading-none">
                  {fmt(c.target_cents, c.currency ?? "USD")}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">support needed</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-gray-800">{c.introduction_count}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  sponsor{c.introduction_count === 1 ? "" : "s"} interested
                </div>
              </div>

              {deadlineDays !== null && (
                <div className={`rounded-xl p-3 text-center ${deadlineSoon ? "bg-red-50" : "bg-gray-50"}`}>
                  <div className={`text-xl font-bold ${deadlineSoon ? "text-red-600" : "text-gray-800"}`}>
                    {deadlineDays < 0 ? "Closed" : deadlineDays === 0 ? "Today" : `${deadlineDays}d`}
                  </div>
                  <div className={`text-xs mt-0.5 ${deadlineSoon ? "text-red-500" : "text-gray-500"}`}>
                    {deadlineDays < 0 ? "deadline passed" : "left"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CTA card — non-owner sponsors on live cases */}
          {!isOwner && c.status === "live" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
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
              <p className="text-xs text-gray-400 text-center mt-3">
                Your interest is shared with the athlete. GRS facilitates the introduction.
              </p>
            </div>
          )}

          {/* Owner: vouch management panel (draft / pending_vouch) */}
          {isOwner && (c.status === "draft" || c.status === "pending_vouch") && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-1 text-sm">Awaiting a Vouch</h2>
              <p className="text-xs text-gray-500 mb-4">
                A coach, teacher, or club official must vouch for this case before it can go live.
              </p>

              {c.vouches && c.vouches.length > 0 && (
                <div className="mb-4 space-y-2">
                  {c.vouches.map((v) => (
                    <div key={v.id} className="bg-gray-50 rounded-lg px-3 py-2 text-xs flex items-center justify-between gap-2">
                      <span className="font-medium text-gray-800 truncate">
                        {v.voucher_org_name ?? v.voucher?.name ?? (v.invite_whatsapp ? `WhatsApp: ${v.invite_whatsapp}` : "Pending")}
                      </span>
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded-full font-medium ${
                        v.status === "confirmed" ? "bg-green-100 text-green-800"
                        : v.status === "declined" || v.status === "revoked" ? "bg-red-100 text-red-700"
                        : "bg-purple-100 text-purple-800"
                      }`}>
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
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs mb-3">{vouchError}</div>
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

          {/* Owner: tabbed intro panel (all statuses, once loaded) */}
          {isOwner && ownerIntrosLoaded && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* tab bar */}
              <div className="flex border-b border-gray-100">
                {(["pending", "accepted", "expired"] as const).map((tab) => {
                  const count = tab === "pending" ? pendingCount : tab === "accepted" ? acceptedCount : expiredCount;
                  return (
                    <button
                      key={tab}
                      onClick={() => setIntroTab(tab)}
                      className={`flex-1 py-3 text-xs font-semibold capitalize flex items-center justify-center gap-1.5 transition-colors ${
                        introTab === tab
                          ? "border-b-2 border-[#1a5c2a] text-[#1a5c2a]"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {tab}
                      {count > 0 && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                          introTab === tab ? "bg-[#1a5c2a] text-white" : "bg-gray-100 text-gray-600"
                        }`}>{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-4">
                {respondError && (
                  <p className="text-xs text-red-600 mb-3 bg-red-50 px-3 py-2 rounded-lg">{respondError}</p>
                )}

                {/* Pending tab */}
                {introTab === "pending" && (
                  <>
                    {pendingCount === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No pending requests yet.</p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {ownerIntros.filter((i) => i.status === "pending").map((intro) => (
                          <div key={intro.id} className="py-4 first:pt-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-gray-900 truncate">
                                  {intro.sponsor_name ?? intro.sponsor_email ?? "Sponsor"}
                                </div>
                                {intro.sponsor_user_id && (
                                  <Link href={`/sponsor/${intro.sponsor_user_id}`} className="text-xs text-[#1a5c2a] hover:underline mt-0.5 inline-block">
                                    View profile →
                                  </Link>
                                )}
                                <div className="text-xs text-gray-400 mt-0.5">
                                  {new Date(intro.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                                </div>
                              </div>
                              {intro.offer_cents != null && (
                                <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full flex-shrink-0">
                                  {fmt(intro.offer_cents)}
                                </span>
                              )}
                            </div>
                            {intro.message && (
                              <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-3 leading-relaxed italic">
                                &ldquo;{intro.message}&rdquo;
                              </p>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => respondIntro(intro.id, "accept")}
                                disabled={respondingId !== null}
                                className="flex-1 bg-[#1a5c2a] text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-[#145222] disabled:opacity-50 transition-colors"
                              >
                                {respondingId === intro.id ? "Saving…" : "Accept"}
                              </button>
                              <button
                                onClick={() => respondIntro(intro.id, "decline")}
                                disabled={respondingId !== null}
                                className="flex-1 border border-gray-300 text-gray-600 text-xs font-semibold py-2.5 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Accepted tab */}
                {introTab === "accepted" && (
                  <>
                    {acceptedCount === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No accepted introductions yet.</p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {ownerIntros.filter((i) => i.status === "accepted").map((intro) => (
                          <div key={intro.id} className="flex items-start justify-between gap-3 py-3 first:pt-0">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {intro.sponsor_name ?? intro.sponsor_email ?? "Sponsor"}
                              </div>
                              {intro.sponsor_user_id && (
                                <Link href={`/sponsor/${intro.sponsor_user_id}`} className="text-xs text-[#1a5c2a] hover:underline mt-0.5 inline-block">
                                  View profile →
                                </Link>
                              )}
                              {intro.offer_cents != null && (
                                <div className="text-xs text-gray-500 mt-0.5">Offer: {fmt(intro.offer_cents)}</div>
                              )}
                            </div>
                            <Link
                              href={`/sponsorships/${caseData!.id}/introductions/${intro.id}/agreement`}
                              className="flex items-center gap-1.5 flex-shrink-0"
                            >
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>
                                Agreement →
                              </span>
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Expired tab */}
                {introTab === "expired" && (
                  <>
                    {expiredCount === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No expired requests.</p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {ownerIntros.filter((i) => i.status === "expired").map((intro) => (
                          <div key={intro.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {intro.sponsor_name ?? intro.sponsor_email ?? "Sponsor"}
                              </div>
                              {intro.sponsor_user_id && (
                                <Link href={`/sponsor/${intro.sponsor_user_id}`} className="text-xs text-[#1a5c2a] hover:underline mt-0.5 inline-block">
                                  View profile →
                                </Link>
                              )}
                              {intro.offer_cents != null && (
                                <div className="text-xs text-gray-500 mt-0.5">Offer: {fmt(intro.offer_cents)}</div>
                              )}
                            </div>
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 flex-shrink-0">
                              Expired
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Auto-accept toggle — owner only, live cases */}
          {isOwner && c.status === "live" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-gray-900 text-sm">Auto-accept requests</span>
                    {autoAccept && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">On</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {autoAccept
                      ? "All sponsor requests accepted instantly."
                      : "You review each request before accepting."}
                  </p>
                </div>
                <button
                  onClick={toggleAutoAccept}
                  disabled={autoAcceptSaving}
                  aria-label="Toggle auto-accept"
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${autoAccept ? "bg-[#1a5c2a]" : "bg-gray-200"} ${autoAcceptSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoAccept ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
          )}

        </div>
        {/* ══ END RIGHT COLUMN ══════════════════════════════════════════════ */}
      </div>

      {/* Mobile sticky CTA — sponsors only, live case, non-owner */}
      {!isOwner && c.status === "live" && (canRequestIntro || !user) && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
          {!user ? (
            <Link
              href="/login"
              className="block w-full text-center bg-[#1a5c2a] text-white font-semibold text-sm py-3 rounded-xl"
            >
              Sign in to Ask to Connect
            </Link>
          ) : (
            <button
              onClick={() => setShowIntroModal(true)}
              className="w-full bg-[#1a5c2a] text-white font-semibold text-sm py-3 rounded-xl"
            >
              Ask to Connect
            </button>
          )}
        </div>
      )}

      {/* Intro Request Modal */}
      {showIntroModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="font-bold text-gray-900 text-lg mb-1">Ask to Connect</h2>
            <p className="text-xs text-gray-500 mb-4">
              Your request will be reviewed by the athlete. GRS will facilitate the introduction if accepted.
            </p>
            {introError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs mb-3">{introError}</div>
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
                  Offer amount in USD <span className="text-gray-400">(optional)</span>
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
