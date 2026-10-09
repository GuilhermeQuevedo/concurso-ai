import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  AI_PROVIDER: z.enum(['gemini', 'ollama', 'mock']).default('mock'),
  GEMINI_API_KEY: z.string().optional(),
  OLLAMA_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('qwen2.5:14b'),
  REQUIRE_SUBSCRIPTION: z.string().default('false').transform((v) => v === 'true'),
  KIWIFY_WEBHOOK_TOKEN: z.string().optional(),
  KIWIFY_CHECKOUT_URL: z.string().default(''),
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
