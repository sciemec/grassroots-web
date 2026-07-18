// src/lib/engines/python-bridge.ts
// Optional bridge to the local GRS AI Python server.
// Provides: OpenPifPaf multi-person pose, ByteTrack player tracking, Supervision zone analysis.
// Server must be running at localhost:8765 (scripts/grs-ai-server/main.py).
// Gracefully degrades — all functions return null if server is offline.

const SERVER =
  process.env.NEXT_PUBLIC_GRS_AI_SERVER_URL ?? 'http://localhost:8765';
const TIMEOUT_MS = 120_000;

// Cache availability check for the session (re-check only once per page load)
let _available: boolean | null = null;

export async function isPythonServerAvailable(): Promise<boolean> {
  if (_available !== null) return _available;
  try {
    const res = await fetch(`${SERVER}/health`, { signal: AbortSignal.timeout(1_500) });
    const body = (await res.json()) as { status?: string; engines?: string[] };
    _available = res.ok && body.status === 'ok';
  } catch {
    _available = false;
  }
  return _available;
}

export async function getPythonEngines(): Promise<string[]> {
  try {
    const res  = await fetch(`${SERVER}/health`, { signal: AbortSignal.timeout(1_500) });
    const body = (await res.json()) as { engines?: string[] };
    return body.engines ?? [];
  } catch {
    return [];
  }
}

// ── Response types ─────────────────────────────────────────────────────────────

export interface PyKeypoint { x: number; y: number; score: number; }

export interface PyPlayer {
  id:        number;
  frame?:    number;
  keypoints: PyKeypoint[];
  bbox:      { x: number; y: number; w: number; h: number };
}

export interface PyPoseResult {
  players:         PyPlayer[];
  ballPositions:   Array<{ x: number; y: number; frame: number }>;
  framesProcessed: number;
}

export interface PyTrackResult {
  tracks:        Array<{ id: number; frames: Array<{ x: number; y: number; frame: number }> }>;
  zoneOccupancy: Record<string, number>;
  heatmap:       number[][];
  ballPositions?: Array<{ x: number; y: number; frame: number }>;
}

type PyResult = PyPoseResult | PyTrackResult;

// ── Main analysis call ─────────────────────────────────────────────────────────

export async function analyseWithPython(
  file:       File,
  task:       'pose' | 'track' | 'set_piece',
  onProgress: (pct: number) => void = () => undefined,
): Promise<PyResult | null> {
  const available = await isPythonServerAvailable();
  if (!available) return null;

  try {
    const form = new FormData();
    form.append('video', file);
    form.append('task', task);

    onProgress(10);
    const res = await fetch(`${SERVER}/analyse`, {
      method: 'POST',
      body:   form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    onProgress(95);
    if (!res.ok) return null;
    onProgress(100);
    return (await res.json()) as PyResult;
  } catch {
    return null;
  }
}

// ── Custom zone counting ───────────────────────────────────────────────────────

export interface ZoneDef {
  name:    string;
  polygon: Array<{ x: number; y: number }>; // normalised 0–1 coords
}

export async function countCustomZones(
  file:  File,
  zones: ZoneDef[],
): Promise<Record<string, number> | null> {
  const available = await isPythonServerAvailable();
  if (!available) return null;

  try {
    const form = new FormData();
    form.append('video', file);
    form.append('zones_json', JSON.stringify(zones));

    const res = await fetch(`${SERVER}/zones`, {
      method: 'POST',
      body:   form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { counts?: Record<string, number> };
    return body.counts ?? null;
  } catch {
    return null;
  }
}
