'use client';
// src/app/scout/pipeline/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// GRS Scout Talent Manager — /scout/pipeline
//
// A scout uses this like a talent pipeline manager:
//   - Watch list: players they are monitoring (multiple players)
//   - Status per player: Watching → Interested → Meeting → Offer → Signed
//   - Private notes on each player (only the scout sees these)
//   - Development alerts: notified when a watched player's AQ improves
//   - Quick access to each player's Talent Passport
//   - Side-by-side comparison of watched players
//
// Data model (localStorage + bhora-ai sync):
//   - ScoutPipelineEntry per player the scout is tracking
//   - Notes are private to the scout
//   - Status moves through the pipeline stages
//
// HOW IT CONNECTS:
//   - Reads player data from GET /api/v1/scout/players/{id}
//   - Saves pipeline entries to POST /api/v1/scout/pipeline
//   - Uses existing /scout/shortlist for the "saved" list
//   - Add button to /talent-database and /scout pages: "Add to pipeline"
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import Link from 'next/link';

const GRS_GREEN = '#1c3d22';
const GRS_GOLD  = '#c8962a';

// Pipeline stages — a talent manager workflow
const STAGES = [
  { key: 'watching',   label: 'Watching',   color: '#888780', bg: '#f1efe8', desc: 'Monitoring development' },
  { key: 'interested', label: 'Interested',  color: '#185fa5', bg: '#e6f1fb', desc: 'Actively considering' },
  { key: 'shortlisted',label: 'Shortlisted', color: '#854f0b', bg: '#faeeda', desc: 'In final consideration' },
  { key: 'contacted',  label: 'Contacted',   color: '#534ab7', bg: '#eeedfe', desc: 'Reached out to player/coach' },
  { key: 'signed',     label: 'Signed',      color: GRS_GREEN,  bg: '#eaf3de', desc: 'Done deal' },
] as const;

type Stage = typeof STAGES[number]['key'];

interface PipelineEntry {
  id:            string;
  playerId:      string;
  playerName:    string;
  position:      string;
  province:      string;
  school:        string;
  age:           number;
  aqScore:       number | null;
  dq:            number | null;    // weekly improvement rate
  stage:         Stage;
  notes:         string;           // private scout notes
  addedAt:       string;
  lastUpdated:   string;
  passportUrl:   string | null;
  latestVideoUrl: string | null;
  alertOnImprovement: boolean;     // notify when AQ improves
  tags:          string[];         // scout-defined tags: 'pace', 'technical', 'local'
}

const STORAGE_KEY = 'grs_scout_pipeline';

function loadPipeline(): PipelineEntry[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
}

function savePipeline(entries: PipelineEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch {}
}

