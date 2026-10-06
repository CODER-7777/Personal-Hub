import { ClassSession } from '../store/types';

export function parseClassSessions(value: unknown): ClassSession[] {
  if (!Array.isArray(value) || value.length > 100) throw new Error('Expected up to 100 schedule entries.');
  return value.map(entry => {
    if (!entry || typeof entry.className !== 'string' || !entry.className.trim()
      || !Number.isInteger(entry.dayOfWeek) || entry.dayOfWeek < 0 || entry.dayOfWeek > 6
      || typeof entry.startTime !== 'string' || typeof entry.endTime !== 'string'
      || !/^([01]\d|2[0-3]):[0-5]\d$/.test(entry.startTime)
      || !/^([01]\d|2[0-3]):[0-5]\d$/.test(entry.endTime) || entry.endTime <= entry.startTime) {
      throw new Error('The timetable contains an invalid name, day or time. Please edit the image and try again.');
    }
    return {
      id: crypto.randomUUID(), className: entry.className.trim().slice(0, 120),
      dayOfWeek: entry.dayOfWeek, startTime: entry.startTime, endTime: entry.endTime,
      room: typeof entry.room === 'string' ? entry.room.slice(0, 120) : '', type: 'Timetable Entry',
    };
  });
}
