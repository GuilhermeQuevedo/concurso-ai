import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  AI_PROVIDER: z.enum(['gemini', 'ollama', 'mock', 'claude']).default('mock'),
  AI_ESSAY_PROVIDER: z.enum(['gemini', 'ollama', 'mock', 'claude']).optional(),
  GEMINI_API_KEY: z.string().optional(),
  OLLAMA_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('qwen2.5:14b'),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-5-5'),
  WEEKLY_ESSAY_LIMIT: z.coerce.number().int().nonnegative().default(1),
  REQUIRE_SUBSCRIPTION: z.string().default('false').transform((v) => v === 'true'),
  KIWIFY_WEBHOOK_TOKEN: z.string().optional(),
  KIWIFY_CHECKOUT_URL: z.string().default(''),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();
