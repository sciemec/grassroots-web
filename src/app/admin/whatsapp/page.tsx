// app/admin/whatsapp/page.tsx
"use client";

import { useState } from 'react';
import { Send, Users, Target, DollarSign, Radio } from 'lucide-react';

export default function WhatsAppAdminPage() {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [target, setTarget] = useState('all');
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  const handleBroadcast = async () => {
    if (!message.trim()) return;
    
    setIsSending(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/whatsapp/match-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'broadcast_custom',
          message: message,
          filterPremium: target === 'premium'
        })
      });
      
      const data = await response.json();
      setResult({ sent: data.sentCount || 0, failed: 0 });
      
    } catch (error) {
      console.error('Broadcast failed:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black mb-6">WhatsApp Broadcast</h1>
      
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Send Broadcast</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Target Audience</label>
          <div className="flex gap-3">
            <button
              onClick={() => setTarget('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                target === 'all' ? 'bg-[#1a5c2a] text-white' : 'bg-gray-100'
              }`}
            >
              <Users size={14} className="inline mr-1" />
              All Users
            </button>
            <button
              onClick={() => setTarget('premium')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                target === 'premium' ? 'bg-[#1a5c2a] text-white' : 'bg-gray-100'
              }`}
            >
              <DollarSign size={14} className="inline mr-1" />
              Premium Only
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="w-full p-3 border border-gray-200 rounded-lg text-sm"
            placeholder="Enter your broadcast message..."
          />
          <p className="text-xs text-gray-400 mt-1">
            {message.length} characters
          </p>
        </div>
        
        <button
          onClick={handleBroadcast}
          disabled={isSending || !message.trim()}
          className="w-full bg-[#1a5c2a] text-white py-3 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Send size={16} />
          {isSending ? 'Sending...' : 'Send Broadcast'}
        </button>
        
        {result && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
            <p className="text-sm text-green-700">
              ✅ Broadcast sent to {result.sent} users
            </p>
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-sm font-bold mb-3">Quick Templates</h3>
        <div className="space-y-2">
          <button
            onClick={() => setMessage('⚽ LIVE: Match starting in 15 minutes!\n\n🔗 Bet now: ' + process.env.NEXT_PUBLIC_BETWAY_AFFILIATE_URL)}
            className="w-full text-left p-3 bg-white rounded-lg text-sm hover:bg-gray-100"
          >
            📢 Pre-match reminder + betting link
          </button>
          <button
            onClick={() => setMessage('🎙️ HALF-TIME ANALYSIS available now!\n\nReply "HALF" for AI analysis of the first half.\n\n💰 Betting specials: ' + process.env.NEXT_PUBLIC_BETWAY_AFFILIATE_URL)}
            className="w-full text-left p-3 bg-white rounded-lg text-sm hover:bg-gray-100"
          >
            🎙️ Halftime analysis promo
          </button>
          <button
            onClick={() => setMessage('🏁 FULL TIME!\n\nFinal score and match summary available.\n\n📱 Share with friends!\n🔗 Next match odds: ' + process.env.NEXT_PUBLIC_BETWAY_AFFILIATE_URL)}
            className="w-full text-left p-3 bg-white rounded-lg text-sm hover:bg-gray-100"
          >
            🏁 Full-time summary
          </button>
        </div>
      </div>
    </div>
  );
}