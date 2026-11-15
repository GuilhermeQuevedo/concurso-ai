import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { withinHorizon } from './calendar-horizon.js';

const today = new Date('2026-11-13T12:00:00Z');

describe('withinHorizon', () => {
  it('mantém hoje e os próximos dias até o limite e descarta o resto', () => {
    const events = [
      { id: 'ontem', allDayDate: '2026-11-12' },
      { id: 'hoje', allDayDate: '2026-11-13' },
      { id: 'limite', allDayDate: '2027-01-12' },
      { id: 'longe', allDayDate: '2027-01-13' },
    ];
    assert.deepEqual(withinHorizon(events, today, 60).map((e) => e.id), ['hoje', 'limite']);
  });

  it('usa a data de início dos eventos com horário', () => {
    const events = [{ id: 'a', start: new Date('2026-11-20T12:00:00Z') }, { id: 'b', start: new Date('2027-03-01T12:00:00Z') }];
    assert.deepEqual(withinHorizon(events, today, 60).map((e) => e.id), ['a']);
  });
});
