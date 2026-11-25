"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import {
  ArrowLeft, CheckCircle2, Circle, Clock, Eye, AlertCircle,
} from "lucide-react";
import VouchPanel from "@/components/sponsorship/VouchPanel";
import StrongCaseTip from "@/components/sponsorship/StrongCaseTip";
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
  beneficiary_type?: string | null;
}

interface DraftReport {
  id: string;
  writer: "thuto" | "amara";
  public_summary: string;
  level_band: string;
  generated_at: string;
  status: "draft" | "approved" | "flagged";
  flag_note?: string | null;
}

interface SponsorPackage {
  id: string;
  name: string;
  suggested_value_cents: number | null;
  description: string | null;
  sort_order: number;
}

interface RecognitionTier {
  id: string;
  title: string;
  min_value_cents: number;
  description: string | null;
  photo_url: string | null;
  quantity_limit: number | null;
  claimed_count: number;
}

interface PromisedSupporter {
  id: string;
  name: string;
  whatsapp: string | null;
  note: string | null;
  status: string;
  wame_link: string | null;
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

  // Update composer
  const [updateText,    setUpdateText]    = useState("");
  const [updatePosting, setUpdatePosting] = useState(false);
  const [updatePosted,  setUpdatePosted]  = useState(false);
  const [updateCopied,  setUpdateCopied]  = useState(false);

  const UPDATE_TEMPLATES = [
    { label: "Weekly update",  text: "Week X update: Training hard and making good progress. [Add your detail here.]" },
    { label: "Match result",   text: "Match update: We played [opponent] on [date] and [result]. [Describe what happened.]" },
    { label: "Milestone",      text: "Milestone reached: [Describe the achievement.] This brings us closer to our goal." },
    { label: "Thank you",      text: "A huge thank you to everyone supporting this case. [Add your personal message.]" },
    { label: "Items received", text: "Great news — we received [items]. This makes a real difference. Thank you!" },
  ];

