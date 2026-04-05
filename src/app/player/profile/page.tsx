"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Eye, EyeOff, ArrowLeft, CheckCircle2, Camera, Loader2, ExternalLink, Brain, Sparkles } from "lucide-react";
import { QRProfileCard } from "@/components/ui/qr-profile-card";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { SportSelector } from "@/components/sports/sport-selector";
import { SPORT_MAP, SportKey } from "@/config/sports";
import api from "@/lib/api";
import { queryAI } from "@/lib/ai-query";

// ── Player similarity lookup ──────────────────────────────────────────────────
const PLAYER_SIMILARITIES: Record<string, Record<string, string[]>> = {
  football: {
    "centre forward":        ["Knowledge Musona (youth)", "Nyasha Mushekwi"],
    "striker":               ["Khama Billiat (early career)", "Knowledge Musona"],
    "right winger":          ["Khama Billiat", "Tino Kadewere (youth)"],
    "left winger":           ["Tino Kadewere", "Khama Billiat"],
    "attacking midfielder":  ["Marvelous Nakamba (youth)", "Devon Chafa"],
    "central midfielder":    ["Marvelous Nakamba", "Marshal Munetsi"],
    "defensive midfielder":  ["Teenage Hadebe (youth)", "Takudzwa Chimwemwe"],
    "centre back":           ["Teenage Hadebe", "Hardlife Zvirekwi"],
    "right back":            ["Method Mwanjali", "Ronald Pfumbidzai"],
    "left back":             ["Alec Mudimu", "Ronald Pfumbidzai"],
    "goalkeeper":            ["Talbert Shumba", "Edmore Sibanda"],
  },
  netball: {
    "goal shooter":  ["Perpetua Mujuru (NASH)", "Tendai Mhlanga"],
    "goal keeper":   ["Chipo Tsomondo", "Faith Mwale"],
    "centre":        ["Joyce Dhliwayo", "Rumbidzai Chitima"],
  },
};

function getComparisons(position: string, sport: string): string[] {
  const sportMap = PLAYER_SIMILARITIES[sport.toLowerCase()] ?? {};
  return sportMap[position.toLowerCase()] ?? [];
}

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
  sport:          z.string().optional(),
  position:       z.string().min(1, "Position required"),
  province:       z.string().min(1, "Province required"),
  age_group:      z.string().min(1, "Age group required"),
  preferred_foot: z.string().optional(),
  height_cm:      z.string().optional(),
  weight_kg:      z.string().optional(),
  club:           z.string().optional(),
  school:         z.string().optional(),
  bio:            z.string().max(500).optional(),
});
type FormData = z.infer<typeof schema>;

interface Profile extends FormData {
  scout_visible:       boolean;
  verification_status: string;
  photo_url:           string | null;
  leadership_score:    number;
  joy_score?:          number;
}

function calcCompletion(profile: Profile | null, data: Partial<FormData>): { count: number; total: number; pct: number } {
  const fields = [
    data.sport, data.position, data.province, data.age_group,
    data.preferred_foot, data.height_cm, data.weight_kg,
    data.club || data.school, data.bio,
  ];
  const total = fields.length;
  const count = fields.filter(Boolean).length;
  return { count, total, pct: Math.round((count / total) * 100) };
}

