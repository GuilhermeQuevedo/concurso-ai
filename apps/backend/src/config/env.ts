import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  AI_PROVIDER: z.enum(['gemini', 'ollama', 'mock', 'claude', 'openai']).default('mock'),
  AI_ESSAY_PROVIDER: z.enum(['gemini', 'ollama', 'mock', 'claude', 'openai']).optional(),
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  OLLAMA_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('qwen2.5:14b'),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-5-5'),
  WEEKLY_ESSAY_LIMIT: z.coerce.number().int().nonnegative().default(1),
  // Assinatura estritamente obrigatória por padrão em todos os ambientes (sem flexibilidade)
  REQUIRE_SUBSCRIPTION: z
    .string()
    .default('true')
    .transform((val) => val !== 'false'),
  KIWIFY_WEBHOOK_TOKEN: z.string().optional(),
  KIWIFY_CHECKOUT_URL: z.string().default(''),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_EMAILS: z
    .string()
    .default('narduccigabriel2@gmail.com,dev@teste.com,guilhermecquevedo@gmail.com'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  APP_URL: z.string().default('http://localhost:5173'),
  API_URL: z.string().default('http://localhost:3333'),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID_MONTHLY: z.string().optional(),
  STRIPE_PRICE_ID_SEMESTRAL: z.string().optional(),
  STRIPE_PRICE_ID_YEARLY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Engrama <nao-responda@engrama.app>'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.string().default('false').transform((v) => v === 'true'),
});

function normalizeTruncatedEnv(rawEnv: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const normalized = { ...rawEnv };
  const aliases: Record<string, string> = {
    ODE_ENV: 'NODE_ENV',
    ORT: 'PORT',
    ATABASE_URL: 'DATABASE_URL',
    WT_SECRET: 'JWT_SECRET',
    ORS_ORIGIN: 'CORS_ORIGIN',
    I_PROVIDER: 'AI_PROVIDER',
    DMIN_EMAIL: 'ADMIN_EMAIL',
    DMIN_PASSWORD: 'ADMIN_PASSWORD',
    PP_URL: 'APP_URL',
    PI_URL: 'API_URL',
    OOGLE_CLIENT_ID: 'GOOGLE_CLIENT_ID',
    OOGLE_CLIENT_SECRET: 'GOOGLE_CLIENT_SECRET',
    OOGLE_REDIRECT_URI: 'GOOGLE_REDIRECT_URI',
    PENAI_API_KEY: 'OPENAI_API_KEY',
    ESEND_API_KEY: 'RESEND_API_KEY',
    MAIL_FROM: 'EMAIL_FROM',
  };

  for (const [truncated, proper] of Object.entries(aliases)) {
    if (!normalized[proper] && normalized[truncated]) {
      normalized[proper] = normalized[truncated];
    }
  }

  return normalized;
}

function loadEnv() {
  const normalizedEnv = normalizeTruncatedEnv(process.env);
  const parsed = envSchema.safeParse(normalizedEnv);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();
