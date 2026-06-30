'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Play, Pause, CheckCircle, Lock, 
  Clock, BookOpen, ChevronRight, ChevronLeft,
  Trophy, MessageCircle, Users, BookMarked, PenTool
} from 'lucide-react';
import { MatchModule, ModuleLesson } from './types';
import { useClassroom } from './ClassroomProvider';
import { ClassroomChat } from './ClassroomChat';
import { StudentRoster } from './StudentRoster';
import { LessonPlan } from './LessonPlan';
import { DrawingBoard } from './DrawingBoard';

interface ModulePlayerProps {
  module: MatchModule;
  onBack: () => void;
}

export function ModulePlayer({ module, onBack }: ModulePlayerProps) {
  const [lessons, setLessons] = useState<ModuleLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'roster' | 'lesson'>('chat');
  const [showDrawing, setShowDrawing] = useState(false);
  
  // Get joinClass from the provider to activate the state
  const { state, toggleDrawing, joinClass } = useClassroom();

  // FIX: Automatically join when the module player loads
  useEffect(() => {
    if (!state.isActive) {
      joinClass(module.matchId);
    }
  }, [module.matchId, state.isActive, joinClass]);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await fetch(`/api/virtual-classroom/modules/${module.id}/lessons`);
        const data = await response.json();
        setLessons(data.lessons || []);
      } catch (error) {
        console.error('Failed to fetch lessons:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, [module.id]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f2ee' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-gray-900 truncate">{module.title}</h1>
            <p className="text-xs text-gray-500 truncate">
              {module.homeTeam} {module.homeScore} – {module.awayScore} {module.awayTeam}
            </p>
          </div>
          <button
            onClick={toggleDrawing}
            title="Tactical Drawing Board"
            className={`p-2 rounded-lg transition-colors ${
              state.drawingMode
                ? 'bg-[#1a5c2a] text-white'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <PenTool size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left — module info + lesson list */}
        <div className="lg:col-span-2 space-y-3">
          {/* Module info card */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-base font-bold text-gray-900 mb-1">{module.title}</h2>
            <p className="text-sm text-gray-500 mb-3">{module.description}</p>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock size={12} />{module.duration}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen size={12} />{module.lessonCount} lessons
              </span>
              {module.progress > 0 && (
                <span className="text-[#1a5c2a] font-bold">{module.progress}% complete</span>
              )}
            </div>
            {module.progress > 0 && (
              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-[#1a5c2a] rounded-full transition-all duration-500"
                  style={{ width: `${module.progress}%` }}
                />
              </div>
            )}
            <div className="flex flex-wrap gap-1 mt-3">
              {module.tags.map((tag, i) => (
                <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Lesson list */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <BookOpen size={14} className="text-[#1a5c2a]" />
              <span className="text-sm font-bold text-gray-900">Lessons</span>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex gap-3 items-center">
                    <div className="w-9 h-9 bg-gray-200 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-2 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : lessons.length === 0 ? (
              <div className="p-10 text-center">
                <Trophy size={28} className="mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No lessons available yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#1a5c2a]/10 flex items-center justify-center text-[#1a5c2a] text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{lesson.title}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock size={10} />{lesson.duration}
                      </p>
                    </div>
                    <Play size={14} className="text-[#1a5c2a] flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — classroom sidebar */}
        <div className="space-y-3">
          {/* Tab bar */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-100">
              {(
                [
                  { id: 'chat',   Icon: MessageCircle, label: 'Chat'   },
                  { id: 'roster', Icon: Users,          label: 'Roster' },
                  { id: 'lesson', Icon: BookMarked,     label: 'Plan'   },
                ] as const
              ).map(({ id, Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-1 py-2.5 text-[11px] font-medium flex flex-col items-center gap-0.5 transition-colors ${
                    activeTab === id
                      ? 'text-[#1a5c2a] border-b-2 border-[#1a5c2a] -mb-px'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
            <div className="p-2">
              {activeTab === 'chat'   && <ClassroomChat />}
              {activeTab === 'roster' && <StudentRoster />}
              {activeTab === 'lesson' && <LessonPlan />}
            </div>
          </div>
        </div>
      </div>

      {/* Drawing board overlay — renders itself when state.drawingMode is true */}
      <DrawingBoard onClose={toggleDrawing} />
    </div>
  );
}