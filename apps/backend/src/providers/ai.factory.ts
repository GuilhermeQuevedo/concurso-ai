import type { IAIProvider } from '../interfaces/ai.interfaces.js';
import { GeminiProvider } from './gemini.provider.js';
import { MockProvider } from './mock.provider.js';
import { env } from '../config/env.js';

export function createAIProvider(): IAIProvider {
  switch (env.AI_PROVIDER) {
    case 'gemini': {
      if (!env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is required when AI_PROVIDER=gemini');
      }
      return new GeminiProvider(env.GEMINI_API_KEY);
    }
    case 'mock':
      return new MockProvider();
    default:
      return new MockProvider();
  }
}
