// src/components/PaymentModal.tsx
'use client';

import { useState } from 'react';
import { X, Zap, Trophy, Lock } from 'lucide-react';

interface PaymentModalProps {
  matchId: string;
  matchName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({ matchId, matchName, onClose, onSuccess }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'match' | 'subscription'>('match');

  const pricing = {
    match: { price: 0.99, label: 'This Match Only', description: 'Access to live commentary + 2D pitch for this match' },
    subscription: { price: 12, label: 'Full Tournament Pass', description: 'All 104 matches + highlights + replays' }
  };

  const handlePayment = async () => {
    setIsLoading(true);
    
    try {
      // Get user info from localStorage/auth
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await fetch('/api/payment/paynow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          matchId,
          purchaseType: selectedOption,
          amount: pricing[selectedOption].price,
          userEmail: user.email,
          userPhone: user.phone
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.redirectUrl) {
        // Store payment reference for verification
        localStorage.setItem(`payment_${matchId}`, data.reference);
        // Redirect to Paynow
        window.location.href = data.redirectUrl;
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-[#1a5c2a] to-[#0d3d1a] p-5 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold">Unlock Live Commentary</h2>
              <p className="text-white/70 text-sm">{matchName}</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-5">
          <div className="space-y-3 mb-6">
            <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
              <input
                type="radio"
                name="pricing"
                value="match"
                checked={selectedOption === 'match'}
                onChange={() => setSelectedOption('match')}
                className="w-4 h-4 text-[#1a5c2a]"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{pricing.match.label}</span>
                  <span className="text-xl font-black text-[#1a5c2a]">${pricing.match.price}</span>
                </div>
                <p className="text-xs text-gray-500">{pricing.match.description}</p>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
              <input
                type="radio"
                name="pricing"
                value="subscription"
                checked={selectedOption === 'subscription'}
                onChange={() => setSelectedOption('subscription')}
                className="w-4 h-4 text-[#1a5c2a]"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{pricing.subscription.label}</span>
                  <span className="text-xl font-black text-[#1a5c2a]">${pricing.subscription.price}</span>
                </div>
                <p className="text-xs text-gray-500">{pricing.subscription.description}</p>
                <span className="inline-block text-[9px] bg-[#f0b429]/20 text-[#1a5c2a] px-2 py-0.5 rounded-full mt-1">
                  Save ${(pricing.match.price * 104 - pricing.subscription.price).toFixed(0)} vs single matches
                </span>
              </div>
            </label>
          </div>
          
          <button
            onClick={handlePayment}
            disabled={isLoading}
            className="w-full bg-[#1a5c2a] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Lock size={16} />
                Pay with EcoCash / InnBucks / Card
              </>
            )}
          </button>
          
          <p className="text-[9px] text-gray-400 text-center mt-4">
            Secure payment via Paynow. Supports EcoCash, InnBucks, OneMoney, and Credit/Debit cards.
          </p>
        </div>
      </div>
    </div>
  );
}