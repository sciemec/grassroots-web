export interface PlayerProfileSchema {
  id: string;
  name: string;
  ageGroup: "U8" | "U13" | "U17" | "Senior";
  role: "player" | "coach";
  createdAt: string;
  passportUrl: string;
  qrCodeDataString: string;
  currentMetrics: {
    best20mSprint: number | null;
    bestVerticalLeap: number | null;
    bestProAgility: number | null;
    overallTier: "Elite (Class A)" | "Competitive (Class B)" | "Developmental";
    lastCalibratedAt: string;
  };
}

export interface PerformanceHistoryEntrySchema {
  id: string;
  playerId: string;
  loggedAt: string;
  entryType: "biometric_drill" | "fatigue_wellness";
  drillMetrics?: {
    testType: "20m_sprint" | "vertical_leap" | "pro_agility";
    durationSeconds: number;
    calculatedScore: string;
    percentileRank: number;
  };
  fatigueMetrics?: {
    beatsCountedPeak: number;
    heartRatePeakBpm: number;
    beatsCountedRecovery: number;
    heartRateRecoveryBpm: number;
    heartRateDeltaBpm: number;
    muscleSoreness: number;  // 1-5 slider
    sleepQuality: number;    // 1-5 slider
    perceivedStress: number; // 1-5 slider
    fatigueAlertFlag: boolean;
  };
}