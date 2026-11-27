"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { PublicNavbar } from "@/components/layout/public-navbar";
import StrongCaseTip from "@/components/sponsorship/StrongCaseTip";
import MediaManager from "@/components/sponsorship/MediaManager";
import EligibilityChecklist from "@/components/sponsorship/EligibilityChecklist";
import { CheckCircle2, Loader2, Plus, Trash2, Upload } from "lucide-react";
import api from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

// ── Reference data ────────────────────────────────────────────────────────────

const SPORTS = [
  "Football", "Rugby", "Athletics", "Netball",
  "Basketball", "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey",
];

const CATEGORIES = [
  { value: "kit_and_equipment",  label: "Kit & Equipment" },
  { value: "tournament_fees",    label: "Tournament Fees" },
  { value: "training_camp",      label: "Training Camp" },
  { value: "coaching_fees",      label: "Coaching Fees" },
  { value: "transport",          label: "Transport" },
  { value: "academic_support",   label: "Academic Support" },
  { value: "medical",            label: "Medical / Physio" },
  { value: "registration_fees",  label: "Registration Fees" },
  { value: "equipment",          label: "Equipment" },
  { value: "other",              label: "Other" },
];

const AGE_GROUPS = [
  { value: "under_13", label: "Under 13" },
  { value: "13_17",    label: "13–17" },
  { value: "18_plus",  label: "18+" },
];

const SUPPORT_METHODS = [
  { value: "items_direct",    label: "Items delivered directly to the athlete" },
  { value: "pay_supplier",    label: "Pay a named shop or supplier on the athlete's behalf" },
  { value: "pay_institution", label: "Pay the school or academy directly" },
];

const MINOR_GROUPS = new Set(["under_13", "13_17"]);

// ── Types ─────────────────────────────────────────────────────────────────────

interface NeedRow { tempId: string; id?: string; item: string; qty: number; unit_cost_cents: number; needs_pricing?: boolean }

interface SponsorPackage {
  id: string; name: string; suggested_value_cents: number | null; description: string | null;
}

interface RecognitionTier {
  id: string; title: string; min_value_cents: number; description: string | null; quantity_limit: number | null;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="h-1.5 rounded-full flex-1 transition-colors"
          style={{ backgroundColor: i < step ? "#1a5c2a" : "#e5e7eb" }} />
      ))}
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-600 mt-0.5">{msg}</p>;
}

function SectionNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-800">
      {children}
    </div>
  );
}

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Main component ────────────────────────────────────────────────────────────

