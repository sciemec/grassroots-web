#!/usr/bin/env python3
"""
Live Sports Commentary Orchestrator - Storytelling Edition
- iSports API → Gemini Storytelling → Liquidsoap → Icecast
- Ambient commentary fills the gaps
- Dynamic intensity based on match context
- Narrative arcs for compelling storytelling
"""

import os
import json
import time
import socket
import struct
import threading
import queue
import requests
import websocket
from datetime import datetime
from dotenv import load_dotenv
from typing import Optional, Dict, Any

# Import storytelling engine
from storytelling_engine import StorytellingEngine

load_dotenv()

# ============================================================
# CONFIGURATION
# ============================================================

class Config:
    # Gemini
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    
    # iSports
    ISPORTS_API_KEY = os.getenv('ISPORTS_API_KEY')
    ISPORTS_MATCH_ID = os.getenv('ISPORTS_MATCH_ID', 'worldcup_2026_001')
    
    # Liquidsoap
    LIQUIDSOAP_HOST = os.getenv('LIQUIDSOAP_HOST', 'localhost')
    LIQUIDSOAP_PORT = int(os.getenv('LIQUIDSOAP_PORT', 8000))
    LIQUIDSOAP_PASSWORD = os.getenv('LIQUIDSOAP_PASSWORD', 'password')
    
    # Icecast
    ICECAST_HOST = os.getenv('ICECAST_HOST')
    ICECAST_PORT = int(os.getenv('ICECAST_PORT', 8000))
    ICECAST_PASSWORD = os.getenv('ICECAST_PASSWORD')
    ICECAST_MOUNT = os.getenv('ICECAST_MOUNT', '/live')
    
    # Audio settings
    SAMPLE_RATE = 44100
    CHANNELS = 2
    BITRATE = 192
    
    # Validate required config
    @classmethod
    def validate(cls):
        required = ['GEMINI_API_KEY', 'ISPORTS_API_KEY']
        missing = [r for r in required if not getattr(cls, r)]
        if missing:
            print(f"❌ Missing required env vars: {', '.join(missing)}")
            return False
        return True


# ============================================================
# LIQUIDSOAP CLIENT
# ============================================================

class LiquidsoapClient:
    def __init__(self, host: str, port: int, password: str):
        self.host = host
        self.port = port
        self.password = password
        self.socket = None
        self.is_connected = False
        self.audio_queue = queue.Queue()
        self.running = False
    
    def connect(self) -> bool:
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.connect((self.host, self.port))
            self.socket.settimeout(10.0)
            
            handshake = f"SOURCE / {self.password}\r\n"
            self.socket.send(handshake.encode())
            
            response = self.socket.recv(1024).decode()
            if '200 OK' in response:
                self.is_connected = True
                self.running = True
                print(f'✅ Connected to Liquidsoap at {self.host}:{self.port}')
                return True
            else:
                print(f'❌ Liquidsoap rejected: {response}')
                return False
        except Exception as e:
            print(f'❌ Failed to connect: {e}')
            return False
    
    def send_audio(self, audio_data: bytes):
        if not self.is_connected:
            return
        try:
            self.socket.send(audio_data)
        except Exception as e:
            print(f'⚠️ Failed to send audio: {e}')
            self.is_connected = False
    
    def send_metadata(self, title: str, artist: str = "Gemini Commentary"):
        if not self.is_connected:
            return
        try:
            metadata = f"StreamTitle='{title}';StreamUrl='';"
            metadata_bytes = metadata.encode('utf-8')
            length = len(metadata_bytes)
            self.socket.send(b'\x00')
            self.socket.send(struct.pack('B', length))
            self.socket.send(metadata_bytes)
            self.socket.send(b'\x00')
            print(f'📝 Metadata: "{title}"')
        except Exception as e:
            print(f'⚠️ Metadata failed: {e}')
    
    def start_worker(self):
        def worker():
            while self.running:
                try:
                    audio_data = self.audio_queue.get(timeout=1.0)
                    if audio_data:
                        self.send_audio(audio_data)
                except queue.Empty:
                    self._send_silence()
                except Exception:
                    pass
        thread = threading.Thread(target=worker, daemon=True)
        thread.start()
        return thread
    
    def _send_silence(self):
        silence = b'\x00' * int(0.05 * 44100 * 2 * 2)
        try:
            self.socket.send(silence)
        except:
            pass
    
    def disconnect(self):
        self.running = False
        if self.socket:
            try:
                self.socket.close()
            except:
                pass
        self.is_connected = False


