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
  access: { provider: string; expiresAt: string | null } | null;
  streak: number;
  questionsAnswered: number;
  essays: number;
  flashcards: number;
  sessions: number;
}

export interface AccessGrant {
  email: string;
  provider: string;
  expiresAt: string | null;
}

export interface ManualAccessEntry extends AccessGrant {
  hasAccount: boolean;
}

export interface Contact {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  createdAt: string;
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

  async getContacts(): Promise<{ total: number; contacts: Contact[] }> {
    const response = await api.get<ApiResponse<{ total: number; contacts: Contact[] }>>('/admin/contacts');
    return unwrapData(response);
  },

  async importContacts(text: string, source?: string): Promise<{ parsed: number; imported: number }> {
    const response = await api.post<ApiResponse<{ parsed: number; imported: number }>>('/admin/contacts/import', { text, source });
    return unwrapData(response);
  },

  async deleteContact(id: string): Promise<void> {
    await api.delete(`/admin/contacts/${id}`);
  },

  async listAccess(): Promise<ManualAccessEntry[]> {
    const response = await api.get<ApiResponse<ManualAccessEntry[]>>('/admin/access');
    return unwrapData(response);
  },

  async grantAccess(email: string, days?: number): Promise<AccessGrant> {
    const response = await api.post<ApiResponse<AccessGrant>>('/admin/access', { email, days });
    return unwrapData(response);
  },

  async revokeAccess(email: string): Promise<void> {
    await api.post('/admin/access/revoke', { email });
  },
};
