// src/lib/engines/python-bridge.ts
// Bridge to the GRS AI Python server (grassroots-ai-service v3 on Render).
// v3 API: POST /track (ByteTrack — sync), POST /analyse (Gemini — async → job_id)
// Server URL: NEXT_PUBLIC_GRS_AI_SERVER_URL env var (falls back to localhost:8765).
// Gracefully degrades — all functions return null if server is offline.

const SERVER =
  process.env.NEXT_PUBLIC_GRS_AI_SERVER_URL ?? 'http://localhost:8765';
const TIMEOUT_MS = 180_000;
const POLL_INTERVAL_MS = 3_000;
const POLL_MAX_ATTEMPTS = 40; // 40 × 3 s = 2 min max

// Cache availability check for the session (re-check only once per page load)
let _available: boolean | null = null;

export async function isPythonServerAvailable(): Promise<boolean> {
  if (_available !== null) return _available;
  try {
    const res = await fetch(`${SERVER}/health`, { signal: AbortSignal.timeout(3_000) });
    const body = (await res.json()) as { status?: string };
    _available = res.ok && body.status === 'ok';
  } catch {
    _available = false;
  }
  return _available;
}

export async function getPythonEngines(): Promise<string[]> {
  try {
    const res  = await fetch(`${SERVER}/health`, { signal: AbortSignal.timeout(3_000) });
    const body = (await res.json()) as { engines?: string[] };
    return body.engines ?? [];
  } catch {
    return [];
  }
}

// ── Response types ─────────────────────────────────────────────────────────────

/** Legacy keypoint type (kept for backward compatibility) */
export interface PyKeypoint { x: number; y: number; score: number; }

/** Legacy player type (kept for backward compatibility) */
export interface PyPlayer {
  id:        number;
  frame?:    number;
  keypoints: PyKeypoint[];
  bbox:      { x: number; y: number; w: number; h: number };
}

/** Legacy pose result (kept for backward compatibility) */
export interface PyPoseResult {
  players:         PyPlayer[];
  ballPositions:   Array<{ x: number; y: number; frame: number }>;
  framesProcessed: number;
}

/** v3 /track response — ByteTrack + YOLOv8 + KMeans team classification */
export interface PyTrackResult {
  tracks:         Array<{
    id:     number;
    name?:  string;   // populated when squad map is provided
    team?:  number;   // 0 = home, 1 = away (KMeans jersey colour)
    frames: Array<{ x: number; y: number; frame: number }>;
  }>;
  zoneOccupancy:  Record<string, number>;
  heatmap:        number[][];
  ballPositions?: Array<{ x: number; y: number; frame: number }>;
  framesProcessed?: number;
}

type PyResult = PyPoseResult | PyTrackResult;

// ── Main tracking call (v3 POST /track — synchronous) ─────────────────────────

/**
 * Send a video to the GRS AI server for ByteTrack player tracking.
 * Uses v3 POST /track endpoint with 'file' field name.
 *
 * @param squad  Optional map of tracker_id → player name for named tracking.
 *               E.g. { "7": "Musona", "10": "Kadewere" }
 */
export async function analyseWithPython(
  file:       File,
  task:       'pose' | 'track' | 'set_piece',
  onProgress: (pct: number) => void = () => undefined,
  squad?:     Record<string, string>,
): Promise<PyResult | null> {
  const available = await isPythonServerAvailable();
  if (!available) return null;

  try {
    const form = new FormData();
    form.append('file', file);            // v3 uses 'file', not 'video'
    if (squad && Object.keys(squad).length > 0) {
      form.append('squad', JSON.stringify(squad));
    }
    // v3 has a single /track endpoint — task distinctions handled server-side
    void task;

    onProgress(10);
    const res = await fetch(`${SERVER}/track`, {
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

// ── Async job polling (v3 POST /analyse → GET /job/{id}) ──────────────────────

interface JobStatus<T> { status: 'pending' | 'running' | 'done' | 'failed'; result?: T; error?: string; }

/**
 * Poll a v3 async job until it completes or times out.
 * Used with POST /analyse (Gemini video analysis).
 */
export async function pollJob<T>(jobId: string): Promise<T | null> {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    try {
      const res = await fetch(`${SERVER}/job/${jobId}`, { signal: AbortSignal.timeout(5_000) });
      if (!res.ok) return null;
      const body = (await res.json()) as JobStatus<T>;
      if (body.status === 'done')    return body.result ?? null;
      if (body.status === 'failed')  return null;
    } catch {
      return null;
    }
    await new Promise<void>((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return null; // timed out
}

// ── Custom zone counting ───────────────────────────────────────────────────────
// NOTE: v3 server does not expose a /zones endpoint.
// This function is kept for local dev compatibility (scripts/grs-ai-server/main.py).
// Returns null gracefully when the endpoint is absent.

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
    form.append('file', file);
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
