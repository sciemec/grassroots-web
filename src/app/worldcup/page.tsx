// src/app/worldcup/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Calendar, Radio, MicOff, Volume2, RefreshCw, 
  Tv, Activity, Languages, Zap, Share2, Copy, Check,
  TrendingUp, Clock, Youtube, MessageCircle, Lock, Unlock,
  Smartphone, CreditCard, Loader2, X, Star, Users, Trophy as TrophyIcon
} from 'lucide-react';
import { useLiveMatches } from '@/hooks/useLiveMatch';

// ============================================
// TYPES
// ============================================
interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'scheduled' | 'live' | 'finished';
  minute: string;
  date: string;
  time: string;
  stadium: string;
  city: string;
  pitchSponsorName?: string | null;
  pitchLogoLeftUrl?: string | null;
  pitchLogoRightUrl?: string | null;
  sponsorTargetUrl?: string | null;
}

interface Player {
  id: string;
  number: number;
  name: string;
  x: number;
  y: number;
}

// ============================================
// PERKS LIST
// ============================================
const PERKS: Array<{ icon: React.ElementType; text: string }> = [
  { icon: Star, text: "Vote Player of the Tournament" },
  { icon: Tv, text: "Live match updates via WhatsApp" },
  { icon: Users, text: "Follow your favourite local players" },
  { icon: Volume2, text: "Free audio commentary for registered fans" },
];

function PerksList() {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-6">
      {PERKS.map(({ icon: IconComponent, text }) => (
        <div key={text} className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-gray-100 text-gray-900 border border-gray-300 shadow-sm">
          <IconComponent size={13} className="text-[#1a5c2a]" />
          {text}
        </div>
      ))}
    </div>
  );
}

// ============================================
// AD BANNER
// ============================================
interface AdBannerProps {
  tier: 'GOLD' | 'SILVER' | 'BRONZE';
  targetUrl?: string | null;
  sponsorName?: string | null;
  imageUrl?: string | null;
}

