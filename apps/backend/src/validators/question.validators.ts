import { z } from 'zod';

export const generateQuestionsSchema = z.object({
  body: z.object({
    subjectId: z.string().min(1),
    topic: z.string().max(200).optional(),
    examBoardId: z.string().min(1).optional(),
    examBoardName: z.string().max(100).optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
    quantity: z.number().int().min(1).max(30).default(5),
    documentId: z.string().min(1).optional(),
    content: z.string().max(500000).optional(),
    questionType: z.enum(['MULTIPLE_4', 'MULTIPLE_5', 'TRUE_FALSE', 'ESSAY', 'MIXED']).optional(),
    cloneStyle: z.boolean().optional(),
  }),
});

export type GenerateQuestionsDTO = z.infer<typeof generateQuestionsSchema>['body'];

export const sliceExamSchema = z.object({
  body: z.object({
    examContent: z.string().min(10, 'Conteúdo da prova é obrigatório'),
    answerKeyContent: z.string().optional(),
    quantity: z.number().int().min(1).max(50).default(10),
    subjectId: z.string().optional(),
    subjectName: z.string().max(150).optional(),
    examBoardId: z.string().optional(),
  }),
});

export type SliceExamDTO = z.infer<typeof sliceExamSchema>['body'];
