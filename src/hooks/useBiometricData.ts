// hooks/useBiometricData.ts
import { useState, useEffect, useCallback } from 'react';
import { BiometricData } from '@/types';
import { biometricService } from '@/services/biometricService';

export function useBiometricData(playerId: string | null) {
  const [data, setData] = useState<BiometricData>({
    overallForm: 0,
    explosivePower: 0,
    symmetryScore: 0,
    fatigueIndex: 0,
    hasData: false,
    lastScanDate: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!playerId) return;

    setLoading(true);
    setError(null);

    try {
      const biometricData = await biometricService.getBiometricData(playerId);
      setData(biometricData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load biometric data');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const updateData = useCallback(
    async (updates: Partial<BiometricData>) => {
      if (!playerId) return false;
      
      try {
        await biometricService.updateBiometricData(playerId, updates);
        await fetchData();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update biometric data');
        return false;
      }
    },
    [playerId, fetchData]
  );

  return { data, loading, error, refresh, updateData };
}