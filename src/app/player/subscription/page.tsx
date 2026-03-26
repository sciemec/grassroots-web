"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, ChevronRight, Smartphone } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

interface SubStatus {
  plan_type: string | null;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

const PLANS = [
  {
    id: "weekly",
    label: "Weekly",
    price: "USD $1.50",
    zim: "RTGS $500",
    period: "per week",
    features: ["Full drill library", "AI Coach (unlimited)", "Session tracking", "Scout visibility"],
    popular: false,
  },
  {
    id: "monthly",
    label: "Monthly",
    price: "USD $5",
    zim: "RTGS $1,500",
    period: "per month",
    features: ["Everything in Weekly", "Training plan generator", "Injury risk analysis", "Progress charts", "PDF reports"],
    popular: true,
  },
  {
    id: "3-month",
    label: "3 Months",
    price: "USD $12",
    zim: "RTGS $3,600",
    period: "per 3 months",
    features: ["Everything in Monthly", "Priority AI Coach", "Video technique review", "Scout reports"],
    popular: false,
  },
];

function SubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("monthly");
  const [payMethod, setPayMethod] = useState("ecocash");
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [stripeSuccess, setStripeSuccess] = useState(false);
  const [pollUrl, setPollUrl] = useState<string | null>(null);
  const [pollStatus, setPollStatus] = useState<"waiting" | "paid" | "failed" | null>(null);
  const emailSentRef = useRef(false);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    api.get("/subscription/status").catch(() => null)
      .then((res) => { if (res) setSub(res.data); })
      .finally(() => setLoading(false));
  }, [user, router]);

  // Stripe redirect back — send confirmation email once
  useEffect(() => {
    if (searchParams.get("success") === "1" && user?.email && !emailSentRef.current) {
      emailSentRef.current = true;
      setStripeSuccess(true);
      const plan = searchParams.get("plan") ?? "monthly";
      fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: user.email,
          template: "subscription_confirmed",
          name: user.name ?? user.email,
          plan,
        }),
      }).catch(() => null); // fire-and-forget — don't block UI on email failure
    }
  }, [searchParams, user]);

  // Poll Paynow every 3 seconds after initiating a mobile payment
  useEffect(() => {
    if (!pollUrl) return;
    const interval = setInterval(async () => {
      try {
        const res  = await fetch(`/api/payments/paynow/status?pollUrl=${encodeURIComponent(pollUrl)}`);
        const data = await res.json() as { paid: boolean; status: string; paynow_ref?: string };
        if (data.paid) {
          clearInterval(interval);
          setPollStatus("paid");
          setPollUrl(null);
          // Activate on Laravel
          await api.post("/subscription/subscribe", {
            plan_type: selected,
            payment_method: payMethod,
            reference_number: data.paynow_ref ?? `WEB-${Date.now()}`,
          }).catch(() => null);
          const statusRes = await api.get("/subscription/status").catch(() => null);
          if (statusRes) setSub(statusRes.data);
          setPaying(false);
        } else if (data.status === "cancelled" || data.status === "disputed") {
          clearInterval(interval);
          setPollStatus("failed");
          setPollUrl(null);
          setPayError("Payment was cancelled. Please try again.");
          setPaying(false);
        }
      } catch { /* keep polling */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [pollUrl, selected, payMethod]);

  const subscribe = async () => {
    setPaying(true);
    setPayError("");
    setPollStatus(null);
    try {
      if (payMethod === "stripe") {
        const res = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: selected, user_id: user?.id, email: user?.email }),
        });
        const data = await res.json() as { url?: string; error?: string };
        if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout failed");
        window.location.href = data.url;
        return;
      }

      // Mobile payments — real Paynow integration
      if (["ecocash", "innbucks", "onemoney"].includes(payMethod)) {
        const digits = phone.replace(/\D/g, "");
        if (digits.length < 9) {
          setPayError("Please enter your full phone number (e.g. 0771 234 567).");
          setPaying(false);
          return;
        }
        const res  = await fetch("/api/payments/paynow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: selected, phone, method: payMethod, email: user?.email }),
        });
        const data = await res.json() as { poll_url?: string; error?: string };
        if (!res.ok || !data.poll_url) throw new Error(data.error ?? "Could not initiate payment.");
        setPollUrl(data.poll_url);
        setPollStatus("waiting");
        return; // keep paying=true while polling
      }

      // Card — fallback to Laravel
      await api.post("/subscription/subscribe", {
        plan_type: selected,
        payment_method: payMethod,
        reference_number: `WEB-${Date.now()}`,
      });
      const res = await api.get("/subscription/status");
      setSub(res.data);
    } catch (e: unknown) {
      const msg = e instanceof Error
        ? e.message
        : (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPayError(msg ?? "Payment failed. Please try again.");
    } finally {
      if (!pollUrl) setPaying(false);
    }
  };

  const cancel = async () => {
    if (!confirm("Cancel your subscription?")) return;
    try {
      await api.post("/subscription/cancel");
      const res = await api.get("/subscription/status");
      setSub(res.data);
    } catch {}
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Subscription</h1>
            <p className="text-sm text-muted-foreground">Unlock premium features</p>
          </div>
        </div>

        {/* Stripe payment success banner */}
        {stripeSuccess && (
          <div className="mb-6 rounded-xl border border-green-500/40 bg-green-500/10 px-5 py-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-700">Payment successful!</p>
              <p className="text-xs text-green-600">Your subscription is now active. A confirmation has been sent to {user?.email}.</p>
            </div>
          </div>
        )}

        {/* Current status */}
        {!loading && sub?.is_active && (
          <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-semibold text-green-700">Active — {sub.plan_type?.replace("-", " ")} plan</p>
                  <p className="text-xs text-green-600">
                    Renews: {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString("en-ZW", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                  </p>
                </div>
              </div>
              <button onClick={cancel} className="text-xs text-muted-foreground hover:text-destructive underline">Cancel</button>
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <button key={plan.id} onClick={() => setSelected(plan.id)}
              className={`relative rounded-2xl border-2 p-5 text-left transition-all ${
                selected === plan.id ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground"
              }`}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
                  Most popular
                </span>
              )}
              <h3 className="font-bold">{plan.label}</h3>
              <p className="mt-1 text-2xl font-bold">{plan.price}</p>
              <p className="text-xs text-muted-foreground">{plan.zim} · {plan.period}</p>
              <ul className="mt-4 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-500" /> {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {/* Payment method */}
        <div className="mb-6 rounded-xl border bg-card p-5">
          <h3 className="mb-3 font-semibold">Payment Method</h3>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {[
              { id: "ecocash",  label: "EcoCash",     emoji: "📱" },
              { id: "innbucks", label: "InnBucks",     emoji: "💛" },
              { id: "onemoney", label: "OneMoney",     emoji: "💚" },
              { id: "card",     label: "Visa / MC",    emoji: "💳" },
              { id: "stripe",   label: "Card (Int'l)", emoji: "🌍" },
            ].map(({ id, label, emoji }) => (
              <button key={id} onClick={() => { setPayMethod(id); setPayError(""); }}
                className={`rounded-xl border p-3 text-sm font-medium transition-all ${
                  payMethod === id ? "border-primary bg-primary/5" : "border-muted hover:bg-muted"
                }`}>
                <span className="text-xl">{emoji}</span>
                <p className="mt-1 text-xs">{label}</p>
              </button>
            ))}
          </div>

          {/* Phone input for mobile payments */}
          {["ecocash", "innbucks", "onemoney"].includes(payMethod) && (
            <div className="mt-4">
              <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Smartphone className="h-3.5 w-3.5" />
                {payMethod === "ecocash" ? "EcoCash" : payMethod === "innbucks" ? "InnBucks" : "OneMoney"} number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0771 234 567"
                className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                You will receive a prompt on your phone to approve the payment.
              </p>
            </div>
          )}

          {payMethod === "stripe" && (
            <p className="mt-3 text-xs text-muted-foreground">
              Secure card payment via Stripe. You will be redirected to complete payment.
            </p>
          )}
        </div>

        {/* Paynow waiting state */}
        {pollStatus === "waiting" && (
          <div className="mb-4 rounded-xl border border-[#f0b429]/30 bg-[#f0b429]/5 px-5 py-4">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="h-5 w-5 animate-spin text-[#f0b429]" />
              <p className="font-semibold text-sm">Check your phone</p>
            </div>
            <p className="text-xs text-muted-foreground">
              A payment prompt has been sent to <strong>{phone}</strong>. Open your{" "}
              {payMethod === "ecocash" ? "EcoCash" : payMethod === "innbucks" ? "InnBucks" : "OneMoney"} app or dial the USSD code to approve.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Waiting for confirmation — this page will update automatically.</p>
          </div>
        )}

        {/* Paynow paid */}
        {pollStatus === "paid" && (
          <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm text-green-700">Payment received!</p>
              <p className="text-xs text-green-600">Your subscription is now active.</p>
            </div>
          </div>
        )}

        {payError && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{payError}</div>
        )}

        <button onClick={subscribe} disabled={paying || sub?.is_active || pollStatus === "waiting"}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {paying ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Processing payment…</>
          ) : sub?.is_active ? (
            <><CheckCircle2 className="h-4 w-4" /> Already subscribed</>
          ) : (
            <><CreditCard className="h-4 w-4" /> Subscribe with {payMethod}</>
          )}
        </button>

        {/* Transaction history */}
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Transaction History</h3>
            <Link href="/player/subscription/transactions" className="flex items-center gap-1 text-xs text-primary hover:underline">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">Your payment history will appear here</p>
        </div>
      </main>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense>
      <SubscriptionContent />
    </Suspense>
  );
}
