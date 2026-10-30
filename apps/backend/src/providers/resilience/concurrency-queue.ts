export interface ConcurrencyQueueConfig {
  maxConcurrent: number;
  maxQueueSize: number;
  timeoutMs: number;
}

interface QueueItem<T> {
  operation: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
  priority: 'high' | 'normal';
  timestamp: number;
}

export class ConcurrencyQueue {
  private readonly config: ConcurrencyQueueConfig;
  private readonly queue: Array<QueueItem<unknown>> = [];
  private activeCount = 0;
  private completedCount = 0;
  private failedCount = 0;

  constructor(config?: Partial<ConcurrencyQueueConfig>) {
    this.config = {
      maxConcurrent: config?.maxConcurrent ?? 4,
      maxQueueSize: config?.maxQueueSize ?? 20,
      timeoutMs: config?.timeoutMs ?? 60000,
    };
  }

  public async enqueue<T>(
    operation: () => Promise<T>,
    priority: 'high' | 'normal' = 'normal',
  ): Promise<T> {
    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error('Fila de processamento da IA sobrecarregada. Aguarde alguns instantes.');
    }

    return new Promise<T>((resolve, reject) => {
      const item: QueueItem<T> = {
        operation,
        resolve: resolve as (value: unknown) => void,
        reject,
        priority,
        timestamp: Date.now(),
      };

      if (priority === 'high') {
        let lastHighIndex = -1;
        for (let i = this.queue.length - 1; i >= 0; i -= 1) {
          if (this.queue[i]?.priority === 'high') {
            lastHighIndex = i;
            break;
          }
        }

        if (lastHighIndex === -1) {
          this.queue.unshift(item as QueueItem<unknown>);
        } else {
          this.queue.splice(lastHighIndex + 1, 0, item as QueueItem<unknown>);
        }
      } else {
        this.queue.push(item as QueueItem<unknown>);
      }

      this.processNext();
    });
  }

  private processNext(): void {
    if (this.activeCount >= this.config.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.activeCount += 1;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Tempo limite de resposta da IA excedido.')), this.config.timeoutMs);
    });

    Promise.race([item.operation(), timeoutPromise])
      .then((result) => {
        this.completedCount += 1;
        item.resolve(result);
      })
      .catch((error) => {
        this.failedCount += 1;
        item.reject(error);
      })
      .finally(() => {
        this.activeCount -= 1;
        this.processNext();
      });
  }

  public getStatus() {
    return {
      running: this.activeCount,
      queued: this.queue.length,
      completed: this.completedCount,
      failed: this.failedCount,
    };
  }
}
