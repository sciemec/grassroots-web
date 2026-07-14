// components/BiometricProfile.tsx
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { BiometricData } from '@/types';
import { biometricService } from '@/services/biometricService';

interface BiometricProfileProps {
  data: BiometricData;
  playerId: string;
  onRefresh?: () => void;
  compact?: boolean;
}

export function BiometricProfile({ 
  data, 
  playerId, 
  onRefresh, 
  compact = false 
}: BiometricProfileProps) {
  const fatigueStatus = biometricService.getFatigueStatus(data.fatigueIndex);
  const recoveryRecommendation = biometricService.getRecoveryRecommendation(
    data.fatigueIndex,
    data.overallForm
  );

  if (!data.hasData) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-amber-500" />
          <p className="text-sm text-amber-400">
            No biometric data available
          </p>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Ask the player to complete a movement scan
        </p>
        <div className="mt-3">
          <a
            href={`/player/biomechanics?player_id=${playerId}`}
            className="text-xs text-emerald-400 hover:text-emerald-300 underline"
          >
            Start Scan →
          </a>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-emerald-900/20 to-blue-900/20 rounded-xl border border-emerald-800/30">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-bold text-white">
            {data.overallForm}%
          </span>
        </div>
        <div className="h-6 w-px bg-gray-700" />
        <div>
          <span className="text-xs text-gray-400">Fatigue:</span>
          <span className={`ml-1 text-sm font-bold ${fatigueStatus.color}`}>
            {fatigueStatus.text}
          </span>
        </div>
        {data.lastScanDate && (
          <span className="text-xs text-gray-500 ml-auto">
            {new Date(data.lastScanDate).toLocaleDateString()}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-r from-emerald-900/40 to-blue-900/40 p-5 border border-emerald-800/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-500" />
          <p className="text-sm font-bold text-white">Biometric Profile</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600/30 text-emerald-400">
            AI Verified
          </span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Refresh
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-[10px] text-gray-400">Overall Form</p>
          <p className="text-2xl font-bold text-white">{data.overallForm}%</p>
          <div className="mt-1 h-1 w-full bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${data.overallForm}%` }}
            />
          </div>
        </div>
        <div>
          <p className="text-[10px] text-gray-400">Explosive Power</p>
          <p className="text-2xl font-bold text-white">{data.explosivePower}%</p>
          <div className="mt-1 h-1 w-full bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${data.explosivePower}%` }}
            />
          </div>
        </div>
        <div>
          <p className="text-[10px] text-gray-400">Movement Symmetry</p>
          <p className="text-2xl font-bold text-white">{data.symmetryScore}%</p>
          <div className="mt-1 h-1 w-full bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${data.symmetryScore}%` }}
            />
          </div>
        </div>
        <div>
          <p className="text-[10px] text-gray-400">Fatigue Index</p>
          <p className={`text-2xl font-bold ${fatigueStatus.color}`}>
            {data.fatigueIndex}
          </p>
          <p className={`text-[10px] ${fatigueStatus.color}`}>
            {fatigueStatus.text} - {recoveryRecommendation}
          </p>
        </div>
      </div>

      {data.lastScanDate && (
        <div className="mt-3 flex justify-between items-center">
          <p className="text-[9px] text-gray-500">
            Last scan: {new Date(data.lastScanDate).toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            {data.fatigueIndex < 30 && (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Low Fatigue
              </span>
            )}
            {data.fatigueIndex > 60 && (
              <span className="text-[10px] text-red-400 flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                High Fatigue - Rest Recommended
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}