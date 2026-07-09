import { z } from 'zod';

export const generateQuestionsSchema = z.object({
  body: z.object({
    subjectId: z.string().min(1),
    topic: z.string().max(200).optional(),
    examBoardId: z.string().min(1).optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
    quantity: z.number().int().min(1).max(10).default(5),
    documentId: z.string().min(1).optional(),
  }),
});

export type GenerateQuestionsDTO = z.infer<typeof generateQuestionsSchema>['body'];
