
"use client";

import { useEffect, useRef, useState } from "react";
import { Download, QrCode, CheckCircle } from "lucide-react";

interface QRCodeGeneratorProps {
  playerId: string;
  playerName: string;
  testResults: any;
  size?: number;
}

export function QRCodeGenerator({ playerId, playerName, testResults, size = 200 }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Dynamic import to avoid build issues
    import('qrcode').then((QRCode) => {
      const passportData = {
        version: "1.0",
        playerId,
        playerName,
        generatedAt: new Date().toISOString(),
        results: {
          testType: testResults.testType,
          rawScore: testResults.rawScore,
          percentile: testResults.percentile,
          tier: testResults.tier,
          recommendedPositions: testResults.recommendedPositions,
        },
        verifyUrl: `${window.location.origin}/api/verify-passport/${playerId}`,
        issuedBy: "GRS Academy - Teach For Zimbabwe"
      };
      
      QRCode.toCanvas(canvasRef.current, JSON.stringify(passportData), {
        width: size,
        margin: 2,
        color: {
          dark: '#1a5c2a',
          light: '#ffffff'
        }
      }, (error: Error | null | undefined) => {
        if (error) {
          console.error("QR Generation failed:", error);
        } else {
          setQrGenerated(true);
        }
      });
    }).catch(err => console.error("Failed to load QR library:", err));
  }, [playerId, playerName, testResults, size]);

  const downloadQR = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `talent-passport-${playerName.toLowerCase().replace(/\s/g, '-')}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div className="text-center space-y-3">
      <canvas ref={canvasRef} className="mx-auto border rounded-xl p-2 bg-white shadow-sm" />
      
      {qrGenerated && (
        <div className="flex gap-2">
          <button
            onClick={downloadQR}
            className="flex-1 bg-[#1a5c2a] text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
          >
            <Download size={12} /> Download QR
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 border border-gray-300 px-3 py-2 rounded-lg text-xs font-bold"
          >
            Print Passport
          </button>
        </div>
      )}
      
      <p className="text-[10px] text-gray-500">
        Scan QR code to verify this talent passport
      </p>
    </div>
  );
}