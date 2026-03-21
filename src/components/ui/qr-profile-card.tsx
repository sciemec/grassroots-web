"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { QrCode, Download, Share2 } from "lucide-react";

interface QRProfileCardProps {
  playerId: string;
  playerName: string;
  ageGroup?: string;
  province?: string;
  selfieUrl?: string;
}

export function QRProfileCard({ playerId, playerName, ageGroup, province, selfieUrl }: QRProfileCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/player/public/${playerId}`
    : `https://grassrootssports.live/player/public/${playerId}`;

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, profileUrl, {
      width: 160,
      margin: 2,
      color: { dark: "#f0b429", light: "#0c1f10" },
    }).then(() => setReady(true)).catch(() => {});
  }, [profileUrl]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${playerName.replace(/\s+/g, "-")}-qr.png`;
    a.click();
  };

  const share = async () => {
    const text = `⚽ ${playerName} — Grassroots Sport Pro player profile\n${profileUrl}`;
    if (navigator.share) {
      try { await navigator.share({ title: playerName, text, url: profileUrl }); } catch { /* cancelled */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-card/60 p-5">
      <div className="mb-4 flex items-center gap-2">
        <QrCode className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-white">Player QR Card</h3>
        <span className="ml-auto text-xs text-muted-foreground">For trials & scouting</span>
      </div>

      <div className="flex items-center gap-5">
        {/* QR code */}
        <div className="flex-shrink-0 rounded-xl border border-primary/30 bg-[#0c1f10] p-2">
          <canvas ref={canvasRef} className={ready ? "block" : "opacity-0"} />
          {!ready && <div className="h-[160px] w-[160px] animate-pulse rounded-lg bg-white/5" />}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            {selfieUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selfieUrl} alt={playerName} className="h-12 w-12 rounded-full object-cover border-2 border-primary/40 flex-shrink-0" />
            ) : null}
            <div>
              <p className="font-bold text-white text-lg leading-tight">{playerName}</p>
              {ageGroup && <p className="text-sm text-muted-foreground capitalize">{ageGroup.replace("u", "U")} · {province ?? "Zimbabwe"}</p>}
              <p className="mt-1 text-xs text-muted-foreground">Scan to view full profile & TalentID score</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={download}
              disabled={!ready}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white hover:bg-white/10 disabled:opacity-40 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Save
            </button>
            <button
              onClick={share}
              className="flex items-center gap-1.5 rounded-lg bg-primary/20 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/30 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
