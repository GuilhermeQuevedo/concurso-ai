import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

export const joinGroupSchema = z.object({
  code: z.string().min(4).max(20),
});

export type CreateGroupDTO = z.infer<typeof createGroupSchema>;
export type JoinGroupDTO = z.infer<typeof joinGroupSchema>;
