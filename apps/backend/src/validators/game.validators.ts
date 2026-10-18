import { z } from 'zod';

import { GAMES } from '../utils/game-scoring.js';

const gameEnum = z.enum(GAMES);

export const startGameSchema = z.object({
  body: z.object({
    game: gameEnum,
    subjectId: z.string().min(1).optional(),
  }),
});

export const checkAnswerSchema = z.object({
  body: z.object({
    itemId: z.string().min(1),
    choice: z.string().min(1),
  }),
});

export const finishGameSchema = z.object({
  body: z.object({
    answers: z
      .array(
        z.object({
          itemId: z.string().optional(),
          choice: z.string().optional(),
          ms: z.number().int().min(0).max(600000).optional(),
          cues: z.number().int().min(0).max(3).optional(),
          a: z.string().optional(),
          b: z.string().optional(),
        }),
      )
      .max(200),
  }),
});
