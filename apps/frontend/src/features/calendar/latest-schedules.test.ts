import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { StudySchedule } from '@/features/study-schedule/types';

import { latestPerStudy } from './latest-schedules';

const make = (id: string, contestId: string | null): StudySchedule => ({
  id,
  contestId,
  examDate: '2027-01-01',
  dailyHours: 2,
  subjects: [],
  schedule: { weeks: [] },
});

describe('latestPerStudy', () => {
  it('mantém só o mais recente de cada edital', () => {
    const result = latestPerStudy([make('a2', 'A'), make('b1', 'B'), make('a1', 'A')]);
    assert.deepEqual(result.map((s) => s.id), ['a2', 'b1']);
  });

  it('trata os sem edital como um grupo só', () => {
    const result = latestPerStudy([make('x2', null), make('x1', null), make('a1', 'A')]);
    assert.deepEqual(result.map((s) => s.id), ['x2', 'a1']);
  });

  it('lista vazia continua vazia', () => {
    assert.deepEqual(latestPerStudy([]), []);
  });
});
