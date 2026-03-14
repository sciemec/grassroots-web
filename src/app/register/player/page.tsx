"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronLeft, CheckCircle2, Loader2, Eye, EyeOff, User, Calendar, MapPin, Dumbbell, Shield } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore, roleHomePath } from "@/lib/auth-store";

// ── Constants ──────────────────────────────────────────────────────────────────
const POSITIONS = [
  "Goalkeeper","Right Back","Left Back","Centre Back",
  "Defensive Midfielder","Central Midfielder","Attacking Midfielder",
  "Right Winger","Left Winger","Centre Forward","Striker",
];
const PROVINCES = [
  "Harare","Bulawayo","Manicaland","Mashonaland Central",
  "Mashonaland East","Mashonaland West","Masvingo",
  "Matabeleland North","Matabeleland South","Midlands",
];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const STEPS = [
  { icon: User,     label: "Personal" },
  { icon: Shield,   label: "Account" },
  { icon: Dumbbell, label: "Playing" },
  { icon: Calendar, label: "Physical" },
  { icon: MapPin,   label: "Consent" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const calcAgeGroup = (day: string, month: string, year: string): string => {
  if (!day || !month || !year) return "";
  const dob = new Date(+year, +month - 1, +day);
  const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 13) return "u13";
  if (age < 17) return "u17";
  if (age < 20) return "u20";
  return "senior";
};

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => String(currentYear - 6 - i));
const DAYS  = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));

interface Form {
  // Step 1
  name: string; dob_day: string; dob_month: string; dob_year: string; sex: string; phone: string;
  // Step 2
  email: string; password: string; confirm_password: string;
  // Step 3
  position: string; province: string; school: string;
  // Step 4
  height_cm: string; weight_kg: string; preferred_foot: string;
  // Step 5
  terms: boolean; guardian_consent: boolean;
}

