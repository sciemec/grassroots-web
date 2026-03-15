"use client";
import { useCallback, useRef, useState } from "react";

export type WhipState = "idle" | "connecting" | "live" | "error";

export interface WhipStreamResult {
  whipState: WhipState;
  whipError: string;
  hlsUrl: string;
  startStream: (stream: MediaStream) => Promise<void>;
  stopStream: () => Promise<void>;
}

export function useWhipStream(): WhipStreamResult {
  const [whipState, setWhipState] = useState<WhipState>("idle");
  const [whipError, setWhipError] = useState("");
  const [hlsUrl, setHlsUrl] = useState("");
  const [liveInputId, setLiveInputId] = useState("");
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const whipResourceRef = useRef<string>("");

  /** Starts a Cloudflare WHIP live stream using the given MediaStream. */
  const startStream = useCallback(async (stream: MediaStream) => {
    setWhipState("connecting");
    setWhipError("");

    try {
      // 1. Create Cloudflare live input via our server API
      const createRes = await fetch("/api/stream/create", { method: "POST" });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Failed to create stream");
      }
      const { whip_url, hls_url, live_input_id } = await createRes.json() as {
        whip_url: string;
        hls_url: string;
        live_input_id: string;
      };
      setHlsUrl(hls_url);
      setLiveInputId(live_input_id);

      // 2. Create WebRTC peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.cloudflare.com:3478" },
          { urls: "stun:stun.l.google.com:19302" },
        ],
      });
      pcRef.current = pc;

      // 3. Add tracks from the media stream
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // 4. Create SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 5. Wait for ICE gathering to complete (max 4s)
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") {
          resolve();
          return;
        }
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === "complete") resolve();
        };
        setTimeout(resolve, 4000);
      });

      // 6. Send SDP offer to Cloudflare WHIP endpoint
      const sdpRes = await fetch(whip_url, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: pc.localDescription!.sdp,
      });

      if (!sdpRes.ok) {
        throw new Error(`WHIP negotiation failed (${sdpRes.status})`);
      }

      // 7. Save resource URL for cleanup
      whipResourceRef.current = sdpRes.headers.get("Location") ?? "";

      // 8. Set remote description from answer
      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      setWhipState("live");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Stream failed to start";
      setWhipError(msg);
      setWhipState("error");
      pcRef.current?.close();
      pcRef.current = null;
    }
  }, []);

  /** Stops the WHIP stream and cleans up Cloudflare live input. */
  const stopStream = useCallback(async () => {
    pcRef.current?.close();
    pcRef.current = null;

    const inputId = liveInputId;
    if (inputId) {
      fetch("/api/stream/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ live_input_id: inputId }),
      }).catch(() => {});
    }

    setWhipState("idle");
    setHlsUrl("");
    setLiveInputId("");
  }, [liveInputId]);

  return { whipState, whipError, hlsUrl, startStream, stopStream };
}
