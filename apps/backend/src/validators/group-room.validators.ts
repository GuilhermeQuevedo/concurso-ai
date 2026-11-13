import { z } from 'zod';

import { MAX_QUESTIONS, MAX_SECONDS, MIN_QUESTIONS, MIN_SECONDS } from '../utils/room-timing.js';

export const createRoomSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(80),
    mode: z.enum(['LIVE', 'OWN_PACE']),
    count: z.number().int().min(MIN_QUESTIONS).max(MAX_QUESTIONS),
    secondsPerQuestion: z.number().int().min(MIN_SECONDS).max(MAX_SECONDS).default(30),
    subjectId: z.string().min(1).max(60).optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  }),
});

export const roomReadySchema = z.object({
  body: z.object({ ready: z.boolean() }),
});

export const roomAnswerSchema = z.object({
  body: z.object({
    questionId: z.string().min(1).max(60),
    choice: z.string().trim().min(1).max(10),
  }),
});
