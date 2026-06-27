'use client';

import { User, Crown, Circle, Users } from 'lucide-react';
import { useClassroom } from './ClassroomProvider';

export function StudentRoster() {
  const { state } = useClassroom();

  if (!state.isActive) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 text-center">
        <Users size={20} className="mx-auto text-gray-300 mb-2" />
        <p className="text-xs text-gray-400">No active classroom</p>
      </div>
    );
  }

  const teacher = state.students.find(s => s.role === 'teacher');
  const students = state.students.filter(s => s.role === 'student');

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-gradient-to-r from-[#1a5c2a] to-[#0d3d1a] text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={14} />
          <span className="text-xs font-bold">Class Roster</span>
        </div>
        <span className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded-full">
          {state.students.length} online
        </span>
      </div>

      {/* Teacher */}
      {teacher && (
        <div className="px-3 py-2 border-b border-gray-100 bg-amber-50 flex items-center gap-2">
          <div className="relative">
            <img
              src={teacher.avatar}
              alt={teacher.name}
              className="w-8 h-8 rounded-full"
            />
            <Circle
              size={8}
              className="absolute -bottom-0.5 -right-0.5 text-green-500 fill-green-500"
            />
          </div>
          <div className="flex-1">
            <span className="text-sm font-bold text-gray-900">{teacher.name}</span>
            <div className="flex items-center gap-1">
              <Crown size={10} className="text-amber-500" />
              <span className="text-[8px] text-amber-600 font-bold">Coach</span>
            </div>
          </div>
        </div>
      )}

      {/* Students */}
      <div className="p-2 max-h-48 overflow-y-auto">
        {students.length === 0 ? (
          <p className="text-[10px] text-gray-400 text-center py-4">
            No students in class yet
          </p>
        ) : (
          students.map((student) => (
            <div
              key={student.id}
              className="flex items-center gap-2 py-1.5 px-1.5 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="relative">
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-7 h-7 rounded-full"
                />
                <Circle
                  size={8}
                  className="absolute -bottom-0.5 -right-0.5 text-green-500 fill-green-500"
                />
              </div>
              <span className="text-xs text-gray-700 flex-1">{student.name}</span>
              <span className="text-[8px] text-gray-400">Student</span>
            </div>
          ))
        )}
      </div>

      {/* Footer Stats */}
      <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50 flex justify-between text-[8px] text-gray-500">
        <span>{students.length} students</span>
        <span>{state.messages.length} messages</span>
      </div>
    </div>
  );
}