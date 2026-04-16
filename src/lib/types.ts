export type LessonStatus = 'locked' | 'available' | 'completed';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content?: string; // Markdown
  parentChecklist?: ChecklistItem[];
  status: LessonStatus;
  order: number;
  xpReward: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ChecklistItem {
  task: string;
  description: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface UserProgress {
  xp: number;
  level: number;
  streak: number;
  lastActive: string;
  completedLessons: string[];
  badges: string[];
  profile?: UserProfile;
  aiRecommendations?: string[];
  forecast?: LearningForecast[];
}

export interface LearningForecast {
  category: string;
  prediction: string;
  progress: number; // 0 to 100
}

export interface ReadinessTestResult {
  category: string;
  score: number; // 0 to 100
  observations: string;
}

export interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  interests: string[];
  targetLevel: 'beginner' | 'intermediate' | 'advanced';
  questionnaireCompleted: boolean;
  readinessAssessment?: ReadinessTestResult[];
}

export interface AppSettings {
  geminiKey: string;
  openRouterKey: string;
  useOpenRouter: boolean;
  offlineMode: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: any;
}
