import { z } from 'zod';

export const suggestRankingSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(120),
    description: z.string().max(500).optional(),
    documentId: z.string().min(1).optional(),
    subjectId: z.string().min(1).optional(),
  }),
});
