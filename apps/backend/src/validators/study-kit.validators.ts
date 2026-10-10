import { z } from 'zod';

export const generateStudyKitSchema = z.object({
  documentId: z.string().min(1),
  subjectId: z.string().min(1),
  outputs: z.array(z.enum(['summary', 'flashcards', 'questions'])).min(1),
  flashcardsCount: z.number().int().min(1).max(30).optional(),
  questionsCount: z.number().int().min(1).max(10).optional(),
  examBoardId: z.string().min(1).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  topic: z.string().max(200).optional(),
});

export type GenerateStudyKitDTO = z.infer<typeof generateStudyKitSchema>;
