import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { latestPerContest } from './latest-per-contest.js';

const row = (id: string, contestId: string | null) => ({ id, contestId });

describe('latestPerContest', () => {
  it('mantém só o mais recente de cada edital', () => {
    const result = latestPerContest([row('a2', 'A'), row('b1', 'B'), row('a1', 'A')]);
    assert.deepEqual(result.map((r) => r.id), ['a2', 'b1']);
  });

  it('trata os sem edital como um grupo só', () => {
    const result = latestPerContest([row('x2', null), row('x1', null), row('a1', 'A')]);
    assert.deepEqual(result.map((r) => r.id), ['x2', 'a1']);
  });
});
