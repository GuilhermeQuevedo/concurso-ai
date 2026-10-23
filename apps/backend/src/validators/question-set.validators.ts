import { z } from 'zod';

const difficulty = z.enum(['EASY', 'MEDIUM', 'HARD']);
const questionType = z.enum(['MULTIPLE_4', 'MULTIPLE_5', 'TRUE_FALSE', 'ESSAY', 'MIXED']);
const mode = z.enum(['STUDY', 'EXAM']);

export const generateQuestionSetSchema = z.object({
  body: z.object({
    name: z.string().max(120).optional(),
    subjectId: z.string().min(1).optional(),
    quantity: z.number().int().min(1).max(20),
    examBoardId: z.string().min(1).optional(),
    difficulty: difficulty.optional(),
    topic: z.string().max(200).optional(),
    documentId: z.string().min(1).optional(),
    content: z.string().max(80000).optional(),
    questionType: questionType.optional(),
    cloneStyle: z.boolean().optional(),
    mode: mode.optional(),
  }),
});

export const createManualSetSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    subjectId: z.string().min(1).optional(),
    mode: mode.optional(),
    questionType: questionType.optional(),
    questions: z
      .array(
        z.object({
          statement: z.string().min(3),
          alternatives: z
            .array(z.object({ letter: z.string().min(1).max(2), text: z.string().min(1) }))
            .max(5),
          correctAnswer: z.string().max(2).optional(),
          explanation: z.string().optional(),
          difficulty,
        }),
      )
      .min(1)
      .max(50),
  }),
});

export const renameQuestionSetSchema = z.object({
  body: z.object({ name: z.string().min(2).max(120) }),
});
