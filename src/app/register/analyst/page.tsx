"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, CheckCircle, BarChart2 } from "lucide-react";
import { normalizePhone } from "@/lib/phone-normalize";
import { COUNTRIES } from "@/lib/countries";

interface FormData {
  first_name: string;
  surname: string;
  gender: "male" | "female" | "";
  age: string;
  country: string;
  contactType: "email" | "phone";
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  organisation: string;
  analyst_type: string;
  experience_years: string;
}

const ANALYST_TYPES = [
  "Performance Analyst",
  "Video Analyst",
  "Data Scientist",
  "Tactical Analyst",
  "Scout / Intelligence",
  "Academic / Research",
  "Freelance",
  "Other",
];

export default function RegisterAnalystPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [form, setForm] = useState<FormData>({
    first_name: "",
    surname: "",
    gender: "",
    age: "",
    country: "Zimbabwe",
    contactType: "email",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    organisation: "",
    analyst_type: "",
    experience_years: "",
  });

  const set = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Step validation
  const canProceedStep1 =
    form.first_name.trim().length >= 2 &&
    form.surname.trim().length >= 2 &&
    form.gender !== "" &&
    form.age !== "" &&
    parseInt(form.age) >= 18 &&
    parseInt(form.age) <= 100 &&
    form.country !== "";

  const canProceedStep2 =
    form.analyst_type !== "" &&
    form.experience_years !== "";

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
        first_name: form.first_name.trim(),
        surname: form.surname.trim(),
        name: `${form.first_name.trim()} ${form.surname.trim()}`,
        gender: form.gender,
        age: parseInt(form.age),
        country: form.country,
        password: form.password,
        password_confirmation: form.confirmPassword,
        role: "analyst",
        organisation: form.organisation.trim() || null,
        analyst_type: form.analyst_type,
        experience_years: parseInt(form.experience_years) || 0,
      };

      if (form.contactType === "email") {
        body.email = form.email.trim().toLowerCase();
      } else {
        body.phone = normalizePhone(form.phone.trim());
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        if (res.status >= 500) throw new Error("__waking__");
        const data = await res.json().catch(() => ({}));
        const msg =
          data.message ||
          (data.errors ? Object.values(data.errors).flat().join(" ") : null) ||
          "Registration failed. Please try again.";
        throw new Error(msg);
      }

      const data = await res.json();
      if (data.token) localStorage.setItem("auth_token", data.token);
      if (data.user?.id) localStorage.setItem("player_id", data.user.id);

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

  const TOTAL_STEPS = 3;

  return (
    <div className="min-h-screen bg-[#f4f2ee] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-sky-700 rounded-2xl mb-3">
            <BarChart2 size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Join as an Analyst</h1>
          <p className="text-sm text-gray-500 mt-1">xG models. Tactical AI. Pitch intelligence.</p>
        </div>

        {/* Step progress bar */}
        <div className="flex gap-2 mb-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i + 1 <= step ? "bg-sky-700" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          {/* Error banner */}
          {error && (
            error === "__waking__" ? (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                <p className="font-semibold">Server is starting up</p>
                <p className="mt-1 text-xs leading-relaxed">
                  Our server wakes after a short rest — usually 30 seconds.
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

          {/* ── STEP 1 — Personal details ── */}
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
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Surname</label>
                  <input
                    type="text"
                    value={form.surname}
                    onChange={(e) => set("surname", e.target.value)}
                    placeholder="Moyo"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">Gender</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["male", "female"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => set("gender", g)}
                      className={`py-2.5 rounded-xl border text-sm font-semibold capitalize transition-colors ${
                        form.gender === g
                          ? "bg-sky-700 border-sky-700 text-white"
                          : "border-gray-200 text-gray-700 hover:border-sky-400"
                      }`}
                    >
                      {g === "male" ? "Male" : "Female"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Age</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => set("age", e.target.value)}
                  placeholder="e.g. 28"
                  min={18}
                  max={100}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Country</label>
                <select
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <button
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
                className="w-full bg-sky-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── STEP 2 — Professional details ── */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Professional details</h2>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">
                  Organisation / Club / University <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.organisation}
                  onChange={(e) => set("organisation", e.target.value)}
                  placeholder="e.g. ZIFA, Dynamos FC, UZ"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">Analyst Type *</label>
                <div className="flex flex-wrap gap-2">
                  {ANALYST_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => set("analyst_type", type)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                        form.analyst_type === type
                          ? "bg-sky-700 border-sky-700 text-white"
                          : "border-gray-200 text-gray-700 hover:border-sky-400 bg-gray-50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">Years of Experience *</label>
                <div className="flex flex-wrap gap-2">
                  {["0–1", "2–3", "4–6", "7–10", "10+"].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => set("experience_years", yr)}
                      className={`px-4 py-2 rounded-xl border text-xs font-bold transition-colors ${
                        form.experience_years === yr
                          ? "bg-sky-700 border-sky-700 text-white"
                          : "border-gray-200 text-gray-700 hover:border-sky-400 bg-gray-50"
                      }`}
                    >
                      {yr} yrs
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  disabled={!canProceedStep2}
                  onClick={() => setStep(3)}
                  className="flex-1 bg-sky-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 — Account credentials ── */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Create your account</h2>

              <div>
                <div className="flex gap-2 mb-3">
                  {(["email", "phone"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set("contactType", t)}
                      className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                        form.contactType === t
                          ? "bg-sky-700 border-sky-700 text-white"
                          : "border-gray-200 text-gray-600 hover:border-sky-400"
                      }`}
                    >
                      {t === "email" ? "Email" : "Phone Number"}
                    </button>
                  ))}
                </div>

                {form.contactType === "email" ? (
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                ) : (
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
                      className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  placeholder="Repeat password"
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                    form.confirmPassword && form.password !== form.confirmPassword
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                />
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  disabled={!canSubmit || isSubmitting}
                  onClick={handleSubmit}
                  className="flex-1 bg-sky-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
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
          <Link href="/login" className="text-sky-700 font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
