"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import {
  ArrowLeft, CheckCircle2, Circle, Clock, Eye, AlertCircle,
} from "lucide-react";
import VouchPanel from "@/components/sponsorship/VouchPanel";
import EligibilityChecklist from "@/components/sponsorship/EligibilityChecklist";
import MediaManager from "@/components/sponsorship/MediaManager";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

interface VouchRecord {
  id: string;
  status: string;
  voucher_org_name: string | null;
  invite_whatsapp: string | null;
  voucher?: { id: string; name: string } | null;
}

interface CaseData {
  id: string;
  public_code?: string | null;
  title: string;
  sport: string;
  category: string;
  status: "draft" | "pending_vouch" | "in_review" | "live" | "closed";
  story_short: string | null;
  story: string | null;
  cover_image_url: string | null;
  target_cents: number | null;
  currency: string;
  deadline_at: string | null;
  created_at: string;
  owner_user_id: string;
  owner_name: string | null;
  fl_passed: boolean;
  vouches: VouchRecord[];
  vouched: boolean;
  is_minor: boolean;
  province: string | null;
  age_group: string | null;
  auto_accept_introductions: boolean;
}

function StepIcon({ done, active }: { done: boolean; active: boolean }) {
  if (done) return <CheckCircle2 size={18} className="text-green-600" />;
  if (active) return <Clock size={18} className="text-amber-500" />;
  return <Circle size={18} className="text-gray-300" />;
}

