import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export interface FlashcardDTO {
  id: string;
  userId: string;
  subjectId: string;
  front: string;
  back: string;
  source?: string | null;
  elaboration?: string | null;
  interval: number;
  easeFactor: number;
  repetition: number;
  nextReview: string;
  createdAt: string;
  subject?: { id: string; name: string };
}

export interface DeckDTO {
  id: string;
  name: string;
  topic: string | null;
  color: string;
  subject: { id: string; name: string } | null;
  total: number;
  due: number;
  confidence: number;
  nextReview: string | null;
  createdAt: string;
}

export interface DeckInput {
  name: string;
  subjectName?: string;
  topic?: string;
  color?: string;
}

export interface GenerateDeckInput extends DeckInput {
  text?: string;
  documentId?: string;
  count?: number;
}

export const DECK_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export interface FlashcardStatsDTO {
  total: number;
  due: number;
}

export const deckService = {
  async list(): Promise<DeckDTO[]> {
    return unwrapData(await api.get<ApiResponse<DeckDTO[]>>('/flashcards/decks'));
  },

  async create(data: DeckInput & { cards: { front: string; back: string }[] }): Promise<{ id: string; name: string }> {
    return unwrapData(await api.post<ApiResponse<{ id: string; name: string }>>('/flashcards/decks', data));
  },

  async generate(data: GenerateDeckInput): Promise<{ id: string; name: string }> {
    return unwrapData(await api.post<ApiResponse<{ id: string; name: string }>>('/flashcards/decks/generate', data));
  },

  async update(id: string, data: DeckInput): Promise<void> {
    await api.patch(`/flashcards/decks/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/flashcards/decks/${id}`);
  },

  async cards(id: string): Promise<FlashcardDTO[]> {
    return unwrapData(await api.get<ApiResponse<FlashcardDTO[]>>(`/flashcards/decks/${id}/cards`));
  },

  async addCard(id: string, card: { front: string; back: string }): Promise<FlashcardDTO> {
    return unwrapData(await api.post<ApiResponse<FlashcardDTO>>(`/flashcards/decks/${id}/cards`, card));
  },

  async updateCard(cardId: string, card: { front: string; back: string }): Promise<FlashcardDTO> {
    return unwrapData(await api.patch<ApiResponse<FlashcardDTO>>(`/flashcards/cards/${cardId}`, card));
  },

  async importCards(id: string, text: string): Promise<{ imported: number; skipped: number }> {
    return unwrapData(await api.post<ApiResponse<{ imported: number; skipped: number }>>(`/flashcards/decks/${id}/import`, { text }));
  },

  async study(id: string, all = false): Promise<FlashcardDTO[]> {
    return unwrapData(await api.get<ApiResponse<FlashcardDTO[]>>(`/flashcards/decks/${id}/study`, { params: all ? { all: 1 } : {} }));
  },
};

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

  async saveElaboration(id: string, elaboration: string): Promise<FlashcardDTO> {
    const response = await api.patch<ApiResponse<FlashcardDTO>>(`/flashcards/${id}/elaboration`, { elaboration });
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
