import { describe, expect, it } from 'vitest';
import { displayName } from './account';

describe('account display name', () => {
  it('uses the Google full name', () => {
    expect(displayName({ email: 'a@example.com', user_metadata: { full_name: 'Ada Lovelace', name: 'Ada' } })).toBe('Ada Lovelace');
  });
  it('falls back to name, then the email before the @', () => {
    expect(displayName({ email: 'a@example.com', user_metadata: { name: 'Ada' } })).toBe('Ada');
    expect(displayName({ email: 'stargazer@example.com', user_metadata: {} })).toBe('stargazer');
  });
  it('is empty when signed out', () => {
    expect(displayName(null)).toBeNull();
  });
});