# ============================================================
# ISPORTS MONITOR
# ============================================================

class iSportsMonitor:
    def __init__(self, api_key: str, match_id: str):
        self.api_key = api_key
        self.match_id = match_id
        self.ws = None
        self.callback = None
    
    def connect(self) -> bool:
        try:
            url = f'wss://api.isports.io/v1/live?access_token={self.api_key}'
            self.ws = websocket.WebSocketApp(
                url,
                on_open=self._on_open,
                on_message=self._on_message,
                on_error=self._on_error,
                on_close=self._on_close
            )
            return True
        except Exception as e:
            print(f'❌ iSports connection failed: {e}')
            return False
    
    def run(self, callback):
        self.callback = callback
        if not self.connect():
            return
        print('📡 Connected to iSports, listening for events...')
        self.ws.run_forever()
    
    def _on_open(self, ws):
        subscribe_msg = {
            'type': 'subscribe',
            'topics': ['match.update'],
            'match_id': self.match_id,
            'api_key': self.api_key
        }
        ws.send(json.dumps(subscribe_msg))
        print(f'📡 Subscribed to match {self.match_id}')
    
    def _on_message(self, ws, message):
        try:
            data = json.loads(message)
            event = self._parse_event(data)
            if event and self.callback:
                self.callback(event)
        except json.JSONDecodeError:
            pass
    
    def _on_error(self, ws, error):
        print(f'⚠️ iSports error: {error}')
    
    def _on_close(self, ws, close_status_code, close_msg):
        print('🔌 iSports disconnected')
    
    def _parse_event(self, data: dict) -> Optional[Dict[str, Any]]:
        if data.get('type') != 'match.update':
            return None
        event_data = data.get('data', {})
        event_type = event_data.get('event_type')
        allowed = ['GOAL', 'SHOT', 'CARD', 'PENALTY', 'SUBSTITUTION', 
                   'HALF_TIME', 'FULL_TIME']
        if event_type not in allowed:
            return None
        return {
            'id': event_data.get('event_id') or event_data.get('id'),
            'type': event_type,
            'player': event_data.get('player_name') or event_data.get('player'),
            'team': event_data.get('team_name') or event_data.get('team'),
            'time': event_data.get('match_time') or event_data.get('minute', '0'),
            'score': event_data.get('score', '0-0'),
            'description': event_data.get('description', ''),
            'home_team': event_data.get('home_team', 'Zimbabwe'),
            'away_team': event_data.get('away_team', 'Brazil'),
        }


# ============================================================
# TTS SYNTHESIZER
# ============================================================

