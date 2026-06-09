// src/components/LiveCommentary.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { Radio, Volume2, VolumeX } from 'lucide-react';
import { MatchOdds } from './MatchOdds';
import { getAudioCommentary } from '@/lib/audio-commentary';

interface CommentaryEntry {
  id: string;
  minute: number;
  eventType: string;
  playerName?: string;
  commentary: string;
}

interface LiveCommentaryProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
}

function buildFallbackCommentary(event: {
  eventType?: string;
  type?: string;
  player?: string;
  playerName?: string;
  minute: number;
}): string {
  const player = event.player ?? event.playerName ?? 'A player';
  switch ((event.eventType ?? event.type ?? '').toUpperCase()) {
    case 'GOAL':         return `GOAL! ${player} finds the net!`;
    case 'YELLOW_CARD':  return `${player} is shown a yellow card.`;
    case 'RED_CARD':     return `${player} receives a red card and is sent off!`;
    case 'SUBSTITUTION': return `Substitution — ${player} comes on.`;
    default:             return `${player} — match event at ${event.minute}'.`;
  }
}

function eventStyle(type: string): string {
  switch (type.toUpperCase()) {
    case 'GOAL':         return 'text-green-800 bg-green-50 border-green-200';
    case 'YELLOW_CARD':  return 'text-yellow-800 bg-yellow-50 border-yellow-200';
    case 'RED_CARD':     return 'text-red-800 bg-red-50 border-red-200';
    default:             return 'text-gray-700 bg-gray-50 border-gray-200';
  }
}

export function LiveCommentary({ matchId, homeTeam, awayTeam }: LiveCommentaryProps) {
  const [entries, setEntries] = useState<CommentaryEntry[]>([]);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homePossession, setHomePossession] = useState(50);
  const [awayPossession, setAwayPossession] = useState(50);
  const [homeShots, setHomeShots] = useState(0);
  const [awayShots, setAwayShots] = useState(0);
  const [minute, setMinute] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const seenIds = useRef<Set<string>>(new Set());
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [entries]);

  async function poll() {
    try {
      const res = await fetch(`/api/world-cup/matches/${matchId}`);
      if (!res.ok) return;
      const data = await res.json();

      setHomeScore(data.homeScore ?? 0);
      setAwayScore(data.awayScore ?? 0);
      setMinute(data.minute ?? 0);
      if (data.stats?.possession) {
        setHomePossession(data.stats.possession.home ?? 50);
        setAwayPossession(data.stats.possession.away ?? 50);
      }
      if (data.stats?.shots) {
        setHomeShots(data.stats.shots.home ?? 0);
        setAwayShots(data.stats.shots.away ?? 0);
      }

      const incoming: CommentaryEntry[] = (data.events ?? [])
        .filter((e: { id: number | string }) => !seenIds.current.has(String(e.id)))
        .map((e: {
          id: number | string;
          minute: number;
          eventType?: string;
          type?: string;
          player?: string;
          playerName?: string;
          commentary?: string;
        }) => {
          seenIds.current.add(String(e.id));
          return {
            id: String(e.id),
            minute: e.minute,
            eventType: e.eventType ?? e.type ?? 'EVENT',
            playerName: e.player ?? e.playerName,
            commentary: e.commentary ?? buildFallbackCommentary(e),
          };
        });

      if (incoming.length > 0) {
        setEntries(prev => [...prev, ...incoming]);
        if (audioEnabled) {
          const audio = getAudioCommentary();
          incoming.forEach(e => audio.queueCommentary(e.commentary));
        }
      }
    } catch {
      // Silent — polling retries on next interval
    } finally {
      setIsLoading(false);
    }
  }

  function toggleAudio() {
    const audio = getAudioCommentary();
    if (audioEnabled) {
      audio.stop();
      setAudioEnabled(false);
    } else {
      setAudioEnabled(true);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Scoreboard */}
      <div className="bg-[#1a5c2a] text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio size={14} className="animate-pulse text-red-300" />
            <span className="text-xs font-bold tracking-widest">LIVE COMMENTARY</span>
          </div>
          {minute > 0 && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
              {minute}&apos;
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 items-center">
          <div className="text-center">
            <p className="text-sm font-bold truncate">{homeTeam}</p>
            <p className="text-5xl font-black mt-1">{homeScore}</p>
          </div>
          <div className="text-center text-white/30 font-black text-2xl">—</div>
          <div className="text-center">
            <p className="text-sm font-bold truncate">{awayTeam}</p>
            <p className="text-5xl font-black mt-1">{awayScore}</p>
          </div>
        </div>
      </div>

      {/* Odds / Win Probability */}
      <div className="p-4 border-b border-gray-100">
        <MatchOdds
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          homeScore={homeScore}
          awayScore={awayScore}
          minute={minute}
          homePossession={homePossession}
          awayPossession={awayPossession}
          homeShots={homeShots}
          awayShots={awayShots}
        />
      </div>

      {/* Controls */}
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {entries.length} event{entries.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={toggleAudio}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            audioEnabled
              ? 'bg-[#1a5c2a] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {audioEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
          {audioEnabled ? 'Audio On' : 'Audio Off'}
        </button>
      </div>

      {/* Commentary Feed */}
      <div ref={feedRef} className="h-80 overflow-y-auto p-4 space-y-2.5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-2.5 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-10 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Radio size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Waiting for match events…</p>
            <p className="text-xs mt-1">Commentary will appear here live</p>
          </div>
        ) : (
          [...entries].reverse().map(entry => (
            <div
              key={entry.id}
              className={`rounded-lg border p-3 ${eventStyle(entry.eventType)}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black font-mono">{entry.minute}&apos;</span>
                <span className="text-[10px] font-bold uppercase tracking-wide opacity-60">
                  {entry.eventType.replace(/_/g, ' ')}
                </span>
                {entry.playerName && (
                  <span className="text-[10px] opacity-50">· {entry.playerName}</span>
                )}
              </div>
              <p className="text-xs leading-relaxed">{entry.commentary}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
