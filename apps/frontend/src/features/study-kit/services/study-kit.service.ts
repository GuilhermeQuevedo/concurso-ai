import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export type StudyKitOutput = 'summary' | 'flashcards' | 'questions';

export interface GenerateStudyKitInput {
  documentId: string;
  subjectId: string;
  outputs: StudyKitOutput[];
  flashcardsCount?: number;
  questionsCount?: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  topic?: string;
}

export interface StudyKitResult {
  summary: string | null;
  summaryDocumentId: string | null;
  flashcards: number;
  questions: number;
}

export const studyKitService = {
  async generate(input: GenerateStudyKitInput): Promise<StudyKitResult> {
    const response = await api.post<ApiResponse<StudyKitResult>>('/study-kit/generate', input, {
      timeout: 600000,
    });
    return unwrapData(response);
  },
};
