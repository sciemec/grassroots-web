"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Camera, Activity, Loader2, CheckCircle, 
  UserCheck, TrendingUp, Award, Zap, Heart, Eye, Sparkles
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { PlayerSidebar } from "@/components/layout/player-sidebar";

interface BiometricMetrics {
  kneeAngle: number;
  kneeRating: 'ELITE' | 'GOOD' | 'RAW';
  overallForm: number;
  explosivePower: number;
  symmetryScore: number;
  headTilt: number;
  fatigueIndex: number;
  timestamp: string;
}

export default function PlayerTrainPage() {
  const user = useAuthStore((s) => s.user);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [faceVerified, setFaceVerified] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [metrics, setMetrics] = useState<BiometricMetrics>({
    kneeAngle: 0,
    kneeRating: 'GOOD',
    overallForm: 0,
    explosivePower: 0,
    symmetryScore: 0,
    headTilt: 0,
    fatigueIndex: 0,
    timestamp: ''
  });
  const [hasExistingData, setHasExistingData] = useState(false);

  let recordingStartTime = useRef<number>(0);
  let intervalRef = useRef<NodeJS.Timeout>();
  let holisticInstance = useRef<any>(null);
  let animationId = useRef<number>(0);
  let localStream = useRef<MediaStream | null>(null);

  // Load existing biometric data
  useEffect(() => {
    const existing = localStorage.getItem(`biometric_${user?.id}`);
    if (existing) {
      setHasExistingData(true);
      const data = JSON.parse(existing);
      setMetrics(prev => ({ ...prev, ...data }));
    }
  }, [user?.id]);

  // Calculate metrics from pose landmarks
  const calculateMetrics = useCallback((pose: any[]) => {
    if (!pose || pose.length < 28) return null;
    
    // Get key landmarks
    const leftHip = pose[23];
    const leftKnee = pose[25];
    const leftAnkle = pose[27];
    const rightHip = pose[24];
    const rightKnee = pose[26];
    const rightAnkle = pose[28];
    const leftShoulder = pose[11];
    const rightShoulder = pose[12];
    
    // Calculate knee angle (left leg)
    const kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    
    // Calculate symmetry between legs
    const leftLegAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightLegAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const symmetryScore = Math.max(0, 100 - Math.abs(leftLegAngle - rightLegAngle) * 1.5);
    
    // Calculate overall form based on knee angle
    let overallForm = 0;
    let kneeRating: 'ELITE' | 'GOOD' | 'RAW' = 'RAW';
    
    if (kneeAngle < 90) {
      kneeRating = 'ELITE';
      overallForm = Math.min(100, 85 + (90 - kneeAngle));
    } else if (kneeAngle < 120) {
      kneeRating = 'GOOD';
      overallForm = Math.min(85, 70 + (120 - kneeAngle) / 2);
    } else {
      kneeRating = 'RAW';
      overallForm = Math.max(40, 70 - (kneeAngle - 120) / 2);
    }
    
    // Calculate explosive power (derived from knee angle and symmetry)
    const explosivePower = Math.round((overallForm * 0.6) + (symmetryScore * 0.4));
    
    // Head tilt (looking down = bad, chin up = good)
    const nose = pose[0];
    const headTilt = nose ? Math.min(100, Math.abs(nose.y - 0.3) * 200) : 50;
    
    return {
      kneeAngle: Math.round(kneeAngle),
      kneeRating,
      overallForm: Math.round(overallForm),
      explosivePower: Math.round(explosivePower),
      symmetryScore: Math.round(symmetryScore),
      headTilt: Math.round(headTilt),
      fatigueIndex: 0,
      timestamp: new Date().toISOString()
    };
  }, []);

  const calculateAngle = (a: any, b: any, c: any): number => {
    if (!a || !b || !c) return 0;
    const radians = Math.atan2(c.y - b.y, c.x - b.x) -
                    Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180) / Math.PI);
    if (angle > 180) angle = 360 - angle;
    return angle;
  };

  // Initialize camera and MediaPipe
  useEffect(() => {
    const initScanner = async () => {
      try {
        setLoading(true);
        
        localStream.current = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = localStream.current;
          await videoRef.current.play();
        }
        
        const { HolisticLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        
        holisticInstance.current = await HolisticLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/1/holistic_landmarker.task",
            delegate: "CPU"
          },
          runningMode: "VIDEO",
          numPoses: 1
        });
        
        const processFrame = async (timestamp: number) => {
          if (videoRef.current && holisticInstance.current && videoRef.current.readyState >= 2) {
            const results = await holisticInstance.current.detectForVideo(videoRef.current, timestamp);
            
            if (results.landmarks && results.landmarks.length > 0) {
              const newMetrics = calculateMetrics(results.landmarks[0]);
              if (newMetrics) {
                setMetrics(newMetrics);
              }
              
              // Draw skeleton on canvas
              if (canvasRef.current && results.landmarks[0]) {
                const ctx = canvasRef.current.getContext("2d");
                if (ctx && videoRef.current) {
                  ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                  ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                  
                  const pose = results.landmarks[0];
                  const connections = [
                    [11, 13], [13, 15], [12, 14], [14, 16],
                    [23, 25], [25, 27], [24, 26], [26, 28]
                  ];
                  
                  ctx.beginPath();
                  connections.forEach(([a, b]) => {
                    const p1 = pose[a], p2 = pose[b];
                    if (p1 && p2) {
                      ctx.moveTo(p1.x * canvasRef.current.width, p1.y * canvasRef.current.height);
                      ctx.lineTo(p2.x * canvasRef.current.width, p2.y * canvasRef.current.height);
                    }
                  });
                  ctx.strokeStyle = isRecording ? "#ef4444" : "#10b981";
                  ctx.lineWidth = 3;
                  ctx.stroke();
                }
              }
            }
          }
          animationId.current = requestAnimationFrame(processFrame);
        };
        
        processFrame(0);
        setLoading(false);
        
        // Auto-verify face after 2 seconds
        setTimeout(() => setFaceVerified(true), 2000);
        
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Camera access failed. Please check permissions.");
        setLoading(false);
      }
    };
    
    initScanner();
    
    return () => {
      if (animationId.current) cancelAnimationFrame(animationId.current);
      if (localStream.current) localStream.current.getTracks().forEach(track => track.stop());
      if (holisticInstance.current) holisticInstance.current.close();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [calculateMetrics]);

  const startSession = useCallback(() => {
    setFaceVerified(true);
    setIsRecording(true);
    recordingStartTime.current = Date.now();
    intervalRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - recordingStartTime.current) / 1000));
    }, 1000);
  }, []);

  const endSession = useCallback(async () => {
    if (!isRecording) return;
    
    setIsRecording(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    const sessionDuration = Math.floor((Date.now() - recordingStartTime.current) / 1000);
    
    const sessionData = {
      ...metrics,
      duration: sessionDuration,
      playerId: user?.id,
      playerName: user?.name,
      timestamp: new Date().toISOString()
    };
    
    // Save to localStorage
    const historyKey = `training_sessions_${user?.id}`;
    const existing = localStorage.getItem(historyKey);
    const sessions = existing ? JSON.parse(existing) : [];
    sessions.unshift(sessionData);
    localStorage.setItem(historyKey, JSON.stringify(sessions.slice(0, 50)));
    
    // Save latest biometric
    localStorage.setItem(`biometric_${user?.id}`, JSON.stringify(metrics));
    
    setSessionSaved(true);
    setHasExistingData(true);
    
    setTimeout(() => setSessionSaved(false), 3000);
  }, [isRecording, metrics, user?.id, user?.name]);

  if (error) {
    return (
      <div className="flex h-screen bg-gray-950">
        <PlayerSidebar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Camera className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <p className="text-red-400">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950">
      <PlayerSidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <Link href="/player" className="flex items-center gap-2 text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Hub</span>
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-gray-500">AI-Powered Analysis</span>
            </div>
          </div>

          {/* Hero */}
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-900/40 to-blue-900/40 p-5 border border-emerald-800/30">
            <h1 className="text-xl font-black text-white">AI Training Lab</h1>
            <p className="text-sm text-gray-400 mt-1">
              Get your biometric profile in 30 seconds. Scouts use this data to discover talent.
            </p>
          </div>

          {/* Camera Feed */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-black">
            <video ref={videoRef} style={{ display: "none" }} playsInline muted />
            <canvas ref={canvasRef} width="640" height="480" className="w-full aspect-video object-contain" />
            
            {/* Overlays */}
            <div className="absolute top-3 right-3 rounded-xl bg-black/80 px-3 py-2">
              <div className="flex items-center gap-2 text-[10px]">
                <Activity className="h-3 w-3 text-emerald-500" />
                <span className="text-gray-400">AI TRACKING</span>
              </div>
            </div>
            
            {faceVerified && !isRecording && !sessionSaved && (
              <div className="absolute top-3 left-3 rounded-xl bg-emerald-500/20 px-3 py-2 border border-emerald-500/30">
                <div className="flex items-center gap-2 text-[10px]">
                  <UserCheck className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-400">Ready to train</span>
                </div>
              </div>
            )}
            
            {isRecording && (
              <div className="absolute bottom-3 left-3 rounded-xl bg-red-500/80 px-3 py-1.5">
                <div className="flex items-center gap-2 text-[10px] text-white">
                  <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  RECORDING {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                </div>
              </div>
            )}
          </div>

          {/* Metrics Dashboard */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3">
              <p className="text-[9px] text-gray-500 uppercase">Overall Form</p>
              <p className={`text-xl font-black ${metrics.overallForm > 80 ? "text-emerald-500" : metrics.overallForm > 60 ? "text-amber-500" : "text-red-500"}`}>
                {metrics.overallForm || "—"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3">
              <p className="text-[9px] text-gray-500 uppercase">Knee Drive</p>
              <p className="text-xl font-black text-white">{metrics.kneeAngle || "—"}°</p>
              <span className={`text-[8px] ${metrics.kneeRating === 'ELITE' ? 'text-emerald-500' : metrics.kneeRating === 'GOOD' ? 'text-blue-500' : 'text-red-500'}`}>
                {metrics.kneeRating || "—"}
              </span>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3">
              <p className="text-[9px] text-gray-500 uppercase">Explosive Power</p>
              <p className="text-xl font-black text-white">{metrics.explosivePower || "—"}%</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3">
              <p className="text-[9px] text-gray-500 uppercase">Symmetry</p>
              <p className="text-xl font-black text-white">{metrics.symmetryScore || "—"}%</p>
            </div>
          </div>

          {/* Existing Data Notice */}
          {hasExistingData && !isRecording && !sessionSaved && (
            <div className="mt-4 rounded-xl border border-emerald-800/30 bg-emerald-600/10 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <p className="text-xs text-emerald-400">
                  Your last scan: Form {metrics.overallForm} • {new Date(metrics.timestamp).toLocaleDateString()}
                </p>
              </div>
              <Link href="/player/progress" className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300">
                <TrendingUp className="h-3 w-3" />
                View your progress →
              </Link>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            {!isRecording && !sessionSaved && (
              <button
                onClick={startSession}
                disabled={!faceVerified || loading}
                className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <Camera className="inline h-4 w-4 mr-2" />
                Start 30-Second Assessment
              </button>
            )}
            
            {isRecording && (
              <button
                onClick={endSession}
                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 transition-colors"
              >
                Complete Assessment
              </button>
            )}
            
            {sessionSaved && (
              <button
                onClick={() => window.location.reload()}
                className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle className="inline h-4 w-4 mr-2" />
                Scan Saved! Start New →
              </button>
            )}
          </div>

          {/* Info Panel */}
          <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-emerald-500" />
              <p className="text-xs font-bold text-white">Why this matters</p>
            </div>
            <p className="text-xs text-gray-400">
              Your biometric data is visible on your public Arena profile. Scouts filter by form score, 
              explosive power, and movement symmetry to find top talent. Higher scores = more visibility.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}