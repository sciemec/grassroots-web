"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, ChevronRight } from "lucide-react";
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

export default function SubscriptionPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("monthly");
  const [payMethod, setPayMethod] = useState("ecocash");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    api.get("/subscription/status").catch(() => null)
      .then((res) => { if (res) setSub(res.data); })
      .finally(() => setLoading(false));
  }, [user, router]);

  const subscribe = async () => {
    setPaying(true);
    setPayError("");
    try {
      if (payMethod === "stripe") {
        // Stripe card checkout — redirect to Stripe hosted page
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
      // EcoCash / manual payment — existing Laravel flow
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
      setPaying(false);
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
          <div className="grid grid-cols-4 gap-3">
            {[
              { id: "ecocash", label: "EcoCash",   emoji: "📱" },
              { id: "onemoney", label: "OneMoney", emoji: "💚" },
              { id: "card",    label: "Visa / MC", emoji: "💳" },
              { id: "stripe",  label: "Card (Int'l)", emoji: "🌍" },
            ].map(({ id, label, emoji }) => (
              <button key={id} onClick={() => setPayMethod(id)}
                className={`rounded-xl border p-3 text-sm font-medium transition-all ${
                  payMethod === id ? "border-primary bg-primary/5" : "border-muted hover:bg-muted"
                }`}>
                <span className="text-xl">{emoji}</span>
                <p className="mt-1 text-xs">{label}</p>
              </button>
            ))}
          </div>
          {payMethod === "stripe" && (
            <p className="mt-2 text-xs text-muted-foreground">
              Secure card payment via Stripe. You will be redirected to complete payment.
            </p>
          )}
        </div>

        {payError && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{payError}</div>
        )}

        <button onClick={subscribe} disabled={paying || sub?.is_active}
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
