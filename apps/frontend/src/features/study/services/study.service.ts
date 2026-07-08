import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export interface StudySessionDTO {
  id: string;
  userId: string;
  subjectId: string | null;
  questionsCount: number;
  correctCount: number;
  totalTime: number;
  mode: 'STUDY' | 'EXAM';
  difficulty: string | null;
  examBoardId: string | null;
  createdAt: string;
}

export interface AttemptDTO {
  id: string;
  userId: string;
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
  createdAt: string;
}

export interface SubmitAnswerResponse {
  attempt: AttemptDTO;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}

export interface FinishSessionResponse {
  session: StudySessionDTO;
  attempts: AttemptDTO[];
  stats: {
    total: number;
    correct: number;
    wrong: number;
    accuracy: number;
    totalTime: number;
  };
}

export interface UserStatsDTO {
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  totalSessions: number;
  totalTimeSeconds: number;
}

export const studyService = {
  async createSession(data: {
    mode: 'STUDY' | 'EXAM';
    questionIds: string[];
    subjectId?: string;
    difficulty?: string;
    examBoardId?: string;
  }): Promise<{ session: StudySessionDTO; questionIds: string[] }> {
    const response = await api.post<ApiResponse<{ session: StudySessionDTO; questionIds: string[] }>>('/study/sessions', data);
    return unwrapData(response);
  },

  async submitAnswer(sessionId: string, data: {
    questionId: string;
    answer: string;
    timeSpent: number;
  }): Promise<SubmitAnswerResponse> {
    const response = await api.post<ApiResponse<SubmitAnswerResponse>>(`/study/sessions/${sessionId}/answer`, data);
    return unwrapData(response);
  },

  async finishSession(sessionId: string): Promise<FinishSessionResponse> {
    const response = await api.post<ApiResponse<FinishSessionResponse>>(`/study/sessions/${sessionId}/finish`);
    return unwrapData(response);
  },

  async toggleFavorite(questionId: string): Promise<{ favorited: boolean }> {
    const response = await api.post<ApiResponse<{ favorited: boolean }>>('/study/favorites', { questionId });
    return unwrapData(response);
  },

  async getStats(): Promise<UserStatsDTO> {
    const response = await api.get<ApiResponse<UserStatsDTO>>('/study/stats');
    return unwrapData(response);
  },

  async getHistory(): Promise<StudySessionDTO[]> {
    const response = await api.get<ApiResponse<StudySessionDTO[]>>('/study/history');
    return unwrapData(response);
  },
};
