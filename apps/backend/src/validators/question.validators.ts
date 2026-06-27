import { z } from 'zod';

export const generateQuestionsSchema = z.object({
  body: z.object({
    subjectId: z.string().cuid(),
    topic: z.string().max(200).optional(),
    examBoardId: z.string().cuid().optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
    quantity: z.number().int().min(1).max(10).default(5),
  }),
});

export type GenerateQuestionsDTO = z.infer<typeof generateQuestionsSchema>['body'];
