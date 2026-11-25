import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME, isThemePref, resolveTheme } from './theme';

describe('theme', () => {
  it('defaults to dark', () => {
    expect(DEFAULT_THEME).toBe('dark');
  });
  it('accepts only known preferences', () => {
    expect(isThemePref('light')).toBe(true);
    expect(isThemePref('system')).toBe(true);
    expect(isThemePref('sepia')).toBe(false);
    expect(isThemePref(null)).toBe(false);
  });
  it('resolves system to the device setting and keeps explicit choices', () => {
    expect(resolveTheme('system', true)).toBe('light');
    expect(resolveTheme('system', false)).toBe('dark');
    expect(resolveTheme('light', false)).toBe('light');
    expect(resolveTheme('dark', true)).toBe('dark');
  });
});
