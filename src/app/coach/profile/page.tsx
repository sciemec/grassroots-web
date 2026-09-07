"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import api from "@/lib/api";
import { Loader2, CheckCircle2, Save, ShieldCheck, ShieldAlert, Clock, Upload } from "lucide-react";

const BADGE_TYPES = ["CAF A", "CAF B", "CAF C", "CAF D", "UEFA B", "COSAFA", "ZIFA Grassroots"];

const PROVINCES = [
  "Harare","Bulawayo","Manicaland","Mashonaland Central",
  "Mashonaland East","Mashonaland West","Masvingo",
  "Matabeleland North","Matabeleland South","Midlands",
];
const SPORTS = ["Football","Rugby","Netball","Basketball","Cricket","Athletics","Swimming","Tennis","Volleyball","Hockey"];
const LEVELS = ["Grassroots","Amateur","Semi-Professional","Professional","Elite/National"];

interface VerificationStatus {
  is_verified: boolean;
  verification_badge: string | null;
  request: {
    id: string;
    status: "pending" | "approved" | "rejected";
    badge_type: string;
    badge_number: string;
    admin_notes: string | null;
    created_at: string;
  } | null;
}

interface VerificationForm {
  badge_type: string;
  badge_number: string;
  document_url: string;
}

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
  const [verifSubmitted, setVerifSubmitted] = useState(false);

  const { data, isLoading } = useQuery<CoachProfile>({
    queryKey: ["coach-profile"],
    queryFn: async () => {
      const res = await api.get("/profile");
      return res.data;
    },
  });

  const { data: verifData, isLoading: verifLoading } = useQuery<VerificationStatus>({
    queryKey: ["coach-verification"],
    queryFn: async () => {
      const res = await api.get("/coach/verification/status");
      return res.data;
    },
  });

  const { register: regVerif, handleSubmit: handleVerif, formState: { errors: verifErrors } } = useForm<VerificationForm>();

  const submitVerif = useMutation({
    mutationFn: (form: VerificationForm) => api.post("/coach/verification/submit", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coach-verification"] });
      setVerifSubmitted(true);
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

      {/* ── Coach Credential Verification ── */}
      <div className="max-w-2xl mt-8">
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Coaching Credential Verification</h2>
          <p className="text-sm text-muted-foreground">
            Submit your coaching badge for verification. Verified coaches unlock the Position radar on player public profiles.
          </p>
        </div>

        {verifLoading ? (
          <div className="rounded-xl border bg-card p-5 animate-pulse h-32" />
        ) : verifData?.is_verified ? (
          /* APPROVED */
          <div className="rounded-xl border border-teal-500/40 bg-teal-500/10 p-5 flex items-start gap-4">
            <ShieldCheck className="h-6 w-6 text-teal-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-teal-400">Verified Coach</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Your <span className="font-medium text-foreground">{verifData.verification_badge}</span> credentials have been verified.
                Your profile now shows a Verified Coach badge on player profiles.
              </p>
            </div>
          </div>
        ) : verifData?.request?.status === "pending" ? (
          /* PENDING */
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 flex items-start gap-4">
            <Clock className="h-6 w-6 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-400">Under Review</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Your <span className="font-medium text-foreground">{verifData.request.badge_type}</span> verification request
                was submitted and is being reviewed by the GRS admin team. You will receive a notification when it is processed.
              </p>
            </div>
          </div>
        ) : verifData?.request?.status === "rejected" ? (
          /* REJECTED — show reason + resubmit form */
          <div className="space-y-4">
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-5 flex items-start gap-4">
              <ShieldAlert className="h-6 w-6 text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-red-400">Verification Not Approved</p>
                {verifData.request.admin_notes && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Reason: {verifData.request.admin_notes}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-1">Please resubmit with the correct documentation.</p>
              </div>
            </div>
            <VerificationForm
              regVerif={regVerif}
              handleVerif={handleVerif}
              submitVerif={submitVerif}
              verifErrors={verifErrors}
              verifSubmitted={verifSubmitted}
              inputCls={inputCls}
              labelCls={labelCls}
            />
          </div>
        ) : (
          /* NOT YET SUBMITTED */
          <VerificationForm
            regVerif={regVerif}
            handleVerif={handleVerif}
            submitVerif={submitVerif}
            verifErrors={verifErrors}
            verifSubmitted={verifSubmitted}
            inputCls={inputCls}
            labelCls={labelCls}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function VerificationForm({
  regVerif,
  handleVerif,
  submitVerif,
  verifErrors,
  verifSubmitted,
  inputCls,
  labelCls,
}: {
  regVerif: ReturnType<typeof useForm<VerificationForm>>["register"];
  handleVerif: ReturnType<typeof useForm<VerificationForm>>["handleSubmit"];
  submitVerif: ReturnType<typeof useMutation<unknown, unknown, VerificationForm>>;
  verifErrors: ReturnType<typeof useForm<VerificationForm>>["formState"]["errors"];
  verifSubmitted: boolean;
  inputCls: string;
  labelCls: string;
}) {
  if (verifSubmitted) {
    return (
      <div className="rounded-xl border border-teal-500/40 bg-teal-500/10 p-5 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-teal-400" />
        <p className="text-sm font-medium text-teal-400">Verification request submitted. The admin team will review it shortly.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleVerif((d) => submitVerif.mutate(d))}
      className="rounded-xl border bg-card p-5 space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Badge type *</label>
          <select
            {...regVerif("badge_type", { required: true })}
            className={inputCls}
          >
            <option value="">Select badge…</option>
            {BADGE_TYPES.map((b) => <option key={b}>{b}</option>)}
          </select>
          {verifErrors.badge_type && <p className="mt-1 text-xs text-destructive">Required</p>}
        </div>
        <div>
          <label className={labelCls}>Badge / licence number *</label>
          <input
            {...regVerif("badge_number", { required: true })}
            className={inputCls}
            placeholder="e.g. CAF-2024-001234"
          />
          {verifErrors.badge_number && <p className="mt-1 text-xs text-destructive">Required</p>}
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Document URL (optional)</label>
          <input
            {...regVerif("document_url")}
            className={inputCls}
            placeholder="Link to your certificate (Google Drive, Dropbox, etc.)"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Upload your certificate to Google Drive or Dropbox and paste the share link here.
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitVerif.isPending}
        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitVerif.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {submitVerif.isPending ? "Submitting…" : "Submit for verification"}
      </button>

      {submitVerif.isError && (
        <p className="text-sm text-destructive">
          {(submitVerif.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to submit. Please try again."}
        </p>
      )}
    </form>
  );
}
