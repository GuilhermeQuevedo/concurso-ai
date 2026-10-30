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
  mode?: 'standard' | 'cloze';
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  customFocus?: string;
}

export const DECK_COLORS = ['#2E8C82', '#F2A93B', '#121A33', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316'];

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

  async update(id: string, data: DeckInput): Promise<{ id: string; name: string }> {
    return unwrapData(await api.patch<ApiResponse<{ id: string; name: string }>>(`/flashcards/decks/${id}`, data));
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/flashcards/decks/${id}`);
  },

  async cards(deckId: string): Promise<FlashcardDTO[]> {
    return unwrapData(await api.get<ApiResponse<FlashcardDTO[]>>(`/flashcards/decks/${deckId}/cards`));
  },

  async addCard(deckId: string, card: { front: string; back: string }): Promise<FlashcardDTO> {
    return unwrapData(await api.post<ApiResponse<FlashcardDTO>>(`/flashcards/decks/${deckId}/cards`, card));
  },

  async updateCard(cardId: string, card: { front: string; back: string }): Promise<FlashcardDTO> {
    return unwrapData(await api.patch<ApiResponse<FlashcardDTO>>(`/flashcards/cards/${cardId}`, card));
  },

  async importCards(deckId: string, text: string): Promise<{ imported: number; skipped: number }> {
    return unwrapData(await api.post<ApiResponse<{ imported: number; skipped: number }>>(`/flashcards/decks/${deckId}/import`, { text }));
  },

  async studyCards(deckId: string, all = false): Promise<FlashcardDTO[]> {
    return unwrapData(await api.get<ApiResponse<FlashcardDTO[]>>(`/flashcards/decks/${deckId}/study`, { params: all ? { all: '1' } : {} }));
  },

  async study(deckId: string, all = false): Promise<FlashcardDTO[]> {
    return this.studyCards(deckId, all);
  },
};

export const flashcardService = {
  async getDue(subjectId?: string): Promise<FlashcardDTO[]> {
    return unwrapData(await api.get<ApiResponse<FlashcardDTO[]>>('/flashcards/due', { params: subjectId ? { subjectId } : {} }));
  },

  async review(id: string, quality: number): Promise<FlashcardDTO> {
    return unwrapData(await api.patch<ApiResponse<FlashcardDTO>>(`/flashcards/${id}/review`, { quality }));
  },

  async saveElaboration(id: string, elaboration: string): Promise<FlashcardDTO> {
    return unwrapData(await api.patch<ApiResponse<FlashcardDTO>>(`/flashcards/${id}/elaboration`, { elaboration }));
  },

  async getStats(): Promise<FlashcardStatsDTO> {
    return unwrapData(await api.get<ApiResponse<FlashcardStatsDTO>>('/flashcards/stats'));
  },

  async list(subjectId?: string): Promise<FlashcardDTO[]> {
    return unwrapData(await api.get<ApiResponse<FlashcardDTO[]>>('/flashcards', { params: subjectId ? { subjectId } : {} }));
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/flashcards/${id}`);
  },
};
