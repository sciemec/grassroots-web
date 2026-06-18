// src/components/FormationSelector.tsx
import { FORMATIONS, FormationName } from '@/utils/formations';

interface FormationSelectorProps {
  currentFormation: FormationName;
  onFormationChange: (formation: FormationName) => void;
}

export function FormationSelector({ currentFormation, onFormationChange }: FormationSelectorProps) {
  const formations: FormationName[] = ['4-4-2', '4-3-3'];
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500">Formation:</span>
      <div className="flex gap-1">
        {formations.map((formation) => (
          <button
            key={formation}
            onClick={() => onFormationChange(formation)}
            className={`px-2 py-1 text-xs rounded-lg transition-all ${
              currentFormation === formation
                ? 'bg-[#1a5c2a] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {formation}
          </button>
        ))}
      </div>
    </div>
  );
}