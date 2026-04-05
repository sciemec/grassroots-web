/**
 * Pitch Mode — IndexedDB utility
 * Stores the training schedule locally so Pitch Mode works without internet.
 * Also queues completed sessions when offline and syncs them when back online.
 */

const DB_NAME = "grassroots_pitch";
const DB_VERSION = 1;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CachedSchedule {
  id: string;
  week_start: string;
  schedule_json: {
    week_start: string;
    days: ScheduleDay[];
  };
  cached_at: number; // Date.now()
}

export interface ScheduleDay {
  day: string;
  is_rest: boolean;
  focus?: string;
  drills?: Drill[];
  total_duration_minutes?: number;
  intensity?: string;
  pre_session_warmup?: string;
  post_session_cooldown?: string;
}

export interface Drill {
  name: string;
  duration_minutes: number;
  instructions: string;
  equipment_needed: string;
}

export interface PendingSession {
  localId: string; // uuid-like string for local dedup
  schedule_id: string;
  day_name: string;
  drills_completed: number;
  total_drills: number;
  feeling: "tough" | "amazing";
  completed_at: string; // ISO string
  synced: boolean;
}

// ─── Open DB ──────────────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("schedule")) {
        db.createObjectStore("schedule", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("pending_sessions")) {
        db.createObjectStore("pending_sessions", { keyPath: "localId" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export async function saveSchedule(schedule: CachedSchedule): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("schedule", "readwrite");
    tx.objectStore("schedule").put({ ...schedule, cached_at: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSchedule(): Promise<CachedSchedule | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("schedule", "readonly");
    const req = tx.objectStore("schedule").getAll();
    req.onsuccess = () => {
      const all = req.result as CachedSchedule[];
      if (!all.length) return resolve(null);
      // Return the most recently cached schedule
      all.sort((a, b) => b.cached_at - a.cached_at);
      resolve(all[0]);
    };
    req.onerror = () => reject(req.error);
  });
}

// ─── Pending Sessions ─────────────────────────────────────────────────────────

export async function savePendingSession(session: PendingSession): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending_sessions", "readwrite");
    tx.objectStore("pending_sessions").put(session);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingSessions(): Promise<PendingSession[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending_sessions", "readonly");
    const req = tx.objectStore("pending_sessions").getAll();
    req.onsuccess = () => resolve((req.result as PendingSession[]).filter((s) => !s.synced));
    req.onerror = () => reject(req.error);
  });
}

export async function clearPendingSession(localId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending_sessions", "readwrite");
    tx.objectStore("pending_sessions").delete(localId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
