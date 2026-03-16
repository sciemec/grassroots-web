"use client";
import { useCallback, useRef, useState } from "react";

export type DailyState = "idle" | "connecting" | "live" | "error";

export interface DailyStreamResult {
  dailyState: DailyState;
  dailyError: string;
  roomUrl: string;
  startStream: (stream: MediaStream) => Promise<void>;
  stopStream: () => Promise<void>;
}

export function useDailyStream(): DailyStreamResult {
  const [dailyState, setDailyState] = useState<DailyState>("idle");
  const [dailyError, setDailyError] = useState("");
  const [roomUrl, setRoomUrl] = useState("");
  const [roomName, setRoomName] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const callRef = useRef<any>(null);

  const startStream = useCallback(async (stream: MediaStream) => {
    setDailyState("connecting");
    setDailyError("");

    try {
      // 1. Create a Daily room via our server route
      const createRes = await fetch("/api/stream/create", { method: "POST" });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Failed to create stream");
      }
      const { room_name, room_url } = await createRes.json() as {
        room_name: string;
        room_url: string;
      };
      setRoomUrl(room_url);
      setRoomName(room_name);

      // 2. Dynamically import Daily.js (only loads when streaming is actually used)
      const DailyIframe = (await import("@daily-co/daily-js")).default;

      // 3. Create a call object using the existing camera stream
      const videoTrack = stream.getVideoTracks()[0] ?? false;
      const audioTrack = stream.getAudioTracks()[0] ?? false;

      const call = DailyIframe.createCallObject({
        videoSource: videoTrack || false,
        audioSource: audioTrack || false,
      });
      callRef.current = call;

      // 4. Join the room — broadcaster publishes audio/video
      await call.join({ url: room_url });

      setDailyState("live");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Stream failed to start";
      setDailyError(msg);
      setDailyState("error");
      if (callRef.current) {
        callRef.current.destroy().catch(() => {});
        callRef.current = null;
      }
    }
  }, []);

  const stopStream = useCallback(async () => {
    // Leave and destroy the Daily call
    if (callRef.current) {
      await callRef.current.leave().catch(() => {});
      await callRef.current.destroy().catch(() => {});
      callRef.current = null;
    }

    // Delete the room server-side
    const name = roomName;
    if (name) {
      fetch("/api/stream/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_name: name }),
      }).catch(() => {});
    }

    setDailyState("idle");
    setRoomUrl("");
    setRoomName("");
  }, [roomName]);

  return { dailyState, dailyError, roomUrl, startStream, stopStream };
}
