import { z } from 'zod';

export const createFromPresetSchema = z.object({
  body: z.object({
    catalogId: z.string().min(1).max(100),
    cargoId: z.string().min(1).max(100),
  }),
});
