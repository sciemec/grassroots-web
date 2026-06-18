// src/components/PossessionDisplay.tsx
interface PossessionDisplayProps {
  homePossession: number;
  awayPossession: number;
  possession: 'home' | 'away' | 'neutral';
}

export function PossessionDisplay({ homePossession, awayPossession, possession }: PossessionDisplayProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Ball Possession</h3>
      
      <div className="space-y-3">
        {/* Home possession bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-[#1a5c2a]">Home</span>
            <span className="font-bold">{homePossession}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                possession === 'home' ? 'bg-[#1a5c2a]' : 'bg-[#1a5c2a]/60'
              }`}
              style={{ width: `${homePossession}%` }}
            />
          </div>
        </div>
        
        {/* Away possession bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-red-600">Away</span>
            <span className="font-bold">{awayPossession}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                possession === 'away' ? 'bg-red-600' : 'bg-red-400'
              }`}
              style={{ width: `${awayPossession}%` }}
            />
          </div>
        </div>
        
        {/* Possession indicator */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="text-[10px] text-gray-400">Currently:</span>
          <span className={`text-xs font-bold ${
            possession === 'home' ? 'text-[#1a5c2a]' : 
            possession === 'away' ? 'text-red-600' : 
            'text-gray-500'
          }`}>
            {possession === 'home' && '🔵 Home'}
            {possession === 'away' && '🔴 Away'}
            {possession === 'neutral' && '⚪ Neutral'}
          </span>
        </div>
      </div>
    </div>
  );
}