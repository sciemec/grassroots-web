"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/firebase";
import api from "@/lib/api";
import { useAuthStore, roleHomePath } from "@/lib/auth-store";

function LoginForm() {
  const router = useRouter();
  const { user, token, setAuth } = useAuthStore();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // Show a spinner while navigating to the hub — prevents the black-page gap
  if (token && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-950 via-green-900 to-emerald-800">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-400 border-t-transparent" />
          <p className="text-sm text-green-300">Redirecting to your hub…</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!email.trim()) { setError("Nyora email yako. / Please enter your email."); return; }
    if (!password)     { setError("Nyora password yako. / Please enter your password."); return; }
    setLoading(true); setError("");

    const normalizedEmail = email.trim().toLowerCase();

    type RawUser = { id: string | number; name?: string; first_name?: string; surname?: string; email: string; role: string; sport?: string; province?: string; is_pro?: boolean };

    const applySession = (t: string, u: RawUser) => {
      setAuth(t, {
        id: String(u.id),
        name: u.name ?? `${u.first_name ?? ""} ${u.surname ?? ""}`.trim(),
        email: u.email,
        role: u.role as import("@/lib/auth-store").UserRole,
        token: t,
        sport: u.sport ?? undefined,
        province: u.province ?? undefined,
        is_pro: u.is_pro ?? false,
      });
      router.replace(roleHomePath(u.role as import("@/lib/auth-store").UserRole));
    };

    // ── Direct Laravel login — the reliable fallback that always works ──────
    const tryLaravelLogin = async () => {
      const res = await api.post("/auth/login", { email: normalizedEmail, password });
      applySession(res.data.token, res.data.user);
    };

    const handleLaravelError = (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 422) {
        setError("Email or password is incorrect");
      } else if (status === 403) {
        setError("Akaunti yako yakabviswa. / Your account has been suspended.");
      } else if (!status) {
        setError("Hapana internet. Tarisa connection yako. / Check your internet connection.");
      } else {
        setError("Senzadza. Edza zvakare. / Something went wrong. Please try again.");
      }
      setLoading(false);
    };

    try {
      // Step 1 — Try Firebase auth first
      let firebaseIdToken: string | null = null;
      try {
        const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        // Block unverified accounts before proceeding
        if (!credential.user.emailVerified) {
          await signOut(auth);
          router.replace(`/verify-email?email=${encodeURIComponent(normalizedEmail)}`);
          return;
        }
        firebaseIdToken = await credential.user.getIdToken();
      } catch (fbErr: unknown) {
        const fbCode = (fbErr as { code?: string })?.code ?? "";
        // Definitive wrong-password — don't bother trying Laravel
        if (fbCode === "auth/invalid-credential" || fbCode === "auth/wrong-password") {
          setError("Email or password is incorrect");
          setLoading(false);
          return;
        }
        // Any other Firebase error (user-not-found, unauthorized-domain, network, etc.)
        // → skip Firebase, go straight to direct Laravel login
        firebaseIdToken = null;
      }

      // Step 2 — If Firebase gave us a token, try the firebase-email exchange endpoint
      if (firebaseIdToken) {
        try {
          const res = await api.post("/auth/firebase-email", { id_token: firebaseIdToken });
          applySession(res.data.token, res.data.user);
          return;
        } catch {
          // /auth/firebase-email not on backend yet — fall through to direct login
        }
      }

      // Step 3 — Direct Laravel login (works for ALL users regardless of Firebase state)
      try {
        await tryLaravelLogin();
        // Silently register in Firebase for next time (best-effort, non-blocking)
        if (!firebaseIdToken) {
          createUserWithEmailAndPassword(auth, normalizedEmail, password).catch(() => {});
        }
      } catch (laravelErr) {
        handleLaravelError(laravelErr);
      }

    } catch {
      setError("Senzadza. Edza zvakare. / Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      // Step 1 — Firebase popup
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      type RawUser = { id: string | number; name?: string; first_name?: string; surname?: string; email: string; role: string; sport?: string; province?: string; is_pro?: boolean };

      const applyGoogleSession = (t: string, u: RawUser) => {
        setAuth(t, {
          id: String(u.id),
          name: u.name ?? `${u.first_name ?? ""} ${u.surname ?? ""}`.trim(),
          email: u.email,
          role: u.role as import("@/lib/auth-store").UserRole,
          token: t,
          sport: u.sport ?? undefined,
          province: u.province ?? undefined,
          is_pro: u.is_pro ?? false,
        });
        router.replace(roleHomePath(u.role as import("@/lib/auth-store").UserRole));
      };

      // Step 2 — Try dedicated Google endpoint
      try {
        const res = await api.post("/auth/google", { id_token: idToken });
        applyGoogleSession(res.data.token, res.data.user);
        return;
      } catch (googleErr: unknown) {
        const status = (googleErr as { response?: { status?: number } })?.response?.status;
        if (status === 403) {
          setError("Akaunti yako yakabviswa. / Your account has been suspended.");
          setLoading(false);
          return;
        }
        if (status === 422) {
          setError("Google sign-in failed. Server could not verify token — check FIREBASE_WEB_API_KEY on Render.");
          setLoading(false);
          return;
        }
        // 404 / 500 / network — endpoint not ready yet, try firebase-email fallback
      }

      // Step 3 — Fallback: firebase-email exchange (works for any Firebase-verified user)
      try {
        const res = await api.post("/auth/firebase-email", { id_token: idToken });
        applyGoogleSession(res.data.token, res.data.user);
        return;
      } catch {
        // Neither endpoint is live yet
      }

      // Step 4 — Both backend endpoints failed: show helpful message
      setError("Google sign-in reached Google OK, but our server is not responding. Please use email login below, or try again in 30 seconds.");
      setLoading(false);

    } catch (err: unknown) {
      setLoading(false);
      const fbCode = (err as { code?: string })?.code ?? "";
      if (fbCode === "auth/popup-closed-by-user" || fbCode === "auth/cancelled-popup-request") {
        return; // User cancelled — no error
      }
      if (fbCode === "auth/unauthorized-domain") {
        setError("This domain is not authorised for Google sign-in. Please use email login below.");
      } else if (fbCode === "auth/popup-blocked") {
        setError("Popup was blocked by your browser. Allow popups for this site, then try again.");
      } else {
        setError("Google sign-in failed. Please use email login below.");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_v2.png" alt="Grassroots Sport" width={64} height={64} className="mx-auto mb-4" />
          </Link>
          <h1 className="text-3xl font-black text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-green-300">Sign in to your account</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm space-y-4">

          {/* ── PRIMARY: Google Sign-in ── */}
          <button
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white py-3.5 text-sm font-semibold text-gray-800 hover:bg-gray-100 transition-colors shadow-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-green-400/50">or sign in with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* ── SECONDARY: Email / Password ── */}
          <div>
            <label className="mb-2 block text-sm font-medium text-green-200">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-400/70" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                autoComplete="email"
                className="w-full rounded-xl border border-white/20 bg-white/10 pl-10 pr-4 py-3 text-white placeholder-green-400/50 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-green-200">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-400/70" />
              <input
                type={showPw ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/20 bg-white/10 pl-10 pr-10 py-3 text-white placeholder-green-400/50 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 text-sm"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400/50 hover:text-green-300">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2.5 text-center text-sm text-orange-300">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Sign in with email →"}
          </button>

          <p className="text-center text-xs text-green-400/60">
            <Link href="/forgot-password" className="hover:text-green-300 transition-colors">Forgot password?</Link>
          </p>

        </div>

        <p className="mt-6 text-center text-sm text-green-400">
          New to Grassroots Sport?{" "}
          <Link href="/register" className="font-semibold text-white hover:underline">Create account</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}