// useSearchParams() is the correct API for client components: it updates reactively
// on client-side navigation (router.replace / router.push), unlike the searchParams
// prop which is only reliable in server components.
function NewSponsorshipWizardInner() {
  const user           = useAuthStore((s) => s.user);
  const token          = useAuthStore((s) => s.token);
  const hydrated       = useAuthStore((s) => s._hasHydrated);
  const router         = useRouter();
  const searchParamsHook = useSearchParams();

  // ── Wizard state ──────────────────────────────────────────────────────────
  const [step,    setStep]    = useState(1);
  const TOTAL_STEPS = 6;

  // Draft case created after step 1
  const [draftId,       setDraftId]       = useState<string | null>(null);
  const [creating,      setCreating]      = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [topError,      setTopError]      = useState<string | null>(null);
  const [fieldErrors,   setFieldErrors]   = useState<Record<string, string>>({});

  // Step 1 — Basics
  const [title,    setTitle]    = useState("");
  const [sport,    setSport]    = useState("");
  const [category, setCategory] = useState("");
  const [beneficiaryType, setBeneficiaryType] = useState<"player" | "team">("player");

  // Step 2 — Athlete
  const [ageGroup,    setAgeGroup]    = useState("");
  const [province,    setProvince]    = useState("");
  const [storyShort,  setStoryShort]  = useState("");
  // Minor / guardian
  const [guardianName,         setGuardianName]         = useState("");
  const [guardianRelationship, setGuardianRelationship] = useState("");
  const [guardianWhatsapp,     setGuardianWhatsapp]     = useState("");

  // Step 3 — Story & needs
  const [story,         setStory]         = useState("");
  const [supportMethod, setSupportMethod] = useState("");
  const [deadline,      setDeadline]      = useState("");
  const [needItems,     setNeedItems]     = useState<NeedRow[]>([]);
  const [newNeedItem,   setNewNeedItem]   = useState("");
  const [newNeedQty,    setNewNeedQty]    = useState("1");
  const [newNeedUsd,    setNewNeedUsd]    = useState("");

  // Step 3 — Payee details
  const [payeeMethod,       setPayeeMethod]       = useState("");
  const [payeeName,         setPayeeName]         = useState("");
  const [payeeTown,         setPayeeTown]         = useState("");
  const [payeeContact,      setPayeeContact]      = useState("");
  const [payeePhone,        setPayeePhone]        = useState("");
  const [payeePaymentMethod,setPayeePaymentMethod]= useState("");
  const [payeeInstructions, setPayeeInstructions] = useState("");
  const [payeeQuoteUrl,     setPayeeQuoteUrl]     = useState("");
  const [payeeUploading,    setPayeeUploading]    = useState(false);
  const [payeeSaving,       setPayeeSaving]       = useState(false);

  // Step 4 — Media
  const [hasCover, setHasCover] = useState(false);

  // ── Resume & autosave ─────────────────────────────────────────────────────
  const resumeId = searchParamsHook?.get('case') ?? null;
  const forceNew  = searchParamsHook?.get('new') === '1';
  const [resumeLoading, setResumeLoading] = useState(!!resumeId);
  type SaveStatus = "idle" | "saving" | "saved" | "error";
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const autoSaveRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const creatingRef   = useRef(false); // in-flight guard — prevents double-POST

  // Manual "Save draft" button state
  type DraftSaveStatus = "idle" | "saving" | "saved" | "error";
  const [draftSaveStatus, setDraftSaveStatus] = useState<DraftSaveStatus>("idle");
  const [draftSaveError,  setDraftSaveError]  = useState<string | null>(null);
  const [resumeError,    setResumeError]    = useState<string | null>(null);
  const [resumeRetryKey, setResumeRetryKey] = useState(0);

  // Step 5 — Packages & tiers
  const [packages,     setPackages]     = useState<SponsorPackage[]>([]);
  const [pkgLoading,   setPkgLoading]   = useState(false);
  const [newPkgName,   setNewPkgName]   = useState("");
  const [newPkgValue,  setNewPkgValue]  = useState("");
  const [newPkgDesc,   setNewPkgDesc]   = useState("");
  const [pkgSaving,    setPkgSaving]    = useState(false);
  const [tiers,        setTiers]        = useState<RecognitionTier[]>([]);
  const [tiersLoading, setTiersLoading] = useState(false);
  const [newTierTitle, setNewTierTitle] = useState("");
  const [newTierMin,   setNewTierMin]   = useState("");
  const [newTierDesc,  setNewTierDesc]  = useState("");
  const [tierSaving,   setTierSaving]   = useState(false);

  const isCoach = user?.role === "coach" || user?.role === "admin";
  const isMinor = MINOR_GROUPS.has(ageGroup);

  // Guardian child picker — shown when the logged-in user has active guardian_links
  interface GuardianChild { id: string; name: string; age_group: string; avatar_url: string | null }
  const [guardianChildren,        setGuardianChildren]        = useState<GuardianChild[]>([]);
  const [guardianChildrenLoading, setGuardianChildrenLoading] = useState(false);
  const [selectedChildId,         setSelectedChildId]         = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/login");
  }, [hydrated, user, router]);

  // ── Resume from ?case={id} ────────────────────────────────────────────────
  // Req 8: fires FIRST as soon as ?case is known; not gated on guardian-children.
  // Req 7: 15 s hard timeout — AbortController so cleanup cancels in-flight request.
  useEffect(() => {
    if (!hydrated || !token || !user || !resumeId) return;
    // Skip re-hydration when we already hold this draft in state — happens right
    // after createDraft() fires router.replace on the same component instance.
    if (resumeId === draftId) { setResumeLoading(false); return; }
    setResumeLoading(true);
    setResumeError(null);
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 15_000);

    fetch(`${BASE}/sponsorships/${resumeId}/detail`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal:  ctrl.signal,
    })
      .then((r) => { clearTimeout(tid); if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((json) => {
        const d = json?.data;
        if (!d || d.status !== "draft" || d.owner_user_id !== user.id) return;
        setDraftId(d.id);
        setTitle(d.title ?? "");
        setSport(d.sport ?? "");
        setCategory(d.category ?? "");
        setBeneficiaryType(d.beneficiary_type ?? "player");
        setAgeGroup(d.age_group ?? "");
        setProvince(d.province ?? "");
        setStoryShort(d.story_short ?? "");
        setStory(d.story ?? "");
        setSupportMethod(d.suggested_payee ?? "");
        setDeadline(d.deadline_at ? (d.deadline_at as string).substring(0, 10) : "");
        setGuardianName(d.guardian_name ?? "");
        setGuardianRelationship(d.guardian_relationship ?? "");
        setGuardianWhatsapp(d.guardian_whatsapp ?? "");
        // Never move the step backwards — take the larger of current and resumed step.
        setStep((prev) => Math.max(prev, Math.min(d.wizard_step ?? 1, TOTAL_STEPS)));

        // Secondary fetches — non-blocking, own 15 s timeouts
        fetch(`${BASE}/sponsorships/${resumeId}/needs`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          signal:  AbortSignal.timeout(15_000),
        })
          .then((nr) => nr.ok ? nr.json() : null)
          .then((nj) => {
            const rows = nj?.data ?? [];
            if (rows.length > 0) setNeedItems(rows.map((row: { id: string; item: string; qty: number; unit_cost_cents: number }) => ({
              tempId: `srv_${row.id}`, id: row.id, item: row.item, qty: row.qty, unit_cost_cents: row.unit_cost_cents,
            })));
          })
          .catch(() => {});

        fetch(`${BASE}/sponsorships/${resumeId}/payee-details`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          signal:  AbortSignal.timeout(15_000),
        })
          .then((pr) => pr.ok ? pr.json() : null)
          .then((pj) => {
            const p = pj?.data;
            if (!p) return;
            setPayeeMethod(p.method ?? "");
            setPayeeName(p.name ?? "");
            setPayeeTown(p.town ?? "");
            setPayeeContact(p.contact_name ?? "");
            setPayeePhone(p.contact_phone ?? "");
            setPayeePaymentMethod(p.payment_method ?? "");
            setPayeeInstructions(p.payment_instructions ?? "");
            setPayeeQuoteUrl(p.quote_file_url ?? "");
          })
          .catch(() => {});

        // Seed cover-photo state so step 4 is not falsely blocked on resume
        fetch(`${BASE}/sponsorships/${resumeId}/media`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          signal:  AbortSignal.timeout(15_000),
        })
          .then((mr) => mr.ok ? mr.json() : null)
          .then((mj) => {
            if (Array.isArray(mj?.data)) {
              setHasCover(mj.data.some((m: { is_cover: boolean }) => m.is_cover));
            }
          })
          .catch(() => {});
      })
      .catch((err) => {
        clearTimeout(tid);
        // Offline fallback — try localStorage regardless of error type
        try {
          const saved = localStorage.getItem(`grs_draft_${resumeId}`);
          if (saved) {
            const d = JSON.parse(saved) as Record<string, string | number>;
            if (d.title)                setTitle(String(d.title));
            if (d.sport)                setSport(String(d.sport));
            if (d.category)             setCategory(String(d.category));
            if (d.beneficiaryType)      setBeneficiaryType(d.beneficiaryType as "player" | "team");
            if (d.ageGroup)             setAgeGroup(String(d.ageGroup));
            if (d.province)             setProvince(String(d.province));
            if (d.storyShort)           setStoryShort(String(d.storyShort));
            if (d.story)                setStory(String(d.story));
            if (d.supportMethod)        setSupportMethod(String(d.supportMethod));
            if (d.deadline)             setDeadline(String(d.deadline));
            if (d.guardianName)         setGuardianName(String(d.guardianName));
            if (d.guardianRelationship) setGuardianRelationship(String(d.guardianRelationship));
            if (d.guardianWhatsapp)     setGuardianWhatsapp(String(d.guardianWhatsapp));
            setDraftId(resumeId);
            setStep(Math.min(Number(d.step) || 1, TOTAL_STEPS));
            return; // restored from cache — no error shown
          }
        } catch { /* silent */ }
        // No localStorage fallback available
        const isTimeout = (err as Error)?.name === "AbortError";
        setResumeError(
          isTimeout
            ? "Loading your draft timed out (15 s). Please check your connection and try again."
            : "Could not load your draft. Please check your connection and try again."
        );
      })
      .finally(() => setResumeLoading(false));

    return () => { clearTimeout(tid); ctrl.abort(); };
  // resumeId MUST be in deps: the auto-redirect changes it from null → id on
  // the same component instance, and the effect must re-fire to load the draft.
  // resumeRetryKey bumps to retry after a timeout/error.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, token, user, resumeId, resumeRetryKey]);

  // ── Auto-resume: redirect to ?case={id} if the user already has a draft ───
  // Skipped when ?case= is already present (resumeId) or ?new=1 is set (forceNew).
  // Req 7: 15 s timeout — if Render is cold-starting, don't block the form forever.
  useEffect(() => {
    if (!hydrated || !token || resumeId || forceNew) return;
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 15_000);
    fetch(`${BASE}/sponsorships/latest-draft`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal:  ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { clearTimeout(tid); if (j?.data) router.replace(`/sponsorships/new?case=${j.data.id}`); })
      .catch(() => { clearTimeout(tid); /* silent — user stays on blank form */ });
    return () => { clearTimeout(tid); ctrl.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, token]);

  // ── localStorage sync — persist all fields once a draft exists ────────────
  useEffect(() => {
    if (!draftId) return;
    try {
      localStorage.setItem(`grs_draft_${draftId}`, JSON.stringify({
        title, sport, category, beneficiaryType, ageGroup, province,
        storyShort, story, supportMethod, deadline,
        guardianName, guardianRelationship, guardianWhatsapp, step,
      }));
    } catch { /* quota exceeded — silent */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, title, sport, category, beneficiaryType, ageGroup, province,
      storyShort, story, supportMethod, deadline,
      guardianName, guardianRelationship, guardianWhatsapp, step]);

  // ── Autosave — 2 s debounce on text fields, steps 1–3 ────────────────────
  useEffect(() => {
    if (!draftId || step > 3) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    setSaveStatus("saving");
    autoSaveRef.current = setTimeout(async () => {
      const body: Record<string, unknown> = {
        title:    title.trim(),
        sport:    sport.toLowerCase(),
        category,
      };
      if (step >= 2) Object.assign(body, {
        age_group:   ageGroup  || null,
        province:    province.trim()   || null,
        story_short: storyShort.trim() || null,
      });
      if (step >= 3) Object.assign(body, {
        story:           story.trim(),
        suggested_payee: supportMethod || null,
        deadline_at:     deadline      || null,
      });
      if (isMinor) Object.assign(body, {
        guardian_name:         guardianName.trim()         || null,
        guardian_relationship: guardianRelationship.trim() || null,
        guardian_whatsapp:     guardianWhatsapp.trim()     || null,
      });
      try {
        const res = await fetch(`${BASE}/sponsorships/${draftId}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, Accept: "application/json" },
          signal:  AbortSignal.timeout(15_000),
          body:    JSON.stringify(body),
        });
        setSaveStatus(res.ok ? "saved" : "error");
        if (res.ok) setTimeout(() => setSaveStatus("idle"), 2500);
      } catch {
        setSaveStatus("error");
      }
    }, 2000);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, storyShort, story, deadline, province, ageGroup, supportMethod,
      guardianName, guardianRelationship, guardianWhatsapp]);

  // ── Retry autosave when network comes back ────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const retry = () => {
      if (saveStatus !== "error" || !draftId || step > 3) return;
      const saved = localStorage.getItem(`grs_draft_${draftId}`);
      if (!saved) return;
      try {
        const d = JSON.parse(saved) as Record<string, string | number>;
        const body: Record<string, unknown> = {
          title: d.title ?? "", sport: String(d.sport ?? "").toLowerCase(), category: d.category ?? "",
          age_group: d.ageGroup ?? null, province: d.province ?? null, story_short: d.storyShort ?? null,
          story: d.story ?? "", suggested_payee: d.supportMethod ?? null, deadline_at: d.deadline ?? null,
        };
        setSaveStatus("saving");
        fetch(`${BASE}/sponsorships/${draftId}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, Accept: "application/json" },
          body:    JSON.stringify(body),
        }).then((r) => {
          setSaveStatus(r.ok ? "saved" : "error");
          if (r.ok) setTimeout(() => setSaveStatus("idle"), 2500);
        }).catch(() => setSaveStatus("error"));
      } catch { /* silent */ }
    };
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveStatus, draftId, token, step]);

  // Req 6: only fetch guardian-children for accounts that can have guardian links
  // (admin and coach can never be guardians); separate from draft load; 15 s timeout.
  useEffect(() => {
    if (!hydrated || !token) return;
    if (user?.role === "admin" || user?.role === "coach") return;
    setGuardianChildrenLoading(true);
    fetch(`${BASE}/sponsorships/guardian-children`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal:  AbortSignal.timeout(15_000),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((j) => { if (Array.isArray(j?.data)) setGuardianChildren(j.data); })
      .catch(() => { /* timeout or error — guardian picker simply stays hidden */ })
      .finally(() => setGuardianChildrenLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, token]);

  if (!hydrated || !user) return null;

  if (resumeLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <PublicNavbar />
        <div className="max-w-xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
            <div className="h-32 bg-gray-100 rounded-xl" />
            <p className="text-xs text-center text-gray-400 !mt-6">Loading your draft…</p>
          </div>
        </div>
      </div>
    );
  }

  if (resumeError) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <PublicNavbar />
        <div className="max-w-xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {resumeError}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setResumeError(null); setResumeRetryKey((k) => k + 1); }}
                className="flex-1 bg-[#1a5c2a] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#145222] transition-colors"
              >
                Retry
              </button>
              <a
                href="/sponsorships/new?new=1"
                className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-center"
              >
                Start a new case
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization:  `Bearer ${token}`,
    Accept:         "application/json",
  };

  // ── Step validation ───────────────────────────────────────────────────────

  const canContinue = () => {
    if (step === 1) {
      if (title.trim().length <= 5 || !sport || !category) return false;
      if (guardianChildren.length > 0 && !selectedChildId) return false;
      return true;
    }
    if (step === 2) {
      if (!ageGroup) return false;
      if (isMinor && (!guardianName.trim() || !guardianWhatsapp.trim())) return false;
      return true;
    }
    if (step === 3) {
      if (story.trim().length <= 20 || !supportMethod) return false;
      // No need rows with zero cost
      if (needItems.some((n) => n.unit_cost_cents <= 0)) return false;
      // pay_supplier requires a name
      if (supportMethod === "pay_supplier" && !payeeName.trim()) return false;
      return true;
    }
    if (step === 4) return hasCover;
    return true; // steps 5 and 6 are optional / review
  };

  // ── Step 1: Create draft ──────────────────────────────────────────────────

  const createDraft = async (): Promise<string | null> => {
    if (creatingRef.current) return null; // prevent double-POST
    creatingRef.current = true;
    setCreating(true);
    setTopError(null);
    setFieldErrors({});
    try {
      const res = await fetch(`${BASE}/sponsorships`, {
        method:  "POST",
        headers: authHeaders,
        signal:  AbortSignal.timeout(15_000),
        body: JSON.stringify({
          title:            title.trim(),
          sport:            sport.toLowerCase(),
          category,
          beneficiary_type: beneficiaryType,
          wizard_step:      2,
          ...(selectedChildId ? { player_id: selectedChildId } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 422 && json.errors) {
          const errs: Record<string, string> = {};
          for (const [f, msgs] of Object.entries(json.errors as Record<string, string[]>)) errs[f] = msgs[0];
          setFieldErrors(errs);
        } else {
          setTopError(json.message ?? "Could not create case. Please try again.");
        }
        return null;
      }
      const id: string = (json.data ?? json).id;
      setDraftId(id);
      return id;
    } catch (err) {
      const isTimeout = (err as Error)?.name === "AbortError";
      setTopError(isTimeout ? "Request timed out. Please check your connection and try again." : "Network error. Please try again.");
      return null;
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
  };

  // ── PATCH helper ─────────────────────────────────────────────────────────

  const patchDraft = async (id: string, body: Record<string, unknown>): Promise<boolean> => {
    setSaving(true);
    setTopError(null);
    try {
      const res = await fetch(`${BASE}/sponsorships/${id}`, {
        method:  "PATCH",
        headers: authHeaders,
        signal:  AbortSignal.timeout(15_000),
        body:    JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setTopError(json.message ?? "Could not save. Please try again.");
        return false;
      }
      return true;
    } catch (err) {
      const isTimeout = (err as Error)?.name === "AbortError";
      setTopError(isTimeout ? "Request timed out. Please check your connection and try again." : "Network error. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // ── POST need items ───────────────────────────────────────────────────────

  const postNeedItems = async (id: string) => {
    // Only POST rows that haven't been saved yet (no id from API)
    const newRows = needItems.filter((ni) => !ni.id);
    for (const ni of newRows) {
      try {
        const r = await api.post(`/sponsorships/${id}/needs`, {
          item: ni.item, qty: ni.qty, unit_cost_cents: ni.unit_cost_cents,
        });
        // Track the returned id so we don't re-post on the next save
        if (r.data?.data?.id) {
          setNeedItems((prev) => prev.map((row) =>
            row.tempId === ni.tempId ? { ...row, id: r.data.data.id } : row
          ));
        }
      } catch { /* non-blocking — owner can add from case page */ }
    }
  };

  // ── Package helpers ───────────────────────────────────────────────────────

  const loadPackages = (id: string) => {
    setPkgLoading(true);
    fetch(`${BASE}/sponsorships/${id}/packages`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.data) setPackages(j.data); })
      .catch(() => {})
      .finally(() => setPkgLoading(false));
  };

  const addPackage = async () => {
    if (!draftId || !newPkgName.trim()) return;
    setPkgSaving(true);
    try {
      const res = await fetch(`${BASE}/sponsorships/${draftId}/packages`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          name:                 newPkgName.trim(),
          suggested_value_cents: newPkgValue ? Math.round(parseFloat(newPkgValue) * 100) : null,
          description:          newPkgDesc.trim() || null,
        }),
      });
      const json = await res.json();
      if (res.ok && json.data) { setPackages((p) => [...p, json.data]); setNewPkgName(""); setNewPkgValue(""); setNewPkgDesc(""); }
    } catch { /* silent */ } finally { setPkgSaving(false); }
  };

  const deletePackage = async (pkgId: string) => {
    if (!draftId) return;
    await fetch(`${BASE}/sponsorships/${draftId}/packages/${pkgId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
    setPackages((p) => p.filter((x) => x.id !== pkgId));
  };

  // ── Tier helpers ──────────────────────────────────────────────────────────

  const loadTiers = (id: string) => {
    setTiersLoading(true);
    fetch(`${BASE}/sponsorships/${id}/tiers`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.data) setTiers(j.data); })
      .catch(() => {})
      .finally(() => setTiersLoading(false));
  };

  const addTier = async () => {
    if (!draftId || !newTierTitle.trim() || !newTierMin) return;
    setTierSaving(true);
    try {
      const res = await fetch(`${BASE}/sponsorships/${draftId}/tiers`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          title:            newTierTitle.trim(),
          min_value_cents:  Math.round(parseFloat(newTierMin) * 100),
          description:      newTierDesc.trim() || null,
        }),
      });
      const json = await res.json();
      if (res.ok && json.data) { setTiers((t) => [...t, json.data]); setNewTierTitle(""); setNewTierMin(""); setNewTierDesc(""); }
    } catch { /* silent */ } finally { setTierSaving(false); }
  };

  const deleteTier = async (tierId: string) => {
    if (!draftId) return;
    await fetch(`${BASE}/sponsorships/${draftId}/tiers/${tierId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
    setTiers((t) => t.filter((x) => x.id !== tierId));
  };

  // ── "Continue" / "Back" ───────────────────────────────────────────────────

  const handleContinue = async () => {
    setTopError(null);
    if (!canContinue()) {
      if (step === 4 && !hasCover) setTopError("Please add and set a cover photo before continuing.");
      return;
    }

    if (step === 1) {
      if (draftId) {
        // Draft already exists (page was resumed) — PATCH step, never POST again.
        const ok = await patchDraft(draftId, { wizard_step: 2 });
        if (!ok) return;
        setStep(2);
        return;
      }
      const id = await createDraft();
      if (!id) return;
      router.replace(`/sponsorships/new?case=${id}`);
      setStep(2);
      return;
    }

    const id = draftId!;

    if (step === 2) {
      const body: Record<string, unknown> = { age_group: ageGroup, province: province.trim() || null, story_short: storyShort.trim() || null };
      if (isMinor) {
        body.is_minor_beneficiary  = true;
        body.guardian_name         = guardianName.trim() || null;
        body.guardian_relationship = guardianRelationship.trim() || null;
        body.guardian_whatsapp     = guardianWhatsapp.trim() || null;
      }
      const ok = await patchDraft(id, body);
      if (!ok) return;
    }

    if (step === 3) {
      const body: Record<string, unknown> = {
        story:           story.trim(),
        suggested_payee: supportMethod,
        deadline_at:     deadline || null,
        // target_cents will be synced by backend when needs are POSTed
      };
      const ok = await patchDraft(id, body);
      if (!ok) return;
      await postNeedItems(id);
      // Save payee details if any were filled in
      if (supportMethod) {
        setPayeeSaving(true);
        try {
          await api.put(`/sponsorships/${id}/payee-details`, {
            method:               supportMethod,
            name:                 payeeName.trim() || null,
            town:                 payeeTown.trim() || null,
            contact_name:         payeeContact.trim() || null,
            contact_phone:        payeePhone.trim() || null,
            payment_method:       payeePaymentMethod || null,
            payment_instructions: payeeInstructions.trim() || null,
            quote_file_url:       payeeQuoteUrl || null,
          });
        } catch { /* non-blocking — admin will request during review */ }
        finally { setPayeeSaving(false); }
      }
    }

    if (step === 4) {
      // No PATCH needed — MediaManager saved directly; just advance
    }

    if (step === 5) {
      // Packages and tiers saved incrementally via API; just advance
    }

    if (step === TOTAL_STEPS) {
      // Final step — navigate to case detail
      router.push(`/account/cases/${id}?submitted=1`);
      return;
    }

    const nextStep = step + 1;

    // Persist furthest step reached
    if (draftId) {
      fetch(`${BASE}/sponsorships/${draftId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal:  AbortSignal.timeout(15_000),
        body:    JSON.stringify({ wizard_step: nextStep }),
      }).catch(() => {});
    }

    // Lazy-load packages & tiers when entering step 5
    if (nextStep === 5 && draftId) {
      loadPackages(draftId);
      loadTiers(draftId);
    }

    setStep(nextStep);
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  // ── "Save draft" ──────────────────────────────────────────────────────────

  const handleSaveDraft = async () => {
    setDraftSaveStatus("saving");
    setDraftSaveError(null);
    setTopError(null);

    let id = draftId;

    // ── Step 1: no draft yet — create it first ───────────────────────────────
    if (!id) {
      if (!title.trim() || title.trim().length <= 5 || !sport || !category) {
        setDraftSaveStatus("error");
        setDraftSaveError("Please fill in Title, Sport and Category before saving.");
        return;
      }
      id = await createDraft();
      if (!id) {
        setDraftSaveStatus("error");
        setDraftSaveError("Could not save draft — check the fields above and try again.");
        setTopError(null);
        return;
      }
      router.replace(`/sponsorships/new?case=${id}`);
      await fetch(`${BASE}/sponsorships/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal:  AbortSignal.timeout(15_000),
        body:    JSON.stringify({ wizard_step: 1 }),
      }).catch(() => {});
      setDraftSaveStatus("saved");
      return;
    }

    // ── Steps 2–6: PATCH all fields gathered so far + wizard_step ────────────
    const body: Record<string, unknown> = {
      wizard_step:      step,
      title:            title.trim(),
      sport:            sport.toLowerCase(),
      category,
      beneficiary_type: beneficiaryType,
    };
    if (step >= 2) Object.assign(body, {
      age_group:   ageGroup  || null,
      province:    province.trim()   || null,
      story_short: storyShort.trim() || null,
    });
    if (isMinor) Object.assign(body, {
      is_minor_beneficiary:  true,
      guardian_name:         guardianName.trim()         || null,
      guardian_relationship: guardianRelationship.trim() || null,
      guardian_whatsapp:     guardianWhatsapp.trim()     || null,
    });
    if (step >= 3) Object.assign(body, {
      story:           story.trim(),
      suggested_payee: supportMethod || null,
      deadline_at:     deadline      || null,
    });

    try {
      const res = await fetch(`${BASE}/sponsorships/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal:  AbortSignal.timeout(15_000),
        body:    JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { message?: string };
        setDraftSaveStatus("error");
        setDraftSaveError(j.message ?? "Save failed. Please try again.");
        return;
      }
    } catch (err) {
      setDraftSaveStatus("error");
      const isTimeout = (err as Error)?.name === "AbortError";
      setDraftSaveError(isTimeout ? "Request timed out — check your connection and try again." : "Network error — check your connection and try again.");
      return;
    }

    if (step >= 3) await postNeedItems(id);

    if (step >= 3 && supportMethod) {
      try {
        await api.put(`/sponsorships/${id}/payee-details`, {
          method:               supportMethod,
          name:                 payeeName.trim()         || null,
          town:                 payeeTown.trim()         || null,
          contact_name:         payeeContact.trim()      || null,
          contact_phone:        payeePhone.trim()        || null,
          payment_method:       payeePaymentMethod       || null,
          payment_instructions: payeeInstructions.trim() || null,
          quote_file_url:       payeeQuoteUrl            || null,
        });
      } catch { /* non-blocking */ }
    }

    setDraftSaveStatus("saved");
  };

  // ── Computed ──────────────────────────────────────────────────────────────

  const needsTotal = needItems.reduce((s, n) => s + n.qty * n.unit_cost_cents, 0);

  const stepLabel = ["Basics", "Athlete", "Story & Needs", "Photos & Video", "Thank-yous & Sponsors", "Review & Submit"][step - 1];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <PublicNavbar />

      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-5">
          <button onClick={() => step === 1 ? router.back() : handleBack()} className="text-sm text-[#1a5c2a] hover:underline mb-2 block">
            ← {step === 1 ? "Back to Sponsorships" : "Back"}
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create a Sponsorship Case</h1>
          <p className="text-sm text-gray-500 mt-1">Step {step} of {TOTAL_STEPS} — {stepLabel}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          {/* Escape hatch — shown only when resumed via ?case={id} */}
          {resumeId && (
            <div className="mb-4 text-right">
              <a href="/sponsorships/new?new=1" className="text-xs text-gray-400 hover:text-gray-600 underline">
                Start a new case instead
              </a>
            </div>
          )}

          <StepBar step={step} total={TOTAL_STEPS} />

          {/* Autosave indicator */}
          {draftId && step <= 3 && saveStatus !== "idle" && (
            <div className={`mb-3 text-xs font-medium flex items-center gap-1 ${
              saveStatus === "saved" ? "text-green-600"
              : saveStatus === "error" ? "text-red-500"
              : "text-gray-400"
            }`}>
              {saveStatus === "saving" && <Loader2 size={11} className="animate-spin" />}
              {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved ✓" : "⚠ Save failed — will retry when online"}
            </div>
          )}

          {topError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
              {topError}
            </div>
          )}

          {/* ── STEP 1 — Basics ────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-800 mb-4">
                  <strong>How it works:</strong> Fill in the details → after submitting, ask a coach, teacher, or community leader to vouch for the case → GRS reviews it → it goes live for sponsors.
                </div>
                <h2 className="font-semibold text-gray-900 mb-4">Case Basics</h2>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Title <span className="text-red-500">*</span></label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}
                  placeholder="e.g. Help Tinotenda reach the COSAFA Cup"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
                <div className="flex justify-between mt-0.5">
                  <FieldError msg={fieldErrors.title} />
                  <span className="text-xs text-gray-400 ml-auto">{title.length}/120</span>
                </div>
                {title.trim().length > 0 && title.trim().length <= 5 && (
                  <p className="text-xs text-amber-700 mt-0.5">Title must be at least 6 characters.</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Sport <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {SPORTS.map((s) => (
                    <button key={s} type="button" onClick={() => setSport(s)}
                      className={`py-2 px-2 rounded-lg border text-xs font-medium transition-colors ${sport === s ? "bg-[#1a5c2a] text-white border-[#1a5c2a]" : "bg-white text-gray-600 border-gray-300 hover:border-[#1a5c2a]"}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <FieldError msg={fieldErrors.sport} />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Category <span className="text-red-500">*</span></label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 bg-white">
                  <option value="">Select a category…</option>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <FieldError msg={fieldErrors.category} />
              </div>

              {isCoach && (
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Case type</label>
                  <div className="flex gap-2">
                    {(["player", "team"] as const).map((bt) => (
                      <button key={bt} type="button" onClick={() => setBeneficiaryType(bt)}
                        className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${beneficiaryType === bt ? "bg-[#1a5c2a] text-white border-[#1a5c2a]" : "bg-white text-gray-600 border-gray-300 hover:border-[#1a5c2a]"}`}>
                        {bt === "player" ? "Individual athlete" : "Team / Squad"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Guardian child picker — only shown when user has active guardian_links */}
              {guardianChildrenLoading && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Loader2 size={12} className="animate-spin" /> Loading your linked athletes…
                </div>
              )}
              {!guardianChildrenLoading && guardianChildren.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Which athlete is this case for? <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {guardianChildren.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => setSelectedChildId(child.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                          selectedChildId === child.id
                            ? "border-[#1a5c2a] bg-[#f0fdf4]"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                          {child.avatar_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={child.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold">
                              {child.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{child.name}</p>
                          {child.age_group && (
                            <p className="text-xs text-gray-400 capitalize">{child.age_group.replace(/_/g, " ")}</p>
                          )}
                        </div>
                        {selectedChildId === child.id && (
                          <CheckCircle2 size={16} className="text-[#1a5c2a] flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                  {!selectedChildId && (
                    <p className="text-xs text-red-500 mt-1">Please select which athlete this case is for.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2 — Athlete ───────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-semibold text-gray-900 mb-1">Athlete Details</h2>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Age Group <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  {AGE_GROUPS.map((ag) => (
                    <button key={ag.value} type="button" onClick={() => setAgeGroup(ag.value)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${ageGroup === ag.value ? "bg-[#1a5c2a] text-white border-[#1a5c2a]" : "bg-white text-gray-600 border-gray-300 hover:border-[#1a5c2a]"}`}>
                      {ag.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Province <span className="text-gray-400">(optional)</span></label>
                <input type="text" value={province} onChange={(e) => setProvince(e.target.value)}
                  placeholder="e.g. Harare, Bulawayo, Manicaland"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">One-line summary <span className="text-gray-400">(optional)</span></label>
                <input type="text" value={storyShort} onChange={(e) => setStoryShort(e.target.value)} maxLength={200}
                  placeholder="A short sentence to catch a sponsor's eye"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
                <div className="flex justify-between mt-0.5">
                  <span />
                  <span className="text-xs text-gray-400">{storyShort.length}/200</span>
                </div>
              </div>

              {isMinor && (
                <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-amber-800">Guardian Details Required</p>
                  <p className="text-xs text-amber-700">GRS requires a guardian&apos;s consent for athletes under 18. Their details are kept private.</p>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Guardian Full Name <span className="text-red-500">*</span></label>
                    <input type="text" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="e.g. Tendai Moyo"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Relationship <span className="text-gray-400">(optional)</span></label>
                    <input type="text" value={guardianRelationship} onChange={(e) => setGuardianRelationship(e.target.value)} placeholder="e.g. Parent, Aunt, Guardian"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Guardian WhatsApp <span className="text-red-500">*</span></label>
                    <input type="tel" value={guardianWhatsapp} onChange={(e) => setGuardianWhatsapp(e.target.value)} placeholder="e.g. 0771 234 567"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
                    <p className="text-xs text-gray-400 mt-0.5">GRS will contact the guardian to confirm consent before the case goes live.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3 — Story & Needs ─────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-semibold text-gray-900 mb-1">Story &amp; Needs</h2>

              {/* Story */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">The full story <span className="text-red-500">*</span></label>
                <textarea value={story} onChange={(e) => setStory(e.target.value)} maxLength={3000} rows={7}
                  placeholder="Tell the athlete's story in detail — who they are, what they need, and why a sponsor should connect."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
                <div className="flex justify-between mt-0.5">
                  <span />
                  <span className="text-xs text-gray-400">{story.length}/3000</span>
                </div>
              </div>

              {/* Itemised needs */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-700">Itemised needs <span className="text-gray-400 font-normal">(optional)</span></p>
                  <p className="text-xs text-gray-400 mt-0.5">List specific items — the total auto-sets the target amount. Add more from your case page later.</p>
                </div>

                {needItems.length > 0 && (
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-gray-500">Item</th>
                          <th className="text-right px-2 py-2 font-medium text-gray-500">Qty</th>
                          <th className="text-right px-2 py-2 font-medium text-gray-500">Total</th>
                          <th className="px-2 py-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {needItems.map((n) => (
                          <tr key={n.tempId} className={n.unit_cost_cents <= 0 ? "bg-amber-50" : ""}>
                            <td className="px-3 py-2 text-gray-800">{n.item}</td>
                            <td className="px-2 py-2 text-right text-gray-500">{n.qty}</td>
                            <td className="px-2 py-2 text-right font-medium">
                              {n.unit_cost_cents > 0 ? (
                                <span className="text-gray-900">{fmt(n.qty * n.unit_cost_cents)}</span>
                              ) : (
                                <input
                                  type="number" min={0.01} step={0.01} placeholder="$ unit"
                                  className="w-20 border border-amber-400 bg-amber-50 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                                  onBlur={(e) => {
                                    const uc = Math.round(parseFloat(e.target.value || "0") * 100);
                                    if (uc > 0) setNeedItems((p) => p.map((r) => r.tempId === n.tempId ? { ...r, unit_cost_cents: uc, needs_pricing: false } : r));
                                  }}
                                />
                              )}
                            </td>
                            <td className="px-2 py-2">
                              <button type="button" onClick={async () => {
                                if (n.id && draftId) {
                                  try { await api.delete(`/sponsorships/${draftId}/needs/${n.id}`); } catch { /* silent */ }
                                }
                                setNeedItems((p) => p.filter((r) => r.tempId !== n.tempId));
                              }} className="text-gray-300 hover:text-red-500">
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={2} className="px-3 py-2 text-xs font-semibold text-gray-500">Total</td>
                          <td className="px-2 py-2 text-right font-bold text-[#1a5c2a] text-xs">{fmt(needsTotal)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Add row */}
                <p className="text-xs text-gray-400">Add one item per row.</p>
                <div className="flex gap-2">
                  <input type="text" value={newNeedItem} onChange={(e) => setNewNeedItem(e.target.value)} placeholder="e.g. Football boots" maxLength={200}
                    className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
                  <input type="number" value={newNeedQty} onChange={(e) => setNewNeedQty(e.target.value)} min={1} max={9999} placeholder="Qty"
                    className="w-14 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 text-center" />
                  <input type="number" value={newNeedUsd} onChange={(e) => setNewNeedUsd(e.target.value)} min={0.01} step={0.01} placeholder="Unit $"
                    className={`w-20 border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 ${!newNeedUsd && newNeedItem.trim() ? "border-amber-400 bg-amber-50" : "border-gray-300"}`} />
                  <button type="button"
                    onClick={() => {
                      const uc = Math.round(parseFloat(newNeedUsd || "0") * 100);
                      if (!newNeedItem.trim() || uc <= 0) return;
                      // Comma-split: if item contains a comma, offer to split
                      const parts = newNeedItem.includes(",")
                        ? newNeedItem.split(",").map((s) => s.trim()).filter(Boolean)
                        : null;
                      if (parts && parts.length > 1) {
                        // Add each as a separate unpriced row (qty 1, cost 0) so user prices each
                        setNeedItems((p) => [...p, ...parts.map((part) => ({ tempId: `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`, item: part, qty: 1, unit_cost_cents: 0, needs_pricing: true }))]);
                      } else {
                        setNeedItems((p) => [...p, { tempId: `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`, item: newNeedItem.trim(), qty: parseInt(newNeedQty, 10) || 1, unit_cost_cents: uc }]);
                      }
                      setNewNeedItem(""); setNewNeedQty("1"); setNewNeedUsd("");
                    }}
                    disabled={!newNeedItem.trim() || (!newNeedUsd && !newNeedItem.includes(","))}
                    className="shrink-0 flex items-center gap-1 text-xs font-semibold text-white bg-[#1a5c2a] hover:bg-[#154a22] disabled:opacity-50 rounded-lg px-3 py-1.5 transition-colors">
                    <Plus size={12} /> {newNeedItem.includes(",") ? "Split & add" : "Add"}
                  </button>
                </div>
                {newNeedItem.includes(",") && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    Comma detected — clicking &ldquo;Split &amp; add&rdquo; will create one row per item. You&rsquo;ll need to price each row before continuing.
                  </p>
                )}
                {needItems.some((n) => n.unit_cost_cents <= 0) && (
                  <p className="text-xs text-amber-700">Some rows need a price before you can continue.</p>
                )}
              </div>

              {/* Deadline */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Deadline <span className="text-gray-400">(optional)</span></label>
                <input type="date" value={deadline} min={new Date().toISOString().split("T")[0]} onChange={(e) => setDeadline(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 bg-white" />
              </div>

              {/* How support is given */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-2">How support is given <span className="text-red-500">*</span></label>
                <div className="space-y-2">
                  {SUPPORT_METHODS.map((m) => (
                    <label key={m.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${supportMethod === m.value ? "border-[#1a5c2a] bg-[#f0fdf4]" : "border-gray-200 hover:border-gray-300"}`}>
                      <input type="radio" name="support_method" value={m.value} checked={supportMethod === m.value}
                        onChange={() => setSupportMethod(m.value)} className="accent-[#1a5c2a]" />
                      <span className="text-sm text-gray-800">{m.label}</span>
                    </label>
                  ))}
                </div>
                <SectionNote>
                  <strong>GRS never handles money.</strong> Sponsors give items or pay suppliers and institutions directly. Personal bank accounts cannot be used.
                </SectionNote>
              </div>

              {/* Payee details — contextual fields per method */}
              {supportMethod === "items_direct" && (
                <div className="space-y-3 border border-gray-100 rounded-xl p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-700">Drop-off details <span className="text-gray-400 font-normal">(optional)</span></p>
                  {MINOR_GROUPS.has(ageGroup) && (
                    <SectionNote>For minor athletes, do not share a home address. Use a school or community centre.</SectionNote>
                  )}
                  <input type="text" value={payeeName} onChange={(e) => setPayeeName(e.target.value)} placeholder="Drop-off location name (e.g. Harare Academy)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
                  <input type="text" value={payeeTown} onChange={(e) => setPayeeTown(e.target.value)} placeholder="Town / suburb"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
                  <input type="text" value={payeeContact} onChange={(e) => setPayeeContact(e.target.value)} placeholder="Contact person name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
                  <input type="text" value={payeePhone} onChange={(e) => setPayeePhone(e.target.value)} placeholder="Contact phone / WhatsApp"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
                </div>
              )}

              {supportMethod === "pay_supplier" && (
                <div className="space-y-3 border border-gray-100 rounded-xl p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-700">Supplier details</p>
                  <div>
                    <input type="text" value={payeeName} onChange={(e) => setPayeeName(e.target.value)} placeholder="Shop / supplier name *"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 ${!payeeName.trim() ? "border-amber-400" : "border-gray-300"}`} />
                    {!payeeName.trim() && <p className="text-xs text-amber-700 mt-0.5">Required for pay_supplier</p>}
                  </div>
                  <input type="text" value={payeeTown} onChange={(e) => setPayeeTown(e.target.value)} placeholder="Town"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Payment method</label>
                    <select value={payeePaymentMethod} onChange={(e) => setPayeePaymentMethod(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30">
                      <option value="">Select…</option>
                      <option value="ecocash">EcoCash</option>
                      <option value="bank">Bank transfer</option>
                      <option value="counter">Pay at counter</option>
                    </select>
                  </div>
                  <textarea value={payeeInstructions} onChange={(e) => setPayeeInstructions(e.target.value)} rows={3}
                    placeholder="Payment instructions (account numbers, reference, etc.) — no personal accounts"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 resize-none" />
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      Quote / invoice <span className="text-gray-400 font-normal">(required — upload before submitting)</span>
                    </label>
                    {payeeQuoteUrl ? (
                      <div className="flex items-center gap-2">
                        <a href={payeeQuoteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1a5c2a] underline truncate max-w-xs">View uploaded quote</a>
                        <button type="button" onClick={() => setPayeeQuoteUrl("")} className="text-xs text-red-500 hover:underline">Remove</button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !draftId) return;
                          setPayeeUploading(true);
                          try {
                            const form = new FormData();
                            form.append("file", file);
                            const r = await api.post(`/sponsorships/${draftId}/payee-details/upload-quote`, form, {
                              headers: { "Content-Type": "multipart/form-data" },
                            });
                            if (r.data?.url) setPayeeQuoteUrl(r.data.url);
                          } catch { setTopError("Quote upload failed. Please try again."); }
                          finally { setPayeeUploading(false); }
                        }} />
                        <span className={`flex items-center gap-1.5 text-xs font-medium border rounded-lg px-3 py-1.5 transition-colors ${payeeUploading ? "text-gray-400 border-gray-200" : "text-[#1a5c2a] border-[#1a5c2a] hover:bg-[#f0fdf4]"}`}>
                          {payeeUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                          {payeeUploading ? "Uploading…" : "Upload quote / invoice"}
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {supportMethod === "pay_institution" && (
                <div className="space-y-3 border border-gray-100 rounded-xl p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-700">Institution details</p>
                  <input type="text" value={payeeName} onChange={(e) => setPayeeName(e.target.value)} placeholder="Institution name (e.g. Harare Academy FC)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
                  <input type="text" value={payeeContact} onChange={(e) => setPayeeContact(e.target.value)} placeholder="Finance contact name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
                  <input type="text" value={payeePhone} onChange={(e) => setPayeePhone(e.target.value)} placeholder="Contact phone"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
                  <textarea value={payeeInstructions} onChange={(e) => setPayeeInstructions(e.target.value)} rows={3}
                    placeholder="Payment details (bank name, account number, branch) — no personal accounts"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 resize-none" />
                </div>
              )}

              {payeeSaving && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Loader2 size={11} className="animate-spin" /> Saving payment details…
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4 — Photos & Video ────────────────────────────────────── */}
          {step === 4 && draftId && (
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold text-gray-900 mb-1">Photos &amp; Video</h2>
                <p className="text-xs text-gray-500">Add a cover photo, more images, Arena videos, or YouTube links. A cover photo is required to continue.</p>
              </div>

              {!hasCover && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs font-medium">
                  Cover photo required — upload a photo and set it as cover using the ★ button.
                </div>
              )}
              {hasCover && (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 size={14} /> Cover photo set — you can continue.
                </div>
              )}

              <MediaManager
                caseId={draftId}
                token={token}
                onCoverChange={setHasCover}
              />
            </div>
          )}

          {/* ── STEP 5 — Thank-yous & Sponsors (optional) ─────────────────── */}
          {step === 5 && draftId && (
            <div className="space-y-6">
              <div>
                <h2 className="font-semibold text-gray-900 mb-1">Thank-yous &amp; Sponsor Packages</h2>
                <p className="text-xs text-gray-500">Optional — add recognition tiers to thank sponsors, and packages they can choose from. You can also do this from your case page later.</p>
              </div>

              {/* Sponsor Packages */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-700">Sponsor Packages <span className="text-gray-400 font-normal">(up to 3)</span></p>
                {pkgLoading ? (
                  <div className="flex items-center gap-2 text-xs text-gray-400"><Loader2 size={12} className="animate-spin" /> Loading…</div>
                ) : (
                  <>
                    {packages.map((pkg) => (
                      <div key={pkg.id} className="flex items-start justify-between gap-3 border border-gray-200 rounded-xl px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">{pkg.name}</p>
                          {pkg.suggested_value_cents != null && <p className="text-xs text-[#1a5c2a] font-medium mt-0.5">Suggested: ${(pkg.suggested_value_cents / 100).toFixed(0)}</p>}
                          {pkg.description && <p className="text-xs text-gray-500 mt-0.5">{pkg.description}</p>}
                        </div>
                        <button onClick={() => deletePackage(pkg.id)} className="text-xs text-red-500 hover:text-red-700 shrink-0">Remove</button>
                      </div>
                    ))}
                    {packages.length < 3 && (
                      <div className="border border-dashed border-gray-300 rounded-xl p-3 space-y-2">
                        <input type="text" value={newPkgName} onChange={(e) => setNewPkgName(e.target.value)} placeholder="Package name (e.g. Kit Sponsor)" maxLength={100}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
                        <div className="flex gap-2">
                          <input type="number" value={newPkgValue} onChange={(e) => setNewPkgValue(e.target.value)} placeholder="Suggested $ (optional)"
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
                        </div>
                        <input type="text" value={newPkgDesc} onChange={(e) => setNewPkgDesc(e.target.value)} placeholder="Description (optional)" maxLength={500}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
                        <button onClick={addPackage} disabled={pkgSaving || !newPkgName.trim()}
                          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#1a5c2a] hover:bg-[#154a22] disabled:opacity-50 rounded-lg px-4 py-2 transition-colors">
                          {pkgSaving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add Package
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Recognition Tiers */}
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-700">Recognition Tiers <span className="text-gray-400 font-normal">(optional — thank-you levels for sponsors)</span></p>
                {tiersLoading ? (
                  <div className="flex items-center gap-2 text-xs text-gray-400"><Loader2 size={12} className="animate-spin" /> Loading…</div>
                ) : (
                  <>
                    {tiers.map((tier) => (
                      <div key={tier.id} className="flex items-start justify-between gap-3 border border-gray-200 rounded-xl px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">{tier.title}</p>
                          <p className="text-xs text-[#1a5c2a] font-medium mt-0.5">From ${(tier.min_value_cents / 100).toFixed(0)}</p>
                          {tier.description && <p className="text-xs text-gray-500 mt-0.5">{tier.description}</p>}
                          {tier.quantity_limit != null && <p className="text-xs text-gray-400">{tier.quantity_limit} available</p>}
                        </div>
                        <button onClick={() => deleteTier(tier.id)} className="text-xs text-red-500 hover:text-red-700 shrink-0">Remove</button>
                      </div>
                    ))}
                    <div className="border border-dashed border-gray-300 rounded-xl p-3 space-y-2">
                      <input type="text" value={newTierTitle} onChange={(e) => setNewTierTitle(e.target.value)} placeholder="Tier name (e.g. Gold Supporter)" maxLength={100}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                          <input type="number" value={newTierMin} onChange={(e) => setNewTierMin(e.target.value)} placeholder="Min value"
                            className="w-full border border-gray-300 rounded-lg pl-6 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
                        </div>
                      </div>
                      <input type="text" value={newTierDesc} onChange={(e) => setNewTierDesc(e.target.value)} placeholder="What the sponsor receives (optional)" maxLength={500}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30" />
                      <button onClick={addTier} disabled={tierSaving || !newTierTitle.trim() || !newTierMin}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#1a5c2a] hover:bg-[#154a22] disabled:opacity-50 rounded-lg px-4 py-2 transition-colors">
                        {tierSaving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add Tier
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 6 — Review & Submit ───────────────────────────────────── */}
          {step === 6 && draftId && (
            <div className="space-y-5">
              <h2 className="font-semibold text-gray-900 mb-1">Review &amp; Submit</h2>
              <p className="text-xs text-gray-500">Your draft is saved. Check the eligibility list below, then go to your case page to request a vouch and submit for review.</p>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Title</span>
                  <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sport</span>
                  <span className="font-medium text-gray-900 capitalize">{sport}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Category</span>
                  <span className="font-medium text-gray-900 capitalize">{category.replace(/_/g, " ")}</span>
                </div>
                {ageGroup && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Age Group</span>
                    <span className="font-medium text-gray-900">{AGE_GROUPS.find((a) => a.value === ageGroup)?.label}</span>
                  </div>
                )}
                {needsTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Target</span>
                    <span className="font-medium text-[#1a5c2a]">{fmt(needsTotal)}</span>
                  </div>
                )}
                {supportMethod && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Support via</span>
                    <span className="font-medium text-gray-900 text-right max-w-[55%]">{SUPPORT_METHODS.find((m) => m.value === supportMethod)?.label}</span>
                  </div>
                )}
                {hasCover && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cover photo</span>
                    <span className="font-medium text-green-700 flex items-center gap-1"><CheckCircle2 size={12} /> Set</span>
                  </div>
                )}
              </div>

              {/* Live eligibility checklist */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Eligibility — what&apos;s needed to go live</p>
                <EligibilityChecklist caseId={draftId} token={token ?? ""} />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
                <strong>What happens next:</strong> Your case is saved as a draft. To go live, ask a coach, teacher, school head, or community leader to vouch for it — or GRS can verify directly. GRS reviews it before it appears for sponsors.
              </div>
            </div>
          )}

          {/* ── Navigation ─────────────────────────────────────────────────── */}
          <div className="mt-6 space-y-3">
            {/* Save-draft feedback */}
            {draftSaveStatus === "saved" && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm text-center">
                Saved ✓ — you can close this page and continue later
              </div>
            )}
            {draftSaveStatus === "error" && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3">
                <span>{draftSaveError ?? "Save failed. Please try again."}</span>
                <button
                  onClick={handleSaveDraft}
                  className="shrink-0 text-xs font-semibold underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
            )}

            <div className="flex gap-3">
              {step > 1 && (
                <button onClick={handleBack}
                  className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  Back
                </button>
              )}

              {/* Save draft — available on every step except the final review */}
              {step < TOTAL_STEPS && (
                <button
                  onClick={handleSaveDraft}
                  disabled={draftSaveStatus === "saving" || creating || saving}
                  className="border border-[#1a5c2a] text-[#1a5c2a] text-sm font-medium py-2.5 px-4 rounded-xl hover:bg-[#1a5c2a]/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-1 whitespace-nowrap"
                >
                  {draftSaveStatus === "saving"
                    ? <><Loader2 size={13} className="animate-spin" /> Saving…</>
                    : "Save draft"}
                </button>
              )}

              <button
                onClick={handleContinue}
                disabled={!canContinue() || creating || saving}
                className="flex-1 bg-[#1a5c2a] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#145222] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {(creating || saving) && <Loader2 size={14} className="animate-spin" />}
                {step === TOTAL_STEPS ? "Save & Go to My Case" : step === 1 ? "Create Draft & Continue" : "Save & Continue"}
              </button>
            </div>
          </div>
        </div>

        {/* Strong case tip — always visible */}
        <div className="mt-4">
          <StrongCaseTip />
        </div>

        {/* Build stamp */}
        {process.env.NEXT_PUBLIC_GIT_COMMIT && (
          <p className="mt-4 text-center text-[10px] text-gray-300 select-none">
            build {process.env.NEXT_PUBLIC_GIT_COMMIT.slice(0, 7)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function NewSponsorshipWizard() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <div className="max-w-xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
            <div className="h-32 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>
    }>
      <NewSponsorshipWizardInner />
    </Suspense>
  );
}
