import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { ScheduleDay, StudySchedule } from '../types';
import { reorganizeSchedule } from './schedule-reorganize';

const day = (date: string, extra: Partial<ScheduleDay> = {}): ScheduleDay => ({
  date,
  dayOfWeek: '',
  type: 'estudo',
  totalHours: 2,
  blocks: [{ order: 1, subject: 'Direito', type: 'estudo', hours: 2, priority: 'normal' }],
  ...extra,
});

const build = (days: ScheduleDay[], examDate: string): StudySchedule => ({
  examDate,
  dailyHours: 2,
  subjects: ['Direito'],
  schedule: { weeks: [{ weekNumber: 1, phase: 'base', days }] },
});

describe('reorganizeSchedule', () => {
  it('traz dias atrasados para a frente, mantendo os concluídos', () => {
    const schedule = build([day('2026-11-02', { completed: true }), day('2026-11-03'), day('2026-11-04')], '2026-11-20');
    const result = reorganizeSchedule(schedule, '2026-11-10');
    assert.ok(result);
    const all = result.schedule.schedule.weeks.flatMap((w) => w.days);
    assert.equal(all.filter((d) => d.completed).length, 1);
    assert.deepEqual(
      all.filter((d) => !d.completed).map((d) => d.date),
      ['2026-11-10', '2026-11-11'],
    );
    assert.equal(result.moved, 2);
  });

  it('preserva o dia da semana de descanso', () => {
    const schedule = build(
      [day('2026-11-01', { type: 'descanso', blocks: [], totalHours: 0 }), day('2026-11-02'), day('2026-11-08', { type: 'descanso', blocks: [], totalHours: 0 })],
      '2026-11-30',
    );
    const result = reorganizeSchedule(schedule, '2026-11-10');
    assert.ok(result);
    const all = result.schedule.schedule.weeks.flatMap((w) => w.days);
    assert.equal(all.find((d) => d.date === '2026-11-15')?.type, 'descanso');
  });

  it('junta o excedente no último dia quando faltam datas', () => {
    const schedule = build([day('2026-11-02'), day('2026-11-03'), day('2026-11-04')], '2026-11-12');
    const result = reorganizeSchedule(schedule, '2026-11-11');
    assert.ok(result);
    assert.equal(result.merged, 2);
    const all = result.schedule.schedule.weeks.flatMap((w) => w.days);
    assert.equal(all.length, 1);
    assert.equal(all[0].blocks.length, 3);
  });

  it('não reorganiza quando a prova já passou', () => {
    assert.equal(reorganizeSchedule(build([day('2026-11-02')], '2026-11-05'), '2026-11-10'), null);
  });
});
