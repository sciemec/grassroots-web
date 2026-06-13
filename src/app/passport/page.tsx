'use client';
// src/app/player/passport/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Player Passport Hub — /player/passport
//
// What the PLAYER sees when they want to market themselves:
//   - Their shareable passport URL
//   - QR code for the passport link
//   - Copy link button
//   - "What scouts see" preview link
//   - Shortcut to share to Arena
//   - Passport completion checklist (how complete is their profile)
//
// This page is the bridge between the player dashboard and the public passport.
// The public passport lives at /passport/[token] and is what scouts actually see.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QrCode, Copy, CheckCircle2, ExternalLink, Share2, ArrowLeft, Globe2, Video } from 'lucide-react';

const GRS_GREEN = '#1c3d22';
const GRS_GOLD  = '#c8962a';

interface PassportStatus {
  passport_token:    string | null;
  aq_score:          number | null;
  dq_text:           string | null;
  rank:              string;
  sessions_completed: number;
  videos_public:     number;
  tier:              string;
  position:          string;
  name:              string;
}

export default function PlayerPassportPage() {
  const router = useRouter();
  const [status,  setStatus]  = useState<PassportStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    const token    = localStorage.getItem('passport_token');
    const playerId = localStorage.getItem('player_id');
    if (!playerId) { router.replace('/login'); return; }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token') ?? ''}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        const u = d.user ?? d;
        setStatus({
          passport_token:     u.passport_token ?? token,
          aq_score:           u.aq_score       ?? null,
          dq_text:            u.dq_text        ?? null,
          rank:               u.rank           ?? 'Rookie',
          sessions_completed: u.sessions_count ?? 0,
          videos_public:      u.videos_public  ?? 0,
          tier:               u.tier           ?? 'Foundation',
          position:           u.position       ?? 'Player',
          name:               u.name           ?? u.first_name ?? 'Athlete',
        });
        // Keep localStorage in sync
        if (u.passport_token) localStorage.setItem('passport_token', u.passport_token);
        if (u.gender)         localStorage.setItem('player_gender', u.gender);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const passportUrl = status?.passport_token
    ? `https://grassrootssports.live/passport/${status.passport_token}`
    : null;

  const copyLink = async () => {
    if (!passportUrl) return;
    await navigator.clipboard.writeText(passportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Checklist — how complete is the passport
  const checklist = status ? [
    { label: 'At least 1 test session',  done: (status.sessions_completed ?? 0) >= 1,  link: '/player/talent-id' },
    { label: 'At least 4 test sessions', done: (status.sessions_completed ?? 0) >= 4,  link: '/player/talent-id' },
    { label: 'AQ score recorded',        done: status.aq_score !== null,                link: '/player/talent-id' },
    { label: 'At least 1 public video',  done: (status.videos_public ?? 0) >= 1,        link: '/player/drills'    },
    { label: 'Position set',             done: !!status.position && status.position !== 'Player', link: '/register' },
  ] : [];
  const completedItems = checklist.filter(c => c.done).length;
  const pct = checklist.length > 0 ? Math.round((completedItems / checklist.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f2ee] flex items-center justify-center">
        <div className="text-sm text-gray-400 animate-pulse">Loading your passport...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f2ee] pb-16">

      {/* Header */}
      <div style={{ background: GRS_GREEN, padding: '20px 16px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <Link href="/player"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.1)', color:'#fff', textDecoration:'none' }}>
              <ArrowLeft size={16}/>
            </Link>
            <div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Market yourself</div>
              <h1 style={{ fontSize:20, fontWeight:800, color:'#fff', margin:0 }}>Talent Passport</h1>
            </div>
          </div>

          {/* Passport completion bar */}
          <div style={{ marginBottom:4 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.6)' }}>Passport completeness</span>
              <span style={{ fontSize:11, color: pct===100 ? GRS_GOLD : 'rgba(255,255,255,0.7)', fontWeight:700 }}>{pct}%</span>
            </div>
            <div style={{ height:4, background:'rgba(255,255,255,0.15)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ height:'100%', background: pct===100 ? GRS_GOLD : '#4ade80', width:`${pct}%`, borderRadius:2, transition:'width 0.5s ease' }}/>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:560, margin:'0 auto', padding:'16px 16px 0' }}>

        {/* Passport URL card */}
        {passportUrl ? (
          <div style={{ background:'#fff', borderRadius:16, border:'0.5px solid #e5e5e5', padding:20, marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:GRS_GREEN, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
              Your scout link
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'#f8faf7', borderRadius:10, padding:'10px 12px', marginBottom:12, border:'0.5px solid #e0e0e0' }}>
              <Globe2 size={14} style={{ color:GRS_GREEN, flexShrink:0 }}/>
              <span style={{ fontSize:12, color:'#333', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {passportUrl}
              </span>
            </div>

            <div style={{ display:'flex', gap:8 }}>
              {/* Copy link */}
              <button onClick={copyLink}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px 0', borderRadius:10, border:`1.5px solid ${GRS_GREEN}`, background: copied ? '#eaf3de' : '#fff', color:GRS_GREEN, fontWeight:700, fontSize:13, cursor:'pointer', transition:'all 0.15s' }}>
                {copied ? <><CheckCircle2 size={14}/> Copied!</> : <><Copy size={14}/> Copy link</>}
              </button>

              {/* View as scout */}
              <Link href={`/passport/${status.passport_token}`} target="_blank"
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px 0', borderRadius:10, background:GRS_GREEN, color:'#fff', fontWeight:700, fontSize:13, textDecoration:'none' }}>
                <ExternalLink size={14}/> View passport
              </Link>
            </div>

            <p style={{ fontSize:11, color:'#aaa', marginTop:10, textAlign:'center' }}>
              Anyone with this link can view your passport — no login required
            </p>
          </div>
        ) : (
          /* No passport token yet */
          <div style={{ background:'#fff', borderRadius:16, border:'1px dashed #e0e0e0', padding:24, textAlign:'center', marginBottom:12 }}>
            <QrCode size={32} style={{ color:'#ccc', margin:'0 auto 10px' }}/>
            <div style={{ fontWeight:700, color:GRS_GREEN, marginBottom:6 }}>Passport not yet activated</div>
            <div style={{ fontSize:13, color:'#888', marginBottom:16, lineHeight:1.6 }}>
              Complete your first test session to activate your Talent Passport.
            </div>
            <Link href="/player/talent-id"
              style={{ background:GRS_GREEN, color:'#fff', padding:'10px 20px', borderRadius:10, fontWeight:700, fontSize:13, textDecoration:'none', display:'inline-block' }}>
              Take your 6 tests →
            </Link>
          </div>
        )}

        {/* Key stats */}
        {status && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
            {[
              { label:'AQ Score', value: status.aq_score ?? '—', sub: status.tier },
              { label:'DQ',       value: status.dq_text ?? '—',  sub: 'dev rate'  },
              { label:'Rank',     value: status.rank,             sub: `${status.sessions_completed} sessions` },
            ].map(s => (
              <div key={s.label} style={{ background:'#fff', borderRadius:12, border:'0.5px solid #e5e5e5', padding:'12px 10px', textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:900, color:GRS_GREEN, lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:9, fontWeight:700, color:'#aaa', textTransform:'uppercase', marginTop:3 }}>{s.label}</div>
                <div style={{ fontSize:9, color:'#ccc', marginTop:1 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Share to Arena */}
        <div style={{ background:'linear-gradient(135deg, #1c3d22 0%, #185fa5 100%)', borderRadius:16, padding:20, marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
            Get noticed on the Arena
          </div>
          <div style={{ fontWeight:800, color:'#fff', fontSize:15, marginBottom:8 }}>
            Post a training video — scouts are watching
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', lineHeight:1.6, marginBottom:12 }}>
            Videos you mark as public appear in the Arena feed. Scouts follow players whose videos catch their eye.
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Link href="/arena"
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px 0', borderRadius:10, background:'rgba(255,255,255,0.15)', color:'#fff', fontWeight:700, fontSize:12, textDecoration:'none' }}>
              <Globe2 size={14}/> Open Arena
            </Link>
            <Link href="/player/drills"
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px 0', borderRadius:10, background:GRS_GOLD, color:GRS_GREEN, fontWeight:700, fontSize:12, textDecoration:'none' }}>
              <Video size={14}/> Upload drill video
            </Link>
          </div>
        </div>

        {/* Checklist */}
        <div style={{ background:'#fff', borderRadius:16, border:'0.5px solid #e5e5e5', padding:20, marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:GRS_GREEN, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>
            Passport checklist — {completedItems}/{checklist.length} complete
          </div>
          {checklist.map(item => (
            <div key={item.label} style={{ display:'flex', alignItems:'center', gap:10, paddingBottom:10, marginBottom:10, borderBottom:'0.5px solid #f0f0f0' }}>
              <div style={{ width:20, height:20, borderRadius:'50%', background: item.done ? '#eaf3de' : '#f5f5f5', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {item.done
                  ? <CheckCircle2 size={12} style={{ color:GRS_GREEN }}/>
                  : <div style={{ width:6, height:6, borderRadius:'50%', background:'#ddd' }}/>
                }
              </div>
              <div style={{ flex:1, fontSize:13, color: item.done ? '#555' : '#888', textDecoration: item.done ? 'none' : 'none' }}>
                {item.label}
              </div>
              {!item.done && (
                <Link href={item.link}
                  style={{ fontSize:10, fontWeight:700, color:GRS_GREEN, textDecoration:'none', background:'#f0f9e8', padding:'3px 8px', borderRadius:20 }}>
                  Do it →
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* How scouts find you */}
        <div style={{ background:'#f8faf7', borderRadius:16, border:'0.5px solid #e5e5e5', padding:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>
            How scouts find you
          </div>
          {[
            { icon:'🔗', text:'You share your passport link directly with a coach or club' },
            { icon:'📹', text:'A scout sees your video in the Arena feed and clicks your profile' },
            { icon:'🔍', text:'A scout searches the talent database and your profile appears' },
            { icon:'📈', text:'Your AQ improves — scouts watching you get an alert' },
          ].map(s => (
            <div key={s.icon} style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{s.icon}</span>
              <span style={{ fontSize:12, color:'#666', lineHeight:1.6 }}>{s.text}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}