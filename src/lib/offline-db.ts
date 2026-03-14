import Dexie, { type Table } from "dexie";

// ── Schema types ──────────────────────────────────────────────────────────────

export interface OfflineMatch {
  id?: number;
  localId: string;        // UUID generated client-side
  serverId?: string;      // populated after sync
  teamHome: string;
  teamAway: string;
  sport: string;
  date: string;
  venue?: string;
  events: MatchEvent[];
  stats: Record<string, number>;
  synced: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface MatchEvent {
  id: string;
  minute: number;
  type: "goal" | "assist" | "card" | "sub" | "injury" | "stat";
  playerId?: string;
  playerName?: string;
  team: "home" | "away";
  detail?: string;
}

export interface SyncQueueItem {
  id?: number;
  endpoint: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  body: string;           // JSON stringified
  headers: Record<string, string>;
  createdAt: number;
  retries: number;
  lastAttempt?: number;
}

export interface CachedPlayerStat {
  id?: number;
  playerId: string;
  sport: string;
  stats: Record<string, number | string>;
  fetchedAt: number;
}

// ── Database class ────────────────────────────────────────────────────────────

class GrassrootsDB extends Dexie {
  matches!:     Table<OfflineMatch,     number>;
  syncQueue!:   Table<SyncQueueItem,    number>;
  playerStats!: Table<CachedPlayerStat, number>;

  constructor() {
    super("GrassrootsDB");
    this.version(1).stores({
      matches:     "++id, localId, serverId, synced, sport, createdAt",
      syncQueue:   "++id, endpoint, createdAt, retries",
      playerStats: "++id, playerId, sport, fetchedAt",
    });
  }
}

export const db = new GrassrootsDB();

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Save a match locally. Returns the local DB id. */
export async function saveMatchOffline(match: Omit<OfflineMatch, "id">): Promise<number> {
  return db.matches.add(match);
}

/** Get all unsynced matches */
export async function getUnsyncedMatches(): Promise<OfflineMatch[]> {
  return db.matches.where("synced").equals(0).toArray();
}

/** Mark a match as synced and store its server ID */
export async function markMatchSynced(localId: string, serverId: string): Promise<void> {
  await db.matches.where("localId").equals(localId).modify({ synced: true, serverId });
}

/** Queue a failed API call for background retry */
export async function queueForSync(
  endpoint: string,
  method: SyncQueueItem["method"],
  body: object,
  headers: Record<string, string> = {}
): Promise<void> {
  await db.syncQueue.add({
    endpoint,
    method,
    body: JSON.stringify(body),
    headers,
    createdAt: Date.now(),
    retries: 0,
  });
}

/** Get all pending sync items */
export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  return db.syncQueue.orderBy("createdAt").toArray();
}

/** Remove a successfully synced item */
export async function removeSyncItem(id: number): Promise<void> {
  await db.syncQueue.delete(id);
}

/** Cache player stats for offline viewing */
export async function cachePlayerStats(
  playerId: string,
  sport: string,
  stats: Record<string, number | string>
): Promise<void> {
  const existing = await db.playerStats
    .where("playerId").equals(playerId)
    .and((r) => r.sport === sport)
    .first();

  if (existing?.id) {
    await db.playerStats.update(existing.id, { stats, fetchedAt: Date.now() });
  } else {
    await db.playerStats.add({ playerId, sport, stats, fetchedAt: Date.now() });
  }
}
