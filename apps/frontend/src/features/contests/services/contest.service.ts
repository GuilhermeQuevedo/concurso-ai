import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export type ContestStatus = 'PLANNED' | 'STUDYING' | 'DONE' | 'ARCHIVED';

export interface TopicReview {
  id: string;
  index: number;
  intervalDays: number;
  scheduledFor: string;
  completedAt: string | null;
}

export interface SyllabusItem {
  id: string;
  contestId: string;
  subjectId: string | null;
  discipline: string;
  topic: string;
  order: number;
  studied: boolean;
  focus: boolean;
  importance: number;
  firstStudiedAt: string | null;
  reviews: TopicReview[];
}

export interface DisciplineStat {
  discipline: string;
  inFocus: boolean;
  total: number;
  studied: number;
  dueReviews: number;
  importance: number;
  priority: number;
}

export interface DueReview {
  id: string;
  index: number;
  intervalDays: number;
  scheduledFor: string;
  overdue: boolean;
  syllabusItemId: string;
  topic: string;
  discipline: string;
  contestId: string;
  contestName: string;
}

export interface ContestSummary {
  id: string;
  name: string;
  organization: string | null;
  examBoard: string | null;
  role: string | null;
  focus: string | null;
  examDate: string | null;
  status: ContestStatus;
  totalTopics: number;
  studiedTopics: number;
  createdAt: string;
}

export interface ContestDetail extends Omit<ContestSummary, 'totalTopics' | 'studiedTopics'> {
  editalDocumentId: string | null;
  syllabus: SyllabusItem[];
  disciplines: DisciplineStat[];
}

export interface CreateContestInput {
  name: string;
  organization?: string;
  examBoard?: string;
  role?: string;
  examDate?: string;
}

export const contestService = {
  async create(data: CreateContestInput): Promise<ContestDetail> {
    const response = await api.post<ApiResponse<ContestDetail>>('/contests', data);
    return unwrapData(response);
  },

  async createFromEdital(file: File, focus?: string): Promise<ContestDetail> {
    const formData = new FormData();
    formData.append('file', file);
    if (focus?.trim()) formData.append('focus', focus.trim());
    const response = await api.post<ApiResponse<ContestDetail>>('/contests/from-edital', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // IA local pode levar vários minutos num edital grande
      timeout: 600000,
    });
    return unwrapData(response);
  },

  async getTopicContent(itemId: string): Promise<{ id: string; content: string }> {
    const response = await api.get<ApiResponse<{ id: string; content: string }>>(
      `/contests/syllabus/${itemId}/content`,
      { timeout: 600000 },
    );
    return unwrapData(response);
  },

  async list(): Promise<ContestSummary[]> {
    const response = await api.get<ApiResponse<ContestSummary[]>>('/contests');
    return unwrapData(response);
  },

  async getById(id: string): Promise<ContestDetail> {
    const response = await api.get<ApiResponse<ContestDetail>>(`/contests/${id}`);
    return unwrapData(response);
  },

  async update(id: string, data: Partial<CreateContestInput> & { status?: ContestStatus }): Promise<ContestDetail> {
    const response = await api.patch<ApiResponse<ContestDetail>>(`/contests/${id}`, data);
    return unwrapData(response);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/contests/${id}`);
  },

  async setTopicStudied(itemId: string, studied: boolean): Promise<SyllabusItem> {
    const response = await api.patch<ApiResponse<SyllabusItem>>(`/contests/syllabus/${itemId}`, { studied });
    return unwrapData(response);
  },

  async setImportance(contestId: string, discipline: string, importance: number): Promise<ContestDetail> {
    const response = await api.patch<ApiResponse<ContestDetail>>(`/contests/${contestId}/importance`, {
      discipline,
      importance,
    });
    return unwrapData(response);
  },

  async completeReview(reviewId: string, completed: boolean): Promise<TopicReview> {
    const response = await api.post<ApiResponse<TopicReview>>(`/contests/reviews/${reviewId}/complete`, {
      completed,
    });
    return unwrapData(response);
  },

  async listDueReviews(): Promise<DueReview[]> {
    const response = await api.get<ApiResponse<DueReview[]>>('/contests/reviews/due');
    return unwrapData(response);
  },
};
