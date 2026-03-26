"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SPORT_MAP, SportKey } from "@/config/sports";
import { ChevronRight, ChevronLeft, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";
import api from "@/lib/api";
import { extractApiError } from "@/lib/api-error";

const PROVINCES = [
  "Harare","Bulawayo","Manicaland","Mashonaland Central",
  "Mashonaland East","Mashonaland West","Masvingo",
  "Matabeleland North","Matabeleland South","Midlands",
];
const STEPS = ["Personal", "Account", "Professional", "Confirm"];

interface Form {
  first_name: string; surname: string; phone: string; province: string;
  email: string; password: string; confirm_password: string;
  organisation: string; accreditation_no: string; experience_years: string; scouting_regions: string[];
  terms: boolean;
}
const INIT: Form = {
  first_name: "", surname: "", phone: "", province: "",
  email: "", password: "", confirm_password: "",
  organisation: "", accreditation_no: "", experience_years: "", scouting_regions: [],
  terms: false,
};

function ScoutRegisterForm() {
  const router  = useRouter();
  const searchParams = useSearchParams();
  const sportParam = (searchParams.get("sport") ?? "football") as SportKey;
  const sportCfg = SPORT_MAP[sportParam] ?? SPORT_MAP["football"];
  const [step, setStep]     = useState(1);
  const [form, setForm]     = useState<Form>(INIT);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [showCfm, setShowCfm] = useState(false);

  const set = (k: keyof Form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const toggleRegion = (region: string) => {
    setForm((f) => ({
      ...f,
      scouting_regions: f.scouting_regions.includes(region)
        ? f.scouting_regions.filter((r) => r !== region)
        : [...f.scouting_regions, region],
    }));
  };

  const validate = (): string => {
    if (step === 1) {
      if (!form.first_name.trim()) return "First name is required";
      if (!form.surname.trim())    return "Surname is required";
      if (!form.phone.trim())      return "Phone number is required";
      if (!form.province)          return "Please select your province";
    }
    if (step === 2) {
      if (!form.email.includes("@"))               return "Valid email address required";
      if (form.password.length < 8)                return "Password must be at least 8 characters";
      if (form.password !== form.confirm_password) return "Passwords don't match";
    }
    if (step === 3) {
      if (!form.organisation.trim()) return "Organisation or club name is required";
      if (!form.experience_years)    return "Years of experience is required";
    }
    if (step === 4 && !form.terms) return "You must accept the terms to continue";
    return "";
  };

  const handleNext = () => {
    const err = validate();
    if (err) { setError(err); return; }
    if (step < 4) { setError(""); setStep((s) => s + 1); return; }
    submit();
  };

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      try {
        await createUserWithEmailAndPassword(auth, form.email.trim().toLowerCase(), form.password);
      } catch (fbErr: unknown) {
        const fbCode = (fbErr as { code?: string })?.code ?? "";
        if (fbCode === "auth/email-already-in-use") {
          setError("User already exists. Please sign in");
          setLoading(false);
          return;
        }
      }

      await api.post("/auth/register", {
        role: "scout", first_name: form.first_name, surname: form.surname,
        email: form.email, phone: form.phone,
        password: form.password, password_confirmation: form.confirm_password,
        province: form.province, organisation: form.organisation,
        accreditation_no: form.accreditation_no,
        experience_years: form.experience_years,
        scouting_regions: form.scouting_regions,
      });
      router.push("/login?registered=1");
    } catch (e: unknown) {
      setError(extractApiError(e, "Registration failed. Please try again."));
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-purple-300/50 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400";
  const selectCls = "w-full rounded-lg border border-white/20 bg-purple-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400";

  return (
    <div className="flex min-h-screen items-start justify-center bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-900 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/register" className="flex items-center gap-1.5 text-sm text-purple-400 hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" /> All roles
          </Link>
          <Link href="/" className="flex items-center gap-2 text-white">
            <span className="text-2xl">{sportCfg.emoji}</span>
            <span className="font-bold">Grassroots Sport</span>
          </Link>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-purple-500 text-2xl shadow-lg">
            {sportCfg.emoji}
          </div>
          <div>
            <h1 className="text-xl font-black text-white">{sportCfg.label} — Scout Registration</h1>
            <p className="text-xs text-purple-300">{sportCfg.governingBody} · Professional account · AI report generation included</p>
          </div>
        </div>

        {/* Step pills */}
        <div className="mb-4 flex gap-1.5">
          {STEPS.map((label, i) => {
            const n = i + 1;
            return (
              <div key={n} className={`flex-1 rounded-full py-1.5 text-center text-xs font-semibold transition-all ${n < step ? "bg-purple-500 text-white" : n === step ? "bg-white text-purple-900" : "bg-white/10 text-white/40"}`}>
                {n < step ? "✓" : label}
              </div>
            );
          })}
        </div>
        <div className="mb-6 h-1 w-full rounded-full bg-white/10">
          <div className="h-full rounded-full bg-purple-500 transition-all duration-300" style={{ width: `${((step - 1) / 3) * 100}%` }} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">

          {step === 1 && (
            <div className="space-y-4">
              <div><h2 className="text-xl font-bold text-white">Personal information</h2><p className="text-sm text-purple-300">Your contact details</p></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-purple-200">First name</label>
                  <input type="text" placeholder="Farai" value={form.first_name} onChange={(e) => set("first_name", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-purple-200">Surname</label>
                  <input type="text" placeholder="Chikosha" value={form.surname} onChange={(e) => set("surname", e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-purple-200">Phone number</label>
                <input type="tel" placeholder="+263 77 123 4567" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-purple-200">Province (base of operations)</label>
                <select value={form.province} onChange={(e) => set("province", e.target.value)} className={selectCls}>
                  <option value="">Select your province…</option>
                  {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div><h2 className="text-xl font-bold text-white">Account credentials</h2><p className="text-sm text-purple-300">Used to sign in to your scout hub</p></div>
              <div>
                <label className="mb-1 block text-xs font-medium text-purple-200">Email address</label>
                <input type="email" placeholder="scout@organisation.co.zw" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-purple-200">Password (min 8 characters)</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={(e) => set("password", e.target.value)} className={`${inputCls} pr-10`} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400/70 hover:text-purple-300 transition-colors">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-purple-200">Confirm password</label>
                <div className="relative">
                  <input type={showCfm ? "text" : "password"} placeholder="••••••••" value={form.confirm_password} onChange={(e) => set("confirm_password", e.target.value)}
                    className={`${inputCls} pr-10 ${form.confirm_password && form.password !== form.confirm_password ? "border-red-400" : ""}`} />
                  <button type="button" onClick={() => setShowCfm(!showCfm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400/70 hover:text-purple-300 transition-colors">
                    {showCfm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.confirm_password && form.password !== form.confirm_password && (
                  <p className="mt-1 text-xs text-red-300">Passwords don&apos;t match</p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div><h2 className="text-xl font-bold text-white">Professional details</h2><p className="text-sm text-purple-300">Your scouting background</p></div>
              <div>
                <label className="mb-1 block text-xs font-medium text-purple-200">Organisation / Club</label>
                <input type="text" placeholder="ZIFA, Highlanders FC, Independent…" value={form.organisation} onChange={(e) => set("organisation", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-purple-200">Scout license / accreditation number <span className="opacity-60">(optional)</span></label>
                <input type="text" placeholder="e.g. ZIFA-SC-2024-001" value={form.accreditation_no} onChange={(e) => set("accreditation_no", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-purple-200">Years of scouting experience</label>
                <input type="number" placeholder="e.g. 3" min="0" max="50" value={form.experience_years} onChange={(e) => set("experience_years", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-purple-200">Regions you scout <span className="opacity-60">(select all that apply)</span></label>
                <div className="flex flex-wrap gap-2">
                  {PROVINCES.map((p) => (
                    <button key={p} type="button" onClick={() => toggleRegion(p)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${form.scouting_regions.includes(p) ? "border-purple-400 bg-purple-500/30 text-white" : "border-white/20 bg-white/5 text-purple-300 hover:bg-white/10"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div><h2 className="text-xl font-bold text-white">Review & confirm</h2><p className="text-sm text-purple-300">Check your details before submitting</p></div>
              <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
                {([["Name", `${form.first_name} ${form.surname}`],["Email", form.email],["Province", form.province],["Organisation", form.organisation],["Experience", `${form.experience_years} years`],
                  form.scouting_regions.length > 0 ? ["Scouting regions", form.scouting_regions.join(", ")] : null,
                ] as ([string, string] | null)[]).filter((r): r is [string, string] => !!r).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-purple-400">{k}</span>
                    <span className="font-medium text-white text-right max-w-[60%]">{v}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-4 text-sm text-purple-200">
                ℹ️ Scout accounts are reviewed by platform admins within 24 hours. You&apos;ll receive access confirmation via email.
              </div>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={form.terms} onChange={(e) => set("terms", e.target.checked)} className="mt-0.5 h-4 w-4 accent-purple-500" />
                <span className="text-sm text-purple-200">
                  I agree to the <span className="text-purple-400 underline">Terms of Service</span>, <span className="text-purple-400 underline">Privacy Policy</span>, and ZIFA data sharing agreement
                </span>
              </label>
            </div>
          )}

          {error && <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/20 px-3 py-2.5 text-sm text-red-300">{error}</div>}

          <div className="mt-6 flex gap-3">
            {step > 1 && (
              <button onClick={() => { setError(""); setStep((s) => s - 1); }} className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            )}
            <button onClick={handleNext} disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-400 disabled:opacity-50 transition-colors">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> :
               step === 4 ? <><CheckCircle2 className="h-4 w-4" /> Submit Scout Application</> :
               <>Next <ChevronRight className="h-4 w-4" /></>}
            </button>
          </div>
        </div>
        <p className="mt-5 text-center text-sm text-purple-400">Already have an account?{" "}<Link href="/login" className="font-semibold text-white hover:underline">Sign in</Link></p>
      </div>
    </div>
  );
}

export default function ScoutRegisterPage() {
  return (
    <Suspense>
      <ScoutRegisterForm />
    </Suspense>
  );
}
