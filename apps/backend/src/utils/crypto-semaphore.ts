import bcrypt from 'bcrypt';
import { AppError } from '../middlewares/error-handler.js';

export class AsyncSemaphore {
  private activeCount = 0;
  private readonly waitingQueue: Array<{
    resolve: () => void;
    reject: (err: Error) => void;
    timer: NodeJS.Timeout;
  }> = [];

  constructor(
    private readonly maxConcurrency: number,
    private readonly timeoutMs: number = 8000,
  ) {}

  async acquire(): Promise<() => void> {
    if (this.activeCount < this.maxConcurrency) {
      this.activeCount++;
      return () => this.release();
    }

    return new Promise<() => void>((resolve, reject) => {
      const timer = setTimeout(() => {
        const index = this.waitingQueue.findIndex((item) => item.timer === timer);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
          reject(
            new AppError(
              503,
              'AUTH_SERVER_BUSY',
              'Servidor com alta demanda de autenticação no momento. Por favor, tente novamente em alguns segundos.',
            ),
          );
        }
      }, this.timeoutMs);

      this.waitingQueue.push({
        resolve: () => {
          clearTimeout(timer);
          resolve(() => this.release());
        },
        reject,
        timer,
      });
    });
  }

  private release(): void {
    const next = this.waitingQueue.shift();
    if (next) {
      next.resolve();
    } else {
      this.activeCount--;
    }
  }

  get queueLength(): number {
    return this.waitingQueue.length;
  }

  get active(): number {
    return this.activeCount;
  }
}

/**
 * Semáforo global para operações de bcrypt.
 * Limita a 2 computações simultâneas de hash/compare para proteger
 * a threadpool libuv e não estrangular a única vCPU da VPS Hostinger KVM 1.
 */
export const bcryptSemaphore = new AsyncSemaphore(2, 8000);

export async function safeBcryptHash(data: string | Buffer, saltOrRounds: string | number): Promise<string> {
  const release = await bcryptSemaphore.acquire();
  try {
    return await bcrypt.hash(data, saltOrRounds);
  } finally {
    release();
  }
}

export async function safeBcryptCompare(data: string | Buffer, encrypted: string): Promise<boolean> {
  const release = await bcryptSemaphore.acquire();
  try {
    return await bcrypt.compare(data, encrypted);
  } finally {
    release();
  }
}
