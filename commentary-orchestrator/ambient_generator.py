# ambient_generator.py
"""
Generates ambient commentary during gaps between events
"""

import time
from datetime import datetime

class AmbientGenerator:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.last_commentary_time = 0
        self.gap_interval = 150  # seconds between ambient updates (2.5 minutes)
        self.ambient_history = []
        
    def should_generate(self, current_time: int) -> bool:
        """Check if enough time has passed since last ambient update"""
        if self.last_commentary_time == 0:
            return True
        return (current_time - self.last_commentary_time) >= self.gap_interval
    
    def generate_ambient(self, match_context: dict, narrative_context: dict) -> str:
        """Generate ambient commentary for gaps"""
        
        prompt = f"""
You are a world-class sports commentator providing "colour" for a quiet moment in the match.

## MATCH CONTEXT
- Match: {match_context.get('home_team', 'Zimbabwe')} vs {match_context.get('away_team', 'Brazil')}
- Score: {match_context.get('score', '0-0')}
- Time: {match_context.get('time', '0')} minutes
- Narrative: {narrative_context.get('narrative', 'The match is balanced.')}
- Momentum: {narrative_context.get('momentum', 'balanced')}

## YOUR TASK
Provide a brief, engaging update on the flow of the game. This is "colour commentary" to fill the gap between key events.

### Rules
1. Describe the general feeling of the match right now
2. Which team is looking more likely to score?
3. Any patterns you've noticed in the last few minutes?
4. Build anticipation for what might happen next
5. Keep it 20-30 words
6. Be natural and broadcast-ready
7. Use vivid, descriptive language

### Examples
- "Both teams are probing for an opening. The crowd is waiting for a spark."
- "The pressure is building. Zimbabwe are camped in Brazil's half."
- "Brazil are sitting back, inviting pressure. This could be dangerous."

### Your Ambient Commentary:
"""
        
        try:
            import requests
            response = requests.post(
                f'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={self.api_key}',
                json={
                    'contents': [{
                        'role': 'user',
                        'parts': [{'text': prompt}]
                    }],
                    'generationConfig': {
                        'temperature': 0.8,
                        'maxOutputTokens': 100,
                    }
                },
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            commentary = data['candidates'][0]['content']['parts'][0]['text'].strip()
            
            self.ambient_history.append({
                'time': match_context.get('time', '0'),
                'commentary': commentary,
                'timestamp': datetime.now().isoformat()
            })
            
            return commentary
            
        except Exception as e:
            print(f'⚠️ Ambient generation failed: {e}')
            return self._get_fallback_ambient(match_context)
    
    def _get_fallback_ambient(self, context: dict) -> str:
        """Fallback ambient commentary"""
        fallbacks = [
            f"Both teams are settling into the rhythm of this important match.",
            f"The tension is building as {context.get('home_team')} look for a breakthrough.",
            f"It's a tactical battle out there. Both managers are deep in thought.",
            f"The crowd is behind their team, willing them forward.",
            f"Possession is being contested fiercely in the middle of the park."
        ]
        import random
        return random.choice(fallbacks)
    
    def record_event(self):
        """Reset timer when a key event happens"""
        self.last_commentary_time = int(time.time())