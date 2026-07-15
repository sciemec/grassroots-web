// src/lib/video-service.ts

export class VideoService {
  private dailyApiKey: string;
  private dailyApiUrl: string;

  constructor() {
    this.dailyApiKey = process.env.DAILY_API_KEY || '';
    this.dailyApiUrl = 'https://api.daily.co/v1';
  }

  async createDailyRoom(
    sessionId: string,
    coachName: string,
    playerName: string
  ): Promise<{ roomName: string; roomUrl: string; token: string }> {
    const roomName = `coaching-${sessionId}-${Date.now()}`;

    try {
      const response = await fetch(`${this.dailyApiUrl}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.dailyApiKey}`,
        },
        body: JSON.stringify({
          name: roomName,
          properties: {
            enable_chat: true,
            enable_screen_share: true,
            start_audio_off: false,
            start_video_off: false,
            enable_recording: 'cloud',
            enable_transcription: true,
            max_participants: 2,
            exp: Math.floor(Date.now() / 1000) + 7200,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create Daily.co room');
      }

      const data = await response.json();

      const tokenResponse = await fetch(`${this.dailyApiUrl}/meeting-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.dailyApiKey}`,
        },
        body: JSON.stringify({
          properties: {
            room_name: roomName,
            is_owner: false,
            user_name: `${playerName} (Player)`,
            enable_recording: true,
          },
        }),
      });

      const tokenData = await tokenResponse.json();

      return {
        roomName,
        roomUrl: data.url,
        token: tokenData.token,
      };
    } catch (error) {
      console.error('Daily.co room creation error:', error);
      return this.createJitsiRoom(sessionId, coachName, playerName);
    }
  }

  createJitsiRoom(
    sessionId: string,
    coachName: string,
    playerName: string
  ): { roomName: string; roomUrl: string; token: string } {
    const roomName = `coaching-${sessionId}-${Date.now()}`;
    return {
      roomName,
      roomUrl: `https://meet.jit.si/${roomName}`,
      token: '',
    };
  }

  async getRoomDetails(roomName: string): Promise<{ roomUrl: string; participants: number }> {
    try {
      const response = await fetch(`${this.dailyApiUrl}/rooms/${roomName}`, {
        headers: {
          Authorization: `Bearer ${this.dailyApiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get room details');
      }

      const data = await response.json();
      return {
        roomUrl: data.url,
        participants: data.participants_count || 0,
      };
    } catch (error) {
      console.error('Failed to get room details:', error);
      return {
        roomUrl: `https://meet.jit.si/${roomName}`,
        participants: 0,
      };
    }
  }

  async deleteRoom(roomName: string): Promise<void> {
    try {
      await fetch(`${this.dailyApiUrl}/rooms/${roomName}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.dailyApiKey}`,
        },
      });
    } catch (error) {
      console.error('Failed to delete room:', error);
    }
  }
}

export const videoService = new VideoService();