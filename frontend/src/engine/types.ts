export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface Question {
  id: string;
  difficulty: Difficulty;
  prompt: string;
  choices: string[];
  answerIndex: number;
  source: string;
  explanation?: string;
}

export interface QuizPack {
  topic: string;
  quizId: string;
  title: string;
  subtitle: string;
  questions: Question[];
}

export interface ScoreEntry {
  username: string;
  score: number;
  quizId: string;
  timestamp: number;
  durationMs: number;
}

export interface QuizResult {
  quizId: string;
  correct: number;
  total: number;
  durationMs: number;
  answers: { questionId: string; picked: number; correct: boolean }[];
}
