"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, Suspense } from "react";
import { ArrowLeft, BookOpen, Clock, Dumbbell, ChevronDown } from "lucide-react";
import { getRoleConfig, type StaffRoleConfig } from "@/config/coaching-staff";
import { useAuthStore } from "@/lib/auth-store";

const SPORTS = [
  "Football", "Rugby", "Netball", "Athletics", "Basketball",
  "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey",
];

function NewPlanForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roleId = searchParams?.get("role") ?? "";
  const role: StaffRoleConfig | null = roleId ? getRoleConfig(roleId) : null;

  const token = useAuthStore((s) => s.token);

  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("Football");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Plan title is required."); return; }
    setError("");
    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        sport,
        description: description.trim() || null,
        duration: duration ? parseInt(duration, 10) : null,
      };
      if (roleId) body.coaching_role = roleId;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/coach/training-plans`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? `Error ${res.status}`);
      }

      // Redirect back to the role workspace or the plans list
      if (roleId) {
        router.push(`/coach/technical-staff/${roleId}`);
      } else {
        router.push("/coach/training-plans");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const backHref = roleId
    ? `/coach/technical-staff/${roleId}`
    : "/coach/training-plans";

  const backLabel = role ? role.title + " Desk" : "Training Plans";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Sticky nav */}
      <nav className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            {backLabel}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-900">New Training Plan</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Role badge */}
        {role && (
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-[12px] font-semibold mb-6 bg-gradient-to-r ${role.gradient}`}
          >
            <BookOpen size={12} />
            Deploying to {role.title} Desk
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Green header accent */}
          <div className="h-1.5 w-full" style={{ backgroundColor: "#1a5c2a" }} />

          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-1">New Training Plan</h1>
            <p className="text-gray-500 text-[14px] mb-6">
              {role
                ? `This plan will be tagged to the ${role.title} desk and visible in that workspace.`
                : "Create a training plan for your squad."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Plan Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Pre-season Fitness Block, Set-piece Attacking Corners"
                  maxLength={255}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ "--tw-ring-color": "#1a5c2a" } as React.CSSProperties}
                  disabled={submitting}
                />
              </div>

              {/* Sport */}
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Sport
                </label>
                <div className="relative">
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] text-gray-900 bg-white focus:outline-none focus:ring-2 focus:border-transparent pr-9 transition-all"
                    style={{ "--tw-ring-color": "#1a5c2a" } as React.CSSProperties}
                    disabled={submitting}
                  >
                    {SPORTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Duration (minutes)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 90"
                    min={1}
                    max={300}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent pr-9 transition-all"
                    style={{ "--tw-ring-color": "#1a5c2a" } as React.CSSProperties}
                    disabled={submitting}
                  />
                  <Clock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Description
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline the goals, key drills, and focus areas for this plan…"
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent resize-none transition-all"
                  style={{ "--tw-ring-color": "#1a5c2a" } as React.CSSProperties}
                  disabled={submitting}
                />
              </div>

              {/* Focus categories hint */}
              {role && role.focusCategories.length > 0 && (
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                  <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Dumbbell size={11} />
                    {role.title} Focus Areas
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {role.focusCategories.map((cat) => (
                      <span
                        key={cat}
                        className="text-[12px] px-2.5 py-0.5 rounded-full border border-gray-200 text-gray-600 bg-white"
                      >
                        {cat.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-[13px] text-red-500 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: submitting || !title.trim() ? "#9ca3af" : "#1a5c2a" }}
                >
                  {submitting ? "Creating…" : "Create Plan"}
                </button>
                <Link
                  href={backHref}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewTrainingPlanPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}
          className="flex items-center justify-center"
        >
          <div className="w-8 h-8 border-2 border-gray-300 border-t-green-700 rounded-full animate-spin" />
        </div>
      }
    >
      <NewPlanForm />
    </Suspense>
  );
}
