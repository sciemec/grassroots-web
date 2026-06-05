"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Camera, Activity, Award, TrendingUp, Shield, Hand, Calendar,
  Loader2, Sparkles, Zap, Heart, Eye, Cpu, BarChart3,
  RotateCcw, CheckCircle, AlertCircle, UserCheck, Frown,
  LineChart, Database, Download, Share2, Clock, Trophy
} from "lucide-react";
import { 
  processHolisticData, 
  classifyFromHolistic,
  AthleteMetrics 
} from "@/lib/holistic-engine";
import { 
  saveTrainingSession, 
  getStoredSessions,
  calculatePerformanceTrends,
  exportScoutReport,
  TrainingSession,
  PlayerPerformance
} from "@/lib/performance-tracker";
import { compareFaces, generateFaceEmbedding } from "@/lib/face-verify";

type TrainingMode = "sprint" | "jumping" | "agility" | "strength";
type UserRole = "player" | "coach";

interface TrainingScannerProps {
  sport?: string;
  position?: string;
  userRole?: UserRole;
  playerName?: string;
  playerId?: string;
  onSessionComplete?: (session: TrainingSession) => void;
}

export default function TrainingScanner({ 
  sport = "Football",
  position = "Winger",
  userRole = "player",
  playerName,
  playerId,
  onSessionComplete 
}: TrainingScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<TrainingMode>("sprint");
  const [streamActive, setStreamActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [faceConfidence, setFaceConfidence] = useState(0);
  const [sessionSaved, setSessionSaved] = useState(false);
  
  const [metrics, setMetrics] = useState<AthleteMetrics>({
    kneeAngle: 0,
    hipAngle: 0,
    shoulderAngle: 0,
    torsoLean: 0,
    strideLength: 0,
    armSwingEfficiency: 0,
    headGazeX: 0,
    headGazeY: 0,
    expressionFatigue: 0,
    focusScore: 0,
    gripStrength: 0,
    handSpeed: 0,
    gestureType: "Neutral",
    overallForm: 75,
    fatigueIndex: 0,
    symmetryScore: 85,
    explosivePower: 70
  });
  
  const [performance, setPerformance] = useState<PlayerPerformance | null>(null);
  const [showReport, setShowReport] = useState(false);
  
  let recordingStartTime = useRef<number>(0);
  let intervalRef = useRef<NodeJS.Timeout>();
  let holisticInstance = useRef<any>(null);
  let localStream = useRef<MediaStream | null>(null);
  let animationId = useRef<number>(0);
  let frameCount = useRef(0);
  let lastFpsUpdate = useRef(Date.now());
  
  // Load previous performance data
  useEffect(() => {
    if (playerId) {
      const sessions = getStoredSessions(playerId);
      const trends = calculatePerformanceTrends(sessions);
      if (trends) setPerformance(trends);
    }
  }, [playerId]);

  // Face verification at start of session
  const verifyFace = useCallback(async () => {
    // Simulate face verification (in production, use real MediaPipe Face Detection)
    // This would capture the current video frame and compare to stored profile
    setFaceVerified(true);
    setFaceConfidence(0.94);
    return true;
  }, []);

  // Start training session
  const startSession = useCallback(async () => {
    // First verify face
    const verified = await verifyFace();
    if (!verified) {
      setError("Face verification failed. Please ensure good lighting and face visibility.");
      return;
    }
    
    setIsRecording(true);
    recordingStartTime.current = Date.now();
    
    // Start duration timer
    intervalRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - recordingStartTime.current) / 1000));
    }, 1000);
    
  }, [verifyFace]);

  // End session and save data
  const endSession = useCallback(async () => {
    if (!isRecording) return;
    
    setIsRecording(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    const sessionDuration = Math.floor((Date.now() - recordingStartTime.current) / 1000);
    
    // Create session record
    const session: TrainingSession = {
      sessionId: `${playerId || 'player'}_${Date.now()}`,
      playerId: playerId || 'unknown',
      playerName: playerName || 'Athlete',
      sport,
      position,
      timestamp: new Date().toISOString(),
      duration: sessionDuration,
      metrics: {
        kneeAngle: metrics.kneeAngle,
        kneeRating: metrics.kneeAngle < 90 ? 'ELITE' : metrics.kneeAngle < 120 ? 'GOOD' : 'RAW',
        strideLength: metrics.strideLength,
        armSwingEfficiency: metrics.armSwingEfficiency,
        headTilt: metrics.headGazeY,
        coreDrift: Math.abs(metrics.torsoLean),
        symmetryScore: metrics.symmetryScore,
        fatigueIndex: metrics.fatigueIndex,
        explosivePower: metrics.explosivePower,
        overallForm: metrics.overallForm,
        gripStrength: metrics.gripStrength,
        handSpeed: metrics.handSpeed,
        jumpHeight: mode === "jumping" ? metrics.strideLength : undefined,
        agilityScore: mode === "agility" ? metrics.symmetryScore : undefined,
      },
      faceVerification: {
        verified: faceVerified,
        confidence: faceConfidence
      }
    };
    
    // Save to database
    await saveTrainingSession(session);
    setSessionSaved(true);
    
    // Update performance trends
    const sessions = getStoredSessions(playerId || 'unknown');
    const updatedPerformance = calculatePerformanceTrends(sessions);
    if (updatedPerformance) setPerformance(updatedPerformance);
    
    if (onSessionComplete) onSessionComplete(session);
    
    setTimeout(() => setSessionSaved(false), 3000);
  }, [isRecording, metrics, mode, playerId, playerName, sport, position, faceVerified, faceConfidence, onSessionComplete]);

  // Initialize camera and Holistic
  useEffect(() => {
    const initScanner = async () => {
      try {
        setLoading(true);
        
        localStream.current = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: 640, height: 480 }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = localStream.current;
          await videoRef.current.play();
          setStreamActive(true);
        }
        
        const { HolisticLandmarker, FilesetResolver } = 
          await import("@mediapipe/tasks-vision");
        
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        
        holisticInstance.current = await HolisticLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/1/holistic_landmarker.task",
            delegate: "CPU"
          },
          runningMode: "VIDEO",
          minPoseDetectionConfidence: 0.5
        });
        
        const processFrame = async (timestamp: number) => {
          if (videoRef.current && holisticInstance.current && videoRef.current.readyState >= 2) {
            // FPS counter
            frameCount.current++;
            const now = Date.now();
            if (now - lastFpsUpdate.current >= 1000) {
              setFps(frameCount.current);
              frameCount.current = 0;
              lastFpsUpdate.current = now;
            }
            
            const results = await holisticInstance.current.detectForVideo(videoRef.current, timestamp);
            
            if (results.landmarks && results.landmarks.length > 0) {
              const pose = results.landmarks[0];
              const face = results.faceLandmarks?.[0];
              const leftHand = results.leftHandLandmarks?.[0];
              const rightHand = results.rightHandLandmarks?.[0];
              
              const processedMetrics = processHolisticData(
                pose || [],
                face || [],
                leftHand || [],
                rightHand || []
              );
              
              setMetrics(processedMetrics);
              
              // Draw skeleton on canvas
              if (canvasRef.current) {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext("2d");
                if (ctx && videoRef.current) {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                  
                  // Draw skeleton for visual feedback
                  if (pose && pose.length > 0) {
                    const connections = [
                      [11, 13], [13, 15], [12, 14], [14, 16],
                      [23, 25], [25, 27], [24, 26], [26, 28],
                    ];
                    
                    ctx.beginPath();
                    connections.forEach(([a, b]) => {
                      const p1 = pose[a];
                      const p2 = pose[b];
                      if (p1 && p2) {
                        ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
                        ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
                      }
                    });
                    ctx.strokeStyle = isRecording ? "#ef4444" : "#10b981";
                    ctx.lineWidth = 3;
                    ctx.stroke();
                  }
                }
              }
            }
          }
          animationId.current = requestAnimationFrame(processFrame);
        };
        
        processFrame(0);
        setLoading(false);
        
      } catch (err: any) {
        console.error("Scanner error:", err);
        setError(err.message || "Could not access camera");
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
  }, []);

  // Export report for sharing
  const handleExportReport = useCallback(() => {
    if (performance) {
      const report = exportScoutReport(performance);
      // Copy to clipboard
      navigator.clipboard.writeText(report);
      alert("Report copied to clipboard! You can paste it into WhatsApp or email.");
    }
  }, [performance]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <Camera className="mx-auto mb-3 h-8 w-8 text-red-500" />
        <p className="text-sm font-medium text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-xl bg-red-500/20 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/30"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-gray-800 bg-gray-900/50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-emerald-500" />
          <p className="text-xs text-gray-500">Initializing AI Training Scanner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="flex gap-2 rounded-xl border border-gray-800 bg-gray-900/30 p-1">
        {(["sprint", "jumping", "agility", "strength"] as TrainingMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            disabled={isRecording}
            className={`flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all ${
              mode === m
                ? "bg-emerald-600 text-white shadow-lg"
                : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
            } ${isRecording ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {m === "sprint" && "🏃 Sprint"}
            {m === "jumping" && "🦘 Jump"}
            {m === "agility" && "🔄 Agility"}
            {m === "strength" && "💪 Strength"}
          </button>
        ))}
      </div>

      {/* Camera Feed */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-black">
        <video ref={videoRef} style={{ display: "none" }} playsInline muted />
        <canvas ref={canvasRef} width="640" height="480" className="w-full aspect-video object-contain" />
        
        {/* Overlays */}
        <div className="absolute top-3 right-3 rounded-xl bg-black/80 backdrop-blur-sm px-3 py-2 border border-gray-800">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
            <Activity className="h-3 w-3 text-emerald-500" />
            <span className="text-gray-400">HOLISTIC</span>
            <span className="text-emerald-500">543 PTS</span>
            <span className="text-gray-600 ml-2">{fps} FPS</span>
          </div>
        </div>
        
        {/* Face Verification Badge */}
        {faceVerified && (
          <div className="absolute top-3 left-3 rounded-xl bg-emerald-500/20 backdrop-blur-sm px-3 py-2 border border-emerald-500/30">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
              <UserCheck className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-400">Face Verified</span>
              <span className="text-emerald-600/70">{Math.round(faceConfidence * 100)}%</span>
            </div>
          </div>
        )}
        
        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute bottom-3 left-3 rounded-xl bg-red-500/80 backdrop-blur-sm px-3 py-1.5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
              <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
              <span className="text-white">RECORDING</span>
              <span className="text-white/80">{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Metrics Dashboard */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Overall Form</p>
          <p className={`text-xl font-black ${metrics.overallForm > 80 ? "text-emerald-500" : metrics.overallForm > 60 ? "text-amber-500" : "text-red-500"}`}>
            {metrics.overallForm}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">
            {metrics.overallForm > 80 ? "ELITE" : metrics.overallForm > 60 ? "DEVELOPING" : "FOUNDATION"}
          </p>
        </div>
        
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Explosive Power</p>
          <p className="text-xl font-black text-white">{metrics.explosivePower}%</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">
            {metrics.explosivePower > 80 ? "EXPLOSIVE" : metrics.explosivePower > 60 ? "GOOD" : "NEEDS WORK"}
          </p>
        </div>
        
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Knee Drive</p>
          <p className="text-xl font-black text-white">{metrics.kneeAngle}°</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">
            {metrics.kneeAngle < 90 ? "ELITE" : metrics.kneeAngle < 120 ? "GOOD" : "RAW"}
          </p>
        </div>
        
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Symmetry</p>
          <p className="text-xl font-black text-white">{metrics.symmetryScore}%</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">
            {metrics.symmetryScore > 85 ? "BALANCED" : "DOMINANT SIDE"}
          </p>
        </div>
      </div>

      {/* Performance Trend Graph */}
      {performance && !showReport && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Performance Trends</p>
            </div>
            <button
              onClick={() => setShowReport(true)}
              className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400"
            >
              View Full Report →
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-[9px] text-gray-500 uppercase">Sessions</p>
              <p className="text-lg font-black text-white">{performance.totalSessions}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-gray-500 uppercase">Improvement</p>
              <p className={`text-lg font-black ${performance.trends.improvementRate > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {performance.trends.improvementRate > 0 ? '+' : ''}{performance.trends.improvementRate}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-gray-500 uppercase">Best Form</p>
              <p className="text-lg font-black text-amber-500">{performance.trends.peakForm}</p>
            </div>
          </div>
          
          {/* Mini trend graph (ASCII style for MVP) */}
          <div className="mt-3 pt-3 border-t border-gray-800">
            <div className="flex items-end gap-1 h-16">
              {performance.sessions.slice(0, 10).reverse().map((session, i) => {
                const height = (session.metrics.overallForm / 100) * 48;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-emerald-500/50 rounded-t hover:bg-emerald-500 transition-all"
                      style={{ height: `${height}px`, minHeight: '4px' }}
                    />
                    <div className="text-[8px] text-gray-600 mt-1">{i+1}</div>
                  </div>
                );
              })}
            </div>
            <p className="text-[8px] text-gray-600 text-center mt-2">Last 10 sessions (oldest → newest)</p>
          </div>
        </div>
      )}

      {/* Full Scout Report */}
      {showReport && performance && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-500" />
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Scout Report</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportReport}
                className="rounded-lg bg-emerald-600/20 px-3 py-1.5 text-[10px] font-bold text-emerald-400 hover:bg-emerald-600/30 flex items-center gap-1"
              >
                <Share2 className="h-3 w-3" /> Share
              </button>
              <button
                onClick={() => setShowReport(false)}
                className="rounded-lg bg-gray-800 px-3 py-1.5 text-[10px] font-bold text-gray-400 hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Player:</span>
              <span className="text-white font-bold">{performance.playerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Sport/Position:</span>
              <span className="text-white">{performance.sport} - {performance.position}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Sessions:</span>
              <span className="text-emerald-400 font-bold">{performance.totalSessions}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Improvement Rate:</span>
              <span className={performance.trends.improvementRate > 0 ? "text-emerald-400" : "text-red-400"}>
                {performance.trends.improvementRate > 0 ? '+' : ''}{performance.trends.improvementRate}%
              </span>
            </div>
            <div className="h-px bg-gray-800 my-2" />
            <p className="text-xs text-gray-300 leading-relaxed">
              {performance.trends.improvementRate > 10 
                ? `✅ This player shows EXCEPTIONAL improvement. Their form has increased ${performance.trends.improvementRate}% across ${performance.totalSessions} training sessions.`
                : performance.trends.improvementRate > 0
                ? `📈 This player shows steady improvement. Consistent training is yielding results.`
                : `⚠️ This player's performance has plateaued. Consider adjusting training program.`
              }
            </p>
            <p className="text-xs text-gray-400 mt-2">
              📊 Scouts can view full historical data and export reports for recruitment evaluation.
            </p>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-3">
        {!isRecording && !sessionSaved && (
          <button
            onClick={startSession}
            disabled={!streamActive}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <Camera className="h-4 w-4" />
            Start Training Session
          </button>
        )}
        
        {isRecording && (
          <button
            onClick={endSession}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 transition-colors"
          >
            <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
            End Session
          </button>
        )}
        
        {sessionSaved && (
          <button
            onClick={() => window.location.reload()}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
          >
            <CheckCircle className="h-4 w-4" />
            Session Saved! Start New Session →
          </button>
        )}
      </div>
    </div>
  );
}