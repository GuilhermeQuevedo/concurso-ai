import { z } from 'zod';

export const generatePlanSchema = z.object({
  body: z.object({
    contestId: z.string().min(1),
    minutesPerDay: z.number().int().min(30).max(720).default(120),
    studyWeekdays: z.array(z.number().int().min(0).max(6)).min(1).default([1, 2, 3, 4, 5, 6]),
  }),
});

export const listTasksSchema = z.object({
  query: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    completed: z.boolean(),
  }),
});

export type GeneratePlanDTO = z.infer<typeof generatePlanSchema>['body'];
export type UpdateTaskDTO = z.infer<typeof updateTaskSchema>['body'];
