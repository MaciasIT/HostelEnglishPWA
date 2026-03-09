import { Phrase } from '@/store/useAppStore';

export type QuizMode = 'multiple' | 'truefalse' | 'scramble';

export type ScrambledWord = {
  id: string;
  text: string;
};

export type Question = {
  id: string;
  target: Phrase;
  options: string[];
  tfTranslation?: string;
  tfIsCorrect?: boolean;
  scrambledWords?: ScrambledWord[];
};

export type Feedback = {
  isCorrect: boolean;
  message: string;
};

export interface QuizGameState {
  score: number;
  totalQuestions: number;
  lives: number;
  streak: number;
  questionsHandledInLevel: number;
  isGameOver: boolean;
  isLevelComplete: boolean;
  currentQuestion: Question | null;
  feedback: Feedback | null;
}
