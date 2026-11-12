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

export interface AdminPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  isMasked?: boolean;
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

export interface AdminUsersResponse {
  users: AdminUser[];
  pagination: AdminPagination;
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
  notes?: string | null;
  isMasked?: boolean;
  unsubscribed?: boolean;
  createdAt: string;
}

export interface AdminContactsResponse {
  contacts: Contact[];
  pagination: AdminPagination;
}

export interface ImportContactsPayload {
  text: string;
  source?: string;
  legalBasis: 'CONSENT' | 'LEGITIMATE_INTEREST' | 'PRE_CONTRACTUAL';
  consentProofNotes: string;
  legitimateInterestAssessmentRef?: string;
}

export const adminService = {
  async getOverview(): Promise<AdminOverview> {
    const response = await api.get<ApiResponse<AdminOverview>>('/admin/overview');
    return unwrapData(response);
  },

  async getUsers(page = 1, limit = 50): Promise<AdminUsersResponse> {
    const response = await api.get<ApiResponse<AdminUsersResponse>>('/admin/users', {
      params: { page, limit },
    });
    return unwrapData(response);
  },

  async revealUser(userId: string, justification: string): Promise<AdminUser> {
    const response = await api.post<ApiResponse<AdminUser>>(`/admin/users/${userId}/reveal`, { justification });
    return unwrapData(response);
  },

  async getContacts(page = 1, limit = 50): Promise<AdminContactsResponse> {
    const response = await api.get<ApiResponse<AdminContactsResponse>>('/admin/contacts', {
      params: { page, limit },
    });
    return unwrapData(response);
  },

  async revealContact(contactId: string, justification: string): Promise<Contact> {
    const response = await api.post<ApiResponse<Contact>>(`/admin/contacts/${contactId}/reveal`, { justification });
    return unwrapData(response);
  },

  async importContacts(
    payload: ImportContactsPayload | string,
    source?: string,
  ): Promise<{ parsed: number; imported: number; skippedSuppressed?: number }> {
    const body: ImportContactsPayload =
      typeof payload === 'string'
        ? {
            text: payload,
            source,
            legalBasis: 'CONSENT',
            consentProofNotes: 'Importação manual via painel de administração',
          }
        : payload;

    const response = await api.post<ApiResponse<{ parsed: number; imported: number; skippedSuppressed?: number }>>(
      '/admin/contacts/import',
      body,
    );
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
