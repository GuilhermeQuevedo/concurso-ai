import { api, unwrapData } from '@/services/api';
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
    return unwrapData(response);
  },

  async generate(data: {
    subjectId: string;
    count: number;
    text?: string;
    documentId?: string;
  }): Promise<FlashcardDTO[]> {
    const response = await api.post<ApiResponse<FlashcardDTO[]>>('/flashcards/generate', data, {
      timeout: 600000,
    });
    return unwrapData(response);
  },

  async import(data: { subjectId: string; text: string }): Promise<{ imported: number; skipped: number }> {
    const response = await api.post<ApiResponse<{ imported: number; skipped: number }>>(
      '/flashcards/import',
      data,
    );
    return unwrapData(response);
  },

  async getDue(subjectId?: string): Promise<FlashcardDTO[]> {
    const params = subjectId ? { subjectId } : {};
    const response = await api.get<ApiResponse<FlashcardDTO[]>>('/flashcards/due', { params });
    return unwrapData(response);
  },

  async review(id: string, quality: number): Promise<FlashcardDTO> {
    const response = await api.patch<ApiResponse<FlashcardDTO>>(`/flashcards/${id}/review`, { quality });
    return unwrapData(response);
  },

  async list(subjectId?: string): Promise<FlashcardDTO[]> {
    const params = subjectId ? { subjectId } : {};
    const response = await api.get<ApiResponse<FlashcardDTO[]>>('/flashcards', { params });
    return unwrapData(response);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/flashcards/${id}`);
  },

  async getStats(): Promise<FlashcardStatsDTO> {
    const response = await api.get<ApiResponse<FlashcardStatsDTO>>('/flashcards/stats');
    return unwrapData(response);
  },
};
