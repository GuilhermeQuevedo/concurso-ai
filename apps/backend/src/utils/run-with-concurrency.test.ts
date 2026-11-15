import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { runWithConcurrency } from './run-with-concurrency.js';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

describe('runWithConcurrency', () => {
  it('nunca passa do limite de execuções simultâneas', async () => {
    let running = 0;
    let peak = 0;
    await runWithConcurrency(Array.from({ length: 20 }, (_, i) => i), 5, async () => {
      running += 1;
      peak = Math.max(peak, running);
      await sleep(5);
      running -= 1;
    });
    assert.ok(peak <= 5, `pico de ${peak}`);
    assert.ok(peak > 1);
  });

  it('mantém a ordem dos resultados', async () => {
    const result = await runWithConcurrency([3, 1, 2], 2, async (n) => {
      await sleep(n);
      return n * 10;
    });
    assert.deepEqual(result, [30, 10, 20]);
  });

  it('aceita lista vazia', async () => {
    assert.deepEqual(await runWithConcurrency([], 5, async (n: number) => n), []);
  });
});
