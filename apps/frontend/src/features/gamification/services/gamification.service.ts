import { api } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export interface AchievementDTO {
  type: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface GamificationProfile {
  streak: { current: number; longest: number };
  achievements: AchievementDTO[];
  availableAchievements: AchievementDTO[];
  stats: {
    totalAnswered: number;
    currentStreak: number;
    hadPerfectSession: boolean;
    totalFlashcards: number;
  };
}

export const gamificationService = {
  async getProfile(): Promise<GamificationProfile> {
    const response = await api.get<ApiResponse<GamificationProfile>>('/gamification/profile');
    return response.data.data!;
  },
};
