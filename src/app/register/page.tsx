"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronLeft, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore, roleHomePath } from "@/lib/auth-store";

// ── Types ─────────────────────────────────────────────────────────────────────
type Role = "player" | "coach" | "scout" | "fan";

interface FormState {
  // Step 1
  role: Role | "";
  // Step 2
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  // Step 3 — role-specific
  position: string;
  province: string;
  age_group: string;
  team_name: string;
  organisation: string;
  // Step 4 — player physical
  height_cm: string;
  weight_kg: string;
  preferred_foot: string;
  school: string;
  // Step 5 — consent
  guardian_consent: boolean;
  terms: boolean;
}

const INIT: FormState = {
  role: "", name: "", email: "", phone: "", password: "", confirm_password: "",
  position: "", province: "", age_group: "", team_name: "", organisation: "",
  height_cm: "", weight_kg: "", preferred_foot: "", school: "",
  guardian_consent: false, terms: false,
};

const POSITIONS = ["Goalkeeper","Right Back","Left Back","Centre Back","Defensive Midfielder","Central Midfielder","Attacking Midfielder","Right Winger","Left Winger","Centre Forward","Striker"];
const PROVINCES = ["Harare","Bulawayo","Manicaland","Mashonaland Central","Mashonaland East","Mashonaland West","Masvingo","Matabeleland North","Matabeleland South","Midlands"];
const AGE_GROUPS = ["u13","u17","u20","senior"];

const ROLES = [
  { id: "player" as Role, icon: "🏃", label: "Player", desc: "Track training, get scouted, grow your game" },
  { id: "coach" as Role, icon: "📋", label: "Coach", desc: "Manage your squad, get AI tactical insights" },
  { id: "scout" as Role, icon: "🔍", label: "Scout", desc: "Discover and contact verified talent" },
  { id: "fan" as Role, icon: "🎉", label: "Fan", desc: "Follow athletes, explore leaderboards" },
];

const STEP_LABELS = ["Role", "Account", "Details", "Profile", "Consent"];

