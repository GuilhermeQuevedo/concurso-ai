import { api } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export interface FlashcardDTO {
  id: string;
  userId: string;
  subjectId: string;
  front: string;
  back: string;
  interval: number;
  easeFactor: number;
  repetition: number;
  nextReview: string;
  createdAt: string;
  subject?: { id: string; name: string };
}

export interface FlashcardStatsDTO {
  total: number;
  due: number;
}

export const flashcardService = {
  async create(data: { subjectId: string; front: string; back: string }): Promise<FlashcardDTO> {
    const response = await api.post<ApiResponse<FlashcardDTO>>('/flashcards', data);
    return response.data.data!;
  },

  async getDue(subjectId?: string): Promise<FlashcardDTO[]> {
    const params = subjectId ? { subjectId } : {};
    const response = await api.get<ApiResponse<FlashcardDTO[]>>('/flashcards/due', { params });
    return response.data.data!;
  },

  async review(id: string, quality: number): Promise<FlashcardDTO> {
    const response = await api.patch<ApiResponse<FlashcardDTO>>(`/flashcards/${id}/review`, { quality });
    return response.data.data!;
  },

  async list(subjectId?: string): Promise<FlashcardDTO[]> {
    const params = subjectId ? { subjectId } : {};
    const response = await api.get<ApiResponse<FlashcardDTO[]>>('/flashcards', { params });
    return response.data.data!;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/flashcards/${id}`);
  },

  async getStats(): Promise<FlashcardStatsDTO> {
    const response = await api.get<ApiResponse<FlashcardStatsDTO>>('/flashcards/stats');
    return response.data.data!;
  },
};
