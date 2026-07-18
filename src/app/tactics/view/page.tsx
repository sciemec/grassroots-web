// src/app/tactics/view/page.tsx
// Public read-only tactical board — no auth required.
// Decodes board state from ?state= URL param (base64 JSON) and renders read-only pitch.
"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Users, Share2 } from "lucide-react";

// ─── Constants (must match board/page.tsx) ────────────────────────────────────

const W = 400;
const H = 260;

const ARROW_COLORS = [
  { color: "#f0b429",              label: "Run",   markerId: "arr-gold"  },
  { color: "rgba(255,255,255,0.9)", label: "Pass",  markerId: "arr-white" },
  { color: "#ef4444",              label: "Press", markerId: "arr-red"   },
  { color: "#60a5fa",              label: "Shape", markerId: "arr-blue"  },
];

function colorToMarkerId(color: string): string {
  return ARROW_COLORS.find(a => a.color === color)?.markerId ?? "arr-gold";
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SharedPlayer {
  id: string;
  x: number;
  y: number;
  l: string;          // label (position)
  n?: string;         // assigned name
  i?: string;         // assigned initials
}

interface SharedOpponent {
  x: number;
  y: number;
  l: string;
}

interface SharedArrow {
  x1: number; y1: number;
  x2: number; y2: number;
  c: string;           // color
}

interface BoardState {
  f: string;                   // formation
  p: SharedPlayer[];           // player tokens
  o: SharedOpponent[] | null;  // opponents (null = hidden)
  a: SharedArrow[];            // arrows
  note: string;
}

// ─── Pitch markings ───────────────────────────────────────────────────────────

function PitchMarkings() {
  const line = "rgba(255,255,255,0.72)";
  const lw = 0.8;
  return (
    <g>
      <rect width={W} height={H} fill="#2d6a1f" />
      {[0, 1, 2, 3, 4].map(i => (
        <rect key={i} x={0} y={i * 52} width={W} height={26} fill="rgba(0,0,0,0.03)" />
      ))}
      <rect x={8} y={6} width={384} height={248} fill="none" stroke={line} strokeWidth={lw} />
      <line x1={8} y1={130} x2={392} y2={130} stroke={line} strokeWidth={lw} />
      <circle cx={200} cy={130} r={35} fill="none" stroke={line} strokeWidth={lw} />
      <circle cx={200} cy={130} r={1.5} fill={line} />
      {/* Top */}
      <rect x={118} y={6} width={164} height={62} fill="none" stroke={line} strokeWidth={lw} />
      <rect x={157} y={6} width={86} height={22} fill="none" stroke={line} strokeWidth={lw} />
      <rect x={172} y={3} width={56} height={5} fill="rgba(255,255,255,0.15)" stroke={line} strokeWidth={lw} />
      <circle cx={200} cy={46} r={1.5} fill={line} />
      <path d="M 162 68 A 34 34 0 0 1 238 68" fill="none" stroke={line} strokeWidth={lw} />
      {/* Bottom */}
      <rect x={118} y={192} width={164} height={62} fill="none" stroke={line} strokeWidth={lw} />
      <rect x={157} y={232} width={86} height={22} fill="none" stroke={line} strokeWidth={lw} />
      <rect x={172} y={252} width={56} height={5} fill="rgba(255,255,255,0.15)" stroke={line} strokeWidth={lw} />
      <circle cx={200} cy={214} r={1.5} fill={line} />
      <path d="M 162 192 A 34 34 0 0 0 238 192" fill="none" stroke={line} strokeWidth={lw} />
    </g>
  );
}

// ─── Main view component ──────────────────────────────────────────────────────

function ViewInner() {
  const searchParams = useSearchParams();
  const rawState = searchParams.get("state");

  const board = useMemo((): BoardState | null => {
    if (!rawState) return null;
    try {
      const json = decodeURIComponent(escape(atob(decodeURIComponent(rawState))));
      return JSON.parse(json) as BoardState;
    } catch {
      return null;
    }
  }, [rawState]);

  if (!board) {
    return (
      <div className="min-h-screen bg-[#f4f2ee] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Share2 size={20} className="text-red-400" />
          </div>
          <h1 className="font-black text-gray-900 text-lg mb-2">Invalid Link</h1>
          <p className="text-[13px] text-gray-500 mb-5">
            This tactic link is missing or has been corrupted.
          </p>
          <Link
            href="/coach/tactics/board"
            className="inline-flex items-center gap-2 text-sm font-bold text-white px-5 py-2.5 rounded-full"
            style={{ backgroundColor: "#1a5c2a" }}
          >
            Open Tactical Board
          </Link>
        </div>
      </div>
    );
  }

  const assigned = board.p.filter(p => p.n);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#f4f2ee]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/coach/tactics/board" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="font-black text-gray-900 text-base leading-none">
              Team Tactic — {board.f}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              Shared via GrassRoots Sports · View only
            </div>
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-[#1a5c2a] hover:text-[#1a5c2a] transition-colors"
          >
            <Share2 size={12} />
            Copy link
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Pitch */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full block"
                style={{ touchAction: "none" }}
              >
                {/* Arrowhead markers */}
                <defs>
                  {ARROW_COLORS.map(ac => (
                    <marker
                      key={ac.markerId}
                      id={ac.markerId}
                      markerWidth="7" markerHeight="7"
                      refX="5.5" refY="3.5"
                      orient="auto"
                    >
                      <path d="M0,0.5 L7,3.5 L0,6.5 Z" fill={ac.color} />
                    </marker>
                  ))}
                </defs>

                <PitchMarkings />

                {/* Drawn arrows */}
                {board.a.map((a, idx) => (
                  <line
                    key={idx}
                    x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
                    stroke={a.c}
                    strokeWidth={2.5}
                    strokeOpacity={0.92}
                    markerEnd={`url(#${colorToMarkerId(a.c)})`}
                  />
                ))}

                {/* Opponent tokens */}
                {board.o && board.o.map((op, idx) => (
                  <g key={idx}>
                    <circle cx={op.x} cy={op.y} r={11} fill="#dc2626" stroke="white" strokeWidth={1.5} />
                    <text
                      x={op.x} y={op.y + 4}
                      textAnchor="middle" fontSize={6} fontWeight="700" fill="white"
                      style={{ userSelect: "none" }}
                    >
                      {op.l}
                    </text>
                  </g>
                ))}

                {/* Player tokens */}
                {board.p.map((p) => (
                  <g key={p.id} transform={`translate(${p.x},${p.y})`}>
                    {p.n && (
                      <circle r={16} fill="none" stroke="#f0b429" strokeWidth={2} strokeOpacity={0.9} />
                    )}
                    <circle r={13} fill="#1a5c2a" stroke="white" strokeWidth={2} />
                    <text
                      textAnchor="middle" y={p.n ? -1.5 : 4}
                      fontSize={p.n ? 5.5 : 7} fontWeight="800" fill="white"
                      style={{ userSelect: "none" }}
                    >
                      {p.l}
                    </text>
                    {p.i && (
                      <text
                        textAnchor="middle" y={7}
                        fontSize={5} fontWeight="900" fill="#f0b429"
                        style={{ userSelect: "none" }}
                      >
                        {p.i}
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            </div>

            {/* Arrow legend — only if arrows exist */}
            {board.a.length > 0 && (
              <div className="mt-3 bg-white rounded-xl border border-gray-200 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Arrow Key</p>
                <div className="flex flex-wrap gap-3">
                  {ARROW_COLORS.filter(ac => board.a.some(a => a.c === ac.color)).map(ac => (
                    <div key={ac.color} className="flex items-center gap-1.5">
                      <span
                        className="w-5 h-1.5 rounded-full"
                        style={{ backgroundColor: ac.color }}
                      />
                      <span className="text-[10px] font-medium text-gray-600">{ac.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Side panel */}
          <div className="space-y-3">

            {/* Formation badge */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Formation</p>
              <div
                className="text-2xl font-black"
                style={{ color: "#1a5c2a" }}
              >
                {board.f}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                {board.o ? "Opposition shown" : "Your formation only"}
                {board.a.length > 0 ? ` · ${board.a.length} movement arrow${board.a.length !== 1 ? "s" : ""}` : ""}
              </p>
            </div>

            {/* Assigned players list */}
            {assigned.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={12} className="text-[#1a5c2a]" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                    Lineup ({assigned.length})
                  </p>
                </div>
                <div className="space-y-1.5">
                  {assigned.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-black w-9 shrink-0"
                        style={{ color: "#1a5c2a" }}
                      >
                        {p.l}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-800 truncate">{p.n}</span>
                    </div>
                  ))}
                </div>
                {/* Unassigned positions */}
                {board.p.filter(p => !p.n).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-[9px] text-gray-400 mb-1">Unassigned</p>
                    <div className="flex flex-wrap gap-1">
                      {board.p.filter(p => !p.n).map((p, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500"
                        >
                          {p.l}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Coach notes */}
            {board.note?.trim() && (
              <div className="bg-[#f0fdf4] rounded-2xl border border-green-100 p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#1a5c2a] mb-2">
                  Coach Notes
                </p>
                <p className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {board.note.trim()}
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <p className="text-[10px] text-gray-500 mb-3 leading-snug">
                Build your own tactics and share with your squad
              </p>
              <Link
                href="/coach/tactics/board"
                className="inline-flex items-center gap-2 text-xs font-bold text-white px-4 py-2.5 rounded-full transition-colors"
                style={{ backgroundColor: "#1a5c2a" }}
              >
                Open Tactical Board
              </Link>
              <p className="text-[9px] text-gray-400 mt-2">
                GrassRoots Sports · grassrootssports.live
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Export (wrapped in Suspense for useSearchParams) ─────────────────────────

export default function TacticViewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f4f2ee] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-green-700 rounded-full animate-spin" />
        </div>
      }
    >
      <ViewInner />
    </Suspense>
  );
}
