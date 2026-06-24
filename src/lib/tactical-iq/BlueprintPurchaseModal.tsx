// src/lib/tactical-iq/BlueprintPurchaseModal.tsx
'use client';

import { useState } from 'react';
import { X, Lock, CreditCard, Check, Download, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useAuthStore } from '@/lib/auth-store';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
);

interface Props {
  matchId:            string;
  matchName:          string;
  onClose:            () => void;
  onPurchaseComplete: () => void;
}

// ── Inner checkout form (rendered inside <Elements>) ─────────────────────────

function CheckoutForm({
  matchId,
  matchName,
  paymentIntentId,
  onClose,
  onPurchaseComplete,
}: {
  matchId:            string;
  matchName:          string;
  paymentIntentId:   string;
  onClose:            () => void;
  onPurchaseComplete: () => void;
}) {
  const stripe   = useStripe();
  const elements = useElements();
  const token    = useAuthStore((s) => s.token);

  const [step,       setStep]       = useState<'pay' | 'generating' | 'done'>('pay');
  const [error,      setError]      = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    // Step 1 — confirm payment with Stripe.js
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed');
      setProcessing(false);
      return;
    }

    // Step 2 — generate + download the PDF
    setStep('generating');
    try {
      const res = await fetch(`/api/world-cup/matches/${matchId}/generate-blueprint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ paymentIntentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to generate blueprint');
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `GRS-Blueprint-${matchName.replace(/\s/g, '-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      setStep('done');
      onPurchaseComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('pay');
    } finally {
      setProcessing(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto bg-green-600 rounded-full flex items-center justify-center mb-3">
          <Download size={24} className="text-white" />
        </div>
        <h3 className="text-white font-bold text-lg mb-1">Blueprint Downloaded!</h3>
        <p className="text-white/60 text-sm mb-4">Check your downloads folder for the PDF.</p>
        <button onClick={onClose} className="px-6 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold">
          Close
        </button>
      </div>
    );
  }

  if (step === 'generating') {
    return (
      <div className="text-center py-10">
        <Loader2 size={36} className="mx-auto text-amber-500 animate-spin mb-3" />
        <p className="text-white/70 text-sm">Generating your coaching blueprint…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement className="mb-4" />

      {error && (
        <div className="mb-3 p-2.5 rounded-xl text-xs bg-red-500/10 border border-red-500/25 text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={processing || !stripe}
        className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
      >
        {processing ? (
          <><Loader2 size={16} className="animate-spin" /> Processing…</>
        ) : (
          <><CreditCard size={16} /> Pay $4.99</>
        )}
      </button>
    </form>
  );
}

// ── Outer modal — creates the Payment Intent, then mounts <Elements> ─────────

export function BlueprintPurchaseModal({ matchId, matchName, onClose, onPurchaseComplete }: Props) {
  const token = useAuthStore((s) => s.token);
  const user  = useAuthStore((s) => s.user);

  const [clientSecret,     setClientSecret]     = useState<string | null>(null);
  const [paymentIntentId,  setPaymentIntentId]  = useState<string>('');
  const [loadingIntent,    setLoadingIntent]     = useState(false);
  const [error,            setError]             = useState<string | null>(null);

  const startCheckout = async () => {
    if (!user) { setError('Please log in to purchase'); return; }
    setLoadingIntent(true);
    setError(null);
    try {
      const res = await fetch(`/api/world-cup/matches/${matchId}/purchase-blueprint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not start checkout');
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoadingIntent(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
      <div className="w-full max-w-md rounded-2xl p-6 bg-[#111f14] border border-[rgba(240,180,41,0.2)] relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white">
          <X size={18} />
        </button>

        {!clientSecret ? (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-amber-600 rounded-full flex items-center justify-center mb-3">
                <Lock size={24} className="text-white" />
              </div>
              <h2 className="text-xl font-black text-white">Unlock Coaching Blueprint</h2>
              <p className="text-sm text-white/60 mt-1">5-day training plan for {matchName}</p>
            </div>

            <div className="space-y-3 mb-6">
              {[
                'Full 5-day training plan with drill diagrams',
                'Age-group adaptations (U8 to Adult)',
                'Instant PDF download',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-white/80 bg-white/5 p-3 rounded-xl">
                  <Check size={16} className="text-amber-500 shrink-0" />
                  {item}
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-2.5 rounded-xl text-xs bg-red-500/10 border border-red-500/25 text-red-300">
                {error}
              </div>
            )}

            <button
              onClick={startCheckout}
              disabled={loadingIntent}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loadingIntent ? (
                <><Loader2 size={16} className="animate-spin" /> Loading…</>
              ) : (
                <><CreditCard size={16} /> Buy Now — $4.99</>
              )}
            </button>

            <p className="text-[10px] text-white/30 text-center mt-3">
              One-time purchase · Lifetime access · Secure via Stripe
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-black text-white mb-4">Complete Payment</h2>
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
              <CheckoutForm
                matchId={matchId}
                matchName={matchName}
                paymentIntentId={paymentIntentId}
                onClose={onClose}
                onPurchaseComplete={onPurchaseComplete}
              />
            </Elements>
            <p className="text-[10px] text-white/30 text-center mt-3">
              Secured by Stripe · $4.99 one-time
            </p>
          </>
        )}
      </div>
    </div>
  );
}