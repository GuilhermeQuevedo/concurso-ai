import { z } from 'zod';

export const documentParamsSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const documentQuerySchema = z.object({
  subjectId: z.string().cuid().optional(),
});
