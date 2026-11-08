import { z } from 'zod';

export const createShareSchema = z.object({
  body: z.object({
    type: z.enum(['DECK', 'SCHEDULE', 'CONTEST']),
    refId: z.string().min(1).max(60),
  }),
});
