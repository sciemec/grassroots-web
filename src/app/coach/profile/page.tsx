"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import api from "@/lib/api";
import { Loader2, CheckCircle2, Save } from "lucide-react";
import { useState } from "react";

const PROVINCES = [
  "Harare","Bulawayo","Manicaland","Mashonaland Central",
  "Mashonaland East","Mashonaland West","Masvingo",
  "Matabeleland North","Matabeleland South","Midlands",
];
const SPORTS = ["Football","Rugby","Netball","Basketball","Cricket","Athletics","Swimming","Tennis","Volleyball","Hockey"];
const LEVELS = ["Grassroots","Amateur","Semi-Professional","Professional","Elite/National"];

interface CoachProfile {
  name: string;
  email: string;
  phone: string;
  province: string;
  team_name: string;
  sport: string;
  coaching_level: string;
  experience_years: number;
  bio: string;
}

export default function CoachProfilePage() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery<CoachProfile>({
    queryKey: ["coach-profile"],
    queryFn: async () => {
      const res = await api.get("/profile");
      return res.data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<CoachProfile>();

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const save = useMutation({
    mutationFn: (form: CoachProfile) => api.patch("/profile", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coach-profile"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const inputCls = "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring";
  const labelCls = "mb-1 block text-xs font-medium text-muted-foreground";

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Coach Profile</h1>
          <p className="text-sm text-muted-foreground">Update your coaching details and preferences</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 rounded-xl bg-green-500/10 px-4 py-2 text-sm font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4" /> Saved successfully
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-6 max-w-2xl">
        {/* Personal */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Personal Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Full name</label>
              <input {...register("name", { required: true })} className={inputCls} />
              {errors.name && <p className="mt-1 text-xs text-destructive">Required</p>}
            </div>
            <div>
              <label className={labelCls}>Phone number</label>
              <input {...register("phone")} className={inputCls} placeholder="+263 7…" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Email address</label>
              <input {...register("email")} type="email" className={`${inputCls} bg-muted/30 cursor-not-allowed`} readOnly />
              <p className="mt-1 text-xs text-muted-foreground">Contact support to change your email.</p>
            </div>
            <div>
              <label className={labelCls}>Province</label>
              <select {...register("province")} className={inputCls}>
                <option value="">Select province…</option>
                {PROVINCES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Professional */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Professional Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Team / Club name</label>
              <input {...register("team_name")} className={inputCls} placeholder="e.g. Harare City FC" />
            </div>
            <div>
              <label className={labelCls}>Sport</label>
              <select {...register("sport")} className={inputCls}>
                {SPORTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Coaching level</label>
              <select {...register("coaching_level")} className={inputCls}>
                <option value="">Select level…</option>
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Years of experience</label>
              <input
                {...register("experience_years", { min: 0, max: 50 })}
                type="number"
                min={0}
                max={50}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Bio / About</label>
              <textarea
                {...register("bio")}
                rows={4}
                maxLength={500}
                placeholder="Tell scouts and players about your coaching philosophy…"
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={save.isPending || !isDirty}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {save.isPending ? "Saving…" : "Save changes"}
        </button>

        {save.isError && (
          <p className="text-sm text-destructive">Failed to save. Please try again.</p>
        )}
      </form>
    </DashboardLayout>
  );
}
