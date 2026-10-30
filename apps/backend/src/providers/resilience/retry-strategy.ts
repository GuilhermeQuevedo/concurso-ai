export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: number[];
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: [429, 503, 504],
};

export class RetryStrategy {
  private readonly config: RetryConfig;

  constructor(config?: Partial<RetryConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public async execute<T>(
    action: () => Promise<T>,
    onRetry?: (attempt: number, maxAttempts: number) => void,
  ): Promise<T> {
    let attempt = 1;

    while (attempt <= this.config.maxAttempts) {
      try {
        return await action();
      } catch (error: unknown) {
        if (attempt >= this.config.maxAttempts || !this.isRetryable(error)) {
          throw error;
        }

        if (onRetry) {
          onRetry(attempt, this.config.maxAttempts);
        }

        const delay = this.calculateDelay(attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt += 1;
      }
    }

    throw new Error('Número máximo de tentativas de chamada excedido.');
  }

  private isRetryable(error: unknown): boolean {
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as { status: unknown }).status;
      if (typeof status === 'number') {
        return this.config.retryableErrors.includes(status);
      }
    }

    if (error instanceof Error) {
      return this.config.retryableErrors.some((code) => error.message.includes(code.toString()));
    }

    return false;
  }

  private calculateDelay(attempt: number): number {
    const baseDelay = this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attempt - 1);
    const cappedDelay = Math.min(baseDelay, this.config.maxDelayMs);
    const jitter = cappedDelay * 0.2;
    const randomJitter = (Math.random() * 2 - 1) * jitter;
    return Math.floor(cappedDelay + randomJitter);
  }
}
