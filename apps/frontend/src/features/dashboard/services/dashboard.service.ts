import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface StreakSummary {
  current: number;
  longest: number;
  shields: number;
  shieldedDates: string[];
}

export interface DashboardSummary {
  streak: StreakSummary;
  heatmap: HeatmapDay[];
  goal: { dailyQuestions: number; todayQuestions: number; todayStudyMinutes: number };
  averages: {
    questionsLast30: number;
    questionsLast7: number;
    activeDaysLast30: number;
    perActiveDay: number;
  };
}

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const response = await api.get<ApiResponse<DashboardSummary>>('/dashboard');
    return unwrapData(response);
  },

  async setDailyGoal(dailyGoal: number): Promise<{ dailyGoal: number }> {
    const response = await api.patch<ApiResponse<{ dailyGoal: number }>>('/dashboard/daily-goal', {
      dailyGoal,
    });
    return unwrapData(response);
  },
};
