# storytelling_engine.py
"""
Core storytelling engine - transforms events into narrative commentary
"""

class StorytellingEngine:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.llm_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent'
        self.tts_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent'
        self.narrative_arcs = NarrativeArcs()
        self.ambient_generator = AmbientGenerator(api_key)
        self.emotional_intensity = "calm"
        self.match_story = []
        
    def generate_commentary(self, event: dict, match_context: dict) -> str:
        """Generate storytelling commentary for an event"""
        
        # Update narrative arcs
        self.narrative_arcs.update(event, match_context)
        narrative_context = self.narrative_arcs.get_context()
        
        # Update intensity
        self._update_intensity(event, match_context)
        
        # Reset ambient timer (event happened)
        self.ambient_generator.record_event()
        
        # Build the storytelling prompt
        prompt = self._build_storytelling_prompt(event, match_context, narrative_context)
        
        try:
            import requests
            response = requests.post(
                f'{self.llm_url}?key={self.api_key}',
                json={
                    'contents': [{
                        'role': 'user',
                        'parts': [{'text': prompt}]
                    }],
                    'generationConfig': {
                        'temperature': 0.9,
                        'maxOutputTokens': 250,
                    }
                },
                timeout=15
            )
            response.raise_for_status()
            data = response.json()
            commentary = data['candidates'][0]['content']['parts'][0]['text'].strip()
            
            # Store in match story
            self.match_story.append({
                'time': event.get('time', '0'),
                'event_type': event.get('type'),
                'commentary': commentary,
                'intensity': self.emotional_intensity
            })
            
            return commentary
            
        except Exception as e:
            print(f'❌ Commentary generation failed: {e}')
            return self._get_fallback_story(event, match_context)
    
    def generate_ambient(self, match_context: dict) -> str:
        """Generate ambient commentary between events"""
        narrative_context = self.narrative_arcs.get_context()
        return self.ambient_generator.generate_ambient(match_context, narrative_context)
    
    def _update_intensity(self, event: dict, context: dict):
        """Adjust emotional intensity based on match context"""
        minute = int(event.get('time', 0))
        score = context.get('score', '0-0')
        
        try:
            home, away = score.split('-')
            home = int(home.strip())
            away = int(away.strip())
        except:
            home, away = 0, 0
        
        # Intensity rules
        if event.get('type') in ['GOAL', 'PENALTY', 'RED_CARD']:
            self.emotional_intensity = "frantic"
        elif minute >= 85 and abs(home - away) <= 1:
            self.emotional_intensity = "frantic"
        elif minute >= 75:
            self.emotional_intensity = "high"
        elif minute <= 15:
            self.emotional_intensity = "calm"
        else:
            self.emotional_intensity = "building"
    
    def _build_storytelling_prompt(self, event: dict, context: dict, narrative: dict) -> str:
        """Build the full storytelling prompt"""
        
        # Get the system prompt
        system_prompt = self._get_system_prompt()
        
        # Get event-specific pattern
        event_pattern = self._get_event_pattern(event, context)
        
        return f"""
{system_prompt}

## MATCH CONTEXT
- Match: {context.get('home_team', 'Zimbabwe')} vs {context.get('away_team', 'Brazil')}
- Score: {context.get('score', '0-0')}
- Time: {event.get('time', '0')} minutes
- Narrative: {narrative.get('narrative', 'The match is balanced.')}
- Momentum: {narrative.get('momentum', 'balanced')}
- Arc Type: {narrative.get('arc_type', 'neutral')}

## EVENT TO COMMENT ON
{event_pattern}

## ADDITIONAL INSTRUCTIONS
- Your intensity should be: {self.emotional_intensity}
- If intensity is "calm": be measured, analytical, build anticipation
- If intensity is "building": start showing more energy
- If intensity is "high": be excited, urgent
- If intensity is "frantic": be highly energetic, dramatic

## COMMENTARY (your turn):
"""
    
    def _get_system_prompt(self) -> str:
        """Get the storytelling system prompt"""
        return """
You are a world-class Zimbabwean sports commentator. Your job is not to list statistics—it's to tell the story of the match.

## YOUR COMMENTARY FRAMEWORK (The "Three I's")

### 1. IDENTIFICATION
- Always identify players by name and context
- Example: "Musona, the captain who missed the last match due to injury..."

### 2. INFORMATION (Use sparingly)
- Use stats to explain WHY, not just WHAT
- Don't say: "Zimbabwe has 60% possession."
- Say: "Zimbabwe has dominated the ball, but Brazil's compact defense is forcing them wide."

### 3. INTERPRETATION (This is your main job)
- Explain the MOMENT, not just the event
- Add pressure, emotion, and stakes
- Build narrative arcs (comeback, dominance, tension)

## RULES FOR ENGAGING COMMENTARY

### Rule 1: No Dry Data Dumps
- ❌ "Shot by Musona at 73 minutes."
- ✅ "Musona, with the weight of a nation on his shoulders, unleashes a thunderous strike!"

### Rule 2: Add Human Context
- Mention form, history, rivalry, personal stakes
- "This is the moment Musona has been waiting for—his first goal of the tournament."

### Rule 3: Build Atmosphere
- Use descriptive, vivid language
- "The crowd is on its feet, sensing the breakthrough."
- "The tension is palpable as Brazil defends deep."

### Rule 4: Manage Intensity
- Early match: Calm, analytical tone
- Final 15 minutes close match: Urgent, excited tone
- Goal or penalty: High energy, enthusiasm

### Rule 5: Use Pauses for "Colour Adding"
- Between events, offer ambient commentary
- "We're 60 minutes in, Zimbabwe pressing hard but Brazil's defense remains resolute."
- "Both managers are deep in discussion on the sidelines—changes coming?"
"""
    
    def _get_event_pattern(self, event: dict, context: dict) -> str:
        """Get event-specific pattern"""
        patterns = {
            'GOAL': f"""
GOAL! {event.get('player', 'a player')} scores for {event.get('team', 'the team')}!
The score is now {context.get('score', '0-0')}.

Add context: why this goal matters. Is it a breakthrough? A comeback?
Describe: the moment, the celebration, the impact on the match.
""",
            'SHOT': f"""
{event.get('player', 'a player')} takes a shot!
Add tension: was it a close chance? Should they have scored?
Describe: the build-up, the defensive response.
The match is at {event.get('time', '0')} minutes, score is {context.get('score', '0-0')}.
""",
            'CARD': f"""
A card shown to {event.get('player', 'a player')}!
Explain: was it frustration? A tactical foul? A mistimed challenge?
Describe: the referee's decision, the player's reaction.
The match is at {event.get('time', '0')} minutes, score is {context.get('score', '0-0')}.
""",
            'PENALTY': f"""
PENALTY! {event.get('player', 'a player')} steps up...
Build the moment: the pressure, the keeper's psychology, the crowd's tension.
If scored: "He sends the keeper the wrong way! Composure under pressure!"
If missed: "Heartbreak! The spot-kick is saved! A massive let-off!"
""",
            'SUBSTITUTION': f"""
Change for {event.get('team', 'the team')}: {event.get('incoming', 'a player')} replaces {event.get('outgoing', 'a player')}.
Explain the tactical meaning: fresh legs, tactical switch, chasing the game.
The match is at {event.get('time', '0')} minutes, score is {context.get('score', '0-0')}.
""",
            'HALF_TIME': """
The whistle goes for half-time.
Summarize: score, dominant team, key moments, what to watch for in the second half.
""",
            'FULL_TIME': """
FULL TIME! {score}!
Summarize: who won, how they won, key moments, implications for the tournament.
"""
        }
        return patterns.get(event.get('type'), f"{event.get('type')} in the match.")
    
    def _get_fallback_story(self, event: dict, context: dict) -> str:
        """Fallback commentary if AI fails"""
        fallbacks = {
            'GOAL': f"GOAL! {event.get('player', 'Unknown')} finds the back of the net! A crucial moment in this match!",
            'SHOT': f"{event.get('player', 'Unknown')} with a strike at goal!",
            'CARD': f"A card shown to {event.get('player', 'Unknown')}.",
            'PENALTY': f"PENALTY! The referee points to the spot!",
            'SUBSTITUTION': f"Substitution for {event.get('team', 'the team')}.",
            'HALF_TIME': "The whistle goes for half-time. A tense first half comes to an end.",
            'FULL_TIME': "FULL TIME! The match is over!"
        }
        return fallbacks.get(event.get('type'), f"{event.get('type')} in the match.")
    
    def should_generate_ambient(self, current_time: int) -> bool:
        """Check if ambient commentary should be generated"""
        return self.ambient_generator.should_generate(current_time)
    
    def get_match_summary(self) -> dict:
        """Get the full match story"""
        return {
            'story': self.match_story,
            'narrative': self.narrative_arcs.get_context(),
            'total_events': len(self.match_story)
        }