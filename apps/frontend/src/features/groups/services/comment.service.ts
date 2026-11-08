import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export type CommentTarget = 'QUESTION' | 'FLASHCARD' | 'DECK' | 'GENERAL';
export type CommentKind = 'COMMENT' | 'HELP';

export interface CommentDTO {
  id: string;
  body: string;
  kind: CommentKind;
  resolved: boolean;
  helpful: boolean;
  targetType: CommentTarget;
  targetId: string | null;
  context: string | null;
  author: { id: string; name: string; nickname: string | null };
  isMine: boolean;
  createdAt: string;
  replies: CommentDTO[];
}

export interface CommentFilter {
  targetType?: CommentTarget;
  targetId?: string;
  open?: boolean;
}

export interface NewCommentInput {
  body: string;
  kind?: CommentKind;
  targetType?: CommentTarget;
  targetId?: string;
  context?: string;
  parentId?: string;
}

export const commentService = {
  async list(groupId: string, filter: CommentFilter = {}): Promise<CommentDTO[]> {
    const params = {
      targetType: filter.targetType,
      targetId: filter.targetId,
      open: filter.open ? 'true' : undefined,
    };
    const response = await api.get<ApiResponse<CommentDTO[]>>(`/groups/${groupId}/comments`, { params });
    return unwrapData(response);
  },

  async create(groupId: string, input: NewCommentInput): Promise<void> {
    await api.post(`/groups/${groupId}/comments`, input);
  },

  async remove(groupId: string, commentId: string): Promise<void> {
    await api.delete(`/groups/${groupId}/comments/${commentId}`);
  },

  async resolve(groupId: string, commentId: string, resolved: boolean): Promise<void> {
    await api.post(`/groups/${groupId}/comments/${commentId}/resolve`, { resolved });
  },

  async markHelpful(groupId: string, commentId: string): Promise<void> {
    await api.post(`/groups/${groupId}/comments/${commentId}/helpful`);
  },
};
