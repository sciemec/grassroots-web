# narrative_arcs.py
"""
Match narrative engine - builds the story of the match
"""

class NarrativeArcs:
    def __init__(self):
        self.narrative = ""
        self.arc_type = "neutral"  # comeback, dominance, underdog, rivalry, neutral
        self.key_moments = []
        self.home_momentum = 0.5  # 0 = away dominant, 1 = home dominant
        
    def update(self, event: dict, match_context: dict):
        """Update the narrative based on match events"""
        
        # Track key moments
        if event.get('type') == 'GOAL':
            self.key_moments.append({
                'time': event.get('time'),
                'type': 'GOAL',
                'player': event.get('player'),
                'team': event.get('team'),
                'score': match_context.get('score')
            })
        
        # Determine arc type based on score and time
        self._determine_arc(match_context)
        
        # Update momentum
        self._update_momentum(event, match_context)
    
    def _determine_arc(self, context: dict):
        """Determine the narrative arc of the match"""
        score = context.get('score', '0-0')
        minute = int(context.get('time', 0))
        
        try:
            home, away = score.split('-')
            home = int(home.strip())
            away = int(away.strip())
        except:
            home, away = 0, 0
        
        # Early match: neutral
        if minute < 20 and home == 0 and away == 0:
            self.arc_type = "neutral"
            self.narrative = "An evenly contested match is underway."
            return
        
        # Check for dominance
        if home > away + 1:
            self.arc_type = "dominance"
            self.narrative = f"{context.get('home_team', 'Home')} are in complete control."
        elif away > home + 1:
            self.arc_type = "dominance"
            self.narrative = f"{context.get('away_team', 'Away')} are dominating proceedings."
        elif home > away and minute > 60:
            self.arc_type = "comeback"
            self.narrative = "The momentum is shifting. The home side is fighting back."
        elif away > home and minute > 60:
            self.arc_type = "comeback"
            self.narrative = "The visitors are mounting a serious challenge."
        elif minute > 70 and abs(home - away) <= 1:
            self.arc_type = "tension"
            self.narrative = "It's all to play for in the final minutes."
        else:
            self.arc_type = "neutral"
            self.narrative = "The match is finely balanced."
    
    def _update_momentum(self, event: dict, context: dict):
        """Update momentum based on recent events"""
        # Simple momentum: goals, shots, cards shift momentum
        if event.get('type') == 'GOAL':
            if event.get('team') == context.get('home_team'):
                self.home_momentum = min(1.0, self.home_momentum + 0.15)
            else:
                self.home_momentum = max(0.0, self.home_momentum - 0.15)
        elif event.get('type') == 'SHOT':
            if event.get('team') == context.get('home_team'):
                self.home_momentum = min(1.0, self.home_momentum + 0.05)
            else:
                self.home_momentum = max(0.0, self.home_momentum - 0.05)
    
    def get_context(self) -> dict:
        """Get narrative context for the AI prompt"""
        momentum_text = "balanced"
        if self.home_momentum > 0.7:
            momentum_text = f"strongly with {context.get('home_team')}"
        elif self.home_momentum < 0.3:
            momentum_text = f"strongly with {context.get('away_team')}"
        elif self.home_momentum > 0.55:
            momentum_text = f"slightly with {context.get('home_team')}"
        elif self.home_momentum < 0.45:
            momentum_text = f"slightly with {context.get('away_team')}"
        
        return {
            'arc_type': self.arc_type,
            'narrative': self.narrative,
            'momentum': momentum_text,
            'key_moments_count': len(self.key_moments)
        }