// src/config/features.ts
// ONE FILE to control what's visible. Change false → true to restore any feature.

export const FEATURES = {
  // CORE (ALWAYS ON - Cannot disable)
  biometrics: true,      // Identify - biometric scanning
  drills: true,          // Nurture - training drills
  passport: true,        // Market - talent passport
  
  // SPORTS SUPPORT
  football: true,        // Football player hub with drills
  multiSport: true,      // Athlete hub for all other sports
  
  // ROLES
  coaches: true,         // Coach dashboard
  scouts: true,          // Scout discovery
  fans: true,            // Fan/community viewing
  
  // TEMPORARILY DISABLED (Set to false to hide)
  arena: false,          // Social feed - DISABLED
  fanHub: false,         // Fan video uploads - DISABLED
  businessHub: false,    // Business tools - DISABLED
  analystHub: false,     // Advanced analytics - DISABLED
  streaming: false,      // Live streaming - DISABLED
  schoolLeagues: false,  // School management - DISABLED
  
  // PLAYER HUB FEATURES (Disabled for focus)
  successEngine: false,  // Goal setting - DISABLED
  nutrition: false,      // Meal tracking - DISABLED
  trainingPlan: false,   // Session planner - DISABLED
  assessment: false,     // Skill assessment - DISABLED (merged into biometrics)
  
  // UTILITIES
  showStorageQuota: true,  // Show 500MB/5GB limit in profile
  showWhatsAppShare: true, // Share passport via WhatsApp
};

// Helper to check if a role should see a feature
export const roleCanAccess = (role: string, feature: string): boolean => {
  const roleFeatureMap: Record<string, string[]> = {
    player: ['biometrics', 'drills', 'passport', 'football'],
    athlete: ['biometrics', 'passport', 'multiSport'],
    coach: ['biometrics', 'drills', 'passport', 'coaches'],
    scout: ['passport', 'scouts'],
    fan: ['passport', 'fans'],
    admin: Object.keys(FEATURES),
  };
  return roleFeatureMap[role]?.includes(feature) || false;
};