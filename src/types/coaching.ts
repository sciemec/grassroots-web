// src/types/coaching.ts

export interface CoachProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  photoUrl?: string;
  credentials: CoachCredential[];
  experience: number;
  currentClub: string;
  currentRole: string;
  formerClubs: string[];
  specialties: string[];
  coachingStyle: string;
  bio: string;
  languages: string[];
  rating: number;
  totalSessions: number;
  totalStudents: number;
  reviews: Review[];
  availability: AvailabilitySlot[];
  pricePerSession: number;
  sessionDuration: number;
  isVerified: boolean;
  verificationBadge: 'premier' | 'zifa' | 'national' | 'academy' | 'elite';
  videoIntro?: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    instagram?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CoachCredential {
  id: string;
  name: string;
  issuer: string;
  year: number;
  expiry?: string;
  verificationUrl?: string;
}

export interface AvailabilitySlot {
  id: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  date?: string;
  maxBookings: number;
  bookedCount: number;
}

export interface CoachingSession {
  id: string;
  coachId: string;
  playerId: string;
  coachName: string;
  playerName: string;
  sessionType: 'individual' | 'group' | 'video_analysis' | 'tactical' | 'drills' | 'match_analysis';
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
  scheduledAt: string;
  duration: number;
  price: number;
  currency: 'USD' | 'ZWL';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  paymentReference?: string;
  notes?: string;
  coachNotes?: string;
  playerNotes?: string;
  meetingLink: string;
  meetingId: string;
  recordingUrl?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  rescheduleRequested?: boolean;
  rescheduleReason?: string;
  feedback?: {
    playerRating: number;
    playerComment: string;
    coachRating: number;
    coachComment: string;
  };
  reminderSent: boolean;
  reminderSentAt?: string;
}

export interface Review {
  id: string;
  playerId: string;
  playerName: string;
  playerPhoto?: string;
  sessionId: string;
  rating: number;
  comment: string;
  categories: {
    expertise: number;
    communication: number;
    value: number;
    punctuality: number;
    overall: number;
  };
  coachResponse?: string;
  coachResponseAt?: string;
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
}

export interface BookingRequest {
  coachId: string;
  playerId: string;
  sessionType: CoachingSession['sessionType'];
  scheduledAt: string;
  duration: number;
  notes?: string;
  paymentMethod: 'ecocash' | 'innbucks' | 'onemoney' | 'bank' | 'card';
}

export interface VideoCallConfig {
  provider: 'daily' | 'jitsi';
  roomName: string;
  roomUrl: string;
  token?: string;
  properties: {
    enableKnocking: boolean;
    enableChat: boolean;
    enableScreenShare: boolean;
    enableRecording: boolean;
    enableTranscription: boolean;
  };
}

export interface ReminderConfig {
  id: string;
  sessionId: string;
  type: 'email' | 'sms' | 'push';
  scheduledAt: string;
  sentAt?: string;
  status: 'pending' | 'sent' | 'failed';
  message: string;
}

export interface PlayerCoachingStats {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  totalSpent: number;
  averageRating: number;
  favoriteCoach: string;
  favoriteCoachId: string;
  nextSession?: CoachingSession;
  recentSessions: CoachingSession[];
  upcomingSessions: CoachingSession[];
  progress: {
    tactical: number;
    technical: number;
    physical: number;
    mental: number;
  };
  achievements: string[];
}