const INIT: Form = {
  name: "", dob_day: "", dob_month: "", dob_year: "", sex: "", phone: "",
  email: "", password: "", confirm_password: "",
  position: "", province: "", school: "",
  height_cm: "", weight_kg: "", preferred_foot: "",
  terms: false, guardian_consent: false,
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function PlayerRegisterPage() {
  const router = useRouter();
  const login  = useAuthStore((s) => s.login);
  const [step, setStep]     = useState(1);
  const [form, setForm]     = useState<Form>(INIT);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [showCfm, setShowCfm] = useState(false);

  const set = (k: keyof Form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const next = () => { setError(""); setStep((s) => s + 1); };
  const back = () => { setError(""); setStep((s) => s - 1); };

  const ageGroup = calcAgeGroup(form.dob_day, form.dob_month, form.dob_year);
  const isUnder13 = ageGroup === "u13";

  const validate = (): string => {
    if (step === 1) {
      if (!form.name.trim())   return "Full name is required";
      if (!form.dob_day || !form.dob_month || !form.dob_year) return "Date of birth is required";
      if (!form.sex)           return "Please select your sex";
      if (!form.phone.trim())  return "Phone number is required";
    }
    if (step === 2) {
      if (!form.email.includes("@"))      return "Valid email address required";
      if (form.password.length < 8)       return "Password must be at least 8 characters";
      if (form.password !== form.confirm_password) return "Passwords don't match";
    }
    if (step === 3) {
      if (!form.position) return "Please select your position";
      if (!form.province) return "Please select your province";
    }
    if (step === 5) {
      if (!form.terms) return "You must accept the terms to continue";
      if (isUnder13 && !form.guardian_consent) return "Parent or guardian consent is required for under-13 players";
    }
    return "";
  };

  const handleNext = () => {
    const err = validate();
    if (err) { setError(err); return; }
    if (step < 5) { next(); return; }
    submit();
  };

  const submit = async () => {
    setLoading(true);
    setError("");
    const dob = `${form.dob_year}-${form.dob_month.padStart(2,"0")}-${form.dob_day.padStart(2,"0")}`;
    try {
      const res = await api.post("/auth/register", {
        role: "player", name: form.name, email: form.email, phone: form.phone,
        password: form.password, password_confirmation: form.confirm_password,
        date_of_birth: dob, sex: form.sex, age_group: ageGroup,
        position: form.position, province: form.province, school: form.school,
        height_cm: form.height_cm, weight_kg: form.weight_kg,
        preferred_foot: form.preferred_foot, terms: form.terms,
        guardian_consent: form.guardian_consent,
      });
      const { token, user } = res.data;
      login({ id: user.id, name: user.name, email: user.email, role: user.role, token });
      router.push(roleHomePath(user.role));
    } catch (e: unknown) {
      const data = (e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      setError(data?.errors ? Object.values(data.errors).flat().join(". ") : (data?.message ?? "Registration failed. Please try again."));
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-green-400/60 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400";
  const selectCls = "w-full rounded-lg border border-white/20 bg-green-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-green-400";

  return (
    <div className="flex min-h-screen items-start justify-center bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Logo + back */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/register" className="flex items-center gap-1.5 text-sm text-green-400 hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" /> All roles
          </Link>
          <Link href="/" className="flex items-center gap-2 text-white">
            <span className="text-2xl">⚽</span>
            <span className="font-bold">Grassroots Sport</span>
          </Link>
        </div>

        {/* Role badge */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 text-2xl shadow-lg">🏃</div>
          <div>
            <h1 className="text-xl font-black text-white">Player Registration</h1>
            <p className="text-xs text-green-300">Free account · AI coaching included</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex items-center justify-between">
          {STEPS.map(({ icon: Icon, label }, i) => {
            const n = i + 1;
            const done = n < step;
            const active = n === step;
            return (
              <div key={n} className="flex flex-1 flex-col items-center">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  done ? "bg-green-500 text-white" : active ? "bg-white text-green-900" : "bg-white/15 text-white/50"
                }`}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={`mt-1 text-[10px] font-medium ${active ? "text-white" : "text-white/40"}`}>{label}</span>
                {i < STEPS.length - 1 && (
                  <div className="absolute" style={{ display: "none" }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mb-6 h-1.5 w-full rounded-full bg-white/10">
          <div className="h-full rounded-full bg-green-500 transition-all duration-300" style={{ width: `${((step - 1) / 4) * 100}%` }} />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">

          {/* ── Step 1: Personal Info ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">Personal information</h2>
                <p className="text-sm text-green-300">Tell us about yourself</p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-green-200">Full name</label>
                <input type="text" placeholder="Tinashe Moyo" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-green-200">Date of birth</label>
                <div className="grid grid-cols-3 gap-2">
                  <select value={form.dob_day} onChange={(e) => set("dob_day", e.target.value)} className={selectCls}>
                    <option value="">Day</option>
                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={form.dob_month} onChange={(e) => set("dob_month", e.target.value)} className={selectCls}>
                    <option value="">Month</option>
                    {MONTHS.map((m, i) => <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>)}
                  </select>
                  <select value={form.dob_year} onChange={(e) => set("dob_year", e.target.value)} className={selectCls}>
                    <option value="">Year</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                {ageGroup && (
                  <p className="mt-1.5 text-xs text-green-400">
                    Age group: <span className="font-bold uppercase text-green-300">{ageGroup}</span>
                    {isUnder13 && " · Parental consent required"}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-green-200">Sex</label>
                <div className="flex gap-2">
                  {["Male","Female","Prefer not to say"].map((s) => (
                    <button key={s} type="button" onClick={() => set("sex", s)}
                      className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-all ${form.sex === s ? "border-green-400 bg-green-500/30 text-white" : "border-white/20 bg-white/5 text-green-300 hover:bg-white/10"}`}>
                      {s === "Prefer not to say" ? "Other" : s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-green-200">WhatsApp phone number</label>
                <input type="tel" placeholder="+263 77 123 4567" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
              </div>
            </div>
          )}

          {/* ── Step 2: Account ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">Create your account</h2>
                <p className="text-sm text-green-300">Your login credentials</p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-green-200">Email address</label>
                <input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-green-200">Password (min 8 characters)</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={(e) => set("password", e.target.value)}
                    className={`${inputCls} pr-10`} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400/70 hover:text-green-300 transition-colors">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Strength bar */}
                {form.password && (
                  <div className="mt-1.5 flex items-center gap-2">
                    {[1,2,3].map((lvl) => {
                      const strength = form.password.length < 8 ? 1 : (form.password.match(/[A-Z]/) && form.password.match(/[0-9]/)) ? 3 : 2;
                      return <div key={lvl} className={`h-1 flex-1 rounded-full transition-colors ${lvl <= strength ? (strength === 1 ? "bg-red-500" : strength === 2 ? "bg-amber-500" : "bg-green-500") : "bg-white/20"}`} />;
                    })}
                    <span className="text-xs text-green-300">{form.password.length < 8 ? "Weak" : (form.password.match(/[A-Z]/) && form.password.match(/[0-9]/)) ? "Strong" : "Good"}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-green-200">Confirm password</label>
                <div className="relative">
                  <input type={showCfm ? "text" : "password"} placeholder="••••••••" value={form.confirm_password} onChange={(e) => set("confirm_password", e.target.value)}
                    className={`${inputCls} pr-10 ${form.confirm_password && form.password !== form.confirm_password ? "border-red-400" : ""}`} />
                  <button type="button" onClick={() => setShowCfm(!showCfm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400/70 hover:text-green-300 transition-colors">
                    {showCfm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.confirm_password && form.password !== form.confirm_password && (
                  <p className="mt-1 text-xs text-red-300">Passwords don&apos;t match</p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Playing Details ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">Playing details</h2>
                <p className="text-sm text-green-300">Help us personalise your training</p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-green-200">Position</label>
                <select value={form.position} onChange={(e) => set("position", e.target.value)} className={selectCls}>
                  <option value="">Select your position…</option>
                  {POSITIONS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-green-200">Province</label>
                <select value={form.province} onChange={(e) => set("province", e.target.value)} className={selectCls}>
                  <option value="">Select your province…</option>
                  {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-green-200">School / Club <span className="opacity-60">(optional)</span></label>
                <input type="text" placeholder="e.g. Hartmann House, Dynamos FC" value={form.school} onChange={(e) => set("school", e.target.value)} className={inputCls} />
              </div>

              {ageGroup && (
                <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3">
                  <p className="text-xs text-green-300">Age group automatically set to <span className="font-bold uppercase text-green-200">{ageGroup}</span> based on your date of birth.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Physical Profile ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">Physical profile</h2>
                <p className="text-sm text-green-300">Used for training benchmarks <span className="opacity-70">(all optional)</span></p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-green-200">Height (cm)</label>
                  <input type="number" placeholder="e.g. 175" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-green-200">Weight (kg)</label>
                  <input type="number" placeholder="e.g. 68" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-green-200">Preferred foot</label>
                <div className="flex gap-3">
                  {["right","left","both"].map((f) => (
                    <button key={f} type="button" onClick={() => set("preferred_foot", f)}
                      className={`flex-1 rounded-lg border py-2.5 text-sm font-medium capitalize transition-all ${form.preferred_foot === f ? "border-green-400 bg-green-500/30 text-white" : "border-white/20 bg-white/5 text-green-300 hover:bg-white/10"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-green-400/70">You can update these anytime from your profile settings.</p>
            </div>
          )}

          {/* ── Step 5: Consent ── */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">Almost done!</h2>
                <p className="text-sm text-green-300">Review your details and confirm</p>
              </div>

              {/* Summary */}
              <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
                {[
                  ["Name", form.name],
                  ["Date of birth", `${form.dob_day} ${MONTHS[+form.dob_month - 1]} ${form.dob_year}`],
                  ["Age group", ageGroup.toUpperCase()],
                  ["Position", form.position],
                  ["Province", form.province],
                  form.school ? ["School/Club", form.school] : null,
                ].filter((r): r is [string, string] => !!r).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-green-400">{k}</span>
                    <span className="font-medium text-white capitalize">{v}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={form.terms} onChange={(e) => set("terms", e.target.checked)} className="mt-0.5 h-4 w-4 accent-green-500" />
                  <span className="text-sm text-green-200">
                    I agree to the <span className="text-green-400 underline">Terms of Service</span> and{" "}
                    <span className="text-green-400 underline">Privacy Policy</span>
                  </span>
                </label>

                {isUnder13 && (
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                    <input type="checkbox" checked={form.guardian_consent} onChange={(e) => set("guardian_consent", e.target.checked)} className="mt-0.5 h-4 w-4 accent-green-500" />
                    <span className="text-sm text-amber-200">
                      A parent or guardian has given consent for this under-13 registration (required by ZIFA safeguarding policy)
                    </span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/20 px-3 py-2.5 text-sm text-red-300">{error}</div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex gap-3">
            {step > 1 && (
              <button onClick={back} className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            )}
            <button onClick={handleNext} disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-400 disabled:opacity-50 transition-colors">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> :
               step === 5 ? <><CheckCircle2 className="h-4 w-4" /> Create Player Account</> :
               <>Next <ChevronRight className="h-4 w-4" /></>}
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-green-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-white hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
