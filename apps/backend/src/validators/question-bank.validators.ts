import { z } from 'zod';

const difficulty = z.enum(['EASY', 'MEDIUM', 'HARD']);

const filterShape = {
  examBoardId: z.string().min(1).optional(),
  subjectId: z.string().min(1).optional(),
  examYear: z.coerce.number().int().min(1990).max(2100).optional(),
  organ: z.string().min(1).max(191).optional(),
  area: z.string().min(1).max(191).optional(),
  position: z.string().min(1).max(191).optional(),
  difficulty: difficulty.optional(),
};

export const bankFiltersQuerySchema = z.object(filterShape);

export const buildBankSetSchema = z.object({
  body: z.object({
    ...filterShape,
    examYear: z.number().int().min(1990).max(2100).optional(),
    name: z.string().max(120).optional(),
    quantity: z.number().int().min(1).max(50),
    onlyUnanswered: z.boolean().optional(),
  }),
});
