"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";
import { CheckCircle2, Loader2 } from "lucide-react";

const POINTS = [
  {
    heading: "GRS never holds money",
    body: "GRS facilitates introductions only. All support goes directly from the sponsor to the named payee (supplier, school, or institution). No cash passes through GRS.",
  },
  {
    heading: "Flat-fee introductions — no escrow",
    body: "GRS charges a flat connection fee where applicable. We do not take a percentage of any support amount, and we do not hold funds on behalf of either party.",
  },
  {
    heading: "Your payee details stay private",
    body: "Payment details are only shared with an accepted sponsor after the introduction is confirmed. They are never shown publicly on your case page.",
  },
  {
    heading: "Sponsors deal directly with the payee",
    body: "Once introduced, the sponsor pays the named shop, school, or institution directly. You are responsible for providing accurate payee details.",
  },
  {
    heading: "Be honest and accurate",
    body: "Submitting false or misleading information — including inflated needs, fake vouchers, or incorrect payee details — will result in your case being removed and your account suspended.",
  },
];

export default function FinancialLiteracyPage() {
  const router      = useRouter();
  const params      = useParams<{ id: string }>();
  const caseId      = params?.id;
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);

  const [agreed,    setAgreed]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  if (!hasHydrated) return null;
  if (!user) {
    if (typeof window !== "undefined") router.replace("/login");
    return null;
  }

  const handleSubmit = async () => {
    if (!agreed || !caseId || !token) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/sponsorships/${caseId}/fl`);
      router.replace(`/account/cases/${caseId}?submitted=1`);
    } catch {
      setError("Could not save your acknowledgement. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <Link href={`/account/cases/${caseId}`} className="text-sm text-[#1a5c2a] hover:underline">
            ← Back to my case
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 py-8 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">How GRS Sponsorship Works</h1>
          <p className="text-sm text-gray-500 mt-1">
            Before your case can go live, please read and acknowledge the five points below.
          </p>
        </div>

        <div className="space-y-4">
          {POINTS.map((p, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 flex gap-4">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1a5c2a] text-white flex items-center justify-center text-xs font-bold mt-0.5">
                {i + 1}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 text-sm mb-1">{p.heading}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{p.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Acknowledgement */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 rounded border-gray-300 text-[#1a5c2a] focus:ring-[#1a5c2a]/30"
            />
            <span className="text-sm text-gray-700 leading-relaxed">
              I have read and understood how GRS sponsorship works. I confirm that the information
              in my case is accurate, and I agree to provide correct payee details so that any
              support reaches the right recipient.
            </span>
          </label>

          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!agreed || submitting}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-[#1a5c2a] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#145222] transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <><Loader2 size={15} className="animate-spin" /> Saving…</>
            ) : (
              <><CheckCircle2 size={15} /> I understand — continue</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
