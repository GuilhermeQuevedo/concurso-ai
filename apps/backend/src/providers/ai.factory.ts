import type { IAIProvider } from '../interfaces/ai.interfaces.js';
import { GeminiProvider } from './gemini.provider.js';
import { OllamaProvider } from './ollama.provider.js';
import { ClaudeProvider } from './claude.provider.js';
import { OpenAIProvider } from './openai.provider.js';
import { MockProvider } from './mock.provider.js';
import { CompositeAIProvider } from './composite.provider.js';
import { env } from '../config/env.js';

type ProviderKind = 'gemini' | 'ollama' | 'claude' | 'openai' | 'mock';

function buildProvider(kind: ProviderKind): IAIProvider {
  switch (kind) {
    case 'gemini':
      if (!env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is required when the provider is gemini');
      }
      return new GeminiProvider(env.GEMINI_API_KEY);
    case 'ollama':
      return new OllamaProvider(env.OLLAMA_URL, env.OLLAMA_MODEL);
    case 'claude':
      if (!env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is required when the provider is claude');
      }
      return new ClaudeProvider(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL);
    case 'openai':
      if (!env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is required when the provider is openai');
      }
      return new OpenAIProvider(env.OPENAI_API_KEY, env.OPENAI_MODEL);
    case 'mock':
    default:
      return new MockProvider();
  }
}

export function createAIProvider(): IAIProvider {
  const bulkKind = env.AI_PROVIDER;
  const essayKind = env.AI_ESSAY_PROVIDER ?? bulkKind;

  const bulk = buildProvider(bulkKind);
  if (essayKind === bulkKind) {
    return bulk;
  }

  const essay = buildProvider(essayKind);
  return new CompositeAIProvider(bulk, essay);
}
