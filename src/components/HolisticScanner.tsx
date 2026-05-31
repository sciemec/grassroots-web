"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Camera, Activity, Award, TrendingUp, Shield, Hand,
  Loader2, Sparkles, Zap, Heart, Eye, Cpu, BarChart3,
  RotateCcw, CheckCircle, AlertCircle, Wifi, WifiOff
} from "lucide-react";
import { 
  HolisticResults, 
  processHolisticData, 
  classifyFromHolistic,
  AthleteMetrics 
} from "@/lib/holistic-engine";

type AnalysisMode = "realtime" | "upload";
type UserRole = "player" | "coach";

interface HolisticScannerProps {
  mode?: AnalysisMode;
  userRole?: UserRole;
  playerName?: string;
  playerId?: string;
  onComplete?: (metrics: AthleteMetrics, rawData: any) => void;
}

export default function HolisticScanner({ 
  mode = "realtime",
  userRole = "player",
  playerName,
  playerId,
  onComplete 
}: HolisticScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [streamActive, setStreamActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  
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
  
  const [classification, setClassification] = useState<null | {
    sport: string;
    position: string;
    confidence: number;
  }>(null);
  
  const [saved, setSaved] = useState(false);
  const [capturing, setCapturing] = useState(false);

  // Network status listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Real-time camera mode
  useEffect(() => {
    if (mode !== "realtime") return;
    
    let holisticInstance: any = null;
    let animationId: number;
    let localStream: MediaStream | null = null;
    let frameCount = 0;
    let lastFpsUpdate = Date.now();

    const initScanner = async () => {
      try {
        setLoading(true);
        
        // Request camera access
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: 640, height: 480 }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
          await videoRef.current.play();
          setStreamActive(true);
        }
        
        // Dynamically import MediaPipe Holistic
        const { HolisticLandmarker, FilesetResolver } = 
          await import("@mediapipe/tasks-vision");
        
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        
        holisticInstance = await HolisticLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/1/holistic_landmarker.task",
            delegate: "CPU"
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPoseTrackingConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minHandPresenceConfidence: 0.5
        });
        
        // Processing loop
        const processFrame = async (timestamp: number) => {
          if (videoRef.current && holisticInstance && videoRef.current.readyState >= 2) {
            // Update FPS counter
            frameCount++;
            const now = Date.now();
            if (now - lastFpsUpdate >= 1000) {
              setFps(frameCount);
              frameCount = 0;
              lastFpsUpdate = now;
            }
            
            const results = await holisticInstance.detectForVideo(videoRef.current, timestamp);
            
            if (results.landmarks && results.landmarks.length > 0) {
              // Extract pose, face, and hand landmarks
              const pose = results.landmarks[0]; // Pose landmarks
              const face = results.faceLandmarks?.[0]; // Face landmarks
              const leftHand = results.leftHandLandmarks?.[0];
              const rightHand = results.rightHandLandmarks?.[0];
              
              // Process with Holistic engine
              const processedMetrics = processHolisticData(
                pose || [],
                face || [],
                leftHand || [],
                rightHand || []
              );
              
              setMetrics(processedMetrics);
              
              // Auto-classify every 30 frames
              if (frameCount % 30 === 0) {
                const autoClass = classifyFromHolistic(processedMetrics);
                setClassification(autoClass);
              }
              
              // Draw overlay on canvas
              if (canvasRef.current) {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext("2d");
                if (ctx && videoRef.current) {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                  
                  // Draw key points for visual feedback
                  if (pose && pose.length > 0) {
                    // Draw joint connections
                    const connections = [
                      [11, 13], [13, 15],  // Left arm
                      [12, 14], [14, 16],  // Right arm
                      [23, 25], [25, 27],  // Left leg
                      [24, 26], [26, 28],  // Right leg
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
                    ctx.strokeStyle = "#10b981";
                    ctx.lineWidth = 3;
                    ctx.stroke();
                  }
                }
              }
            }
          }
          animationId = requestAnimationFrame(processFrame);
        };
        
        processFrame(0);
        setLoading(false);
        
      } catch (err: any) {
        console.error("Holistic scanner error:", err);
        setError(err.message || "Could not access camera. Please check permissions.");
        setLoading(false);
      }
    };
    
    initScanner();
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (localStream) localStream.getTracks().forEach(track => track.stop());
      if (holisticInstance) holisticInstance.close();
    };
  }, [mode]);

  // Upload video file for analysis
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("video/")) {
      setError("Please upload a video file (MP4, MOV, AVI)");
      return;
    }
    
    const MAX_SIZE = 500 * 1024 * 1024; // 500MB
    if (file.size > MAX_SIZE) {
      setError(`File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max 500MB.`);
      return;
    }
    
    setProcessing(true);
    setUploadProgress(0);
    
    try {
      // Step 1: Get presigned URL for direct upload
      const token = localStorage.getItem("auth_token");
      const presignRes = await fetch("/api/upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type
        })
      });
      
      const { uploadUrl, fileKey } = await presignRes.json();
      
      // Step 2: Upload directly to R2/S3 (bypasses Vercel limit)
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      
      await new Promise((resolve, reject) => {
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
      });
      
      // Step 3: Trigger backend analysis
      const analysisRes = await fetch("/api/analyst/process-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ fileKey, fileName: file.name })
      });
      
      const { jobId: newJobId } = await analysisRes.json();
      setJobId(newJobId);
      
      // Step 4: Poll for results
      pollForResults(newJobId);
      
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Upload failed. Please try again.");
      setProcessing(false);
    }
  };
  
  // Poll for async analysis results
  const pollForResults = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/analyst/job/${jobId}`);
        const data = await res.json();
        
        if (data.status === "complete") {
          clearInterval(pollInterval);
          setMetrics(data.metrics);
          setClassification(data.classification);
          setProcessing(false);
          setUploadProgress(100);
          
          // Save to localStorage
          const history = JSON.parse(localStorage.getItem("gs_holistic_history") || "[]");
          history.unshift({
            timestamp: new Date().toISOString(),
            metrics: data.metrics,
            classification: data.classification
          });
          localStorage.setItem("gs_holistic_history", JSON.stringify(history.slice(0, 20)));
          
          if (onComplete) onComplete(data.metrics, data);
          
        } else if (data.status === "failed") {
          clearInterval(pollInterval);
          setError(data.error || "Analysis failed");
          setProcessing(false);
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    }, 3000);
  };

  // Save session data
  const handleSave = useCallback(async () => {
    setCapturing(true);
    
    const payload = {
      playerName: playerName || "Athlete",
      playerId: playerId,
      mode,
      timestamp: new Date().toISOString(),
      metrics,
      classification,
      hasVideo: jobId !== null
    };
    
    try {
      // Always save to localStorage (offline-capable)
      const history = JSON.parse(localStorage.getItem("gs_holistic_history") || "[]");
      history.unshift(payload);
      localStorage.setItem("gs_holistic_history", JSON.stringify(history.slice(0, 20)));
      
      // Save to backend if online
      if (isOnline) {
        const token = localStorage.getItem("auth_token");
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/biometric/save`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }
      
      setSaved(true);
      if (onComplete) onComplete(metrics, payload);
      setTimeout(() => setSaved(false), 3000);
      
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setCapturing(false);
    }
  }, [metrics, classification, mode, playerName, playerId, isOnline, onComplete]);

  // Reset tracking
  const handleReset = useCallback(() => {
    setMetrics({
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
    setClassification(null);
    setJobId(null);
  }, []);

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

  if (loading && mode === "realtime") {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-gray-800 bg-gray-900/50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-emerald-500" />
          <p className="text-xs text-gray-500">Initializing Holistic Scanner...</p>
        </div>
      </div>
    );
  }

  if (mode === "upload" && !processing && !jobId) {
    return (
      <div className="space-y-4">
        <div 
          className="relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-700 bg-gray-900/30 p-8 text-center transition-all hover:border-emerald-500 hover:bg-gray-900/50"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Upload className="mx-auto mb-3 h-10 w-10 text-gray-500" />
          <p className="text-sm font-medium text-white">Upload Match Video</p>
          <p className="mt-1 text-xs text-gray-500">MP4, MOV, or AVI • Max 500MB</p>
          <p className="mt-2 text-[10px] text-gray-600">Video will be analyzed using AI pose tracking</p>
        </div>
        
        <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            {isOnline ? (
              <Wifi className="h-3 w-3 text-emerald-500" />
            ) : (
              <WifiOff className="h-3 w-3 text-amber-500" />
            )}
            <p className="text-xs font-medium text-gray-400">
              {isOnline ? "Online - Results will sync to cloud" : "Offline - Results saved locally"}
            </p>
          </div>
          <p className="text-[10px] text-gray-500">
            Analysis takes 2-5 minutes depending on video length. You'll be notified when complete.
          </p>
        </div>
      </div>
    );
  }

  if (processing && mode === "upload") {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm font-medium text-white">Processing Video...</p>
          <p className="mt-1 text-xs text-gray-500">{uploadProgress}% uploaded</p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-800">
            <div 
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Camera Preview (only in realtime mode) */}
      {mode === "realtime" && (
        <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-black">
          <video
            ref={videoRef}
            style={{ display: "none" }}
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            width="640"
            height="480"
            className="w-full aspect-video object-contain"
          />
          
          {/* Live overlay */}
          <div className="absolute top-3 right-3 rounded-xl bg-black/80 backdrop-blur-sm px-3 py-2 border border-gray-800">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
              <Activity className="h-3 w-3 text-emerald-500" />
              <span className="text-gray-400">HOLISTIC</span>
              <span className="text-emerald-500">543 POINTS</span>
              <span className="text-gray-600 ml-2">{fps} FPS</span>
            </div>
          </div>
          
          <button
            onClick={handleReset}
            className="absolute top-3 left-3 rounded-xl bg-black/80 backdrop-blur-sm p-2 border border-gray-800 hover:bg-gray-800 transition-colors"
          >
            <RotateCcw className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      )}
      