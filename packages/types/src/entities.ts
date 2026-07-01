import { Difficulty, DocumentType, QuestionSource, Role, StudyMode } from './enums';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  role: Role;
  targetExam: string | null;
  targetRole: string | null;
  dailyGoal: number;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
  children?: Subject[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamBoard {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Alternative {
  letter: string;
  text: string;
}

export interface AlternativeComments {
  [letter: string]: string;
}

export interface Question {
  id: string;
  statement: string;
  alternatives: Alternative[];
  correctAnswer: string;
  difficulty: Difficulty;
  explanation: string;
  comments: AlternativeComments;
  subjectId: string;
  examBoardId: string | null;
  source: QuestionSource;
  aiModel: string | null;
  createdAt: string;
}

export interface QuestionAttempt {
  id: string;
  userId: string;
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
  createdAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  subjectId: string | null;
  questionsCount: number;
  correctCount: number;
  totalTime: number;
  mode: StudyMode;
  difficulty: Difficulty | null;
  examBoardId: string | null;
  createdAt: string;
}

export interface Document {
  id: string;
  userId: string;
  name: string;
  type: DocumentType;
  content: string;
  subjectId: string | null;
  createdAt: string;
}