function ProgressChecklist({ caseData }: { caseData: CaseData }) {
  const flDone = caseData.fl_passed;
  const vouchedDone = caseData.vouched || caseData.status === "in_review" || caseData.status === "live";
  const reviewDone = caseData.status === "live";
  const isLive = caseData.status === "live";

  const steps = [
    {
      label: "Financial Literacy Completed",
      desc: "Complete the short financial literacy quiz",
      done: flDone,
      active: !flDone,
      action: !flDone ? (
        <Link
          href={`/sponsorships/${caseData.id}/fl`}
          className="text-xs font-medium text-[#1a5c2a] hover:underline"
        >
          Complete now →
        </Link>
      ) : null,
    },
    {
      label: "Vouch Received",
      desc: "A coach, teacher, or club official must vouch for this case",
      done: vouchedDone,
      active: flDone && !vouchedDone,
      action: null,
    },
    {
      label: "GRS Review",
      desc: "GRS reviews the case before it goes live",
      done: reviewDone,
      active: vouchedDone && !reviewDone,
      action: null,
    },
    {
      label: "Live for Sponsors",
      desc: "Sponsors can discover and support this case",
      done: isLive,
      active: false,
      action: isLive && caseData.public_code ? (
        <Link
          href={`/sponsorships/${caseData.public_code}`}
          className="text-xs font-medium text-[#1a5c2a] hover:underline"
        >
          View public page →
        </Link>
      ) : null,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-4 text-sm">Case Progress</h2>
      <ol className="space-y-4">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0">
              <StepIcon done={step.done} active={step.active} />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-medium ${
                  step.done ? "text-gray-900 line-through" : step.active ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {step.label}
              </p>
              {!step.done && (
                <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
              )}
              {step.action && <div className="mt-1">{step.action}</div>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function OwnerCaseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submitted = searchParams.get("submitted") === "1";

  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);

  const [caseData,       setCaseData]       = useState<CaseData | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [accessDenied,   setAccessDenied]   = useState(false);

  // VouchPanel state
  const [showVouchForm,    setShowVouchForm]    = useState(false);
  const [eligibleCoaches,  setEligibleCoaches]  = useState<{ id: string; name: string; phone: string | null }[]>([]);
  const [eligibleLoading,  setEligibleLoading]  = useState(false);
  const [vouchMode,        setVouchMode]        = useState<"platform" | "whatsapp">("platform");
  const [vouchUserId,      setVouchUserId]      = useState("");
  const [vouchWhatsapp,    setVouchWhatsapp]    = useState("");
  const [vouchRole,        setVouchRole]        = useState("");
  const [vouchSubmitting,  setVouchSubmitting]  = useState(false);
  const [vouchError,       setVouchError]       = useState<string | null>(null);
  const [vouchSuccess,     setVouchSuccess]     = useState(false);
  const [autoAcceptSaving, setAutoAcceptSaving] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    const fetchCase = async () => {
      setLoading(true);
      setError(null);
      setAccessDenied(false);

      try {
        const headers: Record<string, string> = { Accept: "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${BASE}/sponsorships/${params.id}/detail`, { headers });

        if (res.status === 401 || res.status === 403) {
          setAccessDenied(true);
          return;
        }

        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setError((json as { message?: string }).message ?? "Could not load this case.");
          return;
        }

        const json = await res.json();
        const data: CaseData = json.data ?? json;

        // If not the owner and case is draft, deny access
        if (data.status === "draft" && (!user || user.id !== data.owner_user_id)) {
          setAccessDenied(true);
          return;
        }

        // If the authenticated user is not the owner, redirect to public page
        if (user && user.id !== data.owner_user_id && data.status !== "draft") {
          const dest = data.public_code
            ? `/sponsorships/${data.public_code}`
            : `/sponsorships/${data.id}`;
          router.replace(dest);
          return;
        }

        setCaseData(data);
      } catch {
        setError("Could not load this case.");
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [hasHydrated, token, params.id, user, router]);

  const requestVouch = async () => {
    if (!caseData) return;
    setVouchSubmitting(true);
    setVouchError(null);

    try {
      const body =
        vouchMode === "platform"
          ? { voucher_user_id: vouchUserId, voucher_role: vouchRole }
          : { invite_whatsapp: vouchWhatsapp, voucher_role: vouchRole };

      const res = await fetch(`${BASE}/sponsorships/${caseData.id}/vouches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setVouchError(
          (json as { message?: string }).message ?? "Could not send vouch request."
        );
        return;
      }

      const newVouch: VouchRecord = (json as { data?: VouchRecord }).data ?? (json as VouchRecord);

      setCaseData((prev) =>
        prev
          ? {
              ...prev,
              vouches: [...prev.vouches, newVouch],
              status: prev.status === "draft" ? "pending_vouch" : prev.status,
            }
          : prev
      );

      setVouchSuccess(true);
      setShowVouchForm(false);
      setVouchUserId("");
      setVouchWhatsapp("");
      setVouchRole("");
    } catch {
      setVouchError("Network error. Please try again.");
    } finally {
      setVouchSubmitting(false);
    }
  };

  if (!hasHydrated) return null;

  if (accessDenied) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-4">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Sponsorship Case</h1>
          </div>
        </div>
        <div className="mx-auto max-w-2xl px-4 py-12 text-center">
          <AlertCircle size={40} className="mx-auto mb-3 text-gray-400" />
          <p className="font-semibold text-gray-700 mb-2">
            Sign in as the owner to view this draft
          </p>
          <p className="text-sm text-gray-500 mb-6">
            This case is not yet public. Only the case owner can view it.
          </p>
          <Link
            href={`/login?next=/account/cases/${params.id}`}
            className="inline-block rounded-lg px-5 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: "#1a5c2a" }}
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-4">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-bold text-gray-900">My Case</h1>
          </div>
        </div>
        <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 rounded-2xl bg-white animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-4">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-bold text-gray-900">My Case</h1>
          </div>
        </div>
        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error ?? "Case not found."}
          </div>
        </div>
      </div>
    );
  }

  const needsVouch =
    caseData.status === "draft" || caseData.status === "pending_vouch";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link href="/account/cases" className="text-gray-500 hover:text-gray-900">
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold text-gray-900 truncate">{caseData.title}</h1>
            <p className="text-xs text-gray-500 capitalize">{caseData.sport} · {caseData.category}</p>
          </div>
          {caseData.status === "live" && caseData.public_code && (
            <Link
              href={`/sponsorships/${caseData.public_code}`}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
              style={{ backgroundColor: "#1a5c2a" }}
            >
              <Eye size={13} />
              Public Page
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        {/* Submitted banner */}
        {submitted && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
            Your case has been submitted! Check your progress below.
          </div>
        )}

        {/* Vouch success banner */}
        {vouchSuccess && !showVouchForm && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
            Vouch request sent!
          </div>
        )}

        {/* Eligibility checklist — show while draft or in_review */}
        {(caseData.status === "draft" || caseData.status === "in_review") && token && (
          <EligibilityChecklist caseId={caseData.id} token={token} />
        )}

        {/* Case summary card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-start gap-3">
            {caseData.cover_image_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={caseData.cover_image_url}
                alt={caseData.title}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: "#1a5c2a" }}
              >
                {caseData.title[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-gray-900 text-sm">{caseData.title}</h2>
              {caseData.story_short && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{caseData.story_short}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                {caseData.target_cents != null && (
                  <span>
                    Target: ${(caseData.target_cents / 100).toLocaleString("en-US")}
                  </span>
                )}
                {caseData.deadline_at && (
                  <span>
                    · Deadline:{" "}
                    {new Date(caseData.deadline_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress checklist */}
        <ProgressChecklist caseData={caseData} />

        {/* Vouch panel (only when vouching is relevant) */}
        {needsVouch && (
          <VouchPanel
            caseId={caseData.id}
            caseStatus={caseData.status}
            vouches={caseData.vouches}
            token={token}
            base={BASE}
            showVouchForm={showVouchForm}
            setShowVouchForm={setShowVouchForm}
            eligibleCoaches={eligibleCoaches}
            setEligibleCoaches={setEligibleCoaches}
            eligibleLoading={eligibleLoading}
            setEligibleLoading={setEligibleLoading}
            vouchMode={vouchMode}
            setVouchMode={setVouchMode}
            vouchUserId={vouchUserId}
            setVouchUserId={setVouchUserId}
            vouchWhatsapp={vouchWhatsapp}
            setVouchWhatsapp={setVouchWhatsapp}
            vouchRole={vouchRole}
            setVouchRole={setVouchRole}
            vouchSubmitting={vouchSubmitting}
            vouchError={vouchError}
            setVouchError={setVouchError}
            vouchSuccess={vouchSuccess}
            onOpenForm={() => {
              setShowVouchForm(true);
              setVouchSuccess(false);
              setVouchError(null);
            }}
            requestVouch={requestVouch}
          />
        )}

        {/* Media gallery */}
        <MediaManager caseId={params.id} token={token} />

        {/* Introduction settings */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">
            Introduction Settings
          </h2>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm text-gray-700 font-medium">
                Auto-accept introductions
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                When on, sponsor connection requests are accepted immediately
                without your review.
              </p>
              {caseData.is_minor && caseData.auto_accept_introductions && (
                <p className="mt-2 text-xs font-medium text-amber-700">
                  ⚠ Minor case — consider keeping this off so you can review
                  each sponsor before they connect.
                </p>
              )}
            </div>
            <button
              role="switch"
              aria-checked={caseData.auto_accept_introductions}
              disabled={autoAcceptSaving}
              onClick={async () => {
                const next = !caseData.auto_accept_introductions;
                setAutoAcceptSaving(true);
                try {
                  const res = await fetch(
                    `${BASE}/sponsorships/${caseData.id}/settings`,
                    {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                      },
                      body: JSON.stringify({ auto_accept_introductions: next }),
                    }
                  );
                  if (res.ok) {
                    setCaseData((prev) =>
                      prev
                        ? { ...prev, auto_accept_introductions: next }
                        : prev
                    );
                  }
                } finally {
                  setAutoAcceptSaving(false);
                }
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                caseData.auto_accept_introductions
                  ? "bg-[#1a5c2a]"
                  : "bg-gray-200"
              } ${autoAcceptSaving ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span
                className={`inline-block h-5 w-5 mt-0.5 ml-0.5 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
                  caseData.auto_accept_introductions
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
