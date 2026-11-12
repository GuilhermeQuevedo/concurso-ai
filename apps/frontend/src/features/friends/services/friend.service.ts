import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export interface FriendDTO {
  friendshipId: string;
  user: { id: string; name: string; nickname: string | null; level: number; tier: string };
}

export interface FriendRequestDTO {
  friendshipId: string;
  user: { id: string; name: string; nickname: string | null };
  createdAt: string;
}

export interface FriendOverviewDTO {
  friends: FriendDTO[];
  received: FriendRequestDTO[];
  sent: FriendRequestDTO[];
}

export const friendService = {
  async overview(): Promise<FriendOverviewDTO> {
    const response = await api.get<ApiResponse<FriendOverviewDTO>>('/friends');
    return unwrapData(response);
  },

  async code(): Promise<string> {
    const response = await api.get<ApiResponse<{ code: string }>>('/friends/code');
    return unwrapData(response).code;
  },

  async regenerateCode(): Promise<string> {
    const response = await api.post<ApiResponse<{ code: string }>>('/friends/code/regenerate');
    return unwrapData(response).code;
  },

  async request(identifier: string): Promise<{ accepted: boolean }> {
    const response = await api.post<ApiResponse<{ accepted: boolean }>>('/friends/requests', { identifier });
    return unwrapData(response);
  },

  async accept(friendshipId: string): Promise<void> {
    await api.post(`/friends/requests/${friendshipId}/accept`);
  },

  async decline(friendshipId: string): Promise<void> {
    await api.post(`/friends/requests/${friendshipId}/decline`);
  },

  async cancel(friendshipId: string): Promise<void> {
    await api.delete(`/friends/requests/${friendshipId}`);
  },

  async remove(friendshipId: string): Promise<void> {
    await api.delete(`/friends/${friendshipId}`);
  },
};