export default function ScoutPipelinePage() {
  const [pipeline,    setPipeline]    = useState<PipelineEntry[]>([]);
  const [activeStage, setActiveStage] = useState<Stage | 'all'>('all');
  const [selected,    setSelected]    = useState<PipelineEntry | null>(null);
  const [editNotes,   setEditNotes]   = useState('');
  const [comparing,   setComparing]   = useState<string[]>([]);
  const [addOpen,     setAddOpen]     = useState(false);
  const [search,      setSearch]      = useState('');
  const [newPlayerId, setNewPlayerId] = useState('');
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    setPipeline(loadPipeline());
  }, []);

  // Filtered pipeline
  const filtered = pipeline.filter(e => {
    if (activeStage !== 'all' && e.stage !== activeStage) return false;
    if (search && !e.playerName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Stage counts
  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s.key] = pipeline.filter(e => e.stage === s.key).length;
    return acc;
  }, {} as Record<Stage, number>);

  // Add player to pipeline by searching bhora-ai
  const handleAddPlayer = async () => {
    if (!newPlayerId.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/scout/players/${newPlayerId.trim()}`,
        { headers: { 'Accept': 'application/json' } }
      );
      const data = res.ok ? await res.json() : null;

      const entry: PipelineEntry = {
        id:          crypto.randomUUID?.() ?? Date.now().toString(),
        playerId:    newPlayerId.trim(),
        playerName:  data?.name ?? `Player ${newPlayerId.trim()}`,
        position:    data?.position ?? 'Unknown',
        province:    data?.province ?? '',
        school:      data?.school ?? '',
        age:         data?.age ?? 0,
        aqScore:     data?.aq_score ?? null,
        dq:          data?.dq ?? null,
        stage:       'watching',
        notes:       '',
        addedAt:     new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        passportUrl: data?.passport_token
          ? `https://grassrootssports.live/passport/${data.passport_token}`
          : null,
        latestVideoUrl: null,
        alertOnImprovement: true,
        tags:        [],
      };

      const updated = [entry, ...pipeline];
      setPipeline(updated);
      savePipeline(updated);
      setNewPlayerId('');
      setAddOpen(false);
    } catch (err) {
      // Add with minimal data — can be enriched later
      const entry: PipelineEntry = {
        id: Date.now().toString(),
        playerId: newPlayerId.trim(),
        playerName: `Player ID: ${newPlayerId.trim()}`,
        position: '', province: '', school: '', age: 0,
        aqScore: null, dq: null, stage: 'watching', notes: '',
        addedAt: new Date().toISOString(), lastUpdated: new Date().toISOString(),
        passportUrl: null, latestVideoUrl: null, alertOnImprovement: true, tags: [],
      };
      const updated = [entry, ...pipeline];
      setPipeline(updated);
      savePipeline(updated);
      setNewPlayerId('');
      setAddOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const updateStage = (id: string, stage: Stage) => {
    const updated = pipeline.map(e => e.id === id ? { ...e, stage, lastUpdated: new Date().toISOString() } : e);
    setPipeline(updated);
    savePipeline(updated);
    if (selected?.id === id) setSelected({ ...selected, stage });
  };

  const saveNotes = (id: string, notes: string) => {
    const updated = pipeline.map(e => e.id === id ? { ...e, notes, lastUpdated: new Date().toISOString() } : e);
    setPipeline(updated);
    savePipeline(updated);
    if (selected?.id === id) setSelected({ ...selected, notes });
  };

  const removeFromPipeline = (id: string) => {
    if (!confirm('Remove this player from your pipeline?')) return;
    const updated = pipeline.filter(e => e.id !== id);
    setPipeline(updated);
    savePipeline(updated);
    if (selected?.id === id) setSelected(null);
  };

  const toggleCompare = (id: string) => {
    setComparing(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) :
      prev.length < 3   ? [...prev, id] : prev
    );
  };

  const comparePlayers = pipeline.filter(e => comparing.includes(e.id));

  return (
    <div className="min-h-screen bg-[#F4F2EE]">
      <div className="max-w-5xl mx-auto p-4">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Scout Hub</div>
            <h1 className="text-2xl font-bold text-gray-900">Talent Pipeline</h1>
            <p className="text-sm text-gray-500 mt-1">
              {pipeline.length} player{pipeline.length !== 1 ? 's' : ''} in your pipeline
            </p>
          </div>
          <button onClick={() => setAddOpen(true)}
            className="px-4 py-2 rounded-xl font-bold text-white text-sm"
            style={{ background: GRS_GREEN }}>
            + Add player
          </button>
        </div>

        {/* Stage tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          <button onClick={() => setActiveStage('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all ${activeStage === 'all' ? 'text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            style={activeStage === 'all' ? { background: GRS_GREEN } : {}}>
            All ({pipeline.length})
          </button>
          {STAGES.map(s => (
            <button key={s.key} onClick={() => setActiveStage(s.key)}
              className="px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all"
              style={activeStage === s.key
                ? { background: s.color, color: '#fff' }
                : { background: s.bg, color: s.color }
              }>
              {s.label} ({stageCounts[s.key]})
            </button>
          ))}
        </div>

        {/* Search */}
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by player name..."
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 mb-4 bg-white" />

        {/* Compare bar */}
        {comparing.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-3 mb-4 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">
              Comparing {comparing.length} player{comparing.length > 1 ? 's' : ''}
            </div>
            <div className="flex gap-2">
              {comparing.length >= 2 && (
                <button onClick={() => {/* scroll to compare section */}}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                  style={{ background: GRS_GREEN }}>
                  Compare →
                </button>
              )}
              <button onClick={() => setComparing([])}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-500 border border-gray-200">
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Pipeline cards */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              {pipeline.length === 0
                ? 'No players in your pipeline yet. Add a player to start tracking.'
                : 'No players match this filter.'
              }
            </div>
          )}

          {filtered.map(entry => {
            const stageCfg = STAGES.find(s => s.key === entry.stage)!;
            const isComparing = comparing.includes(entry.id);
            return (
              <div key={entry.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-all ${selected?.id === entry.id ? 'border-green-300' : 'border-gray-100'} ${isComparing ? 'ring-2 ring-amber-400' : ''}`}>

                {/* Player row */}
                <div className="flex items-center gap-3 p-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 text-sm"
                    style={{ background: GRS_GREEN }}>
                    {entry.playerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm">{entry.playerName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: stageCfg.bg, color: stageCfg.color }}>
                        {stageCfg.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {[entry.position, entry.province, entry.school].filter(Boolean).join(' · ')}
                      {entry.age > 0 && ` · Age ${entry.age}`}
                    </div>
                    {/* AQ + DQ */}
                    <div className="flex items-center gap-3 mt-1.5">
                      {entry.aqScore !== null && (
                        <span className="text-xs font-bold" style={{ color: GRS_GREEN }}>
                          AQ {entry.aqScore}
                        </span>
                      )}
                      {entry.dq !== null && (
                        <span className="text-xs font-medium" style={{ color: entry.dq >= 0 ? '#4ade80' : '#f87171' }}>
                          {entry.dq >= 0 ? '+' : ''}{entry.dq}%/wk
                        </span>
                      )}
                      {entry.notes && (
                        <span className="text-xs text-gray-400">📝 Note</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleCompare(entry.id)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${isComparing ? 'border-amber-400 text-amber-600 bg-amber-50' : 'border-gray-200 text-gray-500'}`}>
                      Compare
                    </button>
                    <button
                      onClick={() => {
                        setSelected(selected?.id === entry.id ? null : entry);
                        setEditNotes(entry.notes);
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600">
                      {selected?.id === entry.id ? 'Close' : 'Open'}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {selected?.id === entry.id && (
                  <div className="border-t border-gray-50 p-4 space-y-4">

                    {/* Stage mover */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-2">Move stage</div>
                      <div className="flex gap-2 flex-wrap">
                        {STAGES.map(s => (
                          <button key={s.key} onClick={() => updateStage(entry.id, s.key)}
                            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                            style={entry.stage === s.key
                              ? { background: s.color, color: '#fff' }
                              : { background: s.bg, color: s.color }
                            }>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Private notes */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1.5">
                        Private notes — only you see this
                      </div>
                      <textarea
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                        placeholder="Your observations about this player... pace, technique, attitude, match situations you saw..."
                        rows={3}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-300 resize-none"
                      />
                      <button onClick={() => saveNotes(entry.id, editNotes)}
                        className="mt-2 px-4 py-2 rounded-lg text-xs font-bold text-white"
                        style={{ background: GRS_GREEN }}>
                        Save notes
                      </button>
                    </div>

                    {/* Links */}
                    <div className="flex gap-2 flex-wrap">
                      {entry.passportUrl && (
                        <a href={entry.passportUrl} target="_blank" rel="noopener noreferrer"
                          className="px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:border-green-300 transition-colors">
                          View Talent Passport →
                        </a>
                      )}
                      <Link href={`/talent-database?id=${entry.playerId}`}
                        className="px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:border-green-300 transition-colors">
                        Full profile →
                      </Link>
                      <Link href={`/scout/reports?player=${entry.playerId}`}
                        className="px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:border-green-300 transition-colors">
                        Generate PDF report →
                      </Link>
                      <button onClick={() => removeFromPipeline(entry.id)}
                        className="px-3 py-2 rounded-lg text-xs font-medium text-red-500 border border-red-100 hover:bg-red-50 transition-colors">
                        Remove
                      </button>
                    </div>

                    {/* Alert toggle */}
                    <div className="flex items-center gap-3 py-2 border-t border-gray-50">
                      <input type="checkbox" id={`alert-${entry.id}`}
                        checked={entry.alertOnImprovement}
                        onChange={e => {
                          const updated = pipeline.map(p => p.id === entry.id
                            ? { ...p, alertOnImprovement: e.target.checked }
                            : p
                          );
                          setPipeline(updated);
                          savePipeline(updated);
                          setSelected({ ...entry, alertOnImprovement: e.target.checked });
                        }}
                        className="rounded" />
                      <label htmlFor={`alert-${entry.id}`} className="text-xs text-gray-500">
                        Alert me when this player's AQ score improves
                      </label>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Side-by-side comparison */}
        {comparePlayers.length >= 2 && (
          <div className="mt-8 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50">
              <div className="text-sm font-bold text-gray-900">Player comparison</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium w-28">Attribute</th>
                    {comparePlayers.map(p => (
                      <th key={p.id} className="px-4 py-3 text-center text-xs font-bold" style={{ color: GRS_GREEN }}>
                        {p.playerName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Position',  key: 'position' },
                    { label: 'Age',       key: 'age'      },
                    { label: 'Province',  key: 'province' },
                    { label: 'AQ Score',  key: 'aqScore'  },
                    { label: 'Dev. rate', key: 'dq'       },
                    { label: 'Stage',     key: 'stage'    },
                  ].map((row, ri) => (
                    <tr key={row.key} className={ri % 2 === 0 ? 'bg-gray-50/50' : ''}>
                      <td className="px-4 py-3 text-xs text-gray-500 font-medium">{row.label}</td>
                      {comparePlayers.map(p => {
                        const val = (p as any)[row.key];
                        const display = row.key === 'dq'
                          ? (val !== null && val !== undefined ? `${val >= 0 ? '+' : ''}${val}%/wk` : '—')
                          : row.key === 'stage'
                          ? STAGES.find(s => s.key === val)?.label ?? val
                          : val ?? '—';
                        return (
                          <td key={p.id} className="px-4 py-3 text-center text-xs font-medium text-gray-700">
                            {display}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Add player modal */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-gray-900 mb-1">Add player to pipeline</h3>
            <p className="text-xs text-gray-400 mb-4">
              Enter the player's GRS ID or search in the talent database.
            </p>
            <input type="text" value={newPlayerId} onChange={e => setNewPlayerId(e.target.value)}
              placeholder="Player ID e.g. HRE-2025-00471"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 mb-3" />
            <div className="flex gap-2">
              <button onClick={handleAddPlayer} disabled={loading}
                className="flex-1 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
                style={{ background: GRS_GREEN }}>
                {loading ? 'Adding...' : 'Add to pipeline'}
              </button>
              <button onClick={() => setAddOpen(false)}
                className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-600">
                Cancel
              </button>
            </div>
            <div className="mt-3 text-center">
              <Link href="/talent-database" onClick={() => setAddOpen(false)}
                className="text-xs text-gray-400 hover:text-gray-600 underline">
                Find player ID in talent database →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}