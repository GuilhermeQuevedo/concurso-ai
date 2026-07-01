import { api } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export interface GroupMemberDTO {
  userId: string;
  name: string;
  avatar: string | null;
}

export interface GroupDTO {
  id: string;
  name: string;
  code: string;
  description: string | null;
  createdById: string;
  myRole?: string;
  members: { user: GroupMemberDTO; role: string }[];
  _count?: { members: number };
  createdAt: string;
}

export interface RankingEntry {
  userId: string;
  name: string;
  avatar: string | null;
  weekPoints: number;
  totalPoints: number;
}

export interface FeedEntry {
  id: string;
  type: string;
  points: number;
  description: string;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null };
}

export const groupService = {
  async create(data: { name: string; description?: string }): Promise<GroupDTO> {
    const response = await api.post<ApiResponse<GroupDTO>>('/groups', data);
    return response.data.data!;
  },

  async join(code: string): Promise<GroupDTO> {
    const response = await api.post<ApiResponse<GroupDTO>>('/groups/join', { code });
    return response.data.data!;
  },

  async list(): Promise<GroupDTO[]> {
    const response = await api.get<ApiResponse<GroupDTO[]>>('/groups');
    return response.data.data!;
  },

  async getById(id: string): Promise<GroupDTO> {
    const response = await api.get<ApiResponse<GroupDTO>>(`/groups/${id}`);
    return response.data.data!;
  },

  async getRanking(id: string): Promise<RankingEntry[]> {
    const response = await api.get<ApiResponse<RankingEntry[]>>(`/groups/${id}/ranking`);
    return response.data.data!;
  },

  async getFeed(id: string): Promise<FeedEntry[]> {
    const response = await api.get<ApiResponse<FeedEntry[]>>(`/groups/${id}/feed`);
    return response.data.data!;
  },

  async leave(id: string): Promise<void> {
    await api.delete(`/groups/${id}/leave`);
  },
};
