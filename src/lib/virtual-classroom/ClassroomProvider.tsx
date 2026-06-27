'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useAuthStore } from '@/lib/auth-store';

interface ClassroomState {
  isActive: boolean;
  students: any[];
  messages: any[];
  currentLesson: string;
  drawingMode: boolean;
  annotations: any[];
  teacherId: string | null;
}

interface ClassroomContextType {
  state: ClassroomState;
  joinClass: (matchId: string) => void;
  leaveClass: () => void;
  sendMessage: (text: string) => void;
  toggleDrawing: () => void;
  addAnnotation: (data: any) => void;
  setLesson: (lesson: string) => void;
  isTeacher: boolean;
}

const ClassroomContext = createContext<ClassroomContextType | undefined>(undefined);

export function ClassroomProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  const [state, setState] = useState<ClassroomState>({
    isActive: false,
    students: [],
    messages: [],
    currentLesson: 'Introduction to Match Analysis',
    drawingMode: false,
    annotations: [],
    teacherId: null,
  });

  const isTeacher = user?.role === 'coach' || user?.role === 'teacher';

  const joinClass = (matchId: string) => {
    if (!user) return;
    setState(prev => ({
      ...prev,
      isActive: true,
      students: [
        ...prev.students,
        {
          id: user.id,
          name: user.name || 'Anonymous',
          avatar: `https://ui-avatars.com/api/?name=${user.name || 'User'}&background=1a5c2a&color=fff`,
          isOnline: true,
          role: isTeacher ? 'teacher' : 'student',
        }
      ],
      teacherId: isTeacher ? user.id : prev.teacherId,
    }));
  };

  const leaveClass = () => {
    setState(prev => ({
      ...prev,
      isActive: false,
      students: [],
      messages: [],
    }));
  };

  const sendMessage = (text: string) => {
    if (!user || !state.isActive) return;
    setState(prev => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: `msg-${Date.now()}`,
          userId: user.id,
          userName: user.name || 'Anonymous',
          text,
          timestamp: new Date(),
          isTeacher,
        }
      ],
    }));
  };

  const toggleDrawing = () => {
    setState(prev => ({ ...prev, drawingMode: !prev.drawingMode }));
  };

  const addAnnotation = (data: any) => {
    setState(prev => ({ ...prev, annotations: [...prev.annotations, data] }));
  };

  const setLesson = (lesson: string) => {
    setState(prev => ({ ...prev, currentLesson: lesson }));
  };

  return (
    <ClassroomContext.Provider value={{
      state,
      joinClass,
      leaveClass,
      sendMessage,
      toggleDrawing,
      addAnnotation,
      setLesson,
      isTeacher,
    }}>
      {children}
    </ClassroomContext.Provider>
  );
}

export function useClassroom() {
  const context = useContext(ClassroomContext);
  if (!context) throw new Error('useClassroom must be used within ClassroomProvider');
  return context;
}