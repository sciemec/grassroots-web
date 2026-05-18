export interface ArenaFollow {
  id: string;
  follower_id: string;
  following_id: string;
  following_type: 'user' | 'club' | 'school';
  created_at: string;
  follower?: ArenaUser;
  following?: ArenaUser;
}

export interface ArenaConnection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'declined';
  message: string | null;
  accepted_at: string | null;
  created_at: string;
  requester?: ArenaUser;
  recipient?: ArenaUser;
}

export interface ArenaMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  sender?: ArenaUser;
  recipient?: ArenaUser;
}

export interface ArenaUser {
  id: string;
  name: string;
  role: string;
  sport?: string;
  province?: string;
}
