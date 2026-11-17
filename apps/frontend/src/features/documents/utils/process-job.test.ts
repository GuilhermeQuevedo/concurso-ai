import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { ProcessJobDTO } from '../services/document.service';
import { isUsable } from './process-job';

const job = (extra: Partial<ProcessJobDTO>): ProcessJobDTO => ({
  id: 'j', documentId: 'd', status: 'RUNNING', partsDone: 0, totalParts: 1, contestId: null, result: null, message: null, errorCode: null, ...extra,
});

describe('isUsable', () => {
  it('ainda lendo a primeira parte: não está pronto', () => {
    assert.equal(isUsable(job({})), false);
  });

  it('primeira parte pronta e restante em andamento: o aluno já pode seguir', () => {
    const result = { pipeline: 'objetivo' as const, contestId: 'c', title: 'Edital' };
    assert.equal(isUsable(job({ partsDone: 1, totalParts: 2, contestId: 'c', result })), true);
  });

  it('terminou: pronto', () => {
    assert.equal(isUsable(job({ status: 'DONE', partsDone: 1 })), true);
  });

  it('falha ou cancelamento nunca são "prontos"', () => {
    assert.equal(isUsable(job({ status: 'FAILED' })), false);
    assert.equal(isUsable(job({ status: 'CANCELED' })), false);
  });
});
