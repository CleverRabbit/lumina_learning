import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Lesson, UserProgress, AppSettings, UserProfile } from './types';
import { initialLessons } from './curriculum';
import { logger } from './logger';

interface AppState {
  lessons: Lesson[];
  progress: UserProgress;
  settings: AppSettings;
  curriculumPrompt: string;
  
  // Actions
  updateLesson: (lesson: Lesson) => void;
  completeLesson: (lessonId: string, xp: number) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateCurriculumPrompt: (prompt: string) => void;
  addXP: (amount: number) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateProgress: (progress: Partial<UserProgress>) => void;
  resetProgress: () => void;
  reorderLessons: (newOrder: Lesson[]) => void;
  clearLogs: () => void;
}

export const CURRICULUM_JSON_FORMAT = `
Верни строго JSON массив объектов:
[
  {
    "id": "unique-id",
    "title": "Название урока",
    "description": "Краткое описание того, чему научится ребенок",
    "order": 1,
    "xpReward": 100,
    "difficulty": "easy" | "medium" | "hard"
  }
]`;

export const DEFAULT_CURRICULUM_PROMPT = `Создай учебный план подготовки к школе для ребенка 5-7 лет по стандартам РФ. 
План должен включать 10-12 уроков, охватывающих:
1. Основы чтения (буквы, слоги, простые слова).
2. Математика (счет до 20, простые задачи, фигуры).
3. Окружающий мир (времена года, животные, профессии).
4. Логика и внимание.
5. Подготовка руки к письму.`;

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      lessons: initialLessons,
      progress: {
        xp: 0,
        level: 1,
        streak: 0,
        lastActive: new Date().toISOString(),
        completedLessons: [],
        badges: [],
        profile: {
          name: '',
          age: 6,
          gender: 'other',
          interests: [],
          targetLevel: 'beginner',
          questionnaireCompleted: false,
        },
        aiRecommendations: [],
        forecast: [],
      },
      settings: {
        geminiKey: '',
        openRouterKey: '',
        useOpenRouter: false,
        offlineMode: false,
        theme: 'system',
      },
      curriculumPrompt: DEFAULT_CURRICULUM_PROMPT,

      updateLesson: (lesson) => set((state) => ({
        lessons: state.lessons.map((l) => l.id === lesson.id ? lesson : l)
      })),

      updateCurriculumPrompt: (curriculumPrompt) => set({ curriculumPrompt }),

      clearLogs: () => {
        logger.clear();
        set((state) => ({ ...state })); // Trigger re-render
      },

      updateProgress: (newProgress) => set((state) => ({
        progress: { ...state.progress, ...newProgress }
      })),

      updateProfile: (profile) => set((state) => ({
        progress: {
          ...state.progress,
          profile: { 
            ...(state.progress.profile || {
              name: '',
              age: 6,
              gender: 'other',
              interests: [],
              targetLevel: 'beginner',
              questionnaireCompleted: false,
            }), 
            ...profile 
          }
        }
      })),

      completeLesson: (lessonId, xp) => set((state) => {
        const alreadyCompleted = state.progress.completedLessons.includes(lessonId);
        if (alreadyCompleted) return state;

        const newCompleted = [...state.progress.completedLessons, lessonId];
        const newXP = state.progress.xp + xp;
        const newLevel = Math.floor(newXP / 1000) + 1;
        
        return {
          progress: {
            ...state.progress,
            completedLessons: newCompleted,
            xp: newXP,
            level: newLevel,
            lastActive: new Date().toISOString(),
          }
        };
      }),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      addXP: (amount) => set((state) => {
        const newXP = state.progress.xp + amount;
        const newLevel = Math.floor(newXP / 1000) + 1;
        return {
          progress: { ...state.progress, xp: newXP, level: newLevel }
        };
      }),

      resetProgress: () => set({
        lessons: initialLessons,
        progress: {
          xp: 0,
          level: 1,
          streak: 0,
          lastActive: new Date().toISOString(),
          completedLessons: [],
          badges: [],
          profile: {
            name: '',
            age: 6,
            gender: 'other',
            interests: [],
            targetLevel: 'beginner',
            questionnaireCompleted: false,
          },
          aiRecommendations: [],
          forecast: [],
        }
      }),

      reorderLessons: (newOrder) => set({ lessons: newOrder }),
    }),
    {
      name: 'lumina-storage',
    }
  )
);
