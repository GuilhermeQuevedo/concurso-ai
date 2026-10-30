import type { IAIProvider } from '../interfaces/ai.interfaces.js';
import { GeminiProvider } from './gemini.provider.js';
import { OllamaProvider } from './ollama.provider.js';
import { ClaudeProvider } from './claude.provider.js';
import { OpenAIProvider } from './openai.provider.js';
import { MockProvider } from './mock.provider.js';
import { CompositeAIProvider } from './composite.provider.js';
import { env } from '../config/env.js';

type ProviderKind = 'gemini' | 'ollama' | 'claude' | 'openai' | 'mock';

function resolveProviderKind(configuredKind: ProviderKind): ProviderKind {
  if (configuredKind && configuredKind !== 'mock') {
    return configuredKind;
  }

  // Auto-detecção inteligente de provedores reais via chaves de API disponíveis
  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0) {
    return 'gemini';
  }
  if (env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 0) {
    return 'openai';
  }
  if (env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY.trim().length > 0) {
    return 'claude';
  }

  return 'mock';
}

function buildProvider(kind: ProviderKind): IAIProvider {
  switch (kind) {
    case 'gemini':
      if (!env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY é obrigatória quando o provedor é gemini');
      }
      return new GeminiProvider(env.GEMINI_API_KEY);
    case 'ollama':
      return new OllamaProvider(env.OLLAMA_URL, env.OLLAMA_MODEL);
    case 'claude':
      if (!env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY é obrigatória quando o provedor é claude');
      }
      return new ClaudeProvider(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL);
    case 'openai':
      if (!env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY é obrigatória quando o provedor é openai');
      }
      return new OpenAIProvider(env.OPENAI_API_KEY, env.OPENAI_MODEL);
    case 'mock':
    default:
      console.warn('⚠️ [AI Factory] Nenhum provedor de IA configurado no servidor. Configure GEMINI_API_KEY ou OPENAI_API_KEY.');
      return new MockProvider();
  }
}

export function createAIProvider(): IAIProvider {
  const bulkKind = resolveProviderKind(env.AI_PROVIDER);
  const essayKind = resolveProviderKind(env.AI_ESSAY_PROVIDER ?? bulkKind);

  const bulk = buildProvider(bulkKind);
  if (essayKind === bulkKind) {
    return bulk;
  }

  const essay = buildProvider(essayKind);
  return new CompositeAIProvider(bulk, essay);
}
