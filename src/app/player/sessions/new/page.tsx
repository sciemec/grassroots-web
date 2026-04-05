"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dumbbell, ArrowLeft, Play, Loader2, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { PoseCamera } from "@/components/video/pose-camera";
import { useGuestGate } from "@/components/ui/register-modal";
import api from "@/lib/api";

const FOCUS_AREAS = [
  "dribbling", "shooting", "passing", "defending",
  "goalkeeping", "fitness", "heading", "crossing",
  "set-pieces", "tactics", "agility", "strength",
];

const schema = z.object({
  focus_area: z.string().min(1, "Pick a focus area"),
  session_type: z.enum(["programme", "custom"]),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function NewSessionPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const { requireAuth } = useGuestGate();
  const [error, setError] = useState("");
  const [poseOpen, setPoseOpen] = useState(false);
  const [poseScore, setPoseScore] = useState<number | null>(null);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { session_type: "custom", focus_area: "" },
  });

  const sessionType = watch("session_type");
  const focusArea = watch("focus_area");

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) return; // guests allowed — form visible, submit requires auth
  }, [_hasHydrated, user, router]);

  const onSubmit = async (data: FormData) => {
    if (!user) { requireAuth("start a session"); return; }
    setError("");
    try {
      const payload = poseScore !== null ? { ...data, pre_session_pose_score: poseScore } : data;
      const res = await api.post("/sessions", payload);
      const sessionId = res.data?.session?.id ?? res.data?.id ?? res.data?.data?.id;

      // Fire THUTO reflection prompt — fire-and-forget, never blocks navigation
      api.post("/thuto/reflect", { session_summary: `${data.focus_area} session` })
        .then((r) => {
          const question = r.data?.answer;
          if (question) {
            localStorage.setItem("thuto_preload_message", question);
            const prev = parseInt(localStorage.getItem("thuto_unread_count") ?? "0", 10);
            localStorage.setItem("thuto_unread_count", String(prev + 1));
          }
        })
        .catch(() => {}); // never surface to player

      if (sessionId) {
        router.push(`/sessions/${sessionId}`);
      } else {
        router.push("/player/sessions");
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Failed to create session. Please try again.");
    }
  };

  if (!_hasHydrated) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-xl">
          {/* Header */}
          <div className="mb-8 flex items-center gap-3">
            <Link href="/player/sessions" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Start New Session</h1>
              <p className="text-sm text-muted-foreground">What are you working on today?</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Session type */}
            <div>
              <label className="mb-3 block text-sm font-semibold">Session Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "custom", label: "Free Training", desc: "Choose any drills you want" },
                  { value: "programme", label: "Programme", desc: "Follow your assigned programme" },
                ].map(({ value, label, desc }) => (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      sessionType === value
                        ? "border-primary bg-primary/5"
                        : "bg-card hover:bg-muted/40"
                    }`}
                  >
                    <input {...register("session_type")} type="radio" value={value} className="sr-only" />
                    <p className="font-medium">{label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* Focus area */}
            <div>
              <label className="mb-3 block text-sm font-semibold">Focus Area</label>
              <div className="flex flex-wrap gap-2">
                {FOCUS_AREAS.map((area) => (
                  <label
                    key={area}
                    className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                      focusArea === area
                        ? "bg-primary text-primary-foreground"
                        : "border bg-card hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <input {...register("focus_area")} type="radio" value={area} className="sr-only" />
                    {area}
                  </label>
                ))}
              </div>
              {errors.focus_area && (
                <p className="mt-2 text-xs text-destructive">{errors.focus_area.message}</p>
              )}
            </div>

            {/* Pre-session notes */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold">
                Pre-session notes <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                {...register("notes")}
                rows={3}
                placeholder="e.g. Feeling a bit tired today, focused on right foot crossing…"
                className="w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground resize-none"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Summary card */}
            {focusArea && (
              <div className="rounded-xl border bg-muted/40 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium capitalize">{sessionType} session · {focusArea}</p>
                    <p className="text-xs text-muted-foreground">Ready to start · AI Coach will analyse your performance</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pose camera — pre-session form check */}
            <div className="rounded-2xl border border-white/10 bg-card/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setPoseOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold text-white">Check my form before starting</span>
                  {poseScore !== null && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${poseScore >= 75 ? "bg-green-500/20 text-green-400" : poseScore >= 50 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                      {poseScore}%
                    </span>
                  )}
                </div>
                {poseOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {poseOpen && (
                <div className="border-t border-white/10">
                  <PoseCamera
                    focusArea={focusArea || undefined}
                    onScore={(score) => setPoseScore(score)}
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !focusArea}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating session…</>
              ) : (
                <><Play className="h-4 w-4" /> Start Session</>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
