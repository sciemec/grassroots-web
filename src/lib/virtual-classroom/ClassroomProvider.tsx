'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/lib/auth-store';

export interface Student {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  role: 'teacher' | 'student';
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
  isTeacher: boolean;
}

interface ClassroomState {
  isActive: boolean;
  students: Student[];
  messages: Message[];
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
  studentCount: number;
}

const ClassroomContext = createContext<ClassroomContextType | undefined>(undefined);

export function ClassroomProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState<ClassroomState>({
    isActive: false,
    students: [],
    messages: [],
    currentLesson: 'Introduction to Match Analysis',
    drawingMode: false,
    annotations: [],
    teacherId: null,
  });

  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    if (user) {
      setIsTeacher(user.role === 'coach' || (user.role as string) === 'teacher');
    }
  }, [user]);

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
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=1a5c2a&color=fff`,
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

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      userId: user.id,
      userName: user.name || 'Anonymous',
      text,
      timestamp: new Date(),
      isTeacher: isTeacher,
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage],
    }));
  };

  const toggleDrawing = () => {
    setState(prev => ({
      ...prev,
      drawingMode: !prev.drawingMode,
    }));
  };

  const addAnnotation = (data: any) => {
    setState(prev => ({
      ...prev,
      annotations: [...prev.annotations, data],
    }));
  };

  const setLesson = (lesson: string) => {
    setState(prev => ({
      ...prev,
      currentLesson: lesson,
    }));
  };

  const studentCount = state.students.filter(s => s.role === 'student').length;

  return (
    <ClassroomContext.Provider
      value={{
        state,
        joinClass,
        leaveClass,
        sendMessage,
        toggleDrawing,
        addAnnotation,
        setLesson,
        isTeacher,
        studentCount,
      }}
    >
      {children}
    </ClassroomContext.Provider>
  );
}

export function useClassroom() {
  const context = useContext(ClassroomContext);
  if (!context) {
    throw new Error('useClassroom must be used within a ClassroomProvider');
  }
  return context;
}