/**
 * POST /api/notifications/send
 * Sends an FCM push notification via Firebase Admin SDK.
 * Called by the admin /notifications page.
 *
 * Required env vars (Vercel + .env.local):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY     — the full private key from Firebase service account JSON
 *                              (include \n characters — Vercel stores them as literal \n)
 *
 * Body: { title, body, user_id? }
 *   If user_id is provided → fetch their FCM token from Laravel and send to that device.
 *   If no user_id → send to topic "all_users" (all subscribed devices).
 */

import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

function getFirebaseAdmin() {
  if (getApps().length > 0) return getApps()[0];

  const projectId    = process.env.FIREBASE_PROJECT_ID;
  const clientEmail  = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey   = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) return null;

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

interface NotifyBody {
  title?: string;
  body?: string;
  user_id?: string;
  fcm_token?: string; // optionally passed directly from Laravel
}

export async function POST(req: NextRequest) {
  const app = getFirebaseAdmin();
  if (!app) {
    return NextResponse.json(
      { error: "Firebase not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in Vercel." },
      { status: 503 }
    );
  }

  let body: NotifyBody;
  try {
    body = (await req.json()) as NotifyBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { title, body: msgBody, user_id, fcm_token } = body;

  if (!title || !msgBody) {
    return NextResponse.json({ error: "title and body are required" }, { status: 400 });
  }

  const messaging = getMessaging(app);

  try {
    if (fcm_token) {
      // Send to a specific device token
      await messaging.send({
        token: fcm_token,
        notification: { title, body: msgBody },
        android: { priority: "high" },
        apns: { payload: { aps: { sound: "default" } } },
      });
    } else if (user_id) {
      // Fetch FCM token from Laravel, then send
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";
      const tokenRes = await fetch(`${apiUrl}/admin/users/${user_id}/fcm-token`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!tokenRes.ok) {
        return NextResponse.json({ error: "Could not fetch FCM token for user" }, { status: 404 });
      }
      const { fcm_token: token } = (await tokenRes.json()) as { fcm_token: string };
      if (!token) {
        return NextResponse.json({ error: "User has no FCM token registered" }, { status: 404 });
      }
      await messaging.send({
        token,
        notification: { title, body: msgBody },
        android: { priority: "high" },
        apns: { payload: { aps: { sound: "default" } } },
      });
    } else {
      // Broadcast to all users via topic
      await messaging.send({
        topic: "all_users",
        notification: { title, body: msgBody },
        android: { priority: "high" },
        apns: { payload: { aps: { sound: "default" } } },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "FCM send failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
