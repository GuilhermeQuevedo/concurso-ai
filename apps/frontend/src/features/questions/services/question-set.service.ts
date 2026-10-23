import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';
import type { QuestionDTO } from './question.service';

export type SetMode = 'STUDY' | 'EXAM';
export type QuestionType = 'MULTIPLE_4' | 'MULTIPLE_5' | 'TRUE_FALSE' | 'ESSAY' | 'MIXED';

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_4: 'Múltipla escolha (4 alternativas)',
  MULTIPLE_5: 'Múltipla escolha (5 alternativas)',
  TRUE_FALSE: 'Certo ou errado',
  ESSAY: 'Subjetiva',
  MIXED: 'Variadas',
};

export const QUESTION_TYPE_SHORT: Record<QuestionType, string> = {
  MULTIPLE_4: 'Múltipla escolha',
  MULTIPLE_5: 'Múltipla escolha',
  TRUE_FALSE: 'Certo ou errado',
  ESSAY: 'Subjetiva',
  MIXED: 'Variadas',
};
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface QuestionSetSummary {
  id: string;
  name: string;
  mode: SetMode;
  questionType: QuestionType;
  subject: { id: string; name: string } | null;
  createdAt: string;
  lastAttemptAt: string | null;
  total: number;
  answered: number;
}

export interface GenerateSetParams {
  name?: string;
  subjectId?: string;
  quantity: number;
  examBoardId?: string;
  difficulty?: Difficulty;
  topic?: string;
  documentId?: string;
  content?: string;
  questionType?: QuestionType;
  cloneStyle?: boolean;
  mode?: SetMode;
}

export interface ManualQuestionInput {
  statement: string;
  alternatives: { letter: string; text: string }[];
  correctAnswer?: string;
  explanation?: string;
  difficulty: Difficulty;
}

export interface CreateManualParams {
  name: string;
  subjectId?: string;
  mode?: SetMode;
  questionType?: QuestionType;
  questions: ManualQuestionInput[];
}

export interface QuestionSetDetail {
  id: string;
  name: string;
  mode: SetMode;
  questions: QuestionDTO[];
}

export const questionSetService = {
  async list(): Promise<QuestionSetSummary[]> {
    const res = await api.get<ApiResponse<QuestionSetSummary[]>>('/question-sets');
    return unwrapData(res);
  },

  async generate(params: GenerateSetParams): Promise<{ id: string; name: string }> {
    const res = await api.post<ApiResponse<{ id: string; name: string }>>(
      '/question-sets/generate',
      params,
    );
    return unwrapData(res);
  },

  async createManual(params: CreateManualParams): Promise<{ id: string; name: string }> {
    const res = await api.post<ApiResponse<{ id: string; name: string }>>(
      '/question-sets/manual',
      params,
    );
    return unwrapData(res);
  },

  async getById(id: string): Promise<QuestionSetDetail> {
    const res = await api.get<ApiResponse<QuestionSetDetail>>(`/question-sets/${id}`);
    return unwrapData(res);
  },

  async rename(id: string, name: string): Promise<void> {
    await api.patch(`/question-sets/${id}`, { name });
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/question-sets/${id}`);
  },
};
