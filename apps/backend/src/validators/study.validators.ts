import { z } from 'zod';

export const createStudySessionSchema = z.object({
  body: z.object({
    subjectId: z.string().min(1).optional(),
    mode: z.enum(['STUDY', 'EXAM']),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
    examBoardId: z.string().min(1).optional(),
    questionIds: z.array(z.string().min(1)).min(1).max(50),
  }),
});

export const submitAnswerSchema = z.object({
  body: z.object({
    questionId: z.string().min(1),
    answer: z.string().min(1).max(1),
    timeSpent: z.number().int().min(0),
  }),
  params: z.object({
    sessionId: z.string().min(1),
  }),
});

export const finishSessionSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1),
  }),
});

export const toggleFavoriteSchema = z.object({
  body: z.object({
    questionId: z.string().min(1),
  }),
});