function AdBanner({ tier, targetUrl, sponsorName, imageUrl }: AdBannerProps) {
  const destination = targetUrl || 'https://grassrootssports.live';
  const displaySponsor = sponsorName || 'Official Partner';

  if (tier === 'GOLD') {
    const goldAdImage = imageUrl || "/assets/sponsors/default-gold-banner.png";
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
        <span className="text-[10px] font-bold text-amber-600 block mb-2 uppercase tracking-wide">Gold Tournament Partner</span>
        <a href={destination} target="_blank" rel="noopener noreferrer" className="block h-[250px] relative border border-gray-200 rounded overflow-hidden transition-all duration-200 hover:border-amber-500 hover:shadow-md">
          <img src={goldAdImage} alt={`${displaySponsor} Advertisement`} className="w-full h-full object-cover" onError={(e) => {
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              const fallbackDiv = document.createElement('div');
              fallbackDiv.className = "w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-500 font-medium p-4 text-center";
              fallbackDiv.innerHTML = `<span className="text-sm font-bold text-gray-700">${displaySponsor}</span><span className="text-[11px] text-gray-400 mt-1">Tap to visit partner website</span>`;
              parent.appendChild(fallbackDiv);
            }
          }} />
        </a>
      </div>
    );
  }

  if (tier === 'SILVER') {
    return (
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-center">
        <span className="text-[9px] text-gray-400 block mb-1 uppercase tracking-wider">Silver Metrics Sponsor</span>
        <a href={destination} target="_blank" rel="noopener noreferrer" className="block p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded border border-emerald-200 hover:bg-emerald-100 transition duration-150">
          Match telemetry & analytics powered by <br />
          <span className="underline font-bold text-sm text-emerald-900 block mt-1">{displaySponsor}</span>
        </a>
      </div>
    );
  }

  const bronzeAdImage = imageUrl || null;
  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-center">
      <span className="text-[9px] text-gray-400 block mb-2 uppercase tracking-wider">Bronze Grassroots Sponsor</span>
      <a href={destination} target="_blank" rel="noopener noreferrer" className="block h-[120px] relative border border-dashed border-gray-300 rounded overflow-hidden hover:border-gray-400 transition bg-gray-50">
        {bronzeAdImage ? (
          <img src={bronzeAdImage} alt={`${displaySponsor} Classified`} className="w-full h-full object-cover" />
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

// ============================================
// FOOTBALL PITCH WITH PLAYERS
// ============================================
interface FootballPitchProps {
  ballPosition?: { x: number; y: number };
  shots?: Array<{ x: number; y: number; isGoal: boolean }>;
  pitchLogoLeftUrl?: string | null;
  pitchLogoRightUrl?: string | null;
  pitchSponsorName?: string | null;
  homePlayers?: Player[];
  awayPlayers?: Player[];
  possession?: 'home' | 'away' | 'neutral';
}

function FootballPitch({ 
  ballPosition, 
  shots = [], 
  pitchLogoLeftUrl, 
  pitchLogoRightUrl, 
  pitchSponsorName,
  homePlayers = [],
  awayPlayers = [],
  possession = 'neutral'
}: FootballPitchProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = 900;
  const height = 600;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Draw pitch
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#1a5c2a');
    grad.addColorStop(0.5, '#0e4a1e');
    grad.addColorStop(1, '#0a3d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#0a3d16';
    for (let i = 0; i < width; i += 40) ctx.fillRect(i, 0, 20, height);
    ctx.fillStyle = '#1a5c2a';
    for (let i = 20; i < width; i += 40) ctx.fillRect(i, 0, 20, height);

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, width - 80, height - 80);
    ctx.beginPath();
    ctx.moveTo(width / 2, 40);
    ctx.lineTo(width / 2, height - 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 45, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.strokeRect(40, height / 2 - 90, 90, 180);
    ctx.strokeRect(width - 130, height / 2 - 90, 90, 180);

    ctx.fillStyle = '#ddd';
    ctx.fillRect(25, height / 2 - 40, 15, 80);
    ctx.fillStyle = '#aaa';
    ctx.fillRect(22, height / 2 - 42, 3, 84);
    ctx.fillRect(width - 40, height / 2 - 40, 15, 80);
    ctx.fillRect(width - 25, height / 2 - 42, 3, 84);

    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 45, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw home players
    if (homePlayers && homePlayers.length > 0) {
      homePlayers.forEach(player => {
        if (!player) return;
        const x = 40 + (player.x / 100) * (width - 80);
        const y = 40 + (player.y / 100) * (height - 80);
        
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = possession === 'home' ? '#00ff00' : '#00aa00';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        if (player.number !== undefined && player.number !== null) {
          ctx.fillStyle = 'white';
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(player.number), x, y);
        }
      });
    }

    // Draw away players
    if (awayPlayers && awayPlayers.length > 0) {
      awayPlayers.forEach(player => {
        if (!player) return;
        const x = 40 + (player.x / 100) * (width - 80);
        const y = 40 + (player.y / 100) * (height - 80);
        
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = possession === 'away' ? '#ff0000' : '#cc0000';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        if (player.number !== undefined && player.number !== null) {
          ctx.fillStyle = 'white';
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(player.number), x, y);
        }
      });
    }

    // Draw ball
    if (ballPosition) {
      const x = 40 + (ballPosition.x / 100) * (width - 80);
      const y = 40 + (ballPosition.y / 100) * (height - 80);
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(x + 4, y + 6, 9, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Sponsor text
    ctx.font = 'bold 24px "Inter", system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pitchSponsorName ? pitchSponsorName.toUpperCase() : "GRASSROOTS SPORTS", width / 2, height / 2 + 40);
    ctx.font = '16px monospace';
    ctx.fillStyle = 'rgba(240, 180, 41, 0.4)';
    ctx.fillText("grassrootssports.live", width / 2, height / 2 + 85);

    if (possession !== 'neutral') {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(
        possession === 'home' ? '🔵 Home Possession' : '🔴 Away Possession',
        20, 20
      );
    }
  }, [ballPosition, shots, pitchLogoLeftUrl, pitchLogoRightUrl, pitchSponsorName, homePlayers, awayPlayers, possession]);

  return <canvas ref={canvasRef} width={width} height={height} className="w-full rounded-xl shadow-2xl border border-[#f0b429]/20" />;
}

// ============================================
// MATCH ODDS
// ============================================
function MatchOdds({ match }: { match: Match | null }) {
  if (!match || match.status !== 'scheduled') return null;
  
  const odds = { home: 2.10, draw: 3.20, away: 2.15 };
  
  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200">
      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><TrendingUp size={14} className="text-[#1a5c2a]" /> Match Odds</h3>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-500">{match.homeTeam}</p><p className="text-lg font-bold text-[#1a5c2a]">{odds.home}</p></div>
        <div className="p-2 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-500">Draw</p><p className="text-lg font-bold text-[#1a5c2a]">{odds.draw}</p></div>
        <div className="p-2 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-500">{match.awayTeam}</p><p className="text-lg font-bold text-[#1a5c2a]">{odds.away}</p></div>
      </div>
      <p className="text-[8px] text-gray-400 text-center mt-2">Odds for entertainment purposes</p>
    </div>
  );
}

// ============================================
// SHARE BUTTONS
// ============================================
function ShareButtons({ match }: { match: Match | null }) {
  const [copied, setCopied] = useState(false);
  if (!match) return null;
  const shareUrl = `${window.location.origin}/worldcup?match=${match.id}`;
  const shareText = `🏆 World Cup 2026: ${match.homeTeam} vs ${match.awayTeam} - Live on GrassRoots Sports!`;
  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
  };
  return (
    <div className="flex gap-2">
      <button onClick={copyLink} className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition">
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
      <button onClick={shareWhatsApp} className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#25D366] text-white hover:bg-[#20b859] rounded-lg text-sm font-medium transition">
        <MessageCircle size={14} /> Share
      </button>
    </div>
  );
}

