'use client';

import { useState } from 'react';
import { ModuleLibrary } from './ModuleLibrary';
import { ModulePlayer } from './ModulePlayer';
import { MatchModule } from './types';
// ClassroomProvider is already at the page level — no import needed here

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
    // REMOVED: <ClassroomProvider> - The provider is already at the page level
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
    // REMOVED: </ClassroomProvider>
  );
}