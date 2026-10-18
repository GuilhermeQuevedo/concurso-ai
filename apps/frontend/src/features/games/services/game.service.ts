import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export type GameType = 'DUELO' | 'MEMORIA' | 'TRILHA' | 'PONTA' | 'RESGATE';

export interface RoundItem {
  id: string;
  prompt: string;
  options: { key: string; text: string }[];
  hints?: string[];
  retention?: number;
}

export interface Round {
  roundId: string;
  game: GameType;
  items: RoundItem[];
}

export interface GameAnswer {
  itemId?: string;
  choice?: string;
  ms?: number;
  cues?: number;
  a?: string;
  b?: string;
}

export interface GameResult {
  score: number;
  points: number;
  correct: number;
  total: number;
  passed: boolean;
  earnedToday: number;
  dailyCap: number;
  capReached: boolean;
}

export interface GameOverview {
  earnedToday: number;
  dailyCap: number;
  games: { game: GameType; label: string; best: number; plays: number }[];
}

export interface TrilhaNode {
  id: string;
  name: string;
  conquered: boolean;
  unlocked: boolean;
}

export interface TrilhaMap {
  nodes: TrilhaNode[];
  hidden: number;
}

export function apiMessage(error: unknown): string {
  const e = error as { response?: { data?: { error?: { message?: string } } } };
  return e.response?.data?.error?.message ?? 'Algo deu errado. Tente novamente.';
}

export const gameService = {
  async overview(): Promise<GameOverview> {
    return unwrapData(await api.get<ApiResponse<GameOverview>>('/games/overview'));
  },

  async trilha(): Promise<TrilhaMap> {
    return unwrapData(await api.get<ApiResponse<TrilhaMap>>('/games/trilha'));
  },

  async start(game: GameType, subjectId?: string): Promise<Round> {
    return unwrapData(await api.post<ApiResponse<Round>>('/games/rounds', { game, subjectId }));
  },

  async check(roundId: string, itemId: string, choice: string): Promise<{ correct: boolean; answer: string }> {
    return unwrapData(
      await api.post<ApiResponse<{ correct: boolean; answer: string }>>(`/games/rounds/${roundId}/check`, {
        itemId,
        choice,
      }),
    );
  },

  async finish(roundId: string, answers: GameAnswer[]): Promise<GameResult> {
    return unwrapData(
      await api.post<ApiResponse<GameResult>>(`/games/rounds/${roundId}/finish`, { answers }),
    );
  },
};
