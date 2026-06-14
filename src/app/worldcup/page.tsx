"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, Trophy, Star, Users, Tv } from "lucide-react";
import { normalizePhone } from "@/lib/phone-normalize";

const COUNTRIES = [
  "Zimbabwe","Afghanistan","Albania","Algeria","Angola","Argentina","Armenia","Australia",
  "Austria","Azerbaijan","Bahrain","Bangladesh","Belarus","Belgium","Benin","Bolivia",
  "Bosnia and Herzegovina","Botswana","Brazil","Bulgaria","Burkina Faso","Burundi",
  "Cambodia","Cameroon","Canada","Chad","Chile","China","Colombia","Congo","Costa Rica",
  "Croatia","Cuba","Czech Republic","Denmark","DR Congo","Ecuador","Egypt","El Salvador",
  "Eritrea","Estonia","Ethiopia","Finland","France","Gabon","Gambia","Georgia","Germany",
  "Ghana","Greece","Guatemala","Guinea","Haiti","Honduras","Hungary","India","Indonesia",
  "Iran","Iraq","Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan",
  "Kazakhstan","Kenya","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia",
  "Libya","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Mali","Malta",
  "Mauritania","Mauritius","Mexico","Moldova","Mongolia","Morocco","Mozambique","Myanmar",
  "Namibia","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea",
  "Norway","Oman","Pakistan","Palestine","Panama","Paraguay","Peru","Philippines","Poland",
  "Portugal","Qatar","Romania","Russia","Rwanda","Saudi Arabia","Senegal","Serbia",
  "Sierra Leone","Singapore","Slovakia","Slovenia","Somalia","South Africa","South Korea",
  "South Sudan","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Syria","Taiwan",
  "Tajikistan","Tanzania","Thailand","Togo","Tunisia","Turkey","Turkmenistan","Uganda",
  "Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan",
  "Venezuela","Vietnam","Yemen","Zambia","Other",
];

const PERKS = [
  { icon: Star,  text: "Vote for Player of the Tournament" },
  { icon: Tv,    text: "Live match updates via WhatsApp" },
  { icon: Users, text: "Follow your favourite local players" },
];

