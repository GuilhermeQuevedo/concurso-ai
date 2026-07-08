import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export interface EssayCriterion {
  score: number;
  maxScore: number;
  comments: string;
}

export interface EssayCriteria {
  cac: EssayCriterion;
  ot: EssayCriterion;
  dlp: EssayCriterion;
}

export interface EssaySummary {
  id: string;
  title: string;
  theme: string;
  status: 'PENDING' | 'GRADING' | 'GRADED' | 'ERROR';
  score: number | null;
  fileName: string | null;
  createdAt: string;
}

export interface EssayDetail extends EssaySummary {
  content: string;
  fileUrl: string | null;
  feedback: string | null;
  criteria: EssayCriteria | null;
  competitionPoints?: number;
}

export const essayService = {
  async submit(data: { title: string; theme: string; content?: string; file?: File }): Promise<EssayDetail> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('theme', data.theme);
    if (data.content) formData.append('content', data.content);
    if (data.file) formData.append('file', data.file);

    const response = await api.post<ApiResponse<EssayDetail>>('/essays', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrapData(response);
  },

  async list(): Promise<EssaySummary[]> {
    const response = await api.get<ApiResponse<EssaySummary[]>>('/essays');
    return unwrapData(response);
  },

  async getById(id: string): Promise<EssayDetail> {
    const response = await api.get<ApiResponse<EssayDetail>>(`/essays/${id}`);
    return unwrapData(response);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/essays/${id}`);
  },
};
