import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export interface AdminOverview {
  users: { total: number; newLast7: number; newLast30: number };
  subscriptions: { active: number };
  engagement: {
    questionsAnswered: number;
    essays: number;
    flashcards: number;
    sessions: number;
    contests: number;
  };
  revenue: { receivedCents: number; paymentsCount: number };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  activeSubscriber: boolean;
  streak: number;
  questionsAnswered: number;
  essays: number;
  flashcards: number;
  sessions: number;
}

export const adminService = {
  async getOverview(): Promise<AdminOverview> {
    const response = await api.get<ApiResponse<AdminOverview>>('/admin/overview');
    return unwrapData(response);
  },

  async getUsers(): Promise<AdminUser[]> {
    const response = await api.get<ApiResponse<AdminUser[]>>('/admin/users');
    return unwrapData(response);
  },
};
