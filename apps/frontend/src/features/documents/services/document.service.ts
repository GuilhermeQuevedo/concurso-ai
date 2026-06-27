import { api } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export interface DocumentDTO {
  id: string;
  name: string;
  type: string;
  subjectId: string | null;
  createdAt: string;
}

export const documentService = {
  async upload(file: File, subjectId?: string): Promise<DocumentDTO> {
    const formData = new FormData();
    formData.append('file', file);
    if (subjectId) formData.append('subjectId', subjectId);

    const response = await api.post<ApiResponse<DocumentDTO>>('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data!;
  },

  async list(subjectId?: string): Promise<DocumentDTO[]> {
    const params = subjectId ? { subjectId } : {};
    const response = await api.get<ApiResponse<DocumentDTO[]>>('/documents', { params });
    return response.data.data!;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },
};
