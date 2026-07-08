import { z } from 'zod';

export const documentParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const documentQuerySchema = z.object({
  subjectId: z.string().min(1).optional(),
});
