"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ChevronLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore, roleHomePath, UserRole } from "@/lib/auth-store";
import { SPORT_MAP, SportKey } from "@/config/sports";

const PROVINCES = [
  "Harare","Bulawayo","Manicaland","Mashonaland Central",
  "Mashonaland East","Mashonaland West","Masvingo",
  "Matabeleland North","Matabeleland South","Midlands",
];

const ROLE_META: Record<string, { label: string; icon: string; gradient: string }> = {
  player: { label: "Player",  icon: "🏃", gradient: "from-green-600 to-emerald-500" },
  coach:  { label: "Coach",   icon: "📋", gradient: "from-blue-600 to-blue-500"    },
  scout:  { label: "Scout",   icon: "🔍", gradient: "from-purple-600 to-purple-500" },
  fan:    { label: "Fan",     icon: "🎉", gradient: "from-amber-600 to-orange-500"  },
};

const ACCENT: Record<string, { ring: string; btn: string; bg: string; text: string }> = {
  green:  { ring: "focus:border-green-400 focus:ring-green-400",   btn: "bg-green-500 hover:bg-green-400",   bg: "from-green-950 via-green-900 to-emerald-800",  text: "text-green-300" },
  blue:   { ring: "focus:border-blue-400 focus:ring-blue-400",     btn: "bg-blue-500 hover:bg-blue-400",     bg: "from-blue-950 via-blue-900 to-indigo-900",     text: "text-blue-300"  },
  purple: { ring: "focus:border-purple-400 focus:ring-purple-400", btn: "bg-purple-500 hover:bg-purple-400", bg: "from-purple-950 via-purple-900 to-indigo-900", text: "text-purple-300" },
  amber:  { ring: "focus:border-amber-400 focus:ring-amber-400",   btn: "bg-amber-500 hover:bg-amber-400",   bg: "from-amber-950 via-orange-900 to-red-900",     text: "text-amber-300"  },
};

interface Props {
  role: UserRole;
  sport: SportKey;
  accentColor: "green" | "blue" | "purple" | "amber";
}

export function RegisterForm({ role, sport, accentColor }: Props) {
  const router  = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const sportCfg = SPORT_MAP[sport] ?? SPORT_MAP["football"];
  const roleMeta = ROLE_META[role];
  const accent   = ACCENT[accentColor];

  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "",
    password: "", password_confirmation: "", province: "",
  });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const set = (k: keyof typeof form, v: string) => { setForm((f) => ({ ...f, [k]: v })); setError(""); };

  const validate = (): string => {
    if (!form.first_name.trim())           return "First name is required.";
    if (!form.last_name.trim())            return "Last name is required.";
    if (!form.email.trim())                return "Email address is required.";
    if (!/\S+@\S+\.\S+/.test(form.email)) return "Please enter a valid email address.";
    if (!form.password)                    return "Password is required.";
    if (form.password.length < 8)          return "Password must be at least 8 characters.";
    if (form.password !== form.password_confirmation) return "Passwords do not match. / Mapassword haafanani.";
    if (!form.province)                    return "Please select your province.";
    return "";
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError("");

    try {
      const res = await api.post("/auth/register", {
        first_name: form.first_name.trim(),
        last_name:  form.last_name.trim(),
        email:      form.email.trim().toLowerCase(),
        password:   form.password,
        password_confirmation: form.password_confirmation,
        role,
        province: form.province,
        sport,
      });
      const { token: t, user: u } = res.data;
      setAuth(t, {
        id: String(u.id),
        name: u.name ?? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
        email: u.email,
        role: u.role as UserRole,
        token: t,
      });
      router.replace(roleHomePath(u.role as UserRole));

      // Fire welcome email — non-blocking, don't await
      fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: form.email.trim().toLowerCase(),
          type: "welcome",
          data: { name: form.first_name.trim(), role: roleMeta.label },
        }),
      }).catch(() => null);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.status;
      const data   = (e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;

      if (status === 422 && data?.errors) {
        const first = Object.values(data.errors).flat()[0];
        setError(first ?? "Please check your details and try again.");
      } else if (status === 409 || (data?.message ?? "").toLowerCase().includes("already")) {
        setError("An account with this email already exists. / Akaunti yakatova iripomo. Please sign in.");
      } else if (!status) {
        setError("Hapana internet. Tarisa connection yako. / Check your internet connection.");
      } else {
        setError(data?.message ?? "Senzadza. Edza zvakare. / Something went wrong. Please try again.");
      }
      setLoading(false);
    }
  };

  const inputCls = `w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:ring-1 ${accent.ring}`;
  const selectCls = `w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:ring-1 ${accent.ring}`;

  return (
    <div className={`flex min-h-screen items-start justify-center bg-gradient-to-br ${accent.bg} px-4 py-10`}>
      <div className="w-full max-w-md">

        {/* Back + logo */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/register" className={`flex items-center gap-1.5 text-sm ${accent.text} hover:text-white transition-colors`}>
            <ChevronLeft className="h-4 w-4" /> Change role
          </Link>
          <Link href="/" className="flex items-center gap-2 text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_v2.png" alt="Grassroots Sport" width={28} height={28} />
            <span className="font-bold text-sm">Grassroots Sport</span>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${roleMeta.gradient} text-2xl shadow-lg`}>
            {roleMeta.icon}
          </div>
          <div>
            <h1 className="text-xl font-black text-white">{sportCfg.label} — {roleMeta.label} Registration</h1>
            <p className={`text-xs ${accent.text}`}>{sportCfg.governingBody}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm space-y-4">

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`mb-1 block text-xs font-medium ${accent.text}`}>First name</label>
              <input type="text" placeholder="Rudo" value={form.first_name} onChange={(e) => set("first_name", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={`mb-1 block text-xs font-medium ${accent.text}`}>Last name</label>
              <input type="text" placeholder="Chirwa" value={form.last_name} onChange={(e) => set("last_name", e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className={`mb-1 block text-xs font-medium ${accent.text}`}>Email address</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" className={inputCls} />
          </div>

          {/* Password */}
          <div>
            <label className={`mb-1 block text-xs font-medium ${accent.text}`}>Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                autoComplete="new-password"
                className={`${inputCls} pr-10`}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className={`mb-1 block text-xs font-medium ${accent.text}`}>Confirm password</label>
            <input
              type={showPw ? "text" : "password"}
              placeholder="Repeat your password"
              value={form.password_confirmation}
              onChange={(e) => set("password_confirmation", e.target.value)}
              autoComplete="new-password"
              className={inputCls}
            />
          </div>

          {/* Province */}
          <div>
            <label className={`mb-1 block text-xs font-medium ${accent.text}`}>Province</label>
            <select value={form.province} onChange={(e) => set("province", e.target.value)} className={selectCls}>
              <option value="">Select your province…</option>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Sport (read-only display) */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="text-xl">{sportCfg.emoji}</span>
            <div>
              <p className="text-xs font-medium text-white">{sportCfg.label}</p>
              <p className={`text-[11px] ${accent.text}`}>Sport selected</p>
            </div>
            <Link href="/register" className={`ml-auto text-xs ${accent.text} hover:text-white underline`}>Change</Link>
          </div>

          {error && (
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2.5 text-sm text-orange-300">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex w-full items-center justify-center gap-2 rounded-xl ${accent.btn} py-3 text-sm font-bold text-white disabled:opacity-50 transition-colors`}
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
              : <><CheckCircle2 className="h-4 w-4" /> Create account</>
            }
          </button>
        </div>

        <p className={`mt-5 text-center text-sm ${accent.text}`}>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-white hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