  const postUpdate = async () => {
    if (!caseData || !token || !updateText.trim()) return;
    setUpdatePosting(true);
    try {
      const res = await fetch(`${BASE}/sponsorships/${caseData.id}/updates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ body: updateText.trim() }),
      });
      if (res.ok) {
        setUpdatePosted(true);
        setUpdateText("");
        setTimeout(() => setUpdatePosted(false), 3000);
      }
    } catch { /* silent */ } finally {
      setUpdatePosting(false);
    }
  };

  const copyUpdateForWhatsApp = () => {
    if (!updateText.trim()) return;
    navigator.clipboard.writeText(updateText.trim()).then(() => {
      setUpdateCopied(true);
      setTimeout(() => setUpdateCopied(false), 2000);
    });
  };

  // Report draft
  const [report,          setReport]          = useState<DraftReport | null>(null);
  const [reportLoaded,    setReportLoaded]     = useState(false);
  const [showFlagForm,    setShowFlagForm]     = useState(false);
  const [flagNote,        setFlagNote]         = useState("");
  const [flagSubmitting,  setFlagSubmitting]   = useState(false);
  const [flagSuccess,     setFlagSuccess]      = useState(false);

  // Sponsor packages
  const [packages,     setPackages]     = useState<SponsorPackage[]>([]);
  const [pkgLoading,   setPkgLoading]   = useState(false);
  const [pkgSaving,    setPkgSaving]    = useState(false);
  const [pkgError,     setPkgError]     = useState<string | null>(null);
  const [newPkgName,   setNewPkgName]   = useState("");
  const [newPkgValue,  setNewPkgValue]  = useState("");
  const [newPkgDesc,   setNewPkgDesc]   = useState("");

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

  // Load sponsor packages once case data is available
  useEffect(() => {
    if (!caseData || !token) return;
    setPkgLoading(true);
    fetch(`${BASE}/sponsorships/${caseData.id}/packages`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.data) setPackages(j.data); })
      .catch(() => {})
      .finally(() => setPkgLoading(false));
  }, [caseData?.id, token]);

  const addPackage = async () => {
    if (!caseData || !token || !newPkgName.trim()) return;
    setPkgSaving(true);
    setPkgError(null);
    try {
      const res = await fetch(`${BASE}/sponsorships/${caseData.id}/packages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, Accept: "application/json" },
        body: JSON.stringify({
          name: newPkgName.trim(),
          suggested_value_cents: newPkgValue ? Math.round(parseFloat(newPkgValue) * 100) : null,
          description: newPkgDesc.trim() || null,
          sort_order: packages.length,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setPkgError((json as { message?: string }).message ?? "Could not add package."); return; }
      setPackages((prev) => [...prev, (json as { data?: SponsorPackage }).data ?? (json as SponsorPackage)]);
      setNewPkgName(""); setNewPkgValue(""); setNewPkgDesc("");
    } catch { setPkgError("Could not add package."); }
    finally { setPkgSaving(false); }
  };

  const deletePackage = async (pkgId: string) => {
    if (!caseData || !token) return;
    try {
      await fetch(`${BASE}/sponsorships/${caseData.id}/packages/${pkgId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      setPackages((prev) => prev.filter((p) => p.id !== pkgId));
    } catch { /* silent */ }
  };

  // Recognition tiers
  const [tiers,       setTiers]       = useState<RecognitionTier[]>([]);
  const [tierLoading, setTierLoading] = useState(false);
  const [tierSaving,  setTierSaving]  = useState(false);
  const [tierError,   setTierError]   = useState<string | null>(null);
  const [newTierTitle, setNewTierTitle] = useState("");
  const [newTierMin,   setNewTierMin]   = useState("");
  const [newTierDesc,  setNewTierDesc]  = useState("");
  const [newTierQty,   setNewTierQty]   = useState("");

  useEffect(() => {
    if (!caseData || !token) return;
    setTierLoading(true);
    fetch(`${BASE}/sponsorships/${caseData.id}/tiers`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.data) setTiers(j.data); })
      .catch(() => {})
      .finally(() => setTierLoading(false));
  }, [caseData?.id, token]);

  const addTier = async () => {
    if (!caseData || !token || !newTierTitle.trim() || !newTierMin) return;
    setTierSaving(true); setTierError(null);
    try {
      const res = await fetch(`${BASE}/sponsorships/${caseData.id}/tiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, Accept: "application/json" },
        body: JSON.stringify({
          title: newTierTitle.trim(),
          min_value_cents: Math.round(parseFloat(newTierMin) * 100),
          description: newTierDesc.trim() || null,
          quantity_limit: newTierQty ? parseInt(newTierQty) : null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setTierError((json as { message?: string }).message ?? "Could not add tier."); return; }
      setTiers((prev) => [...prev, (json as { data?: RecognitionTier }).data ?? (json as RecognitionTier)]);
      setNewTierTitle(""); setNewTierMin(""); setNewTierDesc(""); setNewTierQty("");
    } catch { setTierError("Could not add tier."); }
    finally { setTierSaving(false); }
  };

  const deleteTier = async (tierId: string) => {
    if (!caseData || !token) return;
    try {
      await fetch(`${BASE}/sponsorships/${caseData.id}/tiers/${tierId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      setTiers((prev) => prev.filter((t) => t.id !== tierId));
    } catch { /* silent */ }
  };

  // Promised supporters
  const [supporters,       setLocalSupporters]  = useState<PromisedSupporter[]>([]);
  const [suppLoading,      setSuppLoading]       = useState(false);
  const [suppSaving,       setSuppSaving]        = useState(false);
  const [suppError,        setSuppError]         = useState<string | null>(null);
  const [newSuppName,      setNewSuppName]       = useState("");
  const [newSuppWhatsapp,  setNewSuppWhatsapp]   = useState("");
  const [newSuppNote,      setNewSuppNote]       = useState("");

  useEffect(() => {
    if (!caseData || !token) return;
    setSuppLoading(true);
    fetch(`${BASE}/sponsorships/${caseData.id}/promised-supporters`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.data) setLocalSupporters(j.data); })
      .catch(() => {})
      .finally(() => setSuppLoading(false));
  }, [caseData?.id, token]);

  const addSupporter = async () => {
    if (!caseData || !token || !newSuppName.trim()) return;
    setSuppSaving(true); setSuppError(null);
    try {
      const res = await fetch(`${BASE}/sponsorships/${caseData.id}/promised-supporters`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, Accept: "application/json" },
        body: JSON.stringify({ name: newSuppName.trim(), whatsapp: newSuppWhatsapp.trim() || null, note: newSuppNote.trim() || null }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setSuppError((json as { message?: string }).message ?? "Could not add supporter."); return; }
      setLocalSupporters((prev) => [...prev, (json as { data?: PromisedSupporter }).data ?? (json as PromisedSupporter)]);
      setNewSuppName(""); setNewSuppWhatsapp(""); setNewSuppNote("");
    } catch { setSuppError("Could not add."); }
    finally { setSuppSaving(false); }
  };

  const deleteSupporter = async (suppId: string) => {
    if (!caseData || !token) return;
    try {
      await fetch(`${BASE}/sponsorships/${caseData.id}/promised-supporters/${suppId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      setLocalSupporters((prev) => prev.filter((s) => s.id !== suppId));
    } catch { /* silent */ }
  };

  // Media help request
  const [mediaReqSent,    setMediaReqSent]    = useState(false);
  const [mediaReqSending, setMediaReqSending] = useState(false);
  const [mediaReqError,   setMediaReqError]   = useState<string | null>(null);
  const [mediaReqAngle,   setMediaReqAngle]   = useState("");
  const [mediaReqWhy,     setMediaReqWhy]     = useState("");
  const [showMediaForm,   setShowMediaForm]   = useState(false);
  const [mediaReqCopied,  setMediaReqCopied]  = useState(false);

  const sendMediaRequest = async () => {
    if (!caseData || !token || !mediaReqAngle.trim()) return;
    setMediaReqSending(true); setMediaReqError(null);
    try {
      const res = await fetch(`${BASE}/sponsorships/${caseData.id}/media-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, Accept: "application/json" },
        body: JSON.stringify({ story_angle: mediaReqAngle.trim(), why_now: mediaReqWhy.trim() || null }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setMediaReqError((json as { message?: string }).message ?? "Could not send request."); return; }
      setMediaReqSent(true); setShowMediaForm(false); setMediaReqAngle(""); setMediaReqWhy("");
    } catch { setMediaReqError("Could not send request."); }
    finally { setMediaReqSending(false); }
  };

  const pressPitchTemplate = caseData ? `PRESS PITCH — ${caseData.title}

Sport: ${caseData.sport}
Province: ${caseData.province ?? "Zimbabwe"}

The story:
${caseData.story_short ?? "[Short description of the case]"}

Why now:
${mediaReqWhy || "[Add why this story is timely]"}

For more information or to arrange an interview, please contact:
GrassRoots Sports — grassrootssports.live` : "";

  // Load draft report once case data is available
  useEffect(() => {
    if (!caseData || !token || reportLoaded) return;
    setReportLoaded(true);
    fetch(`${BASE}/sponsorships/${caseData.id}/report/draft`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.data) setReport(j.data); })
      .catch(() => {});
  }, [caseData, token, reportLoaded]);

  const flagReport = async () => {
    if (!caseData || !token) return;
    setFlagSubmitting(true);
    try {
      const r = await fetch(`${BASE}/sponsorships/${caseData.id}/report/flag`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ flag_note: flagNote.trim() }),
      });
      if (r.ok) {
        setFlagSuccess(true);
        setShowFlagForm(false);
        setFlagNote("");
        setReport((prev) => prev ? { ...prev, status: "flagged" } : prev);
      }
    } catch {
      // silent
    } finally {
      setFlagSubmitting(false);
    }
  };

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

        {/* How to build a strong case tip */}
        {(caseData.status === "draft" || caseData.status === "pending_vouch") && (
          <StrongCaseTip />
        )}

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

        {/* THUTO/Amara report panel (read-only draft view) */}
        {report && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">
                  {report.writer === "amara" ? "Amara" : "THUTO"} Assessment
                  {report.status === "draft" && (
                    <span className="ml-2 text-xs font-normal text-gray-400">(draft — not public yet)</span>
                  )}
                  {report.status === "flagged" && (
                    <span className="ml-2 text-xs font-semibold text-red-600">Flagged for review</span>
                  )}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Generated {new Date(report.generated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.
                  Admin must approve before it appears on your public page.
                </p>
              </div>
              {report.level_band && (
                <span className="flex-shrink-0 text-xs font-semibold bg-[#1a5c2a]/10 text-[#1a5c2a] px-2.5 py-1 rounded-full capitalize">
                  {report.level_band}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">{report.public_summary}</p>

            {/* Flag */}
            {report.status !== "flagged" && !flagSuccess && (
              <div className="border-t border-gray-100 pt-3">
                {!showFlagForm ? (
                  <button
                    onClick={() => setShowFlagForm(true)}
                    className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                  >
                    Something wrong? Flag this report for review →
                  </button>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700 block">What needs to be corrected?</label>
                    <textarea
                      value={flagNote}
                      onChange={(e) => setFlagNote(e.target.value)}
                      maxLength={500}
                      rows={3}
                      placeholder="Describe the issue…"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowFlagForm(false); setFlagNote(""); }}
                        className="flex-1 border border-gray-300 text-gray-600 text-xs font-medium py-1.5 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={flagReport}
                        disabled={flagSubmitting || flagNote.trim().length < 10}
                        className="flex-1 bg-red-600 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-60"
                      >
                        {flagSubmitting ? "Sending…" : "Flag for review"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {(flagSuccess || report.status === "flagged") && (
              <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                Flagged — GRS admin will review and regenerate this report.
              </p>
            )}
          </div>
        )}

        {/* Media gallery */}
        <MediaManager caseId={params.id} token={token} isTeam={caseData.beneficiary_type === "team"} />

        {/* Sponsor packages */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Sponsor Packages</h2>
              <p className="text-xs text-gray-500 mt-0.5">Up to 3 packages sponsors can choose when connecting. Selecting one pre-fills their offer amount.</p>
            </div>
          </div>

          {pkgLoading ? (
            <p className="text-xs text-gray-400">Loading…</p>
          ) : (
            <div className="space-y-2 mb-4">
              {packages.map((pkg) => (
                <div key={pkg.id} className="flex items-start justify-between gap-3 border border-gray-100 rounded-xl px-3 py-2.5 bg-gray-50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{pkg.name}</p>
                    {pkg.suggested_value_cents != null && (
                      <p className="text-xs text-[#1a5c2a] font-medium mt-0.5">
                        Suggested: ${(pkg.suggested_value_cents / 100).toFixed(0)}
                      </p>
                    )}
                    {pkg.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{pkg.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deletePackage(pkg.id)}
                    className="text-xs text-red-500 hover:text-red-700 shrink-0 mt-0.5"
                    aria-label="Remove package"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {packages.length === 0 && (
                <p className="text-xs text-gray-400 italic">No packages yet. Add one below.</p>
              )}
            </div>
          )}

          {packages.length < 3 && (
            <div className="border border-dashed border-gray-300 rounded-xl p-3 space-y-2">
              <p className="text-xs font-medium text-gray-700">Add a package</p>
              <input
                type="text"
                value={newPkgName}
                onChange={(e) => setNewPkgName(e.target.value)}
                placeholder="Name (e.g. Kit Sponsor)"
                maxLength={100}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
              />
              <input
                type="number"
                value={newPkgValue}
                onChange={(e) => setNewPkgValue(e.target.value)}
                placeholder="Suggested amount in USD (optional)"
                min="1"
                step="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
              />
              <textarea
                value={newPkgDesc}
                onChange={(e) => setNewPkgDesc(e.target.value)}
                placeholder="What the sponsor receives (optional)"
                maxLength={300}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 resize-none"
              />
              {pkgError && <p className="text-xs text-red-600">{pkgError}</p>}
              <button
                onClick={addPackage}
                disabled={pkgSaving || !newPkgName.trim()}
                className="w-full bg-[#1a5c2a] text-white text-xs font-semibold py-2 rounded-xl hover:bg-[#145222] disabled:opacity-50 transition-colors"
              >
                {pkgSaving ? "Adding…" : "Add Package"}
              </button>
              <p className="text-xs text-gray-400">
                Ideas: Community Supporter ($25–50), Team Partner ($100–250), Kit Sponsor ($500+)
              </p>
            </div>
          )}
          {packages.length >= 3 && (
            <p className="text-xs text-gray-500 italic">Maximum 3 packages reached. Remove one to add another.</p>
          )}
        </div>

        {/* Recognition tiers */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="mb-3">
            <h2 className="font-semibold text-gray-900 text-sm">Recognition Tiers</h2>
            <p className="text-xs text-gray-500 mt-0.5">Define what sponsors receive based on contribution level. Shown publicly on the case page.</p>
          </div>

          {tierLoading ? (
            <p className="text-xs text-gray-400">Loading…</p>
          ) : (
            <div className="space-y-2 mb-4">
              {tiers.map((tier) => (
                <div key={tier.id} className="flex items-start justify-between gap-3 border border-gray-100 rounded-xl px-3 py-2.5 bg-gray-50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{tier.title}</p>
                      <span className="text-xs font-medium text-[#1a5c2a]">${(tier.min_value_cents / 100).toFixed(0)}+</span>
                    </div>
                    {tier.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{tier.description}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {tier.quantity_limit != null ? `${tier.claimed_count}/${tier.quantity_limit} claimed` : "Unlimited"}
                    </p>
                  </div>
                  <button onClick={() => deleteTier(tier.id)} className="text-xs text-red-500 hover:text-red-700 shrink-0 mt-0.5">Remove</button>
                </div>
              ))}
              {tiers.length === 0 && <p className="text-xs text-gray-400 italic">No tiers yet.</p>}
            </div>
          )}

          <div className="border border-dashed border-gray-300 rounded-xl p-3 space-y-2">
            <p className="text-xs font-medium text-gray-700">Add a tier</p>
            <input type="text" value={newTierTitle} onChange={(e) => setNewTierTitle(e.target.value)} placeholder="Title (e.g. Community Supporter)" maxLength={100} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
            <input type="number" value={newTierMin} onChange={(e) => setNewTierMin(e.target.value)} placeholder="Minimum contribution in USD" min="1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
            <textarea value={newTierDesc} onChange={(e) => setNewTierDesc(e.target.value)} placeholder="What the sponsor receives (optional)" maxLength={300} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 resize-none" />
            <input type="number" value={newTierQty} onChange={(e) => setNewTierQty(e.target.value)} placeholder="Quantity limit (blank = unlimited)" min="1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
            {tierError && <p className="text-xs text-red-600">{tierError}</p>}
            <button onClick={addTier} disabled={tierSaving || !newTierTitle.trim() || !newTierMin} className="w-full bg-[#1a5c2a] text-white text-xs font-semibold py-2 rounded-xl hover:bg-[#145222] disabled:opacity-50 transition-colors">
              {tierSaving ? "Adding…" : "Add Tier"}
            </button>
          </div>
        </div>

        {/* Promised supporters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="mb-3">
            <h2 className="font-semibold text-gray-900 text-sm">Promised Supporters</h2>
            <p className="text-xs text-gray-500 mt-0.5">Log people who have verbally committed. When the case goes live, one-tap WhatsApp links appear.</p>
          </div>

          {suppLoading ? (
            <p className="text-xs text-gray-400">Loading…</p>
          ) : (
            <div className="space-y-2 mb-4">
              {supporters.map((s) => (
                <div key={s.id} className="flex items-start justify-between gap-3 border border-gray-100 rounded-xl px-3 py-2.5 bg-gray-50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    {s.whatsapp && <p className="text-xs text-gray-400">{s.whatsapp}</p>}
                    {s.note && <p className="text-xs text-gray-500 truncate">{s.note}</p>}
                    <span className={`inline-block mt-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      s.status === "connected" ? "bg-green-100 text-green-700" :
                      s.status === "messaged"  ? "bg-blue-50 text-blue-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>{s.status}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {s.wame_link && (
                      <a href={s.wame_link} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-green-700 hover:underline">
                        WhatsApp →
                      </a>
                    )}
                    <button onClick={() => deleteSupporter(s.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  </div>
                </div>
              ))}
              {supporters.length === 0 && <p className="text-xs text-gray-400 italic">No promised supporters yet.</p>}
            </div>
          )}

          <div className="border border-dashed border-gray-300 rounded-xl p-3 space-y-2">
            <p className="text-xs font-medium text-gray-700">Add a supporter</p>
            <input type="text" value={newSuppName} onChange={(e) => setNewSuppName(e.target.value)} placeholder="Name" maxLength={100} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
            <input type="text" value={newSuppWhatsapp} onChange={(e) => setNewSuppWhatsapp(e.target.value)} placeholder="WhatsApp number (optional)" maxLength={30} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
            <input type="text" value={newSuppNote} onChange={(e) => setNewSuppNote(e.target.value)} placeholder="Note (optional)" maxLength={200} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
            {suppError && <p className="text-xs text-red-600">{suppError}</p>}
            <button onClick={addSupporter} disabled={suppSaving || !newSuppName.trim()} className="w-full bg-[#1a5c2a] text-white text-xs font-semibold py-2 rounded-xl hover:bg-[#145222] disabled:opacity-50 transition-colors">
              {suppSaving ? "Adding…" : "Add Supporter"}
            </button>
          </div>
        </div>

        {/* Ask GRS for media help — live cases only */}
        {caseData.status === "live" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">Ask GRS for Media Help</h2>
                <p className="text-xs text-gray-500 mt-0.5">Request coverage — GRS will reach out to journalists and community media on your behalf.</p>
              </div>
              {!showMediaForm && !mediaReqSent && (
                <button onClick={() => setShowMediaForm(true)} className="text-xs font-medium text-[#1a5c2a] hover:underline shrink-0">Request →</button>
              )}
            </div>
            {mediaReqSent && (
              <p className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                Request sent! GRS will review and follow up.
              </p>
            )}
            {showMediaForm && !mediaReqSent && (
              <div className="space-y-2 mt-2">
                <textarea value={mediaReqAngle} onChange={(e) => setMediaReqAngle(e.target.value)} placeholder="Describe the story angle (what makes this case newsworthy?)" rows={3} maxLength={2000} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 resize-none" />
                <textarea value={mediaReqWhy} onChange={(e) => setMediaReqWhy(e.target.value)} placeholder="Why now? (optional — upcoming event, deadline, etc.)" rows={2} maxLength={1000} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 resize-none" />

                {/* Press pitch template */}
                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-gray-700">Copyable press pitch</p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(pressPitchTemplate); setMediaReqCopied(true); setTimeout(() => setMediaReqCopied(false), 2000); }}
                      className="text-xs text-[#1a5c2a] hover:underline font-medium"
                    >
                      {mediaReqCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <pre className="text-xs text-gray-500 whitespace-pre-wrap leading-relaxed">{pressPitchTemplate}</pre>
                </div>

                {mediaReqError && <p className="text-xs text-red-600">{mediaReqError}</p>}
                <div className="flex gap-2">
                  <button onClick={() => { setShowMediaForm(false); setMediaReqAngle(""); setMediaReqWhy(""); }} className="flex-1 border border-gray-300 text-gray-600 text-xs font-medium py-1.5 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button onClick={sendMediaRequest} disabled={mediaReqSending || mediaReqAngle.trim().length < 10} className="flex-1 bg-[#1a5c2a] text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-[#145222] disabled:opacity-50">
                    {mediaReqSending ? "Sending…" : "Send Request"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Update composer — only for live cases */}
        {caseData.status === "live" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">Post an Update</h2>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {UPDATE_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setUpdateText(t.text)}
                  className="text-xs px-2.5 py-1 rounded-full border border-[#1a5c2a]/30 text-[#1a5c2a] hover:bg-[#1a5c2a]/5 transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>
            <textarea
              value={updateText}
              onChange={(e) => setUpdateText(e.target.value)}
              placeholder="Share a progress update with your sponsors…"
              rows={4}
              maxLength={1000}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 resize-none"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={copyUpdateForWhatsApp}
                disabled={!updateText.trim()}
                className="flex-1 border border-[#1a5c2a] text-[#1a5c2a] text-xs font-semibold py-2 rounded-xl hover:bg-[#1a5c2a]/5 disabled:opacity-40 transition-colors"
              >
                {updateCopied ? "Copied!" : "Copy for WhatsApp"}
              </button>
              <button
                onClick={postUpdate}
                disabled={updatePosting || !updateText.trim()}
                className="flex-1 bg-[#1a5c2a] text-white text-xs font-semibold py-2 rounded-xl hover:bg-[#145222] disabled:opacity-50 transition-colors"
              >
                {updatePosting ? "Posting…" : updatePosted ? "Posted!" : "Post Update"}
              </button>
            </div>
          </div>
        )}

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
