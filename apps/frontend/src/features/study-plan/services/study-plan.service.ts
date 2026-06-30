import { api } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export interface StudyPlanItemDTO {
  id: string;
  subjectId: string;
  dayOfWeek: number;
  duration: number;
  completed: boolean;
  subject: { id: string; name: string };
}

export interface StudyPlanDTO {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
  items: StudyPlanItemDTO[];
  createdAt: string;
}

export interface SubjectSuggestion {
  subjectId: string;
  name: string;
  accuracy: number;
  total: number;
}

export const studyPlanService = {
  async create(data: {
    name: string;
    startDate: string;
    endDate: string;
    items: { subjectId: string; dayOfWeek: number; duration: number }[];
  }): Promise<StudyPlanDTO> {
    const response = await api.post<ApiResponse<StudyPlanDTO>>('/study-plans', data);
    return response.data.data!;
  },

  async getActive(): Promise<StudyPlanDTO | null> {
    const response = await api.get<ApiResponse<StudyPlanDTO | null>>('/study-plans/active');
    return response.data.data ?? null;
  },

  async list(): Promise<StudyPlanDTO[]> {
    const response = await api.get<ApiResponse<StudyPlanDTO[]>>('/study-plans');
    return response.data.data!;
  },

  async toggleItem(itemId: string): Promise<StudyPlanItemDTO> {
    const response = await api.patch<ApiResponse<StudyPlanItemDTO>>(`/study-plans/items/${itemId}/toggle`);
    return response.data.data!;
  },

  async delete(planId: string): Promise<void> {
    await api.delete(`/study-plans/${planId}`);
  },

  async getSuggestions(): Promise<SubjectSuggestion[]> {
    const response = await api.get<ApiResponse<SubjectSuggestion[]>>('/study-plans/suggest');
    return response.data.data!;
  },
};
