'use client';
// src/app/player/pathway/page.tsx
// Scholarship Pathway — Academic Profile + Timeline + Coach Outreach Tracker

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, Save, Plus, Trash2, ExternalLink, CheckCircle2, Circle } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { postToArena } from '@/lib/arena-poster';

const G   = '#1a5c2a';
const GO  = '#c8962a';
const OFF = '#f4f2ee';

// ── TYPES ─────────────────────────────────────────────────────────────────────

interface PathwayProfile {
  school_year: string;
  school_name_academic: string;
  predicted_grades: Record<string, string>;
  english_proficiency: string;
  target_pathway: string;
  target_sports: string[];
  ncaa_id: string;
  ncaa_registered: boolean;
  ncaa_cleared: boolean;
  scholarship_status: string;
  scholarship_target_year: string;
  pathway_sport: string;
  pathway_checkpoints: Record<string, boolean>;
}

interface OutreachEntry {
  id?: number;
  institution_name: string;
  country: string;
  division: string;
  sport: string;
  coach_name: string;
  coach_email: string;
  contacted_date: string;
  status: string;
  notes: string;
}

// ── CONFIG ────────────────────────────────────────────────────────────────────

const SCHOOL_YEARS = [
  { value: 'form1',      label: 'Form 1 (Age 12–13)' },
  { value: 'form2',      label: 'Form 2 (Age 13–14)' },
  { value: 'form3',      label: 'Form 3 (Age 14–15) — Start building profile' },
  { value: 'form4',      label: 'Form 4 (Age 15–16) — Upload first reel' },
  { value: 'form5',      label: 'Form 5 (Age 16–17) — Begin outreach' },
  { value: 'form6',      label: 'Form 6 / A-Level (Age 17–18)' },
  { value: 'university', label: 'University' },
  { value: 'graduated',  label: 'Graduated' },
];

const PATHWAYS = [
  { value: 'ncaa_d1',       label: 'NCAA Division I (USA — top level)' },
  { value: 'ncaa_d2',       label: 'NCAA Division II (USA — scholarship + academics)' },
  { value: 'naia',          label: 'NAIA (USA — strong scholarship, easier entry)' },
  { value: 'juco',          label: 'JUCO (USA Junior College — 2-year pathway)' },
  { value: 'uk_university', label: 'UK University Sport' },
  { value: 'europe',        label: 'European Club / Academy' },
  { value: 'professional',  label: 'Professional Club Contract' },
  { value: 'undecided',     label: 'Not decided yet' },
];

const SPORTS = [
  'Football','Rugby','Basketball','Athletics','Netball',
  'Swimming','Tennis','Cricket','Volleyball','Hockey',
];

const OUTREACH_STATUSES = [
  { value: 'planning',      label: '📋 Planning to contact' },
  { value: 'contacted',     label: '📤 Contacted' },
  { value: 'waiting',       label: '⏳ Waiting for reply' },
  { value: 'responded',     label: '💬 Responded' },
  { value: 'interested',    label: '⭐ Interested' },
  { value: 'trial_invited', label: '🏟️ Trial invited' },
  { value: 'offered',       label: '🎉 Scholarship offered' },
  { value: 'declined',      label: '❌ Declined' },
];

