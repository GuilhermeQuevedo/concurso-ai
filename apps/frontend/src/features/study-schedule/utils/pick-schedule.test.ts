import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { StudySchedule } from '../types';
import { pickScheduleForStudy } from './pick-schedule';

const make = (id: string, contestId: string | null): StudySchedule => ({
  id,
  contestId,
  examDate: '2027-01-01',
  dailyHours: 2,
  subjects: [],
  schedule: { weeks: [] },
});

const saved = [make('novo-b', 'B'), make('novo-a', 'A'), make('antigo-a', 'A'), make('livre', null)];

describe('pickScheduleForStudy', () => {
  it('abre o cronograma mais recente do estudo ativo', () => {
    assert.equal(pickScheduleForStudy(saved, null, 'A')?.id, 'novo-a');
    assert.equal(pickScheduleForStudy(saved, null, 'B')?.id, 'novo-b');
  });

  it('mostra o assistente (nada aberto) quando o estudo ainda não tem cronograma', () => {
    assert.equal(pickScheduleForStudy(saved, null, 'C'), null);
  });

  it('usa o rascunho só se ele for do estudo ativo', () => {
    assert.equal(pickScheduleForStudy([], make('rascunho', 'C'), 'C')?.id, 'rascunho');
    assert.equal(pickScheduleForStudy([], make('rascunho', 'D'), 'C'), null);
  });

  it('com todos os estudos, mantém rascunho e depois o último salvo', () => {
    assert.equal(pickScheduleForStudy(saved, make('rascunho', 'X'), null)?.id, 'rascunho');
    assert.equal(pickScheduleForStudy(saved, null, null)?.id, 'novo-b');
    assert.equal(pickScheduleForStudy([], null, null), null);
  });
});