class TTSSynthesizer:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.tts_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent'
    
    def synthesize(self, text: str, event_type: str) -> Optional[bytes]:
        tts_input = self._add_vocal_direction(text, event_type)
        payload = {
            'contents': [{
                'role': 'user',
                'parts': [{'text': tts_input}]
            }],
            'generationConfig': {
                'temperature': 0.7,
                'maxOutputTokens': 500,
            }
        }
        try:
            response = requests.post(
                f'{self.tts_url}?key={self.api_key}',
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            audio_b64 = data['candidates'][0]['content']['parts'][0]['data']
            print(f'🎵 Audio synthesized')
            return audio_b64
        except Exception as e:
            print(f'❌ TTS failed: {e}')
            return None
    
    def _add_vocal_direction(self, text: str, event_type: str) -> str:
        directions = {
            'GOAL': f'[excitement] GOAL! {text} [cheerful]',
            'PENALTY': f'[excitement] {text}',
            'CARD': f'[serious] {text}',
            'HALF_TIME': f'[calm] {text}',
            'FULL_TIME': f'[excitement] {text} [cheerful]',
        }
        return directions.get(event_type, f'[normal] {text}')


# ============================================================
# MAIN ORCHESTRATOR
# ============================================================

class CommentaryOrchestrator:
    def __init__(self):
        # Validate config first
        if not Config.validate():
            raise ValueError("Missing required environment variables")
        
        self.storytelling = StorytellingEngine(Config.GEMINI_API_KEY)
        self.tts = TTSSynthesizer(Config.GEMINI_API_KEY)
        self.liquidsoap = LiquidsoapClient(
            Config.LIQUIDSOAP_HOST,
            Config.LIQUIDSOAP_PORT,
            Config.LIQUIDSOAP_PASSWORD
        )
        self.match_context = {
            'home_team': 'Zimbabwe',
            'away_team': 'Brazil',
            'score': '0-0',
            'time': '0'
        }
        self.processed_events = set()
        self.is_liquidsoap_connected = False
        self.last_event_time = int(time.time())
        self.ambient_interval = 150  # 2.5 minutes between ambient updates
        
    def run(self):
        """Start the orchestrator"""
        print('''
    ╔══════════════════════════════════════════════════════════════╗
    ║         🎙️  STORYTELLING COMMENTARY ORCHESTRATOR            ║
    ║      ⚽  iSports → Gemini → Liquidsoap → Icecast           ║
    ║      📖  Narrative Arcs • Ambient Commentary • Emotion     ║
    ╚══════════════════════════════════════════════════════════════╝
        ''')
        
        # Connect to Liquidsoap
        if self.liquidsoap.connect():
            self.is_liquidsoap_connected = True
            self.liquidsoap.start_worker()
            print('🎵 Liquidsoap connected successfully')
        else:
            print('⚠️ Liquidsoap connection failed. Starting monitor only.')
        
        # Start iSports monitor
        monitor = iSportsMonitor(
            Config.ISPORTS_API_KEY,
            Config.ISPORTS_MATCH_ID
        )
        monitor.run(self._handle_event)
    
    def _handle_event(self, event: dict):
        """Handle incoming match events"""
        event_id = event.get('id')
        if event_id in self.processed_events:
            return
        
        # Update match context
        if event.get('score'):
            self.match_context['score'] = event['score']
        if event.get('time'):
            self.match_context['time'] = event['time']
        if event.get('home_team'):
            self.match_context['home_team'] = event['home_team']
        if event.get('away_team'):
            self.match_context['away_team'] = event['away_team']
        
        # Reset ambient timer
        self.last_event_time = int(time.time())
        
        print(f'\n⚽ EVENT: {event["type"]} at {event["time"]}\'')
        print(f'   Score: {self.match_context["score"]}')
        print('=' * 60)
        
        # Step 1: Generate storytelling commentary
        commentary = self.storytelling.generate_commentary(event, self.match_context)
        if commentary:
            print(f'📝 {commentary}')
            
            # Step 2: Synthesize audio
            audio_data = self.tts.synthesize(commentary, event.get('type'))
            if audio_data and self.is_liquidsoap_connected:
                # Step 3: Send to Liquidsoap
                self.liquidsoap.audio_queue.put(audio_data)
                self.liquidsoap.send_metadata(
                    title=f"{event['type']} - {event.get('player', 'Unknown')} ({event['time']}')",
                    artist="Gemini Storytelling"
                )
                print(f'✅ Audio sent to Liquidsoap')
        
        self.processed_events.add(event_id)
        print('=' * 60)
        
        # Step 4: Schedule ambient commentary for the gap
        self._schedule_ambient()
    
    def _schedule_ambient(self):
        """Schedule ambient commentary for the gap between events"""
        def ambient_worker():
            # Wait for the ambient interval
            time.sleep(self.ambient_interval)
            
            # Check if a new event has happened since we started waiting
            if int(time.time()) - self.last_event_time < self.ambient_interval:
                return
            
            print(f'\n🌅 AMBIENT COMMENTARY - {self.match_context["time"]}\'')
            print('=' * 60)
            
            # Generate ambient commentary
            commentary = self.storytelling.generate_ambient(self.match_context)
            if commentary:
                print(f'📝 {commentary}')
                
                # Synthesize and send to Liquidsoap
                audio_data = self.tts.synthesize(commentary, 'AMBIENT')
                if audio_data and self.is_liquidsoap_connected:
                    self.liquidsoap.audio_queue.put(audio_data)
                    self.liquidsoap.send_metadata(
                        title=f"Match Update - {self.match_context['time']}'",
                        artist="Gemini Ambient"
                    )
                    print(f'✅ Ambient audio sent')
            
            print('=' * 60)
        
        # Start ambient worker in background
        thread = threading.Thread(target=ambient_worker, daemon=True)
        thread.start()


# ============================================================
# MAIN
# ============================================================

def main():
    """Main entry point"""
    try:
        orchestrator = CommentaryOrchestrator()
        orchestrator.run()
    except KeyboardInterrupt:
        print('\n👋 Stopped by user')
        if 'orchestrator' in locals():
            orchestrator.liquidsoap.disconnect()
    except Exception as e:
        print(f'❌ Orchestrator error: {e}')
        if 'orchestrator' in locals():
            orchestrator.liquidsoap.disconnect()


if __name__ == '__main__':
    main()