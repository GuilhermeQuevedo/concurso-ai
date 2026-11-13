import { z } from 'zod';

const blockSchema = z
  .object({
    subject: z.string(),
    type: z.string(),
    hours: z.number(),
  })
  .passthrough();

const daySchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    type: z.string(),
    totalHours: z.number(),
    blocks: z.array(blockSchema),
    completed: z.boolean().optional(),
  })
  .passthrough();

const weekSchema = z
  .object({
    weekNumber: z.number().int(),
    days: z.array(daySchema).max(7),
  })
  .passthrough();

export const reorganizeScheduleSchema = z.object({
  weeks: z.array(weekSchema).min(1).max(120),
});

export type ReorganizeScheduleDTO = z.infer<typeof reorganizeScheduleSchema>;
