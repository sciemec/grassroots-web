// src/hooks/useMatchWebSocket.ts
import { useState, useEffect, useRef } from 'react';

interface WebSocketData {
  type: 'player_move' | 'ball_move' | 'possession_change' | 'event' | 'formation';
  data: any;
}

export function useMatchWebSocket(matchId: string | null, enabled: boolean = true) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketData | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!matchId || !enabled) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://api.grassrootssports.live';
    const ws = new WebSocket(`${wsUrl}/matches/${matchId}/live`);
    
    ws.onopen = () => {
      console.log('WebSocket connected for match:', matchId);
      setIsConnected(true);
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      
      // Attempt to reconnect
      if (reconnectAttempts.current < maxReconnectAttempts) {
        setTimeout(() => {
          reconnectAttempts.current++;
          setSocket(null);
        }, 3000 * reconnectAttempts.current);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [matchId, enabled]);

  const sendMessage = (data: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  };

  return { isConnected, lastMessage, sendMessage };
}