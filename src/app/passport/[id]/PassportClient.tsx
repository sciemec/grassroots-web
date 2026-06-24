// app/passport/[token]/PassportClient.tsx
// ─────────────────────────────────────────────────────────────────────────────
// GRS Talent Passport — client component
// Renders everything a scout or club owner sees
// ─────────────────────────────────────────────────────────────────────────────
'use client';

import { useState, type ReactNode } from 'react';

interface ReelClip {
  id: string;
  r2_url: string;
  thumbnail_url?: string;
  title: string;
  category: string;
  created_at: string;
}

const REEL_CAT_COLORS: Record<string, { bg: string; color: string }> = {
  drill:     { bg: '#dcfce7', color: '#15803d' },
  match:     { bg: '#dbeafe', color: '#1d4ed8' },
  skills:    { bg: '#f3e8ff', color: '#7e22ce' },
  physical:  { bg: '#ffedd5', color: '#c2410c' },
  interview: { bg: '#fef9c3', color: '#854d0e' },
  other:     { bg: '#f1f5f9', color: '#475569' },
};

const GRS_GREEN = '#1c3d22';
const GRS_GOLD  = '#c8962a';

const TIER_COLORS: Record<string, string> = {
  Elite:        '#c8962a',
  Competitive:  '#1c3d22',
  Developmental:'#185fa5',
  Foundation:   '#666',
};

const DOMAIN_LABELS: Record<string, string> = {
  explosivePower:  'Jump',
  linearSpeed:     'Sprint',
  balance:         'Balance',
  cognitiveSpeed:  'Reaction',
  endurance:       'Endurance',
  ballMastery:     'Ball',
};

const SOURCE_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  test_session:    { label: 'Verified test',    bg: '#eaf3de', color: GRS_GREEN },
  drill_training:  { label: 'Drill session',    bg: '#e6f1fb', color: '#0c447c' },
  player_upload:   { label: 'Player upload',    bg: '#f1efe8', color: '#666'    },
  whatsapp:        { label: 'WhatsApp upload',  bg: '#e7fde8', color: '#166534' },
};

interface DrillScore {
  drillId: string;
  drillName: string;
  passportLabel: string;
  overall_score: number;
  top_strength?: string;
  analysedAt: string;
  data_confidence?: string;
}

interface PassportProps {
  player:         { id: string; name: string; age: number; position: string; school: string; username: string };
  latestSession:  any;
  recentSessions: any[];
  gamification:   any;
  videos:         any[];
  token:          string;
  drillScores?:   DrillScore[];
  reelClips?:     ReelClip[];
}

