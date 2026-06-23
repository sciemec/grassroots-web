// src/app/world-cup/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// FINAL PRODUCT — GRS World Cup Tactical Lab
//
// WHAT CHANGED FROM THE ORIGINAL worldcup/page.tsx AND WHY:
//
// REMOVED (broadcasting-risk pattern):
//   - 3-second ball position polling for live matches → was simulating a
//     real-time broadcast, the exact pattern that reads as unlicensed media
//   - AICommentary component with "SCREAM GOAL!" trigger buttons and live
//     audio playback → live-synced commentary IS broadcasting
//   - Language/dialect picker for live commentary → no longer needed, the
//     report narrative is generated once, server-side, not performed live
//   - isConnected / "Live connected" status → there is no live connection
//     anymore, reports are read on-demand after full-time
//
// KEPT (genuinely good UI, just re-pointed at different data):
//   - Match list sidebar (MatchCard) → now shows 'completed' matches with
//     a "Report ready" badge instead of 'live' matches with a pulse dot
//   - FootballPitch canvas component → repurposed to draw the 3-phase
//     possession map instead of an animated ball position
//   - Ad tiers (Gold/Silver/Bronze) → unchanged, still a real revenue line
//   - Fan registration modal → unchanged, still gates Pro features
//   - Share buttons, match odds → unchanged
//   - Highlights modal (YouTube) → unchanged, this is genuinely safe (links
//     to YouTube's own player, GRS does not rebroadcast video)
//
// ADDED (Tactical IQ — the actual product):
//   - PhaseReport panel: 3 phases (Regain/Build/Finish) with success rates
//     and the brainstorm's exact question style ("you lost the ball 80% of
//     the time — what does this tell you?")
//   - WhatWouldYouDo quiz: 2-3 frozen decision moments per match
//   - Tactical IQ score badge, fed by tactical-iq-engine.ts
//   - "Report ready" gate — a match only becomes visible here once
//     /api/cron/generate-tactical-report has processed it (15 min after FT)
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MapPin, Calendar, RefreshCw, Tv, Activity, Share2, Copy, Check,
  TrendingUp, Clock, Youtube, MessageCircle, Lock, Unlock,
  Loader2, X, Star, Users, Trophy as TrophyIcon, Brain, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { classifyPhases, buildPhaseQuestion, type PhaseReport, type MatchEvent, type MatchStats } from '@/lib/tactical-iq/phase-classifier';
import { type QuizMoment } from '@/lib/tactical-iq/quiz-generator';
import { calculateTacticalIQ, type QuizAnswer, type TacticalIQResult } from '@/lib/tactical-iq/tactical-iq-engine';
import WhatWouldYouDo from '@/lib/tactical-iq/WhatWouldYouDo';

const GRS_GREEN = '#1a5c2a';
const GRS_GOLD  = '#f0b429';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface Match {
  id:          string;
  homeTeam:    string;
  awayTeam:    string;
  homeScore:   number;
  awayScore:   number;
  status:      'scheduled' | 'completed';
  date:        string;
  time:        string;
  stadium:     string;
  city:        string;
  reportReady: boolean; // true once the cron has generated the Tactical Report
}

// Deliberately thin — score, minute, possession only. No event log, no
// coordinates, no commentary. This is the entire data surface for any
// match currently in progress.
interface LiveScoreboardMatch {
  id:             string;
  homeTeam:       string;
  awayTeam:       string;
  homeScore:      number;
  awayScore:      number;
  minute:         number;
  possessionHome: number;
  possessionAway: number;
}

