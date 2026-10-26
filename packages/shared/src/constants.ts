export const APP_NAME = 'Concurso AI';

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const AUTH = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY_DAYS: 7,
  BCRYPT_SALT_ROUNDS: 12,
} as const;

export const RATE_LIMIT = {
  GENERAL_WINDOW_MS: 60 * 1000,
  GENERAL_MAX: 100,
  AUTH_WINDOW_MS: 60 * 1000,
  AUTH_MAX: 30,
} as const;

export const QUESTION_GENERATION = {
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 20,
  DEFAULT_QUANTITY: 5,
} as const;
