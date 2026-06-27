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
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'roster' | 'lesson'>('chat');
  const [showDrawing, setShowDrawing] = useState(false);
  const { state, toggleDrawing } = useClassroom();

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await fetch(`/api/virtual-classroom/modules/${module.id}/lessons`);
        const data = await response.json();
        setLessons(data.lessons || []);
      } catch (error) {
        console.error('Failed to fetch lessons:', error);
        // Fallback mock data
        setLessons([
          {
            id: 'lesson-1',
            moduleId: module.id,
            title: 'Introduction: Tactical Analysis',
            duration: '10 min',
            content: 'Learn the fundamentals of tactical analysis and why it matters.',
            keyPoints: ['Understanding team shape', 'Reading the game', 'Key decision moments'],
            quizQuestions: [],
            order: 1,
          },
          {
            id: 'lesson-2',
            moduleId: module.id,
            title: 'Phase 1: Regaining Possession',
            duration: '15 min',
            content: 'How the winning team pressed and won the ball back effectively.',
            keyPoints: ['Pressing triggers', 'Defensive organization', 'Transition moments'],
            quizQuestions: [],
            order: 2,
          },
          {
            id: 'lesson-3',
            moduleId: module.id,
            title: 'Phase 2: Building the Attack',
            duration: '15 min',
            content: 'Building from the back and progressing through the thirds.',
            keyPoints: ['Build-up patterns', 'Player rotation', 'Finding space between lines'],
            quizQuestions: [],
            order: 3,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, [module.id]);

  const currentLesson = lessons[currentLessonIndex];
  const isFirstLesson = currentLessonIndex === 0;
  const isLastLesson = currentLessonIndex === lessons.length - 1;

  const nextLesson = () => {
    if (!isLastLesson) setCurrentLessonIndex(prev => prev + 1);
  };

  const prevLesson = () => {
    if (!isFirstLesson) setCurrentLessonIndex(prev => prev - 1);
  };

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
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1a5c2a] transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Library
      </button>

      {/* Module Header */}
      <div className="bg-gradient-to-r from-[#1a5c2a] to-[#0d3d1a] rounded-xl p-4 text-white shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-[#f0b429]" />
              <span className="text-[10px] text-white/70">{module.subtitle}</span>
            </div>
            <h3 className="text-lg font-black mt-0.5">{module.title}</h3>
            <p className="text-sm text-white/70 mt-1">{module.description}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs text-white/50">{module.duration}</div>
            <div className="text-xs text-white/50">{module.lessonCount} lessons</div>
            {module.isCompleted && (
              <div className="text-green-400 text-xs flex items-center gap-1 mt-1">
                <CheckCircle size={12} />
                Completed
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>Progress</span>
            <span>{module.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#f0b429] rounded-full transition-all duration-500"
              style={{ width: `${module.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Lesson Player */}
        <div className="lg:col-span-2 space-y-3">
          {/* Video/Content Area */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
              <div className="text-center text-white/60">
                <BookOpen size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">{currentLesson?.title || 'Lesson Content'}</p>
                <p className="text-xs opacity-50">Interactive tactical analysis</p>
              </div>
            </div>

            {/* Lesson Controls */}
            <div className="p-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700">
                    Lesson {currentLessonIndex + 1} of {lessons.length}
                  </span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                    <Clock size={10} />
                    {currentLesson?.duration || '10 min'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={prevLesson}
                    disabled={isFirstLesson}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={nextLesson}
                    disabled={isLastLesson}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lesson Content */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <h4 className="font-bold text-sm text-gray-900 mb-2">
              {currentLesson?.title || 'Lesson Title'}
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              {currentLesson?.content || 'Lesson content goes here.'}
            </p>
            
            {/* Key Points */}
            {currentLesson?.keyPoints && currentLesson.keyPoints.length > 0 && (
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                <h5 className="text-xs font-bold text-amber-800 mb-1.5">Key Takeaways</h5>
                <ul className="space-y-1">
                  {currentLesson.keyPoints.map((point, i) => (
                    <li key={i} className="text-[10px] text-amber-700 flex items-start gap-1.5">
                      <span className="text-amber-500">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right: Classroom Tools */}
        <div className="space-y-3">
          {/* Tab Navigation */}
          <div className="flex gap-1 bg-white rounded-xl shadow-md border border-gray-200 p-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'chat' ? 'bg-[#1a5c2a] text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <MessageCircle size={12} />
              Chat
            </button>
            <button
              onClick={() => setActiveTab('roster')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'roster' ? 'bg-[#1a5c2a] text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Users size={12} />
              Roster
            </button>
            <button
              onClick={() => setActiveTab('lesson')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'lesson' ? 'bg-[#1a5c2a] text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <BookMarked size={12} />
              Plan
            </button>
          </div>

          {/* Active Tab Content */}
          {activeTab === 'chat' && <ClassroomChat />}
          {activeTab === 'roster' && <StudentRoster />}
          {activeTab === 'lesson' && <LessonPlan />}

          {/* Drawing Tool Button */}
          <button
            onClick={() => {
              if (!state.drawingMode) {
                toggleDrawing();
              }
              setShowDrawing(true);
            }}
            className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <PenTool size={14} />
            {state.drawingMode ? 'Close Drawing Board' : 'Open Drawing Board'}
          </button>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-3">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-[10px] text-gray-400">Students</p>
                <p className="text-sm font-bold text-gray-800">{state.students.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Messages</p>
                <p className="text-sm font-bold text-gray-800">{state.messages.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawing Board Modal */}
      {showDrawing && state.drawingMode && (
        <DrawingBoard onClose={() => {
          setShowDrawing(false);
          toggleDrawing();
        }} />
      )}
    </div>
  );
}