export default function PlayerProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile]           = useState<Profile | null>(null);
  const [loading, setLoading]           = useState(true);
  const [saved, setSaved]               = useState(false);
  const [error, setError]               = useState("");
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [aiNarrative, setAiNarrative]           = useState("");
  const [generatingNarrative, setGeneratingNarrative] = useState(false);
  const [selectedSport, setSelectedSport] = useState<SportKey>("football");
  const [photoUrl, setPhotoUrl]         = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const watchedValues = watch();

  useEffect(() => {
    if (!user) return; // guests see the form with empty/default values
    api.get("/profile")
      .then((res) => {
        setProfile(res.data);
        setPhotoUrl(res.data.photo_url ?? null);
        if (res.data.sport) setSelectedSport(res.data.sport as SportKey);
        reset({
          sport:          res.data.sport          ?? "football",
          position:       res.data.position       ?? "",
          province:       res.data.province       ?? "",
          age_group:      res.data.age_group      ?? "",
          preferred_foot: res.data.preferred_foot ?? "",
          height_cm:      res.data.height_cm      ?? "",
          weight_kg:      res.data.weight_kg      ?? "",
          club:           res.data.club           ?? "",
          school:         res.data.school         ?? "",
          bio:            res.data.bio            ?? "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, reset]);

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

  const generateNarrative = async () => {
    if (!profile) return;
    setGeneratingNarrative(true);
    try {
      // Fetch Ubuntu stats alongside narrative generation
      const ubuntuRes    = await api.get("/ubuntu/connections").catch(() => null);
      const partnerCount = ((ubuntuRes?.data?.data ?? []) as unknown[]).length;
      const sessionsLed  = (ubuntuRes?.data?.sessions_led ?? 0) as number;
      const leaderScore  = profile.leadership_score ?? 0;

      const ubuntuFlair = leaderScore > 0
        ? ` This player has a leadership score of ${leaderScore} on the Ubuntu Network.` +
          ` They have ${partnerCount} training partner${partnerCount !== 1 ? "s" : ""}` +
          ` and have led ${sessionsLed} group session${sessionsLed !== 1 ? "s" : ""}.` +
          ` Include one sentence about their community leadership and what it says about` +
          ` their character as a professional. Frame it as a strength scouts value.`
        : "";

      const joyFlair = (profile.joy_score ?? 0) > 0
        ? ` This player has a Beautiful Game Score of ${profile.joy_score}/100, reflecting ${profile.joy_score} joyful training experiences logged on the platform. Include one sentence about their evident passion for the game and what that character trait means at professional level.`
        : "";

      const prompt = `Generate a 3-sentence professional scouting profile narrative (third person) for this player:
Name: ${user?.name}, Sport: ${profile.sport}, Position: ${profile.position},
Province: ${profile.province}, Age group: ${profile.age_group},
Club/School: ${profile.club || profile.school || "unattached"}.
Write like a FIFA scout. Be professional and positive. No bullet points.${ubuntuFlair}${joyFlair}`;

      const reply = await queryAI(prompt, "scout");
      setAiNarrative(reply);
      api.patch("/profile", { ai_narrative: reply }).catch(() => {});
    } catch {
      setAiNarrative("Unable to generate narrative. Please try again.");
    } finally {
      setGeneratingNarrative(false);
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

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5MB.");
      return;
    }
    setUploadingPhoto(true);
    const preview = URL.createObjectURL(file);
    setPhotoUrl(preview);
    const formData = new FormData();
    formData.append("photo", file);
    try {
      const res = await api.post("/profile/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPhotoUrl(res.data.photo_url ?? preview);
    } catch {
      setError("Photo upload failed. Please try again.");
      setPhotoUrl(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
            <div className="flex items-center gap-5">
              <div className="h-20 w-20 animate-pulse rounded-full bg-muted" />
              <div className="space-y-2">
                <div className="h-5 w-32 animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-48 animate-pulse rounded-lg bg-muted" />
              </div>
            </div>
            <div className="h-4 animate-pulse rounded-full bg-muted" />
            <div className="h-16 animate-pulse rounded-xl bg-muted" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 animate-pulse rounded-lg bg-muted" />
              <div className="h-12 animate-pulse rounded-lg bg-muted" />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}
            </div>
            <div className="h-28 animate-pulse rounded-xl bg-muted" />
            <div className="h-11 animate-pulse rounded-xl bg-muted" />
          </div>
        </main>
      </div>
    );
  }

  const { count, total, pct } = calcCompletion(profile, watchedValues);

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
          <div className="mb-6 flex items-center gap-5">
            <div className="relative">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={user?.name ?? "Player"}
                  className="h-20 w-20 rounded-full object-cover border-2 border-primary/30"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <User className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
                title="Upload profile photo"
              >
                {uploadingPhoto
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Camera className="h-3.5 w-3.5" />
                }
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="sr-only"
              />
            </div>
            <div>
              <p className="text-lg font-bold">{user?.name ?? "Your Profile"}</p>
              <p className="text-sm text-muted-foreground">{user?.email ?? "Sign in to save your profile"}</p>
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
                    Get verified →
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Profile completion progress bar */}
          <div className="mb-8 rounded-xl border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">Profile completion</p>
              <p className="text-sm font-bold text-primary">{count}/{total} fields · {pct}%</p>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            {pct < 100 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Complete your profile to improve your chances of being discovered by scouts.
              </p>
            )}
            {pct === 100 && (
              <p className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Profile complete — scouts can see everything about you!
              </p>
            )}
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
              className={`relative h-6 w-11 rounded-full transition-colors ${profile?.scout_visible ? "bg-green-500" : "bg-muted"}`}
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${profile?.scout_visible ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Primary sport */}
            <div>
              <label className="mb-2 block text-sm font-medium">Primary sport</label>
              <SportSelector
                value={selectedSport}
                onChange={(v) => {
                  setSelectedSport(v as SportKey);
                  reset((prev) => ({ ...prev, sport: v as string, position: "" }));
                }}
                size="sm"
              />
            </div>

            {/* Position + Province */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Position</label>
                <select
                  {...register("position")}
                  className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select position…</option>
                  {(SPORT_MAP[selectedSport]?.positions ?? POSITIONS).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
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

            {/* Age Group + Preferred Foot + Height + Weight */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
              <div>
                <label className="mb-1.5 block text-sm font-medium">Weight (kg)</label>
                <input
                  {...register("weight_kg")}
                  type="number"
                  placeholder="70"
                  className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {/* Club + School */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Club <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <input
                  {...register("club")}
                  type="text"
                  placeholder="e.g. Dynamos FC"
                  className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  School <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <input
                  {...register("school")}
                  type="text"
                  placeholder="e.g. Prince Edward High"
                  className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Bio */}
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

          {/* QR Profile Card — only shown to logged-in users */}
          {user && (
            <div className="mt-6 mb-6">
              <QRProfileCard
                playerId={String(user.id)}
                playerName={user.name}
                ageGroup={profile?.age_group ?? user.age_group}
                province={profile?.province ?? user.province}
                selfieUrl={photoUrl ?? undefined}
              />
            </div>
          )}

          {/* View as Scout button */}
          <Link
            href="/player/profile/scout-view"
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[#f0b429]/30 bg-[#f0b429]/5 py-3 text-sm font-semibold text-[#f0b429] transition-colors hover:bg-[#f0b429]/10"
          >
            <Eye className="h-4 w-4" /> View as Scout
            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
          </Link>

          {/* AI Profile Narrative */}
          <div className="mb-6 rounded-2xl border border-white/10 bg-card/60 p-5 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4 text-[#f0b429]" />
              <h3 className="font-semibold text-white">AI Scout Narrative</h3>
            </div>
            {aiNarrative ? (
              <>
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{aiNarrative}</p>
                <button
                  onClick={generateNarrative}
                  disabled={generatingNarrative}
                  className="text-xs text-accent hover:text-white transition-colors"
                >
                  {generatingNarrative ? "Regenerating…" : "↻ Regenerate"}
                </button>
              </>
            ) : (
              <>
                <p className="mb-3 text-sm text-muted-foreground">
                  Generate a 3-sentence professional scouting profile — written by AI, based on your position and club. Shown to scouts on your public profile.
                </p>
                <button
                  onClick={generateNarrative}
                  disabled={generatingNarrative || !profile?.position}
                  className="flex items-center gap-2 rounded-xl bg-[#f0b429] px-4 py-2 text-xs font-semibold text-[#1a3a1a] transition-colors hover:bg-[#f5c542] disabled:opacity-40"
                >
                  {generatingNarrative ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
                  ) : (
                    <><Sparkles className="h-3.5 w-3.5" /> Generate narrative</>
                  )}
                </button>
                {!profile?.position && (
                  <p className="mt-2 text-xs text-muted-foreground">Complete your position above first</p>
                )}
              </>
            )}
          </div>

          {/* Plays Like... */}
          {(() => {
            const comparisons = getComparisons(profile?.position ?? "", profile?.sport ?? "football");
            if (!comparisons.length) return null;
            return (
              <div className="mb-8 rounded-2xl border border-white/10 bg-card/60 p-5 backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#f0b429]" />
                  <h3 className="font-semibold text-white">Plays Like…</h3>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Based on your position and sport, scouts may compare you to:
                </p>
                <div className="flex flex-wrap gap-2">
                  {comparisons.map((name) => (
                    <span
                      key={name}
                      className="rounded-full border border-[#f0b429]/30 bg-[#f0b429]/10 px-3 py-1.5 text-xs font-medium text-[#f0b429]"
                    >
                      {name}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground italic">
                  Comparisons are based on playing style and position — not performance level.
                </p>
              </div>
            );
          })()}

        </div>
      </main>
    </div>
  );
}
