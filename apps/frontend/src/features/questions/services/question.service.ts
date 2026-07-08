import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export interface QuestionDTO {
  id: string;
  statement: string;
  alternatives: { letter: string; text: string }[];
  correctAnswer: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  explanation: string;
  comments: unknown[];
  subjectId: string;
  examBoardId: string | null;
  source: string;
  aiModel: string | null;
  createdAt: string;
  subject?: { id: string; name: string };
  examBoard?: { id: string; name: string; slug: string } | null;
}

export interface GenerateParams {
  subjectId: string;
  topic?: string;
  examBoardId?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  quantity: number;
}

export const questionService = {
  async generate(params: GenerateParams): Promise<QuestionDTO[]> {
    const response = await api.post<ApiResponse<QuestionDTO[]>>('/questions/generate', params);
    return unwrapData(response);
  },

  async getBySubject(subjectId: string): Promise<QuestionDTO[]> {
    const response = await api.get<ApiResponse<QuestionDTO[]>>(`/questions/subject/${subjectId}`);
    return unwrapData(response);
  },

  async getById(id: string): Promise<QuestionDTO> {
    const response = await api.get<ApiResponse<QuestionDTO>>(`/questions/${id}`);
    return unwrapData(response);
  },
};
