// components/LiveMatchBanner.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Radio, ChevronRight } from 'lucide-react';

interface LiveMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
}

const TEAM_FLAGS: Record<string, string> = {
  USA: "🇺🇸", Canada: "🇨🇦", Mexico: "🇲🇽",
  Brazil: "🇧🇷", Argentina: "🇦🇷", Uruguay: "🇺🇾", Colombia: "🇨🇴",
  Germany: "🇩🇪", Spain: "🇪🇸", France: "🇫🇷", England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Portugal: "🇵🇹", Netherlands: "🇳🇱", Italy: "🇮🇹", Belgium: "🇧🇪",
  Croatia: "🇭🇷", Denmark: "🇩🇰", Serbia: "🇷🇸", Switzerland: "🇨🇭",
  Austria: "🇦🇹", Poland: "🇵🇱", Ukraine: "🇺🇦", Turkey: "🇹🇷",
  Morocco: "🇲🇦", Senegal: "🇸🇳", Nigeria: "🇳🇬", Ghana: "🇬🇭",
  Japan: "🇯🇵", "South Korea": "🇰🇷", Australia: "🇦🇺", Iran: "🇮🇷",
};

function flag(team: string) { return TEAM_FLAGS[team] ?? "🏳️"; }

export function LiveMatchBanner() {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLiveMatches();
    const interval = setInterval(fetchLiveMatches, 30_000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveMatches = async () => {
    try {
      const response = await fetch('/api/world-cup/matches');
      const data = await response.json();
      setLiveMatches(response.ok && data.live?.length > 0 ? data.live : []);
    } catch {
      setLiveMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || liveMatches.length === 0) return null;

  return (
    <div className="space-y-2.5 mb-6">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest text-white"
          style={{ background: '#ef4444' }}
        >
          <Radio size={9} className="animate-pulse" /> World Cup Live
        </span>
        <span className="text-[10px] font-semibold" style={{ color: 'rgba(0,0,0,0.35)' }}>
          {liveMatches.length} match{liveMatches.length !== 1 ? 'es' : ''} in progress
        </span>
      </div>

      {liveMatches.map((match) => {
        const homeLeading = match.homeScore > match.awayScore;
        const awayLeading = match.awayScore > match.homeScore;
        return (
          <Link key={match.id} href={`/world-cup?match=${match.id}`} className="block group">
            <div
              className="rounded-2xl overflow-hidden transition-all duration-200 group-hover:shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #0d2318 0%, #091810 50%, #070f1c 100%)',
                border: '1px solid rgba(240,180,41,0.15)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              }}
            >
              {/* Top stripe: FIFA branding + minute */}
              <div
                className="flex items-center justify-between px-4 py-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#f87171' }}>
                    Live
                  </span>
                  <span className="text-[9px] font-black" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    · {match.minute}&apos;
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'rgba(240,180,41,0.5)' }}>
                  FIFA World Cup 2026
                </span>
              </div>

              {/* Broadcast scorecard */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 py-4">
                {/* Home */}
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-3xl leading-none">{flag(match.homeTeam)}</span>
                  <span className="text-[11px] font-bold text-white/70 text-center leading-tight">
                    {match.homeTeam}
                  </span>
                </div>

                {/* Score */}
                <div className="flex items-center gap-2 px-3">
                  <span
                    className="text-4xl font-black tabular-nums leading-none"
                    style={{ color: homeLeading ? '#f0b429' : 'white' }}
                  >
                    {match.homeScore}
                  </span>
                  <span className="text-lg font-black" style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                  <span
                    className="text-4xl font-black tabular-nums leading-none"
                    style={{ color: awayLeading ? '#f0b429' : 'white' }}
                  >
                    {match.awayScore}
                  </span>
                </div>

                {/* Away */}
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-3xl leading-none">{flag(match.awayTeam)}</span>
                  <span className="text-[11px] font-bold text-white/70 text-center leading-tight">
                    {match.awayTeam}
                  </span>
                </div>
              </div>

              {/* CTA footer */}
              <div
                className="flex items-center justify-between px-4 py-2.5 transition-all group-hover:bg-white/5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Tap for live AI commentary
                </span>
                <div className="flex items-center gap-1" style={{ color: '#f0b429' }}>
                  <span className="text-[10px] font-black uppercase tracking-wider">Watch Live</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}