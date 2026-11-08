import { z } from 'zod';

const MAX_BODY = 500;
const MAX_CONTEXT = 1500;
const targetType = z.enum(['QUESTION', 'FLASHCARD', 'DECK', 'GENERAL']);

export const createCommentSchema = z.object({
  body: z.object({
    body: z.string().trim().min(1, 'Escreva uma mensagem.').max(MAX_BODY, `Use até ${MAX_BODY} caracteres.`),
    kind: z.enum(['COMMENT', 'DOUBT']).default('COMMENT'),
    targetType: targetType.default('GENERAL'),
    targetId: z.string().min(1).max(60).optional(),
    context: z.string().trim().max(MAX_CONTEXT).optional(),
    parentId: z.string().min(1).max(60).optional(),
  }),
});

export const listCommentsSchema = z.object({
  query: z.object({
    targetType: targetType.optional(),
    targetId: z.string().min(1).max(60).optional(),
    open: z.enum(['true', 'false']).optional(),
  }),
});

export const resolveCommentSchema = z.object({
  body: z.object({ resolved: z.boolean() }),
});
