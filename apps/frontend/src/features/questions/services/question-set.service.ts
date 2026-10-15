import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';
import type { QuestionDTO } from './question.service';

export type SetMode = 'STUDY' | 'EXAM';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface QuestionSetSummary {
  id: string;
  name: string;
  mode: SetMode;
  subject: { name: string } | null;
  createdAt: string;
  lastAttemptAt: string | null;
  total: number;
  answered: number;
}

export interface GenerateSetParams {
  name?: string;
  subjectId: string;
  quantity: number;
  examBoardId?: string;
  difficulty?: Difficulty;
  topic?: string;
  documentId?: string;
  mode?: SetMode;
}

export interface ManualQuestionInput {
  statement: string;
  alternatives: { letter: string; text: string }[];
  correctAnswer: string;
  explanation?: string;
  difficulty: Difficulty;
}

export interface CreateManualParams {
  name: string;
  subjectId: string;
  mode?: SetMode;
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

  async remove(id: string): Promise<void> {
    await api.delete(`/question-sets/${id}`);
  },
};
