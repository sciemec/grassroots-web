"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2, Camera } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

const POSITIONS = [
  "Goalkeeper", "Right Back", "Left Back", "Centre Back",
  "Defensive Midfielder", "Central Midfielder", "Attacking Midfielder",
  "Right Winger", "Left Winger", "Centre Forward", "Striker",
];

const PROVINCES = [
  "Harare", "Bulawayo", "Manicaland", "Mashonaland Central",
  "Mashonaland East", "Mashonaland West", "Masvingo",
  "Matabeleland North", "Matabeleland South", "Midlands",
];

const AGE_GROUPS = ["u13", "u17", "u20", "senior"];

const PREFERRED_FEET = ["right", "left", "both"];

const schema = z.object({
  position: z.string().min(1, "Position required"),
  province: z.string().min(1, "Province required"),
  age_group: z.string().min(1, "Age group required"),
  preferred_foot: z.string().optional(),
  height_cm: z.string().optional(),
  weight_kg: z.string().optional(),
  bio: z.string().max(500).optional(),
});
type FormData = z.infer<typeof schema>;

interface Profile extends FormData {
  scout_visible: boolean;
  verification_status: string;
}

export default function PlayerProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    api.get("/profile")
      .then((res) => {
        setProfile(res.data);
        reset({
          position: res.data.position ?? "",
          province: res.data.province ?? "",
          age_group: res.data.age_group ?? "",
          preferred_foot: res.data.preferred_foot ?? "",
          height_cm: res.data.height_cm ?? "",
          weight_kg: res.data.weight_kg ?? "",
          bio: res.data.bio ?? "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, router, reset]);

  const onSubmit = async (data: FormData) => {
    setError("");
    setSaved(false);
    try {
      const res = await api.patch("/profile", data);
      setProfile(res.data);
      reset(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Failed to save. Please try again.");
    }
  };

  const toggleVisibility = async () => {
    setTogglingVisibility(true);
    try {
      const res = await api.post("/profile/scout-visibility");
      setProfile((p) => p ? { ...p, scout_visible: res.data.scout_visible } : p);
    } catch {
      setError("Failed to update scout visibility.");
    } finally {
      setTogglingVisibility(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-8 flex items-center gap-3">
            <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Player Profile</h1>
              <p className="text-sm text-muted-foreground">Manage your public profile and scout visibility</p>
            </div>
          </div>

          {/* Avatar + verification badge */}
          <div className="mb-8 flex items-center gap-5">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <User className="h-10 w-10 text-muted-foreground" />
              </div>
              <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div>
              <p className="text-lg font-bold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-1 flex items-center gap-2">
                {profile?.verification_status === "approved" ? (
                  <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-700">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                ) : (
                  <Link
                    href="/player/verification"
                    className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-500/20 transition-colors"
                  >
                    Pending verification →
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Scout visibility toggle */}
          <div className="mb-8 flex items-center justify-between rounded-xl border p-5">
            <div className="flex items-center gap-3">
              {profile?.scout_visible ? (
                <Eye className="h-5 w-5 text-green-500" />
              ) : (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Scout visibility</p>
                <p className="text-xs text-muted-foreground">
                  {profile?.scout_visible
                    ? "Scouts can find your profile in searches"
                    : "Your profile is hidden from scout searches"}
                </p>
              </div>
            </div>
            <button
              onClick={toggleVisibility}
              disabled={togglingVisibility}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                profile?.scout_visible ? "bg-green-500" : "bg-muted"
              }`}
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                profile?.scout_visible ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Position</label>
                <select
                  {...register("position")}
                  className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select position…</option>
                  {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.position && <p className="mt-1 text-xs text-destructive">{errors.position.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Province</label>
                <select
                  {...register("province")}
                  className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select province…</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.province && <p className="mt-1 text-xs text-destructive">{errors.province.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Age Group</label>
                <select
                  {...register("age_group")}
                  className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring uppercase"
                >
                  <option value="">Select…</option>
                  {AGE_GROUPS.map((ag) => <option key={ag} value={ag}>{ag.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Preferred Foot</label>
                <select
                  {...register("preferred_foot")}
                  className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm capitalize outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select…</option>
                  {PREFERRED_FEET.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Height (cm)</label>
                <input
                  {...register("height_cm")}
                  type="number"
                  placeholder="175"
                  className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Bio <span className="font-normal text-muted-foreground">(optional, max 500 chars)</span>
              </label>
              <textarea
                {...register("bio")}
                rows={4}
                placeholder="Tell scouts about yourself — your strengths, ambitions, teams you've played for…"
                className="w-full resize-none rounded-xl border bg-card px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              />
              {errors.bio && <p className="mt-1 text-xs text-destructive">{errors.bio.message}</p>}
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {saved && (
              <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" /> Profile saved successfully
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </span>
              ) : "Save profile"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
