// ─── Pagination ──────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ─── Sports ───────────────────────────────────────────────────────────────────
export interface Sport {
  id: string;
  name: string;
  slug: string;
  icon: string;
  active: boolean;
}

// ─── User & Roles ─────────────────────────────────────────────────────────────
export type UserRole = "player" | "coach" | "scout" | "admin" | "fan";
export type AgeGroup = "u13" | "u17" | "u20" | "senior";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  age_group: AgeGroup;
  province: string;
  is_active: boolean;
  verified_at: string | null;
  last_active_at: string | null;
  created_at: string;
}

// ─── Identity Verification ────────────────────────────────────────────────────
export type VerificationStatus = "pending" | "approved" | "rejected" | "flagged";

export interface IdentityVerification {
  id: string;
  user_id: string;
  user: User;
  document_type: string;
  ai_confidence_score: number;
  status: VerificationStatus;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

// ─── Training Sessions ────────────────────────────────────────────────────────
export type SessionType = "programme" | "free";
export type SessionStatus = "active" | "completed" | "aborted";

export interface TrainingSession {
  id: string;
  user_id: string;
  user: User;
  session_type: SessionType;
  focus_area: string;
  overall_score: number | null;
  status: SessionStatus;
  created_offline: boolean;
  created_at: string;
  completed_at: string | null;
}

// ─── Subscriptions ────────────────────────────────────────────────────────────
export type PlanType = "weekly" | "monthly" | "3-month";
export type SubStatus = "active" | "grace_period" | "cancelled";

export interface PlayerSubscription {
  id: string;
  user_id: string;
  user: User;
  plan_type: PlanType;
  status: SubStatus;
  payment_method: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
}

// ─── Scout Contact Requests ───────────────────────────────────────────────────
export type ContactRequestStatus = "pending" | "approved" | "rejected";

export interface ScoutContactRequest {
  id: string;
  scout_id: string;
  scout: User;
  player_id: string;
  player: { initials: string; region: string; position: string };
  reason: string;
  status: ContactRequestStatus;
  admin_reviewed_at: string | null;
  created_at: string;
}

// ─── Coach Squad ──────────────────────────────────────────────────────────────
export type PlayerStatus = "fit" | "injured" | "caution";

export interface SquadMember {
  id: string;
  player_id: string;
  player: User;
  shirt_no: number;
  position: string;
  status: PlayerStatus;
  status_note: string | null;
  joined_at: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface DashboardStats {
  total_users: number;
  pending_verifications: number;
  active_subscriptions: number;
  sessions_today: number;
  pending_scout_requests: number;
  new_users_this_week: number;
}
