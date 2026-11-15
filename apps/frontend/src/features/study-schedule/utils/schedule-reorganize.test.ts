import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { ScheduleDay, StudySchedule } from '../types';
import { reorganizeSchedule, type ReorganizeOutcome } from './schedule-reorganize';

const day = (date: string, extra: Partial<ScheduleDay> = {}): ScheduleDay => ({
  date,
  dayOfWeek: '',
  type: 'estudo',
  totalHours: 2,
  blocks: [{ order: 1, subject: 'Direito', type: 'estudo', hours: 2, priority: 'normal' }],
  ...extra,
});

const rest = (date: string): ScheduleDay => day(date, { type: 'descanso', blocks: [], totalHours: 0 });

const build = (days: ScheduleDay[], examDate: string): StudySchedule => ({
  examDate,
  dailyHours: 2,
  subjects: ['Direito'],
  schedule: { weeks: [{ weekNumber: 1, phase: 'base', days }] },
});

function ok(outcome: ReorganizeOutcome) {
  assert.equal(outcome.status, 'ok');
  if (outcome.status !== 'ok') throw new Error('esperava status ok');
  return { ...outcome, days: outcome.schedule.schedule.weeks.flatMap((w) => w.days) };
}

describe('reorganizeSchedule', () => {
  it('traz dias atrasados para a frente, mantendo os concluídos', () => {
    const result = ok(reorganizeSchedule(build([day('2026-11-02', { completed: true }), day('2026-11-03'), day('2026-11-04')], '2026-11-20'), '2026-11-10'));
    assert.equal(result.days.filter((d) => d.completed).length, 1);
    assert.deepEqual(result.days.filter((d) => !d.completed).map((d) => d.date), ['2026-11-10', '2026-11-11']);
    assert.equal(result.moved, 2);
  });

  it('preserva o dia da semana de descanso', () => {
    const result = ok(reorganizeSchedule(build([rest('2026-11-01'), day('2026-11-02'), rest('2026-11-08')], '2026-11-30'), '2026-11-10'));
    assert.equal(result.days.find((d) => d.date === '2026-11-15')?.type, 'descanso');
  });

  it('junta o excedente no último dia de estudo sem descartar nada', () => {
    const result = ok(reorganizeSchedule(build([day('2026-11-02'), day('2026-11-03'), day('2026-11-04')], '2026-11-12'), '2026-11-11'));
    assert.equal(result.merged, 2);
    assert.equal(result.days.length, 1);
    assert.equal(result.days[0].blocks.length, 3);
  });

  it('não perde nenhum bloco pendente', () => {
    const pending = [day('2026-11-02'), day('2026-11-03'), day('2026-11-04'), day('2026-11-05')];
    const result = ok(reorganizeSchedule(build(pending, '2026-11-14'), '2026-11-11'));
    const blocks = result.days.reduce((sum, d) => sum + d.blocks.length, 0);
    assert.equal(blocks, pending.length);
  });

  it('avisa e não altera nada quando só sobram dias de descanso até a prova', () => {
    // 15/11/2026 é domingo: o único dia livre antes da prova (16/11) é de descanso.
    const days = [rest('2026-11-01'), rest('2026-11-08'), day('2026-11-09')];
    assert.deepEqual(reorganizeSchedule(build(days, '2026-11-16'), '2026-11-15'), { status: 'no_study_days' });
  });

  it('não coloca um dia novo em cima de um dia concluído adiantado no futuro', () => {
    const days = [day('2026-11-03'), day('2026-11-04'), day('2026-11-12', { completed: true })];
    const result = ok(reorganizeSchedule(build(days, '2026-11-20'), '2026-11-10'));
    const onTwelfth = result.days.filter((d) => d.date === '2026-11-12');
    assert.equal(onTwelfth.length, 1);
    assert.equal(onTwelfth[0].completed, true);
    assert.equal(new Set(result.days.map((d) => d.date)).size, result.days.length);
  });

  it('informa quando a prova já passou ou não há pendências', () => {
    assert.deepEqual(reorganizeSchedule(build([day('2026-11-02')], '2026-11-05'), '2026-11-10'), { status: 'exam_passed' });
    assert.deepEqual(reorganizeSchedule(build([day('2026-11-02', { completed: true })], '2026-11-30'), '2026-11-10'), { status: 'nothing_pending' });
  });
});