const CHECKPOINTS = [
  { key: 'profile_complete',          label: 'Player profile completed',              when: 'Form 3' },
  { key: 'thuto_score_started',       label: 'THUTO Score history started (3+ sessions)', when: 'Form 3–4' },
  { key: 'highlight_reel_uploaded',   label: 'First highlight reel uploaded',         when: 'Form 4' },
  { key: 'scholarship_reel_complete', label: 'Scholarship Reel complete (4 slots)',   when: 'Form 4–5' },
  { key: 'ncaa_registered',           label: 'NCAA / pathway registration done',      when: 'Form 5' },
  { key: 'coach_outreach_started',    label: 'First coach contacted',                 when: 'Form 5' },
  { key: 'scholarship_applied',       label: 'Scholarship application submitted',     when: 'Form 6' },
];

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://bhora-ai.onrender.com/api/v1';

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function PathwayPage() {
  const user     = useAuthStore(s => s.user);
  const token    = useAuthStore(s => s.token);
  const hydrated = useAuthStore(s => s._hasHydrated);
  const isPro    = (user as { subscription_tier?: string } | null)?.subscription_tier === 'pro';

  const [profile,     setProfile]     = useState<Partial<PathwayProfile>>({});
  const [outreach,    setOutreach]    = useState<OutreachEntry[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [tab,         setTab]         = useState<'profile' | 'timeline' | 'outreach'>('profile');
  const [addingEntry, setAddingEntry] = useState(false);
  const [newEntry,    setNewEntry]    = useState<OutreachEntry>({
    institution_name: '', country: 'USA', division: 'NCAA D2',
    sport: 'Football', coach_name: '', coach_email: '',
    contacted_date: '', status: 'planning', notes: '',
  });

  // Load pathway profile + outreach
  useEffect(() => {
    if (!hydrated || !token) return;
    Promise.all([
      fetch(`${API}/player/pathway`,  { headers: authHeaders(token) }).then(r => r.json()),
      fetch(`${API}/player/outreach`, { headers: authHeaders(token) }).then(r => r.json()),
    ])
      .then(([p, o]) => {
        setProfile(p ?? {});
        setOutreach(Array.isArray(o) ? o : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hydrated, token]);

  // Set default sport from user profile once loaded
  useEffect(() => {
    if (user?.sport) {
      setNewEntry(prev => ({ ...prev, sport: user.sport as string }));
    }
  }, [user]);

  const saveProfile = useCallback(async () => {
    if (!token) return;
    setSaving(true);
    try {
      const cp = { ...(profile.pathway_checkpoints ?? {}) };
      if (profile.ncaa_registered)    cp.ncaa_registered = true;
      if (outreach.length > 0)        cp.coach_outreach_started = true;
      await fetch(`${API}/player/pathway`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ ...profile, pathway_checkpoints: cp }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  }, [token, profile, outreach]);

  const addOutreach = useCallback(async () => {
    if (!token || !newEntry.institution_name) return;
    try {
      const res  = await fetch(`${API}/player/outreach`, {
        method: 'POST', headers: authHeaders(token), body: JSON.stringify(newEntry),
      });
      const data = await res.json() as { id: number };
      setOutreach(prev => [{ ...newEntry, id: data.id }, ...prev]);
      setAddingEntry(false);
      setNewEntry(prev => ({ ...prev, institution_name: '', coach_name: '', coach_email: '', notes: '' }));
      setProfile(prev => ({
        ...prev,
        pathway_checkpoints: { ...(prev.pathway_checkpoints ?? {}), coach_outreach_started: true },
      }));
    } catch { /* silent */ }
  }, [token, newEntry]);

  const updateStatus = useCallback(async (id: number, status: string) => {
    if (!token) return;
    await fetch(`${API}/player/outreach/${id}`, {
      method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ status }),
    });
    setOutreach(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  }, [token]);

  const deleteEntry = useCallback(async (id: number) => {
    if (!token) return;
    await fetch(`${API}/player/outreach/${id}`, { method: 'DELETE', headers: authHeaders(token) });
    setOutreach(prev => prev.filter(e => e.id !== id));
  }, [token]);

  // Milestones that trigger Arena auto-posts when first completed
  const ARENA_MILESTONE_POSTS: Record<string, string> = {
    scholarship_reel_complete: "Scholarship Reel complete — all 4 categories showcased for scouts.",
    ncaa_registered:           "NCAA Eligibility Center registration complete.",
    coach_outreach_started:    "Started reaching out to university coaches.",
    scholarship_applied:       "Applied for a scholarship — pathway checkpoint reached.",
  };

  const toggleCheckpoint = (key: string) => {
    const wasDone = !!(profile.pathway_checkpoints?.[key]);
    setProfile(prev => ({
      ...prev,
      pathway_checkpoints: {
        ...(prev.pathway_checkpoints ?? {}),
        [key]: !wasDone,
      },
    }));
    // Fire Arena auto-post only when marking done (not unmarking)
    if (!wasDone && ARENA_MILESTONE_POSTS[key]) {
      postToArena(ARENA_MILESTONE_POSTS[key], {
        postType: "milestone",
        activityType: "pathway_checkpoint",
        activityData: { checkpoint: key },
      });
    }
  };

  const completedCount = CHECKPOINTS.filter(c => profile.pathway_checkpoints?.[c.key]).length;
  const progressPct    = Math.round((completedCount / CHECKPOINTS.length) * 100);

  if (!hydrated) return null;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: OFF, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#333', fontSize: 14, fontWeight: 600 }}>Loading pathway...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: OFF }}>

      {/* Header */}
      <div style={{ background: G, padding: '14px 16px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/player" style={{ color: 'rgba(255,255,255,0.7)', display: 'flex' }}>
            <ChevronLeft size={20} />
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>My Scholarship Pathway</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
              {completedCount}/{CHECKPOINTS.length} steps complete · {progressPct}% ready
            </div>
          </div>
          {isPro ? (
            <button
              onClick={saveProfile}
              disabled={saving}
              style={{
                padding: '8px 16px', borderRadius: 20, border: 'none',
                background: saved ? '#16a34a' : GO,
                color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Save size={14} />
              {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save'}
            </button>
          ) : (
            <Link href="/player/subscription" style={{ padding: '8px 16px', borderRadius: 20, background: '#c8962a', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              🔒 Unlock
            </Link>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: '#e0e0e0' }}>
        <div style={{ height: 4, width: `${progressPct}%`, background: GO, transition: 'width 0.5s' }} />
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#fff', borderRadius: 10, padding: 4, gap: 4, marginBottom: 16, border: '1px solid #e0e0e0' }}>
          {([
            { id: 'profile',  label: 'Academic Profile' },
            { id: 'timeline', label: 'Pathway Timeline' },
            { id: 'outreach', label: `Coach Outreach (${outreach.length})` },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                background: tab === t.id ? G : 'transparent',
                color: tab === t.id ? '#fff' : '#666',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: ACADEMIC PROFILE ─────────────────────────────────────────── */}
        {tab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div style={{ background: '#eaf3de', borderRadius: 10, padding: '12px 14px', border: '1px solid #c3dfa0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: G, marginBottom: 4 }}>Why this matters</div>
              <div style={{ fontSize: 11, color: '#3a6b2a', lineHeight: 1.6 }}>
                US college coaches never travel to Zimbabwe to scout. They rely entirely on digital profiles.
                A complete academic profile + verified THUTO Score + scholarship reel = your entire application.
                Start building this in Form 3. Most athletes who miss scholarships do so because they started too late.
              </div>
            </div>

            {/* School year */}
            <div style={{ background: '#fff', borderRadius: 10, padding: '14px', border: '1px solid #e0e0e0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: G, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                Current School Year
              </div>
              <select
                value={profile.school_year ?? ''}
                onChange={e => setProfile(p => ({ ...p, school_year: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, fontFamily: 'inherit' }}
              >
                <option value="">Select year...</option>
                {SCHOOL_YEARS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {profile.school_year && ['form1', 'form2'].includes(profile.school_year) && (
                <div style={{ fontSize: 11, color: GO, marginTop: 6 }}>
                  You have time to build a strong profile. Start your THUTO Score history now.
                </div>
              )}
              {profile.school_year === 'form3' && (
                <div style={{ fontSize: 11, color: G, fontWeight: 600, marginTop: 6 }}>
                  Perfect time to start. Complete your profile and log your first sessions.
                </div>
              )}
              {profile.school_year && ['form5', 'form6'].includes(profile.school_year) && (
                <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 6 }}>
                  Time is short. Focus on completing the Scholarship Reel and starting outreach now.
                </div>
              )}
            </div>

            {/* School name */}
            <div style={{ background: '#fff', borderRadius: 10, padding: '14px', border: '1px solid #e0e0e0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: G, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                School Name
              </div>
              <input
                value={profile.school_name_academic ?? ''}
                onChange={e => setProfile(p => ({ ...p, school_name_academic: e.target.value }))}
                placeholder="e.g. Nemakonde High School"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}
              />
            </div>

            {/* Predicted grades */}
            <div style={{ background: '#fff', borderRadius: 10, padding: '14px', border: '1px solid #e0e0e0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: G, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                Predicted / Achieved Grades
              </div>
              <div style={{ fontSize: 11, color: '#333', fontWeight: 600, marginBottom: 10 }}>
                US coaches need to verify academic eligibility. A-grades help scholarship applications.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { key: 'english',      label: 'English' },
                  { key: 'maths',        label: 'Maths' },
                  { key: 'science',      label: 'Science' },
                  { key: 'gpa_estimate', label: 'GPA estimate (0–4.0)' },
                ].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize: 11, color: '#333', fontWeight: 700, marginBottom: 4 }}>{f.label}</div>
                    <input
                      value={(profile.predicted_grades as Record<string, string>)?.[f.key] ?? ''}
                      onChange={e => setProfile(p => ({
                        ...p,
                        predicted_grades: { ...(p.predicted_grades ?? {}), [f.key]: e.target.value },
                      }))}
                      placeholder={f.key === 'gpa_estimate' ? '3.5' : 'A / B / C'}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* English proficiency */}
            <div style={{ background: '#fff', borderRadius: 10, padding: '14px', border: '1px solid #e0e0e0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: G, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                English Proficiency
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['native', 'fluent', 'intermediate', 'basic'].map(v => (
                  <button
                    key={v}
                    onClick={() => setProfile(p => ({ ...p, english_proficiency: v }))}
                    style={{
                      padding: '7px 14px', borderRadius: 20,
                      border: `1.5px solid ${profile.english_proficiency === v ? G : '#ddd'}`,
                      background: profile.english_proficiency === v ? G : '#fff',
                      color: profile.english_proficiency === v ? '#fff' : '#555',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#333', fontWeight: 600, marginTop: 8 }}>
                Native/Fluent English is a major advantage for US and UK university applications.
              </div>
            </div>

            {/* Target pathway */}
            <div style={{ background: '#fff', borderRadius: 10, padding: '14px', border: '1px solid #e0e0e0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: G, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                Target Pathway
              </div>
              <select
                value={profile.target_pathway ?? ''}
                onChange={e => setProfile(p => ({ ...p, target_pathway: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, fontFamily: 'inherit' }}
              >
                <option value="">Choose a pathway...</option>
                {PATHWAYS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              {profile.target_pathway === 'ncaa_d1' && (
                <div style={{ fontSize: 11, color: G, marginTop: 8, lineHeight: 1.6 }}>
                  NCAA D1 is the most competitive. Requires strong GPA + SAT/ACT + elite athletic performance.
                  Contact coaches by Form 5 at the latest.
                </div>
              )}
              {profile.target_pathway === 'naia' && (
                <div style={{ fontSize: 11, color: G, marginTop: 8, lineHeight: 1.6 }}>
                  NAIA is excellent for Zimbabwean athletes. Lower academic barriers, generous athletic scholarships,
                  and coaches are actively looking for international talent. Strong first choice.
                </div>
              )}
              {profile.target_pathway === 'juco' && (
                <div style={{ fontSize: 11, color: G, marginTop: 8, lineHeight: 1.6 }}>
                  JUCO (Junior College) is a 2-year pathway that can lead to a 4-year D1 or D2 transfer.
                </div>
              )}
            </div>

            {/* Primary scholarship sport */}
            <div style={{ background: '#fff', borderRadius: 10, padding: '14px', border: '1px solid #e0e0e0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: G, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                Primary Sport for Scholarship
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {SPORTS.map(s => (
                  <button
                    key={s}
                    onClick={() => setProfile(p => ({ ...p, pathway_sport: s }))}
                    style={{
                      padding: '7px 14px', borderRadius: 20,
                      border: `1.5px solid ${profile.pathway_sport === s ? G : '#ddd'}`,
                      background: profile.pathway_sport === s ? G : '#fff',
                      color: profile.pathway_sport === s ? '#fff' : '#555',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* NCAA registration */}
            <div style={{ background: '#fff', borderRadius: 10, padding: '14px', border: '1px solid #e0e0e0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: G, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                NCAA Eligibility Center / Pathway Registration
              </div>
              <div style={{ fontSize: 11, color: '#333', fontWeight: 600, marginBottom: 10 }}>
                If targeting US colleges: register at eligibilitycenter.org before Form 5. Coaches cannot offer a spot until you are registered.
              </div>
              <input
                value={profile.ncaa_id ?? ''}
                onChange={e => setProfile(p => ({ ...p, ncaa_id: e.target.value }))}
                placeholder="NCAA ID number (from eligibilitycenter.org)"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, marginBottom: 10 }}
              />
              <div style={{ display: 'flex', gap: 12 }}>
                {([
                  { key: 'ncaa_registered' as const, label: 'I have registered' },
                  { key: 'ncaa_cleared'    as const, label: 'I have been cleared' },
                ] as const).map(cb => (
                  <label key={cb.key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: '#555' }}>
                    <input
                      type="checkbox"
                      checked={!!profile[cb.key]}
                      onChange={e => setProfile(p => ({ ...p, [cb.key]: e.target.checked }))}
                      style={{ accentColor: G }}
                    />
                    {cb.label}
                  </label>
                ))}
              </div>
              <a
                href="https://web3.ncaa.org/ecwr3/css/html/front.html"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: G, marginTop: 10, fontWeight: 600 }}
              >
                <ExternalLink size={11} /> Register at NCAA Eligibility Center
              </a>
            </div>

            {/* Target year */}
            <div style={{ background: '#fff', borderRadius: 10, padding: '14px', border: '1px solid #e0e0e0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: G, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                Target Year to Start University / Academy
              </div>
              <select
                value={profile.scholarship_target_year ?? ''}
                onChange={e => setProfile(p => ({ ...p, scholarship_target_year: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, fontFamily: 'inherit' }}
              >
                <option value="">Select year...</option>
                {[2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

          </div>
        )}

        {/* ── TAB: PATHWAY TIMELINE ─────────────────────────────────────────── */}
        {tab === 'timeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            <div style={{ background: G, borderRadius: 12, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: GO }}>{progressPct}%</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Scholarship readiness</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                {completedCount} of {CHECKPOINTS.length} pathway steps complete
              </div>
            </div>

            <div style={{ background: '#fff3cd', borderRadius: 10, padding: '12px 14px', border: '1px solid #ffc107' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#856404' }}>Timeline: when to do each step</div>
              <div style={{ fontSize: 11, color: '#856404', marginTop: 4, lineHeight: 1.6 }}>
                US college coaches stop actively recruiting after October of the year before entry.
                European academies recruit year-round but plan 1 year in advance. Start Form 3. Don't wait.
              </div>
            </div>

            {CHECKPOINTS.map((cp, i) => {
              const done = profile.pathway_checkpoints?.[cp.key] ?? false;
              return (
                <div
                  key={cp.key}
                  onClick={() => toggleCheckpoint(cp.key)}
                  style={{
                    background: '#fff', borderRadius: 10, padding: '14px',
                    border: `1.5px solid ${done ? G : '#e0e0e0'}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12,
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{ flexShrink: 0, marginTop: 2 }}>
                    {done ? <CheckCircle2 size={20} color={G} /> : <Circle size={20} color="#ccc" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: done ? G : '#333' }}>{cp.label}</div>
                    <div style={{ fontSize: 11, color: '#444', fontWeight: 600, marginTop: 3 }}>When: {cp.when}</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: done ? G : '#ccc', flexShrink: 0 }}>
                    {i + 1}/{CHECKPOINTS.length}
                  </div>
                </div>
              );
            })}

            {profile.target_pathway && (
              <div style={{ background: '#eaf3de', borderRadius: 10, padding: '12px 14px', border: '1px solid #c3dfa0', marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: G, marginBottom: 6 }}>
                  Your pathway: {PATHWAYS.find(p => p.value === profile.target_pathway)?.label}
                </div>
                {profile.target_pathway === 'ncaa_d1' && (
                  <div style={{ fontSize: 11, color: '#3a6b2a', lineHeight: 1.7 }}>
                    <strong>Key dates for NCAA D1:</strong><br />
                    Form 3–4: Build THUTO history + upload highlight reel<br />
                    Form 4 (Sept): Coaches can begin unofficial contact<br />
                    Form 5 (June): Register at NCAA Eligibility Center<br />
                    Form 5 (Sept–Nov): Most coaches fill rosters — outreach deadline<br />
                    Form 6: Apply. Most offers come early in the school year.
                  </div>
                )}
                {profile.target_pathway === 'naia' && (
                  <div style={{ fontSize: 11, color: '#3a6b2a', lineHeight: 1.7 }}>
                    <strong>Key dates for NAIA:</strong><br />
                    Form 3–4: Start profile + THUTO score history<br />
                    Form 5: Upload scholarship reel. Register at PlayNAIA.org<br />
                    Form 5 (any time): Email coaches directly — NAIA coaches respond faster<br />
                    Form 6: Finalise applications. Many schools have rolling admissions.
                  </div>
                )}
                {profile.target_pathway === 'uk_university' && (
                  <div style={{ fontSize: 11, color: '#3a6b2a', lineHeight: 1.7 }}>
                    <strong>Key dates for UK University:</strong><br />
                    Form 5: A-Levels predicted grades needed for UCAS<br />
                    Form 6 (October): UCAS application deadline (competitive courses)<br />
                    Form 6 (January): Main UCAS deadline<br />
                    Sport scholarships: Apply directly to university sport departments alongside UCAS.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: COACH OUTREACH ───────────────────────────────────────────── */}
        {tab === 'outreach' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            <div style={{ background: '#eaf3de', borderRadius: 10, padding: '12px 14px', border: '1px solid #c3dfa0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: G, marginBottom: 4 }}>How to approach coaches</div>
              <div style={{ fontSize: 11, color: '#3a6b2a', lineHeight: 1.7 }}>
                Subject: &quot;Zimbabwean {profile.pathway_sport ?? 'athlete'} seeking {profile.target_pathway?.replace('_', ' ').toUpperCase() ?? 'scholarship'} opportunity — {new Date().getFullYear() + 1}&quot;<br /><br />
                Keep it under 200 words. Include your THUTO Score, your public Passport link, your GPA, and your target graduation year.
                Send to 30+ coaches. Expect 5–10% to respond. Follow up after 2 weeks if no reply.
              </div>
            </div>

            {isPro ? (
              <button
                onClick={() => setAddingEntry(!addingEntry)}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10,
                  background: addingEntry ? '#f5f5f5' : G,
                  color: addingEntry ? '#555' : '#fff',
                  border: `1.5px solid ${addingEntry ? '#ddd' : G}`,
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Plus size={16} />
                {addingEntry ? 'Cancel' : 'Add coach / institution'}
              </button>
            ) : (
              <Link href="/player/subscription" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px', borderRadius: 10, background: '#c8962a', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                🔒 Unlock to track coach outreach
              </Link>
            )}

            {addingEntry && isPro && (
              <div style={{ background: '#fff', borderRadius: 10, padding: '14px', border: `1.5px solid ${G}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  {[
                    { key: 'institution_name', label: 'Institution *', placeholder: 'University of Portland' },
                    { key: 'country',           label: 'Country *',     placeholder: 'USA' },
                    { key: 'division',          label: 'Division',      placeholder: 'NCAA D2 / NAIA / UK Premier' },
                    { key: 'coach_name',        label: 'Coach name',    placeholder: 'Coach Smith' },
                    { key: 'coach_email',       label: 'Coach email',   placeholder: 'coach@university.edu' },
                    { key: 'contacted_date',    label: 'Date contacted', placeholder: '' },
                  ].map(f => (
                    <div key={f.key}>
                      <div style={{ fontSize: 11, color: '#333', fontWeight: 700, marginBottom: 4 }}>{f.label}</div>
                      <input
                        type={f.key === 'contacted_date' ? 'date' : 'text'}
                        value={(newEntry as unknown as Record<string, string>)[f.key] ?? ''}
                        onChange={e => setNewEntry(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 12 }}
                      />
                    </div>
                  ))}
                  <div>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Sport *</div>
                    <select
                      value={newEntry.sport}
                      onChange={e => setNewEntry(p => ({ ...p, sport: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 12 }}
                    >
                      {SPORTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#333', fontWeight: 700, marginBottom: 4 }}>Status</div>
                    <select
                      value={newEntry.status}
                      onChange={e => setNewEntry(p => ({ ...p, status: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 12 }}
                    >
                      {OUTREACH_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
                <textarea
                  value={newEntry.notes}
                  onChange={e => setNewEntry(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Notes (e.g. sent highlight reel, awaiting response...)"
                  rows={2}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 12, fontFamily: 'inherit', resize: 'none', marginBottom: 8 }}
                />
                <button
                  onClick={addOutreach}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, background: G, color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Add to tracker
                </button>
              </div>
            )}

            {outreach.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#333' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>No contacts yet</div>
                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>Add the first coach or institution you plan to contact</div>
              </div>
            ) : (
              outreach.map((entry, i) => (
                <div key={entry.id ?? i} style={{ background: '#fff', borderRadius: 10, padding: '14px', border: '1px solid #e0e0e0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{entry.institution_name}</div>
                      <div style={{ fontSize: 11, color: '#444', fontWeight: 600, marginTop: 2 }}>
                        {entry.country} · {entry.division} · {entry.sport}
                      </div>
                    </div>
                    <button
                      onClick={() => entry.id && deleteEntry(entry.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                    >
                      <Trash2 size={14} color="#ccc" />
                    </button>
                  </div>
                  {entry.coach_name && (
                    <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>
                      {entry.coach_name}
                      {entry.coach_email && (
                        <a href={`mailto:${entry.coach_email}`} style={{ color: G, marginLeft: 8, fontWeight: 600 }}>
                          {entry.coach_email}
                        </a>
                      )}
                    </div>
                  )}
                  <select
                    value={entry.status}
                    onChange={e => entry.id && updateStatus(entry.id, e.target.value)}
                    style={{
                      padding: '6px 10px', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
                      border: `1.5px solid ${entry.status === 'offered' ? G : entry.status === 'interested' ? GO : '#ddd'}`,
                    }}
                  >
                    {OUTREACH_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  {entry.notes && (
                    <div style={{ fontSize: 11, color: '#444', fontWeight: 600, marginTop: 8, lineHeight: 1.5 }}>{entry.notes}</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
