// src/components/coaching/PaymentModal.tsx
"use client";

import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import paynowService from "@/lib/paynow";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachName: string;
  sessionId: string;
  coachId: string;
  amount: number;
  playerName: string;
  playerPhone: string;
  playerEmail?: string;
  onPaymentComplete: (reference: string) => void;
}

type PaymentStage = 'select' | 'processing' | 'waiting' | 'complete' | 'error';

export default function PaymentModal({
  isOpen,
  onClose,
  coachName,
  sessionId,
  coachId,
  amount,
  playerName,
  playerPhone,
  playerEmail,
  onPaymentComplete,
}: PaymentModalProps) {
  const [stage, setStage] = useState<PaymentStage>('select');
  const [paymentMethod, setPaymentMethod] = useState<string>('ecocash');
  const [pollUrl, setPollUrl] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [countdown, setCountdown] = useState(0);
  const [isPolling, setIsPolling] = useState(false);

  const paymentMethods = paynowService.getPaymentMethods();

  // Polling loop for payment status
  useEffect(() => {
    if (!pollUrl || stage !== 'waiting') return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/paynow/status?pollUrl=${encodeURIComponent(pollUrl)}&reference=${reference}`);
        const data = await response.json();

        if (data.paid) {
          setIsPolling(false);
          clearInterval(pollInterval);
          setStage('complete');
          onPaymentComplete(reference);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [pollUrl, reference, stage, onPaymentComplete]);

  const handlePayment = async () => {
    setStage('processing');
    setError('');

    try {
      const response = await fetch('/api/payments/paynow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          description: `Coaching session with ${coachName}`,
          customerName: playerName,
          customerPhone: playerPhone,
          customerEmail: playerEmail || '',
          sessionId,
          coachId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      setPollUrl(data.pollUrl);
      setReference(data.reference);
      setStage('waiting');

      // Store payment reference in localStorage
      const payments = JSON.parse(localStorage.getItem('coaching_payments') || '[]');
      payments.push({
        reference: data.reference,
        sessionId,
        coachId,
        amount,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('coaching_payments', JSON.stringify(payments));

      // Start countdown for payment expiry
      setCountdown(180); // 3 minutes

      // Countdown timer
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setStage('error');
            setError('Payment timed out. Please try again.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      setStage('error');
      setError(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-gray-900">
              {stage === 'complete' ? '✅ Payment Complete' : 'Pay for Session'}
            </h2>
            <p className="text-xs text-gray-500">
              {stage === 'select' && 'Choose your payment method'}
              {stage === 'processing' && 'Processing...'}
              {stage === 'waiting' && 'Complete payment on your phone'}
              {stage === 'complete' && 'Your session is confirmed!'}
              {stage === 'error' && 'Payment failed'}
            </p>
          </div>
          {stage !== 'complete' && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <Icons.X size={20} />
            </button>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Session Summary */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Coaching Session</p>
                <p className="text-xs text-gray-500">with {coachName}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-[#1a5c2a]">${amount.toFixed(2)}</p>
                <p className="text-[10px] text-gray-500">USD</p>
              </div>
            </div>
          </div>

          {/* Stage: Select Payment Method */}
          {stage === 'select' && (
            <>
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Payment Method</p>
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      paymentMethod === method.id
                        ? 'border-[#1a5c2a] bg-[#1a5c2a]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{method.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900">{method.name}</p>
                      <p className="text-xs text-gray-500">
                        {method.id === 'ecocash' && 'Pay with EcoCash'}
                        {method.id === 'innbucks' && 'Pay with InnBucks'}
                        {method.id === 'onemoney' && 'Pay with OneMoney'}
                        {method.id === 'bank' && 'Pay via Bank Transfer'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handlePayment}
                className="w-full py-3 bg-[#1a5c2a] text-white rounded-xl font-bold text-sm hover:bg-[#1a5c2a]/90 transition-colors"
              >
                <Icons.Zap size={16} className="inline mr-2" />
                Pay ${amount.toFixed(2)}
              </button>
            </>
          )}

          {/* Stage: Processing */}
          {stage === 'processing' && (
            <div className="text-center py-8">
              <Icons.Loader2 className="animate-spin text-[#1a5c2a] mx-auto" size={40} />
              <p className="text-sm font-medium text-gray-900 mt-3">Initiating payment...</p>
              <p className="text-xs text-gray-500 mt-1">Please wait</p>
            </div>
          )}

          {/* Stage: Waiting for Payment */}
          {stage === 'waiting' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#f0b429]/20 flex items-center justify-center mx-auto mb-3">
                <Icons.Phone className="text-[#f0b429]" size={32} />
              </div>
              <p className="text-sm font-bold text-gray-900">Check Your Phone</p>
              <p className="text-xs text-gray-500 mt-1">
                A payment request has been sent to your phone.
              </p>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-700">
                  📱 Open EcoCash/InnBucks/OneMoney on your phone
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Approve the payment request
                </p>
              </div>
              {countdown > 0 && (
                <p className="text-xs text-gray-400 mt-3">
                  Waiting for approval... {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                </p>
              )}
              <div className="w-full bg-gray-200 rounded-full h-1 mt-3 overflow-hidden">
                <div
                  className="h-full bg-[#f0b429] rounded-full transition-all duration-1000"
                  style={{ width: `${(countdown / 180) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Stage: Complete */}
          {stage === 'complete' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                <Icons.CheckCircle className="text-green-500" size={32} />
              </div>
              <p className="text-lg font-black text-green-600">Payment Successful!</p>
              <p className="text-sm text-gray-600 mt-1">
                Your coaching session has been confirmed.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Reference: {reference}
              </p>
              <button
                onClick={() => {
                  onPaymentComplete(reference);
                  onClose();
                }}
                className="mt-4 px-6 py-2 bg-[#1a5c2a] text-white rounded-xl font-bold text-sm hover:bg-[#1a5c2a]/90 transition-colors"
              >
                View My Sessions
              </button>
            </div>
          )}

          {/* Stage: Error */}
          {stage === 'error' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                <Icons.AlertCircle className="text-red-500" size={32} />
              </div>
              <p className="text-sm font-bold text-red-600">Payment Failed</p>
              <p className="text-xs text-gray-600 mt-1">{error}</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setStage('select')}
                  className="flex-1 px-4 py-2 bg-[#1a5c2a] text-white rounded-xl font-bold text-sm hover:bg-[#1a5c2a]/90 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}