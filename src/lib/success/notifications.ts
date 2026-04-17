// THUTO Success Engine — Web Push / notification layer
// Uses browser Notification API + Service Worker periodicSync
// No Firebase / FCM needed — fully browser-native

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

// Write reminder time to Cache API so the service worker can read it
async function storeReminderConfig(hour: number, minute: number): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    const cache = await caches.open("thuto-config");
    await cache.put(
      "/thuto-reminder-config",
      new Response(JSON.stringify({ hour, minute }), {
        headers: { "Content-Type": "application/json" },
      })
    );
  } catch { /* cache not available in this context */ }
}

// Schedule daily reminder via periodicSync (Chrome) or setTimeout fallback
export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  if (typeof window === "undefined") return;

  // Always persist the target time so the SW knows when to fire
  await storeReminderConfig(hour, minute);

  // Try Service Worker periodicSync (Chrome 80+)
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if ("periodicSync" in registration) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (registration as any).periodicSync.register("thuto-daily-checkin", {
          minInterval: 24 * 60 * 60 * 1000, // 24 hours
        });
        return;
      }
    } catch {
      // periodicSync not permitted — fall through to setTimeout
    }
  }

  // Fallback: setTimeout for current tab session
  scheduleSessionReminder(hour, minute);
}

function msUntilTime(hour: number, minute: number): number {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

let _reminderTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleSessionReminder(hour: number, minute: number): void {
  if (_reminderTimer) clearTimeout(_reminderTimer);
  const delay = msUntilTime(hour, minute);
  _reminderTimer = setTimeout(() => {
    showLocalNotification(
      "THUTO Daily Check-In ⚽",
      "Time to log your training. 30 seconds — keep your goal alive. Pamberi! 🔥"
    );
    // Reschedule for tomorrow
    scheduleSessionReminder(hour, minute);
  }, delay);
}

export function showLocalNotification(title: string, body: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    // Use service worker notification when available (persists after tab close)
    navigator.serviceWorker?.ready
      .then((reg) => reg.showNotification(title, { body, icon: "/icon-192.png" }))
      .catch(() => new Notification(title, { body }));
  } catch {
    new Notification(title, { body });
  }
}
