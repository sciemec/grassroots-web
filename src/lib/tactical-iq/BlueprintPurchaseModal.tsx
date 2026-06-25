// src/lib/tactical-iq/BlueprintPurchaseModal.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Lock, Check, Download, Loader2, Smartphone } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface Props {
  matchId:            string;
  matchName:          string;
  onClose:            () => void;
  onPurchaseComplete: () => void;
}

type Step = 'info' | 'phone' | 'waiting' | 'done';

const METHODS = [
  { id: 'ecocash',  label: 'EcoCash',  emoji: '📱' },
  { id: 'innbucks', label: 'InnBucks', emoji: '💛' },
  { id: 'onemoney', label: 'OneMoney', emoji: '💚' },
] as const;

type MethodId = typeof METHODS[number]['id'];

export function BlueprintPurchaseModal({ matchId, matchName, onClose, onPurchaseComplete }: Props) {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [step,    setStep]    = useState<Step>('info');
  const [method,  setMethod]  = useState<MethodId>('ecocash');
  const [phone,   setPhone]   = useState('');
  const [error,   setError]   = useState<string | null>(null);
  const [paying,  setPaying]  = useState(false);
  const [pollUrl, setPollUrl] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll Paynow every 3 s once we have a pollUrl
  useEffect(() => {
    if (!pollUrl) return;
    intervalRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/payments/paynow/status?pollUrl=${encodeURIComponent(pollUrl)}`);
        const data = await res.json() as { paid: boolean; paynow_ref?: string };
        if (data.paid) {
          clearInterval(intervalRef.current!);
          // Record blueprint purchase server-side (fire-and-forget)
          fetch(`/api/world-cup/matches/${matchId}/purchase-blueprint`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ paynow_ref: data.paynow_ref ?? '', via: 'paynow' }),
          }).catch(() => {});
          setStep('done');
          onPurchaseComplete();
        }
      } catch {
        // silent — keep polling
      }
    }, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [pollUrl, matchId, token, onPurchaseComplete]);

  const handlePay = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) {
      setError('Enter your full phone number (e.g. 0771 234 567).');
      return;
    }
    if (!user) { setError('Please log in to purchase.'); return; }
    setPaying(true);
    setError(null);
    try {
      const res  = await fetch('/api/payments/paynow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'world_cup_class', phone, method, email: user.email ?? '', matchId }),
      });
      const data = await res.json() as { poll_url?: string; error?: string };
      if (!res.ok || !data.poll_url) throw new Error(data.error ?? 'Could not initiate payment.');
      setPollUrl(data.poll_url);
      setStep('waiting');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Try again.');
      setPaying(false);
    }
  };

  // ── Done ─────────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
        <div className="w-full max-w-md rounded-2xl p-6 bg-[#111f14] border border-[rgba(240,180,41,0.2)]">
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto bg-green-600 rounded-full flex items-center justify-center mb-3">
              <Download size={24} className="text-white" />
            </div>
            <h3 className="text-white font-bold text-lg mb-1">Payment confirmed!</h3>
            <p className="text-white/60 text-sm mb-4">Your Blueprint is ready to download.</p>
            <button onClick={onClose} className="px-6 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Waiting for USSD ─────────────────────────────────────────────────────────
  if (step === 'waiting') {
    const label = METHODS.find(m => m.id === method)?.label ?? method;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
        <div className="w-full max-w-md rounded-2xl p-6 bg-[#111f14] border border-[rgba(240,180,41,0.2)]">
          <div className="text-center py-8">
            <Loader2 size={36} className="mx-auto text-amber-500 animate-spin mb-4" />
            <p className="text-white font-semibold mb-1">Check your phone</p>
            <p className="text-white/60 text-sm">
              Approve the $3 payment in your {label} app or via USSD.
            </p>
            <p className="text-white/30 text-xs mt-4">Checking every 3 seconds…</p>
            <button onClick={onClose} className="mt-6 text-white/40 text-xs underline">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Phone entry ───────────────────────────────────────────────────────────────
  if (step === 'phone') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
        <div className="w-full max-w-md rounded-2xl p-6 bg-[#111f14] border border-[rgba(240,180,41,0.2)] relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white">
            <X size={18} />
          </button>
          <h2 className="text-lg font-black text-white mb-1">Mobile Payment</h2>
          <p className="text-white/50 text-sm mb-5">$3 · {matchName}</p>

          <div className="flex gap-2 mb-4">
            {METHODS.map(m => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className="flex-1 py-2 rounded-xl text-xs font-bold border transition-colors"
                style={{
                  background:   method === m.id ? 'rgba(240,180,41,0.15)' : 'rgba(255,255,255,0.04)',
                  borderColor:  method === m.id ? '#f0b429' : 'rgba(255,255,255,0.1)',
                  color:        method === m.id ? '#f0b429' : 'rgba(255,255,255,0.5)',
                }}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>

          <label className="block text-white/60 text-xs mb-1">
            {METHODS.find(m => m.id === method)?.label} number
          </label>
          <input
            type="tel"
            placeholder="0771 234 567"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm mb-4 outline-none focus:border-amber-500"
          />

          {error && (
            <div className="mb-3 p-2.5 rounded-xl text-xs bg-red-500/10 border border-red-500/25 text-red-300">
              {error}
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={paying}
            className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {paying
              ? <><Loader2 size={16} className="animate-spin" /> Sending…</>
              : <><Smartphone size={16} /> Pay $3</>}
          </button>
          <p className="text-[10px] text-white/30 text-center mt-3">
            You will receive a USSD prompt to approve the payment.
          </p>
        </div>
      </div>
    );
  }

  // ── Info screen ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
      <div className="w-full max-w-md rounded-2xl p-6 bg-[#111f14] border border-[rgba(240,180,41,0.2)] relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white">
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-amber-600 rounded-full flex items-center justify-center mb-3">
            <Lock size={24} className="text-white" />
          </div>
          <h2 className="text-xl font-black text-white">Join the After-Match Class</h2>
          <p className="text-sm text-white/60 mt-1">Full tactical academy for {matchName}</p>
        </div>

        <div className="space-y-3 mb-6">
          {[
            'Full tactical match analysis — all phases',
            '25-question match quiz with AI explanations',
            'Match Analysis Certificate PDF',
            'Full Module PDF — analysis, drills, 5-day plan',
          ].map(item => (
            <div key={item} className="flex items-center gap-3 text-sm text-white/80 bg-white/5 p-3 rounded-xl">
              <Check size={16} className="text-amber-500 shrink-0" />
              {item}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-xs text-center mb-3">{error}</p>
        )}

        <button
          onClick={() => { if (!user) { setError('Please log in to purchase.'); return; } setStep('phone'); }}
          className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <Smartphone size={16} /> Join Class — $3
        </button>

        <p className="text-[10px] text-white/30 text-center mt-3">
          One-time purchase · EcoCash / InnBucks / OneMoney
        </p>
      </div>
    </div>
  );
}
