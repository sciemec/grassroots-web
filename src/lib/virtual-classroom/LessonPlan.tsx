'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Play, Clock } from 'lucide-react';
import { useClassroom } from './ClassroomProvider';

interface Lesson {
  id: string;
  title: string;
  duration: string;
  content: string;
  keyPoints: string[];
  isExpanded: boolean;
}

export function LessonPlan() {
  const { state, setLesson, isTeacher } = useClassroom();
  const [lessons, setLessons] = useState<Lesson[]>([
    {
      id: '1',
      title: 'Pre-Match: Tactical Setup',
      duration: '10 min',
      content: 'Analyze team formations, key players, and tactical approach.',
      keyPoints: ['Team shape', 'Key matchups', 'Set piece threats'],
      isExpanded: false,
    },
    {
      id: '2',
      title: 'Phase 1: Regaining Possession',
      duration: '15 min',
      content: 'How the winning team pressed and won the ball back.',
      keyPoints: ['Pressing triggers', 'Defensive shape', 'Transition moments'],
      isExpanded: false,
    },
    {
      id: '3',
      title: 'Phase 2: Building the Attack',
      duration: '15 min',
      content: 'Building from the back and progressing through the thirds.',
      keyPoints: ['Build-up patterns', 'Player rotation', 'Finding space'],
      isExpanded: false,
    },
    {
      id: '4',
      title: 'Phase 3: Finishing',
      duration: '15 min',
      content: 'Final third decision making and goal scoring.',
      keyPoints: ['Crossing patterns', 'Movement in box', 'Decision making'],
      isExpanded: false,
    },
    {
      id: '5',
      title: 'Post-Match: Key Takeaways',
      duration: '5 min',
      content: 'Review what we learned and what to work on.',
      keyPoints: ['Key learnings', 'Training focus', 'Next steps'],
      isExpanded: false,
    },
  ]);

  const toggleLesson = (id: string) => {
    setLessons(prev =>
      prev.map(lesson =>
        lesson.id === id
          ? { ...lesson, isExpanded: !lesson.isExpanded }
          : lesson
      )
    );
  };

  const startLesson = (lesson: Lesson) => {
    setLesson(lesson.title);
  };

  if (!state.isActive) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-gradient-to-r from-[#1a5c2a] to-[#0d3d1a] text-white flex items-center gap-2">
        <BookOpen size={14} />
        <span className="text-xs font-bold">Lesson Plan</span>
        {isTeacher && (
          <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full ml-auto">
            Teacher Mode
          </span>
        )}
      </div>

      {/* Lesson List */}
      <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="border border-gray-100 rounded-lg overflow-hidden"
          >
            {/* Lesson Header */}
            <button
              onClick={() => toggleLesson(lesson.id)}
              className="w-full px-2.5 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {lesson.isExpanded ? (
                  <ChevronDown size={12} className="text-gray-400" />
                ) : (
                  <ChevronRight size={12} className="text-gray-400" />
                )}
                <span className="text-xs font-medium text-gray-800">
                  {lesson.title}
                </span>
                <span className="text-[8px] text-gray-400 flex items-center gap-0.5">
                  <Clock size={8} />
                  {lesson.duration}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startLesson(lesson);
                }}
                className="p-1 bg-[#1a5c2a] text-white rounded hover:bg-[#0d3d1a] transition-colors"
              >
                <Play size={10} />
              </button>
            </button>

            {/* Expanded Content */}
            {lesson.isExpanded && (
              <div className="px-2.5 pb-2.5 border-t border-gray-100 pt-2">
                <p className="text-[10px] text-gray-600 mb-1.5">{lesson.content}</p>
                <div className="flex flex-wrap gap-1">
                  {lesson.keyPoints.map((point, i) => (
                    <span
                      key={i}
                      className="text-[8px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Current Lesson Indicator */}
      {state.currentLesson && (
        <div className="px-3 py-1.5 border-t border-gray-100 bg-amber-50">
          <p className="text-[9px] text-amber-700">
            📖 Now teaching: <span className="font-bold">{state.currentLesson}</span>
          </p>
        </div>
      )}
    </div>
  );
}