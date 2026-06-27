'use client';

import { Clock, BookOpen, CheckCircle, Lock, ChevronRight, Star, Trophy } from 'lucide-react';
import { MatchModule } from './types';

interface ModuleCardProps {
  module: MatchModule;
  onClick: () => void;
}

export function ModuleCard({ module, onClick }: ModuleCardProps) {
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  };

  const difficultyLabels = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-md border-2 transition-all cursor-pointer hover:shadow-lg hover:border-[#f0b429] ${
        module.isCompleted ? 'border-green-300' : 
        module.isLocked ? 'border-gray-200 opacity-70' : 
        'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3 p-3">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-[#1a5c2a] flex items-center justify-center text-white text-2xl relative overflow-hidden">
          {module.thumbnail ? (
            <img src={module.thumbnail} alt={module.title} className="w-full h-full object-cover" />
          ) : (
            <Trophy size={24} />
          )}
          {module.isCompleted && (
            <div className="absolute top-0 right-0 bg-green-500 rounded-bl-lg px-1">
              <CheckCircle size={12} className="text-white" />
            </div>
          )}
          {module.isLocked && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Lock size={16} className="text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-gray-900 truncate">{module.title}</h4>
              <p className="text-[10px] text-gray-500 truncate">{module.subtitle}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${difficultyColors[module.difficulty]}`}>
                {difficultyLabels[module.difficulty]}
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-1">
            {module.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-[8px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
            {module.tags.length > 3 && (
              <span className="text-[8px] text-gray-400">+{module.tags.length - 3}</span>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-500">
            <span className="flex items-center gap-0.5">
              <Clock size={10} />
              {module.duration}
            </span>
            <span className="flex items-center gap-0.5">
              <BookOpen size={10} />
              {module.lessonCount} lessons
            </span>
            {module.progress > 0 && !module.isCompleted && (
              <span className="text-[#1a5c2a] font-bold">
                {module.progress}%
              </span>
            )}
            {module.isCompleted && (
              <span className="text-green-600 font-bold flex items-center gap-0.5">
                <CheckCircle size={10} />
                Completed
              </span>
            )}
          </div>

          {/* Progress Bar */}
          {module.progress > 0 && module.progress < 100 && (
            <div className="w-full h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="h-full bg-[#1a5c2a] rounded-full transition-all duration-500"
                style={{ width: `${module.progress}%` }}
              />
            </div>
          )}
        </div>

        <ChevronRight size={16} className="text-gray-400 flex-shrink-0 mt-1" />
      </div>
    </div>
  );
}