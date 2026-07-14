// hooks/useScoutingForm.ts
import { useState, useCallback, useEffect } from 'react';
import { AttributeScore, PositionType, ScoutingProfile } from '@/types';
import { api } from '@/services/api';

interface UseScoutingFormProps {
  playerId: string;
  coachId: string;
  initialPosition?: PositionType;
}

export function useScoutingForm({ 
  playerId, 
  coachId, 
  initialPosition = 'MID' 
}: UseScoutingFormProps) {
  const [position, setPosition] = useState<PositionType>(initialPosition);
  const [attributes, setAttributes] = useState<AttributeScore>({
    pace: 70,
    technical: 65,
    tactical: 60,
    physical: 75,
    scanning: 55,
  });
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<ScoutingProfile[]>([]);
  const [teamAverages, setTeamAverages] = useState<AttributeScore | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load previous profiles and team averages
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const [historyRes, averagesRes] = await Promise.all([
          api.getScoutingHistory(playerId, 5),
          api.getTeamAverages(position),
        ]);

        if (historyRes.success && historyRes.data) {
          setSavedProfiles(historyRes.data.items);
        }

        if (averagesRes.success && averagesRes.data) {
          setTeamAverages(averagesRes.data);
        }
      } catch (err) {
        console.error('Failed to load historical data:', err);
      }
    };

    loadHistory();
  }, [playerId, position]);

  const updateAttribute = useCallback((key: keyof AttributeScore, value: number) => {
    setAttributes(prev => ({
      ...prev,
      [key]: Math.min(100, Math.max(0, value)),
    }));
  }, []);

  const calculateOverallScore = useCallback((): number => {
    const values = Object.values(attributes);
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [attributes]);

  const resetToDefaults = useCallback(() => {
    setAttributes({
      pace: 70,
      technical: 65,
      tactical: 60,
      physical: 75,
      scanning: 55,
    });
    setNotes('');
  }, []);

  const saveProfile = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const profile = {
        playerId,
        coachId,
        position,
        attributes,
        overallScore: calculateOverallScore(),
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      const response = await api.saveScoutingProfile(profile);

      if (response.success && response.data) {
        // Update history
        setSavedProfiles(prev => [response.data!, ...prev]);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.error || 'Failed to save profile');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save scouting profile';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsSaving(false);
    }
  }, [playerId, coachId, position, attributes, notes, calculateOverallScore]);

  return {
    position,
    setPosition,
    attributes,
    updateAttribute,
    overallScore: calculateOverallScore(),
    notes,
    setNotes,
    isSaving,
    error,
    saveProfile,
    resetToDefaults,
    savedProfiles,
    teamAverages,
  };
}