import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export interface PendingErrorDTO {
  id: string;
  questionId: string;
  statement: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  subjectName: string;
  subjectId: string;
  originTitle?: string;
  originType?: 'SIMULADO' | 'FLASHCARD';
  createdAt: string;
}

export interface SimuladoErrorItemPayload {
  questionId?: string;
  statement: string;
  alternatives?: Array<{ letter: string; text: string }>;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  subjectName?: string;
}

export interface RecordSimuladoErrorsPayload {
  simuladoTitle?: string;
  errors: SimuladoErrorItemPayload[];
}

export interface RecordSimuladoErrorsResponse {
  recorded: number;
  deckId: string | null;
  deckTitle: string;
}

export interface RemediationCardDTO {
  front: string;
  back: string;
  type: 'direct' | 'cloze' | 'true_false';
  explanation: string;
}

export interface GenerateRemediationPayload {
  questionId?: string;
  questionText?: string;
  userAnswer?: string;
  correctAnswer?: string;
  explanation?: string;
  subjectId?: string;
  deckName?: string;
}

export const errorNotebookService = {
  async listPending(): Promise<PendingErrorDTO[]> {
    const response = await api.get<ApiResponse<PendingErrorDTO[]>>('/error-notebook/pending');
    return unwrapData(response);
  },

  async markAsLearned(questionId: string): Promise<{ success: boolean }> {
    const response = await api.post<ApiResponse<{ success: boolean }>>(
      `/error-notebook/learned/${questionId}`,
    );
    return unwrapData(response);
  },

  async recordSimuladoErrors(
    payload: RecordSimuladoErrorsPayload,
  ): Promise<RecordSimuladoErrorsResponse> {
    const response = await api.post<ApiResponse<RecordSimuladoErrorsResponse>>(
      '/error-notebook/record-simulado-errors',
      payload,
    );
    return unwrapData(response);
  },

  async generateRemediation(
    payload: GenerateRemediationPayload,
  ): Promise<{ flashcards: RemediationCardDTO[]; deckId: string }> {
    const response = await api.post<ApiResponse<{ flashcards: RemediationCardDTO[]; deckId: string }>>(
      '/error-notebook/remediate',
      payload,
    );
    return unwrapData(response);
  },
};
