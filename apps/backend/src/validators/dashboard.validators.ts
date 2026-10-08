import { z } from 'zod';

export const setDailyGoalSchema = z.object({
  body: z.object({
    dailyGoal: z.number().int().min(1).max(500),
  }),
});

export type SetDailyGoalDTO = z.infer<typeof setDailyGoalSchema>['body'];
