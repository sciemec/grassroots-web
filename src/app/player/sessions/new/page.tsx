"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dumbbell, ArrowLeft, Play, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

const FOCUS_AREAS = [
  "dribbling", "shooting", "passing", "defending",
  "goalkeeping", "fitness", "heading", "crossing",
  "set-pieces", "tactics", "agility", "strength",
];

const schema = z.object({
  focus_area: z.string().min(1, "Pick a focus area"),
  session_type: z.enum(["programme", "free"]),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function NewSessionPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [error, setError] = useState("");

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { session_type: "free", focus_area: "" },
  });

  const sessionType = watch("session_type");
  const focusArea = watch("focus_area");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
  }, [user, router]);

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      const res = await api.post("/sessions", data);
      const sessionId = res.data?.id ?? res.data?.data?.id;
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

  if (!user) return null;

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
                  { value: "free", label: "Free Training", desc: "Choose any drills you want" },
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
