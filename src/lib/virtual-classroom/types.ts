export interface MatchModule {
  id: string;
  matchId: string;
  title: string;
  subtitle: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  thumbnail: string;
  description: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string; // e.g., "45 min"
  lessonCount: number;
  isLocked: boolean;
  isCompleted: boolean;
  progress: number; // 0-100
  createdAt: string;
}

export interface ModuleLesson {
  id: string;
  moduleId: string;
  title: string;
  duration: string;
  videoUrl?: string;
  content: string;
  keyPoints: string[];
  quizQuestions: QuizQuestion[];
  order: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}