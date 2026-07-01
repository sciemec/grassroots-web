'use client';

import { useState } from 'react';
import { X, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface BlueprintPurchaseModalProps {
  matchId:            string;
  matchName:          string;
  onClose:            () => void;
  onPurchaseComplete: () => void;
}

export function BlueprintPurchaseModal({
  matchId,
  matchName,
  onClose,
  onPurchaseComplete,
}: BlueprintPurchaseModalProps) {
  const token = useAuthStore((s) => s.token);
  const authToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const handlePurchase = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          planId:     'blueprint_single',
          price:      4.99,
          successUrl: `${window.location.origin}/worldcup?blueprint_paid=${matchId}`,
          cancelUrl:  `${window.location.origin}/worldcup`,
          metadata:   { matchId, type: 'coaching_blueprint' },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Sandbox / dev mode — treat as immediate success
        onPurchaseComplete();
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a5c2a] to-[#0d3d1a] p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#f0b429] rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText size={20} className="text-[#1a5c2a]" />
            </div>
            <div>
              <p className="text-[10px] text-[#f0b429] font-bold uppercase tracking-widest">GRS Coaching Blueprint</p>
              <h2 className="text-lg font-black leading-tight">5-Day Microcycle PDF</h2>
            </div>
          </div>
          <p className="text-white/70 text-xs leading-relaxed">{matchName}</p>
        </div>

        {/* Body */}
        <div className="p-5">
          <ul className="space-y-2.5 mb-5">
            {[
              '5-day training plan built from this match\'s tactical data',
              'Position-specific drills with setup, reps, and coaching points',
              'U14 / U17 / Senior age adaptations for every drill',
              'Phase analysis: Regain → Build → Finish weaknesses addressed',
              'Printable PDF — hand it to your assistant coach',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                <CheckCircle2 size={15} className="text-[#1a5c2a] flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
              {error}
            </div>
          )}

          <div className="flex items-baseline justify-between mb-4">
            <span className="text-2xl font-black text-[#1a5c2a]">$4.99</span>
            <span className="text-xs text-gray-400">one-time, per match</span>
          </div>

          <button
            onClick={handlePurchase}
            disabled={isLoading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-black text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><Loader2 size={16} className="animate-spin" />Redirecting to payment...</>
            ) : (
              'Pay $4.99 — Unlock Blueprint'
            )}
          </button>

          <p className="text-[10px] text-gray-400 text-center mt-3">
            Powered by Stripe · Secure checkout · Instant PDF access after payment
          </p>
        </div>
      </div>
    </div>
  );
}
