import { z } from 'zod';

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const card = z.object({ front: z.string().min(1).max(2000), back: z.string().min(1).max(4000) });
const deck = {
  name: z.string().min(2).max(120),
  subjectName: z.string().max(120).optional(),
  topic: z.string().max(120).optional(),
  color: color.optional(),
};

export const createDeckSchema = z.object({
  body: z.object({ ...deck, cards: z.array(card).min(1).max(200) }),
});

export const generateDeckSchema = z.object({
  body: z.object({
    ...deck,
    text: z.string().max(80000).optional(),
    documentId: z.string().min(1).optional(),
    count: z.number().int().min(1).max(30).optional(),
  }),
});

export const updateDeckSchema = z.object({ body: z.object(deck) });
export const cardSchema = z.object({ body: card });
export const importCardsSchema = z.object({ body: z.object({ text: z.string().min(3).max(200000) }) });
