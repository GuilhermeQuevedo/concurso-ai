import { z } from 'zod';

import { NICKNAME_MAX, NICKNAME_MIN, NICKNAME_PATTERN } from '../utils/nickname.js';

export const inviteByNicknameSchema = z.object({
  body: z.object({
    // Aceita "@nick" digitado por costume.
    nickname: z
      .string()
      .trim()
      .transform((value) => value.replace(/^@/, ''))
      .pipe(z.string().min(NICKNAME_MIN).max(NICKNAME_MAX).regex(NICKNAME_PATTERN)),
  }),
});
