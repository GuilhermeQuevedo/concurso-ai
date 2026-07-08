import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export type StudyTaskType = 'STUDY' | 'REVIEW' | 'ESSAY' | 'MOCK_EXAM';

export interface StudyTask {
  id: string;
  contestId: string | null;
  syllabusItemId: string | null;
  date: string;
  type: StudyTaskType;
  title: string;
  discipline: string | null;
  duration: number;
  completed: boolean;
}

export interface GeneratePlanInput {
  contestId: string;
  minutesPerDay: number;
  studyWeekdays: number[];
}

export interface GeneratePlanResult {
  created: number;
  firstDay: string;
  examDate: string;
}

export const studyTaskService = {
  async generatePlan(data: GeneratePlanInput): Promise<GeneratePlanResult> {
    const response = await api.post<ApiResponse<GeneratePlanResult>>('/study-tasks/generate', data);
    return unwrapData(response);
  },

  async list(from: string, to: string): Promise<StudyTask[]> {
    const response = await api.get<ApiResponse<StudyTask[]>>('/study-tasks', {
      params: { from, to },
    });
    return unwrapData(response);
  },

  async today(): Promise<StudyTask[]> {
    const response = await api.get<ApiResponse<StudyTask[]>>('/study-tasks/today');
    return unwrapData(response);
  },

  async setCompleted(id: string, completed: boolean): Promise<StudyTask> {
    const response = await api.patch<ApiResponse<StudyTask>>(`/study-tasks/${id}`, { completed });
    return unwrapData(response);
  },

  async clearPlan(contestId: string): Promise<void> {
    await api.delete(`/study-tasks/contest/${contestId}`);
  },
};
