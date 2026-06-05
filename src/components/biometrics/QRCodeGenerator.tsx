
"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeGeneratorProps {
  playerId: string;
  playerName: string;
  testResults: any;
  size?: number;
}

export function QRCodeGenerator({ playerId, playerName, testResults, size = 200 }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const passportData = {
      playerId,
      playerName,
      generatedAt: new Date().toISOString(),
      results: testResults,
      verifyUrl: `${window.location.origin}/api/verify-passport/${playerId}`
    };
    
    QRCode.toCanvas(canvasRef.current, JSON.stringify(passportData), {
      width: size,
      margin: 2,
      color: {
        dark: '#1a5c2a',
        light: '#ffffff'
      }
    }, (error) => {
      if (error) console.error("QR Generation failed:", error);
    });
  }, [playerId, playerName, testResults, size]);

  const downloadQR = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `talent-passport-${playerName}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div className="text-center space-y-3">
      <canvas ref={canvasRef} className="mx-auto border rounded-xl p-2 bg-white" />
      <button
        onClick={downloadQR}
        className="text-xs bg-[#1a5c2a] text-white px-3 py-1.5 rounded-lg"
      >
        Download QR Passport
      </button>
    </div>
  );
}