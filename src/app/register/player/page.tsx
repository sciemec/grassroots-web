"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, CheckCircle, Dumbbell } from "lucide-react";
import { normalizePhone } from "@/lib/phone-normalize";
import { COUNTRIES } from "@/lib/countries";

const GENDER_COACH: Record<"male" | "female", { label: string; coach: string }> = {
  male:   { label: "Male",   coach: "THUTO" },
  female: { label: "Female", coach: "Amara" },
};

const SPORTS = [
  { key: "football",   emoji: "⚽", label: "Football"   },
  { key: "rugby",      emoji: "🏉", label: "Rugby"      },
  { key: "athletics",  emoji: "🏃", label: "Athletics"  },
  { key: "netball",    emoji: "🏐", label: "Netball"    },
  { key: "basketball", emoji: "🏀", label: "Basketball" },
  { key: "cricket",    emoji: "🏏", label: "Cricket"    },
  { key: "swimming",   emoji: "🏊", label: "Swimming"   },
  { key: "tennis",     emoji: "🎾", label: "Tennis"     },
  { key: "volleyball", emoji: "🏐", label: "Volleyball" },
  { key: "hockey",     emoji: "🏑", label: "Hockey"     },
];

interface FormData {
  first_name:      string;
  surname:         string;
  gender:          "male" | "female" | "";
  sport:           string;
  age:             string;
  country:         string;
  contactType:     "email" | "phone";
  email:           string;
  phone:           string;
  password:        string;
  confirmPassword: string;
}

