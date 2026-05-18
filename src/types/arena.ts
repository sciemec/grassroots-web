export interface ArenaFollow {
  id: number;
  follower_id: number;
  following_id: number;
  following_type: 'user' | 'club' | 'school';
  created_at: string;
  follower?: ArenaUser;
  following?: ArenaUser;
}

export interface ArenaConnection {
  id: number;
  requester_id: number;
  recipient_id: number;
  status: 'pending' | 'accepted' | 'declined';
  message: string | null;
  accepted_at: string | null;
  created_at: string;
  requester?: ArenaUser;
  recipient?: ArenaUser;
}

export interface ArenaMessage {
  id: number;
  sender_id: number;
  recipient_id: number;
  body: string;
  read_at: string | null;
  created_at: string;
  sender?: ArenaUser;
  recipient?: ArenaUser;
}

export interface ArenaUser {
  id: number;
  name: string;
  role: string;
  sport?: string;
  province?: string;
  thuto_score?: number;
}
