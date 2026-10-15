import { z } from 'zod';

const difficulty = z.enum(['EASY', 'MEDIUM', 'HARD']);

export const generateQuestionSetSchema = z.object({
  body: z.object({
    name: z.string().max(120).optional(),
    subjectId: z.string().min(1),
    quantity: z.number().int().min(1).max(20),
    examBoardId: z.string().min(1).optional(),
    difficulty: difficulty.optional(),
    topic: z.string().max(200).optional(),
    documentId: z.string().min(1).optional(),
    mode: z.enum(['STUDY', 'EXAM']).optional(),
  }),
});

export const createManualSetSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    subjectId: z.string().min(1),
    mode: z.enum(['STUDY', 'EXAM']).optional(),
    questions: z
      .array(
        z.object({
          statement: z.string().min(3),
          alternatives: z
            .array(z.object({ letter: z.string().min(1).max(2), text: z.string().min(1) }))
            .min(2)
            .max(5),
          correctAnswer: z.string().min(1).max(2),
          explanation: z.string().optional(),
          difficulty,
        }),
      )
      .min(1)
      .max(50),
  }),
});
