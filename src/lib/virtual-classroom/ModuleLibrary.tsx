'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Filter, Clock, BookOpen, CheckCircle, Lock, 
  Trophy, Star, ChevronRight, Calendar, Users 
} from 'lucide-react';
import { MatchModule } from './types';
import { ModuleCard } from './ModuleCard';

export function ModuleLibrary({ onSelectModule }: { onSelectModule: (module: MatchModule) => void }) {
  const [modules, setModules] = useState<MatchModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'completed' | 'in-progress' | 'locked'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  // Fetch modules from API
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetch('/api/virtual-classroom/modules');
        const data = await response.json();
        setModules(data.modules || []);
      } catch (error) {
        console.error('Failed to fetch modules:', error);
        // Fallback mock data
        setModules(getMockModules());
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, []);

  // Filter modules
  const filteredModules = modules.filter(module => {
    // Search filter
    const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          module.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          module.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Status filter
    const matchesStatus = filter === 'all' ? true :
                         filter === 'completed' ? module.isCompleted :
                         filter === 'in-progress' ? !module.isCompleted && module.progress > 0 :
                         filter === 'locked' ? module.isLocked : true;
    
    // Difficulty filter
    const matchesDifficulty = selectedDifficulty === 'all' || module.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesStatus && matchesDifficulty;
  });

  // Sort modules - newest first
  const sortedModules = [...filteredModules].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Stats
  const totalModules = modules.length;
  const completedModules = modules.filter(m => m.isCompleted).length;
  const inProgressModules = modules.filter(m => !m.isCompleted && m.progress > 0).length;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#1a5c2a] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-[#1a5c2a] to-[#0d3d1a] rounded-xl p-4 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm">Match Modules Library</h3>
            <p className="text-[10px] text-white/70">Learn from every World Cup match</p>
          </div>
          <div className="flex gap-3 text-center">
            <div>
              <div className="text-lg font-black text-[#f0b429]">{completedModules}</div>
              <div className="text-[8px] text-white/50">Completed</div>
            </div>
            <div>
              <div className="text-lg font-black text-white">{inProgressModules}</div>
              <div className="text-[8px] text-white/50">In Progress</div>
            </div>
            <div>
              <div className="text-lg font-black text-white/60">{totalModules}</div>
              <div className="text-[8px] text-white/50">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a5c2a]"
            />
          </div>
          <div className="flex gap-1">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a5c2a]"
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="locked">Locked</option>
            </select>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as any)}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a5c2a]"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Module Grid */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
        {sortedModules.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-500">No modules found</p>
          </div>
        ) : (
          sortedModules.map(module => (
            <ModuleCard 
              key={module.id} 
              module={module} 
              onClick={() => onSelectModule(module)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Mock data for fallback
function getMockModules(): MatchModule[] {
  return [
    {
      id: 'mod-1',
      matchId: 'match-1',
      title: 'Transition Masterclass',
      subtitle: 'Argentina vs France - World Cup Final 2026',
      homeTeam: 'Argentina',
      awayTeam: 'France',
      homeScore: 3,
      awayScore: 2,
      thumbnail: '/images/modules/final.jpg',
      description: 'Study how Argentina exploited France\'s transitions to win the World Cup.',
      tags: ['Transition', 'Counter-Attack', 'Final'],
      difficulty: 'advanced',
      duration: '45 min',
      lessonCount: 5,
      isLocked: false,
      isCompleted: false,
      progress: 30,
      createdAt: '2026-06-20T10:00:00Z',
    },
    {
      id: 'mod-2',
      matchId: 'match-2',
      title: 'Pressing & Counter-Pressing',
      subtitle: 'Brazil vs Germany - Quarter-Final 2026',
      homeTeam: 'Brazil',
      awayTeam: 'Germany',
      homeScore: 2,
      awayScore: 1,
      thumbnail: '/images/modules/brazil-germany.jpg',
      description: 'Learn how Brazil\'s high press overwhelmed Germany\'s build-up.',
      tags: ['Pressing', 'High Press', 'Build-up'],
      difficulty: 'intermediate',
      duration: '35 min',
      lessonCount: 4,
      isLocked: false,
      isCompleted: false,
      progress: 0,
      createdAt: '2026-06-18T10:00:00Z',
    },
    {
      id: 'mod-3',
      matchId: 'match-3',
      title: 'Defensive Organization',
      subtitle: 'Morocco vs Spain - Round of 16 2026',
      homeTeam: 'Morocco',
      awayTeam: 'Spain',
      homeScore: 0,
      awayScore: 0,
      thumbnail: '/images/modules/morocco-spain.jpg',
      description: 'Morocco\'s defensive masterclass against Spain\'s possession game.',
      tags: ['Defensive Shape', 'Low Block', 'Counter'],
      difficulty: 'intermediate',
      duration: '30 min',
      lessonCount: 3,
      isLocked: false,
      isCompleted: true,
      progress: 100,
      createdAt: '2026-06-15T10:00:00Z',
    },
  ];
}