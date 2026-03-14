"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import api from "@/lib/api";
import { Loader2, CheckCircle2, Save, Shield } from "lucide-react";

const PROVINCES = [
  "Harare","Bulawayo","Manicaland","Mashonaland Central",
  "Mashonaland East","Mashonaland West","Masvingo",
  "Matabeleland North","Matabeleland South","Midlands",
];
const SPORTS = ["Football","Rugby","Netball","Basketball","Cricket","Athletics","Swimming","Tennis","Volleyball","Hockey"];
const EXP_OPTIONS = ["0–2 years","3–5 years","6–10 years","10+ years"];

interface ScoutProfile {
  name: string;
  email: string;
  phone: string;
  organisation: string;
  accreditation_number: string;
  experience: string;
  sport: string;
  scouting_regions: string[];
  bio: string;
}

export default function ScoutProfilePage() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [regions, setRegions] = useState<string[]>([]);

  const { data, isLoading } = useQuery<ScoutProfile>({
    queryKey: ["scout-profile"],
    queryFn: async () => {
      const res = await api.get("/profile");
      return res.data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ScoutProfile>();

  useEffect(() => {
    if (data) {
      reset(data);
      setRegions(data.scouting_regions ?? []);
    }
  }, [data, reset]);

  const toggleRegion = (province: string) => {
    setRegions((prev) =>
      prev.includes(province) ? prev.filter((r) => r !== province) : [...prev, province]
    );
  };

  const save = useMutation({
    mutationFn: (form: ScoutProfile) =>
      api.patch("/profile", { ...form, scouting_regions: regions }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scout-profile"] });
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
          <h1 className="text-2xl font-bold">Scout Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your scouting credentials and regions</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 rounded-xl bg-green-500/10 px-4 py-2 text-sm font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4" /> Saved successfully
          </div>
        )}
      </div>

      {/* Approval notice */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
        <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-400" />
        <div>
          <p className="text-sm font-medium text-purple-300">ZIFA-approved account</p>
          <p className="text-xs text-purple-400 mt-0.5">
            Changes to your accreditation number require re-approval. All other updates take effect immediately.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => save.mutate(d))} className="max-w-2xl space-y-6">
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
              <input
                {...register("email")}
                type="email"
                className={`${inputCls} cursor-not-allowed bg-muted/30`}
                readOnly
              />
              <p className="mt-1 text-xs text-muted-foreground">Contact support to change your email.</p>
            </div>
          </div>
        </div>

        {/* Professional */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Scouting Credentials</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Organisation / Club</label>
              <input {...register("organisation")} className={inputCls} placeholder="e.g. ZIFA Talent ID" />
            </div>
            <div>
              <label className={labelCls}>Accreditation number</label>
              <input {...register("accreditation_number")} className={inputCls} placeholder="e.g. ZIFA-SC-2024-001" />
            </div>
            <div>
              <label className={labelCls}>Sport focus</label>
              <select {...register("sport")} className={inputCls}>
                {SPORTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Experience</label>
              <select {...register("experience")} className={inputCls}>
                <option value="">Select…</option>
                {EXP_OPTIONS.map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Bio / Scouting focus</label>
              <textarea
                {...register("bio")}
                rows={3}
                maxLength={500}
                placeholder="Describe your scouting methodology and player criteria…"
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>
        </div>

        {/* Regions */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-1 text-sm font-semibold">Scouting Regions</h2>
          <p className="mb-4 text-xs text-muted-foreground">Select all provinces you actively scout in</p>
          <div className="flex flex-wrap gap-2">
            {PROVINCES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => toggleRegion(p)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  regions.includes(p)
                    ? "border-purple-500 bg-purple-500/20 text-purple-300"
                    : "border-border text-muted-foreground hover:border-purple-500/50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          {regions.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">No regions selected — you won&apos;t appear in regional searches.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={save.isPending || (!isDirty && regions === (data?.scouting_regions ?? []))}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {save.isPending ? "Saving…" : "Save changes"}
        </button>

        {save.isError && <p className="text-sm text-destructive">Failed to save. Please try again.</p>}
      </form>
    </DashboardLayout>
  );
}
