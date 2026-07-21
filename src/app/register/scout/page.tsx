"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, CheckCircle, Search } from "lucide-react";
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
}

export default function RegisterScoutPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  });

  const set = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canProceedStep1 =
    form.first_name.trim().length >= 2 &&
    form.surname.trim().length >= 2 &&
    form.gender !== "" &&
    form.age !== "" &&
    parseInt(form.age) >= 18 &&
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
        role: "scout",
      };
      if (form.contactType === "email") {
        body.email = form.email.trim().toLowerCase();
      } else {
        body.phone = normalizePhone(form.phone.trim());
      }

      let res: Response;
      res = await fetch("/api/auth/register", {
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

      if (data.token) {
        localStorage.setItem("auth_token", data.token);
      }
      if (data.user?.id) {
        localStorage.setItem("player_id", data.user.id);
      }

      router.push("/login?registered=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2ee] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-700 rounded-2xl mb-3">
            <Search size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Join as a Scout</h1>
          <p className="text-sm text-gray-500 mt-1">Discover talent. Build shortlists. Generate reports.</p>
        </div>

        <div className="flex gap-2 mb-6">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                s <= step ? "bg-purple-700" : "bg-gray-200"
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
                  Wait a moment then tap Register again.
                </p>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )
          )}

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
                    placeholder="Farai"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Surname</label>
                  <input
                    type="text"
                    value={form.surname}
                    onChange={(e) => set("surname", e.target.value)}
                    placeholder="Dube"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
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
                          ? "bg-purple-700 border-purple-700 text-white"
                          : "border-gray-200 text-gray-700 hover:border-purple-600"
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
                  placeholder="e.g. 30"
                  min={18}
                  max={100}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Country</label>
                <select
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <button
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
                className="w-full bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
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
                          ? "bg-purple-700 border-purple-700 text-white"
                          : "border-gray-200 text-gray-600 hover:border-purple-600"
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
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
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
                      className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
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
                    className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
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
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 ${
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
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  disabled={!canSubmit || isSubmitting}
                  onClick={handleSubmit}
                  className="flex-1 bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
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
          <Link href="/login" className="text-purple-700 font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
