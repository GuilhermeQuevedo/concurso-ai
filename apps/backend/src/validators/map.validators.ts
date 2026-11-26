import { z } from 'zod';

export const getGraphQuerySchema = z.object({
  query: z.object({
    rootTopicId: z.string().cuid().optional(),
    depth: z.coerce.number().int().min(1).max(5).default(3).optional(),
    disciplineId: z.string().cuid().optional(),
    examBoardId: z.string().cuid().optional(),
  }),
});

export const getOverlayQuerySchema = z.object({
  query: z.object({
    disciplineId: z.string().cuid().optional(),
  }),
});

export const getFocusParamsSchema = z.object({
  params: z.object({
    id: z.string().cuid({ message: 'ID do tópico inválido.' }),
  }),
  query: z.object({
    cardsLimit: z.coerce.number().int().min(1).max(20).default(5).optional(),
    errorsLimit: z.coerce.number().int().min(1).max(20).default(5).optional(),
    relationsLimit: z.coerce.number().int().min(1).max(30).default(10).optional(),
  }),
});

export type GetGraphQuery = z.infer<typeof getGraphQuerySchema>['query'];
export type GetOverlayQuery = z.infer<typeof getOverlayQuerySchema>['query'];
export type GetFocusParams = z.infer<typeof getFocusParamsSchema>['params'];
export type GetFocusQuery = z.infer<typeof getFocusParamsSchema>['query'];
