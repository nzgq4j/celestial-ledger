import { describe, expect, it } from 'vitest';
import { PLANS, TRIAL_DAYS } from './billing';

describe('Atlas+ pricing', () => {
  it('is a single yearly plan at USD 6.99 with a 3-day free trial', () => {
    expect(PLANS).toEqual([{ id: 'year', label: 'Yearly', note: '3 days free, then billed annually', price: '$6.99' }]);
    expect(TRIAL_DAYS).toBe(3);
  });
});
