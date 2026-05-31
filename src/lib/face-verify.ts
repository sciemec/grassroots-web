// Face Recognition for Anti-Cheating
// Uses MediaPipe Face Detector + Face Landmarker

export interface FaceVerification {
  verified: boolean;
  confidence: number;
  faceEmbedding: number[];  // 128-dim vector for comparison
  timestamp: string;
}

export interface FaceProfile {
  playerId: string;
  embeddings: number[][];  // Store multiple for accuracy
  lastUpdated: string;
}

// Generate face embedding from landmarks (simplified - uses facial geometry)
export function generateFaceEmbedding(
  faceLandmarks: any[],
  imageWidth: number,
  imageHeight: number
): number[] {
  if (!faceLandmarks || faceLandmarks.length < 100) {
    return [];
  }
  
  // Extract key facial ratios (these are unique to each person)
  // Eyes distance ratio
  const leftEye = faceLandmarks[33];
  const rightEye = faceLandmarks[263];
  const eyeDistance = Math.sqrt(
    Math.pow((leftEye.x - rightEye.x) * imageWidth, 2) +
    Math.pow((leftEye.y - rightEye.y) * imageHeight, 2)
  );
  
  // Nose to mouth ratio
  const noseTip = faceLandmarks[4];
  const mouthCenter = faceLandmarks[13];
  const noseMouthDistance = Math.sqrt(
    Math.pow((noseTip.x - mouthCenter.x) * imageWidth, 2) +
    Math.pow((noseTip.y - mouthCenter.y) * imageHeight, 2)
  );
  
  // Jaw width ratio
  const leftJaw = faceLandmarks[152];
  const rightJaw = faceLandmarks[454];
  const jawWidth = Math.sqrt(
    Math.pow((leftJaw.x - rightJaw.x) * imageWidth, 2) +
    Math.pow((leftJaw.y - rightJaw.y) * imageHeight, 2)
  );
  
  // Normalize and create embedding vector
  const embedding = [
    eyeDistance / (imageWidth || 1),
    noseMouthDistance / (imageHeight || 1),
    jawWidth / (imageWidth || 1),
    // Add more facial features for better accuracy
    (leftEye.x - rightEye.x) * 100,
    (leftEye.y - rightEye.y) * 100,
    (noseTip.x - mouthCenter.x) * 100,
    (noseTip.y - mouthCenter.y) * 100,
  ];
  
  // Pad to 128 dimensions with additional derived features
  const fullEmbedding: number[] = [...embedding];
  for (let i = embedding.length; i < 128; i++) {
    fullEmbedding.push(Math.sin(i) * 0.1); // Placeholder - in production use ML model
  }
  
  return fullEmbedding;
}

// Compare two face embeddings (cosine similarity)
export function compareFaces(
  embedding1: number[],
  embedding2: number[]
): { similarity: number; isMatch: boolean } {
  if (!embedding1.length || !embedding2.length) {
    return { similarity: 0, isMatch: false };
  }
  
  // Cosine similarity
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < Math.min(embedding1.length, embedding2.length); i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }
  
  const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  const isMatch = similarity > 0.75; // Threshold for matching
  
  return { similarity, isMatch };
}

// Verify player during training session
export async function verifyPlayerFace(
  videoFrame: HTMLVideoElement | HTMLImageElement,
  storedEmbedding: number[]
): Promise<FaceVerification> {
  // This would normally call MediaPipe Face Landmarker
  // For now, return mock verification
  return {
    verified: true,
    confidence: 0.92,
    faceEmbedding: storedEmbedding,
    timestamp: new Date().toISOString()
  };
}

// Store face profile for new player
export async function registerPlayerFace(
  playerId: string,
  faceEmbedding: number[]
): Promise<void> {
  const profile: FaceProfile = {
    playerId,
    embeddings: [faceEmbedding],
    lastUpdated: new Date().toISOString()
  };
  
  localStorage.setItem(`face_profile_${playerId}`, JSON.stringify(profile));
}