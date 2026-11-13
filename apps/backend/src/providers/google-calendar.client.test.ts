import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { GoogleCalendarClient } from './google-calendar.client.js';

const realFetch = globalThis.fetch;

function stubFetch(statuses: number[]): Array<{ url: string; method: string }> {
  const calls: Array<{ url: string; method: string }> = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), method: init?.method ?? 'GET' });
    const status = statuses.shift() ?? 200;
    return new Response('{}', { status });
  }) as typeof fetch;
  return calls;
}

const event = {
  id: 'engrama0123abc',
  summary: 'Teste',
  start: { date: '2026-11-20' },
  end: { date: '2026-11-21' },
};

describe('GoogleCalendarClient.upsertEvent', () => {
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('cria o evento quando ele ainda não existe', async () => {
    const calls = stubFetch([200]);
    assert.equal(await new GoogleCalendarClient().upsertEvent('token', 'cal', event), true);
    assert.deepEqual(calls.map((c) => c.method), ['POST']);
  });

  it('atualiza o evento existente em vez de duplicar', async () => {
    const calls = stubFetch([409, 200]);
    assert.equal(await new GoogleCalendarClient().upsertEvent('token', 'cal', event), true);
    assert.deepEqual(calls.map((c) => c.method), ['POST', 'PATCH']);
    assert.match(calls[1].url, /events\/engrama0123abc$/);
  });

  it('informa falha quando o Google recusa', async () => {
    stubFetch([403]);
    assert.equal(await new GoogleCalendarClient().upsertEvent('token', 'cal', event), false);
  });
});