// ── Component ─────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INIT);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const totalSteps = form.role === "player" ? 5 : 4;

  const set = (k: keyof FormState, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const next = () => { setError(""); setStep((s) => s + 1); };
  const back = () => { setError(""); setStep((s) => s - 1); };

  const validate = (): string => {
    if (step === 1 && !form.role) return "Please select a role";
    if (step === 2) {
      if (!form.name.trim()) return "Name required";
      if (!form.email.includes("@")) return "Valid email required";
      if (!form.phone.trim()) return "Phone required";
      if (form.password.length < 8) return "Password must be at least 8 characters";
      if (form.password !== form.confirm_password) return "Passwords don't match";
    }
    if (step === 3) {
      if (form.role === "player" && !form.position) return "Select your position";
      if (!form.province) return "Select your province";
      if (form.role === "player" && !form.age_group) return "Select your age group";
    }
    if (step === totalSteps && !form.terms) return "Please accept the terms";
    return "";
  };

  const handleNext = () => {
    const err = validate();
    if (err) { setError(err); return; }
    if (step < totalSteps) { next(); return; }
    submit();
  };

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const payload: Record<string, string | boolean> = {
        name: form.name, email: form.email, phone: form.phone,
        password: form.password, password_confirmation: form.confirm_password,
        role: form.role, province: form.province,
      };
      if (form.role === "player") {
        Object.assign(payload, {
          position: form.position, age_group: form.age_group,
          preferred_foot: form.preferred_foot, school: form.school,
          height_cm: form.height_cm, weight_kg: form.weight_kg,
        });
      }
      if (form.role === "coach") payload.team_name = form.team_name;
      if (form.role === "scout") payload.organisation = form.organisation;

      const res = await api.post("/auth/register", payload);
      const { token, user } = res.data;
      login({ id: user.id, name: user.name, email: user.email, role: user.role, token });
      router.push(roleHomePath(user.role));
    } catch (e: unknown) {
      const data = (e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      const msgs = data?.errors ? Object.values(data.errors).flat().join(". ") : data?.message;
      setError(msgs ?? "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-white">
            <span className="text-3xl">⚽</span>
            <span className="text-xl font-bold">Grassroots Sport</span>
          </Link>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => {
            const n = i + 1;
            return (
              <div key={n} className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  n < step ? "bg-green-500 text-white" :
                  n === step ? "bg-white text-green-900" :
                  "bg-white/20 text-white/60"
                }`}>
                  {n < step ? <CheckCircle2 className="h-4 w-4" /> : n}
                </div>
                {i < totalSteps - 1 && (
                  <div className={`h-0.5 w-8 ${n < step ? "bg-green-500" : "bg-white/20"}`} />
                )}
              </div>
            );
          })}
        </div>
        <p className="mb-6 text-center text-xs text-green-300">Step {step} of {totalSteps} — {STEP_LABELS[step - 1]}</p>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">

          {/* Step 1 — Role */}
          {step === 1 && (
            <div>
              <h2 className="mb-2 text-xl font-bold text-white">Who are you?</h2>
              <p className="mb-6 text-sm text-green-300">Choose your role on the platform</p>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => set("role", r.id)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      form.role === r.id
                        ? "border-green-400 bg-green-500/20 text-white"
                        : "border-white/20 bg-white/5 text-green-200 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-2xl">{r.icon}</span>
                    <p className="mt-2 font-semibold">{r.label}</p>
                    <p className="mt-0.5 text-xs opacity-70">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Account */}
          {step === 2 && (
            <div>
              <h2 className="mb-2 text-xl font-bold text-white">Create your account</h2>
              <p className="mb-6 text-sm text-green-300">Your login details</p>
              <div className="space-y-4">
                {/* Plain text fields */}
                {[
                  { k: "name",  label: "Full name",          type: "text",  placeholder: "Tinashe Moyo" },
                  { k: "email", label: "Email",              type: "email", placeholder: "you@example.com" },
                  { k: "phone", label: "Phone (WhatsApp)",   type: "tel",   placeholder: "+263 77 123 4567" },
                ].map(({ k, label, type, placeholder }) => (
                  <div key={k}>
                    <label className="mb-1 block text-xs font-medium text-green-200">{label}</label>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={form[k as keyof FormState] as string}
                      onChange={(e) => set(k as keyof FormState, e.target.value)}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-green-400/60 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
                    />
                  </div>
                ))}

                {/* Password field with eye toggle */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-green-200">Password (min 8 chars)</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 pr-10 text-sm text-white placeholder-green-400/60 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400/70 hover:text-green-300 transition-colors"
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password field with eye toggle */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-green-200">Confirm password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.confirm_password}
                      onChange={(e) => set("confirm_password", e.target.value)}
                      className={`w-full rounded-lg border bg-white/10 px-3 py-2.5 pr-10 text-sm text-white placeholder-green-400/60 outline-none focus:ring-1 focus:ring-green-400 ${
                        form.confirm_password && form.password !== form.confirm_password
                          ? "border-red-400 focus:border-red-400"
                          : "border-white/20 focus:border-green-400"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400/70 hover:text-green-300 transition-colors"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.confirm_password && form.password !== form.confirm_password && (
                    <p className="mt-1 text-xs text-red-300">Passwords don&apos;t match</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Role-specific details */}
          {step === 3 && (
            <div>
              <h2 className="mb-2 text-xl font-bold text-white">
                {form.role === "player" ? "Playing details" : form.role === "coach" ? "Coaching details" : "Your details"}
              </h2>
              <p className="mb-6 text-sm text-green-300">Help us personalise your experience</p>
              <div className="space-y-4">
                {form.role === "player" && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-green-200">Position</label>
                      <select value={form.position} onChange={(e) => set("position", e.target.value)}
                        className="w-full rounded-lg border border-white/20 bg-green-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-green-400">
                        <option value="">Select position…</option>
                        {POSITIONS.map((p) => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-green-200">Age Group</label>
                      <div className="flex gap-2">
                        {AGE_GROUPS.map((ag) => (
                          <button key={ag} type="button" onClick={() => set("age_group", ag)}
                            className={`flex-1 rounded-lg border py-2 text-sm font-medium uppercase transition-all ${
                              form.age_group === ag ? "border-green-400 bg-green-500/30 text-white" : "border-white/20 bg-white/5 text-green-300"
                            }`}>{ag}</button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {form.role === "coach" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-green-200">Team / Club name</label>
                    <input type="text" placeholder="FC Harare Youth" value={form.team_name}
                      onChange={(e) => set("team_name", e.target.value)}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-green-400/60 outline-none focus:border-green-400" />
                  </div>
                )}
                {form.role === "scout" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-green-200">Organisation / Club</label>
                    <input type="text" placeholder="ZIFA, Dynamos FC, etc." value={form.organisation}
                      onChange={(e) => set("organisation", e.target.value)}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-green-400/60 outline-none focus:border-green-400" />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-medium text-green-200">Province</label>
                  <select value={form.province} onChange={(e) => set("province", e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-green-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-green-400">
                    <option value="">Select province…</option>
                    {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Player physical / Coach bio (only for player) */}
          {step === 4 && form.role === "player" && (
            <div>
              <h2 className="mb-2 text-xl font-bold text-white">Physical profile</h2>
              <p className="mb-6 text-sm text-green-300">Used for training plans and benchmark comparisons</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-green-200">Height (cm)</label>
                    <input type="number" placeholder="175" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-green-400/60 outline-none focus:border-green-400" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-green-200">Weight (kg)</label>
                    <input type="number" placeholder="68" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-green-400/60 outline-none focus:border-green-400" />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-green-200">Preferred foot</label>
                  <div className="flex gap-3">
                    {["right","left","both"].map((f) => (
                      <button key={f} type="button" onClick={() => set("preferred_foot", f)}
                        className={`flex-1 rounded-lg border py-2.5 text-sm font-medium capitalize transition-all ${
                          form.preferred_foot === f ? "border-green-400 bg-green-500/30 text-white" : "border-white/20 bg-white/5 text-green-300"
                        }`}>{f}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-green-200">School / Club <span className="opacity-60">(optional)</span></label>
                  <input type="text" placeholder="Hartmann House, Churchill, etc." value={form.school}
                    onChange={(e) => set("school", e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-green-400/60 outline-none focus:border-green-400" />
                </div>
              </div>
            </div>
          )}

          {/* Last step — Consent */}
          {step === totalSteps && (
            <div>
              <h2 className="mb-2 text-xl font-bold text-white">Almost done!</h2>
              <p className="mb-6 text-sm text-green-300">Review and confirm</p>

              {/* Summary */}
              <div className="mb-6 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
                {[
                  ["Role", form.role],
                  ["Name", form.name],
                  ["Email", form.email],
                  form.role === "player" ? ["Position", form.position] : null,
                  ["Province", form.province],
                ].filter((item): item is [string, string] => item !== null).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-green-400">{k}</span>
                    <span className="font-medium capitalize text-white">{v}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.terms} onChange={(e) => set("terms", e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-white/30 accent-green-500" />
                  <span className="text-sm text-green-200">
                    I agree to the <span className="text-green-400 underline">Terms of Service</span> and{" "}
                    <span className="text-green-400 underline">Privacy Policy</span>
                  </span>
                </label>
                {form.age_group === "u13" && (
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.guardian_consent} onChange={(e) => set("guardian_consent", e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-white/30 accent-green-500" />
                    <span className="text-sm text-green-200">
                      Parent/guardian has given consent for this under-13 registration
                    </span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/20 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Nav buttons */}
          <div className="mt-6 flex gap-3">
            {step > 1 && (
              <button onClick={back}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            )}
            <button onClick={handleNext} disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-400 disabled:opacity-50 transition-colors">
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
              ) : step === totalSteps ? (
                <><CheckCircle2 className="h-4 w-4" /> Create account</>
              ) : (
                <>Next <ChevronRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-green-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-white hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