// ============================================
// HIGHLIGHTS MODAL
// ============================================
interface Highlight {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
}

function HighlightsModal({ match, onClose }: { match: Match | null; onClose: () => void }) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    if (!match) return;
    const fetchHighlights = async () => {
      setLoading(true);
      try {
        const query = `${match.homeTeam} vs ${match.awayTeam} world cup 2026 highlights`;
        const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.items) {
          setHighlights(data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium.url,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          })));
        }
      } catch (error) {
        console.error('Failed to fetch highlights:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHighlights();
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
            <p className="text-center text-gray-500 py-8">No highlights available yet. Check back after the match.</p>
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

// ============================================
// MATCH TIMELINE
// ============================================
interface TimelineEvent {
  id: string;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'shot';
  team: 'home' | 'away';
  player: string;
  description: string;
}

function MatchTimeline({ match, ballPosition }: { match: Match | null; ballPosition?: { x: number; y: number } }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [highlightedEvent, setHighlightedEvent] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!match) return;
    const mockEvents: TimelineEvent[] = [
      { id: '1', minute: 23, type: 'goal', team: 'away', player: 'Neymar', description: 'Goal! Brazil takes the lead' },
      { id: '2', minute: 45, type: 'yellow_card', team: 'home', player: 'Musona', description: 'Yellow card for late tackle' },
      { id: '3', minute: 56, type: 'goal', team: 'away', player: 'Vinicius', description: 'Goal! Brazil doubles the lead' },
    ];
    setEvents(mockEvents);
  }, [match]);

  useEffect(() => {
    if (ballPosition && events.length > 0) {
      const fakeMinute = Math.floor((ballPosition.x / 100) * 90);
      const nearestEvent = events.find(e => Math.abs(e.minute - fakeMinute) < 5);
      if (nearestEvent && highlightedEvent !== nearestEvent.id) {
        setHighlightedEvent(nearestEvent.id);
        const element = document.getElementById(`timeline-event-${nearestEvent.id}`);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [ballPosition, events]);

  if (!match || (match.status !== 'live' && match.status !== 'finished')) return null;
  if (events.length === 0) return null;

  const getEventIcon = (type: string) => {
    switch(type) {
      case 'goal': return '⚽';
      case 'yellow_card': return '🟨';
      case 'red_card': return '🟥';
      case 'substitution': return '🔄';
      default: return '⚡';
    }
  };

  const getEventColor = (type: string) => {
    if (type === 'goal') return 'bg-green-100 text-green-700 border-green-200';
    if (type === 'yellow_card') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (type === 'red_card') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Clock size={14} className="text-[#1a5c2a]" /> Match Timeline</h3>
        {match.status === 'live' && <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /><span className="text-[9px] text-red-500 font-medium">LIVE</span></div>}
      </div>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
        <div className="space-y-3 max-h-48 overflow-y-auto pr-2" ref={timelineRef}>
          {events.map((event) => (
            <div key={event.id} id={`timeline-event-${event.id}`} className={`flex items-start gap-3 p-2 rounded-lg transition-all duration-300 ${highlightedEvent === event.id ? 'bg-[#f0b429]/20 border-l-4 border-[#f0b429] animate-pulse' : 'hover:bg-gray-50'}`}>
              <div className="relative z-10 w-7 h-7 rounded-full bg-white border-2 flex items-center justify-center text-sm shrink-0" style={{ borderColor: highlightedEvent === event.id ? '#f0b429' : '#e5e7eb' }}>
                <span className="text-xs">{getEventIcon(event.type)}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-700">{event.minute}'</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${getEventColor(event.type)}`}>{event.type.replace('_', ' ').toUpperCase()}</span>
                  <span className="text-xs text-gray-600">{event.description}</span>
                </div>
                <p className="text-[9px] text-gray-400 mt-0.5">{event.player}</p>
              </div>
              {highlightedEvent === event.id && <div className="animate-pulse text-[#f0b429] text-[10px] shrink-0">▶ NOW</div>}
            </div>
          ))}
        </div>
      </div>
      {match.status === 'live' && ballPosition && <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between text-[9px] text-gray-400"><span>⚡ Synced with ball tracking</span><span>🎙️ Commentary linked</span></div>}
    </div>
  );
}

// ============================================
// AI COMMENTARY
// ============================================
function AICommentary({ selectedMatch, isUnlocked }: { selectedMatch: Match | null; isUnlocked: boolean }) {
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [selectedLang, setSelectedLang] = useState<'en' | 'shona' | 'ndebele' | 'zulu' | 'tswana'>('en');
  const [currentCommentary, setCurrentCommentary] = useState('Select a match, then trigger simulator options for local slang telemetry analytics.');
  const [isTranslating, setIsTranslating] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const dialects = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'shona', label: 'ChiShona', flag: '🇿🇼' },
    { code: 'ndebele', label: 'isiNdebele', flag: '🇿🇼' },
    { code: 'zulu', label: 'isiZulu', flag: '🇿🇦' },
    { code: 'tswana', label: 'Setswana', flag: '🇿🇦' }
  ];

  const processAndPlayLiveSlang = async (eventType: string, player: string) => {
    if (!selectedMatch) return;
    setIsTranslating(true);
    if (currentAudioRef.current) currentAudioRef.current.pause();

    try {
      const response = await fetch('/api/commentary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minute: selectedMatch.minute || "12\'",
          playerName: player,
          teamName: selectedMatch.homeTeam,
          eventType: eventType,
          language: selectedLang
        })
      });

      const data = await response.json();
      if (data.success) {
        const cleanedText = data.script.replace(/\[.*?\]/g, "").trim();
        setCurrentCommentary(cleanedText);
        if (isSpeaking && data.audio) {
          const audio = new Audio(data.audio);
          currentAudioRef.current = audio;
          audio.play();
        }
      }
    } catch {
      setCurrentCommentary("Eish, network issues blocking the DeepSeek commentary box right now!");
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    if (selectedMatch) {
      setCurrentCommentary(`Match tracker synchronized for ${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}. Tap a trigger to stream commentary.`);
    }
  }, [selectedMatch, selectedLang]);

  if (!isUnlocked) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 text-center">
        <Lock size={32} className="mx-auto text-gray-400 mb-3" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">Audio Commentary Locked</h3>
        <p className="text-sm text-gray-500 mb-4">Register as a fan to unlock free AI commentary for this match</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><h3 className="text-gray-900 font-bold text-sm uppercase tracking-wider">AI Live Commentary</h3></div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100"><Languages size={12} className="text-[#1a5c2a]" /> Dialect:</div>
          <div className="flex gap-1 bg-gray-100 p-0.5 rounded-xl border border-gray-200">
            {dialects.map((d) => (
              <button key={d.code} onClick={() => setSelectedLang(d.code as any)} className={`px-2 py-1 text-[10px] font-extrabold rounded-lg transition-all flex items-center gap-1 ${selectedLang === d.code ? 'bg-[#1a5c2a] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                <span>{d.flag}</span><span className="hidden md:inline">{d.label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setIsSpeaking(!isSpeaking)} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition font-bold ${isSpeaking ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-700'}`}>
            {isSpeaking ? <Volume2 size={12} className="animate-bounce" /> : <MicOff size={12} />}
            {isSpeaking ? "AUDIO ON" : "MUTED"}
          </button>
        </div>
      </div>
      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
        <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1"><Zap size={10} className="text-[#f0b429]" /> Trigger Sound & Slang Simulation Board:</div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => processAndPlayLiveSlang("GOAL", "The Striker")} disabled={isTranslating} className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition disabled:opacity-50">⚽ SCREAM GOAL!</button>
          <button onClick={() => processAndPlayLiveSlang("DRIBBLE", "The Captain")} disabled={isTranslating} className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition disabled:opacity-50">🕺 Hype Dribble Skill</button>
          <button onClick={() => processAndPlayLiveSlang("TACKLE", "The Defender")} disabled={isTranslating} className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition disabled:opacity-50">💥 Heavy Tackle</button>
        </div>
      </div>
      <div className="bg-gray-900 text-green-400 rounded-xl p-4 h-28 overflow-y-auto border border-gray-800 flex items-center font-mono relative">
        {isTranslating ? (
          <div className="flex items-center gap-2 text-xs text-yellow-400 font-semibold italic mx-auto"><RefreshCw size={14} className="animate-spin" /> DeepSeek V3 compiling audio matrix...</div>
        ) : (
          <p className="text-sm italic leading-relaxed text-gray-100 w-full pl-2 border-l-2 border-[#f0b429]">"{currentCommentary}"</p>
        )}
      </div>
    </div>
  );
}

// ============================================
// MATCH CARD
// ============================================
function MatchCard({ match, isSelected, onClick, isUnlocked, onUnlockClick }: { match: Match; isSelected: boolean; onClick: () => void; isUnlocked: boolean; onUnlockClick: (match: Match) => void }) {
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  
  return (
    <button onClick={onClick} className={`w-full text-left p-4 rounded-2xl transition-all duration-200 ${isSelected ? 'bg-[#1a5c2a] text-white shadow-lg border-l-4 border-[#f0b429]' : 'bg-white border border-gray-200 hover:shadow-md'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-gray-900'}`}>{match.homeTeam}</span>
            {isLive && <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">LIVE</span>}
            {isFinished && <span className="text-[9px] text-gray-400">FT</span>}
          </div>
          <div className={`text-sm mt-1 ${isSelected ? 'text-white/70' : 'text-gray-600'}`}>{match.awayTeam}</div>
        </div>
        <div className="text-right">
          {isLive || isFinished ? (
            <div className={`text-2xl font-black ${isSelected ? 'text-[#f0b429]' : 'text-[#1a5c2a]'}`}>{match.homeScore} - {match.awayScore}</div>
          ) : (
            <div className="text-sm text-gray-500">{match.time}</div>
          )}
          <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><MapPin size={10} /> {match.city}</div>
        </div>
      </div>
      {isLive && <div className="mt-2 text-[11px] text-yellow-500 font-mono">{match.minute} • Live now</div>}
      {isLive && !isUnlocked && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <button onClick={(e) => { e.stopPropagation(); onUnlockClick(match); }} className="text-xs text-[#1a5c2a] font-bold flex items-center gap-1"><Unlock size={10} /> Register to Access</button>
        </div>
      )}
      {isLive && isUnlocked && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <span className="text-xs text-green-600 font-bold flex items-center gap-1"><Unlock size={10} /> Audio & Tracking Unlocked</span>
        </div>
      )}
    </button>
  );
}

// ============================================
// POSSESSION DISPLAY
// ============================================
function PossessionDisplay({ homePossession, awayPossession, possession }: { homePossession: number; awayPossession: number; possession: 'home' | 'away' | 'neutral' }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Ball Possession</h3>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-[#1a5c2a]">Home</span>
            <span className="font-bold">{homePossession}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${possession === 'home' ? 'bg-[#1a5c2a]' : 'bg-[#1a5c2a]/60'}`} style={{ width: `${homePossession}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-red-600">Away</span>
            <span className="font-bold">{awayPossession}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${possession === 'away' ? 'bg-red-600' : 'bg-red-400'}`} style={{ width: `${awayPossession}%` }} />
          </div>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="text-[10px] text-gray-400">Currently:</span>
          <span className={`text-xs font-bold ${possession === 'home' ? 'text-[#1a5c2a]' : possession === 'away' ? 'text-red-600' : 'text-gray-500'}`}>
            {possession === 'home' && '🔵 Home'}
            {possession === 'away' && '🔴 Away'}
            {possession === 'neutral' && '⚪ Neutral'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FORMATION SELECTOR
// ============================================
type FormationName = '4-4-2' | '4-3-3';

function FormationSelector({ currentFormation, onFormationChange }: { currentFormation: FormationName; onFormationChange: (formation: FormationName) => void }) {
  const formations: FormationName[] = ['4-4-2', '4-3-3'];
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500">Formation:</span>
      <div className="flex gap-1">
        {formations.map((formation) => (
          <button key={formation} onClick={() => onFormationChange(formation)} className={`px-2 py-1 text-xs rounded-lg transition-all ${currentFormation === formation ? 'bg-[#1a5c2a] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {formation}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// FAN REGISTRATION MODAL
// ============================================
function FanRegistrationModal({ onClose, onRegisterSuccess }: { onClose: () => void; onRegisterSuccess: () => void }) {
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("Zimbabwe");
  const [contactType, setContactType] = useState<"phone" | "email">("phone");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const COUNTRIES = ["Zimbabwe", "South Africa", "Zambia", "Botswana", "Malawi", "Mozambique", "Namibia", "Other"];
  const contactValid = contactType === "email" ? email.includes("@") : phone.replace(/\D/g, "").length >= 9;
  const canSubmit = fullName.trim().length >= 2 && country !== "" && contactValid && password.length >= 6;

  const handleRegister = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const parts = fullName.trim().split(" ");
      const first_name = parts[0];
      const surname = parts.slice(1).join(" ") || parts[0];
      const body: Record<string, unknown> = { first_name, surname, name: fullName.trim(), country, password, password_confirmation: password, role: "fan" };
      if (contactType === "email") { body.email = email.trim().toLowerCase(); } else { body.phone = phone.trim(); }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Registration failed");
      onRegisterSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl p-6 bg-[#111f14] border border-[rgba(240,180,41,0.2)]">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 text-white/40"><X size={18} /></button>
        <h2 className="text-lg font-black text-white mb-1">Join as a Fan</h2>
        <p className="text-xs mb-5 text-white/35">Register to access free live match tracking and AI commentary.</p>
        {error && <div className="mb-4 p-2.5 rounded-xl text-xs bg-red-500/10 border border-red-500/25 text-red-300">{error}</div>}
        <div className="space-y-4">
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-[#1a3a20] border border-white/8" />
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-[#1a3a20] border border-white/8">
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={() => setContactType("phone")} className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-all ${contactType === "phone" ? "bg-[#f0b429] text-[#0a1a0f] border-[#f0b429]" : "bg-transparent border-white/12 text-white/50"}`}>Phone Number</button>
            <button onClick={() => setContactType("email")} className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-all ${contactType === "email" ? "bg-[#f0b429] text-[#0a1a0f] border-[#f0b429]" : "bg-transparent border-white/12 text-white/50"}`}>Email</button>
          </div>
          {contactType === "phone" ? (
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+263 77 123 4567" className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-[#1a3a20] border border-white/8" />
          ) : (
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-[#1a3a20] border border-white/8" />
          )}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6 characters)" className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-[#1a3a20] border border-white/8" />
          <button disabled={!canSubmit || isSubmitting} onClick={handleRegister} className={`w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${canSubmit && !isSubmitting ? "bg-[#f0b429] text-[#0a1a0f]" : "bg-white/7 text-white/25 cursor-not-allowed"}`}>
            {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <>Join & Access Free Features</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function WorldCupPage() {
  const { matches: liveMatches, isLoading, error } = useLiveMatches();
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [ballPosition, setBallPosition] = useState({ x: 55, y: 50 });
  const [showHighlightsModal, setShowHighlightsModal] = useState(false);
  const [unlockedMatches, setUnlockedMatches] = useState<string[]>([]);
  const [showFanRegister, setShowFanRegister] = useState(false);
  const hasSetInitial = useRef(false);
  const UNLOCK_KEY = "wc_unlocked_matches";

  const [formation, setFormation] = useState<FormationName>('4-4-2');
  const [homePossession, setHomePossession] = useState(55);
  const [awayPossession, setAwayPossession] = useState(45);
  const [possession, setPossession] = useState<'home' | 'away' | 'neutral'>('neutral');
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const loadUnlocked = (): string[] => {
    try { return JSON.parse(localStorage.getItem(UNLOCK_KEY) ?? "[]"); }
    catch { return []; }
  };

  const saveUnlocked = (ids: string[]) => {
    localStorage.setItem(UNLOCK_KEY, JSON.stringify(ids));
  };

  useEffect(() => { setUnlockedMatches(loadUnlocked()); }, []);

  useEffect(() => {
    if (selectedMatch) {
      const positions = getFormationPositions(formation);
      setHomePlayers(
        positions.home.map((pos, index) => ({
          id: `h${index + 1}`,
          number: index + 1,
          name: `Player ${index + 1}`,
          x: pos.x,
          y: pos.y
        }))
      );
      setAwayPlayers(
        positions.away.map((pos, index) => ({
          id: `a${index + 1}`,
          number: index + 1,
          name: `Player ${index + 1}`,
          x: pos.x,
          y: pos.y
        }))
      );
    }
  }, [selectedMatch, formation]);

  useEffect(() => {
    if (liveMatches && liveMatches.length > 0) {
      const transformed: Match[] = liveMatches.map((m: any) => ({
        id: String(m.id || `match-${Date.now()}-${Math.random()}`),
        homeTeam: m.home_team?.name || m.home_team || '?',
        awayTeam: m.away_team?.name || m.away_team || '?',
        homeScore: typeof m.home_score === 'number' ? m.home_score : 0,
        awayScore: typeof m.away_score === 'number' ? m.away_score : 0,
        status: (m.status === 'first_half' || m.status === 'second_half' || m.status === 'live') ? 'live' : 
                (m.status === 'finished' || m.status === 'ft') ? 'finished' : 'scheduled',
        minute: m.minute ? `${m.minute}'` : (m.time_elapsed ? `${m.time_elapsed}'` : '0\''),
        date: m.date || new Date().toISOString().split('T')[0],
        time: m.time || 'TBD',
        stadium: m.venue || m.stadium || 'TBD',
        city: m.city || (m.venue?.split(',')[1]?.trim()) || 'TBD',
        pitchSponsorName: "Grassroots Partner",
        pitchLogoLeftUrl: null,
        pitchLogoRightUrl: null,
        sponsorTargetUrl: "https://grassrootssports.live"
      }));
      
      setMatches(transformed);
      
      if (transformed.length > 0 && !hasSetInitial.current) {
        setSelectedMatch(transformed[0]);
        hasSetInitial.current = true;
      }
      setLastUpdated(new Date());
    }
  }, [liveMatches]);

  const handleUnlockMatch = (match: Match) => {
    setShowFanRegister(true);
  };

  const onRegisterSuccess = () => {
    const allMatchIds = matches.map(m => m.id);
    setUnlockedMatches(allMatchIds);
    saveUnlocked(allMatchIds);
    window.location.href = "/login?registered=1";
  };

  const isMatchUnlocked = (matchId: string) => {
    return unlockedMatches.includes(matchId) || unlockedMatches.length > 0;
  };

  useEffect(() => {
    if (!selectedMatch || selectedMatch.status !== 'live') return;
    const interval = setInterval(() => {
      setBallPosition(prev => ({ 
        x: Math.min(95, Math.max(5, prev.x + (Math.random() - 0.5) * 3)), 
        y: Math.min(95, Math.max(5, prev.y + (Math.random() - 0.5) * 2)) 
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedMatch]);

  const liveMatchesCount = matches.filter(m => m.status === 'live').length;

  function getFormationPositions(formation: FormationName): { home: any[], away: any[] } {
    const formations = {
      '4-4-2': {
        home: [
          { x: 50, y: 85 }, { x: 15, y: 70 }, { x: 35, y: 75 }, { x: 65, y: 75 }, { x: 85, y: 70 },
          { x: 10, y: 45 }, { x: 35, y: 45 }, { x: 65, y: 45 }, { x: 90, y: 45 },
          { x: 35, y: 20 }, { x: 65, y: 20 }
        ],
        away: [
          { x: 50, y: 15 }, { x: 15, y: 30 }, { x: 35, y: 25 }, { x: 65, y: 25 }, { x: 85, y: 30 },
          { x: 10, y: 55 }, { x: 35, y: 55 }, { x: 65, y: 55 }, { x: 90, y: 55 },
          { x: 35, y: 80 }, { x: 65, y: 80 }
        ]
      },
      '4-3-3': {
        home: [
          { x: 50, y: 85 }, { x: 15, y: 70 }, { x: 35, y: 75 }, { x: 65, y: 75 }, { x: 85, y: 70 },
          { x: 30, y: 50 }, { x: 50, y: 45 }, { x: 70, y: 50 },
          { x: 10, y: 30 }, { x: 50, y: 20 }, { x: 90, y: 30 }
        ],
        away: [
          { x: 50, y: 15 }, { x: 15, y: 30 }, { x: 35, y: 25 }, { x: 65, y: 25 }, { x: 85, y: 30 },
          { x: 30, y: 50 }, { x: 50, y: 55 }, { x: 70, y: 50 },
          { x: 10, y: 70 }, { x: 50, y: 80 }, { x: 90, y: 70 }
        ]
      }
    };
    return formations[formation] || formations['4-4-2'];
  }

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
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">World Cup 2026</h1>
                <span className="bg-white/10 text-white text-[10px] px-2 py-0.5 rounded-full">REALTIME TELEMETRY</span>
              </div>
              <p className="text-white/80 text-sm">USA · Canada · Mexico | 11 June – 19 July 2026</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setShowFanRegister(true)} className="px-4 py-1.5 bg-[#f0b429] text-[#1a5c2a] rounded-lg text-xs font-bold hover:bg-[#d6a020] transition">
                Join as Fan
              </button>
              {liveMatchesCount > 0 && (
                <div className="bg-red-500/20 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium">{liveMatchesCount} live matches</span>
                </div>
              )}
            </div>
          </div>
          {lastUpdated && (
            <div className="text-right text-[9px] text-white/40 mt-2">
              Server Sync: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* PERKS */}
      <div className="max-w-[1400px] mx-auto px-4 pt-4">
        <PerksList />
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#1a5c2a] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">
                  <Calendar size={14} /> Today's Schedule
                </h2>
                {matches.length === 0 ? (
                  <p className="text-xs text-gray-500 italic py-4 text-center">No world cup fixtures scheduled for today.</p>
                ) : (
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {matches.map(match => (
                      <MatchCard 
                        key={match.id} 
                        match={match} 
                        isSelected={selectedMatch?.id === match.id} 
                        onClick={() => setSelectedMatch(match)} 
                        isUnlocked={isMatchUnlocked(match.id)} 
                        onUnlockClick={handleUnlockMatch} 
                      />
                    ))}
                  </div>
                )}
              </div>
              <AdBanner tier="BRONZE" targetUrl={selectedMatch?.sponsorTargetUrl} sponsorName={selectedMatch?.pitchSponsorName} />
            </div>

            {/* CENTER COLUMN */}
            <div className="lg:col-span-6 space-y-6">
              {selectedMatch ? (
                <>
                  <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="text-center flex-1">
                        <span className="text-gray-400 text-xs uppercase">HOME</span>
                        <p className="text-gray-800 font-bold text-xl mt-1">{selectedMatch.homeTeam}</p>
                        <p className="text-4xl font-black text-[#1a5c2a] mt-1">{selectedMatch.homeScore}</p>
                      </div>
                      <div className="text-center px-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-500 text-xs font-mono">VS</span>
                        </div>
                        <div className="mt-2 text-[11px] text-gray-500 font-mono">
                          {selectedMatch.status === 'live' ? selectedMatch.minute : selectedMatch.time}
                        </div>
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
                    
                    <div className="mt-3 flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400">
                        {isConnected ? '🟢 Live connected' : '🔴 Reconnecting...'}
                      </span>
                      <FormationSelector 
                        currentFormation={formation}
                        onFormationChange={(f) => setFormation(f)}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-2 shadow-md border border-gray-200">
                    <div className="flex items-center justify-between px-3 pt-2 pb-1">
                      <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Tv size={12} /> LIVE TRACKER VIEW
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Activity size={10} /> {isConnected ? 'Live Data' : 'Offline'}
                      </div>
                    </div>
                    <FootballPitch 
                      ballPosition={selectedMatch.status === 'live' ? ballPosition : undefined}
                      homePlayers={homePlayers}
                      awayPlayers={awayPlayers}
                      possession={possession}
                      pitchLogoLeftUrl={selectedMatch.pitchLogoLeftUrl}
                      pitchLogoRightUrl={selectedMatch.pitchLogoRightUrl}
                      pitchSponsorName={selectedMatch.pitchSponsorName}
                    />
                  </div>
                  
                  <PossessionDisplay 
                    homePossession={homePossession}
                    awayPossession={awayPossession}
                    possession={possession}
                  />
                  
                  <MatchTimeline match={selectedMatch} ballPosition={ballPosition} />
                  <AICommentary selectedMatch={selectedMatch} isUnlocked={isMatchUnlocked(selectedMatch.id)} />
                </>
              ) : (
                <div className="bg-white rounded-2xl p-12 text-center border shadow-sm text-gray-500">
                  Select a live match from the calendar panel to spin tracker assets.
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-3 space-y-4">
              <AdBanner tier="GOLD" targetUrl={selectedMatch?.sponsorTargetUrl} sponsorName={selectedMatch?.pitchSponsorName} />
              <AdBanner tier="SILVER" targetUrl={selectedMatch?.sponsorTargetUrl} sponsorName={selectedMatch?.pitchSponsorName} />
              <MatchOdds match={selectedMatch} />
              <ShareButtons match={selectedMatch} />
              {selectedMatch?.status === 'finished' && (
                <button onClick={() => setShowHighlightsModal(true)} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition flex items-center justify-center gap-2">
                  <Youtube size={16} /> Watch Match Highlights
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showHighlightsModal && selectedMatch && (
        <HighlightsModal match={selectedMatch} onClose={() => setShowHighlightsModal(false)} />
      )}
      {showFanRegister && (
        <FanRegistrationModal 
          onClose={() => setShowFanRegister(false)} 
          onRegisterSuccess={onRegisterSuccess}
        />
      )}
    </div>
  );
}