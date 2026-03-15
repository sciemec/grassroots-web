"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SPORT_MAP, SportKey } from "@/config/sports";
import { ChevronRight, ChevronLeft, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";
import { extractApiError } from "@/lib/api-error";

const PROVINCES = [
  "Harare","Bulawayo","Manicaland","Mashonaland Central",
  "Mashonaland East","Mashonaland West","Masvingo",
  "Matabeleland North","Matabeleland South","Midlands",
];
const SPORTS = [
  { key: "football",   label: "Football",    emoji: "⚽" },
  { key: "rugby",      label: "Rugby",       emoji: "🏉" },
  { key: "netball",    label: "Netball",     emoji: "🏐" },
  { key: "basketball", label: "Basketball",  emoji: "🏀" },
  { key: "cricket",    label: "Cricket",     emoji: "🏏" },
  { key: "athletics",  label: "Athletics",   emoji: "🏃" },
  { key: "swimming",   label: "Swimming",    emoji: "🏊" },
  { key: "tennis",     label: "Tennis",      emoji: "🎾" },
  { key: "volleyball", label: "Volleyball",  emoji: "🏐" },
  { key: "hockey",     label: "Hockey",      emoji: "🏑" },
];

const STEPS = ["Discover", "Account", "Confirm"];

interface Form {
  first_name: string; surname: string; province: string; favourite_sport: string;
  email: string; password: string; confirm_password: string;
  terms: boolean;
}
const INIT: Form = {
  first_name: "", surname: "", province: "", favourite_sport: "football",
  email: "", password: "", confirm_password: "",
  terms: false,
};

function FanRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sportParam = (searchParams.get("sport") ?? "football") as SportKey;
  const sportCfg = SPORT_MAP[sportParam] ?? SPORT_MAP["football"];

  const [step, setStep]       = useState(1);
  const [form, setForm]       = useState<Form>({ ...INIT, favourite_sport: sportParam });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [showCfm, setShowCfm] = useState(false);

  const set = (k: keyof Form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const validate = (): string => {
    if (step === 1) {
      if (!form.first_name.trim()) return "First name is required";
      if (!form.surname.trim())    return "Surname is required";
      if (!form.province)          return "Please select your province";
    }
    if (step === 2) {
      if (!form.email.includes("@"))               return "Valid email address required";
      if (form.password.length < 8)                return "Password must be at least 8 characters";
      if (form.password !== form.confirm_password) return "Passwords don't match";
    }
    if (step === 3 && !form.terms) return "You must accept the terms to continue";
    return "";
  };

  const handleNext = () => {
    const err = validate();
    if (err) { setError(err); return; }
    if (step < 3) { setError(""); setStep((s) => s + 1); return; }
    submit();
  };

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/register", {
        role: "fan", first_name: form.first_name, surname: form.surname,
        email: form.email,
        password: form.password, password_confirmation: form.confirm_password,
        province: form.province, favourite_sport: form.favourite_sport,
      });
      const { identifier } = res.data;
      router.push(`/verify-otp?identifier=${encodeURIComponent(identifier)}`);
    } catch (e: unknown) {
      setError(extractApiError(e, "Registration failed. Please try again."));
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-amber-300/50 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400";
  const selectCls = "w-full rounded-lg border border-white/20 bg-amber-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400";

  return (
    <div className="flex min-h-screen items-start justify-center bg-gradient-to-br from-amber-950 via-orange-900 to-red-900 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/register" className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" /> All roles
          </Link>
          <Link href="/" className="flex items-center gap-2 text-white">
            <span className="text-2xl">⚽</span>
            <span className="font-bold">Grassroots Sport</span>
          </Link>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-2xl shadow-lg">
            {sportCfg.emoji}
          </div>
          <div>
            <h1 className="text-xl font-black text-white">{sportCfg.label} Fan Registration</h1>
            <p className="text-xs text-amber-300">Free forever · Live matches · Leaderboard access</p>
          </div>
        </div>

        {/* Step pills */}
        <div className="mb-4 flex gap-1.5">
          {STEPS.map((label, i) => {
            const n = i + 1;
            return (
              <div key={n} className={`flex-1 rounded-full py-1.5 text-center text-xs font-semibold transition-all ${n < step ? "bg-amber-500 text-white" : n === step ? "bg-white text-amber-900" : "bg-white/10 text-white/40"}`}>
                {n < step ? "✓" : label}
              </div>
            );
          })}
        </div>
        <div className="mb-6 h-1 w-full rounded-full bg-white/10">
          <div className="h-full rounded-full bg-amber-500 transition-all duration-300" style={{ width: `${((step - 1) / 2) * 100}%` }} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">

          {/* Step 1: Discover */}
          {step === 1 && (
            <div className="space-y-5">
              <div><h2 className="text-xl font-bold text-white">Discover Zimbabwe Sport</h2><p className="text-sm text-amber-300">Tell us what you love</p></div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-amber-200">First name</label>
                  <input type="text" placeholder="Rudo" value={form.first_name} onChange={(e) => set("first_name", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-amber-200">Surname</label>
                  <input type="text" placeholder="Chirwa" value={form.surname} onChange={(e) => set("surname", e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-amber-200">Province</label>
                <select value={form.province} onChange={(e) => set("province", e.target.value)} className={selectCls}>
                  <option value="">Select your province…</option>
                  {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-amber-200">Favourite sport</label>
                <div className="grid grid-cols-5 gap-2">
                  {SPORTS.map((s) => (
                    <button key={s.key} type="button" onClick={() => set("favourite_sport", s.key)}
                      className={`flex flex-col items-center rounded-xl border py-2.5 text-xs font-medium transition-all ${form.favourite_sport === s.key ? "border-amber-400 bg-amber-500/30 text-white" : "border-white/20 bg-white/5 text-amber-300 hover:bg-white/10"}`}>
                      <span className="text-xl">{s.emoji}</span>
                      <span className="mt-1 text-[10px] leading-tight text-center">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Account */}
          {step === 2 && (
            <div className="space-y-4">
              <div><h2 className="text-xl font-bold text-white">Create your account</h2><p className="text-sm text-amber-300">Free to join — no credit card needed</p></div>
              <div>
                <label className="mb-1 block text-xs font-medium text-amber-200">Email address</label>
                <input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-amber-200">Password (min 8 characters)</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={(e) => set("password", e.target.value)} className={`${inputCls} pr-10`} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400/70 hover:text-amber-300 transition-colors">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-amber-200">Confirm password</label>
                <div className="relative">
                  <input type={showCfm ? "text" : "password"} placeholder="••••••••" value={form.confirm_password} onChange={(e) => set("confirm_password", e.target.value)}
                    className={`${inputCls} pr-10 ${form.confirm_password && form.password !== form.confirm_password ? "border-red-400" : ""}`} />
                  <button type="button" onClick={() => setShowCfm(!showCfm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400/70 hover:text-amber-300 transition-colors">
                    {showCfm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.confirm_password && form.password !== form.confirm_password && (
                  <p className="mt-1 text-xs text-red-300">Passwords don&apos;t match</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="space-y-5">
              <div><h2 className="text-xl font-bold text-white">You&apos;re almost in!</h2><p className="text-sm text-amber-300">Confirm to create your free fan account</p></div>
              <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
                {[["Name", `${form.first_name} ${form.surname}`],["Email", form.email],["Province", form.province],["Favourite Sport", SPORTS.find(s => s.key === form.favourite_sport)?.label ?? form.favourite_sport]].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-amber-400">{k}</span>
                    <span className="font-medium text-white">{v}</span>
                  </div>
                ))}
              </div>

              {/* What fans get */}
              <div className="space-y-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-xs font-semibold text-amber-300 mb-2">What you get as a Fan:</p>
                {["🏆 Player leaderboards across all 10 sports","📡 Live match streaming","🔍 Discover emerging Zimbabwe talent","🎯 Follow your favourite athletes"].map((item) => (
                  <p key={item} className="text-xs text-amber-200">{item}</p>
                ))}
              </div>

              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={form.terms} onChange={(e) => set("terms", e.target.checked)} className="mt-0.5 h-4 w-4 accent-amber-500" />
                <span className="text-sm text-amber-200">
                  I agree to the <span className="text-amber-400 underline">Terms of Service</span> and <span className="text-amber-400 underline">Privacy Policy</span>
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
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-400 disabled:opacity-50 transition-colors">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> :
               step === 3 ? <><CheckCircle2 className="h-4 w-4" /> Join as a Fan — It&apos;s Free!</> :
               <>Next <ChevronRight className="h-4 w-4" /></>}
            </button>
          </div>
        </div>
        <p className="mt-5 text-center text-sm text-amber-400">Already have an account?{" "}<Link href="/login" className="font-semibold text-white hover:underline">Sign in</Link></p>
      </div>
    </div>
  );
}

export default function FanRegisterPage() {
  return (
    <Suspense>
      <FanRegisterForm />
    </Suspense>
  );
}
