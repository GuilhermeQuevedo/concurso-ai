import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export type DocumentKind =
  | 'EDITAL'
  | 'EMENTA'
  | 'CRONOGRAMA'
  | 'MATERIAL'
  | 'LISTA_QUESTOES'
  | 'OUTRO';

export const KIND_LABELS: Record<DocumentKind, string> = {
  EDITAL: 'Edital',
  EMENTA: 'Ementa / Plano de ensino',
  CRONOGRAMA: 'Cronograma',
  MATERIAL: 'Material / Apostila',
  LISTA_QUESTOES: 'Lista de questões',
  OUTRO: 'Outro',
};

export const KIND_OPTIONS: DocumentKind[] = [
  'EDITAL',
  'EMENTA',
  'CRONOGRAMA',
  'MATERIAL',
  'LISTA_QUESTOES',
  'OUTRO',
];

export interface DocumentDTO {
  id: string;
  name: string;
  type: string;
  kind: DocumentKind;
  subjectId: string | null;
  createdAt: string;
}

export interface UploadedDocumentDTO extends DocumentDTO {
  suggestedKind: DocumentKind;
  kindAutoDetected: boolean;
}

export const documentService = {
  async upload(
    file: File,
    options?: { subjectId?: string; kind?: DocumentKind },
  ): Promise<UploadedDocumentDTO> {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.subjectId) formData.append('subjectId', options.subjectId);
    if (options?.kind) formData.append('kind', options.kind);

    const response = await api.post<ApiResponse<UploadedDocumentDTO>>('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrapData(response);
  },

  async list(subjectId?: string): Promise<DocumentDTO[]> {
    const params = subjectId ? { subjectId } : {};
    const response = await api.get<ApiResponse<DocumentDTO[]>>('/documents', { params });
    return unwrapData(response);
  },

  async updateKind(id: string, kind: DocumentKind): Promise<DocumentDTO> {
    const response = await api.patch<ApiResponse<DocumentDTO>>(`/documents/${id}/kind`, { kind });
    return unwrapData(response);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },
};
