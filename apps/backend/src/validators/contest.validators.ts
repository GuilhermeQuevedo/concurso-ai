import { z } from 'zod';

export const createContestSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(200),
    organization: z.string().max(200).optional(),
    examBoard: z.string().max(100).optional(),
    role: z.string().max(200).optional(),
    examDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  }),
});

export const updateContestSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(200).optional(),
    organization: z.string().max(200).nullable().optional(),
    examBoard: z.string().max(100).nullable().optional(),
    role: z.string().max(200).nullable().optional(),
    examDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullable().optional(),
    status: z.enum(['PLANNED', 'STUDYING', 'DONE', 'ARCHIVED']).optional(),
  }),
});

export const updateSyllabusItemSchema = z.object({
  body: z.object({
    studied: z.boolean(),
  }),
});

export type CreateContestDTO = z.infer<typeof createContestSchema>['body'];
export type UpdateContestDTO = z.infer<typeof updateContestSchema>['body'];
export type UpdateSyllabusItemDTO = z.infer<typeof updateSyllabusItemSchema>['body'];
