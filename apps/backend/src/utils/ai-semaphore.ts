import { AsyncSemaphore } from './crypto-semaphore.js';
import { AppError } from '../middlewares/error-handler.js';

/**
 * Semáforo para limitar a concorrência de chamadas pesadas à IA e parsing de PDFs.
 * Com 1 vCPU, no máximo 2 operações pesadas de IA/PDF devem rodar simultaneamente
 * para não esgotar a CPU nem causar timeout nas leituras dos 1000 usuários.
 */
export const aiConcurrencySemaphore = new AsyncSemaphore(2, 60000);

export async function runWithAiLock<T>(fn: () => Promise<T>): Promise<T> {
  let release: (() => void) | null = null;
  try {
    release = await aiConcurrencySemaphore.acquire();
    return await fn();
  } catch (err) {
    if (err instanceof AppError && err.code === 'AUTH_SERVER_BUSY') {
      throw new AppError(
        503,
        'AI_SERVER_BUSY',
        'O processador de inteligência artificial está operando em capacidade máxima no momento. Por favor, aguarde alguns segundos antes de tentar novamente.',
      );
    }
    throw err;
  } finally {
    if (release) release();
  }
}
