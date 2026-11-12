import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export interface XpLevel {
  level: number;
  tier: { name: string; index: number; minLevel: number };
  xpIntoLevel: number;
  xpForNext: number;
  progress: number;
  maxed: boolean;
}

export interface XpSummary {
  totalXp: number;
  level: XpLevel;
  multiplier: number;
  today: { total: number; cap: number; bySource: Record<string, { earned: number; cap: number }> };
  weekXp: number;
}

export const xpService = {
  async get(): Promise<XpSummary> {
    const response = await api.get<ApiResponse<XpSummary>>('/gamification/xp');
    return unwrapData(response);
  },
};
