import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export interface RankingSummary {
  id: string;
  title: string;
  description: string | null;
  subjectId: string | null;
  createdAt: string;
  subject: { name: string } | null;
  _count: { participants: number };
}

export interface PendingRanking {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  document: { name: string; kind: string } | null;
  subject: { name: string } | null;
  createdBy: { name: string; email: string } | null;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar: string | null;
  correct: number;
  total: number;
  streak: number;
  score: number;
  isCurrentUser: boolean;
  position: number;
}

export interface Leaderboard {
  board: {
    id: string;
    title: string;
    description: string | null;
    subjectId: string | null;
    status: string;
    subject: { name: string } | null;
  };
  joined: boolean;
  entries: LeaderboardEntry[];
}

export const rankingService = {
  async listApproved(): Promise<RankingSummary[]> {
    const res = await api.get<ApiResponse<RankingSummary[]>>('/rankings');
    return unwrapData(res);
  },

  async suggest(input: {
    title: string;
    description?: string;
    documentId?: string;
    subjectId?: string;
  }): Promise<{ id: string }> {
    const res = await api.post<ApiResponse<{ id: string }>>('/rankings/suggest', input);
    return unwrapData(res);
  },

  async leaderboard(id: string): Promise<Leaderboard> {
    const res = await api.get<ApiResponse<Leaderboard>>(`/rankings/${id}/leaderboard`);
    return unwrapData(res);
  },

  async join(id: string): Promise<void> {
    await api.post(`/rankings/${id}/join`);
  },

  async leave(id: string): Promise<void> {
    await api.delete(`/rankings/${id}/join`);
  },

  async listPending(): Promise<PendingRanking[]> {
    const res = await api.get<ApiResponse<PendingRanking[]>>('/rankings/pending');
    return unwrapData(res);
  },

  async approve(id: string): Promise<void> {
    await api.post(`/rankings/${id}/approve`);
  },

  async reject(id: string): Promise<void> {
    await api.post(`/rankings/${id}/reject`);
  },
};
