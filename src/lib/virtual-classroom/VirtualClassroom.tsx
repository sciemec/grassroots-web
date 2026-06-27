'use client';

import { useState } from 'react';
import { ModuleLibrary } from './ModuleLibrary';
import { ModulePlayer } from './ModulePlayer';
import { MatchModule } from './types';
import { ClassroomProvider } from './ClassroomProvider';

interface VirtualClassroomProps {
  matchId?: string;
  matchName?: string;
}

export function VirtualClassroom({ matchId, matchName }: VirtualClassroomProps) {
  const [selectedModule, setSelectedModule] = useState<MatchModule | null>(null);
  const [view, setView] = useState<'library' | 'player'>('library');

  const handleSelectModule = (module: MatchModule) => {
    setSelectedModule(module);
    setView('player');
  };

  const handleBack = () => {
    setView('library');
    setSelectedModule(null);
  };

  return (
    <ClassroomProvider>
      <div className="space-y-4">
        {view === 'library' ? (
          <ModuleLibrary onSelectModule={handleSelectModule} />
        ) : (
          selectedModule && (
            <ModulePlayer 
              module={selectedModule} 
              onBack={handleBack} 
            />
          )
        )}
      </div>
    </ClassroomProvider>
  );
}