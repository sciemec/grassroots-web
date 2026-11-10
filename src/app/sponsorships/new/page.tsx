"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import PublicNavbar from "@/components/layout/public-navbar";

const SPORTS = [
  "Football", "Rugby", "Athletics", "Netball",
  "Basketball", "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey",
];

const CATEGORIES = [
  { value: "kit_and_equipment", label: "Kit & Equipment" },
  { value: "tournament_fees", label: "Tournament Fees" },
  { value: "training_camp", label: "Training Camp" },
  { value: "coaching_fees", label: "Coaching Fees" },
  { value: "transport", label: "Transport" },
  { value: "academic_support", label: "Academic Support" },
  { value: "medical", label: "Medical / Physio" },
  { value: "other", label: "Other" },
];

const AGE_GROUPS = ["under_13", "13_17", "18_plus"];

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

export default function NewSponsorshipPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("");
  const [category, setCategory] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [province, setProvince] = useState("");
  const [storyShort, setStoryShort] = useState("");
  const [story, setStory] = useState("");
  const [suggestedPayee, setSuggestedPayee] = useState("");

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) router.replace("/login");
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user) return null;

  const canNext = () => {
    if (step === 1) return title.trim().length > 5 && sport && category;
    if (step === 2) return ageGroup.trim() !== "";
    if (step === 3) return story.trim().length > 20;
    return true;
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);

    const base = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

    try {
      const res = await fetch(`${base}/sponsorships`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          sport: sport.toLowerCase(),
          category,
          age_group: ageGroup,
          province: province.trim() || undefined,
          story_short: storyShort.trim() || undefined,
          story: story.trim(),
          suggested_payee: suggestedPayee.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? (json.errors ? Object.values(json.errors as Record<string, string[]>).flat().join(". ") : "Could not submit case."));
        return;
      }

      const caseId = (json.data ?? json).id;
      router.push(`/sponsorships/${caseId}?submitted=1`);
    } catch {
      setError("Network error. Please try again.");
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
            GRS will review your case before it goes live. Step {step} of 4.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <StepIndicator step={step} total={4} />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
              {error}
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
                <div className="text-xs text-gray-400 text-right mt-0.5">{title.length}/120</div>
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
                      key={ag}
                      type="button"
                      onClick={() => setAgeGroup(ag)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors capitalize ${
                        ageGroup === ag
                          ? "bg-[#1a5c2a] text-white border-[#1a5c2a]"
                          : "bg-white text-gray-600 border-gray-300 hover:border-[#1a5c2a]"
                      }`}
                    >
                      {ag.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
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
                <div className="text-xs text-gray-400 text-right mt-0.5">{storyShort.length}/200</div>
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
                <div className="text-xs text-gray-400 text-right mt-0.5">{story.length}/3000</div>
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
              </div>
            </div>
          )}

          {/* STEP 4 — Review */}
          {step === 4 && (
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
                  <span className="font-medium text-gray-900 capitalize">{ageGroup.replace(/_/g, " ")}</span>
                </div>
                {province && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Province</span>
                    <span className="font-medium text-gray-900">{province}</span>
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
            {step < 4 ? (
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