interface TacticalReport {
  phases:       PhaseReport;
  quizMoments:  QuizMoment[];
  narrative:    string;
  generatedAt:  string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PERKS LIST — updated copy, education-framed
// ─────────────────────────────────────────────────────────────────────────────
const PERKS: Array<{ icon: React.ElementType; text: string }> = [
  { icon: Brain,        text: 'AI tactical breakdown after every match' },
  { icon: TrophyIcon,   text: 'Build your Tactical IQ score' },
  { icon: Users,        text: 'Compare your reads with other players' },
  { icon: Star,         text: 'Vote Player of the Tournament' },
];

function PerksList() {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-6">
      {PERKS.map(({ icon: Icon, text }) => (
        <div key={text} className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-gray-100 text-gray-900 border border-gray-300 shadow-sm">
          <Icon size={13} className="text-[#1a5c2a]" />
          {text}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AD BANNER — unchanged from original, genuinely fine as-is
// ─────────────────────────────────────────────────────────────────────────────
interface AdBannerProps {
  tier:        'GOLD' | 'SILVER' | 'BRONZE';
  targetUrl?:  string | null;
  sponsorName?: string | null;
  imageUrl?:   string | null;
}

function AdBanner({ tier, targetUrl, sponsorName, imageUrl }: AdBannerProps) {
  const destination = targetUrl || 'https://grassrootssports.live';
  const displaySponsor = sponsorName || 'Official Partner';

  if (tier === 'GOLD') {
    const goldAdImage = imageUrl || '/assets/sponsors/default-gold-banner.png';
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
        <span className="text-[10px] font-bold text-amber-600 block mb-2 uppercase tracking-wide">Gold Tournament Partner</span>
        <a href={destination} target="_blank" rel="noopener noreferrer" className="block h-[250px] relative border border-gray-200 rounded overflow-hidden hover:border-amber-500 hover:shadow-md transition-all">
          <img src={goldAdImage} alt={`${displaySponsor} Advertisement`} className="w-full h-full object-cover" />
        </a>
      </div>
    );
  }
  if (tier === 'SILVER') {
    return (
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-center">
        <span className="text-[9px] text-gray-400 block mb-1 uppercase tracking-wider">Silver Metrics Sponsor</span>
        <a href={destination} target="_blank" rel="noopener noreferrer" className="block p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded border border-emerald-200 hover:bg-emerald-100 transition">
          Tactical data powered by <br />
          <span className="underline font-bold text-sm text-emerald-900 block mt-1">{displaySponsor}</span>
        </a>
      </div>
    );
  }
  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-center">
      <span className="text-[9px] text-gray-400 block mb-2 uppercase tracking-wider">Bronze Grassroots Sponsor</span>
      <a href={destination} target="_blank" rel="noopener noreferrer" className="block h-[120px] relative border border-dashed border-gray-300 rounded overflow-hidden hover:border-gray-400 transition bg-gray-50">
        {imageUrl ? (
          <img src={imageUrl} alt={displaySponsor} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-gray-500">
            <span className="font-semibold text-xs text-gray-700">{displaySponsor}</span>
            <span className="text-[10px] text-gray-400 mt-1">Local Academy Space</span>
          </div>
        )}
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE MAP — repurposes the original FootballPitch canvas idea, but draws
// the 3-phase possession breakdown instead of an animated live ball
// ─────────────────────────────────────────────────────────────────────────────
function PhaseMap({ phases, homeTeam, awayTeam }: { phases: PhaseReport; homeTeam: string; awayTeam: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = 900;
  const height = 500;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Pitch background (static, no animation — this is a study diagram)
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#1a5c2a');
    grad.addColorStop(1, '#0a3d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Three vertical zones — defensive / middle / attacking third
    const zoneWidth = (width - 80) / 3;
    const zones: { label: string; phase: keyof PhaseReport; x: number }[] = [
      { label: 'Regaining possession', phase: 'regain', x: 40 },
      { label: 'Building the attack',  phase: 'build',  x: 40 + zoneWidth },
      { label: 'Finishing',            phase: 'finish', x: 40 + zoneWidth * 2 },
    ];

    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    zones.forEach((zone, i) => {
      const summary = phases[zone.phase];
      // Zone fill intensity based on event volume in that phase
      const maxEvents = Math.max(...zones.map(z => phases[z.phase].events.length), 1);
      const intensity = summary.events.length / maxEvents;
      ctx.fillStyle = `rgba(240, 180, 41, ${0.08 + intensity * 0.22})`;
      ctx.fillRect(zone.x, 40, zoneWidth, height - 80);

      if (i > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(zone.x, 40);
        ctx.lineTo(zone.x, height - 40);
        ctx.stroke();
      }

      // Zone label
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(zone.label, zone.x + zoneWidth / 2, 70);

      // Success rate — the big number
      ctx.fillStyle = '#f0b429';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(`${summary.successRate}%`, zone.x + zoneWidth / 2, height / 2);

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '12px sans-serif';
      ctx.fillText('success rate', zone.x + zoneWidth / 2, height / 2 + 24);
      ctx.fillText(`${summary.events.length} events`, zone.x + zoneWidth / 2, height / 2 + 42);
    });

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('GRS TACTICAL LAB', width / 2, height - 55);
  }, [phases]);

  return <canvas ref={canvasRef} width={width} height={height} className="w-full rounded-xl shadow-2xl border border-[#f0b429]/20" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE QUESTION CARDS — the brainstorm's core teaching pattern, rendered
// ─────────────────────────────────────────────────────────────────────────────
function PhaseQuestionCard({ phase, label, icon }: { phase: keyof PhaseReport; label: string; icon: string }) {
  return null; // placeholder type retained for clarity; real render happens inline below
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCH ODDS — unchanged
// ─────────────────────────────────────────────────────────────────────────────
function MatchOdds({ match }: { match: Match | null }) {
  if (!match) return null;
  const odds = { home: 2.10, draw: 3.20, away: 2.15 };
  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200">
      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><TrendingUp size={14} className="text-[#1a5c2a]" /> Final Odds</h3>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-500">{match.homeTeam}</p><p className="text-lg font-bold text-[#1a5c2a]">{odds.home}</p></div>
        <div className="p-2 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-500">Draw</p><p className="text-lg font-bold text-[#1a5c2a]">{odds.draw}</p></div>
        <div className="p-2 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-500">{match.awayTeam}</p><p className="text-lg font-bold text-[#1a5c2a]">{odds.away}</p></div>
      </div>
      <p className="text-[8px] text-gray-400 text-center mt-2">For reference only</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARE BUTTONS — unchanged, copy updated to "Tactical Report"
// ─────────────────────────────────────────────────────────────────────────────
function ShareButtons({ match }: { match: Match | null }) {
  const [copied, setCopied] = useState(false);
  if (!match) return null;
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/world-cup?match=${match.id}` : '';
  const shareText = `📊 Tactical Report: ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam} — study it on GrassRoots Sports!`;
  const copyLink = async () => { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
  return (
    <div className="flex gap-2">
      <button onClick={copyLink} className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition">
        {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied!' : 'Copy Link'}
      </button>
      <button onClick={shareWhatsApp} className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#25D366] text-white hover:bg-[#20b859] rounded-lg text-sm font-medium transition">
        <MessageCircle size={14} /> Share
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HIGHLIGHTS MODAL — unchanged, links to YouTube's own player (genuinely safe)
// ─────────────────────────────────────────────────────────────────────────────
interface Highlight { id: string; title: string; thumbnail: string; }

function HighlightsModal({ match, onClose }: { match: Match | null; onClose: () => void }) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    if (!match) return;
    setLoading(true);
    fetch(`/api/youtube/search?q=${encodeURIComponent(`${match.homeTeam} vs ${match.awayTeam} world cup 2026 highlights`)}`)
      .then(r => r.json())
      .then(data => {
        if (data.items) {
          setHighlights(data.items.map((item: any) => ({
            id: item.id.videoId, title: item.snippet.title, thumbnail: item.snippet.thumbnails.medium.url,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [match]);

  if (!match) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-[#1a5c2a] to-[#0d3d1a] p-4 text-white flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2"><Youtube size={18} className="text-red-500" /> Match Highlights</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          {selectedVideo ? (
            <div>
              <iframe src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`} className="w-full aspect-video rounded-lg" allowFullScreen />
              <button onClick={() => setSelectedVideo(null)} className="mt-3 text-sm text-[#1a5c2a] hover:underline">← Back to list</button>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#1a5c2a] border-t-transparent rounded-full animate-spin" /></div>
          ) : highlights.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No highlights available yet.</p>
          ) : (
            <div className="space-y-3">
              {highlights.map(h => (
                <div key={h.id} className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => setSelectedVideo(h.id)}>
                  <img src={h.thumbnail} alt={h.title} className="w-32 h-20 rounded object-cover" />
                  <div className="flex-1"><p className="text-sm font-medium line-clamp-2">{h.title}</p><p className="text-[10px] text-gray-400 mt-1">Click to watch ▶</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCH CARD — re-purposed: shows "Report ready" instead of "LIVE" pulse
// ─────────────────────────────────────────────────────────────────────────────
function MatchCard({ match, isSelected, onClick, isUnlocked, onUnlockClick }: {
  match: Match; isSelected: boolean; onClick: () => void; isUnlocked: boolean; onUnlockClick: (m: Match) => void;
}) {
  return (
    <button onClick={onClick} className={`w-full text-left p-4 rounded-2xl transition-all duration-200 ${isSelected ? 'bg-[#1a5c2a] text-white shadow-lg border-l-4 border-[#f0b429]' : 'bg-white border border-gray-200 hover:shadow-md'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-gray-900'}`}>{match.homeTeam}</span>
            {match.reportReady ? (
              <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">Report ready</span>
            ) : match.status === 'completed' ? (
              <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">Generating...</span>
            ) : (
              <span className="text-[9px] text-gray-400">{match.time}</span>
            )}
          </div>
          <div className={`text-sm mt-1 ${isSelected ? 'text-white/70' : 'text-gray-600'}`}>{match.awayTeam}</div>
        </div>
        <div className="text-right">
          {match.status === 'completed' && (
            <div className={`text-2xl font-black ${isSelected ? 'text-[#f0b429]' : 'text-[#1a5c2a]'}`}>{match.homeScore} - {match.awayScore}</div>
          )}
          <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><MapPin size={10} /> {match.city}</div>
        </div>
      </div>
      {match.status === 'completed' && !isUnlocked && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <button onClick={(e) => { e.stopPropagation(); onUnlockClick(match); }} className="text-xs text-[#1a5c2a] font-bold flex items-center gap-1"><Unlock size={10} /> Register to study free</button>
        </div>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FAN REGISTRATION MODAL — unchanged
// ─────────────────────────────────────────────────────────────────────────────
function FanRegistrationModal({ onClose, onRegisterSuccess }: { onClose: () => void; onRegisterSuccess: () => void }) {
  const [fullName, setFullName]   = useState('');
  const [country, setCountry]     = useState('Zimbabwe');
  const [contactType, setContactType] = useState<'phone' | 'email'>('phone');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [password, setPassword]   = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const COUNTRIES = ['Zimbabwe', 'South Africa', 'Zambia', 'Botswana', 'Malawi', 'Mozambique', 'Namibia', 'Other'];
  const contactValid = contactType === 'email' ? email.includes('@') : phone.replace(/\D/g, '').length >= 9;
  const canSubmit = fullName.trim().length >= 2 && contactValid && password.length >= 6;

  const handleRegister = async () => {
    setIsSubmitting(true); setError(null);
    try {
      const parts = fullName.trim().split(' ');
      const body: Record<string, unknown> = {
        first_name: parts[0], surname: parts.slice(1).join(' ') || parts[0],
        name: fullName.trim(), country, password, password_confirmation: password, role: 'fan',
      };
      if (contactType === 'email') body.email = email.trim().toLowerCase();
      else body.phone = phone.trim();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Registration failed');
      onRegisterSuccess(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong'); }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl p-6 bg-[#111f14] border border-[rgba(240,180,41,0.2)] relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 text-white/40"><X size={18} /></button>
        <h2 className="text-lg font-black text-white mb-1">Join the Tactical Lab</h2>
        <p className="text-xs mb-5 text-white/35">Register free to study full tactical reports and quiz yourself.</p>
        {error && <div className="mb-4 p-2.5 rounded-xl text-xs bg-red-500/10 border border-red-500/25 text-red-300">{error}</div>}
        <div className="space-y-4">
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name"
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-[#1a3a20] border border-white/8 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          <select value={country} onChange={e => setCountry(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-[#1a3a20] border border-white/8 focus:outline-none focus:ring-2 focus:ring-yellow-500">
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={() => setContactType('phone')} className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-all ${contactType === 'phone' ? 'bg-[#f0b429] text-[#0a1a0f] border-[#f0b429]' : 'bg-transparent border-white/12 text-white/50'}`}>Phone</button>
            <button onClick={() => setContactType('email')} className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-all ${contactType === 'email' ? 'bg-[#f0b429] text-[#0a1a0f] border-[#f0b429]' : 'bg-transparent border-white/12 text-white/50'}`}>Email</button>
          </div>
          {contactType === 'phone' ? (
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+263 77 123 4567"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-[#1a3a20] border border-white/8 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          ) : (
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-[#1a3a20] border border-white/8 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          )}
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 6 characters)"
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-[#1a3a20] border border-white/8 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          <button disabled={!canSubmit || isSubmitting} onClick={handleRegister}
            className={`w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${canSubmit && !isSubmitting ? 'bg-[#f0b429] text-[#0a1a0f]' : 'bg-white/7 text-white/25 cursor-not-allowed'}`}>
            {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Join & Study Free'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function WorldCupTacticalLabPage() {
  const { user, token } = useAuthStore();

  const [matches, setMatches]               = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch]    = useState<Match | null>(null);
  const [report, setReport]                  = useState<TacticalReport | null>(null);
  const [reportLoading, setReportLoading]    = useState(false);
  const [isLoading, setIsLoading]            = useState(true);
  const [error, setError]                    = useState<string | null>(null);
  const [showHighlightsModal, setShowHighlightsModal] = useState(false);
  const [unlockedMatches, setUnlockedMatches] = useState<string[]>([]);
  const [showFanRegister, setShowFanRegister] = useState(false);
  const [tacticalIQ, setTacticalIQ]          = useState<TacticalIQResult | null>(null);
  const [liveMatches, setLiveMatches]        = useState<LiveScoreboardMatch[]>([]);
  const hasSetInitial = useRef(false);
  const UNLOCK_KEY = 'wc_unlocked_matches';

  const authToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
  const gender = (typeof window !== 'undefined' ? localStorage.getItem('player_gender') : null) as 'male' | 'female' | null ?? 'male';

  const loadUnlocked = (): string[] => { try { return JSON.parse(localStorage.getItem(UNLOCK_KEY) ?? '[]'); } catch { return []; } };
  const saveUnlocked = (ids: string[]) => localStorage.setItem(UNLOCK_KEY, JSON.stringify(ids));

  useEffect(() => { setUnlockedMatches(loadUnlocked()); }, []);

  // ── Load completed matches ────────────────────────────────────────────────
  // No 3-second polling, no live socket — fetched once, refreshed manually
  useEffect(() => {
    const loadMatches = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/world-cup/matches?status=completed');
        if (!res.ok) throw new Error('Could not load matches');
        const data = await res.json();
        const transformed: Match[] = (data.matches ?? []).map((m: any) => ({
          id:          String(m.id),
          homeTeam:    m.home_team,
          awayTeam:    m.away_team,
          homeScore:   m.home_score ?? 0,
          awayScore:   m.away_score ?? 0,
          status:      'completed',
          date:        m.date ?? '',
          time:        m.time ?? '',
          stadium:     m.stadium ?? 'TBD',
          city:        m.city ?? 'TBD',
          reportReady: !!m.tactical_report_generated,
        }));
        setMatches(transformed);
        if (transformed.length > 0 && !hasSetInitial.current) {
          setSelectedMatch(transformed[0]);
          hasSetInitial.current = true;
        }
      } catch {
        setError('Could not load match list. Please try again shortly.');
      }
      setIsLoading(false);
    };
    loadMatches();
  }, []);

  // ── Muted live scoreboard ────────────────────────────────────────────────
  // Deliberately the ONLY "live" surface on this page, and deliberately thin:
  //   - 60-second poll, not 3-second — this is a scoreboard refresh, not a
  //     simulated real-time feed
  //   - Returns score, minute, possession % only — no event log, no ball
  //     position, no player coordinates, no commentary text or audio
  //   - No mute/unmute control because there is nothing to mute — there was
  //     never any audio here in the first place
  // A fixture moving from this strip into the main "completed" list is what
  // triggers the Tactical Report becoming available, ~15 min after full-time.
  useEffect(() => {
    const loadLive = async () => {
      try {
        const res = await fetch('/api/world-cup/matches?status=live');
        if (!res.ok) return;
        const data = await res.json();
        setLiveMatches((data.matches ?? []).map((m: any) => ({
          id:              String(m.id),
          homeTeam:        m.home_team,
          awayTeam:        m.away_team,
          homeScore:       m.home_score ?? 0,
          awayScore:       m.away_score ?? 0,
          minute:          m.minute ?? 0,
          possessionHome:  m.possession_home ?? 50,
          possessionAway:  m.possession_away ?? 50,
        })));
      } catch { /* silent — scoreboard is supplementary, not critical path */ }
    };
    loadLive();
    const interval = setInterval(loadLive, 60_000);
    return () => clearInterval(interval);
  }, []);

  // ── Load the Tactical Report for the selected match ───────────────────────
  useEffect(() => {
    if (!selectedMatch || !selectedMatch.reportReady) { setReport(null); return; }
    setReportLoading(true);
    fetch(`/api/world-cup/reports/${selectedMatch.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setReport(data?.available ? data : null))
      .catch(() => setReport(null))
      .finally(() => setReportLoading(false));
  }, [selectedMatch]);

  // ── Load the player's running Tactical IQ ─────────────────────────────────
  useEffect(() => {
    if (!authToken) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/tactical-iq/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.answers) setTacticalIQ(calculateTacticalIQ(data.answers)); })
      .catch(() => {});
  }, [authToken]);

  const handleUnlockMatch = () => setShowFanRegister(true);

  const onRegisterSuccess = () => {
    const allIds = matches.map(m => m.id);
    setUnlockedMatches(allIds);
    saveUnlocked(allIds);
    window.location.href = '/login?registered=1';
  };

  const isMatchUnlocked = (matchId: string) =>
    unlockedMatches.includes(matchId) || unlockedMatches.length > 0;

  const handleQuizAnswered = async (moment: QuizMoment, wasOptimal: boolean) => {
    if (!authToken || !selectedMatch) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tactical-iq/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          matchId:        selectedMatch.id,
          quizMomentId:   moment.id,
          chosenOptionId: moment.options.find(o => o.isOptimal === wasOptimal)?.id ?? moment.options[0].id,
          wasOptimal,
          zone:           moment.zone,
        }),
      });
    } catch {}
  };

  const phaseIcons: Record<keyof PhaseReport, string> = { regain: '🛡️', build: '⚙️', finish: '🎯' };
  const phaseLabels: Record<keyof PhaseReport, string> = { regain: 'Regaining Possession', build: 'Building the Attack', finish: 'Finishing' };

  return (
    <div className="min-h-screen bg-[#f4f2ee]">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#1a5c2a] to-[#0d3d1a] text-white border-b-4 border-[#f0b429]">
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-[#f0b429] rounded-lg flex items-center justify-center">
                  <span className="text-black font-black text-sm">GRS</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">World Cup Tactical Lab</h1>
                <span className="bg-white/10 text-white text-[10px] px-2 py-0.5 rounded-full">EDUCATIONAL · POST-MATCH</span>
              </div>
              <p className="text-white/80 text-sm">Study every match like a coach. Reports unlock after full-time.</p>
            </div>
            <div className="flex items-center gap-4">
              {tacticalIQ && (
                <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-xl text-center">
                  <div className="text-[9px] text-white/60 uppercase tracking-wide">Your Tactical IQ</div>
                  <div className="text-xl font-black text-[#f0b429]">{tacticalIQ.score}</div>
                </div>
              )}
              <button onClick={() => setShowFanRegister(true)} className="px-4 py-1.5 bg-[#f0b429] text-[#1a5c2a] rounded-lg text-xs font-bold hover:bg-[#d6a020] transition">
                Join as Fan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PERKS */}
      <div className="max-w-[1400px] mx-auto px-4 pt-4"><PerksList /></div>

      {/* MAIN CONTENT */}
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center"><p className="text-red-600">{error}</p></div>
        ) : isLoading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#1a5c2a] border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* LEFT — match list */}
            <div className="lg:col-span-3 space-y-4">

              {/* Muted live scoreboard — score, minute, possession only.
                  No audio control because there is no audio. No "watch live"
                  language. This is a scoreboard, not a broadcast surface. */}
              {liveMatches.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">
                    <Activity size={14} /> In progress
                  </h2>
                  <div className="space-y-3">
                    {liveMatches.map(m => (
                      <div key={m.id} className="text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-800 truncate">{m.homeTeam} v {m.awayTeam}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{m.minute}'</span>
                        </div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-base font-black text-[#1a5c2a]">{m.homeScore} – {m.awayScore}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                          <div className="h-full bg-[#1a5c2a]" style={{ width: `${m.possessionHome}%` }} />
                          <div className="h-full bg-red-400" style={{ width: `${m.possessionAway}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-gray-300 mt-3 pt-2 border-t border-gray-100">
                    Tactical Report available ~15 min after full-time
                  </p>
                </div>
              )}

              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">
                  <Calendar size={14} /> Completed Matches
                </h2>
                {matches.length === 0 ? (
                  <p className="text-xs text-gray-500 italic py-4 text-center">No completed matches yet. Check back after kickoff.</p>
                ) : (
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {matches.map(match => (
                      <MatchCard key={match.id} match={match} isSelected={selectedMatch?.id === match.id}
                        onClick={() => setSelectedMatch(match)} isUnlocked={isMatchUnlocked(match.id)}
                        onUnlockClick={handleUnlockMatch} />
                    ))}
                  </div>
                )}
              </div>
              <AdBanner tier="BRONZE" />
            </div>


            {/* CENTER — the tactical report itself */}
            <div className="lg:col-span-6 space-y-6">
              {!selectedMatch ? (
                <div className="bg-white rounded-2xl p-12 text-center border shadow-sm text-gray-500">
                  Select a completed match to open its Tactical Report.
                </div>
              ) : !isMatchUnlocked(selectedMatch.id) ? (
                <div className="bg-white rounded-2xl p-8 text-center border shadow-sm">
                  <Lock size={32} className="mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Report Locked</h3>
                  <p className="text-sm text-gray-500 mb-4">Register free to study full tactical reports</p>
                  <button onClick={() => setShowFanRegister(true)} className="px-5 py-2.5 bg-[#1a5c2a] text-white rounded-xl text-sm font-bold">Register Free</button>
                </div>
              ) : !selectedMatch.reportReady ? (
                <div className="bg-white rounded-2xl p-8 text-center border shadow-sm">
                  <Loader2 size={28} className="mx-auto text-amber-500 mb-3 animate-spin" />
                  <h3 className="text-base font-bold text-gray-900 mb-1">Report generating</h3>
                  <p className="text-sm text-gray-500">Tactical reports are ready within 15 minutes of full-time. Check back shortly.</p>
                </div>
              ) : (
                <>
                  {/* Score header */}
                  <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="text-center flex-1">
                        <span className="text-gray-400 text-xs uppercase">HOME</span>
                        <p className="text-gray-800 font-bold text-xl mt-1">{selectedMatch.homeTeam}</p>
                        <p className="text-4xl font-black text-[#1a5c2a] mt-1">{selectedMatch.homeScore}</p>
                      </div>
                      <div className="text-center px-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"><span className="text-gray-500 text-xs font-mono">FT</span></div>
                      </div>
                      <div className="text-center flex-1">
                        <span className="text-gray-400 text-xs uppercase">AWAY</span>
                        <p className="text-gray-800 font-bold text-xl mt-1">{selectedMatch.awayTeam}</p>
                        <p className="text-4xl font-black text-[#1a5c2a] mt-1">{selectedMatch.awayScore}</p>
                      </div>
                    </div>
                    <div className="flex justify-center items-center gap-2 mt-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                      <MapPin size={12} /> {selectedMatch.stadium}
                    </div>
                  </div>

                  {reportLoading ? (
                    <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#1a5c2a] border-t-transparent rounded-full animate-spin" /></div>
                  ) : report ? (
                    <>
                      {/* Phase map — static study diagram, not a live ball tracker */}
                      <div className="bg-white rounded-2xl p-2 shadow-md border border-gray-200">
                        <div className="flex items-center justify-between px-3 pt-2 pb-1">
                          <div className="flex items-center gap-1 text-[10px] text-gray-500"><Tv size={12} /> THREE PHASES OF PLAY</div>
                        </div>
                        <PhaseMap phases={report.phases} homeTeam={selectedMatch.homeTeam} awayTeam={selectedMatch.awayTeam} />
                      </div>

                      {/* THUTO/Amara narrative — generated once, not performed live */}
                      <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-9 h-9 rounded-full bg-[#1a5c2a] flex items-center justify-center font-black text-[#f0b429] text-sm flex-shrink-0">
                            {gender === 'female' ? 'A' : 'T'}
                          </div>
                          <h3 className="text-sm font-bold text-gray-900">{gender === 'female' ? 'Amara' : 'THUTO'}'s tactical read</h3>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{report.narrative}</p>
                      </div>

                      {/* Phase question cards — the brainstorm's exact teaching pattern */}
                      <div className="space-y-3">
                        {(['regain', 'build', 'finish'] as const).map(phase => (
                          <div key={phase} className="bg-white rounded-2xl p-4 shadow-md border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{phaseIcons[phase]}</span>
                              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">{phaseLabels[phase]}</h4>
                              <span className="ml-auto text-xs font-bold text-[#1a5c2a]">{report.phases[phase].successRate}% success</span>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">{buildPhaseQuestion(phase, report.phases[phase])}</p>
                          </div>
                        ))}
                      </div>

                      {/* What Would You Do? quizzes */}
                      {report.quizMoments.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Brain size={16} className="text-[#1a5c2a]" /> What Would You Do?</h3>
                          {report.quizMoments.map(moment => (
                            <WhatWouldYouDo key={moment.id} moment={moment} gender={gender}
                              onAnswered={(wasOptimal) => handleQuizAnswered(moment, wasOptimal)} />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-white rounded-2xl p-8 text-center border shadow-sm text-gray-500">
                      Report data unavailable. Please try again shortly.
                    </div>
                  )}

                  {selectedMatch.status === 'completed' && (
                    <button onClick={() => setShowHighlightsModal(true)} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition flex items-center justify-center gap-2">
                      <Youtube size={16} /> Watch Match Highlights
                    </button>
                  )}
                </>
              )}
            </div>

            {/* RIGHT — ads, odds, share */}
            <div className="lg:col-span-3 space-y-4">
              <AdBanner tier="GOLD" />
              <AdBanner tier="SILVER" />
              <MatchOdds match={selectedMatch} />
              <ShareButtons match={selectedMatch} />
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showHighlightsModal && selectedMatch && <HighlightsModal match={selectedMatch} onClose={() => setShowHighlightsModal(false)} />}
      {showFanRegister && <FanRegistrationModal onClose={() => setShowFanRegister(false)} onRegisterSuccess={onRegisterSuccess} />}
    </div>
  );
}