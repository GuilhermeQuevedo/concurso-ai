import { z } from 'zod';

export const submitEssaySchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200),
    theme: z.string().min(3).max(500),
    content: z.string().max(15000).optional(),
  }),
});

export type SubmitEssayDTO = z.infer<typeof submitEssaySchema>['body'];
