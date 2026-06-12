// src/components/LiveCommentary.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { Radio, Volume2, VolumeX } from 'lucide-react';
import { MatchOdds } from './MatchOdds';
import { getAudioCommentary } from '@/lib/audio-commentary';

interface CommentaryEntry {
  id:          string;
  minute:      number;
  eventType:   string;
  playerName?: string;
  commentary:  string;
}

interface LiveCommentaryProps {
  matchId:         string;
  homeTeam:        string;
  awayTeam:        string;
  autoStartAudio?: boolean;
}

function buildFallbackCommentary(event: {
  eventType?: string;
  type?:      string;
  player?:    string;
  playerName?: string;
  minute:     number;
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

function eventEmoji(type: string): string {
  switch (type.toUpperCase()) {
    case 'GOAL':         return '⚽';
    case 'YELLOW_CARD':  return '🟨';
    case 'RED_CARD':     return '🟥';
    case 'SUBSTITUTION': return '🔄';
    default:             return '📋';
  }
}

function eventStyle(type: string): { card: string; badge: string; text: string } {
  switch (type.toUpperCase()) {
    case 'GOAL':
      return {
        card:  'bg-emerald-950/60 border-emerald-500/40',
        badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        text:  'text-emerald-100',
      };
    case 'YELLOW_CARD':
      return {
        card:  'bg-amber-950/50 border-amber-500/30',
        badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        text:  'text-amber-100',
      };
    case 'RED_CARD':
      return {
        card:  'bg-red-950/50 border-red-500/30',
        badge: 'bg-red-500/20 text-red-300 border border-red-500/30',
        text:  'text-red-100',
      };
    default:
      return {
        card:  'bg-white/5 border-[#f0b429]/10',
        badge: 'bg-white/10 text-gray-300 border border-[#f0b429]/10',
        text:  'text-gray-200',
      };
  }
}

export function LiveCommentary({ matchId, homeTeam, awayTeam, autoStartAudio }: LiveCommentaryProps) {
  const [entries,         setEntries]         = useState<CommentaryEntry[]>([]);
  const [homeScore,       setHomeScore]       = useState(0);
  const [awayScore,       setAwayScore]       = useState(0);
  const [homePossession,  setHomePossession]  = useState(50);
  const [awayPossession,  setAwayPossession]  = useState(50);
  const [homeShots,       setHomeShots]       = useState(0);
  const [awayShots,       setAwayShots]       = useState(0);
  const [minute,          setMinute]          = useState(0);
  const [audioEnabled,    setAudioEnabled]    = useState(false);
  const [isLoading,       setIsLoading]       = useState(true);
  // Web Speech API — spoken commentary
  const [isSpeaking,      setIsSpeaking]      = useState(false);
  const [currentCommentary, setCurrentCommentary] = useState('');

  const seenIds  = useRef<Set<string>>(new Set());
  const feedRef  = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialise Web Speech API on client only
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => {
    if (autoStartAudio) setAudioEnabled(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartAudio]);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // Auto-scroll commentary feed to latest entry
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [entries]);

  // Speak commentary text via Web Speech API
  function speak(text: string) {
    if (!synthRef.current) return;
    const utterance     = new SpeechSynthesisUtterance(text);
    utterance.rate      = 0.95;
    utterance.pitch     = 1.0;
    utterance.onstart   = () => setIsSpeaking(true);
    utterance.onend     = () => setIsSpeaking(false);
    utterance.onerror   = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  }

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
          id:           number | string;
          minute:       number;
          eventType?:   string;
          type?:        string;
          player?:      string;
          playerName?:  string;
          commentary?:  string;
        }) => {
          seenIds.current.add(String(e.id));
          return {
            id:          String(e.id),
            minute:      e.minute,
            eventType:   e.eventType ?? e.type ?? 'EVENT',
            playerName:  e.player ?? e.playerName,
            commentary:  e.commentary ?? buildFallbackCommentary(e),
          };
        });

      if (incoming.length > 0) {
        setEntries(prev => [...prev, ...incoming]);

        // Update the latest commentary text (shown below the feed)
        const latest = incoming[incoming.length - 1];
        setCurrentCommentary(latest.commentary);

        if (audioEnabled) {
          // Queue in the audio commentary system (existing)
          const audio = getAudioCommentary();
          incoming.forEach(e => audio.queueCommentary(e.commentary));

          // Also speak via Web Speech API for instant browser TTS
          incoming.forEach(e => speak(e.commentary));
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
      // Cancel any in-progress speech
      synthRef.current?.cancel();
      setIsSpeaking(false);
      setAudioEnabled(false);
    } else {
      setAudioEnabled(true);
    }
  }

  const homeLeading = homeScore > awayScore;
  const awayLeading = awayScore > homeScore;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0f1e30 0%, #0a1520 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* ── Scoreboard ─────────────────────────────────────────────── */}
      <div
        className="p-6"
        style={{ background: 'linear-gradient(135deg, #0d1f33 0%, #111d2e 100%)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Radio size={13} className="animate-pulse" style={{ color: '#ef4444' }} />
            <span className="text-xs font-black tracking-widest uppercase" style={{ color: '#f0b429' }}>
              Live Commentary
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isSpeaking && (
              <span className="text-[10px] font-bold" style={{ color: '#4ade80' }}>
                🔴 Speaking…
              </span>
            )}
            {minute > 0 && (
              <span
                className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full"
                style={{ background: 'rgba(240,180,41,0.15)', color: '#f0b429', border: '1px solid rgba(240,180,41,0.3)' }}
              >
                {minute}&apos;
              </span>
            )}
          </div>
        </div>

        {/* Score display */}
        <div className="grid grid-cols-3 items-center gap-2">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 truncate mb-2">{homeTeam}</p>
            <p className="text-6xl font-black tabular-nums" style={{ color: homeLeading ? '#f0b429' : 'white' }}>
              {homeScore}
            </p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-black" style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 truncate mb-2">{awayTeam}</p>
            <p className="text-6xl font-black tabular-nums" style={{ color: awayLeading ? '#f0b429' : 'white' }}>
              {awayScore}
            </p>
          </div>
        </div>
      </div>

      {/* ── Odds / Win Probability ─────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
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

      {/* ── Controls ───────────────────────────────────────────────── */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {entries.length} event{entries.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={toggleAudio}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={audioEnabled
            ? { background: 'rgba(240,180,41,0.15)', color: '#f0b429', border: '1px solid rgba(240,180,41,0.3)' }
            : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }
          }
        >
          {audioEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
          {audioEnabled ? 'Audio On' : 'Audio Off'}
        </button>
      </div>

      {/* ── Commentary Feed ────────────────────────────────────────── */}
      <div ref={feedRef} className="h-80 overflow-y-auto p-4 space-y-2.5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="h-2 rounded mb-2.5 w-1/4" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <div className="h-8 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-10">
            <Radio size={32} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>Waiting for match events…</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Commentary will appear here live</p>
          </div>
        ) : (
          [...entries].reverse().map(entry => {
            const style = eventStyle(entry.eventType);
            return (
              <div key={entry.id} className={`rounded-xl border p-3 ${style.card}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-black font-mono" style={{ color: '#f0b429' }}>{entry.minute}&apos;</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${style.badge}`}>
                    {eventEmoji(entry.eventType)} {entry.eventType.replace(/_/g, ' ')}
                  </span>
                  {entry.playerName && (
                    <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      · {entry.playerName}
                    </span>
                  )}
                </div>
                <p className={`text-xs leading-relaxed ${style.text}`}>{entry.commentary}</p>
              </div>
            );
          })
        )}
      </div>

      {/* ── Current commentary text — spoken line shown below feed ── */}
      {currentCommentary && (
        <div
          className="px-4 py-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}
        >
          <p className="text-[11px] italic text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
            &ldquo;{currentCommentary}&rdquo;
          </p>
          <p className="text-[10px] text-center mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
            AI-powered commentary · updates every 30 seconds
          </p>
        </div>
      )}
    </div>
  );
}