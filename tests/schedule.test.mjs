import test from 'node:test';
import assert from 'node:assert/strict';
import { parseClassSessions } from '../src/lib/schedule.ts';

test('timetable parsing validates days, times and names before importing', () => {
  const valid = { className: ' Physics ', dayOfWeek: 6, startTime: '09:00', endTime: '10:00' };
  assert.equal(parseClassSessions([valid])[0].className, 'Physics');
  for (const bad of [{ ...valid, dayOfWeek: 7 }, { ...valid, startTime: '9:00' }, { ...valid, endTime: '08:00' }, { ...valid, className: '' }]) {
    assert.throws(() => parseClassSessions([bad]));
  }
});
