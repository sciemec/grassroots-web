"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore, roleHomePath } from "@/lib/auth-store";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      const res = await api.post("/auth/login", data);
      const { token, user } = res.data;
      login({ id: user.id, name: user.name, email: user.email, role: user.role, token });
      router.push(roleHomePath(user.role));
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Login failed. Check your credentials.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-950 via-green-900 to-emerald-800">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-white">
            <span className="text-3xl">⚽</span>
            <span className="text-xl font-bold tracking-tight">Grassroots Sport</span>
          </Link>
          <p className="mt-2 text-sm text-green-300">Pro Platform — Sign in to continue</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
          <h1 className="mb-1 text-2xl font-bold text-white">Welcome back</h1>
          <p className="mb-6 text-sm text-green-300">Enter your credentials to access your hub</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-green-100">Email</label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-green-400/60 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-green-100">Password</label>
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-green-400/60 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
              />
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-300 border border-red-500/30">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-400 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/forgot-password" className="text-xs text-green-400 hover:text-green-300 transition-colors">
              Forgot your password?
            </Link>
          </div>

          <p className="mt-4 text-center text-xs text-green-400">
            Don&apos;t have an account?{" "}
            <Link href="/#pricing" className="font-medium text-green-300 hover:text-white transition-colors">
              Get started free
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-green-500">
          Works for Players · Coaches · Scouts · Fans · Admins
        </p>
      </div>
    </div>
  );
}
