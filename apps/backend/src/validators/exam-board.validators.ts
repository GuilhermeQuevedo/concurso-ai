import { z } from 'zod';

export const createExamBoardSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  }),
});

export const updateExamBoardSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const examBoardParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
