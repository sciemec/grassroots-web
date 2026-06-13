// app/passport/[token]/PassportClient.tsx
// ─────────────────────────────────────────────────────────────────────────────
// GRS Talent Passport — client component
// Renders everything a scout or club owner sees
// ─────────────────────────────────────────────────────────────────────────────
'use client';

import { useState } from 'react';

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

interface PassportProps {
  player:         { id: string; name: string; age: number; position: string; school: string; username: string };
  latestSession:  any;
  recentSessions: any[];
  gamification:   any;
  videos:         any[];
  token:          string;
}

export default function PassportClient({
  player, latestSession, recentSessions, gamification, videos, token,
}: PassportProps) {
  const [activeVideo, setActiveVideo] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

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
        )}

        {/* ── Share / copy link ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 24 }}>
          <button
            onClick={handleCopyLink}
            style={{ width: '100%', padding: '14px', borderRadius: 12, background: GRS_GREEN, color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
            {copied ? 'Link copied ✓' : 'Copy passport link'}
          </button>
          <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center' }}>
            grassrootssports.live/passport/{token}
          </div>
        </div>

      </div>
    </div>
  );
}