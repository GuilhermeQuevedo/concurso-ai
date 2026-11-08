import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export type ShareType = 'DECK' | 'SCHEDULE' | 'CONTEST';

export interface ShareDTO {
  id: string;
  type: ShareType;
  title: string;
  summary: string;
  sharedBy: { id: string; name: string; nickname: string | null };
  isMine: boolean;
  createdAt: string;
}

export type ShareDetailDTO =
  | { type: 'DECK'; title: string; cards: { front: string; back: string }[] }
  | {
      type: 'CONTEST';
      title: string;
      organization: string | null;
      role: string | null;
      examBoard: string | null;
      examDate: string | null;
      topics: { discipline: string; topic: string }[];
    }
  | { type: 'SCHEDULE'; title: string; examDate: string; dailyHours: number; subjects: string[] };

export const shareService = {
  async list(groupId: string): Promise<ShareDTO[]> {
    const response = await api.get<ApiResponse<ShareDTO[]>>(`/groups/${groupId}/shares`);
    return unwrapData(response);
  },

  async create(groupId: string, type: ShareType, refId: string): Promise<void> {
    await api.post(`/groups/${groupId}/shares`, { type, refId });
  },

  async remove(groupId: string, shareId: string): Promise<void> {
    await api.delete(`/groups/${groupId}/shares/${shareId}`);
  },

  async detail(groupId: string, shareId: string): Promise<ShareDetailDTO> {
    const response = await api.get<ApiResponse<ShareDetailDTO>>(`/groups/${groupId}/shares/${shareId}`);
    return unwrapData(response);
  },

  async copy(groupId: string, shareId: string): Promise<{ type: ShareType; id: string }> {
    const response = await api.post<ApiResponse<{ type: ShareType; id: string }>>(`/groups/${groupId}/shares/${shareId}/copy`);
    return unwrapData(response);
  },
};
