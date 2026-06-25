'use client';

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

import jsPDF from 'jspdf';
import { useState, useEffect, useRef } from 'react';
import {
  MapPin, Calendar, RefreshCw, Tv, Activity, Share2, Copy, Check,
  TrendingUp, Clock, Youtube, MessageCircle, Lock, Unlock,
  Loader2, X, Star, Users, Trophy as TrophyIcon, Brain, ChevronRight,
  FileDown, Download, FileText, Award, CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { classifyPhases, buildPhaseQuestion, type PhaseReport, type MatchEvent, type MatchStats } from '@/lib/tactical-iq/phase-classifier';
import { type QuizMoment } from '@/lib/tactical-iq/quiz-generator';
import { calculateTacticalIQ, type QuizAnswer, type TacticalIQResult } from '@/lib/tactical-iq/tactical-iq-engine';
import WhatWouldYouDo from '@/lib/tactical-iq/WhatWouldYouDo';
import { BlueprintPurchaseModal } from '@/lib/tactical-iq/BlueprintPurchaseModal';

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
// COACHING BLUEPRINTS — premium $4.99 per-match PDF coaching microcycle
// ─────────────────────────────────────────────────────────────────────────────
interface TrainingModule {
  title: string;
  focus: string;
  drills: { name: string; setup: string; reps: string; coachingPoint: string }[];
}

const BLUEPRINT_DAY_PLAN = [
  'Recovery + Tactical Video Review',
  'Core Weakness Drill Session',
  'Drill Progression + Small-Sided Game',
  'Tactical Shape Training',
  'Match Simulation — Apply the Blueprint',
];

function getModulesFromPhases(phases: PhaseReport): TrainingModule[] {
  const modules: TrainingModule[] = [];

  if (phases.regain.successRate < 40) {
    modules.push({
      title: 'Pressing Triggers',
      focus: 'Win the ball back quicker in transition',
      drills: [
        {
          name: 'Shadow Pressing',
          setup: '8v8 + 2 neutrals in half pitch. GK plays short = press trigger. Force play wide, never inside.',
          reps: '4 × 6-min rounds',
          coachingPoint: 'Press in pairs — never solo. If the first presser gets beaten, the second must be there.',
        },
        {
          name: 'Counter-Press Rondo',
          setup: '5v5 in 20×20m. Team that loses possession has a 5-second window to win it back immediately.',
          reps: '6 × 4-min rounds',
          coachingPoint: 'First 3 seconds after losing the ball is the press window. After that — drop and organise.',
        },
      ],
    });
  }

  if (phases.build.successRate < 40) {
    modules.push({
      title: 'Positional Play Under Pressure',
      focus: 'Play through the midfield press with composure',
      drills: [
        {
          name: '4v2 Positional Rondo',
          setup: '4 attackers vs 2 defenders in 15×15m grid. 8 passes = 1 point. Rotate defenders every 2 min.',
          reps: '5 × 5-min rounds',
          coachingPoint: 'Move before receiving. Create a third-man option behind the press — never play into pressure.',
        },
        {
          name: 'Build-Out Pattern 11v6',
          setup: 'Full team vs 6-man high press. GK → CB → CM → wide player sequence. Restart on GK each time.',
          reps: '3 × 10-min runs',
          coachingPoint: 'Goalkeeper is a real passing option, not a last resort. No hoofing under pressure.',
        },
      ],
    });
  }

  if (phases.finish.successRate < 40) {
    modules.push({
      title: 'Clinical Finishing',
      focus: 'Convert chances in the final third',
      drills: [
        {
          name: 'Combination Finishing 2v1',
          setup: '2 attackers vs 1 defender, entering from midfield. Vary angle and distance of approach each rep.',
          reps: '20 reps each side',
          coachingPoint: 'Communicate before the box — "square it" or "shoot". Hesitation inside the area is fatal.',
        },
        {
          name: 'Crossing & Arrival Timing',
          setup: 'Winger crosses from 3 zones (byline, cut-back, early cross). 2 strikers attack near/far post on cue.',
          reps: '25 crosses per winger',
          coachingPoint: 'Late arrival into the box hits the ball harder than an early run that slows down.',
        },
      ],
    });
  }

  if (modules.length === 0) {
    modules.push({
      title: 'Advanced Transition Play',
      focus: 'Exploit both defensive and attacking transitions',
      drills: [
        {
          name: 'Counter-Attack Burst 3v2',
          setup: 'GK distributes to CM. Instant 3v2 fast break. Add a covering defender after every 5 reps.',
          reps: '15 reps each way',
          coachingPoint: '2 touches maximum in the break. First pass sets the angle, second pass or shot finishes.',
        },
        {
          name: 'Transition Game 6v6',
          setup: '6v6 on 40×50m. Goal only counts if scored within 6 seconds of winning possession.',
          reps: '4 × 8-min rounds',
          coachingPoint: 'Attack the space between defenders — not the man. Speed of decision beats speed of running.',
        },
      ],
    });
  }

  return modules;
}

function generateModulePDF(match: Match, phases: PhaseReport, modules: TrainingModule[]): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const H = 297;
  const margin = 14;

  // ── PAGE 1: Title + Phase Summary + Module Overview ────────────────────────
  doc.setFillColor(26, 92, 42);
  doc.rect(0, 0, W, 58, 'F');
  doc.setFillColor(240, 180, 41);
  doc.rect(0, 58, W, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(240, 180, 41);
  doc.text('GRS COACHING BLUEPRINTS', W / 2, 18, { align: 'center' });

  doc.setFontSize(19);
  doc.setTextColor(255, 255, 255);
  doc.text('5-Day Training Microcycle', W / 2, 34, { align: 'center' });

  doc.setFontSize(11);
  doc.text(`${match.homeTeam}  ${match.homeScore} – ${match.awayScore}  ${match.awayTeam}`, W / 2, 48, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Based on the AI tactical report generated by GrassRoots Sports.', margin, 72);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, 80);

  // Phase summary box
  doc.setFillColor(245, 250, 246);
  doc.roundedRect(margin, 88, W - margin * 2, 50, 3, 3, 'F');
  doc.setDrawColor(26, 92, 42);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, 88, W - margin * 2, 50, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(26, 92, 42);
  doc.text('MATCH PHASE ANALYSIS', margin + 4, 97);

  const phaseRows = [
    { label: 'Regaining Possession', rate: phases.regain.successRate },
    { label: 'Building the Attack',  rate: phases.build.successRate },
    { label: 'Finishing',            rate: phases.finish.successRate },
  ];
  phaseRows.forEach((p, i) => {
    const y = 107 + i * 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(`${p.label}:`, margin + 4, y);

    const col: [number, number, number] = p.rate < 40 ? [190, 40, 40] : p.rate < 60 ? [180, 120, 0] : [26, 92, 42];
    doc.setTextColor(col[0], col[1], col[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`${p.rate}% success`, 118, y);

    if (p.rate < 40) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.text('  ← focus area this week', 145, y);
    }
  });

  // Modules overview
  let y = 152;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(26, 92, 42);
  doc.text('TRAINING FOCUS THIS WEEK', margin, y);
  y += 8;

  modules.forEach((mod, i) => {
    doc.setFillColor(240, 180, 41);
    doc.rect(margin, y + 1, 2, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(`${i + 1}. ${mod.title}`, margin + 6, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(mod.focus, margin + 6, y + 13);
    y += 22;
  });

  // Footer
  doc.setFillColor(26, 92, 42);
  doc.rect(0, H - 14, W, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text("GrassRoots Sports · grassrootssports.live · Zimbabwe's First AI Sports Platform", W / 2, H - 6, { align: 'center' });

  // ── PAGE 2: 5-Day Plan ─────────────────────────────────────────────────────
  doc.addPage();

  doc.setFillColor(26, 92, 42);
  doc.rect(0, 0, W, 18, 'F');
  doc.setTextColor(240, 180, 41);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('5-DAY MICROCYCLE PLAN', W / 2, 12, { align: 'center' });

  y = 26;
  BLUEPRINT_DAY_PLAN.forEach((dayLabel, dayIdx) => {
    const isModuleDay = dayIdx >= 1 && dayIdx <= 3;
    const mod = isModuleDay ? modules[dayIdx - 1] : null;
    const boxH = mod ? 54 : 22;

    doc.setFillColor(245, 250, 246);
    doc.roundedRect(margin, y, W - margin * 2, boxH, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(26, 92, 42);
    doc.text(`DAY ${dayIdx + 1}`, margin + 4, y + 7);

    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(mod ? mod.title : dayLabel, margin + 20, y + 7);

    if (mod) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(`Focus: ${mod.focus}`, margin + 4, y + 16);

      mod.drills.forEach((drill, di) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        doc.text(`• ${drill.name}  (${drill.reps})`, margin + 4, y + 26 + di * 12);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(110, 110, 110);
        const lines = doc.splitTextToSize(drill.setup, W - margin * 2 - 10) as string[];
        doc.text(lines[0], margin + 8, y + 32 + di * 12);
      });
      y += boxH + 6;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(dayLabel, margin + 4, y + 16);
      y += boxH + 6;
    }
  });

  // ── PAGE 3: Drill Cards ────────────────────────────────────────────────────
  doc.addPage();

  doc.setFillColor(26, 92, 42);
  doc.rect(0, 0, W, 18, 'F');
  doc.setTextColor(240, 180, 41);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('DRILL CARDS', W / 2, 12, { align: 'center' });

  y = 24;
  modules.forEach((mod) => {
    if (y > H - 70) { doc.addPage(); y = 20; }

    doc.setFillColor(240, 180, 41);
    doc.rect(margin, y, W - margin * 2, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(26, 92, 42);
    doc.text(mod.title.toUpperCase(), margin + 4, y + 6);
    y += 12;

    mod.drills.forEach((drill) => {
      if (y > H - 58) { doc.addPage(); y = 20; }

      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, W - margin * 2, 50, 2, 2, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.text(drill.name, margin + 4, y + 8);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 92, 42);
      doc.text('SETUP', margin + 4, y + 17);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      const setupLines = doc.splitTextToSize(drill.setup, W - margin * 2 - 8) as string[];
      doc.text(setupLines.slice(0, 2), margin + 4, y + 23);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(26, 92, 42);
      doc.text('REPS', margin + 110, y + 17);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      doc.text(drill.reps, margin + 110, y + 23);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(200, 130, 0);
      doc.text('COACHING POINT', margin + 4, y + 37);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      const cpLines = doc.splitTextToSize(drill.coachingPoint, W - margin * 2 - 8) as string[];
      doc.text(cpLines.slice(0, 2), margin + 4, y + 43);

      y += 56;
    });
    y += 4;
  });

  // Stamp every page with footer
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(26, 92, 42);
    doc.rect(0, H - 10, W, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(
      `GRS Coaching Blueprint · ${match.homeTeam} vs ${match.awayTeam} · Page ${p} of ${totalPages}`,
      W / 2, H - 4, { align: 'center' }
    );
  }

  doc.save(`GRS-Blueprint-${match.homeTeam.replace(/\s+/g, '-')}-vs-${match.awayTeam.replace(/\s+/g, '-')}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// AFTER-MATCH ACADEMY TYPES + CERTIFICATE PDF
// ─────────────────────────────────────────────────────────────────────────────
type ClassStage = 'locked' | 'analysis' | 'quiz' | 'results';

interface MCQuestion {
  id:          number;
  question:    string;
  options:     string[];
  correct:     number; // 0-indexed
  explanation: string;
  category:    'tactical' | 'technical' | 'physical' | 'mental' | 'rules';
}

function generateCertificatePDF(
  match: Match,
  score: number,
  total: number,
  playerName: string,
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297; const H = 210;
  const pct = Math.round((score / total) * 100);

  // Gold border
  doc.setDrawColor(240, 180, 41);
  doc.setLineWidth(6);
  doc.rect(6, 6, W - 12, H - 12);
  doc.setLineWidth(1.5);
  doc.rect(10, 10, W - 20, H - 20);

  // Header
  doc.setFillColor(26, 92, 42);
  doc.rect(0, 0, W, 30, 'F');
  doc.setTextColor(240, 180, 41);
  doc.setFontSize(9); doc.text('GRASSROOTS SPORTS', W / 2, 10, { align: 'center' });
  doc.setFontSize(20); doc.text('AFTER-MATCH TACTICAL ACADEMY', W / 2, 22, { align: 'center' });

  // Certificate title
  doc.setTextColor(26, 92, 42);
  doc.setFontSize(32);
  doc.text('Certificate of Completion', W / 2, 60, { align: 'center' });

  // Body
  doc.setFontSize(14); doc.setTextColor(80, 80, 80);
  doc.text('This certifies that', W / 2, 78, { align: 'center' });

  doc.setFontSize(26); doc.setTextColor(26, 92, 42);
  doc.text(playerName || 'GRS Student', W / 2, 95, { align: 'center' });

  doc.setFontSize(14); doc.setTextColor(80, 80, 80);
  doc.text('has successfully completed the After-Match Tactical Class for', W / 2, 110, { align: 'center' });

  doc.setFontSize(18); doc.setTextColor(26, 92, 42);
  doc.text(`${match.homeTeam} vs ${match.awayTeam}`, W / 2, 124, { align: 'center' });

  doc.setFontSize(12); doc.setTextColor(80, 80, 80);
  doc.text(`Score: ${score} / ${total} — ${pct}%   ·   Date: ${new Date().toLocaleDateString('en-GB')}`, W / 2, 138, { align: 'center' });

  // Grade badge
  const grade = pct >= 80 ? 'DISTINCTION' : pct >= 60 ? 'MERIT' : 'PASS';
  const gradeColor: [number, number, number] = pct >= 80 ? [26, 92, 42] : pct >= 60 ? [37, 99, 235] : [180, 83, 9];
  doc.setFillColor(...gradeColor);
  doc.roundedRect(W / 2 - 30, 144, 60, 14, 4, 4, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(11);
  doc.text(grade, W / 2, 153, { align: 'center' });

  // Footer
  doc.setFillColor(26, 92, 42);
  doc.rect(0, H - 20, W, 20, 'F');
  doc.setTextColor(240, 180, 41); doc.setFontSize(8);
  doc.text('grassrootssports.live  ·  Zimbabwe\'s AI-Powered Grassroots Sports Platform', W / 2, H - 8, { align: 'center' });

  doc.save(`GRS-Certificate-${match.homeTeam.replace(/\s+/g, '-')}-vs-${match.awayTeam.replace(/\s+/g, '-')}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function WorldCupTacticalLabPage() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [matches, setMatches]               = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch]    = useState<Match | null>(null);
  const [report, setReport]                  = useState<TacticalReport | null>(null);
  const [reportLoading, setReportLoading]    = useState(false);
  const [isLoading, setIsLoading]            = useState(true);
  const [error, setError]                    = useState<string | null>(null);
  const [showHighlightsModal, setShowHighlightsModal] = useState(false);
  const [showFanRegister, setShowFanRegister] = useState(false);
  const [liveMatches, setLiveMatches]        = useState<LiveScoreboardMatch[]>([]);
  const [purchasedBlueprints, setPurchasedBlueprints] = useState<string[]>([]);
  const [showBlueprintModal, setShowBlueprintModal]   = useState(false);
  const [hasPurchasedBlueprint, setHasPurchasedBlueprint] = useState(false);
  const [authToken, setAuthToken]            = useState<string | null>(null);
  const [gender, setGender]                  = useState<'male' | 'female'>('male');
  // Academy stages
  const [classStage, setClassStage]         = useState<ClassStage>('locked');
  const [quizQuestions, setQuizQuestions]   = useState<MCQuestion[]>([]);
  const [userAnswers, setUserAnswers]        = useState<Record<number, number>>({});
  const [quizScore, setQuizScore]           = useState(0);
  const [quizLoading, setQuizLoading]       = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const hasSetInitial = useRef(false);

  useEffect(() => {
    setAuthToken(token ?? localStorage.getItem('auth_token'));
    const stored = localStorage.getItem('player_gender');
    if (stored === 'female') setGender('female');
  }, [token]);

  // Reset stage when selected match changes
  useEffect(() => {
    if (!selectedMatch) return;
    setClassStage(hasPurchasedBlueprint ? 'analysis' : 'locked');
    setQuizQuestions([]);
    setUserAnswers({});
    setQuizScore(0);
  }, [selectedMatch?.id]);

  // ── Load purchased blueprints + handle Stripe return ─────────────────────
  useEffect(() => {
    try {
      const stored: string[] = JSON.parse(localStorage.getItem('grs_blueprints') ?? '[]');
      setPurchasedBlueprints(stored);
    } catch { /* ignore */ }

    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const paidId = params.get('blueprint_paid');
    if (paidId) {
      setPurchasedBlueprints(prev => {
        const updated = [...new Set([...prev, paidId])];
        localStorage.setItem('grs_blueprints', JSON.stringify(updated));
        return updated;
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // ── Check whether the current match's blueprint has been purchased ────────
  useEffect(() => {
    if (!selectedMatch || !authToken) { setHasPurchasedBlueprint(false); return; }
    // Optimistic local check first
    if (purchasedBlueprints.includes(selectedMatch.id)) {
      setHasPurchasedBlueprint(true);
      return;
    }
    fetch(`/api/world-cup/matches/${selectedMatch.id}/check-purchase`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(r => r.json())
      .then(data => setHasPurchasedBlueprint(data.purchased || false))
      .catch(() => setHasPurchasedBlueprint(false));
  }, [selectedMatch, authToken]);

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


  const onRegisterSuccess = () => {
    window.location.href = '/login?registered=1';
  };

  const startQuiz = async () => {
    if (!selectedMatch) return;
    setQuizLoading(true);
    try {
      const context = `${selectedMatch.homeTeam} ${selectedMatch.homeScore}–${selectedMatch.awayScore} ${selectedMatch.awayTeam}`;
      const res = await fetch(`/api/world-cup/questions/${selectedMatch.id}?context=${encodeURIComponent(context)}`);
      const data = await res.json() as { questions: MCQuestion[] };
      setQuizQuestions(data.questions ?? []);
      setUserAnswers({});
      setClassStage('quiz');
    } catch {
      setError('Could not load quiz. Please try again.');
    } finally {
      setQuizLoading(false);
    }
  };

  const submitQuiz = async () => {
    if (!selectedMatch) return;
    setQuizSubmitting(true);
    const score = quizQuestions.reduce((acc, q) => acc + (userAnswers[q.id] === q.correct ? 1 : 0), 0);
    setQuizScore(score);
    setClassStage('results');
    // Fire-and-forget completion record
    try {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/world-cup/class-completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        body: JSON.stringify({ match_id: selectedMatch.id, score, total: quizQuestions.length }),
      }).catch(() => {});
    } catch {}
    setQuizSubmitting(false);
  };

  const phaseIcons: Record<keyof PhaseReport, string> = { regain: '🛡️', build: '⚙️', finish: '🎯' };
  const phaseLabels: Record<keyof PhaseReport, string> = { regain: 'Regaining Possession', build: 'Building the Attack', finish: 'Finishing' };

  const pct = quizQuestions.length > 0 ? Math.round((quizScore / quizQuestions.length) * 100) : 0;
  const modules = report ? getModulesFromPhases(report.phases) : [];

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
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">After-Match Academy</h1>
                <span className="bg-white/10 text-white text-[10px] px-2 py-0.5 rounded-full">$3 · ONE-TIME PER MATCH</span>
              </div>
              <p className="text-white/80 text-sm">Study every match like a coach. Earn a certificate. Download the full module.</p>
            </div>
            <div className="flex items-center gap-4">
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
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button onClick={() => setError(null)} className="mt-3 text-xs text-red-400 underline">Dismiss</button>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#1a5c2a] border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* LEFT — match list */}
            <div className="lg:col-span-3 space-y-4">
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
                    Class unlocks ~15 min after full-time
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
                        onClick={() => setSelectedMatch(match)} isUnlocked={true}
                        onUnlockClick={() => {}} />
                    ))}
                  </div>
                )}
              </div>
              <AdBanner tier="BRONZE" />
            </div>

            {/* CENTER — academy stages */}
            <div className="lg:col-span-6 space-y-6">
              {!selectedMatch ? (
                <div className="bg-white rounded-2xl p-12 text-center border shadow-sm text-gray-500">
                  Select a completed match to join the After-Match Class.
                </div>
              ) : !selectedMatch.reportReady ? (
                <div className="bg-white rounded-2xl p-8 text-center border shadow-sm">
                  <Loader2 size={28} className="mx-auto text-amber-500 mb-3 animate-spin" />
                  <h3 className="text-base font-bold text-gray-900 mb-1">Report generating</h3>
                  <p className="text-sm text-gray-500">Tactical reports are ready within 15 minutes of full-time.</p>
                </div>

              ) : classStage === 'locked' ? (
                /* ── LOCKED STAGE ─────────────────────────────────────────── */
                <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                  {/* Match preview header */}
                  <div className="bg-gradient-to-r from-[#1a5c2a] to-[#0d3d1a] p-6 text-white text-center">
                    <p className="text-white/60 text-xs uppercase tracking-wider mb-1">After-Match Class</p>
                    <h2 className="text-xl font-black">{selectedMatch.homeTeam} vs {selectedMatch.awayTeam}</h2>
                    <p className="text-2xl font-black text-[#f0b429] mt-1">{selectedMatch.homeScore} – {selectedMatch.awayScore}</p>
                    <p className="text-white/50 text-xs mt-2 flex items-center justify-center gap-1"><MapPin size={11} />{selectedMatch.stadium}</p>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <Lock size={18} className="text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-black text-gray-900">Join the After-Match Class</h3>
                        <p className="text-xs text-gray-500">Full tactical academy for this match</p>
                      </div>
                    </div>
                    <div className="space-y-2.5 mb-6">
                      {[
                        'Full tactical match analysis — all three phases',
                        '25-question match quiz with AI explanations',
                        'Match Analysis Certificate PDF',
                        'Full Module PDF — analysis, drills, 5-day plan',
                      ].map(item => (
                        <div key={item} className="flex items-center gap-3 text-sm text-gray-700 bg-green-50 p-3 rounded-xl border border-green-100">
                          <CheckCircle2 size={15} className="text-[#1a5c2a] shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowBlueprintModal(true)}
                      className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-base transition-colors flex items-center justify-center gap-2"
                    >
                      Join Class — $3
                    </button>
                    <p className="text-[10px] text-gray-400 text-center mt-2">One-time purchase · EcoCash / InnBucks / OneMoney / Card</p>
                  </div>
                </div>

              ) : classStage === 'analysis' ? (
                /* ── ANALYSIS STAGE ───────────────────────────────────────── */
                <>
                  {/* Stage progress */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                      {['Analysis', 'Quiz', 'Certificate'].map((s, i) => (
                        <div key={s} className="flex items-center gap-2 flex-1">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-[#1a5c2a] text-white' : 'bg-gray-100 text-gray-400'}`}>{i + 1}</div>
                          <span className={`text-xs font-semibold hidden sm:block ${i === 0 ? 'text-[#1a5c2a]' : 'text-gray-400'}`}>{s}</span>
                          {i < 2 && <div className="flex-1 h-0.5 bg-gray-200 mx-1" />}
                        </div>
                      ))}
                    </div>
                  </div>

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
                      <div className="bg-white rounded-2xl p-2 shadow-md border border-gray-200">
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 px-3 pt-2 pb-1"><Tv size={12} /> THREE PHASES OF PLAY</div>
                        <PhaseMap phases={report.phases} homeTeam={selectedMatch.homeTeam} awayTeam={selectedMatch.awayTeam} />
                      </div>

                      <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-9 h-9 rounded-full bg-[#1a5c2a] flex items-center justify-center font-black text-[#f0b429] text-sm shrink-0">
                            {gender === 'female' ? 'A' : 'T'}
                          </div>
                          <h3 className="text-sm font-bold text-gray-900">{gender === 'female' ? 'Amara' : 'THUTO'}'s tactical read</h3>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{report.narrative}</p>
                      </div>

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

                      {report.quizMoments.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Brain size={16} className="text-[#1a5c2a]" /> What Would You Do?</h3>
                          {report.quizMoments.map(moment => (
                            <WhatWouldYouDo key={moment.id} moment={moment} gender={gender} onAnswered={() => {}} />
                          ))}
                        </div>
                      )}

                      {/* Start Quiz CTA */}
                      <button
                        onClick={startQuiz}
                        disabled={quizLoading}
                        className="w-full py-4 bg-[#1a5c2a] hover:bg-[#0d3d1a] text-white font-black rounded-xl text-base transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {quizLoading
                          ? <><Loader2 size={18} className="animate-spin" /> Loading Quiz…</>
                          : <><Brain size={18} /> Start the 25-Question Quiz →</>}
                      </button>
                    </>
                  ) : (
                    <div className="bg-white rounded-2xl p-8 text-center border shadow-sm text-gray-500">Report data unavailable. Please try again shortly.</div>
                  )}

                  <button onClick={() => setShowHighlightsModal(true)} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition flex items-center justify-center gap-2">
                    <Youtube size={16} /> Watch Match Highlights
                  </button>
                </>

              ) : classStage === 'quiz' ? (
                /* ── QUIZ STAGE ───────────────────────────────────────────── */
                <>
                  {/* Progress */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-900">Match Quiz</span>
                      <span className="text-xs text-gray-500">{Object.keys(userAnswers).length} / {quizQuestions.length} answered</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#1a5c2a] transition-all" style={{ width: `${quizQuestions.length > 0 ? (Object.keys(userAnswers).length / quizQuestions.length) * 100 : 0}%` }} />
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      {['Analysis', 'Quiz', 'Certificate'].map((s, i) => (
                        <div key={s} className="flex items-center gap-2 flex-1">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${i === 1 ? 'bg-[#1a5c2a] text-white' : i === 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>{i === 0 ? '✓' : i + 1}</div>
                          <span className={`text-xs font-semibold hidden sm:block ${i === 1 ? 'text-[#1a5c2a]' : i === 0 ? 'text-green-600' : 'text-gray-400'}`}>{s}</span>
                          {i < 2 && <div className="flex-1 h-0.5 bg-gray-200 mx-1" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Questions */}
                  <div className="space-y-4">
                    {quizQuestions.map((q, idx) => (
                      <div key={q.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
                        <div className="flex items-start gap-3 mb-3">
                          <span className="w-7 h-7 rounded-full bg-[#1a5c2a]/10 text-[#1a5c2a] text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                          <div className="flex-1">
                            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wide">{q.category}</span>
                            <p className="text-sm font-semibold text-gray-900 mt-0.5">{q.question}</p>
                          </div>
                        </div>
                        <div className="space-y-2 pl-10">
                          {q.options.map((opt, oi) => (
                            <button
                              key={oi}
                              onClick={() => setUserAnswers(prev => ({ ...prev, [q.id]: oi }))}
                              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-all ${userAnswers[q.id] === oi ? 'bg-[#1a5c2a] text-white border-[#1a5c2a] font-semibold' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-[#1a5c2a]/40'}`}
                            >
                              <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Submit */}
                  <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200 sticky bottom-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">{Object.keys(userAnswers).length} of {quizQuestions.length} answered</span>
                      {Object.keys(userAnswers).length < quizQuestions.length && (
                        <span className="text-xs text-amber-600">{quizQuestions.length - Object.keys(userAnswers).length} remaining</span>
                      )}
                    </div>
                    <button
                      onClick={submitQuiz}
                      disabled={quizSubmitting || Object.keys(userAnswers).length < quizQuestions.length}
                      className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white font-black rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {quizSubmitting ? <><Loader2 size={16} className="animate-spin" />Submitting…</> : <>Submit Quiz & Get Results <ChevronRight size={16} /></>}
                    </button>
                  </div>
                </>

              ) : (
                /* ── RESULTS STAGE ────────────────────────────────────────── */
                <>
                  {/* Score badge */}
                  <div className={`rounded-2xl p-8 text-center shadow-md border ${pct >= 80 ? 'bg-amber-50 border-amber-200' : pct >= 60 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                    <Award size={40} className={`mx-auto mb-2 ${pct >= 80 ? 'text-amber-500' : pct >= 60 ? 'text-blue-500' : 'text-gray-400'}`} />
                    <div className={`text-5xl font-black mb-1 ${pct >= 80 ? 'text-amber-600' : pct >= 60 ? 'text-blue-600' : 'text-gray-700'}`}>{pct}%</div>
                    <div className={`text-lg font-bold mb-1 ${pct >= 80 ? 'text-amber-700' : pct >= 60 ? 'text-blue-700' : 'text-gray-600'}`}>
                      {pct >= 80 ? 'Distinction' : pct >= 60 ? 'Merit' : 'Pass'}
                    </div>
                    <p className="text-sm text-gray-600">{quizScore} correct out of {quizQuestions.length} questions</p>
                    <p className="text-xs text-gray-400 mt-1">{selectedMatch.homeTeam} vs {selectedMatch.awayTeam}</p>
                  </div>

                  {/* Stage progress — all done */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                      {['Analysis', 'Quiz', 'Certificate'].map((s, i) => (
                        <div key={s} className="flex items-center gap-2 flex-1">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black bg-green-100 text-green-700">✓</div>
                          <span className="text-xs font-semibold hidden sm:block text-green-600">{s}</span>
                          {i < 2 && <div className="flex-1 h-0.5 bg-green-200 mx-1" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Downloads */}
                  <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Download size={16} className="text-[#1a5c2a]" /> Download Your Results</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => generateCertificatePDF(selectedMatch, quizScore, quizQuestions.length, user?.name ?? 'GRS Student')}
                        className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Award size={16} /> Download Certificate PDF
                      </button>
                      {report && (
                        <button
                          onClick={() => generateModulePDF(selectedMatch, report.phases, modules)}
                          className="w-full py-3 bg-[#1a5c2a] hover:bg-[#0d3d1a] text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          <FileDown size={16} /> Download Full Module PDF
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Wrong answers with explanations */}
                  {quizQuestions.filter(q => userAnswers[q.id] !== q.correct).length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-gray-900">Review — What You Missed</h3>
                      {quizQuestions.filter(q => userAnswers[q.id] !== q.correct).map((q, idx) => (
                        <div key={q.id} className="bg-white rounded-2xl p-4 shadow-sm border border-red-100">
                          <p className="text-xs font-bold text-red-500 uppercase mb-1">{q.category} · Q{idx + 1}</p>
                          <p className="text-sm font-semibold text-gray-900 mb-2">{q.question}</p>
                          <div className="space-y-1.5 mb-3">
                            {q.options.map((opt, oi) => (
                              <div key={oi} className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${oi === q.correct ? 'bg-green-50 text-green-800 border border-green-200' : oi === userAnswers[q.id] ? 'bg-red-50 text-red-700 border border-red-200' : 'text-gray-500'}`}>
                                {oi === q.correct && <CheckCircle2 size={13} className="text-green-600 shrink-0" />}
                                {oi === userAnswers[q.id] && oi !== q.correct && <X size={13} className="text-red-500 shrink-0" />}
                                <span className="font-bold mr-1">{String.fromCharCode(65 + oi)}.</span>{opt}
                              </div>
                            ))}
                          </div>
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800 leading-relaxed">
                            💡 {q.explanation}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Retake */}
                  <div className="flex gap-3">
                    <button onClick={() => setClassStage('analysis')} className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl text-sm hover:border-[#1a5c2a] transition">
                      ← Back to Analysis
                    </button>
                    <button onClick={startQuiz} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-200 transition">
                      Retake Quiz
                    </button>
                  </div>

                  <button onClick={() => setShowHighlightsModal(true)} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition flex items-center justify-center gap-2">
                    <Youtube size={16} /> Watch Match Highlights
                  </button>
                </>
              )}
            </div>

            {/* RIGHT — ads, odds, share, class progress */}
            <div className="lg:col-span-3 space-y-4">
              <AdBanner tier="GOLD" />
              <AdBanner tier="SILVER" />
              <MatchOdds match={selectedMatch} />
              <ShareButtons match={selectedMatch} />

              {/* Class progress tracker (shown when purchased) */}
              {selectedMatch && hasPurchasedBlueprint && (
                <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <TrophyIcon size={15} className="text-amber-500" /> Class Progress
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Tactical Analysis', done: classStage !== 'locked', active: classStage === 'analysis' },
                      { label: '25-Question Quiz', done: classStage === 'results', active: classStage === 'quiz' },
                      { label: 'Certificate', done: classStage === 'results', active: classStage === 'results' },
                    ].map(step => (
                      <div key={step.label} className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-green-100' : step.active ? 'bg-[#1a5c2a]' : 'bg-gray-100'}`}>
                          {step.done ? <CheckCircle2 size={12} className="text-green-600" /> : <span className="text-[9px] text-white font-bold">{step.active ? '→' : '○'}</span>}
                        </div>
                        <span className={`text-xs ${step.done ? 'text-green-600 font-semibold' : step.active ? 'text-[#1a5c2a] font-bold' : 'text-gray-400'}`}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                  {classStage === 'results' && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                      <span className={`text-lg font-black ${pct >= 80 ? 'text-amber-500' : pct >= 60 ? 'text-blue-500' : 'text-gray-500'}`}>{pct}%</span>
                      <p className="text-[10px] text-gray-400">Quiz score</p>
                    </div>
                  )}
                </div>
              )}

              {/* Join class card (shown when not yet purchased) */}
              {selectedMatch && !hasPurchasedBlueprint && selectedMatch.reportReady && (
                <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={16} className="text-[#1a5c2a]" />
                    <h3 className="text-sm font-bold text-gray-900">After-Match Class</h3>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">Analysis, quiz, certificate + full PDF module.</p>
                  <button
                    onClick={() => setShowBlueprintModal(true)}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Lock size={14} /> Join Class — $3
                  </button>
                  <p className="text-[9px] text-gray-400 text-center mt-2">EcoCash / InnBucks / OneMoney / Card</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showHighlightsModal && selectedMatch && <HighlightsModal match={selectedMatch} onClose={() => setShowHighlightsModal(false)} />}
      {showFanRegister && <FanRegistrationModal onClose={() => setShowFanRegister(false)} onRegisterSuccess={onRegisterSuccess} />}
      {showBlueprintModal && selectedMatch && (
        <BlueprintPurchaseModal
          matchId={selectedMatch.id}
          matchName={`${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`}
          onClose={() => setShowBlueprintModal(false)}
          onPurchaseComplete={() => {
            setHasPurchasedBlueprint(true);
            setShowBlueprintModal(false);
            setPurchasedBlueprints(prev => {
              const updated = [...new Set([...prev, selectedMatch.id])];
              localStorage.setItem('grs_blueprints', JSON.stringify(updated));
              return updated;
            });
            setClassStage('analysis');
          }}
        />
      )}
    </div>
  );
}