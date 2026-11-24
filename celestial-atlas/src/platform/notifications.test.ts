import { describe, expect, it } from 'vitest';
import { PERSONAL_DAY } from '../engine/atlas';
import { deliveryTimes, insightFor } from './notifications';

describe('daily insight notifications', () => {
  it('schedules 14 mornings at the chosen time, starting today when the time is still ahead', () => {
    const now = new Date(2026, 10, 24, 7, 30);
    const times = deliveryTimes('08:00', now);
    expect(times).toHaveLength(14);
    expect(times[0]).toEqual(new Date(2026, 10, 24, 8, 0));
    expect(times[13]).toEqual(new Date(2026, 11, 7, 8, 0));
  });

  it('starts tomorrow when today\'s time has passed', () => {
    expect(deliveryTimes('08:00', new Date(2026, 10, 24, 9, 0))[0]).toEqual(new Date(2026, 10, 25, 8, 0));
  });

  it('uses the Personal Day and Moon sign for that morning', () => {
    const n = insightFor({ name: 'Amelia Rose Laurent', date: '1991-07-28' }, new Date(2026, 10, 24, 8, 0));
    expect(n.title).toMatch(/^Personal Day [1-9] · Moon in [A-Z][a-z]+$/);
    expect(Object.values(PERSONAL_DAY)).toContain(n.body);
  });
});
