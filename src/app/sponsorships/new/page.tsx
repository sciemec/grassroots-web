"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { PublicNavbar } from "@/components/layout/public-navbar";

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

const MINOR_AGE_GROUPS = new Set(["under_13", "13_17"]);

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1.5 rounded-full flex-1 transition-colors"
          style={{ backgroundColor: i < step ? "#1a5c2a" : "#e5e7eb" }}
        />
      ))}
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-600 mt-0.5">{msg}</p>;
}

export default function NewSponsorshipPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form fields
  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("");
  const [category, setCategory] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [province, setProvince] = useState("");
  const [storyShort, setStoryShort] = useState("");
  const [story, setStory] = useState("");
  const [suggestedPayee, setSuggestedPayee] = useState("");

  // Guardian step (shown when age_group is under_13 or 13_17)
  const [guardianName, setGuardianName] = useState("");
  const [guardianRelationship, setGuardianRelationship] = useState("");
  const [guardianWhatsapp, setGuardianWhatsapp] = useState("");

  const isMinor = MINOR_AGE_GROUPS.has(ageGroup);
  const totalSteps = isMinor ? 5 : 4;

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) router.replace("/login");
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user) return null;

  const fieldErr = (field: string) => fieldErrors[field];

  const canNext = () => {
    if (step === 1) return title.trim().length > 5 && sport && category;
    if (step === 2) return ageGroup.trim() !== "";
    if (step === 3) return story.trim().length > 20;
    if (step === 4 && isMinor) return guardianName.trim().length > 1 && guardianWhatsapp.trim().length > 7;
    return true;
  };

  // Map API field names → step numbers so we can jump to the failing step
  const FIELD_TO_STEP: Record<string, number> = {
    title: 1, sport: 1, category: 1,
    age_group: 2, province: 2, story_short: 2,
    story: 3, suggested_payee: 3,
    guardian_name: isMinor ? 4 : 3,
    guardian_relationship: isMinor ? 4 : 3,
    guardian_whatsapp: isMinor ? 4 : 3,
  };

  const submit = async () => {
    setSubmitting(true);
    setTopError(null);
    setFieldErrors({});

    const base = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

    const body: Record<string, string | boolean | undefined> = {
      title: title.trim(),
      sport: sport.toLowerCase(),
      category,
      age_group: ageGroup || undefined,
      province: province.trim() || undefined,
      story_short: storyShort.trim() || undefined,
      story: story.trim(),
      suggested_payee: suggestedPayee.trim() || undefined,
      beneficiary_type: "player",
    };

    if (isMinor) {
      body.guardian_name = guardianName.trim() || undefined;
      body.guardian_relationship = guardianRelationship.trim() || undefined;
      body.guardian_whatsapp = guardianWhatsapp.trim() || undefined;
      body.is_minor_beneficiary = true;
    }

    try {
      const res = await fetch(`${base}/sponsorships`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 422 && json.errors) {
          // Per-field validation errors
          const errs: Record<string, string> = {};
          for (const [field, messages] of Object.entries(json.errors as Record<string, string[]>)) {
            errs[field] = messages[0];
          }
          setFieldErrors(errs);

          // Jump to the earliest step with an error
          const failStep = Math.min(
            ...Object.keys(errs)
              .map((f) => FIELD_TO_STEP[f] ?? 99)
              .filter((n) => n !== 99)
          );
          if (Number.isFinite(failStep)) setStep(failStep);
          else setTopError(json.message ?? "Validation failed. Check your answers.");
        } else {
          setTopError(json.message ?? "Could not submit case. Please try again.");
        }
        return;
      }

      const caseId = (json.data ?? json).id;
      router.push(`/sponsorships/${caseId}?submitted=1`);
    } catch {
      setTopError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <PublicNavbar />

      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/sponsorships" className="text-sm text-[#1a5c2a] hover:underline mb-3 block">
            ← Back to Sponsorships
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Submit a Sponsorship Case</h1>
          <p className="text-sm text-gray-500 mt-1">
            GRS will review your case before it goes live. Step {step} of {totalSteps}.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <StepIndicator step={step} total={totalSteps} />

          {topError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
              {topError}
            </div>
          )}

          {/* STEP 1 — Basics */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-3">Case Basics</h2>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Case Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. Help Tinotenda reach the COSAFA Cup"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
                />
                <div className="flex justify-between items-center mt-0.5">
                  <FieldError msg={fieldErr("title")} />
                  <span className="text-xs text-gray-400 ml-auto">{title.length}/120</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Sport <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {SPORTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSport(s)}
                      className={`py-2 px-2 rounded-lg border text-xs font-medium transition-colors ${
                        sport === s
                          ? "bg-[#1a5c2a] text-white border-[#1a5c2a]"
                          : "bg-white text-gray-600 border-gray-300 hover:border-[#1a5c2a]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <FieldError msg={fieldErr("sport")} />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Category <span className="text-red-500">*</span></label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 bg-white"
                >
                  <option value="">Select a category…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <FieldError msg={fieldErr("category")} />
              </div>
            </div>
          )}

          {/* STEP 2 — Athlete details */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-3">Athlete Details</h2>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Age Group <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  {AGE_GROUPS.map((ag) => (
                    <button
                      key={ag.value}
                      type="button"
                      onClick={() => setAgeGroup(ag.value)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${
                        ageGroup === ag.value
                          ? "bg-[#1a5c2a] text-white border-[#1a5c2a]"
                          : "bg-white text-gray-600 border-gray-300 hover:border-[#1a5c2a]"
                      }`}
                    >
                      {ag.label}
                    </button>
                  ))}
                </div>
                <FieldError msg={fieldErr("age_group")} />
                {MINOR_AGE_GROUPS.has(ageGroup) && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                    You will need to provide a guardian's details on the next step — required for under-18 cases.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Province <span className="text-gray-400">(optional)</span></label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="e.g. Harare, Bulawayo, Manicaland"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
                />
                <FieldError msg={fieldErr("province")} />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  One-line summary <span className="text-gray-400">(optional — shown on browse cards)</span>
                </label>
                <input
                  type="text"
                  value={storyShort}
                  onChange={(e) => setStoryShort(e.target.value)}
                  maxLength={200}
                  placeholder="A short sentence to catch a sponsor's eye"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
                />
                <div className="flex justify-between items-center mt-0.5">
                  <FieldError msg={fieldErr("story_short")} />
                  <span className="text-xs text-gray-400 ml-auto">{storyShort.length}/200</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Full story */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-1">The Full Story</h2>
              <p className="text-xs text-gray-500 mb-3">
                Explain who the athlete is, what they need, and why a sponsor should connect.
                Be honest and specific — the best cases tell a real story.
              </p>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Story <span className="text-red-500">*</span></label>
                <textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  maxLength={3000}
                  rows={8}
                  placeholder="Tell the athlete's story in detail…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
                />
                <div className="flex justify-between items-center mt-0.5">
                  <FieldError msg={fieldErr("story")} />
                  <span className="text-xs text-gray-400 ml-auto">{story.length}/3000</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Suggested support / payee <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={suggestedPayee}
                  onChange={(e) => setSuggestedPayee(e.target.value)}
                  maxLength={300}
                  placeholder="e.g. Equipment donated directly to Zimbabwe Athletics Association on athlete's behalf"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
                />
                <FieldError msg={fieldErr("suggested_payee")} />
              </div>
            </div>
          )}

          {/* STEP 4 — Guardian details (minors only) */}
          {step === 4 && isMinor && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-1">Guardian Details</h2>
              <p className="text-xs text-gray-500 mb-3">
                GRS requires a guardian's consent for cases involving athletes under 18. Their name will not be shown publicly.
              </p>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Guardian Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="e.g. Tendai Moyo"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
                />
                <FieldError msg={fieldErr("guardian_name")} />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Relationship to Athlete <span className="text-gray-400">(optional)</span></label>
                <input
                  type="text"
                  value={guardianRelationship}
                  onChange={(e) => setGuardianRelationship(e.target.value)}
                  placeholder="e.g. Parent, Aunt, Guardian"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
                />
                <FieldError msg={fieldErr("guardian_relationship")} />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Guardian WhatsApp Number <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={guardianWhatsapp}
                  onChange={(e) => setGuardianWhatsapp(e.target.value)}
                  placeholder="e.g. 0771 234 567"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
                />
                <p className="text-xs text-gray-400 mt-0.5">GRS will contact the guardian to confirm consent before the case goes live.</p>
                <FieldError msg={fieldErr("guardian_whatsapp")} />
              </div>
            </div>
          )}

          {/* STEP 4 (non-minor) or STEP 5 (minor) — Review */}
          {((step === 4 && !isMinor) || (step === 5 && isMinor)) && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-3">Review & Submit</h2>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Title</span>
                  <span className="font-medium text-gray-900 text-right max-w-[60%]">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sport</span>
                  <span className="font-medium text-gray-900 capitalize">{sport}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Category</span>
                  <span className="font-medium text-gray-900 capitalize">{category.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Age Group</span>
                  <span className="font-medium text-gray-900">
                    {AGE_GROUPS.find((ag) => ag.value === ageGroup)?.label ?? ageGroup}
                  </span>
                </div>
                {province && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Province</span>
                    <span className="font-medium text-gray-900">{province}</span>
                  </div>
                )}
                {isMinor && guardianName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Guardian</span>
                    <span className="font-medium text-gray-900">{guardianName}</span>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
                <strong>What happens next:</strong> Your case will be saved as a draft. To go live, you will need a voucher — a coach or verified organisation who can confirm this case. GRS will then review it before it appears publicly.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
            {step < totalSteps ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
                className="flex-1 bg-[#1a5c2a] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#145222] transition-colors disabled:opacity-50"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={submitting}
                className="flex-1 bg-[#1a5c2a] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#145222] transition-colors disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit Case"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
