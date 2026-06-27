'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Play, Pause, CheckCircle, Lock, 
  Clock, BookOpen, ChevronRight, ChevronLeft,
  X, Trophy, Star, Users
} from 'lucide-react';
import { MatchModule, ModuleLesson } from './types';
import { ClassroomChat } from './ClassroomChat';
import { StudentRoster } from './StudentRoster';
import { DrawingBoard } from './DrawingBoard';
import { useClassroom } from './ClassroomProvider';

interface ModulePlayerProps {
  module: MatchModule;
  onBack: () => void;
}

export function ModulePlayer({ module, onBack }: ModulePlayerProps) {
  const [lessons, setLessons] = useState<ModuleLesson[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showDrawing, setShowDrawing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { state } = useClassroom();

  // Fetch lessons for this module
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await fetch(`/api/virtual-classroom/modules/${module.id}/lessons`);
        const data = await response.json();
        setLessons(data.lessons || getMockLessons());
      } catch (error) {
        setLessons(getMockLessons());
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
    if (!isLastLesson) {
      setCurrentLessonIndex(prev => prev + 1);
    }
  };

  const prevLesson = () => {
    if (!isFirstLesson) {
      setCurrentLessonIndex(prev => prev - 1);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
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
      {/* Back Button & Header */}
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
              <div className="text-green-400 text-xs flex items-center gap-1">
                <CheckCircle size={12} />
                Completed
              </div>
            )}
          </div>
        </div>

        {/* Progress */}
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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Lesson Player */}
        <div className="lg:col-span-2 space-y-3">
          {/* Video/Content Area */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
              {currentLesson?.videoUrl ? (
                <>
                  <video 
                    src={currentLesson.videoUrl}
                    className="w-full h-full object-cover"
                    poster="/images/lesson-placeholder.jpg"
                  />
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause size={40} className="text-white" />
                    ) : (
                      <Play size={40} className="text-white" />
                    )}
                  </button>
                </>
              ) : (
                <div className="text-center text-white/60">
                  <BookOpen size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Lesson Content</p>
                  <p className="text-xs opacity-50">Interactive tactical analysis</p>
                </div>
              )}
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
          {/* Toggle buttons */}
          <div className="flex gap-1 bg-white rounded-xl shadow-md border border-gray-200 p-1">
            <button
              onClick={() => setShowChat(true)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors ${
                showChat ? 'bg-[#1a5c2a] text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setShowChat(false)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors ${
                !showChat ? 'bg-[#1a5c2a] text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Roster
            </button>
          </div>

          {showChat ? <ClassroomChat /> : <StudentRoster />}

          {/* Quick Actions */}
          <div className="flex gap-1">
            <button
              onClick={() => setShowDrawing(true)}
              className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <BookOpen size={12} />
              Draw & Annotate
            </button>
            <button
              className="flex-1 py-1.5 bg-[#1a5c2a] hover:bg-[#0d3d1a] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Users size={12} />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Drawing Board Modal */}
      {showDrawing && (
        <DrawingBoard onClose={() => setShowDrawing(false)} />
      )}
    </div>
  );
}

// Mock lessons
function getMockLessons(): ModuleLesson[] {
  return [
    {
      id: 'lesson-1',
      moduleId: 'mod-1',
      title: 'Introduction: Transition Football',
      duration: '10 min',
      content: 'Learn the fundamentals of transition play - why it wins games.',
      keyPoints: ['Transition is the most dangerous phase', 'Speed of thought beats speed of feet', '5-second rule'],
      quizQuestions: [],
      order: 1,
    },
    {
      id: 'lesson-2',
      moduleId: 'mod-1',
      title: 'Argentina\'s Transition Patterns',
      duration: '15 min',
      content: 'How Argentina exploited France\'s defensive organization.',
      keyPoints: ['Messi dropping deep', 'Di Maria\'s wide runs', 'Quick vertical passes'],
      quizQuestions: [],
      order: 2,
    },
    {
      id: 'lesson-3',
      moduleId: 'mod-1',
      title: 'Counter-Attack Execution',
      duration: '10 min',
      content: 'The mechanics of Argentina\'s counter-attacks.',
      keyPoints: ['2-3-5 shape in transition', 'Overloads on the break', 'Finishing on the counter'],
      quizQuestions: [],
      order: 3,
    },
    {
      id: 'lesson-4',
      moduleId: 'mod-1',
      title: 'Defensive Transition',
      duration: '10 min',
      content: 'How Argentina defended France\'s transitions.',
      keyPoints: ['Immediate pressing on loss', 'Drop to defensive block', 'Ball recovery triggers'],
      quizQuestions: [],
      order: 4,
    },
  ];
}