export default function RegisterPlayerPage() {
  const router = useRouter();
  const [step,         setStep]         = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const phoneParam = params.get("phone");
    if (phoneParam) {
      setForm((prev) => ({ ...prev, contactType: "phone", phone: phoneParam }));
    }
  }, []);

  const [showPassword,    setShowPassword]    = useState(false);
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [retryCountdown,  setRetryCountdown]  = useState<number | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [form, setForm] = useState<FormData>({
    first_name:      "",
    surname:         "",
    gender:          "",
    sport:           "",
    age:             "",
    country:         "Zimbabwe",
    contactType:     "email",
    email:           "",
    phone:           "",
    password:        "",
    confirmPassword: "",
  });

  const set = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canProceedStep1 =
    form.first_name.trim().length >= 2 &&
    form.surname.trim().length >= 2 &&
    form.gender !== "" &&
    form.sport !== "" &&
    form.age !== "" &&
    parseInt(form.age) >= 5 &&
    parseInt(form.age) <= 100 &&
    form.country !== "";

  const contactValid =
    form.contactType === "email"
      ? form.email.includes("@") && form.email.includes(".")
      : form.phone.replace(/\D/g, "").length >= 9;

  const canSubmit =
    contactValid &&
    form.password.length >= 8 &&
    form.password === form.confirmPassword;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setRetryCountdown(null);
    if (retryTimerRef.current) clearInterval(retryTimerRef.current);
    try {
      const body: Record<string, unknown> = {
        first_name:            form.first_name.trim(),
        surname:               form.surname.trim(),
        name:                  `${form.first_name.trim()} ${form.surname.trim()}`,
        gender:                form.gender || "male",
        sport:                 form.sport,
        age:                   parseInt(form.age),
        country:               form.country,
        password:              form.password,
        password_confirmation: form.confirmPassword,
        role:                  "player",
      };
      if (form.contactType === "email") {
        body.email = form.email.trim().toLowerCase();
      } else {
        body.phone = normalizePhone(form.phone.trim());
      }

      let res: Response;
      res = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        // Cold start / server crash — show amber retry prompt, not red error
        if (res.status >= 500) {
          throw new Error("__waking__");
        }

        const data = await res.json().catch(() => ({})) as {
          message?: string;
          errors?: Record<string, string[]>;
        };

        // Parse Laravel field-level validation errors into friendly messages
        if (data.errors && Object.keys(data.errors).length > 0) {
          const fieldLabels: Record<string, string> = {
            email:    "Email",
            phone:    "Phone number",
            password: "Password",
            name:     "Name",
            age:      "Age",
          };
          const msgs = Object.entries(data.errors).map(([field, messages]) => {
            const label = fieldLabels[field] ?? field;
            // Make common Laravel messages friendlier
            const rawMsg = messages[0] ?? "";
            if (rawMsg.includes("already been taken") && field === "email") {
              return "This email is already registered — try signing in instead.";
            }
            if (rawMsg.includes("already been taken") && field === "phone") {
              return "This phone number is already registered — try signing in instead.";
            }
            return `${label}: ${rawMsg}`;
          });
          throw new Error(msgs.join(" · "));
        }

        // Fall back to message field
        const raw = data.message ?? "Registration failed. Please try again.";
        const friendly: Record<string, string> = {
          "Validation failed":
            "Some details are invalid. Check your phone number or email and try again.",
          "The email has already been taken.":
            "This email is already registered — try signing in instead.",
          "The phone has already been taken.":
            "This phone number is already registered — try signing in instead.",
          "The phone number has already been taken.":
            "This phone number is already registered — try signing in instead.",
        };
        throw new Error(friendly[raw] ?? raw);
      }

      const data = await res.json();

      localStorage.setItem("player_gender", form.gender || "male");
      localStorage.setItem("player_sport",  form.sport);

      if (data.token)              localStorage.setItem("auth_token",      data.token);
      if (data.user?.id)           localStorage.setItem("player_id",       data.user.id);
      if (data.user?.passport_token) localStorage.setItem("passport_token", data.user.passport_token);

      router.push("/login?registered=1");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      if (msg === "__waking__") setRetryCountdown(30);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (retryCountdown === null) return;
    if (retryCountdown <= 0) {
      setRetryCountdown(null);
      void handleSubmit();
      return;
    }
    retryTimerRef.current = setInterval(() => {
      setRetryCountdown((c) => (c !== null ? c - 1 : null));
    }, 1000);
    return () => {
      if (retryTimerRef.current) clearInterval(retryTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCountdown]);

  return (
    <div className="min-h-screen bg-[#f4f2ee] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#1a5c2a] rounded-2xl mb-3">
            <Dumbbell size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Join as a Player</h1>
          <p className="text-sm text-gray-500 mt-1">Get scouted. Track progress. Be discovered.</p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-6">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                s <= step ? "bg-[#1a5c2a]" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          {error && (
            error === "__waking__" ? (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                <p className="font-semibold">⏳ Server is starting up</p>
                <p className="mt-1 text-xs leading-relaxed">
                  Our server wakes up after a short rest — usually 30 seconds.
                  {retryCountdown !== null && ` Auto-retrying in ${retryCountdown}s…`}
                </p>
                <button
                  type="button"
                  onClick={() => { setRetryCountdown(null); void handleSubmit(); }}
                  className="mt-2 text-xs underline text-amber-700 hover:text-amber-900"
                >
                  Retry now
                </button>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )
          )}

          {/* ── Step 1 — Personal Info ─────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Personal details</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => set("first_name", e.target.value)}
                    placeholder="Tendai"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Surname</label>
                  <input
                    type="text"
                    value={form.surname}
                    onChange={(e) => set("surname", e.target.value)}
                    placeholder="Moyo"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  Gender <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.entries(GENDER_COACH) as [
                    "male" | "female",
                    { label: string; coach: string },
                  ][]).map(([g, cfg]) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => set("gender", g)}
                      className={`py-3 px-3 rounded-xl border text-left transition-colors ${
                        form.gender === g
                          ? "bg-[#1a5c2a] border-[#1a5c2a] text-white"
                          : "border-gray-200 text-gray-700 hover:border-[#1a5c2a]"
                      }`}
                    >
                      <div className="text-sm font-bold">{cfg.label}</div>
                      <div className={`text-xs mt-0.5 ${form.gender === g ? "text-green-200" : "text-gray-400"}`}>
                        Coach: {cfg.coach}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Your coach uses gender-specific performance norms to score your tests accurately.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Age</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => set("age", e.target.value)}
                  placeholder="e.g. 19"
                  min={5}
                  max={100}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Country</label>
                <select
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a] bg-white"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Sport selector */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  Primary Sport <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {SPORTS.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => set("sport", s.key)}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                        form.sport === s.key
                          ? "bg-[#1a5c2a] border-[#1a5c2a] text-white"
                          : "border-gray-200 text-gray-600 hover:border-[#1a5c2a]"
                      }`}
                    >
                      <span className="text-lg leading-none">{s.emoji}</span>
                      <span className="text-[10px] leading-none">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
                className="w-full bg-[#1a5c2a] disabled:bg-gray-200 disabled:text-gray-400 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── Step 2 — Account ──────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Create your account</h2>

              {/* Email / Phone toggle */}
              <div>
                <div className="flex gap-2 mb-3">
                  {(["email", "phone"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set("contactType", t)}
                      className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                        form.contactType === t
                          ? "bg-[#1a5c2a] border-[#1a5c2a] text-white"
                          : "border-gray-200 text-gray-600 hover:border-[#1a5c2a]"
                      }`}
                    >
                      {t === "email" ? "Email" : "📱 WhatsApp"}
                    </button>
                  ))}
                </div>

                {form.contactType === "email" ? (
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]"
                  />
                ) : (
                  <div>
                    <div className="flex gap-2 items-center">
                      <span className="px-3 py-2.5 bg-[#25D366] text-white text-sm font-bold rounded-xl flex-shrink-0">
                        +263
                      </span>
                      <input
                        type="tel"
                        value={form.phone.replace(/^\+?263/, "").replace(/^0/, "")}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").replace(/^0+/, "");
                          set("phone", "+263" + digits);
                        }}
                        placeholder="77 123 4567"
                        className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                      <span className="text-[#25D366]">✓</span>
                      Use your WhatsApp number — GRS will message you here after registration
                    </p>
                  </div>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="Min. 8 characters"
                    className={`w-full px-3 py-2.5 pr-10 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a] ${
                      form.password.length > 0 && form.password.length < 8
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password.length > 0 && form.password.length < 8 && (
                  <p className="text-xs text-red-500 mt-1">
                    Password needs {8 - form.password.length} more character{8 - form.password.length !== 1 ? "s" : ""} (min. 8)
                  </p>
                )}
                {form.password.length >= 8 && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle size={11} /> Password length: good
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  placeholder="Repeat password"
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a] ${
                    form.confirmPassword && form.password !== form.confirmPassword
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                />
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
                {form.confirmPassword && form.password === form.confirmPassword && form.password.length >= 8 && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle size={11} /> Passwords match
                  </p>
                )}
              </div>

              {/* Inline checklist explaining why button is still disabled */}
              {!canSubmit && (form.password.length > 0 || form.email.length > 0 || form.phone.length > 4) && (
                <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 space-y-1">
                  <p className="font-bold mb-1">To enable Create Account:</p>
                  {!contactValid && form.contactType === "email" && (
                    <p>→ Enter a valid email address (e.g. you@gmail.com)</p>
                  )}
                  {!contactValid && form.contactType === "phone" && (
                    <p>→ Enter your WhatsApp number — at least 9 digits</p>
                  )}
                  {form.password.length > 0 && form.password.length < 8 && (
                    <p>→ Password must be at least 8 characters (currently {form.password.length})</p>
                  )}
                  {form.password.length >= 8 && form.confirmPassword.length === 0 && (
                    <p>→ Confirm your password in the field below</p>
                  )}
                  {form.password.length >= 8 && form.confirmPassword.length > 0 && form.password !== form.confirmPassword && (
                    <p>→ Passwords do not match — retype your confirm password</p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  disabled={!canSubmit || isSubmitting}
                  onClick={handleSubmit}
                  className="flex-1 bg-[#1a5c2a] disabled:bg-gray-200 disabled:text-gray-400 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  {isSubmitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Creating account...</>
                  ) : (
                    <><CheckCircle size={16} /> Create Account</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-[#1a5c2a] font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}