import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export interface NotificationDTO {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  invite?: { id: string; status: 'PENDING' | 'ACCEPTED' | 'DECLINED' };
}

export interface NotificationList {
  unread: number;
  items: NotificationDTO[];
}

export const notificationService = {
  async list(): Promise<NotificationList> {
    const response = await api.get<ApiResponse<NotificationList>>('/notifications');
    return unwrapData(response);
  },

  async markAllRead(): Promise<void> {
    await api.post('/notifications/read-all');
  },

  async acceptInvite(inviteId: string): Promise<{ groupId: string }> {
    const response = await api.post<ApiResponse<{ groupId: string }>>(`/invites/${inviteId}/accept`);
    return unwrapData(response);
  },

  async declineInvite(inviteId: string): Promise<void> {
    await api.post(`/invites/${inviteId}/decline`);
  },
};
