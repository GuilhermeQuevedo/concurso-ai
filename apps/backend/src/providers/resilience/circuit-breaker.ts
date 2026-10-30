export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeoutMs: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private nextAttempt = Date.now();
  private readonly config: CircuitBreakerConfig;
  private readonly serviceName: string;

  constructor(serviceName: string, config?: Partial<CircuitBreakerConfig>) {
    this.serviceName = serviceName;
    this.config = {
      failureThreshold: config?.failureThreshold ?? 3,
      successThreshold: config?.successThreshold ?? 2,
      timeoutMs: config?.timeoutMs ?? 30000,
    };
  }

  public async execute<T>(action: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() > this.nextAttempt) {
        this.state = 'half-open';
      } else {
        throw new Error(
          `O serviço de IA [${this.serviceName}] está temporariamente em resguardo devido a erros recentes. Tente novamente em alguns segundos.`,
        );
      }
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.successes += 1;
      if (this.successes >= this.config.successThreshold) {
        this.state = 'closed';
        this.failures = 0;
        this.successes = 0;
      }
    } else {
      this.failures = 0;
    }
  }

  private onFailure(): void {
    this.failures += 1;
    if (this.state === 'half-open' || this.failures >= this.config.failureThreshold) {
      this.state = 'open';
      this.nextAttempt = Date.now() + this.config.timeoutMs;
    }
  }

  public getState(): CircuitState {
    return this.state;
  }
}