export default function PassportClient({
  player, latestSession, recentSessions, gamification, videos, token, drillScores, reelClips,
}: PassportProps) {
  const [activeVideo,     setActiveVideo]     = useState<any | null>(null);
  const [activeReelVideo, setActiveReelVideo] = useState<string | null>(null);
  const [copied,   setCopied]   = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const tier = latestSession?.tier ?? 'Foundation';
  const aq   = latestSession?.aqScore ?? 0;
  const rank = gamification?.rank ?? 'Rookie';

  // Sort sessions for timeline
  const timeline = [...recentSessions]
    .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());

  const maxAQ = Math.max(...timeline.map(s => s.aqScore ?? 0), 1);

  // DQ from last 2 sessions
  const dqText = (() => {
    if (timeline.length < 2) return null;
    const last     = timeline[timeline.length - 1].aqScore ?? 0;
    const prev     = timeline[timeline.length - 2].aqScore ?? 0;
    const daysDiff = 7;
    const weeklyChange = ((last - prev) / daysDiff) * 7;
    const dq = ((weeklyChange / Math.max(1, prev)) * 100).toFixed(1);
    return parseFloat(dq) >= 0 ? `+${dq}%/wk` : `${dq}%/wk`;
  })();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url  = window.location.href;
    const text = `${player.name}'s GRS Talent Passport — AQ ${aq} · ${player.position}`;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'GRS Talent Passport', text, url });
        return;
      } catch { /* user cancelled — fall through to clipboard */ }
    }
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Inline gate component for premium sections
  const PremiumGate = ({ children }: { children: ReactNode }) => {
    if (unlocked) return <>{children}</>;
    return (
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12 }}>
        <div style={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none' }}>
          {children}
        </div>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
          background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(2px)', borderRadius: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: GRS_GREEN }}>🔒 Scout-only data</div>
          <div style={{ fontSize: 12, color: '#555', textAlign: 'center', maxWidth: 200, lineHeight: 1.4 }}>
            Full talent data for scouts and clubs
          </div>
          <button
            onClick={() => setUnlocked(true)}
            style={{ padding: '8px 18px', background: GRS_GOLD, color: '#fff', border: 'none',
                     borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            Unlock · $1.50/week
          </button>
        </div>
      </div>
    );
  };

  const barColor = (pct: number) =>
    pct >= 75 ? GRS_GREEN : pct >= 40 ? GRS_GOLD : '#b42318';

  // Passport videos (auto-selected 3)
  const passportVideos = [
    videos.find(v => v.label?.toLowerCase().includes('sprint') && v.source === 'test_session'),
    videos.find(v => v.label?.toLowerCase().includes('jump')   && v.source === 'test_session'),
    videos.find(v => v.source === 'drill_training'),
  ].filter(Boolean).slice(0, 3);

  return (
    <div style={{ background: '#F4F2EE', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>

      {/* ── Header / tier banner ─────────────────────────────────────── */}
      <div style={{ background: TIER_COLORS[tier], padding: '24px 16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              GrassRoots Sports · Talent Passport
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{player.name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
              Age {player.age} · {player.position} · {player.school}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{aq}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>AQ score</div>
            {dqText && (
              <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>
                {dqText}
              </div>
            )}
          </div>
        </div>

        {/* Tier + rank row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>
            {tier} tier
          </span>
          <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>
            {rank}
          </span>
          {gamification?.weeklyStreak > 0 && (
            <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 20 }}>
              {gamification.weeklyStreak} week streak
            </span>
          )}
          {gamification?.totalSessions > 0 && (
            <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 20 }}>
              {gamification.totalSessions} sessions
            </span>
          )}
          {latestSession?.coachVerified && (
            <span style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>
              ✓ Coach verified
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Domain scores ────────────────────────────────────────────── */}
        {latestSession && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '0.5px solid #e5e5e5' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
              Athletic profile
            </div>
            {[
              ['explosivePower',  'Jump',      latestSession.jumpPercentile,     `${latestSession.jumpHeight ?? '—'}cm`],
              ['linearSpeed',     'Sprint',    latestSession.sprintPercentile,   `${latestSession.sprintTime?.toFixed(2) ?? '—'}s`],
              ['balance',         'Balance',   latestSession.balancePercentile,  `${latestSession.balanceRightOpen ?? '—'} corrections avg`],
              ['cognitiveSpeed',  'Reaction',  latestSession.reactionPercentile, `${latestSession.reactionCatch ?? '—'}/5 catches`],
              ['endurance',       'Endurance', latestSession.chitimaPercentile,  `${latestSession.chitimaTotalSec ?? '—'}s circuit`],
              ['ballMastery',     'Ball',      latestSession.ballPercentile,     `${latestSession.jugglingSeq ?? '—'} juggles`],
            ].map(([, label, pct, raw]) => {
              const p = (pct as number) ?? 0;
              if (!p) return null;
              return (
                <div key={label as string} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#333' }}>{label as string}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#999' }}>{raw as string}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: barColor(p) }}>{p}th pct</span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${p}%`, background: barColor(p), borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Position quotient ────────────────────────────────────────── */}
        {latestSession && (
          <PremiumGate>
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '0.5px solid #e5e5e5' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
              Position match
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
              {([
                ['Striker',    latestSession.pqStriker    ?? 0],
                ['Winger',     latestSession.pqWinger     ?? 0],
                ['Midfielder', latestSession.pqMidfielder ?? 0],
                ['Defender',   latestSession.pqDefender   ?? 0],
                ['GK',         latestSession.pqGoalkeeper ?? 0],
              ] as [string, number][]).map(([pos, score]) => {
                const isBest = pos.toLowerCase().includes(player.position?.toLowerCase().slice(0, 4));
                return (
                  <div key={pos} style={{
                    textAlign: 'center', padding: '8px 4px', borderRadius: 8,
                    background: isBest ? '#eaf3de' : '#f5f5f5',
                    border: isBest ? `1px solid ${GRS_GREEN}` : '1px solid transparent',
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: isBest ? GRS_GREEN : '#555' }}>{score}</div>
                    <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>{pos}</div>
                  </div>
                );
              })}
            </div>
          </div>
          </PremiumGate>
        )}

        {/* ── Injury flag ──────────────────────────────────────────────── */}
        {latestSession?.injuryRisk && (
          <div style={{ background: '#fdecea', border: '0.5px solid #f7c1c1', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#b42318', marginBottom: 3 }}>
              Balance asymmetry flag
            </div>
            <div style={{ fontSize: 12, color: '#9b2335' }}>
              Left-right balance difference detected above 25% threshold. Flagged for attention before high-intensity training.
            </div>
          </div>
        )}

        {/* ── AQ progression timeline ──────────────────────────────────── */}
        {timeline.length >= 2 && (
          <PremiumGate>
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '0.5px solid #e5e5e5' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
              Development trajectory — AQ over time
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
              {timeline.map((s, i) => {
                const h = Math.round(((s.aqScore ?? 0) / maxAQ) * 52);
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ fontSize: 9, color: '#aaa' }}>{s.aqScore ?? 0}</div>
                    <div style={{ width: '100%', height: h, borderRadius: '3px 3px 0 0', background: i === timeline.length - 1 ? GRS_GREEN : '#c0dd97' }} />
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 6, textAlign: 'right' }}>
              {timeline.length} sessions tracked
            </div>
          </div>
          </PremiumGate>
        )}

        {/* ── Passport videos ──────────────────────────────────────────── */}
        {passportVideos.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '0.5px solid #e5e5e5' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
              Performance videos
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {passportVideos.map((v: any) => {
                const badge = SOURCE_BADGES[v.source] ?? SOURCE_BADGES.player_upload;
                return (
                  <div key={v.id}
                    onClick={() => setActiveVideo(activeVideo?.id === v.id ? null : v)}
                    style={{ border: '0.5px solid #e5e5e5', borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
                             background: activeVideo?.id === v.id ? '#f9f9f9' : '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#222' }}>{v.label}</div>
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                          {new Date(v.uploadedAt).toLocaleDateString()}
                          {v.durationSec && ` · ${v.durationSec}s`}
                        </div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 20, background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </div>
                    {activeVideo?.id === v.id && v.url && (
                      <video
                        src={v.url}
                        controls
                        playsInline
                        style={{ width: '100%', borderRadius: 8, marginTop: 10, maxHeight: 280, background: '#000' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Scout narrative ───────────────────────────────────────────── */}
        {latestSession?.scoutNarrative && (
          <PremiumGate>
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '0.5px solid #e5e5e5' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              Scout report
            </div>
            <div style={{ fontSize: 13, color: '#444', lineHeight: 1.7 }}>
              {latestSession.scoutNarrative}
            </div>
            {latestSession.coachVerified && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10 }}>
                <span style={{ color: GRS_GREEN, fontSize: 12 }}>✓</span>
                <span style={{ fontSize: 11, color: GRS_GREEN, fontWeight: 500 }}>
                  Verified by {latestSession.verifiedBy}
                </span>
                <span style={{ fontSize: 11, color: '#aaa' }}>
                  · {new Date(latestSession.sessionDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          </PremiumGate>
        )}

        {/* ── Gemini drill scores ───────────────────────────────────────── */}
        {drillScores && drillScores.length > 0 && (
          <PremiumGate>
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '0.5px solid #e5e5e5' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
              Gemini drill analysis
            </div>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10 }}>
              AI video analysis — Gemini 2.0 Flash · technique measured across motion
            </div>
            {drillScores.map(ds => {
              const pct = Math.round((ds.overall_score / 10) * 100);
              const color = ds.overall_score >= 8 ? GRS_GREEN : ds.overall_score >= 6 ? GRS_GOLD : '#b42318';
              return (
                <div key={ds.drillId} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#333' }}>{ds.passportLabel}</span>
                      {ds.top_strength && (
                        <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>{ds.top_strength}</div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color }}>{ds.overall_score.toFixed(1)}/10</span>
                      {ds.data_confidence && (
                        <div style={{ fontSize: 9, color: '#aaa', marginTop: 1 }}>{ds.data_confidence} confidence</div>
                      )}
                    </div>
                  </div>
                  <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
          </PremiumGate>
        )}

        {/* ── Scholarship Reel ──────────────────────────────────────────── */}
        {reelClips && reelClips.length > 0 && (
          <PremiumGate>
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '0.5px solid #e5e5e5' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
              Scholarship Reel
            </div>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12 }}>
              {reelClips.length} clip{reelClips.length !== 1 ? 's' : ''} · curated by the player
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reelClips.map((clip) => {
                const col = REEL_CAT_COLORS[clip.category] ?? REEL_CAT_COLORS.other;
                const isPlaying = activeReelVideo === clip.id;
                return (
                  <div key={clip.id} style={{ border: '0.5px solid #e5e5e5', borderRadius: 10, overflow: 'hidden' }}>
                    <div
                      onClick={() => setActiveReelVideo(isPlaying ? null : clip.id)}
                      style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Thumbnail */}
                      <div style={{
                        width: 60, height: 44, borderRadius: 6, flexShrink: 0,
                        background: clip.thumbnail_url ? 'transparent' : '#f0fdf4',
                        border: '0.5px solid #e5e5e5', overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative',
                      }}>
                        {clip.thumbnail_url
                          ? <img src={clip.thumbnail_url} alt={clip.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: 18 }}>🎬</span>
                        }
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 0, height: 0, borderStyle: 'solid', borderWidth: '4px 0 4px 7px', borderColor: 'transparent transparent transparent #1c3d22', marginLeft: 1 }} />
                          </div>
                        </div>
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                          {clip.title}
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 12, background: col.bg, color: col.color }}>
                          {clip.category.charAt(0).toUpperCase() + clip.category.slice(1)}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#bbb', flexShrink: 0 }}>
                        {new Date(clip.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {isPlaying && (
                      <video
                        src={clip.r2_url}
                        controls
                        playsInline
                        autoPlay
                        style={{ width: '100%', maxHeight: 260, background: '#000', display: 'block' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          </PremiumGate>
        )}

        {/* ── Share / copy link ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 24 }}>
          <button
            onClick={handleShare}
            style={{ width: '100%', padding: '14px', borderRadius: 12, background: GRS_GREEN, color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
            Share Passport
          </button>
          <button
            onClick={handleCopyLink}
            style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'transparent', color: GRS_GREEN, fontWeight: 600, fontSize: 13, border: `1.5px solid ${GRS_GREEN}`, cursor: 'pointer' }}>
            {copied ? 'Link copied ✓' : 'Copy Link'}
          </button>
          <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center' }}>
            grassrootssports.live/passport/{token}
          </div>
        </div>

      </div>
    </div>
  );
}