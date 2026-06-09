// components/BettingOdds.tsx
"use client";

import { useState, useEffect } from 'react';
import { ExternalLink, TrendingUp, Shield } from 'lucide-react';

// Affiliate links (sign up for these programs)
const BETTING_PARTNERS = {
  betway: {
    name: 'Betway',
    logo: '/betway-logo.png',
    affiliateUrl: 'https://betway.com/affiliate?ref=grassroots',
    commission: '50% of first deposit'
  },
  premierbet: {
    name: 'Premier Bet',
    logo: '/premierbet-logo.png', 
    affiliateUrl: 'https://premierbet.com/join?ref=grassroots',
    commission: '30% of first deposit'
  },
  sportybet: {
    name: 'SportyBet',
    logo: '/sportybet-logo.png',
    affiliateUrl: 'https://sportybet.com/affiliate?ref=grassroots',
    commission: '40% of first deposit'
  }
};

export function BettingOdds({ match, odds }: { match: any; odds: any }) {
  const [selectedBookie, setSelectedBookie] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-green-600" />
          <h3 className="text-sm font-bold text-gray-900">Match Odds</h3>
        </div>
        <span className="text-[9px] text-gray-400">Sponsored</span>
      </div>
      
      {/* Odds Display */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-[10px] text-gray-500">Home</p>
          <p className="text-lg font-black text-gray-900">{odds.home}</p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-[10px] text-gray-500">Draw</p>
          <p className="text-lg font-black text-gray-900">{odds.draw}</p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-[10px] text-gray-500">Away</p>
          <p className="text-lg font-black text-gray-900">{odds.away}</p>
        </div>
      </div>
      
      {/* Affiliate Buttons */}
      <div className="space-y-2">
        {Object.entries(BETTING_PARTNERS).map(([key, partner]) => (
          <a
            key={key}
            href={partner.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:from-green-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-green-600" />
              <span className="text-sm font-medium">{partner.name}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>Bet Now</span>
              <ExternalLink size={12} />
            </div>
          </a>
        ))}
      </div>
      
      <p className="text-[7px] text-gray-400 text-center mt-3">
        18+. T&Cs apply. Gambling responsibly. We earn commission from qualified signups.
      </p>
    </div>
  );
}