import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export interface SubjectDTO {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  children?: SubjectDTO[];
  parent?: SubjectDTO | null;
}

export interface ExamBoardDTO {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export const contentService = {
  async getSubjects(): Promise<SubjectDTO[]> {
    const response = await api.get<ApiResponse<SubjectDTO[]>>('/subjects');
    return unwrapData(response);
  },

  async getSubject(id: string): Promise<SubjectDTO> {
    const response = await api.get<ApiResponse<SubjectDTO>>(`/subjects/${id}`);
    return unwrapData(response);
  },

  async createSubject(data: { name: string; parentId?: string | null; order?: number }): Promise<SubjectDTO> {
    const response = await api.post<ApiResponse<SubjectDTO>>('/subjects', data);
    return unwrapData(response);
  },

  async updateSubject(id: string, data: { name?: string; parentId?: string | null; order?: number }): Promise<SubjectDTO> {
    const response = await api.put<ApiResponse<SubjectDTO>>(`/subjects/${id}`, data);
    return unwrapData(response);
  },

  async deleteSubject(id: string): Promise<void> {
    await api.delete(`/subjects/${id}`);
  },

  async getExamBoards(): Promise<ExamBoardDTO[]> {
    const response = await api.get<ApiResponse<ExamBoardDTO[]>>('/exam-boards');
    return unwrapData(response);
  },

  async createExamBoard(data: { name: string }): Promise<ExamBoardDTO> {
    const response = await api.post<ApiResponse<ExamBoardDTO>>('/exam-boards', data);
    return unwrapData(response);
  },

  async updateExamBoard(id: string, data: { name: string }): Promise<ExamBoardDTO> {
    const response = await api.put<ApiResponse<ExamBoardDTO>>(`/exam-boards/${id}`, data);
    return unwrapData(response);
  },

  async deleteExamBoard(id: string): Promise<void> {
    await api.delete(`/exam-boards/${id}`);
  },
};
