import { z } from 'zod';

export const createSubjectSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(200),
    parentId: z.string().min(1).nullable().optional(),
    order: z.number().int().min(0).optional(),
  }),
});

export const updateSubjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(200).optional(),
    parentId: z.string().min(1).nullable().optional(),
    order: z.number().int().min(0).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const subjectParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
