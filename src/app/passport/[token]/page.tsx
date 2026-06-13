// src/app/passport/[token]/page.tsx
// Public Talent Passport — no login required
// URL: grassrootssports.live/passport/{passport_token}

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import PassportClient from './PassportClient';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://bhora-ai.onrender.com/api/v1';

interface Props { params: { token: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const res = await fetch(`${API}/player/public/${params.token}?by=passport_token`, { cache:'no-store' });
    if (!res.ok) return { title:'GRS Talent Passport' };
    const d = await res.json();
    const p = d.player ?? d.data ?? d;
    const aq = d.latestSession?.aqScore ?? null;
    return {
      title: `${p.name ?? 'Athlete'} — GRS Talent Passport`,
      description: aq
        ? `AQ ${aq} · ${p.position ?? 'Player'} · ${p.province ?? 'Zimbabwe'} — Verified by GrassRoots Sports`
        : `${p.position ?? 'Player'} · ${p.province ?? 'Zimbabwe'} — GRS Talent Passport`,
      openGraph: {
        title: `${p.name ?? 'Athlete'} · GRS Talent Passport`,
        description: `Verified athletic profile · AQ ${aq ?? '—'} · ${p.position ?? ''} · ${p.province ?? 'Zimbabwe'}`,
        url: `https://grassrootssports.live/passport/${params.token}`,
        siteName: 'GrassRoots Sports',
      },
    };
  } catch { return { title:'GRS Talent Passport' }; }
}

export default async function PassportPage({ params }: Props) {
  const { token } = params;
  if (!token || token.length < 10) notFound();

  const [playerRes, vaultRes] = await Promise.all([
    fetch(`${API}/player/public/${token}?by=passport_token`,                  { cache:'no-store' }),
    fetch(`${API}/player/vault/${token}?by=passport_token&visibility=public`,  { cache:'no-store' }),
  ]);

  if (!playerRes.ok) notFound();

  const pd = await playerRes.json();
  const vd = vaultRes.ok ? await vaultRes.json() : [];

  return (
    <div style={{ minHeight:'100vh', background:'#f4f2ee' }}>
      <PassportClient
        player={pd.player ?? pd.data ?? pd}
        latestSession={pd.latestSession ?? pd.latest_session ?? null}
        recentSessions={pd.recentSessions ?? pd.recent_sessions ?? []}
        gamification={pd.gamification ?? null}
        videos={Array.isArray(vd) ? vd : (vd.data ?? [])}
        token={token}
      />
    </div>
  );
}