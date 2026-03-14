import api from "./api";
import {
  getPendingSyncItems,
  getUnsyncedMatches,
  markMatchSynced,
  removeSyncItem,
  db,
} from "./offline-db";

/** Attempt to sync all queued items. Call when connection is restored. */
export async function syncAll(): Promise<{ synced: number; failed: number }> {
  let synced = 0;
  let failed = 0;

  // 1. Flush generic sync queue (failed API calls)
  const items = await getPendingSyncItems();
  for (const item of items) {
    try {
      await api.request({
        url:     item.endpoint,
        method:  item.method,
        data:    JSON.parse(item.body),
        headers: item.headers,
      });
      await removeSyncItem(item.id!);
      synced++;
    } catch {
      await db.syncQueue.update(item.id!, {
        retries:     item.retries + 1,
        lastAttempt: Date.now(),
      });
      failed++;
    }
  }

  // 2. Sync offline match records
  const unsyncedMatches = await getUnsyncedMatches();
  for (const match of unsyncedMatches) {
    try {
      const res = await api.post("/matches", match);
      await markMatchSynced(match.localId, res.data.id);
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}

/** Returns count of items waiting to sync */
export async function getPendingCount(): Promise<number> {
  const [queueCount, matchCount] = await Promise.all([
    db.syncQueue.count(),
    db.matches.where("synced").equals(0).count(),
  ]);
  return queueCount + matchCount;
}