export default function WorldCupPage() {
  const router = useRouter();

  const [contactType, setContactType] = useState<"phone" | "email">("phone");
  const [fullName,    setFullName]    = useState("");
  const [country,    setCountry]     = useState("Zimbabwe");
  const [email,      setEmail]       = useState("");
  const [phone,      setPhone]       = useState("");
  const [password,   setPassword]    = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,      setError]       = useState<string | null>(null);

  const contactValid =
    contactType === "email"
      ? email.includes("@") && email.includes(".")
      : phone.replace(/\D/g, "").length >= 9;

  const canSubmit =
    fullName.trim().length >= 2 &&
    country !== "" &&
    contactValid &&
    password.length >= 6;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const parts      = fullName.trim().split(" ");
      const first_name = parts[0];
      const surname    = parts.slice(1).join(" ") || parts[0];

      const body: Record<string, unknown> = {
        first_name,
        surname,
        name:                  fullName.trim(),
        country,
        password,
        password_confirmation: password,
        role:                  "fan",
      };

      if (contactType === "email") {
        body.email = email.trim().toLowerCase();
      } else {
        body.phone = normalizePhone(phone.trim());
      }

      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), 90_000);
      let res: Response;
      try {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
          signal:  controller.signal,
        });
      } catch (fetchErr) {
        if ((fetchErr as { name?: string }).name === "AbortError") {
          throw new Error("Server is waking up — please try again in 30 seconds.");
        }
        throw new Error("Cannot reach server. Check your connection and try again.");
      } finally {
        clearTimeout(timeout);
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          data.message ||
          (data.errors ? Object.values(data.errors).flat().join(" ") : null) ||
          "Registration failed. Please try again.";
        throw new Error(msg);
      }

      const data = await res.json();
      if (data.token)   localStorage.setItem("auth_token", data.token);
      if (data.user?.id) localStorage.setItem("player_id", data.user.id);

      router.push("/login?registered=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a1a0f" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="text-center pt-14 pb-10 px-4">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
          style={{ backgroundColor: "#1a3a20", border: "1px solid rgba(240,180,41,0.3)" }}
        >
          <Trophy size={32} style={{ color: "#f0b429" }} />
        </div>
        <div
          className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-3"
          style={{ backgroundColor: "rgba(240,180,41,0.15)", color: "#f0b429" }}
        >
          GRS World Cup
        </div>
        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white mb-2">
          Zimbabwe&apos;s<br />Grassroots Cup
        </h1>
        <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>
          Register as a fan. Follow every match. Discover the next generation of talent.
        </p>

        {/* Perks row */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          {PERKS.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }}
            >
              <Icon size={14} style={{ color: "#f0b429" }} />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ── Registration card ─────────────────────────────────────────────── */}
      <div className="flex justify-center px-4 pb-20">
        <div className="w-full max-w-md">
          <div
            className="rounded-2xl p-6"
            style={{ backgroundColor: "#111f14", border: "1px solid rgba(240,180,41,0.15)" }}
          >
            <h2 className="text-lg font-black text-white mb-1">Join as a Fan</h2>
            <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Takes 30 seconds. No app download needed.
            </p>

            {error && (
              <div
                className="mb-4 p-3 rounded-xl text-sm"
                style={{
                  backgroundColor: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#fca5a5",
                }}
              >
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Full name */}
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Tendai Musona"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  style={{ backgroundColor: "#1a3a20", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  style={{ backgroundColor: "#1a3a20", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c} style={{ backgroundColor: "#1a3a20" }}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact toggle */}
              <div>
                <div className="flex gap-2 mb-3">
                  {(["phone", "email"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setContactType(t)}
                      className="flex-1 py-2 rounded-xl border text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: contactType === t ? "#f0b429" : "transparent",
                        borderColor:     contactType === t ? "#f0b429" : "rgba(255,255,255,0.12)",
                        color:           contactType === t ? "#0a1a0f" : "rgba(255,255,255,0.5)",
                      }}
                    >
                      {t === "phone" ? "Phone Number" : "Email"}
                    </button>
                  ))}
                </div>

                {contactType === "phone" ? (
                  <>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+263 77 123 4567"
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      style={{ backgroundColor: "#1a3a20", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                    <p className="text-xs mt-1.5" style={{ color: "rgba(240,180,41,0.6)" }}>
                      Use your WhatsApp number — your account connects automatically
                    </p>
                  </>
                ) : (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    style={{ backgroundColor: "#1a3a20", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  style={{ backgroundColor: "#1a3a20", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>

              {/* Submit */}
              <button
                disabled={!canSubmit || isSubmitting}
                onClick={handleSubmit}
                className="w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                style={{
                  backgroundColor: canSubmit && !isSubmitting ? "#f0b429" : "rgba(255,255,255,0.07)",
                  color:           canSubmit && !isSubmitting ? "#0a1a0f" : "rgba(255,255,255,0.25)",
                  cursor:          canSubmit && !isSubmitting ? "pointer"  : "not-allowed",
                }}
              >
                {isSubmitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Creating account...</>
                ) : (
                  <><CheckCircle size={16} /> Join the Community</>
                )}
              </button>
            </div>

            <p className="text-center text-xs mt-5" style={{ color: "rgba(255,255,255,0.25)" }}>
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold hover:underline"
                style={{ color: "rgba(240,180,41,0.6)" }}
              >
                Sign in
              </Link>
            </p>
          </div>

          <p className="text-center text-xs mt-4" style={{ color: "rgba(255,255,255,0.2)" }}>
            <Link href="/register" className="hover:underline" style={{ color: "rgba(255,255,255,0.3)" }}>
              Not a fan? Register as Player, Coach or Scout
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
